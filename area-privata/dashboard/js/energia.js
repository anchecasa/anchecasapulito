/* LUCE E GAS · dashboard del fornitore di energia (categoria "azienda_luce_gas").
   09.10.2026: listino e proposta in PDF su carta intestata AncheCasa con il logo dell'azienda.
   12.10.2026 (decisioni di Nando, PROGETTO-DASHBOARD.md, app-19): tutto sul database e il giro completo.
     Home · Richieste (da Check Bollette e dalla dashboard del privato, senza nome finché il cliente non sceglie)
     · Proposte (su carta AncheCasa con il logo) · Le mie offerte · I miei clienti · Il mio accordo (provvigione).
   Anteprima (?demo=azienda): dati di esempio in questo browser, niente sul database. */
(function () {
  const AC = window.AC;
  const { html, toast } = AC.ui;
  const S = AC.store;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;

  const TIPI = { luce: "Luce", gas: "Gas", duale: "Luce e gas" };
  const PREZZI = { fisso: "Prezzo fisso", indicizzato: "Indicizzato (PUN / PSV + spread)" };
  const CLIENTI = { privati: "Privati", imprese: "Imprese", tutti: "Privati e imprese" };
  const STATO_P = { inviata: ["wait", "Inviata"], accettata: ["ok", "Scelta dal cliente"], rifiutata: ["paused", "Non scelta"], attivata: ["ok", "Contratto attivato"] };
  const FONTE = { magazine: "Check Bollette", dashboard: "Dashboard del privato", rete: "Commerciale AncheCasa" };

  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) ? n : 0; };
  const eur = (n, dec) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " €";
  const oggi = () => new Date().toLocaleDateString("it-IT");
  const dataIt = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const giorniFa = (iso) => { const g = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return g <= 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa"; };
  const err = (e) => (e && e.message) || String(e || "errore");
  // 12.10.2026, app-22: massimo 5 proposte per richiesta, la richiesta scade dopo 15 giorni.
  const scade = (iso) => { const g = 15 - Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return g <= 0 ? "scade oggi" : g === 1 ? "scade domani" : "scade tra " + g + " giorni"; };

  /* ============================================================
     DATI: database (vero) o esempio nel browser (anteprima)
     ============================================================ */
  const DEMO_KEY = "ac-demo-energia-v2";
  function demoDati() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { d = null; }
    if (d) return d;
    const ieri = new Date(Date.now() - 86400000).toISOString(), tre = new Date(Date.now() - 3 * 86400000).toISOString();
    d = {
      carta: { ragione: "Energia Esempio Srl", piva: "01234567890", indirizzo: "Via Roma 10, Caserta", telefono: "0823 123456", mail: "offerte@energiaesempio.it", sito: "energiaesempio.it" },
      offerte: [
        { id: "o1", nome: "Casa Sicura Luce 12", tipo: "luce", clienti: "privati", prezzo: "fisso", durata_mesi: 12, prezzo_luce: 0.125, prezzo_gas: null, quota_mese: 9.9, bonus: 30, note: "100% energia verde, nessun deposito.", attiva: true },
        { id: "o2", nome: "Duo Casa 24", tipo: "duale", clienti: "tutti", prezzo: "indicizzato", durata_mesi: 24, prezzo_luce: 0.019, prezzo_gas: 0.09, quota_mese: 8, bonus: 0, note: "Spread bloccato per 24 mesi.", attiva: true }
      ],
      richieste: [
        { id: "r1", creato: new Date().toISOString(), fonte: "magazine", tipo: "duale", cliente_tipo: "privato", regione: "Campania", comune: "Caserta", consumo_luce: 2700, consumo_gas: 1100, spesa_mese: 165, fornitore_attuale: "Enel", nota: "", stato: "aperta", mia_proposta: null, mia_stato: null, scelta_mia: false, nome: "", mail: "", telefono: "", proposte: 1 },
        { id: "r2", creato: ieri, fonte: "dashboard", tipo: "luce", cliente_tipo: "privato", regione: "Lazio", comune: "Roma", consumo_luce: 3200, consumo_gas: null, spesa_mese: 95, fornitore_attuale: "", nota: "Casa con pompa di calore", stato: "aperta", mia_proposta: "p1", mia_stato: "inviata", scelta_mia: false, nome: "", mail: "", telefono: "", proposte: 3 },
        { id: "r3", creato: tre, fonte: "magazine", tipo: "gas", cliente_tipo: "privato", regione: "Puglia", comune: "Bari", consumo_luce: null, consumo_gas: 1400, spesa_mese: 110, fornitore_attuale: "Eni", nota: "", stato: "scelta", mia_proposta: "p2", mia_stato: "accettata", scelta_mia: true, nome: "Marta Riva", mail: "marta.riva@esempio.it", telefono: "333 1234567", proposte: 2 }
      ],
      proposte: [
        { id: "p1", numero: "AC-EN-2026-0002", cliente: "Richiesta da Roma", stato: "inviata", stima_annua: 520, created_at: ieri, richiesta_id: "r2", offerta_id: "o1" },
        { id: "p2", numero: "AC-EN-2026-0001", cliente: "Marta Riva", stato: "accettata", stima_annua: 690, created_at: tre, richiesta_id: "r3", offerta_id: "o2" }
      ],
      accordo: { tipo: "fisso", valore: 40, su_cosa: "per ogni contratto attivato", note: "Concordato al telefono il 12.10.2026.", confermato_il: null }
    };
    return d;
  }
  function demoSalva(d) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch (e) {} }

  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });
  function uid() { return db().auth.getSession().then((s) => (s.data && s.data.session ? s.data.session.user.id : "")); }

  const D = {
    carta() {
      if (!reale()) return Promise.resolve(demoDati().carta);
      return uid().then((id) => Q(db().from("energia_carta").select("*").eq("azienda_id", id).maybeSingle()))
        .then((r) => r || { ragione: "", piva: "", indirizzo: "", telefono: "", mail: "", sito: "" });
    },
    salvaCarta(c) {
      if (!reale()) { const d = demoDati(); d.carta = c; demoSalva(d); return Promise.resolve(); }
      return uid().then((id) => Q(db().from("energia_carta").upsert(Object.assign({ azienda_id: id, updated_at: new Date().toISOString() }, c))));
    },
    offerte() {
      if (!reale()) return Promise.resolve(demoDati().offerte);
      return uid().then((id) => Q(db().from("energia_offerte").select("*").eq("azienda_id", id).order("created_at", { ascending: false })));
    },
    salvaOfferta(o) {
      if (!reale()) {
        const d = demoDati();
        if (!o.id) o.id = "o" + Date.now().toString(36);
        const i = d.offerte.findIndex((x) => x.id === o.id);
        if (i >= 0) d.offerte[i] = o; else d.offerte.unshift(o);
        demoSalva(d); return Promise.resolve();
      }
      const riga = Object.assign({}, o, { updated_at: new Date().toISOString() });
      if (!riga.id) delete riga.id;
      return uid().then((id) => Q(db().from("energia_offerte").upsert(Object.assign(riga, { azienda_id: id }))));
    },
    togliOfferta(id) {
      if (!reale()) { const d = demoDati(); d.offerte = d.offerte.filter((o) => o.id !== id); demoSalva(d); return Promise.resolve(); }
      return Q(db().from("energia_offerte").delete().eq("id", id));
    },
    richieste() {
      if (!reale()) return Promise.resolve(demoDati().richieste);
      return Q(db().rpc("energia_richieste_per_me"));
    },
    proposte() {
      if (!reale()) return Promise.resolve(demoDati().proposte);
      return uid().then((id) => Q(db().from("energia_proposte").select("*").eq("azienda_id", id).order("created_at", { ascending: false })));
    },
    nuovaProposta(p) {
      if (!reale()) {
        const d = demoDati();
        p.id = "p" + Date.now().toString(36); p.stato = "inviata"; p.created_at = new Date().toISOString();
        d.proposte.unshift(p);
        const r = d.richieste.find((x) => x.id === p.richiesta_id);
        if (r) { r.mia_proposta = p.id; r.mia_stato = "inviata"; r.proposte = (r.proposte || 0) + 1; }
        demoSalva(d); return Promise.resolve(p);
      }
      return uid().then((id) => Q(db().from("energia_proposte").insert(Object.assign({ azienda_id: id }, p)).select("*").single()))
        .then((riga) => {
          if (riga.richiesta_id) db().functions.invoke("energia-avvisa", { body: { evento: "proposta", proposta: riga.id } }).catch(() => {});
          return riga;
        });
    },
    attivato(pid) {
      if (!reale()) {
        const d = demoDati(); const p = d.proposte.find((x) => x.id === pid); if (p) p.stato = "attivata";
        const r = d.richieste.find((x) => x.mia_proposta === pid); if (r) { r.mia_stato = "attivata"; r.stato = "chiusa"; }
        demoSalva(d); return Promise.resolve();
      }
      return Q(db().rpc("energia_contratto_attivato", { p_proposta: pid }));
    },
    accordo() {
      if (!reale()) return Promise.resolve(demoDati().accordo);
      return uid().then((id) => Q(db().from("fornitori_accordi").select("*").eq("azienda_id", id).maybeSingle()));
    },
    confermaAccordo() {
      if (!reale()) { const d = demoDati(); d.accordo.confermato_il = new Date().toISOString(); demoSalva(d); return Promise.resolve(); }
      return Q(db().rpc("fornitori_conferma_accordo"));
    }
  };

  function nonPronto(el, e) {
    const m = err(e);
    const manca = /does not exist|schema cache|function|PGRST20/i.test(m);
    el.innerHTML = html`<div class="card empty"><strong>${manca ? "Luce e gas non è ancora attivo sul database" : "Non riesco a leggere i dati"}</strong>
      <span>${manca ? "Manca app-19 su Supabase. Appena c'è, questa pagina funziona da sola." : m}</span></div>`.s;
  }

  function cartaDi(c) {
    const p = S.data.profilo || {};
    return {
      ragione: c.ragione || p.nome || "La tua azienda", piva: c.piva || "", indirizzo: c.indirizzo || p.zona || "",
      telefono: c.telefono || "", mail: c.mail || (S.data.account && S.data.account.mail) || "", sito: c.sito || "",
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
          <span>${c.ragione}${c.piva ? " · P. IVA " + c.piva : ""}${c.indirizzo ? " · " + c.indirizzo : ""}</span>
          <span>Proposta tramite <b>AncheCasa</b> · Costruiamo fiducia</span>
        </div>
      </div>`;
  }

  function consumi(r) {
    const c = [];
    if (r.consumo_luce) c.push(Math.round(r.consumo_luce).toLocaleString("it-IT") + " kWh");
    if (r.consumo_gas) c.push(Math.round(r.consumo_gas).toLocaleString("it-IT") + " Smc");
    return c.join(" · ") || "consumi non indicati";
  }
  function stima(o, cLuce, cGas) {
    const luce = o.tipo !== "gas" ? (cLuce || 0) * num(o.prezzo_luce) : 0;
    const gas = o.tipo !== "luce" ? (cGas || 0) * num(o.prezzo_gas) : 0;
    const quota = num(o.quota_mese) * 12 * (o.tipo === "duale" ? 2 : 1);
    return Math.max(0, luce + gas + quota - num(o.bonus));
  }
  function prossimoNumero(proposte) {
    const anno = new Date().getFullYear();
    const max = (proposte || []).reduce((m, p) => {
      const x = /AC-EN-(\d{4})-(\d{4})/.exec(p.numero || "");
      return x && Number(x[1]) === anno ? Math.max(m, Number(x[2])) : m;
    }, 0);
    return "AC-EN-" + anno + "-" + String(max + 1).padStart(4, "0");
  }

  /* ============================================================
     HOME
     ============================================================ */
  V.energia_home = {
    title: "Home",
    sub: "Luce e gas: richieste, proposte e contratti.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      Promise.all([D.richieste(), D.proposte(), D.accordo(), D.offerte()]).then(([rich, prop, acc, off]) => {
        const nuove = (rich || []).filter((r) => r.stato === "aperta" && !r.mia_proposta);
        const attesa = (prop || []).filter((p) => p.stato === "inviata");
        const scelte = (prop || []).filter((p) => p.stato === "accettata");
        const inizio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const attivati = (prop || []).filter((p) => p.stato === "attivata" && p.attivata_il && new Date(p.attivata_il) >= inizio).length + (DEMO ? 0 : 0);
        el.innerHTML = html`
          ${acc && !acc.confermato_il ? html`<div class="card en-banner"><div><h2>C'è un accordo da confermare</h2><p class="note">AncheCasa ha scritto la provvigione concordata con te. Leggila e confermala.</p></div><a class="btn-in" href="#/azienda/energia_accordo">Vai all'accordo</a></div>` : ""}
          ${!(off || []).some((o) => o.attiva !== false) ? html`<div class="card en-banner"><div><h2>Carica la prima offerta</h2><p class="note">Le proposte partono dal tuo listino.</p></div><a class="btn-in" href="#/azienda/offerte_energia">Le mie offerte</a></div>` : ""}
          <div class="en-kpis">
            <a class="kpi en-kpi" href="#/azienda/energia_richieste"><span><strong>${nuove.length}</strong><small>richieste nuove</small></span></a>
            <a class="kpi en-kpi" href="#/azienda/proposte_energia"><span><strong>${attesa.length}</strong><small>proposte in attesa</small></span></a>
            <a class="kpi en-kpi" href="#/azienda/energia_clienti"><span><strong>${scelte.length}</strong><small>clienti da contattare</small></span></a>
            <div class="kpi"><span><strong>${attivati}</strong><small>contratti attivati questo mese</small></span></div>
          </div>
          <p class="note en-numeri" data-numeri></p>
          <div class="card">
            <h2>Ultime richieste</h2>
            ${nuove.length ? html`<div class="en-lista">${nuove.slice(0, 5).map((r) => html`<a class="en-rich" href="#/azienda/energia_richieste">
              <span class="tag new">${TIPI[r.tipo]}</span><b>${r.comune || r.regione || "Italia"}</b><small>${consumi(r)}${r.spesa_mese ? " · spende " + eur(r.spesa_mese, 0) + "/mese" : ""} · ${giorniFa(r.creato)}</small></a>`)}</div>`
              : html`<p class="note">Nessuna richiesta nuova. Arrivano da Check Bollette sul Magazine e dalla dashboard dei privati.</p>`}
          </div>`.s;
        // 12.10.2026, app-22: i numeri del mese (servizi.js, AC.numeriMese).
        if (AC.numeriMese) AC.numeriMese(el.querySelector("[data-numeri]"), { ricevute: (rich || []).length, proposte: (prop || []).length, scelte: (prop || []).filter((p) => p.stato === "accettata" || p.stato === "attivata").length, chiusi: (prop || []).filter((p) => p.stato === "attivata").length }, "contratti attivati");
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     RICHIESTE
     ============================================================ */
  let daRichiesta = null;   // richiesta scelta per fare la proposta
  V.energia_richieste = {
    title: "Richieste",
    sub: "Clienti che chiedono un'offerta. Vedi consumi e zona; nome e telefono solo se il cliente sceglie la tua proposta.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      Promise.all([D.richieste(), D.accordo()]).then(([rich, acc]) => {
        const lista = rich || [];
        const ok = !!(acc && acc.confermato_il);
        const aperte = lista.filter((r) => r.stato === "aperta");
        const altre = lista.filter((r) => r.stato !== "aperta");
        const riga = (r) => html`<div class="en-rrow">
          <div class="en-rinfo">
            <div><span class="tag new">${TIPI[r.tipo]}</span> <b>${r.comune || "—"}${r.regione ? ", " + r.regione : ""}</b> <small>· ${r.cliente_tipo === "impresa" ? "Impresa" : "Privato"} · ${FONTE[r.fonte] || r.fonte} · ${giorniFa(r.creato)}</small></div>
            <small>${consumi(r)}${r.spesa_mese ? " · spende " + eur(r.spesa_mese, 0) + " al mese" : ""}${r.fornitore_attuale ? " · oggi con " + r.fornitore_attuale : ""}${r.nota ? " · «" + r.nota + "»" : ""}</small>
            <small>${r.proposte || 0} di 5 proposte arrivate${r.stato === "aperta" && !r.mia_proposta ? " · " + scade(r.creato) : ""}</small>
          </div>
          <div class="en-ract">${r.mia_proposta
            ? html`<span class="tag ${STATO_P[r.mia_stato] ? STATO_P[r.mia_stato][0] : "wait"}">${STATO_P[r.mia_stato] ? STATO_P[r.mia_stato][1] : "Proposta inviata"}</span>`
            : r.stato !== "aperta" ? html`<span class="tag paused">Chiusa</span>`
            : ok ? html`<button class="btn-in" type="button" data-proponi="${r.id}">Fai la proposta</button>`
            : html`<a class="btn-ghost" href="#/azienda/energia_accordo">Prima conferma l'accordo</a>`}</div>
        </div>`;
        el.innerHTML = html`
          ${ok ? "" : html`<div class="card en-banner"><div><h2>Per mandare proposte serve l'accordo</h2><p class="note">${acc ? "AncheCasa ti ha inviato la provvigione: leggila e confermala." : "AncheCasa ti scriverà qui la provvigione concordata. Appena la confermi puoi mandare proposte."}</p></div>${acc ? html`<a class="btn-in" href="#/azienda/energia_accordo">Vai all'accordo</a>` : ""}</div>`}
          <p class="note">La richiesta arriva a tutti i fornitori di luce e gas. Il cliente confronta le proposte e ne sceglie una: solo quel fornitore riceve nome, mail e telefono.</p>
          <div class="card"><h2>Aperte <span class="ra-n">${aperte.length}</span></h2>${aperte.length ? aperte.map(riga) : html`<p class="note">Nessuna richiesta aperta.</p>`}</div>
          ${altre.length ? html`<div class="card"><h2>Già scelte o chiuse</h2>${altre.map(riga)}</div>` : ""}`.s;
        el.querySelectorAll("[data-proponi]").forEach((b) => b.addEventListener("click", () => {
          daRichiesta = lista.find((r) => r.id === b.getAttribute("data-proponi")) || null;
          location.hash = "#/azienda/proposte_energia";
        }));
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     LE MIE OFFERTE (+ carta intestata)
     ============================================================ */
  V.offerte_energia = {
    title: "Le mie offerte",
    sub: "Il tuo listino luce e gas e la tua carta intestata.",
    render(el) {
      let modifica = null;
      function formOfferta(o) {
        o = o || { tipo: "luce", prezzo: "fisso", clienti: "tutti", durata_mesi: 12, attiva: true };
        const v = (x) => (x == null ? "" : String(x).replace(".", ","));
        return html`
          <form id="en-f-off" class="prefs wide en-grid">
            <label class="span2">Nome dell'offerta<input name="nome" required maxlength="80" value="${o.nome || ""}" placeholder="Es. Casa Sicura Luce 12"></label>
            <label>Fornitura<select name="tipo">${Object.keys(TIPI).map((k) => html`<option value="${k}"${o.tipo === k ? " selected" : ""}>${TIPI[k]}</option>`)}</select></label>
            <label>Clienti<select name="clienti">${Object.keys(CLIENTI).map((k) => html`<option value="${k}"${o.clienti === k ? " selected" : ""}>${CLIENTI[k]}</option>`)}</select></label>
            <label>Prezzo<select name="prezzo">${Object.keys(PREZZI).map((k) => html`<option value="${k}"${o.prezzo === k ? " selected" : ""}>${PREZZI[k]}</option>`)}</select></label>
            <label>Durata<select name="durata">${[12, 24, 36].map((k) => html`<option value="${k}"${Number(o.durata_mesi) === k ? " selected" : ""}>${k} mesi</option>`)}</select></label>
            <label data-per="luce">Energia €/kWh<input name="pLuce" inputmode="decimal" value="${v(o.prezzo_luce)}" placeholder="0,125"></label>
            <label data-per="gas">Gas €/Smc<input name="pGas" inputmode="decimal" value="${v(o.prezzo_gas)}" placeholder="0,52"></label>
            <label>Quota fissa €/mese<input name="quota" inputmode="decimal" value="${v(o.quota_mese)}" placeholder="9,90"></label>
            <label>Sconto benvenuto €<input name="bonus" inputmode="decimal" value="${v(o.bonus)}" placeholder="0"></label>
            <label class="span2">Vantaggi e condizioni<textarea name="note" maxlength="600" placeholder="Es. 100% energia verde certificata, nessun deposito cauzionale.">${o.note || ""}</textarea></label>
            <label class="check span2"><input type="checkbox" name="attiva"${o.attiva !== false ? " checked" : ""}> Offerta attiva, proponibile ai clienti</label>
            <div class="row-actions span2">
              <button class="btn-in" type="submit">${o.id ? "Salva le modifiche" : "Aggiungi al listino"}</button>
              ${o.id ? html`<button class="btn-ghost" type="button" data-annulla>Annulla</button>` : ""}
            </div>
          </form>`;
      }
      function disegna() {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        Promise.all([D.offerte(), D.carta()]).then(([off, carta]) => {
          const c = cartaDi(carta || {});
          const riga = (o) => {
            const prezzi = [];
            if (o.tipo !== "gas") prezzi.push(eur(num(o.prezzo_luce), 4) + "/kWh");
            if (o.tipo !== "luce") prezzi.push(eur(num(o.prezzo_gas), 4) + "/Smc");
            return html`<tr>
              <td><b>${o.nome}</b><br><small>${TIPI[o.tipo]} · ${CLIENTI[o.clienti]} · ${o.durata_mesi} mesi</small></td>
              <td>${prezzi.join(" · ")}<br><small>${PREZZI[o.prezzo]}${num(o.quota_mese) ? " · quota " + eur(num(o.quota_mese), 2) + "/mese" : ""}</small></td>
              <td>${o.attiva !== false ? html`<span class="tag ok">Attiva</span>` : html`<span class="tag paused">In pausa</span>`}</td>
              <td class="en-act"><button class="btn-mini" type="button" data-mod="${o.id}">Modifica</button> <button class="btn-mini" type="button" data-del="${o.id}">Elimina</button></td>
            </tr>`;
          };
          el.innerHTML = html`
            <div class="card">
              <h2>${modifica ? "Modifica offerta" : "Nuova offerta"}</h2>
              <p class="note">Prezzi della sola parte commerciale. Trasporto, oneri e imposte li stabilisce l'autorità e sono uguali per tutti.</p>
              ${formOfferta(modifica)}
            </div>
            <div class="card">
              <h2>Il tuo listino</h2>
              ${(off || []).length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>Offerta</th><th>Prezzi</th><th>Stato</th><th></th></tr></thead><tbody>${off.map(riga)}</tbody></table></div>`
                : html`<p class="note">Ancora nessuna offerta. Aggiungi la prima qui sopra.</p>`}
            </div>
            <div class="card">
              <h2>La tua carta intestata</h2>
              <p class="note">Questi dati compaiono su ogni proposta, con il marchio AncheCasa. Il logo lo carichi nel <a href="#/azienda/profilo">Profilo</a>${c.logo ? "" : html` <span class="tag wait">logo da caricare</span>`}.</p>
              <div class="en-carta-wrap">
                <form id="en-f-carta" class="prefs wide en-grid">
                  <label class="span2">Ragione sociale<input name="ragione" value="${(carta && carta.ragione) || ""}" placeholder="${(S.data.profilo && S.data.profilo.nome) || "Energia Esempio Srl"}"></label>
                  <label>Partita IVA<input name="piva" value="${(carta && carta.piva) || ""}" inputmode="numeric" maxlength="16"></label>
                  <label>Telefono<input name="telefono" value="${(carta && carta.telefono) || ""}"></label>
                  <label class="span2">Indirizzo sede<input name="indirizzo" value="${(carta && carta.indirizzo) || ""}"></label>
                  <label>Mail<input name="mail" type="email" value="${(carta && carta.mail) || ""}"></label>
                  <label>Sito<input name="sito" value="${(carta && carta.sito) || ""}"></label>
                  <div class="row-actions span2"><button class="btn-in" type="submit">Salva la carta intestata</button></div>
                </form>
                <div class="en-carta-mini">${cartaHtml(c, html`<p class="en-mini-t">Proposta di fornitura</p><div class="en-mini-l"></div><div class="en-mini-l s"></div><div class="en-mini-l"></div>`)}</div>
              </div>
            </div>`.s;
          const fo = el.querySelector("#en-f-off");
          const campi = () => { const t = fo.elements.tipo.value; fo.querySelector('[data-per="luce"]').hidden = t === "gas"; fo.querySelector('[data-per="gas"]').hidden = t === "luce"; };
          fo.elements.tipo.addEventListener("change", campi); campi();
          fo.addEventListener("submit", (e) => {
            e.preventDefault();
            const f = fo.elements;
            const o = {
              nome: f.nome.value.trim(), tipo: f.tipo.value, clienti: f.clienti.value, prezzo: f.prezzo.value, durata_mesi: Number(f.durata.value),
              prezzo_luce: f.tipo.value !== "gas" ? num(f.pLuce.value) : null, prezzo_gas: f.tipo.value !== "luce" ? num(f.pGas.value) : null,
              quota_mese: num(f.quota.value) || null, bonus: num(f.bonus.value) || null, note: f.note.value.trim(), attiva: f.attiva.checked, copertura: "italia"
            };
            if (modifica && modifica.id) o.id = modifica.id;
            if (!o.nome) return toast("Dai un nome all'offerta.", "error");
            if (o.tipo !== "gas" && !(o.prezzo_luce > 0)) return toast("Inserisci il prezzo dell'energia in €/kWh.", "error");
            if (o.tipo !== "luce" && !(o.prezzo_gas > 0)) return toast("Inserisci il prezzo del gas in €/Smc.", "error");
            D.salvaOfferta(o).then(() => { toast(modifica ? "Offerta aggiornata" : "Offerta aggiunta al listino"); modifica = null; disegna(); }, (e2) => toast("Non salvata: " + err(e2), "error"));
          });
          const ann = el.querySelector("[data-annulla]");
          if (ann) ann.addEventListener("click", () => { modifica = null; disegna(); });
          el.querySelectorAll("[data-mod]").forEach((b) => b.addEventListener("click", () => { modifica = (off || []).find((o) => o.id === b.getAttribute("data-mod")) || null; disegna(); }));
          el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
            if (b.dataset.conferma !== "1") { b.dataset.conferma = "1"; b.textContent = "Conferma"; return; }
            D.togliOfferta(b.getAttribute("data-del")).then(() => { toast("Offerta eliminata"); disegna(); }, (e2) => toast("Non eliminata: " + err(e2), "error"));
          }));
          el.querySelector("#en-f-carta").addEventListener("submit", (e) => {
            e.preventDefault();
            const f = e.target.elements;
            D.salvaCarta({ ragione: f.ragione.value.trim(), piva: f.piva.value.trim(), indirizzo: f.indirizzo.value.trim(), telefono: f.telefono.value.trim(), mail: f.mail.value.trim(), sito: f.sito.value.trim() })
              .then(() => { toast("Carta intestata salvata"); disegna(); }, (e2) => toast("Non salvata: " + err(e2), "error"));
          });
        }, (e) => nonPronto(el, e));
      }
      disegna();
    }
  };

  /* ============================================================
     PROPOSTE (su una richiesta o a un cliente tuo)
     ============================================================ */
  V.proposte_energia = {
    title: "Proposte",
    sub: "La proposta al cliente su carta AncheCasa con il tuo logo.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      Promise.all([D.offerte(), D.carta(), D.proposte(), D.accordo()]).then(([off, carta, prop, acc]) => {
        const attive = (off || []).filter((o) => o.attiva !== false);
        if (!(acc && acc.confermato_il)) {
          el.innerHTML = html`<div class="card"><h2>Prima l'accordo con AncheCasa</h2><p class="note">Le proposte si possono mandare dopo aver confermato la provvigione. ${acc ? "Te l'abbiamo già inviata." : "AncheCasa te la invia a breve."}</p>${acc ? html`<div class="row-actions"><a class="btn-in" href="#/azienda/energia_accordo">Vai all'accordo</a></div>` : ""}</div>`.s;
          return;
        }
        const r = daRichiesta;
        daRichiesta = null;
        const c = cartaDi(carta || {});
        const numero = prossimoNumero(prop);
        const elenco = html`<div class="card"><h2>Le tue proposte</h2>
          ${(prop || []).length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>N.</th><th>Data</th><th>Cliente</th><th class="num">Stima annua</th><th>Stato</th></tr></thead>
            <tbody>${prop.map((x) => html`<tr><td>${x.numero}</td><td>${dataIt(x.created_at)}</td><td>${x.cliente}</td><td class="num">${eur(x.stima_annua, 0)}</td><td><span class="tag ${(STATO_P[x.stato] || STATO_P.inviata)[0]}">${(STATO_P[x.stato] || STATO_P.inviata)[1]}</span></td></tr>`)}</tbody></table></div>`
            : html`<p class="note">Qui trovi le proposte che mandi.</p>`}</div>`;
        if (!attive.length) {
          el.innerHTML = html`<div class="card"><h2>Prima serve un'offerta</h2><p class="note">Le proposte partono dal tuo listino.</p><div class="row-actions"><a class="btn-in" href="#/azienda/offerte_energia">Vai a Le mie offerte</a></div></div>${elenco}`.s;
          return;
        }
        const adatte = r ? attive.filter((o) => r.tipo === "duale" ? o.tipo === "duale" : o.tipo === r.tipo || o.tipo === "duale") : attive;
        const scelte = adatte.length ? adatte : attive;
        el.innerHTML = html`
          ${r ? html`<div class="card en-banner"><div><h2>Proposta per la richiesta di ${r.comune || r.regione || "un cliente"}</h2>
            <p class="note">${TIPI[r.tipo]} · ${consumi(r)}${r.spesa_mese ? " · oggi spende " + eur(r.spesa_mese, 0) + " al mese" : ""}. Il cliente la vede dal link nella sua mail, accanto alle altre.</p></div></div>` : ""}
          <div class="en-two">
            <div class="card">
              <h2>${r ? "La tua proposta" : "Nuova proposta a un tuo cliente"}</h2>
              <form id="en-f-prop" class="prefs wide en-grid">
                <label class="span2">Offerta<select name="offerta">${scelte.map((o) => html`<option value="${o.id}">${o.nome} · ${TIPI[o.tipo]}</option>`)}</select></label>
                ${r ? "" : html`
                <label class="span2">Cliente (nome e cognome o ragione sociale)<input name="cliente" required maxlength="90"></label>
                <label class="span2">Indirizzo di fornitura<input name="indirizzo" maxlength="120"></label>
                <label>Codice fiscale / P. IVA<input name="cf" maxlength="16"></label>
                <label>Mail del cliente<input name="mail" type="email"></label>
                <label data-per="luce">POD<input name="pod" maxlength="16" placeholder="IT001E…"></label>
                <label data-per="gas">PDR<input name="pdr" maxlength="16"></label>`}
                <label data-per="luce">Consumo luce kWh/anno<input name="cLuce" inputmode="numeric" value="${r && r.consumo_luce ? Math.round(r.consumo_luce) : 2700}"></label>
                <label data-per="gas">Consumo gas Smc/anno<input name="cGas" inputmode="numeric" value="${r && r.consumo_gas ? Math.round(r.consumo_gas) : 1400}"></label>
                <label class="span2">Nota per il cliente<textarea name="nota" maxlength="400" placeholder="Es. Prezzo bloccato 12 mesi, attivazione in 30 giorni, nessun costo di cambio."></textarea></label>
                <div class="row-actions span2">
                  <button class="btn-in" type="submit">${r ? "Manda la proposta" : "Salva e scarica il PDF"}</button>
                  ${r ? html`<button class="btn-ghost" type="button" id="en-solo-pdf">Scarica il PDF</button>` : ""}
                </div>
              </form>
            </div>
            <div class="card en-prev-card"><h2>Anteprima sulla carta intestata</h2><div id="en-prev"></div></div>
          </div>
          ${elenco}`.s;
        const f = el.querySelector("#en-f-prop");
        const prev = el.querySelector("#en-prev");
        const dati = () => {
          const e = f.elements;
          const o = scelte.find((x) => x.id === e.offerta.value) || scelte[0];
          return {
            o: o, numero: numero,
            cliente: r ? "Cliente AncheCasa" : e.cliente.value.trim(),
            indirizzo: r ? [r.comune, r.regione].filter(Boolean).join(", ") : e.indirizzo.value.trim(),
            cf: r ? "" : e.cf.value.trim(), mail: r ? "" : e.mail.value.trim(),
            pod: r ? "" : e.pod.value.trim(), pdr: r ? "" : e.pdr.value.trim(),
            cLuce: num(e.cLuce.value), cGas: num(e.cGas.value), nota: e.nota.value.trim()
          };
        };
        const aggiorna = () => {
          const x = dati();
          f.querySelectorAll('[data-per="luce"]').forEach((l) => (l.hidden = x.o.tipo === "gas"));
          f.querySelectorAll('[data-per="gas"]').forEach((l) => (l.hidden = x.o.tipo === "luce"));
          const righe = [];
          if (x.o.tipo !== "gas") righe.push(["Energia elettrica", eur(num(x.o.prezzo_luce), 4) + " / kWh"]);
          if (x.o.tipo !== "luce") righe.push(["Gas naturale", eur(num(x.o.prezzo_gas), 4) + " / Smc"]);
          if (num(x.o.quota_mese)) righe.push(["Quota fissa", eur(num(x.o.quota_mese), 2) + " / mese"]);
          righe.push(["Prezzo", PREZZI[x.o.prezzo]], ["Durata", x.o.durata_mesi + " mesi"]);
          prev.innerHTML = cartaHtml(c, html`
            <p class="en-p-meta">Proposta n. ${x.numero} · ${oggi()} · valida 30 giorni</p>
            <p class="en-p-to">Spett.le<br><b>${x.cliente || "Nome del cliente"}</b><br>${x.indirizzo || "Indirizzo di fornitura"}</p>
            <h3 class="en-p-title">Proposta di fornitura ${TIPI[x.o.tipo].toLowerCase()}</h3>
            <p class="en-p-offer">${x.o.nome}</p>
            <table class="en-p-tab">${righe.map((rr) => html`<tr><td>${rr[0]}</td><td>${rr[1]}</td></tr>`)}</table>
            <div class="en-p-stima"><span>Stima annua della parte commerciale</span><b>${eur(stima(x.o, x.cLuce, x.cGas), 0)}</b></div>
            ${x.nota ? html`<p class="en-p-note">${x.nota}</p>` : ""}`).s;
        };
        f.addEventListener("input", aggiorna); f.addEventListener("change", aggiorna); aggiorna();
        const soloPdf = el.querySelector("#en-solo-pdf");
        if (soloPdf) soloPdf.addEventListener("click", () => creaPdf(dati(), c).catch((e2) => toast("PDF non creato: " + err(e2), "error")));
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          const x = dati();
          if (!x.cliente) return toast("Inserisci il nome del cliente.", "error");
          const btn = f.querySelector("button[type=submit]");
          btn.disabled = true;
          const riga = {
            offerta_id: x.o.id, numero: x.numero, cliente: x.cliente, indirizzo: x.indirizzo, cf: x.cf, mail: x.mail, pod: x.pod, pdr: x.pdr,
            consumo_luce: x.o.tipo !== "gas" ? x.cLuce : null, consumo_gas: x.o.tipo !== "luce" ? x.cGas : null,
            stima_annua: Math.round(stima(x.o, x.cLuce, x.cGas)), nota: x.nota, richiesta_id: r ? r.id : null
          };
          D.nuovaProposta(riga).then(() => {
            toast(r ? "Proposta mandata: il cliente la riceve per mail." : "Proposta " + x.numero + " salvata");
            const dopo = () => V.proposte_energia.render(el);
            if (!r) creaPdf(x, c).then(dopo, dopo); else dopo();
          }, (e2) => { btn.disabled = false; toast("Proposta non mandata: " + err(e2), "error"); });
        });
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     I MIEI CLIENTI
     ============================================================ */
  V.energia_clienti = {
    title: "I miei clienti",
    sub: "Chi ha scelto la tua proposta: contattalo, mandagli il contratto, segna quando è attivato.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      Promise.all([D.richieste(), D.proposte()]).then(([rich, prop]) => {
        const scelti = (rich || []).filter((r) => r.scelta_mia);
        const diretti = (prop || []).filter((p) => !p.richiesta_id && (p.stato === "accettata" || p.stato === "attivata"));
        const pDi = (r) => (prop || []).find((p) => p.id === r.mia_proposta) || {};
        el.innerHTML = html`
          <div class="card">
            <h2>Dalle richieste AncheCasa</h2>
            ${scelti.length ? scelti.map((r) => { const p = pDi(r); const att = (p.stato || r.mia_stato) === "attivata"; return html`<div class="en-rrow">
              <div class="en-rinfo"><div><b>${r.nome}</b> <small>· ${r.comune || ""}${r.regione ? ", " + r.regione : ""} · ${TIPI[r.tipo]} · proposta ${p.numero || ""}</small></div>
                <small><a href="mailto:${r.mail}">${r.mail}</a>${r.telefono ? html` · <a href="tel:${r.telefono.replace(/\s/g, "")}">${r.telefono}</a>` : ""}</small>
                <small>${consumi(r)} · stima ${eur(p.stima_annua, 0)}/anno</small></div>
              <div class="en-ract">${att ? html`<span class="tag ok">Contratto attivato</span>` : html`<button class="btn-in" type="button" data-attiva="${r.mia_proposta}">Contratto attivato</button>`}</div>
            </div>`; }) : html`<p class="note">Quando un cliente sceglie la tua proposta, qui trovi nome, mail e telefono.</p>`}
          </div>
          ${diretti.length ? html`<div class="card"><h2>Tuoi clienti diretti</h2>${diretti.map((p) => html`<div class="en-rrow"><div class="en-rinfo"><b>${p.cliente}</b><small>${p.numero} · ${dataIt(p.created_at)}</small></div></div>`)}</div>` : ""}`.s;
        el.querySelectorAll("[data-attiva]").forEach((b) => b.addEventListener("click", () => {
          if (b.dataset.conferma !== "1") { b.dataset.conferma = "1"; b.textContent = "Confermi? Il contratto è attivo"; return; }
          D.attivato(b.getAttribute("data-attiva")).then(() => { toast("Contratto attivato: AncheCasa lo vede per la provvigione."); V.energia_clienti.render(el); }, (e2) => toast("Non salvato: " + err(e2), "error"));
        }));
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     IL MIO ACCORDO
     ============================================================ */
  V.energia_accordo = {
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
            : html`<p class="note">Leggi e conferma: da questo momento vale per ogni contratto attivato tramite AncheCasa, e puoi mandare le tue proposte ai clienti.</p><div class="row-actions"><button class="btn-in" type="button" id="en-conferma">Confermo l'accordo</button></div>`}
        </div>`.s;
        const b = el.querySelector("#en-conferma");
        if (b) b.addEventListener("click", () => D.confermaAccordo().then(() => { toast("Accordo confermato"); V.energia_accordo.render(el); }, (e2) => toast("Non confermato: " + err(e2), "error")));
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     PDF su carta intestata (09.10.2026)
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
  function creaPdf(x, c) {
    return caricaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
      .then(() => Promise.all([immagine("img/carta-logo-bianco.png"), immagine(c.logo)]))
      .then(([logoAc, logoAz]) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const NAVY = [22, 48, 77], ORANGE = [229, 107, 16], INK = [36, 56, 76], MUTED = [102, 117, 138];
        const s = stima(x.o, x.cLuce, x.cGas);
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
        doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text("DA", 14, y); doc.text("SPETT.LE", 112, y);
        doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...INK);
        doc.text(c.ragione, 14, y + 6); doc.text(x.cliente, 112, y + 6);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        const da = [c.piva ? "P. IVA " + c.piva : "", c.indirizzo, c.telefono, c.mail, c.sito].filter(Boolean);
        const a = [x.indirizzo, x.cf ? "CF / P. IVA " + x.cf : "", x.mail, x.pod ? "POD " + x.pod : "", x.pdr ? "PDR " + x.pdr : ""].filter(Boolean);
        da.forEach((t, i) => doc.text(t, 14, y + 11 + i * 4.6));
        a.forEach((t, i) => doc.text(doc.splitTextToSize(t, 84)[0], 112, y + 11 + i * 4.6));
        y += 14 + Math.max(da.length, a.length) * 4.6 + 6;
        doc.setFont("times", "bold"); doc.setFontSize(21); doc.setTextColor(...NAVY);
        doc.text("Proposta di fornitura " + TIPI[x.o.tipo].toLowerCase(), 14, y); y += 7;
        doc.setFont("times", "italic"); doc.setFontSize(13); doc.setTextColor(...ORANGE);
        doc.text(x.o.nome, 14, y); y += 6;
        if (x.nota) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...INK); const l = doc.splitTextToSize(x.nota, 182); doc.text(l, 14, y + 3); y += l.length * 4.8 + 3; }
        y += 4;
        const righe = [];
        if (x.o.tipo !== "gas") righe.push(["Energia elettrica", eur(num(x.o.prezzo_luce), 4) + " / kWh"]);
        if (x.o.tipo !== "luce") righe.push(["Gas naturale", eur(num(x.o.prezzo_gas), 4) + " / Smc"]);
        if (num(x.o.quota_mese)) righe.push(["Quota fissa", eur(num(x.o.quota_mese), 2) + " / mese" + (x.o.tipo === "duale" ? " per fornitura" : "")]);
        righe.push(["Tipo di prezzo", PREZZI[x.o.prezzo]], ["Durata", x.o.durata_mesi + " mesi"], ["Per", CLIENTI[x.o.clienti]]);
        if (num(x.o.bonus)) righe.push(["Sconto di benvenuto", eur(num(x.o.bonus), 2)]);
        doc.setDrawColor(...NAVY); doc.setLineWidth(0.6); doc.line(14, y, 196, y); y += 6;
        righe.forEach((r, i) => {
          if (i % 2 === 0) { doc.setFillColor(243, 246, 251); doc.rect(14, y - 4.4, 182, 7, "F"); }
          doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...MUTED); doc.text(r[0], 17, y);
          doc.setFont("helvetica", "bold"); doc.setTextColor(...INK); doc.text(r[1], 193, y, { align: "right" });
          y += 7;
        });
        y += 4;
        doc.setFillColor(255, 241, 228); doc.roundedRect(14, y, 182, 26, 2.5, 2.5, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(180, 82, 11); doc.text("STIMA ANNUA DELLA PARTE COMMERCIALE", 19, y + 7);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...INK);
        const cons = [];
        if (x.o.tipo !== "gas") cons.push(Math.round(x.cLuce).toLocaleString("it-IT") + " kWh");
        if (x.o.tipo !== "luce") cons.push(Math.round(x.cGas).toLocaleString("it-IT") + " Smc");
        doc.text("Su un consumo di " + cons.join(" e ") + " all'anno", 19, y + 13);
        doc.setFontSize(7.5); doc.setTextColor(...MUTED);
        doc.text(doc.splitTextToSize("Materia prima e quote fisse dell'offerta. Trasporto, oneri di sistema e imposte sono fissati dall'autorità ed esclusi.", 120), 19, y + 18);
        doc.setFont("times", "bold"); doc.setFontSize(24); doc.setTextColor(...NAVY); doc.text(eur(s, 0), 191, y + 17, { align: "right" });
        y += 34;
        if (x.o.note) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text("Vantaggi e condizioni", 14, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK); const l = doc.splitTextToSize(x.o.note, 182); doc.text(l, 14, y); y += l.length * 4.6 + 4;
        }
        const yf = Math.max(y + 10, 236);
        doc.setDrawColor(190, 200, 212); doc.setLineWidth(0.3); doc.line(14, yf + 12, 92, yf + 12); doc.line(118, yf + 12, 196, yf + 12);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        doc.text("Per " + c.ragione, 14, yf + 17); doc.text("Per accettazione, il cliente", 118, yf + 17);
        doc.setFillColor(...ORANGE); doc.rect(14, 280, 182, 0.5, "F");
        doc.setFontSize(7.5); doc.setTextColor(...MUTED);
        doc.text(c.ragione + (c.piva ? " · P. IVA " + c.piva : "") + (c.indirizzo ? " · " + c.indirizzo : ""), 14, 285);
        doc.text("Proposta presentata tramite AncheCasa · www.anchecasa.it", 14, 289);
        doc.setFont("helvetica", "bold"); doc.setTextColor(...ORANGE); doc.text("Costruiamo fiducia", 196, 289, { align: "right" });
        doc.save("Proposta-" + x.numero + "-" + x.cliente.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".pdf");
      });
  }
})();
