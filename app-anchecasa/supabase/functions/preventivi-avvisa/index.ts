// preventivi-avvisa · mail dei preventivi con la zona: materiali edili, noleggio, servizi per la casa (12.10.2026, app-21).
//   { evento: "richiesta", token }    → al cliente: «richiesta ricevuta»; ai fornitori che coprono la zona, dal più vicino: «richiesta nella sua zona».
//   { evento: "proposta", proposta }  → al cliente: «nuovo preventivo da …» (solo il fornitore che l'ha fatto, con l'accesso).
//   { evento: "scelta", token }       → al fornitore scelto: «il cliente ha scelto il suo preventivo».
//   { evento: "giornaliero" }         → una volta al giorno (pg_cron, app-22b): chiude le richieste scadute (15 giorni) di tutti i giri,
//                                       promemoria al cliente dopo 3 giorni, «Hai firmato?» 30 giorni dopo la scelta (luce e gas, telefono, finanza).
//   { evento: "guasti" }              → ogni 5 minuti (pg_cron, app-23b) e dopo ogni azione: «Ho un guasto» passa al prossimo artigiano
//                                       chi non ha risposto, conferma i lavori fatti da 7 giorni, manda le mail (artigiano, cliente, admin).
//                                       Nello stesso giro passano anche le mail delle imprese (evento «imprese», app-24).
//   { evento: "cantieri" }            → dopo ogni azione sulle richieste dei cantieri (app-25): inviti urgenti o diretti, ditte di fiducia
//                                       non iscritte, offerte, scelte, domande, risposte; allargamento dopo 48 ore e mail alla rete.
//                                       Gira anche nel giro ogni 5 minuti; il riepilogo del giorno alle aziende parte con «giornaliero».
//   { evento: "imprese" }             → dopo ogni azione su ristrutturazioni, lavori affidati e subappalti: mail all'admin, all'agente,
//                                       all'impresa, ai subappaltatori. Ogni mail parte una volta sola (colonne avvisato_*).
//                                       Sta qui e non in una funzione a parte perché il progetto ha raggiunto il limite di 100 funzioni (12.10.2026).
// Look della mail d'invito approvata (../_shared/mail-marchio.ts). Deploy con verify_jwt spento.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mailPreventivi, mailPromemoria, mailVerifica, mailGuasti, mailImprese, mailCantieri } from "../_shared/mail-marchio.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>";
const SITO = "https://entra.anchecasa.it";

const CAT: Record<string, { nome: string; pre: string; tipi: string[] }> = {
  materiali: { nome: "Materiali edili", pre: "mat", tipi: ["azienda_materiali_edili"] },
  noleggio: { nome: "Noleggio", pre: "nol", tipi: ["azienda_noleggio_attrezzature"] },
  casa: { nome: "Servizi per la casa", pre: "cas", tipi: ["azienda_traslochi", "azienda_facchinaggio", "azienda_pulizie", "azienda_manutenzione_stabili"] },
  lavori: { nome: "Piccoli lavori", pre: "lav", tipi: ["impresa", "azienda_imprese_edili", "azienda_subappaltatori", "azienda_impiantisti"] },
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

const GIORNO = 86400000;
const fa = (giorni: number) => new Date(Date.now() - giorni * GIORNO).toISOString();
const NOMI_SERVIZI: Record<string, string> = { telefonia: "Telefono e internet", finanza: "Finanza e assicurazioni" };
const NOMI_PREV: Record<string, string> = { materiali: "Materiali edili", noleggio: "Noleggio", casa: "Servizi per la casa", lavori: "Piccoli lavori" };

// deno-lint-ignore no-explicit-any
async function giornaliero(admin: any, db: any) {
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

  return esito;
}

// Il giro dei guasti (app-23): ogni mail parte una volta sola (avvisato_offerta, avvisato_stato, avvisato_admin).
const ADMIN_MAIL = Deno.env.get("ADMIN_MAIL") || "info@anchecasa.it";
// deno-lint-ignore no-explicit-any
async function giroGuasti(admin: any, db: any) {
  const esito = { passati: 0, confermati: 0, mail: 0, errori: [] as string[] };
  const prova = async (fn: () => Promise<void>) => { try { await fn(); } catch (e) { esito.errori.push(String((e as Error).message || e)); } };
  await prova(async () => {
    const { data, error } = await db.rpc("guasti_giro");
    if (error) throw error;
    esito.passati = data?.passati || 0; esito.confermati = data?.confermati || 0;
  });
  const mailDi = async (id: string) => { const { data: u } = await admin.auth.admin.getUserById(id); return u?.user?.email || ""; };
  const nomeDi = async (id: string) => { const { data: p } = await db.from("profiles").select("nome").eq("id", id).maybeSingle(); return p?.nome || ""; };
  const pagina = (t: string) => `${SITO}/guasto.html?t=${t}`;
  await prova(async () => {
    const { data: righe, error } = await db.from("guasti").select("*").in("stato", ["assegnato", "accettato", "fatto", "admin", "confermato"]).gt("creato", fa(60)).limit(300);
    if (error) throw error;
    for (const g of righe || []) {
      // All'artigiano: la richiesta appena arrivata a lui.
      if (g.stato === "assegnato" && g.artigiano_id && (!g.avvisato_offerta || new Date(g.avvisato_offerta) < new Date(g.offerto_il)) && new Date(g.scade_il) > new Date()) {
        const a = await mailDi(g.artigiano_id);
        if (a) { await manda(a, mailGuasti("offerta", { link: `${SITO}/dashboard/#/azienda/art_richieste`, mestiere: g.mestiere, comune: g.comune, urgente: g.urgente, descrizione: g.descrizione })); esito.mail++; }
        await db.from("guasti").update({ avvisato_offerta: g.offerto_il }).eq("id", g.id);
      }
      // Al cliente: ricevuta, accettato, fatto.
      const chiave = g.stato === "accettato" || g.stato === "fatto" ? g.stato : g.stato === "assegnato" || g.stato === "admin" ? "ricevuta" : "";
      if (chiave && g.avvisato_stato !== chiave && !(chiave === "ricevuta" && g.avvisato_stato)) {
        const art = g.artigiano_id && chiave !== "ricevuta" ? await nomeDi(g.artigiano_id) : "";
        await manda(g.mail, mailGuasti(chiave as "ricevuta" | "accettato" | "fatto", { link: pagina(g.token), nome: g.nome, mestiere: g.mestiere, comune: g.comune, urgente: g.urgente, artigiano: art, importo: g.importo }));
        await db.from("guasti").update({ avvisato_stato: chiave }).eq("id", g.id);
        esito.mail++;
      }
      // All'admin: nessuno ha accettato.
      if (g.stato === "admin" && !g.avvisato_admin) {
        await manda(ADMIN_MAIL, mailGuasti("admin", { link: `${SITO}/dashboard/#/admin/aziende-admin`, mestiere: g.mestiere, comune: g.comune, urgente: g.urgente, descrizione: g.descrizione }));
        await db.from("guasti").update({ avvisato_admin: new Date().toISOString() }).eq("id", g.id);
        esito.mail++;
      }
      // Garanzia: all'artigiano e all'admin.
      if (g.stato === "confermato" && g.garanzia_il && g.avvisato_stato !== "garanzia") {
        const d = { link: `${SITO}/dashboard/#/azienda/art_garanzia`, mestiere: g.mestiere, comune: g.comune, nota: g.garanzia_nota };
        const a = g.artigiano_id ? await mailDi(g.artigiano_id) : "";
        if (a) await manda(a, mailGuasti("garanzia", d));
        await manda(ADMIN_MAIL, mailGuasti("garanzia", Object.assign({}, d, { link: `${SITO}/dashboard/#/admin/aziende-admin` })));
        await db.from("guasti").update({ avvisato_stato: "garanzia" }).eq("id", g.id);
        esito.mail++;
      }
    }
  });
  return esito;
}

// Imprese e ristrutturazioni (app-24): ogni mail parte una volta sola.
// deno-lint-ignore no-explicit-any
async function giroImprese(admin: any, db: any) {
  const esito = { mail: 0, errori: [] as string[] };
  const prova = async (fn: () => Promise<void>) => { try { await fn(); } catch (e) { esito.errori.push(String((e as Error).message || e)); } };
  const mailDi = async (id: string) => { const { data: u } = await admin.auth.admin.getUserById(id); return u?.user?.email || ""; };
  const nomeDi = async (id: string) => { const { data: p } = await db.from("profiles").select("nome").eq("id", id).maybeSingle(); return p?.nome || ""; };
  const adminLink = `${SITO}/dashboard/#/admin/ristrutturazioni-admin`;
  // 1. Nuove ristrutturazioni → admin. Agente assegnato → agente.
  await prova(async () => {
    const { data: righe, error } = await db.from("ristrutturazioni").select("*").gt("creato", fa(120)).limit(300);
    if (error) throw error;
    for (const r of righe || []) {
      if (!r.avvisato_admin && r.origine !== "admin") {
        await manda(ADMIN_MAIL, mailImprese("ristrutturazione", { link: adminLink, nome: r.nome, comune: r.comune, descrizione: r.descrizione }));
        await db.from("ristrutturazioni").update({ avvisato_admin: new Date().toISOString() }).eq("id", r.id);
        esito.mail++;
      }
      if (r.agente_id && r.avvisato_agente !== r.agente_id) {
        const a = await mailDi(r.agente_id);
        if (a) { await manda(a, mailImprese("sopralluogo", { link: `${SITO}/dashboard/#/rete/re-sopralluoghi`, nome: r.nome, comune: r.comune, descrizione: r.descrizione })); esito.mail++; }
        await db.from("ristrutturazioni").update({ avvisato_agente: r.agente_id }).eq("id", r.id);
      }
    }
  });
  // 2. Lavori affidati → impresa; risposta dell'impresa → admin.
  await prova(async () => {
    const { data: righe, error } = await db.from("commesse").select("*").gt("creato", fa(120)).limit(300);
    if (error) throw error;
    for (const c of righe || []) {
      if (c.stato === "proposta" && !c.avvisato_impresa) {
        const a = await mailDi(c.impresa_id);
        if (a) { await manda(a, mailImprese("commessa", { link: `${SITO}/dashboard/#/azienda/imp_lavori`, titolo: c.titolo, comune: c.comune, importo: c.importo_impresa })); esito.mail++; }
        await db.from("commesse").update({ avvisato_impresa: new Date().toISOString() }).eq("id", c.id);
      }
      if ((c.stato === "accettata" || c.stato === "rifiutata") && c.risposta_il && !c.avvisato_admin) {
        await manda(ADMIN_MAIL, mailImprese("risposta", { link: adminLink, chi: await nomeDi(c.impresa_id), accetta: c.stato === "accettata", titolo: c.titolo, nota: c.nota_impresa }));
        await db.from("commesse").update({ avvisato_admin: new Date().toISOString() }).eq("id", c.id);
        esito.mail++;
      }
    }
  });
  // 3. Subappalti: richiesta → destinatario; risposta → chi l'ha chiesta.
  await prova(async () => {
    const { data: righe, error } = await db.from("subappalti_richieste").select("*").gt("creato", fa(60)).limit(300);
    if (error) throw error;
    const link = `${SITO}/dashboard/#/azienda/imp_subappalti`;
    for (const s of righe || []) {
      if (!s.avvisato) {
        const a = await mailDi(s.a_azienda);
        if (a) { await manda(a, mailImprese("subappalto", { link, chi: await nomeDi(s.da_azienda), lavorazione: s.lavorazione, comune: s.comune, descrizione: s.descrizione })); esito.mail++; }
        await db.from("subappalti_richieste").update({ avvisato: "inviata" }).eq("id", s.id);
      }
      if (s.stato !== "inviata" && s.avvisato !== s.stato) {
        const a = await mailDi(s.da_azienda);
        if (a) { await manda(a, mailImprese("subappalto-risposta", { link, chi: await nomeDi(s.a_azienda), accetta: s.stato === "accettata", lavorazione: s.lavorazione, nota: s.risposta })); esito.mail++; }
        await db.from("subappalti_richieste").update({ avvisato: s.stato }).eq("id", s.id);
      }
    }
  });
  return esito;
}

// Cantieri e richieste tra aziende (app-25). Ogni mail parte una volta sola (avvisato_il, avvisato, avvisato_rete).
const SERVIZI: Record<string, string> = {
  materiali: "Materiali edili", noleggio: "Noleggio mezzi e attrezzature", personale: "Personale (agenzia per il lavoro)",
  demolizioni: "Demolizioni e scavi", murature: "Opere murarie", strutture: "Strutture in cemento armato", cartongesso: "Cartongesso", intonaci: "Intonaci e rasature",
  pavimenti: "Pavimenti e rivestimenti", tinteggiatura: "Tinteggiatura", cappotto: "Cappotto e isolamento", tetto: "Tetti e impermeabilizzazioni",
  infissi: "Infissi e serramenti", carpenteria: "Carpenteria e ferro", ponteggi: "Ponteggi",
  imp_elettrico: "Impianto elettrico", imp_idraulico: "Impianto idraulico", imp_termico: "Riscaldamento e climatizzazione", imp_fotovoltaico: "Fotovoltaico", imp_gas: "Impianto gas",
};
const MOTIVI: Record<string, string> = { prezzo: "prezzo", tempi: "tempi", voci_mancanti: "voci mancanti", fiducia: "scelta una ditta di fiducia", annullato: "lavoro rinviato o annullato" };
// deno-lint-ignore no-explicit-any
async function giroCantieri(admin: any, db: any, riepilogo: boolean) {
  const esito = { mail: 0, allargate: 0, errori: [] as string[] };
  const prova = async (fn: () => Promise<void>) => { try { await fn(); } catch (e) { esito.errori.push(String((e as Error).message || e)); } };
  const mailDi = async (id: string) => { const { data: u } = await admin.auth.admin.getUserById(id); return u?.user?.email || ""; };
  const nomi: Record<string, string> = {};
  const nomeDi = async (id: string) => {
    if (nomi[id] === undefined) {
      const { data: a } = await db.from("admins").select("id").eq("id", id).maybeSingle();
      const { data: p } = await db.from("profiles").select("nome").eq("id", id).maybeSingle();
      nomi[id] = a ? "AncheCasa" : p?.nome || "Un'azienda AncheCasa";
    }
    return nomi[id];
  };
  const pagina = async (id: string) => { const { data: a } = await db.from("admins").select("id").eq("id", id).maybeSingle(); return `${SITO}/dashboard/#/${a ? "admin" : "azienda"}/cnt_cantieri`; };
  const perMe = `${SITO}/dashboard/#/azienda/cnt_perme`;
  const ric: Record<string, Record<string, unknown>> = {};
  const richiesta = async (id: string) => {
    if (!ric[id]) {
      const { data: r } = await db.from("cantiere_richieste").select("*").eq("id", id).maybeSingle();
      const { data: c } = r ? await db.from("cantieri").select("*").eq("id", r.cantiere_id).maybeSingle() : { data: null };
      ric[id] = Object.assign({}, r || {}, { comune: c?.comune || "", regione: c?.regione || "" });
    }
    return ric[id] as Record<string, string & boolean & { servizio: string }[]>;
  };
  const dataIt = (d: string) => (d ? new Date(d).toLocaleDateString("it-IT") : "");

  // 1. Dopo 48 ore senza offerte: la richiesta si allarga alla regione (nel database) e la rete della regione riceve la mail.
  await prova(async () => {
    const { data, error } = await db.rpc("cantieri_giro");
    if (error) throw error;
    esito.allargate = Number(data) || 0;
    const { data: righe } = await db.from("cantiere_richieste").select("id").not("allargata_il", "is", null).is("avvisato_rete", null).limit(50);
    for (const x of righe || []) {
      const r = await richiesta(x.id);
      const servizi = [...new Set(((r.voci as unknown as { servizio: string }[]) || []).map((v) => SERVIZI[v.servizio] || v.servizio))].join(", ");
      const { data: rete } = await db.from("app_rete").select("utente").eq("regione", r.regione).eq("stato", "attivo").in("ruolo", ["agente", "subagente", "capoarea"]);
      for (const p of rete || []) {
        const a = await mailDi(p.utente);
        if (a) { await manda(a, mailCantieri("rete", { link: `${SITO}/dashboard/#/agente/inviti`, titolo: r.titolo, comune: r.comune, servizi })); esito.mail++; }
      }
      await db.from("cantiere_richieste").update({ avvisato_rete: new Date().toISOString() }).eq("id", x.id);
    }
  });

  // 2. Aziende invitate: subito se urgente, se invitata per nome o dalla ricerca; le altre nel riepilogo del giorno.
  await prova(async () => {
    const { data: inv, error } = await db.from("cantiere_invitati").select("*").is("avvisato_il", null).gt("creato", fa(15)).limit(500);
    if (error) throw error;
    const riep: Record<string, string[]> = {};
    for (const i of inv || []) {
      const r = await richiesta(i.richiesta_id);
      if (r.stato !== "aperta") { await db.from("cantiere_invitati").update({ avvisato_il: new Date().toISOString() }).eq("richiesta_id", i.richiesta_id).eq("azienda_id", i.azienda_id); continue; }
      const subito = r.urgente || i.motivo === "invito" || i.motivo === "cerca";
      if (!subito && !riepilogo) continue;
      if (subito) {
        const a = await mailDi(i.azienda_id);
        if (a) { await manda(a, mailCantieri("invito", { link: perMe, chi: await nomeDi(r.azienda_id), titolo: r.titolo, comune: r.comune, scadenza: dataIt(r.scadenza), urgente: !!r.urgente })); esito.mail++; }
      } else {
        (riep[i.azienda_id] = riep[i.azienda_id] || []).push(r.titolo + (r.comune ? " · " + r.comune : "") + " (" + (await nomeDi(r.azienda_id)) + ")");
      }
      await db.from("cantiere_invitati").update({ avvisato_il: new Date().toISOString() }).eq("richiesta_id", i.richiesta_id).eq("azienda_id", i.azienda_id);
    }
    for (const id of Object.keys(riep)) {
      const a = await mailDi(id);
      if (a) { await manda(a, mailCantieri("riepilogo", { link: perMe, elenco: riep[id] })); esito.mail++; }
    }
  });

  // 3. Ditte di fiducia non iscritte: invito a iscriversi.
  await prova(async () => {
    const { data: righe } = await db.from("cantiere_inviti_mail").select("*").is("avvisato_il", null).limit(200);
    for (const x of righe || []) {
      const r = await richiesta(x.richiesta_id);
      await manda(x.email, mailCantieri("esterno", { link: `${SITO}/iscriviti.html`, chi: await nomeDi(r.azienda_id), titolo: r.titolo, comune: r.comune }));
      await db.from("cantiere_inviti_mail").update({ avvisato_il: new Date().toISOString() }).eq("id", x.id);
      esito.mail++;
    }
  });

  // 4. Offerte: nuova → a chi ha chiesto; scelta o non scelta → a chi ha offerto, con il motivo.
  await prova(async () => {
    const { data: righe } = await db.from("cantiere_offerte").select("*").gt("creato", fa(60)).limit(500);
    for (const o of righe || []) {
      const r = await richiesta(o.richiesta_id);
      if (o.avvisato === "" && o.stato === "inviata") {
        const a = await mailDi(r.azienda_id);
        if (a) { await manda(a, mailCantieri("offerta", { link: await pagina(r.azienda_id), chi: await nomeDi(o.azienda_id), titolo: r.titolo })); esito.mail++; }
        await db.from("cantiere_offerte").update({ avvisato: "inviata" }).eq("id", o.id);
      } else if (o.stato !== "inviata" && o.avvisato !== o.stato) {
        const a = await mailDi(o.azienda_id);
        const scelta = o.stato === "scelta" || o.stato === "parziale";
        if (a) { await manda(a, mailCantieri(scelta ? "scelta" : "non_scelta", { link: perMe, chi: await nomeDi(r.azienda_id), titolo: r.titolo, motivo: MOTIVI[o.motivo] || o.motivo, nota: o.motivo_nota })); esito.mail++; }
        await db.from("cantiere_offerte").update({ avvisato: o.stato }).eq("id", o.id);
      }
    }
  });

  // 5. Domande → a chi ha chiesto; risposte → a chi ha fatto la domanda.
  await prova(async () => {
    const { data: righe } = await db.from("cantiere_domande").select("*").gt("creato", fa(60)).limit(500);
    for (const q of righe || []) {
      const r = await richiesta(q.richiesta_id);
      if (q.avvisato === "") {
        const a = await mailDi(r.azienda_id);
        if (a) { await manda(a, mailCantieri("domanda", { link: await pagina(r.azienda_id), titolo: r.titolo, testo: (q.sopralluogo ? "Chiede un sopralluogo. " : "") + q.testo })); esito.mail++; }
        await db.from("cantiere_domande").update({ avvisato: "domanda" }).eq("id", q.id);
      } else if (q.risposta && q.avvisato !== "risposta") {
        const a = await mailDi(q.azienda_id);
        if (a) { await manda(a, mailCantieri("risposta", { link: perMe, titolo: r.titolo, testo: q.risposta })); esito.mail++; }
        await db.from("cantiere_domande").update({ avvisato: "risposta" }).eq("id", q.id);
      }
    }
  });
  return esito;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Solo POST." }, 405);
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return json({ error: "Richiesta non valida." }, 400); }
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });
  const db = admin.schema("marketplace");

  try {
    if (body.evento === "giornaliero") return json(Object.assign(await giornaliero(admin, db), { cantieri: await giroCantieri(admin, db, true) }));
    if (body.evento === "guasti") return json(Object.assign(await giroGuasti(admin, db), { imprese: await giroImprese(admin, db), cantieri: await giroCantieri(admin, db, false) }));
    if (body.evento === "cantieri") return json(await giroCantieri(admin, db, false));
    if (body.evento === "imprese") return json(await giroImprese(admin, db));

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
      let ammesse = forn || [];
      if (r.categoria === "lavori") {
        // Piccoli lavori: solo imprese con documenti verificati e prova o abbonamento attivo (app-23).
        const oggi = new Date().toISOString().slice(0, 10);
        const { data: st } = await db.from("aziende_stato").select("*").in("azienda_id", ammesse.map((f) => f.id)).eq("documenti_ok", true);
        const ok = new Set((st || []).filter((x) => (x.attiva_fino && x.attiva_fino >= oggi) || new Date(new Date(x.prova_dal).getTime() + 13 * GIORNO).toISOString().slice(0, 10) >= oggi).map((x) => x.azienda_id));
        ammesse = ammesse.filter((f) => ok.has(f.id));
      }
      const { data: zone } = await db.from("fornitori_zona").select("*").in("azienda_id", ammesse.map((f) => f.id));
      const zonaDi: Record<string, { sede_comune: string; sede_provincia: string; province: string[] }> = {};
      (zone || []).forEach((z) => { zonaDi[z.azienda_id] = z; });
      let elenco = ammesse.map((f) => {
        const z = zonaDi[f.id];
        if (!z) return null;
        const copre = (z.province || []).length ? z.province.includes(r.provincia) : z.sede_provincia === r.provincia;
        if (!copre) return null;
        if (r.categoria === "casa" && !(TIPI_CASA[f.tipo_azienda] || []).includes(r.tipo)) return null;
        const v = z.sede_comune && r.comune && z.sede_comune.trim().toLowerCase() === r.comune.trim().toLowerCase() ? 0 : z.sede_provincia === r.provincia ? 1 : 2;
        return { id: f.id, v };
      }).filter(Boolean).sort((a, b) => a!.v - b!.v);
      if (r.categoria === "lavori") {
        elenco = elenco.slice(0, 5);
        // L'admin è sempre avvisato: può lasciarla alle imprese o passarla a una ristrutturazione (agente).
        await manda(ADMIN_MAIL, mailImprese("lavori-admin", { link: `${SITO}/dashboard/#/admin/ristrutturazioni-admin`, nome: r.nome, comune: r.comune, descrizione: r.nota })).catch(() => {});
        await db.from("prev_richieste").update({ avvisato_admin: new Date().toISOString() }).eq("id", r.id);
      }
      const cosa = r.categoria === "casa" ? String(r.tipo) : r.categoria === "lavori" ? String(r.tipo || "") + (r.nota ? " · " + String(r.nota).slice(0, 120) : "") : righeTxt(r.righe);
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
