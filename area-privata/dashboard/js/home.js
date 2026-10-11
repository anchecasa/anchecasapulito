/* Home con grafici e andamenti (11.10.2026, su richiesta di Nando).
   Una sola pagina per admin e collaboratori della rete: i numeri li filtra già Supabase.
   - admin: tutta la rete (iscritti, rete, canoni, lavori) negli ultimi 12 mesi;
   - agente/collaboratore: sé stesso e la sua catena, più le proprie provvigioni.
   Solo letture. Con ?demo=admin|agente mostra numeri d'esempio, scritti come «Esempio». */
(function () {
  const AC = (window.AC = window.AC || {});
  const ui = () => AC.ui;
  function html(strings, ...vals) { return ui().html(strings, ...vals); }
  function icon(n, s) { return ui().icon(n, s); }
  function db() { return window.acDb; }

  const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  const MESI_LUNGHI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const RUOLI = { reteitalia: "Rete Italia", sviluppo: "Sviluppo rete", capoarea: "Capo area", agente: "Agente", subagente: "Sub-agente" };
  const STATI_LAVORO = [["proposta", "Proposte"], ["firmato", "Firmati"], ["chiuso", "Chiusi"], ["perso", "Persi"]];
  const BLU = "#2c4a6e";
  const ARANCIO = "#f07a1a";
  const AZZURRO = "#8fb0d3";

  function demo() {
    const q = new URLSearchParams(location.search).get("demo") || "";
    return q === "admin" || q === "agente" ? q : "";
  }

  function conTempo(p) {
    return Promise.race([
      Promise.resolve(p).catch((e) => ({ error: e })),
      new Promise((resolve) => setTimeout(() => resolve({ error: { message: "il server non risponde" } }), 25000))
    ]);
  }

  function sessione() {
    if (!db()) return Promise.resolve("");
    return db().auth.getSession().then((s) => (s.data && s.data.session && s.data.session.user && s.data.session.user.id) || "").catch(() => "");
  }

  /* ---------- date e numeri ---------- */
  function ym(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  function ultimiMesi(n) {
    const out = [];
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (n - 1));
    for (let i = 0; i < n; i++) {
      out.push(ym(d));
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }
  function etichetta(k) { return MESI[Number(k.slice(5, 7)) - 1] || ""; }
  function meseDi(v) { return v ? String(v).slice(0, 7) : ""; }
  function euro(n) {
    const x = Number(n) || 0;
    if (Math.abs(x) >= 10000) return (x / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "k €";
    return x.toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " €";
  }
  function intero(n) { return (Number(n) || 0).toLocaleString("it-IT"); }
  function somma(arr, f) { return arr.reduce((s, x) => s + (Number(f(x)) || 0), 0); }

  function perMese(righe, quando, quanto, mesi) {
    const m = {};
    mesi.forEach((k) => { m[k] = 0; });
    righe.forEach((r) => {
      const k = meseDi(quando(r));
      if (k in m) m[k] += quanto ? Number(quanto(r)) || 0 : 1;
    });
    return mesi.map((k) => m[k]);
  }

  /* Variazione del mese in corso rispetto al mese prima, già scritta. */
  function variazione(valori, fmt) {
    const ora = valori[valori.length - 1] || 0;
    const prima = valori[valori.length - 2] || 0;
    if (!ora && !prima) return html`<span class="hm-var">nessun movimento</span>`;
    const diff = ora - prima;
    const verso = diff > 0 ? "su" : diff < 0 ? "giu" : "pari";
    const freccia = diff > 0 ? "▲" : diff < 0 ? "▼" : "=";
    const quanto = prima ? Math.round((diff / prima) * 100) + "%" : (fmt ? fmt(diff) : String(diff));
    return html`<span class="hm-var ${verso}">${freccia} ${diff > 0 ? "+" : ""}${quanto} sul mese prima</span>`;
  }

  /* ---------- grafici ---------- */
  // Colonne mese per mese. serie: [{ nome, colore, valori }]; più serie = colonne impilate.
  function colonne(titolo, mesi, serie, fmt, nota) {
    const tot = mesi.map((_, i) => somma(serie, (s) => s.valori[i]));
    const max = Math.max(1, ...tot);
    const totale = somma(tot, (x) => x);
    const ultimo = tot[tot.length - 1];
    const col = mesi.map((k, i) => {
      const titoloCol = MESI_LUNGHI[Number(k.slice(5, 7)) - 1] + " " + k.slice(0, 4) + ": " + serie.map((s) => (serie.length > 1 ? s.nome + " " : "") + fmt(s.valori[i])).join(" · ");
      const pezzi = serie.map((s) => {
        const h = (s.valori[i] / max) * 100;
        return h > 0 ? html`<i style="height:${h.toFixed(1)}%;background:${s.colore}"></i>` : "";
      });
      return html`<div class="hm-col${i === mesi.length - 1 ? " ora" : ""}" title="${titoloCol}">
        <div class="hm-pila">${pezzi}</div>
        <span>${etichetta(k)}</span>
      </div>`;
    });
    return html`<div class="card hm-grafico">
      <div class="hm-gh">
        <h2>${titolo}</h2>
        <div class="hm-gv"><b>${fmt(ultimo)}</b><small>questo mese</small></div>
      </div>
      <p class="note">${variazione(tot, fmt)} · ${fmt(totale)} in 12 mesi${nota ? " · " + nota : ""}</p>
      <div class="hm-colonne" role="img" aria-label="${titolo}, ultimi 12 mesi">
        <div class="hm-asse"><span>${fmt(max)}</span><span>${fmt(max / 2)}</span><span>0</span></div>
        ${col}
      </div>
      ${serie.length > 1 ? html`<div class="hm-leg">${serie.map((s) => html`<span><i style="background:${s.colore}"></i>${s.nome}</span>`)}</div>` : ""}
    </div>`;
  }

  // Barre orizzontali: righe [[etichetta, valore]].
  function barre(titolo, righe, fmt, colore, vuoto) {
    const max = Math.max(1, ...righe.map((r) => r[1]));
    const corpo = righe.length
      ? righe.map(([t, v]) => html`<div class="hm-barra">
          <div class="hm-barra-h"><span>${t}</span><b>${fmt(v)}</b></div>
          <div class="hm-barra-t"><i style="width:${((v / max) * 100).toFixed(1)}%;background:${colore}"></i></div>
        </div>`)
      : html`<p class="note">${vuoto || "Ancora nessun dato."}</p>`;
    return html`<div class="card hm-grafico"><h2>${titolo}</h2>${corpo}</div>`;
  }

  function kpi(ico, colore, valore, etichettaTxt, sotto) {
    return html`<div class="kpi"><span class="ico ${colore}">${icon(ico, 18)}</span><span><strong>${valore}</strong><small>${etichettaTxt}</small>${sotto ? html`<small class="kpi-sub">${sotto}</small>` : ""}</span></div>`;
  }

  function sottoDi(rete, u) {
    const out = [];
    const giu = (x, l) => {
      if (l > 6) return;
      rete.filter((r) => r.superiore === x).forEach((r) => { out.push(r.utente); giu(r.utente, l + 1); });
    };
    giu(u, 1);
    return out;
  }

  /* ---------- dati ---------- */
  async function leggi(chi) {
    const q = (p) => conTempo(p).then((r) => (r && !r.error ? r.data || [] : null));
    const [iscritti, rete, vend, aff, prov] = await Promise.all([
      chi.admin ? q(db().rpc("iscritti_admin")) : Promise.resolve(null),
      q(db().from("app_rete").select("utente, superiore, ruolo, stato, regione, creato").limit(2000)),
      q(db().from("app_vendite").select("venditore, importo, tipo_importo, stato, attivata, creato").limit(5000)),
      q(db().from("app_affari").select("segnalato_da, stato, valore, creato, firmato").limit(3000)),
      chi.uid ? q(db().from("app_provvigioni").select("importo, stato, mese, creato").eq("beneficiario", chi.uid).limit(3000)) : Promise.resolve(null)
    ]);
    return { iscritti, rete, vend, aff, prov };
  }

  function esempio(tipo) {
    const mesi = ultimiMesi(12);
    const giorno = (k, g) => k + "-" + String(g).padStart(2, "0") + "T10:00:00";
    const iscritti = [], rete = [], vend = [], aff = [], prov = [];
    const ruoli = ["sviluppo", "capoarea", "capoarea", "agente", "agente", "agente", "subagente", "subagente"];
    const regioni = ["Lazio", "Lombardia", "Campania", "Toscana", "Puglia", "Sicilia"];
    mesi.forEach((k, i) => {
      for (let n = 0; n < 4 + i * 2 + (i % 3); n++) iscritti.push({ famiglia: n % 3 ? "privato" : "azienda", created_at: giorno(k, 1 + (n % 27)) });
      for (let n = 0; n < 1 + Math.floor(i / 3); n++) rete.push({ utente: "u" + i + n, superiore: n ? "u" + i + "0" : "io", ruolo: ruoli[(i + n) % ruoli.length], stato: "attivo", regione: regioni[(i + n) % regioni.length], creato: giorno(k, 5) });
      for (let n = 0; n < 1 + Math.floor(i / 2); n++) vend.push({ venditore: "io", importo: 49 + 30 * (n % 3), tipo_importo: "mese", stato: "attiva", attivata: giorno(k, 9), creato: giorno(k, 3) });
      if (i % 2 === 0 || i > 8) aff.push({ segnalato_da: "io", stato: i > 9 ? "proposta" : i % 4 ? "firmato" : "chiuso", valore: 8000 + i * 1500, creato: giorno(k, 2), firmato: i > 9 ? null : giorno(k, 20) });
      if (i === 3) aff.push({ segnalato_da: "io", stato: "perso", valore: 12000, creato: giorno(k, 4), firmato: null });
      prov.push({ importo: 80 + i * 35, stato: i < 10 ? "pagata" : "maturata", mese: k + "-01", creato: giorno(k, 28) });
    });
    return { iscritti: tipo === "admin" ? iscritti : null, rete, vend, aff, prov: tipo === "admin" ? null : prov };
  }

  /* ---------- pagine ---------- */
  function paginaAdmin(d, mesi) {
    const meseOra = mesi[mesi.length - 1];
    const anno = meseOra.slice(0, 4);
    const pezzi = [];

    const isc = (d.iscritti || []).filter((p) => p.famiglia === "privato" || p.famiglia === "azienda");
    const reteAtt = (d.rete || []).filter((r) => r.stato === "attivo");
    const canoniAttivi = somma((d.vend || []).filter((v) => v.stato === "attiva" && v.tipo_importo === "mese"), (v) => v.importo);
    const firmatiAnno = (d.aff || []).filter((a) => a.firmato && String(a.firmato).slice(0, 4) === anno);

    pezzi.push(html`<div class="kpis hm-kpis">
      ${kpi("team", "navy", d.iscritti ? intero(isc.length) : "—", "iscritti", d.iscritti ? "+" + isc.filter((p) => meseDi(p.created_at) === meseOra).length + " questo mese" : "non disponibile")}
      ${kpi("star", "orange", d.rete ? intero(reteAtt.length) : "—", "nella rete, attivi", d.rete ? "+" + (d.rete || []).filter((r) => meseDi(r.creato) === meseOra).length + " questo mese" : "non disponibile")}
      ${kpi("wallet", "navy", d.vend ? euro(canoniAttivi) : "—", "canoni attivi al mese", d.vend ? (d.vend || []).filter((v) => v.stato === "proposta").length + " proposte aperte" : "non disponibile")}
      ${kpi("doc", "orange", d.aff ? intero(firmatiAnno.length) : "—", "lavori firmati nel " + anno, d.aff ? euro(somma(firmatiAnno, (a) => a.valore)) + " di valore" : "non disponibile")}
    </div>`);

    const griglia = [];
    if (d.iscritti) {
      griglia.push(colonne("Nuovi iscritti", mesi, [
        { nome: "Privati", colore: AZZURRO, valori: perMese(isc.filter((p) => p.famiglia === "privato"), (p) => p.created_at, null, mesi) },
        { nome: "Aziende", colore: BLU, valori: perMese(isc.filter((p) => p.famiglia === "azienda"), (p) => p.created_at, null, mesi) }
      ], intero));
    }
    if (d.rete) {
      griglia.push(colonne("Nuovi nella rete", mesi, [{ nome: "Rete", colore: ARANCIO, valori: perMese(d.rete, (r) => r.creato, null, mesi) }], intero));
    }
    if (d.vend) {
      const att = d.vend.filter((v) => v.stato === "attiva" && v.tipo_importo === "mese");
      griglia.push(colonne("Canoni attivati", mesi, [{ nome: "Canoni", colore: ARANCIO, valori: perMese(att, (v) => v.attivata, (v) => v.importo, mesi) }], euro, "euro al mese aggiunti"));
    }
    if (d.aff) {
      griglia.push(colonne("Valore lavori firmati", mesi, [{ nome: "Lavori", colore: BLU, valori: perMese(d.aff.filter((a) => a.firmato), (a) => a.firmato, (a) => a.valore, mesi) }], euro));
    }
    if (d.rete) {
      const perRuolo = Object.keys(RUOLI).map((k) => [RUOLI[k], reteAtt.filter((r) => r.ruolo === k).length]).filter((r) => r[1]);
      griglia.push(barre("La rete per ruolo", perRuolo, intero, BLU, "Nessuno ancora nella rete."));
      const reg = {};
      reteAtt.forEach((r) => { const k = r.regione || "Senza regione"; reg[k] = (reg[k] || 0) + 1; });
      const perReg = Object.entries(reg).sort((a, b) => b[1] - a[1]).slice(0, 8);
      griglia.push(barre("Dove è la rete", perReg, intero, ARANCIO, "Nessuna regione indicata."));
    }
    if (d.aff) {
      const perStato = STATI_LAVORO.map(([k, t]) => [t, d.aff.filter((a) => a.stato === k).length]);
      griglia.push(barre("Lavori per stato", perStato.filter((r) => r[1]), intero, BLU, "Nessun lavoro ancora."));
    }
    pezzi.push(html`<div class="hm-griglia">${griglia}</div>`);
    pezzi.push(html`<div class="row-actions hm-vai">
      <a class="tab" href="#/admin/oggi-rete">${icon("chart", 16)} Obiettivi di oggi</a>
      <a class="tab" href="#/admin/lavori-rete">${icon("doc", 16)} Lavori rete</a>
      <a class="tab" href="#/admin/iscritti">${icon("team", 16)} Iscritti</a>
    </div>`);
    return pezzi;
  }

  function paginaAgente(d, mesi, uid) {
    const meseOra = mesi[mesi.length - 1];
    const anno = meseOra.slice(0, 4);
    const rete = d.rete || [];
    const squadra = uid ? sottoDi(rete, uid) : rete.filter((r) => r.utente !== "io").map((r) => r.utente);
    const chi = [uid || "io"].concat(squadra);
    const dentro = (u) => chi.indexOf(u) >= 0;
    const vend = (d.vend || []).filter((v) => dentro(v.venditore));
    const aff = (d.aff || []).filter((a) => dentro(a.segnalato_da));
    const prov = d.prov || [];
    const att = vend.filter((v) => v.stato === "attiva" && v.tipo_importo === "mese");
    const firmatiAnno = aff.filter((a) => a.firmato && String(a.firmato).slice(0, 4) === anno);
    const provAnno = prov.filter((p) => meseDi(p.mese || p.creato).slice(0, 4) === anno);
    const daPagare = somma(prov.filter((p) => p.stato === "maturata"), (p) => p.importo);
    const conSquadra = squadra.length ? "tu e la squadra" : "i tuoi";
    const pezzi = [];

    pezzi.push(html`<div class="kpis hm-kpis">
      ${kpi("team", "navy", intero(squadra.length), "nella tua squadra", squadra.length ? "+" + rete.filter((r) => squadra.indexOf(r.utente) >= 0 && meseDi(r.creato) === meseOra).length + " questo mese" : "invita dalla voce Inviti")}
      ${kpi("wallet", "orange", d.vend ? euro(somma(att.filter((v) => meseDi(v.attivata) === meseOra), (v) => v.importo)) : "—", "canoni attivati questo mese", conSquadra)}
      ${kpi("doc", "navy", d.aff ? intero(firmatiAnno.length) : "—", "lavori firmati nel " + anno, d.aff ? euro(somma(firmatiAnno, (a) => a.valore)) + " di valore" : "non disponibile")}
      ${kpi("star", "orange", d.prov ? euro(somma(provAnno, (p) => p.importo)) : "—", "tue provvigioni nel " + anno, d.prov ? euro(daPagare) + " da pagare" : "non disponibile")}
    </div>`);

    const griglia = [];
    if (d.prov) griglia.push(colonne("Le tue provvigioni", mesi, [
      { nome: "Pagate", colore: BLU, valori: perMese(prov.filter((p) => p.stato === "pagata"), (p) => p.mese || p.creato, (p) => p.importo, mesi) },
      { nome: "Da pagare", colore: ARANCIO, valori: perMese(prov.filter((p) => p.stato !== "pagata"), (p) => p.mese || p.creato, (p) => p.importo, mesi) }
    ], euro));
    if (d.vend) griglia.push(colonne("Canoni attivati", mesi, [{ nome: "Canoni", colore: ARANCIO, valori: perMese(att, (v) => v.attivata, (v) => v.importo, mesi) }], euro, conSquadra));
    if (d.aff) griglia.push(colonne("Valore lavori firmati", mesi, [{ nome: "Lavori", colore: BLU, valori: perMese(aff.filter((a) => a.firmato), (a) => a.firmato, (a) => a.valore, mesi) }], euro, conSquadra));
    if (d.rete) griglia.push(colonne("Crescita della squadra", mesi, [{ nome: "Squadra", colore: AZZURRO, valori: perMese(rete.filter((r) => squadra.indexOf(r.utente) >= 0), (r) => r.creato, null, mesi) }], intero));
    if (d.rete && squadra.length) {
      const sq = rete.filter((r) => squadra.indexOf(r.utente) >= 0 && r.stato === "attivo");
      griglia.push(barre("La squadra per ruolo", Object.keys(RUOLI).map((k) => [RUOLI[k], sq.filter((r) => r.ruolo === k).length]).filter((r) => r[1]), intero, BLU));
    }
    if (d.aff) griglia.push(barre("I lavori per stato", STATI_LAVORO.map(([k, t]) => [t, aff.filter((a) => a.stato === k).length]).filter((r) => r[1]), intero, ARANCIO, "Nessun lavoro ancora: segnalane uno da Pubblica."));
    pezzi.push(html`<div class="hm-griglia">${griglia}</div>`);
    pezzi.push(html`<div class="row-actions hm-vai">
      <a class="tab" href="#/agente/guadagno">${icon("wallet", 16)} Guadagno</a>
      <a class="tab" href="#/agente/catena">${icon("team", 16)} Catena</a>
      <a class="tab" href="#/agente/documenti">${icon("doc", 16)} Documenti</a>
    </div>`);
    return pezzi;
  }

  async function disegna(el) {
    const fam = (AC.store && AC.store.data && AC.store.data.famiglia) || "";
    const tipo = fam === "admin" ? "admin" : "agente";
    const mesi = ultimiMesi(12);
    el.innerHTML = html`<div class="card"><p class="note">Caricamento dei numeri…</p></div>`.s;

    let d;
    let uid = "";
    let prova = false;
    if (demo()) {
      d = esempio(tipo);
      prova = true;
    } else {
      if (!db()) { el.innerHTML = html`<div class="card"><p>Supabase non è disponibile in questa pagina.</p></div>`.s; return; }
      uid = await sessione();
      d = await leggi({ admin: tipo === "admin", uid: tipo === "admin" ? "" : uid });
    }
    if (!el.isConnected) return;

    const niente = !d.iscritti && !d.rete && !d.vend && !d.aff && !d.prov;
    if (niente) {
      el.innerHTML = html`<div class="card"><p>Non riesco a leggere i numeri in questo momento.</p><div class="row-actions"><button class="btn-in" type="button" data-riprova>Riprova</button></div></div>`.s;
      const b = el.querySelector("[data-riprova]");
      if (b) b.addEventListener("click", () => disegna(el));
      return;
    }

    const ora = new Date();
    const corpo = tipo === "admin" ? paginaAdmin(d, mesi) : paginaAgente(d, mesi, uid);
    el.innerHTML = html`
      ${prova ? html`<p class="note">Esempio</p>` : ""}
      <p class="note hm-quando">Ultimi 12 mesi, aggiornato alle ${String(ora.getHours()).padStart(2, "0")}:${String(ora.getMinutes()).padStart(2, "0")} · tocca una colonna per il dettaglio</p>
      ${corpo}`.s;

    // Sul telefono non c'è il passaggio del mouse: toccando una colonna si legge il dettaglio.
    el.querySelectorAll(".hm-col").forEach((c) => {
      c.addEventListener("click", () => {
        const card = c.closest(".hm-grafico");
        if (!card) return;
        let box = card.querySelector(".hm-dett");
        if (!box) {
          box = document.createElement("p");
          box.className = "note hm-dett";
          card.appendChild(box);
        }
        card.querySelectorAll(".hm-col.sel").forEach((x) => x.classList.remove("sel"));
        c.classList.add("sel");
        box.textContent = c.getAttribute("title") || "";
      });
    });
  }

  AC.views = AC.views || {};
  AC.views.home = {
    title: "Home",
    sub: "Come sta andando: grafici e andamenti degli ultimi 12 mesi.",
    render(el) { disegna(el); }
  };
})();
