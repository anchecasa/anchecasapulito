// preventivi-avvisa · mail dei preventivi con la zona: materiali edili, noleggio, servizi per la casa (12.10.2026, app-21).
//   { evento: "richiesta", token }    → al cliente: «richiesta ricevuta»; ai fornitori che coprono la zona, dal più vicino: «richiesta nella sua zona».
//   { evento: "proposta", proposta }  → al cliente: «nuovo preventivo da …» (solo il fornitore che l'ha fatto, con l'accesso).
//   { evento: "scelta", token }       → al fornitore scelto: «il cliente ha scelto il suo preventivo».
// Look della mail d'invito approvata (../_shared/mail-marchio.ts). Deploy con verify_jwt spento.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mailPreventivi } from "../_shared/mail-marchio.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>";
const SITO = "https://entra.anchecasa.it";

const CAT: Record<string, { nome: string; pre: string; tipi: string[] }> = {
  materiali: { nome: "Materiali edili", pre: "mat", tipi: ["azienda_materiali_edili"] },
  noleggio: { nome: "Noleggio", pre: "nol", tipi: ["azienda_noleggio_attrezzature"] },
  casa: { nome: "Servizi per la casa", pre: "cas", tipi: ["azienda_traslochi", "azienda_facchinaggio", "azienda_pulizie", "azienda_manutenzione_stabili"] },
};
const TIPI_CASA: Record<string, string[]> = {
  azienda_traslochi: ["trasloco", "facchinaggio", "sgombero"], azienda_facchinaggio: ["facchinaggio", "trasloco", "sgombero"],
  azienda_pulizie: ["pulizie", "sanificazione"], azienda_manutenzione_stabili: ["giardinaggio", "manutenzione"],
};
const VICINO = ["Stesso comune", "Stessa provincia", "Nella sua zona"];

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
const righeTxt = (righe: { voce?: string; qta?: number; um?: string }[]) =>
  (righe || []).map((x) => (x.qta ? x.qta + " " + (x.um || "") + " " : "") + (x.voce || "")).join(" · ").slice(0, 160);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Solo POST." }, 405);
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return json({ error: "Richiesta non valida." }, 400); }
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });
  const db = admin.schema("marketplace");

  try {
    if (body.evento === "richiesta") {
      const { data: r } = await db.from("prev_richieste").select("*").eq("token", String(body.token || "")).maybeSingle();
      if (!r) return json({ error: "Richiesta non trovata." }, 404);
      if (r.avvisato_il) return json({ ok: true, gia: true });
      const c = CAT[r.categoria];
      const dove = [r.comune, r.provincia].filter(Boolean).join(" (") + (r.comune && r.provincia ? ")" : "");
      const tu = r.cliente_tipo === "privato";
      await manda(r.mail, mailPreventivi("richiesta-cliente", { categoria: c.nome, tu, nome: r.nome, dove, link: `${SITO}/preventivi.html?t=${r.token}`, daRete: r.fonte === "rete" }));
      await db.from("prev_richieste").update({ avvisato_il: new Date().toISOString() }).eq("id", r.id);
      // Fornitori della categoria che coprono la provincia, dal più vicino.
      const { data: forn } = await db.from("profiles").select("id, tipo_azienda").in("tipo_azienda", c.tipi).eq("verifica", "verificato");
      const { data: zone } = await db.from("fornitori_zona").select("*").in("azienda_id", (forn || []).map((f) => f.id));
      const zonaDi: Record<string, { sede_comune: string; sede_provincia: string; province: string[] }> = {};
      (zone || []).forEach((z) => { zonaDi[z.azienda_id] = z; });
      const elenco = (forn || []).map((f) => {
        const z = zonaDi[f.id];
        if (!z) return null;
        const copre = (z.province || []).length ? z.province.includes(r.provincia) : z.sede_provincia === r.provincia;
        if (!copre) return null;
        if (r.categoria === "casa" && !(TIPI_CASA[f.tipo_azienda] || []).includes(r.tipo)) return null;
        const v = z.sede_comune && r.comune && z.sede_comune.trim().toLowerCase() === r.comune.trim().toLowerCase() ? 0 : z.sede_provincia === r.provincia ? 1 : 2;
        return { id: f.id, v };
      }).filter(Boolean).sort((a, b) => a!.v - b!.v);
      const cosa = r.categoria === "casa" ? String(r.tipo) : righeTxt(r.righe);
      for (const f of elenco) {
        const { data: u } = await admin.auth.admin.getUserById(f!.id);
        const a = u?.user?.email;
        if (a) await manda(a, mailPreventivi("richiesta-fornitore", { categoria: c.nome, dove, cosa, vicino: VICINO[f!.v], link: `${SITO}/dashboard/#/azienda/${c.pre}_richieste` })).catch(() => {});
      }
      return json({ ok: true, fornitori: elenco.length });
    }

    if (body.evento === "proposta") {
      const auth = req.headers.get("Authorization") || "";
      const { data: ud } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
      const uid = ud?.user?.id;
      if (!uid) return json({ error: "Serve l'accesso." }, 401);
      const { data: p } = await db.from("prev_proposte").select("id, azienda_id, richiesta_id, categoria").eq("id", String(body.proposta || "")).maybeSingle();
      if (!p || p.azienda_id !== uid) return json({ error: "Preventivo non trovato." }, 404);
      const { data: r } = await db.from("prev_richieste").select("token, nome, mail, stato, cliente_tipo").eq("id", p.richiesta_id).maybeSingle();
      if (!r || r.stato !== "aperta") return json({ ok: true, chiusa: true });
      const { data: pr } = await db.from("profiles").select("nome").eq("id", uid).maybeSingle();
      await manda(r.mail, mailPreventivi("proposta", { categoria: CAT[p.categoria].nome, tu: r.cliente_tipo === "privato", nome: r.nome, chi: pr?.nome || "", link: `${SITO}/preventivi.html?t=${r.token}` }));
      return json({ ok: true });
    }

    if (body.evento === "scelta") {
      const { data: r } = await db.from("prev_richieste").select("id, categoria, stato, proposta_scelta, scelta_il").eq("token", String(body.token || "")).maybeSingle();
      if (!r || r.stato !== "scelta" || !r.proposta_scelta) return json({ error: "Nessuna scelta." }, 404);
      if (!r.scelta_il || Date.now() - new Date(r.scelta_il).getTime() > 15 * 60 * 1000) return json({ ok: true, vecchia: true });
      const { data: p } = await db.from("prev_proposte").select("azienda_id, numero").eq("id", r.proposta_scelta).maybeSingle();
      if (!p) return json({ error: "Preventivo non trovato." }, 404);
      const { data: u } = await admin.auth.admin.getUserById(p.azienda_id);
      const a = u?.user?.email;
      const c = CAT[r.categoria];
      if (a) await manda(a, mailPreventivi("scelta", { categoria: c.nome, numero: p.numero, link: `${SITO}/dashboard/#/azienda/${c.pre}_ordini` }));
      return json({ ok: true });
    }

    return json({ error: "Evento sconosciuto." }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
