/* ADMIN · Software (12.10.2026, su richiesta esplicita di Nando).
   Tutti i software di AncheCasa in una pagina, raggruppati per categoria, come in INVENTARIO-COMPLETO.md.
   I tasti interni aprono la pagina dell'area privata; gli altri aprono il loro indirizzo in una scheda nuova.
   Per aggiungere un software: una riga nell'elenco CATEGORIE, niente altro. */
(function () {
  const AC = window.AC;
  const { html } = AC.ui;
  const V = AC.views;

  // stato: "online" (indirizzo pubblico che risponde), "interno" (tasto di questa area), "preparazione" (non pubblicato)
  const STATO = {
    online: { lab: "Online", cls: "sw-ok" },
    interno: { lab: "Qui dentro", cls: "sw-in" },
    preparazione: { lab: "Non pubblicato", cls: "sw-off" }
  };

  const CATEGORIE = [
    {
      nome: "Siti pubblici",
      desc: "Quello che vedono i cittadini e le aziende.",
      voci: [
        { nome: "Sito AncheCasa", desc: "Ricerca, prezzi, mestieri e iscrizione.", stato: "online", url: "https://anchecasa.it" },
        { nome: "SuperMastro", desc: "Video del guasto dal telefono, guida o artigiano vicino.", stato: "online", url: "https://anchecasa.it/supermastro" },
        { nome: "AncheCasa Magazine", desc: "Rivista per i cittadini, Check Bollette, avvisi.", stato: "online", url: "https://magazine.anchecasa.it" },
        { nome: "AncheSicura", desc: "Corsi, documenti e servizi per la sicurezza.", stato: "online", url: "https://sicura.anchecasa.it" }
      ]
    },
    {
      nome: "Dashboard e app",
      desc: "Dove lavorano iscritti, rete e admin.",
      voci: [
        { nome: "App AncheCasa", desc: "La dashboard di privati, aziende e fornitori. entra.anchecasa.it aspetta il DNS.", stato: "online", url: "https://app-anchecasa.pages.dev" },
        { nome: "Area privata", desc: "Questa dashboard: admin e rete.", stato: "interno", pagina: "home" }
      ]
    },
    {
      nome: "Gare e appalti",
      desc: "Bandi pubblici, analisi delle gare e gare private.",
      voci: [
        { nome: "AncheBandi", desc: "Lettura dei bandi pubblici.", stato: "interno", pagina: "bandi" },
        { nome: "Terranova", desc: "Analisi delle gare d'appalto.", stato: "interno", pagina: "terranova" },
        { nome: "Gare private", desc: "Gare e subappalti tra aziende della rete, offerte a busta chiusa.", stato: "interno", pagina: "gare-private" }
      ]
    },
    {
      nome: "Tecnico e progettazione",
      desc: "Strumenti per i disegni e i cantieri.",
      voci: [
        { nome: "AncheBIM", desc: "Controllo dei disegni su X, Y e Z, in millimetri.", stato: "interno", pagina: "anchebim" }
      ]
    },
    {
      nome: "Rete e contratti",
      desc: "Chi entra, chi firma, cosa si decide.",
      voci: [
        { nome: "Contratti", desc: "Modelli e firme della rete.", stato: "interno", pagina: "contratti" },
        { nome: "Genera link", desc: "Inviti per privati, aziende e rete.", stato: "interno", pagina: "genera-link" },
        { nome: "Sala strategia", desc: "Decisioni e linee della direzione.", stato: "interno", pagina: "strategia" }
      ]
    },
    {
      nome: "In preparazione",
      desc: "Pronti nel codice, non ancora online.",
      voci: [
        { nome: "SuperMastro SOS", desc: "Rete SOS degli artigiani. Cartella supermastro-sos.", stato: "preparazione" }
      ]
    }
  ];

  function tile(v) {
    const st = STATO[v.stato] || STATO.preparazione;
    const testa = html`<b>${v.nome}</b><small>${v.desc}</small><span class="sw-stato ${st.cls}">${st.lab}</span>`;
    if (v.pagina) return html`<a class="doc-tile sw-tile" href="#/admin/${v.pagina}">${testa}</a>`;
    if (v.url) return html`<a class="doc-tile sw-tile" href="${v.url}" target="_blank" rel="noopener">${testa}</a>`;
    return html`<div class="doc-tile sw-tile sw-muto">${testa}</div>`;
  }

  V.software = {
    title: "Software",
    sub: "Tutti i software di AncheCasa, per categoria.",
    render(el) {
      const tot = CATEGORIE.reduce((n, c) => n + c.voci.length, 0);
      el.innerHTML = html`<p class="note">${tot} software in ${CATEGORIE.length} categorie.</p>
        ${CATEGORIE.map((c) => html`<section class="sw-cat">
          <h2>${c.nome}</h2>
          <p class="note">${c.desc}</p>
          <div class="doc-griglia">${c.voci.map(tile)}</div>
        </section>`)}`.s;
    }
  };
})();
