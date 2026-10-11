import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { leggiSupabasePubblico } from "@/lib/supabase/env";

export async function createClient() {
  const { url, chiave } = leggiSupabasePubblico();
  const cookieStore = await cookies();
  return createServerClient(url, chiave, {
    db: { schema: "marketplace" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesDaScrivere) {
        try {
          cookiesDaScrivere.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* In un Server Component il cookie si rinnova dal middleware. */
        }
      },
    },
  });
}
