/* App AncheCasa sul telefono per TUTTI i profili (12.10.2026, «Vista A chiara» approvata da Nando).
   19:43 Nando: questa app sostituisce ogni vista da telefono. Privato, azienda/fornitori, rete e admin entrano qui.
   - Barra in basso: le stesse 4 voci della barra del telefono della dashboard di ogni profilo, con il + arancio al centro.
     «Altro» (tutte le altre voci, profilo, esci) è il tasto ≡ in alto a destra.
   - Le pagine della dashboard si aprono DENTRO l'app (iframe /dashboard/?inapp=1, stessa sessione): i menu si leggono da lì,
     così restano quelli decisi in «Pulsanti per profilo» e le parti CONGELATE di dashboard/js/app.js non si toccano.
   - La rete (agente verificato) ha in più le pagine native: Home, Clienti, Sopralluogo Flash, Rete con cartina, Formazione.
   Anteprime: app/?demo=privato | azienda | agente | admin  (demo=1 = agente)
   Prima versione (solo rete) qui sotto:
   Pagina separata: entra.anchecasa.it/app/ . Stesso accesso e stessi dati dell'area privata (Supabase, schema marketplace).
   Non tocca la dashboard né le parti CONGELATE di dashboard/js/app.js.
   Schede: Home · Clienti (pratiche, inviti, vendite) · + · Rete (squadra, cartina, inviti) · Altro (formazione, documenti, profilo).
   Il Sopralluogo Flash usa le stesse funzioni della dashboard: ristrutturazione_misure, ristrutturazione_media_aggiungi (bucket
   «sopralluoghi»), dossier-ia (Gemini), sopralluogo-invito (mail al cliente), ristrutturazione_messaggi.
   Regole di Nando: inviti e sopralluoghi al cliente SOLO per mail (mai WhatsApp); preventivo entro 5 giorni, 48 ore se urgente.
   Anteprima senza database: app/?demo=1 */
(function () {
  "use strict";
  const DEMO_M = /[?&]demo=([a-z0-9]+)/i.exec(location.search);
  const DEMO = !!DEMO_M;
  const DEMO_FAM = DEMO ? ({ "1": "agente", si: "agente" }[DEMO_M[1].toLowerCase()] || DEMO_M[1].toLowerCase()) : "";
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;
  const MAX_FILE = 52428800; // limite del bucket «sopralluoghi» (50 MB)
  const LINK_BENVENUTO = "https://areaprivata.anchecasa.it/benvenuto.html";
  const app = document.getElementById("app");

  /* ---------- utilità ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const dec = (n, d) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  const eur = (n) => (Number(n) || 0).toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " €";
  const quando = (d) => (d ? new Date(d).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
  const giorno = (d) => (d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "");
  const fa = (d) => { const g = Math.floor((Date.now() - new Date(d).getTime()) / 864e5); return g <= 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa"; };
  const iniziali = (n) => String(n || "?").split(/\s+/).map((x) => x[0] || "").join("").slice(0, 2).toUpperCase();
  const mailOk = (m) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m);
  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });
  const sicuro = (p, d) => p.then((r) => (r && !r.error ? r.data : d), () => d);
  const errore = (e) => String((e && (e.message || e.errore)) || e || "errore");
  function toast(t, err) {
    const b = document.getElementById("toast-box");
    b.innerHTML = '<div class="toast' + (err ? " err" : "") + '">' + esc(t) + "</div>";
    clearTimeout(toast._t); toast._t = setTimeout(() => { b.innerHTML = ""; }, err ? 5200 : 3400);
  }
  async function funzione(nome, corpo) {
    const res = await db().functions.invoke(nome, { body: corpo });
    if (res.error) {
      const c = res.error.context;
      const x = c && typeof c.json === "function" ? await c.json().catch(() => ({})) : {};
      throw new Error((x && x.errore) || res.error.message || "errore");
    }
    if (res.data && res.data.errore) throw new Error(res.data.errore);
    return res.data;
  }

  /* ---------- icone ---------- */
  const I = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  const ICO = {
    home: I('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    clienti: I('<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="10" cy="8" r="3.5"/><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.3M15.5 4.7a3.5 3.5 0 0 1 0 6.6"/>'),
    rete: I('<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5l-5.5 4.5M12 11.5l5.5 4.5"/>'),
    altro: I('<path d="M4 6h16M4 12h16M4 18h10"/>'),
    piu: I('<path d="M12 5v14M5 12h14"/>'),
    chev: I('<path d="m9 6 6 6-6 6"/>'),
    indietro: I('<path d="m15 6-6 6 6 6"/>'),
    flash: I('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    foto: I('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    video: I('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>'),
    mic: I('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    pianta: I('<path d="M3 3h18v18H3zM3 12h9V3M12 12v9M16 12h5"/>'),
    ia: I('<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>'),
    doc: I('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'),
    esci: I('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
    campana: I('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    casa: I('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>'),
    utente: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    stella: I('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
    euro: I('<path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h10M4 14h10"/>'),
    dashboard: I('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
    chiudi: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  };

  /* ---------- stato ---------- */
  const S = { uid: "", admin: false, profilo: null, mioRuolo: null, rete: [], sopr: [], segnalate: [], inviti: [], vendite: [], provv: [], docs: [], firme: [], notifiche: [] };
  let scheda = "home", segClienti = "pratiche", aperta = null;

  /* ---------- esempio per l'anteprima ---------- */
  function esempio() {
    const g = (n) => new Date(Date.now() - n * 864e5).toISOString();
    S.uid = "u-me"; S.admin = false;
    S.profilo = { nome: "Mario Rossi", famiglia: "agente", verifica: "verificato" };
    S.mioRuolo = { utente: "u-me", ruolo: "agente", regione: "Campania", stato: "attivo", superiore: "u-ca" };
    S.rete = [S.mioRuolo,
      { utente: "u-1", nome: "Luca Ferri", ruolo: "subagente", regione: "Campania", stato: "attivo", superiore: "u-me", creato: g(40) },
      { utente: "u-2", nome: "Sara Esposito", ruolo: "subagente", regione: "Campania", stato: "attivo", superiore: "u-me", creato: g(12) },
      { utente: "u-3", nome: "Gianni Russo", ruolo: "subagente", regione: "Lazio", stato: "attivo", superiore: "u-me", creato: g(5) },
      { utente: "u-4", nome: "Paola Greco", ruolo: "subagente", regione: "Puglia", stato: "sospeso", superiore: "u-1", creato: g(3) }];
    S.sopr = [
      { id: "s1", creato: g(0), nome: "Anna Bianchi", telefono: "333 1234567", mail: "anna@esempio.it", comune: "Teano", provincia: "CE", indirizzo: "Via Roma 12", descrizione: "Rifare il bagno, togliere la vasca", budget: "8-10 mila €", stato: "sopralluogo", media: [], ambienti: [], immobile: {}, criticita: "", riepilogo: "", pacchetto: "", urgente: false },
      { id: "s2", creato: g(2), nome: "Giovanni Esposito", telefono: "347 1234567", mail: "g.esposito@esempio.it", comune: "Aversa", provincia: "CE", indirizzo: "Via Roma 1", descrizione: "Ristrutturazione completa casa con giardino", budget: "60 mila €", stato: "preventivo", urgente: true,
        preventivo_entro: new Date(Date.now() + 30 * 3600e3).toISOString(), inviato_cliente_il: g(1), aperto_cliente_il: g(1), cliente_ok_il: g(0.5),
        media: [{ id: "m1", tipo: "foto", nota: "Soggiorno", path: "", url: "../img/sopralluogo-demo/soggiorno.jpg" }, { id: "m2", tipo: "foto", nota: "Cucina", url: "../img/sopralluogo-demo/cucina.jpg" }, { id: "m3", tipo: "foto", nota: "Giardino", url: "../img/sopralluogo-demo/giardino.jpg" }, { id: "m4", tipo: "foto", nota: "Facciata", url: "../img/sopralluogo-demo/facciata.jpg" }, { id: "m5", tipo: "video", nota: "Giro della casa" }, { id: "m6", tipo: "audio", nota: "" }],
        ambienti: [{ nome: "Soggiorno", larg: 4.6, lung: 5.2, alt: 2.8 }, { nome: "Cucina", larg: 3.2, lung: 3.6, alt: 2.8 }], immobile: { piano: "terra e primo", ascensore: "no" }, criticita: "Crepe sotto il balcone",
        riepilogo: "Casa indipendente con giardino: bagno, cucina, facciata e giardino.", pacchetto: "medio",
        ia: { stato: "fatto", creato: g(1), sintesi: "Casa indipendente degli anni '70 in stato scarso: umidità al piano terra, crepe sotto il balcone e impianti d'epoca. Conviene programmare insieme facciata, cappotto e infissi.", ambienti: [{}, {}, {}, {}, {}, {}], dubbi: ["Altezza del rivestimento del bagno al piano terra?"], letti: { foto: 4, audio: 1, video: 1 } } },
      { id: "s3", creato: g(9), nome: "Lucia Verdi", telefono: "339 5556677", mail: "", comune: "Caserta", provincia: "CE", indirizzo: "Viale Lincoln 8", descrizione: "Cucina nuova e pavimenti", stato: "firmata", media: [], ambienti: [], immobile: {}, preventivo_mandato_il: g(5), preventivo_accettato_il: g(3) },
    ];
    S.segnalate = [{ id: "r7", creato: g(4), nome: "Franco Neri", comune: "Capua", provincia: "CE", descrizione: "Cappotto termico", stato: "nuova" }];
    S.inviti = [
      { token: "t1", nome: "Rosa Pinto", mail: "rosa@esempio.it", famiglia: "privato", stato: "iscritto", created_at: g(6) },
      { token: "t2", nome: "Edil Sud Srl", mail: "info@edilsud.it", famiglia: "azienda", stato: "aperto", created_at: g(2) },
      { token: "t3", nome: "", mail: "marco@esempio.it", famiglia: "privato", stato: "inviato", created_at: g(0) }];
    S.vendite = [{ id: "v1", cliente_nome: "Rosa Pinto", cosa: "Luce e gas", importo: 12, tipo_importo: "canone", stato: "attiva", creato: g(6) }];
    S.provv = [{ importo: 420, stato: "pagata", creato: g(30) }, { importo: 260, stato: "maturata", creato: g(4) }];
    S.docs = [];
    S.firme = ["x"];
    S.notifiche = [{ id: "n1", testo: "Il cliente Giovanni Esposito ha detto «Mi piace»", creato: g(0.4), letto: false }];
    S.fam = ["privato", "azienda", "agente", "admin"].includes(DEMO_FAM) ? DEMO_FAM : "agente";
    if (S.fam === "admin") { S.admin = true; S.profilo = { nome: "Anteprima", famiglia: "admin" }; S.mioRuolo = null; }
    else if (S.fam !== "agente") {
      S.profilo = { nome: S.fam === "privato" ? "Marta Bianchi" : "Anteprima", famiglia: S.fam };
      S.mioRuolo = null;
      S.notifiche = [{ id: "n1", testo: S.fam === "privato" ? "Un artigiano ha risposto al tuo annuncio" : "Nuova richiesta di lavoro nella tua zona", creato: g(0.2), letto: false }];
    }
    S.nativa = S.fam === "agente";
  }

  /* ---------- dati veri ---------- */
  async function carica() {
    const uid = S.uid;
    const [admin, profilo, rete, sopr, segn, inv, vend, provv, docs, firme, noti] = await Promise.all([
      sicuro(db().from("admins").select("id").eq("id", uid).maybeSingle(), null),
      sicuro(db().from("profiles").select("nome, famiglia, verifica").eq("id", uid).maybeSingle(), null),
      sicuro(db().from("app_rete").select("utente, superiore, nome, ruolo, regione, area, stato, creato").limit(2000), []),
      sicuro(db().rpc("miei_sopralluoghi"), []),
      sicuro(db().from("ristrutturazioni").select("id, creato, nome, comune, provincia, descrizione, stato, agente_id").eq("inviato_da", uid).order("creato", { ascending: false }).limit(100), []),
      sicuro(db().from("inviti_admin").select("token, nome, mail, telefono, famiglia, categoria, stato, created_at").eq("creato_da", uid).order("created_at", { ascending: false }).limit(200), []),
      sicuro(db().from("app_vendite").select("id, cliente_nome, cosa, importo, tipo_importo, stato, creato").eq("venditore", uid).order("creato", { ascending: false }).limit(200), []),
      sicuro(db().from("app_provvigioni").select("importo, stato, mese, creato").eq("beneficiario", uid).limit(500), []),
      sicuro(db().from("app_documenti").select("id, tipo, titolo, file, ruoli, richiede_firma, versione").eq("attivo", true).limit(100), []),
      sicuro(db().from("app_firme").select("documento").eq("utente", uid).limit(500), []),
      sicuro(db().from("app_notifiche").select("id, testo, link, letto, creato").eq("utente", uid).order("creato", { ascending: false }).limit(30), []),
    ]);
    S.admin = !!admin; S.profilo = profilo; S.rete = rete || []; S.sopr = sopr || []; S.segnalate = segn || [];
    S.inviti = inv || []; S.vendite = vend || []; S.provv = provv || []; S.docs = docs || []; S.firme = (firme || []).map((x) => x.documento); S.notifiche = noti || [];
    S.mioRuolo = S.rete.find((x) => x.utente === uid) || null;
  }

  /* ---------- avvio e accesso ---------- */
  async function avvio() {
    if (DEMO) { esempio(); preparaDash(); S.pronta = true; return mostra(); }
    if (!window.acDb) { app.innerHTML = '<div class="accesso"><div class="card"><b>Collegamento non riuscito.</b><p class="mut">Controlla la connessione e ricarica la pagina.</p></div></div>'; return; }
    const s = await db().auth.getSession();
    const u = s && s.data && s.data.session && s.data.session.user;
    if (!u) return accesso();
    S.uid = u.id;
    await carica();
    // 19:43: l'app è per tutti. La rete verificata ha in più le pagine native; gli altri vedono le pagine della dashboard dentro l'app.
    const fp = S.profilo && S.profilo.famiglia;
    S.fam = S.admin ? "admin" : fp === "fornitore" ? "azienda" : fp || "";
    S.nativa = S.fam === "agente" && S.profilo.verifica === "verificato";
    preparaDash();
    S.pronta = true;
    mostra();
  }

  function accesso(msg) {
    app.innerHTML = '<form class="accesso" id="acc"><img class="logo" src="../assets/logo/anchecasa-orizzontale-trasparente.png?v=3" alt="AncheCasa">' +
      '<div class="card" style="display:flex;flex-direction:column;gap:12px"><div><div class="eti">La tua area AncheCasa</div><h1 class="h1">Entra</h1><p class="mut">Privati, aziende, rete e AncheCasa: stesso accesso dell\'area privata.</p></div>' +
      '<div class="fl"><label for="am">Mail</label><input class="in" id="am" type="email" autocomplete="email" inputmode="email" required></div>' +
      '<div class="fl"><label for="ap">Password</label><input class="in" id="ap" type="password" autocomplete="current-password" required></div>' +
      (msg ? '<div class="avv r">' + esc(msg) + "</div>" : "") +
      '<button class="btn" type="submit">Entra</button><a class="mut" href="../nuova-password.html" style="text-align:center">Password dimenticata?</a>' +
      '<a class="mut" href="../index.html" style="text-align:center">Non hai un account? Iscriviti</a></div></form>';
    document.getElementById("acc").addEventListener("submit", async (e) => {
      e.preventDefault();
      const b = e.target.querySelector("button"); b.disabled = true; b.textContent = "Entro…";
      const r = await db().auth.signInWithPassword({ email: document.getElementById("am").value.trim(), password: document.getElementById("ap").value });
      if (r.error) return accesso(/invalid/i.test(r.error.message) ? "Mail o password non corrette." : r.error.message);
      avvio();
    });
  }

  /* ---------- la dashboard dentro l'app (stessa sessione, stessi menu) ---------- */
  // Pagine della dashboard che per la rete verificata sono native nell'app.
  const NAT = { home: "home", "re-clienti": "clienti" };
  const D = { el: null, caricato: false, pronto: false, fam: "", tabs: [], altro: [], acct: [], attesa: null };
  // Barra mostrata finché la dashboard non ha caricato i menu veri (poi vale quella della dashboard).
  const PRIMA = {
    privato: [["bacheca", "Bacheca", "home"], ["pv-guasto", "Guasto", "flash"], ["pv-ristruttura", "Ristruttura", "casa"], ["pv-mie-richieste", "Richieste", "doc"]],
    agente: [["home", "Home", "home"], ["re-clienti", "Clienti", "clienti"], ["re-vendi", "Vendi", "euro"], ["guadagno", "Guadagni", "stella"]],
    admin: [["home", "Home", "home"], ["aziende-admin", "Aziende", "casa"], ["ristrutturazioni-admin", "Pratiche", "doc"], ["rete-admin", "Rete", "rete"]],
  };
  const idDa = (a) => decodeURIComponent((a.getAttribute("href") || "").replace(/^#\/[a-z]+\//, ""));
  const svgDa = (a) => { const x = a.querySelector("svg"); return x ? x.outerHTML : ICO.casa; };

  function preparaDash() {
    const r = rotta();
    const extra = location.search.replace(/^\?/, "").split("&").filter((x) => x && !/^(demo|inapp)=/.test(x));
    const q = ["inapp=1"].concat(DEMO ? ["demo=" + S.fam] : []).concat(extra).join("&");
    const f = document.createElement("iframe");
    f.id = "dash"; f.title = "AncheCasa"; f.hidden = true;
    f.src = "../dashboard/?" + q + (r.tipo === "dash" && r.page && S.fam ? "#/" + S.fam + "/" + r.page : "");
    f.addEventListener("load", agganciaDash);
    document.body.appendChild(f);
    D.el = f;
  }
  function agganciaDash() {
    let w;
    try { w = D.el.contentWindow; void w.location.pathname; } catch (e) { return; }
    // Se la dashboard rimanda al login (sessione scaduta o «Esci»), si torna all'accesso dell'app.
    if (!/\/dashboard\/?(index\.html)?$/.test(w.location.pathname)) {
      if (/\/(index\.html)?$/.test(w.location.pathname) && !/\/app\//.test(w.location.pathname)) { location.href = "./" + (DEMO ? location.search : ""); }
      return;
    }
    D.caricato = true;
    w.addEventListener("hashchange", () => leggiDash());
    if (D.attesa) { const p = D.attesa; D.attesa = null; apriDash(p); }
    let n = 0;
    const giro = () => { if (leggiDash() || ++n > 80) return; setTimeout(giro, 250); };
    giro();
  }
  function leggiDash() {
    let d, w;
    try { d = D.el.contentDocument; w = D.el.contentWindow; } catch (e) { return false; }
    if (!d) return false;
    const tabs = Array.from(d.querySelectorAll("#tabbar a.tab-it"));
    if (!tabs.length) return false;
    const m = /^#\/([a-z]+)\/([^?]*)/.exec(w.location.hash);
    if (m) D.fam = m[1];
    if (!S.fam && D.fam) S.fam = D.fam;
    D.tabs = tabs.slice(0, 4).map((a) => ({ id: idDa(a), label: a.textContent.trim(), svg: svgDa(a) }));
    D.altro = Array.from(d.querySelectorAll("#altro-panel > *")).map((x) => x.tagName === "A" ? { id: idDa(x), label: x.textContent.trim(), svg: svgDa(x) } : { sez: x.textContent.trim() });
    D.acct = Array.from(d.querySelectorAll("#acct-menu a")).filter((a) => !a.hasAttribute("data-esci") && /^#\//.test(a.getAttribute("href") || "")).map((a) => ({ id: idDa(a), label: a.textContent.trim(), svg: svgDa(a) }));
    D.pronto = true;
    // La dashboard ha cambiato pagina da sola (un link dentro una pagina): l'app la segue.
    const r = rotta();
    if (r.tipo === "dash" && m && m[2] && m[2] !== r.page) {
      if (S.nativa && NAT[m[2]]) { location.hash = NAT[m[2]]; return true; }
      history.replaceState(null, "", "#d/" + m[2]);
    }
    disegnaTab(rotta());
    return true;
  }
  function apriDash(page) {
    if (!D.el) return;
    if (!D.caricato) { D.attesa = page; return; }
    if (!page) return;
    try {
      const w = D.el.contentWindow;
      const fam = D.fam || S.fam;
      const target = "#/" + fam + "/" + page;
      if (w.location.hash !== target) w.location.hash = target;
    } catch (e) { /* niente */ }
  }

  /* ---------- telaio ---------- */
  // Indirizzi dell'app: #home #clienti #rete #altro #pratica/<id> (native) · #d/<pagina> (pagina della dashboard).
  // Un link della dashboard (#/<profilo>/<pagina>) arrivato dal telefono diventa #d/<pagina>.
  const puoProva = () => S.nativa || S.admin || S.fam === "agente";

  function rotta() {
    let h = location.hash.replace(/^#/, "");
    try { h = decodeURIComponent(h); } catch (e) { /* niente */ }
    if (h.charAt(0) === "/") {
      const m = /^\/[a-z]+\/(.+)$/.exec(h);
      h = m ? "d/" + m[1] : "";
      history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
    }
    if (h.indexOf("pratica/") === 0) return { tipo: "nativa", pag: "pratica", id: h.slice(8) };
    if (h.indexOf("d/") === 0) {
      const page = h.slice(2);
      if (S.nativa && NAT[page]) return { tipo: "nativa", pag: NAT[page] };
      return { tipo: "dash", page };
    }
    if (puoProva() && h === "prova") return { tipo: "nativa", pag: "prova" };
    if (S.nativa && ["home", "clienti", "rete", "altro"].includes(h)) return { tipo: "nativa", pag: h };
    if (S.admin && h === "altro") return { tipo: "nativa", pag: "altro" };
    if (S.nativa) return { tipo: "nativa", pag: "home" };
    return { tipo: "dash", page: "" };
  }
  // La rete verificata tiene la barra della foto approvata: Home, Clienti, +, Rete, Altro.
  // Gli altri profili tengono le 4 voci della dashboard, con il + al centro.
  const TABS_RETE = [["home", "Home", "home"], ["clienti", "Clienti", "clienti"], ["rete", "Rete", "rete"], ["altro", "Altro", "altro"]];
  function attiva(r) {
    if (S.nativa && r.tipo === "nativa") {
      if (r.pag === "clienti" || r.pag === "pratica") return "clienti";
      if (r.pag === "rete" || r.pag === "altro") return r.pag;
      return "home";
    }
    if (r.tipo === "dash") return r.page || (D.tabs[0] && D.tabs[0].id) || "";
    if (r.pag === "home") return "home";
    if (r.pag === "clienti" || (r.pag === "pratica" && S.nativa)) return "re-clienti";
    return "";
  }
  function disegnaTab(r) {
    const nav = document.getElementById("tabbar");
    if (!nav) return;
    const tabs = S.nativa
      ? TABS_RETE.map((x) => ({ id: x[0], label: x[1], svg: ICO[x[2]] }))
      : (D.tabs.length ? D.tabs : (PRIMA[S.fam] || []).map((x) => ({ id: x[0], label: x[1], svg: ICO[x[2]] })));
    const k = attiva(r);
    const b = (t) => '<button class="tab' + (t.id === k ? " on" : "") + '" data-t="' + esc(t.id) + '">' + t.svg + "<span>" + esc(t.label) + "</span></button>";
    nav.innerHTML = tabs.slice(0, 2).map(b).join("") + '<button class="plus" data-piu aria-label="Nuovo">' + ICO.piu + "</button>" + tabs.slice(2, 4).map(b).join("");
    nav.querySelectorAll("[data-t]").forEach((x) => x.addEventListener("click", () => vai(x.dataset.t)));
    nav.querySelector("[data-piu]").addEventListener("click", foglioPiu);
  }
  function vai(id) {
    if (S.nativa && ["home", "clienti", "rete", "altro"].includes(id)) {
      if (location.hash === "#" + id) mostra(); else location.hash = id;
      return;
    }
    const h = S.nativa && NAT[id] ? NAT[id] : "d/" + id;
    if (location.hash === "#" + h) mostra(); else location.hash = h;
  }

  function mostra() {
    const r = rotta();
    const dash = r.tipo === "dash";
    const prova = r.pag === "prova";
    aperta = r.pag === "pratica" ? r.id : null;
    if (!dash && r.pag !== "pratica" && !prova) scheda = r.pag;
    const nonLette = S.notifiche.filter((n) => !n.letto).length;
    const titolo = dash ? "" : aperta ? "Sopralluogo" : prova ? "Vedi cosa so fare" : { home: "", clienti: "Clienti e pratiche", rete: "La mia rete", altro: "Formazione e documenti" }[scheda] || "";
    app.innerHTML =
      '<header class="top">' + ((aperta || prova) ? '<button class="ib" data-indietro aria-label="Indietro">' + ICO.indietro + "</button>" : '<img class="logo" src="../assets/logo/anchecasa-orizzontale-trasparente.png?v=3" alt="AncheCasa">') +
      '<div class="tit">' + esc(titolo) + "</div>" +
      '<button class="ib" data-notifiche aria-label="Notifiche">' + ICO.campana + (nonLette ? '<span class="badge">' + nonLette + "</span>" : "") + "</button>" +
      (S.nativa ? "" : '<button class="ib" data-menu aria-label="Altro: tutte le sezioni, profilo, esci">' + ICO.altro + "</button>") + "</header>" +
      (dash ? "" : '<main class="scr" id="scr"></main>') +
      '<nav class="tabbar" id="tabbar" aria-label="Sezioni"></nav>';
    disegnaTab(r);
    document.body.classList.toggle("con-dash", dash);
    if (D.el) D.el.hidden = !dash;
    if (dash) apriDash(r.page);
    else {
      const scr = document.getElementById("scr");
      if (DEMO) scr.insertAdjacentHTML("afterbegin", '<div class="demo">Anteprima con dati di esempio: niente va sul database.</div>');
      if (aperta) paginaPratica(scr, aperta);
      else if (prova) paginaProva(scr);
      else ({ home: paginaHome, clienti: paginaClienti, rete: paginaRete, altro: paginaAltro }[scheda] || paginaHome)(scr);
      window.scrollTo(0, 0);
    }
    if (puoProva() && !prova) {
      app.insertAdjacentHTML("beforeend", '<button type="button" class="vedi-fisso" data-prova>' + ICO.flash + "<span>Vedi cosa so fare</span></button>");
      app.querySelector("[data-prova]").addEventListener("click", () => { location.hash = "prova"; });
    }
    document.body.classList.toggle("ha-vedi", puoProva() && !prova);
    app.querySelector("[data-notifiche]").addEventListener("click", foglioNotifiche);
    const menu = app.querySelector("[data-menu]");
    if (menu) menu.addEventListener("click", foglioMenu);
    const ind = app.querySelector("[data-indietro]");
    if (ind) ind.addEventListener("click", () => { location.hash = prova ? (S.nativa ? "home" : "d/home") : (S.nativa ? "clienti" : "d/ristrutturazioni-admin"); });
  }
  window.addEventListener("hashchange", () => { if (S.pronta) mostra(); });
  const ricarica = async () => { if (reale()) await carica(); mostra(); };

  /* ---------- etichette ---------- */
  const STATO = { nuova: ["Nuova", "p-gr"], sopralluogo: ["Sopralluogo", "p-or"], preventivo: ["Preventivo", "p-nv"], firmata: ["Firmata", "p-ok"], in_cantiere: ["In cantiere", "p-ok"], chiusa: ["Chiusa", "p-gr"], persa: ["Persa", "p-gr"] };
  const pillStato = (s) => { const x = STATO[s] || [s, "p-gr"]; return '<span class="pill ' + x[1] + '">' + esc(x[0]) + "</span>"; };
  const RUOLI = { reteitalia: "Rete Italia", sviluppo: "Sviluppo", capoarea: "Capo area", agente: "Agente", subagente: "Subagente" };
  const INVITO = { inviato: ["Mail inviata", "p-gr"], aperto: ["Ha aperto", "p-or"], iscritto: ["Iscritto", "p-ok"] };

  function sotto(uid) { const out = []; const giro = (u) => S.rete.filter((x) => x.superiore === u && x.utente !== u).forEach((x) => { out.push(x); giro(x.utente); }); giro(uid); return out; }

  /* ================= VEDI COSA SO FARE ================= */
  const provaMedia = [];
  let relazionePronta = null;
  function caricaRelazione() {
    if (window.ACRelazione) return Promise.resolve();
    if (relazionePronta) return relazionePronta;
    relazionePronta = new Promise((ok) => {
      if (!document.getElementById("rz-css")) {
        const l = document.createElement("link");
        l.id = "rz-css"; l.rel = "stylesheet"; l.href = "../css/relazione.css?v=1";
        document.head.appendChild(l);
      }
      const s = document.createElement("script");
      s.src = "../js/relazione.js?v=2";
      s.onload = () => ok();
      s.onerror = () => ok();
      document.head.appendChild(s);
    });
    return relazionePronta;
  }
  const FOTO_PROVA = ["Facciata", "Interno", "Dettaglio"];
  let provaLuogo = { lat: null, lng: null, provincia: "", regione: "" };
  const ZONE_TN = [
    ["campania", { zs: "2", zc: "C", pr: "Campania 2026", omin: 950, omax: 1400 }],
    ["lazio", { zs: "2", zc: "D", pr: "Lazio 2026", omin: 1600, omax: 2800 }],
    ["lombardia", { zs: "3", zc: "E", pr: "Lombardia 2026", omin: 1500, omax: 2600 }],
    ["veneto", { zs: "3", zc: "E", pr: "Veneto 2026", omin: 1400, omax: 2400 }],
    ["emilia", { zs: "3", zc: "E", pr: "Emilia-Romagna 2026", omin: 1300, omax: 2200 }],
    ["toscana", { zs: "3", zc: "D", pr: "Toscana 2026", omin: 1500, omax: 2500 }],
    ["piemonte", { zs: "3", zc: "E", pr: "Piemonte 2026", omin: 1200, omax: 2100 }],
    ["sicilia", { zs: "2", zc: "B", pr: "Sicilia 2026", omin: 800, omax: 1400 }],
    ["puglia", { zs: "2", zc: "C", pr: "Puglia 2026", omin: 900, omax: 1500 }],
    ["calabria", { zs: "1", zc: "C", pr: "Calabria 2026", omin: 700, omax: 1200 }]
  ];
  function zonaDi(regione) {
    const r = String(regione || "").toLowerCase();
    const t = ZONE_TN.find((x) => r.indexOf(x[0]) >= 0);
    return t ? t[1] : { zs: "da verificare", zc: "da verificare", pr: "Prezzario regionale", omin: null, omax: null };
  }
  async function leggiTerranova(comune) {
    const base = zonaDi(provaLuogo.regione);
    const vuoto = { comune: comune, provincia: provaLuogo.provincia, zona_sismica: base.zs, zona_climatica: base.zc, prezzario: base.pr, omi_min: base.omin, omi_max: base.omax, vincoli: "Nessuno noto", fonte: "esempio" };
    if (!window.acDb || !comune) return vuoto;
    try {
      const res = await db().from("comuni_dati").select("comune, provincia, zona_sismica, zona_climatica, prezzario, omi_min, omi_max, vincoli, fonte").ilike("comune", comune).limit(1);
      const r = res && res.data && res.data[0];
      if (!r) return vuoto;
      return { comune: r.comune, provincia: r.provincia || "", zona_sismica: r.zona_sismica || base.zs, zona_climatica: r.zona_climatica || base.zc, prezzario: r.prezzario || base.pr, omi_min: r.omi_min, omi_max: r.omi_max, vincoli: r.vincoli || "Nessuno noto", fonte: r.fonte || "terranova" };
    } catch (e) { return vuoto; }
  }
  const SCELTE = [
    ["tipo", "Tipologia di lavoro", [["bagno", "Bagno"], ["cucina", "Cucina"], ["soggiorno", "Soggiorno"], ["facciata", "Facciata"], ["giardino", "Giardino"], ["casa", "Tutta la casa"]]],
    ["stile", "Stile", [["contemporaneo", "Contemporaneo"], ["essenziale", "Essenziale"], ["pregio", "Di pregio"], ["mediterraneo", "Mediterraneo"], ["minimale", "Minimale"]]],
    ["rif", "Rifiniture", [["calce", "Intonaco a calce"], ["resina", "Resina"], ["pittura", "Pittura lavabile"], ["legno", "Legno a vista"], ["micro", "Microcemento"]]],
    ["piastrelle", "Piastrelle", [["legno", "Gres effetto legno"], ["marmo", "Gres effetto marmo"], ["cementine", "Cementine"], ["grande", "Grande formato chiaro"], ["pietra", "Pietra naturale"]]],
    ["porte", "Porte", [["laccata", "Laccata bianca"], ["rovere", "Rovere"], ["scorrevole", "Scorrevole a scomparsa"], ["vetro", "Vetro satinato"]]],
    ["box", "Box doccia", [["walkin", "Walk-in in vetro"], ["nicchia", "Nicchia con piatto"], ["filo", "Filo pavimento"], ["vasca", "Vasca con cristallo"]]],
    ["rubinetti", "Rubinetteria", [["cromo", "Cromo"], ["nero", "Nero opaco"], ["oro", "Oro spazzolato"]]],
    ["sanitari", "Sanitari", [["sospesi", "Sospesi"], ["terra", "A terra"], ["mobile", "Mobile con lavabo"]]]
  ];
  const scelta = { tipo: "bagno", stile: "contemporaneo", rif: "micro", piastrelle: "legno", porte: "laccata", box: "walkin", rubinetti: "cromo", sanitari: "sospesi" };
  const STILE_FILE = { contemporaneo: "medio.jpg", essenziale: "base.jpg", pregio: "alto.jpg", mediterraneo: "giardino-dopo.jpg", minimale: "facciata-dopo.jpg" };
  const TINTA = { contemporaneo: "rgba(22,48,77,.42)", essenziale: "rgba(70,70,70,.34)", pregio: "rgba(92,58,24,.4)", mediterraneo: "rgba(168,78,18,.4)", minimale: "rgba(16,20,28,.46)" };
  function nomeScelta(g, id) {
    const gruppo = SCELTE.find((x) => x[0] === g);
    const voce = gruppo && gruppo[2].find((x) => x[0] === id);
    return voce ? voce[1] : id;
  }
  function caricaImg(src) {
    return new Promise((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = no;
      i.src = src;
    });
  }
  function disegnaCover(ctx, img, x, y, w, h) {
    const ir = img.width / img.height, r = w / h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; }
    else { sw = img.width; sh = sw / r; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  async function canvasRender() {
    const W = 960, H = 640;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    const tipo = scelta.tipo;
    const indice = { bagno: 1, cucina: 1, soggiorno: 1, facciata: 0, giardino: 0, casa: 1 }[tipo] || 1;
    const principale = await caricaImg(provaMedia[indice].url);
    ctx.fillStyle = "#16304d";
    ctx.fillRect(0, 0, W, H);
    if (tipo === "casa") {
      for (let i = 0; i < 3; i++) {
        const im = await caricaImg(provaMedia[i].url);
        disegnaCover(ctx, im, i * (W / 3), 0, W / 3, H * 0.62);
      }
    } else disegnaCover(ctx, principale, 0, 0, W, H);
    const grad = ctx.createLinearGradient(0, H * 0.42, 0, H);
    grad.addColorStop(0, "rgba(16,28,44,0)");
    grad.addColorStop(1, TINTA[scelta.stile] || "rgba(16,28,44,.5)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    let finitura = null;
    try { finitura = await caricaImg("../img/sopralluogo-demo/" + (STILE_FILE[scelta.stile] || "medio.jpg")); } catch (e) { finitura = null; }
    if (finitura && tipo !== "casa") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(W - 318, 24, 294, 214);
      disegnaCover(ctx, finitura, W - 310, 32, 278, 168);
      ctx.fillStyle = "#16304d";
      ctx.font = "700 16px Manrope, sans-serif";
      ctx.fillText("Proposta di finitura", W - 310, 222);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "800 32px Manrope, sans-serif";
    ctx.fillText(nomeScelta("tipo", tipo) + " · " + nomeScelta("stile", scelta.stile), 28, H - 188);
    ctx.font = "600 18px Manrope, sans-serif";
    const righe = [
      "Rifiniture · " + nomeScelta("rif", scelta.rif),
      "Piastrelle · " + nomeScelta("piastrelle", scelta.piastrelle),
      "Porte · " + nomeScelta("porte", scelta.porte),
      "Box doccia · " + nomeScelta("box", scelta.box),
      nomeScelta("rubinetti", scelta.rubinetti) + " · " + nomeScelta("sanitari", scelta.sanitari)
    ];
    righe.forEach((t, i) => ctx.fillText(t, 28, H - 150 + i * 26));
    return c.toDataURL("image/jpeg", 0.86);
  }
  function carta(titolo, eti, corpo) {
    return '<article class="ac-doc"><header class="ac-testa"><img src="../dashboard/img/contratto-logo.png" alt="AncheCasa"><div><b>AncheCasa</b><small>Palumbo Investment S.r.l.<br>Via Giusti 22, Teano (CE)</small></div></header>' +
      '<div class="ac-corpo"><div class="eti">' + esc(eti) + "</div><h2 class=\"h1\" style=\"font-size:22px\">" + esc(titolo) + "</h2>" + corpo + "</div>" +
      '<footer class="ac-piedi"><img src="../dashboard/img/contratto-curva.png" alt=""><div>AncheCasa · Costruiamo fiducia · anchecasa.it<br>P.IVA 04724830619</div></footer></article>';
  }
  function paginaProva(scr) {
    scr.insertAdjacentHTML("beforeend",
      '<section class="card"><div class="eti">Sopralluogo Flash</div><h1 class="h1">Vedi cosa so fare</h1>' +
      '<p class="mut">Non serve essere un ingegnere. Scatti tre foto, indichi dove sei, e AncheCasa prepara due fogli con il marchio: il sopralluogo e il preventivo, con i dati Terranova del comune.</p></section>' +
      '<section class="card"><h2 class="h2">Tre foto</h2><p class="mut" style="margin:6px 0 10px">Facciata, un interno, e un primo piano di quello che non va.</p>' +
      '<div class="tre-slot">' + FOTO_PROVA.map((n, i) => '<label><input type="file" accept="image/*" capture="environment" hidden data-slot="' + i + '"><span>' + esc(n) + "</span></label>").join("") + "</div></section>" +
      '<section class="card"><h2 class="h2">Dove siamo</h2>' +
      '<div class="fl" style="margin-top:10px"><label>Città</label><input class="in" data-citta maxlength="80" autocomplete="address-level2"></div>' +
      '<div class="fl" style="margin-top:10px"><label>Indirizzo</label><input class="in" data-via maxlength="160" autocomplete="street-address"></div>' +
      '<button type="button" class="btn n" data-geo style="margin-top:10px">Posizione attuale</button>' +
      '<p class="mut" data-geo-st style="margin:8px 0 0">Oppure scrivi città e indirizzo a mano.</p>' +
      '<button type="button" class="btn" data-report style="margin-top:12px" disabled>Analizza le tre foto</button></section>' +
      '<div class="prova-out" data-out></div>');
    const report = scr.querySelector("[data-report]");
    const citta = scr.querySelector("[data-citta]");
    const via = scr.querySelector("[data-via]");
    const out = scr.querySelector("[data-out]");
    const slotOk = () => FOTO_PROVA.every((_, i) => provaMedia[i] && provaMedia[i].url);
    const luogoOk = () => citta.value.trim().length > 1 && via.value.trim().length > 2;
    const aggiorna = () => { report.disabled = !(slotOk() && luogoOk()); };
    const disegnaSlot = (i) => {
      const lab = scr.querySelector('[data-slot="' + i + '"]').parentElement;
      const vecchia = lab.querySelector("img");
      if (vecchia) vecchia.remove();
      if (provaMedia[i] && provaMedia[i].url) {
        const img = document.createElement("img");
        img.src = provaMedia[i].url;
        img.alt = FOTO_PROVA[i];
        lab.insertBefore(img, lab.firstChild);
      }
    };
    scr.querySelectorAll("[data-slot]").forEach((input) => input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const i = Number(e.target.dataset.slot);
      e.target.value = "";
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) return toast("Massimo 50 MB.", true);
      if (provaMedia[i] && provaMedia[i].url) URL.revokeObjectURL(provaMedia[i].url);
      provaMedia[i] = { url: URL.createObjectURL(file), nota: FOTO_PROVA[i] };
      disegnaSlot(i);
      aggiorna();
    }));
    FOTO_PROVA.forEach((_, i) => disegnaSlot(i));
    citta.addEventListener("input", aggiorna);
    via.addEventListener("input", aggiorna);
    scr.querySelector("[data-geo]").addEventListener("click", () => {
      const b = scr.querySelector("[data-geo]");
      const st = scr.querySelector("[data-geo-st]");
      if (!navigator.geolocation) { st.textContent = "Questo telefono non dà la posizione. Scrivi città e indirizzo."; return; }
      b.disabled = true; b.textContent = "Cerco la posizione…";
      navigator.geolocation.getCurrentPosition(async (pos) => {
        provaLuogo.lat = pos.coords.latitude; provaLuogo.lng = pos.coords.longitude;
        try {
          const r = await fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=it&lat=" + pos.coords.latitude + "&lon=" + pos.coords.longitude);
          const j = await r.json();
          const a = j.address || {};
          const nome = a.city || a.town || a.village || a.municipality || a.hamlet || "";
          const strada = [a.road, a.house_number].filter(Boolean).join(" ");
          if (nome) citta.value = nome;
          if (strada) via.value = strada;
          const iso = a["ISO3166-2-lvl6"] || a["ISO3166-2-lvl4"] || "";
          provaLuogo.provincia = String(iso).replace(/^IT-/, "").slice(0, 2);
          provaLuogo.regione = a.state || "";
          st.textContent = nome ? ("Posizione letta: " + [strada, nome].filter(Boolean).join(", ")) : "Posizione letta. Completa città e indirizzo.";
        } catch (e) { st.textContent = "Posizione letta, indirizzo non trovato. Scrivi città e via."; }
        b.disabled = false; b.textContent = "Posizione attuale";
        aggiorna();
      }, () => {
        b.disabled = false; b.textContent = "Posizione attuale";
        st.textContent = "Permesso posizione negato. Scrivi città e indirizzo.";
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    });
    report.addEventListener("click", async () => {
      if (!(slotOk() && luogoOk())) return;
      report.disabled = true; report.textContent = "Analizzo le tre foto…";
      await caricaRelazione();
      const comune = citta.value.trim();
      const indirizzo = via.value.trim();
      if (!provaLuogo.regione) {
        try {
          const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&accept-language=it&countrycodes=it&limit=1&q=" + encodeURIComponent(comune + ", Italia"));
          const j = await r.json();
          const a = (j[0] && j[0].address) || {};
          provaLuogo.regione = a.state || "";
          if (!provaLuogo.provincia) provaLuogo.provincia = String(a["ISO3166-2-lvl6"] || "").replace(/^IT-/, "").slice(0, 2);
        } catch (e) { /* la zona resta da verificare */ }
      }
      const tn = await leggiTerranova(comune);
      const chi = (S.profilo && S.profilo.nome) || (S.admin ? "Admin AncheCasa" : "Consulente AncheCasa");
      const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
      const dove = [indirizzo, comune, tn.provincia].filter(Boolean).join(", ");
      const voci = [
        ["Demolizione e smaltimento bagno", 1, "a corpo", 780],
        ["Nuovo bagno con doccia filo pavimento", 1, "a corpo", 4200],
        ["Linea gas cucina, con certificazione", 1, "a corpo", 450],
        ["Intonaco deumidificante", 14, "mq", 38],
        ["Pavimento in gres effetto legno", 24, "mq", 62],
        ["Infissi in PVC basso-emissivi", 3, "cad", 540],
        ["Verifica delle crepe del balcone", 1, "a corpo", 320]
      ];
      const tot = voci.reduce((t, v) => t + v[1] * v[3], 0);
      const dett = (v) => (v[1] === 1 && v[2] === "a corpo" ? "a corpo" : dec(v[1], 0) + " " + v[2] + " × " + eur(v[3]));
      const fotoH = '<div class="tre-slot" style="margin:12px 0">' + provaMedia.map((m) => '<figure><img src="' + esc(m.url) + '" alt="' + esc(m.nota) + '"><span>' + esc(m.nota) + "</span></figure>").join("") + "</div>";
      const omi = (tn.omi_min || tn.omi_max) ? (dec(tn.omi_min || 0, 0) + "–" + dec(tn.omi_max || 0, 0) + " €/mq") : "da verificare";
      const kv = [["Zona sismica", tn.zona_sismica], ["Zona climatica", tn.zona_climatica], ["Prezzario", tn.prezzario], ["Valore OMI", omi], ["Vincoli", tn.vincoli], ["Provincia", tn.provincia || "—"]];
      const fonte = tn.fonte === "esempio"
        ? "Terranova non ha ancora questo comune nel registro. I dati della zona sono di esempio e il tecnico li conferma."
        : "Fonte Terranova" + (tn.fonte && tn.fonte !== "terranova" ? " · " + tn.fonte : "") + ".";
      let h = carta("Sopralluogo", "Report di sopralluogo · AncheCasa",
        "<p class=\"mut\">" + esc(dove) + " · " + esc(oggi) + " · consulente " + esc(chi) + "</p>" + fotoH +
        "<p class=\"mut\">Le tre foto sono il materiale di questo giro. Sotto, la relazione della casa e i confronti prima e dopo. La simulazione è indicativa.</p>");
      h += '<div data-rz-box></div>';
      h += carta("Preventivo", "Preventivo · dati Terranova · IVA esclusa",
        "<p class=\"mut\">" + esc(dove) + " · " + esc(oggi) + "</p>" +
        '<div class="ac-kv">' + kv.map((x) => "<div><small>" + esc(x[0]) + "</small><b>" + esc(x[1]) + "</b></div>").join("") + "</div>" +
        '<p class="mut">' + esc(fonte) + " I prezzi seguono il prezzario " + esc(tn.prezzario) + ".</p>" +
        '<table class="prev-tab">' + voci.map((v) => "<tr><td><b>" + esc(v[0]) + '</b><div class="mut">' + esc(dett(v)) + "</div></td><td>" + eur(v[1] * v[3]) + "</td></tr>").join("") + "</table>" +
        '<div class="prev-tot"><span>Totale, IVA esclusa</span><b>' + eur(tot) + "</b></div>" +
        '<p class="mut" style="margin-top:8px">Simulazione per far vedere il foglio al cliente. Non è un\'offerta e non impegna AncheCasa. Il tecnico conferma prezzi e dati Terranova prima dell\'invio.</p>');
      h += '<section class="card" data-scelte><div class="eti">Dopo le foto</div><h2 class="h2">Scegli e crea il render</h2>' +
        '<p class="mut" style="margin:6px 0 10px">Tipologia di lavoro, stile, rifiniture, piastrelle, porte, box doccia e il resto. Poi il render dettagliato sulla tua foto.</p>' +
        SCELTE.map((g) => '<div class="scelta"><div class="mut" style="font-weight:800;color:#1a334f;margin-bottom:6px">' + esc(g[1]) + '</div><div class="chip-row">' +
          g[2].map((v) => '<button type="button" class="chip' + (scelta[g[0]] === v[0] ? " on" : "") + '" data-g="' + g[0] + '" data-v="' + v[0] + '">' + esc(v[1]) + "</button>").join("") +
          "</div></div>").join("") +
        '<button type="button" class="btn" data-render style="margin-top:14px">Crea il render dettagliato</button><div data-render-out></div></section>';
      out.innerHTML = h;
      out.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
        scelta[b.dataset.g] = b.dataset.v;
        out.querySelectorAll('.chip[data-g="' + b.dataset.g + '"]').forEach((x) => x.classList.toggle("on", x === b));
      }));
      out.querySelector("[data-render]").addEventListener("click", async () => {
        const b = out.querySelector("[data-render]");
        const box = out.querySelector("[data-render-out]");
        b.disabled = true; b.textContent = "Creo il render…";
        try {
          const url = await canvasRender();
          const idx = { bagno: 1, cucina: 1, soggiorno: 1, facciata: 0, giardino: 0, casa: 1 }[scelta.tipo] || 1;
          const oggiFoto = provaMedia[idx].url;
          const voci = SCELTE.map((g) => [g[1], nomeScelta(g[0], scelta[g[0]])]);
          box.innerHTML = carta("Render dettagliato", "Proposta sulle tue foto · " + nomeScelta("stile", scelta.stile),
            '<p class="mut">' + esc(dove) + "</p>" +
            '<div class="rz-pd" data-render-pd><img src="' + esc(oggiFoto) + '" alt="Oggi"><img class="dopo" src="' + url + '" alt="Render"><div class="linea"></div><span class="et p">Oggi</span><span class="et d">Render</span><input type="range" min="0" max="100" value="62" aria-label="Confronta oggi e render"></div>' +
            '<img class="render-big" src="' + url + '" alt="Render dettagliato">' +
            '<div class="ac-kv">' + voci.map((x) => "<div><small>" + esc(x[0]) + "</small><b>" + esc(x[1]) + "</b></div>").join("") + "</div>" +
            '<p class="mut">Il render è costruito sulla tua foto, con lo stile e le finiture che hai scelto. La proposta di finitura è indicativa: colori e materiali si chiudono con il tecnico.</p>');
          const pd = box.querySelector("[data-render-pd]");
          const r = pd.querySelector("input"), dopo = pd.querySelector(".dopo"), linea = pd.querySelector(".linea");
          const muovi = () => { dopo.style.clipPath = "inset(0 0 0 " + r.value + "%)"; linea.style.left = r.value + "%"; };
          r.addEventListener("input", muovi); muovi();
          box.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (e) { toast("Il render non è uscito. Riprova.", true); }
        b.disabled = false; b.textContent = "Crea di nuovo il render";
      });
      if (window.ACRelazione) {
        const dati = window.ACRelazione.esempio("../img/sopralluogo-demo/");
        dati.ia.letti = { foto: 3, audio: 0, video: 0 };
        dati.testa = { nome: indirizzo, indirizzo: comune + (tn.provincia ? " (" + tn.provincia + ")" : ""), data: oggi, agente: chi, rif: "Simulazione" };
        const box = out.querySelector("[data-rz-box]");
        window.ACRelazione.monta(box, dati, { tecnico: false, logo: "../dashboard/img/contratto-logo.png" });
      }
      report.disabled = false; report.textContent = "Analizza di nuovo le foto";
      out.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    aggiorna();
  }

  /* ================= HOME ================= */
  function paginaHome(scr) {
    const nome = (S.profilo && S.profilo.nome || "").split(" ")[0];
    const ora = new Date().getHours();
    const aperti = S.sopr.filter((r) => ["nuova", "sopralluogo"].includes(r.stato));
    const daMandare = S.sopr.filter((r) => ["nuova", "sopralluogo"].includes(r.stato) && !r.inviato_cliente_il);
    const attesa = S.sopr.filter((r) => r.preventivo_entro && !r.preventivo_mandato_il);
    const squadra = sotto(S.uid).filter((x) => x.stato !== "sospeso");
    const anno = new Date().getFullYear();
    const provAnno = S.provv.filter((p) => new Date(p.creato).getFullYear() === anno).reduce((t, p) => t + (Number(p.importo) || 0), 0);
    const iscritti = S.inviti.filter((i) => i.stato === "iscritto").length;
    const conv = S.inviti.length ? Math.round(iscritti / S.inviti.length * 100) : 0;
    const contrattoMancante = !S.admin && S.mioRuolo && S.docs.some((d) => d.tipo === "contratto" && d.richiede_firma) && !S.docs.some((d) => S.firme.includes(d.id));
    let h = "";
    if (contrattoMancante) h += '<a class="striscia" href="#d/documenti" style="text-decoration:none">' + ICO.doc.replace("<svg", '<svg style="width:20px;height:20px;flex:none"') + "<span>Ricordati di firmare il tuo contratto. Tocca qui.</span></a>";
    h += '<section class="hero"><div class="eti">' + (ora < 13 ? "Buongiorno" : ora < 18 ? "Buon pomeriggio" : "Buonasera") + (S.mioRuolo ? " · " + esc(RUOLI[S.mioRuolo.ruolo] || "") + (S.mioRuolo.regione ? " " + esc(S.mioRuolo.regione) : "") : S.admin ? " · Admin" : "") + "</div>" +
      "<h1>" + (nome ? esc(nome) + ", " : "") + (aperti.length ? "hai " + aperti.length + (aperti.length === 1 ? " sopralluogo aperto" : " sopralluoghi aperti") : "nessun sopralluogo aperto") + "</h1>" +
      "<p>" + (attesa.length ? attesa.length + (attesa.length === 1 ? " cliente aspetta" : " clienti aspettano") + " il preventivo" : "Tocca + per un nuovo sopralluogo o un invito") + "</p>" +
      '<div class="barra"><i style="width:' + Math.min(100, conv) + '%"></i></div><p style="margin-top:6px;font-size:12px">' + conv + "% dei tuoi inviti è diventato cliente</p></section>";
    h += '<div class="qa-row">' + [["flash", "Sopralluogo Flash", ICO.flash], ["invita", "Invita un cliente", ICO.mail], ["nuova", "Nuova pratica", ICO.casa], ["proponi", "Porta in rete", ICO.rete]]
      .map((a) => '<button class="qa" data-qa="' + a[0] + '"><span class="c">' + a[2] + '</span><span class="t">' + a[1] + "</span></button>").join("") + "</div>";
    h += '<div class="kpi">' +
      '<div class="card"><b>' + aperti.length + "</b><small>Sopralluoghi aperti</small></div>" +
      '<div class="card or"><b>' + attesa.length + "</b><small>Preventivi in attesa</small></div>" +
      '<div class="card"><b>' + squadra.length + "</b><small>Persone in squadra</small></div>" +
      '<div class="card"><b>' + eur(provAnno) + "</b><small>questo mese</small></div></div>";
    // Da fare
    const dafare = [];
    daMandare.forEach((r) => dafare.push({ id: r.id, t: "Manda il sopralluogo a " + r.nome, s: [r.comune, fa(r.creato)].filter(Boolean).join(" · "), p: '<span class="pill p-or">Da mandare</span>' }));
    S.sopr.filter((r) => r.cliente_ok_il && !r.preventivo_mandato_il).forEach((r) => dafare.push({ id: r.id, t: r.nome + " ha detto «Mi piace»", s: "Preventivo entro " + quando(r.preventivo_entro), p: r.urgente ? '<span class="pill p-ko">Urgente</span>' : "" }));
    S.sopr.filter((r) => r.preventivo_mandato_il && !r.preventivo_accettato_il).forEach((r) => dafare.push({ id: r.id, t: "Senti " + r.nome + " per il preventivo", s: "Mandato il " + giorno(r.preventivo_mandato_il), p: '<span class="pill p-nv">Preventivo</span>' }));
    h += '<section class="card"><div class="sp"><h2 class="h2">Da fare</h2><span class="mut">' + dafare.length + "</span></div>" +
      (dafare.length ? dafare.slice(0, 8).map((x) => '<button class="li" data-apri="' + esc(x.id) + '"><span class="av or">' + ICO.flash.replace("<svg", '<svg style="width:20px;height:20px"') + '</span><span class="grow"><span class="lt">' + esc(x.t) + '</span><span class="ls">' + esc(x.s) + "</span></span>" + x.p + "</button>").join("")
        : '<div class="vuoto"><b>Tutto in ordine</b>Quando un cliente risponde o un preventivo è in ritardo, lo trovi qui.</div>') + "</section>";
    // Ultimi inviti
    h += '<section class="card"><div class="sp"><h2 class="h2">Ultimi inviti</h2><button class="link" data-vai="clienti" data-seg="inviti">Tutti</button></div>' +
      (S.inviti.length ? S.inviti.slice(0, 4).map(rigaInvito).join("") : '<div class="vuoto"><b>Nessun invito</b>Invita un cliente: la mail parte da AncheCasa.</div>') + "</section>";
    scr.insertAdjacentHTML("beforeend", h);
    scr.querySelectorAll("[data-qa]").forEach((b) => b.addEventListener("click", () => azione(b.dataset.qa)));
    collega(scr);
  }

  function collega(scr) {
    scr.querySelectorAll("[data-apri]").forEach((b) => b.addEventListener("click", () => { location.hash = "pratica/" + b.dataset.apri; }));
    scr.querySelectorAll("[data-vai]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.seg) segClienti = b.dataset.seg; location.hash = b.dataset.vai; if (location.hash === "#" + b.dataset.vai) mostra(); }));
  }

  const rigaInvito = (i) => { const x = INVITO[i.stato] || [i.stato, "p-gr"]; return '<div class="li"><span class="av">' + esc(iniziali(i.nome || i.mail)) + '</span><span class="grow"><span class="lt">' + esc(i.nome || i.mail || i.telefono || "Invito") + '</span><span class="ls">' + esc((i.famiglia === "azienda" ? "Azienda" : "Privato") + " · " + fa(i.created_at)) + '</span></span><span class="pill ' + x[1] + '">' + x[0] + "</span></div>"; };

  /* ================= CLIENTI ================= */
  function paginaClienti(scr) {
    let h = '<div class="seg">' + [["pratiche", "Pratiche"], ["inviti", "Inviti"], ["vendite", "Vendite"]].map((s) => '<button class="' + (segClienti === s[0] ? "on" : "") + '" data-seg="' + s[0] + '">' + s[1] + "</button>").join("") + "</div>";
    if (segClienti === "pratiche") {
      const mie = S.sopr;
      const altre = S.segnalate.filter((x) => !mie.some((m) => m.id === x.id));
      h += '<section class="card"><div class="sp"><h2 class="h2">I miei sopralluoghi</h2><span class="mut">' + mie.length + "</span></div>" +
        (mie.length ? mie.map((r) => '<button class="li" data-apri="' + esc(r.id) + '"><span class="av">' + esc(iniziali(r.nome)) + '</span><span class="grow"><span class="lt">' + esc(r.nome) + '</span><span class="ls">' + esc([r.comune, r.descrizione].filter(Boolean).join(" · ").slice(0, 70)) + "</span></span>" + (r.urgente && !r.preventivo_mandato_il ? '<span class="pill p-ko">48 h</span>' : pillStato(r.stato)) + "</button>").join("")
          : '<div class="vuoto"><b>Nessun sopralluogo</b>Tocca + e «Sopralluogo Flash» quando sei a casa del cliente.</div>') + "</section>";
      if (altre.length) h += '<section class="card"><div class="sp"><h2 class="h2">Pratiche che hai segnalato</h2><span class="mut">' + altre.length + '</span></div><p class="mut" style="margin:4px 0 0">AncheCasa sceglie chi fa il sopralluogo.</p>' +
        altre.map((r) => '<div class="li"><span class="av">' + esc(iniziali(r.nome)) + '</span><span class="grow"><span class="lt">' + esc(r.nome) + '</span><span class="ls">' + esc([r.comune, fa(r.creato)].filter(Boolean).join(" · ")) + "</span></span>" + pillStato(r.stato) + "</div>").join("") + "</section>";
    } else if (segClienti === "inviti") {
      h += '<button class="btn" data-qa="invita">' + ICO.mail + "Invita un cliente</button>";
      const per = { inviato: 0, aperto: 0, iscritto: 0 }; S.inviti.forEach((i) => { per[i.stato] = (per[i.stato] || 0) + 1; });
      h += '<div class="kpi" style="grid-template-columns:repeat(3,1fr)"><div class="card"><b>' + per.inviato + '</b><small>Mail inviate</small></div><div class="card or"><b>' + per.aperto + '</b><small>Hanno aperto</small></div><div class="card"><b>' + per.iscritto + "</b><small>Iscritti</small></div></div>";
      h += '<section class="card">' + (S.inviti.length ? S.inviti.map(rigaInvito).join("") : '<div class="vuoto"><b>Nessun invito</b>Chi si iscrive dal tuo invito resta tuo cliente.</div>') + "</section>";
    } else {
      h += '<section class="card"><h2 class="h2">Contratti dei tuoi clienti</h2>' +
        (S.vendite.length ? S.vendite.map((v) => '<div class="li"><span class="av">' + esc(iniziali(v.cliente_nome)) + '</span><span class="grow"><span class="lt">' + esc(v.cliente_nome || "Cliente") + '</span><span class="ls">' + esc([v.cosa, v.importo ? eur(v.importo) + (v.tipo_importo === "canone" ? " al mese" : "") : "", giorno(v.creato)].filter(Boolean).join(" · ")) + '</span></span><span class="pill p-nv">' + esc(v.stato || "") + "</span></div>").join("")
          : '<div class="vuoto"><b>Nessun contratto</b>Le vendite di luce, gas, telefono e servizi le registri dall\'area privata.</div>') +
        '<a class="btn2 pieno" href="#d/re-registra" style="text-decoration:none;margin-top:10px">' + ICO.dashboard + "Registra un cliente</a></section>";
    }
    scr.insertAdjacentHTML("beforeend", h);
    scr.querySelectorAll("[data-seg]").forEach((b) => b.addEventListener("click", () => { segClienti = b.dataset.seg; mostra(); }));
    scr.querySelectorAll("[data-qa]").forEach((b) => b.addEventListener("click", () => azione(b.dataset.qa)));
    collega(scr);
  }

  /* ================= SOPRALLUOGO (pratica) ================= */
  async function paginaPratica(scr, id) {
    const r = S.sopr.find((x) => x.id === id);
    if (!r) { scr.insertAdjacentHTML("beforeend", '<div class="card vuoto"><b>Sopralluogo non trovato</b>Forse non è assegnato a te.</div>'); return; }
    const media = r.media || [];
    if (reale() && media.length && !media[0].url) {
      const u = await sicuro(db().storage.from("sopralluoghi").createSignedUrls(media.map((m) => m.path), 3600), []);
      const per = {}; (u || []).forEach((x) => { if (x && x.signedUrl) per[x.path] = x.signedUrl; });
      media.forEach((m) => { m.url = per[m.path] || ""; });
    }
    const foto = media.filter((m) => m.tipo === "foto" && m.fonte !== "ia");
    const pianta = foto.some((m) => /planimetri/i.test(m.nota || ""));
    const amb = Array.isArray(r.ambienti) ? r.ambienti : [];
    const imm = r.immobile || {};
    const ia = r.ia;
    const fatto1 = amb.some((a) => a.larg && a.lung), fatto2 = media.length > 0, fatto3 = ia && ia.stato === "fatto", fatto4 = !!r.inviato_cliente_il;

    let h = '<section class="card"><div class="row"><span class="av or">' + esc(iniziali(r.nome)) + '</span><div class="grow"><div class="lt">' + esc(r.nome) + '</div><div class="ls">' + esc([r.indirizzo, r.comune, r.provincia ? "(" + r.provincia + ")" : ""].filter(Boolean).join(" ")) + "</div></div>" + pillStato(r.stato) + "</div>" +
      (r.descrizione ? '<p class="mut" style="margin:10px 0 0">' + esc(r.descrizione) + (r.budget ? " · budget " + esc(r.budget) : "") + "</p>" : "") +
      '<div class="row" style="margin-top:12px;gap:8px">' + (r.telefono ? '<a class="btn2" style="flex:1;text-decoration:none" href="tel:' + esc(String(r.telefono).replace(/\s/g, "")) + '">Chiama</a>' : "") +
      (r.indirizzo ? '<a class="btn2" style="flex:1;text-decoration:none" target="_blank" rel="noopener" href="https://maps.google.com/?q=' + encodeURIComponent((r.indirizzo || "") + " " + (r.comune || "")) + '">Mappa</a>' : "") + "</div>";
    const st = [];
    if (r.inviato_cliente_il) st.push("✓ Mandato al cliente il " + quando(r.inviato_cliente_il));
    if (r.aperto_cliente_il) st.push("👀 Il cliente l'ha aperto il " + quando(r.aperto_cliente_il));
    if (r.cliente_ok_il) st.push("👍 Il cliente ha detto «Mi piace»");
    if (r.preventivo_entro && !r.preventivo_mandato_il) st.push((r.urgente ? "⚡ Urgente: " : "") + "preventivo entro il " + quando(r.preventivo_entro));
    if (r.preventivo_mandato_il) st.push("📄 Preventivo mandato il " + quando(r.preventivo_mandato_il));
    if (r.preventivo_accettato_il) st.push("✅ Preventivo accettato");
    if (st.length) h += '<div class="stato" style="margin-top:10px">' + st.map(esc).join("<br>") + "</div>";
    h += "</section>";

    // 1. Misure e casa
    h += passo(1, "Misure e casa", fatto1 ? amb.length + (amb.length === 1 ? " stanza" : " stanze") + " misurate" : "Stanze, piano, accesso, cose da controllare", fatto1,
      '<div id="amb-lista">' + (amb.length ? amb : [{}]).map(rigaAmb).join("") + "</div>" +
      '<button class="btn2 pieno" data-amb-piu>+ Aggiungi una stanza</button>' +
      '<div class="g2"><div class="fl"><label>Piano</label><input class="in" name="piano" value="' + esc(imm.piano || "") + '"></div><div class="fl"><label>Ascensore</label><select class="in" name="ascensore">' + ["", "sì", "no"].map((x) => '<option value="' + x + '"' + ((imm.ascensore || "") === x ? " selected" : "") + ">" + (x || "—") + "</option>").join("") + "</select></div>" +
      '<div class="fl"><label>Condominio</label><select class="in" name="condominio">' + ["", "sì", "no"].map((x) => '<option value="' + x + '"' + ((imm.condominio || "") === x ? " selected" : "") + ">" + (x || "—") + "</option>").join("") + '</select></div><div class="fl"><label>Anno della casa</label><input class="in" name="anno" inputmode="numeric" value="' + esc(imm.anno || "") + '"></div></div>' +
      '<div class="fl"><label>Accesso al cantiere</label><input class="in" name="accesso" value="' + esc(imm.accesso || "") + '" placeholder="es. scale strette, macerie a mano"></div>' +
      '<div class="g2"><div class="fl"><label>Parcheggio</label><input class="in" name="parcheggio" value="' + esc(imm.parcheggio || "") + '"></div><div class="fl"><label>Tempi del cliente</label><input class="in" name="tempi" value="' + esc(imm.tempi || "") + '"></div></div>' +
      '<div class="fl"><label>Da controllare</label><textarea class="in" name="criticita" placeholder="umidità, crepe, impianti vecchi, amianto…">' + esc(r.criticita || "") + "</textarea></div>" +
      '<button class="btn n" data-salva-mis>Salva misure e casa</button>');

    // 2. Foto, planimetria, voce, video
    h += passo(2, "Foto, planimetria, voce e video", fatto2 ? foto.length + " foto · " + media.filter((m) => m.tipo === "audio").length + " note · " + media.filter((m) => m.tipo === "video").length + " video" + (pianta ? " · planimetria ✓" : "") : "Stanza per stanza, anche fuori", fatto2,
      (media.length ? '<div class="gal">' + media.filter((m) => m.fonte !== "ia").map((m) => '<div class="ph">' + (m.tipo === "foto" && m.url ? '<img src="' + esc(m.url) + '" alt="" loading="lazy">' : m.tipo === "video" ? "🎥 Video" : m.tipo === "audio" ? "🎙 Nota vocale" : "Foto") + (m.nota ? "<span>" + esc(m.nota) + "</span>" : "") + "</div>").join("") + "</div>" : "") +
      '<div class="carica">' +
      '<label>' + ICO.foto + 'Foto<input type="file" accept="image/*" capture="environment" multiple data-file="foto" hidden></label>' +
      '<label>' + ICO.pianta + (pianta ? "Planimetria ✓" : "Planimetria") + '<input type="file" accept="image/*" capture="environment" data-file="pianta" hidden></label>' +
      '<label>' + ICO.video + 'Video<input type="file" accept="video/*" capture="environment" data-file="video" hidden></label>' +
      '<label data-rec>' + ICO.mic + "<span>Nota vocale</span></label></div>" +
      '<p class="mut" style="margin:0">Il video non lo legge l\'IA. Si allega ai documenti che vanno al tecnico AncheCasa per il preventivo. Fino a 50 MB per file.</p>');

    // 3. IA
    const corpoIA = ia && ia.stato === "in_corso"
      ? '<div class="row"><span class="spin"></span><span class="mut">L\'IA sta leggendo solo le foto… 1-3 minuti. Il video non viene letto.</span></div>'
      : fatto3 ? '<p style="margin:0;font-size:14.5px;line-height:1.55">' + esc(ia.sintesi || "") + '</p><div class="mut">' + ((ia.ambienti || []).length) + " ambienti analizzati · letta il " + esc(quando(ia.creato)) + "</div>" +
          ((ia.dubbi || []).length ? ia.dubbi.map((d) => '<div class="avv">❓ <span>' + esc(d) + "</span></div>").join("") : "") +
          '<button class="btn2 pieno" data-ia>Rileggi tutto</button>'
        : (ia && ia.stato === "errore" ? '<div class="avv r">Lettura non riuscita: ' + esc(ia.errore || "") + "</div>" : "") +
          '<p class="mut" style="margin:0">L\'IA legge solo le foto e la planimetria, e prepara la relazione per il tecnico. Il video resta allegato ai documenti del preventivo.</p>' +
          '<button class="btn" data-ia' + (foto.length ? "" : " disabled") + ">" + ICO.ia + (foto.length ? "Leggi le foto con l'IA" : "Prima carica le foto") + "</button>";
    h += passo(3, "Relazione con l'IA", fatto3 ? "Pronta per il tecnico" : ia && ia.stato === "in_corso" ? "In lettura…" : "L'IA legge solo le foto", fatto3, corpoIA, "ia");

    // 4. Invia al cliente
    h += passo(4, "Manda al cliente per mail", fatto4 ? "Mandato il " + giorno(r.inviato_cliente_il) : "Solo per mail, mai WhatsApp", fatto4,
      '<div class="fl"><label>Mail del cliente</label><input class="in" name="mail" type="email" inputmode="email" value="' + esc(r.mail || "") + '" placeholder="nome@mail.it"></div>' +
      '<div class="fl"><label>Livello di finitura</label><div class="chips" data-pacc>' + [["", "Da decidere"], ["base", "Essenziale"], ["medio", "Comfort"], ["alto", "Prestige"]].map((p) => '<button type="button" class="chip' + ((r.pacchetto || "") === p[0] ? " on" : "") + '" data-p="' + p[0] + '">' + p[1] + "</button>").join("") + "</div></div>" +
      '<div class="fl"><label>Il progetto in breve (lo legge il cliente)</label><textarea class="in" name="riepilogo" maxlength="1500">' + esc(r.riepilogo || r.nota_agente || "") + "</textarea></div>" +
      '<label class="check"><input type="checkbox" name="urgente"' + (r.urgente ? " checked" : "") + '><span>Urgente: preventivo in 48 ore<br><small class="mut">altrimenti entro 5 giorni</small></span></label>' +
      '<button class="btn" data-invia>' + ICO.mail + (fatto4 ? "Manda di nuovo per mail" : "Invia al cliente per mail") + "</button>");

    // 5. Domande del tecnico
    h += passo(5, "Domande del tecnico", "Solo nell'app, resta tutto nella pratica", false, '<div class="chat" data-chat><div class="mut">Carico…</div></div><form class="row" data-scrivi style="gap:8px"><input class="in" name="t" placeholder="Scrivi al tecnico…" autocomplete="off"><button class="btn" style="width:auto">Manda</button></form>', "chat");
    scr.insertAdjacentHTML("beforeend", h);
    agganciaPratica(scr, r);
  }

  function passo(n, titolo, sub, fatto, corpo, chiave) {
    const aperto = sessionStorage.getItem("ac-passo") === String(chiave || n);
    return '<section class="passo' + (fatto ? " fatto" : "") + '" data-passo="' + (chiave || n) + '"><button type="button" data-apripasso><span class="num">' + (fatto ? "✓" : n) + '</span><span class="grow"><span class="lt">' + esc(titolo) + '</span><span class="ls">' + esc(sub) + "</span></span>" + ICO.chev.replace('<svg', '<svg class="chev"') + "</button>" +
      '<div class="corpo"' + (aperto ? "" : " hidden") + ">" + corpo + "</div></section>";
  }
  const rigaAmb = (a) => '<div class="amb" data-amb><div class="sp"><input class="in" name="nome" value="' + esc(a.nome || "") + '" placeholder="Stanza (es. Bagno)" style="min-height:42px"><button type="button" class="ib" data-via aria-label="Togli">' + ICO.chiudi + "</button></div>" +
    '<div class="g3" style="font-size:11.5px;font-weight:700;color:#566579;margin-bottom:-4px"><span>Larghezza m</span><span>Lunghezza m</span><span>Altezza m</span></div><div class="g3"><input class="in" name="larg" inputmode="decimal" placeholder="Largh. m" value="' + esc(a.larg ? String(a.larg).replace(".", ",") : "") + '"><input class="in" name="lung" inputmode="decimal" placeholder="Lungh. m" value="' + esc(a.lung ? String(a.lung).replace(".", ",") : "") + '"><input class="in" name="alt" inputmode="decimal" placeholder="Alt. m" value="' + esc(a.alt ? String(a.alt).replace(".", ",") : "") + '"></div>' +
    '<div class="g2"><input class="in" name="porta" placeholder="Porta 80×210" value="' + esc(a.porta || "") + '"><input class="in" name="finestra" placeholder="Finestra 70×110" value="' + esc(a.finestra || "") + '"></div><div class="calc" data-calc></div></div>';

  function agganciaPratica(scr, r) {
    // apri/chiudi passi
    scr.querySelectorAll("[data-apripasso]").forEach((b) => b.addEventListener("click", () => {
      const s = b.closest("[data-passo]"), c = s.querySelector(".corpo"), apri = c.hidden;
      scr.querySelectorAll(".passo .corpo").forEach((x) => { x.hidden = true; });
      c.hidden = !apri; try { sessionStorage.setItem("ac-passo", apri ? s.dataset.passo : ""); } catch (e) {}
    }));
    // misure
    const lista = scr.querySelector("#amb-lista");
    const calcola = () => lista.querySelectorAll("[data-amb]").forEach((d) => {
      const L = num(d.querySelector("[name=larg]").value), P = num(d.querySelector("[name=lung]").value), H = num(d.querySelector("[name=alt]").value);
      d.querySelector("[data-calc]").textContent = L && P ? "Pavimento " + dec(L * P) + " mq" + (H ? " · pareti circa " + dec(Math.max(0, 2 * (L + P) * H - 0.8 * Math.min(2.1, H))) + " mq" : "") : "";
    });
    calcola(); lista.addEventListener("input", calcola);
    lista.addEventListener("click", (e) => { const v = e.target.closest("[data-via]"); if (v && lista.children.length > 1) { v.closest("[data-amb]").remove(); calcola(); } });
    scr.querySelector("[data-amb-piu]").addEventListener("click", () => { lista.insertAdjacentHTML("beforeend", rigaAmb({})); });
    const corpo1 = lista.closest(".corpo");
    scr.querySelector("[data-salva-mis]").addEventListener("click", async (e) => {
      const ambienti = [...lista.querySelectorAll("[data-amb]")].map((d, i) => { const v = (n) => d.querySelector("[name=" + n + "]").value.trim();
        return { id: "a" + (i + 1), nome: v("nome"), larg: num(v("larg")) || null, lung: num(v("lung")) || null, alt: num(v("alt")) || null, porta: v("porta"), finestra: v("finestra") }; }).filter((a) => a.nome || a.larg);
      if (ambienti.some((a) => !a.nome)) return toast("Dai un nome a ogni stanza.", true);
      const immobile = {}; ["piano", "ascensore", "condominio", "anno", "accesso", "parcheggio", "tempi"].forEach((k) => { const el = corpo1.querySelector("[name=" + k + "]"); if (el && el.value.trim()) immobile[k] = el.value.trim(); });
      const criticita = corpo1.querySelector("[name=criticita]").value.trim();
      if (!reale()) { Object.assign(r, { ambienti, immobile, criticita }); toast("Anteprima: misure salvate."); return mostra(); }
      e.target.disabled = true;
      try { await Q(db().rpc("ristrutturazione_misure", { p_id: r.id, p_ambienti: ambienti, p_immobile: immobile, p_criticita: criticita })); toast("Misure salvate: il tecnico le vede nel dossier."); await ricarica(); }
      catch (x) { e.target.disabled = false; toast("Non salvate: " + errore(x), true); }
    });
    // file
    scr.querySelectorAll("[data-file]").forEach((inp) => inp.addEventListener("change", () => carica_file(r, [...inp.files], inp.dataset.file)));
    // nota vocale
    const rec = scr.querySelector("[data-rec]");
    let mr = null, pezzi = [], t0 = 0, timer = null;
    rec.addEventListener("click", async () => {
      if (mr) { mr.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast("Questo telefono non registra dal browser: usa il registratore e caricalo come video o audio.", true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tipo = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
        mr = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined); pezzi = []; t0 = Date.now();
        mr.ondataavailable = (e) => { if (e.data && e.data.size) pezzi.push(e.data); };
        mr.onstop = () => { stream.getTracks().forEach((x) => x.stop()); clearInterval(timer); const tp = (mr.mimeType || "audio/webm").split(";")[0]; const est = tp.includes("mp4") ? "m4a" : tp.includes("ogg") ? "ogg" : "webm";
          const f = new File([new Blob(pezzi, { type: tp })], "nota." + est, { type: tp }); mr = null; rec.querySelector("span").textContent = "Nota vocale"; carica_file(r, [f], "audio"); };
        mr.start(); rec.querySelector("span").innerHTML = '<span class="rec"><span class="dot"></span>Ferma · 0:00</span>';
        timer = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); const sp = rec.querySelector(".rec"); if (sp) sp.lastChild.textContent = "Ferma · " + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }, 500);
      } catch (e) { toast("Microfono non disponibile: permettilo nelle impostazioni del browser.", true); }
    });
    // IA
    scr.querySelectorAll("[data-ia]").forEach((b) => b.addEventListener("click", () => leggiIA(r, b)));
    if (r.ia && r.ia.stato === "in_corso" && reale()) attendiIA(r);
    // pacchetto
    let pacc = r.pacchetto || "";
    scr.querySelectorAll("[data-pacc] [data-p]").forEach((c) => c.addEventListener("click", () => { pacc = c.dataset.p; scr.querySelectorAll("[data-pacc] .chip").forEach((x) => x.classList.toggle("on", x === c)); }));
    // invio
    const bi = scr.querySelector("[data-invia]");
    bi.addEventListener("click", async () => {
      const c4 = bi.closest(".corpo");
      const mail = c4.querySelector("[name=mail]").value.trim().toLowerCase();
      if (!mailOk(mail)) return toast("Scrivi la mail del cliente: il sopralluogo parte solo per mail.", true);
      const corpo = { azione: "invia", id: r.id, mail: mail, urgente: c4.querySelector("[name=urgente]").checked, riepilogo: c4.querySelector("[name=riepilogo]").value.trim(), pacchetto: pacc };
      if (bi.dataset.conferma !== "1") { bi.dataset.conferma = "1"; bi.textContent = "Confermi? Parte la mail a " + mail; return; }
      bi.disabled = true; bi.textContent = "Invio…";
      if (!reale()) { Object.assign(r, { mail, urgente: corpo.urgente, riepilogo: corpo.riepilogo, pacchetto: pacc, inviato_cliente_il: new Date().toISOString(), preventivo_entro: new Date(Date.now() + (corpo.urgente ? 48 : 120) * 3600e3).toISOString(), stato: "preventivo" }); toast("Anteprima: la mail partirebbe a " + mail + "."); return mostra(); }
      try { const d = await funzione("sopralluogo-invito", corpo); toast("Mail mandata a " + d.mail + (d.urgente ? " · preventivo in 48 ore." : " · preventivo entro 5 giorni.")); await ricarica(); }
      catch (x) { bi.disabled = false; bi.dataset.conferma = ""; bi.textContent = "Invia al cliente per mail"; toast({ mail_non_valida: "Controlla la mail del cliente.", non_autorizzato: "Questa pratica non è tua.", pratica_chiusa: "La pratica è chiusa." }[errore(x)] || "La mail non è partita: " + errore(x), true); }
    });
    // chat
    const chat = scr.querySelector("[data-chat]");
    const disegnaChat = (l) => { chat.innerHTML = (l || []).length ? l.map((m) => '<div class="bub ' + (m.mio ? "io" : "lui") + '">' + esc(m.testo) + "<small>" + esc(m.mio ? "Tu" : m.autore) + " · " + esc(quando(m.creato)) + "</small></div>").join("") : '<div class="mut">Nessuna domanda. Se il tecnico ha bisogno di qualcosa, te lo scrive qui.</div>'; chat.scrollTop = chat.scrollHeight; };
    let msgs = DEMO ? [{ mio: false, autore: "Tecnico AncheCasa", testo: "Il contatore è nel bagno o fuori?", creato: new Date().toISOString() }] : [];
    if (reale()) sicuro(db().rpc("ristrutturazione_messaggi", { p_id: r.id }), []).then((l) => { msgs = l || []; disegnaChat(msgs); }); else disegnaChat(msgs);
    scr.querySelector("[data-scrivi]").addEventListener("submit", async (e) => {
      e.preventDefault(); const t = e.target.t.value.trim(); if (!t) return; e.target.t.value = "";
      if (!reale()) { msgs.push({ mio: true, testo: t, creato: new Date().toISOString() }); return disegnaChat(msgs); }
      try { await Q(db().rpc("ristrutturazione_messaggio", { p_id: r.id, p_testo: t })); msgs = await Q(db().rpc("ristrutturazione_messaggi", { p_id: r.id })); disegnaChat(msgs); }
      catch (x) { e.target.t.value = t; toast("Non mandato: " + errore(x), true); }
    });
  }

  async function carica_file(r, files, tipo) {
    files = files.slice(0, 10); if (!files.length) return;
    if (files.some((f) => f.size > MAX_FILE)) return toast("File troppo grande: massimo 50 MB. Per i video fai più riprese brevi.", true);
    if (!reale()) { (r.media = r.media || []).push(...files.map((f, i) => ({ id: "n" + Date.now() + i, tipo: tipo === "pianta" ? "foto" : tipo, nota: tipo === "pianta" ? "Planimetria" : tipo === "video" ? "Giro della casa" : "", url: tipo === "foto" || tipo === "pianta" ? URL.createObjectURL(f) : "" }))); toast("Anteprima: caricato."); return mostra(); }
    toast(files.length > 1 ? "Carico " + files.length + " file…" : tipo === "video" ? "Carico il video… non chiudere l'app." : "Carico…");
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const est = ((f.name || "").split(".").pop() || (tipo === "video" ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
        const path = r.id + "/" + Date.now() + "-" + i + (tipo === "pianta" ? "-planimetria" : tipo === "video" ? "-video" : "") + "." + est;
        await Q(db().storage.from("sopralluoghi").upload(path, f, { upsert: false, contentType: f.type || undefined }));
        await Q(db().rpc("ristrutturazione_media_aggiungi", { p_id: r.id, p_path: path, p_tipo: tipo === "pianta" ? "foto" : tipo, p_nota: tipo === "pianta" ? "Planimetria" : tipo === "video" ? "Giro della casa" : "" }));
      }
      toast(tipo === "audio" ? "Nota vocale salvata." : tipo === "video" ? "Video salvato." : tipo === "pianta" ? "Planimetria salvata." : "Foto salvate.");
      await ricarica();
    } catch (x) { toast(/mime|format/i.test(errore(x)) ? "Formato non accettato dall'archivio: avvisa l'admin." : /size|large/i.test(errore(x)) ? "File troppo grande per l'archivio." : "Non caricato: " + errore(x), true); }
  }

  async function leggiIA(r, b) {
    b.disabled = true; b.textContent = "Avvio la lettura…";
    if (!reale()) { r.ia = { stato: "in_corso" }; mostra(); setTimeout(() => { r.ia = { stato: "fatto", creato: new Date().toISOString(), sintesi: "Esempio: bagno anni '80 da rifare, umidità a soffitto da verificare. Doccia filo pavimento e sanitari sospesi.", ambienti: [{ nome: "Bagno", larg: 2.4, lung: 2.5, alt: 2.7, esterno: false }], dubbi: ["Altezza del rivestimento?"] }; if (!(r.ambienti || []).some((a) => a.larg)) r.ambienti = [{ nome: "Bagno", larg: 2.4, lung: 2.5, alt: 2.7 }]; toast("Anteprima: lettura fatta."); mostra(); }, 1500); return; }
    try {
      const d = await funzione("dossier-ia", { azione: "analizza", id: r.id });
      r.ia = (d && d.ia) || { stato: "in_corso" }; mostra();
      if (r.ia.stato !== "fatto") attendiIA(r); else finitaIA(r);
    } catch (x) {
      b.disabled = false; b.textContent = "Leggi tutto con l'IA";
      toast({ aspetta_due_minuti: "Hai appena letto: riprova tra due minuti.", niente_da_leggere: "L'IA legge solo le foto. Carica almeno una foto. Il video resta per il tecnico.", motore_non_configurato: "Manca la chiave dell'IA: avvisa l'admin." }[errore(x)] || "Lettura non riuscita: " + errore(x), true);
    }
  }
  function attendiIA(r) {
    clearInterval(attendiIA.t); let giri = 0;
    attendiIA.t = setInterval(async () => {
      if (++giri > 60 || !location.hash.includes(r.id)) return clearInterval(attendiIA.t);
      try { const d = await funzione("dossier-ia", { azione: "stato", id: r.id }); if (d && d.ia && d.ia.stato !== "in_corso") { clearInterval(attendiIA.t); r.ia = d.ia; if (d.ia.stato === "fatto") await finitaIA(r); else { toast("Lettura non riuscita.", true); mostra(); } } } catch (e) {}
    }, 6000);
  }
  async function finitaIA(r) {
    // Le misure lette (planimetria quotata o voce) vanno nelle stanze se l'agente non le ha ancora scritte.
    const lette = (r.ia.ambienti || []).filter((a) => !a.esterno && a.larg && a.lung);
    if (lette.length && !(r.ambienti || []).some((a) => a.larg)) {
      const ambienti = lette.map((a, i) => ({ id: "a" + (i + 1), nome: a.nome, larg: a.larg, lung: a.lung, alt: a.alt, porta: a.porta || "", finestra: a.finestra || "", note: "letto dall'IA: controlla" }));
      await sicuro(db().rpc("ristrutturazione_misure", { p_id: r.id, p_ambienti: ambienti, p_immobile: r.immobile || {}, p_criticita: r.criticita || "" }), null);
      toast(lette.length + " stanze con misure dall'IA: controllale al passo 1.");
    } else toast("Relazione pronta per il tecnico.");
    await ricarica();
  }

  /* ================= RETE ================= */
  const idRegione = (n) => String(n || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/'/g, "").trim().replace(/\s+/g, "-");
  function paginaRete(scr) {
    const team = sotto(S.uid);
    const diretti = team.filter((x) => x.superiore === S.uid);
    const per = {}; team.forEach((x) => { const k = idRegione(x.regione); if (k) per[k] = (per[k] || 0) + 1; });
    if (S.mioRuolo && S.mioRuolo.regione) { const k = idRegione(S.mioRuolo.regione); per[k] = per[k] || 0; }
    const max = Math.max(1, ...Object.values(per));
    let h = '<div class="kpi" style="grid-template-columns:repeat(3,1fr)"><div class="card"><b>' + team.length + '</b><small>In squadra</small></div><div class="card"><b>' + diretti.length + '</b><small>Diretti</small></div><div class="card or"><b>' + Object.keys(per).filter((k) => per[k]).length + "</b><small>Regioni</small></div></div>";
    h += '<section class="card"><div class="sp"><h2 class="h2">Dove lavora la tua squadra</h2>' + (S.mioRuolo ? '<span class="pill p-nv">' + esc(RUOLI[S.mioRuolo.ruolo] || "") + "</span>" : "") + '</div><div class="cartina-box" id="cartina" style="margin-top:8px"></div>' +
      '<div class="legenda"><span>Persone:</span><i style="background:#c3d3e6"></i>1<i style="background:#8ea9c8"></i><i style="background:#4f739b"></i><i style="background:#1a334f"></i>' + max + '<i style="background:#f07a1a;margin-left:8px"></i>la tua regione</div></section>';
    h += '<div class="g2"><button class="btn" data-qa="invita">' + ICO.mail + 'Invita cliente</button><button class="btn n" data-qa="proponi">' + ICO.rete + "Porta in rete</button></div>";
    h += '<section class="card"><div class="sp"><h2 class="h2">La tua squadra</h2><span class="mut">' + team.length + "</span></div>" +
      (team.length ? team.map((x) => '<div class="li"><span class="av' + (x.superiore === S.uid ? " or" : "") + '">' + esc(iniziali(x.nome)) + '</span><span class="grow"><span class="lt">' + esc(x.nome || "Senza nome") + '</span><span class="ls">' + esc([RUOLI[x.ruolo] || x.ruolo, x.regione, x.superiore === S.uid ? "diretto" : "", x.creato ? "dal " + giorno(x.creato) : ""].filter(Boolean).join(" · ")) + '</span></span><span class="pill ' + (x.stato === "attivo" ? "p-nv" : "p-gr") + '">' + esc(x.stato || "") + "</span></div>").join("")
        : '<div class="vuoto"><b>Ancora nessuno</b>Tocca «Porta in rete»: AncheCasa valuta la persona e la mette nella tua squadra.</div>') + "</section>";
    scr.insertAdjacentHTML("beforeend", h);
    const c = scr.querySelector("#cartina");
    if (window.AC && window.AC.ITALIA_SVG) {
      c.innerHTML = window.AC.ITALIA_SVG;
      const scala = ["#c3d3e6", "#8ea9c8", "#4f739b", "#1a334f"];
      const mia = S.mioRuolo ? idRegione(S.mioRuolo.regione) : "";
      c.querySelectorAll("path[data-id]").forEach((p) => {
        const k = p.getAttribute("data-id"), v = per[k] || 0;
        p.setAttribute("fill", k === mia && !v ? "#f07a1a" : v ? scala[Math.min(3, Math.floor((v / max) * 3.999))] : "#eef1f5");
        if (k === mia) { p.setAttribute("stroke", "#f07a1a"); p.setAttribute("stroke-width", "2.5"); }
        const t = document.createElementNS("http://www.w3.org/2000/svg", "title"); t.textContent = k.replace(/-/g, " ") + ": " + v; p.appendChild(t);
      });
    } else c.innerHTML = '<div class="mut">Cartina non disponibile.</div>';
    scr.querySelectorAll("[data-qa]").forEach((b) => b.addEventListener("click", () => azione(b.dataset.qa)));
  }

  /* ================= ALTRO ================= */
  const STATICI = [
    ["Regolamento della rete", "../dashboard/docs/AncheCasa-Regolamento-della-rete.pdf", "regolamento"],
    ["Circolare 1/2026 · Nuove regole", "../dashboard/docs/AncheCasa-Circolare-1-2026-Nuove-regole.pdf", "circolare"],
    ["Contratto Agente", "../dashboard/docs/AncheCasa-3Contratto-Agente.pdf", "contratto", ["agente"]],
    ["Contratto Subagente", "../dashboard/docs/AncheCasa-4Contratto-Subagente.pdf", "contratto", ["subagente"]],
    ["Contratto Capo area", "../dashboard/docs/AncheCasa-2Contratto-Capo-Area.pdf", "contratto", ["capoarea"]],
    ["Contratto Assistente sviluppo rete", "../dashboard/docs/AncheCasa-1Contratto-Assistente-Sviluppo-Rete.pdf", "contratto", ["sviluppo"]],
    ["Contratto Responsabile Rete Italia", "../dashboard/docs/AncheCasa-5Contratto-Responsabile-Rete-Italia.pdf", "contratto", ["reteitalia"]],
    ["Regole del privato", "../dashboard/regole/privato.html", "formazione"],
    ["Regole della rete", "../dashboard/regole/rete.html", "formazione"],
    ["Regole luce e gas", "../dashboard/regole/energia.html", "formazione"],
    ["Listino e sala demo", "../dashboard/regole/listino.html", "formazione"],
  ];
  function paginaAltro(scr) {
    const ruolo = S.mioRuolo && S.mioRuolo.ruolo;
    const statici = STATICI.filter((d) => !d[3] || S.admin || d[3].includes(ruolo));
    const dinamici = S.docs.filter((d) => !(d.ruoli || []).length || S.admin || (d.ruoli || []).includes(ruolo));
    const gruppo = (titolo, lista) => lista.length ? '<section class="card"><h2 class="h2">' + titolo + "</h2>" + lista.join("") + "</section>" : "";
    const riga = (t, url, tipo, firma) => '<button class="li" data-doc="' + esc(url) + '" data-titolo="' + esc(t) + '"><span class="av">' + ICO.doc.replace("<svg", '<svg style="width:20px;height:20px"') + '</span><span class="grow"><span class="lt">' + esc(t) + '</span><span class="ls">' + esc(tipo) + "</span></span>" + (firma ? firma : ICO.chev.replace("<svg", '<svg class="chev"')) + "</button>";
    let h = '<section class="card"><div class="row"><span class="av or">' + esc(iniziali(S.profilo && S.profilo.nome)) + '</span><div class="grow"><div class="lt">' + esc((S.profilo && S.profilo.nome) || "") + '</div><div class="ls">' + esc(S.admin ? "Admin" : [RUOLI[ruolo] || "Rete", S.mioRuolo && S.mioRuolo.regione].filter(Boolean).join(" · ")) + "</div></div></div></section>";
    h += gruppo("Formazione", statici.filter((d) => d[2] === "formazione").map((d) => riga(d[0], d[1], "Da leggere")));
    h += gruppo("Contratti, regolamento e circolari", statici.filter((d) => d[2] !== "formazione").map((d) => riga(d[0], d[1], d[2] === "contratto" ? "Contratto · PDF" : d[2] === "circolare" ? "Circolare · PDF" : "Regolamento · PDF")) .concat(
      dinamici.map((d) => riga(d.titolo, d.file || "", (d.tipo || "documento") + (d.versione ? " · v" + d.versione : ""), d.richiede_firma ? (S.firme.includes(d.id) ? '<span class="pill p-ok">Firmato</span>' : '<span class="pill p-or">Da firmare</span>') : ""))));
    h += '<section class="card"><button class="li" data-computer><span class="av">' + ICO.dashboard.replace("<svg", '<svg style="width:20px;height:20px"') + '</span><span class="grow"><span class="lt">Versione per computer</span><span class="ls">La dashboard completa, come dal PC</span></span>' + ICO.chev.replace("<svg", '<svg class="chev"') + "</button>" +
      '<button class="li" data-installa><span class="av">' + ICO.home.replace("<svg", '<svg style="width:20px;height:20px"') + '</span><span class="grow"><span class="lt">Metti l\'app sul telefono</span><span class="ls">Un\'icona come le altre app</span></span></button>' +
      '<button class="li" data-esci><span class="av">' + ICO.esci.replace("<svg", '<svg style="width:20px;height:20px"') + '</span><span class="grow"><span class="lt">Esci</span></span></button></section>';
    h += '<p class="mut" style="text-align:center">AncheCasa · Costruiamo fiducia · app v2</p>';
    scr.insertAdjacentHTML("beforeend", h);
    scr.querySelectorAll("[data-doc]").forEach((b) => b.addEventListener("click", () => apriDoc(b.dataset.doc, b.dataset.titolo)));
    scr.querySelector("[data-esci]").addEventListener("click", esci);
    scr.querySelector("[data-computer]").addEventListener("click", versioneComputer);
    scr.querySelector("[data-installa]").addEventListener("click", installa);
  }
  function apriDoc(url, titolo) {
    if (!url) return toast("Documento non ancora caricato.", true);
    // I PDF si aprono nel lettore del telefono; le pagine HTML dentro l'app.
    if (/\.pdf($|\?)/i.test(url)) { window.open(url, "_blank", "noopener"); return; }
    const d = document.createElement("div"); d.className = "lettore";
    d.innerHTML = '<header class="top"><button class="ib" aria-label="Chiudi">' + ICO.chiudi + '</button><div class="tit">' + esc(titolo) + '</div><a class="ib" href="' + esc(url) + '" target="_blank" rel="noopener" aria-label="Apri a parte">' + ICO.chev + '</a></header><iframe src="' + esc(url) + '" title="' + esc(titolo) + '"></iframe>';
    d.querySelector("button").addEventListener("click", () => d.remove());
    document.body.appendChild(d);
  }
  let promptInstalla = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); promptInstalla = e; });
  function installa() {
    if (promptInstalla) { promptInstalla.prompt(); promptInstalla = null; return; }
    foglio('<h2 class="h2">Metti l\'app sul telefono</h2><p class="mut"><b>iPhone:</b> tocca Condividi (il quadrato con la freccia) e poi «Aggiungi alla schermata Home».</p><p class="mut"><b>Android:</b> menu ⋮ di Chrome e poi «Installa app» o «Aggiungi a schermata Home».</p><button class="btn" data-chiudi>Ho capito</button>');
  }

  /* ================= FOGLI: +, notifiche, inviti, nuova pratica, porta in rete ================= */
  function foglio(html, dopo) {
    const v = document.createElement("div"); v.className = "velo";
    v.innerHTML = '<div class="foglio" role="dialog" aria-modal="true"><div class="maniglia"></div>' + html + "</div>";
    v.addEventListener("click", (e) => { if (e.target === v || e.target.closest("[data-chiudi]")) v.remove(); });
    document.body.appendChild(v);
    if (dopo) dopo(v.querySelector(".foglio"), () => v.remove());
  }
  // Il + di ogni profilo. «d:pagina» apre la pagina della dashboard (solo se il profilo la vede nei suoi menu).
  const PIU = {
    privato: [["d:pv-guasto", "Ho un guasto", "Un artigiano della tua zona, subito", "flash"], ["d:pv-ristruttura", "Ristruttura con AncheCasa", "Sopralluogo, progetto e preventivo", "casa"],
      ["d:pubblica", "Pubblica un annuncio", "Chi lavora nella tua zona ti risponde", "doc"], ["d:pv-trova", "Trova artigiano o impresa", "Cerca per lavoro e zona", "clienti"],
      ["d:pv-casa", "Traslochi, pulizie e giardino", "Chiedi un preventivo", "home"], ["d:pv-check-bollette", "Check bollette", "Vedi quanto puoi risparmiare", "euro"]],
    azienda: [["d:pubblica", "Pubblica", "Un annuncio o una richiesta", "doc"], ["d:cnt_cerca", "Cerca subappaltatori", "Imprese e artigiani della zona", "clienti"],
      ["d:preventivi", "Nuovo preventivo", "Per un tuo cliente", "euro"], ["d:rapportini", "Rapportino di oggi", "Ore e lavori in cantiere", "doc"],
      ["d:giornali", "Giornale di cantiere", "Cosa è successo oggi", "foto"], ["d:az-documenti", "Carica i documenti", "Visura, DURC e abbonamento", "doc"], ["d:chat", "Scrivi ad AncheCasa", "Ti rispondiamo in chat", "mail"]],
    agente: [["prova", "Vedi cosa so fare", "Foto o video: report, prima e dopo, preventivo simulato", "flash"], ["flash", "Sopralluogo Flash", "Sei dal cliente: misure, foto, video, IA e invio per mail", "flash"], ["invita", "Invita un cliente", "Privato o azienda: la mail parte da AncheCasa", "mail"],
      ["nuova", "Segnala una ristrutturazione", "Il sopralluogo lo assegna AncheCasa", "casa"], ["proponi", "Porta una persona in rete", "Agente o subagente nella tua squadra", "rete"],
      ["d:re-registra", "Registra un cliente", "Luce, gas, telefono o servizi", "euro"]],
    admin: [["prova", "Vedi cosa so fare", "Foto o video: report, prima e dopo, preventivo simulato", "flash"], ["flash", "Sopralluogo Flash", "Misure, foto, video, IA e invio per mail", "flash"], ["d:inviti-admin", "Invita", "Privati, aziende e rete", "mail"],
      ["nuova", "Nuova pratica di ristrutturazione", "La assegni dopo a un tecnico", "casa"], ["d:task", "Nuovo task", "Per te o per il team", "doc"],
      ["d:chat-team", "Chat del team", "Messaggi della squadra AncheCasa", "mail"], ["d:appunti", "Appunti", "Note veloci", "doc"]],
  };
  function vociMenu() {
    const ids = D.tabs.map((t) => t.id).concat(D.altro.filter((x) => x.id).map((x) => x.id)).concat(D.acct.map((x) => x.id));
    if (S.fam === "admin") ids.push("chat-team");
    return ids;
  }
  function foglioPiu() {
    const ids = vociMenu();
    const voci = (PIU[S.fam] || []).filter((x) => {
      // Nella foto approvata il + della rete ha solo le 4 azioni native.
      if (x[0] === "prova") return puoProva();
      if (S.nativa && x[0].indexOf("d:") === 0) return false;
      if (x[0].indexOf("d:") === 0) return !D.pronto || ids.includes(x[0].slice(2));
      return S.nativa || S.admin; // le azioni native (Flash, inviti, pratiche) sono della rete verificata e dell'admin
    }).slice(0, 7);
    if (!voci.length && D.altro.length) D.altro.filter((x) => x.id).slice(0, 6).forEach((x) => voci.push(["d:" + x.id, x.label, "", x.svg]));
    if (!voci.length) return toast("Un momento: sto caricando le tue sezioni.");
    const ico = (k) => ICO[k] || k;
    foglio('<h2 class="h2" style="margin-bottom:6px">Cosa vuoi fare?</h2>' + voci.map((x) => '<button class="sa" data-az="' + esc(x[0]) + '"><span class="ico">' + ico(x[3]) + '</span><span class="grow"><span class="lt">' + esc(x[1]) + "</span>" + (x[2] ? '<span class="ls">' + esc(x[2]) + "</span>" : "") + "</span></button>").join(""),
      (f, chiudi) => f.querySelectorAll("[data-az]").forEach((b) => b.addEventListener("click", () => { chiudi(); azione(b.dataset.az); })));
  }
  // ≡ in alto: tutte le altre sezioni del profilo (le stesse di «Altro» della dashboard), account, versione per computer, esci.
  function foglioMenu() {
    const nome = (S.profilo && S.profilo.nome) || "";
    const ruolo = S.mioRuolo && S.mioRuolo.ruolo;
    const sub = S.admin ? "Admin AncheCasa" : S.mioRuolo ? [RUOLI[ruolo] || "Rete", S.mioRuolo.regione].filter(Boolean).join(" · ") : { privato: "Privato", azienda: "Azienda", agente: "Rete AncheCasa" }[S.fam] || "";
    const sez = (t) => '<div class="eti" style="margin:14px 4px 2px">' + esc(t) + "</div>";
    const riga = (attr, svg, t, s) => '<button class="sa" ' + attr + '><span class="ico">' + svg + '</span><span class="grow"><span class="lt">' + esc(t) + "</span>" + (s ? '<span class="ls">' + esc(s) + "</span>" : "") + "</span></button>";
    let h = '<div class="row" style="padding:2px 4px 6px"><span class="av or">' + esc(iniziali(nome || "AC")) + '</span><div class="grow"><div class="lt">' + esc(nome || "Il mio account") + '</div><div class="ls">' + esc(sub) + "</div></div></div>";
    if (S.nativa) h += sez("La tua app") + riga('data-h="rete"', ICO.rete, "La mia rete", "Squadra, cartina, porta in rete") + riga('data-h="altro"', ICO.doc, "Formazione e documenti", "Regolamento, contratti, circolari");
    if (S.admin) h += riga('data-d="chat-team"', ICO.mail, "Chat del team") + riga('data-h="altro"', ICO.doc, "Formazione e documenti", "Regolamento, contratti, circolari");
    let prima = true;
    D.altro.forEach((x) => {
      if (x.sez) { h += sez(x.sez); prima = false; return; }
      if (prima && !S.nativa && !S.admin) { h += sez("Sezioni"); prima = false; }
      h += riga('data-d="' + esc(x.id) + '"', x.svg, x.label);
    });
    if (!D.pronto) h += '<div class="mut" style="padding:10px 4px">Carico le tue sezioni…</div>';
    h += sez("Il mio account") + D.acct.map((a) => riga('data-d="' + esc(a.id) + '"', a.svg, a.label)).join("") +
      riga("data-installa", ICO.home, "Metti l'app sul telefono", "Un'icona come le altre app") +
      riga("data-computer", ICO.dashboard, "Versione per computer", "La dashboard completa, come dal PC") +
      riga("data-esci", ICO.esci, "Esci");
    h += '<p class="mut" style="text-align:center;margin:12px 0 0">AncheCasa · Costruiamo fiducia · app v2</p>';
    foglio(h, (f, chiudi) => {
      f.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => { chiudi(); vai(b.dataset.d); }));
      f.querySelectorAll("[data-h]").forEach((b) => b.addEventListener("click", () => { chiudi(); location.hash = b.dataset.h; }));
      f.querySelector("[data-installa]").addEventListener("click", () => { chiudi(); installa(); });
      f.querySelector("[data-computer]").addEventListener("click", versioneComputer);
      f.querySelector("[data-esci]").addEventListener("click", esci);
    });
  }
  function versioneComputer() {
    try { sessionStorage.setItem("ac-vista", "computer"); } catch (e) { /* niente */ }
    const r = rotta();
    location.href = "../dashboard/" + (DEMO ? "?demo=" + S.fam : "") + (r.tipo === "dash" && r.page && S.fam ? "#/" + (D.fam || S.fam) + "/" + r.page : "");
  }
  async function esci() {
    if (reale()) { try { await db().auth.signOut(); } catch (e) { /* niente */ } }
    location.href = "./";
  }
  function foglioNotifiche() {
    const l = S.notifiche;
    foglio('<h2 class="h2" style="margin-bottom:6px">Notifiche</h2>' + (l.length ? l.map((n) => '<div class="li"><span class="av' + (n.letto ? "" : " or") + '">' + ICO.campana.replace("<svg", '<svg style="width:18px;height:18px"') + '</span><span class="grow"><span class="lt" style="font-weight:' + (n.letto ? 600 : 800) + '">' + esc(n.testo) + '</span><span class="ls">' + esc(quando(n.creato)) + "</span></span></div>").join("") : '<div class="vuoto"><b>Nessuna notifica</b></div>') + '<button class="btn2 pieno" data-chiudi style="margin-top:10px">Chiudi</button>');
    const da = l.filter((n) => !n.letto).map((n) => n.id);
    if (da.length) { l.forEach((n) => { n.letto = true; }); if (reale()) sicuro(db().from("app_notifiche").update({ letto: true }).in("id", da), null); const b = app.querySelector("[data-notifiche] .badge"); if (b) b.remove(); }
  }

  function azione(k) {
    if (k.indexOf("d:") === 0) return vai(k.slice(2));
    if (k === "prova") { location.hash = "prova"; return; }
    if (k === "flash") return foglioFlash();
    if (k === "invita") return foglioInvita();
    if (k === "nuova") return foglioNuova(false);
    if (k === "proponi") return foglioProponi();
    if (k === "formazione") { location.hash = "altro"; }
  }

  function foglioFlash() {
    const aperti = S.sopr.filter((r) => !["chiusa", "persa", "firmata", "in_cantiere"].includes(r.stato));
    foglio('<div class="eti">Sopralluogo Flash</div><h2 class="h2" style="margin:4px 0 6px">Da quale cliente sei?</h2>' +
      (aperti.length ? aperti.map((r) => '<button class="sa" data-p="' + esc(r.id) + '"><span class="ico">' + esc(iniziali(r.nome)) + '</span><span class="grow"><span class="lt">' + esc(r.nome) + '</span><span class="ls">' + esc([r.comune, r.indirizzo].filter(Boolean).join(" · ")) + "</span></span>" + pillStato(r.stato) + "</button>").join("") : "") +
      '<button class="btn" data-nuovo style="margin-top:8px">' + ICO.piu + "Nuovo cliente, sono qui adesso</button>",
      (f, chiudi) => {
        f.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => { chiudi(); try { sessionStorage.setItem("ac-passo", "1"); } catch (e) {} location.hash = "pratica/" + b.dataset.p; }));
        f.querySelector("[data-nuovo]").addEventListener("click", () => { chiudi(); foglioNuova(true); });
      });
  }

  function foglioNuova(mia) {
    foglio('<div class="eti">' + (mia ? "Sopralluogo Flash" : "Segnalazione") + '</div><h2 class="h2" style="margin:4px 0 10px">' + (mia ? "Nuovo cliente: inizi tu il sopralluogo" : "Segnala una ristrutturazione") + "</h2>" +
      '<form data-f style="display:flex;flex-direction:column;gap:10px"><div class="fl"><label>Nome e cognome</label><input class="in" name="nome" required maxlength="120"></div>' +
      '<div class="g2"><div class="fl"><label>Telefono</label><input class="in" name="telefono" type="tel" inputmode="tel"></div><div class="fl"><label>Mail</label><input class="in" name="mail" type="email" inputmode="email"></div></div>' +
      '<div class="fl"><label>Indirizzo</label><input class="in" name="indirizzo" maxlength="160"></div>' +
      '<div class="g2"><div class="fl"><label>Comune</label><input class="in" name="comune" maxlength="80"></div><div class="fl"><label>Provincia</label><input class="in" name="provincia" maxlength="2" placeholder="CE" style="text-transform:uppercase"></div></div>' +
      '<div class="fl"><label>Cosa vuole fare</label><textarea class="in" name="descrizione" maxlength="1500" placeholder="es. rifare bagno e cucina, cappotto, giardino"></textarea></div>' +
      '<div class="fl"><label>Budget indicativo</label><input class="in" name="budget" maxlength="60" placeholder="es. 30-40 mila €"></div>' +
      '<button class="btn" type="submit">' + (mia ? "Inizia il sopralluogo" : "Manda ad AncheCasa") + "</button></form>",
      (f, chiudi) => f.querySelector("[data-f]").addEventListener("submit", async (e) => {
        e.preventDefault(); const fm = e.target, b = fm.querySelector("button");
        const p = {}; ["nome", "telefono", "mail", "indirizzo", "comune", "provincia", "descrizione", "budget"].forEach((k) => { p[k] = fm[k].value.trim(); });
        if (p.nome.length < 2) return toast("Scrivi il nome del cliente.", true);
        if (p.mail && !mailOk(p.mail)) return toast("Controlla la mail.", true);
        b.disabled = true; b.textContent = "Salvo…";
        if (!reale()) { const id = "s" + Date.now(); if (mia) S.sopr.unshift(Object.assign({ id, creato: new Date().toISOString(), stato: "sopralluogo", media: [], ambienti: [], immobile: {} }, p)); else S.segnalate.unshift(Object.assign({ id, creato: new Date().toISOString(), stato: "nuova" }, p)); chiudi(); toast("Anteprima: salvato."); location.hash = mia ? "pratica/" + id : "clienti"; return; }
        try {
          const id = await Q(db().rpc(mia ? "ristrutturazione_nuova_mia" : "ristrutturazione_nuova", { p: p }));
          chiudi(); toast(mia ? "Pratica aperta: inizia dalle misure." : "Segnalazione mandata ad AncheCasa."); await carica();
          if (mia) { try { sessionStorage.setItem("ac-passo", "1"); } catch (x) {} location.hash = "pratica/" + id; } else { segClienti = "pratiche"; location.hash = "clienti"; mostra(); }
        } catch (x) { b.disabled = false; b.textContent = mia ? "Inizia il sopralluogo" : "Manda ad AncheCasa"; const m = errore(x); toast({ troppe_richieste: "Hai aperto troppe pratiche oggi: riprova domani o scrivi all'admin.", solo_rete: "Solo la rete può aprire un sopralluogo.", manca_nome: "Scrivi il nome del cliente." }[m] || (/does not exist|ristrutturazione_nuova_mia|schema cache/.test(m) ? "Funzione non ancora attiva: serve app-31 sul database." : "Non salvato: " + m), true); }
      }));
  }

  function foglioInvita() {
    let fam = "privato";
    foglio('<div class="eti">Invito</div><h2 class="h2" style="margin:4px 0 4px">Invita un cliente</h2><p class="mut" style="margin:0 0 10px">Parte una mail di AncheCasa. Chi si iscrive dal tuo invito resta tuo cliente. Niente WhatsApp.</p>' +
      '<form data-f style="display:flex;flex-direction:column;gap:10px"><div class="seg"><button type="button" class="on" data-fam="privato">Privato</button><button type="button" data-fam="azienda">Azienda</button></div>' +
      '<div class="fl"><label>Nome</label><input class="in" name="nome" maxlength="120"></div><div class="fl"><label>Mail</label><input class="in" name="mail" type="email" inputmode="email" required></div>' +
      '<button class="btn" type="submit">' + ICO.mail + "Manda l'invito per mail</button></form>",
      (f, chiudi) => {
        f.querySelectorAll("[data-fam]").forEach((b) => b.addEventListener("click", () => { fam = b.dataset.fam; f.querySelectorAll("[data-fam]").forEach((x) => x.classList.toggle("on", x === b)); }));
        f.querySelector("[data-f]").addEventListener("submit", async (e) => {
          e.preventDefault(); const fm = e.target, b = fm.querySelector("button[type=submit]");
          const mail = fm.mail.value.trim().toLowerCase(), nome = fm.nome.value.trim();
          if (!mailOk(mail)) return toast("Scrivi una mail valida: l'invito parte solo per mail.", true);
          b.disabled = true; b.textContent = "Invio…";
          if (!reale()) { S.inviti.unshift({ token: "t" + Date.now(), nome, mail, famiglia: fam, stato: "inviato", created_at: new Date().toISOString() }); chiudi(); toast("Anteprima: invito mandato a " + mail + "."); return mostra(); }
          try {
            let riga = { famiglia: fam, categoria: fam === "privato" ? "Privato" : "Azienda", mail: mail, nome: nome };
            let res = await db().from("inviti_admin").insert(riga).select("token").single();
            if (res.error && /nome/.test(res.error.message || "")) { delete riga.nome; res = await db().from("inviti_admin").insert(riga).select("token").single(); }
            if (res.error) throw res.error;
            try { await funzione("invia-invito-marketplace", { token: res.data.token }); chiudi(); toast("Invito mandato a " + mail + "."); }
            catch (x) {
              chiudi();
              const link = LINK_BENVENUTO + "?invito=" + res.data.token;
              foglio('<h2 class="h2">Invito creato, mail non partita</h2><p class="mut">La mail automatica non è partita (' + esc(errore(x)) + "). Avvisa l'admin. Intanto puoi copiare il link e mandarlo tu per mail.</p>" +
                '<input class="in" readonly value="' + esc(link) + '"><button class="btn" data-copia style="margin-top:10px">Copia il link</button>', (f2) => f2.querySelector("[data-copia]").addEventListener("click", () => { navigator.clipboard && navigator.clipboard.writeText(link); toast("Link copiato."); }));
            }
            await ricarica();
          } catch (x) { b.disabled = false; b.textContent = "Manda l'invito per mail"; toast("Invito non creato: " + errore(x), true); }
        });
      });
  }

  function foglioProponi() {
    const REG = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];
    const mia = S.mioRuolo && S.mioRuolo.regione || "";
    foglio('<div class="eti">Squadra</div><h2 class="h2" style="margin:4px 0 4px">Porta una persona in rete</h2><p class="mut" style="margin:0 0 10px">AncheCasa la valuta; se va bene entra nella tua squadra e riceve l\'invito per mail.</p>' +
      '<form data-f style="display:flex;flex-direction:column;gap:10px"><div class="fl"><label>Ruolo</label><select class="in" name="ruolo"><option value="subagente">Subagente</option><option value="agente">Agente</option></select></div>' +
      '<div class="fl"><label>Nome e cognome</label><input class="in" name="nome" required></div><div class="g2"><div class="fl"><label>Mail</label><input class="in" name="mail" type="email" inputmode="email" required></div><div class="fl"><label>Telefono</label><input class="in" name="tel" type="tel"></div></div>' +
      '<div class="fl"><label>Regione</label><select class="in" name="regione">' + REG.map((r) => '<option' + (r === mia ? " selected" : "") + ">" + r + "</option>").join("") + '</select></div><div class="fl"><label>Perché è adatta</label><textarea class="in" name="note" maxlength="500"></textarea></div>' +
      '<button class="btn n" type="submit">Proponi ad AncheCasa</button></form>',
      (f, chiudi) => f.querySelector("[data-f]").addEventListener("submit", async (e) => {
        e.preventDefault(); const fm = e.target, b = fm.querySelector("button");
        if (!mailOk(fm.mail.value.trim())) return toast("Controlla la mail.", true);
        b.disabled = true;
        if (!reale()) { chiudi(); return toast("Anteprima: proposta mandata ad AncheCasa."); }
        try { await Q(db().rpc("app_proponi_rete", { p_ruolo: fm.ruolo.value, p_nome: fm.nome.value.trim(), p_email: fm.mail.value.trim().toLowerCase(), p_telefono: fm.tel.value.trim(), p_regione: fm.regione.value, p_note: fm.note.value.trim() })); chiudi(); toast("Proposta mandata: AncheCasa ti risponde nell'app."); }
        catch (x) { b.disabled = false; toast("Non mandata: " + errore(x), true); }
      }));
  }

  avvio().catch((e) => { app.innerHTML = '<div class="accesso"><div class="card"><b>Qualcosa non va.</b><p class="mut">' + esc(errore(e)) + '</p><button class="btn" onclick="location.reload()">Riprova</button></div></div>'; });
})();
