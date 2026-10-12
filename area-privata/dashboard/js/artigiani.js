/* ARTIGIANI e regole comuni delle aziende (12.10.2026, decisioni di Nando 12:11 e 12:20, PROGETTO-DASHBOARD.md, app-23).
   Artigiano: Home · Richieste (una alla volta, 15 minuti se urgente, 2 ore se normale) · Interventi (Lavoro fatto, 4,99 €)
              · Recensioni · Garanzia · Disponibilità · La mia zona · Documenti e abbonamento.
   Privato: «Ho un guasto» e «Trova artigiano» veri; la pagina guasto.html segue la richiesta (conferma, recensione, garanzia).
   Admin: «Aziende» (documenti da verificare, prova e abbonamenti, 4,99 € del mese) e «Guasti».
   Tutte le aziende: «Documenti e abbonamento» (prova 14 giorni, visura e DURC obbligatori per ricevere lavori).
   Anteprima (?demo=…): dati di esempio in questo browser, niente sul database e nessuna mail. */
(function () {
  const AC = window.AC;
  const { html, toast } = AC.ui;
  const S = AC.store;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;

  const MESTIERI = ["Idraulico", "Elettricista", "Fabbro", "Falegname", "Imbianchino", "Muratore", "Serramenti e tapparelle", "Caldaie e climatizzatori", "Vetraio", "Antennista", "Elettrodomestici", "Spurghi"];
  const STATO_G = {
    cerca: ["wait", "Cerchiamo un artigiano"], assegnato: ["wait", "In attesa che l'artigiano accetti"], accettato: ["ok", "Accettato"],
    fatto: ["wait", "Lavoro fatto, da confermare"], confermato: ["ok", "Lavoro confermato"], admin: ["wait", "Ci pensa AncheCasa"], annullato: ["paused", "Annullata"]
  };
  // 12.10.2026, app-25: POS, patente a crediti e abilitazione impianti (DM 37/08) per il bollino delle offerte.
  const DOC = { visura: "Visura camerale", durc: "DURC", pos: "POS (piano operativo di sicurezza)", patente: "Patente a crediti", abilitazione: "Abilitazione impianti (DM 37/08)", assicurazione: "Assicurazione RC", altro: "Altro documento" };
  const STATO_DOC = { caricato: ["wait", "Da controllare"], ok: ["ok", "Verificato"], rifiutato: ["paused", "Da rifare"] };

  const eur = (n) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/\./g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const dataIt = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT"); };
  const oraIt = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }); };
  const giorniFa = (iso) => { const g = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return g <= 0 ? "oggi" : g === 1 ? "ieri" : g + " giorni fa"; };
  const resta = (iso) => { const m = Math.round((new Date(iso).getTime() - Date.now()) / 60000); return m <= 0 ? "tempo scaduto" : m < 60 ? "restano " + m + " minuti" : "restano " + Math.floor(m / 60) + " h " + (m % 60) + " min"; };
  const err = (e) => (e && e.message) || String(e || "errore");
  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });
  const uid = () => db().auth.getSession().then((s) => (s.data && s.data.session ? s.data.session.user.id : ""));
  const stelle = (v) => (v ? "★".repeat(Math.round(v)) + "☆".repeat(5 - Math.round(v)) : "");
  const avvisa = () => { if (reale()) db().functions.invoke("preventivi-avvisa", { body: { evento: "guasti" } }).catch(() => {}); };
  const prov = () => (AC.preventivi && AC.preventivi.PROVINCE) || [];
  const optProv = (sel) => (AC.preventivi ? AC.preventivi.optProvince(sel) : "");

  function nonPronto(el, e) {
    const m = err(e);
    const manca = /does not exist|schema cache|function|PGRST20/i.test(m);
    el.innerHTML = html`<div class="card empty"><strong>${manca ? "Questa parte non è ancora attiva sul database" : "Non riesco a leggere i dati"}</strong>
      <span>${manca ? "Manca app-23 su Supabase. Appena c'è, questa pagina funziona da sola." : m}</span></div>`.s;
  }

  /* ============================================================
     DATI DI ESEMPIO
     ============================================================ */
  const DEMO_KEY = "ac-demo-artigiani-v1";
  function demo() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { d = null; }
    if (d && d.guasti) return d;
    const ora = Date.now(), ieri = new Date(ora - 86400000).toISOString(), dieci = new Date(ora - 10 * 86400000).toISOString();
    d = {
      stato: { prova_dal: new Date(ora - 3 * 86400000).toISOString().slice(0, 10), prova_fino: new Date(ora + 10 * 86400000).toISOString().slice(0, 10), attiva_fino: null, documenti_ok: false, in_prova: true, attiva: false, puo_lavorare: false },
      documenti: [{ id: "d1", tipo: "visura", file_path: "esempio/visura.pdf", scadenza: null, stato: "ok", nota: "", created_at: ieri }, { id: "d2", tipo: "durc", file_path: "esempio/durc.pdf", scadenza: new Date(ora + 90 * 86400000).toISOString().slice(0, 10), stato: "caricato", nota: "", created_at: ieri }],
      artigiano: { mestieri: ["Idraulico", "Caldaie e climatizzatori"], libero: true, notte: true, festivi: false },
      guasti: [
        { id: "g1", creato: new Date(ora - 6 * 60000).toISOString(), tipo: "guasto", mestiere: "Idraulico", descrizione: "Perdita sotto il lavello della cucina, acqua sul pavimento", urgente: true, comune: "Caserta", provincia: "CE", stato: "assegnato", scade_il: new Date(ora + 9 * 60000).toISOString(), nome: "", telefono: "", indirizzo: "", mail: "" },
        { id: "g2", creato: ieri, tipo: "trova", mestiere: "Caldaie e climatizzatori", descrizione: "Caldaia in blocco, errore E04", urgente: false, comune: "San Nicola la Strada", provincia: "CE", stato: "accettato", accettato_il: ieri, nome: "Anna Ferri", telefono: "333 4455667", indirizzo: "Via Appia 12", mail: "anna.ferri@esempio.it" },
        { id: "g3", creato: dieci, tipo: "guasto", mestiere: "Idraulico", descrizione: "Scarico del bagno intasato", urgente: false, comune: "Caserta", provincia: "CE", stato: "confermato", accettato_il: dieci, fatto_il: dieci, confermato_il: dieci, importo: 90, nota_lavoro: "Sostituito sifone", garanzia_fino: new Date(ora + 20 * 86400000).toISOString().slice(0, 10), fee: 4.99, nome: "Marco Russo", telefono: "347 1122334", indirizzo: "Corso Trieste 8", mail: "marco.russo@esempio.it", voto: 5, recensione: "Puntuale e pulito, consigliato.", risposta: "", recensione_id: "r1" }
      ],
      miei: [{ token: "", creato: ieri, mestiere: "Idraulico", stato: "accettato", artigiano: "Termoidraulica Rossi" }]
    };
    return d;
  }
  function demoCambia(fn) { const d = demo(); fn(d); try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch (e) {} }

  const D = {
    stato() { if (!reale()) return Promise.resolve(demo().stato); return Q(db().rpc("azienda_mio_stato")); },
    documenti() { if (!reale()) return Promise.resolve(demo().documenti); return Q(db().from("aziende_documenti").select("*").order("created_at", { ascending: false })); },
    carica(tipo, file, scadenza) {
      if (!reale()) { demoCambia((d) => d.documenti.unshift({ id: "d" + Date.now(), tipo, file_path: "esempio/" + file.name, scadenza: scadenza || null, stato: "caricato", nota: "", created_at: new Date().toISOString() })); return Promise.resolve(); }
      return uid().then((id) => {
        const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
        const path = id + "/" + tipo + "-" + Date.now() + "." + ext;
        return Q(db().storage.from("aziende-documenti").upload(path, file, { upsert: false })).then(() => Q(db().from("aziende_documenti").insert({ azienda_id: id, tipo, file_path: path, scadenza: scadenza || null })));
      });
    },
    artigiano() {
      if (!reale()) return Promise.resolve(demo().artigiano);
      return uid().then((id) => Q(db().from("artigiani").select("*").eq("azienda_id", id).maybeSingle())).then((a) => a || { mestieri: [], libero: true, notte: false, festivi: false });
    },
    salvaArtigiano(a) {
      if (!reale()) { demoCambia((d) => { d.artigiano = a; }); return Promise.resolve(); }
      return uid().then((id) => Q(db().from("artigiani").upsert(Object.assign({ azienda_id: id, updated_at: new Date().toISOString() }, a))));
    },
    guasti() { if (!reale()) return Promise.resolve(demo().guasti); return Q(db().rpc("guasti_per_me")); },
    azione(nome, args, demoFn) {
      if (!reale()) { demoCambia(demoFn); return Promise.resolve(); }
      return Q(db().rpc(nome, args)).then((x) => { avvisa(); return x; });
    }
  };

  /* ============================================================
     AZIENDE: Documenti e abbonamento (tutte le aziende)
     ============================================================ */
  function riquadroStato(s) {
    if (!s) return "";
    const fino = s.attiva ? "Abbonamento attivo fino al " + dataIt(s.attiva_fino) : s.in_prova ? "Prova gratuita fino al " + dataIt(s.prova_fino) : "Prova finita: per ricevere lavori serve l'abbonamento";
    return html`<div class="card en-banner"><div><h2>${s.puo_lavorare ? "Ricevi lavori da AncheCasa" : "Oggi non ricevi lavori"}</h2>
      <p class="note">${fino}. ${s.documenti_ok ? "Documenti verificati." : "Mancano i documenti verificati: carica visura e DURC."}</p></div>
      ${s.documenti_ok ? "" : html`<a class="btn-in" href="#/azienda/az-documenti">Carica i documenti</a>`}</div>`;
  }
  V["az-documenti"] = {
    title: "Documenti e abbonamento",
    sub: "Visura e DURC servono per ricevere lavori. La prova è gratis per 14 giorni.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      Promise.all([D.stato(), D.documenti()]).then(([s, docs]) => {
        el.innerHTML = html`${riquadroStato(s)}
          <div class="pv-due">
            <section class="card"><h2>Carica un documento</h2>
              <form id="dc-f" class="prefs wide en-grid">
                <label>Documento<select name="tipo">${Object.keys(DOC).map((k) => html`<option value="${k}">${DOC[k]}</option>`)}</select></label>
                <label>Scade il (se ha una scadenza)<input type="date" name="scadenza"></label>
                <label class="span2">File (PDF o foto)<input type="file" name="file" accept=".pdf,image/*" required></label>
                <div class="row-actions span2"><button class="btn-in" type="submit">Carica</button></div>
              </form>
              <p class="note">AncheCasa li controlla. Il DURC va ricaricato quando scade.</p>
            </section>
            <section class="card"><h2>I tuoi documenti</h2>
              ${(docs || []).length ? html`<div class="en-lista">${docs.map((d) => html`<div class="en-rrow"><div class="en-rinfo"><b>${DOC[d.tipo] || d.tipo}</b><small>Caricato ${dataIt(d.created_at)}${d.scadenza ? " · scade il " + dataIt(d.scadenza) : ""}${d.nota ? " · " + d.nota : ""}</small></div>
                <div class="en-ract"><span class="tag ${(STATO_DOC[d.stato] || STATO_DOC.caricato)[0]}">${(STATO_DOC[d.stato] || STATO_DOC.caricato)[1]}</span></div></div>`)}</div>` : html`<p class="note">Ancora nessun documento.</p>`}
            </section>
          </div>
          <section class="card"><h2>Abbonamento</h2>
            <p class="note">${s && s.attiva ? "Attivo fino al " + dataIt(s.attiva_fino) + "." : "Dopo la prova, l'abbonamento si paga con bonifico: AncheCasa lo attiva appena riceve il pagamento. Per i dati del bonifico scrivi a info@anchecasa.it."}</p>
          </section>`.s;
        el.querySelector("#dc-f").addEventListener("submit", (e) => {
          e.preventDefault();
          const f = e.target, file = f.file.files[0];
          if (!file) return toast("Scegli il file.", "error");
          if (file.size > 10 * 1024 * 1024) return toast("Il file è troppo grande (massimo 10 MB).", "error");
          const btn = f.querySelector("button"); btn.disabled = true;
          D.carica(f.tipo.value, file, f.scadenza.value).then(() => { toast("Documento caricato: AncheCasa lo controlla."); V["az-documenti"].render(el); }, (e2) => { btn.disabled = false; toast("Non caricato: " + err(e2), "error"); });
        });
      }, (e) => nonPronto(el, e));
    }
  };

  /* ============================================================
     ARTIGIANO
     ============================================================ */
  V.art_home = {
    title: "Home",
    sub: "Le richieste che arrivano a te, gli interventi di oggi, i tuoi numeri.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      Promise.all([D.guasti(), D.stato(), D.artigiano()]).then(([gs, s, a]) => {
        const nuove = (gs || []).filter((g) => g.stato === "assegnato");
        const aperti = (gs || []).filter((g) => g.stato === "accettato");
        const inizio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const fatti = (gs || []).filter((g) => g.stato === "confermato" && new Date(g.confermato_il) >= inizio);
        const voti = (gs || []).filter((g) => g.voto).map((g) => g.voto);
        const media = voti.length ? voti.reduce((x, y) => x + y, 0) / voti.length : 0;
        el.innerHTML = html`${riquadroStato(s)}
          ${a && !a.libero ? html`<div class="card en-banner"><div><h2>Sei segnato come occupato</h2><p class="note">Non ricevi richieste nuove finché non torni libero.</p></div><a class="btn-in" href="#/azienda/art_disponibilita">Disponibilità</a></div>` : ""}
          <div class="en-kpis">
            <a class="kpi en-kpi" href="#/azienda/art_richieste"><span><strong>${nuove.length}</strong><small>richieste da accettare</small></span></a>
            <a class="kpi en-kpi" href="#/azienda/art_interventi"><span><strong>${aperti.length}</strong><small>interventi da fare</small></span></a>
            <div class="kpi"><span><strong>${fatti.length}</strong><small>lavori confermati questo mese · ${eur(fatti.reduce((x, g) => x + Number(g.fee || 4.99), 0))} di commissioni</small></span></div>
            <a class="kpi en-kpi" href="#/azienda/art_recensioni"><span><strong>${media ? media.toFixed(1) : "—"}</strong><small>voto medio (${voti.length} recensioni)</small></span></a>
          </div>
          <div class="card"><h2>Da accettare adesso</h2>
            ${nuove.length ? html`<div class="en-lista">${nuove.map((g) => html`<a class="en-rich" href="#/azienda/art_richieste"><span class="tag ${g.urgente ? "new" : "wait"}">${g.urgente ? "Urgente" : "Normale"}</span><b>${g.mestiere} · ${g.comune}</b><small>${resta(g.scade_il)}</small></a>`)}</div>`
              : html`<p class="note">Nessuna richiesta in attesa. Quando arriva, ricevi anche una mail.</p>`}
          </div>`.s;
      }, (e) => nonPronto(el, e));
    }
  };

  V.art_richieste = {
    title: "Richieste",
    sub: "Ogni richiesta arriva a un artigiano alla volta. Se non accetti in tempo passa al prossimo. Nome, telefono e indirizzo dopo «Accetto».",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      D.guasti().then((gs) => {
        const nuove = (gs || []).filter((g) => g.stato === "assegnato");
        el.innerHTML = html`<div class="card"><h2>Da accettare <span class="ra-n">${nuove.length}</span></h2>
          ${nuove.length ? nuove.map((g) => html`<div class="en-rrow">
            <div class="en-rinfo"><div><span class="tag ${g.urgente ? "new" : "wait"}">${g.urgente ? "Urgente · 15 minuti" : "Normale · 2 ore"}</span> <b>${g.mestiere} · ${g.comune} (${g.provincia})</b> <small>· ${g.tipo === "trova" ? "Ti ha scelto il cliente" : "Ho un guasto"} · ${giorniFa(g.creato)}</small></div>
              <small>${g.descrizione || "Nessuna descrizione"}</small><small><b>${resta(g.scade_il)}</b></small></div>
            <div class="en-ract"><button class="btn-in" type="button" data-acc="${g.id}">Accetto</button><button class="btn-ghost" type="button" data-rif="${g.id}">Non posso</button></div>
          </div>`) : html`<p class="note">Nessuna richiesta in attesa.</p>`}</div>`.s;
        el.querySelectorAll("[data-acc]").forEach((b) => b.addEventListener("click", () => {
          const id = b.getAttribute("data-acc");
          D.azione("guasto_accetta", { p_id: id }, (d) => { const g = d.guasti.find((x) => x.id === id); if (g) Object.assign(g, { stato: "accettato", accettato_il: new Date().toISOString(), nome: "Lucia Bianco", telefono: "333 9988776", indirizzo: "Via Roma 5", mail: "lucia@esempio.it" }); })
            .then(() => { toast("Accettato: trovi i contatti in Interventi."); location.hash = "#/azienda/art_interventi"; }, (e2) => toast(/non_piu/.test(err(e2)) ? "Tempo scaduto: la richiesta è passata a un altro artigiano." : "Non riuscito: " + err(e2), "error"));
        }));
        el.querySelectorAll("[data-rif]").forEach((b) => b.addEventListener("click", () => {
          if (b.dataset.conferma !== "1") { b.dataset.conferma = "1"; b.textContent = "Confermi?"; return; }
          const id = b.getAttribute("data-rif");
          D.azione("guasto_rifiuta", { p_id: id }, (d) => { d.guasti = d.guasti.filter((x) => x.id !== id); }).then(() => { toast("Passata al prossimo artigiano."); V.art_richieste.render(el); }, (e2) => toast("Non riuscito: " + err(e2), "error"));
        }));
      }, (e) => nonPronto(el, e));
    }
  };

  V.art_interventi = {
    title: "Interventi",
    sub: "Gli interventi accettati. A lavoro finito premi «Lavoro fatto»: il cliente conferma e scatta la commissione di 4,99 €.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      D.guasti().then((gs) => {
        const da = (gs || []).filter((g) => g.stato === "accettato");
        const att = (gs || []).filter((g) => g.stato === "fatto");
        const ok = (gs || []).filter((g) => g.stato === "confermato");
        const contatti = (g) => html`<small>${g.indirizzo ? g.indirizzo + ", " : ""}${g.comune} · <a href="tel:${(g.telefono || "").replace(/\s/g, "")}">${g.telefono}</a>${g.mail ? html` · <a href="mailto:${g.mail}">${g.mail}</a>` : ""}</small>`;
        el.innerHTML = html`
          <div class="card"><h2>Da fare <span class="ra-n">${da.length}</span></h2>
            ${da.length ? da.map((g) => html`<div class="en-rrow"><div class="en-rinfo"><div><b>${g.nome}</b> <small>· ${g.mestiere} · accettato il ${oraIt(g.accettato_il)}</small></div>${contatti(g)}<small>${g.descrizione}</small></div>
              <form class="nm-o" data-fatto="${g.id}"><label>Importo €<input name="importo" inputmode="decimal" required placeholder="es. 90"></label><label>Cosa hai fatto<input name="nota" maxlength="500" placeholder="es. sostituito il sifone"></label><button class="btn-in" type="submit">Lavoro fatto</button></form></div>`)
              : html`<p class="note">Nessun intervento da fare.</p>`}</div>
          ${att.length ? html`<div class="card"><h2>In attesa della conferma del cliente</h2>${att.map((g) => html`<div class="en-rrow"><div class="en-rinfo"><b>${g.nome}</b><small>${g.mestiere} · ${eur(g.importo)} · fatto il ${dataIt(g.fatto_il)} · dopo 7 giorni vale come confermato</small></div></div>`)}</div>` : ""}
          <div class="card"><h2>Confermati</h2>
            ${ok.length ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>Data</th><th>Cliente</th><th>Lavoro</th><th class="num">Importo</th><th class="num">Commissione</th><th>Garanzia</th></tr></thead>
              <tbody>${ok.map((g) => html`<tr><td>${dataIt(g.confermato_il)}</td><td>${g.nome}</td><td>${g.mestiere}${g.nota_lavoro ? " · " + g.nota_lavoro : ""}</td><td class="num">${eur(g.importo)}</td><td class="num">${eur(g.fee || 4.99)}</td><td>${g.garanzia_fino && new Date(g.garanzia_fino) >= new Date(new Date().toDateString()) ? "fino al " + dataIt(g.garanzia_fino) : "finita"}</td></tr>`)}</tbody></table></div>`
              : html`<p class="note">Qui trovi i lavori confermati dai clienti.</p>`}</div>`.s;
        el.querySelectorAll("[data-fatto]").forEach((f) => f.addEventListener("submit", (e) => {
          e.preventDefault();
          const id = f.getAttribute("data-fatto"), imp = num(f.importo.value);
          if (!(imp > 0)) return toast("Scrivi l'importo del lavoro.", "error");
          D.azione("guasto_fatto", { p_id: id, p_importo: imp, p_nota: f.nota.value.trim() }, (d) => { const g = d.guasti.find((x) => x.id === id); if (g) Object.assign(g, { stato: "fatto", fatto_il: new Date().toISOString(), importo: imp, nota_lavoro: f.nota.value.trim() }); })
            .then(() => { toast("Lavoro segnato: il cliente lo conferma con un tocco."); V.art_interventi.render(el); }, (e2) => toast("Non salvato: " + err(e2), "error"));
        }));
      }, (e) => nonPronto(el, e));
    }
  };

  V.art_recensioni = {
    title: "Recensioni",
    sub: "Le lascia solo chi ha un lavoro confermato. Puoi rispondere una volta.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      D.guasti().then((gs) => {
        const rc = (gs || []).filter((g) => g.voto);
        el.innerHTML = html`<div class="card"><h2>Le tue recensioni <span class="ra-n">${rc.length}</span></h2>
          ${rc.length ? rc.map((g) => html`<div class="en-rrow"><div class="en-rinfo"><div><b class="ar-stelle">${stelle(g.voto)}</b> <small>· ${g.nome} · ${g.mestiere} · ${dataIt(g.confermato_il)}</small></div>
            <small>«${g.recensione || "Nessun commento"}»</small>
            ${g.risposta ? html`<small><b>La tua risposta:</b> ${g.risposta}</small>` : html`<form class="nm-o" data-risp="${g.recensione_id}"><label style="flex:1">La tua risposta (una sola volta)<input name="testo" maxlength="600" required></label><button class="btn-ghost" type="submit">Rispondi</button></form>`}</div></div>`)
            : html`<p class="note">Ancora nessuna recensione. Arrivano dopo i lavori confermati.</p>`}</div>`.s;
        el.querySelectorAll("[data-risp]").forEach((f) => f.addEventListener("submit", (e) => {
          e.preventDefault();
          const id = f.getAttribute("data-risp"), t = f.testo.value.trim();
          D.azione("recensione_rispondi", { p_id: id, p_testo: t }, (d) => { const g = d.guasti.find((x) => x.recensione_id === id); if (g) g.risposta = t; })
            .then(() => { toast("Risposta pubblicata"); V.art_recensioni.render(el); }, (e2) => toast("Non salvata: " + err(e2), "error"));
        }));
      }, (e) => nonPronto(el, e));
    }
  };

  V.art_garanzia = {
    title: "Garanzia",
    sub: "Garanzia AncheCasa 30 giorni sui lavori confermati nell'app. Qui vedi i lavori coperti e le richieste dei clienti.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      D.guasti().then((gs) => {
        const oggi = new Date(new Date().toDateString());
        const cop = (gs || []).filter((g) => g.stato === "confermato" && g.garanzia_fino && new Date(g.garanzia_fino) >= oggi);
        const ric = (gs || []).filter((g) => g.garanzia_il);
        el.innerHTML = html`
          ${ric.length ? html`<div class="card"><h2>Richieste di garanzia</h2>${ric.map((g) => html`<div class="en-rrow"><div class="en-rinfo"><div><b>${g.nome}</b> <small>· ${g.mestiere} · chiesta il ${dataIt(g.garanzia_il)}</small></div><small>«${g.garanzia_nota}»</small><small><a href="tel:${(g.telefono || "").replace(/\s/g, "")}">${g.telefono}</a> · ${g.indirizzo}</small></div></div>`)}</div>` : ""}
          <div class="card"><h2>Lavori in garanzia <span class="ra-n">${cop.length}</span></h2>
            ${cop.length ? cop.map((g) => html`<div class="en-rrow"><div class="en-rinfo"><b>${g.nome}</b><small>${g.mestiere} · ${eur(g.importo)} · garanzia fino al ${dataIt(g.garanzia_fino)}</small></div></div>`) : html`<p class="note">Nessun lavoro in garanzia adesso.</p>`}</div>`.s;
      }, (e) => nonPronto(el, e));
    }
  };

  V.art_disponibilita = {
    title: "Disponibilità",
    sub: "I tuoi mestieri e quando sei disponibile. Le richieste arrivano solo se sei libero.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      D.artigiano().then((a) => {
        const mie = new Set(a.mestieri || []);
        el.innerHTML = html`<form id="ad-f" class="prefs wide">
          <div class="card"><h2>Adesso</h2>
            <label class="check ar-big"><input type="checkbox" name="libero"${a.libero ? " checked" : ""}> <b>Sono libero</b>: ricevo richieste nuove</label>
            <label class="check"><input type="checkbox" name="notte"${a.notte ? " checked" : ""}> Reperibile per le urgenze la sera e la notte (20–8)</label>
            <label class="check"><input type="checkbox" name="festivi"${a.festivi ? " checked" : ""}> Reperibile nei giorni festivi</label>
          </div>
          <div class="card"><h2>I tuoi mestieri</h2>
            <div class="pz-regioni">${MESTIERI.map((m) => html`<label class="check"><input type="checkbox" name="m" value="${m}"${mie.has(m) ? " checked" : ""}> ${m}</label>`)}</div>
            <p class="note">La zona la scrivi in <a href="#/azienda/art_zona">La mia zona</a>.</p>
            <div class="row-actions"><button class="btn-in" type="submit">Salva</button></div>
          </div></form>`.s;
        el.querySelector("#ad-f").addEventListener("submit", (e) => {
          e.preventDefault();
          const f = e.target;
          const nuova = { mestieri: [...f.querySelectorAll("[name=m]:checked")].map((x) => x.value), libero: f.libero.checked, notte: f.notte.checked, festivi: f.festivi.checked };
          if (!nuova.mestieri.length) return toast("Scegli almeno un mestiere.", "error");
          D.salvaArtigiano(nuova).then(() => toast("Salvato"), (e2) => toast("Non salvato: " + err(e2), "error"));
        });
      }, (e) => nonPronto(el, e));
    }
  };
  // La zona dell'artigiano è la stessa dei fornitori a preventivo (fornitori_zona, preventivi.js).
  V.art_zona = { title: "La mia zona", sub: "Dove sei e quali province copri. Le richieste arrivano partendo dal più vicino.", render(el) { return V.mat_zona.render(el); } };

  /* ============================================================
     PRIVATO: Ho un guasto · Trova artigiano
     ============================================================ */
  function mieiGuasti() {
    if (!reale()) return Promise.resolve(demo().miei);
    return Q(db().from("guasti").select("token, creato, mestiere, stato").order("creato", { ascending: false }).limit(20));
  }
  function elencoMiei(box) {
    mieiGuasti().then((l) => {
      box.innerHTML = (l || []).length ? html`<div class="en-lista">${l.map((g) => html`<div class="en-rrow"><div class="en-rinfo"><b>${g.mestiere}</b><small>${dataIt(g.creato)}${g.artigiano ? " · " + g.artigiano : ""}</small></div>
        <div class="en-ract"><span class="tag ${(STATO_G[g.stato] || STATO_G.cerca)[0]}">${(STATO_G[g.stato] || STATO_G.cerca)[1]}</span>${g.token ? html` <a class="btn-mini" href="../guasto.html?t=${g.token}" target="_blank" rel="noopener">Segui</a>` : ""}</div></div>`)}</div>`.s
        : html`<p class="note">Ancora nessuna richiesta.</p>`.s;
    }, () => { box.innerHTML = html`<p class="note">Non riesco a leggere le richieste.</p>`.s; });
  }
  function formGuasto(id, pre) {
    const p = S.data.profilo || {};
    pre = pre || {};
    return html`<form id="${id}" class="prefs wide en-grid">
      ${pre.scelto ? html`<p class="note span2">La richiesta va prima a <b>${pre.sceltoNome}</b>. Se non può, passa al prossimo artigiano della zona.</p>` : ""}
      <label>Cosa serve<select name="mestiere">${MESTIERI.map((m) => html`<option${pre.mestiere === m ? " selected" : ""}>${m}</option>`)}</select></label>
      <label>Quanto è urgente<select name="urgente"><option value="false">Normale: risposta entro 2 ore</option><option value="true">Urgente: risposta entro 15 minuti</option></select></label>
      <label class="span2">Cosa succede<textarea name="descrizione" maxlength="800" required placeholder="Es. perdita sotto il lavello, acqua sul pavimento"></textarea></label>
      <label>Comune<input name="comune" maxlength="80" required value="${pre.comune || p.zona || ""}"></label>
      <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProv(pre.provincia || "")}</select></label>
      <label class="span2">Indirizzo (lo vede solo l'artigiano che accetta)<input name="indirizzo" maxlength="160" required></label>
      <label>Nome e cognome<input name="nome" required maxlength="120" value="${p.nome || ""}"></label>
      <label>Telefono<input name="tel" required maxlength="30" inputmode="tel"></label>
      <label class="span2">Mail<input name="mail" type="email" required value="${(S.data.account && S.data.account.mail) || ""}"></label>
      <div class="row-actions span2"><button class="btn-in" type="submit">Manda la richiesta</button></div>
    </form>`;
  }
  function collegaGuasto(el, id, tipo, scelto, dopo) {
    const f = el.querySelector("#" + id);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = { tipo, mestiere: f.mestiere.value, urgente: f.urgente.value === "true", descrizione: f.descrizione.value.trim(), comune: f.comune.value.trim(),
        provincia: f.prov.value, indirizzo: f.indirizzo.value.trim(), nome: f.nome.value.trim(), telefono: f.tel.value.trim(), mail: f.mail.value.trim(), scelto: scelto || null };
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      if (!reale()) { demoCambia((x) => x.miei.unshift({ token: "", creato: new Date().toISOString(), mestiere: d.mestiere, stato: "assegnato" })); btn.disabled = false; f.reset(); toast("Anteprima: richiesta registrata, niente è partito."); if (dopo) dopo(); return; }
      Q(db().rpc("guasti_nuovo", { p: d })).then((tok) => {
        avvisa(); btn.disabled = false; f.reset();
        toast("Richiesta mandata: ti avvisiamo appena un artigiano accetta.");
        if (dopo) dopo(tok);
      }, (e2) => { btn.disabled = false; toast(/troppe/.test(err(e2)) ? "Hai già mandato cinque richieste oggi." : "Richiesta non mandata: " + err(e2), "error"); });
    });
  }

  V["pv-guasto"] = {
    title: "Ho un guasto",
    sub: "Scrivi cosa succede: la richiesta va all'artigiano più vicino, libero e con le recensioni migliori. Se non risponde, passa al prossimo.",
    render(el) {
      el.innerHTML = html`<div class="pv-due">
        <section class="card"><h2>Cosa è successo</h2>${formGuasto("hg-f")}</section>
        <section class="card"><h2>Le mie richieste</h2><div id="hg-miei"><p class="note">Caricamento…</p></div>
          <p class="note">Il tuo numero lo vede solo l'artigiano che accetta. Garanzia AncheCasa di 30 giorni sui lavori confermati nell'app.</p></section>
      </div>`.s;
      const box = el.querySelector("#hg-miei");
      elencoMiei(box);
      collegaGuasto(el, "hg-f", "guasto", null, () => elencoMiei(box));
    }
  };

  function cercaArtigiani(provincia, comune, mestiere) {
    if (!reale()) return Promise.resolve([
      { id: "a1", nome: "Termoidraulica Rossi", comune: "Caserta", mestieri: ["Idraulico", "Caldaie e climatizzatori"], voto: 4.8, recensioni: 23, libero: true, vicinanza: 0 },
      { id: "a2", nome: "Elettro Service Snc", comune: "Maddaloni", mestieri: ["Elettricista", "Antennista"], voto: 4.5, recensioni: 11, libero: true, vicinanza: 1 },
      { id: "a3", nome: "Fabbro Esposito", comune: "Marcianise", mestieri: ["Fabbro", "Serramenti e tapparelle"], voto: null, recensioni: 0, libero: false, vicinanza: 1 }
    ].filter((a) => !mestiere || a.mestieri.includes(mestiere)));
    return Q(db().rpc("artigiani_zona", { p_provincia: provincia, p_comune: comune, p_mestiere: mestiere || null }));
  }
  V["pv-trova"] = {
    title: "Trova artigiano",
    sub: "Gli artigiani AncheCasa della tua zona, verificati, con le recensioni dei clienti. Scegli e manda la richiesta.",
    render(el) {
      const p = S.data.profilo || {};
      el.innerHTML = html`<section class="card"><h2>Cerca</h2>
          <form id="ta-c" class="prefs wide en-grid">
            <label>Mestiere<select name="mestiere"><option value="">Tutti</option>${MESTIERI.map((m) => html`<option>${m}</option>`)}</select></label>
            <label>Comune<input name="comune" maxlength="80" value="${p.zona || ""}"></label>
            <label>Provincia<select name="prov" required><option value="">Scegli…</option>${optProv("")}</select></label>
            <div class="row-actions"><button class="btn-in" type="submit">Cerca</button></div>
          </form><div id="ta-l"></div></section>
        <section class="card" id="ta-form-box" hidden><h2>La tua richiesta</h2><div id="ta-form"></div></section>`.s;
      const fc = el.querySelector("#ta-c");
      fc.addEventListener("submit", (e) => {
        e.preventDefault();
        const box = el.querySelector("#ta-l");
        box.innerHTML = html`<p class="note">Cerco…</p>`.s;
        cercaArtigiani(fc.prov.value, fc.comune.value.trim(), fc.mestiere.value).then((l) => {
          box.innerHTML = (l || []).length ? html`<div class="en-lista">${l.map((a) => html`<div class="en-rrow"><div class="en-rinfo"><div><b>${a.nome}</b> <small>· ${a.comune} · ${(a.mestieri || []).join(", ")}</small></div>
              <small>${a.voto ? html`<span class="ar-stelle">${stelle(a.voto)}</span> ${String(a.voto).replace(".", ",")} (${a.recensioni} recensioni)` : "Ancora senza recensioni"} · ${a.libero ? "libero" : "occupato adesso"}</small></div>
              <div class="en-ract"><button class="btn-in" type="button" data-scegli="${a.id}" data-nome="${a.nome}" data-m="${(a.mestieri || [])[0] || ""}">Chiedi a lui</button></div></div>`)}</div>`.s
            : html`<p class="note">Ancora nessun artigiano AncheCasa in questa zona. Usa «Ho un guasto»: se non c'è nessuno, ti aiuta AncheCasa.</p>`.s;
          box.querySelectorAll("[data-scegli]").forEach((b) => b.addEventListener("click", () => {
            const fb = el.querySelector("#ta-form-box"); fb.hidden = false;
            el.querySelector("#ta-form").innerHTML = formGuasto("ta-f", { scelto: b.getAttribute("data-scegli"), sceltoNome: b.getAttribute("data-nome"), mestiere: fc.mestiere.value || b.getAttribute("data-m"), comune: fc.comune.value.trim(), provincia: fc.prov.value }).s;
            collegaGuasto(el, "ta-f", "trova", b.getAttribute("data-scegli"), () => { fb.hidden = true; });
            fb.scrollIntoView({ behavior: "smooth", block: "start" });
          }));
        }, (e2) => { box.innerHTML = html`<p class="note">${/does not exist|schema cache|function/i.test(err(e2)) ? "Gli artigiani arrivano a breve." : "Non riesco a cercare: " + err(e2)}</p>`.s; });
      });
    }
  };

  /* ============================================================
     ADMIN: Aziende e Guasti
     ============================================================ */
  const ESEMPIO_AZ = [
    { id: "z1", nome: "Termoidraulica Rossi", mail: "info@termorossi.it", tipo_azienda: "azienda_artigiani", creato: new Date(Date.now() - 5 * 86400000).toISOString(), prova_dal: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), attiva_fino: null, documenti_ok: false,
      documenti: [{ id: "d1", tipo: "visura", file: "z1/visura.pdf", stato: "caricato" }, { id: "d2", tipo: "durc", file: "z1/durc.pdf", scadenza: "2027-01-15", stato: "caricato" }], interventi_mese: 6, fee_mese: 29.94 },
    { id: "z2", nome: "Edil Nord Srl", mail: "info@edilnord.it", tipo_azienda: "azienda_imprese_edili", creato: new Date(Date.now() - 30 * 86400000).toISOString(), prova_dal: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), attiva_fino: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10), documenti_ok: true, documenti: [], interventi_mese: 0, fee_mese: 0 }
  ];
  const ESEMPIO_GU = [
    { id: "x1", token: "", creato: new Date(Date.now() - 40 * 60000).toISOString(), tipo: "guasto", mestiere: "Fabbro", descrizione: "Porta blindata bloccata", urgente: true, comune: "Aversa", provincia: "CE", nome: "Rita Gallo", telefono: "339 5566778", mail: "rita@esempio.it", stato: "admin", artigiano: "", tentativi: 3, importo: null },
    { id: "x2", token: "", creato: new Date(Date.now() - 86400000).toISOString(), tipo: "trova", mestiere: "Caldaie e climatizzatori", descrizione: "Caldaia in blocco", urgente: false, comune: "San Nicola la Strada", provincia: "CE", nome: "Anna Ferri", telefono: "333 4455667", mail: "anna.ferri@esempio.it", stato: "accettato", artigiano: "Termoidraulica Rossi", tentativi: 1, importo: null }
  ];
  const statoAz = (a) => {
    const oggi = new Date(new Date().toDateString());
    if (a.attiva_fino && new Date(a.attiva_fino) >= oggi) return ["sw-ok", "Attiva fino al " + dataIt(a.attiva_fino)];
    const fp = a.prova_dal ? new Date(new Date(a.prova_dal).getTime() + 13 * 86400000) : null;
    if (fp && fp >= oggi) return ["sw-in", "In prova fino al " + dataIt(fp)];
    return ["sw-off", "Prova finita, non attiva"];
  };
  V["aziende-admin"] = {
    title: "Aziende",
    sub: "Documenti da verificare, prova e abbonamenti, commissioni del mese, guasti da gestire.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      // 12.10.2026, app-25: sponsor e limite delle richieste dei cantieri.
      const carica = reale() ? Promise.all([Q(db().rpc("aziende_per_admin")), Q(db().rpc("guasti_admin")), Q(db().from("aziende_stato").select("azienda_id, sponsor_fino, limite_richieste, moduli")).catch(() => Q(db().from("aziende_stato").select("azienda_id, sponsor_fino, limite_richieste"))).catch(() => [])]) : Promise.resolve([JSON.parse(JSON.stringify(ESEMPIO_AZ)), ESEMPIO_GU, []]);
      carica.then(([az, gu, sp]) => {
        const spDi = {}; (sp || []).forEach((x) => { spDi[x.azienda_id] = x; });
        const daVerificare = az.filter((a) => !a.documenti_ok && (a.documenti || []).some((d) => d.stato === "caricato"));
        const guAdmin = gu.filter((g) => g.stato === "admin");
        const garanzie = gu.filter((g) => g.garanzia_il && g.stato === "confermato");
        const fee = az.reduce((x, a) => x + Number(a.fee_mese || 0), 0);
        el.innerHTML = html`${DEMO ? html`<p class="note">Anteprima: dati di esempio, niente va sul database.</p>` : ""}
          <div class="en-kpis">
            <div class="kpi"><span><strong>${daVerificare.length}</strong><small>aziende da verificare</small></span></div>
            <div class="kpi"><span><strong>${az.filter((a) => statoAz(a)[0] === "sw-in").length}</strong><small>in prova</small></span></div>
            <div class="kpi"><span><strong>${az.filter((a) => statoAz(a)[0] === "sw-ok").length}</strong><small>abbonamenti attivi</small></span></div>
            <div class="kpi"><span><strong>${eur(fee)}</strong><small>commissioni 4,99 € del mese</small></span></div>
          </div>
          ${guAdmin.length || garanzie.length ? html`<section class="card iv-card"><h2>Guasti da gestire <span class="sw-stato sw-in">${guAdmin.length + garanzie.length}</span></h2>
            <p class="note">Nessun artigiano ha accettato, oppure il cliente ha chiesto la garanzia.</p>
            ${[].concat(guAdmin, garanzie).map((g) => html`<div class="en-rrow"><div class="en-rinfo"><div><span class="tag ${g.stato === "admin" ? "new" : "wait"}">${g.stato === "admin" ? (g.urgente ? "Urgente · nessuno ha accettato" : "Nessuno ha accettato") : "Garanzia richiesta"}</span> <b>${g.mestiere} · ${g.comune} (${g.provincia})</b> <small>· ${oraIt(g.creato)}</small></div>
              <small>${g.descrizione}${g.garanzia_nota ? " · garanzia: «" + g.garanzia_nota + "»" : ""}</small><small>${g.nome} · <a href="tel:${(g.telefono || "").replace(/\s/g, "")}">${g.telefono}</a> · <a href="mailto:${g.mail}">${g.mail}</a>${g.artigiano ? " · artigiano: " + g.artigiano : ""}</small></div></div>`)}
          </section>` : ""}
          <section class="card iv-card"><h2>Aziende</h2>
            ${az.length ? az.map((a) => { const st = statoAz(a); return html`<div class="fo-riga">
              <div class="fo-testa"><div class="ra-chi"><b>${a.nome}</b><small>${(AC.categorieInvito && AC.categorieInvito.mappa[a.tipo_azienda] && AC.categorieInvito.mappa[a.tipo_azienda].label) || a.tipo_azienda} · ${a.mail}</small></div>
                <div class="fo-num"><small>${a.documenti_ok ? "Documenti verificati" : (a.documenti || []).length ? (a.documenti || []).length + " documenti da controllare" : "Nessun documento"}${a.interventi_mese ? " · " + a.interventi_mese + " interventi, " + eur(a.fee_mese) : ""}</small></div>
                <div class="fo-stato"><span class="sw-stato ${st[0]}">${st[1]}</span></div></div>
              ${(a.documenti || []).length ? html`<div class="az-docs">${a.documenti.map((d) => html`<button type="button" class="btn-mini" data-file="${d.file}">${DOC[d.tipo] || d.tipo}${d.scadenza ? " · scade " + dataIt(d.scadenza) : ""}</button>`)}</div>` : ""}
              <form class="nm-o" data-az="${a.id}">
                <label class="check"><input type="checkbox" name="ok"${a.documenti_ok ? " checked" : ""}> Documenti verificati</label>
                <label>Attiva fino al<input type="date" name="fino" value="${a.attiva_fino || ""}"></label>
                <label>Nota<input name="nota" maxlength="500" placeholder="es. bonifico del 12/10"></label>
                <label>Sponsor fino al<input type="date" name="sponsor" value="${(spDi[a.id] || {}).sponsor_fino || ""}"></label>
                <label>Richieste al mese<input type="number" name="limite" min="0" max="1000" value="${(spDi[a.id] || {}).limite_richieste || 20}" style="width:80px"></label>
                <span class="az-mod">Moduli attivi: ${[["gare", "Gare"], ["predict", "Predict"], ["anchebim", "AncheBIM"]].map(([k, l]) => html`<label class="check"><input type="checkbox" name="mod" value="${k}"${((spDi[a.id] || {}).moduli || []).indexOf(k) >= 0 ? " checked" : ""}> ${l}</label>`)}</span>
                <button class="btn-ghost" type="submit">Salva</button></form>
            </div>`; }) : html`<p class="note">Nessuna azienda iscritta.</p>`}
          </section>
          <section class="card iv-card"><h2>Guasti recenti</h2>
            ${gu.length ? html`<table class="mini-table"><thead><tr><th>Quando</th><th>Cosa</th><th>Dove</th><th>Cliente</th><th>Artigiano</th><th>Stato</th></tr></thead><tbody>${gu.map((g) => html`<tr><td>${oraIt(g.creato)}</td><td>${g.mestiere}${g.urgente ? " · urgente" : ""}</td><td>${g.comune}</td><td>${g.nome}</td><td>${g.artigiano || "—"}</td><td>${(STATO_G[g.stato] || STATO_G.cerca)[1]}</td></tr>`)}</tbody></table>` : html`<p class="note">Ancora nessun guasto.</p>`}
          </section>`.s;
        el.querySelectorAll("[data-file]").forEach((b) => b.addEventListener("click", () => {
          if (!reale()) return toast("Anteprima: il file si apre solo con i dati veri.");
          db().storage.from("aziende-documenti").createSignedUrl(b.getAttribute("data-file"), 300).then((r) => { if (r.error) return toast("Non riesco ad aprire il file.", "error"); window.open(r.data.signedUrl, "_blank", "noopener"); });
        }));
        el.querySelectorAll("[data-az]").forEach((f) => f.addEventListener("submit", (e) => {
          e.preventDefault();
          const id = f.getAttribute("data-az");
          if (!reale()) { toast("Anteprima: salvato solo qui."); return; }
          Q(db().rpc("azienda_admin_stato", { p_azienda: id, p_documenti_ok: f.ok.checked, p_attiva_fino: f.fino.value || null, p_note: f.nota.value.trim() }))
            .then(() => Q(db().rpc("azienda_admin_sponsor", { p_azienda: id, p_sponsor_fino: f.sponsor.value || null, p_limite: Number(f.limite.value) || 20 })).catch(() => null))
            // 12.10.2026, app-27: moduli a pagamento attivati per questa azienda (Gare, Predict, AncheBIM).
            .then(() => Q(db().from("aziende_stato").update({ moduli: [...f.querySelectorAll("[name=mod]:checked")].map((x) => x.value) }).eq("azienda_id", id)).catch(() => null))
            .then(() => { toast("Salvato"); V["aziende-admin"].render(el); }, (e2) => toast("Non salvato: " + err(e2), "error"));
        }));
      }, (e) => nonPronto(el, e));
    }
  };

  AC.artigiani = { MESTIERI: MESTIERI, riquadroStato: riquadroStato, stato: () => D.stato() };
})();
