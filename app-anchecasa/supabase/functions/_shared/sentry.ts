import * as Sentry from "npm:@sentry/deno@^9.22.0";

let initialized = false;

export function initEdgeSentry(): void {
  if (initialized) return;

  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: Deno.env.get("SENTRY_ENVIRONMENT") ?? "production",
    tracesSampleRate: 0.1,
  });

  initialized = true;
}

export async function captureEdgeException(
  error: unknown,
  functionName: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  initEdgeSentry();
  if (!Deno.env.get("SENTRY_DSN")) return;

  Sentry.captureException(error, {
    tags: { function: functionName, runtime: "supabase-edge" },
    extra,
  });

  await Sentry.flush(2000);
}
