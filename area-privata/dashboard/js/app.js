(function () {
  const AC = window.AC;
  const { html, icon, raw } = AC.ui;
  const S = AC.store;
  const D = AC.date;

  /* CONGELATO 20.09.2026. Famiglie e pulsanti. Non cambiare FOLD_LAB, UFFICIO, PACKS, packFornitore, navItems, HEADER_OPP. Non aggiungere, togliere o rinominare pieghe o tasti. Eccezione 11.10.2026, su richiesta esplicita di Nando: tasto «Home» (grafici, js/home.js) primo per admin e agenti. Eccezione 11.10.2026 sera: tasti admin Terranova, Gare private e AncheBIM (js/funzioni-interne.js), funzioni interne, non siti a parte. Eccezione 12.10.2026: tasto admin «Software» (js/software-admin.js), secondo dopo Home, con tutti i software per categoria. Eccezione 12.10.2026: tasto admin «Pulsanti per profilo» (js/pulsanti-profili.js); i menu di privato, azienda e agente mostrano solo i pulsanti che l'admin ha scelto lì. Eccezione 12.10.2026: menu admin a categorie (pieghe adm_* in FOLD_LAB). Eccezione 12.10.2026: tasti admin «Rete» e «Inviti» in cima (js/inviti-admin.js); le pagine della rete si aprono da Rete.
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
    utenze: "Luce e gas",
    // Admin a categorie (12.10.2026, su richiesta di Nando)
    adm_panoramica: "Panoramica",
    adm_iscritti: "Iscritti",
    adm_rete: "Rete commerciale",
    adm_gare: "Gare e appalti",
    adm_tecnico: "Tecnico",
    adm_comunicazione: "Comunicazione",
    adm_formazione: "Formazione",
    adm_lavoro: "Il mio lavoro",
    adm_piattaforma: "Impostazioni piattaforma",
    // Privato a categorie (12.10.2026, PROGETTO-DASHBOARD.md)
    pv_casa: "La mia casa",
    pv_bacheca: "Bacheca",
    pv_mie: "Le mie cose",
    pv_risparmio: "Risparmia",
    pv_app: "Le mie app",
    pv_passaparola: "Passaparola"
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
    committente_condominio: "committente", committente_amministratore: "committente",
    committente_grande: "committente", committente_fondo: "committente",
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
    const nascosti = { predict: 1, bim: 1, tracking: 1, recruitment: 1 };
    return { id: id, label: label, icon: iconName, gruppo: "pack", fold: fold, nascosto: !!nascosti[id] };
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
    committente: withUfficio([]),
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

  const PACK_NASCOSTO = { hse: 1, sicurezza_armata: 1, apl: 1, condominio: 1, agenzia: 1, industria: 1, logistica: 1, albergo: 1, negozio: 1 };

  function navItems(famiglia) {
    if (famiglia === "privato") {
      /* 12.10.2026, deciso da Nando (PROGETTO-DASHBOARD.md): privato a categorie, tutto gratis.
         Le pagine «pv-…» sono schede del progetto (js/privato-progetto.js) finché la funzione vera non c'è.
         Chat si apre dal fumetto in alto. */
      const c = (id, label, iconName, fold, extra) => Object.assign({ id: id, label: label, icon: iconName, gruppo: "pack", fold: fold }, extra || {});
      return [
        c("pv-guasto", "Ho un guasto", "gear", "pv_casa", { cuore: true }),
        c("pv-trova", "Trova artigiano o impresa", "team", "pv_casa"),
        c("pv-ristruttura", "Ristruttura con AncheCasa", "building", "pv_casa"),
        c("pv-mio-cantiere", "Il mio cantiere", "home", "pv_casa", { nota: "Solo con un cantiere aperto" }),
        c("pv-annunci", "Bacheca annunci", "grid", "pv_bacheca"),
        c("pubblica", "Pubblica un annuncio", "send", "pv_bacheca"),
        c("pv-mie-richieste", "Le mie richieste", "doc", "pv_mie"),
        c("pv-miei-annunci", "I miei annunci", "doc", "pv_mie"),
        c("pv-check-bollette", "Check Bollette", "wallet", "pv_risparmio"),
        c("pv-offerte-luce", "Offerte luce e gas", "pulse", "pv_risparmio"),
        c("pv-mie-app", "Le mie app", "star", "pv_app"),
        c("inviti", "Invita e guadagna credito", "star", "pv_passaparola"),
        { id: "chat", label: "Chat", icon: "chat", gruppo: "fisso", soloTestata: true }
      ];
    }
    if (famiglia === "azienda") {
      const pack = packKey(S.data.profilo.tipoAzienda);
      const modo = fornitoreModoDi(S.data.profilo.tipoAzienda) || S.data.profilo.fornitoreModo;
      return [
        { id: "pubblica", label: "Pubblica", icon: "send", gruppo: "fisso", cuore: true },
        { id: "chat", label: "Chat", icon: "chat", gruppo: "fisso" },
        { id: "inviti", label: "Inviti", icon: "send", gruppo: "fisso" },
        { id: "tuo-mese", label: "Il tuo mese", icon: "chart", gruppo: "comune" }
      ].concat(
        pack === "fornitore"
          ? packFornitore(modo)
          : PACKS[pack] || []
      );
    }
    if (famiglia === "agente") {
      const voci = [
        // 11.10.2026, su richiesta: Home con grafici e andamenti (js/home.js), primo tasto anche sul telefono.
        { id: "home", label: "Home", icon: "home", gruppo: "fisso" },
        { id: "pubblica", label: "Pubblica", icon: "send", gruppo: "fisso", cuore: true },
        { id: "mio-ruolo", label: "Il mio ruolo", icon: "star", gruppo: "fisso" },
        { id: "documenti", label: "Documenti", icon: "doc", gruppo: "fisso" },
        { id: "chat", label: "Chat", icon: "chat", gruppo: "fisso" },
        { id: "catena", label: "Catena", icon: "team", gruppo: "comune" },
        { id: "guadagno", label: "Guadagno", icon: "wallet", gruppo: "comune" },
        { id: "inviti", label: "Inviti", icon: "send", gruppo: "comune" },
        { id: "linee-decise", label: "Linee decise", icon: "doc", gruppo: "fisso" }
      ];
      if (window.AC && AC.direzione && AC.direzione.vedeSala()) {
        voci.push({ id: "strategia", label: "Sala strategia", icon: "chat", gruppo: "fisso" });
      }
      return voci;
    }
    if (famiglia === "admin") {
      /* 12.10.2026, su richiesta di Nando: menu admin a categorie (cartelle che si aprono, come quelle
         delle aziende). Home resta sola in cima. La colonna di icone a sinistra è tolta: Chat si apre
         dal fumetto in alto a destra (soloTestata: pagina permessa ma non nel menu); Task e File stanno in «Il mio lavoro». */
      const c = (id, label, iconName, fold, extra) => Object.assign({ id: id, label: label, icon: iconName, gruppo: "pack", fold: fold }, extra || {});
      const voci = [
        // 11.10.2026, su richiesta: Home con grafici e andamenti di tutta la rete (js/home.js).
        { id: "home", label: "Home", icon: "home", gruppo: "fisso" },
        // 12.10.2026, su richiesta: Rete e Inviti come pulsanti in cima (js/inviti-admin.js).
        { id: "rete-admin", label: "Rete", icon: "team", gruppo: "fisso" },
        { id: "inviti-admin", label: "Inviti", icon: "send", gruppo: "fisso" },
        // Pagine della rete: si aprono dalla pagina Rete, non dal menu (soloTestata).
        c("oggi-rete", "Oggi", "chart", "adm_rete", { soloTestata: true }),
        c("appunti", "Appunti", "doc", "adm_panoramica"),
        c("iscritti", "Iscritti registrati", "team", "adm_iscritti", { cuore: true }),
        c("iscrizioni", "Iscrizioni dal sito", "send", "adm_iscritti"),
        c("richieste-agenti", "Richieste agenti", "star", "adm_rete", { soloTestata: true }),
        c("affida", "Clienti da affidare", "team", "adm_iscritti"),
        // Genera link resta raggiungibile, ma gli inviti si fanno da «Inviti».
        c("genera-link", "Genera link", "send", "adm_iscritti", { soloTestata: true }),
        c("proposte-rete", "Segnalazioni rete", "team", "adm_rete", { soloTestata: true }),
        c("lavori-rete", "Lavori rete", "doc", "adm_rete", { soloTestata: true }),
        c("contratti", "Contratti", "doc", "adm_rete", { soloTestata: true }),
        c("strategia", "Sala strategia", "chat", "adm_rete", { soloTestata: true }),
        // 11.10.2026, su richiesta: AncheBandi è un software della dashboard admin, non un sito a parte.
        c("bandi", "Bandi", "doc", "adm_gare"),
        c("terranova", "Terranova", "doc", "adm_gare"),
        c("gare-private", "Gare private", "doc", "adm_gare"),
        c("anchebim", "AncheBIM", "building", "adm_tecnico"),
        // 09.10.2026, su richiesta: statistiche della rivista e iscritti agli avvisi (js/magazine-admin.js).
        c("magazine", "Magazine", "chart", "adm_comunicazione"),
        // 12.10.2026, su richiesta: un documento di regole per ogni profilo, per la formazione della rete (js/regole-admin.js).
        // 12.10.2026, su richiesta: Sala demo per presentare AncheCasa alla rete (js/sala-demo.js).
        c("sala-demo", "Sala demo", "star", "adm_formazione"),
        c("regole", "Regole iscritti", "doc", "adm_formazione"),
        // id «chat-team» (non «chat»): «chat» è la Chat demo di Privato/Azienda/Agente.
        c("chat-team", "Chat", "chat", "adm_lavoro", { soloTestata: true }),
        c("task", "Task", "calendar", "adm_lavoro"),
        c("file", "File", "folder", "adm_lavoro"),
        // 12.10.2026, su richiesta: tutti i software per categoria (js/software-admin.js).
        c("software", "Software", "grid", "adm_piattaforma"),
        // 12.10.2026, su richiesta: l'admin decide i pulsanti di ogni profilo (js/pulsanti-profili.js).
        c("pulsanti", "Pulsanti per profilo", "gear", "adm_piattaforma")
      ];
      // 11.10.2026: Francesco, dal suo computer, trova gli appunti come prima pagina e come prima voce.
      if (admin.perFrancesco) {
        const i = voci.findIndex((v) => v.id === "appunti");
        voci.splice(i, 1);
        voci.unshift({ id: "appunti", label: "Appunti", icon: "doc", gruppo: "fisso" });
      }
      return voci;
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

  /* Pulsanti per profilo (12.10.2026, su richiesta esplicita di Nando). I profili che l'admin configura
     e, per ciascuno, tutti i pulsanti che può avere. Le scelte sono in js/pulsanti-profili.js. */
  const PROFILI_PULSANTI = [
    { k: "privato", nome: "Privato", famiglia: "privato" },
    { k: "azienda:impresa", nome: "Impresa edile", famiglia: "azienda", pack: "impresa" },
    { k: "azienda:subappaltatore", nome: "Subappaltatore", famiglia: "azienda", pack: "subappaltatore" },
    { k: "azienda:impiantista", nome: "Impiantista", famiglia: "azienda", pack: "impiantista" },
    { k: "azienda:artigiano", nome: "Artigiano", famiglia: "azienda", pack: "artigiano" },
    { k: "azienda:professionista", nome: "Studio tecnico", famiglia: "azienda", pack: "professionista" },
    { k: "azienda:fornitore", nome: "Fornitore (materiali, noleggio, IT)", famiglia: "azienda", pack: "fornitore" },
    { k: "azienda:energia", nome: "Luce e gas", famiglia: "azienda", pack: "energia" },
    { k: "azienda:committente", nome: "Committente (condominio, amministratore, fondi)", famiglia: "azienda", pack: "committente" },
    { k: "agente", nome: "Rete (agenti e ruoli)", famiglia: "agente" }
  ];
  const GRUPPO_LAB = { fisso: "In alto nel menu", comune: "In alto nel menu" };
  function catalogoPulsanti(prof) {
    let voci;
    if (prof.famiglia === "azienda") {
      voci = [
        { id: "pubblica", label: "Pubblica", icon: "send", gruppo: "fisso" },
        { id: "chat", label: "Chat", icon: "chat", gruppo: "fisso" },
        { id: "inviti", label: "Inviti", icon: "send", gruppo: "fisso" },
        { id: "tuo-mese", label: "Il tuo mese", icon: "chart", gruppo: "comune" }
      ].concat(prof.pack === "fornitore" ? packFornitore("entrambi") : PACKS[prof.pack] || []);
    } else if (prof.famiglia === "agente") {
      voci = navItems("agente");
      if (!voci.some((v) => v.id === "strategia")) voci = voci.concat([{ id: "strategia", label: "Sala strategia", icon: "chat", gruppo: "fisso", nota: "Solo per chi è nella direzione" }]);
    } else {
      voci = navItems(prof.famiglia);
    }
    const visti = {};
    return voci.filter((it) => {
      if (it.nascosto || visti[it.id]) return false;
      visti[it.id] = true;
      return true;
    }).map((it) => Object.assign({}, it, { gruppoLab: it.gruppo === "pack" ? FOLD_LAB[it.fold] || it.fold : GRUPPO_LAB[it.gruppo] || "Menu" }));
  }
  function profiloPulsanti(famiglia) {
    if (famiglia === "azienda") return "azienda:" + packKey(S.data.profilo && S.data.profilo.tipoAzienda);
    return famiglia;
  }
  /** "gratis" | "pagamento" | "" per il pulsante id nel menu della famiglia. L'admin vede tutto. */
  function statoPulsante(famiglia, id) {
    if (famiglia === "admin") return "gratis";
    return AC.pulsanti ? AC.pulsanti.stato(profiloPulsanti(famiglia), id) : "";
  }
  AC.profiliPulsanti = () => PROFILI_PULSANTI.slice();
  AC.catalogoPulsanti = catalogoPulsanti;

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
  const admin = { stato: "nuovo", tipo: "", nome: "", errore: "", perFrancesco: false };

  function sembraFrancesco(user) {
    const m = (user && user.user_metadata) || {};
    const mail = String((user && user.email) || "");
    const chiocciola = mail.indexOf("@");
    const pezzi = [m.nome, m.cognome, m.full_name, m.name, chiocciola > 0 ? mail.slice(0, chiocciola) : ""];
    return pezzi.filter(Boolean).join(" ").toLowerCase().indexOf("francesco") >= 0;
  }

  function primaPagina(tipo) {
    if (tipo === "admin") return admin.perFrancesco ? "appunti" : "home";
    if (tipo === "agente") return "home";
    return "bacheca";
  }
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
            admin.perFrancesco = sembraFrancesco(user);
            return;
          }
          admin.perFrancesco = false;
          if (!(p.data && p.data.verifica === "verificato")) {
            fuori();
            return "fuori";
          }
          // 12.10.2026: il fornitore usa la dashboard dell'azienda.
          admin.tipo = p.data.famiglia === "fornitore" ? "azienda" : p.data.famiglia;
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
          if (esito === "fuori") return esito;
          // 12.10.2026: i pulsanti scelti dall'admin si leggono prima di disegnare il menu.
          return AC.pulsanti ? AC.pulsanti.carica().then(() => esito) : esito;
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
    topActions.innerHTML = "";
    /* 11.10.2026: Opportunità, aste e credit non si mostrano. Le pagine restano in views.js. */
  }

  /* Pallino dei messaggi non letti della Chat fra admin (02.10.2026): un numero sulla voce «Chat»
     del menu (e sul tab «Altro» del telefono). Si aggiorna al login, a ogni nuovo messaggio
     (tempo reale), ogni minuto per sicurezza e quando la pagina Chat segna tutto come letto. */
  let chatNonLetti = 0;
  let proposteDaDecidere = 0;
  let chatCanale = null;
  let chatTimer = null;

  function paintPallino() {
    document.querySelectorAll('a[href$="/admin/chat-team"]').forEach((a) => {
      const cls = a.classList.contains("hi-btn") ? "hi-num" : "nav-badge";
      let b = a.querySelector("." + cls);
      if (chatNonLetti > 0) {
        if (!b) {
          b = document.createElement("span");
          b.className = cls;
          a.appendChild(b);
        }
        b.textContent = chatNonLetti > 9 ? "9+" : String(chatNonLetti);
      } else if (b) {
        b.remove();
      }
    });
    const altro = document.getElementById("tab-altro");
    if (altro) altro.classList.toggle("has-badge", chatNonLetti > 0 || proposteDaDecidere > 0);
  }

  AC.reteBadge = function (n) {
    proposteDaDecidere = n || 0;
    paintPallino();
  };

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

  function voceMenu(it, famiglia) {
    if (!it || it.nascosto) return false;
    // 12.10.2026: fuori dall'admin si vede solo ciò che l'admin ha scelto in «Pulsanti per profilo».
    if (!statoPulsante(famiglia, it.id)) return false;
    if (famiglia === "azienda") {
      const pack = packKey(S.data.profilo && S.data.profilo.tipoAzienda);
      if (PACK_NASCOSTO[pack] && it.gruppo === "pack" && it.fold !== "ufficio") return false;
    }
    return true;
  }

  function segnoPagamento(famiglia, id) {
    return statoPulsante(famiglia, id) === "pagamento" ? html`<span class="nav-paga" title="A pagamento">€</span>` : "";
  }

  /* Testata (12.10.2026, anteprima per Nando): al posto della colonna di icone, in alto a destra
     Messaggi (con i non letti) e Avvisi (cose da fare). Gli avvisi veri si decidono profilo per profilo:
     per ora l'admin vede chat non lette e segnalazioni da decidere; in anteprima ci sono esempi. */
  let avvisiAperto = false;
  function avvisiDi(famiglia) {
    if (DEMO) {
      return famiglia === "admin"
        ? [
            { ico: "team", t: "3 iscrizioni dal sito da guardare", s: "Oggi", href: "#/admin/iscrizioni" },
            { ico: "star", t: "2 segnalazioni rete da decidere", s: "Da ieri", href: "#/admin/proposte-rete" },
            { ico: "doc", t: "1 contratto in attesa di firma", s: "Mario Rossi, agente", href: "#/admin/contratti" },
            { ico: "calendar", t: "Gara «Scuola di Teano» scade tra 5 giorni", s: "Terranova", href: "#/admin/terranova" }
          ]
        : [
            { ico: "doc", t: "Completa il profilo", s: "Manca il telefono", href: "#/" + famiglia + "/profilo" }
          ];
    }
    const out = [];
    if (famiglia === "admin" && proposteDaDecidere > 0) {
      out.push({ ico: "star", t: proposteDaDecidere + (proposteDaDecidere === 1 ? " segnalazione da decidere" : " segnalazioni da decidere"), s: "Rete commerciale", href: "#/admin/proposte-rete" });
    }
    return out;
  }
  function paintTestata(famiglia, page) {
    const box = document.getElementById("head-icons");
    if (!box) return;
    if (!famiglia || famiglia === "") { box.innerHTML = ""; return; }
    const chatId = famiglia === "admin" ? "chat-team" : "chat";
    const vedeChat = famiglia === "admin" || statoPulsante(famiglia, chatId);
    const nMsg = famiglia === "admin" ? chatNonLetti : 0;
    const avvisi = avvisiDi(famiglia);
    const num = (n) => (n > 0 ? html`<span class="hi-num">${n > 9 ? "9+" : String(n)}</span>` : "");
    box.innerHTML = html`
      ${vedeChat ? html`<a class="hi-btn${page === chatId ? " on" : ""}" href="#/${famiglia}/${chatId}" title="Messaggi" aria-label="Messaggi${nMsg ? ", " + nMsg + " non letti" : ""}">${icon("chat")}${num(DEMO && famiglia === "admin" ? 4 : nMsg)}</a>` : ""}
      <div class="hi-avvisi">
        <button type="button" class="hi-btn" id="hi-avvisi" title="Avvisi" aria-label="Avvisi${avvisi.length ? ", " + avvisi.length : ""}" aria-expanded="${avvisiAperto ? "true" : "false"}" aria-controls="hi-pannello">${icon("bell")}${num(avvisi.length)}</button>
        <div class="hi-pannello" id="hi-pannello"${avvisiAperto ? "" : " hidden"}>
          <h3>Da fare</h3>
          ${avvisi.length
            ? avvisi.map((a) => html`<a class="hi-voce" href="${a.href}"><span class="hi-ico">${icon(a.ico)}</span><span><b>${a.t}</b><small>${a.s}</small></span></a>`)
            : html`<div class="hi-vuoto">Niente da fare adesso.</div>`}
        </div>
      </div>`.s;
    const b = box.querySelector("#hi-avvisi");
    if (b) b.addEventListener("click", (e) => {
      e.stopPropagation();
      avvisiAperto = !avvisiAperto;
      paintTestata(famiglia, page);
    });
    box.querySelectorAll(".hi-voce").forEach((a) => a.addEventListener("click", () => { avvisiAperto = false; }));
  }
  document.addEventListener("click", (e) => {
    if (avvisiAperto && !e.target.closest(".hi-avvisi")) {
      avvisiAperto = false;
      const p = document.getElementById("hi-pannello");
      const b = document.getElementById("hi-avvisi");
      if (p) p.hidden = true;
      if (b) b.setAttribute("aria-expanded", "false");
    }
  });

  function paintNav(famiglia, page) {
    // 12.10.2026: le voci «soloTestata» (Chat dell'admin) si aprono dalla testata, non dal menu.
    const items = visibleNav(famiglia).filter((it) => voceMenu(it, famiglia) && !it.soloTestata);
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
    if (logoLink) logoLink.setAttribute("href", "#/" + famiglia + "/" + (famiglia === "admin" ? "home" : "bacheca"));
    const headLogo = document.getElementById("head-logo");
    if (headLogo && logoLink) headLogo.setAttribute("href", logoLink.getAttribute("href"));
    // 11.10.2026: colonna di icone rapide a sinistra (solo da computer), prese dalle voci che la persona vede già.
    const railEl = document.getElementById("rail");
    if (railEl) {
      const RAPIDE = ["home", "chat-team", "chat", "task", "documenti", "contratti", "file", "pubblica"];
      const vede = items.filter((it) => it.gruppo !== "piede"); // 12.10.2026: anche le voci dentro le categorie
      railEl.innerHTML = RAPIDE.map((id) => vede.find((it) => it.id === id)).filter(Boolean).slice(0, 5)
        .map((it) => html`<a class="rail-btn${it.id === page ? " active" : ""}" href="#/${famiglia}/${it.id}" title="${it.label}" aria-label="${it.label}"${it.id === page ? html` aria-current="page"` : ""}>${icon(it.id === "file" ? "folder" : it.icon)}</a>`.s).join("");
    }
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
        ${icon(it.icon)}${it.label}${segnoPagamento(famiglia, it.id)}
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
      if (htmlNav) htmlNav += '<div class="nav-sep" aria-hidden="true"></div>'; // 12.10.2026: niente riga sopra la prima cartella
      htmlNav += html`<button type="button" class="nav-fold" data-fold="${f.id}" aria-expanded="${open ? "true" : "false"}">
        ${icon("folder")}${f.lab}
      </button>`.s;
      htmlNav += '<div class="nav-sub" data-sub="' + f.id + '"' + (open ? "" : " hidden") + ">";
      f.items.forEach((it) => {
        const on = it.id === page;
        htmlNav += html`<a href="#/${famiglia}/${it.id}" class="${on ? "active" : ""}"${on ? html` aria-current="page"` : ""}>
          ${icon(it.icon)}${it.label}${segnoPagamento(famiglia, it.id)}
        </a>`.s;
      });
      htmlNav += "</div>";
    });
    nav.innerHTML = htmlNav;

    // Telefono (01.10.2026): barra delle sezioni in basso, come un'app. Fino a 5 voci stanno tutte nella barra;
    // altrimenti le prime 4 e «Altro», che apre una scheda con il resto e con le cartelle (Ufficio, Cantiere...).
    const BREVE = { home: "Home", software: "Software", pulsanti: "Pulsanti", "rete-admin": "Rete", "inviti-admin": "Inviti", "sala-demo": "Demo", regole: "Regole", bacheca: "Bacheca", iscritti: "Iscritti", appunti: "Appunti", bandi: "Bandi", terranova: "Terranova", "gare-private": "Gare", anchebim: "BIM", contratti: "Contratti", affida: "Affida", iscrizioni: "Iscrizioni", "richieste-agenti": "Agenti", "proposte-rete": "Segnala", "oggi-rete": "Oggi", strategia: "Strategia", "lavori-rete": "Lavori", "linee-decise": "Linee", "tuo-mese": "Mese", "genera-link": "Link", task: "Task", file: "File", "chat-team": "Chat", "mio-ruolo": "Ruolo", documenti: "Documenti" };
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
    if (famiglia === "admin") {
      paintPallino();
      if (window.AC && AC.rete && AC.rete.badge) AC.rete.badge();
      if (window.AC && AC.direzione && AC.direzione.badge) AC.direzione.badge();
    }
    if (famiglia === "agente" && window.AC && AC.contratti && AC.contratti.badge) AC.contratti.badge();
    if ((famiglia === "agente" || famiglia === "azienda") && window.AC && AC.direzione && AC.direzione.prepara) AC.direzione.prepara();
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
      history.replaceState(null, "", "#/" + admin.tipo + "/" + primaPagina(admin.tipo));
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
      if (["credit", "opportunita", "aste", "nuovaopportunita", "predict", "bim", "tracking", "recruitment"].indexOf(page) >= 0) {
        history.replaceState(null, "", "#/" + famiglia + "/" + primaPagina(famiglia));
        page = primaPagina(famiglia);
      }
      if (page === "gare") {
        history.replaceState(null, "", "#/" + famiglia + "/partecipa");
        page = "partecipa";
      }
      if (page === "condomini") {
        history.replaceState(null, "", "#/" + famiglia + "/anagrafe");
        page = "anagrafe";
      }
      const paginaDefault = primaPagina(famiglia);
      // La Bacheca non è più un pulsante del menu (01.10.2026): si apre dal logo.
      const allowed = visibleNav(famiglia).filter((it) => voceMenu(it, famiglia)).map((it) => it.id).concat(["impostazioni", "profilo", "passo"]).concat(famiglia === "admin" ? [] : ["bacheca"]);
      // 12.10.2026: se la prima pagina non è tra i pulsanti scelti dall'admin, si arriva alla Bacheca.
      const arrivo = allowed.indexOf(paginaDefault) >= 0 || famiglia === "admin" ? paginaDefault : "bacheca";
      if (!page || allowed.indexOf(page) < 0 || !AC.views[page]) {
        history.replaceState(null, "", "#/" + famiglia + "/" + arrivo);
        page = arrivo;
      }
    }

    // Annunci veri: aprendo Pubblica o La mia bacheca si aggiornano (al massimo ogni 20 s).
    if (famiglia !== "admin" && (page === "pubblica" || page === "bacheca")) S.caricaAnnunci(false);

    let v = AC.views[page === "scegli" ? "scegli" : page];
    // 12.10.2026: pulsante a pagamento. Per ora si vede che esiste, la funzione si attiva con AncheCasa.
    if (famiglia && famiglia !== "admin" && statoPulsante(famiglia, page) === "pagamento") {
      const vera = v;
      v = {
        title: vera.title,
        sub: vera.sub,
        render(el) {
          el.innerHTML = html`<div class="card empty"><strong>${vera.title} è a pagamento</strong><span>Per attivarla scrivi ad AncheCasa dalla Chat o parla con il tuo consulente.</span></div>`.s;
        }
      };
    }
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

    // 12.10.2026: per il privato alcune pagine di oggi hanno il nome nuovo deciso nel progetto.
    const rin = famiglia === "privato" && AC.privatoProgetto && AC.privatoProgetto.RINOMINA[page];
    titleEl.textContent = rin ? rin.title : v.title;
    subEl.textContent = rin ? rin.note : v.sub;
    document.title = v.title + " · AncheCasa";
    dateEl.textContent = D.fmt(D.today());
    paintNav(famiglia, page);
    paintTestata(famiglia, page);
    paintTop(famiglia, page);
    // 11.10.2026: area della rete in sola lettura finché il contratto non è firmato (js/contratto-firma.js).
    if (window.AC && AC.contrattoFirma) AC.contrattoFirma.applica(famiglia, page);

    if (fresh) {
      scroller.scrollTop = 0;
      view.focus({ preventScroll: true });
    } else scroller.scrollTop = keep;
  }

  function tick() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    document.getElementById("clock").textContent = hh + " : " + mm;
    // 11.10.2026: data e orologio in alto a sinistra (solo da computer, css/aspetto-dock.css).
    const metti = (id, t) => { const x = document.getElementById(id); if (x) x.textContent = t; };
    metti("when-h", hh);
    metti("when-m", mm);
    metti("when-day", String(d.getDate()).padStart(2, "0"));
    metti("when-mon", ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"][d.getMonth()]);
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
  AC.adminNome = () => admin.nome || "";
  tick();
  setInterval(tick, 15000);
  // Anteprima locale: i pulsanti scelti si leggono dal browser prima del primo disegno.
  if (DEMO && AC.pulsanti) AC.pulsanti.carica().then(() => render(true), () => render(true));
  else render(true);
})();
