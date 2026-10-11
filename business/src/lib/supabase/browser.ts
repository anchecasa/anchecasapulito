import { createBrowserClient } from "@supabase/ssr";
import { leggiSupabasePubblico } from "@/lib/supabase/env";

export function createBrowserSupabase() {
  const { url, chiave } = leggiSupabasePubblico();
  return createBrowserClient(url, chiave, { db: { schema: "marketplace" } });
}
