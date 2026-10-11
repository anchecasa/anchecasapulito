export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** IP client dietro proxy / Cloudflare. */
export function getClientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    pruneExpiredBuckets(now);
    return { allowed: true };
  }

  if (bucket.count >= config.maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return { allowed: true };
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function rateLimitResponse(
  retryAfterSec: number,
  headers: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({
      error: "Troppe richieste. Riprova tra qualche minuto.",
      retry_after: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    },
  );
}
