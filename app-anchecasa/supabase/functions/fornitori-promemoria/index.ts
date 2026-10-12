// NON PUBBLICATA (12.10.2026 12:05): il progetto Supabase ha raggiunto il limite di 100 funzioni.
// La stessa logica è in preventivi-avvisa, { evento: "giornaliero" }, chiamata ogni giorno da pg_cron (app-22b).
// Questo file resta come riferimento; si può cancellare.
// fornitori-promemoria · una volta al giorno (12.10.2026, app-22, decisioni di Nando 11:41).
//   1. Chiude le richieste aperte da più di 15 giorni (stato «scaduta», le proposte non scelte diventano «non scelta»).
//   2. Promemoria al cliente dopo 3 giorni, se ha almeno una proposta o un preventivo da guardare (una volta sola).
//   3. Verifica dei contratti 30 giorni dopo la scelta (luce e gas, telefono, finanza): «Hai firmato con …?» (una volta sola).
// Si può chiamare più volte: ogni mail parte una volta sola (promemoria_il, verifica_il). Deploy con verify_jwt spento.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mailPromemoria, mailVerifica } from "../_shared/mail-marchio.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>";
const SITO = "https://entra.anchecasa.it";
const GIORNO = 86400000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const fa = (giorni: number) => new Date(Date.now() - giorni * GIORNO).toISOString();

async function manda(a: string, m: { oggetto: string; html: string }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [a], subject: m.oggetto, html: m.html }),
  });
  if (!r.ok) throw new Error("Resend: " + (await r.text()));
}

const NOMI_SERVIZI: Record<string, string> = { telefonia: "Telefono e internet", finanza: "Finanza e assicurazioni" };
const NOMI_PREV: Record<string, string> = { materiali: "Materiali edili", noleggio: "Noleggio", casa: "Servizi per la casa" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Solo POST." }, 405);
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });
  const db = admin.schema("marketplace");
  const esito = { scadute: 0, promemoria: 0, verifiche: 0, errori: [] as string[] };
  const prova = async (fn: () => Promise<void>) => { try { await fn(); } catch (e) { esito.errori.push(String((e as Error).message || e)); } };

  // 1. Richieste scadute
  await prova(async () => {
    const { data, error } = await db.rpc("fornitori_chiudi_scadute");
    if (error) throw error;
    esito.scadute = Number(data) || 0;
  });

  // 2. Promemoria dopo 3 giorni (richieste aperte, non ancora avvisate, con almeno una proposta)
  const giri = [
    { tab: "energia_richieste", prop: "energia_proposte", pagina: "offerte.html", nome: () => "Luce e gas", tu: () => true, preventivi: false },
    { tab: "servizi_richieste", prop: "servizi_proposte", pagina: "servizi.html", nome: (r: Record<string, string>) => NOMI_SERVIZI[r.categoria] || "AncheCasa", tu: (r: Record<string, string>) => r.cliente_tipo !== "impresa", preventivi: false },
    { tab: "prev_richieste", prop: "prev_proposte", pagina: "preventivi.html", nome: (r: Record<string, string>) => NOMI_PREV[r.categoria] || "AncheCasa", tu: (r: Record<string, string>) => r.cliente_tipo === "privato", preventivi: true },
  ];
  for (const g of giri) {
    await prova(async () => {
      const { data: righe, error } = await db.from(g.tab).select("*").eq("stato", "aperta").is("promemoria_il", null).lt("creato", fa(3)).gt("creato", fa(15)).limit(200);
      if (error) throw error;
      for (const r of righe || []) {
        const { count } = await db.from(g.prop).select("id", { count: "exact", head: true }).eq("richiesta_id", r.id);
        if (!count) continue;
        await manda(r.mail, mailPromemoria({ categoria: g.nome(r), link: `${SITO}/${g.pagina}?t=${r.token}`, tu: g.tu(r), nome: r.nome, quante: count, preventivi: g.preventivi }));
        await db.from(g.tab).update({ promemoria_il: new Date().toISOString() }).eq("id", r.id);
        esito.promemoria++;
      }
    });
  }

  // 3. Verifica dei contratti 30 giorni dopo la scelta (solo dove c'è una provvigione)
  const verifiche = [
    { tab: "energia_richieste", prop: "energia_proposte", cat: "energia", nome: () => "Luce e gas" },
    { tab: "servizi_richieste", prop: "servizi_proposte", cat: "servizi", nome: (r: Record<string, string>) => NOMI_SERVIZI[r.categoria] || "AncheCasa" },
  ];
  for (const v of verifiche) {
    await prova(async () => {
      const { data: righe, error } = await db.from(v.tab).select("*").in("stato", ["scelta", "chiusa"]).is("verifica_il", null).not("proposta_scelta", "is", null).lt("scelta_il", fa(30)).limit(200);
      if (error) throw error;
      for (const r of righe || []) {
        const { data: p } = await db.from(v.prop).select("azienda_id").eq("id", r.proposta_scelta).maybeSingle();
        let azienda = "il fornitore";
        if (p) {
          const { data: c } = await db.from("energia_carta").select("ragione").eq("azienda_id", p.azienda_id).maybeSingle();
          const { data: pr } = await db.from("profiles").select("nome").eq("id", p.azienda_id).maybeSingle();
          azienda = c?.ragione || pr?.nome || azienda;
        }
        await manda(r.mail, mailVerifica({ categoria: v.nome(r), nome: r.nome, azienda, link: `${SITO}/verifica.html?c=${v.cat}&t=${r.token}` }));
        await db.from(v.tab).update({ verifica_il: new Date().toISOString() }).eq("id", r.id);
        esito.verifiche++;
      }
    });
  }

  return json(esito);
});
