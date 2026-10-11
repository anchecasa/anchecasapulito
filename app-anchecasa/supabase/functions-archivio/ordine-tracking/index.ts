/**
 * Tracking ordine cliente: GET/POST /ordine-tracking?order_id=
 * Accesso: JWT owner | Stripe session_id | client_access_token
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../_shared/rate-limit.ts";
import { retrieveStripeCheckoutSession } from "../_shared/stripeCheckout.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const IP_LIMIT = { maxRequests: 60, windowMs: 15 * 60 * 1000 };

function asText(v: unknown, max = 2000): string {
  return String(v ?? "").trim().slice(0, max);
}

function carrierTrackingUrl(trackingCode: string | null, carrier?: string | null): string | null {
  const code = asText(trackingCode, 120);
  if (!code) return null;
  const c = asText(carrier, 80).toLowerCase();
  const upper = code.toUpperCase();
  if (c.includes("brt") || upper.startsWith("BRT")) {
    return `https://vas.brt.it/vas/sped_det_show.hsm?ChiaveSpe=${encodeURIComponent(code)}`;
  }
  if (c.includes("gls") || upper.startsWith("GLS")) {
    return `https://gls-group.com/IT/it/servizi-online/ricerca-spedizioni.html?match=${encodeURIComponent(code)}`;
  }
  if (c.includes("sda") || c.includes("poste")) {
    return `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(code)}`;
  }
  if (c.includes("dhl")) {
    return `https://www.dhl.com/it-it/home/tracking.html?tracking-id=${encodeURIComponent(code)}`;
  }
  if (c.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${encodeURIComponent(code)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`tracking ${code}`)}`;
}

function whatsappMeUrl(phone: string | null, text?: string): string | null {
  const digits = asText(phone, 40).replace(/\D/g, "");
  if (digits.length < 8) return null;
  const withCountry = digits.startsWith("39") ? digits : `39${digits}`;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${withCountry}${q}`;
}

function shippingStep(order: Record<string, unknown>): string {
  const ship = String(order.shipping_stato || "").toUpperCase();
  const stato = String(order.stato || "").toUpperCase();
  if (order.delivered_at || ship === "CONSEGNATO" || stato === "CONSEGNATO" || stato === "COMPLETED") {
    return "consegnato";
  }
  if (ship === "SPEDITO" || ship === "IN_CONSEGNA" || ship === "SHIPPED" || stato === "SPEDITO" || stato === "IN_CONSEGNA") {
    return "transito";
  }
  if (order.preparation_confirmed_at || stato === "PREPARING" || stato === "ACCEPTED") {
    return "preparato";
  }
  return "elaborazione";
}

function artisanStep(
  optionType: string,
  assignment: Record<string, unknown> | null,
): string | null {
  if (optionType !== "install") return null;
  if (!assignment) return "assegnato";
  const s = String(assignment.stato || "").toUpperCase();
  if (assignment.otp_verified_at || s === "COMPLETED") return "completato";
  if (s === "IN_ARRIVAL" || s === "IN_PROGRESS" || s === "AWAITING_OTP") return "in_arrivo";
  if (s === "DATE_CONFIRMED" || s === "SCHEDULED" || assignment.appointment_date) return "data_confermata";
  return "assegnato";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ipCheck = checkRateLimit(`ordine-tracking:ip:${getClientIp(req)}`, IP_LIMIT);
    if (!ipCheck.allowed) {
      return rateLimitResponse(ipCheck.retryAfterSec, corsHeaders);
    }

    const url = new URL(req.url);
    let orderId = asText(url.searchParams.get("order_id"), 80);
    let sessionId = asText(url.searchParams.get("session_id"), 200);
    let accessToken = asText(url.searchParams.get("t") || url.searchParams.get("token"), 80);

    if (req.method === "POST") {
      const body = (await req.json()) as Record<string, unknown>;
      orderId = orderId || asText(body.order_id, 80);
      sessionId = sessionId || asText(body.session_id, 200);
      accessToken = accessToken || asText(body.t || body.token, 80);
    }

    if (!orderId) {
      return new Response(JSON.stringify({ error: "missing_order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: order, error } = await admin
      .from("vendor_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let allowed = false;

    // 1) Auth owner
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ") && anonKey) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
      } = await userClient.auth.getUser();
      if (user && order.cliente_user_id && user.id === order.cliente_user_id) {
        allowed = true;
      }
    }

    // 2) client_access_token
    if (
      !allowed &&
      accessToken &&
      order.client_access_token &&
      accessToken === order.client_access_token &&
      (!order.client_access_expires_at ||
        new Date(String(order.client_access_expires_at)).getTime() > Date.now())
    ) {
      allowed = true;
    }

    // 3) Stripe checkout session (post-redirect)
    if (!allowed && sessionId && order.stripe_checkout_session_id) {
      if (sessionId === order.stripe_checkout_session_id) {
        try {
          const stripeSession = await retrieveStripeCheckoutSession(sessionId);
          const paid =
            stripeSession &&
            (String(stripeSession.payment_status || "") === "paid" ||
              String(stripeSession.status || "") === "complete");
          if (paid) allowed = true;
        } catch {
          // if Stripe secret missing, trust matching session id on PAID order
          if (String(order.payment_stato) === "PAID") allowed = true;
        }
      }
    }

    // Ordine ancora UNPAID: consenti solo con session match stretto dopo redirect
    if (!allowed && String(order.payment_stato) === "UNPAID" && sessionId) {
      return new Response(
        JSON.stringify({ error: "payment_pending", message: "Pagamento in elaborazione…" }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!allowed) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: assignment } = await admin
      .from("artisan_assignments")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    let unlockOtp: string | null = null;
    if (String(order.option_type) === "install") {
      const { data: otpRow } = await admin
        .from("order_service_otp")
        .select("otp_code")
        .eq("order_id", orderId)
        .maybeSingle();
      unlockOtp = otpRow?.otp_code ? String(otpRow.otp_code) : null;
    }

    const trackingCode = order.tracking_code ? String(order.tracking_code) : null;
    const trackingUrl =
      (order.tracking_url ? String(order.tracking_url) : null) ||
      carrierTrackingUrl(trackingCode, order.tracking_carrier ? String(order.tracking_carrier) : null);

    const artisanPhone = assignment?.artisan_telefono ? String(assignment.artisan_telefono) : null;
    const wa = whatsappMeUrl(
      artisanPhone,
      `Ciao, ti contatto per l'ordine ${String(order.product_titolo || "").slice(0, 80)}`,
    );

    return new Response(
      JSON.stringify({
        ok: true,
        order: {
          id: order.id,
          product_titolo: order.product_titolo,
          product_sku: order.product_sku,
          option_type: order.option_type,
          qty: order.qty,
          stato: order.stato,
          payment_stato: order.payment_stato,
          shipping_stato: order.shipping_stato,
          preparation_confirmed_at: order.preparation_confirmed_at,
          delivered_at: order.delivered_at,
          tracking_code: trackingCode,
          tracking_carrier: order.tracking_carrier,
          tracking_url: trackingUrl,
          destinazione_indirizzo: order.destinazione_indirizzo,
          destinazione_citta: order.destinazione_citta,
          destinazione_cap: order.destinazione_cap,
          destinazione_label: order.destinazione_label,
          cliente_nome: order.cliente_nome,
          amount_product: order.amount_product,
          amount_service: order.amount_service,
          shipping_step: shippingStep(order as Record<string, unknown>),
          artisan_step: artisanStep(
            String(order.option_type || "product"),
            assignment as Record<string, unknown> | null,
          ),
          unlock_otp: unlockOtp,
          artisan: assignment
            ? {
              nome: assignment.artisan_nome,
              qualifica: assignment.artisan_qualifica || assignment.categoria,
              logo_url: assignment.artisan_logo_url,
              telefono: artisanPhone,
              whatsapp_url: wa,
              stato: assignment.stato,
              appointment_date:
                assignment.appointment_date || order.artisan_appointment_date || order.artisan_data_indicativa,
              appointment_slot: assignment.appointment_slot || order.artisan_appointment_slot || "09:00–13:00",
              zona_label: assignment.zona_label || order.zona_label,
            }
            : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ordine-tracking:", err);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
