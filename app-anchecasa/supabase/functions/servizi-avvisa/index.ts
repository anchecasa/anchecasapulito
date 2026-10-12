// servizi-avvisa · mail del giro Telefono e internet / Finanza e assicurazioni (12.10.2026, app-20).
// Stesso modello di energia-avvisa (luce e gas). Le mail hanno il look della mail d'invito approvata (../_shared/mail-marchio.ts).
//   { evento: "richiesta", token }    → al cliente: «richiesta ricevuta, qui vedrai le proposte»; ai fornitori della categoria: «nuova richiesta».
//   { evento: "proposta", proposta }  → al cliente: «nuova proposta da …» (solo il fornitore che l'ha fatta, con l'accesso).
//   { evento: "scelta", token }       → al fornitore scelto: «il cliente ha scelto la tua proposta».
//   { evento: "accordo", azienda }    → al fornitore (anche luce e gas): «il tuo accordo da confermare» (solo l'admin).
// Segreti già presenti: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM. Deploy con verify_jwt spento.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mailGiro } from "../_shared/mail-marchio.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>";
const SITO = "https://entra.anchecasa.it";

const CAT: Record<string, { nome: string; tipo: string; pre: string }> = {
  telefonia: { nome: "Telefono e internet", tipo: "azienda_telefonia", pre: "tel" },
  finanza: { nome: "Finanza e assicurazioni", tipo: "azienda_finanza", pre: "fin" },
};
const PRE_DI_TIPO: Record<string, [string, string]> = { azienda_telefonia: ["tel", "Telefono e internet"], azienda_finanza: ["fin", "Finanza e assicurazioni"], azienda_luce_gas: ["energia", "Luce e gas"] };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function manda(a: string, m: { oggetto: string; html: string }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [a], subject: m.oggetto, html: m.html }),
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
  const chiE = async () => {
    const auth = req.headers.get("Authorization") || "";
    const { data: ud } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    return ud?.user?.id || "";
  };

  try {
    if (body.evento === "richiesta") {
      const { data: r } = await db.from("servizi_richieste").select("id, token, categoria, nome, mail, tipo, regione, fonte, avvisato_il").eq("token", String(body.token || "")).maybeSingle();
      if (!r) return json({ error: "Richiesta non trovata." }, 404);
      if (r.avvisato_il) return json({ ok: true, gia: true });
      const c = CAT[r.categoria];
      await manda(r.mail, mailGiro("richiesta-cliente", { categoria: c.nome, nome: r.nome, link: `${SITO}/servizi.html?t=${r.token}`, daRete: r.fonte === "rete" }));
      await db.from("servizi_richieste").update({ avvisato_il: new Date().toISOString() }).eq("id", r.id);
      const { data: forn } = await db.from("profiles").select("id").eq("tipo_azienda", c.tipo).eq("verifica", "verificato");
      for (const f of forn || []) {
        const { data: u } = await admin.auth.admin.getUserById(f.id);
        const a = u?.user?.email;
        if (a) await manda(a, mailGiro("richiesta-fornitore", { categoria: c.nome, regione: r.regione, cosa: String(r.tipo).replace(/_/g, " "), link: `${SITO}/dashboard/#/azienda/${c.pre}_richieste` })).catch(() => {});
      }
      return json({ ok: true });
    }

    if (body.evento === "proposta") {
      const uid = await chiE();
      if (!uid) return json({ error: "Serve l'accesso." }, 401);
      const { data: p } = await db.from("servizi_proposte").select("id, azienda_id, richiesta_id, categoria").eq("id", String(body.proposta || "")).maybeSingle();
      if (!p || p.azienda_id !== uid || !p.richiesta_id) return json({ error: "Proposta non trovata." }, 404);
      const { data: r } = await db.from("servizi_richieste").select("token, nome, mail, stato").eq("id", p.richiesta_id).maybeSingle();
      if (!r || r.stato !== "aperta") return json({ ok: true, chiusa: true });
      const { data: carta } = await db.from("energia_carta").select("ragione").eq("azienda_id", uid).maybeSingle();
      await manda(r.mail, mailGiro("proposta", { categoria: CAT[p.categoria].nome, nome: r.nome, chi: carta?.ragione || "", link: `${SITO}/servizi.html?t=${r.token}` }));
      return json({ ok: true });
    }

    if (body.evento === "scelta") {
      const { data: r } = await db.from("servizi_richieste").select("id, categoria, stato, proposta_scelta, scelta_il").eq("token", String(body.token || "")).maybeSingle();
      if (!r || r.stato !== "scelta" || !r.proposta_scelta) return json({ error: "Nessuna scelta." }, 404);
      if (!r.scelta_il || Date.now() - new Date(r.scelta_il).getTime() > 15 * 60 * 1000) return json({ ok: true, vecchia: true });
      const { data: p } = await db.from("servizi_proposte").select("azienda_id, numero").eq("id", r.proposta_scelta).maybeSingle();
      if (!p) return json({ error: "Proposta non trovata." }, 404);
      const { data: u } = await admin.auth.admin.getUserById(p.azienda_id);
      const a = u?.user?.email;
      const c = CAT[r.categoria];
      if (a) await manda(a, mailGiro("scelta", { categoria: c.nome, numero: p.numero, link: `${SITO}/dashboard/#/azienda/${c.pre}_clienti` }));
      return json({ ok: true });
    }

    if (body.evento === "accordo") {
      const uid = await chiE();
      const { data: ad } = uid ? await db.from("admins").select("id").eq("id", uid).maybeSingle() : { data: null };
      if (!ad) return json({ error: "Solo l'admin." }, 403);
      const { data: a } = await db.from("fornitori_accordi").select("azienda_id, tipo, valore, su_cosa").eq("azienda_id", String(body.azienda || "")).maybeSingle();
      if (!a) return json({ error: "Accordo non trovato." }, 404);
      const { data: pr } = await db.from("profiles").select("tipo_azienda").eq("id", a.azienda_id).maybeSingle();
      const [pre, nome] = PRE_DI_TIPO[pr?.tipo_azienda || ""] || ["energia", "Fornitori AncheCasa"];
      const { data: u } = await admin.auth.admin.getUserById(a.azienda_id);
      const to = u?.user?.email;
      if (!to) return json({ error: "Il fornitore non ha una mail." }, 400);
      const quanto = a.tipo === "percentuale" ? `${a.valore}%` : `${Number(a.valore).toLocaleString("it-IT", { minimumFractionDigits: 2 })} €`;
      await manda(to, mailGiro("accordo", { categoria: nome, quanto, su: a.su_cosa, link: `${SITO}/dashboard/#/azienda/${pre}_accordo` }));
      return json({ ok: true });
    }

    return json({ error: "Evento sconosciuto." }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
