/* ADMIN · Sala demo (12.10.2026, su richiesta di Nando, per la presentazione ai commerciali).
   Per ogni profilo: la dashboard in vetrina (dati di esempio, nessun collegamento a persone o al database,
   tutti i pulsanti del profilo visibili), il documento delle regole e i contratti.
   Sotto, i documenti per la rete. Un profilo entra in vetrina quando la sua dashboard è decisa
   (PROGETTO-DASHBOARD.md): si mette pronta: true. */
(function () {
  const AC = window.AC;
  const { html, icon } = AC.ui;
  const V = AC.views;

  const PROFILI = [
    { nome: "Privato", desc: "Guasti, ristrutturazioni, bacheca, bollette, passaparola.", ico: "home", demo: "privato", regole: "regole/privato.html", pronta: true },
    { nome: "Rete", desc: "Una dashboard per ruolo: ognuno vede sé stesso e chi ha sotto.", ico: "team", demo: "agente", regole: "regole/rete.html", contratti: true, pronta: true,
      ruoli: [["subagente", "Sub-agente"], ["agente", "Agente"], ["capoarea", "Capo area"], ["sviluppo", "Sviluppo rete"], ["reteitalia", "Rete Italia"]] },
    { nome: "Impresa edile", desc: "Cantieri, SAL, gare, subappalti, squadre.", ico: "building" },
    { nome: "Artigiano", desc: "Interventi, SuperMastro, lavoro fatto.", ico: "gear" },
    { nome: "Subappaltatore e impiantista", desc: "Lavori per i general contractor, certificazioni.", ico: "gear" },
    { nome: "Studio tecnico", desc: "Pratiche, gare, presenze di cantiere.", ico: "doc" },
    { nome: "Fornitore", desc: "Materiali, noleggio, IT.", ico: "folder" },
    { nome: "Luce e gas", desc: "Offerte ai privati dentro AncheCasa.", ico: "pulse" },
    { nome: "Agenzia immobiliare", desc: "Annunci in bacheca.", ico: "home" },
    { nome: "Committente", desc: "Condomini, amministratori, grandi aziende e fondi.", ico: "building" }
  ];

  // Documenti per la presentazione alla rete. pronto: true quando il file esiste.
  const DOCUMENTI = [
    { nome: "AncheCasa in 10 minuti", desc: "Chi siamo, cosa facciamo, per chi, come guadagniamo. Il quadro intero.", ico: "star" },
    { nome: "Il listino", desc: "Abbonamenti, moduli, 4,99 € a intervento, cosa è gratis.", ico: "wallet" },
    { nome: "Come guadagna la rete", desc: "Provvigioni per ruolo, la catena, esempi con i numeri.", ico: "chart" },
    { nome: "Il percorso del cliente", desc: "Dal primo contatto alla firma: visita, Sopralluogo Flash, preventivo, obiezioni.", ico: "send" },
    { nome: "Regole della rete", desc: "Chi entra, a chi è il cliente, segnalazioni, contratto da firmare.", ico: "shield" },
    { nome: "Si parte: i primi 90 giorni", desc: "Cosa c'è oggi, cosa arriva e quando, obiettivi del trimestre.", ico: "calendar" },
    { nome: "Il primo giorno", desc: "La lista da fare: contratto, profilo, link di invito, i primi 20 contatti.", ico: "doc" },
    { nome: "Regole del Privato", desc: "Il primo profilo finito, da studiare.", ico: "home", file: "regole/privato.html", pronto: true },
    { nome: "Regole della Rete", desc: "Ruoli, chi vede cosa, clienti, ristrutturazioni, zone.", ico: "team", file: "regole/rete.html", pronto: true }
  ];

  const apri = (p, ruolo) => ruolo
    ? `index.html?demo=${p.demo}&ruolo=${ruolo}&vetrina=1#/${p.demo}/home`
    : `index.html?demo=${p.demo}&vetrina=1#/${p.demo}/bacheca`;

  V["sala-demo"] = {
    title: "Sala demo",
    sub: "Le dashboard di ogni profilo con dati di esempio, le regole e i contratti, per presentare AncheCasa alla rete.",
    render(el) {
      const pronte = PROFILI.filter((p) => p.pronta).length;
      el.innerHTML = html`
        <p class="note">Le dashboard in vetrina hanno dati di esempio e non sono collegate a nessuno: si naviga liberamente, niente va sul database. ${pronte} su ${PROFILI.length} profili pronti, gli altri arrivano man mano che li finiamo.</p>
        <h2 class="sd-tit">Le dashboard</h2>
        <div class="doc-griglia">
          ${PROFILI.map((p) => html`<div class="doc-tile sw-tile sd-tile${p.pronta ? "" : " sw-muto"}">
            <span class="rg-ico${p.pronta ? "" : " rg-ico-off"}">${icon(p.ico, 22)}</span>
            <b>${p.nome}</b><small>${p.desc}</small>
            ${p.pronta
              ? html`<span class="sd-tasti">
                  ${p.ruoli
                    ? p.ruoli.map(([k, l]) => html`<a class="sd-btn" href="${apri(p, k)}" target="_blank" rel="noopener">${l}</a>`)
                    : html`<a class="sd-btn" href="${apri(p)}" target="_blank" rel="noopener">Apri la dashboard</a>`}
                  ${p.regole ? html`<a class="sd-btn sd-chiaro" href="${p.regole}" target="_blank" rel="noopener">Regole</a>` : ""}
                  ${p.contratti ? html`<a class="sd-btn sd-chiaro" href="#/admin/contratti">Contratti</a>` : ""}
                </span>`
              : html`<span class="sd-tasti">
                  <span class="sw-stato sw-off">In preparazione</span>
                  ${p.contratti ? html`<a class="sd-btn sd-chiaro" href="#/admin/contratti">Contratti</a>` : ""}
                </span>`}
          </div>`)}
        </div>
        <h2 class="sd-tit">I documenti per la rete</h2>
        <p class="note">Il quadro da dare ai commerciali prima di partire. Si scrivono con la stessa carta intestata delle regole.</p>
        <div class="doc-griglia">
          ${DOCUMENTI.map((d) => d.pronto
            ? html`<a class="doc-tile sw-tile sd-tile" href="${d.file}" target="_blank" rel="noopener">
                <span class="rg-ico">${icon(d.ico, 22)}</span><b>${d.nome}</b><small>${d.desc}</small>
                <span class="sw-stato sw-ok">Pronto</span></a>`
            : html`<div class="doc-tile sw-tile sd-tile sw-muto">
                <span class="rg-ico rg-ico-off">${icon(d.ico, 22)}</span><b>${d.nome}</b><small>${d.desc}</small>
                <span class="sw-stato sw-off">Da scrivere</span></div>`)}
        </div>
        <h2 class="sd-tit">I contratti</h2>
        <div class="card sd-contratti">
          <p>Agente, sub-agente, capo area, Responsabile Rete Italia, collaboratore occasionale: i modelli con la carta intestata, firmabili online.</p>
          <a class="sd-btn" href="#/admin/contratti">Apri i contratti</a>
        </div>`.s;
    }
  };
})();
