/* CANTIERI E RICHIESTE TRA AZIENDE (12.10.2026, decisioni di Nando 13:24-13:42, PROGETTO-DASHBOARD.md, app-25).
   Ogni azienda (e AncheCasa) può essere general contractor: «I miei cantieri» → «Pubblica una richiesta».
   Niente elenco da sfogliare: la richiesta arriva alle prime 10 aziende della zona che offrono quel servizio («Cosa offro»),
   prima gli sponsor poi le più vicine; chi pubblica invita anche le sue ditte di fiducia per mail.
   Offerta voce per voce: materiali con voci tolte e più fornitori; lavori anche per una sola lavorazione, ma intera.
   Pagamenti decisi da chi pubblica, «non scelto» con il motivo, bollino documenti, domande e sopralluogo, voti nei due sensi.
   «Cerca subappaltatori»: solo chi ha detto di lavorare in subappalto in quel settore e in quella zona, senza contatti.
   Anteprima (?demo=…): dati di esempio in questo browser, niente sul database e nessuna mail. */
(function () {
  const AC = window.AC;
  const { html, toast } = AC.ui;
  const S = AC.store;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;

  /* Servizi: gli stessi codici del database (app-25) e della funzione preventivi-avvisa. */
  const GRUPPI = [
    ["materiali", "Materiali", [["materiali", "Materiali edili"]]],
    ["noleggio", "Noleggio", [["noleggio", "Noleggio mezzi e attrezzature"]]],
    ["lavori", "Lavori in subappalto", [["demolizioni", "Demolizioni e scavi"], ["murature", "Opere murarie"], ["strutture", "Strutture in cemento armato"], ["cartongesso", "Cartongesso"],
      ["intonaci", "Intonaci e rasature"], ["pavimenti", "Pavimenti e rivestimenti"], ["tinteggiatura", "Tinteggiatura"], ["cappotto", "Cappotto e isolamento"],
      ["tetto", "Tetti e impermeabilizzazioni"], ["infissi", "Infissi e serramenti"], ["carpenteria", "Carpenteria e ferro"], ["ponteggi", "Ponteggi"]]],
    ["impianti", "Impianti (serve l'abilitazione DM 37/08)", [["imp_elettrico", "Impianto elettrico"], ["imp_idraulico", "Impianto idraulico"], ["imp_termico", "Riscaldamento e climatizzazione"],
      ["imp_fotovoltaico", "Fotovoltaico"], ["imp_gas", "Impianto gas"]]],
    ["personale", "Personale (solo agenzie per il lavoro)", [["personale", "Personale tramite agenzia per il lavoro"]]]
  ];
  const SERV = {}; const GRUPPO_DI = {};
  GRUPPI.forEach((g) => g[2].forEach((s) => { SERV[s[0]] = s[1]; GRUPPO_DI[s[0]] = g[0]; }));
  const TIPI = { materiali: "Materiali", noleggio: "Noleggio", lavori: "Lavori in subappalto", impianti: "Impianti", personale: "Personale" };
  const UM = { materiali: "pz", noleggio: "giorni", lavori: "m²", impianti: "a corpo", personale: "ore" };
  const PAGAMENTI = ["Bonifico a 30 giorni", "Bonifico a 60 giorni", "Bonifico a 90 giorni", "Anticipo e saldo a fine lavori", "SAL mensili", "A fine lavori", "Alla consegna"];
  const MOTIVI = { prezzo: "Prezzo più alto", tempi: "Tempi più lunghi", voci_mancanti: "Voci mancanti", fiducia: "Scelta una ditta di fiducia", annullato: "Lavoro rinviato o annullato" };
  const STATO_R = { aperta: ["new", "Aperta"], scelta: ["ok", "Scelta fatta"], annullata: ["paused", "Annullata"] };
  const STATO_O = { inviata: ["wait", "In attesa"], scelta: ["ok", "Scelta"], parziale: ["ok", "Scelta in parte"], non_scelta: ["paused", "Non scelta"] };
  const VICINO = ["Stesso comune", "Stessa provincia", "In zona"];
  const DOCN = { durc: "DURC", pos: "POS", patente: "patente a crediti", abilitazione: "abilitazione impianti", visura: "visura", assicurazione: "assicurazione" };

  const eur = (n) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/\./g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const dataIt = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const giorniFa = (iso) => { const g = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return g <= 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa"; };
  const piu = (g) => new Date(Date.now() + g * 86400000).toISOString().slice(0, 10);
  const err = (e) => (e && e.message) || String(e || "errore");
  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });
  const uid = () => db().auth.getSession().then((s) => (s.data && s.data.session ? s.data.session.user.id : ""));
  const avvisa = () => { if (reale()) db().functions.invoke("preventivi-avvisa", { body: { evento: "cantieri" } }).catch(() => {}); };
  const base = () => "#/" + (S.data.famiglia || "azienda") + "/";
  const optProv = (sel) => (AC.preventivi ? AC.preventivi.optProvince(sel) : "");
  const regioneDi = (sigla) => { const p = ((AC.preventivi && AC.preventivi.PROVINCE) || []).find((x) => x[0] === sigla); return p ? p[2] : ""; };
  const tag = (m, k, d) => { const x = m[k] || m[d]; return html`<span class="tag ${x[0]}">${x[1]}</span>`; };
  const stelle = (v) => (v && v.media ? "★ " + String(v.media).replace(".", ",") + " (" + v.n + ")" : "nessun voto");
  const bollino = (b) => (b && b.ok ? html`<span class="tag ok" title="Documenti verificati da AncheCasa">Documenti ok${(b.tipi || []).length ? " · " + b.tipi.map((t) => DOCN[t] || t).join(", ") : ""}</span>` : html`<span class="tag paused">Documenti da verificare</span>`);
  const caricamento = (el) => { el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s; };
  function nonPronto(el, e) {
    const m = err(e);
    const manca = /does not exist|schema cache|function|PGRST20/i.test(m);
    el.innerHTML = html`<div class="card empty"><strong>${manca ? "Questa parte non è ancora attiva sul database" : "Non riesco a leggere i dati"}</strong>
      <span>${manca ? "Manca app-25 su Supabase. Appena c'è, questa pagina funziona da sola." : m}</span></div>`.s;
  }
  const ERRORI = { limite_mese: "Hai raggiunto le richieste del mese. Scrivi ad AncheCasa per alzare il limite.", serve_verifica: "Per pubblicare servono documenti verificati e prova o abbonamento attivo.",
    lavorazione_intera: "Per i lavori ogni lavorazione va offerta (e scelta) per intero.", chiusa: "La richiesta è chiusa.", gia_decisa: "Su questa richiesta la scelta è già fatta.",
    serve_il_motivo: "Scegli il motivo per chi non è scelto.", gia_scelta: "La scelta è già fatta.", non_invitato: "Questa richiesta non è arrivata a te." };
  const spiega = (e) => { const m = err(e); const k = Object.keys(ERRORI).find((x) => m.indexOf(x) >= 0); return k ? ERRORI[k] : m; };

  /* ============================================================
     DATI DI ESEMPIO
     ============================================================ */
  const DEMO_KEY = "ac-demo-cantieri-v2";
  function demo() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { d = null; }
    if (d && d.cantieri) return d;
    const ora = new Date().toISOString(), ieri = new Date(Date.now() - 86400000).toISOString(), tre = new Date(Date.now() - 3 * 86400000).toISOString();
    d = {
      offro: { servizi: ["cartongesso", "tinteggiatura", "intonaci"], subappalto: true },
      bollino: { ok: true, tipi: ["durc", "pos", "patente"] },
      cantieri: [{ id: "k1", creato: tre, nome: "Villa Bianchi, ristrutturazione", committente: "privato", cig: "", cup: "", indirizzo: "Via Appia 120", comune: "Caserta", provincia: "CE", regione: "Campania", dal: piu(10), al: piu(120), importo: 180000, note: "", stato: "aperto",
        richieste: [
          { id: "q1", creato: ieri, tipo: "materiali", titolo: "Materiali per il piano terra", voci: [{ id: "a", servizio: "materiali", voce: "Cemento 32,5 R", qta: 40, um: "sacchi" }, { id: "b", servizio: "materiali", voce: "Ferro B450C Ø12", qta: 20, um: "q" }, { id: "c", servizio: "materiali", voce: "Blocchi laterizio 25x30", qta: 600, um: "pz" }],
            pagamenti: "Bonifico a 60 giorni", scadenza: piu(5), urgente: false, nota: "Scarico con gru, strada stretta", stato: "aperta", invitati: 7, domande: 1 },
          { id: "q2", creato: tre, tipo: "lavori", titolo: "Finiture interne", voci: [{ id: "l1", servizio: "cartongesso", voce: "Pareti in cartongesso", qta: 120, um: "m²" }, { id: "l2", servizio: "cartongesso", voce: "Controsoffitti", qta: 80, um: "m²" }, { id: "l3", servizio: "tinteggiatura", voce: "Tinteggiatura pareti e soffitti", qta: 420, um: "m²" }],
            pagamenti: "SAL mensili", scadenza: piu(8), urgente: false, nota: "", stato: "aperta", invitati: 10, domande: 0 }
        ] }],
      offerte: {
        q1: [
          { id: "o1", azienda_id: "z1", azienda: "Edilmateriali Volturno", righe: [{ id: "a", prezzo: 5.4 }, { id: "b", prezzo: 92 }, { id: "c", prezzo: 0.78 }], totale: 2524, tempi: "Consegna in 3 giorni", stato: "inviata", vicinanza: 0, sponsor: true, bollino: { ok: true, tipi: ["durc"] }, voto: { media: 4.6, n: 12 }, mail: "" },
          { id: "o2", azienda_id: "z2", azienda: "Caserta Laterizi", righe: [{ id: "a", prezzo: 5.1 }, { id: "c", prezzo: 0.72 }], totale: 636, tempi: "2 giorni", stato: "inviata", vicinanza: 1, sponsor: false, bollino: { ok: true, tipi: [] }, voto: { media: 4.2, n: 5 }, mail: "" }
        ],
        q2: [{ id: "o3", azienda_id: "z3", azienda: "Cartongessi Mattei", righe: [{ id: "l1", prezzo: 24 }, { id: "l2", prezzo: 28 }], totale: 5120, tempi: "15 giorni lavorativi", giorni: 15, stato: "inviata", vicinanza: 1, sponsor: false, bollino: { ok: true, tipi: ["durc", "pos", "patente"] }, voto: { media: 4.8, n: 9 }, mail: "" }]
      },
      domande: { q1: [{ id: "dm1", creato: ieri, testo: "C'è spazio per l'autogru davanti al cantiere?", sopralluogo: false, risposta: "", azienda: "Caserta Laterizi" }], q2: [] },
      perme: [
        { id: "p1", creato: ora, tipo: "lavori", titolo: "Cartongesso e controsoffitti uffici", voci: [{ id: "x1", servizio: "cartongesso", voce: "Pareti divisorie REI 60", qta: 200, um: "m²" }, { id: "x2", servizio: "cartongesso", voce: "Controsoffitto a quadrotte", qta: 350, um: "m²" }, { id: "x3", servizio: "imp_elettrico", voce: "Punti luce controsoffitto", qta: 60, um: "pz" }],
          pagamenti: "SAL mensili", prezzo: 15500, scadenza: piu(7), urgente: false, nota: "Lavori al secondo piano, montacarichi disponibile.", stato: "aperta", motivo_invito: "zona", cantiere: "Uffici Centro Direzionale", comune: "Caserta", provincia: "CE", committente: "pubblico", dal: piu(20), al: piu(60),
          vicinanza: 0, richiedente: "Edil Volturno Srl", voto_richiedente: { media: 4.5, n: 6 }, offerte: 2, mia: null, indirizzo: "", mail: "", domande: [{ testo: "I materiali li fornite voi?", sopralluogo: false, risposta: "No, li fornisce l'impresa.", mia: false }] },
        { id: "p2", creato: tre, tipo: "lavori", titolo: "Tinteggiatura villetta", voci: [{ id: "y1", servizio: "tinteggiatura", voce: "Pareti interne", qta: 380, um: "m²" }], pagamenti: "A fine lavori", scadenza: piu(-1), urgente: false, nota: "", stato: "scelta", motivo_invito: "invito",
          cantiere: "Villetta Maddaloni", comune: "Maddaloni", provincia: "CE", committente: "privato", vicinanza: 1, richiedente: "AncheCasa", voto_richiedente: { media: 5, n: 3 }, offerte: 3,
          mia: { id: "m2", righe: [{ id: "y1", prezzo: 7.5 }], totale: 2850, tempi: "6 giorni", stato: "scelta", motivo: "" }, indirizzo: "Via Napoli 44", mail: "lavori@anchecasa.it", domande: [] }
      ],
      cerca: [
        { id: "s1", nome: "Cartongessi Mattei", comune: "Aversa", vicinanza: 1, sponsor: true, bollino: { ok: true, tipi: ["durc", "pos", "patente"] }, voto: { media: 4.8, n: 9 } },
        { id: "s2", nome: "Finiture Russo", comune: "Caserta", vicinanza: 0, sponsor: false, bollino: { ok: false, tipi: [] }, voto: { media: null, n: 0 } }
      ]
    };
    return d;
  }
  function demoCambia(fn) { const d = demo(); fn(d); try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch (e) {} }

  const D = {
    cantieri() { if (!reale()) return Promise.resolve(demo().cantieri); return Q(db().rpc("cantieri_miei")); },
    salvaCantiere(p) {
      if (!reale()) { let id = p.id; demoCambia((d) => { if (!id) { id = "k" + Date.now(); d.cantieri.unshift(Object.assign({ id, creato: new Date().toISOString(), stato: "aperto", richieste: [] }, p)); } else Object.assign(d.cantieri.find((c) => c.id === id) || {}, p); }); return Promise.resolve(id); }
      return Q(db().rpc("cantiere_salva", { p: p }));
    },
    pubblica(p) {
      if (!reale()) { const id = "q" + Date.now(); demoCambia((d) => { const c = d.cantieri.find((x) => x.id === p.cantiere_id); c.richieste.unshift(Object.assign({ id, creato: new Date().toISOString(), stato: "aperta", invitati: 10, domande: 0 }, p)); d.offerte[id] = []; d.domande[id] = []; }); return Promise.resolve(id); }
      return Q(db().rpc("cantiere_pubblica", { p: p })).then((x) => { avvisa(); return x; });
    },
    offerte(rid) {
      if (!reale()) { const d = demo(); return Promise.resolve({ offerte: d.offerte[rid] || [], domande: d.domande[rid] || [], invitati: 10 }); }
      return Q(db().rpc("cantiere_offerte_di", { p_richiesta: rid }));
    },
    scegli(rid, scelte, motivi) {
      if (!reale()) {
        let scoperte = [];
        demoCambia((d) => {
          const c = d.cantieri.find((k) => k.richieste.some((r) => r.id === rid)); const r = c.richieste.find((x) => x.id === rid);
          r.stato = "scelta"; scoperte = r.voci.filter((v) => !scelte[v.id]);
          (d.offerte[rid] || []).forEach((o) => {
            const mie = Object.keys(scelte).filter((k) => scelte[k] === o.id);
            o.voci_scelte = mie; o.stato = !mie.length ? "non_scelta" : mie.length === o.righe.length ? "scelta" : "parziale";
            o.motivo = o.stato === "scelta" ? "" : (motivi[o.id] || {}).motivo || ""; if (mie.length) o.mail = "ufficio@" + o.azienda.toLowerCase().replace(/[^a-z]/g, "") + ".it";
          });
        });
        return Promise.resolve({ scoperte });
      }
      return Q(db().rpc("cantiere_scegli", { p_richiesta: rid, p_scelte: scelte, p_motivi: motivi })).then((x) => { avvisa(); return x; });
    },
    annulla(rid) {
      if (!reale()) { demoCambia((d) => d.cantieri.forEach((c) => c.richieste.forEach((r) => { if (r.id === rid) r.stato = "annullata"; }))); return Promise.resolve(); }
      return Q(db().rpc("cantiere_annulla", { p_richiesta: rid })).then(avvisa);
    },
    rispondi(id, testo, rid) {
      if (!reale()) { demoCambia((d) => { const q = (d.domande[rid] || []).find((x) => x.id === id); if (q) q.risposta = testo; }); return Promise.resolve(); }
      return Q(db().rpc("cantiere_rispondi", { p_domanda: id, p_risposta: testo })).then(avvisa);
    },
    perMe() { if (!reale()) return Promise.resolve(demo().perme); return Q(db().rpc("cantiere_richieste_per_me")); },
    offri(p) {
      if (!reale()) { demoCambia((d) => { const r = d.perme.find((x) => x.id === p.richiesta); const tot = p.righe.reduce((t, x) => t + x.prezzo * (Number((r.voci.find((v) => v.id === x.id) || {}).qta) || 1), 0); r.mia = Object.assign({ id: "m" + Date.now(), totale: tot, stato: "inviata", motivo: "" }, p); r.offerte++; }); return Promise.resolve(); }
      return Q(db().rpc("cantiere_offri", { p: p })).then(avvisa);
    },
    domanda(rid, testo, sop) {
      if (!reale()) { demoCambia((d) => { const r = d.perme.find((x) => x.id === rid); r.domande.push({ testo, sopralluogo: sop, risposta: "", mia: true }); }); return Promise.resolve(); }
      return Q(db().rpc("cantiere_domanda", { p_richiesta: rid, p_testo: testo, p_sopralluogo: sop })).then(avvisa);
    },
    voto(rid, azienda, voto, testo) {
      if (!reale()) { demoCambia((d) => { const r = d.perme.find((x) => x.id === rid); if (r) r.mio_voto = voto; Object.keys(d.offerte).forEach((k) => (d.offerte[k] || []).forEach((o) => { if (k === rid && o.azienda_id === azienda) o.mio_voto = voto; })); }); return Promise.resolve(); }
      return Q(db().rpc("cantiere_voto", { p_richiesta: rid, p_azienda: azienda, p_voto: voto, p_testo: testo || "" }));
    },
    cerca(servizio, prov, comune) { if (!reale()) return Promise.resolve(demo().cerca); return Q(db().rpc("subappaltatori_cerca", { p_servizio: servizio, p_provincia: prov, p_comune: comune })); },
    invita(rid, az) { if (!reale()) return Promise.resolve(); return Q(db().rpc("cantiere_invita", { p_richiesta: rid, p_azienda: az })).then(avvisa); },
    offro() {
      if (!reale()) return Promise.resolve(demo().offro);
      return uid().then((id) => Q(db().from("aziende_offro").select("*").eq("azienda_id", id).maybeSingle())).then((x) => x || { servizi: [], subappalto: true });
    },
    salvaOffro(o) {
      if (!reale()) { demoCambia((d) => { d.offro = o; }); return Promise.resolve(); }
      return uid().then((id) => Q(db().from("aziende_offro").upsert(Object.assign({ azienda_id: id, updated_at: new Date().toISOString() }, o))));
    },
    bollino() { if (!reale()) return Promise.resolve(demo().bollino); return uid().then((id) => Q(db().rpc("cnt_bollino", { p_azienda: id }))); }
  };

  /* ============================================================
     I MIEI CANTIERI (chi pubblica: aziende e AncheCasa)
     ============================================================ */
  let cantScelto = "", richScelta = "", nuovoCant = false, ripubblica = null;
  function formCantiere(c) {
    c = c || {};
    return html`<form id="kc-f" class="prefs wide en-grid">
      <label class="span2">Nome del cantiere<input name="nome" required maxlength="120" value="${c.nome || ""}" placeholder="es. Villa Bianchi, ristrutturazione"></label>
      <label>Comune<input name="comune" required maxlength="80" value="${c.comune || ""}"></label>
      <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProv(c.provincia || "")}</select></label>
      <label class="span2">Indirizzo (lo vede solo chi scegli)<input name="indirizzo" maxlength="160" value="${c.indirizzo || ""}"></label>
      <label>Dal<input type="date" name="dal" value="${c.dal || ""}"></label><label>Al<input type="date" name="al" value="${c.al || ""}"></label>
      <label>Importo dei lavori €<input name="importo" inputmode="decimal" value="${c.importo != null ? String(c.importo).replace(".", ",") : ""}"></label>
      <label>Committente<select name="committente"><option value="privato">Privato</option><option value="pubblico"${c.committente === "pubblico" ? " selected" : ""}>Pubblico (appalto)</option></select></label>
      <label>CIG (appalti pubblici)<input name="cig" maxlength="20" value="${c.cig || ""}"></label><label>CUP<input name="cup" maxlength="20" value="${c.cup || ""}"></label>
      <div class="row-actions span2"><button class="btn-in" type="submit">Salva il cantiere</button>${c.id ? "" : html`<button class="btn-ghost" type="button" data-annulla-c>Annulla</button>`}</div></form>`;
  }
  const rigaVoce = (tipo, v) => {
    const servizi = (GRUPPI.find((g) => g[0] === tipo) || GRUPPI[0])[2];
    return html`<tr><td><select name="servizio">${servizi.map((s) => html`<option value="${s[0]}"${v && v.servizio === s[0] ? " selected" : ""}>${s[1]}</option>`)}</select></td>
      <td><input name="voce" maxlength="160" value="${(v && v.voce) || ""}" placeholder="${tipo === "materiali" ? "es. cemento 32,5 R" : tipo === "personale" ? "es. 2 muratori qualificati" : "es. pareti in cartongesso"}"></td>
      <td class="pr-n"><input name="qta" inputmode="decimal" value="${v && v.qta != null ? String(v.qta).replace(".", ",") : ""}"></td>
      <td class="pr-u"><input name="um" maxlength="12" value="${(v && v.um) || UM[tipo]}"></td><td><button type="button" class="btn-mini" data-togli>✕</button></td></tr>`;
  };
  function formRichiesta(tipo, pre) {
    pre = pre || {};
    return html`<form id="kr-f" class="prefs wide">
      <div class="en-grid">
        <label>Cosa ti serve<select name="tipo">${Object.keys(TIPI).map((k) => html`<option value="${k}"${k === tipo ? " selected" : ""}>${TIPI[k]}</option>`)}</select></label>
        <label>Titolo<input name="titolo" required maxlength="120" value="${pre.titolo || ""}" placeholder="es. Materiali per il piano terra"></label>
      </div>
      <p class="note">${tipo === "materiali" ? "Riga per riga: chi risponde può togliere le voci che non ha, e tu puoi scegliere più fornitori." : tipo === "lavori" || tipo === "impianti" ? "Una lavorazione per riga o più righe per lavorazione: si può offrire anche per una sola lavorazione, ma intera." : tipo === "personale" ? "Arriva solo alle agenzie per il lavoro della zona: scrivi qualifica, numero di persone e periodo." : "Mezzi e attrezzature, con i giorni."}</p>
      <div class="en-scroll"><table class="mini-table pr-righe"><thead><tr><th>Servizio</th><th>Voce</th><th>Quantità</th><th>Unità</th><th></th></tr></thead>
        <tbody>${(pre.voci && pre.voci.length ? pre.voci : [null]).map((v) => rigaVoce(tipo, v))}</tbody></table></div>
      <div class="row-actions"><button type="button" class="btn-ghost" data-aggiungi>Aggiungi una riga</button></div>
      <div class="en-grid">
        <label>Pagamento (lo decidi tu)<select name="pag">${PAGAMENTI.map((x) => html`<option>${x}</option>`)}</select></label>
        <label>Offerte entro il<input type="date" name="scadenza" value="${piu(7)}"></label>
        <label>Prezzo a base € (facoltativo)<input name="prezzo" inputmode="decimal" value="${pre.prezzo != null ? String(pre.prezzo).replace(".", ",") : ""}" placeholder="quanto vuoi spendere al massimo"></label>
        <label class="span2">Note per chi fa l'offerta<textarea name="nota" maxlength="1500" placeholder="accesso al cantiere, orari, materiali forniti o no…"></textarea></label>
        <label class="span2">Ditte di fiducia da invitare (mail, separate da virgola: anche se non sono iscritte)<input name="inviti" placeholder="ufficio@ditta.it, info@altra.it"></label>
        <label class="check span2"><input type="checkbox" name="urgente"> Urgente: le aziende ricevono la mail subito (le altre richieste vanno nel riepilogo del giorno)</label>
      </div>
      <div class="row-actions"><button class="btn-in" type="submit">Pubblica la richiesta</button></div>
      <p class="note">Arriva alle prime 10 aziende verificate della zona che offrono questi servizi. Nome e voto della tua azienda si vedono; indirizzo e contatti solo a chi scegli.</p>
    </form>`;
  }
  function collegaFormRichiesta(box, c, dopo) {
    const f = box.querySelector("#kr-f");
    const tb = () => f.querySelector("tbody");
    f.tipo.addEventListener("change", () => { box.innerHTML = formRichiesta(f.tipo.value, { titolo: f.titolo.value }).s; collegaFormRichiesta(box, c, dopo); });
    f.addEventListener("click", (e) => {
      if (e.target.matches("[data-aggiungi]")) { const t = document.createElement("tbody"); t.innerHTML = rigaVoce(f.tipo.value, { servizio: (tb().lastElementChild || {}).querySelector ? tb().lastElementChild.querySelector("[name=servizio]").value : "" }).s; tb().appendChild(t.firstElementChild); }
      if (e.target.matches("[data-togli]")) { if (tb().children.length > 1) e.target.closest("tr").remove(); }
    });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const voci = [...tb().querySelectorAll("tr")].map((tr, i) => ({ id: "v" + (i + 1), servizio: tr.querySelector("[name=servizio]").value, voce: tr.querySelector("[name=voce]").value.trim(), qta: num(tr.querySelector("[name=qta]").value) || null, um: tr.querySelector("[name=um]").value.trim() })).filter((v) => v.voce.length >= 2);
      if (!voci.length) return toast("Scrivi almeno una voce.", "error");
      const inviti = f.inviti.value.split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).slice(0, 10);
      const p = { cantiere_id: c.id, tipo: f.tipo.value, titolo: f.titolo.value.trim(), voci, pagamenti: f.pag.value, scadenza: f.scadenza.value || null, urgente: f.urgente.checked, nota: f.nota.value.trim(), inviti, parent_id: (ripubblica && ripubblica.parent) || null, prezzo: f.prezzo.value.trim() ? num(f.prezzo.value) : null };
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      D.pubblica(p).then((id) => { ripubblica = null; richScelta = id; toast(reale() ? "Pubblicata: arriva alle aziende della zona." : "Anteprima: pubblicata solo qui, nessuna mail."); dopo(); },
        (e2) => { btn.disabled = false; toast(spiega(e2), "error"); });
    });
  }

  function confronto(box, c, r, dati, ridisegna) {
    const off = dati.offerte || [], dom = dati.domande || [];
    const perGruppo = r.tipo === "lavori" || r.tipo === "impianti";
    const prezzo = (o, vid) => { const x = (o.righe || []).find((y) => y.id === vid); return x ? Number(x.prezzo) : null; };
    const aperta = r.stato === "aperta";
    const gruppi = [...new Set(r.voci.map((v) => v.servizio))];
    const intestaOff = off.map((o) => html`<th class="num">${o.azienda}<br><small>${VICINO[o.vicinanza] || ""}${o.sponsor ? " · sponsor" : ""} · ${stelle(o.voto)}</small><br>${bollino(o.bollino)}</th>`);
    const cella = (o, v, chiave) => {
      const p = prezzo(o, v.id);
      if (p == null) return html`<td class="num"><small>non offerta</small></td>`;
      const scelto = (o.voci_scelte || []).indexOf(v.id) >= 0;
      return html`<td class="num">${eur(p)}<br><small>${eur(p * (Number(v.qta) || 1))}</small>${aperta && off.length && (!perGruppo || chiave) ? html`<br><label class="check"><input type="radio" name="${perGruppo ? "g-" + v.servizio : "v-" + v.id}" value="${o.id}"> scegli</label>` : scelto ? html`<br><span class="tag ok">scelta</span>` : ""}</td>`;
    };
    box.innerHTML = html`<section class="card"><h2>${r.titolo} ${tag(STATO_R, r.stato, "aperta")}</h2>
        <p class="note">${TIPI[r.tipo]}${r.prezzo ? " · prezzo a base " + eur(r.prezzo) : ""} · pagamento: ${r.pagamenti || "—"} · offerte entro il ${dataIt(r.scadenza) || "—"} · arrivata a ${dati.invitati || 0} aziende${r.urgente ? " · urgente" : ""}${r.nota ? " · " + r.nota : ""}</p>
        ${off.length ? html`<form id="kx-f"><div class="en-scroll"><table class="mini-table"><thead><tr><th>Voce</th><th>Quantità</th>${intestaOff}${perGruppo || !aperta ? "" : html`<th>Nessuno</th>`}</tr></thead><tbody>
            ${perGruppo ? gruppi.map((g) => {
              const vv = r.voci.filter((v) => v.servizio === g);
              return html`<tr><td colspan="${2 + off.length}"><b>${SERV[g] || g}</b>${aperta ? html` <label class="check"><input type="radio" name="g-${g}" value="" checked> nessuno</label>` : ""}</td></tr>
                ${vv.map((v, i) => html`<tr><td>${v.voce}</td><td>${v.qta || ""} ${v.um || ""}</td>${off.map((o) => cella(o, v, i === 0 && vv.every((x) => prezzo(o, x.id) != null)))}</tr>`)}`;
            }) : r.voci.map((v) => html`<tr><td>${v.voce}</td><td>${v.qta || ""} ${v.um || ""}</td>${off.map((o) => cella(o, v, true))}${aperta ? html`<td><label class="check"><input type="radio" name="v-${v.id}" value="" checked></label></td>` : ""}</tr>`)}
            <tr><td><b>Totale offerto</b></td><td></td>${off.map((o) => html`<td class="num"><b>${eur(o.totale)}</b><br><small>${o.tempi || ""}</small><br>${tag(STATO_O, o.stato, "inviata")}${o.motivo ? html`<br><small>${MOTIVI[o.motivo] || o.motivo}</small>` : ""}</td>`)}</tr>
          </tbody></table></div>
          ${aperta ? html`<h3>Chi non scegli: il motivo</h3><div class="en-lista">${off.map((o) => html`<div class="nm-o"><b>${o.azienda}</b><label>Motivo<select name="m-${o.id}">${Object.keys(MOTIVI).map((k) => html`<option value="${k}">${MOTIVI[k]}</option>`)}</select></label><label>Nota<input name="n-${o.id}" maxlength="300"></label></div>`)}</div>
            <p class="note">Il motivo vale per chi non viene scelto (o scelto solo in parte).</p>
            <div class="row-actions"><button class="btn-in" type="submit">Conferma la scelta</button><button class="btn-ghost" type="button" data-annulla-r>Annulla la richiesta</button></div>` : ""}</form>`
          : html`<p class="note">${aperta ? "Ancora nessuna offerta. Se in 48 ore non arriva niente, la richiesta si allarga alla regione." : "Nessuna offerta."}</p>${aperta ? html`<div class="row-actions"><button class="btn-ghost" type="button" data-annulla-r>Annulla la richiesta</button></div>` : ""}`}
        ${!aperta && off.some((o) => o.mail) ? html`<h3>Scelte: contatti e voto</h3>${off.filter((o) => o.mail).map((o) => html`<div class="en-rrow"><div class="en-rinfo"><b>${o.azienda}</b><small><a href="mailto:${o.mail}">${o.mail}</a></small></div>
            <div class="en-ract">${o.mio_voto ? html`<span class="tag ok">Votata ${"★".repeat(o.mio_voto)}</span>` : html`<select data-voto="${o.azienda_id}"><option value="">Lascia il voto…</option>${[5, 4, 3, 2, 1].map((n) => html`<option value="${n}">${"★".repeat(n)}</option>`)}</select>`}</div></div>`)}` : ""}
        ${r.scoperte && r.scoperte.length ? html`<div class="card en-banner"><div><h2>${r.scoperte.length} voci senza fornitore</h2><p class="note">${r.scoperte.map((v) => v.voce).join(", ")}</p></div><button class="btn-in" type="button" data-ripubblica>Ripubblica le voci scoperte</button></div>` : ""}
      </section>
      <section class="card"><h2>Domande delle aziende</h2>
        ${dom.length ? dom.map((q) => html`<div class="en-rrow"><div class="en-rinfo"><b>${q.azienda}${q.sopralluogo ? " · chiede un sopralluogo" : ""}</b><small>«${q.testo}» · ${giorniFa(q.creato)}</small>
          ${q.risposta ? html`<small>Risposta: «${q.risposta}»</small>` : html`<form class="nm-o" data-risp="${q.id}"><input name="t" maxlength="1500" required placeholder="La risposta la vedono tutte le aziende invitate"><button class="btn-ghost" type="submit">Rispondi</button></form>`}</div></div>`)
          : html`<p class="note">Nessuna domanda.</p>`}
      </section>
      ${aperta && (r.tipo === "lavori" || r.tipo === "impianti") ? html`<section class="card"><h2>Invita un subappaltatore</h2><p class="note">Cerca chi ha detto di lavorare in subappalto in questo settore e in questa zona: riceve la richiesta, i contatti arrivano solo se lo scegli.</p><div id="kx-cerca"></div></section>` : ""}`.s;

    box.querySelectorAll("[data-risp]").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); D.rispondi(f.getAttribute("data-risp"), f.t.value.trim(), r.id).then(() => { toast("Risposta mandata alle aziende invitate."); ridisegna(); }, (e2) => toast(spiega(e2), "error")); }));
    box.querySelectorAll("[data-annulla-r]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.ok !== "1") { b.dataset.ok = "1"; b.textContent = "Confermi?"; return; } D.annulla(r.id).then(() => { toast("Richiesta annullata."); ridisegna(); }, (e2) => toast(spiega(e2), "error")); }));
    box.querySelectorAll("[data-voto]").forEach((s) => s.addEventListener("change", () => { if (!s.value) return; D.voto(r.id, s.getAttribute("data-voto"), Number(s.value)).then(() => { toast("Voto salvato."); ridisegna(); }, (e2) => toast(spiega(e2), "error")); }));
    const rp = box.querySelector("[data-ripubblica]");
    if (rp) rp.addEventListener("click", () => { ripubblica = { parent: r.id, tipo: r.tipo, titolo: r.titolo + " (voci rimaste)", voci: r.scoperte }; richScelta = ""; ridisegna(); });
    const fx = box.querySelector("#kx-f");
    if (fx && aperta) fx.addEventListener("submit", (e) => {
      e.preventDefault();
      const scelte = {};
      if (perGruppo) gruppi.forEach((g) => { const x = fx.querySelector("[name='g-" + g + "']:checked"); if (x && x.value) r.voci.filter((v) => v.servizio === g).forEach((v) => { scelte[v.id] = x.value; }); });
      else r.voci.forEach((v) => { const x = fx.querySelector("[name='v-" + v.id + "']:checked"); if (x && x.value) scelte[v.id] = x.value; });
      if (!Object.keys(scelte).length) return toast("Scegli almeno una voce, oppure annulla la richiesta.", "error");
      const motivi = {}; off.forEach((o) => { motivi[o.id] = { motivo: fx["m-" + o.id].value, nota: fx["n-" + o.id].value.trim() }; });
      D.scegli(r.id, scelte, motivi).then((x) => {
        toast("Scelta fatta: chi è scelto riceve i tuoi contatti, gli altri il motivo.");
        r.scoperte = (x && x.scoperte) || []; r.stato = "scelta";
        D.offerte(r.id).then((d2) => confronto(box, c, r, d2, ridisegna));
      }, (e2) => toast(spiega(e2), "error"));
    });
    const kc = box.querySelector("#kx-cerca");
    if (kc) cercaBox(kc, { provincia: c.provincia, comune: c.comune, servizi: gruppi, richiesta: r.id });
  }

  V.cnt_cantieri = {
    title: "I miei cantieri",
    sub: "Crea il cantiere e da lì chiedi materiali, noleggi, lavori in subappalto, impianti e personale. La richiesta arriva alle aziende della zona che offrono quel servizio: confronti le offerte voce per voce e scegli tu.",
    render(el) {
      caricamento(el);
      D.cantieri().then((cs) => {
        cs = cs || [];
        if (!cs.some((c) => c.id === cantScelto)) cantScelto = (cs[0] || {}).id || "";
        const c = cs.find((x) => x.id === cantScelto);
        if (!cs.length || nuovoCant) {
          el.innerHTML = html`<section class="card"><h2>${cs.length ? "Nuovo cantiere" : "Il tuo primo cantiere"}</h2>${formCantiere()}</section>`.s;
          const f = el.querySelector("#kc-f");
          const an = el.querySelector("[data-annulla-c]"); if (an) an.addEventListener("click", () => { nuovoCant = false; V.cnt_cantieri.render(el); });
          if (!cs.length && an) an.remove();
          f.addEventListener("submit", (e) => {
            e.preventDefault();
            const sig = f.prov.value;
            D.salvaCantiere({ nome: f.nome.value.trim(), comune: f.comune.value.trim(), provincia: sig, regione: regioneDi(sig), indirizzo: f.indirizzo.value.trim(), dal: f.dal.value || null, al: f.al.value || null,
              importo: f.importo.value.trim() ? num(f.importo.value) : null, committente: f.committente.value, cig: f.cig.value.trim(), cup: f.cup.value.trim() })
              .then((id) => { nuovoCant = false; cantScelto = id; toast("Cantiere salvato."); V.cnt_cantieri.render(el); }, (e2) => toast(spiega(e2), "error"));
          });
          return;
        }
        const rs = c.richieste || [];
        el.innerHTML = html`<div class="sv-schede">${cs.map((x) => html`<button type="button" class="${x.id === c.id ? "btn-in" : "btn-ghost"}" data-k="${x.id}">${x.nome}</button>`)}<button type="button" class="btn-ghost" data-nuovo>+ Nuovo cantiere</button></div>
          <section class="card"><h2>${c.nome} <span class="tag ${c.committente === "pubblico" ? "wait" : "new"}">${c.committente === "pubblico" ? "Appalto pubblico" : "Committente privato"}</span></h2>
            <p class="note">${c.comune} (${c.provincia})${c.indirizzo ? " · " + c.indirizzo : ""}${c.dal ? " · dal " + dataIt(c.dal) : ""}${c.al ? " al " + dataIt(c.al) : ""}${c.importo ? " · lavori " + eur(c.importo) : ""}${c.cig ? " · CIG " + c.cig : ""}${c.cup ? " · CUP " + c.cup : ""}</p>
            ${c.committente === "pubblico" ? html`<p class="note">Appalto pubblico: i subappalti vanno autorizzati dalla stazione appaltante e i pagamenti sono tracciati con CIG e CUP.</p>` : ""}</section>
          <div class="pv-due">
            <section class="card"><h2>${ripubblica ? "Ripubblica le voci rimaste" : "Pubblica una richiesta"}</h2><div id="kr-box"></div></section>
            <section class="card"><h2>Richieste di questo cantiere</h2>
              ${rs.length ? html`<div class="en-lista">${rs.map((r) => html`<div class="en-rrow ${r.id === richScelta ? "on" : ""}"><div class="en-rinfo"><div>${tag(STATO_R, r.stato, "aperta")} <b>${r.titolo}</b></div>
                  <small>${TIPI[r.tipo]} · ${giorniFa(r.creato)} · ${r.offerte || 0} offerte${r.domande ? " · " + r.domande + " domande da rispondere" : ""}${r.allargata_il ? " · allargata alla regione" : ""}</small></div>
                <div class="en-ract"><button class="btn-mini" type="button" data-r="${r.id}">Apri</button></div></div>`)}</div>` : html`<p class="note">Ancora nessuna richiesta.</p>`}
            </section>
          </div>
          <div id="kx-box"></div>`.s;
        el.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => { cantScelto = b.getAttribute("data-k"); richScelta = ""; ripubblica = null; V.cnt_cantieri.render(el); }));
        el.querySelector("[data-nuovo]").addEventListener("click", () => { nuovoCant = true; V.cnt_cantieri.render(el); });
        const kr = el.querySelector("#kr-box");
        kr.innerHTML = formRichiesta(ripubblica ? ripubblica.tipo : "materiali", ripubblica || {}).s;
        collegaFormRichiesta(kr, c, () => V.cnt_cantieri.render(el));
        const apri = (rid) => {
          richScelta = rid;
          const r = rs.find((x) => x.id === rid); if (!r) return;
          const kx = el.querySelector("#kx-box");
          kx.innerHTML = html`<div class="card"><p class="note">Carico le offerte…</p></div>`.s;
          D.offerte(rid).then((d) => { confronto(kx, c, r, d || {}, () => V.cnt_cantieri.render(el)); kx.scrollIntoView({ behavior: "smooth", block: "start" }); }, (e) => nonPronto(kx, e));
        };
        el.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => apri(b.getAttribute("data-r"))));
        if (richScelta && rs.some((r) => r.id === richScelta)) apri(richScelta);
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     CERCA SUBAPPALTATORI (solo chi lo ha detto, nella zona, senza contatti)
     ============================================================ */
  function cercaBox(box, opz) {
    opz = opz || {};
    const lav = GRUPPI.filter((g) => g[0] === "lavori" || g[0] === "impianti");
    box.innerHTML = html`<form class="prefs wide en-grid" data-cerca>
        <label>Settore<select name="s">${lav.map((g) => html`<optgroup label="${g[1]}">${g[2].map((s) => html`<option value="${s[0]}"${(opz.servizi || []).indexOf(s[0]) >= 0 ? " selected" : ""}>${s[1]}</option>`)}</optgroup>`)}</select></label>
        <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProv(opz.provincia || "")}</select></label>
        <label>Comune<input name="comune" maxlength="80" value="${opz.comune || ""}"></label>
        <div class="row-actions"><button class="btn-in" type="submit">Cerca</button></div></form><div data-ris></div>`.s;
    const f = box.querySelector("[data-cerca]"), ris = box.querySelector("[data-ris]");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      ris.innerHTML = html`<p class="note">Cerco…</p>`.s;
      const prima = opz.richiesta ? Promise.resolve([]) : D.cantieri().then((cs) => [].concat.apply([], (cs || []).map((c) => (c.richieste || []).filter((r) => r.stato === "aperta" && (r.tipo === "lavori" || r.tipo === "impianti")).map((r) => ({ id: r.id, nome: c.nome + " · " + r.titolo }))))).catch(() => []);
      Promise.all([D.cerca(f.s.value, f.prov.value, f.comune.value.trim()), prima]).then(([l, mie]) => {
        ris.innerHTML = html`${(l || []).length ? l.map((a) => html`<div class="en-rrow"><div class="en-rinfo"><div><span class="tag new">${VICINO[a.vicinanza] || "In zona"}</span>${a.sponsor ? html` <span class="tag wait">Sponsor</span>` : ""} <b>${a.nome}</b> <small>· ${a.comune || ""} · ${stelle(a.voto)}</small></div>${bollino(a.bollino)}</div>
            <div class="en-ract">${opz.richiesta ? html`<button class="btn-ghost" type="button" data-inv="${a.id}">Invita a questa richiesta</button>`
              : mie.length ? html`<select data-sel="${a.id}"><option value="">Invita a una mia richiesta…</option>${mie.map((m) => html`<option value="${m.id}">${m.nome}</option>`)}</select>` : html`<small>Pubblica una richiesta di lavori da «I miei cantieri» per invitarlo.</small>`}</div></div>`)
          : html`<p class="note">Nessun subappaltatore ha indicato questo settore in questa zona. La richiesta pubblicata arriva comunque alle aziende che lo offrono.</p>`}`.s;
        const invita = (rid, az, b) => D.invita(rid, az).then(() => { toast(reale() ? "Invitato: riceve la richiesta per mail." : "Anteprima: invitato solo qui."); if (b) { b.disabled = true; b.textContent = "Invitato"; } }, (e2) => toast(spiega(e2), "error"));
        ris.querySelectorAll("[data-inv]").forEach((b) => b.addEventListener("click", () => invita(opz.richiesta, b.getAttribute("data-inv"), b)));
        ris.querySelectorAll("[data-sel]").forEach((s) => s.addEventListener("change", () => { if (s.value) invita(s.value, s.getAttribute("data-sel")); }));
      }, (e2) => nonPronto(ris, e2));
    });
  }
  V.cnt_cerca = {
    title: "Cerca subappaltatori",
    sub: "Solo le aziende che hanno detto di lavorare in subappalto in quel settore e in quella zona. Nessun contatto: le inviti a una tua richiesta e scegli tu.",
    render(el) { el.innerHTML = html`<section class="card"><div id="cc-box"></div></section>`.s; cercaBox(el.querySelector("#cc-box"), {}); }
  };

  /* ============================================================
     RICHIESTE PER TE (chi offre)
     ============================================================ */
  let aperta = "";
  V.cnt_perme = {
    title: "Richieste per te",
    sub: "Le richieste dei cantieri della tua zona per i servizi che offri. Metti il prezzo voce per voce: le condizioni di pagamento le decide chi chiede.",
    render(el) {
      caricamento(el);
      D.perMe().then((l) => {
        l = l || [];
        const aperte = l.filter((r) => r.stato === "aperta" && !(r.scadenza && r.scadenza < new Date().toISOString().slice(0, 10)));
        const altre = l.filter((r) => aperte.indexOf(r) < 0);
        const riga = (r) => html`<div class="en-rrow"><div class="en-rinfo"><div>${r.urgente ? html`<span class="tag new">Urgente</span> ` : ""}<span class="tag wait">${VICINO[r.vicinanza] || "In zona"}</span> <b>${r.titolo}</b> <small>· ${r.comune} (${r.provincia}) · ${TIPI[r.tipo]} · ${giorniFa(r.creato)}</small></div>
            <small>${r.richiedente} · pagamenti ${stelle(r.voto_richiedente)}${r.prezzo ? " · prezzo a base " + eur(r.prezzo) : ""} · ${r.pagamenti || "pagamento da definire"}${r.scadenza ? " · offerte entro il " + dataIt(r.scadenza) : ""} · ${r.offerte} offerte arrivate</small></div>
          <div class="en-ract">${r.mia ? tag(STATO_O, r.mia.stato, "inviata") : ""} <button class="btn-mini" type="button" data-a="${r.id}">${r.id === aperta ? "Chiudi" : "Apri"}</button></div></div>
          ${r.id === aperta ? scheda(r) : ""}`;
        el.innerHTML = html`<section class="card"><h2>Da fare <span class="ra-n">${aperte.filter((r) => !r.mia).length}</span></h2>${aperte.length ? aperte.map(riga) : html`<p class="note">Nessuna richiesta aperta. Arrivano per i servizi che hai in «Cosa offro», nella tua zona.</p>`}</section>
          <section class="card"><h2>Chiuse e decise</h2>${altre.length ? altre.map(riga) : html`<p class="note">Ancora niente.</p>`}</section>`.s;
        el.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => { const id = b.getAttribute("data-a"); aperta = aperta === id ? "" : id; V.cnt_perme.render(el); }));
        const r = l.find((x) => x.id === aperta);
        if (r) collegaScheda(el, r);
      }, (e) => nonPronto(el, e));
    }
  };
  function scheda(r) {
    const puo = r.stato === "aperta" && !(r.scadenza && r.scadenza < new Date().toISOString().slice(0, 10)) && (!r.mia || r.mia.stato === "inviata");
    const perGruppo = r.tipo === "lavori" || r.tipo === "impianti";
    const pz = (vid) => { const x = r.mia && (r.mia.righe || []).find((y) => y.id === vid); return x ? String(x.prezzo).replace(".", ",") : ""; };
    const scelto = r.mia && (r.mia.stato === "scelta" || r.mia.stato === "parziale");
    return html`<div class="card" style="margin:6px 0 14px">
      <p class="note">Cantiere «${r.cantiere}» · ${r.committente === "pubblico" ? "appalto pubblico" : "committente privato"}${r.dal ? " · lavori dal " + dataIt(r.dal) : ""}${r.al ? " al " + dataIt(r.al) : ""}${r.nota ? " · " + r.nota : ""}</p>
      ${scelto ? html`<div class="card en-banner"><div><h2>${r.mia.stato === "parziale" ? "Scelta in parte" : "Ti hanno scelto"}</h2><p class="note">Indirizzo: ${r.indirizzo || "—"} · contatto: ${r.mail || "—"}</p></div>
          ${r.mio_voto ? html`<span class="tag ok">Hai votato ${"★".repeat(r.mio_voto)}</span>` : html`<select data-vc="${r.id}"><option value="">Voto sui pagamenti…</option>${[5, 4, 3, 2, 1].map((n) => html`<option value="${n}">${"★".repeat(n)}</option>`)}</select>`}</div>` : ""}
      ${r.mia && r.mia.stato === "non_scelta" ? html`<p class="note"><b>Non scelta.</b> Motivo: ${MOTIVI[r.mia.motivo] || r.mia.motivo || "—"}${r.mia.motivo_nota ? " («" + r.mia.motivo_nota + "»)" : ""}</p>` : ""}
      <form class="prefs wide" data-of="${r.id}">
        <p class="note">${perGruppo ? "Puoi offrire anche per una sola lavorazione, ma per tutte le sue righe. Lascia vuote le lavorazioni che non fai." : r.tipo === "materiali" ? "Lascia vuote le voci che non hai: offri il resto." : "Prezzo unitario per ogni voce."}</p>
        <div class="en-scroll"><table class="mini-table"><thead><tr>${perGruppo ? html`<th>Lavorazione</th>` : ""}<th>Voce</th><th>Quantità</th><th>Prezzo unitario €</th><th class="num">Importo</th></tr></thead><tbody>
          ${r.voci.map((v) => html`<tr>${perGruppo ? html`<td><small>${SERV[v.servizio] || v.servizio}</small></td>` : ""}<td>${v.voce}</td><td>${v.qta || ""} ${v.um || ""}</td>
            <td class="pr-n"><input name="p-${v.id}" inputmode="decimal" value="${pz(v.id)}"${puo ? "" : " disabled"}></td><td class="num" data-imp="${v.id}">—</td></tr>`)}
          <tr><td colspan="${perGruppo ? 4 : 3}"><b>Totale</b></td><td class="num"><b data-tot>—</b></td></tr></tbody></table></div>
        ${puo ? html`<div class="en-grid"><label>Tempi<input name="tempi" maxlength="120" value="${(r.mia && r.mia.tempi) || ""}" placeholder="es. consegna in 3 giorni, 15 giorni lavorativi"></label>
          <label>Note<input name="nota" maxlength="1000" value="${(r.mia && r.mia.nota) || ""}"></label></div>
          <p class="note">Pagamento deciso da ${r.richiedente}: <b>${r.pagamenti || "da definire"}</b>. Mandando l'offerta lo accetti.</p>
          <div class="row-actions"><button class="btn-in" type="submit">${r.mia ? "Aggiorna l'offerta" : "Manda l'offerta"}</button></div>` : ""}
      </form>
      <h3>Domande</h3>
      ${(r.domande || []).length ? html`<div class="en-lista">${r.domande.map((q) => html`<div class="en-rrow"><div class="en-rinfo"><small>${q.mia ? "Tu" : "Un'azienda"}${q.sopralluogo ? " (sopralluogo)" : ""}: «${q.testo}»</small><small>${q.risposta ? "Risposta: «" + q.risposta + "»" : "In attesa di risposta"}</small></div></div>`)}</div>` : html`<p class="note">Nessuna domanda.</p>`}
      ${r.stato === "aperta" ? html`<form class="nm-o" data-dm="${r.id}"><input name="t" maxlength="800" required placeholder="Fai una domanda: passa da AncheCasa, la risposta la vedono tutti gli invitati"><label class="check"><input type="checkbox" name="sop"> Chiedo un sopralluogo</label><button class="btn-ghost" type="submit">Manda</button></form>` : ""}
    </div>`;
  }
  function collegaScheda(el, r) {
    const f = el.querySelector("[data-of='" + r.id + "']");
    const conta = () => {
      let t = 0;
      r.voci.forEach((v) => { const p = num(f["p-" + v.id].value); const i = p * (Number(v.qta) || 1); t += i; f.querySelector("[data-imp='" + v.id + "']").textContent = p ? eur(i) : "—"; });
      f.querySelector("[data-tot]").textContent = eur(t);
    };
    f.addEventListener("input", conta); conta();
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const righe = r.voci.filter((v) => num(f["p-" + v.id].value) > 0).map((v) => ({ id: v.id, prezzo: num(f["p-" + v.id].value) }));
      if (!righe.length) return toast("Metti il prezzo almeno a una voce.", "error");
      if (r.tipo === "lavori" || r.tipo === "impianti") {
        const gs = [...new Set(r.voci.map((v) => v.servizio))];
        const rotta = gs.find((g) => { const vv = r.voci.filter((v) => v.servizio === g); const n = vv.filter((v) => righe.some((x) => x.id === v.id)).length; return n > 0 && n < vv.length; });
        if (rotta) return toast("«" + (SERV[rotta] || rotta) + "»: metti il prezzo a tutte le sue righe, o a nessuna.", "error");
      }
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      D.offri({ richiesta: r.id, righe, tempi: f.tempi.value.trim(), nota: f.nota.value.trim() }).then(() => { toast(reale() ? "Offerta mandata: chi chiede la vede subito." : "Anteprima: offerta registrata solo qui."); V.cnt_perme.render(el); },
        (e2) => { btn.disabled = false; toast(spiega(e2), "error"); });
    });
    const dm = el.querySelector("[data-dm='" + r.id + "']");
    if (dm) dm.addEventListener("submit", (e) => { e.preventDefault(); D.domanda(r.id, dm.t.value.trim(), dm.sop.checked).then(() => { toast("Domanda mandata."); V.cnt_perme.render(el); }, (e2) => toast(spiega(e2), "error")); });
    const vc = el.querySelector("[data-vc='" + r.id + "']");
    if (vc) vc.addEventListener("change", () => { if (vc.value) D.voto(r.id, r.richiedente_id || "", Number(vc.value)).then(() => { toast("Voto salvato."); V.cnt_perme.render(el); }, (e2) => toast(spiega(e2), "error")); });
  }

  /* ============================================================
     COSA OFFRO (e dove: la stessa zona di tutte le richieste)
     ============================================================ */
  V.cnt_offro = {
    title: "Cosa offro",
    sub: "I servizi che offri e dove lavori: le richieste dei cantieri arrivano solo per questi, nella tua zona.",
    render(el) {
      caricamento(el);
      Promise.all([D.offro(), D.bollino().catch(() => null)]).then(([o, b]) => {
        const pack = (AC.store.data.profilo && AC.store.data.profilo.tipoAzienda) || "";
        const apl = pack === "apl";
        const ha = (s) => (o.servizi || []).indexOf(s) >= 0;
        el.innerHTML = html`<div class="pv-due">
          <section class="card"><h2>Cosa offro</h2>
            <form id="co-f" class="prefs wide">
              ${GRUPPI.filter((g) => g[0] !== "personale" || apl).map((g) => html`<fieldset class="co-gr"><legend>${g[1]}</legend>${g[2].map((s) => html`<label class="check"><input type="checkbox" name="s" value="${s[0]}"${ha(s[0]) ? " checked" : ""}> ${s[1]}</label>`)}</fieldset>`)}
              <label class="check"><input type="checkbox" name="sub"${o.subappalto !== false ? " checked" : ""}> Lavoro anche in subappalto per altre imprese (mi trovano in «Cerca subappaltatori»)</label>
              <div class="row-actions"><button class="btn-in" type="submit">Salva</button></div></form></section>
          <section class="card"><h2>Il tuo bollino</h2>${bollino(b)}
            <p class="note">Si vede accanto alle tue offerte. Carica DURC, POS e patente a crediti in «Documenti e abbonamento»: li controlla AncheCasa.</p>
            ${(o.servizi || []).some((s) => GRUPPO_DI[s] === "impianti") && !(b && (b.tipi || []).indexOf("abilitazione") >= 0) ? html`<p class="note"><b>Impianti:</b> serve la visura con l'abilitazione DM 37/08. Caricala come «Abilitazione impianti».</p>` : ""}
            <a class="btn-ghost" href="${base()}az-documenti">Documenti e abbonamento</a></section></div>
          <section class="card"><h2>Dove lavori</h2><div id="co-zona"></div></section>`.s;
        const f = el.querySelector("#co-f");
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          const servizi = [...f.querySelectorAll("[name=s]:checked")].map((x) => x.value);
          D.salvaOffro({ servizi, subappalto: f.sub.checked }).then(() => toast("Salvato: ricevi le richieste per questi servizi."), (e2) => toast(spiega(e2), "error"));
        });
        if (V.mat_zona) V.mat_zona.render(el.querySelector("#co-zona"));
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     RETE E ADMIN: la scheda delle aziende con i voti
     ============================================================ */
  V["re-recensioni"] = {
    title: "Voti delle aziende",
    sub: "Come lavorano le aziende della zona: voto di chi le ha scelte (qualità e tempi) e voto sui pagamenti.",
    render(el) {
      const reg = ((AC.preventivi && AC.preventivi.PROVINCE) || []).reduce((a, p) => (a.indexOf(p[2]) < 0 ? a.concat([p[2]]) : a), []);
      el.innerHTML = html`<section class="card"><form id="rv-f" class="nm-o"><label>Regione<select name="r"><option value="">Tutta Italia</option>${reg.map((x) => html`<option>${x}</option>`)}</select></label><button class="btn-ghost" type="submit">Mostra</button></form><div id="rv-l"><p class="note">Caricamento…</p></div></section>`.s;
      const l = el.querySelector("#rv-l");
      const carica = (r) => (reale() ? Q(db().rpc("aziende_voti_scheda", { p_regione: r })) : Promise.resolve([
        { nome: "Cartongessi Mattei", comune: "Aversa", regione: "Campania", servizi: ["cartongesso"], esecutore: { media: 4.8, n: 9 }, committente: { media: null, n: 0 }, bollino: { ok: true, tipi: ["durc", "pos"] }, sponsor: true, richieste: 0, offerte: 14 },
        { nome: "Edil Volturno Srl", comune: "Capua", regione: "Campania", servizi: ["murature"], esecutore: { media: 4.1, n: 4 }, committente: { media: 4.5, n: 6 }, bollino: { ok: true, tipi: [] }, sponsor: false, richieste: 8, offerte: 3 }
      ])).then((x) => {
        l.innerHTML = (x || []).length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>Azienda</th><th>Dove</th><th>Servizi</th><th>Come lavora</th><th>Come paga</th><th>Documenti</th><th class="num">Richieste</th><th class="num">Offerte</th></tr></thead><tbody>
          ${x.map((a) => html`<tr><td><b>${a.nome}</b>${a.sponsor ? html` <span class="tag wait">Sponsor</span>` : ""}</td><td>${a.comune}${a.regione ? " · " + a.regione : ""}</td><td><small>${(a.servizi || []).map((s) => SERV[s] || s).join(", ")}</small></td>
            <td>${stelle(a.esecutore)}</td><td>${stelle(a.committente)}</td><td>${bollino(a.bollino)}</td><td class="num">${a.richieste}</td><td class="num">${a.offerte}</td></tr>`)}</tbody></table></div>`.s : html`<p class="note">Nessuna azienda in questa regione.</p>`.s;
      }, (e) => nonPronto(l, e));
      carica("");
      el.querySelector("#rv-f").addEventListener("submit", (e) => { e.preventDefault(); l.innerHTML = html`<p class="note">Caricamento…</p>`.s; carica(e.target.r.value); });
    }
  };
  V["aziende-voti"] = V["re-recensioni"];
  // 12.10.2026 (Nando 14:28): la scheda «Subappalti» della cartella Gare dell'impresa ora è vera: cerca e invita.
  V.subappalti = {
    title: "Subappalti",
    sub: "Cerca i subappaltatori che lavorano in quel settore e in quella zona e invitali a una richiesta del tuo cantiere. Le richieste che ricevi tu sono in «Richieste per te».",
    render(el) {
      el.innerHTML = html`<div class="row-actions"><a class="btn-ghost" href="${base()}cnt_cantieri">I miei cantieri</a><a class="btn-ghost" href="${base()}cnt_perme">Richieste per te</a></div><section class="card"><div id="sa-box"></div></section>`.s;
      cercaBox(el.querySelector("#sa-box"), {});
    }
  };

  AC.cantieri = {
    SERV: SERV, GRUPPI: GRUPPI, GRUPPO_DI: GRUPPO_DI,
    // 12.10.2026, app-26: la pratica di ristrutturazione pubblica il suo computo alle aziende (js/imprese.js).
    pubblica: (p) => D.pubblica(p), salvaCantiere: (p) => D.salvaCantiere(p),
    apri: (id) => { cantScelto = id; richScelta = ""; nuovoCant = false; ripubblica = null; },
    daFare: () => D.perMe().then((l) => (l || []).filter((r) => r.stato === "aperta" && !r.mia).length)
  };
})();
