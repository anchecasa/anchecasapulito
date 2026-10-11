import "server-only";
import { createClient } from "@supabase/supabase-js";
import { leggiSupabasePubblico } from "@/lib/supabase/env";

/** Solo server. La chiave di servizio non va mai in un componente client né in una variabile NEXT_PUBLIC. */
export function createServiceClient() {
  const { url } = leggiSupabasePubblico();
  const chiave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chiave) {
    throw new Error("Manca SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, chiave, {
    db: { schema: "marketplace" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
