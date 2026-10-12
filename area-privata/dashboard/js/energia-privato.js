/* PRIVATO · Offerte luce e gas (12.10.2026, app-19). Pagina vera al posto della scheda del progetto.
   Il privato chiede offerte con i suoi consumi; la richiesta va a tutti i fornitori di energia, senza nome.
   Le proposte le vede dal link (anche nella mail) e ne sceglie una: solo quel fornitore riceve i suoi contatti.
   Anteprima e vetrina: niente sul database. */
(function () {
  const AC = window.AC;
  const { html, toast } = AC.ui;
  const S = AC.store;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const reale = () => !DEMO && !!window.acDb;
  const TIPI = { luce: "Luce", gas: "Gas", duale: "Luce e gas" };
  const STATO = { aperta: ["wait", "In attesa di proposte"], scelta: ["ok", "Hai scelto"], chiusa: ["ok", "Contratto attivato"] };
  const REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];
  const demo = [{ token: "", creato: new Date(Date.now() - 86400000).toISOString(), tipo: "duale", stato: "aperta", proposte: 2 }];

  function mie() {
    if (!reale()) return Promise.resolve(demo);
    return window.acDb.from("energia_richieste").select("token, creato, tipo, stato").order("creato", { ascending: false }).limit(20)
      .then((r) => { if (r.error) throw r.error; return r.data || []; });
  }

  V["pv-offerte-luce"] = {
    title: "Offerte luce e gas",
    sub: "Chiedi le offerte dei fornitori AncheCasa: le confronti e scegli tu.",
    render(el) {
      const p = S.data.profilo || {};
      const mail = (S.data.account && S.data.account.mail) || "";
      el.innerHTML = html`
        <div class="pv-due">
          <section class="card">
            <h2>Chiedi le offerte</h2>
            <form id="pe-f" class="prefs wide en-grid">
              <label>Fornitura<select name="tipo"><option value="duale">Luce e gas</option><option value="luce">Solo luce</option><option value="gas">Solo gas</option></select></label>
              <label>Spesa di oggi €/mese<input name="spesa" inputmode="decimal" placeholder="es. 120"></label>
              <label data-per="luce">Consumo luce kWh/anno<input name="cl" inputmode="numeric" placeholder="es. 2700"></label>
              <label data-per="gas">Consumo gas Smc/anno<input name="cg" inputmode="numeric" placeholder="es. 1100"></label>
              <label>Comune<input name="comune" maxlength="80" value="${p.zona || ""}"></label>
              <label>Regione<select name="regione"><option value="">Scegli…</option>${REGIONI.map((r) => html`<option>${r}</option>`)}</select></label>
              <label class="span2">Fornitore di oggi (facoltativo)<input name="attuale" maxlength="80"></label>
              <label>Nome e cognome<input name="nome" required maxlength="120" value="${p.nome || ""}"></label>
              <label>Telefono<input name="tel" maxlength="30"></label>
              <label class="span2">Mail<input name="mail" type="email" required value="${mail}"></label>
              <label class="check span2"><input type="checkbox" name="consenso"> Voglio ricevere le proposte dei fornitori AncheCasa. Nome e contatti li riceve solo il fornitore che scelgo.</label>
              <div class="row-actions span2"><button class="btn-in" type="submit">Chiedi le offerte</button></div>
            </form>
            <p class="note">I consumi li trovi in bolletta. Non li sai? Fai prima <a href="https://magazine.anchecasa.it/check-bollette" target="_blank" rel="noopener">Check Bollette</a>.</p>
          </section>
          <section class="card"><h2>Le mie richieste</h2><div id="pe-mie"><p class="note">Caricamento…</p></div></section>
        </div>`.s;
      const f = el.querySelector("#pe-f");
      const campi = () => { const t = f.tipo.value; f.querySelector('[data-per="luce"]').hidden = t === "gas"; f.querySelector('[data-per="gas"]').hidden = t === "luce"; };
      f.tipo.addEventListener("change", campi); campi();
      const box = el.querySelector("#pe-mie");
      const elenco = () => mie().then((l) => {
        box.innerHTML = l.length ? html`<div class="en-lista">${l.map((r) => html`<div class="en-rrow"><div class="en-rinfo"><b>${TIPI[r.tipo]}</b><small>${new Date(r.creato).toLocaleDateString("it-IT")}</small></div>
          <div class="en-ract"><span class="tag ${(STATO[r.stato] || STATO.aperta)[0]}">${(STATO[r.stato] || STATO.aperta)[1]}</span>${r.token ? html` <a class="btn-mini" href="../offerte.html?t=${r.token}" target="_blank" rel="noopener">Vedi le proposte</a>` : ""}</div></div>`)}</div>`.s
          : html`<p class="note">Ancora nessuna richiesta.</p>`.s;
      }, () => { box.innerHTML = html`<p class="note">Non riesco a leggere le tue richieste.</p>`.s; });
      elenco();
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!f.consenso.checked) return toast("Serve il consenso per ricevere le proposte.", "error");
        const n = (v) => { const x = parseFloat(String(v || "").replace(",", ".")); return isFinite(x) ? x : null; };
        const dati = { fonte: "dashboard", tipo: f.tipo.value, cliente_tipo: "privato", comune: f.comune.value.trim(), regione: f.regione.value,
          consumo_luce: f.tipo.value !== "gas" ? n(f.cl.value) : null, consumo_gas: f.tipo.value !== "luce" ? n(f.cg.value) : null, spesa_mese: n(f.spesa.value),
          fornitore_attuale: f.attuale.value.trim(), nome: f.nome.value.trim(), telefono: f.tel.value.trim(), mail: f.mail.value.trim(), consenso: true };
        if (!dati.nome || !dati.mail) return toast("Scrivi nome e mail.", "error");
        const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
        if (!reale()) { demo.unshift({ token: "", creato: new Date().toISOString(), tipo: dati.tipo, stato: "aperta" }); toast("Anteprima: richiesta registrata, niente è partito."); btn.disabled = false; f.reset(); elenco(); return; }
        window.acDb.rpc("energia_nuova_richiesta", { p: dati }).then((r) => {
          btn.disabled = false;
          if (r.error) { toast(/troppe/.test(r.error.message) ? "Hai già fatto tre richieste oggi." : "Richiesta non inviata: " + r.error.message, "error"); return; }
          window.acDb.functions.invoke("energia-avvisa", { body: { evento: "richiesta", token: r.data } }).catch(() => {});
          toast("Richiesta inviata: ti scriviamo appena arrivano le proposte.");
          f.reset(); elenco();
        });
      });
    }
  };
})();
