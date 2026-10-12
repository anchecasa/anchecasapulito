/* ADMIN · Fornitori (12.10.2026, decisioni di Nando, PROGETTO-DASHBOARD.md, app-19).
   Chi sono i fornitori, l'accordo di ognuno (la provvigione la decide l'admin, la invia, il fornitore la conferma:
   solo dopo può mandare proposte), e il giro luce e gas: richieste, proposte, scelte, contratti attivati.
   Anteprima (?demo=admin): dati di esempio, niente sul database e nessuna mail. */
(function () {
  const AC = window.AC;
  const { html, icon, toast } = AC.ui;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const reale = () => !DEMO && !!window.acDb;

  const FAMIGLIA = { azienda_luce_gas: "Energia · luce e gas", azienda_telefonia: "Telefono e internet", azienda_finanza: "Finanza e assicurazioni", azienda_traslochi: "Traslochi", azienda_facchinaggio: "Facchinaggio", azienda_pulizie: "Pulizie", azienda_manutenzione_stabili: "Giardinaggio e manutenzione", azienda_materiali_edili: "Materiali edili", azienda_noleggio_attrezzature: "Noleggio", azienda_fornitori_it: "Informatica e promozione" };
  const STATO_R = { aperta: ["sw-in", "Aperta"], scelta: ["sw-ok", "Scelta"], chiusa: ["sw-off", "Contratto attivato"] };
  const eur = (n) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const dataIt = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const err = (e) => (e && e.message) || String(e || "errore");

  const ESEMPIO = {
    fornitori: [
      { id: "f1", nome: "Energia Esempio Srl", mail: "offerte@energiaesempio.it", tipo_azienda: "azienda_luce_gas", verifica: "verificato", creato: "2026-10-12", accordo_tipo: "fisso", accordo_valore: 40, accordo_su: "per ogni contratto attivato", accordo_note: "", accordo_scritto: "2026-10-12", accordo_confermato: null, offerte: 2, proposte: 2, scelte: 1, attivati: 0 },
      { id: "f3", nome: "Linea Sud Telecomunicazioni Srl", mail: "offerte@lineasud.it", tipo_azienda: "azienda_telefonia", verifica: "verificato", creato: "2026-10-12", accordo_tipo: "fisso", accordo_valore: 30, accordo_su: "per ogni contratto attivato", accordo_note: "", accordo_scritto: "2026-10-12", accordo_confermato: "2026-10-12", offerte: 2, proposte: 2, scelte: 1, attivati: 0 },
      { id: "f4", nome: "Credito Casa Mediazioni Srl", mail: "info@creditocasa.it", tipo_azienda: "azienda_finanza", verifica: "verificato", creato: "2026-10-12", accordo_tipo: null, offerte: 2, proposte: 1, scelte: 1, attivati: 0 },
      { id: "f2", nome: "Luce Sud Spa", mail: "commerciale@lucesud.it", tipo_azienda: "azienda_luce_gas", verifica: "verificato", creato: "2026-10-12", accordo_tipo: null, offerte: 0, proposte: 0, scelte: 0, attivati: 0 }
    ],
    richieste: [
      { id: "r1", creato: new Date().toISOString(), fonte: "magazine", tipo: "duale", regione: "Campania", comune: "Caserta", nome: "Laura Bianchi", stato: "aperta", n: 1 },
      { id: "r3", creato: new Date(Date.now() - 3 * 86400000).toISOString(), fonte: "magazine", tipo: "gas", regione: "Puglia", comune: "Bari", nome: "Marta Riva", stato: "scelta", n: 2 }
    ]
  };

  const VERIFICHE_ESEMPIO = [
    { categoria: "Luce e gas", cliente: "Marta Riva", mail: "marta.riva@esempio.it", fornitore: "Energia Esempio Srl", scelta_il: new Date(Date.now() - 34 * 86400000).toISOString(), chiesto_il: new Date(Date.now() - 4 * 86400000).toISOString(), cliente_firmato: true, risposta_il: new Date(Date.now() - 3 * 86400000).toISOString(), attivato: false },
    { categoria: "Telefono e internet", cliente: "Giulia Conte", mail: "giulia.conte@esempio.it", fornitore: "Linea Sud Telecomunicazioni Srl", scelta_il: new Date(Date.now() - 40 * 86400000).toISOString(), chiesto_il: new Date(Date.now() - 10 * 86400000).toISOString(), cliente_firmato: true, risposta_il: new Date(Date.now() - 9 * 86400000).toISOString(), attivato: true },
    { categoria: "Finanza e assicurazioni", cliente: "Paolo Esposito", mail: "paolo.esposito@esempio.it", fornitore: "Credito Casa Mediazioni Srl", scelta_il: new Date(Date.now() - 12 * 86400000).toISOString(), chiesto_il: null, cliente_firmato: null, risposta_il: null, attivato: false }
  ];

  function carica() {
    if (!reale()) return Promise.all([AC.servizi ? AC.servizi.richiesteAdmin() : [], AC.preventivi ? AC.preventivi.richiesteAdmin() : []]).then(([sv, pr]) => Object.assign(JSON.parse(JSON.stringify(ESEMPIO)), { servizi: sv, prev: pr, verifiche: VERIFICHE_ESEMPIO }));
    const db = window.acDb;
    // 12.10.2026, app-20: anche le richieste di telefonia e finanza (se app-20 non c'è ancora, la sezione resta vuota).
    const servizi = AC.servizi ? AC.servizi.richiesteAdmin().catch(() => []) : Promise.resolve([]);
    // 12.10.2026, app-21: richieste di preventivo (materiali, noleggio, casa).
    const prev = AC.preventivi ? AC.preventivi.richiesteAdmin().catch(() => []) : Promise.resolve([]);
    // 12.10.2026, app-22: verifica dei contratti (la risposta del cliente dopo 30 giorni).
    const verifiche = db.rpc("fornitori_verifiche_admin").then((x) => (x && !x.error ? x.data || [] : []), () => []);
    return Promise.all([
      db.rpc("fornitori_per_admin"),
      db.from("energia_richieste").select("id, creato, fonte, tipo, regione, comune, nome, stato").order("creato", { ascending: false }).limit(60),
      db.from("energia_proposte").select("richiesta_id").not("richiesta_id", "is", null),
      servizi,
      prev,
      verifiche
    ]).then(([f, r, p, sv, pr, vf]) => {
      if (f.error) throw f.error;
      const conta = {};
      (p.data || []).forEach((x) => { conta[x.richiesta_id] = (conta[x.richiesta_id] || 0) + 1; });
      return { fornitori: f.data || [], richieste: (r.data || []).map((x) => Object.assign(x, { n: conta[x.id] || 0 })), servizi: sv || [], prev: pr || [], verifiche: vf || [] };
    });
  }

  function statoAccordo(f) {
    if (!f.accordo_tipo) return html`<span class="sw-stato sw-off">Da scrivere</span>`;
    if (!f.accordo_confermato) return html`<span class="sw-stato sw-in">Inviato, da confermare</span>`;
    return html`<span class="sw-stato sw-ok">Confermato il ${dataIt(f.accordo_confermato)}</span>`;
  }

  let aperto = "";
  V["fornitori-admin"] = {
    title: "Fornitori",
    sub: "Chi sono, l'accordo con ognuno, e il giro delle offerte: luce e gas, telefono e internet, finanza.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      carica().then((d) => {
        const en = d.fornitori.filter((f) => f.tipo_azienda === "azienda_luce_gas");
        const attivati = d.fornitori.reduce((n, f) => n + (f.attivati || 0), 0);
        const aperte = d.richieste.filter((r) => r.stato === "aperta").length + (d.servizi || []).filter((r) => r.stato === "aperta").length + (d.prev || []).filter((r) => r.stato === "aperta").length;
        el.innerHTML = html`
          ${DEMO ? html`<p class="note">Anteprima: dati di esempio, niente va sul database e nessuna mail parte.</p>` : ""}
          <div class="kpis ra-kpi">
            <div class="kpi"><span class="ico navy">${icon("building", 18)}</span><span><strong>${d.fornitori.length}</strong><small>fornitori iscritti (${en.length} luce e gas, ${d.fornitori.filter((f) => f.tipo_azienda === "azienda_telefonia").length} telefonia, ${d.fornitori.filter((f) => f.tipo_azienda === "azienda_finanza").length} finanza)</small></span></div>
            <div class="kpi"><span class="ico orange">${icon("doc", 18)}</span><span><strong>${d.fornitori.filter((f) => f.accordo_tipo && !f.accordo_confermato).length}</strong><small>accordi da confermare</small></span></div>
            <div class="kpi"><span class="ico navy">${icon("send", 18)}</span><span><strong>${aperte}</strong><small>richieste aperte</small></span></div>
            <div class="kpi"><span class="ico orange">${icon("star", 18)}</span><span><strong>${attivati}</strong><small>contratti attivati</small></span></div>
          </div>
          <section class="card">
            <h2>I fornitori</h2>
            <p class="note">La provvigione la decidi tu e la invii. Il fornitore la conferma dalla sua dashboard: solo dopo può mandare proposte. Se la cambi, deve confermarla di nuovo.</p>
            ${d.fornitori.length ? d.fornitori.map((f) => html`<div class="fo-riga">
              <div class="fo-testa">
                <div class="ra-chi"><b>${f.nome}</b><small>${FAMIGLIA[f.tipo_azienda] || f.tipo_azienda} · ${f.mail || ""}</small></div>
                <div class="fo-num"><small>${f.offerte} offerte · ${f.proposte} proposte · ${f.scelte} scelte · ${f.attivati} contratti</small></div>
                <div class="fo-stato">${statoAccordo(f)}</div>
                <button type="button" class="btn-ghost ra-btn" data-apri="${f.id}">${aperto === f.id ? "Chiudi" : f.accordo_tipo ? "Cambia accordo" : "Scrivi l'accordo"}</button>
              </div>
              ${aperto === f.id ? html`<form class="fo-form" data-form="${f.id}">
                <label>Tipo<select name="tipo"><option value="fisso"${f.accordo_tipo !== "percentuale" ? " selected" : ""}>Cifra fissa (€)</option><option value="percentuale"${f.accordo_tipo === "percentuale" ? " selected" : ""}>Percentuale (%)</option></select></label>
                <label>Quanto<input name="valore" type="number" min="0" step="0.01" value="${f.accordo_valore != null ? f.accordo_valore : ""}" required></label>
                <label class="fo-largo">Su cosa<input name="su_cosa" maxlength="120" value="${f.accordo_su || "per ogni contratto attivato"}"></label>
                <label class="fo-tutto">Note (le legge anche il fornitore)<input name="note" maxlength="500" value="${f.accordo_note || ""}" placeholder="Es. concordato al telefono il 12.10.2026"></label>
                <div class="fo-tutto iv-piede"><span class="note">Con «Salva e invia» il fornitore riceve una mail e trova l'accordo nella sua dashboard.</span><button type="submit" class="btn-in">Salva e invia</button></div>
              </form>` : ""}
            </div>`) : html`<p class="note">Nessun fornitore ancora. Lo inviti da Inviti, categoria «Fornitori di luce, gas e servizi energetici», «Fornitori di telefonia e internet» o «Banche, mediatori creditizi e assicurazioni».</p>`}
          </section>
          ${(() => {
            const vf = d.verifiche || [];
            const daControllare = vf.filter((v) => v.cliente_firmato === true && !v.attivato);
            return html`<section class="card iv-card">
            <h2>Contratti da verificare ${daControllare.length ? html`<span class="sw-stato sw-in">${daControllare.length} da controllare</span>` : ""}</h2>
            <p class="note">30 giorni dopo la scelta AncheCasa chiede al cliente «Hai firmato?». Se il cliente dice sì e il fornitore non ha segnato il contratto, la provvigione è da chiedere.</p>
            ${vf.length ? html`<table class="mini-table"><thead><tr><th>Cosa</th><th>Cliente</th><th>Fornitore</th><th>Scelto il</th><th>Il cliente dice</th><th>Il fornitore ha segnato</th><th></th></tr></thead>
              <tbody>${vf.map((v) => html`<tr><td>${v.categoria}</td><td>${v.cliente}<br><small>${v.mail}</small></td><td>${v.fornitore}</td><td>${dataIt(v.scelta_il)}</td>
                <td>${v.cliente_firmato === true ? "Ho firmato" : v.cliente_firmato === false ? "Non ho firmato" : v.chiesto_il ? "Non ha ancora risposto" : "Domanda dopo 30 giorni"}</td>
                <td>${v.attivato ? "Contratto attivato" : "Non ancora"}</td>
                <td>${v.cliente_firmato === true && !v.attivato ? html`<span class="sw-stato sw-in">Da controllare</span>` : v.cliente_firmato === true && v.attivato ? html`<span class="sw-stato sw-ok">Tutto a posto</span>` : ""}</td></tr>`)}</tbody></table>`
              : html`<p class="note">Ancora nessuna scelta da verificare.</p>`}
          </section>`;
          })()}
          <section class="card iv-card">
            <h2>Richieste luce e gas</h2>
            <p class="note">Arrivano a tutti i fornitori di energia, senza nome. Il cliente sceglie una proposta e solo quel fornitore riceve i contatti.</p>
            ${d.richieste.length ? html`<table class="mini-table"><thead><tr><th>Quando</th><th>Cliente</th><th>Dove</th><th>Cosa</th><th>Da</th><th>Proposte</th><th>Stato</th></tr></thead>
              <tbody>${d.richieste.map((r) => html`<tr><td>${dataIt(r.creato)}</td><td>${r.nome}</td><td>${r.comune || ""}${r.regione ? ", " + r.regione : ""}</td><td>${r.tipo}</td><td>${r.fonte === "magazine" ? "Check Bollette" : r.fonte === "rete" ? "Commerciale" : "Dashboard"}</td><td>${r.n}</td>
                <td><span class="sw-stato ${(STATO_R[r.stato] || STATO_R.aperta)[0]}">${(STATO_R[r.stato] || STATO_R.aperta)[1]}</span></td></tr>`)}</tbody></table>`
              : html`<p class="note">Ancora nessuna richiesta.</p>`}
          </section>
          <section class="card iv-card">
            <h2>Richieste telefono, internet e finanza</h2>
            <p class="note">Stesso giro: arrivano a tutti i fornitori della categoria, senza nome. Da «Commerciale», la vendita va a chi l'ha fatta quando il contratto si attiva.</p>
            ${(d.servizi || []).length ? html`<table class="mini-table"><thead><tr><th>Quando</th><th>Cliente</th><th>Dove</th><th>Cosa</th><th>Da</th><th>Proposte</th><th>Stato</th></tr></thead>
              <tbody>${d.servizi.map((r) => html`<tr><td>${dataIt(r.creato)}</td><td>${r.nome}${r.cliente_tipo === "impresa" ? " (impresa)" : ""}</td><td>${r.comune || ""}${r.regione ? ", " + r.regione : ""}</td><td>${r.categoria === "telefonia" ? "Telefono" : "Finanza"} · ${AC.servizi ? AC.servizi.nomeTipo(r.categoria, r.tipo) : r.tipo}</td><td>${r.fonte === "rete" ? "Commerciale" : r.fonte === "magazine" ? "Magazine" : "Dashboard"}</td><td>${r.n}</td>
                <td><span class="sw-stato ${(STATO_R[r.stato] || STATO_R.aperta)[0]}">${(STATO_R[r.stato] || STATO_R.aperta)[1]}</span></td></tr>`)}</tbody></table>`
              : html`<p class="note">Ancora nessuna richiesta.</p>`}
          </section>
          <section class="card iv-card">
            <h2>Richieste di preventivo: materiali, noleggio, casa</h2>
            <p class="note">Arrivano ai fornitori che coprono la zona, dal più vicino. Niente provvigione: il lavoro si chiude tra cliente e fornitore.</p>
            ${(d.prev || []).length ? html`<table class="mini-table"><thead><tr><th>Quando</th><th>Cliente</th><th>Dove</th><th>Cosa</th><th>Da</th><th>Preventivi</th><th>Stato</th></tr></thead>
              <tbody>${d.prev.map((r) => html`<tr><td>${dataIt(r.creato)}</td><td>${r.nome}${r.cliente_tipo === "impresa" ? " (impresa)" : ""}</td><td>${AC.preventivi.dove(r)}</td><td>${{ materiali: "Materiali", noleggio: "Noleggio", casa: "Casa" }[r.categoria] || r.categoria} · ${AC.preventivi.cosa(r)}</td><td>${r.fonte === "rete" ? "Commerciale" : "Dashboard"}</td><td>${r.n}</td>
                <td><span class="sw-stato ${(STATO_R[r.stato] || STATO_R.aperta)[0]}">${(STATO_R[r.stato] || STATO_R.aperta)[1]}</span></td></tr>`)}</tbody></table>`
              : html`<p class="note">Ancora nessuna richiesta.</p>`}
          </section>`.s;
        el.querySelectorAll("[data-apri]").forEach((b) => b.addEventListener("click", () => { const id = b.getAttribute("data-apri"); aperto = aperto === id ? "" : id; V["fornitori-admin"].render(el); }));
        el.querySelectorAll("[data-form]").forEach((fm) => fm.addEventListener("submit", (e) => {
          e.preventDefault();
          const id = fm.getAttribute("data-form");
          const riga = { azienda_id: id, tipo: fm.tipo.value, valore: Number(fm.valore.value), su_cosa: fm.su_cosa.value.trim() || "per ogni contratto attivato", note: fm.note.value.trim() };
          if (!(riga.valore >= 0)) return toast("Scrivi la provvigione.", "error");
          const btn = fm.querySelector("button[type=submit]"); btn.disabled = true;
          if (!reale()) {
            const f = ESEMPIO.fornitori.find((x) => x.id === id);
            Object.assign(f, { accordo_tipo: riga.tipo, accordo_valore: riga.valore, accordo_su: riga.su_cosa, accordo_note: riga.note, accordo_confermato: null });
            aperto = ""; toast("Anteprima: accordo salvato, nessuna mail partita."); V["fornitori-admin"].render(el); return;
          }
          window.acDb.auth.getSession().then((s) => {
            riga.scritto_da = s.data && s.data.session ? s.data.session.user.id : null;
            return window.acDb.from("fornitori_accordi").upsert(riga, { onConflict: "azienda_id" });
          }).then((r) => {
            if (r.error) throw r.error;
            // 12.10.2026, app-20: per telefonia e finanza la mail la manda servizi-avvisa (link alla pagina giusta).
            const f0 = d.fornitori.find((x) => x.id === id) || {};
            const fn = f0.tipo_azienda === "azienda_telefonia" || f0.tipo_azienda === "azienda_finanza" ? "servizi-avvisa" : "energia-avvisa";
            return window.acDb.functions.invoke(fn, { body: { evento: "accordo", azienda: id } });
          }).then((r) => {
            const e2 = r && (r.error || (r.data && r.data.error));
            aperto = "";
            toast(e2 ? "Accordo salvato, ma la mail non è partita: " + err(e2) : "Accordo salvato e inviato.", e2 ? "error" : undefined);
            V["fornitori-admin"].render(el);
          }).catch((e2) => { btn.disabled = false; toast("Non salvato: " + err(e2), "error"); });
        }));
      }, (e) => {
        el.innerHTML = html`<div class="card empty"><strong>Non riesco a leggere i fornitori</strong><span>${/function|does not exist|schema cache/i.test(err(e)) ? "Manca app-19 su Supabase." : err(e)}</span></div>`.s;
      });
    }
  };
})();
