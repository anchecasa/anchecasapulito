/* Subappalti, pagamenti su misura, Profit Guard, preventivo ufficiale (parte 12, 11.10.2026).
   - vero: tabelle e funzioni SQL di app-12, funzione Supabase «subappalti-mail» per le mail;
   - prova: tutto simulato nel browser (le mail non partono: si vede il link che avrebbe ricevuto il fornitore). */
import { DB } from "./db.js";
import { Q } from "./q.js";
import { FE } from "./fe-api.js";

const PROVA = DB.prova;
const adesso = () => new Date().toISOString();
const oggi = () => new Date().toISOString().slice(0, 10);
const tondo = (n) => Math.round((Number(n) || 0) * 100) / 100;
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "x-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
const io = () => DB.idUtente();

export const PAGAMENTI_PROPOSTA = [
  { descrizione: "Acconto a inizio lavori", evento: "", tipo: "perc", valore: 30 },
  { descrizione: "SAL intermedio", evento: "", tipo: "perc", valore: 30 },
  { descrizione: "Collaudo", evento: "", tipo: "perc", valore: 40 },
];
export const ERRORI_PAG = {
  pagamenti_vuoti: "Aggiungi almeno un pagamento.", pagamenti_troppi: "Al massimo 30 pagamenti.", pagamento_senza_descrizione: "Ogni pagamento ha bisogno di una descrizione.",
  pagamento_testo_lungo: "Descrizione troppo lunga.", percentuale_non_valida: "Percentuale tra 0 e 100.", importo_non_valido: "Importo maggiore di zero.",
  tipo_pagamento_non_valido: "Tipo di pagamento non valido.", un_solo_saldo: "Il saldo può essere uno solo.", con_importi_fissi_serve_il_saldo: "Con un importo fisso serve una riga «saldo» che prende il resto.",
  percentuali_non_fanno_100: "Senza saldo, le percentuali devono fare 100%.", percentuali_oltre_100: "Con il saldo, le percentuali devono stare sotto il 100%.",
  numero_non_valido: "Numero non valido.", importi_fissi_oltre_il_totale: "Gli importi fissi superano il totale.",
};

/** Stesse regole della funzione SQL app_milestone_errore. */
export function errorePagamenti(p) {
  if (!Array.isArray(p) || !p.length) return "pagamenti_vuoti";
  if (p.length > 30) return "pagamenti_troppi";
  let saldo = 0, perc = 0, imp = 0;
  for (const r of p) {
    if (String(r.descrizione || "").trim().length < 2) return "pagamento_senza_descrizione";
    if (String(r.descrizione).length > 200 || String(r.evento || "").length > 200) return "pagamento_testo_lungo";
    const v = Number(r.valore);
    if (r.tipo === "saldo") saldo++;
    else if (r.tipo === "perc") { if (!(v > 0 && v <= 100)) return "percentuale_non_valida"; perc += v; }
    else if (r.tipo === "importo") { if (!(v > 0)) return "importo_non_valido"; imp++; }
    else return "tipo_pagamento_non_valido";
  }
  perc = Math.round(perc * 100) / 100;
  if (saldo > 1) return "un_solo_saldo";
  if (!saldo && imp) return "con_importi_fissi_serve_il_saldo";
  if (!saldo && perc !== 100) return "percentuali_non_fanno_100";
  if (saldo && perc >= 100) return "percentuali_oltre_100";
  return null;
}
/** Stesse regole di app_milestone_quote: importi in euro per un totale. */
export function quote(p, totale) {
  const e = errorePagamenti(p); if (e) throw new Error(e);
  let usato = 0, iSaldo = -1;
  const out = p.map((r, i) => {
    const q = r.tipo === "perc" ? tondo(totale * Number(r.valore) / 100) : r.tipo === "importo" ? tondo(r.valore) : null;
    if (q == null) iSaldo = i; else usato = tondo(usato + q);
    return { n: i + 1, descrizione: String(r.descrizione).trim(), evento: r.evento || "", tipo: r.tipo, valore: r.tipo === "saldo" ? null : Number(r.valore), importo: q };
  });
  if (iSaldo >= 0) { if (totale - usato < 0) throw new Error("importi_fissi_oltre_il_totale"); out[iSaldo].importo = tondo(totale - usato); }
  else if (usato !== tondo(totale)) out[out.length - 1].importo = tondo(out[out.length - 1].importo + totale - usato);
  return out;
}

const pulisci = (p) => (p || []).map((r) => ({ descrizione: String(r.descrizione || "").trim(), evento: String(r.evento || "").trim(), tipo: r.tipo, valore: r.tipo === "saldo" ? null : Number(r.valore) }));

/* ======================================================================== */
/* PROVA: Profit Guard calcolato nel browser con le stesse regole           */
/* ======================================================================== */
async function provaPrezzo(lav, regione) {
  const rf = (await Q.sel("app_stima_riferimenti", { eq: { lavorazione: lav, regione } }))[0];
  if (!rf) return null;
  const pz = await Q.uno("app_prezzari", { id: rf.prezzario });
  if (!pz || !pz.attivo) return null;
  const v = await Q.uno("app_prezzari_voci", { prezzario: rf.prezzario, codice: rf.codice });
  return v ? Number(v.prezzo) : null;
}
async function provaPG(id) {
  const s = await Q.uno("app_sopralluoghi", { id });
  const c = (await Q.uno("app_computi", { sopralluogo: id })) || {};
  let lavori = 0; const senza = [];
  for (const r of s.computo || []) {
    const p = r.prezzo !== undefined && r.prezzo !== "" && r.prezzo !== null ? Number(r.prezzo) : await provaPrezzo(r.lavorazione, s.regione);
    if (p == null) { senza.push(r.descrizione || r.lavorazione); continue; }
    lavori = tondo(lavori + tondo(p * (Number(r.quantita) || 0)));
  }
  const piani = tondo(lavori * (Number(c.piano_perc) || 0) / 100);
  const ztl = c.ztl ? Number(c.ztl_costo) || 0 : 0;
  const smalt = (c.smaltimento || []).reduce((a, x) => tondo(a + tondo((Number(x.tonnellate) || 0) * (Number(x.prezzo_t) || 0))), 0);
  const sic = c.sicurezza_importo != null && c.sicurezza_importo !== "" ? Number(c.sicurezza_importo) : tondo((lavori + piani) * (Number(c.sicurezza_perc) || 0) / 100);
  const ricavo = tondo(lavori + piani + ztl + smalt + sic);
  const ric = await Q.sel("app_sub_richieste", { eq: { sopralluogo: id } });
  let sub = 0, subN = 0;
  for (const r of ric) for (const o of await Q.sel("app_sub_offerte", { eq: { richiesta: r.id, stato: "approvata" } })) { sub = tondo(sub + Number(o.importo)); subN++; }
  const spese = tondo(ricavo * (Number(c.spese_generali_perc) || 0) / 100);
  const costi = tondo(sub + (Number(c.costi_interni) || 0) + spese + sic + ztl + smalt);
  const mon = tondo(ricavo - costi), perc = ricavo > 0 ? Math.round(mon / ricavo * 1000) / 10 : null;
  const imp = await Q.uno("app_impostazioni", { chiave: "profit_guard" });
  const soglia = imp && imp.valore && imp.valore.margine_minimo != null ? Number(imp.valore.margine_minimo) : null;
  const sem = ricavo <= 0 ? "grigio" : mon < 0 ? "rosso" : soglia == null ? "grigio" : perc >= soglia ? "verde" : "giallo";
  return { ricavi: { lavori, piani, ztl, smaltimento: smalt, sicurezza: sic, totale: ricavo }, costi: { subappalti: sub, subappalti_n: subN, interni: Number(c.costi_interni) || 0, spese_generali: spese, passanti: tondo(sic + ztl + smalt), totale: costi },
    mon, mon_perc: perc, soglia, semaforo: sem, richieste_aperte: ric.filter((r) => r.stato === "aperta").length, senza_prezzo: senza, blindato: !!c.blindato_il, preventivo: s.preventivo };
}
async function provaMilestone(chiave, id, p) {
  await Q.del("app_milestone", { [chiave]: id });
  if (p.length) await Q.ins("app_milestone", pulisci(p).map((r, i) => Object.assign({ id: uuid(), richiesta: null, documento: null, offerta: null, n: i + 1 }, { [chiave]: id }, r)));
}
async function provaCondizioni(doc) {
  const d = await FE.documento(doc);
  const p = await SB.milestone({ documento: doc });
  if (!p.length) return;
  const testo = "Pagamenti:\n" + quote(p, Number(d.totale)).map((x) => `${x.n}) ${x.descrizione}${x.evento ? " – " + x.evento : ""}: ${x.importo.toFixed(2).replace(".", ",")} € (${x.tipo === "perc" ? String(x.valore).replace(".", ",") + "%" : x.tipo === "importo" ? "importo fisso" : "saldo"})`).join("\n");
  const resto = String(d.condizioni || "").startsWith("Pagamenti:") ? (String(d.condizioni).split("\n\n").slice(1).join("\n\n")) : String(d.condizioni || "");
  await Q.upd("app_fe_documenti", { id: doc }, { condizioni: (testo + (resto ? "\n\n" + resto : "")).slice(0, 2000) });
}

/* ======================================================================== */
/* API usata dalle viste                                                     */
/* ======================================================================== */
export const SB = {
  prova: PROVA,

  /* --- costi del computo e Profit Guard --- */
  computo: (id) => Q.uno("app_computi", { sopralluogo: id }),
  async salvaComputo(id, d) {
    const campi = ["sicurezza_perc", "sicurezza_importo", "ztl", "ztl_costo", "piano", "ascensore", "piano_perc", "smaltimento", "spese_generali_perc", "costi_interni", "note"];
    const riga = {}; campi.forEach((k) => { if (d[k] !== undefined) riga[k] = d[k]; });
    (riga.smaltimento || []).forEach((x) => { if (!/^\d{2} \d{2} \d{2}\*?$/.test(String(x.cer || ""))) throw new Error("codice_cer_non_valido"); });
    const c = await Q.uno("app_computi", { sopralluogo: id });
    if (c && c.blindato_il) throw new Error("preventivo_blindato");
    if (c) await Q.upd("app_computi", { sopralluogo: id }, riga); else await Q.ins("app_computi", Object.assign({ sopralluogo: id }, riga));
  },
  profitGuard: (id) => (PROVA ? provaPG(id) : Q.rpc("app_profit_guard", { p_sopralluogo: id })),
  async soglia() { const r = await Q.uno("app_impostazioni", { chiave: "profit_guard" }); return r && r.valore && r.valore.margine_minimo != null ? Number(r.valore.margine_minimo) : null; },
  async salvaSoglia(v) {
    const valore = { margine_minimo: v === "" || v == null ? null : Number(v) };
    if (await Q.uno("app_impostazioni", { chiave: "profit_guard" })) await Q.upd("app_impostazioni", { chiave: "profit_guard" }, { valore }); else await Q.ins("app_impostazioni", { chiave: "profit_guard", valore });
  },

  /* --- pagamenti su misura --- */
  async milestone(dove) {
    const r = await Q.sel("app_milestone", { eq: dove, ord: ["n", true], lim: 50 });
    return r.map((x) => ({ descrizione: x.descrizione, evento: x.evento || "", tipo: x.tipo, valore: x.valore == null ? null : Number(x.valore) }));
  },
  async pagamentiPreventivo(doc, p) {
    if (!PROVA) return Q.rpc("app_milestone_preventivo", { p_documento: doc, p: pulisci(p) });
    const d = await FE.documento(doc);
    if (d.stato_preventivo === "accettato") throw new Error("preventivo_gia_accettato");
    const q = quote(p, Number(d.totale));
    await provaMilestone("documento", doc, p); await provaCondizioni(doc);
    return q;
  },

  /* --- richieste di subappalto --- */
  richieste: (sopralluogo) => Q.sel("app_sub_richieste", { eq: { sopralluogo }, ord: ["creato", false] }),
  richiesta: (id) => Q.uno("app_sub_richieste", { id }),
  async crea(s, r, pagamenti) {
    if (!PROVA) return Q.rpc("app_sub_crea", { p_sopralluogo: s, p_titolo: r.titolo, p_descrizione: r.descrizione, p_voci: r.voci, p_mestiere: r.mestiere, p_scadenza: r.scadenza, p_pagamenti: pulisci(pagamenti) });
    const e = errorePagamenti(pagamenti); if (e) throw new Error(e);
    if (!r.scadenza || r.scadenza < oggi()) throw new Error("scadenza_non_valida");
    const so = await Q.uno("app_sopralluoghi", { id: s });
    const c = await Q.uno("app_computi", { sopralluogo: s });
    if (c && c.blindato_il) throw new Error("preventivo_blindato");
    const id = uuid();
    await Q.ins("app_sub_richieste", { id, org: so.org, sopralluogo: s, titolo: r.titolo, descrizione: r.descrizione || "", voci: r.voci || [], mestiere: r.mestiere || "", comune: so.comune || "", scadenza: r.scadenza, stato: "aperta", creato_da: io(), creato: adesso() });
    await provaMilestone("richiesta", id, pagamenti);
    return id;
  },
  async annulla(id) {
    if (!PROVA) return Q.rpc("app_sub_annulla", { p_richiesta: id });
    await Q.upd("app_sub_richieste", { id }, { stato: "annullata" });
    for (const o of await Q.sel("app_sub_offerte", { eq: { richiesta: id } })) if (["in_revisione", "in_trattativa"].includes(o.stato)) await Q.upd("app_sub_offerte", { id: o.id }, { stato: "rifiutata", nota_admin: "Richiesta annullata" });
  },
  inviti: (richiesta) => Q.sel("app_sub_inviti", { eq: { richiesta }, ord: ["creato", true], lim: 200 }),
  offerte: (richiesta) => Q.sel("app_sub_offerte", { eq: { richiesta }, ord: ["importo", true], lim: 200 }),
  async daRivedere() {
    const [a, b] = await Promise.all([Q.sel("app_sub_offerte", { eq: { stato: "in_revisione" }, lim: 300 }), Q.sel("app_sub_offerte", { eq: { stato: "in_trattativa" }, lim: 300 })]);
    return a.concat(b);
  },

  /* --- fornitori --- */
  async fornitoriRete() {
    if (!PROVA) return Q.rpc("app_fornitori_rete");
    return (await Q.sel("app_org")).filter((o) => o.stato === "attiva" && ["impresa", "partner", "fornitore"].includes(o.tipo) && o.email).map((o) => ({ id: o.id, nome: o.nome, citta: o.citta, tipo: o.tipo, email: o.email }));
  },
  fornitoriZona: (org) => Q.sel("app_fornitori_zona", { eq: { org }, ord: ["creato", false], lim: 300 }),
  fornitoriProposti: (sopralluogo) => Q.sel("app_fornitori_zona", { eq: { sopralluogo }, ord: ["creato", false], lim: 100 }),
  async proponi(r) {
    const riga = { org: r.org, sopralluogo: r.sopralluogo, nome: r.nome || "", ditta: r.ditta, mestiere: r.mestiere || "", email: String(r.email || "").trim().toLowerCase(), telefono: r.telefono || "", comune: r.comune || "", note: "" };
    if (PROVA) Object.assign(riga, { id: uuid(), proposto_da: io(), creato: adesso() });
    return Q.ins("app_fornitori_zona", riga);
  },
  togliProposto: (id) => Q.del("app_fornitori_zona", { id }),

  /* --- mail (funzione «subappalti-mail») --- */
  async invita(richiesta, destinatari) {
    if (!PROVA) return Q.funzione("subappalti-mail", { azione: "invita", richiesta, destinatari });
    const gia = await Q.sel("app_sub_inviti", { eq: { richiesta } });
    const stop = (await Q.sel("app_mail_stop")).map((x) => x.email);
    const esito = { ok: true, inviate: 0, gia_invitati: 0, bloccate: 0, errori: 0, prova: [] };
    for (const d of destinatari) {
      const email = String(d.email || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
      if (gia.some((x) => x.email === email)) { esito.gia_invitati++; continue; }
      const bloccata = stop.includes(email);
      const i = { id: uuid(), richiesta, token: uuid(), email, nome: d.nome || "", ditta: d.ditta || "", telefono: d.telefono || "", rete_org: d.rete_org || null, origine: d.origine === "rete" ? "rete" : "territorio",
        invitato_da: io(), stato_mail: bloccata ? "bloccata" : "inviata", mail_errore: "", inviata_il: bloccata ? null : adesso(), aperto_il: null, creato: adesso() };
      await Q.ins("app_sub_inviti", i); gia.push(i);
      if (bloccata) esito.bloccate++; else { esito.inviate++; esito.prova.push({ email, token: i.token }); }
    }
    return esito;
  },
  reinvia: (invito) => (PROVA ? Q.upd("app_sub_inviti", { id: invito }, { stato_mail: "inviata", inviata_il: adesso() }) : Q.funzione("subappalti-mail", { azione: "reinvia", invito })),

  /* --- decisioni dell'amministrazione --- */
  async decidi(offerta, decisione, nota) {
    let pg;
    if (!PROVA) pg = await Q.rpc("app_offerta_decidi", { p_offerta: offerta, p_decisione: decisione, p_nota: nota || "" });
    else {
      const o = await Q.uno("app_sub_offerte", { id: offerta });
      const r = await Q.uno("app_sub_richieste", { id: o.richiesta });
      if (["approvata", "rifiutata"].includes(o.stato)) throw new Error("offerta_gia_decisa");
      if (decisione === "in_trattativa" && String(nota || "").trim().length < 3) throw new Error("scrivi_cosa_negoziare");
      if (decisione === "approvata") {
        const c = await Q.uno("app_computi", { sopralluogo: r.sopralluogo });
        if (c && c.blindato_il) throw new Error("preventivo_blindato");
        const pag = o.accetta_pagamenti ? await SB.milestone({ richiesta: r.id }) : await SB.milestone({ offerta: o.id });
        await Q.upd("app_sub_offerte", { id: offerta }, { stato: "approvata", nota_admin: nota || "", deciso_da: io(), deciso_il: adesso(), piano_pagamenti: quote(pag, Number(o.importo)) });
        for (const x of await Q.sel("app_sub_offerte", { eq: { richiesta: r.id } })) if (x.id !== offerta && ["in_revisione", "in_trattativa"].includes(x.stato)) await Q.upd("app_sub_offerte", { id: x.id }, { stato: "rifiutata", nota_admin: "Assegnata a un altro fornitore" });
        await Q.upd("app_sub_richieste", { id: r.id }, { stato: "assegnata" });
      } else await Q.upd("app_sub_offerte", { id: offerta }, { stato: decisione, nota_admin: nota || "", deciso_da: io(), deciso_il: adesso() });
      pg = await provaPG(r.sopralluogo);
    }
    let mail = null;
    try { mail = PROVA ? { ok: true, prova: true } : await Q.funzione("subappalti-mail", { azione: "esito", offerta }); } catch (e) { mail = { error: String(e.message || e) }; }
    return { pg, mail };
  },
  async preventivoUfficiale(id, forza, nota) {
    if (!PROVA) return Q.rpc("app_preventivo_ufficiale", { p_sopralluogo: id, p_forza: !!forza, p_nota: nota || "" });
    const s = await Q.uno("app_sopralluoghi", { id });
    if (!s.computo_validato || !(s.computo || []).length) throw new Error("computo_da_validare");
    const c = (await Q.uno("app_computi", { sopralluogo: id })) || {};
    if (c.blindato_il) return s.preventivo;
    const pg = await provaPG(id);
    if (pg.richieste_aperte > 0) throw new Error("subappalti_aperti");
    if (pg.senza_prezzo.length) throw new Error("voci_senza_prezzo");
    if (pg.semaforo !== "verde" && !forza) throw new Error("margine_da_confermare");
    if (pg.semaforo !== "verde" && String(nota || "").trim().length < 5) throw new Error("scrivi_perche_forzi");
    const pid = s.preventivo || await FE.aPreventivo(id);
    const lav = await Q.sel("app_stima_lavorazioni", { lim: 500 });
    const righe = [];
    for (const r of s.computo) righe.push({ descrizione: r.descrizione || r.lavorazione, quantita: Number(r.quantita) || 1, um: r.um || "", prezzo: r.prezzo !== undefined && r.prezzo !== "" && r.prezzo !== null ? Number(r.prezzo) : await provaPrezzo(r.lavorazione, s.regione), aliquota: ((lav.find((l) => l.chiave === r.lavorazione) || {}).aliquota) || 10 });
    if (pg.ricavi.piani > 0) righe.push({ descrizione: "Maggiorazione per trasporto ai piani" + (c.piano != null ? ` (piano ${c.piano}${c.ascensore ? ", con ascensore" : c.ascensore === false ? ", senza ascensore" : ""})` : ""), quantita: 1, um: "corpo", prezzo: pg.ricavi.piani, aliquota: 10 });
    if (pg.ricavi.ztl > 0) righe.push({ descrizione: "Accesso in ZTL: permessi e logistica", quantita: 1, um: "corpo", prezzo: pg.ricavi.ztl, aliquota: 10 });
    (c.smaltimento || []).forEach((x) => { if (Number(x.tonnellate) > 0 && Number(x.prezzo_t) > 0) righe.push({ descrizione: "Trasporto e smaltimento rifiuti CER " + x.cer + (x.descrizione ? " · " + x.descrizione : ""), quantita: Number(x.tonnellate), um: "t", prezzo: Number(x.prezzo_t), aliquota: 10 }); });
    if (pg.ricavi.sicurezza > 0) righe.push({ descrizione: "Oneri della sicurezza (D.Lgs. 81/08), non soggetti a ribasso", quantita: 1, um: "corpo", prezzo: pg.ricavi.sicurezza, aliquota: 10 });
    await FE.salva({ id: pid }, righe);
    await provaCondizioni(pid);
    const nuova = Object.assign({}, c, { blindato_il: adesso(), blindato_da: io(), note: (c.note || "") + (forza && pg.semaforo !== "verde" ? "\nApprovato sotto soglia: " + nota : "") });
    if (await Q.uno("app_computi", { sopralluogo: id })) await Q.upd("app_computi", { sopralluogo: id }, nuova); else await Q.ins("app_computi", Object.assign({ sopralluogo: id }, nuova));
    return pid;
  },

  /* --- portale del fornitore (senza password) --- */
  async invitoLeggi(tok) {
    if (!PROVA) return Q.rpc("app_invito_leggi", { p_token: tok });
    const i = (await Q.sel("app_sub_inviti", { eq: { token: tok } }))[0];
    if (!i) return { trovato: false };
    const r = await Q.uno("app_sub_richieste", { id: i.richiesta });
    const o = (await Q.sel("app_sub_offerte", { eq: { invito: i.id } }))[0];
    if (!i.aperto_il) await Q.upd("app_sub_inviti", { id: i.id }, { aperto_il: adesso() });
    const org = await Q.uno("app_org", { id: r.org });
    return { trovato: true, ditta: org ? org.nome : "", titolo: r.titolo, descrizione: r.descrizione, voci: r.voci, mestiere: r.mestiere, comune: r.comune, scadenza: r.scadenza, stato: r.stato,
      aperta: r.stato === "aperta" && r.scadenza >= oggi(), pagamenti: await SB.milestone({ richiesta: r.id }), invitato: { nome: i.nome, ditta: i.ditta },
      bloccato: !!(await Q.uno("app_mail_stop", { email: i.email })),
      offerta: o ? { importo: o.importo, ditta: o.ditta, tempi_giorni: o.tempi_giorni, note: o.note, stato: o.stato, accetta_pagamenti: o.accetta_pagamenti, controproposta: await SB.milestone({ offerta: o.id }), nota_admin: ["in_trattativa", "rifiutata"].includes(o.stato) ? o.nota_admin : "", piano_pagamenti: o.piano_pagamenti } : null };
  },
  async invitoOfferta(tok, o) {
    if (!PROVA) return Q.rpc("app_invito_offerta", { p_token: tok, p_importo: o.importo, p_tempi: o.tempi || null, p_note: o.note || "", p_ditta: o.ditta, p_piva: o.piva || "", p_accetto: !!o.accetto, p_controproposta: o.accetto ? null : pulisci(o.controproposta) });
    const i = (await Q.sel("app_sub_inviti", { eq: { token: tok } }))[0];
    if (!i) throw new Error("invito_non_trovato");
    const r = await Q.uno("app_sub_richieste", { id: i.richiesta });
    if (r.stato !== "aperta" || r.scadenza < oggi()) throw new Error("richiesta_chiusa");
    if (!(Number(o.importo) > 0)) throw new Error("importo_non_valido");
    if (String(o.ditta || "").trim().length < 2) throw new Error("manca_la_ditta");
    const pag = o.accetto ? await SB.milestone({ richiesta: r.id }) : o.controproposta;
    if (!o.accetto) { const e = errorePagamenti(pag); if (e) throw new Error(e); }
    quote(pag, Number(o.importo));
    const gia = (await Q.sel("app_sub_offerte", { eq: { invito: i.id } }))[0];
    if (gia && !["in_revisione", "in_trattativa"].includes(gia.stato)) throw new Error("offerta_gia_decisa");
    const riga = { richiesta: r.id, invito: i.id, importo: tondo(o.importo), tempi_giorni: o.tempi ? Number(o.tempi) : null, note: o.note || "", ditta: String(o.ditta).trim(), piva: o.piva || "", accetta_pagamenti: !!o.accetto, stato: "in_revisione", aggiornato: adesso() };
    let id;
    if (gia) { await Q.upd("app_sub_offerte", { id: gia.id }, riga); id = gia.id; } else { id = uuid(); await Q.ins("app_sub_offerte", Object.assign({ id, nota_admin: "", piano_pagamenti: null, creato: adesso() }, riga)); }
    await provaMilestone("offerta", id, o.accetto ? [] : o.controproposta);
    return "in_revisione";
  },
  async invitoStop(tok) {
    if (!PROVA) return Q.rpc("app_invito_stop", { p_token: tok });
    const i = (await Q.sel("app_sub_inviti", { eq: { token: tok } }))[0];
    if (!i) return false;
    if (!(await Q.uno("app_mail_stop", { email: i.email }))) await Q.ins("app_mail_stop", { email: i.email, il: adesso() });
    await Q.del("app_fornitori_zona", { email: i.email });
    return true;
  },
  linkOfferta: (tok) => location.origin + location.pathname + (PROVA ? "?prova" : "") + "#/offerta/" + tok,
};
