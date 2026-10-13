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
    { nome: "Artigiano", desc: "Ho un guasto: una richiesta alla volta, 15 minuti o 2 ore, lavoro fatto, 1 mese gratis, poi 14,90 €, dal 4° mese 19,90 € + 5,90 € a lavoro, recensioni, garanzia.", ico: "gear", demo: "azienda", tipo: "azienda_artigiani", pagina: "art_home", regole: "regole/aziende.html", pronta: true },
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
    { nome: "Il listino", desc: "Prezzi di tutti i profili, moduli, sponsor, e le provvigioni della rete sull'utile con tre esempi.", ico: "wallet", file: "regole/listino.html", pronto: true },
    { nome: "Regole del Privato", desc: "Il primo profilo finito, da studiare.", ico: "home", file: "regole/privato.html", pronto: true },
    { nome: "Regole della Rete", desc: "Ruoli, chi vede cosa, clienti, ristrutturazioni, zone.", ico: "team", file: "regole/rete.html", pronto: true },
    { nome: "Regole del Fornitore di luce e gas", desc: "Il giro delle richieste, la privacy del cliente, l'accordo.", ico: "pulse", file: "regole/energia.html", pronto: true },
    // 12.10.2026: per la presentazione alla rete del 13.10.
    { nome: "Regole delle Aziende", desc: "Imprese, subappaltatori, impiantisti, artigiani: cantieri e richieste, lavori AncheCasa, gare.", ico: "building", file: "regole/aziende.html", pronto: true },
    { nome: "Regolamento della rete", desc: "Il regolamento in PDF da dare ai commerciali.", ico: "shield", file: "docs/AncheCasa-Regolamento-della-rete.pdf", pronto: true },
    { nome: "Circolare 1/2026", desc: "Le nuove regole, in PDF.", ico: "doc", file: "docs/AncheCasa-Circolare-1-2026-Nuove-regole.pdf", pronto: true },
    // 13.10.2026: affiliati e contratto del cliente (bozze per il legale).
    { nome: "Accordo con l'impresa affiliata", desc: "69 € al mese, nessuna esclusiva, subappalto pagato a SAL. Bozza per il legale.", ico: "building", file: "regole/accordo-affiliato.html", pronto: true },
    { nome: "Contratto con il cliente", desc: "Ristrutturazione con AncheCasa: preventivo voce per voce, pagamenti a SAL, garanzie. Bozza per il legale.", ico: "doc", file: "regole/contratto-cliente.html", pronto: true }
  ];
  // I contratti della rete in PDF (cartella dashboard/docs).
  const CONTRATTI_PDF = [
    ["Agente", "docs/AncheCasa-3Contratto-Agente.pdf"], ["Sub-agente", "docs/AncheCasa-4Contratto-Subagente.pdf"], ["Capo area", "docs/AncheCasa-2Contratto-Capo-Area.pdf"],
    ["Assistente sviluppo rete", "docs/AncheCasa-1Contratto-Assistente-Sviluppo-Rete.pdf"], ["Responsabile Rete Italia", "docs/AncheCasa-5Contratto-Responsabile-Rete-Italia.pdf"]
  ];
  // 13.10.2026: le presentazioni per la rete (stile Sopralluogo Flash), in dashboard/docs/presentazioni.
  // Ogni presentazione: HTML con le frecce avanti e indietro (si apre nel browser), PDF e PowerPoint con le note.
  const PP = "docs/presentazioni/";
  const PRESENTAZIONI = [
    ["1-AncheCasa-perche-adesso", "Perché adesso: una storia che parte da voi", "Otto persone, sei storie: Anna, Rosa, Luca, Giuseppe. Le regole, i software di AncheCasa Studio srl e il Magazine n. 2.", "9 min"],
    ["2-AncheCasa-SuperMastro", "SuperMastro: il rubinetto di Rosa", "Domenica, ore 21: il guasto in 5 secondi, Giuseppe alla porta, e il bagno che diventa un sopralluogo. Poi la prova dal vivo.", "7 min"],
    ["3-Sopralluogo-Flash-come-funziona", "Sopralluogo Flash: il bagno di Anna", "Mario, Anna e Antonio: dalla porta del cliente al preventivo firmato, con l'impresa affiliata.", "11 min"],
    ["4-AncheCasa-come-guadagni", "Come guadagni: il primo anno di Giulia", "Mese per mese, con i numeri del listino: artigiani, imprese affiliate, fornitori, una ristrutturazione.", "9 min"],
    ["5-AncheCasa-gare-cantieri-computi", "Gare e cantieri: l'impresa di Luca", "Luca si affilia, lavora in subappalto a SAL, usa cantieri e gare. AncheBIM e Terranova in arrivo.", "7 min"],
    ["6-AncheCasa-si-parte-domani", "Si parte domani: il primo giorno di Marco", "Ora per ora: la firma, i primi 20 nomi, le tre frasi, le regole, i quattro numeri.", "7 min"]
  ];

  const apri = (p, ruolo) => ruolo
    ? `index.html?demo=${p.demo}&ruolo=${ruolo}&vetrina=1#/${p.demo}/home`
    : `index.html?demo=${p.demo}${p.tipo ? "&tipo=" + p.tipo : ""}&vetrina=1#/${p.demo}/${p.pagina || "bacheca"}`;

  V["sala-demo"] = {
    title: "Sala demo",
    sub: "Le sei presentazioni per la rete e i contratti. Sotto, chiuso, il resto del materiale.",
    render(el) {
      const pronte = PROFILI.filter((p) => p.pronta).length;
      el.innerHTML = html`
        <section class="card sd-scaletta"><h2>Le presentazioni per la rete</h2>
          <p class="note">Sei presentazioni, un'ora in tutto con le domande. «Apri» le mostra a schermo intero con le frecce avanti e indietro (tasto F per lo schermo intero, N per le note). Poi PDF e PowerPoint da scaricare.</p>
          <ol class="sd-passi">${PRESENTAZIONI.map((x) => html`<li><div><b>${x[1]} · ${x[3]}</b><small>${x[2]}</small></div><span class="sd-tasti"><a class="sd-btn" href="${PP + x[0] + ".html"}" target="_blank" rel="noopener">Apri</a><a class="sd-btn sd-chiaro" href="${PP + x[0] + ".pdf"}" target="_blank" rel="noopener">PDF</a><a class="sd-btn sd-chiaro" href="${PP + x[0] + ".pptx"}" download>PowerPoint</a></span></li>`)}</ol>
        </section>
        <h2 class="sd-tit">I contratti</h2>
        <div class="card sd-contratti">
          <p>Agente, sub-agente, capo area, Responsabile Rete Italia, collaboratore occasionale: i modelli con la carta intestata, firmabili online.</p>
          <div class="sd-tasti">${CONTRATTI_PDF.map((c) => html`<a class="sd-btn sd-chiaro" href="${c[1]}" target="_blank" rel="noopener">${c[0]} (PDF)</a>`)}</div>
          <a class="sd-btn" href="#/admin/contratti">Apri i contratti da firmare online</a>
        </div>        <details class="card sd-altro" style="margin-top:18px">
          <summary style="cursor:pointer;font-weight:700;padding:4px 0">Altro materiale: dashboard di esempio, regole e documenti</summary>
        <p class="note">Le dashboard in vetrina hanno dati di esempio e non sono collegate a nessuno: si naviga liberamente, niente va sul database. ${pronte} su ${PROFILI.length} profili pronti, gli altri arrivano man mano che li finiamo.</p>
        <h2 class="sd-tit">Le dashboard</h2>
        <div class="doc-griglia">
          ${PROFILI.filter((p) => p.pronta).map((p) => html`<div class="doc-tile sw-tile sd-tile${p.pronta ? "" : " sw-muto"}">
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
        </details>
      `.s;
      el.querySelectorAll("[data-ancora]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); const t = el.querySelector("#sd-documenti"); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    }
  };
})();
