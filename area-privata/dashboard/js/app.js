(function () {
  const AC = window.AC;
  const { html, icon, raw } = AC.ui;
  const S = AC.store;
  const D = AC.date;

  /* CONGELATO 20.09.2026. Famiglie e pulsanti. Non cambiare FOLD_LAB, UFFICIO, PACKS, packFornitore, navItems, HEADER_OPP. Non aggiungere, togliere o rinominare pieghe o tasti.
     ECCEZIONE 22.09.2026, su richiesta esplicita: aggiunta "admin" come quarta famiglia
     (prima era una pagina admin.html a sé, mai approvata graficamente). Non tocca le pieghe
     o i tasti delle tre famiglie originali: admin ha un suo ramo separato ovunque sotto.
     ECCEZIONE 23.09.2026, su richiesta esplicita: tasto "La mia bacheca" (id bacheca) in cima
     al menu di Privato, Azienda e Agente, ed è la pagina di arrivo al posto del Profilo.
     Per Azienda e Agente la pagina è per ora vuota: contenuti da decidere con l'utente. */

  const FOLD_LAB = {
    ufficio: "Ufficio",
    gare: "Gare e digitale",
    cantiere: "Cantiere",
    stabile: "Stabile",
    agenzia: "Agenzia",
    produzione: "Produzione",
    flotta: "Flotta e magazzino",
    struttura: "Struttura",
    bottega: "Bottega",
    studio: "Studio",
    vendita: "Vendita",
    noleggio: "Noleggio",
    commessa: "Commessa",
    // Macro-area Edilizia (01.10.2026)
    mezzisquadre: "Mezzi e squadre",
    lavori: "Lavori",
    squadre: "Squadre e cantiere",
    interventi: "Interventi",
    mezzimag: "Mezzi e magazzino",
    // Energia e utenze (09.10.2026, su richiesta esplicita)
    utenze: "Luce e gas"
  };

  const TIPO_SETTORE = {
    condominio: "casa",
    agenzia: "casa",
    impresa: "edilizia",
    subappaltatore: "edilizia",
    impiantista: "edilizia",
    professionista: "edilizia",
    hse: "edilizia",
    sicurezza_armata: "edilizia",
    apl: "edilizia",
    industria: "industria",
    logistica: "logistica",
    albergo: "ospitalita",
    negozio: "commercio",
    artigiano: "commercio",
    fornitore: "commercio",
    energia: "casa"
  };
  // Categorie Genera link / profilo → pack menu (i 13 pack restano sotto).
  const TIPO_PACK = {
    impresa: "impresa",
    professionista: "professionista",
    hse: "hse",
    sicurezza_armata: "sicurezza_armata",
    condominio: "condominio",
    agenzia: "agenzia",
    apl: "apl",
    industria: "industria",
    logistica: "logistica",
    albergo: "albergo",
    negozio: "negozio",
    fornitore: "fornitore",
    artigiano: "artigiano",
    azienda_imprese_edili: "impresa",
    azienda_subappaltatori: "subappaltatore",
    azienda_impiantisti: "impiantista",
    azienda_materiali_edili: "fornitore",
    azienda_noleggio_attrezzature: "fornitore",
    azienda_traslochi: "logistica",
    azienda_facchinaggio: "logistica",
    azienda_pulizie: "logistica",
    azienda_manutenzione_stabili: "condominio",
    azienda_hotel: "albergo",
    azienda_ristoranti: "albergo",
    azienda_negozi: "negozio",
    azienda_capannoni: "industria",
    azienda_studi_tecnici: "professionista",
    azienda_consulenti: "hse",
    azienda_fornitori_it: "fornitore",
    azienda_agenzie_immobiliari: "agenzia",
    agente_agenzie_immobiliari: "agenzia",
    azienda_luce_gas: "energia"
  };
  const TIPO_FORN_MODO = {
    azienda_materiali_edili: "vendita",
    azienda_noleggio_attrezzature: "noleggio",
    azienda_fornitori_it: "vendita"
  };
  function packKey(tipo) {
    return TIPO_PACK[tipo] || tipo || "";
  }
  function fornitoreModoDi(tipo) {
    return TIPO_FORN_MODO[tipo] || "";
  }
  AC.tipoSettore = TIPO_SETTORE;
  AC.packKey = packKey;
  AC.fornitoreModoDi = fornitoreModoDi;

  function n(id, label, iconName, fold) {
    return { id: id, label: label, icon: iconName, gruppo: "pack", fold: fold };
  }

  const UFFICIO = [
    n("amministrazione", "Amministrazione", "wallet", "ufficio"),
    n("sicurezza", "Sicurezza", "shield", "ufficio"),
    n("vault", "Documenti", "folder", "ufficio"),
    n("clienti", "Clienti", "team", "ufficio"),
    n("preventivi", "Preventivi", "doc", "ufficio"),
    n("fatture", "Fatture", "wallet", "ufficio"),
    n("recruitment", "Recruitment", "team", "ufficio"),
    n("acquisti", "Acquisti", "folder", "ufficio"),
    n("fornitori", "Fornitori", "team", "ufficio")
  ];

  function withUfficio(rest) {
    const seen = {};
    const out = [];
    UFFICIO.concat(rest || []).forEach((it) => {
      if (seen[it.id]) return;
      seen[it.id] = true;
      out.push(it);
    });
    return out;
  }

  /* Aggiornato 21.09.2026 su richiesta dell'utente: tipi azienda da 10 a 13. hse, sicurezza_armata e apl hanno per ora solo l'Ufficio comune; i tasti di mestiere si aggiungono quando l'utente li indica. */
  const PACKS = {
    hse: withUfficio([]),
    sicurezza_armata: withUfficio([]),
    apl: withUfficio([]),
    /* Macro-area Edilizia (01.10.2026, su richiesta, "vediamo come viene, poi si aggiunge o si toglie"):
       impresa riordinata (Cantiere da 9 a 6 voci + nuova cartella Mezzi e squadre, Subappalti in Gare),
       e due pack nuovi per Subappaltatori e Impiantisti, che prima ricevevano impresa e artigiano. */
    impresa: withUfficio([
      n("analizza", "Analizza gare", "chart", "gare"),
      n("partecipa", "Partecipa a gare", "doc", "gare"),
      n("predict", "Predict", "chart", "gare"),
      n("bim", "BIM 5D", "building", "gare"),
      n("subappalti", "Subappalti", "send", "gare"),
      n("cantiere", "Gestione cantiere", "building", "cantiere"),
      n("giornali", "Giornali di cantiere", "calendar", "cantiere"),
      n("sal", "SAL", "bars", "cantiere"),
      n("cronoprogramma", "Cronoprogramma", "pulse", "cantiere"),
      n("presenze", "Presenze", "clock", "cantiere"),
      n("rapportini", "Rapportini", "doc", "cantiere"),
      n("mezzi", "Mezzi", "pulse", "mezzisquadre"),
      n("magazzino", "Magazzino", "folder", "mezzisquadre"),
      n("app", "App di campo", "pulse", "mezzisquadre"),
      n("squadre", "Squadre", "team", "mezzisquadre")
    ]),
    subappaltatore: withUfficio([
      n("partecipa", "Partecipa a gare", "doc", "lavori"),
      n("offerte", "Offerte ai GC", "send", "lavori"),
      n("sal", "SAL", "bars", "lavori"),
      n("rapportini", "Rapportini", "doc", "lavori"),
      n("presenze", "Presenze", "clock", "squadre"),
      n("app", "App di campo", "pulse", "squadre"),
      n("squadre", "Squadre", "team", "squadre"),
      n("qualificazioni", "Qualificazioni", "shield", "squadre")
    ]),
    impiantista: withUfficio([
      n("interventi", "Interventi", "gear", "interventi"),
      n("rapportini", "Rapportini", "doc", "interventi"),
      n("app", "App di campo", "pulse", "interventi"),
      n("manutprog", "Manutenzioni programmate", "calendar", "interventi"),
      n("dico", "Certificazioni / DiCo", "shield", "interventi"),
      n("mezzi", "Mezzi", "pulse", "mezzimag"),
      n("magazzino", "Magazzino", "folder", "mezzimag")
    ]),
    professionista: withUfficio([
      n("pratiche", "Pratiche", "doc", "studio"),
      n("analizza", "Analizza gare", "chart", "studio"),
      n("bim", "BIM 5D", "building", "studio"),
      n("rapportini", "Rapportini", "doc", "studio"),
      n("presenze", "Presenze di cantiere", "clock", "studio")
    ]),
    condominio: withUfficio([
      n("anagrafe", "Anagrafe", "home", "stabile"),
      n("assemblee", "Assemblee", "team", "stabile"),
      n("manutenzioni", "Manutenzioni", "gear", "stabile"),
      n("contabilita", "Contabilità", "wallet", "stabile"),
      n("archivio", "Documenti stabile", "folder", "stabile"),
      n("fornitori", "Fornitori", "team", "stabile")
    ]),
    agenzia: withUfficio([
      n("immobili", "Immobili", "home", "agenzia"),
      n("mandati", "Mandati", "doc", "agenzia"),
      n("visite", "Visite", "calendar", "agenzia")
    ]),
    industria: withUfficio([
      n("produzione", "Produzione", "pulse", "produzione"),
      n("magazzino", "Magazzino", "folder", "produzione"),
      n("mezzi", "Mezzi", "pulse", "produzione"),
      n("personale", "Personale", "team", "produzione")
    ]),
    logistica: withUfficio([
      n("magazzino", "Magazzino", "folder", "flotta"),
      n("mezzi", "Mezzi", "pulse", "flotta"),
      n("tracking", "Tracking", "pulse", "flotta"),
      n("spedizioni", "Spedizioni", "send", "flotta")
    ]),
    albergo: withUfficio([
      n("struttura", "Struttura", "building", "struttura"),
      n("camere", "Camere e sale", "home", "struttura"),
      n("turni", "Turni", "calendar", "struttura")
    ]),
    negozio: withUfficio([
      n("vetrina", "Vetrina", "star", "bottega"),
      n("magazzino", "Magazzino", "folder", "bottega"),
      n("turni", "Turni", "calendar", "bottega")
    ]),
    /* ECCEZIONE 09.10.2026, su richiesta esplicita: pack Energia per i fornitori di luce e gas.
       Offerte in tutta Italia e proposte su carta intestata AncheCasa con il logo dell'azienda (js/energia.js). */
    energia: withUfficio([
      n("offerte_energia", "Le mie offerte", "star", "utenze"),
      n("proposte_energia", "Proposte su carta intestata", "doc", "utenze")
    ]),
    artigiano: withUfficio([
      n("vetrina", "Vetrina", "star", "bottega"),
      n("app", "App di campo", "pulse", "bottega"),
      n("rapportini", "Rapportini", "doc", "bottega"),
      n("mezzi", "Mezzi", "pulse", "bottega"),
      n("magazzino", "Magazzino", "folder", "bottega")
    ])
  };

  function packFornitore(modo) {
    const m = modo || "entrambi";
    const vendita = [
      n("listino", "Listino", "star", "vendita"),
      n("magazzino", "Magazzino", "folder", "vendita"),
      n("ordini", "Ordini", "doc", "vendita"),
      n("consegne", "Consegne", "send", "vendita")
    ];
    const noleggio = [
      n("flotta", "Flotta", "pulse", "noleggio"),
      n("calendario", "Calendario disponibilità", "calendar", "noleggio"),
      n("noleggi", "Contratti di noleggio", "doc", "noleggio"),
      n("tracking", "Tracking mezzi", "pulse", "noleggio"),
      n("manumezzi", "Manutenzione mezzi", "gear", "noleggio")
    ];
    if (m === "vendita") return withUfficio(vendita);
    if (m === "noleggio") return withUfficio(noleggio);
    return withUfficio(vendita.concat(noleggio));
  }

  function navItems(famiglia) {
    if (famiglia === "privato") {
      return [
        { id: "pubblica", label: "Pubblica", icon: "send", gruppo: "fisso", cuore: true },
        { id: "chat", label: "Chat", icon: "chat", gruppo: "fisso" },
        { id: "inviti", label: "Inviti", icon: "send", gruppo: "fisso" }
      ];
    }
    if (famiglia === "azienda") {
      const pack = packKey(S.data.profilo.tipoAzienda);
      const modo = fornitoreModoDi(S.data.profilo.tipoAzienda) || S.data.profilo.fornitoreModo;
      return [
        { id: "pubblica", label: "Pubblica", icon: "send", gruppo: "fisso", cuore: true },
        { id: "chat", label: "Chat", icon: "chat", gruppo: "fisso" },
        { id: "inviti", label: "Inviti", icon: "send", gruppo: "fisso" }
      ].concat(
        pack === "fornitore"
          ? packFornitore(modo)
          : PACKS[pack] || []
      );
    }
    if (famiglia === "agente") {
      return [
        { id: "pubblica", label: "Pubblica", icon: "send", gruppo: "fisso", cuore: true },
        { id: "chat", label: "Chat", icon: "chat", gruppo: "fisso" },
        { id: "catena", label: "Catena", icon: "team", gruppo: "comune" },
        { id: "guadagno", label: "Guadagno", icon: "wallet", gruppo: "comune" },
        { id: "inviti", label: "Inviti", icon: "send", gruppo: "comune" }
      ];
    }
    if (famiglia === "admin") {
      return [
        { id: "iscritti", label: "Iscritti registrati", icon: "team", gruppo: "fisso", cuore: true },
        { id: "iscrizioni", label: "Iscrizioni dal sito", icon: "send", gruppo: "fisso" },
        // 09.10.2026, su richiesta: statistiche della rivista e iscritti agli avvisi (js/magazine-admin.js).
        { id: "magazine", label: "Magazine", icon: "chart", gruppo: "fisso" },
        { id: "richieste-agenti", label: "Richieste agenti", icon: "star", gruppo: "fisso" },
        { id: "genera-link", label: "Genera link", icon: "send", gruppo: "fisso" },
        { id: "task", label: "Task", icon: "calendar", gruppo: "fisso" },
        { id: "file", label: "File", icon: "doc", gruppo: "fisso" },
        // id «chat-team» (non «chat»): «chat» è la Chat demo di Privato/Azienda/Agente.
        { id: "chat-team", label: "Chat", icon: "chat", gruppo: "fisso" }
      ];
    }
    return [];
  }

  function foldsOfTipo(tipo, modo) {
    const pack = packKey(tipo);
    const m = fornitoreModoDi(tipo) || modo;
    const items = pack === "fornitore" ? packFornitore(m) : PACKS[pack] || [];
    const out = [];
    items.forEach((it) => {
      if (it.fold && out.indexOf(it.fold) < 0) out.push(it.fold);
    });
    return out;
  }

  /* CONGELATO 20.09.2026. Impostazioni, regola A. Non cambiare visibleNav senza richiesta esplicita. Titolare: pack intero. Operatore: solo fold assegnati e accesi. Agente collaboratore: tasti in me.tasti. */
  function visibleNav(famiglia) {
    const items = navItems(famiglia);
    const me = S.utenteCorrente();
    if (!me || me.ruolo === "titolare") return items;
    if (famiglia === "azienda") {
      const on = (S.data.org && S.data.org.reparti) || {};
      const assigned = me.reparti || [];
      return items.filter((it) => {
        if (it.gruppo !== "pack") return true;
        if (on[it.fold] === false) return false;
        return assigned.indexOf(it.fold) >= 0;
      });
    }
    if (famiglia === "agente") {
      const allow = me.tasti || ["pubblica", "chat"];
      return items.filter((it) => {
        if (it.gruppo !== "comune") return true;
        return allow.indexOf(it.id) >= 0;
      });
    }
    return items;
  }

  AC.foldsOfTipo = foldsOfTipo;
  AC.packItems = function (tipo, modo) {
    const pack = packKey(tipo);
    const m = fornitoreModoDi(tipo) || modo;
    return pack === "fornitore" ? packFornitore(m) : PACKS[pack] || [];
  };
  AC.FOLD_LAB = FOLD_LAB;

  // Per l'admin il nome dopo "ADMIN ·" viene aggiunto in paintNav, letto dalla sessione Supabase.
  const LAB = { privato: "PRIVATO", azienda: "AZIENDA", agente: "AGENTE", admin: "ADMIN" };

  /* Accesso admin (22.09.2026): le pagine #/admin/* si aprono solo con una sessione Supabase
     valida di un utente presente in marketplace.admins, altrimenti si torna al login di root.
     Le tre famiglie demo (privato, azienda, agente: dati in localStorage) restano aperte. */
  const LOGIN_URL = "../index.html";
  const admin = { stato: "nuovo", tipo: "", nome: "", errore: "" };
  // Anteprima locale (?demo=privato|azienda|agente|admin): niente login.
  const demoQs = new URLSearchParams(location.search).get("demo") || "";
  const DEMO = ["privato", "azienda", "agente", "admin"].indexOf(demoQs) >= 0 ? demoQs : "";
  if (DEMO) {
    admin.stato = "ok";
    admin.tipo = DEMO;
    S.setFamiglia(DEMO);
    if (DEMO === "admin") admin.nome = "Anteprima locale";
    if (DEMO === "azienda") {
      S.updateProfilo({
        nome: "Anteprima locale - Azienda",
        zona: "Bergamo",
        tipoAzienda: "azienda_imprese_edili"
      });
    }
  }

  function conTimeout(promessa, ms) {
    return Promise.race([
      promessa,
      new Promise((_, rifiuta) => setTimeout(() => rifiuta(new Error("timeout")), ms))
    ]);
  }

  function nomeUtente(user) {
    const m = user.user_metadata || {};
    // Metadati salvati come { nome, cognome } (vedi NOTE-SCHEMA.md, "L'admin Nando ha nome e mail").
    const completo = [m.nome, m.cognome].filter(Boolean).join(" ");
    return completo || m.full_name || m.name || user.email || "";
  }

  // Login vero per tutte le aree (29.09.2026): serve una sessione Supabase valida e
  //  - admin (marketplace.admins) -> solo #/admin/*;
  //  - profilo verificato -> solo la propria famiglia (#/privato|azienda|agente/*).
  // Chi non è né l'uno né l'altro (in attesa, rifiutato, senza profilo) esce e torna al login.
  // admin.tipo dice quale area è consentita a chi è entrato.
  function verificaAdmin() {
    admin.stato = "verifica";
    if (!window.acDb) {
      admin.stato = "errore";
      admin.errore = "Collegamento al server non disponibile. Ricarica la pagina.";
      render(false);
      return;
    }
    const fuori = () => {
      const fatto = () => location.replace(LOGIN_URL);
      conTimeout(window.acDb.auth.signOut(), 8000).then(fatto, fatto);
    };
    conTimeout(window.acDb.auth.getSession(), 25000)
      .then((res) => {
        const user = res.data && res.data.session && res.data.session.user;
        if (!user) {
          location.replace(LOGIN_URL);
          return;
        }
        return Promise.all([
          conTimeout(window.acDb.from("admins").select("id").eq("id", user.id).maybeSingle(), 25000),
          conTimeout(window.acDb.from("profiles").select("*").eq("id", user.id).maybeSingle(), 25000)
        ]).then(([a, p]) => {
          if (a.error) throw a.error;
          if (p.error) throw p.error;
          if (a.data) {
            admin.tipo = "admin";
            admin.nome = nomeUtente(user);
            return;
          }
          if (!(p.data && p.data.verifica === "verificato")) {
            fuori();
            return "fuori";
          }
          admin.tipo = p.data.famiglia;
          admin.nome = p.data.nome || nomeUtente(user);
          S.usaUtente(user.id, admin.nome);
          // Profilo reale da Supabase; per l'azienda anche i luoghi (sedi, cantieri...).
          const luoghi = p.data.famiglia === "azienda"
            ? conTimeout(window.acDb.from("luoghi").select("*").eq("azienda_id", user.id).order("created_at"), 25000)
            : Promise.resolve({ data: null });
          return luoghi.then((l) => {
            if (l.error) throw l.error;
            S.applicaProfilo(p.data, l.data, user.email || "");
            // Primo ingresso con il profilo ancora da completare (01.10.2026, invito → pagina di
            // benvenuto): si atterra sul Profilo. Poi, finché non è completo, la Bacheca mostra il
            // pulsante «Completa il profilo». Una volta sola per browser e per utente.
            try {
              const chiave = "ac-primo-ingresso:" + user.id;
              if (S.data.profilo.livello !== "apro" && !localStorage.getItem(chiave)) {
                localStorage.setItem(chiave, "1");
                history.replaceState(null, "", "#/" + p.data.famiglia + "/profilo");
              }
            } catch (e) {}
            // Annunci veri: se il caricamento fallisce non blocca l'ingresso (si riprova aprendo Pubblica).
            return S.caricaAnnunci(true);
          });
        }).then((esito) => {
          if (esito === "fuori") return;
          admin.stato = "ok";
          if (admin.tipo === "admin") avviaPallino();
          render(false);
        });
      })
      .catch(() => {
        admin.stato = "errore";
        admin.errore = "Il server non risponde. Riprova tra poco.";
        render(false);
      });
  }

  function esci() {
    const fatto = () => location.replace(LOGIN_URL);
    if (!window.acDb) return fatto();
    conTimeout(window.acDb.auth.signOut(), 8000).then(fatto, fatto);
  }

  function paintGate() {
    const el = document.createElement("div");
    view.replaceChildren(el);
    if (admin.stato === "errore") {
      el.innerHTML = html`<div class="card empty"><strong>Non riesco a verificare l'accesso</strong><span>${admin.errore}</span></div>
        <div class="row-actions"><button type="button" class="tab" id="gate-riprova">Riprova</button></div>`.s;
      el.querySelector("#gate-riprova").addEventListener("click", () => {
        admin.stato = "nuovo";
        render(false);
      });
    } else {
      el.innerHTML = html`<div class="card empty"><strong>Verifica dell'accesso in corso…</strong></div>`.s;
    }
    titleEl.textContent = "Area riservata";
    subEl.textContent = "Area riservata agli iscritti.";
    document.title = "AncheCasa · Area riservata";
    dateEl.textContent = D.fmt(D.today());
    nav.innerHTML = "";
    if (navFoot) navFoot.innerHTML = "";
    if (navLab) navLab.textContent = "AREA RISERVATA";
    if (topActions) topActions.innerHTML = "";
  }

  const view = document.getElementById("view");
  const nav = document.getElementById("nav");
  const titleEl = document.getElementById("page-title");
  const subEl = document.getElementById("page-sub");
  const dateEl = document.getElementById("data-label");
  const navLab = document.getElementById("nav-lab");

  const navFoot = document.getElementById("nav-foot");
  const topActions = document.getElementById("top-actions");
  const HEADER_OPP = ["opportunita", "aste", "nuovaopportunita"];

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean);
    return { famiglia: parts[0] || "", page: parts[1] || "" };
  }

  const foldOpen = {};

  function paintTop(famiglia, page) {
    if (!topActions) return;
    if (!famiglia || famiglia === "admin") {
      topActions.innerHTML = "";
      return;
    }
    const on = HEADER_OPP.indexOf(page) >= 0;
    topActions.innerHTML = html`<a href="#/${famiglia}/opportunita" class="top-opp${on ? " on" : ""}"${on ? html` aria-current="page"` : ""}>
      ${icon("star")}Opportunità
    </a>`.s;
  }

  /* Pallino dei messaggi non letti della Chat fra admin (02.10.2026): un numero sulla voce «Chat»
     del menu (e sul tab «Altro» del telefono). Si aggiorna al login, a ogni nuovo messaggio
     (tempo reale), ogni minuto per sicurezza e quando la pagina Chat segna tutto come letto. */
  let chatNonLetti = 0;
  let chatCanale = null;
  let chatTimer = null;

  function paintPallino() {
    document.querySelectorAll('a[href$="/admin/chat-team"]').forEach((a) => {
      let b = a.querySelector(".nav-badge");
      if (chatNonLetti > 0) {
        if (!b) {
          b = document.createElement("span");
          b.className = "nav-badge";
          a.appendChild(b);
        }
        b.textContent = chatNonLetti > 9 ? "9+" : String(chatNonLetti);
      } else if (b) {
        b.remove();
      }
    });
    const altro = document.getElementById("tab-altro");
    if (altro) altro.classList.toggle("has-badge", chatNonLetti > 0);
  }

  function aggiornaPallino() {
    if (!window.acDb) return;
    window.acDb.rpc("chat_non_letti").then((res) => {
      if (res && !res.error && typeof res.data === "number" && res.data !== chatNonLetti) {
        chatNonLetti = res.data;
        paintPallino();
      }
    }, () => {});
  }

  function avviaPallino() {
    if (chatCanale || !window.acDb) return;
    aggiornaPallino();
    try {
      chatCanale = window.acDb
        .channel("admin-chat-pallino")
        .on("postgres_changes", { event: "INSERT", schema: "marketplace", table: "admin_chat" }, () => aggiornaPallino())
        .subscribe();
    } catch (e) {
      chatCanale = null;
    }
    chatTimer = setInterval(aggiornaPallino, 60000);
  }

  AC.chatPallino = { aggiorna: aggiornaPallino };

  function paintNav(famiglia, page) {
    const items = visibleNav(famiglia);
    if (!items.length) {
      nav.innerHTML = "";
      if (navFoot) navFoot.innerHTML = "";
      if (navLab) navLab.textContent = "NAVIGAZIONE";
      return;
    }
    // Nome di chi è entrato: sul pulsante della tendina in fondo al menu.
    const nomeUtente = famiglia === "admin" ? admin.nome : S.data.profilo && S.data.profilo.nome;
    // Il logo porta alla Bacheca (all'elenco iscritti per l'admin); sotto il logo non c'è più la dicitura
    // del profilo (Azienda, Privato, Admin...): il nome sta nella tendina in fondo.
    const logoLink = document.getElementById("brand-link");
    if (logoLink) logoLink.setAttribute("href", "#/" + famiglia + "/" + (famiglia === "admin" ? "iscritti" : "bacheca"));
    const top = items.filter((it) => it.gruppo !== "pack" && it.gruppo !== "piede");
    const pack = items.filter((it) => it.gruppo === "pack");
    const piede = items.filter((it) => it.gruppo === "piede");
    let htmlNav = "";
    let prev = "";
    top.forEach((it) => {
      if (prev && it.gruppo !== prev) {
        htmlNav += '<div class="nav-sep" aria-hidden="true"></div>';
      }
      prev = it.gruppo;
      const on = it.id === page;
      htmlNav += html`<a href="#/${famiglia}/${it.id}" class="${on ? "active" : ""}${it.cuore ? " cuore" : ""}"${on ? html` aria-current="page"` : ""}>
        ${icon(it.icon)}${it.label}
      </a>`.s;
    });
    const folds = [];
    pack.forEach((it) => {
      const key = it.fold || "pack";
      let g = folds.find((f) => f.id === key);
      if (!g) {
        g = { id: key, lab: FOLD_LAB[key] || key, items: [] };
        folds.push(g);
      }
      g.items.push(it);
    });
    folds.forEach((f) => {
      const inFold = f.items.some((it) => it.id === page);
      if (inFold) foldOpen[f.id] = true;
      else if (foldOpen[f.id] === undefined) foldOpen[f.id] = false;
      const open = !!foldOpen[f.id];
      htmlNav += '<div class="nav-sep" aria-hidden="true"></div>';
      htmlNav += html`<button type="button" class="nav-fold" data-fold="${f.id}" aria-expanded="${open ? "true" : "false"}">
        ${icon("folder")}${f.lab}
      </button>`.s;
      htmlNav += '<div class="nav-sub" data-sub="' + f.id + '"' + (open ? "" : " hidden") + ">";
      f.items.forEach((it) => {
        const on = it.id === page;
        htmlNav += html`<a href="#/${famiglia}/${it.id}" class="${on ? "active" : ""}"${on ? html` aria-current="page"` : ""}>
          ${icon(it.icon)}${it.label}
        </a>`.s;
      });
      htmlNav += "</div>";
    });
    nav.innerHTML = htmlNav;

    // Telefono (01.10.2026): barra delle sezioni in basso, come un'app. Fino a 5 voci stanno tutte nella barra;
    // altrimenti le prime 4 e «Altro», che apre una scheda con il resto e con le cartelle (Ufficio, Cantiere...).
    const BREVE = { bacheca: "Bacheca", iscritti: "Iscritti", iscrizioni: "Iscrizioni", "richieste-agenti": "Agenti", "genera-link": "Link", task: "Task", file: "File", "chat-team": "Chat" };
    const conAltro = folds.length > 0 || top.length > 5;
    const tabs = conAltro ? top.slice(0, 4) : top;
    const extra = conAltro ? top.slice(4) : [];
    const link = (it) => html`<a href="#/${famiglia}/${it.id}" class="${it.id === page ? "active" : ""}">${icon(it.icon)}${it.label}</a>`.s;
    const altroAttivo = extra.some((it) => it.id === page) || folds.some((f) => f.items.some((it) => it.id === page));
    let htmlTab = tabs.map((it) => html`<a href="#/${famiglia}/${it.id}" class="tab-it${it.id === page ? " active" : ""}"${it.id === page ? html` aria-current="page"` : ""}>${icon(it.icon)}<span>${BREVE[it.id] || it.label}</span></a>`.s).join("");
    if (conAltro) {
      htmlTab += html`<button type="button" class="tab-it${altroAttivo ? " active" : ""}" id="tab-altro" aria-expanded="false" aria-controls="altro">${icon("bars")}<span>Altro</span></button>`.s;
    }
    let htmlAltro = extra.map(link).join("");
    folds.forEach((f) => {
      htmlAltro += html`<div class="altro-sec">${f.lab}</div>`.s + f.items.map(link).join("");
    });
    const tabbarEl = document.getElementById("tabbar");
    const altroPanel = document.getElementById("altro-panel");
    if (tabbarEl) tabbarEl.innerHTML = htmlTab;
    if (altroPanel) altroPanel.innerHTML = htmlAltro;
    if (famiglia === "admin") paintPallino();
    nav.querySelectorAll("[data-fold]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-fold");
        foldOpen[id] = !foldOpen[id];
        btn.setAttribute("aria-expanded", foldOpen[id] ? "true" : "false");
        const sub = nav.querySelector('[data-sub="' + id + '"]');
        if (sub) sub.hidden = !foldOpen[id];
      });
    });
    const onImp = page === "impostazioni";
    const onPro = page === "profilo";
    if (navFoot) {
      let htmlFoot = "";
      if (piede.length) {
        htmlFoot += '<div class="nav-sep" aria-hidden="true"></div>';
        piede.forEach((it) => {
          const on = it.id === page;
          htmlFoot += html`<a href="#/${famiglia}/${it.id}" class="${on ? "active" : ""}"${on ? html` aria-current="page"` : ""}>
            ${icon(it.icon)}${it.label}
          </a>`.s;
        });
      }
      htmlFoot += '<div class="nav-sep" aria-hidden="true"></div>';
      // 01.10.2026, su richiesta: Profilo, Impostazioni ed Esci stanno in una tendina sotto a tutto,
      // aperta dal pulsante col nome di chi è entrato.
      let voci = "";
      if (famiglia !== "admin") {
        voci += html`<a href="#/${famiglia}/profilo" class="${onPro ? "active" : ""}"${onPro ? html` aria-current="page"` : ""}>
            ${icon("user")}Profilo
          </a>`.s;
        voci += html`<a href="#/${famiglia}/impostazioni" class="${onImp ? "active" : ""}"${onImp ? html` aria-current="page"` : ""}>
            ${icon("gear")}Impostazioni
          </a>`.s;
      }
      // Esci chiude la sessione Supabase e torna al login, per tutte le famiglie (23.09.2026:
      // prima privato/azienda/agente tornavano alla scelta demo "#/" lasciando la sessione aperta,
      // sbagliato ora che gli iscritti approvati entrano dal login vero).
      voci += '<a href="' + LOGIN_URL + '" data-esci>' + icon("exit").s + "Esci</a>";
      htmlFoot += html`<div class="acct">
        <button type="button" class="acct-btn${onPro || onImp ? " active" : ""}" id="acct-btn" aria-haspopup="true" aria-expanded="false" aria-controls="acct-menu">
          ${icon("user")}<span class="acct-name">${nomeUtente || "Il mio account"}</span><span class="acct-hi">Ciao, ${(nomeUtente || "").split(" ")[0] || "tu"}</span><span class="acct-chev" aria-hidden="true"></span>
        </button>
        <div class="acct-menu" id="acct-menu" hidden>${raw(voci)}</div>
      </div>`.s;
      navFoot.innerHTML = htmlFoot;
      const btnEsci = navFoot.querySelector("[data-esci]");
      if (btnEsci) {
        btnEsci.addEventListener("click", (e) => {
          e.preventDefault();
          esci();
        });
      }
    }
  }

  function render(fresh) {
    // Prima di tutto il login vero: finché l'accesso non è verificato si vede solo la schermata di controllo.
    // Con ?demo=… l'anteprima locale salta il gate.
    if (admin.stato !== "ok") {
      if (admin.stato === "nuovo") verificaAdmin();
      paintGate();
      return;
    }

    let { famiglia, page } = parseHash();
    const famiglie = ["privato", "azienda", "agente", "admin"];

    // Ognuno vede solo la propria area: qualsiasi altro indirizzo (anche "#/" o un'altra famiglia)
    // riporta alla sua.
    if (famiglia !== admin.tipo) {
      history.replaceState(null, "", "#/" + admin.tipo + "/" + (admin.tipo === "admin" ? "iscritti" : "bacheca"));
      ({ famiglia, page } = parseHash());
    }

    if (!famiglia) {
      page = "scegli";
    } else if (famiglie.indexOf(famiglia) < 0) {
      history.replaceState(null, "", "#/");
      famiglia = "";
      page = "scegli";
    } else {
      if (S.data.famiglia !== famiglia) S.setFamiglia(famiglia);
      if (famiglia === "azienda") {
        S.ensureOrg(foldsOfTipo(S.data.profilo.tipoAzienda, S.data.profilo.fornitoreModo));
      }
      if (famiglia === "privato") S.ensurePrivato();
      if (famiglia === "agente") S.ensureAgente();
      if (page === "credit") {
        history.replaceState(null, "", "#/" + famiglia + "/chat");
        page = "chat";
      }
      if (page === "gare") {
        history.replaceState(null, "", "#/" + famiglia + "/partecipa");
        page = "partecipa";
      }
      if (page === "condomini") {
        history.replaceState(null, "", "#/" + famiglia + "/anagrafe");
        page = "anagrafe";
      }
      const paginaDefault = famiglia === "admin" ? "iscritti" : "bacheca";
      // La Bacheca non è più un pulsante del menu (01.10.2026): si apre dal logo.
      const allowed = visibleNav(famiglia).map((it) => it.id).concat(["impostazioni", "profilo"]).concat(HEADER_OPP).concat(famiglia === "admin" ? [] : ["bacheca"]);
      if (!page || allowed.indexOf(page) < 0 || !AC.views[page]) {
        history.replaceState(null, "", "#/" + famiglia + "/" + paginaDefault);
        page = paginaDefault;
      }
    }

    // Annunci veri: aprendo Pubblica o La mia bacheca si aggiornano (al massimo ogni 20 s).
    if (famiglia !== "admin" && (page === "pubblica" || page === "bacheca")) S.caricaAnnunci(false);

    const v = AC.views[page === "scegli" ? "scegli" : page];
    const scroller = document.querySelector(".main");
    const narrow = window.matchMedia("(max-width: 980px)").matches;
    scroller.classList.toggle("is-fit", page === "profilo" && S.data.famiglia !== "azienda" && !narrow);
    const keep = scroller.scrollTop;
    const el = document.createElement("div");
    view.replaceChildren(el);
    try {
      v.render(el);
    } catch (err) {
      console.error(err);
      el.innerHTML = '<div class="card empty"><strong>Impossibile mostrare questa pagina</strong><span>Ricarica.</span></div>';
    }

    titleEl.textContent = v.title;
    subEl.textContent = v.sub;
    document.title = v.title + " · AncheCasa";
    dateEl.textContent = D.fmt(D.today());
    paintNav(famiglia, page);
    paintTop(famiglia, page);

    if (fresh) {
      scroller.scrollTop = 0;
      view.focus({ preventScroll: true });
    } else scroller.scrollTop = keep;
  }

  function tick() {
    const d = new Date();
    document.getElementById("clock").textContent =
      String(d.getHours()).padStart(2, "0") + " : " + String(d.getMinutes()).padStart(2, "0");
  }

  // Scheda «Altro» della barra in basso (mobile): si chiude scegliendo una voce, toccando fuori o cambiando pagina.
  const lato = document.querySelector(".side");
  function menuMobile(aperto) {
    const scheda = document.getElementById("altro");
    const tasto = document.getElementById("tab-altro");
    if (scheda) scheda.hidden = !aperto;
    if (tasto) tasto.setAttribute("aria-expanded", aperto ? "true" : "false");
  }
  document.getElementById("tabbar").addEventListener("click", (e) => {
    const t = e.target.closest("#tab-altro");
    if (t) menuMobile(t.getAttribute("aria-expanded") !== "true");
    else menuMobile(false);
  });
  document.getElementById("altro").addEventListener("click", (e) => {
    if (e.target.id === "altro" || e.target.closest("a")) menuMobile(false);
  });
  // Tendina account (Profilo, Impostazioni, Esci): si apre dal pulsante col nome, si chiude scegliendo
  // una voce o toccando altrove. Il menu viene ridisegnato a ogni pagina, quindi si ascolta sul contenitore.
  function tendinaAccount(aperta) {
    const b = document.getElementById("acct-btn");
    const m = document.getElementById("acct-menu");
    if (!b || !m) return;
    m.hidden = !aperta;
    b.setAttribute("aria-expanded", aperta ? "true" : "false");
  }
  lato.addEventListener("click", (e) => {
    const b = e.target.closest("#acct-btn");
    if (b) {
      tendinaAccount(b.getAttribute("aria-expanded") !== "true");
      return;
    }
    if (e.target.closest("#acct-menu a")) tendinaAccount(false);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".acct")) tendinaAccount(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") tendinaAccount(false);
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 980) menuMobile(false); });

  AC.app = { refresh: () => render(false) };
  window.addEventListener("hashchange", () => { menuMobile(false); render(true); });
  S.subscribe(() => render(false));
  // Sessione chiusa altrove (altra scheda, token scaduto): fuori dalle pagine admin.
  if (window.acDb && !DEMO) {
    window.acDb.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") location.replace(LOGIN_URL);
    });
  }
  tick();
  setInterval(tick, 15000);
  render(true);
})();
