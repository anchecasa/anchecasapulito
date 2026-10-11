import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Solo server. Limiti di frequenza su Supabase (tabella sos_rate_limits). */

export type RateRule = {
  /** Nome del limite, es. "vd:ip". */
  bucket: string;
  /** Chi viene contato: IP, sessione, telefono… Viene salvato solo come hash. */
  who: string;
  windowSeconds: number;
  max: number;
};

const DEFAULT_MESSAGE = "Troppe richieste. Aspetta qualche minuto e riprova.";

/** IP del client: cf-connecting-ip (Cloudflare), poi il primo di x-forwarded-for. */
export function clientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const first = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "sconosciuto";
}

/** Cookie di sessione SuperMastro (sm_sos_session), se presente. */
export function sosSession(request: Request): string {
  const cookie = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)sm_sos_session=([0-9a-fA-F-]{36})(?:;|$)/.exec(cookie);
  return match?.[1] ?? "";
}

function keyOf(rule: RateRule) {
  const digest = createHash("sha256").update(`${rule.bucket}|${rule.who}`).digest("base64url").slice(0, 32);
  return `${rule.bucket}:${digest}`;
}

/**
 * true se almeno un limite è superato.
 * mode "closed": se il database non risponde, blocca (per gli SMS).
 * mode "open": se il database non risponde, lascia passare e scrive nel log.
 */
export async function isRateLimited(rules: RateRule[], mode: "open" | "closed"): Promise<boolean> {
  try {
    const db = createAdminClient();
    for (const rule of rules) {
      if (!rule.who) continue;
      const { data, error } = await db.rpc("sos_rate_hit", {
        p_key: keyOf(rule),
        p_window_seconds: rule.windowSeconds,
        p_max: rule.max,
      });
      if (error) throw new Error(error.message);
      if (data !== true) return true;
    }
    return false;
  } catch (err) {
    console.error("[sos-rate-limit]", mode, err instanceof Error ? err.message : err);
    return mode === "closed";
  }
}

export function tooManyRequests(message = DEFAULT_MESSAGE) {
  return NextResponse.json({ ok: false, error: message }, { status: 429, headers: { "Retry-After": "60" } });
}

/** Elimina le righe vecchie (job notturno). */
export async function purgeRateLimits() {
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await createAdminClient().from("sos_rate_limits").delete().lt("window_start", cutoff);
  return !error;
}
