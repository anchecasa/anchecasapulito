/* Dashboard «Oggi» come il modello approvato (11.10.2026).
   I cinque HTML in docs/modello-dashboard sono solo il disegno: qui i dati vengono dal database. */
import { esc, btn, vuoto } from "./ui.js";
import { Q } from "./q.js";
import { MODULI } from "./catalogo.js";
import { moduliDelMestiere } from "./pacchetti.js";
import { prezziVisibili } from "./viste-pulsanti.js";

const AREA = "https://areaprivata.anchecasa.it/dashboard/#/admin/";
const NOMI_RETE = { reteitalia: "Responsabile Rete Italia", sviluppo: "Responsabile sviluppo rete", capoarea: "Capo area", agente: "Agente", subagente: "Sub-agente" };

function vuotoRichiesto() {
  try { return new URLSearchParams(location.search).has("vuoto"); } catch (e) { return false; }
}
function saluto(nome) {
  const h = new Date().getHours();
  const p = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const n = String(nome || "").replace(/\(esempio\)/ig, "").trim().split(" ")[0];
  return p + (n ? ", " + n : "");
}
function fraGiorni(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!t) return null;
  return Math.round((t - Date.now()) / 864e5);
}
function giorniMese() {
  const o = new Date();
  return new Date(o.getFullYear(), o.getMonth() + 1, 0).getDate() - o.getDate();
}

export function installa(core) {
  const { S, V, AZIONI, FORM, PROFILI, vai, render } = core;

  if (window.matchMedia) {
    const mq = window.matchMedia("(min-width: 900px)");
    const ridisegna = () => { if (["impresa", "fornitore", "admin"].includes(S.base)) render(); };
    if (mq.addEventListener) mq.addEventListener("change", ridisegna);
  }

  PROFILI.privato.tabs = [["home", "casa", "Oggi"], ["casa", "cerca", "Casa"], ["bacheca", "lista", "Annunci"], ["richieste", "doc", "Richieste"], ["profilo", "utente", "Profilo"]];
  const tabRete = [["re-home", "casa", "Oggi"], ["re-clienti", "lista", "Clienti"], ["re-lavori", "doc", "Pratiche"], ["re-squadra", "rete", "Squadra"], ["re-guadagni", "euro", "Guadagni"]];
  ["reteitalia", "sviluppo", "capoarea", "agente", "subagente"].forEach((k) => { if (PROFILI[k]) PROFILI[k].tabs = tabRete; });
  if (PROFILI.impresa) PROFILI.impresa.tabs = [["dash", "casa", "Oggi"], ["elenco/cliente", "lista", "Clienti"], ["elenco/cantiere", "gru", "Commesse"], ["im-moduli", "griglia", "Moduli"], ["profilo", "utente", "Profilo"]];
  if (PROFILI.fornitore) PROFILI.fornitore.tabs = [["dash", "casa", "Oggi"], ["fo-lotti", "lista", "Richieste"], ["elenco/prodotto", "box", "Listino"], ["im-moduli", "griglia", "Moduli"], ["profilo", "utente", "Profilo"]];
  if (PROFILI.admin) PROFILI.admin.tabs = [["ad-home", "grafico", "Da fare"], ["ad-verifica", "kit", "Aziende"], ["ad-rete", "rete", "Rete"], ["ad-ufficio", "ufficio", "Ufficio"], ["ad-economia", "euro", "Economia"]];

  function acceso(id) {
    const h = (location.hash || "#/").replace(/^#\//, "");
    return h === id || h.startsWith(id + "/");
  }
  function voce(id, et, extra) {
    return `<button type="button" data-go="${esc(id)}" class="${acceso(id) ? "on" : ""}"><span>${esc(et)}</span>${extra || ""}</button>`;
  }

  core.menuLato = () => {
    const org = (S.miei && (S.miei.org || []).find((o) => o.id === S.org)) || {};
    const nome = org.nome || "La tua attività";
    const verificata = org.stato_verifica === "verificata";
    if (S.base === "admin") {
      return `<aside class="menu-lato admin" aria-label="Menu admin">
        <div class="marca"><b>Anche<span>Casa</span></b><small>Amministrazione</small></div>
        <nav>
          ${voce("ad-home", "Da fare")}
          <div class="gruppo">PIATTAFORMA</div>
          ${voce("ad-verifica", "Aziende e verifiche")}
          ${voce("ad-iscrizioni", "Iscrizioni")}
          ${voce("ad-moduli", "Moduli e prezzi")}
          ${voce("ad-prezzari", "Prezzari regionali")}
          <div class="gruppo">ANCHECASA GC</div>
          ${voce("ad-gc", "Commesse dei privati")}
          ${voce("ad-aziende", "Imprese partner")}
          <div class="gruppo">RETE</div>
          ${voce("ad-rete", "Persone e proposte")}
          ${voce("ad-provvigioni", "Provvigioni")}
          ${voce("strategia", "Sala strategia")}
          <div class="gruppo">UFFICIO INTERNO</div>
          <a href="${AREA}task">Task</a>
          <a href="${AREA}file">File</a>
          <a href="${AREA}chat-team">Chat del team</a>
          <a href="${AREA}magazine">Magazine</a>
          <a href="${AREA}admin-mail">Mail</a>
          <div class="gruppo">ECONOMIA</div>
          ${voce("ad-economia", "Economia")}
        </nav></aside>`;
    }
    const piede = `<div class="piede">${voce("im-moduli", "Abbonamento e moduli")}<button type="button" data-az="cambia-ruolo">Invita</button><a href="mailto:info@anchecasa.it">Assistenza</a></div>`;
    if (S.base === "fornitore") {
      return `<aside class="menu-lato" aria-label="Menu fornitore">
        <div class="marca"><b>Anche<span>Casa</span></b><small>Costruiamo fiducia</small></div>
        <div class="ditta"><b>${esc(nome)}</b><small>${verificata ? "Verificata" : "In verifica"}</small><button type="button" data-az="cambia-ruolo">Cambia profilo</button></div>
        <nav>
          ${voce("dash", "Oggi")}
          ${voce("fo-lotti", "Richieste")}
          ${voce("elenco/prodotto", "Offerte e ordini")}
          ${voce("fo-listino", "Listino")}
          ${voce("elenco/cliente", "Clienti e fatture")}
          ${voce("elenco/documento", "Documenti")}
        </nav>${piede}</aside>`;
    }
    return `<aside class="menu-lato" aria-label="Menu azienda">
      <div class="marca"><b>Anche<span>Casa</span></b><small>Costruiamo fiducia</small></div>
      <div class="ditta"><b>${esc(nome)}</b><small>${verificata ? "Verificata" : "In verifica"}</small><button type="button" data-az="cambia-ruolo">Cambia profilo</button></div>
      <nav>
        ${voce("dash", "Oggi")}
        ${voce("elenco/cliente", "Clienti e vendite")}
        ${voce("elenco/cantiere", "Commesse")}
        ${voce("fo-lotti", "Acquisti")}
        ${voce("im-persone", "Persone e sicurezza")}
        ${voce("elenco/articolo", "Magazzino e mezzi")}
        ${voce("elenco/gara", "Gare")}
        ${voce("im-report", "Report")}
      </nav>${piede}</aside>`;
  };

  function barra(passo, testo, sblocca) {
    if (!passo) return "";
    return `<div class="barra-passo"><div><b>Manca un passo</b><p>${esc(testo)} ${esc(sblocca)}</p></div><button type="button" class="btn" data-go="passo/${esc(passo)}">Vai al passo</button></div>`;
  }

  async function orgMia() {
    if (!S.org || vuotoRichiesto()) return null;
    return Q.uno("app_org", { id: S.org }).catch(() => null);
  }

  V.dash = async () => {
    if (S.base === "fornitore") return oggiFornitore();
    return oggiAzienda();
  };

  async function oggiAzienda() {
    const org = await orgMia();
    const id = org && org.id;
    const rec = id && !vuotoRichiesto() ? await Q.sel("app_record", { eq: { org: id }, lim: 300 }).catch(() => []) : [];
    const scad = rec.filter((r) => { const g = fraGiorni(r.scadenza); return g !== null && g >= 0 && g <= 15; });
    const richieste = rec.filter((r) => r.tipo === "richiesta" || r.stato === "nuova");
    const preventivi = rec.filter((r) => r.tipo === "preventivo" && r.stato !== "accettato");
    const commesse = rec.filter((r) => r.tipo === "cantiere" && r.stato !== "chiuso");
    const principale = commesse[0];
    const telefono = String((S.profilo && S.profilo.telefono) || "").replace(/\D/g, "").length >= 8;
    const piva = org && String(org.piva || "").replace(/\D/g, "").length === 11;
    let passo = "";
    let testo = "";
    if (!telefono) { passo = "telefono"; testo = "Manca il telefono."; }
    else if (org && !piva) { passo = "piva"; testo = "Manca la partita IVA."; }
    else if (org && org.stato_verifica !== "verificata") { passo = "documenti"; testo = "Carica i documenti."; }
    const ateco = (org && org.ateco) || [];
    const proposti = moduliDelMestiere(ateco, (org && org.tipo) || "impresa", "");
    const moduli = id && !vuotoRichiesto() ? await Q.sel("app_moduli", { eq: { org: id } }).catch(() => []) : [];
    const attivo = (m) => moduli.some((x) => x.stato === "attivo" && (x.modulo === m || x.modulo === "pacchetto"));
    const prezzi = await prezziVisibili();
    const schede = MODULI.filter((m) => !m.nascosto && (proposti.moduli.has(m.id) || m.id === "ufficio")).map((m) => {
      if (attivo(m.id) || attivo("base") && m.id === "ufficio") return { m, cls: "asp-acceso", et: "Attivo", vai: "im-moduli" };
      if (passo) return { m, cls: "asp-lock", et: "Completa il profilo", vai: "passo/" + passo };
      if (!prezzi) return { m, cls: "asp-prova", et: "Prova gratis", vai: "im-moduli" };
      return { m, cls: "asp-prova", et: "Richiedi l'attivazione", vai: "im-moduli" };
    });
    if (!schede.some((s) => s.cls === "asp-business") && org && org.tipo !== "gc") {
      schede.push({ m: { id: "gc", nome: "AncheCasa GC" }, cls: "asp-business", et: "Business · Richiedi", vai: "im-moduli" });
    }
    const fare = (vuotoRichiesto() ? [] : rec.filter((r) => r.scadenza || r.stato === "aperto" || r.stato === "in corso")).slice(0, 5);
    const nome = (S.profilo && S.profilo.nome) || "";
    return {
      guscio: "oggi", t: "",
      h: `<div class="pad dash-oggi">
        <div class="dash-testa"><div><h1>${esc(saluto(nome))}</h1><p class="sotto">${esc((org && org.nome) || "Azienda")}</p></div>
          <form data-form="cerca-dash" role="search"><label>Cerca clienti, commesse, documenti<input type="search" name="q" placeholder="Cerca"></label></form>
          <button type="button" class="btn" data-go="notifiche" aria-label="Notifiche">Notifiche${S.nonLette ? " (" + S.nonLette + ")" : ""}</button>
          <button type="button" class="btn-nuovo" data-go="im-crea">+ Nuovo</button></div>
        ${barra(passo, testo, "Sblocca le funzioni che aspettano questo passo.")}
        <div class="numeri4">
          <div class="card"><b>${richieste.length}</b><span>Richieste nuove</span></div>
          <div class="card"><b>${preventivi.length}</b><span>Preventivi in attesa</span></div>
          <div class="card"><b>${commesse.length}</b><span>Commesse in corso</span></div>
          <div class="card"><b>${scad.length}</b><span>Scadenze entro 15 giorni</span></div>
        </div>
        <h2>Da fare oggi</h2>
        ${fare.length ? fare.map((r) => `<div class="riga-fare"><div><b>${esc(r.titolo || r.tipo)}</b><small>${esc(r.stato || "")}</small></div><button type="button" class="btn chiaro" data-go="scheda/${esc(r.id)}">Apri</button></div>`).join("") : vuoto("Niente in scadenza. Il primo passo è un sopralluogo.") + btn("Nuovo sopralluogo Flash", "go:so-nuovo")}
        <div class="due" style="margin-top:16px">
          <div class="card"><h3>Clienti e vendite</h3>
            <p>Sopralluoghi ${rec.filter((r) => r.tipo === "sopralluogo").length} · Preventivi ${rec.filter((r) => r.tipo === "preventivo").length} · Accettati ${rec.filter((r) => r.stato === "accettato").length}</p>
            ${btn("Nuovo sopralluogo Flash", "go:so-nuovo")}</div>
          <div class="card"><h3>${principale ? esc(principale.titolo) : "Nessuna commessa"}</h3>
            ${principale ? `<div class="barra-ob"><i style="width:${Math.max(0, Math.min(100, Number((principale.dati || {}).avanzamento) || 0))}%"></i></div>` : "<p>Apri la prima commessa quando un preventivo è accettato.</p>"}
            ${attivo("cantieri") ? "" : `<button type="button" class="asp-prova" data-go="im-moduli">Costi reali e margine · Prova gratis</button>`}
          </div>
        </div>
        <h2>I tuoi moduli</h2>
        <div class="griglia-mod">${schede.map((s) => `<button type="button" class="${s.cls}" data-go="${esc(s.vai)}"><b>${esc(s.m.nome)}</b><small>${esc(s.et)}</small></button>`).join("")}</div>
      </div>`,
    };
  }

  async function oggiFornitore() {
    const org = await orgMia();
    const id = org && org.id;
    const lotti = vuotoRichiesto() ? [] : await Q.sel("app_record", { eq: { tipo: "lotto" }, lim: 100 }).catch(() => []);
    const miei = lotti.filter((r) => !id || r.org !== id);
    const nuovi = miei.filter((r) => r.stato === "aperto");
    const moduli = id && !vuotoRichiesto() ? await Q.sel("app_moduli", { eq: { org: id } }).catch(() => []) : [];
    const haBase = moduli.some((m) => m.stato === "attivo" && (m.modulo === "base" || m.modulo === "pacchetto"));
    const ateco = ((org && org.ateco) || []).join(", ") || "ATECO da scegliere";
    const docs = id && !vuotoRichiesto() ? await Q.sel("app_record", { eq: { org: id, tipo: "documento" }, lim: 30 }).catch(() => []) : [];
    const sem = (r) => {
      const g = fraGiorni(r.scadenza);
      if (g === null) return `<span class="semaforo sem-manca">Manca</span>`;
      if (g < 0) return `<span class="semaforo sem-manca">Manca</span>`;
      if (g <= 15) return `<span class="semaforo sem-scade">Scade</span>`;
      return `<span class="semaforo sem-ok">Valido</span>`;
    };
    const nome = (S.profilo && S.profilo.nome) || "";
    return {
      guscio: "oggi", t: "",
      h: `<div class="pad dash-oggi">
        <div class="dash-testa"><div><h1>${esc(saluto(nome))}</h1><p class="sotto">${esc((org && org.nome) || "Fornitore")}</p></div>
          <button type="button" class="btn" data-go="notifiche">Notifiche</button></div>
        <div class="card"><h3>Richieste ricevute <span class="tag-prova">Gratis</span> ${nuovi.length ? `<span class="tag-n">${nuovi.length}</span>` : ""}</h3>
          ${nuovi.length ? nuovi.slice(0, 4).map((r) => `<div class="riga-fare"><div><b>${esc(r.titolo)}</b></div><button type="button" class="btn" data-go="scheda/${esc(r.id)}">${r.tipo === "gara" ? "Apri la gara" : "Fai l'offerta"}</button></div>`).join("") : vuoto("Nessuna richiesta. Quando un cantiere ti scrive, la trovi qui.")}
        </div>
        <div class="card" style="margin-top:12px"><h3>Tutte le richieste della tua zona</h3>
          ${haBase ? (miei.length ? miei.slice(0, 5).map((r) => `<p>${esc(r.titolo)}</p>`).join("") : vuoto("In zona non c'è ancora una richiesta.")) : `<div class="sfocato" aria-hidden="true"><p>Richiesta in zona</p><p>Richiesta in zona</p><p>Richiesta in zona</p></div><button type="button" class="asp-prova" data-go="im-moduli">Prova gratis l'abbonamento</button>`}
        </div>
        <div class="card" style="margin-top:12px"><h3>Cosa fai</h3><p>Settore ${esc(ateco)}</p><p>${esc((org && org.citta) || "Zona da indicare")} · ${esc((org && org.regione) || "")}</p></div>
        <div class="card" style="margin-top:12px"><h3>Documenti per i cantieri</h3>
          ${docs.length ? docs.slice(0, 6).map((r) => `<div class="riga-fare"><span>${esc(r.titolo || "Documento")}</span>${sem(r)}<button type="button" class="btn chiaro" data-go="scheda/${esc(r.id)}">Apri</button></div>`).join("") : vuoto("Nessun documento. Il primo passo è caricare il DURC.")}
        </div>
        <h2>Strumenti</h2>
        <div class="griglia-mod">
          <button type="button" class="${haBase ? "asp-acceso" : "asp-prova"}" data-go="fo-listino"><b>Listino e ordini</b><small>${haBase ? "Attivo" : "Prova gratis"}</small></button>
          <button type="button" class="${haBase ? "asp-acceso" : "asp-lock"}" data-go="${haBase ? "elenco/cliente" : "passo/piva"}"><b>Clienti e fatture</b><small>${haBase ? "Attivo" : "Completa il profilo"}</small></button>
          <button type="button" class="asp-prova" data-go="im-moduli"><b>Magazzino e flotta</b><small>Prova gratis</small></button>
        </div>
      </div>`,
    };
  }

  const homeVecchia = V.home;
  V.home = async () => {
    if (S.base !== "privato") return homeVecchia ? homeVecchia() : { h: "" };
    const nome = (S.profilo && S.profilo.nome) || "";
    const citta = (S.profilo && S.profilo.citta) || "";
    const tel = String((S.profilo && S.profilo.telefono) || "").replace(/\D/g, "").length >= 8;
    const accessi = vuotoRichiesto() ? [] : ((S.miei && S.miei.accessi) || []).filter((a) => a.ruolo === "cliente");
    let cantiere = null;
    if (accessi[0] && accessi[0].record) cantiere = await Q.uno("app_record", { id: accessi[0].record }).catch(() => null);
    const obiettivi = (S.profilo && S.profilo.obiettivi) || [];
    const lucchetto = (vaiA, etichetta) => tel
      ? `<button type="button" data-go="${vaiA}"><b>${esc(etichetta)}</b></button>`
      : `<button type="button" class="asp-lock" data-go="passo/telefono"><b>${esc(etichetta)}</b><small>Completa il profilo</small></button>`;
    return {
      t: "",
      h: `<div class="pad dash-oggi fondo-phone">
        <div class="dash-testa"><div><h1>${esc(saluto(nome))}</h1><p class="sotto">${esc(citta || "La tua città")}</p></div>
          <button type="button" class="btn chiaro" data-go="notifiche" aria-label="Notifiche">Notifiche</button></div>
        ${tel ? "" : barra("telefono", "Verifica il telefono per pubblicare e scrivere in chat.", "Sblocca annunci e chat.")}
        ${obiettivi.length ? `<p class="sotto">Scelto in «Cosa vuoi fare?»</p><div class="griglia-casa">${obiettivi.map((o) => String(o) === "guasto" ? `<button type="button" data-tab="filma"><b>Ho un guasto</b></button>` : `<button type="button" data-go="cerca"><b>${esc(o)}</b></button>`).join("")}</div>` : ""}
        <button type="button" class="btn-guasto" data-tab="filma">Ho un guasto</button>
        ${cantiere ? `<div class="card" style="margin-top:12px"><h3>Il mio cantiere</h3><p>${esc(cantiere.titolo || "")}</p><div class="barra-ob"><i style="width:${Math.max(0, Math.min(100, Number((cantiere.dati || {}).avanzamento) || 0))}%"></i></div><button type="button" class="btn" data-go="scheda/${esc(cantiere.id)}">SAL da approvare</button></div>` : ""}
        <div class="griglia-casa" style="margin-top:12px">
          <button type="button" data-go="cerca"><b>Trova un artigiano</b></button>
          ${lucchetto("cerca", "Ristruttura")}
          ${lucchetto("bacheca", "Vendo o affitto")}
          ${lucchetto("bacheca", "Cerco casa")}
          ${lucchetto("bacheca", "Cerco lavoro")}
          ${lucchetto("bollette", "Check Bollette")}
        </div>
        <div class="riga-fare"><button type="button" class="btn chiaro" data-go="segnala">Segnala ad AncheCasa</button></div>
        <div class="riga-fare"><a class="btn chiaro" href="https://sicura.anchecasa.it" style="min-height:44px;display:inline-flex;align-items:center">Corsi AncheSicura</a></div>
      </div>`,
    };
  };

  V.casa = async () => ({
    t: "Casa",
    h: `<div class="pad"><div class="griglia-casa">
      <button type="button" data-go="cerca"><b>Trova un artigiano</b></button>
      <button type="button" data-go="filma"><b>Ho un guasto</b></button>
      <button type="button" data-go="bacheca"><b>Annunci</b></button>
      <button type="button" data-go="profilo"><b>Profilo</b></button>
    </div></div>`,
  });

  V["re-home"] = async () => {
    const me = (S.miei && S.miei.rete) || {};
    const vuotoOra = vuotoRichiesto();
    const vend = vuotoOra ? [] : await Q.sel("app_vendite", { lim: 500 }).catch(() => []);
    const mie = vend.filter((v) => v.venditore === S.utente.id);
    const mese = new Date().toISOString().slice(0, 7);
    const obiet = vuotoOra ? [] : await Q.sel("app_obiettivi", { lim: 50 }).catch(() => []);
    const ob = obiet.find((o) => o.utente === S.utente.id && String(o.mese || "").slice(0, 7) === mese) || obiet.find((o) => o.utente === S.utente.id);
    const fatti = mie.filter((v) => String(v.creato || "").slice(0, 7) === mese).length;
    const manca = ob ? Math.max(0, Number(ob.aziende || 0) - fatti) : null;
    const pratiche = vuotoOra ? [] : await Q.sel("app_sopralluoghi", { lim: 20 }).catch(() => []);
    const linee = vuotoOra ? [] : await Q.rpc("app_linee_decise").catch(() => []);
    const linea = (linee || [])[0];
    const zona = me.regione || me.area || me.zona || "";
    return {
      t: "",
      h: `<div class="pad dash-oggi fondo-phone">
        <h1>${esc(NOMI_RETE[me.ruolo] || "Rete")}</h1>
        <p class="sotto">${esc(zona || "Zona da assegnare")}</p>
        <div class="card">${ob ? `<b>Obiettivo del mese</b><p>${fatti} di ${esc(ob.aziende)} aziende</p><div class="barra-ob"><i style="width:${Math.min(100, (fatti / (Number(ob.aziende) || 1)) * 100)}%"></i></div><p>${manca === 1 ? "ti manca 1" : "ti mancano " + manca}, in ${giorniMese()} giorni</p>` : vuoto("Nessun obiettivo questo mese. Lo fissano l'admin e il Responsabile Rete Italia.")}</div>
        <button type="button" class="btn-guasto" data-go="so-nuovo">Nuovo sopralluogo Flash</button>
        <div class="griglia-casa" style="margin-top:12px">
          <button type="button" data-go="re-vendi"><b>Registra un cliente</b></button>
          <button type="button" data-go="rete-proposte"><b>Proponi una persona</b></button>
        </div>
        <h2>Le mie pratiche</h2>
        ${pratiche.length ? pratiche.slice(0, 5).map((p) => `<div class="riga-fare"><span>${esc(p.titolo || p.comune || "Sopralluogo")}</span><span class="tag-prova">${esc(p.stato || "")}</span></div>`).join("") : vuoto("Nessuna pratica. Il primo passo è un sopralluogo Flash.")}
        <div class="card" style="margin-top:12px;background:#FFF1E4"><h3>Ultima linea decisa</h3>${linea ? `<p><b>${esc(linea.titolo || "")}</b></p><p>${esc(linea.linea || "")}</p>` : vuoto("Nessuna linea decisa.")}</div>
      </div>`,
    };
  };

  V["ad-home"] = async () => {
    const orgs = vuotoRichiesto() ? [] : await Q.sel("app_org", { lim: 200 }).catch(() => []);
    const liste = orgs.filter((o) => o.tipo !== "gc" && (o.stato_verifica || "da_verificare") !== "verificata");
    let righe = [];
    try { righe = await Q.rpc("app_iscrizione_dove", { p_giorni: 30 }) || []; } catch (e) { righe = []; }
    if (vuotoRichiesto()) righe = [];
    if (!Array.isArray(righe)) righe = [];
    if (!righe.length && core.DB.prova && !vuotoRichiesto() && core.DB.datiProva) {
      const utenti = Object.values((core.DB.datiProva().utenti) || {});
      const senzaTel = utenti.filter((u) => String(u.telefono || "").replace(/\D/g, "").length < 8).length;
      if (senzaTel) righe = [{ passo: "telefono", persone: senzaTel, categoria: "profilo" }];
    }
    const max = righe.reduce((s, r) => Math.max(s, Number(r.persone) || 0), 0) || 1;
    const perso = righe.reduce((a, r) => (Number(r.persone) > Number(a.persone || 0) ? r : a), {});
    let ric = [];
    try { ric = await Q.sel("richieste_iscrizione", { lim: 50 }); } catch (e) { ric = []; }
    ric = (ric || []).filter((r) => r.dati && r.dati.modulo === "consulenza-prezzi");
    if (vuotoRichiesto()) ric = [];
    const prezzi = await prezziVisibili();
    const tutte = orgs.filter((o) => o.tipo !== "gc");
    const completi = tutte.filter((o) => String(o.piva || "").replace(/\D/g, "").length === 11);
    const pct = tutte.length ? Math.round((completi.length / tutte.length) * 100) : 0;
    return {
      guscio: "oggi", t: "",
      h: `<div class="pad dash-oggi">
        <h1>Da fare</h1>
        <div class="numeri3">
          <div class="card"><b>${liste.length}</b><span>da verificare</span></div>
          <div class="card"><b>${ric.length}</b><span>consulenze</span></div>
          <div class="card"><b>${pct}%</b><span>profili completi</span></div>
        </div>
        <h2>Aziende da verificare</h2>
          ${liste.length ? liste.slice(0, 8).map((o) => `<div class="card"><button type="button" class="link-nome" data-go="ad-verifica"><b>${esc(o.nome)}</b></button><p>${esc(o.tipo || "")}${o.piva ? " · P.IVA " + esc(o.piva) : o.cf ? " · CF " + esc(o.cf) : String(o.tipo || "").startsWith("committente") ? " · committente" : " · senza P.IVA"}</p>
          <div class="riga-fare">${btn("Verifica", "verifica-org:" + o.id + ":verificata", "piccolo")}${btn("Serve un documento", "verifica-org:" + o.id + ":da_verificare", "piccolo chiaro")}</div></div>`).join("") : vuoto("Nessuna azienda da verificare.")}
        <div class="solo-pc">
        <h2>Iscrizioni: dove si fermano</h2>
        ${righe.length ? `<div class="imbuto">${righe.map((r) => `<div class="r"><span>${esc(r.passo)}</span><div class="b ${r === perso ? "perso" : ""}" style="width:${Math.max(8, (Number(r.persone) / max) * 100)}%"></div><b>${esc(r.persone)}</b></div>`).join("")}</div>` : vuoto("Nessun passo registrato in questi 30 giorni.")}
        </div>
        <h2>Richieste «Parla con un consulente»</h2>
        ${ric.length ? ric.map((r) => `<div class="riga-fare"><div><b>${esc((r.dati && r.dati.nome) || "Richiesta")}</b><small>${esc((r.dati && (r.dati.email || r.dati.Mail)) || "")}</small></div><button type="button" class="btn" data-go="ad-aziende">Assegna</button></div>`).join("") : vuoto("Nessuna richiesta.")}
        <h2>Prezzi al pubblico</h2>
        <form data-form="prezzi-visibili">
          <label class="interruttore"><input type="checkbox" name="accesi" ${prezzi ? "checked" : ""}> Mostra i prezzi su sito e app</label>
          <button class="btn" type="submit">Salva</button>
        </form>
        <p class="sotto">Task, file, chat e Magazine restano nell'area privata: le voci del menu ci portano.</p>
      </div>`,
    };
  };

  FORM["cerca-dash"] = (f) => {
    const q = (f.q.value || "").trim();
    if (q) vai("elenco/cliente");
  };
  FORM["prezzi-visibili"] = async (f) => {
    const accesoSi = !!f.accesi.checked;
    const r = await Q.uno("app_impostazioni", { chiave: "prezzi_visibili" }).catch(() => null);
    if (r) await Q.upd("app_impostazioni", { chiave: "prezzi_visibili" }, { valore: accesoSi });
    else await Q.ins("app_impostazioni", { chiave: "prezzi_visibili", valore: accesoSi });
    vai("ad-home", true);
  };

  AZIONI["verifica-org:"] = AZIONI["verifica-org:"] || (async (resto) => {
    const p = String(resto).split(":");
    await Q.upd("app_org", { id: p[0] }, { stato_verifica: p[1] });
    vai("ad-home", true);
  });

  V["ad-ufficio"] = async () => ({
    t: "Ufficio",
    h: `<div class="pad dash-oggi">
      <h1>Ufficio interno</h1>
      <p class="sotto">Task, file, chat e Magazine restano nell'area privata.</p>
      <div class="griglia-casa">
        <a href="${AREA}task"><b>Task</b></a>
        <a href="${AREA}file"><b>File</b></a>
        <a href="${AREA}chat-team"><b>Chat del team</b></a>
        <a href="${AREA}magazine"><b>Magazine</b></a>
        <a href="${AREA}admin-mail"><b>Mail</b></a>
      </div>
    </div>`,
  });
}
