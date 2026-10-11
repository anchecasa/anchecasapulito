/* Dashboard a pulsanti dell'app (entra.anchecasa.it). 11.10.2026.
   L'aspetto arriva da app_stato_pulsanti() quando il database ce l'ha.
   I pacchetti (pacchetti.js) decidono quali moduli proporre al mestiere e all'ATECO. */
import { I, esc, sez, campo, btn, vuoto, avviso, toast, spiegaErrore } from "./ui.js";
import { Q } from "./q.js";
import { moduliDelMestiere } from "./pacchetti.js";

const COMUNI = ["cambia-profilo", "notifiche", "profilo", "abbonamento", "invita", "assistenza"];
const PREZZI = { sicurezza: "9 €", sicantiere: "19 €", cantieri: "29 €", gare: "29 €", lotti: "9 €", centralino: "19 €", magazzino: "9 €", base: "Prova gratis" };

const CATALOGO = [
  ["guasto", "privato", "Ho un guasto", "nessuno", "", ["guasto"], "filma", "video"],
  ["trova", "privato", "Trova un artigiano o un'impresa", "nessuno", "", ["guasto", "ristrutturo"], "cerca", "cerca"],
  ["ristruttura", "privato", "Ristruttura con AncheCasa", "telefono", "", ["ristrutturo"], "ristruttura", "casa"],
  ["mio-cantiere", "privato", "Il mio cantiere", "nessuno", "", ["ristrutturo"], "cl-home", "gru"],
  ["vendo", "privato", "Vendo o affitto", "telefono", "", ["vendo"], "bacheca/vendita", "casa"],
  ["cerco-casa", "privato", "Cerco casa", "telefono", "", ["cerco-casa"], "bacheca", "cerca"],
  ["cerco-lavoro", "privato", "Cerco lavoro", "telefono", "", ["cerco-lavoro"], "bacheca/lavoro", "ufficio"],
  ["richieste", "privato", "Richieste", "telefono", "", [], "richieste", "lista"],
  ["chat", "privato", "Chat", "telefono", "", [], "chat", "chat"],
  ["bollette", "privato", "Check Bollette", "nessuno", "", [], "https://magazine.anchecasa.it/check-bollette", "euro"],
  ["segnala", "privato", "Segnala ad AncheCasa", "nessuno", "", [], "segnala", "rete"],
  ["corsi", "privato", "Corsi AncheSicura", "nessuno", "", [], "https://sicura.anchecasa.it/corsi", "corso"],
  ["ricevi-clienti", "azienda", "Ricevi clienti", "piva_verificata", "", ["ricevo-clienti"], "im-home", "rete"],
  ["pubblico-lavoro", "azienda", "Pubblico un lavoro o un appalto", "piva_verificata", "", ["pubblico-lavoro"], "im-crea", "doc"],
  ["cerco-fornitori", "azienda", "Cerco fornitori", "piva_verificata", "", ["cerco-fornitori"], "fo-lotti", "box"],
  ["richieste-ricevute", "fornitore", "Richieste ricevute", "nessuno", "", ["rispondo"], "fo-home", "lista"],
  ["tutte-richieste", "fornitore", "Tutte le richieste della zona", "abbonamento", "base", ["rispondo"], "fo-lotti", "cerca"],
  ["rispondo-gare", "fornitore", "Rispondo a gare e richieste", "nessuno", "", ["rispondo"], "offerte", "gara"],
  ["mod-ufficio", "lavoro", "Ufficio", "abbonamento", "ufficio", [], "im-home", "ufficio"],
  ["mod-sicurezza", "lavoro", "Sicurezza", "modulo", "sicurezza", [], "im-home", "scudo"],
  ["mod-sicantiere", "lavoro", "Sicurezza Cantiere", "modulo", "sicantiere", ["cantieri"], "im-home", "casco"],
  ["mod-cantieri", "lavoro", "Gestisco i cantieri", "modulo", "cantieri", ["cantieri"], "im-home", "gru"],
  ["mod-gare", "lavoro", "Partecipo a gare", "modulo", "gare", ["gare"], "im-home", "gara"],
  ["mod-lotti", "lavoro", "Lotti e subappalti", "modulo", "lotti", [], "im-home", "lotti"],
  ["mod-centralino", "lavoro", "Centralino", "modulo", "centralino", [], "im-home", "tel"],
  ["mod-magazzino", "lavoro", "Magazzino e mezzi", "modulo", "magazzino", [], "im-home", "box"],
  ["flash", "lavoro", "Sopralluogo Flash", "abbonamento", "ufficio", ["cantieri"], "im-home", "video"],
  ["cambia-profilo", "tutti", "Cambia profilo", "nessuno", "", [], "", "utente"],
  ["notifiche", "tutti", "Notifiche", "nessuno", "", [], "notifiche", "campana"],
  ["profilo", "tutti", "Profilo", "nessuno", "", [], "profilo", "utente"],
  ["abbonamento", "tutti", "Abbonamento e moduli", "nessuno", "", [], "im-moduli", "euro"],
  ["invita", "tutti", "Invita", "nessuno", "", [], "profilo", "rete"],
  ["assistenza", "tutti", "Assistenza", "nessuno", "", [], "mailto:info@anchecasa.it", "chat"],
];

function riga(id, cat, nome, req, modulo, obiettivi, vai, ico) {
  return { id, categoria: cat, nome, requisito: req, modulo, obiettivi, vai, ico, prezzo: PREZZI[modulo] || "" };
}
const LISTA = CATALOGO.map((x) => riga(...x));

export function installa(core) {
  const { S, V, AZIONI, PROFILI, vai, render } = core;

  V.home = () => schermo(core, "privato");
  if (PROFILI.impresa) PROFILI.impresa.tabs[0] = ["dash", "casa", "Home"];
  if (PROFILI.fornitore) PROFILI.fornitore.tabs[0] = ["dash", "casa", "Home"];
  V.dash = () => schermo(core, S.base === "fornitore" ? "fornitore" : "azienda");

  const ATECO_PASSO = [
    ["41.20", "Costruzione di edifici"], ["43.21", "Impianti elettrici"], ["43.22", "Impianti idraulici e di riscaldamento"],
    ["43.29", "Altri impianti"], ["43.31", "Intonacatura"], ["43.32", "Posa in opera di infissi"], ["43.33", "Rivestimenti e pavimenti"],
    ["43.34", "Tinteggiatura"], ["43.39", "Altri lavori di completamento"], ["43.91", "Coperture"],
    ["46.73", "Commercio di materiali edili"], ["77.32", "Noleggio di macchine per l'edilizia"], ["62.01", "Programmazione informatica"],
  ];
  const torna = () => (S.base === "privato" || S.ruolo === "privato" ? "home" : "dash");

  V.passo = async (quale) => {
    const c = await contesto(S);
    const passo = PASSI.includes(quale) ? quale : "telefono";
    if (passo === "telefono") {
      const tel = (S.profilo && S.profilo.telefono) || "";
      return { t: "Telefono", back: true, h: `<div class="pad"><p class="sotto">Con il numero puoi pubblicare e scrivere in chat.</p>
        ${campo("Telefono", `<input name="telefono" type="tel" value="${esc(tel)}" maxlength="30" autocomplete="tel">`)}
        ${btn("Salva il numero", "salva-passo:telefono")}</div>` };
    }
    if (passo === "piva") {
      const piva = (c.org && c.org.piva) || "";
      return { t: "Partita IVA", back: true, h: `<div class="pad"><p class="sotto">11 cifre. Senza la partita IVA l'azienda non diventa verificata.</p>
        ${campo("Partita IVA", `<input name="piva" inputmode="numeric" value="${esc(piva)}" maxlength="20">`)}
        ${btn("Salva la partita IVA", "salva-passo:piva")}</div>` };
    }
    if (passo === "categorie") {
      const gia = new Set((c.org && c.org.ateco) || []);
      const caselle = ATECO_PASSO.map(([cod, nome]) => `<label class="riga"><input type="checkbox" name="ateco" value="${cod}" ${gia.has(cod) ? "checked" : ""}><span>${esc(cod + " · " + nome)}</span></label>`).join("");
      return { t: "Categorie", back: true, h: `<div class="pad"><p class="sotto">Scegli i codici della tua attività.</p><div class="card">${caselle}</div><div style="height:12px"></div>${btn("Salva le categorie", "salva-passo:categorie")}</div>` };
    }
    return { t: "Documenti", back: true, h: `<div class="pad"><p class="sotto">Visura o un documento della ditta. L'amministrazione lo controlla e poi l'azienda è verificata.</p>
      ${campo("Documento", `<input name="documento" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp">`)}
      ${btn("Invia il documento", "salva-passo:documenti")}</div>` };
  };

  AZIONI["salva-passo:"] = async (quale) => {
    const box = document.getElementById("schermo");
    if (quale === "telefono") {
      const tel = ((box && box.querySelector('[name="telefono"]')) || {}).value || "";
      if (String(tel).replace(/\D/g, "").length < 8) return toast("Scrivi il telefono, almeno 8 cifre.", "errore");
      await core.DB.salvaProfilo({ nome: (S.profilo && S.profilo.nome) || "", citta: (S.profilo && S.profilo.citta) || "", telefono: tel.trim() });
      if (S.profilo) S.profilo.telefono = tel.trim();
      try { await Q.rpc("app_profilo_passo", { p_passo: 4, p_obiettivi: null, p_telefono: tel.trim(), p_ateco: null, p_zone: null, p_modo: null }); } catch (e) { /* app-14 non ancora sul database */ }
      toast("Telefono salvato."); vai(torna(), true); return;
    }
    if (!S.org) return toast("Manca l'azienda collegata a questo profilo.", "errore");
    if (quale === "piva") {
      const piva = (((box && box.querySelector('[name="piva"]')) || {}).value || "").replace(/\D/g, "");
      if (piva.length !== 11) return toast("La partita IVA ha 11 cifre.", "errore");
      await Q.upd("app_org", { id: S.org }, { piva });
      toast("Partita IVA salvata."); vai("passo/documenti", true); return;
    }
    if (quale === "categorie") {
      const scelti = box ? Array.from(box.querySelectorAll('input[name="ateco"]:checked')).map((x) => x.value) : [];
      if (!scelti.length) return toast("Scegli almeno una categoria.", "errore");
      await Q.upd("app_org", { id: S.org }, { ateco: scelti });
      try { await Q.rpc("app_profilo_passo", { p_passo: 3, p_obiettivi: null, p_telefono: null, p_ateco: scelti, p_zone: null, p_modo: null }); } catch (e) { /* app-14 non ancora sul database */ }
      toast("Categorie salvate."); vai("passo/documenti", true); return;
    }
    const file = box && box.querySelector('[name="documento"]') && box.querySelector('[name="documento"]').files[0];
    if (!file) return toast("Scegli un documento.", "errore");
    if (!core.DB.prova) {
      await Q.carica(S.org + "/verifica/" + Date.now() + "-" + file.name.replace(/[^\w.\-]+/g, "_"), file, "documenti");
    }
    toast("Documento inviato. L'amministrazione lo controlla."); vai(torna(), true);
  };

  const vecchiaHome = V["ad-home"];
  if (vecchiaHome) {
    V["ad-home"] = async () => {
      const out = await vecchiaHome();
      const blocco = sez("Iscrizioni", `<div class="griglia2">
        <div class="tile" data-go="ad-iscrizioni" role="button" tabindex="0"><span class="ico blu">${I.utente}</span><b>Iscrizioni: dove si fermano</b><small>Privato, azienda, fornitore</small></div>
        <div class="tile" data-go="ad-verifica" role="button" tabindex="0"><span class="ico arancio">${I.ufficio}</span><b>Aziende da verificare</b><small>Verifica, documento, sospendi</small></div>
      </div>`);
      out.h = out.h.replace('<div class="pad">', '<div class="pad">' + blocco);
      return out;
    };
  }

  V["ad-iscrizioni"] = async () => {
    let righe = [];
    let esempio = false;
    try { righe = await Q.rpc("app_iscrizione_dove", { p_giorni: 30 }) || []; } catch (e) { esempio = true; }
    if (!Array.isArray(righe)) righe = [];
    if (!righe.length && core.DB.prova) {
      esempio = true;
      righe = [
        { categoria: "privato", passo: "telefono", persone: 2 },
        { categoria: "azienda", passo: "documenti", persone: 1 },
        { categoria: "fornitore", passo: "ateco", persone: 1 },
      ];
    }
    return {
      t: "Iscrizioni: dove si fermano",
      h: `<div class="pad">${esempio ? avviso("Esempio: i numeri veri arrivano da app_iscrizione_dove, dopo app-14.") + '<div style="height:12px"></div>' : ""}
        ${righe.length ? righe.map((r) => `<div class="card"><b>${esc(r.categoria)}</b><p>Si fermano a «${esc(r.passo)}» · ${esc(r.persone)} ${Number(r.persone) === 1 ? "persona" : "persone"}</p></div>`).join("") : vuoto("Nessuno si è fermato in questi 30 giorni.")}</div>`,
    };
  };

  V["ad-verifica"] = async () => {
    const orgs = await Q.sel("app_org", { lim: 200 }).catch(() => []);
    const liste = orgs.filter((o) => o.tipo !== "gc" && (o.stato_verifica || "da_verificare") !== "verificata");
    const et = (o) => o.stato_verifica === "sospesa" ? "Sospesa" : "Da verificare";
    return {
      t: "Aziende da verificare",
      h: `<div class="pad">${liste.length ? liste.map((o) => `<div class="card"><b>${esc(o.nome)}</b><p>${esc(o.tipo)} · ${esc(o.piva || "senza P.IVA")} · ${esc(et(o))}${o.motivo_sospensione ? " · " + esc(o.motivo_sospensione) : ""}</p>
        <div class="btns">${btn("Verifica", "verifica-org:" + o.id + ":verificata", "piccolo")}${btn("Serve un documento", "verifica-org:" + o.id + ":da_verificare", "piccolo chiaro")}${btn("Sospendi", "verifica-org:" + o.id + ":sospesa", "piccolo chiaro")}</div></div>`).join("") : vuoto("Nessuna azienda da verificare.")}</div>`,
    };
  };

  AZIONI["verifica-org:"] = async (resto) => {
    const [id, esito] = String(resto).split(":");
    let motivo = "";
    if (esito === "sospesa") {
      motivo = window.prompt("Perché la sospendi?") || "";
      if (!motivo.trim()) return toast("Scrivi il motivo.", "errore");
    }
    try {
      await Q.rpc("app_org_verifica", { p_org: id, p_esito: esito, p_motivo: motivo });
    } catch (e) {
      await Q.upd("app_org", { id }, { stato_verifica: esito, motivo_sospensione: esito === "sospesa" ? motivo : "" }).catch(() => { throw e; });
    }
    toast(esito === "verificata" ? "Azienda verificata." : esito === "sospesa" ? "Azienda sospesa." : "Resta da verificare: serve un documento.");
    render();
  };

  AZIONI["chiedi-prova:"] = async (modulo) => {
    const mod = modulo || "base";
    if (!S.org) return toast("Prima completa i dati dell'azienda.", "errore");
    try {
      await Q.ins("app_moduli", { org: S.org, modulo: mod, stato: "richiesto", note: "Prova 14 giorni, provvisorio" });
      toast("Richiesta inviata. Prova di 14 giorni: AncheCasa la attiva, come oggi.");
    } catch (e) {
      toast(spiegaErrore(e).includes("duplicate") || /già|duplicate|unique/i.test(String(e && e.message)) ? "La richiesta è già partita." : spiegaErrore(e), "errore");
    }
    render();
  };

  AZIONI["apri-pulsante:"] = (id) => {
    const b = LISTA.find((x) => x.id === id);
    if (!b) return;
    if (b.id === "cambia-profilo") { AZIONI["cambia-ruolo"](); return; }
    if (/^https?:|mailto:/.test(b.vai)) { window.location.href = b.vai; return; }
    if (b.vai) vai(b.vai);
  };
}

async function contesto(S) {
  const orgId = S.org;
  let org = null;
  if (orgId) org = await Q.uno("app_org", { id: orgId }).catch(() => null);
  const ateco = (org && org.ateco) || [];
  const modo = org && Array.isArray(org.modo_fornitore) ? (org.modo_fornitore.length === 1 ? org.modo_fornitore[0] : "entrambi") : "";
  const tipo = (org && org.tipo) || (S.base === "fornitore" ? "fornitore" : "impresa");
  const proposti = moduliDelMestiere(ateco, tipo, modo);
  const moduli = orgId ? await Q.sel("app_moduli", { eq: { org: orgId } }).catch(() => []) : [];
  const attivo = (id) => moduli.some((m) => m.stato === "attivo" && (m.modulo === id || m.modulo === "pacchetto" || (id === "ufficio" && m.modulo === "base")));
  const haBase = attivo("base") || attivo("ufficio");
  const haCantiere = ((S.miei && S.miei.accessi) || []).some((a) => a.ruolo === "cliente");
  const telefono = String((S.profilo && S.profilo.telefono) || "").replace(/\D/g, "").length >= 8;
  const verificata = org && org.stato_verifica === "verificata";
  const haPiva = org && String(org.piva || "").replace(/\D/g, "").length === 11;
  const haAteco = org && Array.isArray(org.ateco) && org.ateco.length > 0;
  const obiettivi = (S.profilo && S.profilo.obiettivi) || [];
  return { org, proposti, attivo, haBase, haCantiere, telefono, verificata, haPiva, haAteco, obiettivi, profili: (S.profili || []).length };
}

export async function prezziVisibili() {
  try {
    const r = await Q.uno("app_impostazioni", { chiave: "prezzi_visibili" });
    return !!(r && (r.valore === true || r.valore === "true"));
  } catch (e) { return false; }
}

const PASSI = ["telefono", "piva", "documenti", "categorie"];
function passoMancante(b, c) {
  let p = b.passo === "ateco" ? "categorie" : (b.passo || "");
  if (p === "documenti" && c && !c.haPiva) p = "piva";
  else if (p === "documenti" && c && c.org && c.org.tipo === "fornitore" && !c.haAteco) p = "categorie";
  if (!PASSI.includes(p)) {
    const m = String(b.motivo || "").toLowerCase();
    if (m.includes("partita")) p = "piva";
    else if (m.includes("document")) p = "documenti";
    else if (m.includes("categor")) p = "categorie";
    else p = "telefono";
  }
  return p;
}

const MODULO_PULSANTE = {
  cantieri: "cantieri", "gare-azienda": "gare", "sicurezza-cantiere": "sicantiere", flash: "cantieri",
  "mod-ufficio": "ufficio", "mod-sicurezza": "sicurezza", "mod-sicantiere": "sicantiere",
  "mod-cantieri": "cantieri", "mod-gare": "gare", "mod-lotti": "lotti",
  "mod-centralino": "centralino", "mod-magazzino": "magazzino",
};
function nelPack(b, moduli) {
  const m = MODULO_PULSANTE[b.id];
  return !m || moduli.has(m);
}

function aspettoLocale(b, cat, c) {
  if (b.categoria !== "tutti" && b.categoria !== cat && !(b.categoria === "lavoro" && (cat === "azienda" || cat === "fornitore"))) {
    return { aspetto: "nascosto" };
  }
  if (b.id === "mod-centralino" && !c.attivo("centralino")) return { aspetto: "nascosto" };
  if (b.id === "abbonamento" && cat === "privato") return { aspetto: "nascosto" };
  if (b.id === "cambia-profilo" && c.profili < 2) return { aspetto: "nascosto" };
  if (b.id === "mio-cantiere" && !c.haCantiere) return { aspetto: "nascosto" };
  if (!nelPack(b, c.proposti.moduli)) return { aspetto: "nascosto" };
  if (b.requisito === "telefono" && !c.telefono) {
    return { aspetto: "completa_profilo", motivo: "Verifica il telefono: potrai pubblicare e scrivere in chat", passo: "telefono" };
  }
  if (b.requisito === "piva_verificata" && !c.verificata) {
    if (!c.haPiva) return { aspetto: "completa_profilo", motivo: "Manca la partita IVA", passo: "piva" };
    if (c.org && c.org.tipo === "fornitore" && !c.haAteco) return { aspetto: "completa_profilo", motivo: "Scegli le categorie", passo: "categorie" };
    return { aspetto: "completa_profilo", motivo: "Carica i documenti: l'azienda diventa Verificata", passo: "documenti" };
  }
  if (b.requisito === "abbonamento" && !c.haBase) {
    return { aspetto: "attiva", motivo: "Prova gratis", prova: true, modulo: "base" };
  }
  if (b.requisito === "modulo") {
    if (!c.haBase) return { aspetto: "attiva", motivo: "Prova gratis", prova: true, modulo: "base" };
    if (!c.attivo(b.modulo)) return { aspetto: "attiva", motivo: "Prova gratis", prova: true, modulo: b.modulo };
  }
  return { aspetto: "acceso", motivo: "" };
}

async function leggi(S, cat) {
  const c = await contesto(S);
  let dalDb = null;
  try {
    const righe = await Q.rpc("app_stato_pulsanti");
    if (Array.isArray(righe) && righe.length) dalDb = righe;
  } catch (e) { /* prova, o app-14 non ancora sul database */ }
  if (dalDb) {
    return dalDb.map((r) => {
      const noto = LISTA.find((x) => x.id === r.id) || {};
      const b = Object.assign({}, noto, r);
      if (b.id === "mod-centralino" && !c.attivo("centralino")) b.aspetto = "nascosto";
      if (b.aspetto !== "nascosto" && !nelPack(b, c.proposti.moduli)) b.aspetto = "nascosto";
      if (b.aspetto === "completa_profilo") b.passo = passoMancante(b, c);
      return b;
    }).filter((b) => b.aspetto !== "nascosto");
  }
  return LISTA.map((b) => {
    const st = aspettoLocale(b, cat, c);
    const sale = (b.obiettivi || []).some((x) => (c.obiettivi || []).includes(x));
    return Object.assign({}, b, st, { ordine: 100 - (sale ? 1000 : 0) });
  }).filter((b) => b.aspetto !== "nascosto");
}

function tile(b, prezziOn) {
  const ico = I[b.ico] || I.casa || "";
  if (b.aspetto === "completa_profilo") {
    const passo = passoMancante(b);
    return `<div class="tile spento" data-go="passo/${esc(passo)}" role="button" tabindex="0"><span class="ico">${ico}</span><b>${esc(b.nome)}</b><small class="lucchetto">Completa il profilo</small><small>${esc(b.motivo || "")}</small></div>`;
  }
  if (b.aspetto === "attiva") {
    const grezzo = String(b.motivo || "");
    const et = prezziOn && grezzo ? grezzo : "Prova gratis";
    const mod = b.modulo || "base";
    const sotto = prezziOn ? "14 giorni, provvisorio" : "Richiedi l'attivazione";
    return `<div class="tile" data-az="chiedi-prova:${esc(mod)}" role="button" tabindex="0"><span class="ico arancio">${ico}</span><b>${esc(b.nome)}</b><small class="prova">${esc(et)}</small><small>${sotto}</small></div>`;
  }
  if (b.id === "cambia-profilo") {
    return `<div class="tile" data-az="cambia-ruolo" role="button" tabindex="0"><span class="ico blu">${ico}</span><b>${esc(b.nome)}</b></div>`;
  }
  const esterno = /^https?:|mailto:/.test(b.vai || "");
  if (esterno) {
    return `<a class="tile" href="${esc(b.vai)}"><span class="ico blu">${ico}</span><b>${esc(b.nome)}</b></a>`;
  }
  return `<div class="tile" data-go="${esc(b.vai || "profilo")}" role="button" tabindex="0"><span class="ico blu">${ico}</span><b>${esc(b.nome)}</b></div>`;
}

async function schermo(core, cat) {
  const { S } = core;
  const nome = ((S.profilo && S.profilo.nome) || "").split(" ")[0];
  const tutti = await leggi(S, cat);
  const prezziOn = await prezziVisibili();
  tutti.sort((a, b) => (Number(a.ordine) || 100) - (Number(b.ordine) || 100));
  const comuni = tutti.filter((b) => COMUNI.includes(b.id) || b.categoria === "tutti");
  const miei = tutti.filter((b) => !comuni.includes(b));
  let perc = null;
  try { perc = await Q.rpc("app_percentuale_profilo", { p_profilo: (S.profilo && S.profilo.id) || null }); } catch (e) { perc = null; }
  if (typeof perc !== "number") perc = cat === "privato" ? 40 : 20;
  const barra = `<div class="barra-profilo" data-go="profilo" role="button" tabindex="0"><span>Profilo ${perc}%</span><div class="barra-av"><i style="width:${perc}%"></i></div></div>`;
  const packs = (await contesto(S)).proposti.packs;
  const mestiere = cat === "privato" ? "" : `<p class="sotto-dash">Moduli per ${esc(packs.join(", ") || "la tua attività")}</p>`;
  return {
    t: "",
    h: `<div class="pad">
      <p class="saluto">${nome ? "Ciao " + esc(nome) : "Ciao"},<br>${cat === "privato" ? "di cosa hai bisogno?" : "ecco la tua attività"}</p>
      ${barra}
      ${mestiere}
      ${sez("Per te", `<div class="griglia2">${miei.map((b) => tile(b, prezziOn)).join("") || ""}</div>`)}
      ${sez("Sempre", `<div class="griglia2">${comuni.map((b) => tile(b, prezziOn)).join("")}</div>`)}
    </div>`,
  };
}
