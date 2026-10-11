/* Contratto compilabile e firmabile dal telefono (11.10.2026, su richiesta di Nando).
   - mostra(): il contratto su carta intestata AncheCasa con i campi da compilare, la firma col dito e «Invia».
   - Prima della firma l'area della rete è in sola lettura: si guarda tutto, ma non si registra niente.
   - Dopo l'invio (rpc app_firma_contratto, app-14) l'area si attiva con tutte le funzioni.
   Testi dei contratti in contratti-modelli.js. Stile in css/contratto-firma.css. */
(function () {
  const AC = (window.AC = window.AC || {});
  const MANCA = "Manca app-14 su Supabase: eseguire app-anchecasa/sql/app-14-contratto-compilato.sql";
  const SOCIETA = {
    nome: "PALUMBO INVESTMENT S.R.L.",
    righe: ["Via Giusti 22 · 81057 Teano (CE)", "C.F. e P.IVA 04724830619 · REA CE-349941", "PEC palumboinvestment@pec.it · anchecasa.it"],
    piede: "Palumbo Investment S.r.l. · Via Giusti 22, 81057 Teano (CE) · P.IVA 04724830619 · info@anchecasa.it",
    firmatario: "l'Amministratrice Unica – Federica Palumbo"
  };

  let cache = null;          // { quando, bloccato, doc }
  let daAprire = "";         // documento da aprire in Documenti (dal pulsante della striscia)

  const ui = () => AC.ui;
  const db = () => window.acDb;
  const toast = (m, k) => { if (ui() && ui().toast) ui().toast(m, k); };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const base = () => location.origin + location.pathname.replace(/[^/]*$/, "");

  function conTempo(p) {
    return Promise.race([
      Promise.resolve(p),
      new Promise((r) => setTimeout(() => r({ error: { message: "il server non risponde" } }), 25000))
    ]);
  }
  function manca(err) {
    const t = String((err && (err.code || "")) + " " + (err && (err.message || "")) + " " + (err && (err.details || "")));
    return /PGRST202|PGRST204|42883|42703|Could not find the|does not exist/i.test(t);
  }
  function spiega(err) {
    const m = String((err && (err.message || err.details)) || err || "");
    if (manca(err) || /app_firma_contratto/.test(m)) return MANCA;
    if (/gia_firmato/.test(m)) return "Hai già firmato questo contratto.";
    if (/dati_mancanti/.test(m)) return "Mancano codice fiscale o IBAN.";
    if (/documento_non_trovato/.test(m)) return "Contratto non trovato.";
    return m || "Non riesco a inviare. Riprova.";
  }

  function modello(d) {
    const m = AC.contrattiModelli || {};
    return (d && d.file && m[d.file]) || null;
  }

  function oggiIso() {
    const o = new Date();
    return o.getFullYear() + "-" + String(o.getMonth() + 1).padStart(2, "0") + "-" + String(o.getDate()).padStart(2, "0");
  }
  function dataIt(iso) {
    const p = String(iso || "").split("-");
    return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : String(iso || "");
  }

  function testa() {
    return `<header class="cf-testa"><div class="cf-testa-riga">
      <img src="img/contratto-logo.png" alt="AncheCasa, Costruiamo fiducia">
      <div class="cf-testa-dx"><b>${SOCIETA.nome}</b>${SOCIETA.righe.join("<br>")}</div>
    </div></header>`;
  }
  function piede() {
    return `<img class="cf-curva" src="img/contratto-curva.png" alt="">
      <footer class="cf-piede"><img src="img/contratto-logo-negativo.png" alt="AncheCasa"><div>${esc(SOCIETA.piede)}</div></footer>`;
  }
  // Altri firmatari del modello (es. l'Agente di riferimento del Sub-agente, per accettazione).
  function altri(m) {
    return (m.altriFirmatari || []).map(([chi, nota]) => `<div><b>${esc(chi)}</b>${esc(nota || "")}</div>`).join("");
  }
  function titoloHtml(m) {
    return `<div class="cf-titolo"><span class="cf-eti">${esc(m.etichetta)}</span><h1>${esc(m.titolo)}</h1><p>${esc(m.sotto)}</p></div>`;
  }

  // Testo esatto firmato: il contratto con i valori scritti al posto dei campi.
  function testoCompilato(root) {
    const c = root.cloneNode(true);
    c.querySelectorAll("input, select, textarea").forEach((i) => {
      const v = i.type === "checkbox" ? (i.checked ? "[x]" : "[ ]") : (i.type === "date" ? dataIt(i.value) : i.value);
      i.replaceWith(document.createTextNode(" " + (v || "") + " "));
    });
    c.querySelectorAll("[data-cf-fuori]").forEach((x) => x.remove());
    return (c.textContent || "").replace(/\s+/g, " ").trim();
  }
  async function sha256(testo) {
    try {
      const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(testo));
      return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { return ""; }
  }

  const REGOLE = {
    cf: (v) => /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(v) || /^\d{11}$/.test(v) || "Codice fiscale di 16 caratteri (o 11 cifre per le società)",
    piva: (v) => /^\d{11}$/.test(v) || "La partita IVA ha 11 cifre",
    iban: (v) => /^IT\d{2}[A-Z]\d{10}[0-9A-Z]{12}$/.test(v) || "IBAN italiano di 27 caratteri, inizia con IT",
    mail: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || "Mail non valida",
    pec: (v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || "PEC non valida"
  };

  function padFirma(pad) {
    const cv = pad.querySelector("canvas");
    const hint = pad.querySelector(".cf-pad-hint");
    const ctx = cv.getContext("2d");
    const st = { tratti: 0 };
    let giu = false, ultimo = null;
    function misura() {
      const r = pad.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      if (!r.width) return;
      const img = st.tratti ? cv.toDataURL("image/png") : null;
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#16304d"; ctx.fillStyle = "#16304d";
      if (img) { const i = new Image(); i.onload = () => ctx.drawImage(i, 0, 0, r.width, r.height); i.src = img; }
    }
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault(); cv.setPointerCapture(e.pointerId); giu = true; ultimo = pt(e);
      ctx.beginPath(); ctx.arc(ultimo.x, ultimo.y, 1.1, 0, Math.PI * 2); ctx.fill();
    });
    cv.addEventListener("pointermove", (e) => {
      if (!giu) return;
      const p = pt(e);
      ctx.beginPath(); ctx.moveTo(ultimo.x, ultimo.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ultimo = p;
    });
    const fine = () => { if (giu) { giu = false; st.tratti++; hint.hidden = true; pad.classList.add("on"); pad.classList.remove("err"); } };
    cv.addEventListener("pointerup", fine);
    cv.addEventListener("pointercancel", fine);
    st.pulisci = () => { ctx.clearRect(0, 0, cv.width, cv.height); st.tratti = 0; hint.hidden = false; pad.classList.remove("on"); };
    st.png = () => cv.toDataURL("image/png");
    window.addEventListener("resize", misura);
    requestAnimationFrame(misura);
    return st;
  }

  /* Il contratto da compilare e firmare dentro la pagina Documenti.
     o = { nome, mail, telefono, indietro(), dopo() } */
  function mostra(box, d, o) {
    const m = modello(d);
    if (!m) return false;
    o = o || {};
    box.innerHTML = `
      ${o.indietro ? '<button type="button" class="btn-ghost" id="cf-indietro">Tutti i documenti</button>' : ""}
      <article class="cf" id="cf">
        ${testa()}
        <div id="cf-testo">
          ${titoloHtml(m)}
          <form class="cf-corpo" id="cf-form" novalidate>
            ${m.corpo}
            <section class="cf-firma" aria-label="Firma del contratto">
              <div class="cf-riga2">
                <div class="campo"><label for="cf-luogo">Luogo</label><input id="cf-luogo" name="luogo" required></div>
                <div class="campo"><label for="cf-data">data</label><input id="cf-data" name="data" type="date" required readonly></div>
              </div>
              <label class="cf-spunta"><input type="checkbox" id="cf-letto" name="letto" required><span>Ho letto il contratto e i suoi allegati e li accetto.</span></label>
              <label class="cf-spunta"><input type="checkbox" id="cf-1341" name="approva_1341" required><span>${esc(m.approva)}</span></label>
              <div class="cf-pad-lab" data-cf-fuori><span>Firma con il dito o con il mouse</span><button type="button" id="cf-pulisci">Cancella firma</button></div>
              <div class="cf-pad" id="cf-pad" data-cf-fuori><canvas aria-label="Spazio per la firma"></canvas><span class="cf-pad-hint">Firma qui</span></div>
              <div class="cf-firmatari">
                <div><b>${SOCIETA.nome}</b>${esc(SOCIETA.firmatario)}</div>
                <div><b>${esc(m.chiFirma)}</b><span id="cf-nome-firma">firma raccolta su AncheCasa</span></div>
                ${altri(m)}
              </div>
              <div class="cf-invia" data-cf-fuori>
                <p class="cf-errori" id="cf-errori" role="alert" hidden></p>
                <button class="cf-btn" type="submit" id="cf-btn">Invia contratto firmato</button>
                <p class="cf-nota">Dopo l'invio la tua area si attiva con tutte le funzioni. La copia firmata resta in Documenti.</p>
              </div>
            </section>
          </form>
        </div>
        ${piede()}
      </article>`;

    const f = box.querySelector("#cf-form");
    const testo = box.querySelector("#cf-testo");
    f.querySelector("#cf-data").value = oggiIso();
    const nomeIn = f.querySelector('[name="nome"]');
    const set = (n, v) => { const i = f.querySelector('[name="' + n + '"]'); if (i && v && !i.value) i.value = v; };
    set("nome", o.nome); set("mail", o.mail); set("telefono", o.telefono);
    const nomeFirma = box.querySelector("#cf-nome-firma");
    const aggiornaNome = () => { nomeFirma.textContent = (nomeIn && nomeIn.value.trim()) || "firma raccolta su AncheCasa"; };
    if (nomeIn) nomeIn.addEventListener("input", aggiornaNome);
    aggiornaNome();
    ["cf", "iban"].forEach((n) => {
      const i = f.querySelector('[name="' + n + '"]');
      if (i) i.addEventListener("input", () => { const p = i.selectionStart; i.value = i.value.toUpperCase().replace(/\s+/g, ""); try { i.setSelectionRange(p, p); } catch (e) { /* niente */ } });
    });
    const piva = f.querySelector('[name="piva"]');
    if (piva) piva.addEventListener("input", () => { piva.value = piva.value.replace(/\D/g, ""); });

    const pad = box.querySelector("#cf-pad");
    const firma = padFirma(pad);
    box.querySelector("#cf-pulisci").addEventListener("click", () => firma.pulisci());
    const ind = box.querySelector("#cf-indietro");
    if (ind) ind.addEventListener("click", () => o.indietro());

    // sul contratto la striscia non serve il pulsante «Firma il contratto»
    const vai = document.getElementById("cf-vai");
    if (vai) vai.remove();

    f.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const errori = box.querySelector("#cf-errori");
      const mancano = [];
      f.querySelectorAll(".campo").forEach((c) => c.classList.remove("err"));
      f.querySelectorAll(".campo small").forEach((s) => { s.textContent = ""; });
      f.querySelectorAll("input").forEach((i) => {
        const v = i.type === "checkbox" ? i.checked : i.value.trim();
        let ok = i.required ? !!v : true;
        const regola = REGOLE[i.name];
        if (ok && regola && (i.required || v)) {
          const r = regola(i.value.trim());
          if (r !== true) {
            ok = false;
            const s = i.parentElement && i.parentElement.querySelector("small");
            if (s) s.textContent = r;
          }
        }
        if (!ok) { mancano.push(i); const c = i.closest(".campo"); if (c) c.classList.add("err"); else i.classList.add("err"); }
        else i.classList.remove("err");
      });
      if (!firma.tratti) { pad.classList.add("err"); mancano.push(pad); }
      if (mancano.length) {
        errori.textContent = mancano.length === 1 && mancano[0] === pad ? "Manca la firma." : "Completa i campi segnati in rosso e la firma.";
        errori.hidden = false;
        const primo = mancano[0];
        primo.scrollIntoView({ behavior: "smooth", block: "center" });
        if (primo !== pad && primo.focus) setTimeout(() => primo.focus({ preventScroll: true }), 300);
        return;
      }
      errori.hidden = true;
      const btn = box.querySelector("#cf-btn");
      btn.disabled = true; btn.textContent = "Invio in corso…";

      const dati = {};
      f.querySelectorAll("input[name]").forEach((i) => { dati[i.name] = i.type === "checkbox" ? i.checked : i.value.trim(); });
      dati.versione = m.versione;
      dati.file = d.file;
      const imp = await sha256(m.versione + "\n" + testoCompilato(testo));
      const res = await conTempo(db().rpc("app_firma_contratto", {
        p_documento: d.id,
        p_nome: dati.nome || "",
        p_firma: firma.png(),
        p_impronta: imp,
        p_dispositivo: navigator.userAgent.slice(0, 300),
        p_dati: dati
      }));
      if (!res || res.error) {
        btn.disabled = false; btn.textContent = "Invia contratto firmato";
        errori.textContent = spiega(res && res.error); errori.hidden = false;
        return;
      }
      azzera();
      box.innerHTML = `
        <article class="cf">
          ${testa()}
          <div class="cf-fatto">
            <div class="cf-ok" aria-hidden="true">✓</div>
            <h2>Contratto inviato</h2>
            <p>Grazie ${esc(dati.nome)}. La tua area AncheCasa è attiva con tutte le funzioni.</p>
            <p>La copia firmata è in Documenti.</p>
            ${imp ? `<code>Impronta SHA-256 · ${esc(imp)}</code>` : ""}
            <p><button type="button" class="btn-ghost" id="cf-continua">Vai alla bacheca</button></p>
          </div>
          ${piede()}
        </article>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
      const c = box.querySelector("#cf-continua");
      if (c) c.addEventListener("click", () => { location.hash = "#/agente/bacheca"; });
      toast("Contratto firmato e inviato ad AncheCasa.");
      if (o.dopo) o.dopo();
    });
    return true;
  }

  // Copia del contratto firmato, da salvare in PDF (si apre in una finestra nuova).
  // Stile e immagini entrano dentro la pagina, così la copia si vede uguale anche fuori dalla dashboard.
  let risorse = null;
  async function caricaRisorse() {
    if (risorse) return risorse;
    const b = base();
    const comeDato = async (u) => {
      try {
        const blob = await (await fetch(u, { cache: "force-cache" })).blob();
        return await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(u); r.readAsDataURL(blob); });
      } catch (e) { return u; }
    };
    let css = "";
    try { css = await (await fetch(b + "css/contratto-firma.css", { cache: "force-cache" })).text(); } catch (e) { css = ""; }
    const [logo, curva, neg] = await Promise.all(["img/contratto-logo.png", "img/contratto-curva.png", "img/contratto-logo-negativo.png"].map((x) => comeDato(b + x)));
    risorse = { css, img: { "img/contratto-logo.png": logo, "img/contratto-curva.png": curva, "img/contratto-logo-negativo.png": neg } };
    return risorse;
  }

  function apriCopia(d, f) {
    const m = modello(d);
    if (!m || !f) return false;
    const w = window.open("", "_blank");
    if (!w) { toast("Il browser ha bloccato la finestra: consenti i popup e riprova.", "errore"); return true; }
    w.document.write('<!doctype html><meta charset="utf-8"><title>Contratto firmato</title><p style="font:16px Segoe UI,Arial,sans-serif;padding:24px">Preparo il contratto firmato…</p>');
    caricaRisorse().then((r) => scriviCopia(w, m, f, r));
    return true;
  }

  function scriviCopia(w, m, f, r) {
    const dati = f.dati || {};
    const tmp = document.createElement("div");
    tmp.innerHTML = m.corpo;
    tmp.querySelectorAll("input").forEach((i) => {
      const v = i.type === "date" ? dataIt(dati[i.name]) : dati[i.name];
      const s = document.createElement("b");
      s.className = "cf-valore";
      s.textContent = v || "—";
      i.replaceWith(s);
    });
    const conImmagini = (h) => h.replace(/src="(img\/[^"]+)"/g, (x, k) => 'src="' + (r.img[k] || base() + k) + '"');
    const doc = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${esc(m.nomeBreve)} firmato · ${esc(f.nome)}</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap">
      <style>${r.css}
      body{margin:0;background:#eef2f7;padding:16px 0}.cf{margin:0 auto}.cf-stampa{position:fixed;right:12px;bottom:12px;background:#c45d0c;color:#fff;border:0;border-radius:999px;padding:12px 18px;font:700 15px Manrope,Segoe UI,Arial,sans-serif;cursor:pointer}
      @media print{body{background:#fff;padding:0}.cf{box-shadow:none;border-radius:0;max-width:none}.cf-stampa{display:none}@page{size:A4;margin:10mm 0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
      </head><body><article class="cf">${conImmagini(testa())}${titoloHtml(m)}
      <div class="cf-corpo">${tmp.innerHTML}
        <section class="cf-firma">
          <p>Luogo <b class="cf-valore">${esc(dati.luogo || "—")}</b> · data <b class="cf-valore">${esc(dataIt(dati.data))}</b></p>
          <p class="cf-spunta-copia">[x] Ho letto il contratto e i suoi allegati e li accetto.</p>
          <p class="cf-spunta-copia">[x] ${esc(m.approva)}</p>
          <div class="cf-firmatari">
            <div><b>${SOCIETA.nome}</b>${esc(SOCIETA.firmatario)}</div>
            <div><b>${esc(m.chiFirma)}</b>${esc(f.nome)}<img class="cf-firma-img" src="${esc(f.firma)}" alt="Firma"></div>
            ${altri(m)}
          </div>
          <dl class="cf-prova"><dt>Firmato il</dt><dd>${esc(new Date(f.firmato).toLocaleString("it-IT"))}</dd><dt>Impronta SHA-256</dt><dd>${esc(f.impronta || "–")}</dd><dt>Dispositivo</dt><dd>${esc(f.dispositivo || "–")}</dd></dl>
          <p class="cf-nota">Firma elettronica raccolta nel sistema AncheCasa (Allegato C, art. C.10). L'impronta SHA-256 identifica esattamente il testo firmato con i dati compilati.</p>
        </section>
      </div>${conImmagini(piede())}</article><button class="cf-stampa" onclick="print()">Salva in PDF</button></body></html>`;
    w.document.open();
    w.document.write(doc);
    w.document.close();
  }

  /* ---------- Sola lettura finché il contratto non è firmato ---------- */
  function azzera() { cache = null; }

  async function stato() {
    if (cache && Date.now() - cache.quando < 60000) return cache;
    const vuoto = { quando: Date.now(), bloccato: false, doc: null };
    if (!db()) return (cache = vuoto);
    try {
      const s = await db().auth.getSession();
      const uid = s && s.data && s.data.session && s.data.session.user && s.data.session.user.id;
      if (!uid) return (cache = vuoto);
      const r = await conTempo(db().from("app_rete").select("ruolo, stato").eq("utente", uid).maybeSingle());
      if (!r || r.error || !r.data || r.data.stato !== "attivo") return (cache = vuoto);
      const ruolo = r.data.ruolo;
      const dRes = await conTempo(db().from("app_documenti").select("id, tipo, titolo, file, ruoli, richiede_firma, attivo").eq("attivo", true).eq("tipo", "contratto").limit(50));
      if (!dRes || dRes.error) return (cache = vuoto);
      const miei = (dRes.data || []).filter((x) => x.richiede_firma && (x.ruoli || []).includes(ruolo));
      if (!miei.length) return (cache = vuoto);
      const fRes = await conTempo(db().from("app_firme").select("documento").eq("utente", uid).limit(500));
      if (!fRes || fRes.error) return (cache = vuoto);
      const firmati = (fRes.data || []).map((x) => x.documento);
      const doc = miei.find((x) => firmati.indexOf(x.id) < 0) || null;
      const ok = miei.some((x) => firmati.indexOf(x.id) >= 0);
      return (cache = { quando: Date.now(), bloccato: !ok, doc: ok ? null : doc });
    } catch (e) { return (cache = vuoto); }
  }

  function striscia(st, page) {
    const view = document.getElementById("view");
    if (!view) return;
    let el = document.getElementById("cf-striscia");
    if (!st.bloccato) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = "cf-striscia"; el.className = "cf-striscia"; }
    const suContratto = page === "documenti" && document.getElementById("cf");
    el.innerHTML = `<i aria-hidden="true"></i><div><b>La tua area è in sola lettura.</b> Compila e firma il tuo contratto: dopo l'invio si attivano tutte le funzioni.</div>${suContratto ? "" : '<button type="button" class="cf-striscia-btn" id="cf-vai">Firma il contratto</button>'}`;
    if (view.firstChild !== el) view.insertBefore(el, view.firstChild);
    const vai = el.querySelector("#cf-vai");
    if (vai) vai.addEventListener("click", () => {
      daAprire = st.doc ? st.doc.id : "";
      if (location.hash === "#/agente/documenti" && AC.app) AC.app.refresh();
      else location.hash = "#/agente/documenti";
    });
  }

  // Nella sola lettura si blocca chi registra o invia qualcosa; si possono ancora aprire pagine e schede.
  const BLOCCA = 'button[type="submit"], input[type="submit"], .btn-in, .btn-new, .btn-danger, .btn-mail, [data-azione], form button:not([type="button"])';
  let paginaCorrente = "";
  function libero(t) { return !t || paginaCorrente === "documenti" || t.closest(".cf, .cf-striscia, .side, .tabbar, #altro, .acct, .topbar"); }
  function ferma(e) {
    if (!document.body.classList.contains("cf-sola-lettura")) return;
    const t = e.target && e.target.closest ? e.target : null;
    if (!t || libero(t)) return;
    if (e.type === "submit" || t.closest(BLOCCA)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toast("Firma il contratto per usare questa funzione.", "errore");
    }
  }
  document.addEventListener("submit", ferma, true);
  document.addEventListener("click", ferma, true);

  let giro = 0;
  async function applica(famiglia, page) {
    const mio = ++giro;
    paginaCorrente = page || "";
    if (famiglia !== "agente") {
      document.body.classList.remove("cf-sola-lettura");
      const el = document.getElementById("cf-striscia");
      if (el) el.remove();
      return;
    }
    const st = await stato();
    if (mio !== giro) return;
    document.body.classList.toggle("cf-sola-lettura", !!st.bloccato);
    striscia(st, page);
  }

  function prendiDaAprire() { const x = daAprire; daAprire = ""; return x; }

  AC.contrattoFirma = { modello, mostra, apriCopia, stato, applica, azzera, prendiDaAprire, MANCA };
})();
