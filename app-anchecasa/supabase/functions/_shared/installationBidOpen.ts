/**
 * Apre asta installazione: request + invite artigiani zona + email.
 * Tiene shipping_locked finché non c'è ACCEPTED.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { escHtml } from "./email-brand/brand.ts";
import { detailRow, wrapEmailHtml } from "./email-brand/wrap-html.ts";
import { randomToken } from "./installationBidding.ts";

function asText(v: unknown, max = 400): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function openInstallationBidForOrder(
  admin: SupabaseClient,
  orderId: string,
  opts?: { marginPercentage?: number; marginFixed?: number },
): Promise<{ requestId: string; invited: number } | null> {
  const { data: order } = await admin.from("vendor_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || String(order.option_type) !== "install") return null;

  const { data: existing } = await admin
    .from("installation_bid_requests")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing?.id) {
    return { requestId: String(existing.id), invited: 0 };
  }

  let productImage: string | null = null;
  let schedaPdf: string | null = null;
  if (order.product_id) {
    const { data: prod } = await admin
      .from("vendor_products")
      .select("image_url,scheda_tecnica_pdf_url,titolo")
      .eq("id", order.product_id)
      .maybeSingle();
    productImage = prod?.image_url ? String(prod.image_url) : null;
    schedaPdf = prod?.scheda_tecnica_pdf_url ? String(prod.scheda_tecnica_pdf_url) : null;
  }

  const publicToken = randomToken();
  const marginPct = opts?.marginPercentage ?? Number(Deno.env.get("INSTALL_BID_MARGIN_PCT") || 0.2);
  const marginFixed = opts?.marginFixed ?? Number(Deno.env.get("INSTALL_BID_MARGIN_FIXED") || 0);
  const now = new Date().toISOString();
  const closes = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const { data: req, error } = await admin
    .from("installation_bid_requests")
    .insert({
      order_id: orderId,
      product_id: order.product_id,
      product_titolo: order.product_titolo,
      product_image_url: productImage,
      scheda_tecnica_pdf_url: schedaPdf,
      zona_cap: order.destinazione_cap,
      zona_comune: order.destinazione_citta,
      zona_label: order.zona_label || order.destinazione_label,
      categoria_artigiano: order.artisan_categoria,
      status: "OPEN",
      margin_percentage: marginPct,
      margin_fixed: marginFixed,
      public_token: publicToken,
      closes_at: closes,
    })
    .select("id")
    .single();

  if (error || !req) {
    console.error("openInstallationBidForOrder:", error?.message);
    return null;
  }

  await admin
    .from("vendor_orders")
    .update({
      shipping_locked: true,
      installation_bid_request_id: req.id,
      updated_at: now,
    })
    .eq("id", orderId);

  const cap = asText(order.destinazione_cap, 16);
  const comune = asText(order.destinazione_citta, 120);
  let artisansQuery = admin
    .from("artigiani")
    .select("id,email,ragione_sociale,cap,citta,telefono,rating_medio,settore_artigianale")
    .limit(40);

  if (cap) {
    artisansQuery = artisansQuery.eq("cap", cap);
  } else if (comune) {
    artisansQuery = artisansQuery.ilike("citta", `%${comune}%`);
  }

  const { data: artisans } = await artisansQuery;
  let rows = Array.isArray(artisans) ? artisans : [];

  // Fallback: stessi artigiani senza filtro stretto (max 12)
  if (!rows.length && (cap || comune)) {
    const { data: anyA } = await admin
      .from("artigiani")
      .select("id,email,ragione_sociale,cap,citta,telefono,rating_medio,settore_artigianale")
      .limit(12);
    rows = Array.isArray(anyA) ? anyA : [];
  }

  const cat = asText(order.artisan_categoria, 80).toLowerCase();
  if (cat && rows.length) {
    const filtered = rows.filter((a) =>
      String(a.settore_artigianale || "").toLowerCase().includes(cat.split(/\s+/)[0] || cat)
    );
    if (filtered.length) rows = filtered;
  }

  const appUrl = (Deno.env.get("APP_URL") || "https://app.anchecasa.it").replace(/\/$/, "");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  let invited = 0;

  for (const artisan of rows.slice(0, 25)) {
    const inviteToken = randomToken();
    const { error: invErr } = await admin.from("installation_bid_invites").upsert(
      {
        request_id: req.id,
        artisan_id: artisan.id,
        invite_token: inviteToken,
        notified_at: null,
      },
      { onConflict: "request_id,artisan_id" },
    );
    if (invErr) {
      console.error("bid invite upsert:", invErr.message);
      continue;
    }

    const bidUrl = `${appUrl}/artisan/bid/${req.id}?t=${inviteToken}`;
    const email = artisan.email ? String(artisan.email) : null;
    if (RESEND_API_KEY && email) {
      const html = wrapEmailHtml({
        eyebrow: "Asta installazione",
        title: "Nuova richiesta di montaggio nella tua zona",
        bodyHtml: [
          `<p>Ciao <strong>${escHtml(artisan.ragione_sociale || "Artigiano")}</strong>,</p>`,
          `<p>Un cliente ha richiesto il montaggio. Invia la tua offerta (mano d'opera + data).</p>`,
          detailRow("Prodotto", String(order.product_titolo || "")),
          detailRow("Zona", [order.destinazione_cap, order.destinazione_citta, order.zona_label].filter(Boolean).join(" · ") || "—"),
          detailRow("Categoria", String(order.artisan_categoria || "Artigiano")),
        ].join(""),
        cta: { label: "Apri e invia offerta", href: bidUrl },
      });
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>",
          to: [email],
          subject: `[AncheCasa] Offerta montaggio · ${order.product_titolo}`,
          html,
        }),
      });
      if (res.ok) {
        await admin
          .from("installation_bid_invites")
          .update({ notified_at: now })
          .eq("request_id", req.id)
          .eq("artisan_id", artisan.id);
        invited += 1;
      }
    } else {
      invited += 1;
    }
  }

  return { requestId: String(req.id), invited };
}
