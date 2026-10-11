/* Proposte della rete e catena (10.10.2026).
   Stesse regole di app-anchecasa/sql/app-05-proposte-rete.sql e di viste-rete.js:
   si propone, decidono insieme admin, Responsabile Rete Italia e lo sviluppo dell'area.
   Basta un no. Con tutti i sì l'invito nasce da solo nel database.
   La dashboard non scrive sulle tabelle: solo select e le funzioni app_proponi_rete e app_vota_proposta.
   L'unico invito diretto è quello dell'admin per il Responsabile Rete Italia (app_inviti, ruolo reteitalia). */
(function () {
  const AC = (window.AC = window.AC || {});
  const ui = () => AC.ui;
  const MANCA = "Manca app-05 su Supabase: eseguire app-anchecasa/sql/app-05-proposte-rete.sql";
  const RUOLI = {
    reteitalia: "Responsabile Rete Italia",
    sviluppo: "Sviluppo rete",
    capoarea: "Capo area",
    agente: "Agente",
    subagente: "Sub-agente"
  };
  const PROPONIBILI = ["sviluppo", "capoarea", "agente", "subagente"];
  const REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];
  const LIVELLO = { reteitalia: 0, sviluppo: 1, capoarea: 2, agente: 3, subagente: 4 };
  /* Stesso formato di mostraInvito nell'app: origine + #/invito/ + token. */
  const BASE_APP = "https://entra.anchecasa.it/";
  const aperti = new Set();
  let schedaAdmin = "decidere";
  let nBadge = 0;

  function html(strings, ...vals) { return ui().html(strings, ...vals); }
  function toast(msg, kind) { ui().toast(msg, kind); }

  function mancaTabella(err) {
    if (!err) return false;
    const t = String(err.code || "") + " " + String(err.message || "");
    return /PGRST205|42P01|schema cache|does not exist|Could not find the table/i.test(t);
  }

  function spiega(err) {
    const m = String((err && (err.message || err.details)) || err || "");
    if (mancaTabella(err) || /app_proposte_rete|app_proponi_rete|app_vota_proposta/.test(m)) return MANCA;
    if (/gia_proposto/.test(m)) return "Questa persona è già stata proposta.";
    if (/non_autorizzato/.test(m)) return "Non puoi fare questa operazione.";
    if (/ruolo_non_valido/.test(m)) return "Questo ruolo non si può proporre.";
    if (/proposta_chiusa/.test(m)) return "Questa proposta è già chiusa.";
    return m || "Non riesco a completare.";
  }

  function conTempo(p) {
    return Promise.race([
      p,
      new Promise((resolve) => setTimeout(() => resolve({ error: { message: "il server non risponde" } }), 25000))
    ]);
  }

  function db() { return window.acDb; }

  function meseOra() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  function dataIt(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function euro(n) {
    const x = Number(n) || 0;
    return x.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
  }

  function mailOk(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s); }

  function linkInvitoRete(token) { return BASE_APP + "#/invito/" + token; }

  function cartaManca() {
    return html`<div class="card"><p>${MANCA}</p></div>`;
  }

  async function sessione() {
    if (!db()) return "";
    const s = await db().auth.getSession();
    return (s.data && s.data.session && s.data.session.user && s.data.session.user.id) || "";
  }

  async function miaRiga() {
    if (!db()) return { manca: true };
    const id = await sessione();
    if (!id) return { riga: null };
    const res = await conTempo(db().from("app_rete").select("*").eq("utente", id).maybeSingle());
    if (res.error && mancaTabella(res.error)) return { manca: true };
    if (res.error) return { riga: null, errore: res.error };
    return { riga: res.data || null };
  }

  function chiVota(p, ctx) {
    if (!ctx) return null;
    if (ctx.admin) return "admin";
    if (ctx.ruolo === "reteitalia" && ctx.stato === "attivo") return "reteitalia";
    if (ctx.ruolo === "sviluppo" && ctx.stato === "attivo" && p.serve_sviluppo && ctx.area && ctx.area === p.area) return "sviluppo";
    return null;
  }

  function mioVoto(p, chi) {
    if (chi === "admin") return p.voto_admin || "";
    if (chi === "reteitalia") return p.voto_reteitalia || "";
    if (chi === "sviluppo") return p.voto_sviluppo || "";
    return "x";
  }

  function daDecidere(lista, ctx) {
    return (lista || []).filter((p) => p.stato === "proposta" && chiVota(p, ctx) && !mioVoto(p, chiVota(p, ctx)));
  }

  function voceVoto(etichetta, voto, serve) {
    if (!serve && !voto) return html`<span class="rp-voto"><i class="rp-dot off" aria-hidden="true"></i> ${etichetta}: non serve</span>`;
    const cls = voto === "si" ? "si" : voto === "no" ? "no" : "attesa";
    const txt = voto === "si" ? "sì" : voto === "no" ? "no" : "attesa";
    return html`<span class="rp-voto"><i class="rp-dot ${cls}" aria-hidden="true"></i> ${etichetta}: ${txt}</span>`;
  }

  function statoTag(stato) {
    if (stato === "approvata") return html`<span class="tag ok">Approvata</span>`;
    if (stato === "respinta") return html`<span class="tag new">Respinta</span>`;
    return html`<span class="tag wait">In attesa</span>`;
  }

  function commentiDi(p) {
    const arr = Array.isArray(p.commenti) ? p.commenti : [];
    const chi = { admin: "Admin", reteitalia: "Rete Italia", sviluppo: "Sviluppo" };
    return arr.filter((c) => c && c.nota).map((c) => html`<p class="rp-commento">${chi[c.chi] || c.chi}: ${c.nota}</p>`);
  }

  function formProponi(predef) {
    const ruolo = PROPONIBILI.indexOf(predef) >= 0 ? predef : "agente";
    return html`<form id="rp-proponi" novalidate>
      <div class="fields tre">
        <div class="field"><label for="rp-ruolo">Ruolo</label>
          <select id="rp-ruolo" name="ruolo">${PROPONIBILI.map((k) => html`<option value="${k}"${k === ruolo ? ui().raw(" selected") : ""}>${RUOLI[k]}</option>`)}</select>
        </div>
        <div class="field"><label for="rp-nome">Nome e cognome</label><input id="rp-nome" name="nome" maxlength="80" required autocomplete="name"></div>
        <div class="field"><label for="rp-mail">Mail</label><input id="rp-mail" name="email" type="email" required autocomplete="off"></div>
      </div>
      <div class="fields tre">
        <div class="field"><label for="rp-tel">Telefono</label><input id="rp-tel" name="telefono" type="tel" maxlength="40" autocomplete="off"></div>
        <div class="field"><label for="rp-reg">Regione</label>
          <select id="rp-reg" name="regione"><option value="">—</option>${REGIONI.map((r) => html`<option value="${r}">${r}</option>`)}</select>
        </div>
        <div class="field"><label for="rp-note">Note</label><input id="rp-note" name="note" maxlength="600" placeholder="Chi è e perché è adatto"></div>
      </div>
      <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Manda la proposta</button></div>
      <p class="note">Entra solo se dicono sì l’admin, il Responsabile Rete Italia e lo sviluppo rete della sua area, quando quell’area ne ha uno. Basta un no. Quando passa, qui compare il link d’invito.</p>
    </form>`;
  }

  function formReteItalia() {
    return html`<form id="rp-rri" novalidate>
      <div class="fields tre">
        <div class="field"><label for="rp-rri-nome">Nome</label><input id="rp-rri-nome" name="nome" maxlength="80" autocomplete="name"></div>
        <div class="field"><label for="rp-rri-mail">Mail</label><input id="rp-rri-mail" name="email" type="email" required autocomplete="off"></div>
      </div>
      <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Crea l’invito</button></div>
      <p class="note">Solo questo invito lo crei direttamente. Tutti gli altri passano da una proposta approvata.</p>
      <div id="rp-rri-link"></div>
    </form>`;
  }

  async function nomiDi(ids, rete) {
    const map = {};
    (rete || []).forEach((r) => { if (r.nome) map[r.utente] = r.nome; });
    const manca = ids.filter((id) => id && !map[id]);
    if (!manca.length || !db()) return map;
    const res = await conTempo(db().from("profiles").select("id, nome").in("id", manca));
    if (!res.error && res.data) {
      res.data.forEach((p) => { if (p.nome) map[p.id] = p.nome; });
    }
    return map;
  }

  function cartaProposta(p, ctx, nomeDi, uid) {
    const chi = chiVota(p, ctx);
    const mio = mioVoto(p, chi);
    const posso = p.stato === "proposta" && chi && !mio;
    const possoLink = p.stato === "approvata" && p.invito && (ctx.admin || p.proposto_da === uid);
    const zona = [p.regione, p.area].filter(Boolean).join(" · ");
    return html`<article class="card rp-card" data-id="${p.id}">
      <div class="rp-testa">
        <div>
          <h2 class="rp-nome-h">${p.nome}</h2>
          <p class="note">${RUOLI[p.ruolo] || p.ruolo}${zona ? " · " + zona : ""} · proposta da ${nomeDi(p.proposto_da)} · ${dataIt(p.creato)}</p>
        </div>
        ${statoTag(p.stato)}
      </div>
      ${p.note ? html`<p class="rp-nota">${p.note}</p>` : ""}
      <div class="rp-voti">
        ${voceVoto("Admin", p.voto_admin, true)}
        ${voceVoto("Rete Italia", p.voto_reteitalia, p.serve_reteitalia)}
        ${voceVoto("Sviluppo", p.voto_sviluppo, p.serve_sviluppo)}
      </div>
      ${commentiDi(p)}
      ${posso ? html`<div class="rp-decidi">
        <label class="rp-lab">Nota, se vuoi<input type="text" maxlength="300" data-nota="${p.id}" autocomplete="off"></label>
        <div class="row-actions">
          <button type="button" class="btn-in" data-voto="si" data-id="${p.id}">Sì</button>
          <button type="button" class="tab" data-voto="no" data-id="${p.id}">No</button>
        </div>
      </div>` : ""}
      ${possoLink ? html`<div class="row-actions" style="margin-top:10px"><button type="button" class="tab" data-link="${p.invito}">Copia link d’invito</button></div>` : ""}
    </article>`;
  }

  async function vota(id, si, nota, poi) {
    const res = await conTempo(db().rpc("app_vota_proposta", { p_id: id, p_si: si, p_nota: nota || "" }));
    if (res.error) { toast(spiega(res.error), "error"); return; }
    const esito = res.data;
    if (esito === "approvata") toast("Approvata: l’invito è pronto.");
    else if (esito === "respinta") toast("Proposta respinta.");
    else toast("Voto registrato. Resta in attesa degli altri sì.");
    nBadge = -1;
    if (poi) poi();
  }

  async function copiaInvito(id) {
    const res = await conTempo(db().from("app_inviti").select("token, email, nome").eq("id", id).maybeSingle());
    if (res.error || !res.data || !res.data.token) {
      toast(res.error ? spiega(res.error) : "Invito non trovato.", "error");
      return;
    }
    const link = linkInvitoRete(res.data.token);
    let ok = false;
    try { await navigator.clipboard.writeText(link); ok = true; } catch (e) { ok = false; }
    toast(ok ? "Link copiato." : "Copia il link dal riquadro.");
    const box = document.getElementById("rp-link-box");
    if (box) {
      box.innerHTML = html`<p class="note">Link dell’app per ${res.data.email}. Chi lo apre entra con questa mail.</p><input type="text" readonly value="${link}">`.s;
    }
  }

  function agganciaLista(el, poi) {
    el.onclick = async (e) => {
      const voto = e.target.closest("[data-voto]");
      const link = e.target.closest("[data-link]");
      if (voto) {
        const id = voto.getAttribute("data-id");
        const campo = el.querySelector('[data-nota="' + id + '"]');
        voto.disabled = true;
        await vota(id, voto.getAttribute("data-voto") === "si", campo ? campo.value.trim() : "", poi);
        if (voto.isConnected) voto.disabled = false;
        return;
      }
      if (link) copiaInvito(link.getAttribute("data-link"));
    };
  }

  function agganciaProponi(el, predefRuolo, poi) {
    const f = el.querySelector("#rp-proponi");
    if (!f) return;
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = f.nome.value.trim();
      const email = f.email.value.trim().toLowerCase();
      if (nome.length < 2) { toast("Scrivi nome e cognome.", "error"); return; }
      if (!mailOk(email)) { toast("Controlla la mail.", "error"); return; }
      const btn = f.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      const res = await conTempo(db().rpc("app_proponi_rete", {
        p_ruolo: f.ruolo.value,
        p_nome: nome,
        p_email: email,
        p_telefono: f.telefono.value.trim(),
        p_regione: f.regione.value,
        p_note: f.note.value.trim()
      }));
      if (btn) btn.disabled = false;
      if (res.error) { toast(spiega(res.error), "error"); return; }
      toast("Proposta mandata.");
      nBadge = -1;
      if (poi) poi();
    });
    if (predefRuolo && f.ruolo) f.ruolo.value = PROPONIBILI.indexOf(predefRuolo) >= 0 ? predefRuolo : "agente";
  }

  function agganciaRri(el) {
    const f = el.querySelector("#rp-rri");
    if (!f) return;
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = f.email.value.trim().toLowerCase();
      if (!mailOk(email)) { toast("Controlla la mail.", "error"); return; }
      const btn = f.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      const res = await conTempo(db().from("app_inviti").insert({
        cosa: "rete",
        ruolo: "reteitalia",
        email: email,
        nome: f.nome.value.trim()
      }).select("token, email, nome").single());
      if (btn) btn.disabled = false;
      if (res.error) { toast(spiega(res.error), "error"); return; }
      const link = linkInvitoRete(res.data.token);
      const box = el.querySelector("#rp-rri-link");
      if (box) {
        box.innerHTML = html`<div class="row-actions" style="margin-top:12px;align-items:center;">
          <input type="text" readonly value="${link}" style="flex:1;min-width:220px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;">
          <button type="button" class="tab" id="rp-rri-copia">Copia link d’invito</button>
        </div><p class="note">Link dell’app. La persona entra con la mail ${res.data.email}.</p>`.s;
        const copia = box.querySelector("#rp-rri-copia");
        if (copia) copia.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(link); toast("Link copiato."); }
          catch (err) { toast("Seleziona il link e copialo.", "error"); }
        });
      }
      toast("Invito creato.");
      f.reset();
    });
  }

  function sottoDi(ruolo) {
    const ordine = ["reteitalia", "sviluppo", "capoarea", "agente", "subagente"];
    const i = ordine.indexOf(ruolo);
    return i >= 0 && i < ordine.length - 1 ? ordine[i + 1] : "agente";
  }

  async function caricaProposte() {
    const res = await conTempo(db().from("app_proposte_rete").select("*").order("creato", { ascending: false }).limit(500));
    return res;
  }

  function disegnaElenco(el, lista, ctx, nomeDi, uid, poi) {
    const mount = el.querySelector("#rp-elenco");
    if (!mount) return;
    mount.innerHTML = html`${lista.length
      ? lista.map((p) => cartaProposta(p, ctx, nomeDi, uid))
      : html`<p class="note">Nessuna proposta in questa scheda.</p>`}<div id="rp-link-box"></div>`.s;
    agganciaLista(mount, poi);
  }

  function schede(attiva, nDec, conCatena) {
    const b = (id, t) => html`<button type="button" class="tab${id === attiva ? " on" : ""}" data-scheda="${id}" aria-selected="${id === attiva ? "true" : "false"}">${t}</button>`;
    return html`<div class="rp-schede" role="tablist">
      ${b("decidere", nDec ? "Da decidere (" + nDec + ")" : "Da decidere")}
      ${b("tutte", "Tutte")}
      ${b("chiuse", "Respinte/approvate")}
      ${conCatena ? b("catena", "La catena") : ""}
    </div>`;
  }

  async function paginaAdmin(el) {
    if (!db()) {
      el.innerHTML = cartaManca().s;
      return;
    }
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const res = await caricaProposte();
    if (!el.isConnected) return;
    if (res.error && mancaTabella(res.error)) {
      el.innerHTML = cartaManca().s;
      return;
    }
    if (res.error) {
      el.innerHTML = html`<div class="card"><p>Non riesco a leggere le proposte (${res.error.message}).</p></div>`.s;
      return;
    }
    const uid = await sessione();
    const ctx = { admin: true };
    const tutte = res.data || [];
    const reteRes = await conTempo(db().from("app_rete").select("utente, nome").limit(2000));
    const nomi = await nomiDi(tutte.map((p) => p.proposto_da), (reteRes && reteRes.data) || []);
    const nomeDi = (u) => nomi[u] || (u && u === uid ? "te" : "AncheCasa");
    const decidere = daDecidere(tutte, ctx);
    nBadge = decidere.length;
    dipingiBadge(nBadge);

    function ridisegna() { paginaAdmin(el); }

    el.innerHTML = html`
      <div class="card"><h2 class="rp-nome-h">Proponi una persona</h2>${formProponi("sviluppo")}</div>
      <div class="card rp-card"><h2 class="rp-nome-h">Invita il Responsabile Rete Italia</h2>${formReteItalia()}</div>
      <div id="rp-schede"></div>
      <div id="rp-corpo"></div>`.s;

    function mostra(quale) {
      schedaAdmin = quale;
      const bar = el.querySelector("#rp-schede");
      const corpo = el.querySelector("#rp-corpo");
      if (!bar || !corpo) return;
      bar.innerHTML = schede(quale, decidere.length, true).s;
      bar.onclick = (e) => {
        const b = e.target.closest("[data-scheda]");
        if (b) mostra(b.getAttribute("data-scheda"));
      };
      if (quale === "catena") {
        corpo.innerHTML = html`<div id="rp-albero"><p class="note">Caricamento…</p></div>`.s;
        montaCatena(corpo.querySelector("#rp-albero"), { tutta: true });
        return;
      }
      const l = quale === "decidere" ? decidere
        : quale === "chiuse" ? tutte.filter((p) => p.stato === "approvata" || p.stato === "respinta")
        : tutte;
      corpo.innerHTML = html`<div id="rp-elenco"></div>`.s;
      disegnaElenco(corpo, l, ctx, nomeDi, uid, ridisegna);
    }

    agganciaProponi(el, "sviluppo", ridisegna);
    agganciaRri(el);
    mostra(schedaAdmin === "catena" || schedaAdmin === "tutte" || schedaAdmin === "chiuse" ? schedaAdmin : "decidere");
  }

  function statsPersona(r, vend, prov, prop) {
    const mese = meseOra();
    const v = vend.filter((x) => x.venditore === r.utente);
    const attivi = v.filter((x) => x.stato === "attiva");
    const delMese = attivi.filter((x) => String(x.attivata || x.creato || "").slice(0, 7) === mese).reduce((a, x) => a + Number(x.importo), 0);
    const pr = prov.filter((x) => x.beneficiario === r.utente && String(x.mese || x.creato || "").slice(0, 7) === mese).reduce((a, x) => a + Number(x.importo), 0);
    const date = v.map((x) => x.creato).filter(Boolean).sort();
    const ultima = date.length ? date[date.length - 1] : "";
    const giorni = ultima ? Math.floor((Date.now() - new Date(ultima).getTime()) / 86400000) : null;
    const sospeso = r.stato !== "attivo";
    const fermo = giorni === null || giorni > 30;
    const col = sospeso ? "rosso" : fermo ? "giallo" : "verde";
    const np = prop.filter((x) => x.proposto_da === r.utente).length;
    const zona = r.regione || r.area || "";
    const quando = !ultima ? "nessuna vendita" : "ultima vendita " + dataIt(ultima) + (giorni > 30 ? " · ferma da " + giorni + " giorni" : giorni ? " · " + giorni + " giorni fa" : " · oggi");
    const dett = [
      RUOLI[r.ruolo] || r.ruolo,
      zona,
      sospeso ? "sospeso" : "attivo",
      attivi.length + (attivi.length === 1 ? " cliente attivo" : " clienti attivi"),
      euro(delMese) + " vendite del mese",
      euro(pr) + " provvigioni del mese",
      np + (np === 1 ? " proposta" : " proposte"),
      quando
    ].filter(Boolean).join(" · ");
    return { col: col, dett: dett };
  }

  async function montaCatena(el, opts) {
    if (!db()) { el.innerHTML = cartaManca().s; return; }
    const [reteR, vendR, provR, propR] = await Promise.all([
      conTempo(db().from("app_rete").select("*").limit(2000)),
      conTempo(db().from("app_vendite").select("venditore, importo, stato, creato, attivata").limit(5000)),
      conTempo(db().from("app_provvigioni").select("beneficiario, importo, mese, creato").limit(5000)),
      conTempo(db().from("app_proposte_rete").select("proposto_da").limit(1000))
    ]);
    if (!el.isConnected) return;
    const primoErrore = [reteR, vendR, provR, propR].map((r) => r.error).find(Boolean);
    if (primoErrore && mancaTabella(primoErrore)) { el.innerHTML = cartaManca().s; return; }
    if (primoErrore) { el.innerHTML = html`<p class="note">Non riesco a leggere la rete (${primoErrore.message}).</p>`.s; return; }
    const rete = reteR.data || [];
    const vend = vendR.data || [];
    const prov = provR.data || [];
    const prop = propR.data || [];
    const ids = new Set(rete.map((r) => r.utente));
    const figliDi = {};
    rete.forEach((r) => {
      const k = r.superiore && ids.has(r.superiore) ? r.superiore : "";
      (figliDi[k] = figliDi[k] || []).push(r);
    });
    Object.keys(figliDi).forEach((k) => {
      figliDi[k].sort((a, b) => (LIVELLO[a.ruolo] ?? 9) - (LIVELLO[b.ruolo] ?? 9) || String(a.nome).localeCompare(String(b.nome), "it"));
    });
    let radici;
    if (opts && opts.tutta) radici = figliDi[""] || [];
    else radici = rete.filter((r) => r.utente === opts.io);
    if (!radici.length) {
      el.innerHTML = html`<p class="note">Nessuno nella rete ancora.</p>`.s;
      return;
    }
    const visti = new Set();
    function nodo(r) {
      if (visti.has(r.utente)) return html``;
      visti.add(r.utente);
      const figli = (figliDi[r.utente] || []).filter((x) => x.utente !== r.utente);
      const st = statsPersona(r, vend, prov, prop);
      const aperto = aperti.has(r.utente);
      return html`<div class="rp-nodo rp-${st.col}">
        <div class="rp-riga">
          ${figli.length
            ? html`<button type="button" class="rp-apri" data-u="${r.utente}" aria-expanded="${aperto ? "true" : "false"}">${r.nome || r.codice || RUOLI[r.ruolo]}</button>`
            : html`<span class="rp-apri">${r.nome || r.codice || RUOLI[r.ruolo]}</span>`}
        </div>
        <p class="rp-meta">${st.dett}</p>
        ${figli.length ? html`<div class="rp-figli"${aperto ? "" : ui().raw(" hidden")}>${figli.map(nodo)}</div>` : ""}
      </div>`;
    }
    el.innerHTML = html`<p class="note">Verde: ha venduto negli ultimi 30 giorni. Giallo: nessuna vendita da più di 30 giorni, o mai. Rosso: sospeso. Il nome apre e chiude chi sta sotto.</p><div class="rp-albero">${radici.map(nodo)}</div>`.s;
    el.onclick = (e) => {
      const b = e.target.closest(".rp-apri[data-u]");
      if (!b || !el.contains(b)) return;
      const id = b.getAttribute("data-u");
      const box = b.closest(".rp-nodo").querySelector(".rp-figli");
      if (!box) return;
      const aperto = !aperti.has(id);
      if (aperto) aperti.add(id); else aperti.delete(id);
      box.hidden = !aperto;
      b.setAttribute("aria-expanded", aperto ? "true" : "false");
    };
  }

  function esempioCatena(righe, avviso) {
    return html`${avviso ? html`<div class="card"><p>${avviso}</p></div>` : ""}
      <p class="note">Esempio</p>
      <div class="card">
        <table class="mini-table">
          <thead><tr><th>Tipo</th><th>Nome</th><th>Portati</th></tr></thead>
          <tbody>${(righe || []).map((c) => html`<tr><td>${c.tipo}</td><td>${c.nome}</td><td class="num">${c.n}</td></tr>`)}</tbody>
        </table>
      </div>`;
  }

  function titolo(t, s) {
    const a = document.getElementById("page-title");
    const b = document.getElementById("page-sub");
    if (a) a.textContent = t;
    if (b) b.textContent = s || "";
  }

  async function catenaAgente(el, demo) {
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const io = await miaRiga();
    if (!el.isConnected) return;
    if (io.manca || !io.riga) {
      el.innerHTML = esempioCatena(demo, io.manca ? MANCA : "").s;
      return;
    }
    titolo("La catena", "Tu e chi sta sotto di te.");
    await montaCatena(el, { tutta: false, io: io.riga.utente });
  }

  async function invitiAgente(el) {
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    const io = await miaRiga();
    if (!el.isConnected) return;
    if (io.manca || !io.riga) {
      if (AC.views && AC.views.inviti && AC.views.inviti.mercato) {
        AC.views.inviti.mercato(el, { togliAgente: true, avviso: io.manca ? MANCA : "" });
      }
      return;
    }
    titolo("Proponi una persona", "Nella rete si entra solo se la proposta viene approvata.");
    const ctx = { admin: false, ruolo: io.riga.ruolo, area: io.riga.area, stato: io.riga.stato };
    const decide = ctx.ruolo === "reteitalia" || ctx.ruolo === "sviluppo";
    const res = await caricaProposte();
    if (!el.isConnected) return;
    if (res.error && mancaTabella(res.error)) {
      el.innerHTML = cartaManca().s;
      return;
    }
    if (res.error) {
      el.innerHTML = html`<div class="card"><p>${spiega(res.error)}</p></div>`.s;
      return;
    }
    const uid = io.riga.utente;
    const tutte = res.data || [];
    const mie = tutte.filter((p) => p.proposto_da === uid);
    const aperte = decide ? daDecidere(tutte, ctx) : [];
    const reteRes = await conTempo(db().from("app_rete").select("utente, nome").limit(2000));
    const nomi = await nomiDi(tutte.map((p) => p.proposto_da), (reteRes && reteRes.data) || []);
    const nomeDi = (u) => nomi[u] || (u === uid ? "te" : "AncheCasa");
    const predef = sottoDi(io.riga.ruolo);

    function ridisegna() { invitiAgente(el); }

    el.innerHTML = html`
      ${decide ? html`<h2 class="rp-nome-h">Da decidere</h2>${aperte.length ? html`<div id="rp-decidere">${aperte.map((p) => cartaProposta(p, ctx, nomeDi, uid))}</div>` : html`<p class="note">Niente da decidere.</p>`}` : ""}
      <div class="card"><h2 class="rp-nome-h">Proponi una persona</h2>${formProponi(predef)}</div>
      <h2 class="rp-nome-h">Le mie proposte</h2>
      <div id="rp-mie">${mie.length ? mie.map((p) => cartaProposta(p, ctx, nomeDi, uid)) : html`<p class="note">Non hai ancora proposto nessuno.</p>`}</div>
      <div id="rp-link-box"></div>`.s;
    agganciaProponi(el, predef, ridisegna);
    agganciaLista(el, ridisegna);
  }

  function dipingiBadge(n) {
    nBadge = n;
    document.querySelectorAll('a[href$="/admin/proposte-rete"]').forEach((a) => {
      let b = a.querySelector(".nav-badge");
      if (n > 0) {
        if (!b) {
          b = document.createElement("span");
          b.className = "nav-badge";
          a.appendChild(b);
        }
        b.textContent = n > 9 ? "9+" : String(n);
      } else if (b) b.remove();
    });
    if (typeof AC.reteBadge === "function") AC.reteBadge(n);
  }

  function badge() {
    if (!db()) return;
    conTempo(db().from("app_proposte_rete").select("id, stato, voto_admin").eq("stato", "proposta").limit(500)).then((res) => {
      if (!res || res.error) { dipingiBadge(0); return; }
      const n = (res.data || []).filter((p) => !p.voto_admin).length;
      dipingiBadge(n);
    });
  }

  AC.views = AC.views || {};
  AC.views["proposte-rete"] = {
    title: "Proposte rete",
    sub: "Chi entra nella rete lo decidete insieme.",
    render(el) { paginaAdmin(el); }
  };

  AC.rete = {
    catenaAgente: catenaAgente,
    invitiAgente: invitiAgente,
    badge: badge,
    montaCatena: montaCatena
  };
})();
