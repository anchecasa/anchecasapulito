/* ADMIN · Inviti e Rete (12.10.2026, su richiesta di Nando).
   Inviti: un solo modulo per la rete e per le aziende. Si scrive chi è (ruolo o categoria), nome, mail e telefono,
   e «Invia invito» manda subito la mail AncheCasa con il link: niente link da copiare, niente secondo passaggio.
   Usa la tabella marketplace.inviti_admin e la funzione invia-invito-marketplace che c'erano già.
   Rete: una pagina sola da cui si arriva a tutto quello che riguarda la rete.
   Anteprima (?demo=admin): niente va sul database e nessuna mail parte. */
(function () {
  const AC = window.AC;
  const { html, icon, toast } = AC.ui;
  const V = AC.views;
  const DEMO = /[?&]demo=/.test(location.search);

  const RUOLI = [
    ["reteitalia", "Responsabile Rete Italia"],
    ["sviluppo", "Sviluppo rete"],
    ["capoarea", "Capo area"],
    ["agente", "Agente"],
    ["subagente", "Sub-agente"]
  ];
  const NOME_RUOLO = Object.fromEntries(RUOLI);
  const STATO = { inviato: ["sw-in", "Mail inviata"], aperto: ["sw-off", "Aperto"], iscritto: ["sw-ok", "Iscritto"] };
  const mailOk = (m) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m);
  const telOk = (t) => !t || String(t).replace(/\D/g, "").length >= 8;
  const dataIt = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const conTempo = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("Il server non risponde. Riprova.")), ms || 25000))]);

  // Anteprima: gli inviti stanno solo in questa pagina.
  const demoInviti = [
    { mail: "mario.rossi@esempio.it", telefono: "333 1234567", categoria: "Rete - Capo area", stato: "iscritto", created_at: "2026-10-10T09:12:00Z", inviato_at: "2026-10-10T09:12:00Z", nome: "Mario Rossi" },
    { mail: "info@edilnord.it", telefono: "", categoria: "Imprese edili generali e appalto generale", stato: "aperto", created_at: "2026-10-11T15:40:00Z", inviato_at: "2026-10-11T15:40:00Z", nome: "Edil Nord Srl" }
  ];

  function chi(valore) {
    if (valore.indexOf("rete:") === 0) {
      const r = valore.slice(5);
      return { famiglia: "agente", categoria: "Rete - " + NOME_RUOLO[r], categoria_id: null, etichetta: NOME_RUOLO[r] };
    }
    const info = (AC.categorieInvito && AC.categorieInvito.mappa[valore]) || null;
    if (!info) return null;
    return { famiglia: info.famiglia, categoria: info.area ? info.area + " - " + info.label : info.label, categoria_id: info.famiglia === "azienda" ? valore : null, etichetta: info.label };
  }

  function caricaInviti() {
    if (DEMO || !window.acDb) return Promise.resolve({ data: demoInviti.slice(), error: null });
    return conTempo(window.acDb.auth.getSession().then((s) => {
      const uid = s.data && s.data.session ? s.data.session.user.id : "";
      return window.acDb.from("inviti_admin")
        .select("token, mail, telefono, famiglia, categoria, stato, created_at, inviato_at")
        .or("creato_da.is.null,creato_da.eq." + uid)
        .order("created_at", { ascending: false })
        .limit(40);
    }));
  }

  function inviaMail(token) {
    return conTempo(window.acDb.functions.invoke("invia-invito-marketplace", { body: { token: token } })).then((res) => {
      const err = res.error || (res.data && res.data.error);
      if (err) throw new Error(err.message || String(err));
    });
  }

  function invia(dati) {
    if (DEMO || !window.acDb) {
      demoInviti.unshift({ mail: dati.mail, telefono: dati.telefono, categoria: dati.chi.categoria, stato: "inviato", created_at: new Date().toISOString(), inviato_at: new Date().toISOString(), nome: dati.nome });
      return Promise.resolve("demo");
    }
    // Il nome non ha ancora una colonna in inviti_admin: si aggiunge quando si aggiorna Supabase (vedi PROGETTO-DASHBOARD.md).
    return conTempo(window.acDb.from("inviti_admin")
      .insert({ famiglia: dati.chi.famiglia, categoria: dati.chi.categoria, categoria_id: dati.chi.categoria_id, mail: dati.mail, telefono: dati.telefono || null })
      .select("token").single())
      .then((res) => {
        if (res.error) throw new Error(res.error.message);
        return inviaMail(res.data.token).then(() => "ok");
      });
  }

  function elenco(mount) {
    mount.innerHTML = html`<p class="note">Caricamento…</p>`.s;
    caricaInviti().then((res) => {
      if (res.error) { mount.innerHTML = html`<p class="note">Non riesco a leggere gli inviti (${res.error.message}).</p>`.s; return; }
      const righe = res.data || [];
      mount.innerHTML = !righe.length
        ? html`<p class="note">Nessun invito ancora.</p>`.s
        : html`<table class="mini-table iv-tab">
            <thead><tr><th>Chi</th><th>Come</th><th>Stato</th><th>Inviato il</th><th></th></tr></thead>
            <tbody>${righe.map((r, i) => {
              const st = STATO[r.stato] || STATO.inviato;
              const inviata = !!r.inviato_at;
              return html`<tr>
                <td>${r.nome ? html`<b>${r.nome}</b><br>` : ""}${r.mail || ""}${r.telefono ? html`<br><small>${r.telefono}</small>` : ""}</td>
                <td>${String(r.categoria || "").replace(/^Aziende - [^-]+ - /, "")}</td>
                <td><span class="sw-stato ${inviata ? st[0] : "sw-off"}">${inviata ? st[1] : "Mail non partita"}</span></td>
                <td>${dataIt(r.inviato_at || r.created_at)}</td>
                <td>${r.stato !== "iscritto" && r.token && r.mail ? html`<button type="button" class="btn-ghost iv-rimanda" data-i="${i}">${inviata ? "Rimanda" : "Invia"}</button>` : ""}</td>
              </tr>`;
            })}</tbody>
          </table>`.s;
      mount.onclick = (e) => {
        const b = e.target.closest(".iv-rimanda");
        if (!b) return;
        const r = righe[Number(b.getAttribute("data-i"))];
        if (!r || DEMO) { toast("Anteprima: nessuna mail parte."); return; }
        b.disabled = true;
        inviaMail(r.token).then(() => { toast("Mail inviata a " + r.mail); elenco(mount); }, (err) => { b.disabled = false; toast("Mail non inviata: " + err.message, "error"); });
      };
    }, (err) => { mount.innerHTML = html`<p class="note">${err.message}</p>`.s; });
  }

  V["inviti-admin"] = {
    title: "Inviti",
    sub: "Rete e aziende: scrivi chi è e la mail, l'invito parte subito.",
    render(el) {
      const opzAziende = AC.categorieInvito ? AC.categorieInvito.opzioni(["azienda"]) : "";
      el.innerHTML = html`
        ${DEMO ? html`<p class="note">Anteprima: niente va sul database e nessuna mail parte.</p>` : ""}
        <div class="card iv-card">
          <h2>Nuovo invito</h2>
          <form id="iv-form" novalidate>
            <div class="iv-campi">
              <label class="iv-chi">Chi inviti
                <select name="chi" required>
                  <option value="">Scegli…</option>
                  <optgroup label="Rete">${RUOLI.map(([k, l]) => html`<option value="rete:${k}">${l}</option>`)}</optgroup>
                  ${opzAziende}
                </select>
              </label>
              <label>Nome e cognome o ragione sociale<input name="nome" type="text" autocomplete="off" placeholder="es. Mario Rossi"></label>
              <label>Mail<input name="mail" type="email" required autocomplete="off" placeholder="nome@esempio.it"></label>
              <label>Telefono<input name="telefono" type="tel" autocomplete="off" placeholder="es. 333 1234567"></label>
            </div>
            <div class="iv-piede">
              <p class="note">Arriva una mail AncheCasa con il link: la persona sceglie la password ed entra nella sua dashboard.</p>
              <button class="btn-in" type="submit">Invia invito</button>
            </div>
          </form>
        </div>
        <div class="card iv-card"><h2>Inviti mandati</h2><div id="iv-elenco"></div></div>`.s;
      const f = el.querySelector("#iv-form");
      const mount = el.querySelector("#iv-elenco");
      elenco(mount);
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const c = chi(f.chi.value);
        const mail = f.mail.value.trim().toLowerCase();
        const telefono = f.telefono.value.trim();
        const nome = f.nome.value.trim();
        if (!c) { toast("Scegli chi inviti.", "error"); return; }
        if (!mailOk(mail)) { toast("Controlla la mail.", "error"); return; }
        if (!telOk(telefono)) { toast("Il telefono non sembra valido.", "error"); return; }
        const btn = f.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = "Invio…";
        invia({ chi: c, mail, telefono, nome }).then((esito) => {
          btn.disabled = false; btn.textContent = "Invia invito";
          toast(esito === "demo" ? "Anteprima: invito a " + mail + " aggiunto all'elenco, nessuna mail partita." : "Invito mandato a " + mail);
          f.reset();
          elenco(mount);
        }, (err) => {
          btn.disabled = false; btn.textContent = "Invia invito";
          toast("Invito non mandato: " + err.message, "error");
          elenco(mount);
        });
      });
    }
  };

  /* ---------- Rete: una pagina da cui si arriva a tutto ---------- */
  const VOCI_RETE = [
    { id: "proposte-rete", nome: "Segnalazioni e chi entra", desc: "Chi propongono i commerciali: dici sì o no. La catena della rete.", ico: "team" },
    { id: "richieste-agenti", nome: "Richieste agenti", desc: "Chi si candida dal sito come agente, con il curriculum.", ico: "star" },
    { id: "oggi-rete", nome: "Oggi", desc: "La giornata della rete: numeri e cose da fare.", ico: "chart" },
    { id: "lavori-rete", nome: "Lavori rete", desc: "I lavori portati dalla rete e a che punto sono.", ico: "doc" },
    { id: "contratti", nome: "Contratti", desc: "Modelli e firme: agente, sub-agente, capo area, Rete Italia.", ico: "doc" },
    { id: "strategia", nome: "Sala strategia", desc: "Le decisioni con la direzione e le linee per la rete.", ico: "chat" }
  ];
  V["rete-admin"] = {
    title: "Rete",
    sub: "Tutto quello che riguarda la rete commerciale, in un posto.",
    render(el) {
      el.innerHTML = html`<div class="doc-griglia">
          ${VOCI_RETE.map((v) => html`<a class="doc-tile sw-tile rg-tile" href="#/admin/${v.id}">
            <span class="rg-ico">${icon(v.ico, 22)}</span><b>${v.nome}</b><small>${v.desc}</small></a>`)}
        </div>
        <div class="card iv-card iv-rete-invito">
          <div><b>Far entrare qualcuno nella rete?</b><span class="note">Lo inviti da Inviti: scegli il ruolo, scrivi mail e telefono, parte la mail.</span></div>
          <a class="btn-in iv-link" href="#/admin/inviti-admin">Vai a Inviti</a>
        </div>`.s;
    }
  };
})();
