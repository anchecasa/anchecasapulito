import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigurato } from "@/lib/supabase/env";
import { aggiornaSessione } from "@/lib/supabase/middleware";

export async function middleware(richiesta: NextRequest) {
  if (!supabaseConfigurato()) {
    return NextResponse.next();
  }
  const { risposta, utente } = await aggiornaSessione(richiesta);
  const percorso = richiesta.nextUrl.pathname;
  if (percorso.startsWith("/admin") && !utente) {
    const login = richiesta.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", percorso);
    return NextResponse.redirect(login);
  }
  return risposta;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
