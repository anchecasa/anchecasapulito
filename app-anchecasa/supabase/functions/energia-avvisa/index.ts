// energia-avvisa · mail del giro luce e gas (12.10.2026, app-19).
//   { evento: "richiesta", token }    → al cliente: «richiesta ricevuta, qui vedrai le proposte»; ai fornitori: «nuova richiesta».
//   { evento: "proposta", proposta }  → al cliente: «nuova proposta da …» (solo il fornitore che l'ha fatta, con l'accesso).
//   { evento: "scelta", token }       → al fornitore scelto: «il cliente ha scelto la tua proposta».
// Segreti già presenti: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>";
const SITO = "https://entra.anchecasa.it";
const LOGO = "https://anchecasa.it/assets/mail/logo.png";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function pagina(titolo: string, testo: string, bottone: string, link: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#24384c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden">
    <tr><td style="padding:28px 36px 18px;border-bottom:2px solid #E56B10"><img src="${LOGO}" width="170" alt="AncheCasa" style="display:block"></td></tr>
    <tr><td style="padding:28px 36px 8px"><span style="display:inline-block;background:#fff1e4;color:#c45d0c;font-size:11px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;border-radius:12px;padding:5px 12px">Luce e gas</span>
      <h1 style="margin:14px 0 8px;font-size:24px;line-height:1.2;color:#16304d">${esc(titolo)}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6">${testo}</p>
      <a href="${link}" style="display:inline-block;padding:14px 30px;background:#c45d0c;color:#ffffff;font-weight:bold;text-decoration:none;border-radius:24px">${esc(bottone)}</a>
      <p style="margin:18px 0 26px;font-size:12px;color:#66758a">Se il pulsante non funziona: ${esc(link)}</p></td></tr>
    <tr><td style="background:#16304d;color:#d5deea;font-size:12px;padding:16px 36px">Palumbo Investment S.r.l. · Via Giusti 22, 81057 Teano (CE) · P.IVA 04724830619 · info@anchecasa.it</td></tr>
  </table></td></tr></table></body></html>`;
}

async function manda(a: string, oggetto: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [a], subject: oggetto, html }),
  });
  if (!r.ok) throw new Error("Resend: " + (await r.text()));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Solo POST." }, 405);
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return json({ error: "Richiesta non valida." }, 400); }
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });
  const db = admin.schema("marketplace");

  try {
    if (body.evento === "richiesta") {
      const { data: r } = await db.from("energia_richieste").select("id, token, nome, mail, tipo, regione, avvisato_il").eq("token", String(body.token || "")).maybeSingle();
      if (!r) return json({ error: "Richiesta non trovata." }, 404);
      if (r.avvisato_il) return json({ ok: true, gia: true });
      const link = `${SITO}/offerte.html?t=${r.token}`;
      await manda(r.mail, "AncheCasa · La tua richiesta di offerte luce e gas",
        pagina("Abbiamo ricevuto la tua richiesta", `Ciao ${esc(String(r.nome).split(" ")[0])}, i fornitori di luce e gas iscritti ad AncheCasa stanno preparando le loro proposte. Le trovi tutte qui, una accanto all'altra: scegli quella che preferisci e solo quel fornitore riceverà i tuoi contatti.`, "Vedi le proposte", link));
      await db.from("energia_richieste").update({ avvisato_il: new Date().toISOString() }).eq("id", r.id);
      // Ai fornitori di energia verificati: nuova richiesta (senza dati del cliente).
      const { data: forn } = await db.from("profiles").select("id").eq("tipo_azienda", "azienda_luce_gas").eq("verifica", "verificato");
      for (const f of forn || []) {
        const { data: u } = await admin.auth.admin.getUserById(f.id);
        const a = u?.user?.email;
        if (a) await manda(a, "AncheCasa · Nuova richiesta di offerta luce e gas",
          pagina("Nuova richiesta", `Un cliente${r.regione ? " in " + esc(r.regione) : ""} chiede un'offerta (${esc(r.tipo)}). Apri la tua dashboard, guarda i consumi e manda la tua proposta.`, "Apri le richieste", `${SITO}/dashboard/#/azienda/energia_richieste`)).catch(() => {});
      }
      return json({ ok: true });
    }

    if (body.evento === "proposta") {
      const auth = req.headers.get("Authorization") || "";
      const { data: ud } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
      const uid = ud?.user?.id;
      if (!uid) return json({ error: "Serve l'accesso." }, 401);
      const { data: p } = await db.from("energia_proposte").select("id, azienda_id, richiesta_id").eq("id", String(body.proposta || "")).maybeSingle();
      if (!p || p.azienda_id !== uid || !p.richiesta_id) return json({ error: "Proposta non trovata." }, 404);
      const { data: r } = await db.from("energia_richieste").select("token, nome, mail, stato").eq("id", p.richiesta_id).maybeSingle();
      if (!r || r.stato !== "aperta") return json({ ok: true, chiusa: true });
      const { data: c } = await db.from("energia_carta").select("ragione").eq("azienda_id", uid).maybeSingle();
      const chi = c?.ragione || "un fornitore AncheCasa";
      await manda(r.mail, "AncheCasa · Nuova proposta luce e gas",
        pagina("Hai una nuova proposta", `Ciao ${esc(String(r.nome).split(" ")[0])}, ${esc(chi)} ti ha mandato la sua proposta. Confrontala con le altre e scegli quella che preferisci.`, "Confronta le proposte", `${SITO}/offerte.html?t=${r.token}`));
      return json({ ok: true });
    }

    if (body.evento === "scelta") {
      const { data: r } = await db.from("energia_richieste").select("id, stato, proposta_scelta, scelta_il").eq("token", String(body.token || "")).maybeSingle();
      if (!r || r.stato !== "scelta" || !r.proposta_scelta) return json({ error: "Nessuna scelta." }, 404);
      if (!r.scelta_il || Date.now() - new Date(r.scelta_il).getTime() > 15 * 60 * 1000) return json({ ok: true, vecchia: true });
      const { data: p } = await db.from("energia_proposte").select("azienda_id, numero").eq("id", r.proposta_scelta).maybeSingle();
      if (!p) return json({ error: "Proposta non trovata." }, 404);
      const { data: u } = await admin.auth.admin.getUserById(p.azienda_id);
      const a = u?.user?.email;
      if (a) await manda(a, "AncheCasa · Il cliente ha scelto la tua proposta",
        pagina("Il cliente ha scelto te", `Il cliente ha accettato la proposta ${esc(p.numero)}. Nella tua dashboard trovi ora nome, mail e telefono: contattalo e mandagli il contratto.`, "Apri i miei clienti", `${SITO}/dashboard/#/azienda/energia_clienti`));
      return json({ ok: true });
    }

    if (body.evento === "accordo") {
      // L'admin invia l'accordo al fornitore.
      const auth = req.headers.get("Authorization") || "";
      const { data: ud } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
      const uid = ud?.user?.id;
      const { data: ad } = uid ? await db.from("admins").select("id").eq("id", uid).maybeSingle() : { data: null };
      if (!ad) return json({ error: "Solo l'admin." }, 403);
      const { data: a } = await db.from("fornitori_accordi").select("azienda_id, tipo, valore, su_cosa").eq("azienda_id", String(body.azienda || "")).maybeSingle();
      if (!a) return json({ error: "Accordo non trovato." }, 404);
      const { data: u } = await admin.auth.admin.getUserById(a.azienda_id);
      const to = u?.user?.email;
      if (!to) return json({ error: "Il fornitore non ha una mail." }, 400);
      const quanto = a.tipo === "percentuale" ? `${a.valore}%` : `${Number(a.valore).toLocaleString("it-IT", { minimumFractionDigits: 2 })} €`;
      await manda(to, "AncheCasa · Il tuo accordo da confermare",
        pagina("Il tuo accordo con AncheCasa", `La provvigione concordata è <b>${esc(quanto)}</b> ${esc(a.su_cosa)}. Aprila nella tua dashboard e confermala: da quel momento puoi mandare le tue proposte ai clienti AncheCasa.`, "Leggi e conferma", `${SITO}/dashboard/#/azienda/energia_accordo`));
      return json({ ok: true });
    }

    return json({ error: "Evento sconosciuto." }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
