/* Sala strategia, lavori a SAL, obiettivi e report del mese (10.10.2026).
   Stessa logica di app-anchecasa/js/viste-direzione.js e di sql/app-06-strategia-cantieri-obiettivi.sql.
   Le scritture passano dalle funzioni rpc. L'unica scrittura diretta è lo stato «perso» su app_affari. */
(function () {
  const AC = (window.AC = window.AC || {});
  const ui = () => AC.ui;
  const MANCA = "Manca app-06 su Supabase: eseguire app-anchecasa/sql/app-06-strategia-cantieri-obiettivi.sql";
  const ARRIVO = "I numeri arrivano dall'app AncheCasa";
  const AVVISO_PRIVATI = "Sui privati niente provvigioni, solo sui lavori";
  const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  const TEMI = { vendite: "Vendite", zone: "Zone e regioni", prodotti: "Prodotti e servizi", persone: "Persone della rete", prezzi: "Prezzi e offerte", altro: "Altro" };
  const RUOLI = { reteitalia: "Responsabile Rete Italia", sviluppo: "Sviluppo rete", capoarea: "Capo area", agente: "Agente", subagente: "Sub-agente" };
  const RUOLI_PROV = { segnala: "Chi segnala", chiude: "Chi chiude", segue: "Chi segue il cantiere", impresa: "Chi ha portato l'impresa", venditore: "Venditore", sviluppo: "Sviluppo rete", capoarea: "Capo area", reteitalia: "Responsabile Rete Italia", affidato: "Cliente di AncheCasa affidato (metà quota)", segnala_agente: "Chi segnala (tuo sub-agente)", chiude_agente: "Chi chiude (tuo sub-agente)", segue_agente: "Chi segue il cantiere (tuo sub-agente)", impresa_agente: "Chi ha portato l'impresa (tuo sub-agente)" };
  const NOMECHI = { admin: "Admin", reteitalia: "Rete Italia", sviluppo: "Sviluppo rete", capoarea: "Capo area" };
  const TIPO_CL = { privato: "Privato", azienda: "Azienda", condominio: "Condominio" };
  const DIRIGENTI = ["reteitalia", "sviluppo", "capoarea"];
  let io = null;
  let chiesto = false;
  let stratFiltro = "aperta";
  let stratId = "";
  let stratDecisore = "admin";
  let lavoroId = "";
  let contaCache = null;

  function html(strings, ...vals) { return ui().html(strings, ...vals); }
  function toast(msg, kind) { ui().toast(msg, kind); }
  function db() { return window.acDb; }

  function mancaErrore(err) {
    if (!err) return false;
    const t = String(err.code || "") + " " + String(err.message || "") + " " + String(err.details || "");
    return /PGRST202|PGRST205|42P01|42883|schema cache|does not exist|Could not find the/i.test(t);
  }

  function spiega(err) {
    const m = String((err && (err.message || err.details)) || err || "");
    if (mancaErrore(err) || /app_strategie|app_obiettivi|app_affari|app_fissa_obiettivo|app_strategia_|app_linee_decise|app_affare_firma|app_tranche_incassata/.test(m)) return MANCA;
    if (/non_autorizzato/.test(m)) return "Non puoi fare questa operazione.";
    if (/argomento_chiuso/.test(m)) return "Questo argomento è già chiuso.";
    if (/testo_non_valido/.test(m)) return "Controlla il testo.";
    if (/tranche_gia_incassata/.test(m)) return "Questa tranche è già incassata.";
    if (/lavoro_non_firmato/.test(m)) return "Il lavoro non è ancora firmato.";
    if (/importo_non_valido/.test(m)) return "Controlla l'importo.";
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

  function meseISO(d) {
    const x = d || new Date();
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0");
  }

  function primoMese(d) { return meseISO(d) + "-01"; }

  function prossimoPrimo() {
    const x = new Date();
    x.setDate(1);
    x.setMonth(x.getMonth() + 1);
    return primoMese(x);
  }

  function nomeMese(ym) {
    const p = String(ym || "").split("-");
    return (MESI[Number(p[1]) - 1] || "") + " " + (p[0] || "");
  }

  function dataIt(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function euro(n) {
    const x = Number(n);
    if (!isFinite(x)) return "0 €";
    return x.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
  }

  function pl(n, uno, piu) { return n + " " + (n === 1 ? uno : piu); }

  function giorniLavorativiRimasti() {
    const d = new Date();
    const m = d.getMonth();
    let n = 0;
    for (let x = new Date(d); x.getMonth() === m; x.setDate(x.getDate() + 1)) {
      if (x.getDay() !== 0 && x.getDay() !== 6) n++;
    }
    return n;
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

  function misura(d, chi, periodo) {
    const dentro = (u) => !chi || chi.indexOf(u) >= 0;
    const v = d.vend.filter((x) => x.stato === "attiva" && (x.cliente_tipo || "azienda") !== "privato" && dentro(x.venditore) && String(x.attivata || "").indexOf(periodo) === 0);
    const a = d.aff.filter((x) => (x.stato === "firmato" || x.stato === "chiuso") && dentro(x.segnalato_da) && String(x.firmato || "").indexOf(periodo) === 0);
    const nomi = {};
    v.forEach((x) => { nomi[String(x.cliente_nome || "").trim().toLowerCase()] = 1; });
    return {
      aziende: Object.keys(nomi).filter(Boolean).length,
      canoni: v.filter((x) => x.tipo_importo === "mese").reduce((s, x) => s + Number(x.importo), 0),
      lavori: a.length,
      valore: a.reduce((s, x) => s + Number(x.valore), 0)
    };
  }

  const METRICHE = [
    ["aziende", "Nuove aziende clienti", (n) => String(n)],
    ["canoni", "Nuovi canoni al mese", (n) => euro(n)],
    ["lavori", "Lavori firmati", (n) => String(n)],
    ["valore", "Valore dei lavori", (n) => euro(n)]
  ];

  function ritmo(manca, giorni, k) {
    if (manca <= 0) return "obiettivo raggiunto";
    if (!giorni) return "mese finito";
    if (k === "canoni" || k === "valore") return "mancano " + euro(manca) + ", circa " + euro(Math.ceil(manca / giorni)) + " al giorno";
    const al = manca / giorni;
    return "mancano " + manca + (al >= 1 ? ", circa " + Math.ceil(al) + " al giorno" : ", una ogni " + Math.max(1, Math.floor(giorni / manca)) + " giorni lavorativi");
  }

  function titolo(t, s) {
    const a = document.getElementById("page-title");
    const b = document.getElementById("page-sub");
    if (a) a.textContent = t;
    if (b) b.textContent = s || "";
  }

  function sessione() {
    if (!db()) return Promise.resolve("");
    return db().auth.getSession().then((s) => (s.data && s.data.session && s.data.session.user && s.data.session.user.id) || "").catch(() => "");
  }

  async function datiAndamento() {
    const [vend, aff, rete, ob] = await Promise.all([
      conTempo(db().from("app_vendite").select("venditore, cliente_nome, cliente_tipo, tipo_importo, importo, stato, attivata, creato").limit(5000)),
      conTempo(db().from("app_affari").select("segnalato_da, stato, firmato, valore, creato").limit(3000)),
      conTempo(db().from("app_rete").select("utente, superiore, ruolo, nome, codice, stato").limit(2000)),
      conTempo(db().from("app_obiettivi").select("utente, mese, aziende, canoni, lavori, valore, nota").eq("mese", primoMese()).limit(2000))
    ]);
    const err = [vend, aff, rete, ob].map((r) => r && r.error).find(Boolean);
    if (err) return { error: err };
    return { vend: vend.data || [], aff: aff.data || [], rete: rete.data || [], ob: ob.data || [] };
  }

  function barre(mese, oggiN, ob) {
    const giorni = giorniLavorativiRimasti();
    return METRICHE.map(([k, t, f]) => {
      const fatto = mese[k];
      const meta = ob ? Number(ob[k]) || 0 : 0;
      const pc = meta ? Math.min(100, Math.round((fatto / meta) * 100)) : 0;
      const oggiTxt = oggiN[k] ? "oggi +" + f(oggiN[k]) + " · " : "";
      const ritmoTxt = meta ? ritmo(meta - fatto, giorni, k) : "obiettivo non ancora fissato";
      return html`<div class="dir-metrica">
        <div class="dir-metrica-h"><span>${t}</span><b>${f(fatto)}${meta ? " / " + f(meta) : ""}</b></div>
        ${meta ? html`<div class="dir-barra"><i style="width:${pc}%"></i></div>` : ""}
        <p class="dir-sotto">${oggiTxt}${ritmoTxt}</p>
      </div>`;
    });
  }

  function cartaOggiHtml(d, ambito, uid) {
    const chi = ambito === "italia" ? null : [uid].concat(sottoDi(d.rete, uid));
    const mese = misura(d, chi, meseISO());
    const oggiN = misura(d, chi, new Date().toISOString().slice(0, 10));
    const ob = ambito === "italia" ? d.ob.find((x) => !x.utente) : d.ob.find((x) => x.utente === uid);
    const ora = new Date();
    let fermi = 0;
    if (ambito === "italia" || (chi && chi.length > 1)) {
      const persone = d.rete.filter((r) => r.stato === "attivo" && r.utente !== uid && (!chi || chi.indexOf(r.utente) >= 0));
      const ultimo = (u) => [].concat(
        d.vend.filter((x) => x.venditore === u).map((x) => x.creato),
        d.aff.filter((x) => x.segnalato_da === u).map((x) => x.creato)
      ).filter(Boolean).sort().pop();
      fermi = persone.filter((r) => {
        const l = ultimo(r.utente);
        return !l || Date.now() - new Date(l).getTime() > 30 * 864e5;
      }).length;
    }
    const ambitoTxt = ambito === "italia" ? "Tutta Italia" : (chi.length > 1 ? "Tu e la tua squadra" : "Il tuo mese");
    const dove = ambito === "italia" ? "#/admin/proposte-rete" : "#/agente/catena";
    return html`<div class="card dir-oggi">
      <h2 class="rp-nome-h">Oggi, ${GIORNI[ora.getDay()]} ${ora.getDate()} ${MESI[ora.getMonth()]}</h2>
      <p class="note">${ambitoTxt} · obiettivi di ${MESI[ora.getMonth()]} · ${pl(giorniLavorativiRimasti(), "giorno lavorativo", "giorni lavorativi")} alla fine${ob && ob.nota ? " · " + ob.nota : ""}</p>
      ${barre(mese, oggiN, ob)}
      ${fermi ? html`<p class="dir-sotto"><a href="${dove}">${pl(fermi, "persona ferma", "persone ferme")} da più di 30 giorni: guarda La catena.</a></p>` : ""}
    </div>`;
  }

  async function paginaOggi(el) {
    if (!db()) { el.innerHTML = cartaManca().s; return; }
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const d = await datiAndamento();
    if (!el.isConnected) return;
    if (d.error) {
      el.innerHTML = (mancaErrore(d.error) ? cartaManca() : html`<div class="card"><p>${spiega(d.error)}</p></div>`).s;
      return;
    }
    const uid = await sessione();
    const diretti = d.rete.filter((r) => r.ruolo === "reteitalia" || r.ruolo === "sviluppo");
    const tutti = d.rete.filter((r) => r.stato === "attivo");
    const riga = (r) => {
      const chi = [r.utente].concat(sottoDi(d.rete, r.utente));
      const m = misura(d, chi, meseISO());
      const ob = d.ob.find((x) => x.utente === r.utente);
      const pc = ob && Number(ob.aziende) ? Math.round((m.aziende / Number(ob.aziende)) * 100) : null;
      const col = pc == null ? "" : pc >= 100 ? "ok" : pc >= 50 ? "wait" : "new";
      return html`<div class="dir-persona">
        <div><b>${r.nome || r.codice || "Persona"}</b><p class="note">${RUOLI[r.ruolo] || r.ruolo} · ${m.aziende}${ob ? "/" + ob.aziende : ""} aziende · ${m.lavori}${ob ? "/" + ob.lavori : ""} lavori · ${euro(m.canoni)}/mese${ob ? "" : " · senza obiettivo"}</p></div>
        ${pc != null ? html`<span class="tag ${col}">${pc}%</span>` : ""}
      </div>`;
    };
    el.innerHTML = html`
      ${cartaOggiHtml(d, "italia", uid)}
      ${diretti.length ? html`<h2 class="rp-nome-h" style="margin-top:18px">I responsabili</h2>${diretti.map(riga)}` : ""}
      <div class="card" style="margin-top:16px">
        <h2 class="rp-nome-h">Fissa gli obiettivi</h2>
        <form id="dir-obiettivo" novalidate>
          <div class="fields">
            <div class="field"><label for="dir-ob-chi">Per chi</label>
              <select id="dir-ob-chi" name="utente"><option value="">Tutta Italia</option>${tutti.map((r) => html`<option value="${r.utente}">${r.nome || r.codice || "Persona"} · ${RUOLI[r.ruolo] || r.ruolo}</option>`)}</select>
              <p class="note">La persona risponde per sé e per chi ha sotto.</p>
            </div>
            <div class="field"><label for="dir-ob-mese">Mese</label>
              <select id="dir-ob-mese" name="mese"><option value="${primoMese()}">${nomeMese(meseISO())}</option><option value="${prossimoPrimo()}">il mese prossimo</option></select>
            </div>
          </div>
          <div class="fields">
            <div class="field"><label for="dir-ob-az">Nuove aziende</label><input id="dir-ob-az" name="aziende" type="number" min="0" step="1"></div>
            <div class="field"><label for="dir-ob-ca">Nuovi canoni (€/mese)</label><input id="dir-ob-ca" name="canoni" type="number" min="0" step="1"></div>
            <div class="field"><label for="dir-ob-la">Lavori firmati</label><input id="dir-ob-la" name="lavori" type="number" min="0" step="1"></div>
            <div class="field"><label for="dir-ob-va">Valore lavori (€)</label><input id="dir-ob-va" name="valore" type="number" min="0" step="100"></div>
          </div>
          <div class="field"><label for="dir-ob-nota">Nota</label><input id="dir-ob-nota" name="nota" maxlength="300" placeholder="Es. spingere il modulo Sicurezza"></div>
          <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Salva gli obiettivi</button></div>
          <p class="note">Li fissate tu e il Responsabile Rete Italia. La persona li vede subito nella sua home.</p>
        </form>
      </div>`.s;
    const f = el.querySelector("#dir-obiettivo");
    if (f) f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const n = (k) => (f[k].value === "" ? 0 : Number(f[k].value));
      const btn = f.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      const res = await conTempo(db().rpc("app_fissa_obiettivo", {
        p_utente: f.utente.value || null,
        p_mese: f.mese.value,
        p_aziende: n("aziende"),
        p_canoni: n("canoni"),
        p_lavori: n("lavori"),
        p_valore: n("valore"),
        p_nota: f.nota.value.trim()
      }));
      if (btn) btn.disabled = false;
      if (res.error) { toast(spiega(res.error), "error"); return; }
      toast("Obiettivi salvati.");
      contaCache = null;
      paginaOggi(el);
    });
  }

  function chip(etichetta, voto, serve) {
    if (serve === false) return html``;
    const cls = voto === "si" ? "si" : voto === "no" ? "no" : "attesa";
    const txt = voto === "si" ? "sì" : voto === "no" ? "no" : "attesa";
    return html`<span class="rp-voto"><i class="rp-dot ${cls}" aria-hidden="true"></i> ${etichetta}: ${txt}</span>`;
  }

  async function paginaStrategia(el, decisore) {
    if (decisore !== undefined) stratDecisore = decisore;
    if (!db()) { el.innerHTML = cartaManca().s; return; }
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const res = await conTempo(db().from("app_strategie").select("*").order("aggiornato", { ascending: false }).limit(300));
    if (!el.isConnected) return;
    if (res.error) {
      el.innerHTML = (mancaErrore(res.error) ? cartaManca() : html`<div class="card"><p>${spiega(res.error)}</p></div>`).s;
      return;
    }
    const tutte = res.data || [];
    if (stratId) return strategiaUna(el, tutte.find((s) => s.id === stratId));
    const l = tutte.filter((s) => s.stato === stratFiltro);
    const campoVoto = stratDecisore === "reteitalia" ? "voto_reteitalia" : "voto_admin";
    const daMe = stratDecisore ? tutte.filter((s) => s.stato === "aperta" && !s[campoVoto]).length : 0;
    const nAperte = tutte.filter((s) => s.stato === "aperta").length;
    const tab = (id, t) => html`<button type="button" class="tab${stratFiltro === id ? " on" : ""}" data-filtro="${id}">${t}</button>`;
    el.innerHTML = html`
      <p class="note">Qui parlano i dirigenti: sviluppo rete, capi area, Responsabile Rete Italia e admin. Decidono admin e Responsabile Rete Italia; quello che decidono lo vede tutta la rete.</p>
      ${daMe ? html`<div class="card"><p>${pl(daMe, "argomento aspetta", "argomenti aspettano")} la tua decisione.</p></div>` : ""}
      <div class="rp-schede">${tab("aperta", nAperte ? "In discussione " + nAperte : "In discussione")}${tab("decisa", "Decise")}${tab("scartata", "Non passate")}</div>
      ${l.length ? l.map((s) => html`<button type="button" class="card dir-riga" data-arg="${s.id}">
        <b>${s.titolo}</b>
        <p class="note">${TEMI[s.tema] || s.tema} · ${pl((s.commenti || []).filter((c) => !c.voto).length, "commento", "commenti")} · ${dataIt(s.aggiornato)}</p>
      </button>`) : html`<p class="note">${stratFiltro === "aperta" ? "Nessun argomento aperto." : "Niente qui."}</p>`}
      ${stratFiltro === "aperta" ? html`<div class="card" style="margin-top:16px"><h2 class="rp-nome-h">Apri un argomento</h2>
        <form id="dir-apri" novalidate>
          <div class="field"><label for="dir-titolo">Di cosa vuoi parlare</label><input id="dir-titolo" name="titolo" maxlength="140" required placeholder="Es. Puntare sugli impiantisti in Campania"></div>
          <div class="field"><label for="dir-tema">Tema</label><select id="dir-tema" name="tema">${Object.keys(TEMI).map((k) => html`<option value="${k}">${TEMI[k]}</option>`)}</select></div>
          <div class="field"><label for="dir-testo">Spiega</label><textarea id="dir-testo" name="testo" rows="4" maxlength="2000" placeholder="Cosa hai visto, cosa proponi, con quali numeri"></textarea></div>
          <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Apri la discussione</button></div>
        </form>
      </div>` : ""}`.s;
    el.onclick = (e) => {
      const b = e.target.closest("[data-filtro]");
      if (b) { stratFiltro = b.getAttribute("data-filtro"); paginaStrategia(el); return; }
      const a = e.target.closest("[data-arg]");
      if (a) { stratId = a.getAttribute("data-arg"); paginaStrategia(el); }
    };
    const f = el.querySelector("#dir-apri");
    if (f) f.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (f.titolo.value.trim().length < 3) { toast("Scrivi di cosa vuoi parlare.", "error"); return; }
      const btn = f.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      const r = await conTempo(db().rpc("app_strategia_apri", { p_titolo: f.titolo.value.trim(), p_testo: f.testo.value.trim(), p_tema: f.tema.value }));
      if (btn) btn.disabled = false;
      if (r.error) { toast(spiega(r.error), "error"); return; }
      toast("Discussione aperta.");
      contaCache = null;
      stratId = r.data || "";
      stratFiltro = "aperta";
      paginaStrategia(el);
    });
  }

  async function strategiaUna(el, s) {
    if (!s) {
      const res = await conTempo(db().from("app_strategie").select("*").eq("id", stratId).maybeSingle());
      if (res.error && mancaErrore(res.error)) { el.innerHTML = cartaManca().s; return; }
      s = res.data;
    }
    if (!s) { stratId = ""; el.innerHTML = html`<p class="note">Argomento non trovato.</p>`.s; return; }
    titolo("Sala strategia", s.titolo);
    const msg = (s.commenti || []).map((c) => c.voto
      ? html`<div class="card rp-card" style="border-left:4px solid ${c.voto === "si" ? "var(--ok)" : "var(--danger)"}"><p class="note">${c.nome || ""} · ${NOMECHI[c.ruolo] || c.ruolo || ""} · ${dataIt(c.quando)}</p><p><b>${c.voto === "si" ? "Sì" : "No"}</b>${c.linea ? " · linea: «" + c.linea + "»" : ""}${c.testo ? " · " + c.testo : ""}</p></div>`
      : html`<div class="card rp-card"><p class="note">${c.nome || ""} · ${NOMECHI[c.ruolo] || c.ruolo || ""} · ${dataIt(c.quando)}</p><p style="white-space:pre-line">${c.testo}</p></div>`);
    el.innerHTML = html`
      <button type="button" class="tab" id="dir-indietro">‹ In discussione</button>
      <div class="card" style="margin-top:12px">
        <div class="rp-testa"><div><h2 class="rp-nome-h">${s.titolo}</h2><p class="note">${TEMI[s.tema] || s.tema} · aperto ${dataIt(s.creato)}</p></div>
          <span class="tag ${s.stato === "decisa" ? "ok" : s.stato === "scartata" ? "new" : "wait"}">${s.stato === "decisa" ? "Decisa" : s.stato === "scartata" ? "Non passa" : "In discussione"}</span></div>
        ${s.testo ? html`<p style="white-space:pre-line">${s.testo}</p>` : ""}
        <div class="rp-voti">${chip("Admin", s.voto_admin, true)}${chip("Rete Italia", s.voto_reteitalia, s.serve_reteitalia)}</div>
        ${s.linea ? html`<p class="dir-linea"><b>${s.stato === "decisa" ? "Linea decisa" : "Linea proposta"}:</b> ${s.linea}</p>` : ""}
      </div>
      <h2 class="rp-nome-h" style="margin-top:16px">La discussione</h2>
      ${msg.length ? msg : html`<p class="note">Nessun commento ancora.</p>`}
      ${s.stato === "aperta" ? html`<form id="dir-commento" style="margin-top:12px">
        <div class="field"><label for="dir-comm">Il tuo commento</label><textarea id="dir-comm" name="testo" rows="3" maxlength="1000" required></textarea></div>
        <div class="row-actions" style="margin-top:8px"><button class="tab" type="submit">Commenta</button></div>
      </form>` : ""}
      ${s.stato === "aperta" && stratDecisore ? html`<div class="card" style="margin-top:16px">
        <h2 class="rp-nome-h">${(stratDecisore === "reteitalia" ? s.voto_reteitalia : s.voto_admin) === "si" ? "Hai detto sì: puoi ancora cambiare la linea" : "Decidi"}</h2>
        <div class="field"><label for="dir-linea">La linea</label><textarea id="dir-linea" rows="3" maxlength="1000">${s.linea || ""}</textarea>
          <p class="note">Cosa fa la rete da domani. Se cambi il testo, anche l'altro deve ridire sì.</p></div>
        <div class="field"><label for="dir-nota">Nota, se vuoi</label><input id="dir-nota" maxlength="300"></div>
        <div class="row-actions"><button type="button" class="btn-in" data-si="1">Sì, si fa</button><button type="button" class="tab" data-si="0">No</button></div>
      </div>` : ""}`.s;
    el.querySelector("#dir-indietro").addEventListener("click", () => { stratId = ""; titolo("Sala strategia", "I dirigenti ne parlano. Decidono admin e Responsabile Rete Italia."); paginaStrategia(el); });
    const fc = el.querySelector("#dir-commento");
    if (fc) fc.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (fc.testo.value.trim().length < 2) { toast("Scrivi il commento.", "error"); return; }
      const r = await conTempo(db().rpc("app_strategia_commenta", { p_id: s.id, p_testo: fc.testo.value.trim() }));
      if (r.error) { toast(spiega(r.error), "error"); return; }
      toast("Commento pubblicato.");
      stratId = s.id;
      paginaStrategia(el);
    });
    el.querySelectorAll("[data-si]").forEach((b) => b.addEventListener("click", async () => {
      const si = b.getAttribute("data-si") === "1";
      const linea = (el.querySelector("#dir-linea") || {}).value || "";
      const nota = (el.querySelector("#dir-nota") || {}).value || "";
      b.disabled = true;
      const r = await conTempo(db().rpc("app_strategia_decidi", { p_id: s.id, p_si: si, p_linea: linea.trim(), p_nota: nota.trim() }));
      if (b.isConnected) b.disabled = false;
      if (r.error) { toast(spiega(r.error), "error"); return; }
      const esito = r.data;
      toast(esito === "decisa" ? "Decisa: tutta la rete la vede." : esito === "scartata" ? "Non passa." : "Sì registrato. Resta in attesa dell'altro sì.");
      contaCache = null;
      paginaStrategia(el);
    }));
  }

  async function paginaLavori(el) {
    if (!db()) { el.innerHTML = cartaManca().s; return; }
    if (lavoroId) return lavoroUno(el, lavoroId);
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const [affR, reteR] = await Promise.all([
      conTempo(db().from("app_affari").select("*").order("creato", { ascending: false }).limit(2000)),
      conTempo(db().from("app_rete").select("utente, nome, codice").limit(2000))
    ]);
    if (!el.isConnected) return;
    const err = (affR && affR.error) || (reteR && reteR.error);
    if (err && mancaErrore(err)) { el.innerHTML = cartaManca().s; return; }
    if (affR.error) { el.innerHTML = html`<div class="card"><p>${spiega(affR.error)}</p></div>`.s; return; }
    const aff = affR.data || [];
    const rete = (reteR && reteR.data) || [];
    const nome = (u) => (rete.find((x) => x.utente === u) || {}).nome || "";
    const gruppo = (st, t, vuoto) => {
      const g = aff.filter((a) => a.stato === st);
      return html`<h2 class="rp-nome-h" style="margin-top:16px">${t}</h2>${g.length ? g.map((a) => html`<button type="button" class="card dir-riga" data-lav="${a.id}"><b>${a.cliente_nome}</b><p class="note">${euro(a.valore)} · di ${nome(a.segnalato_da) || "—"} · ${dataIt(a.creato)}</p></button>`) : html`<p class="note">${vuoto}</p>`}`;
    };
    el.innerHTML = html`
      ${gruppo("proposta", "Da firmare", "Nessuno.")}
      ${gruppo("firmato", "In corso", "Nessuno.")}
      ${gruppo("chiuso", "Collaudati", "Nessuno.")}`.s;
    el.onclick = (e) => {
      const b = e.target.closest("[data-lav]");
      if (!b) return;
      lavoroId = b.getAttribute("data-lav");
      paginaLavori(el);
    };
  }

  async function lavoroUno(el, id) {
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const [aR, trR, provR, reteR, margR] = await Promise.all([
      conTempo(db().from("app_affari").select("*").eq("id", id).maybeSingle()),
      conTempo(db().from("app_affari_tranche").select("*").eq("affare", id)),
      conTempo(db().from("app_provvigioni").select("beneficiario, ruolo, importo, tranche, stato").eq("affare", id).limit(500)),
      conTempo(db().from("app_rete").select("utente, nome, codice, ruolo, stato").limit(2000)),
      conTempo(db().from("app_affari_margine").select("margine").eq("affare", id).maybeSingle())
    ]);
    if (!el.isConnected) return;
    const primo = [aR, trR].map((r) => r && r.error).find((e) => e && mancaErrore(e));
    if (primo) { el.innerHTML = cartaManca().s; return; }
    if (aR.error || !aR.data) { lavoroId = ""; el.innerHTML = html`<p class="note">Non trovato.</p>`.s; return; }
    const a = aR.data;
    const tr = ((trR && trR.data) || []).slice().sort((x, y) => x.n - y.n);
    const prov = (provR && provR.data) || [];
    const rete = (reteR && reteR.data) || [];
    const marg = margR && !margR.error ? margR.data : null;
    const nome = (u) => (u ? ((rete.find((x) => x.utente === u) || {}).nome || "—") : "—");
    titolo("Lavori rete", a.cliente_nome);
    const opz = (sel) => html`<option value="">—</option>${rete.filter((r) => r.stato === "attivo").map((r) => html`<option value="${r.utente}"${r.utente === sel ? ui().raw(" selected") : ""}>${r.nome || r.codice || "Persona"} · ${RUOLI[r.ruolo] || r.ruolo}</option>`)}`;
    const trancheH = tr.map((t) => {
      const atteso = Number(a.valore) * Number(t.quota) / 100;
      const prima = a.stato === "firmato" && t.stato === "attesa" && tr.filter((x) => x.n < t.n).every((x) => x.stato === "incassata");
      return html`<div class="card rp-card">
        <div class="rp-testa"><b>${t.n}. ${t.nome} · ${t.quota}%</b><span class="tag ${t.stato === "incassata" ? "ok" : "wait"}">${t.stato === "incassata" ? "incassata" : "in attesa"}</span></div>
        <p class="note">${t.stato === "incassata" ? "Incassati " + euro(t.incassato) + " il " + dataIt(t.incassato_il) : "Previsti " + euro(atteso)}</p>
        ${prima ? html`<div class="row-actions" style="margin-top:8px"><input id="dir-inc" type="number" min="0" step="0.01" value="${atteso.toFixed(2)}"><button type="button" class="btn-in" data-inc="${t.n}">Incassato</button></div>` : ""}
      </div>`;
    });
    const statoTag = a.stato === "firmato" ? "In corso" : a.stato === "chiuso" ? "Collaudato" : a.stato === "perso" ? "Perso" : "Da firmare";
    el.innerHTML = html`
      <button type="button" class="tab" id="dir-lavori-back">‹ Lavori rete</button>
      <div class="card" style="margin-top:12px">
        <h2 class="rp-nome-h">${a.cliente_nome}</h2>
        <p class="note">${TIPO_CL[a.cliente_tipo] || a.cliente_tipo}${a.cliente_regione ? " · " + a.cliente_regione : ""}${a.cliente_contatto ? " · " + a.cliente_contatto : ""}</p>
        ${a.descrizione ? html`<p>${a.descrizione}</p>` : ""}
        <p>Valore: <b>${Number(a.valore) ? euro(a.valore) : "da definire"}</b> · ${statoTag}</p>
        <p class="note">Chi segnala: ${nome(a.segnalato_da)} · Chi chiude: ${nome(a.chiude)} · Chi segue il cantiere: ${nome(a.segue)} · Chi ha portato l'impresa: ${nome(a.impresa_da)}</p>
        ${marg ? html`<p>Margine: <b>${euro(marg.margine)}</b></p>` : ""}
      </div>
      ${tr.length ? html`<h2 class="rp-nome-h" style="margin-top:16px">Le tranche</h2>${trancheH}` : (a.stato === "proposta" ? html`<p class="note">Quando AncheCasa firma il contratto con il cliente, qui compaiono le tre tranche: 30% firma e acconto, 30% metà lavori, 40% collaudo.</p>` : "")}
      ${prov.length ? html`<h2 class="rp-nome-h" style="margin-top:16px">Provvigioni del lavoro</h2>${prov.map((p) => html`<p class="note">${euro(p.importo)} · ${nome(p.beneficiario)} · ${RUOLI_PROV[p.ruolo] || p.ruolo} · lavoro, tranche ${p.tranche}</p>`)}` : ""}
      <p class="note">Alla rete va il 35% dell'utile del cantiere: chi segnala 10%, chi chiude 25%, chi segue il cantiere 30%, chi ha portato l'impresa 10%, sviluppo rete 12%, capo area 8%, Rete Italia 5%. Maturano solo sull'incassato.</p>
      ${(a.stato === "proposta" || a.stato === "firmato") ? html`<form id="dir-firma" class="card" style="margin-top:12px" novalidate>
        <h2 class="rp-nome-h">${a.stato === "proposta" ? "Firma il lavoro" : "Correggi ruoli e margine"}</h2>
        <div class="fields">
          <div class="field"><label for="dir-valore">Valore del contratto (€)</label><input id="dir-valore" name="valore" type="number" min="0" step="0.01" value="${a.valore}"></div>
          <div class="field"><label for="dir-margine">Margine lordo (€)</label><input id="dir-margine" name="margine" type="number" min="0" step="0.01" value="${marg ? marg.margine : ""}"><p class="note">Lo vedi solo tu.</p></div>
        </div>
        <div class="field"><label for="dir-chiude">Chi chiude</label><select id="dir-chiude" name="chiude">${opz(a.chiude)}</select></div>
        <div class="field"><label for="dir-segue">Chi segue il cantiere</label><select id="dir-segue" name="segue">${opz(a.segue)}</select></div>
        <div class="field"><label for="dir-impresa">Chi ha portato l'impresa</label><select id="dir-impresa" name="impresa">${opz(a.impresa_da)}</select></div>
        <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">${a.stato === "proposta" ? "Contratto firmato" : "Salva"}</button></div>
      </form>` : ""}
      ${a.stato === "proposta" ? html`<div class="row-actions" style="margin-top:8px"><button type="button" class="tab" id="dir-perso">Lavoro perso</button></div>` : ""}`.s;
    el.querySelector("#dir-lavori-back").addEventListener("click", () => {
      lavoroId = "";
      titolo("Lavori rete", "Cantieri della rete, provvigioni a tranche sull'incassato.");
      paginaLavori(el);
    });
    const ff = el.querySelector("#dir-firma");
    if (ff) ff.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (ff.margine.value === "") { toast("Scrivi il margine lordo.", "error"); return; }
      const btn = ff.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      const r = await conTempo(db().rpc("app_affare_firma", {
        p_affare: id,
        p_valore: Number(ff.valore.value || 0),
        p_margine: Number(ff.margine.value),
        p_chiude: ff.chiude.value || null,
        p_segue: ff.segue.value || null,
        p_impresa_da: ff.impresa.value || null
      }));
      if (btn) btn.disabled = false;
      if (r.error) { toast(spiega(r.error), "error"); return; }
      toast("Salvato.");
      contaCache = null;
      lavoroUno(el, id);
    });
    const inc = el.querySelector("[data-inc]");
    if (inc) inc.addEventListener("click", async () => {
      const campo = el.querySelector("#dir-inc");
      if (!campo || campo.value === "") { toast("Scrivi quanto è stato incassato.", "error"); return; }
      inc.disabled = true;
      const r = await conTempo(db().rpc("app_tranche_incassata", { p_affare: id, p_n: Number(inc.getAttribute("data-inc")), p_incasso: Number(campo.value) }));
      if (inc.isConnected) inc.disabled = false;
      if (r.error) { toast(spiega(r.error), "error"); return; }
      toast("Incasso registrato: " + euro(r.data) + " di provvigioni alla rete.");
      lavoroUno(el, id);
    });
    const perso = el.querySelector("#dir-perso");
    if (perso) perso.addEventListener("click", async () => {
      perso.disabled = true;
      const r = await conTempo(db().from("app_affari").update({ stato: "perso" }).eq("id", id));
      if (perso.isConnected) perso.disabled = false;
      if (r.error) { toast(spiega(r.error), "error"); return; }
      toast("Segnato come perso.");
      contaCache = null;
      lavoroId = "";
      titolo("Lavori rete", "Cantieri della rete, provvigioni a tranche sull'incassato.");
      paginaLavori(el);
    });
  }

  async function paginaLinee(el, sala) {
    if (!db()) { el.innerHTML = cartaManca().s; return; }
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const res = await conTempo(db().rpc("app_linee_decise"));
    if (!el.isConnected) return;
    if (res.error) {
      el.innerHTML = (mancaErrore(res.error) ? cartaManca() : html`<div class="card"><p>${spiega(res.error)}</p></div>`).s;
      return;
    }
    const l = res.data || [];
    el.innerHTML = html`
      <p class="note">Le decisioni di AncheCasa per la rete: le prendono l'admin e il Responsabile Rete Italia dopo averne parlato con i dirigenti.</p>
      ${l.length ? l.map((x) => html`<div class="card dir-linea-card"><p class="note">${TEMI[x.tema] || ""} · decisa ${dataIt(x.deciso)}</p><h2 class="rp-nome-h">${x.titolo}</h2><p style="white-space:pre-line">${x.linea}</p></div>`) : html`<p class="note">Nessuna linea decisa ancora.</p>`}
      ${sala ? html`<div class="row-actions" style="margin-top:12px"><a class="tab" href="#/agente/strategia">Vai alla sala strategia</a></div>` : ""}`.s;
  }

  function vedeSala() {
    return !!(io && io.stato === "attivo" && DIRIGENTI.indexOf(io.ruolo) >= 0);
  }

  function prepara() {
    if (chiesto || !db()) return;
    chiesto = true;
    sessione().then((uid) => {
      if (!uid) return null;
      return conTempo(db().from("app_rete").select("utente, ruolo, stato, nome, superiore").eq("utente", uid).maybeSingle());
    }).then((res) => {
      if (res && res.data) io = res.data;
      if (vedeSala() && AC.app && AC.app.refresh) AC.app.refresh();
    }).catch(() => {});
  }

  async function riempiHome(box) {
    if (!box || !db()) return;
    const uid = await sessione();
    const d = await datiAndamento();
    if (!box.isConnected) return;
    if (d.error) {
      box.innerHTML = (mancaErrore(d.error) ? cartaManca() : html``).s;
      return;
    }
    if (!uid) { box.innerHTML = ""; return; }
    const linea = await conTempo(db().rpc("app_linee_decise"));
    const prima = !linea.error && linea.data && linea.data[0];
    box.innerHTML = html`
      ${cartaOggiHtml(d, "io", uid)}
      ${prima ? html`<a class="card dir-linea-card" href="#/agente/linee-decise"><p class="note">Linea decisa · ${dataIt(prima.deciso)}</p><b>${prima.titolo}</b><p>${prima.linea}</p></a>` : ""}`.s;
  }

  async function riempiGuadagno(box) {
    if (!box) return;
    box.innerHTML = html`<p class="note">${AVVISO_PRIVATI}</p>`.s;
    if (!db()) return;
    const uid = await sessione();
    if (!uid) return;
    const res = await conTempo(db().from("app_provvigioni").select("affare, tranche, ruolo, importo, stato, creato").eq("beneficiario", uid).order("creato", { ascending: false }).limit(200));
    if (!box.isConnected) return;
    if (res.error) {
      if (mancaErrore(res.error)) box.insertAdjacentHTML("beforeend", cartaManca().s);
      return;
    }
    const lavori = (res.data || []).filter((p) => p.affare);
    if (!lavori.length) return;
    const ids = lavori.map((p) => p.affare);
    const aff = await conTempo(db().from("app_affari").select("id, cliente_nome").in("id", ids));
    const nomi = {};
    ((aff && aff.data) || []).forEach((a) => { nomi[a.id] = a.cliente_nome; });
    const righe = lavori.map((p) => html`<p class="note">${euro(p.importo)} · ${nomi[p.affare] || "lavoro"}, tranche ${p.tranche} · ${RUOLI_PROV[p.ruolo] || p.ruolo}</p>`);
    box.insertAdjacentHTML("beforeend", html`<h2 class="rp-nome-h" style="margin-top:16px">Provvigioni dei lavori</h2>${righe}`.s);
  }

  async function contaDaFare() {
    if (contaCache) return contaCache;
    contaCache = (async () => {
      if (!db()) return { manca: true, lavori: 0, sala: 0 };
      const [lav, sala] = await Promise.all([
        conTempo(db().from("app_affari").select("id").eq("stato", "proposta").limit(200)),
        conTempo(db().from("app_strategie").select("id, voto_admin").eq("stato", "aperta").limit(200))
      ]);
      const err = (lav && lav.error) || (sala && sala.error);
      if (err && mancaErrore(err)) return { manca: true, lavori: 0, sala: 0 };
      return {
        manca: false,
        lavori: (lav && lav.data && lav.data.length) || 0,
        sala: ((sala && sala.data) || []).filter((s) => !s.voto_admin).length
      };
    })();
    return contaCache;
  }

  function dipingi(href, n) {
    document.querySelectorAll('a[href$="' + href + '"]').forEach((a) => {
      let b = a.querySelector(".nav-badge");
      if (n > 0) {
        if (!b) { b = document.createElement("span"); b.className = "nav-badge"; a.appendChild(b); }
        b.textContent = n > 9 ? "9+" : String(n);
      } else if (b) b.remove();
    });
  }

  function badge() {
    contaDaFare().then((c) => {
      if (!c || c.manca) { dipingi("/admin/lavori-rete", 0); dipingi("/admin/strategia", 0); return; }
      dipingi("/admin/lavori-rete", c.lavori);
      dipingi("/admin/strategia", c.sala);
    });
  }

  function riempiStriscia(box) {
    if (!box) return;
    contaDaFare().then((c) => {
      if (!box.isConnected || !c || c.manca || (!c.lavori && !c.sala)) { if (box.isConnected) box.innerHTML = ""; return; }
      box.innerHTML = html`<div class="card"><p class="note">Da fare</p>
        ${c.lavori ? html`<p><a href="#/admin/lavori-rete">${pl(c.lavori, "lavoro da firmare", "lavori da firmare")}</a></p>` : ""}
        ${c.sala ? html`<p><a href="#/admin/strategia">${pl(c.sala, "argomento della sala aspetta", "argomenti della sala aspettano")} il voto admin</a></p>` : ""}
      </div>`.s;
    });
  }

  const VOCI = [
    ["richieste", "Richieste nuove su AncheCasa", "lotti, forniture e noleggi pubblicati dalle imprese"],
    ["offerte", "Offerte che hai fatto", ""],
    ["vinte", "Offerte vinte", ""],
    ["lotti", "Richieste che hai pubblicato", ""],
    ["preventivi", "Preventivi fatti", ""],
    ["fatture", "Fatture emesse", ""],
    ["cantieri", "Cantieri aperti", ""],
    ["regola", "Squadra in regola", "corsi e visite non scaduti"]
  ];

  function voceReport(n, k) {
    if (k === "offerte") return [n.offerte, n.valore_offerte ? "per " + euro(n.valore_offerte) : ""];
    if (k === "vinte") return [n.offerte_vinte, n.valore_vinte ? "per " + euro(n.valore_vinte) : ""];
    if (k === "preventivi") return [n.preventivi, n.valore_preventivi ? "per " + euro(n.valore_preventivi) : ""];
    if (k === "fatture") return [n.fatture, n.valore_fatture ? "per " + euro(n.valore_fatture) : ""];
    if (k === "cantieri") return [n.cantieri, n.giornale ? n.giornale + " giornate nel giornale" : ""];
    if (k === "regola") return [n.in_regola == null ? "–" : n.in_regola + "%", "corsi e visite non scaduti"];
    if (k === "richieste") return [n.richieste, "lotti, forniture e noleggi pubblicati dalle imprese"];
    return [n.lotti, ""];
  }

  async function numeriMese(org, ym) {
    const [rec, off, lotti, ordini] = await Promise.all([
      conTempo(db().from("app_record").select("tipo, creato, data, importo, stato, scadenza, pubblico, org").eq("org", org).limit(3000)),
      conTempo(db().from("app_offerte").select("creato, prezzo, stato").eq("org", org).limit(1000)),
      conTempo(db().from("app_record").select("org, creato, tipo, pubblico").eq("tipo", "lotto").eq("pubblico", true).limit(2000)),
      conTempo(db().from("app_ordini").select("creato").eq("org", org).limit(500))
    ]);
    const err = [rec, off, lotti, ordini].map((r) => r && r.error).find(Boolean);
    if (err) return { error: err };
    const nel = (d) => String(d || "").indexOf(ym) === 0;
    const tipo = (t) => (rec.data || []).filter((r) => r.tipo === t);
    const offM = (off.data || []).filter((o) => nel(o.creato));
    const valoreOff = (lista) => lista.reduce((s, o) => s + Number(o.prezzo || 0), 0);
    const prev = tipo("preventivo").filter((r) => nel(r.data || r.creato));
    const fatt = tipo("fattura").filter((r) => nel(r.data || r.creato));
    const scad = (rec.data || []).filter((r) => (r.tipo === "attestato" || r.tipo === "visita") && r.scadenza);
    const oggi = new Date().toISOString().slice(0, 10);
    return {
      richieste: (lotti.data || []).filter((l) => l.org !== org && nel(l.creato)).length,
      offerte: offM.length,
      offerte_vinte: offM.filter((o) => o.stato === "accettata").length,
      valore_offerte: valoreOff(offM),
      valore_vinte: valoreOff(offM.filter((o) => o.stato === "accettata")),
      lotti: tipo("lotto").filter((l) => nel(l.creato)).length,
      preventivi: prev.length,
      valore_preventivi: prev.reduce((s, r) => s + Number(r.importo || 0), 0),
      fatture: fatt.length,
      valore_fatture: fatt.reduce((s, r) => s + Number(r.importo || 0), 0),
      cantieri: tipo("cantiere").filter((r) => r.stato !== "finito").length,
      giornale: tipo("giornale").filter((r) => nel(r.data || r.creato)).length,
      in_regola: scad.length ? Math.round((scad.filter((r) => r.scadenza >= oggi).length / scad.length) * 100) : null
    };
  }

  let meseScelto = "";

  async function paginaMese(el) {
    if (!db()) {
      el.innerHTML = html`${cartaManca()}<p class="note">${ARRIVO}</p>`.s;
      return;
    }
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const probe = await conTempo(db().from("app_org").select("id").limit(1));
    if (!el.isConnected) return;
    if (probe.error && mancaErrore(probe.error)) {
      el.innerHTML = html`${cartaManca()}<p class="note">${ARRIVO}</p>`.s;
      return;
    }
    const uid = await sessione();
    const ym = meseScelto || meseISO();
    const mem = uid ? await conTempo(db().from("app_org_membri").select("org").eq("utente", uid).limit(1)) : { data: [], error: null };
    if (!el.isConnected) return;
    if (mem.error && mancaErrore(mem.error)) {
      el.innerHTML = html`${cartaManca()}<p class="note">${ARRIVO}</p>`.s;
      return;
    }
    const org = mem.data && mem.data[0] && mem.data[0].org;
    if (!org) {
      el.innerHTML = html`<div class="card"><p>${ARRIVO}</p></div>`.s;
      return;
    }
    const orgR = await conTempo(db().from("app_org").select("nome").eq("id", org).maybeSingle());
    const n = await numeriMese(org, ym);
    if (!el.isConnected) return;
    if (n.error) {
      el.innerHTML = (mancaErrore(n.error) ? html`${cartaManca()}<p class="note">${ARRIVO}</p>` : html`<div class="card"><p>${spiega(n.error)}</p></div>`).s;
      return;
    }
    const nome = (orgR.data && orgR.data.nome) || "La tua azienda";
    const prima = (() => { const d = new Date(ym + "-01T12:00:00"); d.setMonth(d.getMonth() - 1); return meseISO(d); })();
    el.innerHTML = html`
      <div class="card dir-oggi"><h2 class="rp-nome-h">${nome}</h2><p class="note">Il tuo mese con AncheCasa · ${nomeMese(ym)}</p></div>
      <div class="dir-kpi">${VOCI.map(([k, t]) => {
        const v = voceReport(n, k);
        return html`<div class="card dir-k"><b>${v[0]}</b><span>${t}${v[1] ? html`<br>${v[1]}` : ""}</span></div>`;
      })}</div>
      ${n.offerte === 0 && n.richieste > 0 ? html`<div class="card"><p>Ci sono state ${n.richieste} richieste nuove e non hai fatto offerte.</p></div>` : ""}
      <div class="row-actions" style="margin-top:12px"><button type="button" class="btn-in" id="dir-stampa">Scarica il report su carta intestata</button></div>
      <div class="row-actions">
        <button type="button" class="tab" data-mese="${prima}">Mese prima</button>
        ${ym !== meseISO() ? html`<button type="button" class="tab" data-mese="">Questo mese</button>` : ""}
      </div>
      <p class="note">Ogni mese AncheCasa ti manda questo report. I numeri sono quelli che registri nell'app.</p>`.s;
    el.querySelector("#dir-stampa").addEventListener("click", () => stampaReport(nome, ym, n));
    el.querySelectorAll("[data-mese]").forEach((b) => b.addEventListener("click", () => {
      meseScelto = b.getAttribute("data-mese");
      paginaMese(el);
    }));
  }

  function caricaJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    return new Promise((ok, no) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = () => ok();
      s.onerror = () => no(new Error("pdf"));
      document.head.appendChild(s);
    });
  }

  function immagine(src) {
    return new Promise((ok) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        ok(c.toDataURL("image/png"));
      };
      img.onerror = () => ok("");
      img.src = src;
    });
  }

  async function stampaReport(nome, ym, n) {
    try { await caricaJsPdf(); }
    catch (e) { toast("Non riesco a preparare il PDF.", "error"); return; }
    const logo = await immagine("img/carta-logo-bianco.png");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFillColor(42, 60, 84);
    doc.rect(0, 0, 210, 28, "F");
    if (logo) doc.addImage(logo, "PNG", 14, 8, 42, 12);
    else { doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.text("AncheCasa", 14, 16); }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("Report mensile", 196, 12, { align: "right" });
    doc.text(nomeMese(ym), 196, 18, { align: "right" });
    doc.setFillColor(229, 107, 16);
    doc.rect(0, 28, 210, 3, "F");
    doc.setTextColor(42, 60, 84);
    doc.setFontSize(18);
    doc.text("Il tuo mese con AncheCasa", 14, 42);
    doc.setFontSize(11);
    doc.setTextColor(90, 100, 112);
    doc.text(nome + " · " + nomeMese(ym), 14, 49);
    VOCI.forEach((v, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 14 + col * 47;
      const y = 56 + row * 28;
      doc.setDrawColor(223, 230, 239);
      doc.roundedRect(x, y, 44, 24, 2, 2);
      const val = voceReport(n, v[0]);
      doc.setTextColor(42, 60, 84);
      doc.setFontSize(16);
      doc.text(String(val[0]), x + 3, y + 10);
      doc.setFontSize(8);
      doc.setTextColor(90, 100, 112);
      const righe = doc.splitTextToSize(v[1] + (val[1] ? "\n" + val[1] : ""), 38);
      doc.text(righe, x + 3, y + 16);
    });
    doc.setTextColor(42, 60, 84);
    doc.setFontSize(11);
    doc.text("LAVORO DALLA PIATTAFORMA", 14, 120);
    const max = Math.max(1, n.richieste, n.offerte, n.offerte_vinte, n.preventivi);
    [["Richieste nuove", n.richieste, [159, 179, 200]], ["Offerte fatte", n.offerte, [42, 60, 84]], ["Offerte vinte", n.offerte_vinte, [229, 107, 16]], ["Preventivi fatti", n.preventivi, [61, 106, 154]]].forEach((b, i) => {
      const y = 126 + i * 10;
      doc.setFontSize(10);
      doc.setTextColor(26, 36, 50);
      doc.text(b[0], 14, y + 4);
      doc.setFillColor(238, 242, 247);
      doc.roundedRect(62, y, 110, 5, 2, 2, "F");
      doc.setFillColor(b[2][0], b[2][1], b[2][2]);
      doc.roundedRect(62, y, Math.max(2, 110 * (b[1] / max)), 5, 2, 2, "F");
      doc.text(String(b[1]), 180, y + 4);
    });
    const nota = n.offerte_vinte
      ? "Questo mese hai vinto " + pl(n.offerte_vinte, "offerta", "offerte") + (n.valore_vinte ? " per " + euro(n.valore_vinte) : "") + "."
      : n.richieste
        ? "Ci sono state " + pl(n.richieste, "richiesta nuova", "richieste nuove") + ": rispondi entro 48 ore, chi risponde prima vince più spesso."
        : "Completa il profilo e il listino: le imprese ti trovano quando cercano nella tua zona.";
    doc.setFillColor(251, 248, 243);
    doc.rect(14, 170, 182, 28, "F");
    doc.setFillColor(229, 107, 16);
    doc.rect(14, 170, 2, 28, "F");
    doc.setFontSize(10);
    doc.setTextColor(26, 36, 50);
    doc.text(doc.splitTextToSize(nota + " Per qualsiasi dubbio scrivi al tuo referente AncheCasa.", 170), 20, 178);
    doc.setDrawColor(223, 230, 239);
    doc.line(14, 275, 196, 275);
    doc.setFontSize(8);
    doc.setTextColor(90, 100, 112);
    doc.text("AncheCasa · Palumbo Investment S.r.l.", 14, 282);
    doc.text("anchecasa.it", 196, 282, { align: "right" });
    doc.save("AncheCasa-il-tuo-mese.pdf");
  }

  async function paginaSalaAgente(el) {
    if (!vedeSala()) {
      el.innerHTML = html`<div class="card"><p>La sala strategia è dei dirigenti. Le decisioni le trovi in Linee decise.</p></div><div class="row-actions"><a class="tab" href="#/agente/linee-decise">Linee decise</a></div>`.s;
      return;
    }
    return paginaStrategia(el, io && io.ruolo === "reteitalia" ? "reteitalia" : "");
  }

  AC.views = AC.views || {};
  AC.views["oggi-rete"] = {
    title: "Oggi",
    sub: "Andamento e obiettivi del mese, tutta la rete.",
    render(el) { paginaOggi(el); }
  };
  AC.views.strategia = {
    title: "Sala strategia",
    sub: "I dirigenti ne parlano. Decidono admin e Responsabile Rete Italia.",
    render(el) {
      const fam = (window.AC && AC.store && AC.store.data && AC.store.data.famiglia) || "";
      if (fam === "agente") paginaSalaAgente(el);
      else paginaStrategia(el, "admin");
    }
  };
  AC.views["lavori-rete"] = {
    title: "Lavori rete",
    sub: "Cantieri della rete, provvigioni a tranche sull'incassato.",
    render(el) { paginaLavori(el); }
  };
  AC.views["linee-decise"] = {
    title: "Linee decise",
    sub: "Quello che admin e Responsabile Rete Italia hanno deciso.",
    render(el) { paginaLinee(el, vedeSala()); }
  };
  AC.views["tuo-mese"] = {
    title: "Il tuo mese",
    sub: "Il report del mese della tua azienda.",
    render(el) { paginaMese(el); }
  };

  AC.direzione = {
    vedeSala: vedeSala,
    prepara: prepara,
    badge: badge,
    riempiHome: riempiHome,
    riempiGuadagno: riempiGuadagno,
    riempiStriscia: riempiStriscia
  };
})();
