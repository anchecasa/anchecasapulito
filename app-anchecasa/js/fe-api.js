/* Fatture elettroniche, preventivi e sopralluoghi: accesso ai dati (parte 8 e 9 del database).
   - vero: tabelle app_fe_… e app_sopralluoghi, funzioni SQL e funzione Supabase «sdi-gateway»;
   - prova: le stesse cose simulate nel browser, con dati di ESEMPIO (nessun invio vero allo SdI). */
import { DB } from "./db.js";
import { Q } from "./q.js";
import { generaXml } from "./fe-xml.js";

const PROVA = DB.prova;
const adesso = () => new Date().toISOString();
const oggi = () => new Date().toISOString().slice(0, 10);
const nuovoId = (p) => (p || "x") + "-" + Math.random().toString(36).slice(2, 10);
const tondo = (n) => Math.round((Number(n) || 0) * 100) / 100;
const io = () => DB.idUtente();

/** Totali come li calcola il database: imponibile per aliquota (con lo sconto del documento), IVA arrotondata per aliquota. */
export function totali(righe, sconto) {
  const sc = (Number(sconto) || 0) / 100;
  const g = new Map();
  (righe || []).forEach((r) => {
    const t = tondo((Number(r.quantita) || 0) * (Number(r.prezzo) || 0) * (1 - (Number(r.sconto) || 0) / 100));
    const k = Number(r.aliquota) + "|" + (r.natura || "");
    const x = g.get(k) || { aliquota: Number(r.aliquota), natura: r.natura || null, somma: 0 };
    x.somma += t; g.set(k, x);
  });
  let imponibile = 0, iva = 0;
  const gruppi = [...g.values()].map((x) => {
    const imp = tondo(x.somma * (1 - sc)), imposta = tondo(imp * x.aliquota / 100);
    imponibile = tondo(imponibile + imp); iva = tondo(iva + imposta);
    return { aliquota: x.aliquota, natura: x.natura, imponibile: imp, imposta };
  });
  return { imponibile, iva, totale: tondo(imponibile + iva), gruppi };
}

/* ======================================================================== */
/* MOTORE PROVA: dati di esempio, una volta sola                              */
/* ======================================================================== */
async function semina() {
  if (!PROVA) return;
  const gia = await Q.sel("app_fe_piani", { lim: 1 });
  if (gia.length) return;
  await Q.ins("app_fe_piani", [
    { id: "pacchetto-50", nome: "Pacchetto 50 invii", tipo: "pacchetto", invii: 50, durata_giorni: 365, prezzo: null, prezzo_invio: null, attivo: true },
    { id: "pacchetto-200", nome: "Pacchetto 200 invii", tipo: "pacchetto", invii: 200, durata_giorni: 365, prezzo: null, prezzo_invio: null, attivo: true },
    { id: "abbonamento-anno", nome: "Abbonamento annuale (600 invii)", tipo: "abbonamento", invii: 600, durata_giorni: 365, prezzo: null, prezzo_invio: null, attivo: true },
    { id: "consumo", nome: "A consumo", tipo: "consumo", invii: null, durata_giorni: null, prezzo: null, prezzo_invio: null, attivo: true },
    { id: "interno", nome: "Società del gruppo (uso interno)", tipo: "abbonamento", invii: 100000, durata_giorni: 1100, prezzo: 0, prezzo_invio: null, attivo: true },
  ]);
  await Q.ins("app_fe_costi", [{ operazione: "invio_fe", costo: 0.05 }, { operazione: "stato", costo: 0 }, { operazione: "genera_xml", costo: 0 }, { operazione: "ricezione", costo: 0 }, { operazione: "verifica_piva", costo: 0 }]);
  await Q.ins("app_fe_profili", { org: "o-imp", denominazione: "Edil Esempio Srl", piva: "12345678903", cf: "", regime: "RF01", indirizzo: "Via dell'Esempio", civico: "10", cap: "00100", comune: "Roma", provincia: "RM", nazione: "IT", rea_ufficio: "", rea_numero: "", iban: "IT60X0542811101000000123456", pec: "", telefono: "000 000 0201", email: "info@esempio.it", logo: "", condizioni: "Pagamento: 30% all'accettazione, saldo a fine lavori.", gateway: "simulato", gateway_rif: "", gateway_segreto: "", aggiornato: adesso() });
  await Q.ins("app_fe_crediti", { id: nuovoId("cr"), org: "o-imp", piano: "pacchetto-50", invii_totali: 50, invii_usati: 3, prezzo_pagato: 0, prezzo_invio: null, valido_dal: oggi(), valido_al: null, stato: "attivo", note: "Esempio: prezzo da decidere", creato: adesso() });
  const cli = (await Q.sel("app_record", { eq: { org: "o-imp", tipo: "cliente" } }))[0];
  const cd = { denominazione: cli ? cli.titolo : "Condominio Via Verdi (esempio)", piva: "12345678903", codice_destinatario: "0000000", indirizzo: "Via Verdi", civico: "3", cap: "00100", comune: "Roma", provincia: "RM", nazione: "IT" };
  const so = nuovoId("so"), pr = nuovoId("fe"), ft = nuovoId("fe");
  await Q.ins("app_sopralluoghi", [
    { id: so, org: "o-imp", agente: "u-agente", tecnico: "", cliente: cli ? cli.id : null, cliente_dati: cd, quando: new Date(Date.now() - 9 * 864e5).toISOString(), indirizzo: "Via Verdi 3, Roma", lat: null, lng: null, lavori: "Rifacimento della facciata (esempio)", note: "Facciata 320 mq, intonaco da rifare sul lato strada.", foto: 0, stato: "convertito", preventivo: pr, cantiere: null, affare: null, creato: adesso(), aggiornato: adesso() },
    { id: nuovoId("so"), org: "o-imp", agente: "u-agente", tecnico: "", cliente: null, cliente_dati: { nome: "Anna", cognome: "Bianchi (esempio)", cf: "BNCNNA80A41H501X", telefono: "000 000 0303", indirizzo: "Via Roma", civico: "1", cap: "00100", comune: "Roma", provincia: "RM" }, quando: new Date(Date.now() + 2 * 864e5).toISOString(), indirizzo: "Via Roma 1, Roma", lat: null, lng: null, lavori: "Rifacimento bagno (esempio)", note: "", foto: 0, stato: "programmato", preventivo: null, cantiere: null, affare: null, creato: adesso(), aggiornato: adesso() },
  ]);
  const righe = [
    { descrizione: "Ponteggio", quantita: 1, um: "a corpo", prezzo: 3500, sconto: 0, aliquota: 10, natura: null },
    { descrizione: "Rifacimento intonaco", quantita: 320, um: "mq", prezzo: 35, sconto: 0, aliquota: 10, natura: null },
  ];
  const t = totali(righe, 0);
  const base = { org: "o-imp", sezionale: "", cliente: cli ? cli.id : null, cantiere: null, cliente_dati: cd, oggetto: "Rifacimento della facciata (esempio)", note: "", condizioni: "", pagamento: "MP05", sconto: 0, bollo: false, imponibile: t.imponibile, iva: t.iva, totale: t.totale, incassato: false, sopralluogo: so, sdi_file: null, xml: null, xml_sha256: null, esito: {}, consegnato: null, creato_da: "u-impresa", aggiornato: adesso() };
  await Q.ins("app_fe_documenti", [
    Object.assign({}, base, { id: pr, tipo: "preventivo", tipo_sdi: null, anno: 2026, numero: "1", data: new Date(Date.now() - 8 * 864e5).toISOString().slice(0, 10), validita_giorni: 30, scadenza_pagamento: null, stato_preventivo: "accettato", stato_sdi: "non_inviato", bloccato: false, origine: null, sdi_id: null, inviato: null, creato: adesso() }),
    Object.assign({}, base, { id: ft, tipo: "acconto", tipo_sdi: "TD02", anno: 2026, numero: "1", data: oggi(), validita_giorni: null, scadenza_pagamento: null, stato_preventivo: null, stato_sdi: "consegnato", bloccato: true, origine: pr, sdi_id: "SIM-ESEMPIO", sdi_file: "IT12345678903_00001.xml", inviato: adesso(), consegnato: adesso(), creato: adesso() }),
  ]);
  await Q.ins("app_fe_righe", righe.map((r, i) => Object.assign({ id: nuovoId("rg"), documento: pr, n: i + 1 }, r)).concat(righe.map((r, i) => Object.assign({ id: nuovoId("rg"), documento: ft, n: i + 1 }, r))));
  await Q.ins("app_fe_numeri", [{ org: "o-imp", anno: 2026, sezionale: "", tipo: "preventivo", ultimo: 1 }, { org: "o-imp", anno: 2026, sezionale: "", tipo: "fattura", ultimo: 1 }]);
  await Q.ins("app_fe_eventi", [{ id: nuovoId("ev"), documento: ft, tipo: "inviato", stato_sdi: "inviato", testo: "Inviata allo SdI tramite simulato (esempio).", dati: {}, creato: adesso() }, { id: nuovoId("ev"), documento: ft, tipo: "notifica", stato_sdi: "consegnato", testo: "Consegnata al cliente.", dati: {}, creato: adesso() }]);
  await Q.ins("app_api_usage_logs", { id: nuovoId("lg"), org: "o-imp", utente: "u-impresa", operazione: "invio_fe", documento: ft, credito: null, gateway: "simulato", costo_api: 0.05, ricavo: 0, esito: "ok", dettaglio: "esempio", creato: adesso() });
}

const evento = (documento, tipo, testo, stato_sdi) => Q.ins("app_fe_eventi", { id: nuovoId("ev"), documento, tipo, testo, stato_sdi: stato_sdi || null, dati: {}, creato: adesso() });

async function provaNumera(id) {
  const d = await Q.uno("app_fe_documenti", { id });
  if (d.numero) return d.numero;
  const tipo = d.tipo === "preventivo" ? "preventivo" : "fattura", anno = Number(String(d.data).slice(0, 4));
  const c = await Q.uno("app_fe_numeri", { org: d.org, anno, sezionale: d.sezionale || "", tipo });
  const n = (c ? c.ultimo : 0) + 1;
  if (c) await Q.upd("app_fe_numeri", { org: d.org, anno, sezionale: d.sezionale || "", tipo }, { ultimo: n });
  else await Q.ins("app_fe_numeri", { org: d.org, anno, sezionale: d.sezionale || "", tipo, ultimo: n });
  await Q.upd("app_fe_documenti", { id }, { numero: String(n), anno });
  await evento(id, "numerato", "Numero " + n + "/" + anno);
  return String(n);
}
async function provaRicalcola(id) {
  const d = await Q.uno("app_fe_documenti", { id });
  const r = await Q.sel("app_fe_righe", { eq: { documento: id } });
  const t = totali(r, d.sconto);
  await Q.upd("app_fe_documenti", { id }, { imponibile: t.imponibile, iva: t.iva, totale: t.totale });
}

/* ======================================================================== */
/* API usata dalle viste                                                     */
/* ======================================================================== */
export const FE = {
  prova: PROVA,
  semina,

  /* --- documenti --- */
  documenti: (org) => Q.sel("app_fe_documenti", { eq: { org }, ord: ["creato", false], lim: 500, cols: "id,org,tipo,tipo_sdi,numero,anno,data,oggetto,cliente_dati,totale,stato_preventivo,stato_sdi,incassato,bloccato,sopralluogo,cantiere,origine,creato" }),
  documento: (id) => Q.uno("app_fe_documenti", { id }),
  righe: (id) => Q.sel("app_fe_righe", { eq: { documento: id }, ord: ["n", true] }),
  eventi: (id) => Q.sel("app_fe_eventi", { eq: { documento: id }, ord: ["creato", false], lim: 50 }),

  /** Salva documento e righe. Restituisce l'id. Le righe si riscrivono tutte (sono poche). */
  async salva(doc, righe) {
    const campi = ["tipo", "tipo_sdi", "data", "scadenza_pagamento", "validita_giorni", "cliente", "cantiere", "cliente_dati", "oggetto", "note", "condizioni", "pagamento", "sconto", "bollo", "stato_preventivo"];
    const riga = {}; campi.forEach((k) => { if (doc[k] !== undefined) riga[k] = doc[k]; });
    let id = doc.id;
    if (!id) {
      riga.org = doc.org;
      if (PROVA) Object.assign(riga, { id: nuovoId("fe"), sezionale: "", numero: null, anno: null, stato_sdi: "non_inviato", bloccato: false, incassato: false, origine: null, sopralluogo: null, sdi_id: null, xml: null, esito: {}, imponibile: 0, iva: 0, totale: 0, creato_da: io(), creato: adesso(), aggiornato: adesso() });
      id = (await Q.ins("app_fe_documenti", riga)).id;
    } else {
      await Q.upd("app_fe_documenti", { id }, riga);
    }
    await Q.del("app_fe_righe", { documento: id });
    const nuove = righe.filter((r) => String(r.descrizione || "").trim()).map((r, i) => ({
      documento: id, n: i + 1, descrizione: String(r.descrizione).trim().slice(0, 1000), quantita: Number(r.quantita) > 0 ? Number(r.quantita) : 1,
      um: String(r.um || "").slice(0, 10), prezzo: Number(r.prezzo) || 0, sconto: Math.min(100, Math.max(0, Number(r.sconto) || 0)),
      aliquota: Number(r.aliquota) || 0, natura: Number(r.aliquota) === 0 ? r.natura || "N2.2" : null,
    }));
    if (nuove.length) await Q.ins("app_fe_righe", PROVA ? nuove.map((r) => Object.assign({ id: nuovoId("rg") }, r)) : nuove);
    if (PROVA) await provaRicalcola(id);
    if (doc.tipo === "preventivo" && !doc.id) await FE.numera(id);
    return id;
  },
  elimina: (id) => Q.del("app_fe_documenti", { id }),
  numera: (id) => (PROVA ? provaNumera(id) : Q.rpc("app_fe_numera", { p_documento: id })),
  async daPreventivo(id, tipoSdi) {
    if (!PROVA) return Q.rpc("app_fe_da_preventivo", { p_preventivo: id, p_tipo_sdi: tipoSdi || "TD01" });
    const p = await Q.uno("app_fe_documenti", { id });
    const nid = nuovoId("fe");
    await Q.ins("app_fe_documenti", Object.assign({}, p, { id: nid, tipo: tipoSdi === "TD02" ? "acconto" : "fattura", tipo_sdi: tipoSdi || "TD01", numero: null, anno: null, data: oggi(), validita_giorni: null, stato_preventivo: null, stato_sdi: "non_inviato", bloccato: false, incassato: false, origine: id, sdi_id: null, sdi_file: null, xml: null, esito: {}, inviato: null, consegnato: null, creato: adesso(), aggiornato: adesso() }));
    const r = await Q.sel("app_fe_righe", { eq: { documento: id } });
    if (r.length) await Q.ins("app_fe_righe", r.map((x) => Object.assign({}, x, { id: nuovoId("rg"), documento: nid })));
    await Q.upd("app_fe_documenti", { id }, { stato_preventivo: "accettato" });
    await evento(nid, "convertito", "Dal preventivo " + (p.numero || "") + "/" + (p.anno || ""));
    return nid;
  },
  async statoPreventivo(id, stato) {
    if (!PROVA) return Q.rpc("app_fe_stato_preventivo", { p_preventivo: id, p_stato: stato });
    await Q.upd("app_fe_documenti", { id }, { stato_preventivo: stato });
    await evento(id, "stato", "Preventivo: " + stato);
  },
  async incassato(id, si) { await Q.upd("app_fe_documenti", { id }, { incassato: !!si }); },
  async apriCantiere(id) {
    if (!PROVA) return Q.rpc("app_fe_apri_cantiere", { p_preventivo: id });
    const p = await Q.uno("app_fe_documenti", { id });
    if (p.stato_preventivo !== "accettato") throw new Error("preventivo_non_accettato");
    if (p.cantiere) return p.cantiere;
    const s = p.sopralluogo ? await Q.uno("app_sopralluoghi", { id: p.sopralluogo }) : null;
    const c = await Q.ins("app_record", { org: p.org, modulo: "cantieri", tipo: "cantiere", titolo: p.oggetto || "Cantiere", stato: "aperto", data: oggi(), importo: p.imponibile, dati: { indirizzo: s ? s.indirizzo : "", cliente: p.cliente, preventivo: p.id, sopralluogo: p.sopralluogo } });
    await Q.upd("app_fe_documenti", { id }, { cantiere: c.id });
    for (const f of await Q.sel("app_fe_documenti", { eq: { origine: id } })) if (!f.bloccato) await Q.upd("app_fe_documenti", { id: f.id }, { cantiere: c.id });
    if (s) await Q.upd("app_sopralluoghi", { id: s.id }, { cantiere: c.id });
    await evento(id, "stato", "Cantiere aperto");
    return c.id;
  },

  /* --- SdI --- */
  async gateway(azione, id) {
    if (!PROVA) return Q.funzione("sdi-gateway", { azione, documento: id });
    await new Promise((r) => setTimeout(r, 700));
    let d = await Q.uno("app_fe_documenti", { id });
    const p = await Q.uno("app_fe_profili", { org: d.org });
    if (!p) return { ok: false, error: "mancano_i_dati_fiscali", dettagli: ["Compila i dati fiscali dell'azienda."] };
    const righe = await Q.sel("app_fe_righe", { eq: { documento: id }, ord: ["n", true] });
    const gen = (doc) => generaXml(p, doc, righe, { progressivo: ("P" + Date.now().toString(36)).slice(-10).toUpperCase() });
    if (azione === "xml") {
      const r = gen(Object.assign({}, d, { numero: d.numero || "0" }));
      const errori = r.errori.filter((e) => !e.startsWith("Il documento non ha"));
      return { ok: !errori.length, errori, xml: r.xml, nome_file: r.nomeFile, totale: r.totale };
    }
    if (azione === "invia") {
      const pre = gen(Object.assign({}, d, { numero: d.numero || "0" }));
      const err = pre.errori.filter((e) => !e.startsWith("Il documento non ha"));
      if (err.length) return { ok: false, error: "fattura_incompleta", dettagli: err };
      const crediti = (await Q.sel("app_fe_crediti", { eq: { org: d.org, stato: "attivo" } })).filter((c) => c.invii_totali == null || c.invii_usati < c.invii_totali);
      if (!crediti.length) return { ok: false, error: "crediti_esauriti" };
      await Q.upd("app_fe_crediti", { id: crediti[0].id }, { invii_usati: crediti[0].invii_usati + 1 });
      await provaNumera(id);
      d = await Q.uno("app_fe_documenti", { id });
      const ok = gen(d);
      const sdi = "SIM-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      await Q.upd("app_fe_documenti", { id }, { stato_sdi: "inviato", bloccato: true, sdi_id: sdi, sdi_file: ok.nomeFile, xml: ok.xml, inviato: adesso(), esito: {}, imponibile: ok.imponibile, iva: ok.iva, totale: ok.totale });
      const costo = ((await Q.uno("app_fe_costi", { operazione: "invio_fe" })) || {}).costo || 0;
      const c = crediti[0], ricavo = c.invii_totali ? Math.round((c.prezzo_pagato / c.invii_totali) * 10000) / 10000 : c.prezzo_invio || 0;
      await Q.ins("app_api_usage_logs", { id: nuovoId("lg"), org: d.org, utente: io(), operazione: "invio_fe", documento: id, credito: c.id, gateway: "simulato", costo_api: costo, ricavo, esito: "ok", dettaglio: sdi, creato: adesso() });
      await evento(id, "inviato", "Inviata allo SdI tramite simulato (" + ok.nomeFile + ").", "inviato");
      return { ok: true, stato_sdi: "inviato", sdi_id: sdi, numero: d.numero };
    }
    if (azione === "stato") {
      if (d.stato_sdi !== "inviato") return { ok: true, stato_sdi: d.stato_sdi };
      if ((Date.now() - new Date(d.inviato).getTime()) / 1000 < 20) return { ok: true, stato_sdi: "inviato" };
      const scarto = String((d.cliente_dati || {}).codice_destinatario || "").toUpperCase() === "XXXXXXX";
      const st = scarto ? "scartato" : "consegnato";
      await Q.upd("app_fe_documenti", { id }, scarto ? { stato_sdi: st, bloccato: false, esito: { codice: "00311", testo: "Codice destinatario non valido (simulazione)." } } : { stato_sdi: st, consegnato: adesso() });
      await evento(id, "notifica", scarto ? "Scartata dallo SdI: correggi e rimandala entro 5 giorni con lo stesso numero." : "Consegnata al cliente.", st);
      return { ok: true, stato_sdi: st };
    }
    throw new Error("azione_sconosciuta");
  },

  /* --- dati fiscali, consumi, admin --- */
  profilo: (org) => Q.uno("app_fe_profili", { org }),
  async salvaProfilo(org, dati) {
    const c = await Q.uno("app_fe_profili", { org });
    if (c) await Q.upd("app_fe_profili", { org }, dati); else await Q.ins("app_fe_profili", Object.assign({ org, gateway: "simulato", gateway_rif: "", gateway_segreto: "" }, dati));
  },
  async consumi(org) {
    if (!PROVA) return Q.rpc("app_fe_miei_consumi", { p_org: org });
    const piani = await Q.sel("app_fe_piani");
    const cr = (await Q.sel("app_fe_crediti", { eq: { org } })).filter((c) => c.stato !== "chiuso");
    const log = (await Q.sel("app_api_usage_logs", { eq: { org, operazione: "invio_fe", esito: "ok" } }));
    const mesi = {}; log.forEach((l) => { const m = l.creato.slice(0, 7); mesi[m] = (mesi[m] || 0) + 1; });
    return {
      crediti: cr.map((c) => { const p = piani.find((x) => x.id === c.piano) || {}; return { id: c.id, piano: p.nome, tipo: p.tipo, totali: c.invii_totali, usati: c.invii_usati, valido_al: c.valido_al, stato: c.stato }; }),
      residui: cr.some((c) => c.invii_totali == null) ? null : cr.filter((c) => c.stato === "attivo").reduce((s, c) => s + (c.invii_totali - c.invii_usati), 0),
      mesi: Object.entries(mesi).sort().reverse().map(([mese, invii]) => ({ mese, invii })),
    };
  },
  async riepilogoAdmin(mese) {
    if (!PROVA) return Q.rpc("app_fe_riepilogo_admin", mese ? { p_mese: mese } : {});
    const m = (mese || oggi()).slice(0, 7);
    const log = (await Q.sel("app_api_usage_logs", { lim: 5000 })).filter((l) => l.creato.slice(0, 7) === m);
    const org = await Q.sel("app_org");
    const per = {};
    log.forEach((l) => { const x = per[l.org] = per[l.org] || { org: l.org, nome: (org.find((o) => o.id === l.org) || {}).nome || "", invii: 0, scartati: 0, costo: 0, ricavo: 0 }; if (l.operazione === "invio_fe" && l.esito === "ok") x.invii++; if (l.esito !== "rimborsato") x.costo += Number(l.costo_api); if (l.esito === "ok") x.ricavo += Number(l.ricavo); });
    const aziende = Object.values(per);
    const cr = await Q.sel("app_fe_crediti", { eq: { stato: "attivo" } });
    return { mese: m, totale: { invii: aziende.reduce((s, a) => s + a.invii, 0), costo: aziende.reduce((s, a) => s + a.costo, 0), ricavo: aziende.reduce((s, a) => s + a.ricavo, 0) }, aziende,
      in_esaurimento: cr.filter((c) => c.invii_totali != null && c.invii_totali - c.invii_usati <= Math.max(5, c.invii_totali / 10)).map((c) => ({ org: c.org, nome: (org.find((o) => o.id === c.org) || {}).nome || "", residui: c.invii_totali - c.invii_usati, valido_al: c.valido_al })) };
  },
  piani: () => Q.sel("app_fe_piani", { ord: ["id", true] }),
  costi: () => Q.sel("app_fe_costi"),
  salvaCosto: (operazione, costo) => Q.upd("app_fe_costi", { operazione }, { costo: Number(costo) || 0, aggiornato: adesso() }),
  async assegnaCredito(r) {
    const riga = { org: r.org, piano: r.piano, invii_totali: r.invii_totali, prezzo_pagato: Number(r.prezzo_pagato) || 0, prezzo_invio: r.prezzo_invio, valido_dal: oggi(), valido_al: r.valido_al || null, stato: "attivo", note: r.note || "" };
    if (PROVA) Object.assign(riga, { id: nuovoId("cr"), invii_usati: 0, creato: adesso() });
    return Q.ins("app_fe_crediti", riga);
  },
  aziende: () => Q.sel("app_org", { ord: ["nome", true] }),

  /* --- anagrafiche esistenti (app_record) --- */
  clienti: (org) => Q.sel("app_record", { eq: { org, tipo: "cliente" }, ord: ["titolo", true] }),
  cantieri: (org) => Q.sel("app_record", { eq: { org, tipo: "cantiere" }, ord: ["creato", false] }),

  /* --- sopralluoghi e pratiche --- */
  sopralluoghi: (eq) => Q.sel("app_sopralluoghi", { eq: eq || {}, ord: ["quando", false], lim: 200 }),
  sopralluogo: (id) => Q.uno("app_sopralluoghi", { id }),
  async salvaSopralluogo(s) {
    const campi = ["org", "tecnico", "cliente", "cliente_dati", "quando", "indirizzo", "lat", "lng", "lavori", "note", "stato", "affare", "foto"];
    const riga = {}; campi.forEach((k) => { if (s[k] !== undefined) riga[k] = s[k]; });
    if (s.id) { await Q.upd("app_sopralluoghi", { id: s.id }, riga); return s.id; }
    if (PROVA) Object.assign(riga, { id: nuovoId("so"), agente: io(), preventivo: null, cantiere: null, foto: 0, creato: adesso(), aggiornato: adesso() });
    return (await Q.ins("app_sopralluoghi", riga)).id;
  },
  async aPreventivo(id) {
    if (!PROVA) return Q.rpc("app_sopralluogo_a_preventivo", { p_sopralluogo: id });
    const s = await Q.uno("app_sopralluoghi", { id });
    if (s.preventivo) return s.preventivo;
    let cliente = s.cliente;
    const cd = s.cliente_dati || {};
    if (!cliente) {
      const nome = cd.denominazione || [cd.nome, cd.cognome].filter(Boolean).join(" ");
      if (!nome) throw new Error("manca_il_cliente");
      cliente = (await Q.ins("app_record", { org: s.org, modulo: "ufficio", tipo: "cliente", titolo: nome, dati: Object.assign({}, cd, { da_sopralluogo: id }) })).id;
    }
    const prof = await Q.uno("app_fe_profili", { org: s.org });
    const quando = new Date(s.quando).toLocaleDateString("it-IT");
    const pid = await FE.salva({ org: s.org, tipo: "preventivo", stato_preventivo: "bozza", data: oggi(), validita_giorni: 30, cliente, cliente_dati: cd, oggetto: s.lavori || "Lavori da sopralluogo", note: "Sopralluogo del " + quando + (s.indirizzo ? " in " + s.indirizzo : "") + (s.note ? ".\n" + s.note : ""), condizioni: prof ? prof.condizioni : "", sconto: 0, bollo: false, pagamento: "MP05" }, []);
    await Q.upd("app_fe_documenti", { id: pid }, { sopralluogo: id });
    await Q.upd("app_sopralluoghi", { id }, { preventivo: pid, cliente, stato: "convertito" });
    return pid;
  },
  async pratica(id) {
    if (!PROVA) return Q.rpc("app_pratica", { p_sopralluogo: id });
    const s = await Q.uno("app_sopralluoghi", { id });
    if (!s) throw new Error("pratica_non_trovata");
    const [org, prev, cant, docs, nomi] = await Promise.all([Q.uno("app_org", { id: s.org }), s.preventivo ? Q.uno("app_fe_documenti", { id: s.preventivo }) : null, s.cantiere ? Q.uno("app_record", { id: s.cantiere }) : null, Q.sel("app_fe_documenti", { eq: { sopralluogo: id } }), DB.nomi([s.agente].filter(Boolean))]);
    const cd = s.cliente_dati || {};
    const ditta = (await Q.sel("app_org_membri", { eq: { org: s.org, utente: io() } })).some((m) => ["titolare", "responsabile"].includes(m.ruolo)) || (await DB.ruoli()).admin;
    return { id: s.id, stato: s.stato, quando: s.quando, indirizzo: s.indirizzo, lavori: s.lavori, agente: nomi[s.agente] || s.tecnico || "", ditta: org ? org.nome : "", cliente: cd.denominazione || [cd.nome, cd.cognome].filter(Boolean).join(" "),
      preventivo: prev ? { id: prev.id, numero: prev.numero, anno: prev.anno, stato: prev.stato_preventivo, totale: ditta ? prev.totale : null } : null,
      cantiere: cant ? { id: cant.id, titolo: cant.titolo, stato: cant.stato } : null,
      fatture: docs.filter((d) => d.tipo !== "preventivo").map((d) => ({ id: d.id, tipo: d.tipo, numero: d.numero, anno: d.anno, stato_sdi: d.stato_sdi, incassato: d.incassato, totale: ditta ? d.totale : null })),
      ditta_vede: ditta };
  },
  async miePratiche(org) {
    if (!PROVA) return Q.rpc("app_mie_pratiche", org ? { p_org: org } : {});
    const tutti = await Q.sel("app_sopralluoghi", { eq: org ? { org } : {}, ord: ["quando", false], lim: 50 });
    const miei = org ? tutti : tutti.filter((s) => s.agente === io());
    return Promise.all(miei.map((s) => FE.pratica(s.id)));
  },
  async ditte() {
    if (!PROVA) return Q.rpc("app_ditte_rete");
    return (await Q.sel("app_org")).filter((o) => o.stato === "attiva" && ["impresa", "partner", "gc"].includes(o.tipo));
  },
  foto: {
    carica: (id, n, blob) => Q.file.carica(id + "/" + n + ".jpg", blob, "sopralluoghi"),
    url: (id, n) => Q.file.url(id + "/" + n + ".jpg", "sopralluoghi"),
  },
};
