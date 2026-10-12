// reset-password-marketplace
// "Password dimenticata" dell'Area riservata, senza passare dall'hook auth-email-hook
// (il suo link /auth/v1/verify dava «Verify requires a token or a token hash», 02.10.2026).
// Genera il token di recupero con l'API admin (generateLink: NON spedisce nulla da sola),
// costruisce il link verso la nostra pagina nuova-password.html?token_hash=...&type=recovery
// e spedisce la mail con Resend, stesso stile della mail d'invito.
// 12.10.2026: la mail è quella approvata da Nando (MailInvito.avviso("password"), mail/invito/mail-invito.js copiata in
// ../_shared/mail-invito.js) e il link porta su entra.anchecasa.it (stesso sito di areaprivata).
// Risponde sempre {ok:true} anche se la mail non ha un account (nessuna enumerazione).
// ATTENZIONE: la funzione VIVE nel dashboard Supabase (Edge Functions → Via Editor), con
// «Verify JWT» DISATTIVATO (la chiama chi non è ancora entrato). Questo file è la copia di
// riferimento: dopo ogni modifica incollarlo lì e fare Deploy.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "../_shared/mail-invito.js";

// deno-lint-ignore no-explicit-any
const MailInvito = (globalThis as any).MailInvito as { avviso: (tipo: string, d: { link: string; famiglia?: string }) => { oggetto: string; html: string } };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>";
const PAGINA = "https://entra.anchecasa.it/nuova-password.html";

// Un solo invio al minuto per indirizzo (per istanza: basta a fermare i clic ripetuti).
const ultimo = new Map<string, number>();

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

function costruisciMail(url: string) {
  return MailInvito.avviso("password", { link: url, famiglia: "privato" });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Metodo non permesso." }, 405, origin);

  let email: string;
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
  } catch {
    return json({ error: "Corpo della richiesta non valido." }, 400, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Mail non valida." }, 400, origin);

  const adesso = Date.now();
  if (adesso - (ultimo.get(email) || 0) < 60_000) return json({ ok: true }, 200, origin);
  ultimo.set(email, adesso);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    // Nessun account con questa mail: stessa risposta di un invio riuscito.
    console.log("reset: nessun link per", email, error?.message || "");
    return json({ ok: true }, 200, origin);
  }

  const url = `${PAGINA}?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
  const mail = costruisciMail(url);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email],
      subject: mail.oggetto,
      html: mail.html,
    }),
  });
  if (!res.ok) {
    console.log("reset: Resend", res.status, await res.text());
    return json({ error: "Invio non riuscito. Riprova tra poco." }, 502, origin);
  }
  return json({ ok: true }, 200, origin);
});