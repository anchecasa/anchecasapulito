/* App AncheCasa — parte 1: accesso, Privato, SuperMastro, Artigiano (pronto intervento), Admin.
   Navigazione con l'indirizzo (#/schermata/parametro): il tasto indietro del telefono funziona. */
import { CONFIG } from "./config.js";
import { DB } from "./db.js";
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, stelle, virgola, km, telLink, quando, MESTIERI, nomeMestiere, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { filma, corpoAnalisi, dataUrlBlob, miaPosizione, coordinateDi, cercaGoogle, disegnaMappa, googleDiProva, mappaDiProva, kmTra } from "./sm.js";

const app = document.getElementById("app");
const S = { utente: null, profilo: null, ruoli: [], admin: false, ruolo: null, ricerca: null, recupero: false };
const memo = {
  get(k) { try { return localStorage.getItem("ac-app-" + k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem("ac-app-" + k, v); } catch (e) { /* niente */ } },
};

/* ------------------------------------------------------------------------ */
/* Profili dell'app                                                          */
/* ------------------------------------------------------------------------ */
const PROFILI = {
  privato: { nome: "Privato", tabs: [["home", "casa", "Home"], ["cerca", "cerca", "Cerca"], ["filma", "video", "SuperMastro", true], ["richieste", "lista", "Richieste"], ["profilo", "utente", "Profilo"]] },
  artigiano: { nome: "Artigiano", tabs: [["ar-oggi", "casa", "Oggi"], ["ar-richieste", "video", "Richieste"], ["ar-disp", "ok", "Disponibile", true], ["ar-recensioni", "stella", "Recensioni"], ["profilo", "utente", "Profilo"]] },
  admin: { nome: "Admin", tabs: [["ad-home", "grafico", "Cruscotto"], ["ad-artigiani", "kit", "Artigiani"], ["ad-passaggi", "ufficio", "Passaggi"], ["ad-segnalazioni", "rete", "Segnalazioni"], ["profilo", "utente", "Profilo"]] },
  altro: { nome: "", tabs: [["presto", "casa", "Home"], ["profilo", "utente", "Profilo"]] },
};
const NOMI_RUOLI = { privato: "Privato", artigiano: "Artigiano", admin: "Admin", impresa: "Impresa", fornitore: "Fornitore", cliente: "Proprietario del cantiere", operatore: "Lavoratore", agente: "Agente", subagente: "Sub-agente", capoarea: "Capoarea", sviluppo: "Sviluppo rete", consulente: "Consulente AncheSicura", partner: "Impresa partner" };
const profiloDi = (r) => PROFILI[r] || PROFILI.altro;
const ruoliDisponibili = () => [...S.ruoli, ...(S.admin ? ["admin"] : [])];
const ACCESSO = ["benvenuto", "entra", "registrati", "recupera", "mail", "nuova-password"];

/* ------------------------------------------------------------------------ */
/* Navigazione                                                               */
/* ------------------------------------------------------------------------ */
const rotta = () => {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const [nome, ...resto] = h.split("/");
  return { nome: nome || "", param: resto.join("/") };
};
export function vai(r, sostituisci) {
  const h = "#/" + r;
  if (location.hash === h) { render(); return; }
  if (sostituisci) { history.replaceState(null, "", h); render(); } else location.hash = h;
}
function casa() { return S.ruolo ? profiloDi(S.ruolo).tabs[0][0] : "benvenuto"; }
window.addEventListener("hashchange", () => render());

let giro = 0;
async function render() {
  const mio = ++giro;
  chiudiFoglio();
  const { nome, param } = rotta();
  if (S.recupero && nome !== "nuova-password") return vai("nuova-password", true);
  if (!S.utente && !ACCESSO.includes(nome)) return vai("benvenuto", true);
  if (S.utente && !S.recupero && (ACCESSO.includes(nome) || !nome) && nome !== "mail") return vai(casa(), true);
  const vista = V[nome];
  if (!vista) return vai(S.utente ? casa() : "benvenuto", true);

  const tabs = S.utente && S.ruolo ? profiloDi(S.ruolo).tabs : null;
  const tabAttiva = tabs && tabs.find((t) => t[0] === nome);
  disegna({ t: "", h: `<div class="carico" aria-busy="true"><span></span></div>`, back: !tabAttiva && !!S.utente }, tabs, nome);
  let out;
  try { out = await vista(param); } catch (e) {
    console.error(e);
    out = { t: "Errore", back: true, h: `<div class="pad">${avviso(esc(spiegaErrore(e)), "rosso")}<div style="height:12px"></div>${btn("Riprova", "ricarica")}</div>` };
  }
  if (mio !== giro) return;
  disegna(Object.assign({ back: !tabAttiva && !!S.utente }, out), tabs, nome);
  if (out.dopo) try { await out.dopo(document.getElementById("schermo")); } catch (e) { console.error(e); }
}

function disegna(v, tabs, attiva) {
  const fasciaProva = DB.prova ? `<div class="esempio">Modalità prova · dati di esempio, niente è reale</div>` : "";
  if (!S.utente || v.pieno) {
    app.innerHTML = `${fasciaProva}<main class="schermo" id="schermo">${v.h}</main>`;
    return;
  }
  const disp = ruoliDisponibili();
  const chip = S.ruolo ? `<button type="button" class="chip-profilo" data-az="cambia-ruolo" ${disp.length > 1 ? "" : "disabled"}>${esc(NOMI_RUOLI[S.ruolo] || S.ruolo)}${disp.length > 1 ? " ▾" : ""}</button>` : "";
  const testa = `<header class="alto">${v.back ? `<button type="button" class="indietro" data-az="indietro" aria-label="Indietro">${I.indietro}</button>` : ""}${v.t ? `<h1 class="tit">${esc(v.t)}</h1>` : `<img class="logo" src="img/logo-colore.png" alt="AncheCasa"><span class="tit"></span>`}${chip}</header>`;
  const basso = tabs ? `<nav class="basso" aria-label="Menu">${tabs.map(([r, ico, et, centro]) => `<button type="button" data-tab="${r}" class="${r === attiva ? "on" : ""} ${centro ? "piu" : ""}" ${r === attiva ? 'aria-current="page"' : ""}>${centro ? `<span class="tondo">${I[ico]}</span>` : I[ico]}<span>${et}</span></button>`).join("")}</nav>` : "";
  app.innerHTML = `${fasciaProva}${testa}<main class="schermo" id="schermo">${v.h}</main>${basso}`;
}

/* ------------------------------------------------------------------------ */
/* Avvio e sessione                                                          */
/* ------------------------------------------------------------------------ */
async function caricaUtente() {
  const u = await DB.sessione();
  S.utente = u;
  if (!u) { S.ruoli = []; S.admin = false; S.ruolo = null; S.profilo = null; return; }
  S.profilo = await DB.profilo(u.meta || {});
  const r = await DB.ruoli(u.meta || {}, S.profilo.famiglia);
  S.ruoli = r.ruoli; S.admin = r.admin;
  const disp = ruoliDisponibili();
  const salvato = memo.get("ruolo-" + u.id);
  S.ruolo = disp.includes(salvato) ? salvato : disp[0] || "privato";
  if (!disp.length) S.ruoli = ["privato"];
}
async function avvia() {
  DB.suCambio(async (evento) => {
    if (evento === "PASSWORD_RECOVERY") { S.recupero = true; await caricaUtente(); vai("nuova-password", true); }
    else if (evento === "SIGNED_IN" || evento === "SIGNED_OUT") { await caricaUtente(); render(); }
  });
  try { await caricaUtente(); } catch (e) { console.error(e); }
  render();
}

/* ------------------------------------------------------------------------ */
/* Schermate                                                                 */
/* ------------------------------------------------------------------------ */
const V = {};

/* ---------- accesso ---------- */
V.benvenuto = async () => ({
  pieno: true,
  h: `<div class="ingresso"><img class="logo" src="img/logo-colore.png" alt="AncheCasa · Costruiamo fiducia">
    <h1>Un'app sola per la casa e per il lavoro.</h1>
    <p>Fai un video del guasto: SuperMastro ti dice cosa succede e ti mostra gli artigiani vicini.</p>
    ${DB.prova
      ? `${avviso("Questa è la prova dell'app: scegli chi vuoi essere. Tutti i dati sono di esempio.")}<div style="height:14px"></div>
         ${btn(I.utente + " Entra come privato", "prova:privato")}<div style="height:8px"></div>${btn(I.kit + " Entra come artigiano", "prova:artigiano", "blu")}<div style="height:8px"></div>${btn(I.grafico + " Entra come admin", "prova:admin", "chiaro")}
         <div style="height:14px"></div><button type="button" class="link" data-az="azzera-prova">Ricomincia la prova da capo</button>`
      : `${btn("Entra", "go:entra")}<div style="height:10px"></div>${btn("Crea un account", "go:registrati", "chiaro")}`}
    <p class="piede">AncheCasa · Costruiamo fiducia</p></div>`,
});
V.entra = async () => ({
  pieno: true,
  h: `<div class="ingresso"><button type="button" class="indietro-tondo" data-az="indietro" aria-label="Indietro">${I.indietro}</button>
    <h1>Entra</h1><p>Con la mail e la password del tuo account AncheCasa.</p>
    <form data-form="entra" novalidate>
      ${campo("Mail", `<input name="email" type="email" autocomplete="email" required>`)}
      ${campo("Password", `<input name="password" type="password" autocomplete="current-password" required>`)}
      <button class="btn" type="submit">Entra</button></form>
    <div style="height:14px"></div><button type="button" class="link" data-go="recupera">Hai dimenticato la password?</button>
    <p class="piede">Non hai un account? <button type="button" class="link" data-go="registrati">Creane uno</button></p></div>`,
});
V.registrati = async () => ({
  pieno: true,
  h: `<div class="ingresso"><button type="button" class="indietro-tondo" data-az="indietro" aria-label="Indietro">${I.indietro}</button>
    <h1>Crea il tuo account</h1><p>Chi sei?</p>
    <form data-form="registrati" novalidate>
      <div class="scelte" role="radiogroup">
        <label class="scelta"><input type="radio" name="ruolo" value="privato" checked><span>${I.casa}<b>Privato</b><small>Guasti, artigiani, la tua casa. Gratis.</small></span></label>
        <label class="scelta"><input type="radio" name="ruolo" value="artigiano"><span>${I.kit}<b>Artigiano</b><small>Pronto intervento: ricevi i clienti da SuperMastro.</small></span></label>
      </div>
      ${campo("Nome e cognome", `<input name="nome" autocomplete="name" required maxlength="80">`)}
      ${campo("Città", `<input name="citta" autocomplete="address-level2" required maxlength="80">`)}
      ${campo("Mail", `<input name="email" type="email" autocomplete="email" required>`)}
      ${campo("Password", `<input name="password" type="password" autocomplete="new-password" minlength="8" required>`, "Almeno 8 caratteri.")}
      <label class="spunta"><input type="checkbox" name="privacy" required> <span>Ho letto ${CONFIG.privacyUrl ? `<a href="${esc(CONFIG.privacyUrl)}" target="_blank" rel="noopener">l'informativa privacy</a>` : "l'informativa privacy"} e accetto il trattamento dei miei dati per usare l'app.</span></label>
      <button class="btn" type="submit">Crea l'account</button></form>
    <p class="piede">Hai già un account? <button type="button" class="link" data-go="entra">Entra</button></p></div>`,
});
V.mail = async () => ({
  pieno: true,
  h: `<div class="ingresso"><img class="logo" src="img/logo-colore.png" alt="AncheCasa"><h1>Controlla la mail</h1>
    <p>Ti abbiamo mandato un link per confermare l'account. Aprilo dal telefono: l'app si apre già dentro.</p>${btn("Torna all'inizio", "go:benvenuto", "chiaro")}</div>`,
});
V.recupera = async () => ({
  pieno: true,
  h: `<div class="ingresso"><button type="button" class="indietro-tondo" data-az="indietro" aria-label="Indietro">${I.indietro}</button>
    <h1>Nuova password</h1><p>Scrivi la mail del tuo account: ti mandiamo un link per sceglierne una nuova.</p>
    <form data-form="recupera" novalidate>${campo("Mail", `<input name="email" type="email" autocomplete="email" required>`)}<button class="btn" type="submit">Mandami il link</button></form></div>`,
});
V["nuova-password"] = async () => ({
  pieno: true,
  h: `<div class="ingresso"><h1>Scegli una nuova password</h1>
    <form data-form="nuova-password" novalidate>${campo("Nuova password", `<input name="password" type="password" autocomplete="new-password" minlength="8" required>`, "Almeno 8 caratteri.")}<button class="btn" type="submit">Salva la password</button></form></div>`,
});

/* ---------- comuni ---------- */
V.profilo = async () => {
  const p = S.profilo || {};
  const disp = ruoliDisponibili();
  let segn = [];
  try { segn = await DB.mieSegnalazioni(); } catch (e) { /* tabella non ancora pronta */ }
  return {
    t: "Profilo",
    h: `<div class="pad">
      <div class="card"><div class="riga"><span class="ico blu">${I.utente}</span><div class="cresci"><b>${esc(p.nome || "Il tuo profilo")}</b><small>${esc(S.utente.email || "")}</small></div></div></div>
      <div style="height:14px"></div>
      ${sez("I tuoi dati", lista([voce("doc", "Nome, città e telefono", esc([p.citta, p.telefono].filter(Boolean).join(" · ") || "Da completare"), "dati")]))}
      ${disp.length > 1 ? sez("I tuoi profili", lista(disp.map((r) => voce(r === "admin" ? "grafico" : r === "artigiano" ? "kit" : "utente", esc(NOMI_RUOLI[r] || r), r === S.ruolo ? "In uso adesso" : "Tocca per passare a questo profilo", r === S.ruolo ? null : "ruolo/" + r, r === S.ruolo ? "verde" : "blu")))) : ""}
      ${S.ruoli.includes("privato") ? sez("Segnala ad AncheCasa", lista([voce("rete", "Segnala chi ha bisogno di noi", segn.length ? `${segn.length} segnalazion${segn.length === 1 ? "e" : "i"}` : "Chi deve ristrutturare, un'azienda, un artigiano", "segnala", "arancio")])) : ""}
      ${!S.ruoli.includes("artigiano") ? sez("Lavori come artigiano?", lista([voce("kit", "Attiva il profilo artigiano", "Pronto intervento: ricevi i clienti da SuperMastro", "attiva-artigiano")])) : ""}
      ${S.ruoli.includes("artigiano") ? sez("Cresci con AncheCasa", lista([voce("ufficio", "Passa a Impresa", "Se hai i requisiti: cantieri, lotti e moduli", "ar-up", "arancio")])) : ""}
      ${btn(I.esci + " Esci", "esci", "chiaro")}
      <p class="versione">App AncheCasa ${esc(CONFIG.versione)}</p></div>`,
  };
};
V.ruolo = async (r) => {
  if (ruoliDisponibili().includes(r)) { S.ruolo = r; memo.set("ruolo-" + S.utente.id, r); }
  vai(casa(), true);
  return { h: "" };
};
V["attiva-artigiano"] = async () => ({
  t: "Profilo artigiano",
  h: `<div class="pad"><div class="eroe"><h3>Lavori come artigiano?</h3><p>Con il profilo artigiano ricevi i clienti di SuperMastro per i pronto interventi. Compili la scheda e AncheCasa la verifica. Il profilo privato resta.</p>${btn("Attiva il profilo artigiano", "attiva-artigiano")}</div></div>`,
});
async function attivaArtigiano() {
  await DB.aggiungiRuolo("artigiano");
  if (!S.ruoli.includes("artigiano")) S.ruoli.push("artigiano");
  S.ruolo = "artigiano"; memo.set("ruolo-" + S.utente.id, "artigiano");
  vai("ar-scheda", true);
}
V.dati = async () => {
  const p = S.profilo || {};
  return {
    t: "I tuoi dati",
    h: `<div class="pad"><form data-form="dati" novalidate>
      ${campo("Nome e cognome", `<input name="nome" value="${esc(p.nome)}" maxlength="80" required>`)}
      ${campo("Città", `<input name="citta" value="${esc(p.citta)}" maxlength="80">`)}
      ${campo("Telefono", `<input name="telefono" type="tel" value="${esc(p.telefono)}" maxlength="30" autocomplete="tel">`, "Lo vede solo l'artigiano che accetta la tua richiesta.")}
      <button class="btn" type="submit">Salva</button></form></div>`,
  };
};
V.presto = async () => ({
  t: NOMI_RUOLI[S.ruolo] || "AncheCasa",
  h: `<div class="pad"><div class="eroe"><h3>Arriva nelle prossime versioni</h3><p>La parte «${esc(NOMI_RUOLI[S.ruolo] || S.ruolo)}» dell'app è in costruzione. Intanto trovi tutto nell'area privata.</p>
    <a class="btn" href="${esc(CONFIG.areaPrivata)}" target="_blank" rel="noopener">Apri l'area privata</a></div></div>`,
});

/* ---------- privato ---------- */
const NOMI_STATO = { nuova: ["blu", "Analizzata"], inviata: ["giallo", "In attesa"], accettata: ["verde", "Presa"], fatta: ["verde", "Fatta"], annullata: ["rosso", "Annullata"] };
const URG = { bassa: ["verde", "Urgenza bassa"], media: ["arancio", "Urgenza media"], alta: ["rosso", "Urgenza alta"] };

V.home = async () => {
  const p = S.profilo || {};
  let aperte = [];
  try { aperte = (await DB.mieRichieste()).filter((r) => ["nuova", "inviata", "accettata"].includes(r.stato)).slice(0, 2); } catch (e) { /* niente */ }
  return {
    t: "",
    h: `<div class="pad">
      <p class="saluto">Ciao ${esc((p.nome || "").split(" ")[0])},<br>di cosa hai bisogno?</p>
      <div class="ricerca" data-go="cerca" role="button" tabindex="0">${I.cerca}<span>Idraulico, elettricista, fabbro…</span></div>
      <div class="eroe" style="margin-top:14px"><h3>Guasto in casa? 5 secondi.</h3><p>Fai un video del guasto: SuperMastro lo analizza, ti dice cosa fare subito e ti mostra gli artigiani vicini.</p>${btn(I.video + " Fai il video", "filma")}</div>
      <div style="height:16px"></div>
      ${aperte.length ? sez("Le tue richieste", lista(aperte.map((r) => voce("video", esc(r.problema || "Richiesta"), `${nomeMestiere(r.mestiere)} · ${quando(r.creato)}`, "richiesta/" + r.id, "", stato(...NOMI_STATO[r.stato])))), `<a data-go="richieste">Tutte</a>`) : ""}
      ${sez("AncheCasa per te", lista([
        voce("casa", "Ristruttura con AncheCasa", "Un referente, imprese selezionate, l'app del tuo cantiere", "ristruttura", "blu"),
        voce("rete", "Segnala ad AncheCasa", "Conosci chi deve ristrutturare o un'azienda? Segnalalo", "segnala", "arancio"),
      ]))}</div>`,
  };
};

V.cerca = async () => {
  const p = S.profilo || {};
  return {
    t: "Trova l'artigiano",
    h: `<div class="pad"><form data-form="cerca" novalidate>
      ${campo("Che lavoro?", `<select name="mestiere">${MESTIERI.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`)}
      ${campo("Dove?", `<input name="citta" value="${esc(p.citta)}" placeholder="Città" maxlength="80">`)}
      <button class="btn" type="submit">${I.cerca} Cerca</button>
      <div style="height:8px"></div><button type="button" class="btn chiaro" data-az="cerca-qui">${I.posizione} Usa la mia posizione</button></form>
      <div style="height:18px"></div>
      ${sez("Non sai chi ti serve?", lista([voce("video", "Fai il video a SuperMastro", "In 5 secondi capisce che artigiano serve", null, "", btn("Video", "filma", "piccolo"))]))}</div>`,
  };
};

/* Analisi: schermata d'attesa mentre la funzione lavora. */
V["in-analisi"] = async () => ({ t: "SuperMastro", h: `<div class="pad"><div class="analizza"><div class="girella"></div><b>SuperMastro sta guardando il video…</b><small>Ci vogliono pochi secondi.</small></div></div>` });

function blocchiAnalisi(d, r) {
  const L = (x) => (Array.isArray(x) ? x.map(String) : []);
  d = Object.assign({}, d, { passi: L(d.passi), avvertenze: L(d.avvertenze), attrezzi: L(d.attrezzi) });
  const urg = URG[d.urgenza] || URG.media;
  return `
    ${d.esempio ? avviso("Analisi di ESEMPIO: nella prova non si usa l'intelligenza artificiale.") + '<div style="height:12px"></div>' : ""}
    <div class="eroe"><h3>${esc(d.problema)}</h3><p>${esc(d.descrizione)}</p>${stato(...urg)}</div><div style="height:14px"></div>
    ${d.pericolo ? avviso(`${I.allarme} <b>Attenzione:</b> ${esc(d.motivo_pericolo || "Non intervenire da solo.")}`, "rosso") + '<div style="height:14px"></div>' : ""}
    ${d.fai_da_te && d.passi && d.passi.length
      ? sez("Cosa fare subito", `<div class="card"><ol class="passi">${d.passi.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>`)
      : d.avvertenze && d.avvertenze.length ? sez("Cosa fare subito", `<div class="card"><ul class="passi">${d.avvertenze.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`) : ""}
    ${d.fai_da_te && d.avvertenze && d.avvertenze.length ? sez("Quando fermarti", `<div class="card"><ul class="passi">${d.avvertenze.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`) : ""}
    ${d.attrezzi && d.attrezzi.length ? sez("Cosa serve", `<div class="card"><p>${d.attrezzi.map(esc).join(" · ")}</p></div>`) : ""}
    ${sez("Chi serve", lista([voce("kit", nomeMestiere(d.mestiere), d.chiarimento ? "Per essere più precisi: " + esc(d.chiarimento) : esc(d.titolo_richiesta || ""), null, "")]))}
    ${r && r.foto ? sez("Il tuo video", `<div class="fotos" data-foto="${esc(r.id)}" data-n="${r.foto}"></div>`) : ""}`;
}
async function mostraFoto(el) {
  const box = el.querySelector("[data-foto]");
  if (!box) return;
  const id = box.getAttribute("data-foto"), n = Number(box.getAttribute("data-n")) || 0;
  const urls = await Promise.all(Array.from({ length: n }, (_, i) => DB.urlFoto(id, i + 1)));
  box.innerHTML = urls.filter(Boolean).map((u) => `<img src="${esc(u)}" alt="Fotogramma del video" loading="lazy">`).join("");
}

V.analisi = async (id) => {
  const r = await DB.richiesta(id);
  if (!r) return { t: "Analisi", h: `<div class="pad">${vuoto("Richiesta non trovata.")}</div>` };
  const d = r.analisi || {};
  return {
    t: "Analisi del video",
    h: `<div class="pad">${blocchiAnalisi(d, r)}
      ${btn(I.mappa + " Trova " + esc(nomeMestiere(d.mestiere).toLowerCase()) + " vicino a me", "trova:" + r.id)}
      <div style="height:8px"></div>${btn("Le mie richieste", "go:richieste", "chiaro")}</div>`,
    dopo: mostraFoto,
  };
};

/* Dove cercare: posizione del telefono o città. */
function chiediDove(richiestaId, mestiere) {
  const p = S.profilo || {};
  const f = foglio(`<h2>Dove sei?</h2><p class="sotto">Ti mostriamo gli artigiani più vicini.</p>
    ${btn(I.posizione + " Usa la mia posizione", "dove-qui")}<div style="height:12px"></div>
    <form data-form="dove" novalidate>${campo("Oppure scrivi la città o l'indirizzo", `<input name="citta" value="${esc(p.citta)}" maxlength="120">`)}<button class="btn chiaro" type="submit">Cerca qui</button></form>`);
  S.ricerca = { richiestaId, mestiere };
  return f;
}
async function cercaDa(dove) {
  const r = S.ricerca || {};
  try {
    toast("Cerco gli artigiani vicini…");
    let centro;
    if (dove === "qui") centro = await miaPosizione();
    else centro = DB.prova ? { lat: 41.872, lng: 12.462, preciso: false } : await coordinateDi(dove);
    S.ricerca = Object.assign({}, r, { centro, citta: dove === "qui" ? (S.profilo && S.profilo.citta) || "" : dove });
    chiudiFoglio();
    vai("trovati");
  } catch (e) {
    toast(dove === "qui" ? "Non riesco a sapere dove sei: scrivi la città." : "Non trovo questa città: controlla e riprova.", "errore");
  }
}

V.trovati = async () => {
  const R = S.ricerca;
  if (!R || !R.centro) { vai("cerca", true); return { h: "" }; }
  const mestiere = R.mestiere || "altro";
  const [iscritti, google5] = await Promise.all([
    DB.vicini(R.centro.lat, R.centro.lng, mestiere).catch(() => []),
    (DB.prova ? Promise.resolve(googleDiProva(nomeMestiere(mestiere), R.centro)) : cercaGoogle(nomeMestiere(mestiere) + (R.citta ? " " + R.citta : ""), R.centro)).catch(() => null),
  ]);
  const conRichiesta = !!R.richiestaId;
  const iscrittiHtml = iscritti.length
    ? `<div class="lista">${iscritti.map((a) => `<div class="card"><div class="riga">
        ${conRichiesta ? `<input type="checkbox" class="sel" name="art" value="${esc(a.utente)}" aria-label="Scegli ${esc(a.nome_attivita)}" checked>` : `<span class="ico verde">${I.scudo}</span>`}
        <div class="cresci"><b>${esc(a.nome_attivita)}</b><small>${a.voto ? `★ ${virgola(a.voto)} (${a.recensioni}) · ` : "Nuovo · "}${km(a.km)}${a.orari ? " · " + esc(a.orari) : ""}</small>${stato("verde", "Iscritto AncheCasa")}</div>
        ${a.telefono ? `<a class="btn piccolo chiaro" href="${telLink(a.telefono)}" aria-label="Chiama ${esc(a.nome_attivita)}">${I.tel}</a>` : ""}</div></div>`).join("")}</div>
      ${conRichiesta ? `<div style="height:10px"></div>${btn(I.video + " Manda video e analisi agli artigiani scelti", "manda")}<p class="sotto piccolo">Ricevono il tuo video e l'analisi: sanno già cosa trovano. Il tuo telefono lo vede solo chi accetta.</p>` : ""}`
    : `<div class="card"><p>Nessun artigiano iscritto ad AncheCasa in questa zona, per ora. Chiama direttamente uno di quelli qui sotto.</p></div>`;
  const googleHtml = google5 === null
    ? `<div class="card"><p>La ricerca su Google non è disponibile adesso.</p></div>`
    : google5.length
      ? `<div class="lista">${google5.map((a, i) => `<div class="card"><div class="riga"><span class="ico n">${i + 1}</span>
          <div class="cresci"><b>${esc(a.nome)}</b><small>${km(a.km)}${a.voto ? ` · ★ ${virgola(a.voto)} su Google (${a.recensioni})` : ""}</small><small>${esc(a.indirizzo.split(",").slice(0, 2).join(","))}</small></div>
          ${a.telefono ? `<a class="btn piccolo" href="${telLink(a.telefono)}">Chiama</a>` : a.mappa ? `<a class="btn piccolo chiaro" href="${esc(a.mappa)}" target="_blank" rel="noopener">Apri</a>` : ""}</div></div>`).join("")}</div>
        <p class="sotto piccolo">${DB.prova ? "Nomi di ESEMPIO: nell'app vera arrivano da Google Maps." : "Risultati da Google Maps: non sono iscritti ad AncheCasa. Li chiami tu direttamente."}</p>`
      : `<div class="card"><p>Google non ha trovato ${esc(nomeMestiere(mestiere).toLowerCase())} vicino a te.</p></div>`;
  S.trovati = { iscritti, google5: google5 || [] };
  return {
    t: nomeMestiere(mestiere) + " vicino a te",
    h: `<div class="pad"><div class="mappa" id="mappa"></div><div style="height:14px"></div>
      ${sez("Iscritti AncheCasa", iscrittiHtml)}
      ${sez("I 5 più vicini su Google Maps", googleHtml)}</div>`,
    dopo: async (el) => {
      const box = el.querySelector("#mappa");
      if (DB.prova) mappaDiProva(box, R.centro, iscritti, google5 || []);
      else await disegnaMappa(box, R.centro, iscritti, google5 || []).catch(() => { box.innerHTML = `<div class="mappa-prova"><small>Mappa non disponibile</small></div>`; });
    },
  };
};

async function manda() {
  const R = S.ricerca;
  const scelti = Array.from(document.querySelectorAll("input.sel:checked")).map((x) => x.value).slice(0, 5);
  if (!scelti.length) return toast("Scegli almeno un artigiano.", "errore");
  const tel = (S.profilo && S.profilo.telefono) || "";
  if (!tel) {
    foglio(`<h2>Il tuo telefono</h2><p class="sotto">Serve all'artigiano che accetta per chiamarti. Lo vede solo lui.</p>
      <form data-form="telefono-manda" novalidate>${campo("Telefono", `<input name="telefono" type="tel" autocomplete="tel" maxlength="30" required>`)}<button class="btn" type="submit">Manda la richiesta</button></form>`);
    S.daMandare = scelti;
    return;
  }
  await mandaA(scelti, tel);
}
async function mandaA(scelti, tel) {
  const R = S.ricerca;
  try {
    await DB.aggiornaRichiesta(R.richiestaId, { telefono: tel, citta: (R.citta || "").slice(0, 80), lat: R.centro.lat, lng: R.centro.lng });
    const n = await DB.invia(R.richiestaId, scelti);
    chiudiFoglio();
    toast(n ? `Richiesta mandata a ${n} artigian${n === 1 ? "o" : "i"}. Ti avvisiamo qui quando qualcuno accetta.` : "Nessun artigiano disponibile adesso.");
    vai("richiesta/" + R.richiestaId);
  } catch (e) { toast(spiegaErrore(e), "errore"); }
}

V.richieste = async () => {
  const r = await DB.mieRichieste();
  return {
    t: "Le mie richieste",
    h: `<div class="pad">${r.length ? lista(r.map((x) => voce("video", esc(x.problema || "Richiesta"), `${nomeMestiere(x.mestiere)} · ${quando(x.creato)}`, "richiesta/" + x.id, "", stato(...(NOMI_STATO[x.stato] || ["blu", x.stato]))))) : vuoto(`Nessuna richiesta per ora.<br><br>${btn(I.video + " Fai il video a SuperMastro", "filma")}`)}</div>`,
  };
};
V.richiesta = async (id) => {
  const r = await DB.richiesta(id);
  if (!r) return { t: "Richiesta", h: `<div class="pad">${vuoto("Richiesta non trovata.")}</div>` };
  const invii = await DB.inviiRichiesta(id).catch(() => []);
  const presa = invii.find((i) => i.stato === "accettata");
  const passi = [["Analizzata", true], ["Mandata agli artigiani", r.stato !== "nuova" && r.stato !== "annullata"], ["Presa da un artigiano", !!presa], ["Lavoro fatto", r.stato === "fatta"]];
  const ora = passi.findIndex((p) => !p[1]);
  return {
    t: r.problema || "Richiesta",
    h: `<div class="pad">
      ${r.stato === "annullata" ? avviso("Hai annullato questa richiesta.") + '<div style="height:12px"></div>' : `<div class="tl">${passi.map((p, i) => `<div class="p ${p[1] ? "fatto" : i === ora ? "ora" : ""}"><b>${p[0]}</b></div>`).join("")}</div>`}
      ${presa ? sez("Chi la fa", `<div class="card"><div class="riga"><span class="ico verde">${I.ok}</span><div class="cresci"><b>${esc(presa.nome_attivita)}</b><small>Ha accettato ${quando(presa.risposto)}: ti chiama lui, o chiamalo tu.</small></div></div>
          ${presa.telefono ? `<div style="height:10px"></div><a class="btn" href="${telLink(presa.telefono)}">${I.tel} Chiama ${esc(presa.telefono)}</a>` : ""}</div>`) : ""}
      ${invii.length && !presa ? sez("A chi l'hai mandata", lista(invii.map((i) => voce("kit", esc(i.nome_attivita), i.stato === "rifiutata" ? "Non può" : "Non ha ancora risposto", null, i.stato === "rifiutata" ? "rosso" : "giallo")))) : ""}
      ${r.stato === "accettata" ? btn(I.stella + " Lavoro fatto: lascia la recensione", "go:recensione/" + r.id) + '<div style="height:8px"></div>' : ""}
      ${["nuova", "inviata"].includes(r.stato) ? btn(I.mappa + " Trova artigiani vicini", "trova:" + r.id) + '<div style="height:8px"></div>' : ""}
      <div style="height:6px"></div>${sez("L'analisi", blocchiAnalisi(r.analisi || {}, r))}
      ${["nuova", "inviata"].includes(r.stato) ? btn("Annulla la richiesta", "annulla:" + r.id, "chiaro") : ""}</div>`,
    dopo: mostraFoto,
  };
};
const VOCI = [["qualita", "Qualità del lavoro"], ["puntualita", "Puntualità"], ["pulizia", "Pulizia"], ["prezzo", "Prezzo rispettato"], ["comunicazione", "Gentilezza e chiarezza"]];
V.recensione = async (id) => ({
  t: "Recensione",
  h: `<div class="pad"><p class="sotto">Com'è andata? La recensione aiuta gli altri privati e fa crescere gli artigiani bravi.</p>
    <form data-form="recensione" data-id="${esc(id)}" novalidate>
      ${VOCI.map(([k, t]) => `<fieldset class="voto"><legend>${t}</legend><div class="stelline">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="${k}${n}" name="${k}" value="${n}"><label for="${k}${n}" aria-label="${n} stelle">★</label>`).join("")}</div></fieldset>`).join("")}
      ${campo("Due parole (facoltativo)", `<textarea name="testo" maxlength="600"></textarea>`)}
      <button class="btn" type="submit">Pubblica la recensione</button></form></div>`,
});

V.segnala = async () => {
  const mie = await DB.mieSegnalazioni().catch(() => []);
  const ST = { inviata: ["blu", "Inviata"], in_corso: ["giallo", "In corso"], partita: ["verde", "Partita"], non_interessato: ["rosso", "Non interessato"] };
  return {
    t: "Segnala ad AncheCasa",
    h: `<div class="pad"><div class="eroe"><h3>Conosci chi ha bisogno di noi?</h3><p>Chi deve ristrutturare, un'azienda che ha bisogno di sicurezza o di un'impresa seria. Lo chiamiamo noi e qui vedi com'è andata.${CONFIG.premioSegnalazione ? " " + esc(CONFIG.premioSegnalazione) : ""}</p></div><div style="height:14px"></div>
      <form data-form="segnala" novalidate>
        ${campo("Chi segnali", `<select name="tipo"><option value="ristrutturazione">Una persona che deve ristrutturare</option><option value="azienda">Un'azienda (sicurezza, corsi, app)</option><option value="artigiano">Un'impresa o un artigiano da iscrivere</option></select>`)}
        ${campo("Nome", `<input name="nome" maxlength="80" required placeholder="Nome e cognome o azienda">`)}
        ${campo("Telefono", `<input name="telefono" type="tel" maxlength="30" placeholder="Lo chiamiamo noi">`)}
        ${campo("Due parole", `<textarea name="note" maxlength="400" placeholder="Cosa gli serve"></textarea>`)}
        <label class="spunta"><input type="checkbox" name="consenso" required> <span>La persona sa che la segnalo e che AncheCasa la chiamerà.</span></label>
        <button class="btn" type="submit">Invia la segnalazione</button></form>
      <div style="height:16px"></div>
      ${mie.length ? sez("Le mie segnalazioni", lista(mie.map((s) => voce(s.tipo === "ristrutturazione" ? "casa" : s.tipo === "azienda" ? "ufficio" : "kit", esc(s.nome), quando(s.creato), null, "", stato(...(ST[s.stato] || ["blu", s.stato])))))) : ""}</div>`,
  };
};
V.ristruttura = async () => ({
  t: "Ristruttura con AncheCasa",
  h: `<div class="pad"><div class="eroe"><h3>Un referente, un contratto</h3><p>AncheCasa fa da general contractor: sceglie imprese selezionate, segue il cantiere e ti dà l'app per vedere avanzamento, foto e pagamenti.</p></div><div style="height:14px"></div>
    ${lista([voce("scudo", "Imprese selezionate", "Controllate da AncheCasa prima di lavorare per te"), voce("doc", "Un solo contratto", "Con AncheCasa, non con dieci ditte"), voce("foto", "L'app del tuo cantiere", "Foto, avanzamento, segnalazioni, pagamenti")])}
    <div style="height:14px"></div>
    <form data-form="ristruttura" novalidate>${campo("Cosa vuoi fare?", `<textarea name="note" maxlength="400" placeholder="Es. rifare il bagno e la cucina, 80 mq a Roma"></textarea>`)}
      ${campo("Telefono", `<input name="telefono" type="tel" maxlength="30" value="${esc((S.profilo || {}).telefono)}" required>`)}
      <button class="btn" type="submit">Voglio essere richiamato</button></form></div>`,
});

/* ---------- artigiano ---------- */
const ST_ART = { attesa: ["giallo", "In verifica"], verificato: ["verde", "Verificato"], sospeso: ["rosso", "Sospeso"] };
async function scheda() { return DB.mioArtigiano().catch(() => null); }

V["ar-oggi"] = async () => {
  const a = await scheda();
  if (!a) return { t: "", h: `<div class="pad"><p class="saluto">Benvenuto!</p><p class="sotto">Completa la scheda: nome dell'attività, mestieri, zona. Poi AncheCasa la verifica e cominci a ricevere i clienti di SuperMastro.</p>${btn("Completa la scheda", "go:ar-scheda")}</div>` };
  const [ric, rec] = await Promise.all([DB.ricevute().catch(() => []), DB.mieRecensioni().catch(() => [])]);
  const nuove = ric.filter((r) => r.stato_invio === "inviata" && r.stato === "inviata");
  const prese = ric.filter((r) => r.stato_invio === "accettata");
  const media = rec.length ? rec.reduce((s, v) => s + Number(v.voto), 0) / rec.length : null;
  return {
    t: "",
    h: `<div class="pad"><p class="saluto">${esc(a.nome_attivita)}</p><p class="sotto">${a.mestieri.map(nomeMestiere).join(", ")} · ${esc(a.citta)}</p>
      ${a.stato === "attesa" ? avviso("La tua scheda è in verifica: AncheCasa la controlla e poi compari ai privati.") + '<div style="height:12px"></div>' : ""}
      ${a.stato === "sospeso" ? avviso("Il tuo profilo è sospeso: scrivi a AncheCasa per capire perché.", "rosso") + '<div style="height:12px"></div>' : ""}
      <div class="card tap" data-go="ar-disp" role="button" tabindex="0"><div class="riga">${a.disponibile ? stato("verde", "Disponibile") : stato("rosso", "In pausa")}<small class="cresci">${a.disponibile ? `Ricevi le richieste entro ${a.raggio_km} km` : "Non ricevi richieste"}</small><span class="freccia">${I.freccia}</span></div></div>
      <div style="height:12px"></div>
      <div class="griglia2">${num(nuove.length, "Richieste nuove", nuove.length ? "giallo" : "")}${num(prese.length, "Lavori presi")}${num(media ? virgola(media) : "–", "Valutazione", "verde")}${num(rec.length, "Recensioni")}</div><div style="height:16px"></div>
      ${sez("Richieste da SuperMastro", nuove.length ? lista(nuove.map((r) => voce("video", esc(r.problema), `${esc(r.nome_privato || "Cliente")} · ${a.lat && r.lat ? km(kmTra(a, r)) + " · " : ""}${(URG[r.urgenza] || URG.media)[1].toLowerCase()}`, "ar-richiesta/" + r.id, "", stato("arancio", "Nuova")))) : `<div class="card"><p>Nessuna richiesta nuova. Quando un privato vicino a te ti manda un video, la trovi qui.</p></div>`)}
      <div class="eroe tap" data-go="ar-up" role="button" tabindex="0"><h3>Cresci: passa a Impresa</h3><p>Con i requisiti in regola entri nei cantieri AncheCasa, nei lotti e nei moduli per le imprese.</p></div></div>`,
  };
};
V["ar-richieste"] = async () => {
  const ric = await DB.ricevute().catch(() => []);
  const et = (r) => r.stato_invio === "accettata" ? (r.stato === "fatta" ? ["verde", "Fatto"] : ["verde", "Presa da te"]) : r.stato_invio === "rifiutata" ? ["rosso", "Rifiutata"] : r.stato_invio === "chiusa" || r.stato !== "inviata" ? ["blu", "Presa da altri"] : ["arancio", "Nuova"];
  return {
    t: "Richieste",
    h: `<div class="pad">${ric.length ? lista(ric.map((r) => voce("video", esc(r.problema), `${esc(r.nome_privato || "Cliente")} · ${quando(r.creato)}`, "ar-richiesta/" + r.id, "", stato(...et(r))))) : vuoto("Ancora nessuna richiesta.")}</div>`,
  };
};
V["ar-richiesta"] = async (id) => {
  const [ric, a] = await Promise.all([DB.ricevute(), scheda()]);
  const r = ric.find((x) => x.id === id);
  if (!r) return { t: "Richiesta", h: `<div class="pad">${vuoto("Richiesta non trovata.")}</div>` };
  const libera = r.stato_invio === "inviata" && r.stato === "inviata";
  return {
    t: "Nuova richiesta",
    h: `<div class="pad">
      ${lista([voce("utente", esc(r.nome_privato || "Cliente"), `${esc(r.citta || "")}${a && a.lat && r.lat ? " · " + km(kmTra(a, r)) + " da te" : ""} · ${quando(r.creato)}`, null, "blu")])}<div style="height:12px"></div>
      ${r.nota ? `<div class="card"><p>«${esc(r.nota)}»</p></div><div style="height:12px"></div>` : ""}
      ${blocchiAnalisi(r.analisi || {}, r)}
      ${libera ? `${btn(I.ok + " Accetto", "accetta:" + r.id)}<div style="height:8px"></div>${btn("Non posso", "rifiuta:" + r.id, "chiaro")}` : ""}
      ${r.stato_invio === "accettata" && r.telefono ? `<a class="btn" href="${telLink(r.telefono)}">${I.tel} Chiama ${esc(r.nome_privato || "il cliente")}: ${esc(r.telefono)}</a>` : ""}
      ${!libera && r.stato_invio !== "accettata" ? avviso(r.stato_invio === "rifiutata" ? "Hai detto che non puoi." : "Questa richiesta l'ha presa un altro artigiano.") : ""}</div>`,
    dopo: mostraFoto,
  };
};
function formScheda(a, primaVolta) {
  a = a || { nome_attivita: "", mestieri: [], telefono: "", citta: (S.profilo || {}).citta || "", raggio_km: 10, disponibile: true, orari: "", piva: "", descrizione: "" };
  return `<form data-form="scheda" data-prima="${primaVolta ? 1 : 0}" novalidate>
    ${primaVolta ? "" : `<label class="interruttore"><input type="checkbox" name="disponibile" ${a.disponibile ? "checked" : ""}><span></span><b>Disponibile adesso</b></label><div style="height:12px"></div>`}
    ${campo("Nome dell'attività", `<input name="nome_attivita" value="${esc(a.nome_attivita)}" maxlength="80" required>`)}
    <fieldset class="campo"><legend>Che lavori fai?</legend><div class="pillole a-capo">${MESTIERI.map(([v, t]) => `<label class="pillola-c"><input type="checkbox" name="mestieri" value="${v}" ${a.mestieri.includes(v) ? "checked" : ""}><span>${t}</span></label>`).join("")}</div></fieldset>
    ${campo("Telefono per i clienti", `<input name="telefono" type="tel" value="${esc(a.telefono)}" maxlength="30" required>`)}
    ${campo("Città o zona", `<input name="citta" value="${esc(a.citta)}" maxlength="80" required>`, "Usiamo la posizione per mostrarti ai privati vicini.")}
    ${campo("Fino a quanti km ti sposti?", `<select name="raggio_km">${[3, 5, 10, 15, 20, 30, 50].map((n) => `<option value="${n}" ${Number(a.raggio_km) === n ? "selected" : ""}>${n} km</option>`).join("")}</select>`)}
    ${campo("Orari", `<input name="orari" value="${esc(a.orari)}" maxlength="120" placeholder="Es. Lun-Sab 8-19, urgenze anche la domenica">`)}
    ${campo("Partita IVA", `<input name="piva" value="${esc(a.piva)}" maxlength="20" inputmode="numeric">`)}
    ${campo("Due parole su di te", `<textarea name="descrizione" maxlength="400">${esc(a.descrizione)}</textarea>`)}
    <button class="btn" type="submit">${primaVolta ? "Manda la scheda in verifica" : "Salva"}</button></form>`;
}
V["ar-scheda"] = async () => {
  const a = await scheda();
  return { t: a ? "La tua scheda" : "La tua scheda di artigiano", h: `<div class="pad">${a ? "" : `<p class="sotto">Ti mostriamo ai privati vicini che hanno un guasto del tuo mestiere. AncheCasa controlla la scheda prima di pubblicarla.</p>`}${formScheda(a, !a)}</div>` };
};
V["ar-disp"] = async () => {
  const a = await scheda();
  if (!a) { vai("ar-scheda", true); return { h: "" }; }
  return { t: "Disponibilità", h: `<div class="pad">${lista([voce("ok", stato(...ST_ART[a.stato]), a.stato === "verificato" ? "Compari nella mappa di SuperMastro, prima degli artigiani di Google" : "Compari ai privati dopo la verifica di AncheCasa", null, a.stato === "verificato" ? "verde" : "giallo")])}<div style="height:12px"></div>${formScheda(a, false)}</div>` };
};
V["ar-recensioni"] = async () => {
  const rec = await DB.mieRecensioni().catch(() => []);
  const media = (k) => { const v = rec.map((r) => Number((r.voti || {})[k])).filter(Boolean); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const tot = rec.length ? rec.reduce((s, v) => s + Number(v.voto), 0) / rec.length : null;
  return {
    t: "Recensioni",
    h: `<div class="pad"><div class="griglia2">${num(tot ? virgola(tot) : "–", "Media", "verde")}${num(rec.length, "Recensioni")}</div><div style="height:14px"></div>
      ${rec.length ? sez("Voti per voce", lista(VOCI.map(([k, t]) => voce("stella", t, "", null, "verde", stato("verde", "★ " + virgola(media(k))))))) : ""}
      ${rec.length ? sez("Cosa dicono", lista(rec.map((r) => voce("stella", stelle(r.voto) + " " + virgola(r.voto), esc(r.testo || "") + (r.testo ? " · " : "") + quando(r.creato), null, "verde")))) : vuoto("Ancora nessuna recensione: arrivano dopo i lavori fatti con SuperMastro.")}</div>`,
  };
};
V["ar-up"] = async () => {
  const [a, ric, rec, pass] = await Promise.all([scheda(), DB.ricevute().catch(() => []), DB.mieRecensioni().catch(() => []), DB.mieiPassaggi().catch(() => [])]);
  const min = CONFIG.passaggio || { interventi: 20, media: 4.5 };
  const lavori = ric.filter((r) => r.stato_invio === "accettata").length;
  const media = rec.length ? rec.reduce((s, v) => s + Number(v.voto), 0) / rec.length : 0;
  const req = [
    ["Scheda verificata da AncheCasa", a && a.stato === "verificato", a ? ST_ART[a.stato][1] : "Scheda da fare"],
    ["Partita IVA", !!(a && a.piva), a && a.piva ? "Inserita" : "Da inserire nella scheda"],
    [`Almeno ${min.interventi} lavori presi con l'app`, lavori >= min.interventi, `${lavori} finora`],
    [`Media recensioni almeno ${virgola(min.media)}`, rec.length > 0 && media >= min.media, rec.length ? "Media " + virgola(media) : "Nessuna recensione"],
  ];
  const tuttiOk = req.every((r) => r[1]);
  const inCorso = pass.find((p) => p.stato === "richiesta");
  return {
    t: "Passa a Impresa",
    h: `<div class="pad"><div class="eroe"><h3>Da artigiano a Impresa AncheCasa</h3><p>Oggi ricevi i pronto interventi. Come Impresa entri nei cantieri AncheCasa, nei lotti e nei moduli per le imprese. Tieni profilo, recensioni e clienti.</p></div><div style="height:14px"></div>
      ${sez("I tuoi requisiti", lista(req.map(([t, ok, s]) => voce(ok ? "ok" : "allarme", t, esc(s), null, ok ? "verde" : "giallo", stato(ok ? "verde" : "giallo", ok ? "Ok" : "Manca")))))}
      ${inCorso ? avviso("Hai già chiesto il passaggio: AncheCasa ti contatta per i documenti.") : pass.find((p) => p.stato === "approvata") ? avviso("Passaggio approvato: trovi il profilo Impresa tra i tuoi profili.") : tuttiOk
        ? `<form data-form="passaggio" novalidate>
            <fieldset class="campo"><legend>Dichiaro di avere</legend>
              <label class="spunta"><input type="checkbox" required> <span>Iscrizione alla Camera di Commercio</span></label>
              <label class="spunta"><input type="checkbox" required> <span>Assicurazione di responsabilità civile valida</span></label>
              <label class="spunta"><input type="checkbox" required> <span>DURC regolare</span></label></fieldset>
            ${campo("Note per AncheCasa (facoltativo)", `<textarea name="nota" maxlength="400"></textarea>`)}
            <button class="btn" type="submit">Chiedi il passaggio a Impresa</button></form><p class="sotto piccolo">AncheCasa ti chiede i documenti prima di approvare.</p>`
        : `<div class="card"><p>Quando hai tutti i requisiti, da qui chiedi il passaggio.</p></div>`}</div>`,
  };
};

/* ---------- admin ---------- */
V["ad-home"] = async () => {
  const n = await DB.numeri();
  return {
    t: "Cruscotto",
    h: `<div class="pad"><p class="sotto">Ultimi 30 giorni</p>
      <div class="griglia2">${num(n.analisi_30g, "Video analizzati")}${num(n.richieste_30g, "Richieste")}${num(n.inviate_30g, "Mandate agli iscritti")}${num(n.accettate_30g, "Prese da un artigiano", "verde")}</div><div style="height:16px"></div>
      ${sez("Da fare", lista([
        voce("kit", "Artigiani da verificare", `${n.artigiani_attesa} in attesa · ${n.artigiani_verificati} verificati`, "ad-artigiani", n.artigiani_attesa ? "giallo" : "verde"),
        voce("ufficio", "Passaggi a Impresa", `${n.passaggi_attesa} da decidere`, "ad-passaggi", n.passaggi_attesa ? "giallo" : "verde"),
        voce("rete", "Segnalazioni dei privati", `${n.segnalazioni_nuove} ${n.segnalazioni_nuove === 1 ? "nuova" : "nuove"}`, "ad-segnalazioni", n.segnalazioni_nuove ? "giallo" : "verde"),
      ]))}
      ${sez("Recensioni", lista([voce("stella", n.media_voti ? "Media " + virgola(n.media_voti) : "Nessuna recensione", `${n.recensioni} recensioni in tutto`, null, "verde")]))}</div>`,
  };
};
V["ad-artigiani"] = async (filtro) => {
  filtro = filtro || "attesa";
  const tutti = await DB.artigiani();
  const l = tutti.filter((a) => a.stato === filtro);
  const pill = (k, t) => `<button type="button" class="pillola ${k === filtro ? "on" : ""}" data-go="ad-artigiani/${k}">${t} (${tutti.filter((a) => a.stato === k).length})</button>`;
  return {
    t: "Artigiani",
    back: false,
    h: `<div class="pad"><div class="pillole">${pill("attesa", "In attesa")}${pill("verificato", "Verificati")}${pill("sospeso", "Sospesi")}</div><div style="height:12px"></div>
      ${l.length ? l.map((a) => `<div class="card"><h3>${esc(a.nome_attivita)}</h3><p>${a.mestieri.map(nomeMestiere).join(", ")} · ${esc(a.citta)} · ${a.raggio_km} km</p>
        <p>${a.telefono ? `<a href="${telLink(a.telefono)}">${esc(a.telefono)}</a>` : "Senza telefono"} · P.IVA ${esc(a.piva || "non inserita")}</p>${a.descrizione ? `<p>${esc(a.descrizione)}</p>` : ""}
        <div class="btns">${a.stato !== "verificato" ? btn("Verifica", "art-stato:" + a.utente + ":verificato", "piccolo") : ""}${a.stato !== "sospeso" ? btn(a.stato === "attesa" ? "Rifiuta" : "Sospendi", "art-stato:" + a.utente + ":sospeso", "piccolo chiaro") : btn("Rimetti in attesa", "art-stato:" + a.utente + ":attesa", "piccolo chiaro")}</div></div>`).join("") : vuoto("Nessun artigiano qui.")}</div>`,
  };
};
V["ad-passaggi"] = async () => {
  const [p, art] = await Promise.all([DB.passaggi(), DB.artigiani()]);
  const nome = (id) => (art.find((a) => a.utente === id) || {}).nome_attivita || "Artigiano";
  const ST = { richiesta: ["giallo", "Da decidere"], approvata: ["verde", "Approvata"], rifiutata: ["rosso", "Rifiutata"] };
  return {
    t: "Passaggi a Impresa",
    h: `<div class="pad">${p.length ? p.map((x) => `<div class="card"><div class="riga"><div class="cresci"><b>${esc(nome(x.artigiano))}</b><small>${quando(x.creato)}${x.nota ? " · «" + esc(x.nota) + "»" : ""}</small></div>${stato(...ST[x.stato])}</div>
      ${x.stato === "richiesta" ? `<div class="btns">${btn("Approva", "passaggio:" + x.id + ":si", "piccolo")}${btn("Rifiuta", "passaggio:" + x.id + ":no", "piccolo chiaro")}</div>` : ""}</div>`).join("") : vuoto("Nessuna richiesta di passaggio.")}</div>`,
  };
};
V["ad-segnalazioni"] = async () => {
  const s = await DB.segnalazioni();
  const nomi = await DB.nomi([...new Set(s.map((x) => x.segnalatore))]).catch(() => ({}));
  const TIPO = { ristrutturazione: "Ristrutturazione", azienda: "Azienda", artigiano: "Impresa o artigiano" };
  return {
    t: "Segnalazioni",
    h: `<div class="pad">${s.length ? s.map((x) => `<div class="card"><h3>${esc(x.nome)}</h3><p>${TIPO[x.tipo] || esc(x.tipo)} · da ${esc(nomi[x.segnalatore] || "privato")} · ${quando(x.creato)}</p>
      ${x.telefono ? `<p><a href="${telLink(x.telefono)}">${esc(x.telefono)}</a></p>` : ""}${x.note ? `<p>«${esc(x.note)}»</p>` : ""}
      <label class="campo"><span>Stato</span><select data-segn="${esc(x.id)}">${[["inviata", "Nuova"], ["in_corso", "In corso"], ["partita", "Partita"], ["non_interessato", "Non interessato"]].map(([v, t]) => `<option value="${v}" ${x.stato === v ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>`).join("") : vuoto("Nessuna segnalazione.")}</div>`,
  };
};

/* ------------------------------------------------------------------------ */
/* Azioni                                                                    */
/* ------------------------------------------------------------------------ */
async function analizzaVideo() {
  const clip = await filma();
  if (!clip) return;
  if (!clip.frames.length && !clip.blob) return toast("Non ho ricevuto il video: riprova.", "errore");
  vai("in-analisi");
  try {
    const body = await corpoAnalisi(clip);
    body.citta = ((S.profilo || {}).citta || "").slice(0, 80);
    const { id } = await DB.analizza(body);
    if (!id) throw new Error("analisi_non_riuscita");
    let n = 0;
    for (const f of clip.frames.slice(0, 3)) {
      try { await DB.caricaFoto(id, n + 1, dataUrlBlob(f)); n++; } catch (e) { console.error(e); }
    }
    if (n) await DB.aggiornaRichiesta(id, { foto: n });
    vai("analisi/" + id, true);
  } catch (e) {
    console.error(e);
    const m = String(e && e.message);
    const testo = /motore_non_configurato/.test(m) ? "L'analisi dei video non è ancora attiva. Intanto cerca l'artigiano dalla ricerca." : spiegaErrore(e);
    vai("cerca", true);
    setTimeout(() => toast(testo, "errore"), 300);
  }
}

const AZIONI = {
  async indietro() { if (history.length > 1) history.back(); else vai(S.utente ? casa() : "benvenuto"); },
  ricarica() { render(); },
  async esci() { await DB.esci(); S.utente = null; vai("benvenuto"); },
  async "prova:"(chi) { await DB.entraProva(chi); await caricaUtente(); if (chi === "admin") S.ruolo = "admin"; vai(casa(), true); },
  async "azzera-prova"() { await DB.azzeraProva(); toast("Prova ricominciata da capo."); render(); },
  "go:"(r) { vai(r); },
  "cambia-ruolo"() {
    foglio(`<h2>Cambia profilo</h2><p class="sotto">Un'app sola: scegli con quale profilo lavorare adesso.</p>${lista(ruoliDisponibili().map((r) => voce(r === "admin" ? "grafico" : r === "artigiano" ? "kit" : "utente", esc(NOMI_RUOLI[r] || r), r === S.ruolo ? "In uso" : "", "ruolo/" + r, r === S.ruolo ? "verde" : "blu")))}`);
  },
  filma() { analizzaVideo(); },
  async "attiva-artigiano"() { try { await attivaArtigiano(); } catch (e) { toast(spiegaErrore(e), "errore"); } },
  "trova:"(id) { DB.richiesta(id).then((r) => chiediDove(id, r && r.mestiere)); },
  "dove-qui"() { cercaDa("qui"); },
  "cerca-qui"() {
    const f = document.querySelector('[data-form="cerca"]');
    S.ricerca = { mestiere: f.mestiere.value };
    cercaDa("qui");
  },
  manda() { manda(); },
  async "annulla:"(id) { try { await DB.annulla(id); toast("Richiesta annullata."); render(); } catch (e) { toast(spiegaErrore(e), "errore"); } },
  async "accetta:"(id) {
    try { const tel = await DB.rispondi(id, true); toast(tel ? "Fatto! Chiama il cliente: " + tel : "Fatto!"); render(); } catch (e) { toast(spiegaErrore(e), "errore"); render(); }
  },
  async "rifiuta:"(id) { try { await DB.rispondi(id, false); toast("Ok, la richiesta passa agli altri."); vai("ar-richieste"); } catch (e) { toast(spiegaErrore(e), "errore"); } },
  async "art-stato:"(arg) {
    const [id, st] = arg.split(":");
    try { await DB.statoArtigiano(id, st); toast(st === "verificato" ? "Artigiano verificato: ora compare ai privati." : "Fatto."); render(); } catch (e) { toast(spiegaErrore(e), "errore"); }
  },
  async "passaggio:"(arg) {
    const [id, si] = arg.split(":");
    try {
      const p = (await DB.passaggi()).find((x) => x.id === id);
      await DB.decidiPassaggio(p, si === "si");
      toast(si === "si" ? "Approvato: l'artigiano ha il profilo Impresa." : "Rifiutato.");
      render();
    } catch (e) { toast(spiegaErrore(e), "errore"); }
  },
};
function esegui(az) {
  if (AZIONI[az]) return AZIONI[az]();
  const k = Object.keys(AZIONI).find((x) => x.endsWith(":") && az.startsWith(x));
  if (k) return AZIONI[k](az.slice(k.length));
}

const FORM = {
  async entra(f) {
    if (!f.email.value.trim() || !f.password.value) return toast("Scrivi mail e password.", "errore");
    toast("Entro…");
    await DB.entra(f.email.value.trim(), f.password.value);
  },
  async registrati(f) {
    if (f.nome.value.trim().length < 2) return toast("Scrivi nome e cognome.", "errore");
    if (!f.citta.value.trim()) return toast("Scrivi la tua città.", "errore");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim())) return toast("Controlla la mail.", "errore");
    if (f.password.value.length < 8) throw new Error("Password should be at least 8");
    if (!f.privacy.checked) return toast("Per continuare spunta l'informativa privacy.", "errore");
    const r = await DB.registrati({ email: f.email.value.trim(), password: f.password.value, nome: f.nome.value.trim(), citta: f.citta.value.trim(), ruolo: f.ruolo.value });
    if (r.daConfermare) vai("mail", true);
  },
  async recupera(f) { await DB.recupera(f.email.value.trim()); toast("Se la mail è giusta, ti è arrivato il link."); },
  async "nuova-password"(f) {
    if (f.password.value.length < 8) throw new Error("Password should be at least 8");
    await DB.nuovaPassword(f.password.value); S.recupero = false; toast("Password cambiata."); vai(casa(), true);
  },
  async dati(f) {
    const d = { nome: f.nome.value.trim(), citta: f.citta.value.trim(), telefono: f.telefono.value.trim() };
    await DB.salvaProfilo(d); Object.assign(S.profilo, d); toast("Dati salvati."); vai("profilo");
  },
  async cerca(f) { S.ricerca = { mestiere: f.mestiere.value }; await cercaDa(f.citta.value.trim() || (S.profilo || {}).citta || "Roma"); },
  async dove(f) { if (f.citta.value.trim()) await cercaDa(f.citta.value.trim()); },
  async "telefono-manda"(f) {
    const tel = f.telefono.value.trim();
    if (tel.replace(/\D/g, "").length < 6) return toast("Scrivi un numero di telefono valido.", "errore");
    S.profilo.telefono = tel;
    DB.salvaProfilo(S.profilo).catch(() => {});
    await mandaA(S.daMandare || [], tel);
  },
  async recensione(f) {
    const voti = {};
    VOCI.forEach(([k]) => { const x = f.querySelector(`input[name="${k}"]:checked`); if (x) voti[k] = Number(x.value); });
    if (Object.keys(voti).length < VOCI.length) return toast("Dai un voto a tutte le voci.", "errore");
    await DB.recensisci(f.getAttribute("data-id"), voti, f.testo.value.trim());
    toast("Grazie! Recensione pubblicata."); vai("richiesta/" + f.getAttribute("data-id"), true);
  },
  async segnala(f) {
    if (f.nome.value.trim().length < 2) return toast("Scrivi il nome.", "errore");
    if (!f.consenso.checked) return toast("Spunta che la persona lo sa.", "errore");
    await DB.segnala({ tipo: f.tipo.value, nome: f.nome.value.trim(), telefono: f.telefono.value.trim(), note: f.note.value.trim() });
    toast("Segnalazione inviata: grazie!"); render();
  },
  async ristruttura(f) {
    if (f.telefono.value.trim().replace(/\D/g, "").length < 6) return toast("Scrivi il tuo telefono.", "errore");
    await DB.segnala({ tipo: "ristrutturazione", nome: (((S.profilo || {}).nome || "Io").slice(0, 70) + " (per me)"), telefono: f.telefono.value.trim(), note: f.note.value.trim() });
    toast("Fatto: ti richiamiamo noi."); vai("home");
  },
  async scheda(f) {
    const mestieri = Array.from(f.querySelectorAll('input[name="mestieri"]:checked')).map((x) => x.value);
    if (f.nome_attivita.value.trim().length < 2) return toast("Scrivi il nome dell'attività.", "errore");
    if (!mestieri.length) return toast("Scegli almeno un mestiere.", "errore");
    if (f.telefono.value.trim().replace(/\D/g, "").length < 6) return toast("Scrivi il telefono.", "errore");
    const citta = f.citta.value.trim();
    const dati = { nome_attivita: f.nome_attivita.value.trim(), mestieri, telefono: f.telefono.value.trim(), citta, raggio_km: Number(f.raggio_km.value), orari: f.orari.value.trim(), piva: f.piva.value.trim(), descrizione: f.descrizione.value.trim() };
    if (f.disponibile) dati.disponibile = f.disponibile.checked;
    const prima = await scheda();
    if (!prima || prima.citta !== citta || prima.lat == null) {
      try { const c = DB.prova ? { lat: 41.87 + Math.random() * 0.02, lng: 12.46 + Math.random() * 0.02 } : await coordinateDi(citta); dati.lat = c.lat; dati.lng = c.lng; } catch (e) { return toast("Non trovo questa città: controlla e riprova.", "errore"); }
    }
    await DB.salvaArtigiano(dati);
    toast(prima ? "Salvato." : "Scheda inviata: AncheCasa la verifica e poi compari ai privati.");
    vai("ar-oggi", true);
  },
  async passaggio(f) {
    if (Array.from(f.querySelectorAll('input[type="checkbox"]')).some((x) => !x.checked)) return toast("Spunta tutte le dichiarazioni.", "errore");
    await DB.chiediPassaggio(f.nota.value.trim()); toast("Richiesta inviata: AncheCasa ti contatta per i documenti."); render();
  },
};

app.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go],[data-az],[data-tab]");
  if (!t || t.tagName === "INPUT") return;
  if (t.dataset.tab) {
    if (t.dataset.tab === "filma") { analizzaVideo(); return; }
    vai(t.dataset.tab); return;
  }
  if (t.dataset.go) { vai(t.dataset.go); return; }
  if (t.dataset.az) esegui(t.dataset.az);
});
app.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-go][role=button]")) { e.preventDefault(); vai(e.target.dataset.go); }
});
app.addEventListener("submit", async (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f) return;
  e.preventDefault();
  const b = f.querySelector('button[type="submit"]');
  if (b) b.disabled = true;
  try { await FORM[f.dataset.form](f); } catch (err) { console.error(err); toast(err && err.message && !/^[a-z_]+$/.test(err.message) && !/should|Invalid|registered|confirmed|fetch|rate/i.test(err.message) ? err.message : spiegaErrore(err), "errore"); } finally { if (b && b.isConnected) b.disabled = false; }
});
app.addEventListener("change", async (e) => {
  const s = e.target.closest("[data-segn]");
  if (!s) return;
  try { await DB.statoSegnalazione(s.dataset.segn, s.value); toast("Stato aggiornato."); } catch (err) { toast(spiegaErrore(err), "errore"); }
});

avvia();
