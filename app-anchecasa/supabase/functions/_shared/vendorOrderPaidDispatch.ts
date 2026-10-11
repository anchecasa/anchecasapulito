/**
 * Post-pagamento (PAID): DDT PDF + Magic Link Fornitore + scheda artisan_assignments.
 * Pianificazione artigiano: notifica solo se shipping già SPEDITO/IN_CONSEGNA.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { escHtml } from "./email-brand/brand.ts";
import { detailRow, wrapEmailHtml } from "./email-brand/wrap-html.ts";
import { openInstallationBidForOrder } from "./installationBidOpen.ts";
import { shippingDeadlineBeforeInstall } from "./installationBidding.ts";
import {
  canNotifyArtisanPlanning,
  generateOrderOtp,
  hashOtp,
} from "./vendorEscrowSplit.ts";
import { buildVendorOrderDdtPdf, bytesToBase64 } from "./vendorOrderDdtPdf.ts";

function asText(v: unknown, max = 2000): string {
  return String(v ?? "").trim().slice(0, max);
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function plusBusinessDaysFrom(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    let left = days;
    while (left > 0) {
      now.setDate(now.getDate() + 1);
      const wd = now.getDay();
      if (wd !== 0 && wd !== 6) left--;
    }
    return now.toISOString().slice(0, 10);
  }
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

type OrderRow = Record<string, unknown>;

type ArtisanHit = {
  id: string;
  email: string | null;
  telefono: string | null;
  ragione_sociale: string | null;
  logo_url: string | null;
  settore_artigianale: string | null;
};

async function findArtisanByCap(
  admin: SupabaseClient,
  cap: string,
  categoria: string | null,
): Promise<ArtisanHit | null> {
  const capTrim = asText(cap, 16);
  if (!capTrim) return null;

  const { data } = await admin
    .from("artigiani")
    .select("id,email,telefono,ragione_sociale,cap,settore_artigianale,verificato_admin,logo_url")
    .eq("cap", capTrim)
    .order("verificato_admin", { ascending: false })
    .limit(8);

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return null;

  const mapHit = (r: Record<string, unknown>): ArtisanHit => ({
    id: String(r.id),
    email: r.email ? String(r.email) : null,
    telefono: r.telefono ? String(r.telefono) : null,
    ragione_sociale: r.ragione_sociale ? String(r.ragione_sociale) : null,
    logo_url: r.logo_url ? String(r.logo_url) : null,
    settore_artigianale: r.settore_artigianale ? String(r.settore_artigianale) : null,
  });

  const cat = asText(categoria, 80).toLowerCase();
  if (cat) {
    const match = rows.find((r) =>
      String(r.settore_artigianale || "").toLowerCase().includes(cat.split(/\s+/)[0] || cat)
    );
    if (match) return mapHit(match as Record<string, unknown>);
  }
  return mapHit(rows[0] as Record<string, unknown>);
}

/** Genera OTP cliente (4–6) una sola volta; usato in tracking /ordine. */
export async function ensureClientServiceOtp(
  admin: SupabaseClient,
  orderId: string,
  digits = 4,
): Promise<string | null> {
  const { data: existing } = await admin
    .from("order_service_otp")
    .select("otp_code")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing?.otp_code) return String(existing.otp_code);

  const otp = generateOrderOtp(digits);
  const otpHash = await hashOtp(otp);
  const now = new Date().toISOString();
  const { error } = await admin.from("order_service_otp").upsert(
    {
      order_id: orderId,
      otp_code: otp,
      otp_hash: otpHash,
      digits: Math.min(6, Math.max(4, digits)),
      updated_at: now,
    },
    { onConflict: "order_id" },
  );
  if (error) {
    console.error("ensureClientServiceOtp:", error.message);
    return null;
  }
  await admin
    .from("artisan_assignments")
    .update({ otp_hash: otpHash, updated_at: now })
    .eq("order_id", orderId);
  return otp;
}

async function ensureDdt(
  admin: SupabaseClient,
  order: OrderRow,
): Promise<{ url: string | null; path: string | null; bytes: Uint8Array | null }> {
  if (order.ddt_pdf_url && order.ddt_pdf_path) {
    return {
      url: String(order.ddt_pdf_url),
      path: String(order.ddt_pdf_path),
      bytes: null,
    };
  }

  const companyId = String(order.company_profile_id);
  const orderId = String(order.id);
  try {
    const bytes = await buildVendorOrderDdtPdf({
      orderId,
      createdAt: String(order.created_at || new Date().toISOString()),
      vendorNome: String(order.ship_from_ragione_sociale || "Vendor"),
      shipFromIndirizzo: String(order.ship_from_indirizzo || ""),
      shipFromCitta: String(order.ship_from_citta || ""),
      shipFromCap: String(order.ship_from_cap || ""),
      productTitolo: String(order.product_titolo || ""),
      productSku: order.product_sku ? String(order.product_sku) : null,
      qty: Number(order.qty) || 1,
      optionType: String(order.option_type || "product"),
      destinazioneTipo: String(order.destinazione_tipo || "cliente"),
      destinazioneIndirizzo: String(order.destinazione_indirizzo || ""),
      destinazioneCitta: String(order.destinazione_citta || ""),
      destinazioneCap: String(order.destinazione_cap || ""),
      destinazioneLabel: String(order.destinazione_label || order.zona_label || ""),
      clienteNome: order.cliente_nome ? String(order.cliente_nome) : null,
      clienteTelefono: order.cliente_telefono ? String(order.cliente_telefono) : null,
      artisanCategoria: order.artisan_categoria ? String(order.artisan_categoria) : null,
      artisanDataIndicativa: order.artisan_data_indicativa
        ? String(order.artisan_data_indicativa)
        : null,
      note: order.cliente_note ? String(order.cliente_note) : null,
    });
    const path = `${companyId}/${orderId}/ddt.pdf`;
    const { error: upErr } = await admin.storage
      .from("vendor-order-docs")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) {
      console.error("paid-dispatch ddt upload:", upErr.message);
      return { url: null, path: null, bytes };
    }
    const { data: signed } = await admin.storage
      .from("vendor-order-docs")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    const url = signed?.signedUrl || null;
    await admin
      .from("vendor_orders")
      .update({
        ddt_pdf_path: path,
        ddt_pdf_url: url,
        ddt_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    return { url, path, bytes };
  } catch (e) {
    console.error("paid-dispatch ddt:", e);
    return { url: null, path: null, bytes: null };
  }
}

export async function upsertArtisanAssignment(
  admin: SupabaseClient,
  order: OrderRow,
  notifyNow: boolean,
): Promise<void> {
  if (String(order.option_type) !== "install") return;
  if (Number(order.amount_service || 0) <= 0 && String(order.option_type) !== "install") return;

  const orderId = String(order.id);
  const cap = asText(order.destinazione_cap, 16);
  const zona = asText(order.zona_label || order.destinazione_label, 400);
  const categoria = asText(order.artisan_categoria, 120) || "Artigiano";
  const artisan = await findArtisanByCap(admin, cap, categoria);
  const completionToken = randomToken();
  const now = new Date().toISOString();
  const appointmentDate =
    asText(order.artisan_appointment_date || order.artisan_data_indicativa, 20) || null;
  const appointmentSlot = asText(order.artisan_appointment_slot, 80) || "09:00–13:00";

  await admin.from("artisan_assignments").upsert(
    {
      order_id: orderId,
      artisan_id: artisan?.id || null,
      artisan_email: artisan?.email || null,
      artisan_nome: artisan?.ragione_sociale || null,
      artisan_telefono: artisan?.telefono || null,
      artisan_qualifica: artisan?.settore_artigianale || categoria,
      artisan_logo_url: artisan?.logo_url || null,
      categoria,
      zona_cap: cap || null,
      zona_label: zona || null,
      stato: notifyNow ? (appointmentDate ? "DATE_CONFIRMED" : "PLANNABLE") : "ASSIGNED",
      amount_service: Number(order.amount_service) || 0,
      notify_after_shipping: true,
      notified_at: notifyNow ? now : null,
      plannable_at: notifyNow ? now : null,
      appointment_date: appointmentDate,
      appointment_slot: appointmentSlot,
      completion_token: completionToken,
      updated_at: now,
    },
    { onConflict: "order_id" },
  );

  await ensureClientServiceOtp(admin, orderId, 4);

  if (appointmentDate) {
    await admin
      .from("vendor_orders")
      .update({
        artisan_appointment_date: appointmentDate,
        artisan_appointment_slot: appointmentSlot,
        updated_at: now,
      })
      .eq("id", orderId);
  }

  // Keep legacy engagement in sync
  await admin.from("vendor_artisan_engagements").upsert(
    {
      order_id: orderId,
      company_profile_id: String(order.company_profile_id),
      stato: notifyNow ? "PLANNABLE" : "WAIT_SHIPMENT",
      categoria_artigiano: categoria,
      zona_label: zona || null,
      data_indicativa: order.artisan_data_indicativa || null,
      planned_at: notifyNow ? now : null,
      updated_at: now,
    },
    { onConflict: "order_id" },
  );

  await admin
    .from("vendor_orders")
    .update({
      artisan_engagement_stato: notifyNow ? "PLANNABLE" : "WAIT_SHIPMENT",
      updated_at: now,
    })
    .eq("id", orderId);

  if (!notifyNow) return;

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const appUrl = (Deno.env.get("APP_URL") || "https://app.anchecasa.it").replace(/\/$/, "");
  const to = artisan?.email;
  if (!RESEND_API_KEY || !to) return;

  const otpUrl = `${appUrl}/vendor/orders/complete/${completionToken}`;
  const html = wrapEmailHtml({
    eyebrow: "Intervento Artigiano",
    title: "Prodotto in arrivo — puoi pianificare l'intervento",
    bodyHtml: [
      `<p>Ciao <strong>${escHtml(artisan?.ragione_sociale || "Artigiano")}</strong>,</p>`,
      `<p>Il prodotto per l'installazione è <strong>spedito / in consegna</strong>. Puoi pianificare l'intervento in zona.</p>`,
      detailRow("Prodotto", String(order.product_titolo || "")),
      detailRow("Zona", [zona, cap].filter(Boolean).join(" · ") || "—"),
      appointmentDate
        ? detailRow("Appuntamento", `${appointmentDate} · ${appointmentSlot}`)
        : "",
      detailRow("Quota servizio (escrow)", `€ ${Number(order.amount_service || 0).toFixed(2)}`),
      detailRow("Cliente", String(order.cliente_nome || "—")),
    ].filter(Boolean).join(""),
    cta: { label: "Apri scheda intervento / OTP", href: otpUrl },
  });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>",
      to: [to],
      subject: `[AncheCasa] Intervento pianificabile · ${order.product_titolo}`,
      html,
    }),
  }).catch(() => null);
}

/** Notifica artigiano quando shipping diventa SPEDITO/IN_CONSEGNA. */
export async function notifyArtisanAfterShipping(
  admin: SupabaseClient,
  orderId: string,
): Promise<void> {
  const { data: order } = await admin.from("vendor_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || String(order.option_type) !== "install") return;
  if (!canNotifyArtisanPlanning(String(order.shipping_stato || ""))) return;

  const { data: assignment } = await admin
    .from("artisan_assignments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!assignment) {
    await upsertArtisanAssignment(admin, order as OrderRow, true);
    return;
  }

  if (assignment.stato === "COMPLETED") return;

  const now = new Date().toISOString();
  let completionToken = assignment.completion_token as string | null;
  if (!completionToken) {
    completionToken = randomToken();
  }

  // Sync montaggio = consegna stimata + 1 gg lavorativo (o data già presente)
  const shipDay = new Date().toISOString().slice(0, 10);
  const appointmentDate =
    asText(assignment.appointment_date || order.artisan_appointment_date || order.artisan_data_indicativa, 20) ||
    plusBusinessDaysFrom(shipDay, 1);
  const appointmentSlot =
    asText(assignment.appointment_slot || order.artisan_appointment_slot, 80) || "09:00–13:00";

  await admin
    .from("artisan_assignments")
    .update({
      stato: "DATE_CONFIRMED",
      notified_at: assignment.notified_at || now,
      plannable_at: now,
      appointment_date: appointmentDate,
      appointment_slot: appointmentSlot,
      completion_token: completionToken,
      updated_at: now,
    })
    .eq("id", assignment.id);

  await admin
    .from("vendor_artisan_engagements")
    .update({
      stato: "PLANNABLE",
      planned_at: now,
      data_indicativa: appointmentDate,
      updated_at: now,
      note: `Sblocco automatico: prodotto ${order.shipping_stato} · appuntamento ${appointmentDate}`,
    })
    .eq("order_id", orderId);

  await admin
    .from("vendor_orders")
    .update({
      artisan_engagement_stato: "PLANNABLE",
      artisan_planned_at: now,
      artisan_appointment_date: appointmentDate,
      artisan_appointment_slot: appointmentSlot,
      artisan_data_indicativa: appointmentDate,
      updated_at: now,
    })
    .eq("id", orderId);

  await ensureClientServiceOtp(admin, orderId, 4);

  if (assignment.notified_at) return;

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const appUrl = (Deno.env.get("APP_URL") || "https://app.anchecasa.it").replace(/\/$/, "");
  const to = assignment.artisan_email as string | null;
  if (!RESEND_API_KEY || !to) return;

  const otpUrl = `${appUrl}/vendor/orders/complete/${completionToken}`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>",
      to: [to],
      subject: `[AncheCasa] Pianifica intervento · ${order.product_titolo}`,
      html: wrapEmailHtml({
        eyebrow: "Intervento Artigiano",
        title: "Prodotto spedito — data intervento confermata",
        bodyHtml: [
          `<p>Il materiale è in viaggio. Data/fascia allineate alla consegna del pacco.</p>`,
          detailRow("Prodotto", String(order.product_titolo || "")),
          detailRow("Zona", String(assignment.zona_label || order.zona_label || "—")),
          detailRow("Appuntamento", `${appointmentDate} · ${appointmentSlot}`),
          detailRow("Escrow servizio", `€ ${Number(assignment.amount_service || order.amount_service || 0).toFixed(2)}`),
        ].join(""),
        cta: { label: "Scheda intervento / OTP", href: otpUrl },
      }),
    }),
  }).catch(() => null);
}

export async function dispatchVendorOrderPaid(
  admin: SupabaseClient,
  orderId: string,
  opts?: { forceUnlock?: boolean; shipByDate?: string | null },
): Promise<{ ok: boolean; magic_url?: string; error?: string; held?: boolean }> {
  let { data: order, error } = await admin
    .from("vendor_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return { ok: false, error: "order_not_found" };
  if (order.dispatch_notified_at && !opts?.forceUnlock) {
    return {
      ok: true,
      magic_url: `${(Deno.env.get("APP_URL") || "https://app.anchecasa.it").replace(/\/$/, "")}/vendor/orders/confirm/${order.magic_token}`,
    };
  }

  // Install: apri asta e tieni spedizione in hold
  if (String(order.option_type) === "install" && !opts?.forceUnlock) {
    await openInstallationBidForOrder(admin, orderId);
    const refreshed = await admin.from("vendor_orders").select("*").eq("id", orderId).maybeSingle();
    if (refreshed.data) order = refreshed.data;
  }

  const { data: company } = await admin
    .from("company_profiles")
    .select(
      "id,email,vendor_ragione_sociale,nome_azienda,vendor_webhook_url",
    )
    .eq("id", order.company_profile_id)
    .maybeSingle();

  const ddt = await ensureDdt(admin, order as OrderRow);
  const appUrl = (Deno.env.get("APP_URL") || "https://app.anchecasa.it").replace(/\/$/, "");
  const siteUrl = (Deno.env.get("SITE_URL") || "https://anchecasa.it").replace(/\/$/, "");
  const magicUrl = `${appUrl}/vendor/orders/confirm/${order.magic_token}`;
  const magicUrlSite = `${siteUrl}/vendor/orders/confirm/${order.magic_token}`;
  const vendorNome =
    company?.vendor_ragione_sociale ||
    company?.nome_azienda ||
    String(order.ship_from_ragione_sociale || "Vendor");

  // Artisan sheet at PAID (WAIT) — notify later on shipping
  if (String(order.option_type) === "install") {
    await upsertArtisanAssignment(admin, order as OrderRow, false);
  }

  // Hold: asta aperta → non notificare ancora il magazzino
  if (order.shipping_locked && !opts?.forceUnlock) {
    return { ok: true, magic_url: magicUrl, held: true };
  }

  const shipBy = opts?.shipByDate
    ? shippingDeadlineBeforeInstall(opts.shipByDate)
    : null;

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const vendorEmail = company?.email;
  if (RESEND_API_KEY && vendorEmail) {
    const html = wrapEmailHtml({
      eyebrow: "Pagamento ricevuto · Drop-shipping",
      title: opts?.forceUnlock
        ? "Spedizione sbloccata — montaggio assegnato"
        : "Ordine PAID — Conferma Preparazione e Spedizione",
      bodyHtml: [
        `<p>Ciao <strong>${escHtml(vendorNome)}</strong>,</p>`,
        opts?.forceUnlock
          ? `<p>Il cliente ha scelto l'artigiano. <strong>Spedisci il materiale</strong> in tempo per il montaggio${shipBy ? ` (consegna consigliata entro <strong>${shipBy}</strong>)` : ""}.</p>`
          : `<p>Il cliente ha pagato. Genera l'imballo dal DDT e conferma preparazione / tracking.</p>`,
        detailRow("Prodotto", `${order.product_titolo}${order.product_sku ? ` · SKU ${order.product_sku}` : ""} × ${order.qty}`),
        detailRow("Quota prodotto", `€ ${Number(order.amount_product || 0).toFixed(2)}`),
        Number(order.amount_service) > 0
          ? detailRow("Quota servizio (escrow artigiano)", `€ ${Number(order.amount_service).toFixed(2)}`)
          : "",
        shipBy ? detailRow("Consegna entro", shipBy) : "",
        detailRow(
          "Destinazione",
          [order.destinazione_indirizzo, order.destinazione_cap, order.destinazione_citta]
            .filter(Boolean)
            .join(" · ") || String(order.destinazione_label || order.zona_label || "—"),
        ),
      ].filter(Boolean).join(""),
      cta: { label: "Apri Magic Link ordine", href: magicUrl },
    });

    const emailBody: Record<string, unknown> = {
      from: Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>",
      to: [vendorEmail],
      subject: `[AncheCasa] PAID — Preparazione & spedizione · ${order.product_titolo}`,
      html,
    };
    if (ddt.bytes) {
      emailBody.attachments = [
        {
          filename: `DDT-${String(order.id).slice(0, 8)}.pdf`,
          content: bytesToBase64(ddt.bytes),
        },
      ];
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });
    if (!res.ok) console.error("paid-dispatch resend:", await res.text());
  }

  const webhook = asText(company?.vendor_webhook_url, 800);
  if (webhook && /^https?:\/\//i.test(webhook)) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "vendor.order.paid",
          order_id: order.id,
          payment_stato: "PAID",
          amount_product: order.amount_product,
          amount_service: order.amount_service,
          magic_url: magicUrl,
          magic_url_alt: magicUrlSite,
          ddt_pdf_url: ddt.url,
          cta: "Conferma Preparazione / Tracking",
        }),
      });
    } catch (e) {
      console.error("paid-dispatch webhook:", e);
    }
  }

  const now = new Date().toISOString();
  await admin
    .from("vendor_orders")
    .update({
      dispatch_notified_at: now,
      notified_at: now,
      webhook_notified_at: webhook ? now : order.webhook_notified_at,
      updated_at: now,
    })
    .eq("id", orderId);

  return { ok: true, magic_url: magicUrl };
}

/** Dopo accettazione offerta: unlock spedizione magazzino + notifica vendor. */
export async function unlockShippingAfterBidAccept(
  admin: SupabaseClient,
  orderId: string,
  availableDate: string,
): Promise<{ ok: boolean; magic_url?: string; error?: string }> {
  const now = new Date().toISOString();
  const shipBy = shippingDeadlineBeforeInstall(availableDate);
  await admin
    .from("vendor_orders")
    .update({
      shipping_locked: false,
      shipping_unlocked_at: now,
      artisan_appointment_date: availableDate,
      artisan_data_indicativa: availableDate,
      dispatch_notified_at: null,
      updated_at: now,
    })
    .eq("id", orderId);

  return dispatchVendorOrderPaid(admin, orderId, {
    forceUnlock: true,
    shipByDate: availableDate,
  });
}

export async function markOrdersPaidFromStripeSession(
  admin: SupabaseClient,
  opts: {
    stripeSessionId: string;
    paymentIntentId?: string | null;
    checkoutGroupId?: string | null;
  },
): Promise<string[]> {
  const now = new Date().toISOString();
  let q = admin.from("vendor_orders").select("id").eq("payment_stato", "UNPAID");
  if (opts.checkoutGroupId) {
    q = q.eq("checkout_group_id", opts.checkoutGroupId);
  } else {
    q = q.eq("stripe_checkout_session_id", opts.stripeSessionId);
  }
  const { data: unpaid } = await q;
  const ids = (unpaid || []).map((r) => String(r.id));

  if (ids.length) {
    const { data: rows } = await admin
      .from("vendor_orders")
      .select("id,amount_service")
      .in("id", ids);
    for (const row of rows || []) {
      const svc = Number(row.amount_service || 0);
      await admin
        .from("vendor_orders")
        .update({
          stato: "PAID",
          payment_stato: "PAID",
          escrow_service_stato: svc > 0 ? "HELD" : "NONE",
          stripe_payment_intent_id: opts.paymentIntentId || null,
          paid_at: now,
          updated_at: now,
        })
        .eq("id", String(row.id));
    }
  }

  await admin
    .from("vendor_checkout_sessions")
    .update({
      status: "PAID",
      stripe_payment_intent_id: opts.paymentIntentId || null,
      paid_at: now,
      updated_at: now,
    })
    .eq("stripe_checkout_session_id", opts.stripeSessionId);

  for (const id of ids) {
    await dispatchVendorOrderPaid(admin, id);
  }

  return ids;
}
