import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { leggiSupabasePubblico } from "@/lib/supabase/env";

export async function aggiornaSessione(richiesta: NextRequest) {
  const { url, chiave } = leggiSupabasePubblico();
  let risposta = NextResponse.next({ request: richiesta });
  const supabase = createServerClient(url, chiave, {
    db: { schema: "marketplace" },
    cookies: {
      getAll() {
        return richiesta.cookies.getAll();
      },
      setAll(cookiesDaScrivere) {
        cookiesDaScrivere.forEach(({ name, value }) => {
          richiesta.cookies.set(name, value);
        });
        risposta = NextResponse.next({ request: richiesta });
        cookiesDaScrivere.forEach(({ name, value, options }) => {
          risposta.cookies.set(name, value, options);
        });
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return { risposta, utente: data.user };
}
