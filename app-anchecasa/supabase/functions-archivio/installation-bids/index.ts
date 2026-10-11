/**
 * Dynamic bidding installazione.
 * GET  ?request_id=&t=          → vista artigiano
 * GET  ?order_id=&action=offers → top 3 cliente
 * POST { action: submit|accept|open, ... }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { escHtml } from "../_shared/email-brand/brand.ts";
import { detailRow, wrapEmailHtml } from "../_shared/email-brand/wrap-html.ts";
import { openInstallationBidForOrder } from "../_shared/installationBidOpen.ts";
import {
  computeBidFinalPrice,
  selectTopClientOffers,
} from "../_shared/installationBidding.ts";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../_shared/rate-limit.ts";
import { unlockShippingAfterBidAccept } from "../_shared/vendorOrderPaidDispatch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const IP_LIMIT = { maxRequests: 60, windowMs: 15 * 60 * 1000 };

function asText(v: unknown, max = 2000): string {
  return String(v ?? "").trim().slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ipCheck = checkRateLimit(`installation-bids:ip:${getClientIp(req)}`, IP_LIMIT);
    if (!ipCheck.allowed) {
      return rateLimitResponse(ipCheck.retryAfterSec, corsHeaders);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const url = new URL(req.url);

    if (req.method === "GET") {
      const requestId = asText(url.searchParams.get("request_id"), 80);
      const token = asText(url.searchParams.get("t"), 80);
      const orderId = asText(url.searchParams.get("order_id"), 80);
      const action = asText(url.searchParams.get("action"), 40);

      if (orderId && (action === "offers" || !requestId)) {
        return await clientOffers(admin, orderId, req);
      }

      if (!requestId) {
        return new Response(JSON.stringify({ error: "missing_request_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return await artisanBidPage(admin, requestId, token);
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const action = asText(body.action, 40);

    if (action === "open") {
      const orderId = asText(body.order_id, 80);
      if (!orderId) {
        return new Response(JSON.stringify({ error: "missing_order_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const opened = await openInstallationBidForOrder(admin, orderId);
      return new Response(JSON.stringify({ ok: true, ...opened }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "submit") {
      return await submitBid(admin, body);
    }

    if (action === "accept") {
      return await acceptBid(admin, body, req);
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("installation-bids:", err);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function artisanBidPage(
  admin: ReturnType<typeof createClient>,
  requestId: string,
  token: string,
) {
  const { data: request } = await admin
    .from("installation_bid_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let invite: { artisan_id: string; invite_token: string } | null = null;
  if (token) {
    const { data } = await admin
      .from("installation_bid_invites")
      .select("artisan_id,invite_token")
      .eq("request_id", requestId)
      .eq("invite_token", token)
      .maybeSingle();
    invite = data;
  }

  if (!invite && request.public_token !== token) {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let artisanNome: string | null = null;
  if (invite?.artisan_id) {
    const { data: artisan } = await admin
      .from("artigiani")
      .select("ragione_sociale")
      .eq("id", invite.artisan_id)
      .maybeSingle();
    artisanNome = artisan?.ragione_sociale ? String(artisan.ragione_sociale) : null;
  }

  let existingBid = null;
  if (invite?.artisan_id) {
    const { data: bid } = await admin
      .from("installation_bids")
      .select("id,raw_price,available_date,available_time,status")
      .eq("request_id", requestId)
      .eq("artisan_id", invite.artisan_id)
      .maybeSingle();
    existingBid = bid;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      request: {
        id: request.id,
        order_id: request.order_id,
        product_titolo: request.product_titolo,
        product_image_url: request.product_image_url,
        scheda_tecnica_pdf_url: request.scheda_tecnica_pdf_url,
        zona_cap: request.zona_cap,
        zona_comune: request.zona_comune,
        zona_label: request.zona_label,
        categoria_artigiano: request.categoria_artigiano,
        status: request.status,
        closes_at: request.closes_at,
      },
      artisan: invite
        ? {
          id: invite.artisan_id,
          nome: artisanNome,
        }
        : null,
      existing_bid: existingBid,
      can_submit: request.status === "OPEN" && Boolean(invite?.artisan_id),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function submitBid(
  admin: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
) {
  const requestId = asText(body.request_id, 80);
  const token = asText(body.t || body.token, 80);
  const rawPrice = Number(body.raw_price);
  const availableDate = asText(body.available_date, 20);
  const availableTime = asText(body.available_time, 16) || null;
  const note = asText(body.note, 2000) || null;

  if (!requestId || !token || !Number.isFinite(rawPrice) || rawPrice < 0 || !availableDate) {
    return new Response(JSON.stringify({ error: "invalid_payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: invite } = await admin
    .from("installation_bid_invites")
    .select("*")
    .eq("request_id", requestId)
    .eq("invite_token", token)
    .maybeSingle();
  if (!invite) {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: request } = await admin
    .from("installation_bid_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!request || request.status !== "OPEN") {
    return new Response(JSON.stringify({ error: "request_closed" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { margin_applied, final_price } = computeBidFinalPrice(
    rawPrice,
    Number(request.margin_percentage) || 0.2,
    Number(request.margin_fixed) || 0,
  );

  const { data: artisan } = await admin
    .from("artigiani")
    .select("rating_medio")
    .eq("id", invite.artisan_id)
    .maybeSingle();

  const now = new Date().toISOString();
  const { data: bid, error } = await admin
    .from("installation_bids")
    .upsert(
      {
        request_id: requestId,
        order_id: request.order_id,
        artisan_id: invite.artisan_id,
        raw_price: rawPrice,
        margin_applied,
        final_price,
        available_date: availableDate,
        available_time: availableTime,
        status: "PENDING",
        rating_snapshot: artisan?.rating_medio != null ? Number(artisan.rating_medio) : null,
        note,
        updated_at: now,
      },
      { onConflict: "request_id,artisan_id" },
    )
    .select("*")
    .single();

  if (error || !bid) {
    console.error("submitBid:", error?.message);
    return new Response(JSON.stringify({ error: "submit_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente: non esporre raw_price
  return new Response(
    JSON.stringify({
      ok: true,
      bid: {
        id: bid.id,
        available_date: bid.available_date,
        available_time: bid.available_time,
        status: bid.status,
        // conferma all'artigiano del prezzo chiesto (non final al cliente)
        raw_price: bid.raw_price,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function clientOffers(
  admin: ReturnType<typeof createClient>,
  orderId: string,
  req: Request,
) {
  const { data: order } = await admin.from("vendor_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Accesso: owner, access token, o session query già validata lato tracking
  const url = new URL(req.url);
  const accessToken = asText(url.searchParams.get("t"), 80);
  const authHeader = req.headers.get("Authorization") || "";
  let allowed = false;

  if (accessToken && order.client_access_token === accessToken) allowed = true;
  if (authHeader.startsWith("Bearer ")) {
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (anon) {
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, anon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user && order.cliente_user_id === user.id) allowed = true;
      // admin
      if (user) {
        const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
        if (isAdmin) allowed = true;
      }
    }
  }
  // Demo / post-checkout: se payment PAID e stesso order con stripe session match
  const sessionId = asText(url.searchParams.get("session_id"), 200);
  if (!allowed && sessionId && order.stripe_checkout_session_id === sessionId && order.payment_stato === "PAID") {
    allowed = true;
  }

  if (!allowed) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: request } = await admin
    .from("installation_bid_requests")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  const { data: bids } = await admin
    .from("installation_bids")
    .select("id,raw_price,final_price,available_date,available_time,status,rating_snapshot,artisan_id")
    .eq("order_id", orderId);

  const ranked = selectTopClientOffers(
    (bids || []).map((b) => ({
      id: String(b.id),
      raw_price: Number(b.raw_price),
      final_price: Number(b.final_price),
      available_date: String(b.available_date),
      rating_snapshot: b.rating_snapshot != null ? Number(b.rating_snapshot) : null,
      status: String(b.status),
    })),
    3,
  );

  // Arricchisci con artigiano (solo nome pubblico, no raw_price)
  const offers = [];
  for (const r of ranked) {
    const full = (bids || []).find((b) => String(b.id) === r.id);
    let artisanNome: string | null = null;
    let logo: string | null = null;
    if (full?.artisan_id) {
      const { data: a } = await admin
        .from("artigiani")
        .select("ragione_sociale,logo_url")
        .eq("id", full.artisan_id)
        .maybeSingle();
      artisanNome = a?.ragione_sociale ? String(a.ragione_sociale) : null;
      logo = a?.logo_url ? String(a.logo_url) : null;
    }
    offers.push({
      id: r.id,
      slot: r.slot,
      label: r.label,
      final_price: r.final_price,
      available_date: r.available_date,
      available_time: full?.available_time || null,
      rating_snapshot: r.rating_snapshot,
      artisan_nome: artisanNome,
      artisan_logo_url: logo,
      status: r.status,
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      order_id: orderId,
      request: request
        ? { id: request.id, status: request.status, awarded_bid_id: request.awarded_bid_id }
        : null,
      shipping_locked: Boolean(order.shipping_locked),
      offers,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function acceptBid(
  admin: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
  req: Request,
) {
  const bidId = asText(body.bid_id, 80);
  const orderId = asText(body.order_id, 80);
  const accessToken = asText(body.t || body.token, 80);
  const sessionId = asText(body.session_id, 200);

  if (!bidId || !orderId) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: order } = await admin.from("vendor_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let allowed = false;
  if (accessToken && order.client_access_token === accessToken) allowed = true;
  if (sessionId && order.stripe_checkout_session_id === sessionId && order.payment_stato === "PAID") {
    allowed = true;
  }
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (anon) {
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, anon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user && order.cliente_user_id === user.id) allowed = true;
    }
  }
  if (!allowed) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: bid } = await admin
    .from("installation_bids")
    .select("*")
    .eq("id", bidId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (!bid || bid.status !== "PENDING") {
    return new Response(JSON.stringify({ error: "bid_not_available" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = new Date().toISOString();

  await admin
    .from("installation_bids")
    .update({ status: "ACCEPTED", updated_at: now })
    .eq("id", bidId);

  await admin
    .from("installation_bids")
    .update({ status: "REJECTED", updated_at: now })
    .eq("order_id", orderId)
    .neq("id", bidId)
    .eq("status", "PENDING");

  await admin
    .from("installation_bid_requests")
    .update({
      status: "AWARDED",
      awarded_bid_id: bidId,
      awarded_at: now,
      updated_at: now,
    })
    .eq("id", bid.request_id);

  // Sync assignment + amount_service = final_price accettato
  await admin
    .from("vendor_orders")
    .update({
      selected_installation_bid_id: bidId,
      amount_service: bid.final_price,
      amount_total: Number(order.amount_product || 0) + Number(bid.final_price),
      artisan_appointment_date: bid.available_date,
      artisan_appointment_slot: bid.available_time
        ? String(bid.available_time).slice(0, 5)
        : "09:00–13:00",
      updated_at: now,
    })
    .eq("id", orderId);

  const { data: artisan } = await admin
    .from("artigiani")
    .select("id,email,ragione_sociale,telefono,logo_url,settore_artigianale")
    .eq("id", bid.artisan_id)
    .maybeSingle();

  await admin.from("artisan_assignments").upsert(
    {
      order_id: orderId,
      artisan_id: bid.artisan_id,
      artisan_email: artisan?.email || null,
      artisan_nome: artisan?.ragione_sociale || null,
      artisan_telefono: artisan?.telefono || null,
      artisan_qualifica: artisan?.settore_artigianale || null,
      artisan_logo_url: artisan?.logo_url || null,
      stato: "DATE_CONFIRMED",
      amount_service: bid.final_price,
      appointment_date: bid.available_date,
      appointment_slot: bid.available_time ? String(bid.available_time).slice(0, 5) : "09:00–13:00",
      notified_at: now,
      plannable_at: now,
      updated_at: now,
    },
    { onConflict: "order_id" },
  );

  // Unlock spedizione magazzino
  const unlock = await unlockShippingAfterBidAccept(
    admin,
    orderId,
    String(bid.available_date),
  );

  // Notifica artigiano vincente
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (RESEND_API_KEY && artisan?.email) {
    const appUrl = (Deno.env.get("APP_URL") || "https://app.anchecasa.it").replace(/\/$/, "");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>",
        to: [artisan.email],
        subject: `[AncheCasa] Offerta accettata · ${order.product_titolo}`,
        html: wrapEmailHtml({
          eyebrow: "Intervento confermato",
          title: "Il cliente ha scelto la tua offerta",
          bodyHtml: [
            `<p>Ciao <strong>${escHtml(artisan.ragione_sociale || "Artigiano")}</strong>,</p>`,
            `<p>Data lavoro confermata. Il magazzino è stato sbloccato per spedire prima del montaggio.</p>`,
            detailRow("Prodotto", String(order.product_titolo || "")),
            detailRow("Data", String(bid.available_date)),
            detailRow("Tuo compenso (mano d'opera)", `€ ${Number(bid.raw_price).toFixed(2)}`),
          ].join(""),
          cta: {
            label: "Apri tracking ordine",
            href: `${appUrl}/ordine/${orderId}`,
          },
        }),
      }),
    }).catch(() => null);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      accepted_bid_id: bidId,
      shipping_unlocked: !unlock.error,
      magic_url: unlock.magic_url || null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
