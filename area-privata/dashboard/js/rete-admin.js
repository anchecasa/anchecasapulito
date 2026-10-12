/* ADMIN · Rete (12.10.2026, deciso da Nando, PROGETTO-DASHBOARD.md).
   Niente soldi: l'andamento, per sapere chi richiamare e chi premiare.
   Quattro schede: Andamento (da richiamare, da premiare, classifica), Cartina (Italia con le percentuali),
   Obiettivi (li decidono admin e Responsabile Rete Italia e si pubblicano), Strumenti (le pagine della rete).
   Regole: classifica completa solo all'admin; la rete vede la sua posizione e i primi 3; il riconoscimento
   del mese lo vedono tutti. Fermo = nessuna vendita da 30 giorni. Chi resta nella rete lo decide l'admin caso per caso.
   Oggi i numeri sono di esempio: quelli veri arrivano quando si collega Supabase. */
(function () {
  const AC = window.AC;
  const { html, icon, toast, raw } = AC.ui;
  const V = AC.views;

  const RUOLO = { reteitalia: "Rete Italia", sviluppo: "Sviluppo rete", capoarea: "Capo area", agente: "Agente", subagente: "Sub-agente" };
  const REG = {
    piemonte: "Piemonte", "valle-daosta": "Valle d'Aosta", lombardia: "Lombardia", "trentino-alto-adige": "Trentino-Alto Adige", veneto: "Veneto",
    "friuli-venezia-giulia": "Friuli-Venezia Giulia", liguria: "Liguria", "emilia-romagna": "Emilia-Romagna", toscana: "Toscana", umbria: "Umbria",
    marche: "Marche", lazio: "Lazio", abruzzo: "Abruzzo", molise: "Molise", campania: "Campania", puglia: "Puglia", basilicata: "Basilicata",
    calabria: "Calabria", sicilia: "Sicilia", sardegna: "Sardegna"
  };
  const MESE = new Date().toLocaleString("it-IT", { month: "long" });

  // Persone di esempio: ruolo, regione, nuovi clienti (mese e mese prima), clienti attivi/totali, obiettivo del mese, giorni dall'ultima vendita.
  const P = [
    ["Laura Conti", "reteitalia", "lazio", 6, 5, 40, 46, 8, 3, "06 1234567"],
    ["Paolo Greco", "sviluppo", "campania", 5, 6, 31, 38, 6, 5, "081 2223344"],
    ["Marco Villa", "sviluppo", "lombardia", 7, 4, 35, 39, 6, 2, "02 5556677"],
    ["Luca Ferri", "capoarea", "campania", 4, 4, 22, 27, 5, 6, "333 1112233"],
    ["Sara Esposito", "capoarea", "puglia", 1, 3, 12, 20, 4, 34, "340 2223344"],
    ["Giorgio Neri", "capoarea", "lombardia", 6, 3, 25, 28, 5, 1, "347 3334455"],
    ["Anna Russo", "agente", "campania", 5, 2, 14, 15, 4, 2, "348 4445566"],
    ["Davide Costa", "agente", "campania", 0, 2, 6, 11, 3, 41, "349 5556677"],
    ["Elena Gallo", "agente", "lazio", 3, 3, 10, 12, 3, 9, "320 6667788"],
    ["Fabio Rizzo", "agente", "puglia", 0, 1, 3, 7, 3, 52, "328 7778899"],
    ["Chiara Moretti", "agente", "lombardia", 4, 4, 13, 14, 3, 4, "331 8889900"],
    ["Mario Bianchi", "subagente", "campania", 2, 0, 4, 4, 2, 5, "339 9990011"],
    ["Giulia Romano", "subagente", "lazio", 1, 1, 2, 3, 2, 18, "366 1231234"],
    ["Antonio Marino", "subagente", "puglia", 0, 1, 1, 3, 2, 37, "380 3213214"]
  ].map(([nome, ruolo, reg, nuovi, prima, attivi, tot, ob, giorni, tel]) => ({ nome, ruolo, reg, nuovi, prima, attivi, tot, ob, giorni, tel }));

  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const crescita = (p) => p.nuovi - p.prima;
  const fermo = (p) => p.giorni >= 30;
  const note = {};           // nota per persona (anteprima: resta in questa pagina)
  let riconosciuto = null;   // il riconoscimento del mese
  let scheda = "andamento";
  let metrica = "copertura";
  let regione = "";
  const obiettivi = [
    { chi: "Campania", tipo: "zona", cosa: "Nuovi clienti", quanti: 15, pubblicato: true },
    { chi: "Anna Russo", tipo: "persona", cosa: "Nuovi clienti", quanti: 4, pubblicato: true },
    { chi: "Lombardia", tipo: "zona", cosa: "Lavori firmati", quanti: 2, pubblicato: false }
  ];

  function punteggio(p) { return pct(p.nuovi, p.ob) + pct(p.attivi, p.tot) / 2 + crescita(p) * 5; }

  /* ---------- Andamento ---------- */
  function andamento() {
    const tutti = P.length;
    const fermi = P.filter(fermo);
    const inCalo = P.filter((p) => !fermo(p) && crescita(p) < 0);
    const attivi = P.reduce((n, p) => n + p.attivi, 0), tot = P.reduce((n, p) => n + p.tot, 0);
    const nuovi = P.reduce((n, p) => n + p.nuovi, 0), prima = P.reduce((n, p) => n + p.prima, 0);
    const ob = P.reduce((n, p) => n + p.ob, 0);
    const classifica = P.slice().sort((a, b) => punteggio(b) - punteggio(a));
    const richiamare = fermi.concat(inCalo);
    const riga = (p) => html`<div class="ra-riga">
        <div class="ra-chi"><b>${p.nome}</b><small>${RUOLO[p.ruolo]} · ${REG[p.reg]}</small></div>
        <div class="ra-perche">${fermo(p) ? html`<span class="sw-stato sw-off">Fermo da ${p.giorni} giorni</span>` : html`<span class="sw-stato sw-in">In calo: ${p.nuovi} nuovi, ${p.prima} il mese prima</span>`}
          ${note[p.nome] ? html`<small class="ra-nota">Nota: ${note[p.nome]}</small>` : ""}</div>
        <div class="ra-azioni">
          <a class="btn-ghost ra-btn" href="#/admin/chat-team">Scrivi</a>
          <a class="btn-ghost ra-btn" href="tel:${p.tel.replace(/\s/g, "")}">Chiama</a>
          <button type="button" class="btn-ghost ra-btn" data-nota="${p.nome}">Nota</button>
        </div>
      </div>`;
    return html`
      <div class="kpis ra-kpi">
        <div class="kpi"><span class="ico navy">${icon("team", 18)}</span><span><strong>${tutti}</strong><small>persone nella rete</small></span></div>
        <div class="kpi"><span class="ico orange">${icon("chart", 18)}</span><span><strong>${nuovi - prima >= 0 ? "+" : ""}${nuovi - prima}</strong><small>nuovi clienti sul mese prima (${nuovi} vs ${prima})</small></span></div>
        <div class="kpi"><span class="ico navy">${icon("star", 18)}</span><span><strong>${pct(attivi, tot)}%</strong><small>clienti attivi (${attivi} su ${tot})</small></span></div>
        <div class="kpi"><span class="ico orange">${icon("clock", 18)}</span><span><strong>${fermi.length}</strong><small>fermi da 30 giorni</small></span></div>
      </div>
      <p class="note">Obiettivo di ${MESE} di tutta la rete: ${nuovi} nuovi clienti su ${ob} (${pct(nuovi, ob)}%).</p>
      <div class="ra-due">
        <section class="card">
          <h2>Da richiamare <span class="ra-n">${richiamare.length}</span></h2>
          <p class="note">Fermi da 30 giorni o in calo rispetto al mese prima. Chi resta nella rete lo decidi tu, caso per caso.</p>
          ${richiamare.map(riga)}
        </section>
        <section class="card">
          <h2>Da premiare</h2>
          <p class="note">Il riconoscimento del mese lo vede tutta la rete, nella propria dashboard.</p>
          ${classifica.slice(0, 3).map((p, i) => html`<div class="ra-riga">
            <span class="ra-pos ra-pos-${i + 1}">${i + 1}</span>
            <div class="ra-chi"><b>${p.nome}</b><small>${RUOLO[p.ruolo]} · ${REG[p.reg]} · ${p.nuovi} nuovi su ${p.ob}, ${pct(p.attivi, p.tot)}% attivi</small></div>
            <div class="ra-azioni">${riconosciuto === p.nome
              ? html`<span class="sw-stato sw-ok">Migliore di ${MESE}</span>`
              : html`<button type="button" class="btn-in ra-btn" data-premia="${p.nome}">Dai il riconoscimento</button>`}</div>
          </div>`)}
        </section>
      </div>
      <section class="card ra-classifica">
        <h2>Classifica di ${MESE}</h2>
        <p class="note">Completa la vedi solo tu. Ognuno nella rete vede la sua posizione e i primi 3.</p>
        <table class="mini-table">
          <thead><tr><th>#</th><th>Chi</th><th>Zona</th><th>Crescita</th><th>Clienti attivi</th><th>Obiettivo</th><th>Ultima vendita</th></tr></thead>
          <tbody>${classifica.map((p, i) => html`<tr class="${fermo(p) ? "ra-fermo" : ""}">
            <td>${i + 1}</td><td><b>${p.nome}</b><br><small>${RUOLO[p.ruolo]}</small></td><td>${REG[p.reg]}</td>
            <td>${crescita(p) > 0 ? "▲ +" + crescita(p) : crescita(p) < 0 ? "▼ " + crescita(p) : "="}</td>
            <td>${pct(p.attivi, p.tot)}%</td>
            <td><span class="ra-barra"><i style="width:${Math.min(100, pct(p.nuovi, p.ob))}%"></i></span> ${p.nuovi}/${p.ob}</td>
            <td>${p.giorni === 1 ? "ieri" : p.giorni + " giorni fa"}</td>
          </tr>`)}</tbody>
        </table>
      </section>`;
  }

  /* ---------- Cartina ---------- */
  const METRICHE = {
    copertura: { lab: "Copertura della rete", desc: "persone della rete nella regione, sulla regione più coperta" },
    clienti: { lab: "Clienti per regione", desc: "clienti della regione sul totale dei clienti" },
    obiettivo: { lab: "Obiettivo del mese", desc: "nuovi clienti sull'obiettivo della regione" },
    attivi: { lab: "Clienti attivi", desc: "clienti che usano davvero AncheCasa" }
  };
  function datiRegioni() {
    const out = {};
    Object.keys(REG).forEach((k) => { out[k] = { persone: 0, nuovi: 0, ob: 0, attivi: 0, tot: 0, fermi: 0 }; });
    P.forEach((p) => {
      const r = out[p.reg];
      r.persone++; r.nuovi += p.nuovi; r.ob += p.ob; r.attivi += p.attivi; r.tot += p.tot; if (fermo(p)) r.fermi++;
    });
    const maxP = Math.max(...Object.values(out).map((r) => r.persone)) || 1;
    const totC = Object.values(out).reduce((n, r) => n + r.tot, 0) || 1;
    Object.values(out).forEach((r) => {
      r.copertura = pct(r.persone, maxP);
      r.clienti = pct(r.tot, totC);
      r.obiettivo = pct(r.nuovi, r.ob);
      r.attivi_p = pct(r.attivi, r.tot);
    });
    return out;
  }
  function valore(r) { return metrica === "attivi" ? r.attivi_p : r[metrica]; }
  function colore(v, vuota) {
    if (vuota) return "#e4e9f0";
    const scala = ["#fde3cc", "#f8b57f", "#f08a3c", "#d96610", "#a94f09"];
    return scala[Math.min(4, Math.floor(v / 20.01))];
  }
  function cartina() {
    const d = datiRegioni();
    const elenco = Object.keys(REG).filter((k) => d[k].persone).sort((a, b) => valore(d[b]) - valore(d[a]));
    const vuote = Object.keys(REG).filter((k) => !d[k].persone);
    const sel = regione && d[regione];
    return html`
      <div class="ra-metriche" role="group" aria-label="Cosa mostra la cartina">
        ${Object.entries(METRICHE).map(([k, m]) => html`<button type="button" class="pp-f${metrica === k ? " on" : ""}" data-metrica="${k}">${m.lab}</button>`)}
      </div>
      <p class="note">${METRICHE[metrica].lab}: ${METRICHE[metrica].desc}. Clicca una regione.</p>
      <div class="ra-carta">
        <div class="ra-svg card">${raw(AC.ITALIA_SVG || "")}
          <div class="ra-legenda"><span>0%</span><i style="background:#fde3cc"></i><i style="background:#f8b57f"></i><i style="background:#f08a3c"></i><i style="background:#d96610"></i><i style="background:#a94f09"></i><span>100%</span><i style="background:#e4e9f0;margin-left:10px"></i><span>senza rete</span></div>
        </div>
        <div class="ra-lato">
          ${sel ? html`<section class="card ra-reg">
              <h2>${REG[regione]}</h2>
              <p class="note">${sel.persone} nella rete · ${sel.tot} clienti (${sel.attivi_p}% attivi) · obiettivo ${sel.nuovi}/${sel.ob} · ${sel.fermi} ${sel.fermi === 1 ? "fermo" : "fermi"}</p>
              ${P.filter((p) => p.reg === regione).map((p) => html`<div class="ra-mini"><b>${p.nome}</b> <small>${RUOLO[p.ruolo]}</small>${fermo(p) ? html` <span class="sw-stato sw-off">fermo</span>` : ""}</div>`)}
            </section>` : ""}
          <section class="card">
            <h2>Regione per regione</h2>
            ${elenco.map((k) => html`<button type="button" class="ra-regbtn${regione === k ? " on" : ""}" data-reg="${k}">
              <span>${REG[k]}</span><span class="ra-barra"><i style="width:${valore(d[k])}%;background:${colore(valore(d[k]))}"></i></span><b>${valore(d[k])}%</b></button>`)}
            <p class="note ra-vuote"><b>Da aprire:</b> ${vuote.map((k) => REG[k]).join(", ")}.</p>
          </section>
        </div>
      </div>`;
  }
  function coloraCartina(el) {
    const d = datiRegioni();
    el.querySelectorAll(".ra-svg path[data-id]").forEach((p) => {
      const k = p.getAttribute("data-id");
      const r = d[k];
      if (!r) return;
      p.setAttribute("fill", colore(valore(r), !r.persone));
      p.setAttribute("stroke", k === regione ? "#16304d" : "#ffffff");
      p.setAttribute("stroke-width", k === regione ? "2" : "0.8");
      p.style.cursor = "pointer";
      const t = document.createElementNS("http://www.w3.org/2000/svg", "title");
      t.textContent = REG[k] + (r.persone ? " · " + valore(r) + "%" : " · senza rete");
      p.appendChild(t);
    });
  }

  /* ---------- Obiettivi ---------- */
  function obiettiviHtml() {
    return html`
      <section class="card">
        <h2>Nuovo obiettivo di ${MESE}</h2>
        <p class="note">Li decidete tu e il Responsabile Rete Italia. Quando li pubblicate, ognuno li vede nella sua Home.</p>
        <form id="ra-ob" class="iv-campi ra-obf">
          <label>Per<select name="tipo"><option value="zona">Una zona</option><option value="persona">Una persona</option></select></label>
          <label>Chi<select name="chi">${Object.values(REG).map((r) => html`<option>${r}</option>`)}${P.map((p) => html`<option>${p.nome}</option>`)}</select></label>
          <label>Su cosa<select name="cosa"><option>Nuovi clienti</option><option>Clienti attivi</option><option>Canoni attivati</option><option>Lavori firmati</option></select></label>
          <label>Quanti<input name="quanti" type="number" min="1" value="5"></label>
        </form>
        <div class="iv-piede"><span class="note">Resta in bozza finché non premi Pubblica.</span><button type="button" class="btn-in" id="ra-ob-salva">Salva in bozza</button></div>
      </section>
      <section class="card iv-card">
        <h2>Obiettivi di ${MESE}</h2>
        <table class="mini-table">
          <thead><tr><th>Per</th><th>Su cosa</th><th>Quanti</th><th>Stato</th><th></th></tr></thead>
          <tbody>${obiettivi.map((o, i) => html`<tr><td><b>${o.chi}</b><br><small>${o.tipo === "zona" ? "zona" : "persona"}</small></td><td>${o.cosa}</td><td>${o.quanti}</td>
            <td>${o.pubblicato ? html`<span class="sw-stato sw-ok">Pubblicato</span>` : html`<span class="sw-stato sw-off">Bozza</span>`}</td>
            <td>${o.pubblicato ? "" : html`<button type="button" class="btn-ghost ra-btn" data-pubblica="${i}">Pubblica</button>`}</td></tr>`)}</tbody>
        </table>
      </section>`;
  }

  /* ---------- Strumenti ---------- */
  const STRUMENTI = [
    { id: "proposte-rete", nome: "Segnalazioni e la catena", desc: "Chi propongono i commerciali: dici sì o no. L'albero della rete.", ico: "team" },
    { id: "richieste-agenti", nome: "Richieste agenti", desc: "Chi si candida dal sito, con il curriculum.", ico: "star" },
    { id: "inviti-admin", nome: "Inviti", desc: "Fai entrare qualcuno: ruolo, zona, mail.", ico: "send" },
    { id: "contratti", nome: "Contratti", desc: "Modelli e firme.", ico: "doc" },
    { id: "lavori-rete", nome: "Lavori rete", desc: "Ristrutturazioni segnalate e a che punto sono.", ico: "building" },
    { id: "strategia", nome: "Sala strategia", desc: "Le decisioni con la direzione e le linee per la rete.", ico: "chat" },
    { id: "oggi-rete", nome: "Oggi", desc: "La giornata della rete.", ico: "chart" }
  ];
  function strumenti() {
    return html`<div class="doc-griglia">${STRUMENTI.map((v) => html`<a class="doc-tile sw-tile rg-tile" href="#/admin/${v.id}">
      <span class="rg-ico">${icon(v.ico, 22)}</span><b>${v.nome}</b><small>${v.desc}</small></a>`)}</div>`;
  }

  V["rete-admin"] = {
    title: "Rete",
    sub: "L'andamento della rete: chi richiamare, chi premiare, dove siamo in Italia.",
    render(el) {
      const SCHEDE = [["andamento", "Andamento"], ["cartina", "Cartina"], ["obiettivi", "Obiettivi"], ["strumenti", "Strumenti"]];
      const corpo = scheda === "cartina" ? cartina() : scheda === "obiettivi" ? obiettiviHtml() : scheda === "strumenti" ? strumenti() : andamento();
      el.innerHTML = html`
        <div class="ra-testa">
          <div class="pp-filtri" role="tablist">${SCHEDE.map(([k, l]) => html`<button type="button" role="tab" aria-selected="${scheda === k ? "true" : "false"}" class="pp-f${scheda === k ? " on" : ""}" data-scheda="${k}">${l}</button>`)}</div>
          <span class="sw-stato sw-off">Dati di esempio: i numeri veri arrivano con il collegamento a Supabase</span>
        </div>
        ${corpo}`.s;
      const ridisegna = () => V["rete-admin"].render(el);
      el.querySelectorAll("[data-scheda]").forEach((b) => b.addEventListener("click", () => { scheda = b.getAttribute("data-scheda"); ridisegna(); }));
      el.querySelectorAll("[data-metrica]").forEach((b) => b.addEventListener("click", () => { metrica = b.getAttribute("data-metrica"); ridisegna(); }));
      el.querySelectorAll("[data-reg]").forEach((b) => b.addEventListener("click", () => { regione = b.getAttribute("data-reg"); ridisegna(); }));
      if (scheda === "cartina") {
        coloraCartina(el);
        el.querySelectorAll(".ra-svg path[data-id]").forEach((p) => p.addEventListener("click", () => { regione = p.getAttribute("data-id"); ridisegna(); }));
      }
      el.querySelectorAll("[data-nota]").forEach((b) => b.addEventListener("click", () => {
        const chi = b.getAttribute("data-nota");
        const box = b.closest(".ra-riga");
        if (box.querySelector(".ra-notaform")) return;
        const f = document.createElement("div");
        f.className = "ra-notaform";
        f.innerHTML = html`<input type="text" placeholder="es. richiamato il 12.10, riparte lunedì" value="${note[chi] || ""}"><button type="button" class="btn-in ra-btn">Salva</button>`.s;
        box.appendChild(f);
        const inp = f.querySelector("input");
        inp.focus();
        f.querySelector("button").addEventListener("click", () => { note[chi] = inp.value.trim(); toast("Nota salvata. La vede anche il suo responsabile."); ridisegna(); });
      }));
      el.querySelectorAll("[data-premia]").forEach((b) => b.addEventListener("click", () => {
        riconosciuto = b.getAttribute("data-premia");
        toast(riconosciuto + ": migliore di " + MESE + ". Lo vede tutta la rete.");
        ridisegna();
      }));
      const salva = el.querySelector("#ra-ob-salva");
      if (salva) salva.addEventListener("click", () => {
        const f = el.querySelector("#ra-ob");
        obiettivi.push({ chi: f.chi.value, tipo: f.tipo.value, cosa: f.cosa.value, quanti: Number(f.quanti.value) || 1, pubblicato: false });
        ridisegna();
      });
      el.querySelectorAll("[data-pubblica]").forEach((b) => b.addEventListener("click", () => {
        obiettivi[Number(b.getAttribute("data-pubblica"))].pubblicato = true;
        toast("Obiettivo pubblicato: lo vedono nella loro Home.");
        ridisegna();
      }));
    }
  };
})();
