/* ADMIN · Magazine (09.10.2026, su richiesta esplicita): il polso della rivista.
   Lettori, pagine fino a dove leggono, Check Bollette, condivisioni, città, provenienza, dispositivi
   e l'elenco degli iscritti agli avvisi (con download per Excel).
   Dati: funzione marketplace.magazine_riepilogo() e tabella marketplace.magazine_iscritti
   (supabase/migrations/20261009170000_magazine_statistiche.sql). Gli iscritti arrivati prima della tabella
   stanno in richieste_iscrizione con dati.modulo = "magazine-avvisi": qui si vedono insieme.
   Chi scrive i dati: la rivista (sito/js/magazine.js) tramite la funzione Vercel sito/api/mag.js.
   Anteprima locale: ?demo=admin mostra dati di esempio. Stile in css/magazine-admin.css. */
(function () {
  const AC = window.AC;
  const { html, raw, icon, toast } = AC.ui;
  const V = AC.views;

  // Nomi delle pagine del numero 1 (aggiornare a ogni numero, stesso ordine di PAGINE in sito/js/magazine.js).
  const PAGINE_N1 = ["Copertina", "Editoriale", "App raccolta (avvisi)", "I numeri della casa", "Bonus: apertura", "Bonus: infografica",
    "Bonifico e documenti", "La bolletta smontata", "Check Bollette", "Energia: apertura", "Energia: l’ordine dei lavori", "Serramenti",
    "Preventivo blindato", "Pratiche", "Bagno", "Cucina", "Esterni", "Manutenzione", "Caldaia", "Glossario", "Trova impresa", "Retro"];
  const PERIODI = [["7", "7 giorni"], ["30", "30 giorni"], ["90", "90 giorni"], ["tutto", "Da sempre"]];
  const AZIONI = { bollette_uso: "Check Bollette usato", bollette_pdf: "Report PDF scaricato", offerte: "«Confronta offerte»", condividi: "Hanno condiviso", avvisi: "Iscritti agli avvisi" };
  const DISP = { telefono: "Telefono", pc: "PC", tablet: "Tablet", altro: "Altro" };
  const ui = { periodo: "30", cerca: "" };
  const DEMO = /[?&]demo=admin/.test(location.search);

  const n0 = (n) => Math.round(Number(n) || 0).toLocaleString("it-IT");
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const dataIt = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d)) return "-";
    const p = (x) => String(x).padStart(2, "0");
    return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear();
  };
  const timeout = (pr, ms) => Promise.race([pr, new Promise((r) => setTimeout(() => r({ error: { message: "il server non risponde" } }), ms))]);
  const manca = (err) => err && /does not exist|schema cache|magazine_|PGRST20[0-9]/i.test(err.message || "");

  function dal() {
    if (ui.periodo === "tutto") return "2026-01-01T00:00:00Z";
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (Number(ui.periodo) - 1));
    return d.toISOString();
  }

  /* ---------- dati di esempio per l'anteprima locale ---------- */
  function esempio() {
    const giorni = [];
    const oggi = new Date();
    const g = Number(ui.periodo) || 30;
    for (let i = Math.min(g, 30) - 1; i >= 0; i--) {
      const d = new Date(oggi);
      d.setDate(d.getDate() - i);
      giorni.push({ giorno: d.toISOString().slice(0, 10), lettori: Math.round(40 + 60 * Math.abs(Math.sin(i / 3)) + (i < 3 ? 120 : 0)) });
    }
    const lettori = giorni.reduce((a, x) => a + x.lettori, 0);
    const per_pagina = PAGINE_N1.map((_, i) => ({ pagina: i, lettori: Math.round(lettori * Math.max(0.18, Math.pow(0.93, i)) * (i === 8 ? 1.15 : 1)) }));
    return {
      riepilogo: {
        lettori: lettori, pagine_viste: Math.round(lettori * 7.4),
        azioni: { apertura: lettori, bollette_uso: Math.round(lettori * 0.21), bollette_pdf: Math.round(lettori * 0.08), offerte: Math.round(lettori * 0.05), condividi: Math.round(lettori * 0.06), avvisi: Math.round(lettori * 0.04) },
        per_giorno: giorni, per_pagina: per_pagina,
        citta: [["Roma", 0.14], ["Milano", 0.12], ["Napoli", 0.09], ["Torino", 0.06], ["Bergamo", 0.05], ["Caserta", 0.05], ["Bologna", 0.04], ["Firenze", 0.04], ["Bari", 0.03], ["Non rilevata", 0.02]].map((c) => ({ nome: c[0], lettori: Math.round(lettori * c[1]) })),
        dispositivi: { telefono: Math.round(lettori * 0.72), pc: Math.round(lettori * 0.24), tablet: Math.round(lettori * 0.04) },
        provenienze: [["whatsapp", 0.38], ["diretto", 0.22], ["facebook", 0.14], ["google.com", 0.11], ["sito anchecasa", 0.09], ["condiviso", 0.06]].map((c) => ({ nome: c[0], lettori: Math.round(lettori * c[1]) })),
        condivisioni: [{ canale: "whatsapp", volte: 41 }, { canale: "menu telefono", volte: 33 }, { canale: "link copiato", volte: 12 }, { canale: "facebook", volte: 9 }, { canale: "email", volte: 4 }],
        iscritti: 3
      },
      iscritti: [
        { mail: "mario.rossi@example.it", comune: "Bergamo", citta_rete: "Bergamo", creato: new Date().toISOString(), fonte: "tabella" },
        { mail: "giulia.b@example.it", comune: "Caserta", citta_rete: "Napoli", creato: new Date(Date.now() - 864e5).toISOString(), fonte: "tabella" },
        { mail: "luca@example.it", comune: "Roma", citta_rete: "", creato: new Date(Date.now() - 3 * 864e5).toISOString(), fonte: "richieste" }
      ],
      tabella: true
    };
  }

  /* ---------- lettura dal server ---------- */
  function carica() {
    if (DEMO) return Promise.resolve(esempio());
    const db = window.acDb;
    const riep = timeout(db.rpc("magazine_riepilogo", { p_dal: dal() }), 25000);
    const isc = timeout(db.from("magazine_iscritti").select("mail, comune, citta_rete, creato").order("creato", { ascending: false }).limit(5000), 25000);
    const vecchi = timeout(db.from("richieste_iscrizione").select("dati, created_at").eq("dati->>modulo", "magazine-avvisi").order("created_at", { ascending: false }).limit(5000), 25000);
    return Promise.all([riep, isc, vecchi]).then(([r, i, v]) => {
      const tabella = !manca(r.error) && !manca(i.error);
      if (r.error && !manca(r.error)) throw new Error(r.error.message);
      const lista = (i.data || []).map((x) => Object.assign({ fonte: "tabella" }, x));
      const viste = {};
      lista.forEach((x) => { viste[(x.mail || "").toLowerCase()] = 1; });
      (v.data || []).forEach((x) => {
        const d = x.dati || {};
        const mail = String(d.Mail || d.mail || "").toLowerCase();
        if (!mail || viste[mail]) return;
        viste[mail] = 1;
        lista.push({ mail: mail, comune: d.Comune || "", citta_rete: d.Citta_rete || "", creato: x.created_at, fonte: "richieste" });
      });
      lista.sort((a, b) => String(b.creato).localeCompare(String(a.creato)));
      return { riepilogo: r.data || null, iscritti: lista, tabella: tabella };
    });
  }

  /* ---------- pezzi grafici (SVG/HTML semplici, valori al passaggio del mouse) ---------- */
  function barreGiorni(giorni) {
    if (!giorni.length) return html`<p class="note">Nessun lettore nel periodo.</p>`;
    const W = 640, H = 170, pad = { l: 34, r: 8, t: 10, b: 24 };
    const max = Math.max(1, ...giorni.map((g) => g.lettori));
    const passo = scala(max);
    const top = Math.ceil(max / passo) * passo;
    const bw = (W - pad.l - pad.r) / giorni.length;
    const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
    let s = "";
    for (let v = 0; v <= top; v += passo) {
      s += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="mga-grid"/>' +
        '<text x="' + (pad.l - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end" class="mga-ax">' + n0(v) + "</text>";
    }
    const ogni = Math.ceil(giorni.length / 8);
    giorni.forEach((g, i) => {
      const x = pad.l + i * bw + Math.max(1, bw * 0.14);
      const w = Math.max(2, bw * 0.72);
      const h = Math.max(0, H - pad.b - y(g.lettori));
      const d = new Date(g.giorno + "T12:00:00");
      const etich = d.getDate() + "/" + (d.getMonth() + 1);
      s += '<g class="mga-hit" data-tip="' + etich + " · " + n0(g.lettori) + ' lettori"><rect x="' + (pad.l + i * bw) + '" y="' + pad.t + '" width="' + bw + '" height="' + (H - pad.t - pad.b) + '" fill="transparent"/>' +
        '<path class="mga-bar" d="' + barra(x, H - pad.b, w, h) + '"/></g>';
      if (i % ogni === 0) s += '<text x="' + (x + w / 2) + '" y="' + (H - 8) + '" text-anchor="middle" class="mga-ax">' + etich + "</text>";
    });
    return raw('<svg class="mga-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Lettori al giorno">' + s + "</svg>");
  }
  // barra con l'estremità superiore arrotondata (4px) e la base dritta sull'asse
  function barra(x, base, w, h) {
    if (h <= 0) return "";
    const r = Math.min(4, w / 2, h);
    return "M" + x + " " + base + "V" + (base - h + r) + "Q" + x + " " + (base - h) + " " + (x + r) + " " + (base - h) +
      "H" + (x + w - r) + "Q" + (x + w) + " " + (base - h) + " " + (x + w) + " " + (base - h + r) + "V" + base + "Z";
  }
  function scala(max) {
    const grezzo = max / 4;
    const p = Math.pow(10, Math.floor(Math.log10(grezzo || 1)));
    const m = grezzo / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  }
  // righe con barra orizzontale: [{etichetta, valore, nota}]
  function righe(lista, totale, opz) {
    if (!lista.length) return html`<p class="note">${(opz && opz.vuoto) || "Ancora nessun dato."}</p>`;
    const max = Math.max(1, ...lista.map((x) => x.valore));
    return html`<div class="mga-rows">${lista.map((x) => html`
      <div class="mga-row" data-tip="${x.etichetta + " · " + n0(x.valore) + (totale ? " (" + pct(x.valore, totale) + "%)" : "")}">
        <span class="l">${x.etichetta}</span>
        <span class="t"><i style="${"width:" + Math.max(2, (x.valore / max) * 100).toFixed(1) + "%"}"></i></span>
        <b>${n0(x.valore)}</b>${totale ? html`<small>${pct(x.valore, totale)}%</small>` : ""}
      </div>`)}</div>`;
  }

  /* ---------- pagina ---------- */
  function disegna(el, d) {
    const r = d.riepilogo || { lettori: 0, pagine_viste: 0, azioni: {}, per_giorno: [], per_pagina: [], citta: [], dispositivi: {}, provenienze: [], condivisioni: [] };
    const L = Number(r.lettori) || 0;
    const az = r.azioni || {};
    const perPag = {};
    (r.per_pagina || []).forEach((x) => { perPag[x.pagina] = x.lettori; });
    const ultima = PAGINE_N1.length - 1;
    const inFondo = perPag[ultima] || 0;
    const condTot = (r.condivisioni || []).reduce((a, x) => a + (Number(x.volte) || 0), 0);
    const filtro = ui.cerca.trim().toLowerCase();
    const iscritti = d.iscritti.filter((x) => !filtro || (x.mail + " " + x.comune + " " + x.citta_rete).toLowerCase().indexOf(filtro) >= 0);

    el.innerHTML = html`
      ${!d.tabella ? html`<div class="card mga-avviso"><strong>Le statistiche partono quando c’è la tabella su Supabase.</strong>
        <span>Il tecnico deve applicare il file <code>supabase/migrations/20261009170000_magazine_statistiche.sql</code>. Intanto qui sotto vedi gli iscritti agli avvisi già arrivati.</span></div>` : ""}
      ${DEMO ? html`<div class="card mga-avviso demo"><strong>Anteprima con dati di esempio.</strong><span>Online vedrai i numeri veri della rivista.</span></div>` : ""}
      <div class="mga-bar-top">
        <div class="tabs" role="tablist" aria-label="Periodo">${PERIODI.map((p) => html`<button type="button" class="tab${ui.periodo === p[0] ? " on" : ""}" data-periodo="${p[0]}" role="tab" aria-selected="${ui.periodo === p[0] ? "true" : "false"}">${p[1]}</button>`)}</div>
        <span class="note">AncheCasa Magazine · N. 1</span>
      </div>

      <div class="kpis kpis-3 mga-kpis">
        <div class="kpi"><span class="ico navy">${icon("team", 18)}</span><span><strong>${n0(L)}</strong><small>Lettori</small><small class="kpi-sub">persone che hanno aperto la rivista</small></span></div>
        <div class="kpi"><span class="ico blue">${icon("doc", 18)}</span><span><strong>${L ? (r.pagine_viste / L).toLocaleString("it-IT", { maximumFractionDigits: 1 }) : "0"}</strong><small>Pagine a testa</small><small class="kpi-sub">${pct(inFondo, L)}% arriva fino al retro</small></span></div>
        <div class="kpi"><span class="ico orange">${icon("pulse", 18)}</span><span><strong>${n0(az.bollette_uso)}</strong><small>Check Bollette</small><small class="kpi-sub">${n0(az.bollette_pdf)} report PDF · ${n0(az.offerte)} su «Confronta offerte»</small></span></div>
        <div class="kpi"><span class="ico soft">${icon("send", 18)}</span><span><strong>${n0(condTot)}</strong><small>Condivisioni</small><small class="kpi-sub">${n0(az.condividi)} persone hanno condiviso</small></span></div>
        <div class="kpi"><span class="ico navy">${icon("star", 18)}</span><span><strong>${n0(d.iscritti.length)}</strong><small>Iscritti agli avvisi</small><small class="kpi-sub">${n0(r.iscritti)} nel periodo</small></span></div>
        <div class="kpi"><span class="ico blue">${icon("chart", 18)}</span><span><strong>${pct((r.dispositivi || {}).telefono || 0, L)}%</strong><small>Da telefono</small><small class="kpi-sub">${pct((r.dispositivi || {}).pc || 0, L)}% da PC</small></span></div>
      </div>

      <div class="grid-2">
        <div class="card"><h2>Lettori al giorno</h2>${barreGiorni(r.per_giorno || [])}</div>
        <div class="card"><h2>Da dove arrivano</h2>
          ${righe((r.provenienze || []).map((x) => ({ etichetta: nomeProvenienza(x.nome), valore: x.lettori })), L)}
          <p class="note mga-nota">I link condivisi dalla rivista portano «?da=whatsapp», «?da=facebook»…: così si vede quale canale porta lettori.</p>
        </div>
      </div>

      <div class="card mga-funnel"><h2>Fino a dove leggono</h2>
        <p class="note">Quante persone hanno visto ogni pagina. Dove la barra cala di colpo, la gente chiude la rivista.</p>
        ${righe(PAGINE_N1.map((nome, i) => ({ etichetta: i + " · " + nome, valore: perPag[i] || 0 })), L, { vuoto: "Ancora nessuna pagina vista." })}
      </div>

      <div class="grid-eq">
        <div class="card"><h2>Città</h2>
          ${righe((r.citta || []).map((x) => ({ etichetta: x.nome, valore: x.lettori })), L)}
          <p class="note mga-nota">Ricavata dalla connessione: è la città del fornitore internet, non sempre quella esatta. L’indirizzo IP non viene salvato.</p>
        </div>
        <div class="card"><h2>Cosa fanno</h2>
          ${righe(Object.keys(AZIONI).map((k) => ({ etichetta: AZIONI[k], valore: az[k] || 0 })), L)}
          <h2 class="mga-h2b">Condivisioni per canale</h2>
          ${righe((r.condivisioni || []).map((x) => ({ etichetta: nomeCanale(x.canale), valore: x.volte })), 0, { vuoto: "Ancora nessuna condivisione." })}
          <h2 class="mga-h2b">Dispositivi</h2>
          ${righe(Object.keys(r.dispositivi || {}).map((k) => ({ etichetta: DISP[k] || k, valore: r.dispositivi[k] })), L)}
        </div>
      </div>

      <div class="card mga-iscritti">
        <div class="mga-isc-head">
          <h2>Iscritti agli avvisi <span class="tag closed">${n0(d.iscritti.length)}</span></h2>
          <div class="mga-isc-tools">
            <input type="search" id="mga-cerca" placeholder="Cerca mail o comune" value="${ui.cerca}" aria-label="Cerca negli iscritti">
            <button type="button" class="btn-in" id="mga-csv" ${d.iscritti.length ? "" : "disabled"}>Scarica per Excel</button>
          </div>
        </div>
        <p class="note">Chi ha chiesto di essere avvisato quando esce l’app della raccolta e a ogni nuovo numero. Hanno accettato l’informativa privacy.</p>
        ${iscritti.length
          ? html`<div class="table-scroll"><table class="mini-table"><thead><tr><th>Mail</th><th>Comune</th><th>Città (rete)</th><th class="num">Iscritto il</th></tr></thead><tbody>
              ${iscritti.slice(0, 300).map((x) => html`<tr><td><a href="${"mailto:" + x.mail}">${x.mail}</a></td><td>${x.comune || "-"}</td><td>${x.citta_rete || "-"}</td><td class="num">${dataIt(x.creato)}</td></tr>`)}
            </tbody></table></div>
            ${iscritti.length > 300 ? html`<p class="note">Mostrati i primi 300: scarica il file per l’elenco completo.</p>` : ""}`
          : html`<p class="note">${filtro ? "Nessun iscritto corrisponde alla ricerca." : "Ancora nessun iscritto."}</p>`}
      </div>
      <div class="mga-tip" role="tooltip" hidden></div>`.s;

    el.querySelectorAll("[data-periodo]").forEach((b) => b.addEventListener("click", () => {
      ui.periodo = b.getAttribute("data-periodo");
      V.magazine.render(el);
    }));
    const cerca = el.querySelector("#mga-cerca");
    cerca.addEventListener("input", () => {
      ui.cerca = cerca.value;
      const pos = cerca.selectionStart;
      disegna(el, d);
      const c2 = el.querySelector("#mga-cerca");
      c2.focus();
      try { c2.setSelectionRange(pos, pos); } catch (e) { /* input search */ }
    });
    el.querySelector("#mga-csv").addEventListener("click", () => scaricaCsv(d.iscritti));
    tooltip(el);
  }

  function nomeProvenienza(n) {
    const m = { whatsapp: "WhatsApp", facebook: "Facebook", telegram: "Telegram", email: "Email", link: "Link copiato", condiviso: "Condiviso dal telefono", diretto: "Diretto / app", "sito anchecasa": "Sito AncheCasa", "google.com": "Google", "l.facebook.com": "Facebook", "m.facebook.com": "Facebook", "instagram.com": "Instagram", "l.instagram.com": "Instagram" };
    return m[n] || n;
  }
  function nomeCanale(c) {
    const m = { whatsapp: "WhatsApp", facebook: "Facebook", telegram: "Telegram", email: "Email", "link copiato": "Link copiato", "menu telefono": "Menu del telefono", menu: "Menu" };
    return m[c] || c;
  }

  function tooltip(el) {
    const tip = el.querySelector(".mga-tip");
    let cur = null;
    el.addEventListener("pointermove", (e) => {
      const t = e.target.closest("[data-tip]");
      if (t !== cur) {
        if (cur) cur.classList.remove("is-hover");
        cur = t;
        if (!t) { tip.hidden = true; return; }
        t.classList.add("is-hover");
        tip.textContent = t.getAttribute("data-tip");
        tip.hidden = false;
      }
      if (cur) {
        const x = Math.min(window.innerWidth - tip.offsetWidth - 8, e.clientX + 14);
        tip.style.left = Math.max(8, x) + "px";
        tip.style.top = (e.clientY - tip.offsetHeight - 10) + "px";
      }
    });
    el.addEventListener("pointerleave", () => { if (cur) cur.classList.remove("is-hover"); cur = null; tip.hidden = true; });
  }

  function scaricaCsv(lista) {
    const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const righe = [["Mail", "Comune", "Citta (rete)", "Iscritto il"].map(q).join(";")]
      .concat(lista.map((x) => [x.mail, x.comune, x.citta_rete, dataIt(x.creato)].map(q).join(";")));
    const blob = new Blob(["﻿" + righe.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "anchecasa-magazine-iscritti-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast("Elenco scaricato: si apre con Excel.");
  }

  V.magazine = {
    title: "Magazine",
    sub: "Lettori, pagine, Check Bollette, condivisioni, città e iscritti agli avvisi.",
    render(el) {
      if (!DEMO && !window.acDb) {
        el.innerHTML = html`<div class="card empty"><strong>Non riesco a leggere i dati</strong><span>Supabase non è disponibile in questa pagina.</span></div>`.s;
        return;
      }
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      carica().then((d) => disegna(el, d)).catch((err) => {
        el.innerHTML = html`<div class="card empty"><strong>Non riesco a leggere i dati</strong><span>${err.message || String(err)}</span></div>
          <div class="row-actions"><button type="button" class="tab" id="mga-riprova">Riprova</button></div>`.s;
        el.querySelector("#mga-riprova").addEventListener("click", () => V.magazine.render(el));
      });
    }
  };
})();
