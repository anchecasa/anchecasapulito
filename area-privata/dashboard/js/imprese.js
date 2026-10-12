/* IMPRESE e RISTRUTTURAZIONI (12.10.2026, decisioni di Nando 12:11 e 12:20, PROGETTO-DASHBOARD.md, app-24).
   AncheCasa fa da general contractor: il privato chiede, un agente fa il sopralluogo, AncheCasa fa preventivo e firma,
   poi Nando sceglie l'impresa e le affida il lavoro.
   Impresa, subappaltatore, impiantista: Home · Lavori AncheCasa (solo il proprio importo) · Cantieri (giornale, foto, avanzamento, SAL)
              · Piccoli lavori della zona (preventivi.js, categoria «lavori») · Subappalti (aziende verificate della zona).
   Privato: «Ristruttura con AncheCasa», «Il mio cantiere» (vede solo AncheCasa, mai l'impresa), «Piccoli lavori» (preventivi.js).
   Rete: «Segnala una ristrutturazione», «Sopralluoghi assegnati».
   Admin: «Ristrutturazioni» (pratiche, agente, impresa, SAL, piccoli lavori da smistare).
   Anteprima (?demo=…): dati di esempio in questo browser, niente sul database e nessuna mail. */
(function () {
  const AC = window.AC;
  const { html, toast } = AC.ui;
  const S = AC.store;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;

  const STATO_R = {
    nuova: ["new", "Ricevuta"], sopralluogo: ["wait", "Sopralluogo"], preventivo: ["wait", "Preventivo in preparazione"], firmata: ["ok", "Contratto firmato"],
    in_cantiere: ["ok", "Lavori in corso"], chiusa: ["ok", "Finita"], persa: ["paused", "Non fatta"]
  };
  const PASSI_R = ["nuova", "sopralluogo", "preventivo", "firmata", "in_cantiere", "chiusa"];
  const STATO_C = { proposta: ["new", "Da rispondere"], accettata: ["ok", "Accettato"], rifiutata: ["paused", "Rifiutato"], in_corso: ["wait", "In corso"], finita: ["ok", "Finito"] };
  const STATO_SAL = { previsto: ["paused", "Previsto"], maturato: ["wait", "Da pagare"], pagato: ["ok", "Pagato"] };
  const STATO_SUB = { inviata: ["wait", "In attesa"], accettata: ["ok", "Accettata"], rifiutata: ["paused", "Non disponibile"] };
  const TIPI = { azienda_imprese_edili: "Impresa edile", impresa: "Impresa edile", azienda_subappaltatori: "Subappaltatore", azienda_impiantisti: "Impiantista" };
  const LAVORAZIONI = ["Opere murarie", "Demolizioni", "Impianto elettrico", "Impianto idraulico", "Climatizzazione", "Fotovoltaico", "Cartongesso", "Intonaci", "Pavimenti e rivestimenti", "Tinteggiatura", "Cappotto", "Tetto e impermeabilizzazione", "Infissi", "Carpenteria", "Altro"];

  const eur = (n) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/\./g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const dataIt = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const giorniFa = (iso) => { const g = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return g <= 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa"; };
  const oggi = () => new Date().toISOString().slice(0, 10);
  const piu = (g) => new Date(Date.now() + g * 86400000).toISOString().slice(0, 10);
  const err = (e) => (e && e.message) || String(e || "errore");
  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });
  const uid = () => db().auth.getSession().then((s) => (s.data && s.data.session ? s.data.session.user.id : ""));
  const avvisa = () => { if (reale()) db().functions.invoke("preventivi-avvisa", { body: { evento: "imprese" } }).catch(() => {}); };
  const optProv = (sel) => (AC.preventivi ? AC.preventivi.optProvince(sel) : "");
  const tag = (m, k, d) => { const x = m[k] || m[d]; return html`<span class="tag ${x[0]}">${x[1]}</span>`; };
  const barra = (p) => html`<div class="progress-row"><div class="bar"><i style="width:${Math.max(0, Math.min(100, Number(p) || 0))}%"></i></div><span class="pct">${Number(p) || 0}%</span></div>`;
  const dove = (x) => [x.comune, x.provincia ? "(" + x.provincia + ")" : ""].filter(Boolean).join(" ");

  function nonPronto(el, e) {
    const m = err(e);
    const manca = /does not exist|schema cache|function|PGRST20/i.test(m);
    el.innerHTML = html`<div class="card empty"><strong>${manca ? "Questa parte non è ancora attiva sul database" : "Non riesco a leggere i dati"}</strong>
      <span>${manca ? "Manca app-24 su Supabase. Appena c'è, questa pagina funziona da sola." : m}</span></div>`.s;
  }
  const caricamento = (el) => { el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s; };
  // Doppio tocco per le azioni che non si annullano.
  const conferma = (b) => { if (b.dataset.conferma === "1") return true; b.dataset.conferma = "1"; b.textContent = "Confermi?"; return false; };

  /* ============================================================
     DATI DI ESEMPIO
     ============================================================ */
  const DEMO_KEY = "ac-demo-imprese-v1";
  function demo() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { d = null; }
    if (d && d.commesse) return d;
    const ora = new Date().toISOString(), ieri = new Date(Date.now() - 86400000).toISOString(), dieci = new Date(Date.now() - 10 * 86400000).toISOString();
    d = {
      commesse: [
        { id: "c1", creato: ora, titolo: "Rifacimento bagno e cucina", descrizione: "Demolizione e rifacimento bagno (6 m²) e cucina, impianti idraulico ed elettrico a norma, pavimenti e rivestimenti.", comune: "Caserta", provincia: "CE", indirizzo: "Via Roma 10", importo_impresa: 18500, inizio: piu(14), fine: piu(45), referente: "Fernando Palumbo · AncheCasa", stato: "proposta", avanzamento: 0 },
        { id: "c2", creato: dieci, titolo: "Cappotto termico villetta", descrizione: "Cappotto EPS 10 cm su 180 m², rasatura e finitura ai silicati.", comune: "Maddaloni", provincia: "CE", indirizzo: "Via Napoli 44", importo_impresa: 24600, inizio: piu(-8), fine: piu(25), referente: "Fernando Palumbo · AncheCasa", stato: "in_corso", avanzamento: 40 }
      ],
      giornale: [
        { id: "g1", commessa_id: "c2", data: piu(-1), testo: "Montato il ponteggio sui quattro lati, iniziata la posa dei pannelli sul lato nord.", foto: [], visibile_cliente: true },
        { id: "g2", commessa_id: "c2", data: piu(-6), testo: "Pulizia delle facciate e controllo dell'umidità.", foto: [], visibile_cliente: true }
      ],
      sal: [
        { id: "s1", commessa_id: "c2", per: "impresa", numero: 1, descrizione: "Ponteggio e preparazione", importo: 7380, stato: "pagato", data: piu(-5) },
        { id: "s2", commessa_id: "c2", per: "impresa", numero: 2, descrizione: "Posa pannelli al 70%", importo: 9840, stato: "previsto", data: null }
      ],
      sub: [
        { id: "sb1", creato: ieri, verso: "ricevuta", altra: "Edil Volturno Srl", altra_tipo: "azienda_imprese_edili", lavorazione: "Impianto elettrico", descrizione: "Impianto di un appartamento di 90 m², tracce già fatte.", comune: "Capua", provincia: "CE", dal: piu(10), al: piu(15), stato: "inviata", risposta: "", mail: "" },
        { id: "sb2", creato: dieci, verso: "mandata", altra: "Impianti Sud Snc", altra_tipo: "azienda_impiantisti", lavorazione: "Climatizzazione", descrizione: "Due split per la villetta di Maddaloni.", comune: "Maddaloni", provincia: "CE", dal: piu(20), al: null, stato: "accettata", risposta: "Sì, ci siamo.", mail: "info@impiantisud.it" }
      ],
      // Il privato (Il mio cantiere): solo AncheCasa.
      miei: [
        { id: "r1", creato: dieci, stato: "in_cantiere", descrizione: "Cappotto termico della villetta", comune: "Maddaloni", importo: 32800,
          cantiere: { id: "c2", titolo: "Cappotto termico villetta", inizio: piu(-8), fine: piu(25), avanzamento: 40, stato: "in_corso" },
          giornale: [{ data: piu(-1), testo: "Montato il ponteggio sui quattro lati, iniziata la posa dei pannelli sul lato nord.", foto: [] }, { data: piu(-6), testo: "Pulizia delle facciate e controllo dell'umidità.", foto: [] }],
          sal: [{ numero: 1, descrizione: "Acconto alla firma", importo: 9840, stato: "pagato", data: piu(-9) }, { numero: 2, descrizione: "A metà lavori", importo: 13120, stato: "maturato", data: piu(2) }, { numero: 3, descrizione: "A fine lavori", importo: 9840, stato: "previsto", data: null }] },
        { id: "r2", creato: ieri, stato: "sopralluogo", descrizione: "Rifare il bagno", comune: "Maddaloni", importo: null, cantiere: null, giornale: [], sal: [] }
      ],
      // La rete
      segnalate: [{ id: "r9", creato: ieri, nome: "Giovanni Esposito", comune: "Aversa", provincia: "CE", descrizione: "Ristrutturazione completa appartamento 110 m²", stato: "nuova" }],
      sopralluoghi: [{ id: "r2", creato: ieri, nome: "Lucia Bianco", telefono: "333 9988776", mail: "lucia@esempio.it", comune: "Maddaloni", provincia: "CE", indirizzo: "Via Roma 5", descrizione: "Rifare il bagno, circa 5 m², vasca da cambiare con doccia.", budget: "8-10 mila €", nota_agente: "", stato: "sopralluogo" }],
      // L'admin
      admin: {
        ristrutturazioni: [
          { id: "r9", creato: ieri, origine: "rete", nome: "Giovanni Esposito", telefono: "347 1234567", mail: "g.esposito@esempio.it", comune: "Aversa", provincia: "CE", indirizzo: "Via Roma 1", descrizione: "Ristrutturazione completa appartamento 110 m²", budget: "60 mila €", agente_id: null, agente: "", segnalata_da: "Mario Rossi (agente)", nota_agente: "", stato: "nuova", importo_cliente: null, note_admin: "" },
          { id: "r2", creato: ieri, origine: "privato", nome: "Lucia Bianco", telefono: "333 9988776", mail: "lucia@esempio.it", comune: "Maddaloni", provincia: "CE", indirizzo: "Via Roma 5", descrizione: "Rifare il bagno, circa 5 m², vasca da cambiare con doccia.", budget: "8-10 mila €", agente_id: "ag1", agente: "Mario Rossi", segnalata_da: "", nota_agente: "", stato: "sopralluogo", importo_cliente: null, note_admin: "" },
          { id: "r1", creato: dieci, origine: "privato", nome: "Anna Ferri", telefono: "333 4455667", mail: "anna.ferri@esempio.it", comune: "Maddaloni", provincia: "CE", indirizzo: "Via Napoli 44", descrizione: "Cappotto termico della villetta", budget: "", agente_id: "ag1", agente: "Mario Rossi", segnalata_da: "", nota_agente: "Facciate in buono stato, 180 m².", stato: "in_cantiere", importo_cliente: 32800, note_admin: "Firmato il 02/10" }
        ],
        commesse: [{ id: "c2", ristrutturazione_id: "r1", creato: dieci, titolo: "Cappotto termico villetta", comune: "Maddaloni", provincia: "CE", impresa: "Edil Volturno Srl (esempio)", importo_impresa: 24600, stato: "in_corso", avanzamento: 40, nota_impresa: "",
          sal: [{ id: "s0", per: "cliente", numero: 1, descrizione: "Acconto alla firma", importo: 9840, stato: "pagato", data: piu(-9) }, { id: "s1", per: "impresa", numero: 1, descrizione: "Ponteggio e preparazione", importo: 7380, stato: "pagato", data: piu(-5) }] }],
        lavori: [{ id: "l1", creato: ora, nome: "Paolo Riccio", telefono: "339 1112223", mail: "paolo@esempio.it", comune: "Caserta", provincia: "CE", nota: "Tinteggiatura di 4 stanze e corridoio", stato: "aperta", smistata: "", fonte: "dashboard", proposte: 1 }],
        agenti: [{ id: "ag1", nome: "Mario Rossi", regione: "Campania", ruolo: "agente" }, { id: "ag2", nome: "Sara Conte", regione: "Campania", ruolo: "capoarea" }]
      }
    };
    return d;
  }
  function demoCambia(fn) { const d = demo(); fn(d); try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch (e) {} }
  const azione = (rpc, args, demoFn) => {
    if (!reale()) { demoCambia(demoFn); return Promise.resolve(); }
    return Q(db().rpc(rpc, args)).then((x) => { avvisa(); return x; });
  };

  const D = {
    commesse() { if (!reale()) return Promise.resolve(demo().commesse); return Q(db().from("commesse").select("*").order("creato", { ascending: false })); },
    giornale(cid) { if (!reale()) return Promise.resolve(demo().giornale.filter((g) => g.commessa_id === cid)); return Q(db().from("cantiere_giornale").select("*").eq("commessa_id", cid).order("data", { ascending: false }).limit(60)); },
    sal(cid) { if (!reale()) return Promise.resolve(demo().sal.filter((s) => s.commessa_id === cid)); return Q(db().from("commesse_sal").select("*").eq("commessa_id", cid).order("numero")); },
    sub() { if (!reale()) return Promise.resolve(demo().sub); return Q(db().rpc("subappalti_miei")); },
    lavoriZona() {
      if (!reale()) return Promise.resolve(1);
      return Q(db().rpc("prev_richieste_per_me")).then((l) => (l || []).filter((r) => r.categoria === "lavori" && r.stato === "aperta" && !r.mia_proposta).length);
    },
    stato() { return AC.artigiani ? AC.artigiani.stato() : Promise.resolve(null); },
    cerca(tipi, provincia, comune) {
      if (!reale()) return Promise.resolve([
        { id: "x1", nome: "Impianti Sud Snc", tipo_azienda: "azienda_impiantisti", comune: "Caserta", vicinanza: 0, puo_lavorare: true },
        { id: "x2", nome: "Edil Volturno Srl", tipo_azienda: "azienda_imprese_edili", comune: "Capua", vicinanza: 1, puo_lavorare: true },
        { id: "x3", nome: "Cartongessi Mattei", tipo_azienda: "azienda_subappaltatori", comune: "Aversa", vicinanza: 1, puo_lavorare: true }
      ].filter((a) => tipi.includes(a.tipo_azienda)));
      return Q(db().rpc("aziende_cerca", { p_tipi: tipi, p_provincia: provincia || "", p_comune: comune || "" }));
    },
    foto(paths) {
      if (!paths || !paths.length || !reale()) return Promise.resolve({});
      return db().storage.from("cantieri").createSignedUrls(paths, 3600).then((r) => {
        const m = {}; ((r && r.data) || []).forEach((x) => { if (x.signedUrl) m[x.path] = x.signedUrl; }); return m;
      }, () => ({}));
    }
  };
  const fotoHtml = (paths, urls) => (paths || []).length ? html`<div class="imp-foto">${paths.map((p) => urls[p] ? html`<a href="${urls[p]}" target="_blank" rel="noopener"><img src="${urls[p]}" alt="Foto del cantiere" loading="lazy"></a>` : html`<span class="imp-foto-x">Foto</span>`)}</div>` : "";

  /* ============================================================
     IMPRESA (anche subappaltatore e impiantista)
     ============================================================ */
  V.imp_home = {
    title: "Home",
    sub: "I lavori che ti affida AncheCasa, i tuoi cantieri, i piccoli lavori della zona e le richieste di subappalto.",
    render(el) {
      caricamento(el);
      Promise.all([D.commesse(), D.sub(), D.stato(), D.lavoriZona().catch(() => 0)]).then(([cs, sb, s, lz]) => {
        const nuove = (cs || []).filter((c) => c.stato === "proposta");
        const aperti = (cs || []).filter((c) => c.stato === "accettata" || c.stato === "in_corso");
        const daRisp = (sb || []).filter((x) => x.verso === "ricevuta" && x.stato === "inviata");
        el.innerHTML = html`${AC.artigiani ? AC.artigiani.riquadroStato(s) : ""}
          <div class="en-kpis">
            <a class="kpi en-kpi" href="#/azienda/imp_lavori"><span><strong>${nuove.length}</strong><small>lavori AncheCasa da rispondere</small></span></a>
            <a class="kpi en-kpi" href="#/azienda/imp_cantieri"><span><strong>${aperti.length}</strong><small>cantieri aperti</small></span></a>
            <a class="kpi en-kpi" href="#/azienda/lav_richieste"><span><strong>${lz}</strong><small>piccoli lavori nella tua zona</small></span></a>
            <a class="kpi en-kpi" href="#/azienda/imp_subappalti"><span><strong>${daRisp.length}</strong><small>richieste di subappalto</small></span></a>
          </div>
          <section class="card"><h2>Come lavori con AncheCasa</h2>
            <ul class="pv-lista">
              <li><b>Lavori AncheCasa.</b> AncheCasa è il general contractor: trova il cliente, fa sopralluogo, preventivo e contratto, poi sceglie l'impresa. Tu vedi il tuo importo e il cantiere.</li>
              <li><b>Piccoli lavori della zona.</b> Le richieste dei privati arrivano a massimo cinque imprese della zona, dalla più vicina. Mandi il preventivo, il cliente sceglie.</li>
              <li><b>Subappalti.</b> Cerchi subappaltatori e impiantisti verificati della zona e chiedi se sono liberi.</li>
              <li>Per ricevere lavori servono visura e DURC verificati, e la prova di 14 giorni o l'abbonamento attivo.</li>
            </ul></section>
          ${aperti.length ? html`<section class="card"><h2>Cantieri aperti</h2>${aperti.map((c) => html`<div class="en-rrow"><div class="en-rinfo"><b>${c.titolo}</b><small>${dove(c)} · fine prevista ${dataIt(c.fine) || "da decidere"}</small>${barra(c.avanzamento)}</div>
            <div class="en-ract"><a class="btn-mini" href="#/azienda/imp_cantieri">Apri</a></div></div>`)}</section>` : ""}`.s;
      }, (e) => nonPronto(el, e));
    }
  };

  V.imp_lavori = {
    title: "Lavori AncheCasa",
    sub: "I lavori che AncheCasa ti affida. Vedi il tuo importo: il cliente è di AncheCasa e con lui parla AncheCasa.",
    render(el) {
      caricamento(el);
      D.commesse().then((cs) => {
        const nuove = (cs || []).filter((c) => c.stato === "proposta");
        const altre = (cs || []).filter((c) => c.stato !== "proposta");
        const scheda = (c, rispondi) => html`<div class="fo-riga">
          <div class="en-rrow"><div class="en-rinfo"><div>${tag(STATO_C, c.stato, "proposta")} <b>${c.titolo}</b> <small>· ${dove(c)} · ${giorniFa(c.creato)}</small></div>
            <small>${c.descrizione || ""}</small>
            <small>Importo per la tua impresa: <b>${c.importo_impresa != null ? eur(c.importo_impresa) : "da definire"}</b> · ${c.inizio ? "dal " + dataIt(c.inizio) : "inizio da decidere"}${c.fine ? " al " + dataIt(c.fine) : ""}${c.indirizzo ? " · " + c.indirizzo : ""}</small>
            ${c.referente ? html`<small>Referente AncheCasa: ${c.referente}</small>` : ""}${c.nota_impresa ? html`<small>La tua nota: «${c.nota_impresa}»</small>` : ""}</div></div>
          ${rispondi ? html`<form class="nm-o" data-risp="${c.id}"><label class="span2">Nota per AncheCasa (facoltativa)<input name="nota" maxlength="800" placeholder="es. possiamo iniziare dal 20"></label>
            <button class="btn-in" type="submit" name="si">Accetto</button><button class="btn-ghost" type="button" data-no="${c.id}">Non posso</button></form>` : ""}
        </div>`;
        el.innerHTML = html`<section class="card"><h2>Da rispondere <span class="ra-n">${nuove.length}</span></h2>
            ${nuove.length ? nuove.map((c) => scheda(c, true)) : html`<p class="note">Nessun lavoro nuovo. Quando AncheCasa ti sceglie per un lavoro ti arriva anche una mail.</p>`}</section>
          <section class="card"><h2>Tutti i lavori</h2>${altre.length ? altre.map((c) => scheda(c, false)) : html`<p class="note">Ancora nessun lavoro.</p>`}</section>`.s;
        const rispondi = (id, si, nota) => azione("commessa_rispondi", { p_id: id, p_accetta: si, p_nota: nota }, (d) => { const c = d.commesse.find((x) => x.id === id); if (c) Object.assign(c, { stato: si ? "accettata" : "rifiutata", nota_impresa: nota }); })
          .then(() => { toast(si ? "Accettato: apri il cantiere da «Cantieri»." : "Risposta mandata ad AncheCasa."); V.imp_lavori.render(el); }, (e2) => toast("Non riuscito: " + err(e2), "error"));
        el.querySelectorAll("[data-risp]").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); rispondi(f.getAttribute("data-risp"), true, f.nota.value.trim()); }));
        el.querySelectorAll("[data-no]").forEach((b) => b.addEventListener("click", () => { if (!conferma(b)) return; const f = b.closest("form"); rispondi(b.getAttribute("data-no"), false, f.nota.value.trim()); }));
      }, (e) => nonPronto(el, e));
    }
  };

  let cantiereScelto = "";
  V.imp_cantieri = {
    title: "Cantieri",
    sub: "Giornale dei lavori con le foto, avanzamento e SAL. Il cliente vede giornale e foto come lavori di AncheCasa, senza il nome della tua impresa.",
    render(el) {
      caricamento(el);
      D.commesse().then((cs) => {
        const miei = (cs || []).filter((c) => ["accettata", "in_corso", "finita"].includes(c.stato));
        if (!miei.length) { el.innerHTML = html`<div class="card empty"><strong>Nessun cantiere aperto</strong><span>I cantieri si aprono quando accetti un lavoro AncheCasa.</span></div>`.s; return; }
        if (!miei.some((c) => c.id === cantiereScelto)) cantiereScelto = miei[0].id;
        const c = miei.find((x) => x.id === cantiereScelto);
        Promise.all([D.giornale(c.id), D.sal(c.id)]).then(([gi, sal]) => {
          const tutteFoto = [].concat.apply([], (gi || []).map((g) => g.foto || []));
          D.foto(tutteFoto).then((urls) => {
            const aperto = c.stato !== "finita";
            el.innerHTML = html`${miei.length > 1 ? html`<div class="sv-schede">${miei.map((x) => html`<button type="button" class="${x.id === c.id ? "btn-in" : "btn-ghost"}" data-c="${x.id}">${x.titolo}</button>`)}</div>` : ""}
              <section class="card"><h2>${c.titolo} ${tag(STATO_C, c.stato, "accettata")}</h2>
                <p class="note">${dove(c)}${c.indirizzo ? " · " + c.indirizzo : ""} · ${c.inizio ? "dal " + dataIt(c.inizio) : ""}${c.fine ? " al " + dataIt(c.fine) : ""}</p>
                ${barra(c.avanzamento)}
                ${aperto ? html`<form id="ic-av" class="nm-o"><label>Avanzamento<input type="range" name="p" min="0" max="100" step="5" value="${c.avanzamento || 0}"></label><output name="o">${c.avanzamento || 0}%</output><button class="btn-ghost" type="submit">Salva</button></form>` : ""}
              </section>
              <div class="pv-due">
                <section class="card"><h2>Giornale dei lavori</h2>
                  ${aperto ? html`<form id="ic-g" class="prefs wide en-grid">
                    <label>Giorno<input type="date" name="data" value="${oggi()}" required></label>
                    <label>Foto (fino a 6)<input type="file" name="foto" accept="image/*" multiple></label>
                    <label class="span2">Cosa avete fatto<textarea name="testo" maxlength="1500" required placeholder="es. posati i pannelli sul lato nord, domani rasatura"></textarea></label>
                    <label class="check span2"><input type="checkbox" name="vis" checked> Lo vede anche il cliente (come lavoro di AncheCasa)</label>
                    <div class="row-actions span2"><button class="btn-in" type="submit">Aggiungi al giornale</button></div></form>` : ""}
                  ${(gi || []).length ? html`<div class="en-lista">${gi.map((g) => html`<div class="en-rrow"><div class="en-rinfo"><b>${dataIt(g.data)}</b>${g.visibile_cliente ? "" : html` <small>· solo per AncheCasa</small>`}<small>${g.testo}</small>${fotoHtml(g.foto, urls)}</div></div>`)}</div>` : html`<p class="note">Ancora niente nel giornale.</p>`}
                </section>
                <section class="card"><h2>SAL della tua impresa</h2>
                  ${(sal || []).length ? html`<table class="mini-table"><thead><tr><th>N.</th><th>Cosa</th><th class="num">Importo</th><th>Stato</th></tr></thead><tbody>${sal.map((s) => html`<tr><td>${s.numero}</td><td>${s.descrizione}${s.data ? html`<br><small>${dataIt(s.data)}</small>` : ""}</td><td class="num">${eur(s.importo)}</td><td>${tag(STATO_SAL, s.stato, "previsto")}</td></tr>`)}</tbody></table>
                    <p class="note">Totale ${eur(sal.reduce((x, s) => x + Number(s.importo || 0), 0))} · pagato ${eur(sal.filter((s) => s.stato === "pagato").reduce((x, s) => x + Number(s.importo || 0), 0))}</p>` : html`<p class="note">I SAL li prepara AncheCasa con te.</p>`}
                  <p class="note">Pagamenti e SAL li segue AncheCasa. Per qualunque cosa: il tuo referente o info@anchecasa.it.</p>
                </section>
              </div>`.s;
            el.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => { cantiereScelto = b.getAttribute("data-c"); V.imp_cantieri.render(el); }));
            const av = el.querySelector("#ic-av");
            if (av) {
              av.p.addEventListener("input", () => { av.o.value = av.p.value + "%"; });
              av.addEventListener("submit", (e) => {
                e.preventDefault();
                const p = Number(av.p.value);
                azione("commessa_avanzamento", { p_id: c.id, p_percento: p }, (d) => { const x = d.commesse.find((y) => y.id === c.id); if (x) Object.assign(x, { avanzamento: p, stato: p >= 100 ? "finita" : "in_corso" }); })
                  .then(() => { toast("Avanzamento salvato."); V.imp_cantieri.render(el); }, (e2) => toast("Non salvato: " + err(e2), "error"));
              });
            }
            const fg = el.querySelector("#ic-g");
            if (fg) fg.addEventListener("submit", (e) => {
              e.preventDefault();
              const files = [...fg.foto.files].slice(0, 6);
              if (files.some((f) => f.size > 10 * 1024 * 1024)) return toast("Una foto è troppo grande (massimo 10 MB).", "error");
              const riga = { commessa_id: c.id, data: fg.data.value, testo: fg.testo.value.trim(), visibile_cliente: fg.vis.checked };
              const btn = fg.querySelector("button"); btn.disabled = true;
              if (!reale()) { demoCambia((d) => d.giornale.unshift(Object.assign({ id: "g" + Date.now(), foto: [] }, riga))); toast("Anteprima: aggiunto solo qui, le foto non si caricano."); V.imp_cantieri.render(el); return; }
              uid().then((me) => Promise.all(files.map((f, i) => {
                const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
                const path = c.id + "/" + Date.now() + "-" + i + "." + ext;
                return Q(db().storage.from("cantieri").upload(path, f, { upsert: false })).then(() => path);
              })).then((paths) => Q(db().from("cantiere_giornale").insert(Object.assign(riga, { foto: paths, autore: me })))))
                .then(() => { toast("Aggiunto al giornale."); V.imp_cantieri.render(el); }, (e2) => { btn.disabled = false; toast("Non salvato: " + err(e2), "error"); });
            });
          });
        }, (e) => nonPronto(el, e));
      }, (e) => nonPronto(el, e));
    }
  };

  let schedaSub = "cerca";
  V.imp_subappalti = {
    title: "Subappalti",
    sub: "Trova subappaltatori, impiantisti e imprese verificati nella zona del cantiere e chiedi se sono liberi. I contatti si vedono quando l'altro accetta.",
    render(el) {
      caricamento(el);
      D.sub().then((sb) => {
        const ricevute = (sb || []).filter((x) => x.verso === "ricevuta");
        const mandate = (sb || []).filter((x) => x.verso === "mandata");
        const daRisp = ricevute.filter((x) => x.stato === "inviata").length;
        const SCHEDE = [["cerca", "Cerca in zona"], ["ricevute", "Ricevute" + (daRisp ? " (" + daRisp + ")" : "")], ["mandate", "Mandate"]];
        const riga = (x, rispondi) => html`<div class="fo-riga"><div class="en-rrow"><div class="en-rinfo">
            <div>${tag(STATO_SUB, x.stato, "inviata")} <b>${x.lavorazione}</b> <small>· ${x.verso === "ricevuta" ? "da" : "a"} ${x.altra} (${TIPI[x.altra_tipo] || "azienda"}) · ${giorniFa(x.creato)}</small></div>
            <small>${x.descrizione || ""}</small><small>${dove(x)}${x.dal ? " · dal " + dataIt(x.dal) : ""}${x.al ? " al " + dataIt(x.al) : ""}</small>
            ${x.risposta ? html`<small>Risposta: «${x.risposta}»</small>` : ""}${x.mail ? html`<small>Contatto: <a href="mailto:${x.mail}">${x.mail}</a></small>` : ""}</div></div>
          ${rispondi && x.stato === "inviata" ? html`<form class="nm-o" data-sr="${x.id}"><label class="span2">Risposta (facoltativa)<input name="r" maxlength="600" placeholder="es. liberi dal 15"></label>
            <button class="btn-in" type="submit">Sono disponibile</button><button class="btn-ghost" type="button" data-sn="${x.id}">Non posso</button></form>` : ""}</div>`;
        el.innerHTML = html`<div class="sv-schede">${SCHEDE.map((s) => html`<button type="button" class="${schedaSub === s[0] ? "btn-in" : "btn-ghost"}" data-sch="${s[0]}">${s[1]}</button>`)}</div><div id="sb-box"></div>`.s;
        el.querySelectorAll("[data-sch]").forEach((b) => b.addEventListener("click", () => { schedaSub = b.getAttribute("data-sch"); V.imp_subappalti.render(el); }));
        const box = el.querySelector("#sb-box");
        if (schedaSub === "ricevute") {
          box.innerHTML = html`<section class="card">${ricevute.length ? ricevute.map((x) => riga(x, true)) : html`<p class="note">Nessuna richiesta ricevuta.</p>`}</section>`.s;
          const risp = (id, si, testo) => azione("subappalto_rispondi", { p_id: id, p_accetta: si, p_risposta: testo }, (d) => { const x = d.sub.find((y) => y.id === id); if (x) Object.assign(x, { stato: si ? "accettata" : "rifiutata", risposta: testo, mail: si ? "acquisti@edilvolturno.it" : "" }); })
            .then(() => { toast(si ? "Accettata: ora vi vedete i contatti." : "Risposta mandata."); V.imp_subappalti.render(el); }, (e2) => toast("Non riuscito: " + err(e2), "error"));
          box.querySelectorAll("[data-sr]").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); risp(f.getAttribute("data-sr"), true, f.r.value.trim()); }));
          box.querySelectorAll("[data-sn]").forEach((b) => b.addEventListener("click", () => { if (!conferma(b)) return; risp(b.getAttribute("data-sn"), false, b.closest("form").r.value.trim()); }));
          return;
        }
        if (schedaSub === "mandate") {
          box.innerHTML = html`<section class="card">${mandate.length ? mandate.map((x) => riga(x, false)) : html`<p class="note">Non hai ancora chiesto niente.</p>`}</section>`.s;
          return;
        }
        const p = S.data.profilo || {};
        box.innerHTML = html`<section class="card"><h2>Cerca nella zona del cantiere</h2>
            <form id="sb-c" class="prefs wide en-grid">
              <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProv("")}</select></label>
              <label>Comune del cantiere<input name="comune" maxlength="80" value="${p.zona || ""}"></label>
              <div class="span2 nm-o"><label class="check"><input type="checkbox" name="t" value="azienda_subappaltatori" checked> Subappaltatori</label>
                <label class="check"><input type="checkbox" name="t" value="azienda_impiantisti" checked> Impiantisti</label>
                <label class="check"><input type="checkbox" name="t" value="azienda_imprese_edili"> Imprese edili</label></div>
              <div class="row-actions span2"><button class="btn-in" type="submit">Cerca</button></div></form></section>
          <div id="sb-ris"></div>`.s;
        const f = box.querySelector("#sb-c"), ris = box.querySelector("#sb-ris");
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          const tipi = [...f.querySelectorAll("[name=t]:checked")].map((x) => x.value);
          if (tipi.includes("azienda_imprese_edili")) tipi.push("impresa");
          if (!tipi.length) return toast("Scegli almeno un tipo di azienda.", "error");
          ris.innerHTML = html`<div class="card"><p class="note">Cerco…</p></div>`.s;
          D.cerca(tipi, f.prov.value, f.comune.value.trim()).then((l) => {
            const VIC = ["Stesso comune", "Stessa provincia", "In zona"];
            ris.innerHTML = html`<section class="card"><h2>Aziende verificate <span class="ra-n">${(l || []).length}</span></h2>
              ${(l || []).length ? l.map((a) => html`<div class="fo-riga"><div class="en-rrow"><div class="en-rinfo"><div><span class="tag new">${VIC[a.vicinanza] || "In zona"}</span> <b>${a.nome}</b> <small>· ${TIPI[a.tipo_azienda] || "Azienda"} · ${a.comune || ""}</small></div></div>
                  <div class="en-ract"><button class="btn-ghost" type="button" data-apri="${a.id}">Chiedi disponibilità</button></div></div>
                <form class="prefs wide en-grid" data-chiedi="${a.id}" hidden>
                  <label>Lavorazione<select name="lav">${LAVORAZIONI.map((x) => html`<option>${x}</option>`)}</select></label>
                  <label>Dal<input type="date" name="dal"></label><label>Al<input type="date" name="al"></label>
                  <label class="span2">Cosa serve<textarea name="desc" maxlength="1000" required placeholder="es. impianto elettrico di un appartamento di 90 m², tracce già fatte"></textarea></label>
                  <div class="row-actions span2"><button class="btn-in" type="submit">Manda la richiesta</button></div></form></div>`)
              : html`<p class="note">Nessuna azienda verificata copre questa zona. Prova con un'altra provincia o invitane una da «Inviti».</p>`}</section>`.s;
            ris.querySelectorAll("[data-apri]").forEach((b) => b.addEventListener("click", () => { const fm = ris.querySelector("[data-chiedi='" + b.getAttribute("data-apri") + "']"); fm.hidden = !fm.hidden; }));
            ris.querySelectorAll("[data-chiedi]").forEach((fm) => fm.addEventListener("submit", (e2) => {
              e2.preventDefault();
              const a = l.find((x) => x.id === fm.getAttribute("data-chiedi"));
              const d = { a_azienda: a.id, lavorazione: fm.lav.value, descrizione: fm.desc.value.trim(), comune: f.comune.value.trim(), provincia: f.prov.value, dal: fm.dal.value, al: fm.al.value };
              const btn = fm.querySelector("button"); btn.disabled = true;
              azione("subappalto_chiedi", { p: d }, (x) => x.sub.unshift(Object.assign({ id: "sb" + Date.now(), creato: new Date().toISOString(), verso: "mandata", altra: a.nome, altra_tipo: a.tipo_azienda, stato: "inviata", risposta: "", mail: "" }, d)))
                .then(() => { toast("Richiesta mandata a " + a.nome + ": ti arriva una mail quando risponde."); fm.hidden = true; btn.disabled = false; }, (e3) => { btn.disabled = false; toast(/serve_verifica/.test(err(e3)) ? "Per chiedere subappalti servono documenti verificati e prova o abbonamento attivo." : "Non mandata: " + err(e3), "error"); });
            }));
          }, (e2) => nonPronto(ris, e2));
        });
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     PRIVATO
     ============================================================ */
  function mieRistrutturazioni() {
    if (!reale()) return Promise.resolve(demo().miei);
    return Q(db().rpc("mio_cantiere"));
  }
  const passiR = (stato) => html`<ol class="imp-passi">${PASSI_R.map((k, i) => html`<li class="${PASSI_R.indexOf(stato) >= i ? "fatto" : ""}">${STATO_R[k][1]}</li>`)}</ol>`;

  V["pv-ristruttura"] = {
    title: "Ristruttura con AncheCasa",
    sub: "Pensa a tutto AncheCasa: sopralluogo, preventivo, contratto, l'impresa giusta e il controllo del cantiere. Parli sempre e solo con noi.",
    render(el) {
      const p = S.data.profilo || {};
      el.innerHTML = html`<div class="pv-due">
        <section class="card"><h2>Raccontaci il lavoro</h2>
          <form id="rs-f" class="prefs wide en-grid">
            <label class="span2">Cosa vuoi fare<textarea name="descrizione" maxlength="1500" required placeholder="es. rifare il bagno e la cucina, cambiare gli infissi"></textarea></label>
            <label>Comune<input name="comune" maxlength="80" required value="${p.zona || ""}"></label>
            <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProv("")}</select></label>
            <label class="span2">Indirizzo<input name="indirizzo" maxlength="160"></label>
            <label class="span2">Budget indicativo (facoltativo)<input name="budget" maxlength="60" placeholder="es. 20-25 mila €"></label>
            <label>Nome e cognome<input name="nome" required maxlength="120" value="${p.nome || ""}"></label>
            <label>Telefono<input name="tel" required maxlength="30" inputmode="tel"></label>
            <label class="span2">Mail<input name="mail" type="email" required value="${(S.data.account && S.data.account.mail) || ""}"></label>
            <div class="row-actions span2"><button class="btn-in" type="submit">Chiedi il sopralluogo</button></div>
          </form></section>
        <section class="card"><h2>Come funziona</h2>
          <ol class="pv-lista"><li>Ti chiama un consulente AncheCasa e fissa il sopralluogo.</li><li>Ricevi il preventivo di AncheCasa e firmi solo se ti convince.</li>
            <li>AncheCasa sceglie l'impresa verificata e segue il cantiere.</li><li>In «Il mio cantiere» vedi avanzamento, foto della settimana e SAL.</li></ol>
          <h2>Le mie richieste</h2><div id="rs-miei"><p class="note">Caricamento…</p></div></section>
      </div>`.s;
      const box = el.querySelector("#rs-miei");
      const elenco = () => mieRistrutturazioni().then((l) => {
        box.innerHTML = (l || []).length ? html`<div class="en-lista">${l.map((r) => html`<div class="en-rrow"><div class="en-rinfo"><b>${r.descrizione.slice(0, 60)}</b><small>${r.comune} · ${dataIt(r.creato)}</small></div>
          <div class="en-ract">${tag(STATO_R, r.stato, "nuova")}${r.cantiere ? html` <a class="btn-mini" href="#/privato/pv-mio-cantiere">Il mio cantiere</a>` : ""}</div></div>`)}</div>`.s : html`<p class="note">Ancora nessuna richiesta.</p>`.s;
      }, (e) => { box.innerHTML = html`<p class="note">${/function|schema|does not exist/i.test(err(e)) ? "Le richieste si vedono appena app-24 è sul database." : "Non riesco a leggere le richieste."}</p>`.s; });
      elenco();
      const f = el.querySelector("#rs-f");
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const d = { descrizione: f.descrizione.value.trim(), comune: f.comune.value.trim(), provincia: f.prov.value, indirizzo: f.indirizzo.value.trim(), budget: f.budget.value.trim(), nome: f.nome.value.trim(), telefono: f.tel.value.trim(), mail: f.mail.value.trim() };
        const btn = f.querySelector("button"); btn.disabled = true;
        azione("ristrutturazione_nuova", { p: d }, (x) => x.miei.unshift({ id: "r" + Date.now(), creato: new Date().toISOString(), stato: "nuova", descrizione: d.descrizione, comune: d.comune, cantiere: null, giornale: [], sal: [] }))
          .then(() => { btn.disabled = false; f.descrizione.value = ""; toast(reale() ? "Richiesta mandata: ti chiama un consulente AncheCasa." : "Anteprima: richiesta registrata, niente è partito."); elenco(); },
            (e2) => { btn.disabled = false; toast(/troppe/.test(err(e2)) ? "Hai già mandato cinque richieste oggi." : "Richiesta non mandata: " + err(e2), "error"); });
      });
    }
  };

  V["pv-mio-cantiere"] = {
    title: "Il mio cantiere",
    sub: "Il tuo lavoro con AncheCasa: a che punto è, le foto della settimana e i pagamenti a stato avanzamento (SAL).",
    render(el) {
      caricamento(el);
      mieRistrutturazioni().then((l) => {
        if (!(l || []).length) { el.innerHTML = html`<div class="card empty"><strong>Nessun cantiere</strong><span>Quando ristrutturi con AncheCasa qui vedi tutto il lavoro.</span><a class="btn-in" href="#/privato/pv-ristruttura">Ristruttura con AncheCasa</a></div>`.s; return; }
        const foto = [].concat.apply([], l.map((r) => [].concat.apply([], (r.giornale || []).map((g) => g.foto || []))));
        D.foto(foto).then((urls) => {
          el.innerHTML = l.map((r) => {
            const c = r.cantiere, sal = r.sal || [];
            const daPagare = sal.filter((s) => s.stato === "maturato");
            return html`<section class="card"><h2>${c ? c.titolo : r.descrizione.slice(0, 70)} ${tag(STATO_R, r.stato, "nuova")}</h2>
              ${passiR(r.stato)}
              ${c ? html`<p class="note">${r.comune} · ${c.inizio ? "inizio " + dataIt(c.inizio) : ""}${c.fine ? " · fine prevista " + dataIt(c.fine) : ""}${r.importo ? " · importo " + eur(r.importo) : ""}</p>${barra(c.avanzamento)}`
                : html`<p class="note">${r.stato === "nuova" ? "Ti chiama a breve un consulente AncheCasa per il sopralluogo." : r.stato === "sopralluogo" ? "Il consulente AncheCasa ti contatta per il sopralluogo." : r.stato === "preventivo" ? "Stiamo preparando il preventivo." : r.stato === "firmata" ? "Contratto firmato: stiamo organizzando l'inizio dei lavori." : ""}</p>`}
              ${daPagare.length ? html`<div class="card en-banner"><div><h2>SAL da pagare: ${eur(daPagare.reduce((x, s) => x + Number(s.importo || 0), 0))}</h2><p class="note">I dati per il bonifico te li manda AncheCasa. Per domande: info@anchecasa.it.</p></div></div>` : ""}
              ${c ? html`<div class="pv-due">
                <div><h3>Diario dei lavori</h3>${(r.giornale || []).length ? html`<div class="en-lista">${r.giornale.map((g) => html`<div class="en-rrow"><div class="en-rinfo"><b>${dataIt(g.data)}</b><small>${g.testo}</small>${fotoHtml(g.foto, urls)}</div></div>`)}</div>` : html`<p class="note">Le prime note arrivano con l'inizio dei lavori.</p>`}</div>
                <div><h3>Pagamenti (SAL)</h3>${sal.length ? html`<table class="mini-table"><thead><tr><th>N.</th><th>Cosa</th><th class="num">Importo</th><th>Stato</th></tr></thead><tbody>${sal.map((s) => html`<tr><td>${s.numero}</td><td>${s.descrizione}${s.data ? html`<br><small>${dataIt(s.data)}</small>` : ""}</td><td class="num">${eur(s.importo)}</td><td>${tag(STATO_SAL, s.stato, "previsto")}</td></tr>`)}</tbody></table>` : html`<p class="note">I SAL arrivano con il contratto.</p>`}
                  <p class="note">Il lavoro lo fai con AncheCasa: per qualunque cosa scrivi a info@anchecasa.it.</p></div></div>` : ""}
            </section>`.s;
          }).join("");
        });
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     RETE
     ============================================================ */
  V["re-ristruttura"] = {
    title: "Segnala una ristrutturazione",
    sub: "Un cliente vuole ristrutturare: lo segnali qui. Decide l'admin chi fa il sopralluogo; a contratto firmato la vendita è tua.",
    render(el) {
      el.innerHTML = html`<div class="pv-due">
        <section class="card"><h2>Il cliente</h2>
          <form id="rr-f" class="prefs wide en-grid">
            <label>Nome e cognome<input name="nome" required maxlength="120"></label>
            <label>Telefono<input name="tel" required maxlength="30" inputmode="tel"></label>
            <label class="span2">Mail<input name="mail" type="email" maxlength="160"></label>
            <label>Comune<input name="comune" maxlength="80" required></label>
            <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProv("")}</select></label>
            <label class="span2">Indirizzo<input name="indirizzo" maxlength="160"></label>
            <label class="span2">Cosa vuole fare<textarea name="descrizione" maxlength="1500" required></textarea></label>
            <label class="span2">Budget indicativo<input name="budget" maxlength="60"></label>
            <label class="check span2"><input type="checkbox" name="ok" required> Il cliente è d'accordo a essere contattato da AncheCasa.</label>
            <div class="row-actions span2"><button class="btn-in" type="submit">Segnala</button></div></form></section>
        <section class="card"><h2>Le mie segnalazioni</h2><div id="rr-l"><p class="note">Caricamento…</p></div></section></div>`.s;
      const box = el.querySelector("#rr-l");
      const elenco = () => (reale() ? uid().then((me) => Q(db().from("ristrutturazioni").select("id, creato, nome, comune, provincia, descrizione, stato").eq("inviato_da", me).order("creato", { ascending: false }).limit(50))) : Promise.resolve(demo().segnalate))
        .then((l) => { box.innerHTML = (l || []).length ? html`<div class="en-lista">${l.map((r) => html`<div class="en-rrow"><div class="en-rinfo"><b>${r.nome}</b><small>${dove(r)} · ${dataIt(r.creato)} · ${r.descrizione.slice(0, 60)}</small></div><div class="en-ract">${tag(STATO_R, r.stato, "nuova")}</div></div>`)}</div>`.s : html`<p class="note">Ancora nessuna segnalazione.</p>`.s; },
          (e) => nonPronto(box, e));
      elenco();
      const f = el.querySelector("#rr-f");
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const d = { nome: f.nome.value.trim(), telefono: f.tel.value.trim(), mail: f.mail.value.trim(), comune: f.comune.value.trim(), provincia: f.prov.value, indirizzo: f.indirizzo.value.trim(), descrizione: f.descrizione.value.trim(), budget: f.budget.value.trim() };
        const btn = f.querySelector("button"); btn.disabled = true;
        azione("ristrutturazione_nuova", { p: d }, (x) => x.segnalate.unshift(Object.assign({ id: "r" + Date.now(), creato: new Date().toISOString(), stato: "nuova" }, d)))
          .then(() => { btn.disabled = false; f.reset(); toast("Segnalata: l'admin decide il sopralluogo."); elenco(); }, (e2) => { btn.disabled = false; toast("Non mandata: " + err(e2), "error"); });
      });
    }
  };

  V["re-sopralluoghi"] = {
    title: "Sopralluoghi assegnati",
    sub: "I sopralluoghi che AncheCasa ti ha affidato. Dopo la visita scrivi com'è andata e premi «Fatto»: il preventivo lo prepara AncheCasa.",
    render(el) {
      caricamento(el);
      (reale() ? uid().then((me) => Q(db().from("ristrutturazioni").select("id, creato, nome, telefono, mail, comune, provincia, indirizzo, descrizione, budget, nota_agente, stato").eq("agente_id", me).order("creato", { ascending: false }).limit(60))) : Promise.resolve(demo().sopralluoghi))
        .then((l) => {
          el.innerHTML = html`<section class="card">${(l || []).length ? l.map((r) => html`<div class="fo-riga"><div class="en-rrow"><div class="en-rinfo">
              <div>${tag(STATO_R, r.stato, "nuova")} <b>${r.nome}</b> <small>· ${dove(r)} · ${giorniFa(r.creato)}</small></div>
              <small>${r.descrizione}${r.budget ? " · budget " + r.budget : ""}</small>
              <small><a href="tel:${(r.telefono || "").replace(/\s/g, "")}">${r.telefono}</a>${r.mail ? html` · <a href="mailto:${r.mail}">${r.mail}</a>` : ""}${r.indirizzo ? " · " + r.indirizzo : ""}</small></div></div>
            <form class="prefs wide en-grid" data-so="${r.id}"><label class="span2">Com'è andato il sopralluogo<textarea name="nota" maxlength="1500" placeholder="misure, stato dei luoghi, cosa vuole il cliente, foto mandate su Sopralluogo Flash">${r.nota_agente || ""}</textarea></label>
              <div class="row-actions span2"><button class="btn-ghost" type="submit">Salva la nota</button>${["nuova", "sopralluogo"].includes(r.stato) ? html`<button class="btn-in" type="button" data-fatto="${r.id}">Fatto: passa al preventivo</button>` : ""}</div></form></div>`)
            : html`<p class="note">Nessun sopralluogo assegnato. Quando l'admin te ne affida uno ti arriva una mail.</p>`}</section>`.s;
          const salva = (id, nota, fatto) => azione("ristrutturazione_agente", { p_id: id, p_nota: nota, p_fatto: fatto }, (d) => { const r = d.sopralluoghi.find((x) => x.id === id); if (r) Object.assign(r, { nota_agente: nota, stato: fatto ? "preventivo" : r.stato }); })
            .then(() => { toast(fatto ? "Fatto: AncheCasa prepara il preventivo." : "Nota salvata."); V["re-sopralluoghi"].render(el); }, (e2) => toast("Non salvato: " + err(e2), "error"));
          el.querySelectorAll("[data-so]").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); salva(f.getAttribute("data-so"), f.nota.value.trim(), false); }));
          el.querySelectorAll("[data-fatto]").forEach((b) => b.addEventListener("click", () => { if (!conferma(b)) return; salva(b.getAttribute("data-fatto"), b.closest("form").nota.value.trim(), true); }));
        }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     ADMIN: Ristrutturazioni
     ============================================================ */
  let schedaAdm = "pratiche";
  V["ristrutturazioni-admin"] = {
    title: "Ristrutturazioni",
    sub: "AncheCasa general contractor: richieste, sopralluogo con l'agente, preventivo e firma, scelta dell'impresa, SAL. E i piccoli lavori da smistare.",
    render(el) {
      caricamento(el);
      (reale() ? Q(db().rpc("ristrutturazioni_admin")) : Promise.resolve(JSON.parse(JSON.stringify(demo().admin)))).then((A) => {
        if (!A) { el.innerHTML = html`<div class="card empty"><strong>Solo per l'admin</strong></div>`.s; return; }
        const R = A.ristrutturazioni || [], C = A.commesse || [], L = A.lavori || [], AG = A.agenti || [];
        const conta = (s) => R.filter((r) => r.stato === s).length;
        const daSmistare = L.filter((x) => !x.smistata && x.stato === "aperta");
        const SCHEDE = [["pratiche", "Pratiche (" + R.filter((r) => !["chiusa", "persa"].includes(r.stato)).length + ")"], ["cantieri", "Lavori affidati (" + C.length + ")"], ["lavori", "Piccoli lavori" + (daSmistare.length ? " (" + daSmistare.length + " da smistare)" : "")]];
        el.innerHTML = html`${DEMO ? html`<p class="note">Anteprima: dati di esempio, niente va sul database.</p>` : ""}
          <div class="en-kpis">
            <div class="kpi"><span><strong>${conta("nuova")}</strong><small>nuove, senza agente</small></span></div>
            <div class="kpi"><span><strong>${conta("sopralluogo") + conta("preventivo")}</strong><small>sopralluogo e preventivo</small></span></div>
            <div class="kpi"><span><strong>${conta("firmata") + conta("in_cantiere")}</strong><small>firmate e in cantiere</small></span></div>
            <div class="kpi"><span><strong>${daSmistare.length}</strong><small>piccoli lavori da smistare</small></span></div>
          </div>
          <div class="sv-schede">${SCHEDE.map((s) => html`<button type="button" class="${schedaAdm === s[0] ? "btn-in" : "btn-ghost"}" data-sch="${s[0]}">${s[1]}</button>`)}</div><div id="ra-box"></div>`.s;
        el.querySelectorAll("[data-sch]").forEach((b) => b.addEventListener("click", () => { schedaAdm = b.getAttribute("data-sch"); V["ristrutturazioni-admin"].render(el); }));
        const box = el.querySelector("#ra-box");
        const ricarica = () => { avvisa(); V["ristrutturazioni-admin"].render(el); };
        const aggiorna = (tab, id, campi) => (reale() ? Q(db().from(tab).update(campi).eq("id", id)) : Promise.resolve());

        if (schedaAdm === "lavori") {
          box.innerHTML = html`<section class="card"><h2>Piccoli lavori dei privati</h2>
            <p class="note">Arrivano a massimo cinque imprese della zona. Se è una ristrutturazione vera, passala ad AncheCasa: diventa una pratica e la affidi a un agente.</p>
            ${L.length ? L.map((x) => html`<div class="fo-riga"><div class="en-rrow"><div class="en-rinfo">
                <div><span class="tag ${x.smistata === "ristrutturazione" ? "ok" : x.smistata ? "wait" : "new"}">${x.smistata === "ristrutturazione" ? "Passata ad AncheCasa" : x.smistata ? "Alle imprese" : "Da smistare"}</span> <b>${x.nome}</b> <small>· ${dove(x)} · ${giorniFa(x.creato)} · ${x.proposte} preventivi</small></div>
                <small>${x.nota || ""}</small><small>${x.telefono || ""}${x.mail ? " · " + x.mail : ""}</small></div>
              ${x.smistata === "ristrutturazione" ? "" : html`<div class="en-ract">${x.smistata ? "" : html`<button class="btn-ghost" type="button" data-imp="${x.id}">Lascia alle imprese</button>`}<button class="btn-in" type="button" data-ristr="${x.id}">Passa ad AncheCasa</button></div>`}</div></div>`)
            : html`<p class="note">Nessuna richiesta di piccoli lavori.</p>`}</section>`.s;
          const smista = (id, dove2) => (reale() ? Q(db().rpc("lavori_smista", { p_id: id, p_dove: dove2 })) : Promise.resolve(demoCambia((d) => { const x = d.admin.lavori.find((y) => y.id === id); if (x) x.smistata = dove2; if (dove2 === "ristrutturazione" && x) d.admin.ristrutturazioni.unshift({ id: "r" + Date.now(), creato: new Date().toISOString(), origine: "lavori", nome: x.nome, telefono: x.telefono, mail: x.mail, comune: x.comune, provincia: x.provincia, indirizzo: "", descrizione: x.nota, budget: "", agente_id: null, agente: "", segnalata_da: "", nota_agente: "", stato: "nuova", importo_cliente: null, note_admin: "" }); })))
            .then(() => { toast(dove2 === "ristrutturazione" ? "Passata ad AncheCasa: la trovi in Pratiche." : "Resta alle imprese della zona."); ricarica(); }, (e2) => toast("Non riuscito: " + err(e2), "error"));
          box.querySelectorAll("[data-imp]").forEach((b) => b.addEventListener("click", () => smista(b.getAttribute("data-imp"), "imprese")));
          box.querySelectorAll("[data-ristr]").forEach((b) => b.addEventListener("click", () => { if (conferma(b)) smista(b.getAttribute("data-ristr"), "ristrutturazione"); }));
          return;
        }

        if (schedaAdm === "cantieri") {
          box.innerHTML = C.length ? html`${C.map((c) => {
            const salC = (c.sal || []).filter((s) => s.per === "cliente"), salI = (c.sal || []).filter((s) => s.per === "impresa");
            const tab = (lista) => lista.length ? html`<table class="mini-table"><tbody>${lista.map((s) => html`<tr><td>${s.numero}</td><td>${s.descrizione}</td><td class="num">${eur(s.importo)}</td>
              <td><select data-sal="${s.id}">${Object.keys(STATO_SAL).map((k) => html`<option value="${k}"${s.stato === k ? " selected" : ""}>${STATO_SAL[k][1]}</option>`)}</select></td></tr>`)}</tbody></table>` : html`<p class="note">Nessun SAL.</p>`;
            return html`<section class="card"><h2>${c.titolo} ${tag(STATO_C, c.stato, "proposta")}</h2>
              <p class="note">${c.impresa} · ${dove(c)} · importo impresa ${c.importo_impresa != null ? eur(c.importo_impresa) : "—"}${c.nota_impresa ? " · nota: «" + c.nota_impresa + "»" : ""}</p>${barra(c.avanzamento)}
              <div class="pv-due"><div><h3>SAL del cliente (paga ad AncheCasa)</h3>${tab(salC)}</div><div><h3>SAL dell'impresa (paga AncheCasa)</h3>${tab(salI)}</div></div>
              <form class="nm-o" data-nsal="${c.id}"><label>Per<select name="per"><option value="cliente">Cliente</option><option value="impresa">Impresa</option></select></label>
                <label>N.<input name="n" type="number" min="1" max="50" value="${Math.max(salC.length, salI.length) + 1}" style="width:60px"></label>
                <label>Cosa<input name="desc" maxlength="200" required placeholder="es. a metà lavori"></label><label>Importo €<input name="imp" inputmode="decimal" required style="width:110px"></label>
                <label>Data<input type="date" name="data"></label><button class="btn-ghost" type="submit">Aggiungi SAL</button></form></section>`;
          })}`.s : html`<div class="card empty"><strong>Nessun lavoro affidato</strong><span>Dalla scheda Pratiche, su una pratica firmata, premi «Affida a un'impresa».</span></div>`.s;
          box.querySelectorAll("[data-sal]").forEach((s) => s.addEventListener("change", () => {
            const id = s.getAttribute("data-sal");
            (reale() ? Q(db().from("commesse_sal").update({ stato: s.value }).eq("id", id)) : Promise.resolve(demoCambia((d) => d.admin.commesse.forEach((c) => (c.sal || []).forEach((x) => { if (x.id === id) x.stato = s.value; })))))
              .then(() => toast("SAL aggiornato."), (e2) => toast("Non salvato: " + err(e2), "error"));
          }));
          box.querySelectorAll("[data-nsal]").forEach((f) => f.addEventListener("submit", (e) => {
            e.preventDefault();
            const riga = { commessa_id: f.getAttribute("data-nsal"), per: f.per.value, numero: Number(f.n.value) || 1, descrizione: f.desc.value.trim(), importo: num(f.imp.value), data: f.data.value || null };
            (reale() ? Q(db().from("commesse_sal").insert(riga)) : Promise.resolve(demoCambia((d) => { const c = d.admin.commesse.find((x) => x.id === riga.commessa_id); if (c) (c.sal = c.sal || []).push(Object.assign({ id: "s" + Date.now(), stato: "previsto" }, riga)); })))
              .then(() => { toast("SAL aggiunto."); ricarica(); }, (e2) => toast("Non salvato: " + err(e2), "error"));
          }));
          return;
        }

        // Pratiche
        box.innerHTML = R.length ? html`${R.map((r) => {
          const cm = C.filter((c) => c.ristrutturazione_id === r.id);
          return html`<section class="card"><div class="en-rrow"><div class="en-rinfo">
              <div>${tag(STATO_R, r.stato, "nuova")} <b>${r.nome}</b> <small>· ${dove(r)} · ${r.origine === "rete" ? "segnalata da " + (r.segnalata_da || "la rete") : r.origine === "lavori" ? "da Piccoli lavori" : r.origine === "admin" ? "inserita da te" : "dal privato"} · ${giorniFa(r.creato)}</small></div>
              <small>${r.descrizione}${r.budget ? " · budget " + r.budget : ""}</small>
              <small><a href="tel:${(r.telefono || "").replace(/\s/g, "")}">${r.telefono}</a>${r.mail ? html` · <a href="mailto:${r.mail}">${r.mail}</a>` : ""}${r.indirizzo ? " · " + r.indirizzo : ""}</small>
              ${r.nota_agente ? html`<small>Sopralluogo (${r.agente}): «${r.nota_agente}»</small>` : ""}
              ${cm.length ? html`<small>Affidato a: ${cm.map((c) => c.impresa + " (" + STATO_C[c.stato][1].toLowerCase() + ")").join(", ")}</small>` : ""}</div></div>
            <form class="nm-o" data-pr="${r.id}">
              <label>Stato<select name="stato">${Object.keys(STATO_R).map((k) => html`<option value="${k}"${r.stato === k ? " selected" : ""}>${STATO_R[k][1]}</option>`)}</select></label>
              <label>Agente per il sopralluogo<select name="agente"><option value="">—</option>${AG.map((a) => html`<option value="${a.id}"${r.agente_id === a.id ? " selected" : ""}>${a.nome}${a.regione ? " · " + a.regione : ""}</option>`)}</select></label>
              <label>Prezzo al cliente €<input name="imp" inputmode="decimal" value="${r.importo_cliente != null ? String(r.importo_cliente).replace(".", ",") : ""}" style="width:120px"></label>
              <label>Note<input name="note" maxlength="1500" value="${r.note_admin || ""}"></label>
              <button class="btn-ghost" type="submit">Salva</button>
              ${["preventivo", "firmata", "in_cantiere"].includes(r.stato) ? html`<button class="btn-in" type="button" data-affida="${r.id}">Affida a un'impresa</button>` : ""}</form>
            <div data-box-affida="${r.id}"></div></section>`;
        })}`.s : html`<div class="card empty"><strong>Nessuna richiesta di ristrutturazione</strong><span>Arrivano dai privati, dalla rete e dai piccoli lavori che passi ad AncheCasa.</span></div>`.s;

        box.querySelectorAll("[data-pr]").forEach((f) => f.addEventListener("submit", (e) => {
          e.preventDefault();
          const id = f.getAttribute("data-pr"), r = R.find((x) => x.id === id);
          const campi = { stato: f.stato.value, agente_id: f.agente.value || null, importo_cliente: f.imp.value.trim() ? num(f.imp.value) : null, note_admin: f.note.value.trim() };
          if (campi.agente_id && campi.agente_id !== r.agente_id && campi.stato === "nuova") campi.stato = "sopralluogo";
          (reale() ? aggiorna("ristrutturazioni", id, campi) : Promise.resolve(demoCambia((d) => { const x = d.admin.ristrutturazioni.find((y) => y.id === id); if (x) Object.assign(x, campi, { agente: (AG.find((a) => a.id === campi.agente_id) || {}).nome || "" }); })))
            .then(() => { toast(campi.agente_id && campi.agente_id !== r.agente_id ? "Salvato: all'agente arriva la mail del sopralluogo." : "Salvato."); ricarica(); }, (e2) => toast("Non salvato: " + err(e2), "error"));
        }));
        box.querySelectorAll("[data-affida]").forEach((b) => b.addEventListener("click", () => {
          const id = b.getAttribute("data-affida"), r = R.find((x) => x.id === id);
          const sotto = box.querySelector("[data-box-affida='" + id + "']");
          sotto.innerHTML = html`<p class="note">Cerco le imprese verificate che coprono ${r.provincia || "la zona"}…</p>`.s;
          D.cerca(["impresa", "azienda_imprese_edili", "azienda_subappaltatori", "azienda_impiantisti"], r.provincia, r.comune).then((imp) => {
            const VIC = ["stesso comune", "stessa provincia", "in zona"];
            sotto.innerHTML = html`<form class="prefs wide en-grid" data-nc="${id}">
              <label class="span2">Impresa (scegli tu)<select name="imp" required><option value="">Scegli…</option>${(imp || []).map((a) => html`<option value="${a.id}">${a.nome} · ${TIPI[a.tipo_azienda] || ""} · ${VIC[a.vicinanza] || ""}${a.puo_lavorare ? "" : " · prova finita o documenti mancanti"}</option>`)}</select></label>
              <label class="span2">Titolo del lavoro<input name="tit" maxlength="120" required value="${r.descrizione.slice(0, 80)}"></label>
              <label class="span2">Cosa deve fare l'impresa<textarea name="desc" maxlength="2000">${r.descrizione}${r.nota_agente ? "\n\nSopralluogo: " + r.nota_agente : ""}</textarea></label>
              <label>Importo per l'impresa €<input name="imp_e" inputmode="decimal" required></label>
              <label>Referente AncheCasa<input name="ref" maxlength="160" value="Fernando Palumbo · AncheCasa"></label>
              <label>Inizio<input type="date" name="ini"></label><label>Fine<input type="date" name="fine"></label>
              <p class="note span2">L'impresa vede solo il suo importo, l'indirizzo e il lavoro. Il prezzo al cliente e i suoi contatti restano ad AncheCasa.</p>
              <div class="row-actions span2"><button class="btn-in" type="submit">Manda il lavoro all'impresa</button></div></form>
              ${(imp || []).length ? "" : html`<p class="note">Nessuna impresa verificata copre questa provincia.</p>`}`.s;
            const f = sotto.querySelector("form");
            f.addEventListener("submit", (e) => {
              e.preventDefault();
              const riga = { ristrutturazione_id: id, impresa_id: f.imp.value, titolo: f.tit.value.trim(), descrizione: f.desc.value.trim(), comune: r.comune, provincia: r.provincia, indirizzo: r.indirizzo,
                importo_impresa: num(f.imp_e.value), inizio: f.ini.value || null, fine: f.fine.value || null, referente: f.ref.value.trim() };
              const btn = f.querySelector("button"); btn.disabled = true;
              (reale() ? Q(db().from("commesse").insert(riga)).then(() => (r.stato === "preventivo" ? aggiorna("ristrutturazioni", id, { stato: "firmata" }) : null))
                : Promise.resolve(demoCambia((d) => { d.admin.commesse.unshift(Object.assign({ id: "c" + Date.now(), creato: new Date().toISOString(), impresa: ((imp || []).find((a) => a.id === riga.impresa_id) || {}).nome || "", stato: "proposta", avanzamento: 0, sal: [] }, riga)); })))
                .then(() => { toast("Lavoro mandato: all'impresa arriva la mail."); ricarica(); }, (e2) => { btn.disabled = false; toast("Non mandato: " + err(e2), "error"); });
            });
          }, (e2) => nonPronto(sotto, e2));
        }));
      }, (e) => nonPronto(el, e));
    }
  };

  AC.imprese = { STATO_R: STATO_R };
})();
