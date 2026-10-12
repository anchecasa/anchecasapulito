/* TELEFONIA E INTERNET · FINANZA E ASSICURAZIONI (12.10.2026, decisioni di Nando, PROGETTO-DASHBOARD.md, app-20).
   Stesso giro di luce e gas, con un motore solo per le due categorie:
     Fornitore: Home · Richieste (senza nome finché il cliente non sceglie) · Proposte (carta AncheCasa con il suo logo)
                · Le mie offerte · I miei clienti · Il mio accordo (provvigione: la scrive l'admin, il fornitore la conferma).
     Privato e impresa: vedono le offerte dei fornitori e chiedono proposte; le confrontano dal link (servizi.html).
     Rete: il commerciale chiede proposte per un suo cliente (luce e gas, telefonia, finanza); se il contratto si attiva, la vendita è sua.
   Luce e gas resta in energia.js e non si tocca.
   Anteprima (?demo=…): dati di esempio in questo browser, niente sul database e nessuna mail. */
(function () {
  const AC = window.AC;
  const { html, toast } = AC.ui;
  const S = AC.store;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;

  const SU = { mese: "al mese", anno: "all'anno", una_tantum: "una tantum", da_calcolare: "da calcolare" };
  const STATO_P = { inviata: ["wait", "Inviata"], accettata: ["ok", "Scelta dal cliente"], rifiutata: ["paused", "Non scelta"], attivata: ["ok", "Contratto attivato"] };
  const STATO_R = { aperta: ["wait", "In attesa di proposte"], scelta: ["ok", "Scelta fatta"], chiusa: ["ok", "Contratto attivato"] };
  const FONTE = { magazine: "Magazine", dashboard: "Dashboard del cliente", rete: "Commerciale AncheCasa" };
  const CLIENTI = { privati: "Privati", imprese: "Imprese", tutti: "Privati e imprese" };
  const REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];

  /* Le due categorie: cambiano nomi e campi, il giro è lo stesso. */
  const CAT = {
    telefonia: {
      pre: "tel", nome: "Telefonia e internet", corto: "telefonia", sigla: "AC-TL", tipoAzienda: "azienda_telefonia",
      tipi: { casa: "Casa (fibra o ADSL)", mobile: "Cellulare", casa_mobile: "Casa e cellulare", ufficio: "Ufficio (più linee)" },
      tipiPrivato: ["casa", "mobile", "casa_mobile"], tipiImpresa: ["ufficio", "mobile", "casa_mobile"],
      prezzoLab: "Canone €", suDefault: "mese",
      durataLab: "Vincolo (mesi)", attivLab: "Attivazione €",
      dettLab: "Cosa comprende", dettPh: "Es. fibra fino a 2,5 Gbit/s, modem incluso, chiamate illimitate",
      noteLab: "Vantaggi e condizioni", notePh: "Es. nessun costo di disattivazione dopo 24 mesi.",
      chiedi: { spesa: "Quanto spendi oggi €/mese", quanti: "Quante SIM o linee", attuale: "Operatore di oggi", importo: null, durata: null },
      perche: "Telefono e internet di casa o dell'ufficio: i fornitori AncheCasa ti mandano le loro proposte, le confronti e scegli tu.",
      vuotoOff: "Nessuna offerta pubblicata ancora. Chiedi comunque le proposte: i fornitori le preparano sulle tue esigenze."
    },
    finanza: {
      pre: "fin", nome: "Finanza e assicurazioni", corto: "finanza", sigla: "AC-FN", tipoAzienda: "azienda_finanza",
      tipi: { mutuo: "Mutuo casa", prestito: "Prestito per ristrutturare", assicurazione_casa: "Assicurazione casa", polizza_cantiere: "Polizza cantiere (CAR)", decennale: "Polizza decennale postuma", fideiussione: "Fideiussione per gare", rc_professionale: "RC professionale", altro: "Altro" },
      tipiPrivato: ["mutuo", "prestito", "assicurazione_casa", "altro"],
      tipiImpresa: ["polizza_cantiere", "decennale", "fideiussione", "rc_professionale", "prestito", "assicurazione_casa", "altro"],
      prezzoLab: "Rata o premio €", suDefault: "mese",
      durataLab: "Durata (mesi)", attivLab: "Spese di istruttoria €",
      dettLab: "Tasso, TAEG o massimale", dettPh: "Es. TAN 3,10% · TAEG 3,35% · fino all'80% del valore",
      noteLab: "Condizioni", notePh: "Es. Esempio rappresentativo, documenti richiesti, tempi di delibera.",
      chiedi: { spesa: null, quanti: null, attuale: "Banca o compagnia di oggi (facoltativo)", importo: "Importo o valore €", durata: "Durata (mesi)" },
      perche: "Mutui, prestiti e polizze per la casa e per l'impresa: i fornitori AncheCasa, iscritti agli elenchi OAM e IVASS, ti mandano le loro proposte.",
      vuotoOff: "Nessuna offerta pubblicata ancora. Chiedi comunque le proposte: i fornitori le preparano sulla tua richiesta."
    }
  };

  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/\./g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const numOrNull = (v) => { if (v == null || String(v).trim() === "") return null; const n = num(v); return n || n === 0 ? n : null; };
  const eur = (n, dec) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }) + " €";
  const prezzoTxt = (p, su) => (p == null || p === "" ? "Su misura" : eur(p, 2) + " " + (SU[su] || ""));
  const oggi = () => new Date().toLocaleDateString("it-IT");
  const dataIt = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const giorniFa = (iso) => { const g = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return g <= 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa"; };
  const err = (e) => (e && e.message) || String(e || "errore");
  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });
  const uid = () => db().auth.getSession().then((s) => (s.data && s.data.session ? s.data.session.user.id : ""));
  const nomeTipo = (cat, t) => CAT[cat].tipi[t] || t || "";

  /* ============================================================
     DATI DI ESEMPIO (anteprima e vetrina)
     ============================================================ */
  const DEMO_KEY = "ac-demo-servizi-v1";
  function demoTutto() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { d = null; }
    if (d && d.telefonia && d.finanza) return d;
    const ieri = new Date(Date.now() - 86400000).toISOString(), tre = new Date(Date.now() - 3 * 86400000).toISOString(), ora = new Date().toISOString();
    d = {
      telefonia: {
        carta: { ragione: "Linea Sud Telecomunicazioni Srl", piva: "09876543210", indirizzo: "Corso Trieste 40, Caserta", telefono: "0823 555111", mail: "offerte@lineasud.it", sito: "lineasud.it", iscrizione: "" },
        offerte: [
          { id: "to1", nome: "Fibra Casa 2,5 Giga", tipo: "casa", clienti: "privati", prezzo: 24.9, prezzo_su: "mese", attivazione: 0, durata_mesi: 24, dettagli: "Fibra FTTH fino a 2,5 Gbit/s, modem Wi-Fi 6 incluso, chiamate illimitate", note: "Prezzo bloccato 24 mesi.", attiva: true },
          { id: "to2", nome: "Ufficio Pro 4 linee", tipo: "ufficio", clienti: "imprese", prezzo: 59, prezzo_su: "mese", attivazione: 49, durata_mesi: 24, dettagli: "Fibra 1 Giga, 4 linee voce, centralino in cloud", note: "Assistenza dedicata entro 8 ore.", attiva: true }
        ],
        richieste: [
          { id: "tr1", creato: ora, categoria: "telefonia", fonte: "dashboard", tipo: "casa_mobile", cliente_tipo: "privato", regione: "Campania", comune: "Caserta", spesa_mese: 55, importo: null, durata_mesi: null, quanti: 3, attuale: "TIM", nota: "Casa più due cellulari", stato: "aperta", mia_proposta: null, mia_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", proposte: 1 },
          { id: "tr2", creato: ieri, categoria: "telefonia", fonte: "rete", tipo: "ufficio", cliente_tipo: "impresa", regione: "Lazio", comune: "Latina", spesa_mese: 120, importo: null, durata_mesi: null, quanti: 6, attuale: "Vodafone", nota: "", stato: "aperta", mia_proposta: "tp1", mia_stato: "inviata", scelta_mia: false, nome: "", mail: "", telefono: "", proposte: 2 },
          { id: "tr3", creato: tre, categoria: "telefonia", fonte: "dashboard", tipo: "casa", cliente_tipo: "privato", regione: "Puglia", comune: "Lecce", spesa_mese: 35, importo: null, durata_mesi: null, quanti: 1, attuale: "WindTre", nota: "", stato: "scelta", mia_proposta: "tp2", mia_stato: "accettata", scelta_mia: true, nome: "Giulia Conte", mail: "giulia.conte@esempio.it", telefono: "347 9876543", proposte: 2 }
        ],
        proposte: [
          { id: "tp1", numero: "AC-TL-2026-0002", cliente: "Richiesta da Latina", stato: "inviata", prezzo: 59, prezzo_su: "mese", created_at: ieri, richiesta_id: "tr2", offerta_id: "to2" },
          { id: "tp2", numero: "AC-TL-2026-0001", cliente: "Giulia Conte", stato: "accettata", prezzo: 24.9, prezzo_su: "mese", created_at: tre, richiesta_id: "tr3", offerta_id: "to1" }
        ],
        accordo: { tipo: "fisso", valore: 30, su_cosa: "per ogni contratto attivato", note: "Concordato al telefono il 12.10.2026.", confermato_il: null },
        mie: [{ token: "", creato: ieri, categoria: "telefonia", tipo: "casa", stato: "aperta", proposte: 2 }]
      },
      finanza: {
        carta: { ragione: "Credito Casa Mediazioni Srl", piva: "05544332211", indirizzo: "Via Napoli 12, Caserta", telefono: "0823 444222", mail: "info@creditocasa.it", sito: "creditocasa.it", iscrizione: "Iscritta OAM n. M000 (esempio)" },
        offerte: [
          { id: "fo1", nome: "Mutuo Prima Casa Fisso", tipo: "mutuo", clienti: "privati", prezzo: 620, prezzo_su: "mese", attivazione: 500, durata_mesi: 300, dettagli: "TAN 3,10% · TAEG 3,35% · fino all'80% del valore", note: "Esempio su 150.000 € in 25 anni. Delibera in 20 giorni.", attiva: true },
          { id: "fo2", nome: "Polizza CAR cantiere", tipo: "polizza_cantiere", clienti: "imprese", prezzo: null, prezzo_su: "da_calcolare", attivazione: null, durata_mesi: 12, dettagli: "Danni all'opera e responsabilità civile verso terzi", note: "Premio calcolato sul valore dei lavori.", attiva: true }
        ],
        richieste: [
          { id: "fr1", creato: ora, categoria: "finanza", fonte: "dashboard", tipo: "fideiussione", cliente_tipo: "impresa", regione: "Campania", comune: "Napoli", spesa_mese: null, importo: 85000, durata_mesi: 12, quanti: null, attuale: "", nota: "Gara comunale, cauzione provvisoria", stato: "aperta", mia_proposta: null, mia_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", proposte: 0 },
          { id: "fr2", creato: ieri, categoria: "finanza", fonte: "dashboard", tipo: "mutuo", cliente_tipo: "privato", regione: "Lazio", comune: "Roma", spesa_mese: null, importo: 180000, durata_mesi: 300, quanti: null, attuale: "", nota: "Prima casa", stato: "aperta", mia_proposta: null, mia_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", proposte: 1 },
          { id: "fr3", creato: tre, categoria: "finanza", fonte: "rete", tipo: "prestito", cliente_tipo: "privato", regione: "Campania", comune: "Aversa", spesa_mese: null, importo: 25000, durata_mesi: 84, quanti: null, attuale: "", nota: "Rifacimento bagno e cucina", stato: "scelta", mia_proposta: "fp1", mia_stato: "accettata", scelta_mia: true, nome: "Paolo Esposito", mail: "paolo.esposito@esempio.it", telefono: "339 1112233", proposte: 2 }
        ],
        proposte: [
          { id: "fp1", numero: "AC-FN-2026-0001", cliente: "Paolo Esposito", stato: "accettata", prezzo: 342, prezzo_su: "mese", created_at: tre, richiesta_id: "fr3", offerta_id: null }
        ],
        accordo: { tipo: "percentuale", valore: 1, su_cosa: "sull'importo erogato", note: "Da verificare con il commercialista.", confermato_il: null },
        mie: [{ token: "", creato: ieri, categoria: "finanza", tipo: "mutuo", stato: "aperta", proposte: 1 }]
      }
    };
    return d;
  }
  function demoDi(cat) { return demoTutto()[cat]; }
  function demoCambia(cat, fn) { const t = demoTutto(); fn(t[cat]); try { localStorage.setItem(DEMO_KEY, JSON.stringify(t)); } catch (e) {} }

  /* ============================================================
     DATI: database (vero) o esempio (anteprima)
     ============================================================ */
  function dati(cat) {
    return {
      carta() {
        if (!reale()) return Promise.resolve(demoDi(cat).carta);
        return uid().then((id) => Q(db().from("energia_carta").select("*").eq("azienda_id", id).maybeSingle()))
          .then((r) => r || { ragione: "", piva: "", indirizzo: "", telefono: "", mail: "", sito: "", iscrizione: "" });
      },
      salvaCarta(c) {
        if (!reale()) { demoCambia(cat, (d) => { d.carta = c; }); return Promise.resolve(); }
        return uid().then((id) => Q(db().from("energia_carta").upsert(Object.assign({ azienda_id: id, updated_at: new Date().toISOString() }, c))));
      },
      offerte() {
        if (!reale()) return Promise.resolve(demoDi(cat).offerte);
        return uid().then((id) => Q(db().from("servizi_offerte").select("*").eq("azienda_id", id).order("created_at", { ascending: false })));
      },
      salvaOfferta(o) {
        if (!reale()) {
          demoCambia(cat, (d) => {
            if (!o.id) o.id = "o" + Date.now().toString(36);
            const i = d.offerte.findIndex((x) => x.id === o.id);
            if (i >= 0) d.offerte[i] = o; else d.offerte.unshift(o);
          });
          return Promise.resolve();
        }
        const riga = Object.assign({}, o, { categoria: cat, updated_at: new Date().toISOString() });
        if (!riga.id) delete riga.id;
        return uid().then((id) => Q(db().from("servizi_offerte").upsert(Object.assign(riga, { azienda_id: id }))));
      },
      togliOfferta(id) {
        if (!reale()) { demoCambia(cat, (d) => { d.offerte = d.offerte.filter((o) => o.id !== id); }); return Promise.resolve(); }
        return Q(db().from("servizi_offerte").delete().eq("id", id));
      },
      richieste() {
        if (!reale()) return Promise.resolve(demoDi(cat).richieste);
        return Q(db().rpc("servizi_richieste_per_me"));
      },
      proposte() {
        if (!reale()) return Promise.resolve(demoDi(cat).proposte);
        return uid().then((id) => Q(db().from("servizi_proposte").select("*").eq("azienda_id", id).order("created_at", { ascending: false })));
      },
      nuovaProposta(p) {
        if (!reale()) {
          demoCambia(cat, (d) => {
            p.id = "p" + Date.now().toString(36); p.stato = "inviata"; p.created_at = new Date().toISOString();
            d.proposte.unshift(p);
            const r = d.richieste.find((x) => x.id === p.richiesta_id);
            if (r) { r.mia_proposta = p.id; r.mia_stato = "inviata"; r.proposte = (r.proposte || 0) + 1; }
          });
          return Promise.resolve(p);
        }
        return uid().then((id) => Q(db().from("servizi_proposte").insert(Object.assign({ azienda_id: id, categoria: cat }, p)).select("*").single()))
          .then((riga) => {
            if (riga.richiesta_id) db().functions.invoke("servizi-avvisa", { body: { evento: "proposta", proposta: riga.id } }).catch(() => {});
            return riga;
          });
      },
      attivato(pid) {
        if (!reale()) {
          demoCambia(cat, (d) => {
            const p = d.proposte.find((x) => x.id === pid); if (p) p.stato = "attivata";
            const r = d.richieste.find((x) => x.mia_proposta === pid); if (r) { r.mia_stato = "attivata"; r.stato = "chiusa"; }
          });
          return Promise.resolve();
        }
        return Q(db().rpc("servizi_contratto_attivato", { p_proposta: pid }));
      },
      accordo() {
        if (!reale()) return Promise.resolve(demoDi(cat).accordo);
        return uid().then((id) => Q(db().from("fornitori_accordi").select("*").eq("azienda_id", id).maybeSingle()));
      },
      confermaAccordo() {
        if (!reale()) { demoCambia(cat, (d) => { d.accordo.confermato_il = new Date().toISOString(); }); return Promise.resolve(); }
        return Q(db().rpc("fornitori_conferma_accordo"));
      }
    };
  }

  function nonPronto(el, e) {
    const m = err(e);
    const manca = /does not exist|schema cache|function|PGRST20/i.test(m);
    el.innerHTML = html`<div class="card empty"><strong>${manca ? "Questa categoria non è ancora attiva sul database" : "Non riesco a leggere i dati"}</strong>
      <span>${manca ? "Manca app-20 su Supabase. Appena c'è, questa pagina funziona da sola." : m}</span></div>`.s;
  }

  function cartaDi(c) {
    const p = S.data.profilo || {};
    return {
      ragione: c.ragione || p.nome || "La tua azienda", piva: c.piva || "", indirizzo: c.indirizzo || p.zona || "",
      telefono: c.telefono || "", mail: c.mail || (S.data.account && S.data.account.mail) || "", sito: c.sito || "", iscrizione: c.iscrizione || "",
      logo: typeof p.logo === "string" && (p.logo.indexOf("data:image/") === 0 || p.logo.indexOf("http") === 0) ? p.logo : ""
    };
  }
  function cartaHtml(c, corpo) {
    return html`
      <div class="en-carta">
        <div class="en-carta-head">
          <img src="img/carta-logo-bianco.png" alt="AncheCasa">
          <div class="en-carta-az">${c.logo ? html`<img src="${c.logo}" alt="Logo ${c.ragione}">` : html`<span>${c.ragione}</span>`}</div>
        </div>
        <div class="en-carta-rule"></div>
        <div class="en-carta-body">${corpo}</div>
        <div class="en-carta-foot">
          <span>${c.ragione}${c.piva ? " · P. IVA " + c.piva : ""}${c.iscrizione ? " · " + c.iscrizione : ""}</span>
          <span>Proposta tramite <b>AncheCasa</b> · Costruiamo fiducia</span>
        </div>
      </div>`;
  }
  function cosaChiede(cat, r) {
    const x = [];
    if (r.importo) x.push(eur(r.importo, 0));
    if (r.durata_mesi) x.push(r.durata_mesi + " mesi");
    if (r.quanti) x.push(r.quanti + (r.quanti === 1 ? " linea" : " linee"));
    if (r.spesa_mese) x.push("spende " + eur(r.spesa_mese, 0) + " al mese");
    if (r.attuale) x.push("oggi con " + r.attuale);
    return x.join(" · ");
  }
  function prossimoNumero(cat, proposte) {
    const anno = new Date().getFullYear();
    const re = new RegExp(CAT[cat].sigla + "-(\\d{4})-(\\d{4})");
    const max = (proposte || []).reduce((m, p) => { const x = re.exec(p.numero || ""); return x && Number(x[1]) === anno ? Math.max(m, Number(x[2])) : m; }, 0);
    return CAT[cat].sigla + "-" + anno + "-" + String(max + 1).padStart(4, "0");
  }
  function righeOfferta(cat, o, prezzo, su) {
    const k = CAT[cat];
    const r = [[k.prezzoLab.replace(" €", ""), prezzoTxt(prezzo != null ? prezzo : o.prezzo, su || o.prezzo_su)]];
    if (o.dettagli) r.push([k.dettLab, o.dettagli]);
    if (o.durata_mesi) r.push([k.durataLab.replace(" (mesi)", ""), o.durata_mesi + " mesi"]);
    if (o.attivazione != null && o.attivazione !== "") r.push([k.attivLab.replace(" €", ""), num(o.attivazione) ? eur(o.attivazione, 2) : "Gratis"]);
    r.push(["Per", CLIENTI[o.clienti] || "Privati e imprese"]);
    return r;
  }

  /* ============================================================
     PAGINE DEL FORNITORE (una serie per categoria)
     ============================================================ */
  Object.keys(CAT).forEach((cat) => {
    const K = CAT[cat];
    const D = dati(cat);
    const P = K.pre;
    const vai = (pag) => "#/azienda/" + P + "_" + pag;
    let daRichiesta = null;

    V[P + "_home"] = {
      title: "Home",
      sub: K.nome + ": richieste, proposte e contratti.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        Promise.all([D.richieste(), D.proposte(), D.accordo(), D.offerte()]).then(([rich, prop, acc, off]) => {
          const nuove = (rich || []).filter((r) => r.stato === "aperta" && !r.mia_proposta);
          const attesa = (prop || []).filter((p) => p.stato === "inviata");
          const scelte = (prop || []).filter((p) => p.stato === "accettata");
          const inizio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const attivati = (prop || []).filter((p) => p.stato === "attivata" && p.attivata_il && new Date(p.attivata_il) >= inizio).length;
          el.innerHTML = html`
            ${acc && !acc.confermato_il ? html`<div class="card en-banner"><div><h2>C'è un accordo da confermare</h2><p class="note">AncheCasa ha scritto la provvigione concordata con te. Leggila e confermala.</p></div><a class="btn-in" href="${vai("accordo")}">Vai all'accordo</a></div>` : ""}
            ${!(off || []).some((o) => o.attiva !== false) ? html`<div class="card en-banner"><div><h2>Pubblica la prima offerta</h2><p class="note">I clienti AncheCasa vedono le tue offerte e le tue proposte partono dal listino.</p></div><a class="btn-in" href="${vai("offerte")}">Le mie offerte</a></div>` : ""}
            <div class="en-kpis">
              <a class="kpi en-kpi" href="${vai("richieste")}"><span><strong>${nuove.length}</strong><small>richieste nuove</small></span></a>
              <a class="kpi en-kpi" href="${vai("proposte")}"><span><strong>${attesa.length}</strong><small>proposte in attesa</small></span></a>
              <a class="kpi en-kpi" href="${vai("clienti")}"><span><strong>${scelte.length}</strong><small>clienti da contattare</small></span></a>
              <div class="kpi"><span><strong>${attivati}</strong><small>contratti attivati questo mese</small></span></div>
            </div>
            <div class="card">
              <h2>Ultime richieste</h2>
              ${nuove.length ? html`<div class="en-lista">${nuove.slice(0, 5).map((r) => html`<a class="en-rich" href="${vai("richieste")}">
                <span class="tag new">${nomeTipo(cat, r.tipo)}</span><b>${r.comune || r.regione || "Italia"}</b><small>${r.cliente_tipo === "impresa" ? "Impresa" : "Privato"}${cosaChiede(cat, r) ? " · " + cosaChiede(cat, r) : ""} · ${giorniFa(r.creato)}</small></a>`)}</div>`
                : html`<p class="note">Nessuna richiesta nuova. Arrivano dalle dashboard di privati e imprese e dai commerciali AncheCasa.</p>`}
            </div>`.s;
        }, (e) => nonPronto(el, e));
      }
    };

    V[P + "_richieste"] = {
      title: "Richieste",
      sub: "Clienti che chiedono una proposta. Vedi cosa serve e la zona; nome e telefono solo se il cliente sceglie la tua proposta.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        Promise.all([D.richieste(), D.accordo()]).then(([rich, acc]) => {
          const lista = rich || [];
          const ok = !!(acc && acc.confermato_il);
          const aperte = lista.filter((r) => r.stato === "aperta");
          const altre = lista.filter((r) => r.stato !== "aperta");
          const riga = (r) => html`<div class="en-rrow">
            <div class="en-rinfo">
              <div><span class="tag new">${nomeTipo(cat, r.tipo)}</span> <b>${r.comune || "—"}${r.regione ? ", " + r.regione : ""}</b> <small>· ${r.cliente_tipo === "impresa" ? "Impresa" : "Privato"} · ${FONTE[r.fonte] || r.fonte} · ${giorniFa(r.creato)}</small></div>
              <small>${cosaChiede(cat, r) || "nessun dettaglio"}${r.nota ? " · «" + r.nota + "»" : ""}</small>
              <small>${r.proposte || 0} ${r.proposte === 1 ? "proposta" : "proposte"} arrivate</small>
            </div>
            <div class="en-ract">${r.mia_proposta
              ? html`<span class="tag ${STATO_P[r.mia_stato] ? STATO_P[r.mia_stato][0] : "wait"}">${STATO_P[r.mia_stato] ? STATO_P[r.mia_stato][1] : "Proposta inviata"}</span>`
              : r.stato !== "aperta" ? html`<span class="tag paused">Chiusa</span>`
              : ok ? html`<button class="btn-in" type="button" data-proponi="${r.id}">Fai la proposta</button>`
              : html`<a class="btn-ghost" href="${vai("accordo")}">Prima conferma l'accordo</a>`}</div>
          </div>`;
          el.innerHTML = html`
            ${ok ? "" : html`<div class="card en-banner"><div><h2>Per mandare proposte serve l'accordo</h2><p class="note">${acc ? "AncheCasa ti ha inviato la provvigione: leggila e confermala." : "AncheCasa ti scriverà qui la provvigione concordata. Appena la confermi puoi mandare proposte."}</p></div>${acc ? html`<a class="btn-in" href="${vai("accordo")}">Vai all'accordo</a>` : ""}</div>`}
            <p class="note">La richiesta arriva a tutti i fornitori di ${K.corto} AncheCasa. Il cliente confronta le proposte e ne sceglie una: solo quel fornitore riceve nome, mail e telefono.</p>
            <div class="card"><h2>Aperte <span class="ra-n">${aperte.length}</span></h2>${aperte.length ? aperte.map(riga) : html`<p class="note">Nessuna richiesta aperta.</p>`}</div>
            ${altre.length ? html`<div class="card"><h2>Già scelte o chiuse</h2>${altre.map(riga)}</div>` : ""}`.s;
          el.querySelectorAll("[data-proponi]").forEach((b) => b.addEventListener("click", () => {
            daRichiesta = lista.find((r) => r.id === b.getAttribute("data-proponi")) || null;
            location.hash = vai("proposte");
          }));
        }, (e) => nonPronto(el, e));
      }
    };

    V[P + "_offerte"] = {
      title: "Le mie offerte",
      sub: "Il tuo listino, visibile ai clienti AncheCasa, e la tua carta intestata.",
      render(el) {
        let modifica = null;
        const formOfferta = (o) => {
          o = o || { tipo: Object.keys(K.tipi)[0], clienti: "tutti", prezzo_su: K.suDefault, attiva: true };
          const v = (x) => (x == null ? "" : String(x).replace(".", ","));
          return html`
            <form id="sv-f-off" class="prefs wide en-grid">
              <label class="span2">Nome dell'offerta<input name="nome" required maxlength="80" value="${o.nome || ""}"></label>
              <label>Cosa<select name="tipo">${Object.keys(K.tipi).map((k) => html`<option value="${k}"${o.tipo === k ? " selected" : ""}>${K.tipi[k]}</option>`)}</select></label>
              <label>Clienti<select name="clienti">${Object.keys(CLIENTI).map((k) => html`<option value="${k}"${o.clienti === k ? " selected" : ""}>${CLIENTI[k]}</option>`)}</select></label>
              <label>${K.prezzoLab}<input name="prezzo" inputmode="decimal" value="${v(o.prezzo)}" placeholder="vuoto = su misura"></label>
              <label>Ogni<select name="su">${Object.keys(SU).map((k) => html`<option value="${k}"${o.prezzo_su === k ? " selected" : ""}>${SU[k]}</option>`)}</select></label>
              <label>${K.durataLab}<input name="durata" inputmode="numeric" value="${o.durata_mesi || ""}"></label>
              <label>${K.attivLab}<input name="attiv" inputmode="decimal" value="${v(o.attivazione)}"></label>
              <label class="span2">${K.dettLab}<input name="dettagli" maxlength="200" value="${o.dettagli || ""}" placeholder="${K.dettPh}"></label>
              <label class="span2">${K.noteLab}<textarea name="note" maxlength="600" placeholder="${K.notePh}">${o.note || ""}</textarea></label>
              <label class="check span2"><input type="checkbox" name="attiva"${o.attiva !== false ? " checked" : ""}> Offerta attiva: la vedono i clienti AncheCasa</label>
              <div class="row-actions span2">
                <button class="btn-in" type="submit">${o.id ? "Salva le modifiche" : "Aggiungi al listino"}</button>
                ${o.id ? html`<button class="btn-ghost" type="button" data-annulla>Annulla</button>` : ""}
              </div>
            </form>`;
        };
        const disegna = () => {
          el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
          Promise.all([D.offerte(), D.carta()]).then(([off, carta]) => {
            const c = cartaDi(carta || {});
            el.innerHTML = html`
              <div class="card">
                <h2>${modifica ? "Modifica offerta" : "Nuova offerta"}</h2>
                ${cat === "finanza" ? html`<p class="note">Scrivi tassi e condizioni come nei tuoi fogli informativi. AncheCasa segnala il cliente: non vende e non consiglia.</p>` : ""}
                ${formOfferta(modifica)}
              </div>
              <div class="card">
                <h2>Il tuo listino</h2>
                ${(off || []).length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>Offerta</th><th>Prezzo</th><th>Stato</th><th></th></tr></thead><tbody>${off.map((o) => html`<tr>
                  <td><b>${o.nome}</b><br><small>${nomeTipo(cat, o.tipo)} · ${CLIENTI[o.clienti]}${o.durata_mesi ? " · " + o.durata_mesi + " mesi" : ""}</small></td>
                  <td>${prezzoTxt(o.prezzo, o.prezzo_su)}<br><small>${o.dettagli || ""}</small></td>
                  <td>${o.attiva !== false ? html`<span class="tag ok">Attiva</span>` : html`<span class="tag paused">In pausa</span>`}</td>
                  <td class="en-act"><button class="btn-mini" type="button" data-mod="${o.id}">Modifica</button> <button class="btn-mini" type="button" data-del="${o.id}">Elimina</button></td>
                </tr>`)}</tbody></table></div>` : html`<p class="note">Ancora nessuna offerta. Aggiungi la prima qui sopra.</p>`}
              </div>
              <div class="card">
                <h2>La tua carta intestata</h2>
                <p class="note">Questi dati compaiono su ogni proposta, con il marchio AncheCasa. Il logo lo carichi nel <a href="#/azienda/profilo">Profilo</a>${c.logo ? "" : html` <span class="tag wait">logo da caricare</span>`}.</p>
                <div class="en-carta-wrap">
                  <form id="sv-f-carta" class="prefs wide en-grid">
                    <label class="span2">Ragione sociale<input name="ragione" value="${(carta && carta.ragione) || ""}"></label>
                    <label>Partita IVA<input name="piva" value="${(carta && carta.piva) || ""}" inputmode="numeric" maxlength="16"></label>
                    <label>Telefono<input name="telefono" value="${(carta && carta.telefono) || ""}"></label>
                    <label class="span2">Indirizzo sede<input name="indirizzo" value="${(carta && carta.indirizzo) || ""}"></label>
                    <label>Mail<input name="mail" type="email" value="${(carta && carta.mail) || ""}"></label>
                    <label>Sito<input name="sito" value="${(carta && carta.sito) || ""}"></label>
                    ${cat === "finanza" ? html`<label class="span2">Iscrizione OAM o IVASS (compare sulle proposte)<input name="iscrizione" maxlength="120" required value="${(carta && carta.iscrizione) || ""}" placeholder="Es. Iscritta all'OAM n. M123"></label>` : ""}
                    <div class="row-actions span2"><button class="btn-in" type="submit">Salva la carta intestata</button></div>
                  </form>
                  <div class="en-carta-mini">${cartaHtml(c, html`<p class="en-mini-t">Proposta</p><div class="en-mini-l"></div><div class="en-mini-l s"></div><div class="en-mini-l"></div>`)}</div>
                </div>
              </div>`.s;
            const fo = el.querySelector("#sv-f-off");
            fo.addEventListener("submit", (e) => {
              e.preventDefault();
              const f = fo.elements;
              const o = {
                nome: f.nome.value.trim(), tipo: f.tipo.value, clienti: f.clienti.value,
                prezzo: numOrNull(f.prezzo.value), prezzo_su: f.prezzo.value.trim() ? f.su.value : "da_calcolare",
                durata_mesi: numOrNull(f.durata.value), attivazione: numOrNull(f.attiv.value),
                dettagli: f.dettagli.value.trim(), note: f.note.value.trim(), attiva: f.attiva.checked
              };
              if (modifica && modifica.id) o.id = modifica.id;
              if (!o.nome) return toast("Dai un nome all'offerta.", "error");
              D.salvaOfferta(o).then(() => { toast(modifica ? "Offerta aggiornata" : "Offerta aggiunta al listino"); modifica = null; disegna(); }, (e2) => toast("Non salvata: " + err(e2), "error"));
            });
            const ann = el.querySelector("[data-annulla]");
            if (ann) ann.addEventListener("click", () => { modifica = null; disegna(); });
            el.querySelectorAll("[data-mod]").forEach((b) => b.addEventListener("click", () => { modifica = (off || []).find((o) => o.id === b.getAttribute("data-mod")) || null; disegna(); }));
            el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
              if (b.dataset.conferma !== "1") { b.dataset.conferma = "1"; b.textContent = "Conferma"; return; }
              D.togliOfferta(b.getAttribute("data-del")).then(() => { toast("Offerta eliminata"); disegna(); }, (e2) => toast("Non eliminata: " + err(e2), "error"));
            }));
            el.querySelector("#sv-f-carta").addEventListener("submit", (e) => {
              e.preventDefault();
              const f = e.target.elements;
              const nuova = { ragione: f.ragione.value.trim(), piva: f.piva.value.trim(), indirizzo: f.indirizzo.value.trim(), telefono: f.telefono.value.trim(), mail: f.mail.value.trim(), sito: f.sito.value.trim() };
              if (f.iscrizione) nuova.iscrizione = f.iscrizione.value.trim();
              D.salvaCarta(nuova).then(() => { toast("Carta intestata salvata"); disegna(); }, (e2) => toast("Non salvata: " + err(e2), "error"));
            });
          }, (e) => nonPronto(el, e));
        };
        disegna();
      }
    };

    V[P + "_proposte"] = {
      title: "Proposte",
      sub: "La proposta al cliente su carta AncheCasa con il tuo logo.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        Promise.all([D.offerte(), D.carta(), D.proposte(), D.accordo()]).then(([off, carta, prop, acc]) => {
          const attive = (off || []).filter((o) => o.attiva !== false);
          if (!(acc && acc.confermato_il)) {
            el.innerHTML = html`<div class="card"><h2>Prima l'accordo con AncheCasa</h2><p class="note">Le proposte si possono mandare dopo aver confermato la provvigione. ${acc ? "Te l'abbiamo già inviata." : "AncheCasa te la invia a breve."}</p>${acc ? html`<div class="row-actions"><a class="btn-in" href="${vai("accordo")}">Vai all'accordo</a></div>` : ""}</div>`.s;
            return;
          }
          const r = daRichiesta;
          daRichiesta = null;
          const c = cartaDi(carta || {});
          if (cat === "finanza" && !c.iscrizione) {
            el.innerHTML = html`<div class="card"><h2>Manca l'iscrizione OAM o IVASS</h2><p class="note">Sulle proposte di finanza e assicurazioni deve comparire la tua iscrizione. Scrivila nella carta intestata.</p><div class="row-actions"><a class="btn-in" href="${vai("offerte")}">Vai alla carta intestata</a></div></div>`.s;
            return;
          }
          const numero = prossimoNumero(cat, prop);
          const elenco = html`<div class="card"><h2>Le tue proposte</h2>
            ${(prop || []).length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>N.</th><th>Data</th><th>Cliente</th><th class="num">Prezzo</th><th>Stato</th></tr></thead>
              <tbody>${prop.map((x) => html`<tr><td>${x.numero}</td><td>${dataIt(x.created_at)}</td><td>${x.cliente}</td><td class="num">${prezzoTxt(x.prezzo, x.prezzo_su)}</td><td><span class="tag ${(STATO_P[x.stato] || STATO_P.inviata)[0]}">${(STATO_P[x.stato] || STATO_P.inviata)[1]}</span></td></tr>`)}</tbody></table></div>`
              : html`<p class="note">Qui trovi le proposte che mandi.</p>`}</div>`;
          if (!attive.length) {
            el.innerHTML = html`<div class="card"><h2>Prima serve un'offerta</h2><p class="note">Le proposte partono dal tuo listino.</p><div class="row-actions"><a class="btn-in" href="${vai("offerte")}">Vai a Le mie offerte</a></div></div>${elenco}`.s;
            return;
          }
          const adatte = r ? attive.filter((o) => o.tipo === r.tipo) : attive;
          const scelte = adatte.length ? adatte : attive;
          el.innerHTML = html`
            ${r ? html`<div class="card en-banner"><div><h2>Proposta per la richiesta di ${r.comune || r.regione || "un cliente"}</h2>
              <p class="note">${nomeTipo(cat, r.tipo)}${cosaChiede(cat, r) ? " · " + cosaChiede(cat, r) : ""}. Il cliente la vede dal link nella sua mail, accanto alle altre.</p></div></div>` : ""}
            <div class="en-two">
              <div class="card">
                <h2>${r ? "La tua proposta" : "Nuova proposta a un tuo cliente"}</h2>
                <form id="sv-f-prop" class="prefs wide en-grid">
                  <label class="span2">Offerta<select name="offerta">${scelte.map((o) => html`<option value="${o.id}">${o.nome} · ${nomeTipo(cat, o.tipo)}</option>`)}</select></label>
                  ${r ? "" : html`
                  <label class="span2">Cliente (nome e cognome o ragione sociale)<input name="cliente" required maxlength="90"></label>
                  <label class="span2">Mail del cliente<input name="mail" type="email"></label>`}
                  <label>${K.prezzoLab} per questo cliente<input name="prezzo" inputmode="decimal" placeholder="vuoto = quello dell'offerta"></label>
                  <label>Ogni<select name="su">${Object.keys(SU).map((k) => html`<option value="${k}">${SU[k]}</option>`)}</select></label>
                  <label class="span2">Nota per il cliente<textarea name="nota" maxlength="400" placeholder="Es. condizioni riservate ai clienti AncheCasa, tempi di attivazione."></textarea></label>
                  <div class="row-actions span2">
                    <button class="btn-in" type="submit">${r ? "Manda la proposta" : "Salva e scarica il PDF"}</button>
                    ${r ? html`<button class="btn-ghost" type="button" id="sv-solo-pdf">Scarica il PDF</button>` : ""}
                  </div>
                </form>
              </div>
              <div class="card en-prev-card"><h2>Anteprima sulla carta intestata</h2><div id="sv-prev"></div></div>
            </div>
            ${elenco}`.s;
          const f = el.querySelector("#sv-f-prop");
          const prev = el.querySelector("#sv-prev");
          const leggi = () => {
            const e = f.elements;
            const o = scelte.find((x) => x.id === e.offerta.value) || scelte[0];
            const pr = numOrNull(e.prezzo.value);
            return {
              o: o, numero: numero,
              cliente: r ? "Cliente AncheCasa" : e.cliente.value.trim(),
              luogo: r ? [r.comune, r.regione].filter(Boolean).join(", ") : "",
              mail: r ? "" : e.mail.value.trim(),
              prezzo: pr != null ? pr : o.prezzo, su: pr != null ? e.su.value : o.prezzo_su,
              nota: e.nota.value.trim()
            };
          };
          const aggiorna = () => {
            const x = leggi();
            prev.innerHTML = cartaHtml(c, html`
              <p class="en-p-meta">Proposta n. ${x.numero} · ${oggi()} · valida 30 giorni</p>
              <p class="en-p-to">Spett.le<br><b>${x.cliente || "Nome del cliente"}</b>${x.luogo ? html`<br>${x.luogo}` : ""}</p>
              <h3 class="en-p-title">${nomeTipo(cat, x.o.tipo)}</h3>
              <p class="en-p-offer">${x.o.nome}</p>
              <table class="en-p-tab">${righeOfferta(cat, x.o, x.prezzo, x.su).map((rr) => html`<tr><td>${rr[0]}</td><td>${rr[1]}</td></tr>`)}</table>
              <div class="en-p-stima"><span>${K.prezzoLab.replace(" €", "")}</span><b>${prezzoTxt(x.prezzo, x.su)}</b></div>
              ${x.nota ? html`<p class="en-p-note">${x.nota}</p>` : ""}
              ${x.o.note ? html`<p class="en-p-note">${x.o.note}</p>` : ""}`).s;
          };
          f.addEventListener("input", aggiorna); f.addEventListener("change", aggiorna); aggiorna();
          const soloPdf = el.querySelector("#sv-solo-pdf");
          if (soloPdf) soloPdf.addEventListener("click", () => creaPdf(cat, leggi(), c).catch((e2) => toast("PDF non creato: " + err(e2), "error")));
          f.addEventListener("submit", (e) => {
            e.preventDefault();
            const x = leggi();
            if (!x.cliente) return toast("Inserisci il nome del cliente.", "error");
            const btn = f.querySelector("button[type=submit]");
            btn.disabled = true;
            const riga = { offerta_id: x.o.id, numero: x.numero, cliente: x.cliente, mail: x.mail, prezzo: x.prezzo, prezzo_su: x.su || "da_calcolare", nota: x.nota, richiesta_id: r ? r.id : null };
            D.nuovaProposta(riga).then(() => {
              toast(r ? "Proposta mandata: il cliente la riceve per mail." : "Proposta " + x.numero + " salvata");
              const dopo = () => V[P + "_proposte"].render(el);
              if (!r) creaPdf(cat, x, c).then(dopo, dopo); else dopo();
            }, (e2) => { btn.disabled = false; toast("Proposta non mandata: " + err(e2), "error"); });
          });
        }, (e) => nonPronto(el, e));
      }
    };

    V[P + "_clienti"] = {
      title: "I miei clienti",
      sub: "Chi ha scelto la tua proposta: contattalo, mandagli il contratto, segna quando è attivato.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        Promise.all([D.richieste(), D.proposte()]).then(([rich, prop]) => {
          const scelti = (rich || []).filter((r) => r.scelta_mia);
          const diretti = (prop || []).filter((p) => !p.richiesta_id);
          const pDi = (r) => (prop || []).find((p) => p.id === r.mia_proposta) || {};
          el.innerHTML = html`
            <div class="card">
              <h2>Dalle richieste AncheCasa</h2>
              ${scelti.length ? scelti.map((r) => { const p = pDi(r); const att = (p.stato || r.mia_stato) === "attivata"; return html`<div class="en-rrow">
                <div class="en-rinfo"><div><b>${r.nome}</b> <small>· ${r.comune || ""}${r.regione ? ", " + r.regione : ""} · ${nomeTipo(cat, r.tipo)} · proposta ${p.numero || ""}</small></div>
                  <small><a href="mailto:${r.mail}">${r.mail}</a>${r.telefono ? html` · <a href="tel:${r.telefono.replace(/\s/g, "")}">${r.telefono}</a>` : ""}</small>
                  <small>${cosaChiede(cat, r)}${p.prezzo != null ? " · " + prezzoTxt(p.prezzo, p.prezzo_su) : ""}</small></div>
                <div class="en-ract">${att ? html`<span class="tag ok">Contratto attivato</span>` : html`<button class="btn-in" type="button" data-attiva="${r.mia_proposta}">Contratto attivato</button>`}</div>
              </div>`; }) : html`<p class="note">Quando un cliente sceglie la tua proposta, qui trovi nome, mail e telefono.</p>`}
            </div>
            ${diretti.length ? html`<div class="card"><h2>Proposte ai tuoi clienti diretti</h2>${diretti.map((p) => html`<div class="en-rrow"><div class="en-rinfo"><b>${p.cliente}</b><small>${p.numero} · ${dataIt(p.created_at)} · ${prezzoTxt(p.prezzo, p.prezzo_su)}</small></div></div>`)}</div>` : ""}`.s;
          el.querySelectorAll("[data-attiva]").forEach((b) => b.addEventListener("click", () => {
            if (b.dataset.conferma !== "1") { b.dataset.conferma = "1"; b.textContent = "Confermi? Il contratto è attivo"; return; }
            D.attivato(b.getAttribute("data-attiva")).then(() => { toast("Contratto attivato: AncheCasa lo vede per la provvigione."); V[P + "_clienti"].render(el); }, (e2) => toast("Non salvato: " + err(e2), "error"));
          }));
        }, (e) => nonPronto(el, e));
      }
    };

    V[P + "_accordo"] = {
      title: "Il mio accordo",
      sub: "La provvigione concordata con AncheCasa.",
      render(el) {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        D.accordo().then((a) => {
          if (!a) {
            el.innerHTML = html`<div class="card"><h2>Accordo da scrivere</h2><p class="note">AncheCasa scrive qui la provvigione concordata con te. Quando c'è, la leggi e la confermi con un clic.</p></div>`.s;
            return;
          }
          const quanto = a.tipo === "percentuale" ? num(a.valore).toLocaleString("it-IT") + "%" : eur(a.valore, 2);
          el.innerHTML = html`<div class="card en-accordo">
            <h2>Provvigione AncheCasa</h2>
            <p class="en-acc-v">${quanto} <small>${a.su_cosa}</small></p>
            ${a.note ? html`<p class="note">${a.note}</p>` : ""}
            ${a.confermato_il ? html`<p><span class="tag ok">Confermato il ${dataIt(a.confermato_il)}</span></p>`
              : html`<p class="note">Leggi e conferma: da questo momento vale per ogni contratto attivato tramite AncheCasa, e puoi mandare le tue proposte ai clienti.</p><div class="row-actions"><button class="btn-in" type="button" id="sv-conferma">Confermo l'accordo</button></div>`}
          </div>`.s;
          const b = el.querySelector("#sv-conferma");
          if (b) b.addEventListener("click", () => D.confermaAccordo().then(() => { toast("Accordo confermato"); V[P + "_accordo"].render(el); }, (e2) => toast("Non confermato: " + err(e2), "error")));
        }, (e) => nonPronto(el, e));
      }
    };
  });

  /* ============================================================
     PAGINE DEI CLIENTI: privato, impresa (offerte + richiesta) e commerciale della rete
     ============================================================ */
  function offertePubbliche(cat) {
    if (!reale()) {
      const d = demoDi(cat);
      return Promise.resolve(d.offerte.filter((o) => o.attiva !== false).map((o) => Object.assign({ azienda: d.carta.ragione, logo: "", iscrizione: d.carta.iscrizione || "" }, o)));
    }
    return Q(db().rpc("servizi_offerte_pubbliche", { p_categoria: cat }));
  }
  function mieRichieste(cat, comeRete) {
    if (!reale()) return Promise.resolve(demoDi(cat).mie);
    return uid().then((id) => Q(db().from("servizi_richieste").select("token, creato, categoria, tipo, stato, nome")
      .eq("categoria", cat).eq(comeRete ? "inviato_da" : "richiedente_id", id).order("creato", { ascending: false }).limit(30)));
  }
  function mandaRichiesta(cat, dati) {
    if (!reale()) {
      demoCambia(cat, (d) => { d.mie.unshift({ token: "", creato: new Date().toISOString(), categoria: cat, tipo: dati.tipo, stato: "aperta", nome: dati.nome }); });
      return Promise.resolve("anteprima");
    }
    return Q(db().rpc("servizi_nuova_richiesta", { p: Object.assign({ categoria: cat }, dati) })).then((tok) => {
      db().functions.invoke("servizi-avvisa", { body: { evento: "richiesta", token: tok } }).catch(() => {});
      return tok;
    });
  }

  function formRichiesta(cat, chi, prefisso) {
    const K = CAT[cat];
    const tipi = chi === "impresa" ? K.tipiImpresa : chi === "rete" ? Object.keys(K.tipi) : K.tipiPrivato;
    const p = S.data.profilo || {};
    const mail = chi === "rete" ? "" : (S.data.account && S.data.account.mail) || "";
    const nome = chi === "rete" ? "" : p.nome || "";
    return html`
      <form id="${prefisso}-f" class="prefs wide en-grid">
        <label class="span2">Cosa ti serve<select name="tipo">${tipi.map((k) => html`<option value="${k}">${K.tipi[k]}</option>`)}</select></label>
        ${chi === "rete" ? html`<label>Il cliente è<select name="cliente_tipo"><option value="privato">Un privato</option><option value="impresa">Un'impresa</option></select></label>` : ""}
        ${K.chiedi.spesa ? html`<label>${K.chiedi.spesa}<input name="spesa" inputmode="decimal" placeholder="es. 45"></label>` : ""}
        ${K.chiedi.quanti ? html`<label>${K.chiedi.quanti}<input name="quanti" inputmode="numeric" placeholder="es. 2"></label>` : ""}
        ${K.chiedi.importo ? html`<label>${K.chiedi.importo}<input name="importo" inputmode="decimal" placeholder="es. 150.000"></label>` : ""}
        ${K.chiedi.durata ? html`<label>${K.chiedi.durata}<input name="durata" inputmode="numeric" placeholder="es. 240"></label>` : ""}
        <label class="span2">${K.chiedi.attuale}<input name="attuale" maxlength="80"></label>
        <label>Comune<input name="comune" maxlength="80" value="${chi === "rete" ? "" : p.zona || ""}"></label>
        <label>Regione<select name="regione"><option value="">Scegli…</option>${REGIONI.map((r) => html`<option>${r}</option>`)}</select></label>
        <label class="span2">Qualcosa da aggiungere (facoltativo)<input name="nota" maxlength="500"></label>
        <label>${chi === "rete" ? "Nome del cliente" : chi === "impresa" ? "Nome dell'impresa o referente" : "Nome e cognome"}<input name="nome" required maxlength="120" value="${nome}"></label>
        <label>Telefono<input name="tel" maxlength="30"></label>
        <label class="span2">${chi === "rete" ? "Mail del cliente (le proposte arrivano a lui)" : "Mail"}<input name="mail" type="email" required value="${mail}"></label>
        <label class="check span2"><input type="checkbox" name="consenso"> ${chi === "rete" ? "Il cliente è d'accordo a ricevere le proposte dei fornitori AncheCasa. Nome e contatti li riceve solo il fornitore che sceglie." : "Voglio ricevere le proposte dei fornitori AncheCasa. Nome e contatti li riceve solo il fornitore che scelgo."}</label>
        <div class="row-actions span2"><button class="btn-in" type="submit">Chiedi le proposte</button></div>
      </form>`;
  }
  function leggiRichiesta(f, chi) {
    const e = f.elements;
    return {
      fonte: chi === "rete" ? "rete" : "dashboard", tipo: e.tipo.value,
      cliente_tipo: chi === "rete" ? e.cliente_tipo.value : chi === "impresa" ? "impresa" : "privato",
      spesa_mese: e.spesa ? numOrNull(e.spesa.value) : null, quanti: e.quanti ? numOrNull(e.quanti.value) : null,
      importo: e.importo ? numOrNull(e.importo.value) : null, durata_mesi: e.durata ? numOrNull(e.durata.value) : null,
      attuale: e.attuale.value.trim(), comune: e.comune.value.trim(), regione: e.regione.value, nota: e.nota.value.trim(),
      nome: e.nome.value.trim(), telefono: e.tel.value.trim(), mail: e.mail.value.trim(), consenso: e.consenso.checked
    };
  }
  function elencoMie(box, cat, comeRete) {
    mieRichieste(cat, comeRete).then((l) => {
      box.innerHTML = (l || []).length ? html`<div class="en-lista">${l.map((r) => html`<div class="en-rrow"><div class="en-rinfo"><b>${nomeTipo(cat, r.tipo)}</b><small>${comeRete && r.nome ? r.nome + " · " : ""}${dataIt(r.creato)}</small></div>
        <div class="en-ract"><span class="tag ${(STATO_R[r.stato] || STATO_R.aperta)[0]}">${(STATO_R[r.stato] || STATO_R.aperta)[1]}</span>${r.token ? html` <a class="btn-mini" href="../servizi.html?t=${r.token}" target="_blank" rel="noopener">Vedi le proposte</a>` : ""}</div></div>`)}</div>`.s
        : html`<p class="note">Ancora nessuna richiesta.</p>`.s;
    }, () => { box.innerHTML = html`<p class="note">Non riesco a leggere le richieste.</p>`.s; });
  }
  function collegaForm(el, cat, chi, prefisso, dopo) {
    const f = el.querySelector("#" + prefisso + "-f");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = leggiRichiesta(f, chi);
      if (!d.consenso) return toast("Serve il consenso per ricevere le proposte.", "error");
      if (!d.nome || !d.mail) return toast("Scrivi nome e mail.", "error");
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      mandaRichiesta(cat, d).then((tok) => {
        btn.disabled = false;
        toast(tok === "anteprima" ? "Anteprima: richiesta registrata, niente è partito." : chi === "rete" ? "Richiesta inviata: le proposte arrivano per mail al cliente." : "Richiesta inviata: ti scriviamo appena arrivano le proposte.");
        f.reset(); if (dopo) dopo();
      }, (e2) => { btn.disabled = false; toast(/troppe/.test(err(e2)) ? "Troppe richieste oggi con questa mail." : "Richiesta non inviata: " + err(e2), "error"); });
    });
  }

  function paginaCliente(cat, chi) {
    const K = CAT[cat];
    return {
      title: cat === "telefonia" ? "Telefono e internet" : chi === "impresa" ? "Polizze e finanziamenti" : "Mutui, prestiti e polizze",
      sub: K.perche,
      render(el) {
        const pre = "sc-" + K.pre;
        el.innerHTML = html`
          <section class="card">
            <h2>Le offerte dei fornitori AncheCasa</h2>
            <div id="${pre}-off"><p class="note">Caricamento…</p></div>
          </section>
          <div class="pv-due">
            <section class="card"><h2>Chiedi le proposte</h2><p class="note">La richiesta arriva a tutti i fornitori di ${K.corto} AncheCasa, senza il tuo nome. Confronti le proposte e scegli tu: solo quel fornitore riceve i tuoi contatti.</p>${formRichiesta(cat, chi, pre)}</section>
            <section class="card"><h2>Le mie richieste</h2><div id="${pre}-mie"><p class="note">Caricamento…</p></div></section>
          </div>`.s;
        const boxOff = el.querySelector("#" + pre + "-off");
        const boxMie = el.querySelector("#" + pre + "-mie");
        const perMe = (o) => o.clienti === "tutti" || (chi === "impresa" ? o.clienti === "imprese" : o.clienti === "privati");
        offertePubbliche(cat).then((l) => {
          const mie = (l || []).filter(perMe);
          boxOff.innerHTML = mie.length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>Fornitore</th><th>Offerta</th><th>Prezzo</th><th></th></tr></thead><tbody>${mie.map((o) => html`<tr>
            <td><b>${o.azienda}</b>${o.iscrizione ? html`<br><small>${o.iscrizione}</small>` : ""}</td>
            <td><b>${o.nome}</b><br><small>${nomeTipo(cat, o.tipo)}${o.dettagli ? " · " + o.dettagli : ""}${o.durata_mesi ? " · " + o.durata_mesi + " mesi" : ""}</small></td>
            <td>${prezzoTxt(o.prezzo, o.prezzo_su)}</td>
            <td class="en-act"><button class="btn-mini" type="button" data-chiedi="${o.tipo}">Chiedi una proposta</button></td>
          </tr>`)}</tbody></table></div>`.s : html`<p class="note">${K.vuotoOff}</p>`.s;
          boxOff.querySelectorAll("[data-chiedi]").forEach((b) => b.addEventListener("click", () => {
            const f = el.querySelector("#" + pre + "-f");
            const t = b.getAttribute("data-chiedi");
            if ([].some.call(f.tipo.options, (o) => o.value === t)) f.tipo.value = t;
            f.scrollIntoView({ behavior: "smooth", block: "start" });
            f.elements.nome.focus();
          }));
        }, (e) => { boxOff.innerHTML = /does not exist|schema cache|function|PGRST20/i.test(err(e)) ? html`<p class="note">Le offerte arrivano a breve.</p>`.s : html`<p class="note">Non riesco a leggere le offerte.</p>`.s; });
        elencoMie(boxMie, cat, false);
        collegaForm(el, cat, chi, pre, () => elencoMie(boxMie, cat, false));
      }
    };
  }
  V["pv-offerte-tel"] = paginaCliente("telefonia", "privato");
  V["pv-offerte-fin"] = paginaCliente("finanza", "privato");
  V["az-telefonia"] = paginaCliente("telefonia", "impresa");
  V["az-finanza"] = paginaCliente("finanza", "impresa");

  /* Rete: il commerciale chiede proposte per un suo cliente. Se il contratto si attiva, la vendita è sua (app-20). */
  const RE_KEY = "ac-re-offerte-scheda";
  V["re-offerte"] = {
    title: "Offerte per i clienti",
    sub: "Luce e gas, telefono, mutui e polizze, materiali, noleggio, traslochi: chiedi le proposte per un tuo cliente. Se firma, la vendita è tua.",
    render(el) {
      let scheda = "energia";
      try { scheda = localStorage.getItem(RE_KEY) || "energia"; } catch (e) {}
      // 12.10.2026, app-21: anche materiali, noleggio e servizi per la casa (js/preventivi.js).
      const SCHEDE = [["energia", "Luce e gas"], ["telefonia", "Telefono e internet"], ["finanza", "Mutui e polizze"]]
        .concat(AC.preventivi ? [["materiali", "Materiali edili"], ["noleggio", "Noleggio"], ["casa", "Traslochi e pulizie"]] : []);
      const disegna = () => {
        if (AC.preventivi && AC.preventivi.CAT[scheda]) {
          el.innerHTML = html`<div class="sv-schede">${SCHEDE.map((s) => html`<button type="button" class="${scheda === s[0] ? "btn-in" : "btn-ghost"}" data-scheda="${s[0]}">${s[1]}</button>`)}</div><div id="re-prev"></div>`.s;
          el.querySelectorAll("[data-scheda]").forEach((b) => b.addEventListener("click", () => {
            scheda = b.getAttribute("data-scheda");
            try { localStorage.setItem(RE_KEY, scheda); } catch (e) {}
            disegna();
          }));
          AC.preventivi.schedaRete(el.querySelector("#re-prev"), scheda);
          return;
        }
        el.innerHTML = html`
          <div class="sv-schede">${SCHEDE.map((s) => html`<button type="button" class="${scheda === s[0] ? "btn-in" : "btn-ghost"}" data-scheda="${s[0]}">${s[1]}</button>`)}</div>
          <div class="pv-due">
            <section class="card"><h2>Chiedi le proposte per il cliente</h2>
              <p class="note">La richiesta arriva a tutti i fornitori della categoria, senza il nome del cliente. Il cliente riceve le proposte per mail e sceglie lui. Quando il fornitore attiva il contratto, la vendita compare nei tuoi numeri.</p>
              <div id="re-off-form"></div></section>
            <section class="card"><h2>Le richieste che hai fatto</h2><div id="re-off-mie"><p class="note">Caricamento…</p></div></section>
          </div>`.s;
        el.querySelectorAll("[data-scheda]").forEach((b) => b.addEventListener("click", () => {
          scheda = b.getAttribute("data-scheda");
          try { localStorage.setItem(RE_KEY, scheda); } catch (e) {}
          disegna();
        }));
        const box = el.querySelector("#re-off-form");
        const mie = el.querySelector("#re-off-mie");
        if (scheda === "energia") {
          box.innerHTML = formEnergiaRete().s;
          elencoEnergiaRete(mie);
          collegaEnergiaRete(el, () => elencoEnergiaRete(mie));
        } else {
          box.innerHTML = formRichiesta(scheda, "rete", "re-" + scheda).s;
          elencoMie(mie, scheda, true);
          collegaForm(el, scheda, "rete", "re-" + scheda, () => elencoMie(mie, scheda, true));
        }
      };
      disegna();
    }
  };

  // Luce e gas dalla rete: usa la funzione di app-19 (energia_nuova_richiesta, fonte «rete»).
  const demoEnRete = [{ token: "", creato: new Date(Date.now() - 2 * 86400000).toISOString(), tipo: "duale", stato: "aperta", nome: "Anna Ferri" }];
  function formEnergiaRete() {
    return html`
      <form id="re-en-f" class="prefs wide en-grid">
        <label>Fornitura<select name="tipo"><option value="duale">Luce e gas</option><option value="luce">Solo luce</option><option value="gas">Solo gas</option></select></label>
        <label>Il cliente è<select name="cliente_tipo"><option value="privato">Un privato</option><option value="impresa">Un'impresa</option></select></label>
        <label>Consumo luce kWh/anno<input name="cl" inputmode="numeric" placeholder="es. 2700"></label>
        <label>Consumo gas Smc/anno<input name="cg" inputmode="numeric" placeholder="es. 1100"></label>
        <label>Spesa di oggi €/mese<input name="spesa" inputmode="decimal"></label>
        <label>Fornitore di oggi<input name="attuale" maxlength="80"></label>
        <label>Comune<input name="comune" maxlength="80"></label>
        <label>Regione<select name="regione"><option value="">Scegli…</option>${REGIONI.map((r) => html`<option>${r}</option>`)}</select></label>
        <label>Nome del cliente<input name="nome" required maxlength="120"></label>
        <label>Telefono<input name="tel" maxlength="30"></label>
        <label class="span2">Mail del cliente (le proposte arrivano a lui)<input name="mail" type="email" required></label>
        <label class="check span2"><input type="checkbox" name="consenso"> Il cliente è d'accordo a ricevere le proposte dei fornitori AncheCasa. Nome e contatti li riceve solo il fornitore che sceglie.</label>
        <div class="row-actions span2"><button class="btn-in" type="submit">Chiedi le proposte</button></div>
      </form>`;
  }
  function elencoEnergiaRete(box) {
    const fatto = (l) => {
      box.innerHTML = (l || []).length ? html`<div class="en-lista">${l.map((r) => html`<div class="en-rrow"><div class="en-rinfo"><b>${{ luce: "Luce", gas: "Gas", duale: "Luce e gas" }[r.tipo] || r.tipo}</b><small>${r.nome ? r.nome + " · " : ""}${dataIt(r.creato)}</small></div>
        <div class="en-ract"><span class="tag ${(STATO_R[r.stato] || STATO_R.aperta)[0]}">${(STATO_R[r.stato] || STATO_R.aperta)[1]}</span>${r.token ? html` <a class="btn-mini" href="../offerte.html?t=${r.token}" target="_blank" rel="noopener">Vedi le proposte</a>` : ""}</div></div>`)}</div>`.s
        : html`<p class="note">Ancora nessuna richiesta.</p>`.s;
    };
    if (!reale()) return fatto(demoEnRete);
    uid().then((id) => Q(db().from("energia_richieste").select("token, creato, tipo, stato, nome").eq("inviato_da", id).order("creato", { ascending: false }).limit(30)))
      .then(fatto, () => { box.innerHTML = html`<p class="note">Non riesco a leggere le richieste.</p>`.s; });
  }
  function collegaEnergiaRete(el, dopo) {
    const f = el.querySelector("#re-en-f");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const x = f.elements;
      if (!x.consenso.checked) return toast("Serve il consenso del cliente.", "error");
      const d = { fonte: "rete", tipo: x.tipo.value, cliente_tipo: x.cliente_tipo.value, consumo_luce: x.tipo.value !== "gas" ? numOrNull(x.cl.value) : null,
        consumo_gas: x.tipo.value !== "luce" ? numOrNull(x.cg.value) : null, spesa_mese: numOrNull(x.spesa.value), fornitore_attuale: x.attuale.value.trim(),
        comune: x.comune.value.trim(), regione: x.regione.value, nome: x.nome.value.trim(), telefono: x.tel.value.trim(), mail: x.mail.value.trim(), consenso: true };
      if (!d.nome || !d.mail) return toast("Scrivi nome e mail del cliente.", "error");
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      if (!reale()) { demoEnRete.unshift({ token: "", creato: new Date().toISOString(), tipo: d.tipo, stato: "aperta", nome: d.nome }); btn.disabled = false; f.reset(); toast("Anteprima: richiesta registrata, niente è partito."); dopo(); return; }
      Q(db().rpc("energia_nuova_richiesta", { p: d })).then((tok) => {
        db().functions.invoke("energia-avvisa", { body: { evento: "richiesta", token: tok } }).catch(() => {});
        btn.disabled = false; f.reset(); toast("Richiesta inviata: le proposte arrivano per mail al cliente."); dopo();
      }, (e2) => { btn.disabled = false; toast(/troppe/.test(err(e2)) ? "Troppe richieste oggi con questa mail." : "Richiesta non inviata: " + err(e2), "error"); });
    });
  }

  /* Per la pagina Fornitori dell'admin. */
  AC.servizi = {
    CAT: CAT,
    richiesteAdmin() {
      if (!reale()) {
        const t = demoTutto();
        return Promise.resolve([].concat(t.telefonia.richieste, t.finanza.richieste).map((r) => Object.assign({}, r, { nome: r.nome || "Cliente di esempio", n: r.proposte || 0 })));
      }
      return Promise.all([
        Q(db().from("servizi_richieste").select("id, creato, categoria, fonte, tipo, cliente_tipo, regione, comune, nome, stato").order("creato", { ascending: false }).limit(80)),
        Q(db().from("servizi_proposte").select("richiesta_id").not("richiesta_id", "is", null))
      ]).then(([r, p]) => {
        const conta = {};
        (p || []).forEach((x) => { conta[x.richiesta_id] = (conta[x.richiesta_id] || 0) + 1; });
        return (r || []).map((x) => Object.assign(x, { n: conta[x.id] || 0 }));
      });
    },
    nomeTipo: nomeTipo
  };

  /* ============================================================
     PDF su carta intestata (come luce e gas)
     ============================================================ */
  function caricaScript(src) {
    return new Promise((ok, ko) => {
      if (window.jspdf && window.jspdf.jsPDF) return ok();
      const s = document.createElement("script");
      s.src = src; s.onload = () => ok(); s.onerror = () => ko(new Error("la libreria PDF non si è caricata, controlla la connessione"));
      document.head.appendChild(s);
    });
  }
  function immagine(src) {
    return new Promise((ok) => {
      if (!src) return ok(null);
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => { try { const cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext("2d").drawImage(im, 0, 0); ok({ data: cv.toDataURL("image/png"), w: im.naturalWidth, h: im.naturalHeight }); } catch (e) { ok(null); } };
      im.onerror = () => ok(null);
      im.src = src;
    });
  }
  function creaPdf(cat, x, c) {
    const K = CAT[cat];
    return caricaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
      .then(() => Promise.all([immagine("img/carta-logo-bianco.png"), immagine(c.logo)]))
      .then(([logoAc, logoAz]) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const NAVY = [22, 48, 77], ORANGE = [229, 107, 16], INK = [36, 56, 76], MUTED = [102, 117, 138];
        doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 36, "F");
        if (logoAc) { const w = 62; doc.addImage(logoAc.data, "PNG", 14, 18 - (w * logoAc.h / logoAc.w) / 2, w, w * logoAc.h / logoAc.w); }
        else { doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text("AncheCasa", 14, 21); }
        doc.setFillColor(255, 255, 255); doc.roundedRect(140, 6, 56, 24, 3, 3, "F");
        if (logoAz) { const maxW = 50, maxH = 18; let w = maxW, h = w * logoAz.h / logoAz.w; if (h > maxH) { h = maxH; w = h * logoAz.w / logoAz.h; } doc.addImage(logoAz.data, "PNG", 168 - w / 2, 18 - h / 2, w, h); }
        else { doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(doc.splitTextToSize(c.ragione, 50), 168, 17, { align: "center" }); }
        doc.setFillColor(...ORANGE); doc.rect(0, 36, 210, 1.6, "F");
        let y = 48;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        doc.text("Proposta n. " + x.numero + "   ·   " + oggi() + "   ·   valida 30 giorni", 14, y);
        y = 58;
        doc.setFontSize(9); doc.text("DA", 14, y); doc.text("SPETT.LE", 112, y);
        doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...INK);
        doc.text(c.ragione, 14, y + 6); doc.text(x.cliente, 112, y + 6);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        const da = [c.piva ? "P. IVA " + c.piva : "", c.iscrizione, c.indirizzo, c.telefono, c.mail, c.sito].filter(Boolean);
        const a = [x.luogo, x.mail].filter(Boolean);
        da.forEach((t, i) => doc.text(doc.splitTextToSize(t, 92)[0], 14, y + 11 + i * 4.6));
        a.forEach((t, i) => doc.text(doc.splitTextToSize(t, 84)[0], 112, y + 11 + i * 4.6));
        y += 14 + Math.max(da.length, a.length) * 4.6 + 6;
        doc.setFont("times", "bold"); doc.setFontSize(21); doc.setTextColor(...NAVY);
        doc.text(nomeTipo(cat, x.o.tipo), 14, y); y += 7;
        doc.setFont("times", "italic"); doc.setFontSize(13); doc.setTextColor(...ORANGE);
        doc.text(x.o.nome, 14, y); y += 6;
        if (x.nota) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...INK); const l = doc.splitTextToSize(x.nota, 182); doc.text(l, 14, y + 3); y += l.length * 4.8 + 3; }
        y += 4;
        doc.setDrawColor(...NAVY); doc.setLineWidth(0.6); doc.line(14, y, 196, y); y += 6;
        righeOfferta(cat, x.o, x.prezzo, x.su).forEach((r, i) => {
          if (i % 2 === 0) { doc.setFillColor(243, 246, 251); doc.rect(14, y - 4.4, 182, 7, "F"); }
          doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...MUTED); doc.text(r[0], 17, y);
          doc.setFont("helvetica", "bold"); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(String(r[1]), 120)[0], 193, y, { align: "right" });
          y += 7;
        });
        y += 4;
        doc.setFillColor(255, 241, 228); doc.roundedRect(14, y, 182, 20, 2.5, 2.5, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(180, 82, 11); doc.text(K.prezzoLab.replace(" €", "").toUpperCase(), 19, y + 8);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
        doc.text(cat === "finanza" ? "Valori indicativi, soggetti a delibera e ai fogli informativi del fornitore." : "Prezzi IVA inclusa salvo diversa indicazione del fornitore.", 19, y + 14);
        doc.setFont("times", "bold"); doc.setFontSize(20); doc.setTextColor(...NAVY); doc.text(prezzoTxt(x.prezzo, x.su), 191, y + 13, { align: "right" });
        y += 28;
        if (x.o.note) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text(K.noteLab, 14, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK); const l = doc.splitTextToSize(x.o.note, 182); doc.text(l, 14, y); y += l.length * 4.6 + 4;
        }
        if (cat === "finanza") {
          doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(...MUTED);
          const l = doc.splitTextToSize("AncheCasa segnala il cliente al fornitore e non svolge attività di intermediazione o consulenza. Il contratto lo propone e lo firma il fornitore.", 182);
          doc.text(l, 14, y); y += l.length * 4 + 4;
        }
        const yf = Math.max(y + 10, 236);
        doc.setDrawColor(190, 200, 212); doc.setLineWidth(0.3); doc.line(14, yf + 12, 92, yf + 12); doc.line(118, yf + 12, 196, yf + 12);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        doc.text("Per " + c.ragione, 14, yf + 17); doc.text("Per presa visione, il cliente", 118, yf + 17);
        doc.setFillColor(...ORANGE); doc.rect(14, 280, 182, 0.5, "F");
        doc.setFontSize(7.5); doc.setTextColor(...MUTED);
        doc.text(c.ragione + (c.piva ? " · P. IVA " + c.piva : "") + (c.iscrizione ? " · " + c.iscrizione : ""), 14, 285);
        doc.text("Proposta presentata tramite AncheCasa · www.anchecasa.it", 14, 289);
        doc.setFont("helvetica", "bold"); doc.setTextColor(...ORANGE); doc.text("Costruiamo fiducia", 196, 289, { align: "right" });
        doc.save("Proposta-" + x.numero + "-" + x.cliente.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".pdf");
      });
  }
})();
