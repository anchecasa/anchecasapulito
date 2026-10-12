/* ADMIN · Regole iscritti (12.10.2026, su richiesta di Nando).
   Per ogni profilo un documento con la carta intestata AncheCasa (cartella dashboard/regole/):
   chi è, cosa vede, come funziona ogni pulsante, come si spiega al cliente.
   Serve agli agenti per studiare le logiche. Un profilo è «pronto» quando le sue regole sono decise
   in PROGETTO-DASHBOARD.md; allora si aggiunge il file e si mette qui pronto: true. */
(function () {
  const AC = window.AC;
  const { html, icon } = AC.ui;
  const V = AC.views;

  const DOCUMENTI = [
    { k: "privato", nome: "Privato", desc: "Chi ha una casa: guasti, ristrutturazioni, bacheca, bollette, passaparola.", ico: "home", file: "regole/privato.html", pronto: true, versione: "12.10.2026" },
    { k: "rete", nome: "Rete", desc: "Agente, sub-agente, capo area, sviluppo rete, Rete Italia.", ico: "team" },
    { k: "impresa", nome: "Impresa edile", desc: "Cantieri, SAL, gare, subappalti, squadre.", ico: "building" },
    { k: "artigiano", nome: "Artigiano", desc: "Interventi, SuperMastro, 4,99 € a lavoro fatto.", ico: "gear" },
    { k: "subappaltatore", nome: "Subappaltatore e impiantista", desc: "Lavori per i general contractor, interventi, certificazioni.", ico: "gear" },
    { k: "studio", nome: "Studio tecnico", desc: "Pratiche, gare, presenze di cantiere.", ico: "doc" },
    { k: "fornitore", nome: "Fornitore", desc: "Materiali, noleggio, IT: listino, ordini, consegne.", ico: "folder" },
    { k: "energia", nome: "Luce e gas", desc: "Offerte ai privati dentro AncheCasa.", ico: "pulse" },
    { k: "agenzia", nome: "Agenzia immobiliare", desc: "Annunci in bacheca: piano gratuito, poi a pagamento.", ico: "home" },
    { k: "committente", nome: "Committente", desc: "Condomini, amministratori, grandi aziende e fondi che pubblicano appalti.", ico: "building" }
  ];

  V.regole = {
    title: "Regole iscritti",
    sub: "Un documento per ogni profilo, per studiare e spiegare le logiche di AncheCasa.",
    render(el) {
      const pronti = DOCUMENTI.filter((d) => d.pronto).length;
      el.innerHTML = html`<p class="note">${pronti} su ${DOCUMENTI.length} pronti. Gli altri si scrivono quando le regole del profilo sono decise.</p>
        <div class="doc-griglia rg-griglia">
          ${DOCUMENTI.map((d) => d.pronto
            ? html`<a class="doc-tile sw-tile rg-tile" href="${d.file}" target="_blank" rel="noopener">
                <span class="rg-ico">${icon(d.ico, 22)}</span>
                <b>${d.nome}</b><small>${d.desc}</small>
                <span class="sw-stato sw-ok">Pronto · versione ${d.versione}</span>
              </a>`
            : html`<div class="doc-tile sw-tile sw-muto rg-tile">
                <span class="rg-ico rg-ico-off">${icon(d.ico, 22)}</span>
                <b>${d.nome}</b><small>${d.desc}</small>
                <span class="sw-stato sw-off">Da scrivere</span>
              </div>`)}
        </div>`.s;
    }
  };
})();
