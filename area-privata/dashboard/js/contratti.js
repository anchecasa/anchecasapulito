/* Contratti, firme e clienti da affidare (10.10.2026).
   11.10.2026: i contratti con modello in contratti-modelli.js si compilano e si firmano qui (contratto-firma.js).
   Stessa logica di app-anchecasa/js/viste-documenti.js e di sql/app-07-regole-clienti-documenti.sql.
   Le firme si scrivono solo con rpc app_firma_documento. */
(function () {
  const AC = (window.AC = window.AC || {});
  const ui = () => AC.ui;
  const MANCA = "Manca app-07 su Supabase: eseguire app-anchecasa/sql/app-07-regole-clienti-documenti.sql";
  const GIA_COLLEGA = "Questo cliente è già registrato da un collega: è suo.";
  const TESTO_AFFIDA = "Clienti di AncheCasa: chi li segue prende metà della quota di chi porta; niente quote di sviluppo, capo area e Rete Italia. Deve chiamarli entro 48 ore.";
  const ORDINE = ["reteitalia", "sviluppo", "capoarea", "agente", "subagente"];
  const RUOLI = { reteitalia: "Responsabile Rete Italia", sviluppo: "Responsabile sviluppo rete", capoarea: "Capo area", agente: "Agente", subagente: "Sub-agente" };
  const TIPI_DOC = { contratto: "Contratto", regolamento: "Regolamento", circolare: "Circolare", altro: "Documento" };
  const COSA = { modulo: "Modulo dell'app", pacchetto: "Pacchetto Impresa completa", corso: "Corso AncheSicura", servizio: "Servizio AncheSicura", supermastro: "SuperMastro per artigiani", ristrutturazione: "Lavoro o cantiere", altro: "Altro" };
  const CONTRATTI_PDF = [
    ["Responsabile Rete Italia", "docs/AncheCasa-5Contratto-Responsabile-Rete-Italia.pdf"],
    ["Responsabile sviluppo rete", "docs/AncheCasa-1Contratto-Assistente-Sviluppo-Rete.pdf"],
    ["Capo area", "docs/AncheCasa-2Contratto-Capo-Area.pdf"],
    ["Agente", "docs/AncheCasa-3Contratto-Agente.pdf"],
    ["Sub-agente", "docs/AncheCasa-4Contratto-Subagente.pdf"]
  ];
  const ALTRI_PDF = [
    ["Regolamento", "docs/AncheCasa-Regolamento-della-rete.pdf"],
    ["Circolare 1/2026", "docs/AncheCasa-Circolare-1-2026-Nuove-regole.pdf"]
  ];
  const CONTO = {
    agente: { label: "Aziende che porti", k: 0.35 * 0.70, nota: "70% della quota della rete" },
    subagente: { label: "Aziende che porti", k: 0.35 * 0.70 * 0.70, nota: "70% della quota di chi porta" },
    capoarea: { label: "Aziende della tua linea e della tua regione", k: 0.35 * 0.08, nota: "8% della quota della rete" },
    sviluppo: { label: "Aziende della tua linea", k: 0.35 * 0.17, nota: "17% della quota della rete" },
    reteitalia: { label: "Aziende di tutta Italia", k: 0.35 * 0.05, nota: "5% della quota della rete" }
  };
  const REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];

  let box = null;
  let pagina = "";
  let docId = "";
  let ruoloVisto = "";
  let io = null;
  let occupato = false;

  function html(strings, ...vals) { return ui().html(strings, ...vals); }
  function toast(msg, kind) { ui().toast(msg, kind); }
  function db() { return window.acDb; }
  function euro(n) {
    const x = Number(n) || 0;
    return x.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: x % 1 ? 2 : 0 });
  }
  function quando(x) {
    const d = new Date(x);
    return isNaN(d.getTime()) ? "" : d.toLocaleString("it-IT");
  }
  function testi() { return AC.testiRete || { VERSIONE_REGOLE: "", RUOLI_TESTI: {}, REGOLE: [] }; }

  function mancaErrore(err) {
    if (!err) return false;
    const t = String(err.code || "") + " " + String(err.message || "") + " " + String(err.details || "");
    return /PGRST202|PGRST205|42P01|42883|schema cache|does not exist|Could not find the/i.test(t);
  }

  function spiega(err) {
    const m = String((err && (err.message || err.details)) || err || "");
    if (mancaErrore(err) || /app_documenti|app_firme|app_firma_documento|app_cliente_libero|app_vendite|app_rete/.test(m)) return MANCA;
    if (/gia_firmato/.test(m)) return "Hai già firmato questo documento.";
    if (/cliente_di_un_collega/.test(m)) return GIA_COLLEGA;
    if (/solo_admin_affida/.test(m)) return "Solo l'admin affida i clienti di AncheCasa.";
    if (/documento_non_trovato/.test(m)) return "Documento non trovato.";
    if (/documento_senza_firma/.test(m)) return "Questo documento non si firma.";
    return m || "Non riesco a completare.";
  }

  function conTempo(p) {
    return Promise.race([
      Promise.resolve(p),
      new Promise((resolve) => setTimeout(() => resolve({ error: { message: "il server non risponde" } }), 25000))
    ]);
  }

  function cartaManca() {
    return html`<div class="card"><p>${MANCA}</p></div>`;
  }

  function titolo(t, sub) {
    const h = document.getElementById("page-title");
    const s = document.getElementById("page-sub");
    if (h) h.textContent = t;
    if (s) s.textContent = sub || "";
  }

  async function utenteId() {
    try {
      const s = await db().auth.getSession();
      return (s && s.data && s.data.session && s.data.session.user && s.data.session.user.id) || "";
    } catch (e) { return ""; }
  }

  async function prepara() {
    if (io) return;
    const uid = await utenteId();
    if (!uid) { io = {}; return; }
    const res = await conTempo(db().from("app_rete").select("ruolo, stato, nome, regione").eq("utente", uid).maybeSingle());
    if (!res || res.error) { io = {}; return; }
    io = res.data && res.data.stato === "attivo" ? res.data : {};
  }

  function grigliaPdf(lista) {
    return html`<div class="doc-griglia">${lista.map(([nome, href]) => html`<a class="doc-tile" href="${href}" target="_blank" rel="noopener"><b>${nome}</b><small>Apri il PDF</small></a>`)}</div>`;
  }

  function orePassate(x) {
    const t = new Date(x && x.creato).getTime();
    if (!t) return 0;
    return Math.floor((Date.now() - t) / 36e5);
  }

  // 11.10.2026: con app-14 le firme dei contratti compilati hanno anche «dati». Senza app-14 si legge come prima.
  async function firmeCon(colonne, filtro) {
    let res = await conTempo(filtro(db().from("app_firme").select(colonne + ", dati")));
    if (res && res.error && /42703|dati/i.test(String(res.error.code || "") + " " + String(res.error.message || ""))) {
      res = await conTempo(filtro(db().from("app_firme").select(colonne)));
    }
    return res;
  }

  async function caricaFirmeMie() {
    const uid = await utenteId();
    if (!uid) return [];
    const res = await firmeCon("documento, nome, firma, impronta, dispositivo, firmato", (q) => q.eq("utente", uid).limit(500));
    if (!res || res.error) return [];
    return res.data || [];
  }

  async function impronta(d) {
    try {
      let buf;
      if (d && d.file) {
        const r = await fetch(d.file, { cache: "no-store" });
        if (!r.ok) throw new Error("pdf");
        buf = await r.arrayBuffer();
      } else {
        buf = new TextEncoder().encode(((d && d.titolo) || "") + "\n" + ((d && d.testo) || "")).buffer;
      }
      const h = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { return ""; }
  }

  function legaFirme(el) {
    el.querySelectorAll("canvas.firma").forEach((c) => {
      const ctx = c.getContext("2d");
      const pr = window.devicePixelRatio || 1;
      const w = c.clientWidth || 300;
      const h = 150;
      c.width = w * pr;
      c.height = h * pr;
      ctx.scale(pr, pr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#2A3C54";
      const hid = c.parentElement.querySelector("input[type=hidden]");
      let giu = false;
      const pos = (e) => {
        const b = c.getBoundingClientRect();
        return [e.clientX - b.left, e.clientY - b.top];
      };
      c.addEventListener("pointerdown", (e) => {
        giu = true;
        c.setPointerCapture(e.pointerId);
        ctx.beginPath();
        ctx.moveTo(...pos(e));
        e.preventDefault();
      });
      c.addEventListener("pointermove", (e) => {
        if (!giu) return;
        ctx.lineTo(...pos(e));
        ctx.stroke();
      });
      const fine = () => {
        if (!giu) return;
        giu = false;
        hid.value = c.toDataURL("image/png");
      };
      c.addEventListener("pointerup", fine);
      c.addEventListener("pointercancel", fine);
      const canc = c.parentElement.querySelector("[data-cancella-firma]");
      if (canc) canc.addEventListener("click", () => { ctx.clearRect(0, 0, w, h); hid.value = ""; });
    });
  }

  function apriRicevuta(d, f) {
    const w = window.open("", "_blank");
    if (!w) { toast("Il browser ha bloccato la finestra: consenti i popup e riprova.", "errore"); return; }
    const base = location.origin + location.pathname.replace(/[^/]*$/, "");
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const file = d.file ? String(d.file).split("/").pop() : "";
    w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ricevuta di firma · ${esc(d.titolo)}</title>
      <style>@page{size:A4;margin:0}body{margin:0;font-family:Arial,sans-serif;color:#1A2432}.p{max-width:190mm;margin:0 auto}header{background:#2A3C54;color:#fff;padding:12mm 14mm;display:flex;justify-content:space-between;align-items:center}header img{height:12mm}.f{height:3mm;background:#E56B10}main{padding:10mm 14mm}h1{color:#2A3C54;font-size:19pt;margin:0 0 6mm}dl{display:grid;grid-template-columns:45mm 1fr;gap:3mm 6mm;font-size:11pt}dt{color:#5b6b80}dd{margin:0;word-break:break-all}.firma{border:1px solid #dfe6ef;border-radius:3mm;padding:4mm;margin-top:6mm;text-align:center}.firma img{max-width:100%;height:35mm;object-fit:contain}.n{font-size:9pt;color:#5b6b80;margin-top:8mm}button{position:fixed;right:12px;bottom:12px;background:#E56B10;color:#fff;border:0;border-radius:999px;padding:12px 18px;font-size:15px}@media print{button{display:none}}</style></head><body><div class="p">
      <header><img src="${base}img/carta-logo-bianco.png" alt="AncheCasa"><span>Ricevuta di firma</span></header><div class="f"></div><main><h1>${esc(d.titolo)}</h1>
      <dl><dt>Firmato da</dt><dd>${esc(f.nome)}</dd><dt>Data e ora</dt><dd>${esc(quando(f.firmato))}</dd><dt>Documento</dt><dd>${esc(TIPI_DOC[d.tipo] || "")}${d.versione ? ", versione " + esc(d.versione) : ""}</dd>${file ? `<dt>File</dt><dd>${esc(file)}</dd>` : ""}<dt>Impronta SHA-256</dt><dd>${esc(f.impronta || "–")}</dd><dt>Dispositivo</dt><dd>${esc(f.dispositivo || "–")}</dd></dl>
      <div class="firma"><img src="${esc(f.firma)}" alt="Firma"></div>
      <p class="n">Firma raccolta su AncheCasa. L'impronta SHA-256 identifica esattamente il documento firmato. Palumbo Investment S.r.l. · AncheCasa · anchecasa.it</p></main></div><button onclick="print()">Salva in PDF</button></body></html>`);
    w.document.close();
  }

  async function paginaContratti() {
    titolo("Contratti", "I contratti della rete, chi ha firmato, le circolari.");
    const pdf = html`
      <h2 class="rp-nome-h">Contratti</h2>
      ${grigliaPdf(CONTRATTI_PDF)}
      <p class="note">Versione 11.10.2026 dell'Allegato B: da far vedere all'avvocato, non firmabile. Chi ha firmato la versione 10.10.2026 resta su quella.</p>
      <div class="doc-griglia">${CONTRATTI_PDF.map(([nome, href]) => html`<button type="button" class="doc-tile" data-bozza="${"bozza-1110/" + href}"><b>${nome} · 11.10.2026</b><small>Da far vedere all'avvocato, non firmabile</small></button>`)}</div>
      <div class="doc-griglia" style="margin-top:12px">${ALTRI_PDF.map(([nome, href]) => html`<a class="doc-tile" href="${href}" target="_blank" rel="noopener"><b>${nome}</b><small>Apri il PDF</small></a>`)}</div>`;
    if (docId) { await dettaglioAdmin(pdf); return; }
    const [dRes, fRes, rRes] = await Promise.all([
      conTempo(db().from("app_documenti").select("id, tipo, titolo, testo, file, ruoli, richiede_firma, versione, attivo, pubblicato").order("pubblicato", { ascending: false }).limit(500)),
      conTempo(db().from("app_firme").select("id, documento, utente, nome, firma, impronta, firmato").limit(5000)),
      conTempo(db().from("app_rete").select("utente, nome, codice, ruolo, stato, regione").limit(2000))
    ]);
    const err = (dRes && dRes.error) || (fRes && fRes.error) || (rRes && rRes.error);
    if (err && mancaErrore(err)) {
      box.innerHTML = html`${pdf}<div style="height:16px"></div>${cartaManca()}`.s;
      return;
    }
    if (err) {
      box.innerHTML = html`${pdf}<div class="card" style="margin-top:16px"><p>${spiega(err)}</p></div>`.s;
      return;
    }
    const d = dRes.data || [];
    const f = fRes.data || [];
    const rete = rRes.data || [];
    const attivi = rete.filter((r) => r.stato === "attivo");
    const devono = (x) => attivi.filter((r) => !(x.ruoli || []).length || (x.ruoli || []).includes(r.ruolo));
    box.innerHTML = html`
      ${pdf}
      <h2 class="rp-nome-h" style="margin-top:22px">Chi ha firmato</h2>
      ${d.length ? d.map((x) => {
        const n = f.filter((y) => y.documento === x.id).length;
        const tot = devono(x).length;
        const etichetta = x.richiede_firma ? "firmato da " + n + " su " + tot : "da leggere";
        const per = (x.ruoli || []).length ? (x.ruoli || []).map((r) => RUOLI[r] || r).join(", ") : "tutta la rete";
        return html`<button type="button" class="card dir-riga" data-doc="${x.id}"><b>${x.titolo}</b><p class="note">${TIPI_DOC[x.tipo] || ""} · ${per} · ${etichetta}${x.attivo ? "" : " · non attivo"}</p></button>`;
      }) : html`<p class="note">Nessun documento.</p>`}
      <h2 class="rp-nome-h" style="margin-top:22px">Nuova circolare</h2>
      <form class="card" id="doc-nuovo" novalidate>
        <label>Tipo
          <select name="tipo">
            <option value="circolare">Circolare</option>
            <option value="regolamento">Regolamento</option>
            <option value="contratto">Contratto</option>
            <option value="altro">Altro documento</option>
          </select>
        </label>
        <label>Titolo <input name="titolo" maxlength="160" required placeholder="Es. Circolare n. 2/2026"></label>
        <label>Testo <textarea name="testo" rows="6" maxlength="20000" placeholder="Il testo che leggono e firmano"></textarea></label>
        <label>PDF (facoltativo) <input name="file" maxlength="200" placeholder="docs/nome-del-file.pdf"></label>
        <p class="note">Il PDF va messo prima nella cartella docs della dashboard. Nessuna spunta = tutta la rete.</p>
        <div class="doc-ruoli">${ORDINE.map((r) => html`<label><input type="checkbox" name="${"r_" + r}"> ${RUOLI[r]}</label>`)}</div>
        <label class="doc-spunta"><input type="checkbox" name="firma" checked> Da firmare</label>
        <button class="btn-in" type="submit">Pubblica</button>
      </form>
      <p class="note">Chi deve leggerlo riceve l'avviso e lo trova in Documenti.</p>`.s;
    const form = box.querySelector("#doc-nuovo");
    if (form) form.addEventListener("submit", pubblica);
    box.querySelectorAll("[data-doc]").forEach((b) => b.addEventListener("click", () => { docId = b.getAttribute("data-doc"); disegna(); }));
  }

  async function dettaglioAdmin(pdf) {
    const [dRes, fRes, rRes] = await Promise.all([
      conTempo(db().from("app_documenti").select("id, tipo, titolo, testo, file, ruoli, richiede_firma, versione, attivo, pubblicato").eq("id", docId).maybeSingle()),
      firmeCon("id, documento, utente, nome, firma, impronta, dispositivo, firmato", (q) => q.eq("documento", docId).limit(2000)),
      conTempo(db().from("app_rete").select("utente, nome, codice, ruolo, stato").limit(2000))
    ]);
    const err = (dRes && dRes.error) || (fRes && fRes.error) || (rRes && rRes.error);
    if (err) {
      box.innerHTML = html`${pdf}<div style="height:16px"></div><div class="card"><p>${spiega(err)}</p></div>`.s;
      return;
    }
    const d = dRes.data;
    if (!d) {
      box.innerHTML = html`${pdf}<p class="note">Documento non trovato.</p>`.s;
      docId = "";
      return;
    }
    titolo("Contratti", d.titolo);
    const firme = fRes.data || [];
    const rete = rRes.data || [];
    const chi = (u) => rete.find((r) => r.utente === u) || {};
    const devono = rete.filter((r) => r.stato === "attivo" && (!(d.ruoli || []).length || (d.ruoli || []).includes(r.ruolo)));
    const mancano = devono.filter((r) => !firme.some((x) => x.utente === r.utente));
    const per = (d.ruoli || []).length ? (d.ruoli || []).map((r) => RUOLI[r] || r).join(", ") : "tutta la rete";
    box.innerHTML = html`
      <button type="button" class="btn-ghost" id="doc-indietro">Tutti i documenti</button>
      <div class="card" style="margin-top:12px">
        <p class="note">${TIPI_DOC[d.tipo] || ""} · ${per}${d.versione ? " · versione " + d.versione : ""}</p>
        ${d.testo ? html`<p style="white-space:pre-line">${d.testo}</p>` : ""}
        ${d.file ? html`<p><a class="btn-ghost" href="${d.file}" target="_blank" rel="noopener">Apri il PDF</a></p>` : ""}
      </div>
      <div class="kpis" style="margin-top:12px">
        <div class="kpi"><span><strong>${firme.length}</strong><small>Hanno firmato</small></span></div>
        <div class="kpi"><span><strong>${mancano.length}</strong><small>Devono ancora firmare</small></span></div>
      </div>
      ${d.richiede_firma && mancano.length ? html`<h2 class="rp-nome-h">Devono ancora firmare</h2>${mancano.map((r) => html`<div class="card dir-riga"><b>${r.nome || r.codice || "Senza nome"}</b><p class="note">${RUOLI[r.ruolo] || r.ruolo || ""}</p></div>`)}` : ""}
      ${firme.length ? html`<h2 class="rp-nome-h">Firme ricevute</h2>${firme.map((x) => html`<div class="card" style="margin-top:8px"><b>${x.nome}</b><p class="note">${RUOLI[chi(x.utente).ruolo] || ""} · ${quando(x.firmato)}</p><img class="doc-firma-img" src="${x.firma}" alt="Firma"><p class="note">Impronta ${x.impronta || "–"}</p><button type="button" class="btn-ghost" data-ricevuta="${x.utente}">Ricevuta</button></div>`)}` : ""}
      <p style="margin-top:14px"><button type="button" class="btn-ghost" id="doc-attivo">${d.attivo ? "Togli dalla cartella" : "Rimetti nella cartella"}</button></p>
      <p class="note">Le firme non si cancellano: restano come prova di cosa ha firmato ciascuno.</p>`.s;
    box.querySelector("#doc-indietro").addEventListener("click", () => { docId = ""; disegna(); });
    const tog = box.querySelector("#doc-attivo");
    if (tog) tog.addEventListener("click", () => cambiaAttivo(d));
    box.querySelectorAll("[data-ricevuta]").forEach((b) => b.addEventListener("click", () => {
      const f = firme.find((x) => x.utente === b.getAttribute("data-ricevuta"));
      if (!f) return;
      // Contratto compilato nell'app: si apre il contratto firmato con i dati; altrimenti la ricevuta di sempre.
      if (f.dati && Object.keys(f.dati).length && AC.contrattoFirma && AC.contrattoFirma.apriCopia(d, f)) return;
      apriRicevuta(d, f);
    }));
  }

  async function cambiaAttivo(d) {
    if (occupato) return;
    occupato = true;
    const res = await conTempo(db().from("app_documenti").update({ attivo: !d.attivo }).eq("id", d.id));
    occupato = false;
    if (!res || res.error) { toast(spiega(res && res.error), "errore"); return; }
    toast("Fatto.");
    disegna();
  }

  async function pubblica(ev) {
    ev.preventDefault();
    const f = ev.target;
    if (f.titolo.value.trim().length < 3) { toast("Scrivi il titolo.", "errore"); return; }
    if (!f.testo.value.trim() && !f.file.value.trim()) { toast("Scrivi il testo o l'indirizzo del PDF.", "errore"); return; }
    const ruoli = ORDINE.filter((r) => f["r_" + r] && f["r_" + r].checked);
    const btn = f.querySelector("button[type=submit]");
    if (btn) btn.disabled = true;
    const res = await conTempo(db().from("app_documenti").insert({
      tipo: f.tipo.value,
      titolo: f.titolo.value.trim(),
      testo: f.testo.value.trim(),
      file: f.file.value.trim(),
      ruoli: ruoli,
      richiede_firma: f.firma.checked,
      versione: new Date().toLocaleDateString("it-IT")
    }));
    if (btn && btn.isConnected) btn.disabled = false;
    if (!res || res.error) { toast(spiega(res && res.error), "errore"); return; }
    toast("Pubblicato.");
    disegna();
  }

  async function paginaAffida() {
    titolo("Clienti da affidare", "Clienti di AncheCasa da seguire entro 48 ore.");
    const testa = html`<div class="card"><p>${TESTO_AFFIDA}</p></div>`;
    const [vRes, rRes] = await Promise.all([
      conTempo(db().from("app_vendite").select("id, venditore, cliente_nome, cliente_piva, cliente_contatto, cosa, dettaglio, importo, tipo_importo, stato, creato, affidato").eq("affidato", true).order("creato", { ascending: false }).limit(500)),
      conTempo(db().from("app_rete").select("utente, nome, codice, ruolo, stato, regione").eq("stato", "attivo").limit(2000))
    ]);
    const err = (vRes && vRes.error) || (rRes && rRes.error);
    if (err && mancaErrore(err)) {
      box.innerHTML = html`${testa}<div style="height:12px"></div>${cartaManca()}`.s;
      return;
    }
    if (err) {
      box.innerHTML = html`${testa}<div class="card" style="margin-top:12px"><p>${spiega(err)}</p></div>`.s;
      return;
    }
    const vendite = vRes.data || [];
    const rete = rRes.data || [];
    const opz = (sel) => html`<option value="">Scegli…</option>${rete.map((r) => html`<option value="${r.utente}" ${r.utente === sel ? "selected" : ""}>${(r.nome || r.codice || "Senza nome")} · ${RUOLI[r.ruolo] || r.ruolo}${r.regione ? " · " + r.regione : ""}</option>`)}`;
    const aperti = vendite.filter((x) => x.stato === "proposta");
    box.innerHTML = html`
      ${testa}
      <form class="card" id="doc-affida" style="margin-top:12px" novalidate>
        <label>Cliente <input name="cliente" required maxlength="120"></label>
        <div class="doc-due">
          <label>Partita IVA <input name="piva" maxlength="20" inputmode="numeric"></label>
          <label>Telefono o mail <input name="contatto" maxlength="120"></label>
        </div>
        <label>Regione <select name="regione"><option value="">—</option>${REGIONI.map((r) => html`<option>${r}</option>`)}</select></label>
        <label>Cosa ha chiesto <select name="cosa">${Object.keys(COSA).filter((k) => k !== "ristrutturazione").map((k) => html`<option value="${k}">${COSA[k]}</option>`)}</select></label>
        <label>Dettaglio <input name="dettaglio" maxlength="200" placeholder="Es. abbonamento Impresa"></label>
        <div class="doc-due">
          <label>Importo <input name="importo" type="number" min="0" step="0.01" value="0"></label>
          <label>È <select name="tipo"><option value="mese">al mese</option><option value="una_tantum">una volta</option></select></label>
        </div>
        <label>Affidalo a <select name="a" required>${opz("")}</select></label>
        <p class="note">Di solito chi lavora nella regione del cliente.</p>
        <button class="btn-in" type="submit">Affida il cliente</button>
      </form>
      ${aperti.length ? html`<h2 class="rp-nome-h">Affidati, da confermare</h2>${aperti.map((x) => {
        const ore = orePassate(x);
        return html`<div class="card" style="margin-top:8px"><b>${x.cliente_nome}</b> <span class="${ore > 48 ? "doc-tardi" : "note"}">${ore > 48 ? "oltre 48 ore" : ore + " ore"}</span><p class="note">${x.dettaglio || COSA[x.cosa] || ""} · ${euro(x.importo)}${x.tipo_importo === "mese" ? "/mese" : ""}</p><div class="doc-due"><select id="${"riaff-" + x.id}">${opz(x.venditore)}</select><button type="button" class="btn-ghost" data-riaff="${x.id}">Riassegna</button></div></div>`;
      })}` : ""}
      ${vendite.length ? html`<h2 class="rp-nome-h">Tutti gli affidati</h2>${vendite.map((x) => {
        const chi = rete.find((r) => r.utente === x.venditore);
        return html`<div class="card dir-riga"><b>${x.cliente_nome}</b><p class="note">${(chi && (chi.nome || chi.codice)) || ""} · ${quando(x.creato)}</p></div>`;
      })}` : ""}`.s;
    const form = box.querySelector("#doc-affida");
    if (form) form.addEventListener("submit", inviaAffida);
    box.querySelectorAll("[data-riaff]").forEach((b) => b.addEventListener("click", () => riassegna(b.getAttribute("data-riaff"))));
  }

  async function inviaAffida(ev) {
    ev.preventDefault();
    const f = ev.target;
    if (f.cliente.value.trim().length < 2) { toast("Scrivi il nome del cliente.", "errore"); return; }
    if (!f.a.value) { toast("Scegli a chi affidarlo.", "errore"); return; }
    const btn = f.querySelector("button[type=submit]");
    if (btn) btn.disabled = true;
    const res = await conTempo(db().from("app_vendite").insert({
      venditore: f.a.value,
      cliente_nome: f.cliente.value.trim(),
      cliente_tipo: "azienda",
      cliente_piva: f.piva.value.trim(),
      cliente_contatto: f.contatto.value.trim(),
      cliente_regione: f.regione.value,
      cosa: f.cosa.value,
      dettaglio: f.dettaglio.value.trim(),
      importo: Number(f.importo.value || 0),
      tipo_importo: f.tipo.value,
      affidato: true
    }));
    if (btn && btn.isConnected) btn.disabled = false;
    if (!res || res.error) { toast(spiega(res && res.error), "errore"); return; }
    toast("Affidato: ha 48 ore per chiamarlo.");
    disegna();
  }

  async function riassegna(id) {
    const s = document.getElementById("riaff-" + id);
    if (!s || !s.value) return;
    const res = await conTempo(db().from("app_vendite").update({ venditore: s.value }).eq("id", id));
    if (!res || res.error) { toast(spiega(res && res.error), "errore"); return; }
    toast("Riassegnato.");
    disegna();
  }

  function paginaRuolo() {
    const pack = testi();
    const ruoli = pack.RUOLI_TESTI || {};
    if (!ruoloVisto || !ruoli[ruoloVisto]) {
      titolo("Il mio ruolo", "Cosa fai e come guadagni.");
      const esempio = !io || !io.ruolo;
      box.innerHTML = html`
        ${esempio ? html`<p class="note">Esempio</p>` : ""}
        <p class="note">Scegli la figura per leggere cosa fa e come guadagna.</p>
        ${ORDINE.map((k) => html`<button type="button" class="card dir-riga" data-ruolo="${k}"><b>${(ruoli[k] && ruoli[k].nome) || RUOLI[k]}</b><p class="note">${(ruoli[k] && ruoli[k].breve) || ""}</p></button>`)}`.s;
      box.querySelectorAll("[data-ruolo]").forEach((b) => b.addEventListener("click", () => { ruoloVisto = b.getAttribute("data-ruolo"); disegna(); }));
      return;
    }
    const r = ruoli[ruoloVisto];
    const c = CONTO[ruoloVisto];
    const esempio = !io || io.ruolo !== ruoloVisto;
    titolo("Il mio ruolo", r.nome);
    box.innerHTML = html`
      ${esempio ? html`<p class="note">Esempio</p>` : ""}
      ${io && io.ruolo && io.ruolo !== ruoloVisto ? html`<button type="button" class="btn-ghost" id="doc-mio">Il mio ruolo</button>` : ""}
      <div class="card"><h2 class="rp-nome-h">${r.nome}</h2><p>${r.breve}</p><p><b>Rispondi a</b> ${r.risponde}</p><p><b>Hai sotto</b> ${r.sotto}</p></div>
      <h2 class="rp-nome-h">Cosa fai</h2>
      <div class="card"><ul class="doc-fai">${(r.fai || []).map((x) => html`<li>${x}</li>`)}</ul></div>
      <h2 class="rp-nome-h">Come guadagni</h2>
      ${(r.guadagni || []).map(([t, q, e]) => html`<div class="card" style="margin-top:8px"><b>${t}</b><p>${q}</p>${e ? html`<p class="note">Esempio: ${e}</p>` : ""}</div>`)}
      <p class="note">Esempi su 100 € di utile AncheCasa (servizi) e 10.000 € di utile (lavori): numeri di esempio, non promesse. Sui lavori le provvigioni maturano a tranche quando AncheCasa incassa: 30% firma, 30% metà lavori, 40% collaudo.</p>
      ${c ? html`<h2 class="rp-nome-h">Fai un conto (esempio)</h2><div class="card"><div class="doc-due"><label>${c.label} <input id="conto-n" type="number" min="0" step="1" value="10"></label><label>Utile AncheCasa al mese per azienda (€) <input id="conto-u" type="number" min="0" step="1" value="30"></label></div><p>Ogni mese: <b id="conto-r">–</b></p><p class="note">${c.nota}. L'utile per azienda dipende dai servizi venduti: il numero qui è solo un esempio da cambiare.</p></div>` : ""}
      <h2 class="rp-nome-h">Attenzione</h2>
      ${(r.attenzione || []).map((x) => html`<div class="card" style="margin-top:8px"><p>${x}</p></div>`)}
      <h2 class="rp-nome-h">Come si sale</h2>
      <div class="card"><p>${r.sali}</p></div>
      <h2 class="rp-nome-h">Le regole uguali per tutti</h2>
      ${(pack.REGOLE || []).map(([t, x]) => html`<details class="doc-regola"><summary>${t}</summary><p>${x}</p></details>`)}
      <p class="note">Allegato C dei contratti, versione ${pack.VERSIONE_REGOLE}.</p>
      ${ORDINE.filter((k) => k !== ruoloVisto).map((k) => html`<button type="button" class="card dir-riga" data-ruolo="${k}"><b>${(ruoli[k] && ruoli[k].nome) || RUOLI[k]}</b><p class="note">Vedi come lo vede lui</p></button>`)}`.s;
    const mio = box.querySelector("#doc-mio");
    if (mio) mio.addEventListener("click", () => { ruoloVisto = io.ruolo; disegna(); });
    box.querySelectorAll("[data-ruolo]").forEach((b) => b.addEventListener("click", () => { ruoloVisto = b.getAttribute("data-ruolo"); disegna(); }));
    const n = box.querySelector("#conto-n");
    const u = box.querySelector("#conto-u");
    const out = box.querySelector("#conto-r");
    if (n && u && out && c) {
      const calc = () => { out.textContent = euro(Math.round(Number(n.value || 0) * Number(u.value || 0) * c.k * 100) / 100); };
      n.addEventListener("input", calc);
      u.addEventListener("input", calc);
      calc();
    }
  }

  async function paginaDocumenti() {
    titolo("Documenti", "Contratto, regolamento e circolari da firmare.");
    const [dRes, firme] = await Promise.all([
      conTempo(db().from("app_documenti").select("id, tipo, titolo, testo, file, ruoli, richiede_firma, versione, attivo, pubblicato").eq("attivo", true).order("pubblicato", { ascending: false }).limit(300)),
      caricaFirmeMie()
    ]);
    if (dRes && dRes.error && mancaErrore(dRes.error)) {
      box.innerHTML = cartaManca().s;
      return;
    }
    if (docId) { await dettaglioAgente(dRes); return; }
    if (dRes && dRes.error) {
      box.innerHTML = html`<div class="card"><p>${spiega(dRes.error)}</p></div>`.s;
      return;
    }
    const mio = (io && io.ruolo) || "";
    const d = (dRes.data || []).filter((x) => !(x.ruoli || []).length || (x.ruoli || []).includes(mio));
    const firmato = (x) => firme.find((y) => y.documento === x.id);
    const da = d.filter((x) => x.richiede_firma && !firmato(x));
    const ok = d.filter((x) => firmato(x));
    const leggi = d.filter((x) => !x.richiede_firma);
    const riga = (x) => {
      const f = firmato(x);
      return html`<button type="button" class="card dir-riga" data-doc="${x.id}"><b>${x.titolo}</b><p class="note">${TIPI_DOC[x.tipo] || ""}${x.versione ? " · versione " + x.versione : ""} · ${quando(x.pubblicato)} · ${f ? "Firmato" : x.richiede_firma ? "Da firmare" : "Da leggere"}</p></button>`;
    };
    box.innerHTML = html`
      <p class="note">Il tuo contratto, il regolamento della rete e le circolari di AncheCasa. Firmi qui e la firma arriva subito ad AncheCasa.</p>
      ${da.length ? html`<h2 class="rp-nome-h">Da firmare</h2>${da.map(riga)}` : ""}
      ${ok.length ? html`<h2 class="rp-nome-h">Firmati</h2>${ok.map(riga)}` : ""}
      ${leggi.length ? html`<h2 class="rp-nome-h">Da leggere</h2>${leggi.map(riga)}` : ""}
      ${!d.length ? html`<p class="note">Nessun documento per ora.</p>` : ""}`.s;
    box.querySelectorAll("[data-doc]").forEach((b) => b.addEventListener("click", () => { docId = b.getAttribute("data-doc"); disegna(); }));
  }

  async function dettaglioAgente(dRes) {
    if (dRes && dRes.error) {
      box.innerHTML = html`<div class="card"><p>${spiega(dRes.error)}</p></div>`.s;
      return;
    }
    const d = ((dRes && dRes.data) || []).find((x) => x.id === docId);
    if (!d) {
      const uno = await conTempo(db().from("app_documenti").select("id, tipo, titolo, testo, file, ruoli, richiede_firma, versione, attivo, pubblicato").eq("id", docId).maybeSingle());
      if (!uno || uno.error || !uno.data) {
        box.innerHTML = html`<div class="card"><p>${uno && uno.error ? spiega(uno.error) : "Documento non trovato."}</p></div>`.s;
        return;
      }
      return dettaglioUno(uno.data);
    }
    return dettaglioUno(d);
  }

  async function dettaglioUno(d) {
    titolo("Documenti", d.titolo);
    const firme = await caricaFirmeMie();
    const f = firme.find((x) => x.documento === d.id);
    const uid = await utenteId();
    let nome = "";
    if (uid) {
      try {
        const s = await db().auth.getSession();
        const u = s && s.data && s.data.session && s.data.session.user;
        nome = (u && u.user_metadata && (u.user_metadata.nome || u.user_metadata.full_name)) || "";
      } catch (e) { nome = ""; }
    }
    // 11.10.2026: contratto con modello (contratti-modelli.js) da firmare → si compila e si firma qui, su carta intestata.
    const cf = AC.contrattoFirma;
    if (!f && d.tipo === "contratto" && d.richiede_firma && cf && cf.modello(d)) {
      let mail = "", tel = "";
      try {
        const s = await db().auth.getSession();
        const u = s && s.data && s.data.session && s.data.session.user;
        mail = (u && u.email) || "";
        tel = (u && u.user_metadata && (u.user_metadata.telefono || u.user_metadata.phone)) || "";
      } catch (e) { mail = ""; }
      const p = (AC.store && AC.store.data && AC.store.data.profilo) || {};
      cf.mostra(box, d, {
        nome: p.nome || nome || "",
        mail: mail || p.mail || p.email || "",
        telefono: tel || p.telefono || "",
        indietro: () => { docId = ""; disegna(); },
        dopo: () => { if (AC.app && AC.app.refresh) setTimeout(() => cf.applica("agente", "documenti"), 0); mettiNumero(0); AC.contratti.badge(); }
      });
      return;
    }
    const copia = f && f.dati && Object.keys(f.dati).length && cf && cf.modello(d);
    box.innerHTML = html`
      <button type="button" class="btn-ghost" id="doc-indietro">Tutti i documenti</button>
      <div class="card" style="margin-top:12px">
        <p class="note">${TIPI_DOC[d.tipo] || ""}${d.versione ? " · versione " + d.versione : ""} · pubblicato ${quando(d.pubblicato)}</p>
        <h2 class="rp-nome-h">${d.titolo}</h2>
        ${d.testo ? html`<p style="white-space:pre-line">${d.testo}</p>` : ""}
        ${d.file ? html`<p><a class="btn-ghost" href="${d.file}" target="_blank" rel="noopener">Apri il PDF</a></p>` : ""}
      </div>
      ${f ? html`<div class="card" style="margin-top:12px"><p>Firmato il ${quando(f.firmato)} da <b>${f.nome}</b>. La firma è arrivata ad AncheCasa.</p><img class="doc-firma-img" src="${f.firma}" alt="La tua firma"><p style="margin-top:8px">${copia ? html`<button type="button" class="btn-ghost" id="doc-copia">Apri il contratto firmato</button> ` : ""}<button type="button" class="btn-ghost" id="doc-ricevuta">Ricevuta</button></p></div>` : d.richiede_firma ? html`<form class="card" id="doc-firma" style="margin-top:12px" novalidate><h2 class="rp-nome-h">Firma il documento</h2><label>Nome e cognome <input name="nome" maxlength="120" required value="${nome}" autocomplete="name"></label><div class="firma-box"><span>La tua firma (col dito o col mouse)</span><canvas class="firma" aria-label="Spazio per la firma"></canvas><input type="hidden" name="firma" value=""><button type="button" class="link" data-cancella-firma>Cancella la firma</button></div><label class="doc-spunta"><input type="checkbox" name="letto"> Ho letto tutto il documento e lo accetto</label><button class="btn-in" type="submit">Firma e invia ad AncheCasa</button><p class="note">Si registrano il tuo nome, la firma, la data e l'ora e un'impronta del documento, così si sa esattamente cosa hai firmato.</p></form>` : html`<div class="card" style="margin-top:12px"><p>Questo documento è da leggere: non serve firmarlo.</p></div>`}`.s;
    box.querySelector("#doc-indietro").addEventListener("click", () => { docId = ""; disegna(); });
    const ric = box.querySelector("#doc-ricevuta");
    if (ric) ric.addEventListener("click", () => apriRicevuta(d, f));
    const cop = box.querySelector("#doc-copia");
    if (cop) cop.addEventListener("click", () => cf.apriCopia(d, f));
    const form = box.querySelector("#doc-firma");
    if (form) {
      legaFirme(box);
      form.addEventListener("submit", (ev) => inviaFirma(ev, d));
    }
  }

  async function inviaFirma(ev, d) {
    ev.preventDefault();
    const f = ev.target;
    if (f.nome.value.trim().length < 3) { toast("Scrivi nome e cognome.", "errore"); return; }
    if (!f.firma.value) { toast("Firma col dito o col mouse nello spazio bianco.", "errore"); return; }
    if (!f.letto.checked) { toast("Spunta «Ho letto tutto il documento e lo accetto».", "errore"); return; }
    const btn = f.querySelector("button[type=submit]");
    if (btn) btn.disabled = true;
    const imp = await impronta(d);
    const res = await conTempo(db().rpc("app_firma_documento", {
      p_documento: d.id,
      p_nome: f.nome.value.trim(),
      p_firma: f.firma.value,
      p_impronta: imp,
      p_dispositivo: navigator.userAgent.slice(0, 300)
    }));
    if (btn && btn.isConnected) btn.disabled = false;
    if (!res || res.error) { toast(spiega(res && res.error), "errore"); return; }
    toast("Firmato e inviato ad AncheCasa.");
    disegna();
  }

  async function paginaVendita(el) {
    const probe = await conTempo(db().from("app_vendite").select("id").limit(1));
    const manca = probe && probe.error && mancaErrore(probe.error);
    const uid = await utenteId();
    let miei = [];
    if (!manca && uid) {
      const res = await conTempo(db().from("app_vendite").select("id, cliente_nome, dettaglio, cosa, importo, tipo_importo, stato, creato, affidato").eq("venditore", uid).eq("affidato", true).order("creato", { ascending: false }).limit(100));
      miei = (res && res.data) || [];
    }
    el.innerHTML = html`
      <h2 class="rp-nome-h">Registra un cliente</h2>
      ${manca ? cartaManca() : ""}
      <form class="card" id="doc-vendi" novalidate>
        <label>Cliente (azienda o persona) <input name="cliente" required maxlength="120"></label>
        <label>Telefono o mail <input name="contatto" maxlength="120"></label>
        <label>Regione del cliente <select name="regione"><option value="">—</option>${REGIONI.map((r) => html`<option>${r}</option>`)}</select></label>
        <label>Il cliente è
          <select name="tipo_cliente">
            <option value="azienda">Un'azienda</option>
            <option value="privato">Un privato</option>
            <option value="condominio">Un condominio</option>
          </select>
        </label>
        <label>Partita IVA (per le aziende) <input name="piva" maxlength="20" inputmode="numeric" placeholder="Il cliente è di chi lo registra per primo"></label>
        <label>Cosa proponi <select name="cosa">${Object.keys(COSA).map((k) => html`<option value="${k}">${COSA[k]}</option>`)}</select></label>
        <label>Dettaglio <input name="dettaglio" maxlength="200"></label>
        <div class="doc-due">
          <label>Importo <input name="importo" type="number" step="0.01" min="0" required></label>
          <label>È <select name="tipo"><option value="mese">al mese</option><option value="una_tantum">una volta</option></select></label>
        </div>
        <button class="btn-in" type="submit">Registra la proposta</button>
      </form>
      ${miei.length ? html`<h2 class="rp-nome-h">Clienti di AncheCasa affidati a te</h2>${miei.map((x) => {
        const ore = orePassate(x);
        const tardi = x.stato === "proposta" && ore > 48;
        return html`<div class="card" style="margin-top:8px"><p>Cliente di AncheCasa affidato a te: chiamalo entro 48 ore. Prendi metà della quota di chi porta; quello che gli vendi in più è tuo con la quota piena.</p><b>${x.cliente_nome}</b> <span class="${tardi ? "doc-tardi" : "note"}">${x.stato === "proposta" ? (tardi ? "oltre 48 ore" : ore + " ore") : ""}</span><p class="note">${x.dettaglio || COSA[x.cosa] || ""} · ${euro(x.importo)}</p></div>`;
      })}` : ""}`.s;
    const form = el.querySelector("#doc-vendi");
    if (form) form.addEventListener("submit", (ev) => inviaVendita(ev, manca));
  }

  async function inviaVendita(ev, manca) {
    ev.preventDefault();
    if (manca) { toast(MANCA, "errore"); return; }
    const f = ev.target;
    if (f.cliente.value.trim().length < 2) { toast("Scrivi il nome del cliente.", "errore"); return; }
    if (f.importo.value === "") { toast("Scrivi l'importo.", "errore"); return; }
    const tc = f.tipo_cliente.value;
    const piva = (f.piva.value || "").replace(/\D/g, "");
    if (tc === "azienda" && piva && piva.length !== 11) { toast("La partita IVA ha 11 cifre.", "errore"); return; }
    const btn = f.querySelector("button[type=submit]");
    if (btn) btn.disabled = true;
    const lib = await conTempo(db().rpc("app_cliente_libero", { p_tipo: tc, p_piva: piva, p_contatto: f.contatto.value.trim() }));
    if (lib && lib.error && mancaErrore(lib.error)) {
      if (btn && btn.isConnected) btn.disabled = false;
      toast(MANCA, "errore");
      return;
    }
    if (lib && !lib.error && lib.data === false) {
      if (btn && btn.isConnected) btn.disabled = false;
      toast(GIA_COLLEGA, "errore");
      return;
    }
    const uid = await utenteId();
    if (!uid) {
      if (btn && btn.isConnected) btn.disabled = false;
      toast("Entra con il tuo account.", "errore");
      return;
    }
    const comune = {
      cliente_piva: piva,
      cliente_nome: f.cliente.value.trim(),
      cliente_tipo: tc === "privato" ? "privato" : tc,
      cliente_contatto: f.contatto.value.trim(),
      cliente_regione: f.regione.value
    };
    let res;
    if (f.cosa.value === "ristrutturazione") {
      res = await conTempo(db().from("app_affari").insert(Object.assign({ segnalato_da: uid, descrizione: f.dettaglio.value.trim(), valore: Number(f.importo.value) }, comune)));
    } else {
      res = await conTempo(db().from("app_vendite").insert(Object.assign({
        venditore: uid,
        cosa: f.cosa.value,
        dettaglio: f.dettaglio.value.trim(),
        importo: Number(f.importo.value),
        tipo_importo: f.tipo.value
      }, comune)));
    }
    if (btn && btn.isConnected) btn.disabled = false;
    if (!res || res.error) { toast(spiega(res && res.error), "errore"); return; }
    toast(f.cosa.value === "ristrutturazione" ? "Lavoro registrato." : "Proposta registrata.");
    f.reset();
  }

  async function daFirmare() {
    await prepara();
    const mio = (io && io.ruolo) || "";
    const d = await conTempo(db().from("app_documenti").select("id, ruoli, richiede_firma").eq("attivo", true).limit(300));
    if (!d || d.error || !d.data) return 0;
    const firme = await caricaFirmeMie();
    return d.data.filter((x) => x.richiede_firma && (!(x.ruoli || []).length || (x.ruoli || []).includes(mio)) && !firme.some((y) => y.documento === x.id)).length;
  }

  function mettiNumero(n) {
    document.querySelectorAll('a[href$="/documenti"]').forEach((a) => {
      let b = a.querySelector(".doc-badge");
      if (!n) { if (b) b.remove(); return; }
      if (!b) {
        b = document.createElement("span");
        b.className = "doc-badge";
        a.appendChild(b);
      }
      b.textContent = String(n);
    });
  }

  async function disegna() {
    if (!box) return;
    if (pagina === "mio-ruolo" || pagina === "documenti") await prepara();
    if (pagina === "mio-ruolo" && !ruoloVisto && io && io.ruolo) ruoloVisto = io.ruolo;
    if (pagina === "contratti") return paginaContratti();
    if (pagina === "affida") return paginaAffida();
    if (pagina === "mio-ruolo") return paginaRuolo();
    if (pagina === "documenti") return paginaDocumenti();
  }

  AC.views = AC.views || {};
  AC.views.contratti = {
    title: "Contratti",
    sub: "I contratti della rete, chi ha firmato, le circolari.",
    render(el) {
      box = el; pagina = "contratti"; docId = "";
      if (!el.dataset.bozza) {
        el.dataset.bozza = "1";
        el.addEventListener("click", (e) => {
          const b = e.target.closest("[data-bozza]");
          if (!b || !AC.contrattoFirma) return;
          e.preventDefault();
          const file = b.getAttribute("data-bozza");
          AC.contrattoFirma.mostra(el, { file: file, titolo: "Bozza" }, { indietro: true });
          const ind = el.querySelector("#cf-indietro");
          if (ind) ind.addEventListener("click", () => disegna());
        });
      }
      disegna();
    }
  };
  AC.views.affida = {
    title: "Clienti da affidare",
    sub: "Clienti di AncheCasa da seguire entro 48 ore.",
    render(el) { box = el; pagina = "affida"; disegna(); }
  };
  AC.views["mio-ruolo"] = {
    title: "Il mio ruolo",
    sub: "Cosa fai e come guadagni.",
    render(el) { box = el; pagina = "mio-ruolo"; disegna(); }
  };
  AC.views.documenti = {
    title: "Documenti",
    sub: "Contratto, regolamento e circolari da firmare.",
    render(el) { box = el; pagina = "documenti"; docId = (AC.contrattoFirma && AC.contrattoFirma.prendiDaAprire()) || ""; disegna(); }
  };

  AC.contratti = {
    prepara: prepara,
    riempiVendita: paginaVendita,
    badge: async function () {
      const n = await daFirmare();
      mettiNumero(n);
    }
  };
})();
