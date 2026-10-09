/* Luce e gas · software per le aziende di categoria "azienda_luce_gas" (09.10.2026, su richiesta esplicita).
   Due tasti nella cartella "Luce e gas":
   - offerte_energia: listino delle offerte, dati sulla carta intestata, copertura tutta Italia, pubblicazione in piazza;
   - proposte_energia: proposta al cliente in PDF su carta intestata AncheCasa con il logo dell'azienda (dal Profilo).
   Dati in localStorage per account (chiave anchecasa-energia-v1:<mail>), finché non c'è la tabella sul server. */
(function () {
  const AC = window.AC;
  const { html, toast, raw } = AC.ui;
  const S = AC.store;
  const V = AC.views;

  const KEY_BASE = "anchecasa-energia-v1";
  let preselezione = "";
  const TIPI = { luce: "Luce", gas: "Gas", duale: "Luce e gas" };
  const PREZZI = { fisso: "Prezzo fisso", indicizzato: "Indicizzato (PUN / PSV + spread)" };
  const CLIENTI = { privati: "Privati", imprese: "Imprese", tutti: "Privati e imprese" };

  function key() {
    const mail = (S.data.account && S.data.account.mail) || "demo";
    return KEY_BASE + ":" + mail.toLowerCase();
  }
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(key()) || "null"); } catch (e) { d = null; }
    d = d && typeof d === "object" ? d : {};
    return {
      carta: Object.assign({ ragione: "", piva: "", indirizzo: "", telefono: "", mail: "", sito: "" }, d.carta || {}),
      offerte: Array.isArray(d.offerte) ? d.offerte : [],
      proposte: Array.isArray(d.proposte) ? d.proposte : [],
      numero: Number(d.numero) || 0
    };
  }
  function save(d) {
    try { localStorage.setItem(key(), JSON.stringify(d)); } catch (e) { toast("Non riesco a salvare in questo browser.", "error"); }
  }
  const nid = () => "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const num = (v) => {
    const n = parseFloat(String(v == null ? "" : v).replace(",", "."));
    return isFinite(n) ? n : 0;
  };
  const eur = (n, dec) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " €";
  const oggi = () => new Date().toLocaleDateString("it-IT");

  function cartaDi(d) {
    const p = S.data.profilo || {};
    return {
      ragione: d.carta.ragione || p.nome || "La tua azienda",
      piva: d.carta.piva,
      indirizzo: d.carta.indirizzo || p.zona || "",
      telefono: d.carta.telefono,
      mail: d.carta.mail || (S.data.account && S.data.account.mail) || "",
      sito: d.carta.sito,
      logo: typeof p.logo === "string" && p.logo.indexOf("data:image/") === 0 ? p.logo : ""
    };
  }

  /* ---------- carta intestata in anteprima (HTML) ---------- */
  function cartaHtml(c, corpo) {
    return html`
      <div class="en-carta">
        <div class="en-carta-head">
          <img src="img/carta-logo-bianco.png" alt="AncheCasa">
          <div class="en-carta-az">${c.logo ? html`<img src="${c.logo}" alt="Logo ${c.ragione}">` : html`<span>${c.ragione}</span>`}</div>
        </div>
        <div class="en-carta-rule"></div>
        <div class="en-carta-body">${corpo}</div>
        <div class="en-carta-foot">
          <span>${c.ragione}${c.piva ? " · P. IVA " + c.piva : ""}${c.indirizzo ? " · " + c.indirizzo : ""}</span>
          <span>Proposta tramite <b>AncheCasa</b> · Costruiamo fiducia</span>
        </div>
      </div>`;
  }

  /* ---------- tasto 1: Le mie offerte ---------- */
  V.offerte_energia = {
    title: "Le mie offerte",
    sub: "Luce e gas. Il tuo listino, valido in tutta Italia, pronto per le proposte su carta intestata.",
    render(el) {
      const d = load();
      const p = S.data.profilo || {};
      const c = cartaDi(d);
      const italia = p.copertura === "italia";
      let modifica = null;

      function formOfferta(o) {
        o = o || { tipo: "luce", prezzo: "fisso", clienti: "tutti", durata: "12", attiva: true };
        return html`
          <form id="en-f-off" class="prefs wide en-grid">
            <label class="span2">Nome dell’offerta<input name="nome" required maxlength="80" value="${o.nome || ""}" placeholder="Es. Casa Sicura Luce 12"></label>
            <label>Fornitura<select name="tipo">${Object.keys(TIPI).map((k) => html`<option value="${k}"${o.tipo === k ? " selected" : ""}>${TIPI[k]}</option>`)}</select></label>
            <label>Clienti<select name="clienti">${Object.keys(CLIENTI).map((k) => html`<option value="${k}"${o.clienti === k ? " selected" : ""}>${CLIENTI[k]}</option>`)}</select></label>
            <label>Prezzo<select name="prezzo">${Object.keys(PREZZI).map((k) => html`<option value="${k}"${o.prezzo === k ? " selected" : ""}>${PREZZI[k]}</option>`)}</select></label>
            <label>Durata<select name="durata">${["12", "24", "36"].map((k) => html`<option value="${k}"${String(o.durata) === k ? " selected" : ""}>${k} mesi</option>`)}</select></label>
            <label data-per="luce">Energia €/kWh<input name="pLuce" inputmode="decimal" value="${o.pLuce || ""}" placeholder="0,125"></label>
            <label data-per="gas">Gas €/Smc<input name="pGas" inputmode="decimal" value="${o.pGas || ""}" placeholder="0,52"></label>
            <label>Quota fissa €/mese<input name="quota" inputmode="decimal" value="${o.quota || ""}" placeholder="9,90"></label>
            <label>Sconto benvenuto €<input name="bonus" inputmode="decimal" value="${o.bonus || ""}" placeholder="0"></label>
            <label class="span2">Vantaggi e condizioni<textarea name="note" maxlength="600" placeholder="Es. 100% energia verde certificata, nessun deposito cauzionale, app per i consumi.">${o.note || ""}</textarea></label>
            <label class="check span2"><input type="checkbox" name="attiva"${o.attiva !== false ? " checked" : ""}> Offerta attiva, proponibile ai clienti</label>
            <div class="row-actions span2">
              <button class="btn-in" type="submit">${o.id ? "Salva le modifiche" : "Aggiungi al listino"}</button>
              ${o.id ? html`<button class="btn-ghost" type="button" data-annulla>Annulla</button>` : ""}
            </div>
          </form>`;
      }

      function riga(o) {
        const prezzi = [];
        if (o.tipo !== "gas") prezzi.push(eur(num(o.pLuce), 4) + "/kWh");
        if (o.tipo !== "luce") prezzi.push(eur(num(o.pGas), 4) + "/Smc");
        return html`<tr>
          <td><b>${o.nome}</b><br><small>${TIPI[o.tipo]} · ${CLIENTI[o.clienti]} · ${o.durata} mesi</small></td>
          <td>${prezzi.join(" · ")}<br><small>${PREZZI[o.prezzo]}${num(o.quota) ? " · quota " + eur(num(o.quota), 2) + "/mese" : ""}</small></td>
          <td>${o.attiva !== false ? html`<span class="tag ok">Attiva</span>` : html`<span class="tag paused">In pausa</span>`}</td>
          <td class="en-act">
            <a class="btn-mini" href="#/azienda/proposte_energia" data-prop="${o.id}">Proposta</a>
            <button class="btn-mini" type="button" data-piazza="${o.id}">In piazza</button>
            <button class="btn-mini" type="button" data-mod="${o.id}">Modifica</button>
            <button class="btn-mini" type="button" data-del="${o.id}">Elimina</button>
          </td>
        </tr>`;
      }

      function disegna() {
        const dd = load();
        const att = dd.offerte.filter((o) => o.attiva !== false).length;
        el.innerHTML = html`
          <div class="en-kpis">
            <div class="kpi"><span><strong>${dd.offerte.length}</strong><small>offerte a listino</small></span></div>
            <div class="kpi"><span><strong>${att}</strong><small>attive</small></span></div>
            <div class="kpi"><span><strong>${dd.proposte.length}</strong><small>proposte inviate</small></span></div>
            <div class="kpi"><span><strong>${italia ? "Tutta Italia" : "Da impostare"}</strong><small>zona servita</small></span></div>
          </div>

          ${italia ? "" : html`<div class="card en-banner">
            <div><h2>Offri in tutta Italia</h2><p class="note">Luce e gas si vendono su tutto il territorio. Con un tocco la tua copertura diventa nazionale: ti trovano i privati e le imprese di ogni regione.</p></div>
            <button class="btn-in" type="button" data-italia>Copri tutta Italia</button>
          </div>`}

          <div class="card">
            <h2>${modifica ? "Modifica offerta" : "Nuova offerta"}</h2>
            <p class="note">Inserisci i prezzi della sola parte commerciale. Trasporto, oneri e imposte li stabilisce l’autorità e sono uguali per tutti.</p>
            ${formOfferta(modifica)}
          </div>

          <div class="card">
            <h2>Il tuo listino</h2>
            ${dd.offerte.length
              ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>Offerta</th><th>Prezzi</th><th>Stato</th><th></th></tr></thead><tbody>${dd.offerte.map(riga)}</tbody></table></div>`
              : html`<p class="note">Ancora nessuna offerta. Aggiungi la prima qui sopra: comparirà qui e potrai farne una proposta su carta intestata.</p>`}
          </div>

          <div class="card">
            <h2>La tua carta intestata</h2>
            <p class="note">Questi dati compaiono su ogni proposta, insieme al marchio AncheCasa. Il logo lo carichi nel <a href="#/azienda/profilo">Profilo</a>${c.logo ? "" : html` <span class="tag wait">logo da caricare</span>`}.</p>
            <div class="en-carta-wrap">
              <form id="en-f-carta" class="prefs wide en-grid">
                <label class="span2">Ragione sociale<input name="ragione" value="${dd.carta.ragione}" placeholder="${p.nome || "Energia Esempio Srl"}"></label>
                <label>Partita IVA<input name="piva" value="${dd.carta.piva}" inputmode="numeric" maxlength="16"></label>
                <label>Telefono<input name="telefono" value="${dd.carta.telefono}"></label>
                <label class="span2">Indirizzo sede<input name="indirizzo" value="${dd.carta.indirizzo}"></label>
                <label>Mail<input name="mail" type="email" value="${dd.carta.mail}"></label>
                <label>Sito<input name="sito" value="${dd.carta.sito}"></label>
                <div class="row-actions span2"><button class="btn-in" type="submit">Salva la carta intestata</button></div>
              </form>
              <div class="en-carta-mini">${cartaHtml(cartaDi(dd), html`<p class="en-mini-t">Proposta di fornitura</p><div class="en-mini-l"></div><div class="en-mini-l s"></div><div class="en-mini-l"></div>`)}</div>
            </div>
          </div>`.s;

        const fo = el.querySelector("#en-f-off");
        const aggiornaCampi = () => {
          const t = fo.elements.tipo.value;
          fo.querySelector('[data-per="luce"]').hidden = t === "gas";
          fo.querySelector('[data-per="gas"]').hidden = t === "luce";
        };
        fo.elements.tipo.addEventListener("change", aggiornaCampi);
        aggiornaCampi();
        fo.addEventListener("submit", (e) => {
          e.preventDefault();
          const f = fo.elements;
          const o = {
            id: modifica ? modifica.id : nid(),
            nome: f.nome.value.trim(),
            tipo: f.tipo.value,
            clienti: f.clienti.value,
            prezzo: f.prezzo.value,
            durata: f.durata.value,
            pLuce: f.pLuce.value.trim(),
            pGas: f.pGas.value.trim(),
            quota: f.quota.value.trim(),
            bonus: f.bonus.value.trim(),
            note: f.note.value.trim(),
            attiva: f.attiva.checked
          };
          if (!o.nome) return toast("Dai un nome all’offerta.", "error");
          if (o.tipo !== "gas" && !(num(o.pLuce) > 0)) return toast("Inserisci il prezzo dell’energia in €/kWh.", "error");
          if (o.tipo !== "luce" && !(num(o.pGas) > 0)) return toast("Inserisci il prezzo del gas in €/Smc.", "error");
          const dd2 = load();
          const ix = dd2.offerte.findIndex((x) => x.id === o.id);
          if (ix >= 0) dd2.offerte[ix] = o; else dd2.offerte.unshift(o);
          save(dd2);
          toast(modifica ? "Offerta aggiornata" : "Offerta aggiunta al listino");
          modifica = null;
          disegna();
        });
        const ann = el.querySelector("[data-annulla]");
        if (ann) ann.addEventListener("click", () => { modifica = null; disegna(); });

        el.querySelectorAll("[data-prop]").forEach((a) => a.addEventListener("click", () => { preselezione = a.getAttribute("data-prop"); }));
        el.querySelectorAll("[data-mod]").forEach((b) => b.addEventListener("click", () => {
          modifica = load().offerte.find((o) => o.id === b.getAttribute("data-mod")) || null;
          disegna();
          el.querySelector("#en-f-off").scrollIntoView({ behavior: "smooth", block: "center" });
        }));
        el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
          if (b.dataset.conferma !== "1") { b.dataset.conferma = "1"; b.textContent = "Conferma"; return; }
          const dd2 = load();
          dd2.offerte = dd2.offerte.filter((o) => o.id !== b.getAttribute("data-del"));
          save(dd2);
          toast("Offerta eliminata");
          disegna();
        }));
        el.querySelectorAll("[data-piazza]").forEach((b) => b.addEventListener("click", () => {
          const o = load().offerte.find((x) => x.id === b.getAttribute("data-piazza"));
          if (!o) return;
          const prezzi = [];
          if (o.tipo !== "gas") prezzi.push("energia " + eur(num(o.pLuce), 4) + "/kWh");
          if (o.tipo !== "luce") prezzi.push("gas " + eur(num(o.pGas), 4) + "/Smc");
          S.addAnnuncio({
            dir: "offro",
            cosa: TIPI[o.tipo] + " · " + o.nome,
            dove: "Tutta Italia",
            testo: o.nome + ": " + PREZZI[o.prezzo].toLowerCase() + ", " + prezzi.join(", ") + (num(o.quota) ? ", quota fissa " + eur(num(o.quota), 2) + "/mese" : "") + ". Durata " + o.durata + " mesi. Per " + CLIENTI[o.clienti].toLowerCase() + ". " + (o.note || "")
          });
          toast("Offerta pubblicata in piazza per tutta Italia");
        }));
        const it = el.querySelector("[data-italia]");
        if (it) it.addEventListener("click", () => { S.setCopertura("italia"); toast("Ora servi tutta Italia"); V.offerte_energia.render(el); });
        el.querySelector("#en-f-carta").addEventListener("submit", (e) => {
          e.preventDefault();
          const f = e.target.elements;
          const dd2 = load();
          dd2.carta = { ragione: f.ragione.value.trim(), piva: f.piva.value.trim(), indirizzo: f.indirizzo.value.trim(), telefono: f.telefono.value.trim(), mail: f.mail.value.trim(), sito: f.sito.value.trim() };
          save(dd2);
          toast("Carta intestata salvata");
          disegna();
        });
      }
      disegna();
    }
  };

  /* ---------- tasto 2: Proposte su carta intestata ---------- */
  function stima(o, consumoLuce, consumoGas) {
    const luce = o.tipo !== "gas" ? consumoLuce * num(o.pLuce) : 0;
    const gas = o.tipo !== "luce" ? consumoGas * num(o.pGas) : 0;
    const quota = num(o.quota) * 12 * (o.tipo === "duale" ? 2 : 1);
    return { luce: luce, gas: gas, quota: quota, bonus: num(o.bonus), totale: Math.max(0, luce + gas + quota - num(o.bonus)) };
  }

  V.proposte_energia = {
    title: "Proposte su carta intestata",
    sub: "Luce e gas. La proposta al cliente in PDF, con il marchio AncheCasa e il tuo logo.",
    render(el) {
      const d = load();
      const attive = d.offerte.filter((o) => o.attiva !== false);
      const scelta = attive.some((o) => o.id === preselezione) ? preselezione : (attive[0] && attive[0].id) || "";
      preselezione = "";

      if (!attive.length) {
        el.innerHTML = html`<div class="card"><h2>Prima serve un’offerta</h2><p class="note">Le proposte partono dal tuo listino. Aggiungi almeno un’offerta attiva.</p><div class="row-actions"><a class="btn-in" href="#/azienda/offerte_energia">Vai a Le mie offerte</a></div></div>`.s;
        return;
      }

      el.innerHTML = html`
        <div class="en-two">
          <div class="card">
            <h2>Nuova proposta</h2>
            <form id="en-f-prop" class="prefs wide en-grid">
              <label class="span2">Offerta<select name="offerta">${attive.map((o) => html`<option value="${o.id}"${o.id === scelta ? " selected" : ""}>${o.nome} · ${TIPI[o.tipo]}</option>`)}</select></label>
              <label class="span2">Cliente (nome e cognome o ragione sociale)<input name="cliente" required maxlength="90"></label>
              <label class="span2">Indirizzo di fornitura<input name="indirizzo" maxlength="120"></label>
              <label>Codice fiscale / P. IVA<input name="cf" maxlength="16"></label>
              <label>Mail del cliente<input name="mail" type="email"></label>
              <label data-per="luce">Consumo luce kWh/anno<input name="cLuce" inputmode="numeric" value="2700"></label>
              <label data-per="gas">Consumo gas Smc/anno<input name="cGas" inputmode="numeric" value="1400"></label>
              <label data-per="luce">POD<input name="pod" maxlength="16" placeholder="IT001E…"></label>
              <label data-per="gas">PDR<input name="pdr" maxlength="16"></label>
              <label class="span2">Nota per il cliente<textarea name="nota" maxlength="400" placeholder="Es. Come d’accordo al telefono, ecco la nostra proposta."></textarea></label>
              <div class="row-actions span2">
                <button class="btn-in" type="submit">Scarica la proposta in PDF</button>
              </div>
              <p class="note span2" id="en-pdf-err" hidden></p>
            </form>
          </div>
          <div class="card en-prev-card">
            <h2>Anteprima sulla carta intestata</h2>
            <div id="en-prev"></div>
          </div>
        </div>
        <div class="card">
          <h2>Proposte inviate</h2>
          ${d.proposte.length
            ? html`<div class="en-scroll"><table class="mini-table"><thead><tr><th>N.</th><th>Data</th><th>Cliente</th><th>Offerta</th><th class="num">Stima annua</th></tr></thead><tbody>${d.proposte.map((x) => html`<tr><td>${x.n}</td><td>${x.data}</td><td>${x.cliente}</td><td>${x.offerta}</td><td class="num">${eur(x.totale, 0)}</td></tr>`)}</tbody></table></div>`
            : html`<p class="note">Qui trovi lo storico delle proposte che scarichi.</p>`}
        </div>`.s;

      const f = el.querySelector("#en-f-prop");
      const prev = el.querySelector("#en-prev");

      function dati() {
        const e = f.elements;
        const o = attive.find((x) => x.id === e.offerta.value) || attive[0];
        return {
          o: o,
          cliente: e.cliente.value.trim(),
          indirizzo: e.indirizzo.value.trim(),
          cf: e.cf.value.trim(),
          mail: e.mail.value.trim(),
          cLuce: num(e.cLuce.value),
          cGas: num(e.cGas.value),
          pod: e.pod.value.trim(),
          pdr: e.pdr.value.trim(),
          nota: e.nota.value.trim()
        };
      }
      function aggiorna() {
        const x = dati();
        f.querySelectorAll('[data-per="luce"]').forEach((l) => (l.hidden = x.o.tipo === "gas"));
        f.querySelectorAll('[data-per="gas"]').forEach((l) => (l.hidden = x.o.tipo === "luce"));
        const s = stima(x.o, x.cLuce, x.cGas);
        const c = cartaDi(load());
        const righe = [];
        if (x.o.tipo !== "gas") righe.push(["Energia elettrica", eur(num(x.o.pLuce), 4) + " / kWh"]);
        if (x.o.tipo !== "luce") righe.push(["Gas naturale", eur(num(x.o.pGas), 4) + " / Smc"]);
        if (num(x.o.quota)) righe.push(["Quota fissa", eur(num(x.o.quota), 2) + " / mese"]);
        righe.push(["Prezzo", PREZZI[x.o.prezzo]], ["Durata", x.o.durata + " mesi"]);
        prev.innerHTML = cartaHtml(c, html`
          <p class="en-p-meta">Proposta n. ${prossimoNumero()} · ${oggi()} · valida 30 giorni</p>
          <p class="en-p-to">Spett.le<br><b>${x.cliente || "Nome del cliente"}</b><br>${x.indirizzo || "Indirizzo di fornitura"}</p>
          <h3 class="en-p-title">Proposta di fornitura ${TIPI[x.o.tipo].toLowerCase()}</h3>
          <p class="en-p-offer">${x.o.nome}</p>
          <table class="en-p-tab">${righe.map((r) => html`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`)}</table>
          <div class="en-p-stima"><span>Stima annua della parte commerciale</span><b>${eur(s.totale, 0)}</b></div>
          ${x.o.note ? html`<p class="en-p-note">${x.o.note}</p>` : ""}`).s;
      }
      f.addEventListener("input", aggiorna);
      f.addEventListener("change", aggiorna);
      aggiorna();

      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const x = dati();
        if (!x.cliente) return toast("Inserisci il nome del cliente.", "error");
        const btn = f.querySelector("button[type=submit]");
        btn.disabled = true;
        creaPdf(x).then((rec) => {
          const dd = load();
          dd.numero = (dd.numero || 0) + 1;
          dd.proposte.unshift(rec);
          save(dd);
          toast("Proposta " + rec.n + " scaricata");
          V.proposte_energia.render(el);
        }).catch((err) => {
          const box = el.querySelector("#en-pdf-err");
          box.hidden = false;
          box.textContent = "Non riesco a creare il PDF: " + (err && err.message ? err.message : "riprova tra poco") + ".";
          btn.disabled = false;
        });
      });
    }
  };

  function prossimoNumero() {
    const d = load();
    return "AC-EN-" + new Date().getFullYear() + "-" + String((d.numero || 0) + 1).padStart(4, "0");
  }

  /* ---------- PDF ---------- */
  function caricaScript(src) {
    return new Promise((ok, ko) => {
      if (window.jspdf && window.jspdf.jsPDF) return ok();
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => ok();
      s.onerror = () => ko(new Error("la libreria PDF non si è caricata, controlla la connessione"));
      document.head.appendChild(s);
    });
  }
  function immagine(src) {
    return new Promise((ok) => {
      if (!src) return ok(null);
      const im = new Image();
      im.onload = () => {
        try {
          const cv = document.createElement("canvas");
          cv.width = im.naturalWidth; cv.height = im.naturalHeight;
          cv.getContext("2d").drawImage(im, 0, 0);
          ok({ data: cv.toDataURL("image/png"), w: im.naturalWidth, h: im.naturalHeight });
        } catch (e) { ok(null); }
      };
      im.onerror = () => ok(null);
      im.src = src;
    });
  }

  function creaPdf(x) {
    const c = cartaDi(load());
    return caricaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
      .then(() => Promise.all([immagine("img/carta-logo-bianco.png"), immagine(c.logo)]))
      .then(([logoAc, logoAz]) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const NAVY = [22, 48, 77], ORANGE = [229, 107, 16], INK = [36, 56, 76], MUTED = [102, 117, 138];
        const nProp = prossimoNumero();
        const s = stima(x.o, x.cLuce, x.cGas);

        // testata
        doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 36, "F");
        if (logoAc) { const w = 62; doc.addImage(logoAc.data, "PNG", 14, 18 - (w * logoAc.h / logoAc.w) / 2, w, w * logoAc.h / logoAc.w); }
        else { doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text("AncheCasa", 14, 21); }
        doc.setFillColor(255, 255, 255); doc.roundedRect(140, 6, 56, 24, 3, 3, "F");
        if (logoAz) {
          const maxW = 50, maxH = 18; let w = maxW, h = w * logoAz.h / logoAz.w;
          if (h > maxH) { h = maxH; w = h * logoAz.w / logoAz.h; }
          doc.addImage(logoAz.data, "PNG", 168 - w / 2, 18 - h / 2, w, h);
        } else {
          doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
          doc.text(doc.splitTextToSize(c.ragione, 50), 168, 17, { align: "center" });
        }
        doc.setFillColor(...ORANGE); doc.rect(0, 36, 210, 1.6, "F");

        // intestazioni
        let y = 48;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        doc.text("Proposta n. " + nProp + "   ·   " + oggi() + "   ·   valida 30 giorni", 14, y);
        y = 58;
        doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text("DA", 14, y); doc.text("SPETT.LE", 112, y);
        doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...INK);
        doc.text(c.ragione, 14, y + 6); doc.text(x.cliente, 112, y + 6);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        const da = [c.piva ? "P. IVA " + c.piva : "", c.indirizzo, c.telefono, c.mail, c.sito].filter(Boolean);
        const a = [x.indirizzo, x.cf ? "CF / P. IVA " + x.cf : "", x.mail, x.pod ? "POD " + x.pod : "", x.pdr ? "PDR " + x.pdr : ""].filter(Boolean);
        da.forEach((t, i) => doc.text(t, 14, y + 11 + i * 4.6));
        a.forEach((t, i) => doc.text(doc.splitTextToSize(t, 84)[0], 112, y + 11 + i * 4.6));
        y += 14 + Math.max(da.length, a.length) * 4.6 + 6;

        // titolo
        doc.setFont("times", "bold"); doc.setFontSize(21); doc.setTextColor(...NAVY);
        doc.text("Proposta di fornitura " + TIPI[x.o.tipo].toLowerCase(), 14, y); y += 7;
        doc.setFont("times", "italic"); doc.setFontSize(13); doc.setTextColor(...ORANGE);
        doc.text(x.o.nome, 14, y); y += 6;
        if (x.nota) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...INK);
          const l = doc.splitTextToSize(x.nota, 182); doc.text(l, 14, y + 3); y += l.length * 4.8 + 3;
        }
        y += 4;

        // tabella condizioni
        const righe = [];
        if (x.o.tipo !== "gas") righe.push(["Energia elettrica", eur(num(x.o.pLuce), 4) + " / kWh"]);
        if (x.o.tipo !== "luce") righe.push(["Gas naturale", eur(num(x.o.pGas), 4) + " / Smc"]);
        if (num(x.o.quota)) righe.push(["Quota fissa", eur(num(x.o.quota), 2) + " / mese" + (x.o.tipo === "duale" ? " per fornitura" : "")]);
        righe.push(["Tipo di prezzo", PREZZI[x.o.prezzo]], ["Durata", x.o.durata + " mesi"], ["Per", CLIENTI[x.o.clienti]]);
        if (num(x.o.bonus)) righe.push(["Sconto di benvenuto", eur(num(x.o.bonus), 2)]);
        doc.setDrawColor(...NAVY); doc.setLineWidth(0.6); doc.line(14, y, 196, y); y += 6;
        righe.forEach((r, i) => {
          if (i % 2 === 0) { doc.setFillColor(243, 246, 251); doc.rect(14, y - 4.4, 182, 7, "F"); }
          doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...MUTED); doc.text(r[0], 17, y);
          doc.setFont("helvetica", "bold"); doc.setTextColor(...INK); doc.text(r[1], 193, y, { align: "right" });
          y += 7;
        });
        y += 4;

        // stima
        doc.setFillColor(255, 241, 228); doc.roundedRect(14, y, 182, 26, 2.5, 2.5, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(180, 82, 11);
        doc.text("STIMA ANNUA DELLA PARTE COMMERCIALE", 19, y + 7);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...INK);
        const cons = [];
        if (x.o.tipo !== "gas") cons.push(Math.round(x.cLuce).toLocaleString("it-IT") + " kWh");
        if (x.o.tipo !== "luce") cons.push(Math.round(x.cGas).toLocaleString("it-IT") + " Smc");
        doc.text("Su un consumo di " + cons.join(" e ") + " all'anno", 19, y + 13);
        doc.setFontSize(7.5); doc.setTextColor(...MUTED);
        doc.text(doc.splitTextToSize("Materia prima e quote fisse dell'offerta. Trasporto, oneri di sistema e imposte sono fissati dall'autorità ed esclusi.", 120), 19, y + 18);
        doc.setFont("times", "bold"); doc.setFontSize(24); doc.setTextColor(...NAVY);
        doc.text(eur(s.totale, 0), 191, y + 17, { align: "right" });
        y += 34;

        if (x.o.note) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text("Vantaggi e condizioni", 14, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK);
          const l = doc.splitTextToSize(x.o.note, 182); doc.text(l, 14, y); y += l.length * 4.6 + 4;
        }

        // firme
        const yf = Math.max(y + 10, 236);
        doc.setDrawColor(190, 200, 212); doc.setLineWidth(0.3);
        doc.line(14, yf + 12, 92, yf + 12); doc.line(118, yf + 12, 196, yf + 12);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        doc.text("Per " + c.ragione, 14, yf + 17); doc.text("Per accettazione, il cliente", 118, yf + 17);

        // piede
        doc.setFillColor(...ORANGE); doc.rect(14, 280, 182, 0.5, "F");
        doc.setFontSize(7.5); doc.setTextColor(...MUTED);
        doc.text(c.ragione + (c.piva ? " · P. IVA " + c.piva : "") + (c.indirizzo ? " · " + c.indirizzo : ""), 14, 285);
        doc.text("Proposta presentata tramite AncheCasa · www.anchecasa.it", 14, 289);
        doc.setFont("helvetica", "bold"); doc.setTextColor(...ORANGE); doc.text("Costruiamo fiducia", 196, 289, { align: "right" });

        const nomeFile = "Proposta-" + nProp + "-" + x.cliente.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".pdf";
        doc.save(nomeFile);
        return { n: nProp, data: oggi(), cliente: x.cliente, offerta: x.o.nome, totale: s.totale };
      });
  }
})();
