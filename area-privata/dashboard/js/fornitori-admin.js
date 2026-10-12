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

  const FAMIGLIA = { azienda_luce_gas: "Energia · luce e gas", azienda_materiali_edili: "Materiali edili", azienda_noleggio_attrezzature: "Noleggio", azienda_fornitori_it: "Informatica e promozione" };
  const STATO_R = { aperta: ["sw-in", "Aperta"], scelta: ["sw-ok", "Scelta"], chiusa: ["sw-off", "Contratto attivato"] };
  const eur = (n) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const dataIt = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const err = (e) => (e && e.message) || String(e || "errore");

  const ESEMPIO = {
    fornitori: [
      { id: "f1", nome: "Energia Esempio Srl", mail: "offerte@energiaesempio.it", tipo_azienda: "azienda_luce_gas", verifica: "verificato", creato: "2026-10-12", accordo_tipo: "fisso", accordo_valore: 40, accordo_su: "per ogni contratto attivato", accordo_note: "", accordo_scritto: "2026-10-12", accordo_confermato: null, offerte: 2, proposte: 2, scelte: 1, attivati: 0 },
      { id: "f2", nome: "Luce Sud Spa", mail: "commerciale@lucesud.it", tipo_azienda: "azienda_luce_gas", verifica: "verificato", creato: "2026-10-12", accordo_tipo: null, offerte: 0, proposte: 0, scelte: 0, attivati: 0 }
    ],
    richieste: [
      { id: "r1", creato: new Date().toISOString(), fonte: "magazine", tipo: "duale", regione: "Campania", comune: "Caserta", nome: "Laura Bianchi", stato: "aperta", n: 1 },
      { id: "r3", creato: new Date(Date.now() - 3 * 86400000).toISOString(), fonte: "magazine", tipo: "gas", regione: "Puglia", comune: "Bari", nome: "Marta Riva", stato: "scelta", n: 2 }
    ]
  };

  function carica() {
    if (!reale()) return Promise.resolve(JSON.parse(JSON.stringify(ESEMPIO)));
    const db = window.acDb;
    return Promise.all([
      db.rpc("fornitori_per_admin"),
      db.from("energia_richieste").select("id, creato, fonte, tipo, regione, comune, nome, stato").order("creato", { ascending: false }).limit(60),
      db.from("energia_proposte").select("richiesta_id").not("richiesta_id", "is", null)
    ]).then(([f, r, p]) => {
      if (f.error) throw f.error;
      const conta = {};
      (p.data || []).forEach((x) => { conta[x.richiesta_id] = (conta[x.richiesta_id] || 0) + 1; });
      return { fornitori: f.data || [], richieste: (r.data || []).map((x) => Object.assign(x, { n: conta[x.id] || 0 })) };
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
    sub: "Chi sono, l'accordo con ognuno, e il giro delle offerte luce e gas.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      carica().then((d) => {
        const en = d.fornitori.filter((f) => f.tipo_azienda === "azienda_luce_gas");
        const attivati = d.fornitori.reduce((n, f) => n + (f.attivati || 0), 0);
        const aperte = d.richieste.filter((r) => r.stato === "aperta").length;
        el.innerHTML = html`
          ${DEMO ? html`<p class="note">Anteprima: dati di esempio, niente va sul database e nessuna mail parte.</p>` : ""}
          <div class="kpis ra-kpi">
            <div class="kpi"><span class="ico navy">${icon("building", 18)}</span><span><strong>${d.fornitori.length}</strong><small>fornitori iscritti (${en.length} luce e gas)</small></span></div>
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
            </div>`) : html`<p class="note">Nessun fornitore ancora. Lo inviti da Inviti, categoria «Fornitori di luce, gas e servizi energetici».</p>`}
          </section>
          <section class="card iv-card">
            <h2>Richieste luce e gas</h2>
            <p class="note">Arrivano a tutti i fornitori di energia, senza nome. Il cliente sceglie una proposta e solo quel fornitore riceve i contatti.</p>
            ${d.richieste.length ? html`<table class="mini-table"><thead><tr><th>Quando</th><th>Cliente</th><th>Dove</th><th>Cosa</th><th>Da</th><th>Proposte</th><th>Stato</th></tr></thead>
              <tbody>${d.richieste.map((r) => html`<tr><td>${dataIt(r.creato)}</td><td>${r.nome}</td><td>${r.comune || ""}${r.regione ? ", " + r.regione : ""}</td><td>${r.tipo}</td><td>${r.fonte === "magazine" ? "Check Bollette" : r.fonte === "rete" ? "Commerciale" : "Dashboard"}</td><td>${r.n}</td>
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
            return window.acDb.functions.invoke("energia-avvisa", { body: { evento: "accordo", azienda: id } });
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
