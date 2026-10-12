/* MATERIALI EDILI · NOLEGGIO · SERVIZI PER LA CASA (12.10.2026, decisioni di Nando 10:47, PROGETTO-DASHBOARD.md, app-21).
   Fornitori a preventivo con la zona:
     · la richiesta arriva a chi copre la zona del cantiere, dal più vicino (stesso comune, stessa provincia, zona coperta);
     · i prezzi si vedono solo nel preventivo; ordine e pagamento fuori da AncheCasa;
     · nome, contatti e indirizzo del cliente solo dopo la scelta;
     · nessuna provvigione e nessun accordo (pagheranno per stare su AncheCasa, da decidere);
     · materiali e noleggio li chiedono le aziende (il privato no); i servizi per la casa anche il privato;
     · noleggio: mezzi e calendario del noleggiatore, l'impresa vede subito cosa è libero;
     · rete: il commerciale chiede per un cliente, a lavoro chiuso la vendita è sua.
   Fornitore: Home · Richieste · Preventivi · Ordini (o Noleggi, Lavori) · [I miei mezzi] · La mia zona.
   Anteprima (?demo=…): dati di esempio in questo browser, niente sul database e nessuna mail. */
(function () {
  const AC = window.AC;
  const { html, toast } = AC.ui;
  const S = AC.store;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;

  /* Province italiane: sigla, nome, regione. */
  const PROVINCE = [
    ["AQ", "L'Aquila", "Abruzzo"], ["CH", "Chieti", "Abruzzo"], ["PE", "Pescara", "Abruzzo"], ["TE", "Teramo", "Abruzzo"],
    ["MT", "Matera", "Basilicata"], ["PZ", "Potenza", "Basilicata"],
    ["CZ", "Catanzaro", "Calabria"], ["CS", "Cosenza", "Calabria"], ["KR", "Crotone", "Calabria"], ["RC", "Reggio Calabria", "Calabria"], ["VV", "Vibo Valentia", "Calabria"],
    ["AV", "Avellino", "Campania"], ["BN", "Benevento", "Campania"], ["CE", "Caserta", "Campania"], ["NA", "Napoli", "Campania"], ["SA", "Salerno", "Campania"],
    ["BO", "Bologna", "Emilia-Romagna"], ["FE", "Ferrara", "Emilia-Romagna"], ["FC", "Forlì-Cesena", "Emilia-Romagna"], ["MO", "Modena", "Emilia-Romagna"], ["PR", "Parma", "Emilia-Romagna"], ["PC", "Piacenza", "Emilia-Romagna"], ["RA", "Ravenna", "Emilia-Romagna"], ["RE", "Reggio Emilia", "Emilia-Romagna"], ["RN", "Rimini", "Emilia-Romagna"],
    ["GO", "Gorizia", "Friuli-Venezia Giulia"], ["PN", "Pordenone", "Friuli-Venezia Giulia"], ["TS", "Trieste", "Friuli-Venezia Giulia"], ["UD", "Udine", "Friuli-Venezia Giulia"],
    ["FR", "Frosinone", "Lazio"], ["LT", "Latina", "Lazio"], ["RI", "Rieti", "Lazio"], ["RM", "Roma", "Lazio"], ["VT", "Viterbo", "Lazio"],
    ["GE", "Genova", "Liguria"], ["IM", "Imperia", "Liguria"], ["SP", "La Spezia", "Liguria"], ["SV", "Savona", "Liguria"],
    ["BG", "Bergamo", "Lombardia"], ["BS", "Brescia", "Lombardia"], ["CO", "Como", "Lombardia"], ["CR", "Cremona", "Lombardia"], ["LC", "Lecco", "Lombardia"], ["LO", "Lodi", "Lombardia"], ["MN", "Mantova", "Lombardia"], ["MI", "Milano", "Lombardia"], ["MB", "Monza e Brianza", "Lombardia"], ["PV", "Pavia", "Lombardia"], ["SO", "Sondrio", "Lombardia"], ["VA", "Varese", "Lombardia"],
    ["AN", "Ancona", "Marche"], ["AP", "Ascoli Piceno", "Marche"], ["FM", "Fermo", "Marche"], ["MC", "Macerata", "Marche"], ["PU", "Pesaro e Urbino", "Marche"],
    ["CB", "Campobasso", "Molise"], ["IS", "Isernia", "Molise"],
    ["AL", "Alessandria", "Piemonte"], ["AT", "Asti", "Piemonte"], ["BI", "Biella", "Piemonte"], ["CN", "Cuneo", "Piemonte"], ["NO", "Novara", "Piemonte"], ["TO", "Torino", "Piemonte"], ["VB", "Verbano-Cusio-Ossola", "Piemonte"], ["VC", "Vercelli", "Piemonte"],
    ["BA", "Bari", "Puglia"], ["BT", "Barletta-Andria-Trani", "Puglia"], ["BR", "Brindisi", "Puglia"], ["FG", "Foggia", "Puglia"], ["LE", "Lecce", "Puglia"], ["TA", "Taranto", "Puglia"],
    ["CA", "Cagliari", "Sardegna"], ["NU", "Nuoro", "Sardegna"], ["OR", "Oristano", "Sardegna"], ["SS", "Sassari", "Sardegna"], ["SU", "Sud Sardegna", "Sardegna"],
    ["AG", "Agrigento", "Sicilia"], ["CL", "Caltanissetta", "Sicilia"], ["CT", "Catania", "Sicilia"], ["EN", "Enna", "Sicilia"], ["ME", "Messina", "Sicilia"], ["PA", "Palermo", "Sicilia"], ["RG", "Ragusa", "Sicilia"], ["SR", "Siracusa", "Sicilia"], ["TP", "Trapani", "Sicilia"],
    ["AR", "Arezzo", "Toscana"], ["FI", "Firenze", "Toscana"], ["GR", "Grosseto", "Toscana"], ["LI", "Livorno", "Toscana"], ["LU", "Lucca", "Toscana"], ["MS", "Massa-Carrara", "Toscana"], ["PI", "Pisa", "Toscana"], ["PT", "Pistoia", "Toscana"], ["PO", "Prato", "Toscana"], ["SI", "Siena", "Toscana"],
    ["BZ", "Bolzano", "Trentino-Alto Adige"], ["TN", "Trento", "Trentino-Alto Adige"],
    ["PG", "Perugia", "Umbria"], ["TR", "Terni", "Umbria"],
    ["AO", "Aosta", "Valle d'Aosta"],
    ["BL", "Belluno", "Veneto"], ["PD", "Padova", "Veneto"], ["RO", "Rovigo", "Veneto"], ["TV", "Treviso", "Veneto"], ["VE", "Venezia", "Veneto"], ["VR", "Verona", "Veneto"], ["VI", "Vicenza", "Veneto"]
  ];
  const PROV = {}; PROVINCE.forEach((p) => { PROV[p[0]] = p; });
  const REGIONI = [...new Set(PROVINCE.map((p) => p[2]))];
  const optProvince = (sel) => REGIONI.map((r) => html`<optgroup label="${r}">${PROVINCE.filter((p) => p[2] === r).map((p) => html`<option value="${p[0]}"${sel === p[0] ? " selected" : ""}>${p[1]} (${p[0]})</option>`)}</optgroup>`);

  const CAT = {
    materiali: {
      pre: "mat", nome: "Materiali edili", sigla: "AC-MT", tipoAzienda: "azienda_materiali_edili", ordini: "Ordini", chiuso: "Consegnato", chiudi: "Segna consegnato",
      perche: "Scrivi cosa ti serve e dove. Ti rispondono i fornitori di materiali che coprono la zona del cantiere, partendo dal più vicino.",
      dataLab: "Consegna entro il", ph: "Es. cemento 32,5 R", um: "sacchi"
    },
    noleggio: {
      pre: "nol", nome: "Noleggio", sigla: "AC-NL", tipoAzienda: "azienda_noleggio_attrezzature", ordini: "Noleggi", chiuso: "Noleggio finito", chiudi: "Segna noleggio finito",
      perche: "Guarda cosa è libero nella zona del cantiere e chiedi il preventivo. Rispondono i noleggiatori della zona, dal più vicino.",
      dataLab: "Dal", ph: "Es. miniescavatore 3,5 t", um: "pz",
      mezzi: ["Miniescavatore", "Escavatore", "Minipala", "Ponteggio", "Piattaforma aerea", "Gru", "Autocarro", "Betoniera", "Generatore", "Attrezzatura", "Altro"]
    },
    casa: {
      pre: "cas", nome: "Servizi per la casa", sigla: "AC-SC", tipoAzienda: "azienda_traslochi", ordini: "Lavori", chiuso: "Lavoro fatto", chiudi: "Segna lavoro fatto",
      perche: "Trasloco, pulizie, giardino: descrivi cosa ti serve. Ti rispondono le ditte AncheCasa della tua zona, dalla più vicina.",
      dataLab: "Quando", ph: "Es. trasloco bilocale, 3° piano senza ascensore", um: "",
      tipi: { trasloco: "Trasloco", facchinaggio: "Facchinaggio", sgombero: "Sgombero", pulizie: "Pulizie", sanificazione: "Sanificazione", giardinaggio: "Giardinaggio", manutenzione: "Piccola manutenzione" }
    },
    // 12.10.2026, app-24: piccoli lavori dei privati alle imprese della zona (massimo 5), l'admin è sempre avvisato.
    lavori: {
      pre: "lav", nome: "Piccoli lavori", sigla: "AC-LV", tipoAzienda: "azienda_imprese_edili", ordini: "Lavori", chiuso: "Lavoro fatto", chiudi: "Segna lavoro fatto",
      perche: "Descrivi il lavoro: ti rispondono fino a cinque imprese AncheCasa verificate della tua zona, dalla più vicina. AncheCasa segue la richiesta.",
      dataLab: "Quando", ph: "Es. tinteggiare 3 stanze e il corridoio, circa 90 m²", um: "",
      tipi: { muratura: "Opere murarie", bagno: "Bagno", tinteggiatura: "Tinteggiatura", elettrico: "Impianto elettrico", idraulico: "Impianto idraulico", clima: "Climatizzazione", infissi: "Infissi", tetto: "Tetto e impermeabilizzazione", pavimenti: "Pavimenti", altro: "Altro" }
    }
  };
  const conTipo = (cat) => cat === "casa" || cat === "lavori";
  const TIPI_DI_AZIENDA = { azienda_traslochi: ["trasloco", "facchinaggio", "sgombero"], azienda_facchinaggio: ["facchinaggio", "trasloco", "sgombero"], azienda_pulizie: ["pulizie", "sanificazione"], azienda_manutenzione_stabili: ["giardinaggio", "manutenzione"] };
  const VICINO = ["Stesso comune", "Stessa provincia", "In zona"];
  const STATO_P = { inviata: ["wait", "Inviato"], accettata: ["ok", "Scelto dal cliente"], rifiutata: ["paused", "Non scelto"], chiusa: ["ok", "Chiuso"] };
  const STATO_R = { aperta: ["wait", "In attesa di preventivi"], scelta: ["ok", "Scelta fatta"], chiusa: ["ok", "Chiusa"], annullata: ["paused", "Annullata"] };

  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/\./g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const eur = (n) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const dataIt = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const giorniFa = (iso) => { const g = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return g <= 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa"; };
  const giorni = (dal, al) => (dal && al ? Math.max(1, Math.round((new Date(al) - new Date(dal)) / 86400000) + 1) : 1);
  const err = (e) => (e && e.message) || String(e || "errore");
  // 12.10.2026, app-22: massimo 5 preventivi per richiesta, la richiesta scade dopo 15 giorni.
  const scade = (iso) => { const g = 15 - Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return g <= 0 ? "scade oggi" : g === 1 ? "scade domani" : "scade tra " + g + " giorni"; };
  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });
  const uid = () => db().auth.getSession().then((s) => (s.data && s.data.session ? s.data.session.user.id : ""));
  const oggiPiu = (g) => new Date(Date.now() + g * 86400000).toISOString().slice(0, 10);
  const nomeTipo = (cat, t) => (conTipo(cat) ? CAT[cat].tipi[t] || t : t) || "";
  const dove = (r) => (r.comune ? r.comune + (r.provincia ? " (" + r.provincia + ")" : "") : r.provincia && PROV[r.provincia] ? PROV[r.provincia][1] : r.provincia || "");
  const righeTxt = (righe) => (righe || []).map((x) => (x.qta ? x.qta + " " + (x.um || "") + " " : "") + (x.voce || "")).join(" · ");

  /* ============================================================
     DATI DI ESEMPIO
     ============================================================ */
  const DEMO_KEY = "ac-demo-preventivi-v1";
  function demoTutto() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { d = null; }
    if (d && d.materiali && d.lavori) return d;
    const ora = new Date().toISOString(), ieri = new Date(Date.now() - 86400000).toISOString(), tre = new Date(Date.now() - 3 * 86400000).toISOString();
    d = {
      materiali: {
        zona: { sede_comune: "Caserta", sede_provincia: "CE", sede_regione: "Campania", province: ["CE", "NA", "BN"] },
        richieste: [
          { id: "mr1", creato: ora, categoria: "materiali", fonte: "dashboard", tipo: "", cliente_tipo: "impresa", comune: "Caserta", provincia: "CE", regione: "Campania", dal: oggiPiu(5), al: null, righe: [{ voce: "Cemento 32,5 R", qta: 40, um: "sacchi" }, { voce: "Rete elettrosaldata 20x20 Ø6", qta: 25, um: "pannelli" }, { voce: "Blocchi in laterizio 25x30", qta: 600, um: "pz" }], nota: "Scarico con gru, strada stretta", stato: "aperta", vicinanza: 0, mia_proposta: null, mio_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", indirizzo: "", proposte: 1 },
          { id: "mr2", creato: ieri, categoria: "materiali", fonte: "rete", tipo: "", cliente_tipo: "impresa", comune: "Pozzuoli", provincia: "NA", regione: "Campania", dal: oggiPiu(10), al: null, righe: [{ voce: "Pannelli cappotto EPS 10 cm", qta: 180, um: "m²" }, { voce: "Collante rasante", qta: 60, um: "sacchi" }], nota: "", stato: "aperta", vicinanza: 2, mia_proposta: "mp1", mio_stato: "inviata", scelta_mia: false, nome: "", mail: "", telefono: "", indirizzo: "", proposte: 3 },
          { id: "mr3", creato: tre, categoria: "materiali", fonte: "dashboard", tipo: "", cliente_tipo: "impresa", comune: "Marcianise", provincia: "CE", regione: "Campania", dal: oggiPiu(1), al: null, righe: [{ voce: "Sabbia lavata", qta: 6, um: "m³" }, { voce: "Ghiaia 8/16", qta: 4, um: "m³" }], nota: "", stato: "scelta", vicinanza: 1, mia_proposta: "mp2", mio_stato: "accettata", scelta_mia: true, nome: "Edil Nord Srl", mail: "acquisti@edilnord.it", telefono: "0823 111222", indirizzo: "Via Roma 18, cantiere ex scuola", proposte: 2 }
        ],
        proposte: [
          { id: "mp1", numero: "AC-MT-2026-0002", richiesta_id: "mr2", totale: 3920, stato: "inviata", created_at: ieri },
          { id: "mp2", numero: "AC-MT-2026-0001", richiesta_id: "mr3", totale: 640, stato: "accettata", created_at: tre }
        ],
        mie: [{ token: "", creato: ieri, categoria: "materiali", tipo: "", stato: "aperta", nome: "", righe: [{ voce: "Cemento 32,5 R", qta: 40, um: "sacchi" }] }]
      },
      noleggio: {
        zona: { sede_comune: "Aversa", sede_provincia: "CE", sede_regione: "Campania", province: ["CE", "NA"] },
        mezzi: [
          { id: "nm1", nome: "Kubota KX037", tipo: "Miniescavatore", con_operatore: false, prezzo_giorno: 180, note: "3,5 t, benne 30/40/60", attivo: true, occupato: [{ id: "o1", dal: oggiPiu(2), al: oggiPiu(6), nota: "Cantiere Edil Nord" }] },
          { id: "nm2", nome: "Genie Z-45", tipo: "Piattaforma aerea", con_operatore: true, prezzo_giorno: 260, note: "16 m di lavoro", attivo: true, occupato: [] },
          { id: "nm3", nome: "Ponteggio a tubo giunto 300 m²", tipo: "Ponteggio", con_operatore: false, prezzo_giorno: 90, note: "Montaggio a parte", attivo: true, occupato: [] }
        ],
        richieste: [
          { id: "nr1", creato: ora, categoria: "noleggio", fonte: "dashboard", tipo: "", cliente_tipo: "impresa", comune: "Caserta", provincia: "CE", regione: "Campania", dal: oggiPiu(3), al: oggiPiu(7), con_operatore: false, righe: [{ voce: "Miniescavatore 3,5 t", qta: 1, um: "pz" }], nota: "Scavo per fondazioni", stato: "aperta", vicinanza: 1, mia_proposta: null, mio_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", indirizzo: "", proposte: 0 },
          { id: "nr2", creato: tre, categoria: "noleggio", fonte: "dashboard", tipo: "", cliente_tipo: "impresa", comune: "Aversa", provincia: "CE", regione: "Campania", dal: oggiPiu(-2), al: oggiPiu(4), con_operatore: true, righe: [{ voce: "Piattaforma aerea 16 m", qta: 1, um: "pz" }], nota: "", stato: "scelta", vicinanza: 0, mia_proposta: "np1", mio_stato: "accettata", scelta_mia: true, nome: "Impianti Sud Snc", mail: "info@impiantisud.it", telefono: "081 5551234", indirizzo: "Viale Europa 40", proposte: 2 }
        ],
        proposte: [{ id: "np1", numero: "AC-NL-2026-0001", richiesta_id: "nr2", totale: 1560, stato: "accettata", created_at: tre }],
        mie: [{ token: "", creato: ieri, categoria: "noleggio", tipo: "", stato: "aperta", nome: "", righe: [{ voce: "Piattaforma aerea 16 m", qta: 1, um: "pz" }] }]
      },
      casa: {
        zona: { sede_comune: "Caserta", sede_provincia: "CE", sede_regione: "Campania", province: ["CE"] },
        richieste: [
          { id: "cr1", creato: ora, categoria: "casa", fonte: "dashboard", tipo: "trasloco", cliente_tipo: "privato", comune: "Caserta", provincia: "CE", regione: "Campania", dal: oggiPiu(14), al: null, righe: [], nota: "Bilocale 3° piano senza ascensore, a 8 km", stato: "aperta", vicinanza: 0, mia_proposta: null, mio_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", indirizzo: "", proposte: 1 },
          { id: "cr2", creato: ieri, categoria: "casa", fonte: "rete", tipo: "sgombero", cliente_tipo: "privato", comune: "Maddaloni", provincia: "CE", regione: "Campania", dal: oggiPiu(7), al: null, righe: [], nota: "Cantina 20 m²", stato: "aperta", vicinanza: 1, mia_proposta: null, mio_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", indirizzo: "", proposte: 0 }
        ],
        proposte: [],
        mie: [{ token: "", creato: ieri, categoria: "casa", tipo: "pulizie", stato: "aperta", nome: "", righe: [] }]
      },
      lavori: {
        zona: { sede_comune: "Caserta", sede_provincia: "CE", sede_regione: "Campania", province: ["CE", "NA"] },
        richieste: [
          { id: "lr1", creato: ora, categoria: "lavori", fonte: "dashboard", tipo: "tinteggiatura", cliente_tipo: "privato", comune: "Caserta", provincia: "CE", regione: "Campania", dal: oggiPiu(20), al: null, righe: [], nota: "Tinteggiare 4 stanze e il corridoio, circa 110 m² di pareti", stato: "aperta", vicinanza: 0, mia_proposta: null, mio_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", indirizzo: "", proposte: 1 },
          { id: "lr2", creato: tre, categoria: "lavori", fonte: "rete", tipo: "bagno", cliente_tipo: "privato", comune: "Marcianise", provincia: "CE", regione: "Campania", dal: oggiPiu(30), al: null, righe: [], nota: "Sostituire la vasca con un box doccia", stato: "aperta", vicinanza: 1, mia_proposta: null, mio_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", indirizzo: "", proposte: 2 }
        ],
        proposte: [],
        mie: [{ token: "", creato: ieri, categoria: "lavori", tipo: "infissi", stato: "aperta", nome: "", righe: [] }]
      }
    };
    return d;
  }
  const demoDi = (cat) => demoTutto()[cat];
  function demoCambia(cat, fn) { const t = demoTutto(); fn(t[cat]); try { localStorage.setItem(DEMO_KEY, JSON.stringify(t)); } catch (e) {} }

  function dati(cat) {
    return {
      zona() {
        if (!reale()) return Promise.resolve(demoDi(cat).zona);
        return uid().then((id) => Q(db().from("fornitori_zona").select("*").eq("azienda_id", id).maybeSingle()))
          .then((z) => z || { sede_comune: "", sede_provincia: "", sede_regione: "", province: [] });
      },
      salvaZona(z) {
        if (!reale()) { demoCambia(cat, (d) => { d.zona = z; }); return Promise.resolve(); }
        return uid().then((id) => Q(db().from("fornitori_zona").upsert(Object.assign({ azienda_id: id, updated_at: new Date().toISOString() }, z))));
      },
      richieste() {
        if (!reale()) return Promise.resolve(demoDi(cat).richieste);
        return Q(db().rpc("prev_richieste_per_me"));
      },
      proposte() {
        if (!reale()) return Promise.resolve(demoDi(cat).proposte);
        return uid().then((id) => Q(db().from("prev_proposte").select("*").eq("azienda_id", id).order("created_at", { ascending: false })));
      },
      nuovaProposta(p) {
        if (!reale()) {
          demoCambia(cat, (d) => {
            p.id = "p" + Date.now().toString(36); p.stato = "inviata"; p.created_at = new Date().toISOString();
            d.proposte.unshift(p);
            const r = d.richieste.find((x) => x.id === p.richiesta_id);
            if (r) { r.mia_proposta = p.id; r.mio_stato = "inviata"; r.proposte = (r.proposte || 0) + 1; }
          });
          return Promise.resolve(p);
        }
        return uid().then((id) => Q(db().from("prev_proposte").insert(Object.assign({ azienda_id: id, categoria: cat }, p)).select("*").single()))
          .then((riga) => { db().functions.invoke("preventivi-avvisa", { body: { evento: "proposta", proposta: riga.id } }).catch(() => {}); return riga; });
      },
      chiudi(pid) {
        if (!reale()) {
          demoCambia(cat, (d) => {
            const p = d.proposte.find((x) => x.id === pid); if (p) p.stato = "chiusa";
            const r = d.richieste.find((x) => x.mia_proposta === pid); if (r) { r.mio_stato = "chiusa"; r.stato = "chiusa"; }
          });
          return Promise.resolve();
        }
        return Q(db().rpc("prev_chiudi", { p_proposta: pid }));
      },
      mezzi() {
        if (!reale()) return Promise.resolve(demoDi("noleggio").mezzi);
        return uid().then((id) => Promise.all([
          Q(db().from("noleggio_mezzi").select("*").eq("azienda_id", id).order("tipo")),
          Q(db().from("noleggio_occupato").select("*").order("dal"))
        ])).then(([m, o]) => (m || []).map((x) => Object.assign(x, { occupato: (o || []).filter((y) => y.mezzo_id === x.id) })));
      },
      salvaMezzo(m) {
        if (!reale()) {
          demoCambia("noleggio", (d) => {
            if (!m.id) { m.id = "m" + Date.now().toString(36); m.occupato = []; d.mezzi.push(m); }
            else { const i = d.mezzi.findIndex((x) => x.id === m.id); if (i >= 0) d.mezzi[i] = Object.assign(d.mezzi[i], m); }
          });
          return Promise.resolve();
        }
        const riga = Object.assign({}, m); delete riga.occupato; if (!riga.id) delete riga.id;
        return uid().then((id) => Q(db().from("noleggio_mezzi").upsert(Object.assign(riga, { azienda_id: id }))));
      },
      togliMezzo(id) {
        if (!reale()) { demoCambia("noleggio", (d) => { d.mezzi = d.mezzi.filter((x) => x.id !== id); }); return Promise.resolve(); }
        return Q(db().from("noleggio_mezzi").delete().eq("id", id));
      },
      occupa(mezzoId, o) {
        if (!reale()) { demoCambia("noleggio", (d) => { const m = d.mezzi.find((x) => x.id === mezzoId); if (m) m.occupato.push(Object.assign({ id: "o" + Date.now().toString(36) }, o)); }); return Promise.resolve(); }
        return Q(db().from("noleggio_occupato").insert(Object.assign({ mezzo_id: mezzoId }, o)));
      },
      libera(oid) {
        if (!reale()) { demoCambia("noleggio", (d) => { d.mezzi.forEach((m) => { m.occupato = m.occupato.filter((x) => x.id !== oid); }); }); return Promise.resolve(); }
        return Q(db().from("noleggio_occupato").delete().eq("id", oid));
      }
    };
  }

  function nonPronto(el, e) {
    const m = err(e);
    const manca = /does not exist|schema cache|function|PGRST20/i.test(m);
    el.innerHTML = html`<div class="card empty"><strong>${manca ? "Questa parte non è ancora attiva sul database" : "Non riesco a leggere i dati"}</strong>
      <span>${manca ? "Manca app-21 su Supabase. Appena c'è, questa pagina funziona da sola." : m}</span></div>`.s;
  }
  function prossimoNumero(cat, proposte) {
    const anno = new Date().getFullYear(), re = new RegExp(CAT[cat].sigla + "-(\\d{4})-(\\d{4})");
    const max = (proposte || []).reduce((m, p) => { const x = re.exec(p.numero || ""); return x && Number(x[1]) === anno ? Math.max(m, Number(x[2])) : m; }, 0);
    return CAT[cat].sigla + "-" + anno + "-" + String(max + 1).padStart(4, "0");
  }
  function cosaServe(cat, r) {
    const x = [];
    if (conTipo(cat)) x.push(nomeTipo(cat, r.tipo));
    if (r.righe && r.righe.length) x.push(righeTxt(r.righe));
    if (cat === "noleggio" && r.dal) x.push("dal " + dataIt(r.dal) + (r.al ? " al " + dataIt(r.al) : "") + " (" + giorni(r.dal, r.al) + " gg)");
    else if (r.dal) x.push((cat === "materiali" ? "consegna entro il " : "per il ") + dataIt(r.dal));
    if (cat === "noleggio" && r.con_operatore != null) x.push(r.con_operatore ? "con operatore" : "senza operatore");
    return x.filter(Boolean).join(" · ");
  }

  /* Editor di righe: [{voce, qta, um, prezzo}] con totale. */
  function editorRighe(righe, conPrezzo, ph, um) {
    const riga = (x, i) => html`<tr data-i="${i}">
      <td><input name="voce" value="${x.voce || ""}" maxlength="120" placeholder="${ph || ""}" aria-label="Voce"></td>
      <td class="pr-n"><input name="qta" inputmode="decimal" value="${x.qta != null ? String(x.qta).replace(".", ",") : ""}" aria-label="Quantità"></td>
      <td class="pr-u"><input name="um" value="${x.um != null ? x.um : um || ""}" maxlength="12" aria-label="Unità"></td>
      ${conPrezzo ? html`<td class="pr-n"><input name="prezzo" inputmode="decimal" value="${x.prezzo != null ? String(x.prezzo).replace(".", ",") : ""}" aria-label="Prezzo unitario"></td><td class="pr-t num" data-tot>—</td>` : ""}
      <td><button type="button" class="btn-mini" data-togli aria-label="Togli la riga">✕</button></td></tr>`;
    return html`<div class="en-scroll"><table class="mini-table pr-righe"><thead><tr><th>Cosa</th><th>Quantità</th><th>Unità</th>${conPrezzo ? html`<th>Prezzo unitario €</th><th class="num">Importo</th>` : ""}<th></th></tr></thead>
      <tbody>${(righe && righe.length ? righe : [{}]).map(riga)}</tbody></table></div>
      <div class="row-actions"><button type="button" class="btn-ghost" data-aggiungi>Aggiungi una riga</button>${conPrezzo ? html`<span class="pr-totale">Totale <b data-totale>0,00 €</b></span>` : ""}</div>`;
  }
  function collegaRighe(box, conPrezzo, ph, um) {
    const leggi = () => [...box.querySelectorAll("tbody tr")].map((tr) => ({
      voce: tr.querySelector("[name=voce]").value.trim(), qta: num(tr.querySelector("[name=qta]").value) || null, um: tr.querySelector("[name=um]").value.trim(),
      prezzo: conPrezzo ? num(tr.querySelector("[name=prezzo]").value) || null : undefined
    })).filter((x) => x.voce);
    const conta = () => {
      if (!conPrezzo) return 0;
      let t = 0;
      box.querySelectorAll("tbody tr").forEach((tr) => { const v = num(tr.querySelector("[name=qta]").value || 1) * num(tr.querySelector("[name=prezzo]").value); t += v; tr.querySelector("[data-tot]").textContent = v ? eur(v) : "—"; });
      box.querySelector("[data-totale]").textContent = eur(t);
      return t;
    };
    box.addEventListener("input", conta);
    box.addEventListener("click", (e) => {
      const t = e.target;
      if (t.matches("[data-togli]")) { const tb = box.querySelector("tbody"); if (tb.children.length > 1) t.closest("tr").remove(); else t.closest("tr").querySelectorAll("input").forEach((i) => (i.value = "")); conta(); }
      if (t.matches("[data-aggiungi]")) {
        const tb = box.querySelector("tbody"); const nuova = tb.lastElementChild.cloneNode(true);
        nuova.querySelectorAll("input").forEach((i) => (i.value = i.name === "um" ? um || "" : "")); const td = nuova.querySelector("[data-tot]"); if (td) td.textContent = "—";
        tb.appendChild(nuova); nuova.querySelector("[name=voce]").focus();
      }
    });
    conta();
    return { leggi, totale: conta };
  }

  /* ============================================================
     PAGINE DEL FORNITORE
     ============================================================ */
  Object.keys(CAT).forEach((cat) => {
    const K = CAT[cat], P = K.pre, D = dati(cat);
    const vai = (pag) => "#/azienda/" + P + "_" + pag;
    let daRichiesta = null;

    const avvisoZona = (z) => (!z || (!z.sede_provincia && !(z.province || []).length))
      ? html`<div class="card en-banner"><div><h2>Scrivi la tua zona</h2><p class="note">Le richieste arrivano a chi copre la zona del cantiere. Senza zona non ricevi niente.</p></div><a class="btn-in" href="${vai("zona")}">La mia zona</a></div>` : "";

    V[P + "_home"] = {
      title: "Home",
      sub: K.nome + ": richieste della tua zona, preventivi, " + K.ordini.toLowerCase() + ".",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        Promise.all([D.richieste(), D.proposte(), D.zona()]).then(([rich, prop, z]) => {
          const nuove = (rich || []).filter((r) => r.stato === "aperta" && !r.mia_proposta);
          const attesa = (prop || []).filter((p) => p.stato === "inviata").length;
          const aperti = (prop || []).filter((p) => p.stato === "accettata").length;
          const chiusi = (prop || []).filter((p) => p.stato === "chiusa").length;
          el.innerHTML = html`
            ${avvisoZona(z)}
            <div class="en-kpis">
              <a class="kpi en-kpi" href="${vai("richieste")}"><span><strong>${nuove.length}</strong><small>richieste nella tua zona</small></span></a>
              <a class="kpi en-kpi" href="${vai("preventivi")}"><span><strong>${attesa}</strong><small>preventivi in attesa</small></span></a>
              <a class="kpi en-kpi" href="${vai("ordini")}"><span><strong>${aperti}</strong><small>${K.ordini.toLowerCase()} da fare</small></span></a>
              <div class="kpi"><span><strong>${chiusi}</strong><small>${K.ordini.toLowerCase()} chiusi</small></span></div>
            </div>
            <p class="note en-numeri" data-numeri></p>
            <div class="card"><h2>Le richieste più vicine</h2>
              ${nuove.length ? html`<div class="en-lista">${nuove.slice(0, 6).map((r) => html`<a class="en-rich" href="${vai("richieste")}"><span class="tag new">${VICINO[r.vicinanza] || "In zona"}</span><b>${dove(r)}</b><small>${cosaServe(cat, r)} · ${giorniFa(r.creato)}</small></a>`)}</div>`
                : html`<p class="note">Nessuna richiesta nuova nella tua zona.</p>`}
            </div>`.s;
          if (AC.numeriMese) AC.numeriMese(el.querySelector("[data-numeri]"), { ricevute: (rich || []).length, proposte: (prop || []).length, scelte: (prop || []).filter((p) => p.stato === "accettata" || p.stato === "chiusa").length, chiusi: chiusi }, K.ordini.toLowerCase() + " chiusi");
        }, (e) => nonPronto(el, e));
      }
    };

    V[P + "_richieste"] = {
      title: "Richieste",
      sub: "Le richieste di preventivo della tua zona, dalla più vicina. Nome, contatti e indirizzo solo se il cliente sceglie il tuo preventivo.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        Promise.all([D.richieste(), D.zona()]).then(([rich, z]) => {
          const lista = rich || [];
          const aperte = lista.filter((r) => r.stato === "aperta"), altre = lista.filter((r) => r.stato !== "aperta");
          const riga = (r) => html`<div class="en-rrow">
            <div class="en-rinfo">
              <div><span class="tag new">${VICINO[r.vicinanza] || "In zona"}</span> <b>${dove(r)}</b> <small>· ${r.cliente_tipo === "impresa" ? "Impresa" : "Privato"}${r.fonte === "rete" ? " · Commerciale AncheCasa" : ""} · ${giorniFa(r.creato)}</small></div>
              <small>${cosaServe(cat, r)}${r.nota ? " · «" + r.nota + "»" : ""}</small>
              <small>${r.proposte || 0} di 5 preventivi arrivati${r.stato === "aperta" && !r.mia_proposta ? " · " + scade(r.creato) : ""}</small>
            </div>
            <div class="en-ract">${r.mia_proposta ? html`<span class="tag ${(STATO_P[r.mio_stato] || STATO_P.inviata)[0]}">${(STATO_P[r.mio_stato] || STATO_P.inviata)[1]}</span>`
              : r.stato !== "aperta" ? html`<span class="tag paused">Chiusa</span>` : html`<button class="btn-in" type="button" data-prev="${r.id}">Fai il preventivo</button>`}</div>
          </div>`;
          el.innerHTML = html`${avvisoZona(z)}
            <p class="note">La richiesta arriva ai fornitori che coprono la zona del cantiere. Il cliente confronta i preventivi e ne sceglie uno: solo quel fornitore riceve nome, contatti e indirizzo.</p>
            <div class="card"><h2>Aperte <span class="ra-n">${aperte.length}</span></h2>${aperte.length ? aperte.map(riga) : html`<p class="note">Nessuna richiesta aperta nella tua zona.</p>`}</div>
            ${altre.length ? html`<div class="card"><h2>Già scelte o chiuse</h2>${altre.map(riga)}</div>` : ""}`.s;
          el.querySelectorAll("[data-prev]").forEach((b) => b.addEventListener("click", () => { daRichiesta = lista.find((r) => r.id === b.getAttribute("data-prev")) || null; location.hash = vai("preventivi"); }));
        }, (e) => nonPronto(el, e));
      }
    };

    V[P + "_preventivi"] = {
      title: "Preventivi",
      sub: "Il preventivo al cliente: prezzi riga per riga, consegna e validità.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        D.proposte().then((prop) => {
          const r = daRichiesta; daRichiesta = null;
          const elenco = html`<div class="card"><h2>I tuoi preventivi</h2>
            ${(prop || []).length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>N.</th><th>Data</th><th class="num">Totale</th><th>Stato</th></tr></thead>
              <tbody>${prop.map((x) => html`<tr><td>${x.numero}</td><td>${dataIt(x.created_at)}</td><td class="num">${x.totale != null ? eur(x.totale) : "—"}</td><td><span class="tag ${(STATO_P[x.stato] || STATO_P.inviata)[0]}">${(STATO_P[x.stato] || STATO_P.inviata)[1]}</span></td></tr>`)}</tbody></table></div>`
              : html`<p class="note">Qui trovi i preventivi che mandi.</p>`}</div>`;
          if (!r) {
            el.innerHTML = html`<div class="card"><h2>Scegli una richiesta</h2><p class="note">Il preventivo parte da una richiesta della tua zona.</p><div class="row-actions"><a class="btn-in" href="${vai("richieste")}">Vai alle richieste</a></div></div>${elenco}`.s;
            return;
          }
          const gg = giorni(r.dal, r.al);
          const base = (r.righe || []).map((x) => ({ voce: x.voce, qta: cat === "noleggio" ? gg * (x.qta || 1) : x.qta, um: cat === "noleggio" ? "giorni" : x.um }));
          if (cat === "noleggio") base.push({ voce: "Trasporto andata e ritorno", qta: 1, um: "a corpo" });
          if (conTipo(cat) && !base.length) base.push({ voce: nomeTipo(cat, r.tipo), qta: 1, um: "a corpo" });
          el.innerHTML = html`
            <div class="card en-banner"><div><h2>Preventivo per ${dove(r)}</h2><p class="note">${cosaServe(cat, r)}${r.nota ? " · «" + r.nota + "»" : ""}</p></div></div>
            <div class="card">
              <form id="pr-f" class="prefs wide">
                <div id="pr-righe">${editorRighe(base, true, K.ph, K.um)}</div>
                <div class="en-grid">
                  <label class="check span2"><input type="checkbox" name="iva"> Prezzi IVA inclusa</label>
                  <label>${cat === "materiali" ? "Consegna" : cat === "noleggio" ? "Consegna del mezzo" : "Quando possiamo venire"}<input name="consegna" maxlength="160" placeholder="${cat === "materiali" ? "Es. in 3 giorni lavorativi, scarico con gru" : cat === "noleggio" ? "Es. in cantiere la mattina del primo giorno" : "Es. sabato 24 ottobre, dalle 8"}"></label>
                  <label>Valido per<select name="valido"><option value="7">7 giorni</option><option value="15" selected>15 giorni</option><option value="30">30 giorni</option></select></label>
                  <label class="span2">Nota per il cliente<textarea name="nota" maxlength="600" placeholder="Condizioni, cosa è escluso, pagamento."></textarea></label>
                </div>
                <div class="row-actions"><button class="btn-in" type="submit">Manda il preventivo</button></div>
              </form>
            </div>${elenco}`.s;
          const f = el.querySelector("#pr-f");
          const R = collegaRighe(el.querySelector("#pr-righe"), true, K.ph, K.um);
          f.addEventListener("submit", (e) => {
            e.preventDefault();
            const righe = R.leggi();
            if (!righe.length) return toast("Scrivi almeno una riga.", "error");
            if (righe.some((x) => !(x.prezzo > 0))) return toast("Metti il prezzo su ogni riga.", "error");
            const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
            D.nuovaProposta({ richiesta_id: r.id, numero: prossimoNumero(cat, prop), righe: righe, totale: Math.round(R.totale() * 100) / 100, iva_inclusa: f.iva.checked,
              consegna: f.consegna.value.trim(), valida_giorni: Number(f.valido.value), nota: f.nota.value.trim() })
              .then(() => { toast("Preventivo mandato: il cliente lo riceve per mail."); V[P + "_preventivi"].render(el); }, (e2) => { btn.disabled = false; toast("Preventivo non mandato: " + err(e2), "error"); });
          });
        }, (e) => nonPronto(el, e));
      }
    };

    V[P + "_ordini"] = {
      title: K.ordini,
      sub: "Chi ha scelto il tuo preventivo: nome, contatti e indirizzo. L'ordine e il pagamento li fate direttamente.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        Promise.all([D.richieste(), D.proposte()]).then(([rich, prop]) => {
          const scelte = (rich || []).filter((r) => r.scelta_mia);
          const pDi = (r) => (prop || []).find((p) => p.id === r.mia_proposta) || {};
          el.innerHTML = html`<div class="card"><h2>${K.ordini}</h2>
            ${scelte.length ? scelte.map((r) => { const p = pDi(r); const fatto = (p.stato || r.mio_stato) === "chiusa"; return html`<div class="en-rrow">
              <div class="en-rinfo"><div><b>${r.nome}</b> <small>· ${dove(r)} · preventivo ${p.numero || ""}${p.totale != null ? " · " + eur(p.totale) : ""}</small></div>
                <small>${r.indirizzo ? r.indirizzo + " · " : ""}<a href="mailto:${r.mail}">${r.mail}</a>${r.telefono ? html` · <a href="tel:${r.telefono.replace(/\s/g, "")}">${r.telefono}</a>` : ""}</small>
                <small>${cosaServe(cat, r)}</small></div>
              <div class="en-ract">${fatto ? html`<span class="tag ok">${K.chiuso}</span>` : html`<button class="btn-in" type="button" data-chiudi="${r.mia_proposta}">${K.chiudi}</button>`}</div>
            </div>`; }) : html`<p class="note">Quando un cliente sceglie il tuo preventivo, qui trovi nome, contatti e indirizzo.</p>`}</div>`.s;
          el.querySelectorAll("[data-chiudi]").forEach((b) => b.addEventListener("click", () => {
            if (b.dataset.conferma !== "1") { b.dataset.conferma = "1"; b.textContent = "Confermi?"; return; }
            D.chiudi(b.getAttribute("data-chiudi")).then(() => { toast(K.chiuso); V[P + "_ordini"].render(el); }, (e2) => toast("Non salvato: " + err(e2), "error"));
          }));
        }, (e) => nonPronto(el, e));
      }
    };

    V[P + "_zona"] = {
      title: "La mia zona",
      sub: "Dove sei e quali province copri. Le richieste arrivano partendo dal più vicino.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        D.zona().then((z) => {
          const coperte = new Set(z.province || []);
          el.innerHTML = html`
            <form id="pz-f" class="prefs wide">
              <div class="card"><h2>La tua sede</h2>
                <div class="en-grid">
                  <label>Comune<input name="comune" maxlength="80" value="${z.sede_comune || ""}" required></label>
                  <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProvince(z.sede_provincia)}</select></label>
                </div>
                <p class="note">Senza province scelte qui sotto, copri solo la provincia della sede.</p>
              </div>
              <div class="card"><h2>Le province che copri <span class="ra-n" id="pz-n">${coperte.size}</span></h2>
                <div class="pz-regioni">${REGIONI.map((reg) => html`<fieldset class="pz-reg"><legend><label class="check"><input type="checkbox" data-regione="${reg}"> <b>${reg}</b></label></legend>
                  ${PROVINCE.filter((p) => p[2] === reg).map((p) => html`<label class="check"><input type="checkbox" name="pv" value="${p[0]}"${coperte.has(p[0]) ? " checked" : ""}> ${p[1]}</label>`)}</fieldset>`)}</div>
                <div class="row-actions"><button class="btn-in" type="submit">Salva la zona</button></div>
              </div>
            </form>`.s;
          const f = el.querySelector("#pz-f");
          const aggiorna = () => {
            el.querySelector("#pz-n").textContent = f.querySelectorAll("[name=pv]:checked").length;
            f.querySelectorAll("[data-regione]").forEach((c) => { const tutte = [...c.closest("fieldset").querySelectorAll("[name=pv]")]; c.checked = tutte.every((x) => x.checked); });
          };
          f.querySelectorAll("[data-regione]").forEach((c) => c.addEventListener("change", () => { c.closest("fieldset").querySelectorAll("[name=pv]").forEach((x) => (x.checked = c.checked)); aggiorna(); }));
          f.addEventListener("change", (e) => { if (e.target.name === "pv") aggiorna(); });
          aggiorna();
          f.addEventListener("submit", (e) => {
            e.preventDefault();
            const sigla = f.prov.value;
            const nuova = { sede_comune: f.comune.value.trim(), sede_provincia: sigla, sede_regione: PROV[sigla] ? PROV[sigla][2] : "", province: [...f.querySelectorAll("[name=pv]:checked")].map((x) => x.value) };
            D.salvaZona(nuova).then(() => toast("Zona salvata"), (e2) => toast("Non salvata: " + err(e2), "error"));
          });
        }, (e) => nonPronto(el, e));
      }
    };
  });

  /* Noleggio: i miei mezzi e il calendario. */
  V.nol_mezzi = {
    title: "I miei mezzi",
    sub: "I mezzi che noleggi e quando sono occupati. Le imprese vedono cosa è libero (senza prezzi).",
    render(el) {
      const D = dati("noleggio");
      let modifica = null;
      const disegna = () => {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        D.mezzi().then((mz) => {
          const m0 = modifica || { tipo: CAT.noleggio.mezzi[0], con_operatore: false, attivo: true };
          el.innerHTML = html`
            <div class="card"><h2>${modifica ? "Modifica il mezzo" : "Aggiungi un mezzo"}</h2>
              <form id="nm-f" class="prefs wide en-grid">
                <label>Tipo<select name="tipo">${CAT.noleggio.mezzi.map((t) => html`<option${m0.tipo === t ? " selected" : ""}>${t}</option>`)}</select></label>
                <label>Nome o modello<input name="nome" required maxlength="80" value="${m0.nome || ""}" placeholder="Es. Kubota KX037"></label>
                <label>Prezzo al giorno € (solo per te)<input name="prezzo" inputmode="decimal" value="${m0.prezzo_giorno != null ? String(m0.prezzo_giorno).replace(".", ",") : ""}"></label>
                <label>Note<input name="note" maxlength="300" value="${m0.note || ""}" placeholder="Es. 3,5 t, benne 30/40/60"></label>
                <label class="check"><input type="checkbox" name="op"${m0.con_operatore ? " checked" : ""}> Con operatore</label>
                <label class="check"><input type="checkbox" name="attivo"${m0.attivo !== false ? " checked" : ""}> Noleggiabile</label>
                <div class="row-actions span2"><button class="btn-in" type="submit">${modifica ? "Salva" : "Aggiungi"}</button>${modifica ? html`<button class="btn-ghost" type="button" data-annulla>Annulla</button>` : ""}</div>
              </form></div>
            <div class="card"><h2>Flotta e calendario</h2>
              ${(mz || []).length ? mz.map((m) => html`<div class="nm-mezzo">
                <div class="en-rrow"><div class="en-rinfo"><div><span class="tag new">${m.tipo}</span> <b>${m.nome}</b> ${m.attivo === false ? html`<span class="tag paused">Non noleggiabile</span>` : ""}</div>
                  <small>${m.con_operatore ? "Con operatore" : "Senza operatore"}${m.prezzo_giorno ? " · " + eur(m.prezzo_giorno) + " al giorno" : ""}${m.note ? " · " + m.note : ""}</small></div>
                  <div class="en-ract"><button class="btn-mini" type="button" data-mod="${m.id}">Modifica</button><button class="btn-mini" type="button" data-del="${m.id}">Elimina</button></div></div>
                <div class="nm-occ">${(m.occupato || []).length ? m.occupato.map((o) => html`<span class="tag wait">Occupato ${dataIt(o.dal)} – ${dataIt(o.al)}${o.nota ? " · " + o.nota : ""} <button type="button" class="nm-x" data-libera="${o.id}" aria-label="Libera queste date">✕</button></span>`) : html`<small class="note">Libero</small>`}</div>
                <form class="nm-o" data-occupa="${m.id}"><label>Dal<input type="date" name="dal" required></label><label>Al<input type="date" name="al" required></label><label>Nota<input name="nota" maxlength="200" placeholder="Es. cantiere Rossi"></label><button class="btn-ghost" type="submit">Segna occupato</button></form>
              </div>`) : html`<p class="note">Ancora nessun mezzo. Aggiungi il primo qui sopra.</p>`}
            </div>`.s;
          const f = el.querySelector("#nm-f");
          f.addEventListener("submit", (e) => {
            e.preventDefault();
            const m = { tipo: f.tipo.value, nome: f.nome.value.trim(), prezzo_giorno: num(f.prezzo.value) || null, note: f.note.value.trim(), con_operatore: f.op.checked, attivo: f.attivo.checked };
            if (modifica) m.id = modifica.id;
            D.salvaMezzo(m).then(() => { toast("Mezzo salvato"); modifica = null; disegna(); }, (e2) => toast("Non salvato: " + err(e2), "error"));
          });
          const ann = el.querySelector("[data-annulla]"); if (ann) ann.addEventListener("click", () => { modifica = null; disegna(); });
          el.querySelectorAll("[data-mod]").forEach((b) => b.addEventListener("click", () => { modifica = mz.find((x) => x.id === b.getAttribute("data-mod")); disegna(); }));
          el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
            if (b.dataset.conferma !== "1") { b.dataset.conferma = "1"; b.textContent = "Conferma"; return; }
            D.togliMezzo(b.getAttribute("data-del")).then(() => { toast("Mezzo eliminato"); disegna(); }, (e2) => toast("Non eliminato: " + err(e2), "error"));
          }));
          el.querySelectorAll("[data-occupa]").forEach((fo) => fo.addEventListener("submit", (e) => {
            e.preventDefault();
            if (fo.al.value < fo.dal.value) return toast("La data di fine viene prima dell'inizio.", "error");
            D.occupa(fo.getAttribute("data-occupa"), { dal: fo.dal.value, al: fo.al.value, nota: fo.nota.value.trim() }).then(() => { toast("Date segnate"); disegna(); }, (e2) => toast("Non salvato: " + err(e2), "error"));
          }));
          el.querySelectorAll("[data-libera]").forEach((b) => b.addEventListener("click", () => D.libera(b.getAttribute("data-libera")).then(disegna, (e2) => toast("Non salvato: " + err(e2), "error"))));
        }, (e) => nonPronto(el, e));
      };
      disegna();
    }
  };

  /* ============================================================
     PAGINE DEI CLIENTI: impresa (materiali, noleggio), privato (casa), commerciale della rete
     ============================================================ */
  function mieRichieste(cat, comeRete) {
    if (!reale()) return Promise.resolve(demoDi(cat).mie);
    return uid().then((id) => Q(db().from("prev_richieste").select("token, creato, categoria, tipo, stato, nome, righe")
      .eq("categoria", cat).eq(comeRete ? "inviato_da" : "richiedente_id", id).order("creato", { ascending: false }).limit(30)));
  }
  function elencoMie(box, cat, comeRete) {
    mieRichieste(cat, comeRete).then((l) => {
      box.innerHTML = (l || []).length ? html`<div class="en-lista">${l.map((r) => html`<div class="en-rrow"><div class="en-rinfo"><b>${conTipo(cat) ? nomeTipo(cat, r.tipo) : righeTxt(r.righe).slice(0, 60) || CAT[cat].nome}</b><small>${comeRete && r.nome ? r.nome + " · " : ""}${dataIt(r.creato)}</small></div>
        <div class="en-ract"><span class="tag ${(STATO_R[r.stato] || STATO_R.aperta)[0]}">${(STATO_R[r.stato] || STATO_R.aperta)[1]}</span>${r.token ? html` <a class="btn-mini" href="../preventivi.html?t=${r.token}" target="_blank" rel="noopener">Vedi i preventivi</a>` : ""}</div></div>`)}</div>`.s
        : html`<p class="note">Ancora nessuna richiesta.</p>`.s;
    }, () => { box.innerHTML = html`<p class="note">Non riesco a leggere le richieste.</p>`.s; });
  }

  function formRichiesta(cat, chi, id, pre) {
    const K = CAT[cat];
    const p = S.data.profilo || {};
    const mio = chi !== "rete";
    pre = pre || {};
    return html`<form id="${id}" class="prefs wide">
      ${conTipo(cat) ? html`<div class="en-grid"><label class="span2">Cosa ti serve<select name="tipo">${Object.keys(K.tipi).map((k) => html`<option value="${k}">${K.tipi[k]}</option>`)}</select></label></div>` : ""}
      ${!conTipo(cat) ? html`<p class="note">${cat === "materiali" ? "Cosa ti serve, riga per riga." : "Quali mezzi o attrezzature."}</p><div data-righe>${editorRighe(pre.righe || [], false, K.ph, K.um)}</div>` : ""}
      <div class="en-grid">
        ${cat === "noleggio" ? html`<label>Dal<input type="date" name="dal" required value="${pre.dal || ""}"></label><label>Al<input type="date" name="al" required value="${pre.al || ""}"></label>
          <label class="span2">Operatore<select name="op"><option value="false">Senza operatore</option><option value="true">Con operatore</option></select></label>`
          : html`<label class="span2">${K.dataLab}<input type="date" name="dal"></label>`}
        <label>Comune ${conTipo(cat) ? "" : "del cantiere"}<input name="comune" required maxlength="80" value="${pre.comune || (mio && conTipo(cat) ? p.zona || "" : "")}"></label>
        <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProvince(pre.provincia || "")}</select></label>
        <label class="span2">Indirizzo (lo vede solo il fornitore che scegli)<input name="indirizzo" maxlength="160"></label>
        ${conTipo(cat) ? html`<label class="span2">Descrivi il lavoro<textarea name="nota" maxlength="800" placeholder="${K.ph}"></textarea></label>` : html`<label class="span2">Note per il fornitore<input name="nota" maxlength="800" placeholder="Es. scarico con gru, accesso stretto"></label>`}
        ${chi === "rete" && conTipo(cat) ? html`<label class="span2">Il cliente è<select name="cliente_tipo"><option value="privato">Un privato</option><option value="impresa">Un'azienda o un condominio</option></select></label>` : ""}
        <label>${chi === "rete" ? "Nome del cliente" : conTipo(cat) ? "Nome e cognome" : "Impresa o referente"}<input name="nome" required maxlength="120" value="${mio ? p.nome || "" : ""}"></label>
        <label>Telefono<input name="tel" maxlength="30"></label>
        <label class="span2">${chi === "rete" ? "Mail del cliente (i preventivi arrivano a lui)" : "Mail"}<input name="mail" type="email" required value="${mio ? (S.data.account && S.data.account.mail) || "" : ""}"></label>
        <label class="check span2"><input type="checkbox" name="consenso"> ${chi === "rete" ? "Il cliente è d'accordo a ricevere i preventivi dei fornitori AncheCasa. Nome e contatti li riceve solo il fornitore che sceglie." : "Voglio ricevere i preventivi dei fornitori AncheCasa. Nome, contatti e indirizzo li riceve solo il fornitore che scelgo."}</label>
      </div>
      <div class="row-actions"><button class="btn-in" type="submit">Chiedi i preventivi</button></div>
    </form>`;
  }
  function collegaForm(el, cat, chi, id, dopo) {
    const f = el.querySelector("#" + id);
    const R = f.querySelector("[data-righe]") ? collegaRighe(f.querySelector("[data-righe]"), false, CAT[cat].ph, CAT[cat].um) : null;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const righe = R ? R.leggi() : [];
      if (R && !righe.length) return toast("Scrivi almeno una riga.", "error");
      if (!f.consenso.checked) return toast("Serve il consenso per ricevere i preventivi.", "error");
      if (cat === "noleggio" && f.al.value < f.dal.value) return toast("La data di fine viene prima dell'inizio.", "error");
      const sigla = f.prov.value;
      const d = { categoria: cat, fonte: chi === "rete" ? "rete" : "dashboard", tipo: f.tipo ? f.tipo.value : "",
        cliente_tipo: conTipo(cat) ? (f.cliente_tipo ? f.cliente_tipo.value : chi === "impresa" ? "impresa" : "privato") : "impresa",
        comune: f.comune.value.trim(), provincia: sigla, regione: PROV[sigla] ? PROV[sigla][2] : "", indirizzo: f.indirizzo.value.trim(),
        dal: f.dal.value || null, al: f.al ? f.al.value || null : null, con_operatore: f.op ? f.op.value === "true" : null, righe: righe, nota: f.nota.value.trim(),
        nome: f.nome.value.trim(), telefono: f.tel.value.trim(), mail: f.mail.value.trim(), consenso: true };
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      const fatto = (msg) => { btn.disabled = false; toast(msg); f.reset(); if (dopo) dopo(); };
      if (!reale()) { demoCambia(cat, (x) => { x.mie.unshift({ token: "", creato: new Date().toISOString(), categoria: cat, tipo: d.tipo, stato: "aperta", nome: d.nome, righe: righe }); }); fatto("Anteprima: richiesta registrata, niente è partito."); return; }
      Q(db().rpc("prev_nuova_richiesta", { p: d })).then((tok) => {
        db().functions.invoke("preventivi-avvisa", { body: { evento: "richiesta", token: tok } }).catch(() => {});
        fatto(chi === "rete" ? "Richiesta inviata: i preventivi arrivano per mail al cliente." : "Richiesta inviata: ti scriviamo appena arrivano i preventivi.");
      }, (e2) => { btn.disabled = false; const m = err(e2); toast(/troppe/.test(m) ? "Troppe richieste oggi con questa mail." : /solo_aziende/.test(m) ? "Materiali e noleggio sono per le aziende." : "Richiesta non inviata: " + m, "error"); });
    });
  }

  function paginaCliente(cat, chi, titolo) {
    return {
      title: titolo,
      sub: CAT[cat].perche,
      render(el) {
        const id = "pc-" + CAT[cat].pre;
        el.innerHTML = html`<div class="pv-due">
          <section class="card"><h2>Chiedi i preventivi</h2>${formRichiesta(cat, chi, id)}</section>
          <section class="card"><h2>Le mie richieste</h2><div id="${id}-mie"><p class="note">Caricamento…</p></div></section>
        </div>`.s;
        const box = el.querySelector("#" + id + "-mie");
        elencoMie(box, cat, false);
        collegaForm(el, cat, chi, id, () => elencoMie(box, cat, false));
      }
    };
  }
  V["az-materiali"] = paginaCliente("materiali", "impresa", "Preventivo materiali");
  V["pv-casa"] = paginaCliente("casa", "privato", "Traslochi, pulizie e giardino");
  // 12.10.2026, app-24: piccoli lavori alle imprese della zona.
  V["pv-lavori"] = paginaCliente("lavori", "privato", "Piccoli lavori");

  /* Impresa: noleggio con «cosa è libero». */
  function liberi(prov, comune, dal, al) {
    if (!reale()) {
      const d = demoDi("noleggio"), z = d.zona;
      if (!(z.province || []).includes(prov)) return Promise.resolve([]);
      return Promise.resolve(d.mezzi.filter((m) => m.attivo !== false && !(m.occupato || []).some((o) => o.dal <= (al || dal) && o.al >= dal))
        .map((m) => ({ mezzo: m.id, azienda: "Noleggi Campania Srl (esempio)", sede: z.sede_comune, vicinanza: z.sede_comune.toLowerCase() === (comune || "").toLowerCase() ? 0 : z.sede_provincia === prov ? 1 : 2, nome: m.nome, tipo: m.tipo, con_operatore: m.con_operatore, note: m.note })));
    }
    return Q(db().rpc("noleggio_liberi", { p_provincia: prov, p_comune: comune, p_dal: dal, p_al: al }));
  }
  function paginaNoleggio(chi) {
    return {
      title: chi === "rete" ? "Noleggio per i clienti" : "Noleggia mezzi e attrezzature",
      sub: CAT.noleggio.perche,
      render(el) {
        el.innerHTML = html`
          <section class="card"><h2>Cosa è libero</h2>
            <form id="nl-cerca" class="prefs wide en-grid">
              <label>Comune del cantiere<input name="comune" maxlength="80" required></label>
              <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProvince("")}</select></label>
              <label>Dal<input type="date" name="dal" required value="${oggiPiu(2)}"></label>
              <label>Al<input type="date" name="al" required value="${oggiPiu(6)}"></label>
              <div class="row-actions span2"><button class="btn-in" type="submit">Cerca</button></div>
            </form>
            <div id="nl-liberi"><p class="note">Scrivi dove e quando: vedi i mezzi liberi dei noleggiatori della zona, dal più vicino. I prezzi arrivano con il preventivo.</p></div>
          </section>
          <div class="pv-due">
            <section class="card"><h2>Chiedi i preventivi</h2><div id="nl-form"></div></section>
            <section class="card"><h2>${chi === "rete" ? "Le richieste che hai fatto" : "Le mie richieste"}</h2><div id="nl-mie"><p class="note">Caricamento…</p></div></section>
          </div>`.s;
        const mie = el.querySelector("#nl-mie");
        const metti = (pre) => {
          el.querySelector("#nl-form").innerHTML = formRichiesta("noleggio", chi, "nl-f", pre).s;
          collegaForm(el, "noleggio", chi, "nl-f", () => elencoMie(mie, "noleggio", chi === "rete"));
        };
        metti({});
        elencoMie(mie, "noleggio", chi === "rete");
        const fc = el.querySelector("#nl-cerca");
        fc.addEventListener("submit", (e) => {
          e.preventDefault();
          const box = el.querySelector("#nl-liberi");
          box.innerHTML = html`<p class="note">Cerco…</p>`.s;
          liberi(fc.prov.value, fc.comune.value.trim(), fc.dal.value, fc.al.value).then((l) => {
            box.innerHTML = (l || []).length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th></th><th>Mezzo</th><th>Noleggiatore</th><th>Distanza</th></tr></thead>
              <tbody>${l.map((m) => html`<tr><td><input type="checkbox" data-mezzo="${m.tipo} · ${m.nome}" aria-label="Scegli ${m.nome}"></td><td><b>${m.tipo}</b> · ${m.nome}<br><small>${m.con_operatore ? "Con operatore" : "Senza operatore"}${m.note ? " · " + m.note : ""}</small></td><td>${m.azienda}<br><small>${m.sede}</small></td><td><span class="tag new">${VICINO[m.vicinanza] || "In zona"}</span></td></tr>`)}</tbody></table></div>
              <div class="row-actions"><button type="button" class="btn-in" data-usa>Chiedi il preventivo per i mezzi scelti</button></div>`.s
              : html`<p class="note">Nessun mezzo libero registrato in questa zona e in queste date. Chiedi comunque il preventivo qui sotto: arriva a tutti i noleggiatori della zona.</p>`.s;
            const usa = box.querySelector("[data-usa]");
            if (usa) usa.addEventListener("click", () => {
              const scelti = [...box.querySelectorAll("[data-mezzo]:checked")].map((c) => ({ voce: c.getAttribute("data-mezzo"), qta: 1, um: "pz" }));
              if (!scelti.length) return toast("Scegli almeno un mezzo.", "error");
              metti({ righe: scelti, dal: fc.dal.value, al: fc.al.value, comune: fc.comune.value.trim(), provincia: fc.prov.value });
              el.querySelector("#nl-f").scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }, (e2) => { box.innerHTML = html`<p class="note">${/does not exist|schema cache|function/i.test(err(e2)) ? "Il noleggio arriva a breve." : "Non riesco a cercare: " + err(e2)}</p>`.s; });
        });
      }
    };
  }
  V["az-noleggio"] = paginaNoleggio("impresa");

  /* Per la rete (pagina «Offerte per i clienti», servizi.js) e per l'admin (Fornitori). */
  AC.preventivi = {
    CAT: CAT,
    schedaRete(box, cat) {
      if (cat === "noleggio") { V["re-noleggio"] = V["re-noleggio"] || paginaNoleggio("rete"); V["re-noleggio"].render(box); return; }
      const id = "re-" + CAT[cat].pre;
      box.innerHTML = html`<div class="pv-due">
        <section class="card"><h2>Chiedi i preventivi per il cliente</h2><p class="note">Arriva ai fornitori della zona, dal più vicino, senza il nome del cliente. A lavoro chiuso la vendita è tua.</p>${formRichiesta(cat, "rete", id)}</section>
        <section class="card"><h2>Le richieste che hai fatto</h2><div id="${id}-mie"><p class="note">Caricamento…</p></div></section></div>`.s;
      const mie = box.querySelector("#" + id + "-mie");
      elencoMie(mie, cat, true);
      collegaForm(box, cat, "rete", id, () => elencoMie(mie, cat, true));
    },
    richiesteAdmin() {
      if (!reale()) {
        const t = demoTutto();
        return Promise.resolve([].concat(t.materiali.richieste, t.noleggio.richieste, t.casa.richieste, t.lavori.richieste).map((r) => Object.assign({}, r, { nome: r.nome || "Cliente di esempio", n: r.proposte || 0 })));
      }
      return Promise.all([
        Q(db().from("prev_richieste").select("id, creato, categoria, fonte, tipo, cliente_tipo, comune, provincia, nome, stato, righe").order("creato", { ascending: false }).limit(80)),
        Q(db().from("prev_proposte").select("richiesta_id"))
      ]).then(([r, p]) => {
        const conta = {};
        (p || []).forEach((x) => { conta[x.richiesta_id] = (conta[x.richiesta_id] || 0) + 1; });
        return (r || []).map((x) => Object.assign(x, { n: conta[x.id] || 0 }));
      });
    },
    cosa(r) { return conTipo(r.categoria) ? nomeTipo(r.categoria, r.tipo) : righeTxt(r.righe).slice(0, 70); },
    dove: dove,
    TIPI_DI_AZIENDA: TIPI_DI_AZIENDA,
    // 12.10.2026, app-23: per «Ho un guasto» e «Trova artigiano» (artigiani.js).
    PROVINCE: PROVINCE,
    optProvince: optProvince
  };
})();
