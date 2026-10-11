/* Sicurezza del cantiere (D.Lgs. 81/08) e scadenziario comune: accesso ai dati (parte 10 del database).
   - vero: tabelle app_cantiere_soggetti, app_fascicolo_documenti, app_scadenze e funzioni SQL;
   - prova: stesse regole calcolate nel browser, con dati di ESEMPIO. */
import { DB } from "./db.js";
import { Q } from "./q.js";

const PROVA = DB.prova;
const adesso = () => new Date().toISOString();
const oggi = () => new Date().toISOString().slice(0, 10);
const tra = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const nuovoId = (p) => (p || "x") + "-" + Math.random().toString(36).slice(2, 10);
const it = (d) => new Date(d + "T12:00:00").toLocaleDateString("it-IT");

export const NOMI_DOC = {
  durc: "DURC", pos: "POS", itp: "Idoneità tecnico-professionale", visura: "Visura camerale", dvr: "DVR", attestato: "Attestato di formazione",
  idoneita_sanitaria: "Idoneità sanitaria", unilav: "UNILAV", psc: "PSC", notifica_preliminare: "Notifica preliminare", pimus: "PiMUS", altro: "Altro",
};
export const NOMI_TIPO = { subappaltatore: "Impresa subappaltatrice", lavoratore_autonomo: "Lavoratore autonomo", lavoratore: "Lavoratore" };

const REQUISITI_PROVA = [
  ["cantiere", "pos", true, null, "POS dell'impresa affidataria (art. 89 e 96)"], ["cantiere", "psc", false, null, "Se c'è il coordinatore per l'esecuzione"], ["cantiere", "notifica_preliminare", false, null, "Se dovuta (art. 99)"],
  ["subappaltatore", "visura", true, 180, "Iscrizione alla Camera di Commercio"], ["subappaltatore", "durc", true, 120, "Regolarità contributiva"], ["subappaltatore", "pos", true, null, "Piano operativo di sicurezza"], ["subappaltatore", "itp", true, null, "Idoneità tecnico-professionale (Allegato XVII)"],
  ["lavoratore_autonomo", "visura", true, 180, "Iscrizione alla Camera di Commercio"], ["lavoratore_autonomo", "durc", true, 120, "Regolarità contributiva"], ["lavoratore_autonomo", "itp", true, null, "Idoneità tecnico-professionale, attrezzature e DPI"],
  ["lavoratore", "attestato", true, null, "Formazione generale e specifica"], ["lavoratore", "idoneita_sanitaria", true, null, "Visita medica"], ["lavoratore", "unilav", true, null, "Comunicazione di assunzione"],
].map(([per, documento, obbligatorio, validita_giorni, nota]) => ({ per, documento, obbligatorio, validita_giorni, nota }));

async function semina() {
  if (!PROVA) return;
  if ((await Q.sel("app_fascicolo_requisiti", { lim: 1 })).length) return;
  await Q.ins("app_fascicolo_requisiti", REQUISITI_PROVA);
  const can = (await Q.sel("app_record", { eq: { org: "o-imp", tipo: "cantiere" } }))[0];
  if (!can) return;
  const dip = await Q.sel("app_record", { eq: { org: "o-imp", tipo: "dipendente" } });
  const sub = nuovoId("sg");
  await Q.ins("app_cantiere_soggetti", [
    { id: sub, org: "o-imp", cantiere: can.id, tipo: "subappaltatore", nome: "Partner Esempio Srl", piva: "12345678903", sub_org: "o-part", dipendente: null, di: null, mansione: "Impianti", telefono: "", dal: tra(-20), al: null, stato: "attivo", creato: adesso(), aggiornato: adesso() },
    ...dip.slice(0, 2).map((d) => ({ id: nuovoId("sg"), org: "o-imp", cantiere: can.id, tipo: "lavoratore", nome: d.titolo, piva: "", sub_org: null, dipendente: d.id, di: null, mansione: d.dati.mansione || "", telefono: "", dal: tra(-30), al: null, stato: "attivo", creato: adesso(), aggiornato: adesso() })),
  ]);
  await Q.ins("app_fascicolo_documenti", [
    { id: nuovoId("fd"), org: "o-imp", cantiere: can.id, soggetto: sub, documento: "durc", titolo: "DURC (esempio)", rilasciato: tra(-112), scade: tra(8), file: "", verifica: "valido", nota: "", creato: adesso() },
    { id: nuovoId("fd"), org: "o-imp", cantiere: can.id, soggetto: sub, documento: "visura", titolo: "Visura (esempio)", rilasciato: tra(-30), scade: tra(150), file: "", verifica: "valido", nota: "", creato: adesso() },
    { id: nuovoId("fd"), org: "o-imp", cantiere: can.id, soggetto: sub, documento: "pos", titolo: "POS impianti (esempio)", rilasciato: tra(-15), scade: null, file: "", verifica: "da_verificare", nota: "", creato: adesso() },
    { id: nuovoId("fd"), org: "o-imp", cantiere: can.id, soggetto: null, documento: "pos", titolo: "POS Edil Esempio (esempio)", rilasciato: tra(-40), scade: null, file: "", verifica: "valido", nota: "", creato: adesso() },
  ]);
}

/* Semaforo calcolato come nel database */
async function semaforoProva(id, giro = 0) {
  const s = await Q.uno("app_cantiere_soggetti", { id });
  if (!s) return null;
  if (s.stato === "sospeso") return { colore: "rosso", motivi: ["Sospeso dalla ditta"] };
  const req = (await Q.sel("app_fascicolo_requisiti", { eq: { per: s.tipo } })).filter((r) => r.obbligatorio);
  const docs = (await Q.sel("app_fascicolo_documenti", { eq: { soggetto: id } })).filter((d) => d.verifica !== "respinto");
  const rossi = [], gialli = [], o = oggi(), q15 = tra(15);
  for (const r of req) {
    const nome = r.documento.replace("_", " ").toUpperCase();
    const d = docs.filter((x) => x.documento === r.documento).sort((a, b) => (b.verifica === "valido") - (a.verifica === "valido"))[0];
    if (!d && s.dipendente) {
      const tipo = r.documento === "attestato" ? "attestato" : r.documento === "idoneita_sanitaria" ? "visita" : null;
      const sc = tipo ? (await Q.sel("app_record", { eq: { rif: s.dipendente, tipo } })).map((x) => x.scadenza).filter(Boolean).sort().pop() : null;
      if (!sc) rossi.push("Manca " + nome); else if (sc < o) rossi.push(nome + " scaduto il " + it(sc)); else if (sc <= q15) gialli.push(nome + " scade il " + it(sc));
      continue;
    }
    if (!d) rossi.push("Manca " + nome);
    else if (d.scade && d.scade < o) rossi.push(nome + " scaduto il " + it(d.scade));
    else { if (d.verifica === "da_verificare") gialli.push(nome + " da verificare"); if (d.scade && d.scade <= q15) gialli.push(nome + " scade il " + it(d.scade)); }
  }
  if (s.di && giro < 2 && ((await semaforoProva(s.di, giro + 1)) || {}).colore === "rosso") rossi.push("L'impresa non è in regola");
  if (s.al && s.al < o) rossi.push("Autorizzato fino al " + it(s.al));
  return { colore: rossi.length ? "rosso" : gialli.length ? "giallo" : "verde", motivi: rossi.concat(gialli) };
}

export const SIC = {
  prova: PROVA,
  semina,
  requisiti: (per) => Q.sel("app_fascicolo_requisiti", { eq: per ? { per } : {} }),
  async cantieri(org) {
    if (!PROVA) return Q.rpc("app_sicurezza_cantieri", { p_org: org });
    const c = (await Q.sel("app_record", { eq: { org, tipo: "cantiere" } })).filter((x) => !["chiuso", "concluso"].includes(x.stato || ""));
    return Promise.all(c.map(async (x) => {
      const s = (await Q.sel("app_cantiere_soggetti", { eq: { cantiere: x.id, stato: "attivo" } }));
      const sem = await Promise.all(s.map((y) => semaforoProva(y.id)));
      return { id: x.id, titolo: x.titolo, stato: x.stato, soggetti: s.length, rossi: sem.filter((y) => y.colore === "rosso").length, gialli: sem.filter((y) => y.colore === "giallo").length };
    }));
  },
  async fascicolo(cantiere) {
    if (!PROVA) return Q.rpc("app_fascicolo_cantiere", { p_cantiere: cantiere });
    const c = await Q.uno("app_record", { id: cantiere });
    const s = (await Q.sel("app_cantiere_soggetti", { eq: { cantiere } })).filter((x) => x.stato !== "uscito");
    const docs = await Q.sel("app_fascicolo_documenti", { eq: { cantiere, soggetto: null } });
    const req = (await Q.sel("app_fascicolo_requisiti", { eq: { per: "cantiere" } })).filter((r) => r.obbligatorio);
    return {
      cantiere: { id: c.id, titolo: c.titolo, stato: c.stato, org: c.org }, ditta: true,
      soggetti: await Promise.all(s.map(async (x) => Object.assign({}, x, { semaforo: await semaforoProva(x.id) }))),
      documenti_cantiere: docs, mancano_cantiere: req.filter((r) => !docs.some((d) => d.documento === r.documento && d.verifica !== "respinto" && (!d.scade || d.scade >= oggi()))).map((r) => r.documento),
    };
  },
  soggetto: (id) => Q.uno("app_cantiere_soggetti", { id }),
  semaforo: (id) => (PROVA ? semaforoProva(id) : Q.rpc("app_semaforo_soggetto", { p_soggetto: id })),
  documenti: (soggetto) => Q.sel("app_fascicolo_documenti", { eq: { soggetto }, ord: ["creato", false] }),
  documento: (id) => Q.uno("app_fascicolo_documenti", { id }),
  async salvaSoggetto(s) {
    if (s.id) { const { id, ...resto } = s; await Q.upd("app_cantiere_soggetti", { id }, resto); return id; }
    const riga = Object.assign({ piva: "", sub_org: null, dipendente: null, di: null, mansione: "", telefono: "", dal: oggi(), al: null, stato: "attivo" }, s);
    if (PROVA) Object.assign(riga, { id: nuovoId("sg"), creato: adesso(), aggiornato: adesso() });
    return (await Q.ins("app_cantiere_soggetti", riga)).id;
  },
  async salvaDocumento(d) {
    if (d.id) { const { id, ...resto } = d; await Q.upd("app_fascicolo_documenti", { id }, resto); return id; }
    const riga = Object.assign({ titolo: "", rilasciato: null, scade: null, file: "", verifica: "da_verificare", nota: "" }, d);
    if (PROVA) {
      const c = await Q.uno("app_record", { id: d.cantiere });
      const per = d.soggetto ? (await Q.uno("app_cantiere_soggetti", { id: d.soggetto })).tipo : "cantiere";
      const req = await Q.uno("app_fascicolo_requisiti", { per, documento: d.documento });
      if (!riga.scade && riga.rilasciato && req && req.validita_giorni) riga.scade = new Date(new Date(riga.rilasciato + "T12:00:00").getTime() + req.validita_giorni * 864e5).toISOString().slice(0, 10);
      Object.assign(riga, { id: nuovoId("fd"), org: c.org, creato: adesso() });
    }
    return (await Q.ins("app_fascicolo_documenti", riga)).id;
  },
  verifica: (id, esito, nota) => Q.upd("app_fascicolo_documenti", { id }, { verifica: esito, nota: nota || "" }),
  eliminaDocumento: (id) => Q.del("app_fascicolo_documenti", { id }),
  file: {
    carica: (nome, blob) => Q.file.carica(nome, blob, "fascicolo"),
    url: (nome) => Q.file.url(nome, "fascicolo"),
  },
  async scadenze(org) {
    if (!PROVA) return Q.sel("app_scadenze", { eq: { org, stato: "attiva" }, ord: ["scade", true], lim: 300 });
    const d = (await Q.sel("app_fascicolo_documenti", { eq: { org } })).filter((x) => x.scade && x.verifica !== "respinto");
    const sogg = await Q.sel("app_cantiere_soggetti", { eq: { org } });
    const can = await Q.sel("app_record", { eq: { org, tipo: "cantiere" } });
    return d.map((x) => ({ id: x.id, ambito: "sicurezza", cantiere: x.cantiere, scade: x.scade,
      titolo: [NOMI_DOC[x.documento], (sogg.find((s) => s.id === x.soggetto) || {}).nome, (can.find((c) => c.id === x.cantiere) || {}).titolo].filter(Boolean).join(" · ") })).sort((a, b) => (a.scade > b.scade ? 1 : -1));
  },
  dipendenti: (org) => Q.sel("app_record", { eq: { org, tipo: "dipendente" }, ord: ["titolo", true] }),
  doveSonoSub: (org) => Q.sel("app_cantiere_soggetti", { eq: { sub_org: org } }),
};
