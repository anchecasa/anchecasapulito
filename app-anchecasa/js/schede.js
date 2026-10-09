/* Motore delle schede: ogni tipo (cliente, dipendente, cantiere, SAL…) è descritto qui sotto
   e l'app ne ricava da sola elenco, scheda e modulo di modifica. Si salva in marketplace.app_record. */
import { I, esc, voce, lista, sez, stato, btn, campo, vuoto, avviso, virgola, quando, toast, foglio, chiudiFoglio, spiegaErrore, telLink } from "./ui.js";
import { Q } from "./q.js";

/* ------------------------------------------------------------------------ */
/* Campi: [chiave, etichetta, tipo, opzioni]. chiave = titolo|data|scadenza|importo|stato|dati.xxx  */
/* tipi: testo lunga numero euro data scelta tel mail sino percento righe collega:<tipo> persona     */
/* ------------------------------------------------------------------------ */
const ST = (...x) => x;
export const TIPI = {
  cliente: { nome: "Cliente", plur: "Clienti", ico: "utente", campi: [["titolo", "Nome o ragione sociale", "testo", { obbl: 1 }], ["dati.telefono", "Telefono", "tel"], ["dati.email", "Mail", "mail"], ["dati.indirizzo", "Indirizzo", "testo"], ["dati.piva", "P.IVA o codice fiscale", "testo"], ["dati.note", "Note", "lunga"]], sotto: (r) => [r.dati.telefono, r.dati.indirizzo].filter(Boolean).join(" · ") },
  preventivo: { nome: "Preventivo", plur: "Preventivi", ico: "doc", campi: [["titolo", "Lavoro", "testo", { obbl: 1 }], ["dati.cliente", "Cliente", "collega:cliente"], ["data", "Data", "data"], ["stato", "Stato", "scelta", ST("bozza", "inviato", "accettato", "rifiutato")], ["dati.righe", "Voci", "righe"], ["dati.iva", "IVA %", "numero"], ["dati.note", "Note e condizioni", "lunga"]], noSemaforo: true, sotto: (r) => [r.dati.cliente_nome, euro(r.importo)].filter(Boolean).join(" · "), stampa: true },
  fattura: { nome: "Fattura", plur: "Fatture", ico: "doc", campi: [["titolo", "Numero", "testo", { obbl: 1 }], ["dati.cliente", "Cliente", "collega:cliente"], ["data", "Data", "data"], ["importo", "Importo totale", "euro"], ["scadenza", "Scadenza del pagamento", "data"], ["stato", "Stato", "scelta", ST("da incassare", "incassata")], ["dati.note", "Note", "lunga"]], sotto: (r) => [r.dati.cliente_nome, euro(r.importo)].filter(Boolean).join(" · "), nota: "Registro delle fatture. La fattura elettronica allo SDI si manda con il programma del commercialista.", scadenzaSe: (r) => r.stato !== "incassata" },
  documento: { nome: "Documento", plur: "Documenti", ico: "doc", campi: [["titolo", "Nome del documento", "testo", { obbl: 1 }], ["scadenza", "Scadenza (se c'è)", "data"], ["dati.condiviso", "Lo vede anche il cliente del cantiere", "sino"], ["dati.note", "Note", "lunga"]], file: true },
  dipendente: { nome: "Dipendente", plur: "Dipendenti", ico: "utente", campi: [["titolo", "Nome e cognome", "testo", { obbl: 1 }], ["dati.mansione", "Mansione", "testo"], ["dati.telefono", "Telefono", "tel"], ["data", "Assunto il", "data"], ["dati.note", "Note", "lunga"]], figli: ["attestato", "visita", "dpi"], sotto: (r) => r.dati.mansione || "", codice: true },
  attestato: { nome: "Corso o attestato", plur: "Corsi e attestati", ico: "corso", campi: [["titolo", "Corso", "testo", { obbl: 1, suggerimenti: ["Formazione generale e specifica", "Aggiornamento lavoratori", "Preposto", "Dirigente", "Antincendio", "Primo soccorso", "Lavori in quota", "Ponteggi (PiMUS)", "Gru e PLE", "HACCP"] }], ["data", "Fatto il", "data"], ["scadenza", "Scade il", "data"]], file: true },
  visita: { nome: "Visita medica", plur: "Visite mediche", ico: "scudo", campi: [["titolo", "Visita", "testo", { obbl: 1, predefinito: "Visita medica" }], ["data", "Fatta il", "data"], ["scadenza", "Prossima entro il", "data"], ["stato", "Giudizio", "scelta", ST("idoneo", "idoneo con prescrizioni", "non idoneo")]], file: true },
  dpi: { nome: "Consegna DPI", plur: "DPI consegnati", ico: "kit", campi: [["titolo", "Cosa è stato consegnato", "testo", { obbl: 1 }], ["data", "Consegnato il", "data"], ["dati.firma", "Firma del lavoratore", "firma"]], sotto: (r) => (r.dati.firma ? "Firmato" : "Da firmare") },
  sopralluogo: { nome: "Sopralluogo AncheSicura", plur: "Sopralluoghi", ico: "scudo", campi: [["titolo", "Sopralluogo", "testo", { obbl: 1 }], ["data", "Fatto il", "data"], ["stato", "Esito", "scelta", ST("conforme", "conforme con prescrizioni", "non conforme")], ["dati.prescrizioni", "Prescrizioni", "lunga"], ["scadenza", "Prossimo sopralluogo", "data"]], file: true },
  segnalazione: { nome: "Segnalazione di pericolo", plur: "Segnalazioni", ico: "allarme", campi: [["titolo", "Cosa succede", "testo", { obbl: 1 }], ["dati.dove", "Dove", "testo"], ["dati.descrizione", "Descrizione", "lunga"], ["stato", "Stato", "scelta", ST("aperta", "presa in carico", "chiusa")]], file: true },
  avviso: { nome: "Avviso ai lavoratori", plur: "Avvisi", ico: "campana", campi: [["titolo", "Avviso", "testo", { obbl: 1 }], ["dati.testo", "Testo", "lunga"]] },
  verbale: { nome: "Verbale del coordinatore", plur: "Verbali", ico: "doc", campi: [["titolo", "Verbale", "testo", { obbl: 1 }], ["data", "Data", "data"], ["dati.esito", "Esito", "scelta", ST("Conforme", "Conforme con prescrizioni", "Non conforme")], ["dati.prescrizioni", "Prescrizioni", "lunga"]], file: true },
  checklist: { nome: "Checklist del preposto", plur: "Checklist", ico: "ok", campi: [["titolo", "Checklist", "testo", { obbl: 1, predefinito: "Controllo di inizio giornata" }], ["data", "Data", "data"], ["dati.dpi", "DPI indossati da tutti", "sino"], ["dati.ponteggi", "Ponteggi e parapetti a posto", "sino"], ["dati.recinzione", "Recinzione e cartelli", "sino"], ["dati.estintori", "Estintori e cassetta di primo soccorso", "sino"], ["dati.ordine", "Ordine e pulizia", "sino"], ["dati.note", "Note", "lunga"]] },
  ingresso: { nome: "Ingresso in cantiere", plur: "Ingressi", ico: "utente", campi: [["titolo", "Persona", "testo", { obbl: 1 }], ["data", "Data", "data"], ["dati.codice", "Codice del patentino", "testo"], ["stato", "Esito", "scelta", ST("in regola", "non in regola")]] },
  cantiere: { nome: "Cantiere", plur: "Cantieri", ico: "gru", campi: [["titolo", "Nome o indirizzo del cantiere", "testo", { obbl: 1 }], ["dati.committente", "Committente", "testo"], ["dati.indirizzo", "Indirizzo", "testo"], ["data", "Inizio lavori", "data"], ["scadenza", "Fine prevista", "data"], ["importo", "Importo del contratto", "euro"], ["stato", "Stato", "scelta", ST("in preparazione", "in corso", "sospeso", "finito")], ["dati.avanzamento", "Avanzamento", "percento"], ["dati.fideiussione", "Fideiussione (per il cliente)", "testo"], ["dati.conto", "Conto dedicato (per il cliente)", "testo"]], noSemaforo: true, figli: ["fase", "giornale", "presenza", "sal", "ddt", "verbale", "checklist", "ingresso", "segnalazione_cliente", "documento"], sotto: (r) => [r.stato, r.dati.avanzamento != null ? r.dati.avanzamento + "%" : ""].filter(Boolean).join(" · ") },
  fase: { nome: "Fase del cronoprogramma", plur: "Cronoprogramma", ico: "grafico", campi: [["titolo", "Fase", "testo", { obbl: 1 }], ["data", "Inizio", "data"], ["scadenza", "Fine", "data"], ["dati.avanzamento", "Avanzamento", "percento"]], sotto: (r) => `${quando2(r.data)} → ${quando2(r.scadenza)} · ${r.dati.avanzamento || 0}%`, noSemaforo: true },
  giornale: { nome: "Giornale dei lavori", plur: "Giornale dei lavori", ico: "doc", campi: [["data", "Data", "data", { obbl: 1, oggi: 1 }], ["titolo", "Lavori fatti", "testo", { obbl: 1 }], ["dati.persone", "Persone in cantiere", "numero"], ["dati.meteo", "Meteo", "testo"], ["dati.note", "Note", "lunga"]], file: true, foto: true },
  presenza: { nome: "Presenza", plur: "Presenze", ico: "utente", campi: [["data", "Giorno", "data", { obbl: 1, oggi: 1 }], ["titolo", "Persona", "testo", { obbl: 1 }], ["dati.ore", "Ore", "numero"]] },
  sal: { nome: "SAL", plur: "SAL", ico: "doc", campi: [["titolo", "SAL", "testo", { obbl: 1 }], ["data", "Data", "data"], ["importo", "Importo", "euro"], ["stato", "Stato", "scelta", ST("bozza", "inviato", "approvato", "contestato", "pagato")], ["dati.descrizione", "Lavori compresi", "lunga"]], file: true, sotto: (r) => euro(r.importo) },
  ddt: { nome: "DDT", plur: "DDT e materiali", ico: "box", campi: [["titolo", "Numero DDT", "testo", { obbl: 1 }], ["data", "Data", "data"], ["dati.fornitore", "Fornitore", "testo"], ["dati.materiale", "Materiale", "lunga"]], file: true, foto: true },
  segnalazione_cliente: { nome: "Segnalazione del cliente", plur: "Segnalazioni del cliente", ico: "allarme", campi: [["titolo", "Cosa non va", "testo", { obbl: 1 }], ["dati.descrizione", "Descrizione", "lunga"], ["stato", "Stato", "scelta", ST("aperta", "presa in carico", "risolta")]], file: true },
  gara: { nome: "Gara", plur: "Gare", ico: "gara", campi: [["titolo", "Oggetto", "testo", { obbl: 1 }], ["dati.ente", "Ente", "testo"], ["importo", "Importo a base d'asta", "euro"], ["scadenza", "Scadenza offerte", "data"], ["dati.cig", "CIG", "testo"], ["dati.categorie", "Categorie SOA", "testo"], ["dati.link", "Link al bando", "testo"], ["stato", "Stato", "scelta", ST("da valutare", "partecipo", "non partecipo", "offerta inviata", "vinta", "persa")]], file: true, sotto: (r) => [r.dati.ente, euro(r.importo)].filter(Boolean).join(" · "), scadenzaSe: (r) => ["da valutare", "partecipo"].includes(r.stato) },
  lotto: { nome: "Lotto", plur: "Lotti e subappalti", ico: "lotti", campi: [["titolo", "Cosa cerchi", "testo", { obbl: 1 }], ["dati.genere", "Tipo", "scelta", ST("subappalto lavori", "fornitura", "noleggio")], ["dati.descrizione", "Descrizione", "lunga"], ["dati.luogo", "Luogo", "testo"], ["importo", "Budget (facoltativo)", "euro"], ["scadenza", "Offerte entro", "data"], ["stato", "Stato", "scelta", ST("bozza", "aperto", "assegnato", "chiuso")]], file: true, sotto: (r) => [r.dati.genere, r.dati.luogo].filter(Boolean).join(" · "), scadenzaSe: (r) => r.stato === "aperto" },
  chiamata: { nome: "Chiamata", plur: "Chiamate", ico: "tel", campi: [["titolo", "Chi ha chiamato", "testo", { obbl: 1 }], ["dati.numero", "Numero", "tel"], ["data", "Giorno", "data", { oggi: 1 }], ["dati.esito", "Com'è andata", "scelta", ST("risposta", "persa", "segreteria")], ["dati.note", "Cosa voleva", "lunga"], ["stato", "Stato", "scelta", ST("da richiamare", "fatto")]], sotto: (r) => [r.dati.numero, r.dati.esito].filter(Boolean).join(" · "), noSemaforo: true },
  articolo: { nome: "Articolo", plur: "Magazzino", ico: "box", campi: [["titolo", "Articolo", "testo", { obbl: 1 }], ["dati.codice", "Codice", "testo"], ["dati.giacenza", "Giacenza", "numero"], ["dati.minimo", "Scorta minima", "numero"], ["dati.unita", "Unità", "testo"], ["dati.posizione", "Dove si trova", "testo"]], sotto: (r) => `${r.dati.giacenza ?? 0} ${r.dati.unita || ""}${Number(r.dati.giacenza) < Number(r.dati.minimo) ? " · sotto la scorta minima" : ""}` },
  mezzo: { nome: "Mezzo", plur: "Mezzi", ico: "gru", campi: [["titolo", "Mezzo", "testo", { obbl: 1 }], ["dati.targa", "Targa o matricola", "testo"], ["scadenza", "Revisione entro", "data"], ["dati.assicurazione", "Assicurazione fino al", "data"], ["dati.note", "Note", "lunga"]], figli: ["manutenzione"], file: true, sotto: (r) => r.dati.targa || "" },
  manutenzione: { nome: "Manutenzione", plur: "Manutenzioni", ico: "kit", campi: [["titolo", "Intervento", "testo", { obbl: 1 }], ["data", "Fatta il", "data"], ["importo", "Costo", "euro"], ["scadenza", "Prossima entro", "data"]] },
  prodotto: { nome: "Prodotto o noleggio", plur: "Listino", ico: "box", campi: [["titolo", "Prodotto", "testo", { obbl: 1 }], ["importo", "Prezzo", "euro"], ["dati.unita", "Per (pezzo, sacco, giorno…)", "testo"], ["dati.noleggio", "È un noleggio", "sino"], ["dati.descrizione", "Descrizione e disponibilità", "lunga"]], sotto: (r) => `${euro(r.importo)}${r.dati.unita ? " al " + r.dati.unita : ""}`, noSemaforo: true },
};
// Chi, oltre a chi gestisce l'azienda, può aggiungere schede di un tipo dentro un cantiere.
const PARTNER_TIPI = ["giornale", "presenza", "sal", "ingresso", "verbale"];

export const euro = (n) => (n == null || n === "" ? "" : Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: Number(n) % 1 ? 2 : 0 }));
const quando2 = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "–");
export const giornoIt = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "");
const oggi = () => new Date().toISOString().slice(0, 10);
const prendi = (r, k) => (k.startsWith("dati.") ? (r.dati || {})[k.slice(5)] : r[k]);

/** Semaforo di una scadenza: rosso scaduta, giallo entro 30 giorni, verde dopo. */
export function semaforo(scad) {
  if (!scad) return null;
  const g = Math.round((new Date(scad + "T12:00:00") - new Date()) / 864e5);
  if (g < 0) return ["rosso", `Scaduto da ${-g} giorn${-g === 1 ? "o" : "i"}`];
  if (g <= 30) return ["giallo", `Scade tra ${g} giorn${g === 1 ? "o" : "i"}`];
  return ["verde", "In regola"];
}
export function statoScheda(r) {
  const T = TIPI[r.tipo] || {};
  if (r.tipo === "articolo" && Number(r.dati.giacenza) < Number(r.dati.minimo)) return ["rosso", "Da riordinare"];
  if (r.tipo === "dpi") return r.dati.firma ? ["verde", "Firmato"] : ["giallo", "Da firmare"];
  if (!T.noSemaforo && r.scadenza && (!T.scadenzaSe || T.scadenzaSe(r))) { const s = semaforo(r.scadenza); if (s && s[0] !== "verde") return s; }
  if (r.stato) {
    const verde = ["accettato", "incassata", "approvato", "pagato", "vinta", "in regola", "conforme", "idoneo", "fatto", "risolta", "chiusa", "finito", "assegnato"];
    const rosso = ["rifiutato", "contestato", "persa", "non in regola", "non conforme", "non idoneo", "aperta", "da richiamare", "da incassare"];
    return [verde.includes(r.stato) ? "verde" : rosso.includes(r.stato) ? "rosso" : "blu", r.stato];
  }
  return null;
}
/** Il peggior semaforo tra le scadenze di un dipendente (corsi e visite). */
export function semaforoDipendente(figli) {
  const s = figli.filter((f) => ["attestato", "visita"].includes(f.tipo) && f.scadenza).map((f) => semaforo(f.scadenza));
  if (!s.length) return ["giallo", "Nessun corso registrato"];
  return s.find((x) => x[0] === "rosso") || s.find((x) => x[0] === "giallo") || ["verde", "Tutto in regola"];
}

/* ------------------------------------------------------------------------ */
/* Dati                                                                      */
/* ------------------------------------------------------------------------ */
export const R = {
  lista: (org, tipo, extra = {}) => Q.sel("app_record", { eq: Object.assign({ org, tipo }, extra), ord: ["creato", false], lim: 300 }),
  figli: (rif, tipo) => Q.sel("app_record", { eq: tipo ? { rif, tipo } : { rif }, ord: ["data", false], lim: 300 }),
  get: (id) => Q.uno("app_record", { id }),
  async salva(r) {
    const campi = { org: r.org, tipo: r.tipo, titolo: r.titolo || "", stato: r.stato || "", data: r.data || null, scadenza: r.scadenza || null, importo: r.importo === "" || r.importo == null ? null : Number(r.importo), rif: r.rif || null, dati: r.dati || {}, pubblico: !!r.pubblico };
    if (r.id) { const x = await Q.upd("app_record", { id: r.id }, campi); if (!x || !x.length) throw new Error("non_autorizzato"); return x[0]; }
    return Q.ins("app_record", campi);
  },
  cancella: (id) => Q.del("app_record", { id }),
};

/* ------------------------------------------------------------------------ */
/* Firma (piccola tela da disegnare col dito)                                */
/* ------------------------------------------------------------------------ */
function legaFirme(el) {
  el.querySelectorAll("canvas.firma").forEach((c) => {
    const ctx = c.getContext("2d");
    const pr = window.devicePixelRatio || 1;
    const w = c.clientWidth || 300, h = 150;
    c.width = w * pr; c.height = h * pr; ctx.scale(pr, pr);
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#16304D";
    const hid = c.parentElement.querySelector("input[type=hidden]");
    if (hid.value) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, w, h); im.src = hid.value; }
    let giu = false;
    const pos = (e) => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    c.addEventListener("pointerdown", (e) => { giu = true; c.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); e.preventDefault(); });
    c.addEventListener("pointermove", (e) => { if (!giu) return; ctx.lineTo(...pos(e)); ctx.stroke(); });
    const fine = () => { if (!giu) return; giu = false; hid.value = c.toDataURL("image/png"); };
    c.addEventListener("pointerup", fine); c.addEventListener("pointerleave", fine);
    c.parentElement.querySelector("[data-cancella-firma]").addEventListener("click", () => { ctx.clearRect(0, 0, w, h); hid.value = ""; });
  });
}

/* ------------------------------------------------------------------------ */
/* Installazione nel cuore dell'app                                          */
/* ------------------------------------------------------------------------ */
export function installa(core) {
  const { S, V, AZIONI, FORM, vai, render } = core;
  const gestisco = (org) => !!(S.admin || (S.miei && (S.miei.org || []).some((o) => o.id === org && ["titolare", "responsabile"].includes(o.ruolo))));
  const accessoA = (rec) => ((S.miei && S.miei.accessi) || []).find((a) => a.record === rec.id || a.record === rec.rif);
  const consulenteDi = (org) => ((S.miei && S.miei.org) || []).some((o) => o.id === org && o.ruolo === "consulente");
  const puoModificare = (r) => {
    if (gestisco(r.org)) return true;
    if (consulenteDi(r.org) && ["sicurezza", "sicantiere"].includes(r.modulo)) return true;
    const a = accessoA(r);
    if (a && a.ruolo === "partner" && PARTNER_TIPI.includes(r.tipo) && r.creato_da === S.utente.id) return true;
    if (r.tipo === "dpi" && !r.dati.firma && S.base === "operatore") return true;
    return false;
  };
  const puoAggiungere = (org, tipo, padre) => {
    if (gestisco(org)) return true;
    if (consulenteDi(org) && ["dipendente", "attestato", "visita", "dpi", "sopralluogo", "segnalazione", "avviso", "verbale", "checklist", "ingresso"].includes(tipo)) return true;
    if (padre) { const a = accessoA(padre); if (a && a.ruolo === "partner" && PARTNER_TIPI.includes(tipo)) return true; if (a && a.ruolo === "cliente" && tipo === "segnalazione_cliente") return true; }
    return false;
  };
  core.puoModificare = puoModificare; core.gestisco = gestisco; core.puoAggiungere = puoAggiungere;
  core.HOOK = core.HOOK || { scheda: {}, dopoSalva: {} };

  const riga = (r, figli) => {
    const T = TIPI[r.tipo] || {};
    const st = r.tipo === "dipendente" && figli ? semaforoDipendente(figli) : statoScheda(r);
    return voce(T.ico || "doc", esc(r.titolo || T.nome), esc(T.sotto ? T.sotto(r) : r.data ? giornoIt(r.data) : ""), "scheda/" + r.id, st ? st[0] : "", st ? stato(st[0], esc(st[1])) : "");
  };
  core.rigaScheda = riga;

  /* Elenco: elenco/<tipo>[/<org>] (org: quella del profilo, se manca). */
  V.elenco = async (p) => {
    const [tipo, orgP] = p.split("/");
    const T = TIPI[tipo];
    if (!T) return { t: "Elenco", h: vuoto("Elenco non trovato.") };
    const org = orgP || S.org;
    const righe = await R.lista(org, tipo);
    let figliDip = {};
    if (tipo === "dipendente" && righe.length) {
      const tutti = await Q.sel("app_record", { eq: { org }, in: { tipo: ["attestato", "visita"] }, lim: 1000 });
      tutti.forEach((f) => { (figliDip[f.rif] = figliDip[f.rif] || []).push(f); });
    }
    return {
      t: T.plur,
      h: `<div class="pad">${T.nota ? avviso(esc(T.nota)) + '<div style="height:12px"></div>' : ""}
        ${puoAggiungere(org, tipo) ? btn(I.piu + " Aggiungi " + T.nome.toLowerCase(), "go:modifica/" + tipo + "/nuovo//" + org) + '<div style="height:14px"></div>' : ""}
        ${righe.length ? lista(righe.map((r) => riga(r, figliDip[r.id] || []))) : vuoto("Ancora niente qui.")}</div>`,
    };
  };

  /* Scheda: campi, figli, file, azioni. */
  V.scheda = async (id) => {
    const r = await R.get(id);
    if (!r) return { t: "Scheda", h: vuoto("Scheda non trovata o non visibile.") };
    const T = TIPI[r.tipo] || { campi: [] };
    const figliTipi = (T.figli || []).filter((ft) => !(S.base === "cliente" && !["fase", "giornale", "sal", "segnalazione_cliente", "documento"].includes(ft)));
    const figli = figliTipi.length ? await R.figli(r.id) : [];
    const valore = (c) => {
      const [k, , tipo] = c; const v = prendi(r, k);
      if (v == null || v === "") return "";
      if (tipo === "euro") return euro(v);
      if (tipo === "data") return giornoIt(v);
      if (tipo === "sino") return v ? "Sì" : "No";
      if (tipo === "percento") return (Number(v) || 0) + "%";
      if (tipo === "tel") return `<a href="${telLink(v)}">${esc(v)}</a>`;
      if (tipo === "mail") return `<a href="mailto:${esc(v)}">${esc(v)}</a>`;
      if (tipo === "firma") return `<img class="firma-img" src="${esc(String(v).startsWith("data:image/png") ? v : "")}" alt="Firma">`;
      if (tipo === "righe") return "";
      if (String(tipo).startsWith("collega:")) return esc(r.dati[k.slice(5) + "_nome"] || "");
      if (k === "stato") return "";
      return esc(v).replace(/\n/g, "<br>");
    };
    const campi = T.campi.filter((c) => c[0] !== "titolo").map((c) => [c[1], valore(c)]).filter((x) => x[1]);
    const st = r.tipo === "dipendente" ? semaforoDipendente(figli) : statoScheda(r);
    const righe = r.tipo === "preventivo" ? tabellaRighe(r) : "";
    const extra = core.HOOK.scheda[r.tipo] ? await core.HOOK.scheda[r.tipo](r, figli) : "";
    const blocchiFigli = figliTipi.map((ft) => {
      const FT = TIPI[ft]; let fl = figli.filter((f) => f.tipo === ft);
      if (S.base === "cliente" && ft === "sal") fl = fl.filter((f) => f.stato !== "bozza");
      if (S.base === "cliente" && ft === "documento") fl = fl.filter((f) => f.dati.condiviso);
      const add = puoAggiungere(r.org, ft, r) ? `<a data-go="modifica/${ft}/nuovo/${r.id}">+ Aggiungi</a>` : "";
      if (!fl.length && !add) return "";
      return sez(FT.plur, fl.length ? lista(fl.slice(0, 8).map((f) => riga(f))) + (fl.length > 8 ? `<p class="sotto piccolo">E altri ${fl.length - 8}.</p>` : "") : `<div class="card"><p>Ancora niente.</p></div>`, add);
    }).join("");
    const mod = puoModificare(r);
    return {
      t: T.nome,
      h: `<div class="pad">
        <div class="card"><h3>${esc(r.titolo || T.nome)}</h3>${st ? `<div style="margin-top:6px">${stato(st[0], esc(st[1]))}</div>` : ""}</div><div style="height:12px"></div>
        ${campi.length ? `<div class="card"><dl class="campi">${campi.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${b}</dd>`).join("")}</dl></div><div style="height:12px"></div>` : ""}
        ${righe}${extra}
        ${T.codice && r.dati.codice ? sez("Patentino", `<div class="card patentino"><small>Codice per gli ingressi in cantiere</small><b>${esc(r.dati.codice)}</b></div>`) : ""}
        ${T.file || T.foto ? (() => { const carica = mod || (accessoA(r) && accessoA(r).ruolo === "partner"); const tit = T.foto ? "Foto e allegati" : "Allegati"; return carica
          ? sez(tit, `<div class="allegati" data-allegati="${esc(r.org)}/${esc(r.id)}"><div class="carico piccolo"><span></span></div></div><label class="btn chiaro">${I.foto} Aggiungi foto o file<input type="file" hidden multiple data-carica="${esc(r.org)}/${esc(r.id)}" ${T.foto ? 'accept="image/*,application/pdf"' : ""}></label>`)
          : `<div class="allegati" data-allegati="${esc(r.org)}/${esc(r.id)}" data-titolo="${esc(tit)}"></div>`; })() : ""}
        ${blocchiFigli}
        ${mod ? `<div class="btns">${btn("Modifica", "go:modifica/" + r.tipo + "/" + r.id, "chiaro")}${gestisco(r.org) ? btn("Elimina", "elimina:" + r.id, "chiaro") : ""}</div>` : ""}
        ${T.stampa ? `<div style="height:8px"></div>${btn(I.doc + " Stampa o salva in PDF", "stampa", "chiaro")}` : ""}</div>`,
      dopo: async (el) => { await mostraAllegati(el); if (core.HOOK.dopoScheda && core.HOOK.dopoScheda[r.tipo]) await core.HOOK.dopoScheda[r.tipo](el, r); },
    };
  };

  function tabellaRighe(r) {
    const rr = Array.isArray(r.dati.righe) ? r.dati.righe : [];
    if (!rr.length) return "";
    const imp = rr.reduce((s, x) => s + Number(x.q || 0) * Number(x.p || 0), 0);
    const iva = Number(r.dati.iva || 0);
    return `<div class="card stampabile"><table class="righe"><thead><tr><th>Voce</th><th>Q.tà</th><th>Prezzo</th><th>Totale</th></tr></thead><tbody>
      ${rr.map((x) => `<tr><td>${esc(x.d)}</td><td>${virgola(x.q, Number(x.q) % 1 ? 2 : 0)}</td><td>${euro(x.p)}</td><td>${euro(Number(x.q || 0) * Number(x.p || 0))}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="3">Imponibile</td><td>${euro(imp)}</td></tr>${iva ? `<tr><td colspan="3">IVA ${iva}%</td><td>${euro(imp * iva / 100)}</td></tr>` : ""}<tr><td colspan="3"><b>Totale</b></td><td><b>${euro(imp * (1 + iva / 100))}</b></td></tr></tfoot></table></div><div style="height:12px"></div>`;
  }

  async function mostraAllegati(el) {
    const box = el.querySelector("[data-allegati]");
    if (!box) return;
    const cart = box.getAttribute("data-allegati");
    let f = [];
    try { f = await Q.file.lista(cart); } catch (e) { /* bucket non pronto */ }
    const urls = await Promise.all(f.map((x) => Q.file.url(x.percorso)));
    const titolo = box.getAttribute("data-titolo");
    box.innerHTML = f.length ? `${titolo ? `<h2 class="tit-sez">${esc(titolo)}</h2>` : ""}<div class="fotos">${f.map((x, i) => /image\//.test(x.tipo) || /\.(jpe?g|png|webp)$/i.test(x.nome)
      ? `<a href="${esc(urls[i])}" target="_blank" rel="noopener"><img src="${esc(urls[i])}" alt="${esc(x.nome)}" loading="lazy"></a>`
      : `<a class="file" href="${esc(urls[i])}" target="_blank" rel="noopener">${I.doc}<span>${esc(x.nome)}</span></a>`).join("")}</div><div style="height:10px"></div>` : "";
  }
  core.mostraAllegati = mostraAllegati;

  /* Modifica: modifica/<tipo>/<id|nuovo>/<rif>/<org> */
  V.modifica = async (p) => {
    const [tipo, id, rif, orgP] = p.split("/");
    const T = TIPI[tipo];
    if (!T) return { t: "Modifica", h: vuoto("Tipo non trovato.") };
    let r = id && id !== "nuovo" ? await R.get(id) : { tipo, dati: {}, rif: rif || null, org: orgP || S.org };
    if (!r) return { t: "Modifica", h: vuoto("Scheda non trovata.") };
    if (!r.id && rif) { const pad = await R.get(rif); if (pad) r.org = pad.org; }
    const opzColl = {};
    for (const c of T.campi) if (String(c[2]).startsWith("collega:")) opzColl[c[0]] = await R.lista(r.org, c[2].split(":")[1]);
    const cmp = T.campi.map((c) => campoForm(c, r, opzColl)).join("");
    return {
      t: (r.id ? "Modifica " : "Nuovo: ") + T.nome.toLowerCase(),
      h: `<div class="pad"><form data-form="scheda-salva" data-tipo="${esc(tipo)}" data-id="${esc(r.id || "")}" data-rif="${esc(r.rif || "")}" data-org="${esc(r.org || "")}" novalidate>${cmp}
        ${T.file && !r.id ? `<label class="campo"><span>Foto o file (facoltativo)</span><input type="file" name="__file" multiple ${T.foto ? 'accept="image/*,application/pdf"' : ""}></label>` : ""}
        <button class="btn" type="submit">Salva</button></form></div>`,
      dopo: (el) => { legaFirme(el); legaRighe(el); },
    };
  };

  function campoForm(c, r, opzColl) {
    const [k, et, tipo, o = {}] = c;
    let v = prendi(r, k);
    if ((v == null || v === "") && !r.id) v = o.oggi ? oggi() : o.predefinito || (k === "stato" && tipo === "scelta" ? c[3][0] : "");
    if (tipo === "scelta") return campo(et, `<select name="${k}">${c[3].map((x) => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>`);
    const req = o.obbl ? "required" : "";
    if (tipo === "lunga") return campo(et, `<textarea name="${k}" maxlength="2000">${esc(v)}</textarea>`);
    if (tipo === "data") return campo(et, `<input type="date" name="${k}" value="${esc(v || "")}" ${req}>`);
    if (tipo === "euro") return campo(et, `<input type="number" name="${k}" value="${esc(v ?? "")}" step="0.01" min="0" inputmode="decimal">`);
    if (tipo === "numero") return campo(et, `<input type="number" name="${k}" value="${esc(v ?? "")}" step="any" inputmode="decimal">`);
    if (tipo === "percento") return campo(et, `<input type="range" name="${k}" min="0" max="100" step="5" value="${Number(v) || 0}" data-percento><output>${Number(v) || 0}%</output>`);
    if (tipo === "sino") return `<label class="spunta"><input type="checkbox" name="${k}" ${v ? "checked" : ""}> <span>${esc(et)}</span></label>`;
    if (tipo === "tel") return campo(et, `<input type="tel" name="${k}" value="${esc(v)}" maxlength="30">`);
    if (tipo === "mail") return campo(et, `<input type="email" name="${k}" value="${esc(v)}" maxlength="120">`);
    if (tipo === "firma") return `<div class="campo"><span>${esc(et)}</span><div class="firma-box"><canvas class="firma" aria-label="Spazio per la firma"></canvas><input type="hidden" name="${k}" value="${esc(String(v || "").startsWith("data:image/png") ? v : "")}"><button type="button" class="link" data-cancella-firma>Cancella la firma</button></div></div>`;
    if (tipo === "righe") {
      const rr = Array.isArray(v) && v.length ? v : [{ d: "", q: 1, p: "" }];
      return `<fieldset class="campo"><legend>${esc(et)}</legend><div class="righe-ed">${rr.map((x) => rigaEd(x)).join("")}</div><button type="button" class="link" data-riga-piu>+ Aggiungi una voce</button></fieldset>`;
    }
    if (String(tipo).startsWith("collega:")) {
      const l = opzColl[k] || [];
      const sc = (r.dati || {})[k.slice(5)] || "";
      return campo(et, `<select name="${k}"><option value="">—</option>${l.map((x) => `<option value="${esc(x.id)}" ${x.id === sc ? "selected" : ""}>${esc(x.titolo)}</option>`).join("")}</select>`);
    }
    const sugg = o.suggerimenti ? `list="sugg-${k.replace(/\W/g, "")}"` : "";
    return campo(et, `<input name="${k}" value="${esc(v)}" maxlength="${k === "titolo" ? 160 : 400}" ${req} ${sugg}>${o.suggerimenti ? `<datalist id="sugg-${k.replace(/\W/g, "")}">${o.suggerimenti.map((x) => `<option value="${esc(x)}">`).join("")}</datalist>` : ""}`);
  }
  const rigaEd = (x) => `<div class="riga-ed"><input data-r="d" placeholder="Descrizione" value="${esc(x.d || "")}" maxlength="200"><input data-r="q" type="number" step="any" placeholder="Q.tà" value="${esc(x.q ?? "")}"><input data-r="p" type="number" step="0.01" placeholder="Prezzo" value="${esc(x.p ?? "")}"><button type="button" class="link" data-riga-via aria-label="Togli la voce">${I.no}</button></div>`;
  document.getElementById("app").addEventListener("input", (e) => { if (e.target.matches("input[data-percento]")) e.target.nextElementSibling.textContent = e.target.value + "%"; });
  function legaRighe(el) {
    el.querySelectorAll("[data-riga-piu]").forEach((b) => b.addEventListener("click", () => b.previousElementSibling.insertAdjacentHTML("beforeend", rigaEd({ q: 1 }))));
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-riga-via]"); if (b && el.querySelectorAll(".riga-ed").length > 1) b.parentElement.remove(); });
  }

  FORM["scheda-salva"] = async (f) => {
    const tipo = f.dataset.tipo, T = TIPI[tipo];
    const r = f.dataset.id ? await R.get(f.dataset.id) : { tipo, dati: {}, rif: f.dataset.rif || null, org: f.dataset.org || null };
    if (!r.org && r.rif) { const p = await R.get(r.rif); r.org = p && p.org; }
    if (!r.org) return toast("Manca l'azienda: torna indietro e riprova.", "errore");
    r.dati = Object.assign({}, r.dati);
    for (const c of T.campi) {
      const [k, et, t, o = {}] = c;
      let v;
      if (t === "righe") {
        v = Array.from(f.querySelectorAll(".riga-ed")).map((x) => ({ d: x.querySelector("[data-r=d]").value.trim(), q: Number(x.querySelector("[data-r=q]").value || 0), p: Number(x.querySelector("[data-r=p]").value || 0) })).filter((x) => x.d);
      } else if (t === "sino") v = !!(f.elements[k] && f.elements[k].checked);
      else if (t === "numero" || t === "percento") v = f.elements[k].value === "" ? null : Number(f.elements[k].value);
      else v = f.elements[k] ? f.elements[k].value.trim() : "";
      if (o.obbl && (v === "" || v == null)) return toast("Compila: " + et, "errore");
      if (String(t).startsWith("collega:")) { const sel = f.elements[k]; r.dati[k.slice(5) + "_nome"] = v ? sel.options[sel.selectedIndex].text : ""; }
      if (k.startsWith("dati.")) r.dati[k.slice(5)] = v; else r[k] = v;
    }
    if (tipo === "preventivo") {
      const imp = (r.dati.righe || []).reduce((s, x) => s + x.q * x.p, 0);
      r.importo = Math.round(imp * (1 + Number(r.dati.iva || 0) / 100) * 100) / 100;
    }
    if (tipo === "lotto") r.pubblico = r.stato === "aperto";
    if (tipo === "prodotto") r.pubblico = true;
    if (tipo === "dipendente" && !r.dati.codice) r.dati.codice = Math.random().toString(36).slice(2, 8).toUpperCase();
    if (core.HOOK.primaSalva && core.HOOK.primaSalva[tipo]) await core.HOOK.primaSalva[tipo](r);
    const salvata = await R.salva(r);
    const file = f.elements.__file && f.elements.__file.files;
    if (file && file.length && salvata) await caricaFile(salvata.org + "/" + salvata.id, file);
    toast("Salvato.");
    if (core.HOOK.dopoSalva[tipo]) await core.HOOK.dopoSalva[tipo](salvata, r);
    if (f.dataset.id) history.back(); else vai("scheda/" + salvata.id, true);
  };

  async function caricaFile(cartella, files) {
    let n = 0;
    for (const file of Array.from(files).slice(0, 10)) {
      if (file.size > 15 * 1024 * 1024) { toast(file.name + ": troppo grande (massimo 15 MB).", "errore"); continue; }
      const nome = Date.now() + "-" + file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
      try { await Q.file.carica(cartella + "/" + nome, file); n++; } catch (e) { console.error(e); toast("Non riesco a caricare " + file.name, "errore"); }
    }
    return n;
  }
  core.caricaFile = caricaFile;

  document.getElementById("app").addEventListener("change", async (e) => {
    const inp = e.target.closest("input[data-carica]");
    if (!inp || !inp.files.length) return;
    const n = await caricaFile(inp.dataset.carica, inp.files);
    if (n) { toast(n === 1 ? "File caricato." : n + " file caricati."); render(); }
  });

  AZIONI["elimina:"] = async (id) => {
    foglio(`<h2>Eliminare questa scheda?</h2><p class="sotto">Si cancellano anche le schede collegate. Non si torna indietro.</p>${btn("Sì, elimina", "elimina-ok:" + id)}<div style="height:8px"></div>${btn("No", "chiudi-foglio", "chiaro")}`);
  };
  AZIONI["elimina-ok:"] = async (id) => {
    try { await R.cancella(id); chiudiFoglio(); toast("Eliminata."); history.back(); } catch (e) { toast(spiegaErrore(e), "errore"); }
  };
  AZIONI["chiudi-foglio"] = () => chiudiFoglio();
  AZIONI.stampa = () => window.print();
}
