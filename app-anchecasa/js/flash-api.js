/* Sopralluogo Flash: nota vocale → computo → stima → link del cliente → ufficio tecnico → cantiere (parte 11, 11.10.2026).
   - vero: tabelle e funzioni SQL di app-11 e funzione Supabase «sopralluogo-flash» (Gemini);
   - prova: tutto simulato nel browser con dati di ESEMPIO (nessuna AI, prezzario finto e dichiarato finto). */
import { DB } from "./db.js";
import { Q } from "./q.js";
import { FE } from "./fe-api.js";
import { CONFIG } from "./config.js";

const PROVA = DB.prova;
const adesso = () => new Date().toISOString();
const oggi = () => new Date().toISOString().slice(0, 10);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));

export const REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];
export const FINITURE = [["base", "Base"], ["medio", "Medio"], ["alto", "Alto"]];
export const STILI = [["", "Da scegliere"], ["moderno_minimal", "Moderno minimal"], ["classico", "Classico"], ["industriale", "Industriale"], ["mediterraneo", "Mediterraneo"], ["scandinavo", "Scandinavo"], ["rustico", "Rustico"]];
export const TITOLI = { da_verificare: "Da verificare", edilizia_libera: "Edilizia libera", cila: "CILA", scia: "SCIA", scia_alternativa: "SCIA alternativa al permesso", pdc: "Permesso di costruire" };
export const UM = ["mq", "m", "n", "corpo"];

/* Stessi testi della funzione SQL app_stile_tavola: la prova li usa, il vero li riceve dal database. */
const TAVOLE = {
  moderno_minimal: { nome: "Moderno minimal", colori: ["#F2F1EE", "#D9D6D0", "#8C8A86", "#2B2B2B"], materiali: ["Gres effetto cemento grande formato", "Laccato opaco bianco", "Profili neri sottili"], parole: ["Linee pulite", "Pochi oggetti", "Luce diffusa"] },
  classico: { nome: "Classico", colori: ["#F4EDE1", "#C9B79C", "#8A6E4B", "#3E2F22"], materiali: ["Parquet a spina", "Boiserie", "Ottone"], parole: ["Simmetria", "Cornici", "Calore"] },
  industriale: { nome: "Industriale", colori: ["#E6E3DF", "#9A9590", "#5A5550", "#1F1E1D"], materiali: ["Microcemento", "Ferro nero", "Mattone a vista"], parole: ["Materia", "Struttura", "Contrasto"] },
  mediterraneo: { nome: "Mediterraneo", colori: ["#FBFAF6", "#E9E1D3", "#2F6FA3", "#C76B3E"], materiali: ["Calce bianca", "Cotto", "Maiolica decorata"], parole: ["Luce", "Curve morbide", "Blu e terra"] },
  scandinavo: { nome: "Scandinavo", colori: ["#FAFAF7", "#E4DDD2", "#B8A88F", "#3D4A4F"], materiali: ["Rovere chiaro", "Tessuti naturali", "Ceramica opaca"], parole: ["Semplicità", "Legno", "Accoglienza"] },
  rustico: { nome: "Rustico", colori: ["#F1E9DD", "#C8A27C", "#7B5A3C", "#3B2C20"], materiali: ["Travi in legno", "Pietra", "Cotto fatto a mano"], parole: ["Tradizione", "Materiali veri", "Calore"] },
};
export const tavola = (stile) => TAVOLE[stile] || null;

const LAVORAZIONI = [
  ["demolizione_pavimenti", "Demolizione di pavimenti e massetti", "mq"], ["demolizione_rivestimenti", "Demolizione di rivestimenti", "mq"], ["demolizione_tramezzi", "Demolizione di tramezzi", "mq"],
  ["rimozione_sanitari", "Rimozione di sanitari", "n"], ["massetto", "Massetto di sottofondo", "mq"], ["pavimento", "Pavimento posato", "mq"], ["rivestimento", "Rivestimento posato", "mq"],
  ["tramezzo", "Tramezzo in laterizio o cartongesso", "mq"], ["intonaco", "Intonaco", "mq"], ["tinteggiatura", "Tinteggiatura", "mq"], ["impianto_elettrico", "Impianto elettrico (punti)", "n"],
  ["impianto_idrico", "Impianto idrico-sanitario (punti)", "n"], ["sanitari", "Fornitura e posa di sanitari", "n"], ["porte_interne", "Porte interne", "n"], ["infissi", "Infissi esterni", "mq"],
  ["caldaia", "Caldaia o generatore", "n"], ["ponteggio", "Ponteggio", "mq"], ["smaltimento", "Trasporto e smaltimento macerie", "corpo"],
];
const IMPOSTAZIONI = { finitura: { base: 1.0, medio: 1.2, alto: 1.5 }, forbice: 0.12, link_giorni: 60, audio_giorni: 90 };

/* ======================================================================== */
/* PROVA: tabelle di esempio, una volta sola                                  */
/* ======================================================================== */
async function semina() {
  if (!PROVA) return;
  await FE.semina();
  if ((await Q.sel("app_stima_lavorazioni", { lim: 1 })).length) return;
  await Q.ins("app_stima_lavorazioni", LAVORAZIONI.map(([chiave, nome, um]) => ({ chiave, nome, um, aliquota: 10, attiva: true })));
  // Prezzario FINTO, solo per vedere il funzionamento nella prova: nel vero lo carica l'admin dal file della Regione.
  const pz = "pz-esempio";
  await Q.ins("app_prezzari", { id: pz, fonte: "Prezzario di ESEMPIO (prezzi finti)", regione: "Lazio", anno: 2026, attivo: true, nota: "Solo per la prova: non sono prezzi veri.", caricato: adesso() });
  const voci = [["ES.01", "demolizione_pavimenti", 12], ["ES.02", "massetto", 18], ["ES.03", "pavimento", 40], ["ES.04", "rivestimento", 42], ["ES.05", "tinteggiatura", 8], ["ES.06", "impianto_idrico", 180], ["ES.07", "smaltimento", 450]];
  await Q.ins("app_prezzari_voci", voci.map(([codice, lav, prezzo]) => ({ prezzario: pz, codice, descrizione: "ESEMPIO · " + (LAVORAZIONI.find((l) => l[0] === lav) || [])[1], um: (LAVORAZIONI.find((l) => l[0] === lav) || [])[2], prezzo })));
  await Q.ins("app_stima_riferimenti", voci.map(([codice, lavorazione]) => ({ lavorazione, regione: "Lazio", prezzario: pz, codice })));
}

function provaPrezzo(rif, voci, prezzari, lav, regione) {
  const r = rif.find((x) => x.lavorazione === lav && x.regione === regione);
  if (!r || !prezzari.some((p) => p.id === r.prezzario && p.attivo)) return null;
  const v = voci.find((x) => x.prezzario === r.prezzario && x.codice === r.codice);
  return v ? Number(v.prezzo) : null;
}
async function provaStima(id) {
  const s = await Q.uno("app_sopralluoghi", { id });
  const [rif, voci, prezzari] = await Promise.all([Q.sel("app_stima_riferimenti", { lim: 5000 }), Q.sel("app_prezzari_voci", { lim: 5000 }), Q.sel("app_prezzari")]);
  const coef = IMPOSTAZIONI.finitura[s.finitura || "medio"] || 1, f = IMPOSTAZIONI.forbice;
  let tot = 0; const note = [];
  (s.computo || []).forEach((r) => {
    const p = r.prezzo !== undefined && r.prezzo !== "" && r.prezzo !== null ? Number(r.prezzo) : provaPrezzo(rif, voci, prezzari, r.lavorazione, s.regione);
    if (p == null) { note.push("Senza prezzo: " + (r.descrizione || r.lavorazione)); return; }
    tot += p * (Number(r.quantita) || 0);
  });
  if (!s.regione) note.push("Manca la regione del cantiere: non so quale prezzario usare.");
  const min = tot > 0 ? Math.round(tot * coef * (1 - f) / 10) * 10 : null, max = tot > 0 ? Math.round(tot * coef * (1 + f) / 10) * 10 : null;
  await Q.upd("app_sopralluoghi", { id }, { stima_min: min, stima_max: max, stima_note: note });
  return { min, max, note };
}

/* ======================================================================== */
/* API usata dalle viste                                                     */
/* ======================================================================== */
export const FL = {
  prova: PROVA,
  semina,
  sopralluogo: (id) => Q.uno("app_sopralluoghi", { id }),
  lavorazioni: () => Q.sel("app_stima_lavorazioni", { ord: ["chiave", true], lim: 500 }),

  /** Campi del Flash che scrive l'agente o l'ufficio (gli altri li protegge il database). */
  async salva(id, patch) {
    const campi = ["comune", "regione", "mq", "finitura", "stile", "audio", "computo", "computo_validato"];
    const riga = {}; campi.forEach((k) => { if (patch[k] !== undefined) riga[k] = patch[k]; });
    await Q.upd("app_sopralluoghi", { id }, riga);
  },

  /* --- nota vocale --- */
  async caricaAudio(id, blob) {
    const base = String(blob.type || "").split(";")[0].replace("audio/x-m4a", "audio/mp4").replace("audio/aac", "audio/mp4");
    const est = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/ogg": "ogg", "video/webm": "webm", "video/mp4": "mp4" }[base];
    if (!est) throw new Error("formato_audio");
    const tipo = base.startsWith("video/") ? base.replace("video/", "audio/") : base;
    const nome = "nota-" + Date.now().toString(36);
    const percorso = `${id}/a/${nome}.${est}`;
    await Q.file.carica(percorso, new Blob([blob], { type: tipo }), "sopralluoghi");
    await FL.salva(id, { audio: percorso });
    return percorso;
  },
  urlAudio: (percorso) => (percorso ? Q.file.url(percorso, "sopralluoghi") : Promise.resolve("")),

  /** Manda la nota all'AI: trascrizione, computo, titolo edilizio suggerito, stima. */
  async analizza(id) {
    if (!PROVA) return Q.funzione("sopralluogo-flash", { sopralluogo: id });
    await new Promise((r) => setTimeout(r, 1500));
    const s = await Q.uno("app_sopralluoghi", { id });
    if (!s.audio) throw new Error("manca_la_nota_vocale");
    const trascrizione = "(ESEMPIO, nella prova non si usa l'AI) Bagno di circa 6 metri quadri: togliere pavimento e rivestimento, rifare massetto, pavimento e rivestimento fino a 2 metri, spostare il lavabo. Tinteggiare il corridoio, circa 30 metri quadri di pareti.";
    const computo = [
      { lavorazione: "demolizione_pavimenti", descrizione: "Rimozione pavimento bagno", quantita: 6, um: "mq", stanza: "bagno" },
      { lavorazione: "demolizione_rivestimenti", descrizione: "Rimozione rivestimento bagno", quantita: 0, um: "mq", stanza: "bagno" },
      { lavorazione: "massetto", descrizione: "Nuovo massetto bagno", quantita: 6, um: "mq", stanza: "bagno" },
      { lavorazione: "pavimento", descrizione: "Pavimento bagno", quantita: 6, um: "mq", stanza: "bagno" },
      { lavorazione: "rivestimento", descrizione: "Rivestimento bagno h 2 m", quantita: 0, um: "mq", stanza: "bagno" },
      { lavorazione: "impianto_idrico", descrizione: "Spostamento attacchi lavabo", quantita: 2, um: "n", stanza: "bagno" },
      { lavorazione: "tinteggiatura", descrizione: "Tinteggiatura corridoio", quantita: 30, um: "mq", stanza: "corridoio" },
      { lavorazione: "smaltimento", descrizione: "Trasporto e smaltimento macerie", quantita: 1, um: "corpo", stanza: "" },
    ];
    const giorni = IMPOSTAZIONI.audio_giorni;
    const patch = { trascrizione, audio_scade: new Date(Date.now() + giorni * 864e5).toISOString().slice(0, 10) };
    if (!s.computo_validato) patch.computo = computo;
    if (s.stato === "programmato") patch.stato = "completato";
    await Q.upd("app_sopralluoghi", { id }, patch);
    const p = await Q.uno("app_sopralluoghi_pratica", { sopralluogo: id });
    const tit = { titolo: "edilizia_libera", titolo_motivo: "(ESEMPIO) Rifacimento di finiture e spostamento di un attacco senza toccare strutture: di solito edilizia libera. Il tecnico verifica." };
    if (!p) await Q.ins("app_sopralluoghi_pratica", Object.assign({ sopralluogo: id, titolo_da: "ai", vincolo_paesaggistico: "da_verificare", zona_sismica: "da_verificare", altri_vincoli: "", note: "" }, tit));
    else if (p.titolo_da === "ai") await Q.upd("app_sopralluoghi_pratica", { sopralluogo: id }, tit);
    const stima = await provaStima(id);
    return { ok: true, trascrizione, computo: s.computo_validato ? s.computo : computo, titolo: tit.titolo, titolo_motivo: tit.titolo_motivo, dubbi: ["Altezza e superficie del rivestimento non dette: quantità a 0."], computo_tenuto: !!s.computo_validato, stima };
  },
  stima: (id) => (PROVA ? provaStima(id) : Q.rpc("app_stima_calcola", { p_sopralluogo: id })),

  /** Manda all'ufficio e crea il link del cliente. Restituisce il token. */
  async invia(id) {
    if (!PROVA) return Q.rpc("app_sopralluogo_invia", { p_sopralluogo: id });
    const s = await Q.uno("app_sopralluoghi", { id });
    const tok = s.link || uuid();
    await Q.upd("app_sopralluoghi", { id }, { link: tok, link_scade: new Date(Date.now() + IMPOSTAZIONI.link_giorni * 864e5).toISOString(), stato: ["programmato", "completato"].includes(s.stato) ? "in_ufficio" : s.stato, in_ufficio_il: s.in_ufficio_il || adesso() });
    return tok;
  },
  linkCliente: (tok) => location.origin + location.pathname + (PROVA ? "?prova" : "") + "#/stima/" + tok,

  /* --- pagina del cliente (senza password) --- */
  async pubblica(tok) {
    if (!PROVA) return Q.rpc("app_stima_pubblica", { p_token: tok });
    const s = (await Q.sel("app_sopralluoghi", { eq: { link: tok } }))[0];
    if (!s || s.stato === "annullato" || new Date(s.link_scade) < new Date()) return { trovato: false };
    const p = await Q.uno("app_sopralluoghi_pratica", { sopralluogo: s.id });
    const prev = s.preventivo ? await Q.uno("app_fe_documenti", { id: s.preventivo }) : null;
    let cantiere = null;
    if (s.cantiere) {
      const c = await Q.uno("app_record", { id: s.cantiere });
      const fasi = (await Q.sel("app_record", { eq: { rif: s.cantiere, tipo: "fase" } })).map((f) => ({ titolo: f.titolo, avanzamento: Number((f.dati || {}).avanzamento) || 0, inizio: f.data, fine: f.scadenza }));
      const giornale = (await Q.sel("app_record", { eq: { rif: s.cantiere, tipo: "giornale" }, ord: ["data", false], lim: 8 })).map((g) => ({ data: g.data, testo: String(g.titolo || "").slice(0, 160) }));
      cantiere = { codice: (c.dati || {}).codice || "", stato: c.stato, inizio: c.data, fasi, giornale, avanzamento: fasi.length ? Math.round(fasi.reduce((a, f) => a + f.avanzamento, 0) / fasi.length) : null, fatture: 0 };
    }
    const org = await Q.uno("app_org", { id: s.org });
    const k = await Q.uno("app_computi", { sopralluogo: s.id });
    const prof = await Q.uno("app_fe_profili", { org: s.org });
    return { trovato: true, ditta: org ? org.nome : "", ditta_logo: prof && String(prof.logo || "").startsWith("loghi/") ? prof.logo : null, ufficiale: !!(k && k.blindato_il), stato: s.stato, quando: s.quando, comune: s.comune, lavori: s.lavori, mq: s.mq, finitura: s.finitura, stile: tavola(s.stile), stima_min: s.stima_min, stima_max: s.stima_max, budget_ok: !!s.budget_ok_il,
      pratica: p ? { titolo: p.titolo, confermato: p.titolo_da === "tecnico" } : null, preventivo: prev ? { stato: prev.stato_preventivo } : null, cantiere, scade: s.link_scade };
  },
  async okBudget(tok) {
    if (!PROVA) return Q.rpc("app_stima_ok_budget", { p_token: tok });
    const s = (await Q.sel("app_sopralluoghi", { eq: { link: tok } }))[0];
    if (!s || !["in_ufficio", "completato", "programmato", "budget_ok"].includes(s.stato) || s.stima_min == null) return false;
    if (!s.budget_ok_il) await Q.upd("app_sopralluoghi", { id: s.id }, { budget_ok_il: adesso(), stato: "budget_ok" });
    return true;
  },

  /* --- foto, video, planimetrie per stanza --- */
  media: (id) => Q.sel("app_sopralluoghi_media", { eq: { sopralluogo: id }, ord: ["creato", true], lim: 200 }),
  async caricaMedia(id, file, stanza) {
    const t = String(file.type || "");
    const est = { "image/jpeg": "jpg", "image/png": "png", "video/mp4": "mp4", "video/webm": "webm", "application/pdf": "pdf" }[t];
    if (!est) throw new Error("formato_file");
    if (file.size > 50 * 1024 * 1024) throw new Error("file_troppo_grande");
    const tipo = t === "application/pdf" ? "planimetria" : t.startsWith("video/") ? "video" : "foto";
    const nome = `${id}/m/${uuid()}.${est}`;
    await Q.file.carica(nome, file, "sopralluoghi");
    const riga = { sopralluogo: id, tipo, file: nome, stanza: String(stanza || "").trim().slice(0, 40) };
    if (PROVA) Object.assign(riga, { id: uuid(), creato: adesso() });
    return Q.ins("app_sopralluoghi_media", riga);
  },
  urlMedia: (nome) => Q.file.url(nome, "sopralluoghi"),

  /* --- pratica edilizia e ufficio del comune --- */
  pratica: (id) => Q.uno("app_sopralluoghi_pratica", { sopralluogo: id }),
  async salvaPratica(id, dati) {
    const campi = ["titolo", "titolo_motivo", "vincolo_paesaggistico", "zona_sismica", "altri_vincoli", "note"];
    const riga = {}; campi.forEach((k) => { if (dati[k] !== undefined) riga[k] = dati[k]; });
    if (PROVA) Object.assign(riga, { titolo_da: "tecnico", verificato_da: DB.idUtente(), verificato_il: adesso() }); // nel vero lo fa il database
    if (await Q.uno("app_sopralluoghi_pratica", { sopralluogo: id })) await Q.upd("app_sopralluoghi_pratica", { sopralluogo: id }, riga);
    else await Q.ins("app_sopralluoghi_pratica", Object.assign({ sopralluogo: id }, riga));
  },
  async sue(comune) { return comune ? (await Q.sel("app_comuni_sue", { eq: { comune } }))[0] || null : null; },
  async salvaSue(r) {
    const riga = { comune: r.comune, provincia: r.provincia || "", ufficio: r.ufficio || "", pec: r.pec || "", telefono: r.telefono || "", sito: r.sito || "", note: r.note || "" };
    if (PROVA) riga.aggiornato = adesso();
    if (await Q.uno("app_comuni_sue", { comune: riga.comune, provincia: riga.provincia })) await Q.upd("app_comuni_sue", { comune: riga.comune, provincia: riga.provincia }, riga);
    else await Q.ins("app_comuni_sue", riga);
  },

  /* --- un click: cantiere attivo --- */
  async converti(id) {
    if (!PROVA) return Q.rpc("app_converti_in_cantiere", { p_sopralluogo: id });
    const s = await Q.uno("app_sopralluoghi", { id });
    if (s.cantiere) return s.cantiere;
    if (!(s.computo || []).length) throw new Error("computo_vuoto");
    if (!s.computo_validato) throw new Error("computo_da_validare");
    const pid = s.preventivo || await FE.aPreventivo(id);
    if (!(await FE.righe(pid)).length) {
      const [rif, voci, prezzari, lav] = await Promise.all([Q.sel("app_stima_riferimenti", { lim: 5000 }), Q.sel("app_prezzari_voci", { lim: 5000 }), Q.sel("app_prezzari"), FL.lavorazioni()]);
      const righe = s.computo.map((r) => ({ descrizione: r.descrizione || r.lavorazione || "Lavorazione", quantita: Number(r.quantita) || 1, um: r.um || "",
        prezzo: r.prezzo !== undefined && r.prezzo !== "" && r.prezzo !== null ? Number(r.prezzo) : provaPrezzo(rif, voci, prezzari, r.lavorazione, s.regione) || 0,
        sconto: 0, aliquota: ((lav.find((l) => l.chiave === r.lavorazione) || {}).aliquota) || 10 }));
      await FE.salva({ id: pid }, righe);
    }
    await FE.statoPreventivo(pid, "accettato");
    const cant = await FE.apriCantiere(pid);
    const anno = new Date().getFullYear();
    const tutti = (await Q.sel("app_record", { eq: { tipo: "cantiere" }, lim: 5000 })).map((c) => (c.dati || {}).codice).filter((x) => String(x || "").startsWith("AC-" + anno + "-"));
    const codice = "AC-" + anno + "-" + String(tutti.length + 1).padStart(4, "0");
    const c = await Q.uno("app_record", { id: cant });
    const prev = await FE.documento(pid);
    await Q.upd("app_record", { id: cant }, { stato: "aperto", dati: Object.assign({}, c.dati || {}, { codice, budget: prev.totale, stima_min: s.stima_min, stima_max: s.stima_max, comune: s.comune, regione: s.regione }) });
    await Q.upd("app_sopralluoghi", { id }, { stato: "convertito" });
    return cant;
  },

  /* --- logo della ditta (cartella pubblica «loghi», per la pagina del cliente) --- */
  urlLogo(percorso) {
    if (!percorso || !String(percorso).startsWith("loghi/")) return Promise.resolve("");
    if (PROVA) return Q.file.url(String(percorso).slice(6), "loghi");
    return Promise.resolve(`${CONFIG.supabaseUrl}/storage/v1/object/public/${String(percorso).split("/").map(encodeURIComponent).join("/")}`);
  },
  async caricaLogo(org, file) {
    const est = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[file.type];
    if (!est) throw new Error("formato_logo");
    if (file.size > 1024 * 1024) throw new Error("logo_troppo_grande");
    if (!(await Q.uno("app_fe_profili", { org }))) throw new Error("prima_i_dati_fiscali");
    const nome = `${org}/logo-${Date.now().toString(36)}.${est}`;
    await Q.file.carica(nome, file, "loghi");
    await Q.upd("app_fe_profili", { org }, { logo: "loghi/" + nome });
    return "loghi/" + nome;
  },

  /* --- admin: prezzari regionali e collegamento con le lavorazioni --- */
  prezzari: () => Q.sel("app_prezzari", { ord: ["caricato", false], lim: 200 }),
  async importaPrezzario(testa, voci) {
    const riga = { fonte: testa.fonte, regione: testa.regione, anno: Number(testa.anno), attivo: true, nota: testa.nota || "" };
    if (PROVA) Object.assign(riga, { id: uuid(), caricato: adesso() });
    const p = await Q.ins("app_prezzari", riga);
    for (let i = 0; i < voci.length; i += 500) await Q.ins("app_prezzari_voci", voci.slice(i, i + 500).map((v) => Object.assign({ prezzario: p.id }, v)));
    return p;
  },
  attivaPrezzario: (id, si) => Q.upd("app_prezzari", { id }, { attivo: !!si }),
  riferimenti: (regione) => Q.sel("app_stima_riferimenti", { eq: { regione }, lim: 500 }),
  voce: (prezzario, codice) => Q.uno("app_prezzari_voci", { prezzario, codice }),
  async salvaRiferimento(lavorazione, regione, prezzario, codice) {
    await Q.del("app_stima_riferimenti", { lavorazione, regione });
    if (prezzario && codice) await Q.ins("app_stima_riferimenti", { lavorazione, regione, prezzario, codice });
  },
};

/** Legge un CSV di prezzario (separatore ; o ,). Servono le colonne codice, descrizione, prezzo; unità facoltativa.
    Prezzi all'italiana (1.234,56) o all'inglese (1234.56). Restituisce { voci, scartate }. */
export function leggiCsv(testo) {
  const righe = []; let campo = "", riga = [], virg = false;
  const sep = (testo.split("\n")[0].match(/;/g) || []).length >= (testo.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < testo.length; i++) {
    const c = testo[i];
    if (virg) { if (c === '"' && testo[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') virg = false; else campo += c; continue; }
    if (c === '"') virg = true; else if (c === sep) { riga.push(campo); campo = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && testo[i + 1] === "\n") i++; riga.push(campo); righe.push(riga); riga = []; campo = ""; } else campo += c;
  }
  if (campo || riga.length) { riga.push(campo); righe.push(riga); }
  const testa = (righe.shift() || []).map((h) => h.trim().toLowerCase());
  const col = (...nomi) => testa.findIndex((h) => nomi.some((n) => h === n || h.startsWith(n)));
  const ic = col("codice", "cod", "articolo"), id = col("descrizione", "desc", "voce"), iu = col("um", "u.m", "unità", "unita"), ip = col("prezzo", "importo", "euro", "€");
  if (ic < 0 || id < 0 || ip < 0) throw new Error("colonne_mancanti");
  const prezzo = (s) => { let x = String(s || "").replace(/[€\s]/g, ""); if (/,\d{1,4}$/.test(x)) x = x.replace(/\./g, "").replace(",", "."); else x = x.replace(/,/g, ""); const n = Number(x); return Number.isFinite(n) && n >= 0 && x !== "" ? n : null; };
  const voci = []; let scartate = 0; const visti = new Set();
  righe.forEach((r) => {
    const codice = String(r[ic] || "").trim().slice(0, 40), descrizione = String(r[id] || "").trim().slice(0, 2000), p = prezzo(r[ip]);
    if (!codice || !descrizione || p == null || visti.has(codice)) { if (r.some((x) => String(x).trim())) scartate++; return; }
    visti.add(codice);
    voci.push({ codice, descrizione, um: iu >= 0 ? String(r[iu] || "").trim().slice(0, 20) : "", prezzo: p });
  });
  return { voci, scartate };
}

export { oggi };
