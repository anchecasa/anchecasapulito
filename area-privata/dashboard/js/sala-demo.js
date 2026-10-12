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
    // 12.10.2026: la dashboard di AncheCasa (admin) in vetrina, per mostrare ristrutturazioni, cantieri e gare.
    { nome: "AncheCasa (admin)", desc: "Ristrutturazioni con Profit Guard, cantieri AncheCasa, aziende, gare: come lavora AncheCasa.", ico: "star", demo: "admin", pagina: "home", pronta: true },
    { nome: "Rete", desc: "Una dashboard per ruolo: ognuno vede sé stesso e chi ha sotto.", ico: "team", demo: "agente", regole: "regole/rete.html", contratti: true, pronta: true,
      ruoli: [["subagente", "Sub-agente"], ["agente", "Agente"], ["capoarea", "Capo area"], ["sviluppo", "Sviluppo rete"], ["reteitalia", "Rete Italia"]] },
    // 12.10.2026, app-24 e app-25: lavori AncheCasa, i propri cantieri da general contractor, richieste della zona.
    { nome: "Impresa edile", desc: "Lavori affidati da AncheCasa, i miei cantieri da general contractor, richieste alle aziende della zona, piccoli lavori, gare.", ico: "building", demo: "azienda", tipo: "azienda_imprese_edili", pagina: "imp_home", regole: "regole/aziende.html", pronta: true },
    { nome: "Artigiano", desc: "Ho un guasto: una richiesta alla volta, 15 minuti o 2 ore, lavoro fatto, 5,90 € (9,90 € urgente), recensioni, garanzia.", ico: "gear", demo: "azienda", tipo: "azienda_artigiani", pagina: "art_home", regole: "regole/aziende.html", pronta: true },
    { nome: "Subappaltatore e impiantista", desc: "Richieste dei cantieri della zona, offerta voce per voce, bollino documenti, voti.", ico: "gear", demo: "azienda", tipo: "azienda_subappaltatori", pagina: "cnt_perme", regole: "regole/aziende.html", pronta: true },
    { nome: "Studio tecnico", desc: "Pratiche, gare, presenze di cantiere.", ico: "doc" },
    { nome: "Fornitore", desc: "Informatica e promozione.", ico: "folder" },
    // 12.10.2026, app-21: fornitori a preventivo con la zona.
    { nome: "Materiali edili", desc: "Richieste della zona, preventivo riga per riga, ordini, la mia zona.", ico: "folder", demo: "azienda", tipo: "azienda_materiali_edili", pagina: "mat_home", pronta: true },
    { nome: "Noleggio", desc: "Mezzi e calendario, richieste della zona, preventivi, noleggi.", ico: "calendar", demo: "azienda", tipo: "azienda_noleggio_attrezzature", pagina: "nol_home", pronta: true },
    { nome: "Servizi per la casa", desc: "Traslochi, facchinaggio, pulizie, giardino: richieste dei privati della zona.", ico: "home", demo: "azienda", tipo: "azienda_traslochi", pagina: "cas_home", pronta: true },
    { nome: "Luce e gas", desc: "Richieste dai privati, proposte su carta AncheCasa, clienti, accordo.", ico: "pulse", demo: "azienda", tipo: "azienda_luce_gas", pagina: "energia_home", regole: "regole/energia.html", pronta: true },
    // 12.10.2026, app-20: stesso giro di luce e gas.
    { nome: "Telefono e internet", desc: "Richieste di privati e imprese, offerte visibili, proposte su carta AncheCasa, accordo.", ico: "pulse", demo: "azienda", tipo: "azienda_telefonia", pagina: "tel_home", pronta: true },
    { nome: "Finanza e assicurazioni", desc: "Mutui, prestiti, polizze casa e cantiere, fideiussioni. Iscrizione OAM o IVASS sulle proposte.", ico: "shield", demo: "azienda", tipo: "azienda_finanza", pagina: "fin_home", pronta: true },
    { nome: "Agenzia immobiliare", desc: "Annunci in bacheca.", ico: "home" },
    { nome: "Committente", desc: "Condomini, amministratori, grandi aziende e fondi.", ico: "building" }
  ];

  // Documenti per la presentazione alla rete. pronto: true quando il file esiste.
  const DOCUMENTI = [
    { nome: "AncheCasa in 10 minuti", desc: "Chi siamo, cosa facciamo, per chi, come guadagniamo. Il quadro intero.", ico: "star" },
    { nome: "Il listino", desc: "Prezzi di tutti i profili, moduli, sponsor, e le provvigioni della rete sull'utile con tre esempi.", ico: "wallet", file: "regole/listino.html", pronto: true },
    { nome: "Come guadagna la rete", desc: "Provvigioni per ruolo, la catena, esempi con i numeri.", ico: "chart" },
    { nome: "Il percorso del cliente", desc: "Dal primo contatto alla firma: visita, Sopralluogo Flash, preventivo, obiezioni.", ico: "send" },
    { nome: "Regole della rete", desc: "Chi entra, a chi è il cliente, segnalazioni, contratto da firmare.", ico: "shield" },
    { nome: "Si parte: i primi 90 giorni", desc: "Cosa c'è oggi, cosa arriva e quando, obiettivi del trimestre.", ico: "calendar" },
    { nome: "Il primo giorno", desc: "La lista da fare: contratto, profilo, link di invito, i primi 20 contatti.", ico: "doc" },
    { nome: "Regole del Privato", desc: "Il primo profilo finito, da studiare.", ico: "home", file: "regole/privato.html", pronto: true },
    { nome: "Regole della Rete", desc: "Ruoli, chi vede cosa, clienti, ristrutturazioni, zone.", ico: "team", file: "regole/rete.html", pronto: true },
    { nome: "Regole del Fornitore di luce e gas", desc: "Il giro delle richieste, la privacy del cliente, l'accordo.", ico: "pulse", file: "regole/energia.html", pronto: true },
    // 12.10.2026: per la presentazione alla rete del 13.10.
    { nome: "Regole delle Aziende", desc: "Imprese, subappaltatori, impiantisti, artigiani: cantieri e richieste, lavori AncheCasa, gare.", ico: "building", file: "regole/aziende.html", pronto: true },
    { nome: "Regolamento della rete", desc: "Il regolamento in PDF da dare ai commerciali.", ico: "shield", file: "docs/AncheCasa-Regolamento-della-rete.pdf", pronto: true },
    { nome: "Circolare 1/2026", desc: "Le nuove regole, in PDF.", ico: "doc", file: "docs/AncheCasa-Circolare-1-2026-Nuove-regole.pdf", pronto: true }
  ];
  // I contratti della rete in PDF (cartella dashboard/docs).
  const CONTRATTI_PDF = [
    ["Agente", "docs/AncheCasa-3Contratto-Agente.pdf"], ["Sub-agente", "docs/AncheCasa-4Contratto-Subagente.pdf"], ["Capo area", "docs/AncheCasa-2Contratto-Capo-Area.pdf"],
    ["Assistente sviluppo rete", "docs/AncheCasa-1Contratto-Assistente-Sviluppo-Rete.pdf"], ["Responsabile Rete Italia", "docs/AncheCasa-5Contratto-Responsabile-Rete-Italia.pdf"]
  ];
  // La scaletta della presentazione del 13.10: l'ordine in cui mostrare AncheCasa, con il tasto per aprire ogni pagina.
  const v = (fam, pag, extra) => `index.html?demo=${fam}${extra || ""}&vetrina=1#/${fam}/${pag}`;
  const SCALETTA = [
    ["AncheCasa in un colpo d'occhio", "I numeri della rete e degli iscritti, come li vede AncheCasa.", v("admin", "home")],
    ["Il privato", "«Ho un guasto», «Ristruttura con AncheCasa», «Il mio cantiere»: tutto gratis per chi ha una casa.", v("privato", "pv-guasto")],
    ["La rete", "La dashboard del commerciale: clienti, Vendi, guadagni, Sopralluogo Flash dal telefono.", v("agente", "home", "&ruolo=agente")],
    ["Le imprese fanno da general contractor", "«I miei cantieri»: pubblicano cosa serve e confrontano le offerte voce per voce.", v("azienda", "cnt_cantieri", "&tipo=azienda_imprese_edili")],
    ["Chi riceve le richieste", "Subappaltatori, impiantisti e fornitori: «Richieste per te», offerta, bollino documenti, voti.", v("azienda", "cnt_perme", "&tipo=azienda_subappaltatori")],
    ["L'artigiano", "«Ho un guasto» visto dall'artigiano: una richiesta alla volta, 15 minuti o 2 ore.", v("azienda", "art_richieste", "&tipo=azienda_artigiani")],
    ["AncheCasa general contractor", "Ristrutturazioni: sopralluogo, computo, Profit Guard, impresa scelta da AncheCasa.", v("admin", "ristrutturazioni-admin")],
    ["Le gare", "«Cerca gare» e «Le mie gare» per le imprese, moduli a pagamento.", v("azienda", "gare_cerca", "&tipo=azienda_imprese_edili")],
    ["I fornitori", "Luce e gas, telefono, finanza, materiali, noleggio: il cliente sceglie, il fornitore conquista.", v("azienda", "energia_home", "&tipo=azienda_luce_gas")],
    ["Regole, documenti e contratti", "Cosa dare ai commerciali prima di partire: in fondo a questa pagina.", "#sd-documenti"]
  ];

  const apri = (p, ruolo) => ruolo
    ? `index.html?demo=${p.demo}&ruolo=${ruolo}&vetrina=1#/${p.demo}/home`
    : `index.html?demo=${p.demo}${p.tipo ? "&tipo=" + p.tipo : ""}&vetrina=1#/${p.demo}/${p.pagina || "bacheca"}`;

  V["sala-demo"] = {
    title: "Sala demo",
    sub: "Le dashboard di ogni profilo con dati di esempio, le regole e i contratti, per presentare AncheCasa alla rete.",
    render(el) {
      const pronte = PROFILI.filter((p) => p.pronta).length;
      el.innerHTML = html`
        <section class="card sd-scaletta"><h2>La presentazione del 13 ottobre</h2>
          <p class="note">L'ordine in cui mostrare AncheCasa alla rete. Ogni tasto apre la pagina in vetrina, con dati di esempio, in una scheda nuova.</p>
          <ol class="sd-passi">${SCALETTA.map((x) => html`<li><div><b>${x[0]}</b><small>${x[1]}</small></div>${x[2].charAt(0) === "#" ? html`<a class="sd-btn sd-chiaro" href="${x[2]}" data-ancora>Vai</a>` : html`<a class="sd-btn" href="${x[2]}" target="_blank" rel="noopener">Apri</a>`}</li>`)}</ol>
        </section>
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
        <h2 class="sd-tit" id="sd-documenti">I documenti per la rete</h2>
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
          <div class="sd-tasti">${CONTRATTI_PDF.map((c) => html`<a class="sd-btn sd-chiaro" href="${c[1]}" target="_blank" rel="noopener">${c[0]} (PDF)</a>`)}</div>
          <a class="sd-btn" href="#/admin/contratti">Apri i contratti da firmare online</a>
        </div>`.s;
      el.querySelectorAll("[data-ancora]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); const t = el.querySelector("#sd-documenti"); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    }
  };
})();
