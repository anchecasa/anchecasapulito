/* GARE (12.10.2026, decisioni di Nando 15:10, app-27).
   Aziende edili e general contractor (moduli a pagamento, prezzo da decidere):
     · «Cerca gare»: le gare di AncheBandi per provincia e parola.
     · «Le mie gare»: il Terranova dell'azienda. Stato, scadenza, documenti da preparare, ribasso, note;
       dalla gara si apre il cantiere per chiedere subappalti e forniture (js/cantieri.js).
   Admin: tasto «Gare» con Bandi, Terranova, Predict, AncheBIM e Software. Le gare private non le fa nessuno.
   Anteprima (?demo=…): dati di esempio in questo browser. */
(function () {
  const AC = window.AC;
  const { html, toast } = AC.ui;
  const S = AC.store;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;
  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });
  const err = (e) => (e && e.message) || String(e || "errore");
  const uid = () => db().auth.getSession().then((s) => (s.data && s.data.session ? s.data.session.user.id : ""));
  const base = () => "#/" + (S.data.famiglia || "azienda") + "/";
  const optProv = (sel) => (AC.preventivi ? AC.preventivi.optProvince(sel) : "");
  const regioneDi = (sigla) => { const p = ((AC.preventivi && AC.preventivi.PROVINCE) || []).find((x) => x[0] === sigla); return p ? p[2] : ""; };
  const eur = (n) => (n == null || n === "" ? "Importo non indicato" : (Number(n) || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" }));
  const dataIt = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const mancano = (iso) => { if (!iso) return ""; const g = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000); return g < 0 ? "scaduta" : g === 0 ? "scade oggi" : g === 1 ? "scade domani" : "mancano " + g + " giorni"; };
  const caricamento = (el) => { el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s; };
  function nonPronto(el, e) {
    const m = err(e);
    const manca = /does not exist|schema cache|function|PGRST20/i.test(m);
    el.innerHTML = html`<div class="card empty"><strong>${manca ? "Questa parte non è ancora attiva sul database" : "Non riesco a leggere le gare"}</strong>
      <span>${manca ? "Manca app-27 su Supabase. Appena c'è, questa pagina funziona da sola." : m}</span></div>`.s;
  }

  const KIND = { bando: "Bando", avviso: "Avviso", elenco_operatori: "Elenco operatori", sistema_qualificazione: "Qualificazione", preinformazione: "Preinformazione", esito: "Esito" };
  const STATO = { analisi: ["new", "In analisi"], pronta: ["wait", "Pronta per l'offerta"], presentata: ["wait", "Presentata"], vinta: ["ok", "Vinta"], persa: ["paused", "Persa"], rinuncia: ["paused", "Rinuncia"] };
  const DOCUMENTI = ["Lettura del disciplinare", "Sopralluogo obbligatorio", "DGUE", "PassOE (ANAC)", "Garanzia provvisoria", "Attestazione SOA", "Dichiarazioni e allegati", "Offerta tecnica", "Offerta economica e ribasso", "Invio sulla piattaforma"];

  // I moduli a pagamento attivati dall'admin per questa azienda (aziende_stato.moduli, app-27).
  AC.moduliAttivi = AC.moduliAttivi || [];
  function leggiModuli() {
    if (!reale() || S.data.famiglia !== "azienda") return;
    uid().then((id) => id && Q(db().from("aziende_stato").select("moduli").eq("azienda_id", id).maybeSingle())).then((x) => {
      const prima = AC.moduliAttivi.join(",");
      AC.moduliAttivi = (x && x.moduli) || [];
      if (AC.moduliAttivi.join(",") !== prima && /gare_|predict|anchebim/.test(location.hash)) window.dispatchEvent(new HashChangeEvent("hashchange"));
    }, () => {});
  }
  setTimeout(leggiModuli, 1500);
  window.addEventListener("focus", leggiModuli);

  /* ---------------- dati di esempio ---------------- */
  const DEMO_KEY = "ac-demo-gare-v1";
  const piu = (g) => new Date(Date.now() + g * 86400000).toISOString();
  function demo() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { d = null; }
    if (d && d.feed) return d;
    d = {
      feed: [
        { id: "f1", kind: "bando", title: "Lavori di manutenzione straordinaria della scuola primaria", contracting_authority: "Comune di Teano", municipality: "Teano", province: "CE", region: "Campania", amount_cents: 48000000, submission_deadline: piu(18), published_at: piu(-4), cig_code: "B2C4E61A9F", lifecycle_status: "pubblicato", procedure_type: "Procedura aperta" },
        { id: "f2", kind: "bando", title: "Efficientamento energetico della palestra comunale", contracting_authority: "Comune di Maddaloni", municipality: "Maddaloni", province: "CE", region: "Campania", amount_cents: 21000000, submission_deadline: piu(9), published_at: piu(-2), cig_code: "B1F0A73C22", lifecycle_status: "pubblicato", procedure_type: "Procedura negoziata" },
        { id: "f3", kind: "avviso", title: "Indagine di mercato: rifacimento coperture edificio ex mercato", contracting_authority: "Comune di Caserta", municipality: "Caserta", province: "CE", region: "Campania", amount_cents: 9500000, submission_deadline: piu(6), published_at: piu(-1), cig_code: "", lifecycle_status: "pubblicato", procedure_type: "Manifestazione di interesse" },
        { id: "f4", kind: "bando", title: "Ristrutturazione alloggi di edilizia residenziale pubblica", contracting_authority: "ACER Campania", municipality: "Aversa", province: "CE", region: "Campania", amount_cents: 132000000, submission_deadline: piu(25), published_at: piu(-6), cig_code: "B3A9E0D117", lifecycle_status: "pubblicato", procedure_type: "Procedura aperta" }
      ],
      mie: [{ id: "m1", creato: piu(-3), bando_id: "f2", titolo: "Efficientamento energetico della palestra comunale", ente: "Comune di Maddaloni", comune: "Maddaloni", provincia: "CE", cig: "B1F0A73C22", importo: 210000, scadenza: piu(9), stato: "analisi",
        checklist: DOCUMENTI.map((v, i) => ({ voce: v, fatto: i < 3 })), ribasso: null, note: "Serve il sopralluogo entro il 15.", cantiere_id: null }]
    };
    return d;
  }
  function demoCambia(fn) { const d = demo(); fn(d); try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch (e) {} }

  const D = {
    cerca(prov, testo, aperte) { if (!reale()) return Promise.resolve(demo().feed.filter((g) => (!prov || g.province === prov) && (!testo || (g.title + " " + g.contracting_authority).toLowerCase().indexOf(testo.toLowerCase()) >= 0))); return Q(db().rpc("gare_cerca", { p_province: prov ? [prov] : [], p_testo: testo || "", p_solo_aperte: aperte })); },
    mie() { if (!reale()) return Promise.resolve(demo().mie); return Q(db().from("gare_mie").select("*").order("scadenza", { ascending: true, nullsFirst: false })); },
    aggiungi(g) {
      const riga = { bando_id: String(g.id), titolo: g.title, ente: g.contracting_authority || "", comune: g.municipality || "", provincia: (g.province || "").slice(0, 2).toUpperCase(), cig: (g.cig_code || "").slice(0, 20),
        importo: g.amount_cents != null ? Number(g.amount_cents) / 100 : null, scadenza: g.submission_deadline || null, checklist: DOCUMENTI.map((v) => ({ voce: v, fatto: false })) };
      if (!reale()) { demoCambia((d) => { if (!d.mie.some((m) => m.bando_id === riga.bando_id)) d.mie.push(Object.assign({ id: "m" + Date.now(), creato: new Date().toISOString(), stato: "analisi", ribasso: null, note: "", cantiere_id: null }, riga)); }); return Promise.resolve(); }
      return uid().then((id) => Q(db().from("gare_mie").upsert(Object.assign({ azienda_id: id }, riga), { onConflict: "azienda_id,bando_id", ignoreDuplicates: true })));
    },
    salva(id, campi) {
      if (!reale()) { demoCambia((d) => { const m = d.mie.find((x) => x.id === id); if (m) Object.assign(m, campi); }); return Promise.resolve(); }
      return Q(db().from("gare_mie").update(campi).eq("id", id));
    },
    togli(id) {
      if (!reale()) { demoCambia((d) => { d.mie = d.mie.filter((x) => x.id !== id); }); return Promise.resolve(); }
      return Q(db().from("gare_mie").delete().eq("id", id));
    }
  };

  /* ---------------- Cerca gare ---------------- */
  let filtro = { prov: "", testo: "", aperte: true };
  V.gare_cerca = {
    title: "Cerca gare",
    sub: "Le gare pubbliche raccolte da AncheBandi, per provincia e parola. Quelle che ti interessano le metti in «Le mie gare» e le segui fino all'esito.",
    render(el) {
      if (!filtro.prov) { const z = (S.data.profilo && S.data.profilo.provincia) || ""; filtro.prov = /^[A-Z]{2}$/.test(z) ? z : ""; }
      el.innerHTML = html`<section class="card"><form id="gc-f" class="prefs wide en-grid">
          <label>Provincia<select name="prov"><option value="">Tutte</option>${optProv(filtro.prov)}</select></label>
          <label>Cerca<input name="testo" maxlength="80" value="${filtro.testo}" placeholder="es. scuola, coperture, Caserta, CIG"></label>
          <label class="check span2"><input type="checkbox" name="aperte"${filtro.aperte ? " checked" : ""}> Solo gare ancora aperte</label>
          <div class="row-actions span2"><button class="btn-in" type="submit">Cerca</button><a class="btn-ghost" href="${base()}gare_mie">Le mie gare</a></div></form></section>
        <div id="gc-ris"><div class="card"><p class="note">Caricamento…</p></div></div>`.s;
      const ris = el.querySelector("#gc-ris");
      const mostra = () => Promise.all([D.cerca(filtro.prov, filtro.testo, filtro.aperte), D.mie().catch(() => [])]).then(([l, mie]) => {
        const gia = {}; (mie || []).forEach((m) => { gia[m.bando_id] = 1; });
        ris.innerHTML = html`<section class="card"><h2>Gare trovate <span class="ra-n">${(l || []).length}</span></h2>
          ${(l || []).length ? html`<div class="en-lista">${l.map((g) => html`<div class="en-rrow"><div class="en-rinfo">
              <div><span class="tag ${g.kind === "esito" ? "paused" : "new"}">${KIND[g.kind] || g.kind || "Gara"}</span> <b>${g.title}</b></div>
              <small>${g.contracting_authority || ""}${g.municipality ? " · " + g.municipality : ""}${g.province ? " (" + g.province + ")" : ""} · ${eur(g.amount_cents != null ? g.amount_cents / 100 : null)}</small>
              <small>${g.submission_deadline ? "Termine " + dataIt(g.submission_deadline) + " · " + mancano(g.submission_deadline) : "Termine non indicato"}${g.procedure_type ? " · " + g.procedure_type : ""}${g.cig_code ? " · CIG " + g.cig_code : ""}</small></div>
            <div class="en-ract">${gia[String(g.id)] ? html`<span class="tag ok">Nelle mie gare</span>` : html`<button class="btn-ghost" type="button" data-agg="${g.id}">Segui questa gara</button>`}</div></div>`)}</div>`
            : html`<p class="note">Nessuna gara con questi filtri. Prova con tutte le province o senza parola.</p>`}</section>`.s;
        ris.querySelectorAll("[data-agg]").forEach((b) => b.addEventListener("click", () => {
          const g = l.find((x) => String(x.id) === b.getAttribute("data-agg"));
          b.disabled = true;
          D.aggiungi(g).then(() => { toast("Aggiunta a «Le mie gare»."); b.outerHTML = '<span class="tag ok">Nelle mie gare</span>'; }, (e) => { b.disabled = false; toast("Non aggiunta: " + err(e), "error"); });
        }));
      }, (e) => nonPronto(ris, e));
      mostra();
      el.querySelector("#gc-f").addEventListener("submit", (e) => {
        e.preventDefault(); const f = e.target;
        filtro = { prov: f.prov.value, testo: f.testo.value.trim(), aperte: f.aperte.checked };
        ris.innerHTML = html`<div class="card"><p class="note">Cerco…</p></div>`.s; mostra();
      });
    }
  };

  /* ---------------- Le mie gare (il Terranova dell'azienda) ---------------- */
  let aperta = "";
  V.gare_mie = {
    title: "Le mie gare",
    sub: "Le gare che segui: scadenze, documenti da preparare, ribasso ed esito. Da una gara apri il cantiere e chiedi subappalti e forniture alle aziende della zona.",
    render(el) {
      caricamento(el);
      D.mie().then((l) => {
        l = l || [];
        const attive = l.filter((g) => ["analisi", "pronta", "presentata"].indexOf(g.stato) >= 0);
        const chiuse = l.filter((g) => attive.indexOf(g) < 0);
        const vinte = l.filter((g) => g.stato === "vinta").length;
        const riga = (g) => {
          const ck = g.checklist || [], fatti = ck.filter((x) => x.fatto).length;
          return html`<div class="en-rrow"><div class="en-rinfo">
              <div><span class="tag ${(STATO[g.stato] || STATO.analisi)[0]}">${(STATO[g.stato] || STATO.analisi)[1]}</span> <b>${g.titolo}</b></div>
              <small>${g.ente}${g.comune ? " · " + g.comune : ""} · ${eur(g.importo)}${g.cig ? " · CIG " + g.cig : ""}</small>
              <small>${g.scadenza ? "Termine " + dataIt(g.scadenza) + " · " + mancano(g.scadenza) : "Termine non indicato"} · documenti ${fatti}/${ck.length}</small></div>
            <div class="en-ract"><button class="btn-mini" type="button" data-a="${g.id}">${g.id === aperta ? "Chiudi" : "Apri"}</button></div></div>
            ${g.id === aperta ? html`<form class="card prefs wide" data-g="${g.id}" style="margin:6px 0 14px">
              <div class="en-grid"><label>Stato<select name="stato">${Object.keys(STATO).map((k) => html`<option value="${k}"${g.stato === k ? " selected" : ""}>${STATO[k][1]}</option>`)}</select></label>
                <label>Ribasso offerto %<input name="ribasso" inputmode="decimal" value="${g.ribasso != null ? String(g.ribasso).replace(".", ",") : ""}"></label></div>
              <fieldset class="co-gr"><legend>Documenti e passaggi</legend>${ck.map((x, i) => html`<label class="check"><input type="checkbox" name="ck" value="${i}"${x.fatto ? " checked" : ""}> ${x.voce}</label>`)}</fieldset>
              <label>Note<textarea name="note" maxlength="2000">${g.note || ""}</textarea></label>
              <div class="row-actions"><button class="btn-in" type="submit">Salva</button>
                <button class="btn-ghost" type="button" data-cant="${g.id}">${g.cantiere_id ? "Apri il cantiere della gara" : "Chiedi subappalti e forniture"}</button>
                <button class="btn-ghost" type="button" data-togli="${g.id}">Togli dalle mie gare</button></div></form>` : ""}`;
        };
        el.innerHTML = html`<div class="en-kpis">
            <div class="kpi"><span><strong>${attive.length}</strong><small>gare in corso</small></span></div>
            <div class="kpi"><span><strong>${attive.filter((g) => g.scadenza && new Date(g.scadenza) - Date.now() < 7 * 86400000 && new Date(g.scadenza) > Date.now()).length}</strong><small>scadono entro 7 giorni</small></span></div>
            <div class="kpi"><span><strong>${vinte}</strong><small>vinte</small></span></div>
            <a class="kpi en-kpi" href="${base()}gare_cerca"><span><strong>+</strong><small>cerca altre gare</small></span></a></div>
          <section class="card"><h2>In corso</h2>${attive.length ? attive.map(riga) : html`<p class="note">Nessuna gara in corso. Trovale in «Cerca gare».</p>`}</section>
          ${chiuse.length ? html`<section class="card"><h2>Chiuse</h2>${chiuse.map(riga)}</section>` : ""}`.s;
        el.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => { const id = b.getAttribute("data-a"); aperta = aperta === id ? "" : id; V.gare_mie.render(el); }));
        el.querySelectorAll("[data-g]").forEach((f) => f.addEventListener("submit", (e) => {
          e.preventDefault();
          const g = l.find((x) => x.id === f.getAttribute("data-g"));
          const fatti = [...f.querySelectorAll("[name=ck]:checked")].map((x) => Number(x.value));
          const rib = f.ribasso.value.trim() ? Number(f.ribasso.value.replace(",", ".")) : null;
          D.salva(g.id, { stato: f.stato.value, ribasso: isFinite(rib) ? rib : null, note: f.note.value.trim(), checklist: (g.checklist || []).map((x, i) => ({ voce: x.voce, fatto: fatti.indexOf(i) >= 0 })) })
            .then(() => { toast("Salvato."); V.gare_mie.render(el); }, (e2) => toast("Non salvato: " + err(e2), "error"));
        }));
        el.querySelectorAll("[data-togli]").forEach((b) => b.addEventListener("click", () => {
          if (b.dataset.ok !== "1") { b.dataset.ok = "1"; b.textContent = "Confermi?"; return; }
          D.togli(b.getAttribute("data-togli")).then(() => { aperta = ""; toast("Tolta."); V.gare_mie.render(el); }, (e) => toast("Non riuscito: " + err(e), "error"));
        }));
        el.querySelectorAll("[data-cant]").forEach((b) => b.addEventListener("click", () => {
          const g = l.find((x) => x.id === b.getAttribute("data-cant"));
          if (!AC.cantieri) return toast("Manca js/cantieri.js.", "error");
          const apri = (cid) => { AC.cantieri.apri(cid); location.hash = base() + "cnt_cantieri"; };
          if (g.cantiere_id) return apri(g.cantiere_id);
          if (!g.provincia) return toast("La gara non ha la provincia: crea il cantiere da «I miei cantieri».", "error");
          b.disabled = true;
          AC.cantieri.salvaCantiere({ nome: ("Gara " + g.titolo).slice(0, 120), comune: g.comune, provincia: g.provincia, regione: regioneDi(g.provincia), committente: "pubblico", cig: g.cig, importo: g.importo, note: g.ente })
            .then((cid) => D.salva(g.id, { cantiere_id: cid }).then(() => apri(cid)), (e) => { b.disabled = false; toast("Cantiere non creato: " + err(e), "error"); });
        }));
      }, (e) => nonPronto(el, e));
    }
  };

  /* ---------------- Predict (in preparazione) ---------------- */
  V.predict = {
    title: "Predict",
    sub: "La previsione sulla gara: ribasso probabile, concorrenti, margine. Per AncheCasa e per le aziende che fanno appalti.",
    render(el) {
      el.innerHTML = html`<section class="card"><p><span class="sw-stato sw-in">In preparazione</span></p>
        <p>Predict leggerà gli esiti delle gare di AncheBandi della stessa zona e dello stesso tipo, e ti dirà prima di partecipare: ribasso medio di aggiudicazione, quante imprese partecipano di solito, e se con i tuoi costi il margine regge.</p>
        <p class="note">Intanto: segui le gare in «Le mie gare» e scrivi il ribasso offerto e l'esito. Sono i dati da cui Predict partirà.</p>
        <div class="row-actions"><a class="btn-in" href="${base()}gare_mie">Le mie gare</a><a class="btn-ghost" href="${base()}${S.data.famiglia === "admin" ? "bandi" : "gare_cerca"}">Cerca gare</a></div></section>`.s;
    }
  };

  /* ---------------- Admin: tasto «Gare» ---------------- */
  V["gare-admin"] = {
    title: "Gare",
    sub: "I software di AncheCasa per le gare e la parte tecnica. Le aziende edili e i general contractor hanno «Cerca gare» e «Le mie gare» come modulo a pagamento.",
    render(el) {
      const T = [["bandi", "Bandi", "AncheBandi: tutte le gare pubbliche raccolte, da leggere e filtrare."], ["terranova", "Terranova", "Le gare che AncheCasa sta preparando, con stato e scadenze."],
        ["gare_mie", "Le mie gare", "La stessa pagina che hanno le aziende: segui una gara e da lì chiedi subappalti e forniture."], ["predict", "Predict", "La previsione su ribasso e margine (in preparazione)."],
        ["anchebim", "AncheBIM", "Il controllo dei disegni, al millesimo."], ["software", "Software", "Tutti i software di AncheCasa in una pagina."]];
      el.innerHTML = html`<div class="sw-griglia ga-griglia">${T.map((t) => html`<a class="card ga-tile" href="#/admin/${t[0]}"><b>${t[1]}</b><span class="note">${t[2]}</span></a>`)}</div>
        <p class="note">Le gare private non le usa nessuno: AncheCasa e i general contractor pubblicano una richiesta dal cantiere, anche con il prezzo, e le aziende rispondono con l'offerta.</p>`.s;
    }
  };
})();
