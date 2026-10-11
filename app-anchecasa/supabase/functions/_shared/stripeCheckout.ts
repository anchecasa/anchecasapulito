/** Stripe Checkout + webhook helpers (REST, no SDK). */

export type StripeLineItem = {
  name: string;
  amount_cents: number;
  quantity?: number;
  description?: string;
};

function requireStripeKey(): string {
  const key = Deno.env.get("STRIPE_SECRET_KEY") || "";
  if (!key) throw new Error("missing_stripe_secret");
  return key;
}

export async function createStripeCheckoutSession(opts: {
  lineItems: StripeLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
  /** Guest checkout: email già nota + telefono/indirizzo in Stripe */
  collectPhone?: boolean;
  collectShippingAddress?: boolean;
}): Promise<{ id: string; url: string | null }> {
  const key = requireStripeKey();
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", opts.successUrl);
  body.set("cancel_url", opts.cancelUrl);
  body.set("payment_intent_data[capture_method]", "automatic");
  if (opts.customerEmail) body.set("customer_email", opts.customerEmail);
  if (opts.clientReferenceId) body.set("client_reference_id", opts.clientReferenceId);
  if (opts.collectPhone !== false) {
    body.set("phone_number_collection[enabled]", "true");
  }
  if (opts.collectShippingAddress !== false) {
    body.set("shipping_address_collection[allowed_countries][0]", "IT");
    body.set("billing_address_collection", "required");
  }

  opts.lineItems.forEach((item, i) => {
    body.set(`line_items[${i}][quantity]`, String(Math.max(1, item.quantity || 1)));
    body.set(`line_items[${i}][price_data][currency]`, "eur");
    body.set(`line_items[${i}][price_data][unit_amount]`, String(Math.max(0, Math.round(item.amount_cents))));
    body.set(`line_items[${i}][price_data][product_data][name]`, item.name.slice(0, 120));
    if (item.description) {
      body.set(
        `line_items[${i}][price_data][product_data][description]`,
        item.description.slice(0, 400),
      );
    }
  });

  if (opts.metadata) {
    for (const [k, v] of Object.entries(opts.metadata)) {
      body.set(`metadata[${k}]`, String(v).slice(0, 500));
    }
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.code || "stripe_session_failed";
    throw new Error(String(msg));
  }
  return { id: String(data.id), url: data.url ? String(data.url) : null };
}

export async function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSec = 300,
): Promise<{ ok: true; event: Record<string, unknown> } | { ok: false; error: string }> {
  if (!secret) return { ok: false, error: "missing_webhook_secret" };
  if (!signatureHeader) return { ok: false, error: "missing_signature" };

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, ...rest] = p.trim().split("=");
      return [k, rest.join("=")];
    }),
  ) as Record<string, string>;

  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return { ok: false, error: "invalid_signature_header" };

  const ts = Number(t);
  if (!Number.isFinite(ts)) return { ok: false, error: "invalid_timestamp" };
  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > toleranceSec) return { ok: false, error: "timestamp_out_of_tolerance" };

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${rawBody}`));
  const expected = Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");

  // timing-safe compare
  if (expected.length !== v1.length) return { ok: false, error: "signature_mismatch" };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  if (diff !== 0) return { ok: false, error: "signature_mismatch" };

  try {
    const event = JSON.parse(rawBody) as Record<string, unknown>;
    return { ok: true, event };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

export function eurosToCents(eur: number): number {
  return Math.max(0, Math.round(Number(eur || 0) * 100));
}

export async function retrieveStripeCheckoutSession(
  sessionId: string,
): Promise<Record<string, unknown> | null> {
  const key = requireStripeKey();
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}
