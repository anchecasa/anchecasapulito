/* RETE · schede del progetto e Formazione (12.10.2026, deciso da Nando con Claude, vedi PROGETTO-DASHBOARD.md).
   Livelli: Responsabile Rete Italia → Sviluppo rete → Capo area → Agente → Sub-agente.
   Ogni pulsante della rete che qui non esiste ancora ha una scheda: cosa fa, come funziona, le regole,
   e se la funzione c'è già nell'app o è da costruire. Il ruolo, in anteprima, arriva da ?ruolo=…. */
(function () {
  const AC = window.AC;
  const { html, icon } = AC.ui;
  const V = AC.views;

  const RUOLI = { subagente: "Sub-agente", agente: "Agente", capoarea: "Capo area", sviluppo: "Sviluppo rete", reteitalia: "Responsabile Rete Italia" };
  const ORDINE = ["subagente", "agente", "capoarea", "sviluppo", "reteitalia"];
  const RESPONSABILE = { subagente: "il tuo agente", agente: "il tuo capo area", capoarea: "il tuo sviluppo rete", sviluppo: "il Responsabile Rete Italia", reteitalia: "l'admin" };
  const ZONA = { subagente: "", agente: "i tuoi sub-agenti", capoarea: "la tua regione", sviluppo: "la tua area", reteitalia: "tutta Italia" };

  function ruolo() {
    const q = new URLSearchParams(location.search).get("ruolo");
    if (q && RUOLI[q]) return q;
    const p = AC.store && AC.store.data && AC.store.data.profilo;
    return (p && RUOLI[p.ruoloRete]) ? p.ruoloRete : "agente";
  }
  AC.ruoloRete = ruolo;
  AC.RUOLI_RETE = RUOLI;
  AC.ORDINE_RETE = ORDINE;

  const STATO = {
    app: { lab: "C'è già nell'app, da collegare", cls: "sw-in" },
    parte: { lab: "C'è in parte", cls: "sw-in" },
    nuovo: { lab: "Da costruire", cls: "sw-off" }
  };

  const SCHEDE = {
    "re-clienti": {
      title: "I miei clienti", sub: "Privati e aziende che hai portato, e quelli della tua squadra.", stato: "app",
      passi: [
        "Elenco dei tuoi clienti con lo stato: attivo, fermo, disdetto.",
        "Chi ha una squadra vede anche i clienti di chi ha sotto: nome e stato.",
        "Telefono e mail li vede solo chi ha registrato il cliente.",
        "Un cliente fermo da 30 giorni o che disdice manda un avviso a te e all'admin."
      ],
      regole: ["Il cliente è tuo per sempre: privato e azienda.", "Se lasci AncheCasa i tuoi clienti passano al tuo responsabile diretto.", "L'admin può intervenire e chiedere perché un cliente non fa niente."]
    },
    "re-registra": {
      title: "Registra un cliente", sub: "Privato o azienda: diventa tuo.", stato: "app",
      passi: ["Scrivi nome, telefono o mail (per l'azienda la partita IVA).", "Se il cliente è già di un collega l'app ti ferma, senza dire di chi è.", "Da lì puoi mandargli l'invito per mail."],
      regole: ["Il primo che lo registra lo tiene per sempre."]
    },
    "re-vendi": {
      title: "Vendi", sub: "Abbonamenti, moduli, servizi. Le ristrutturazioni si segnalano.", stato: "parte",
      passi: [
        "Abbonamenti e moduli per le aziende, sicurezza, luce e gas: li vendi tu, direttamente.",
        "Ristrutturazione: la segnali al tuo responsabile, che decide se si prende e chi fa il sopralluogo.",
        "Sviluppo rete e Responsabile Rete Italia lo sanno sempre e possono intervenire.",
        "Poi passa all'admin per preventivo e firma. L'admin può delegare il lavoro a qualcuno della rete."
      ],
      regole: ["Tutti vendono tutto.", "Le provvigioni sono da rivedere: si decidono con il listino."]
    },
    "re-flash": {
      title: "Sopralluogo Flash", sub: "Foto e nota vocale: computo e stima.", stato: "parte",
      passi: ["Sul posto scatti le foto e registri una nota vocale.", "AncheCasa le trasforma in computo e stima.", "Da lì nasce il preventivo."],
      regole: ["Lo usano tutti, admin compreso.", "Oggi manca la chiave Gemini valida: senza, la stima non parte."]
    },
    "re-fermi": {
      title: "Chi è fermo", sub: "Nella tua squadra e tra i tuoi clienti.", stato: "nuovo",
      passi: ["Chi della tua squadra non vende da 30 giorni.", "Quali clienti non attivano niente da 30 giorni o hanno disdetto.", "Un tasto per scrivergli subito."],
      regole: ["Fermo vuol dire nessuna vendita da 30 giorni."]
    },
    "re-cartina": {
      title: "La cartina", sub: "Dove sono la rete e i clienti, con le percentuali.", stato: "nuovo",
      passi: [
        "La cartina dell'Italia, per la tua parte: la tua regione, la tua area, o tutta Italia.",
        "Per ogni zona: crescita (nuovi clienti sul mese prima), clienti attivi, obiettivo del mese, squadra ferma.",
        "Le zone vuote si vedono subito."
      ],
      regole: ["Ognuno vede la sua parte: il capo area la regione, lo sviluppo rete l'area, il Responsabile Rete Italia tutta Italia."]
    },
    "re-recensioni": {
      title: "Recensioni della zona", sub: "Cosa dicono i clienti delle aziende della tua zona.", stato: "parte",
      passi: ["Le recensioni dei clienti, zona per zona.", "Le aziende con le recensioni più basse in cima, per intervenire."],
      regole: ["Il capo area vede la regione, lo sviluppo rete l'area, il Responsabile Rete Italia tutta Italia."]
    },
    "re-aprire": {
      title: "Regioni da aprire", sub: "Dove manca ancora la rete.", stato: "parte",
      passi: ["Le regioni e le zone senza capo area o con pochi agenti.", "Da qui segnali le persone da far entrare."],
      regole: ["Le zone le decide l'admin. In una regione possono esserci due capi area.", "Dove manca il capo area, l'agente sta sotto lo sviluppo rete."]
    },
    "re-segnala": {
      title: "Segnala una persona", sub: "Qualcuno da far entrare nella rete.", stato: "app",
      passi: ["Scrivi nome, mail, telefono, ruolo proposto e zona.", "Decide l'admin: sì o no.", "Con il sì parte l'invito per mail."],
      regole: ["Per ora decide solo l'admin.", "Privati e aziende invece li inviti tu direttamente: diventano tuoi clienti."]
    }
  };

  function scheda(id) {
    const s = SCHEDE[id];
    const st = STATO[s.stato];
    return {
      title: s.title,
      sub: s.sub,
      render(el) {
        const r = ruolo();
        const vetrina = AC.pulsanti && AC.pulsanti.vetrina;
        el.innerHTML = html`
          <div class="pv-scheda">
            <p><span class="sw-stato ${st.cls}">${st.lab}</span>${vetrina ? "" : html` <span class="note">Scheda del progetto: qui si vede cosa farà il pulsante.</span>`}</p>
            <div class="pv-due">
              <section class="card"><h2>Come funziona</h2><ol class="pv-lista">${s.passi.map((p) => html`<li>${p}</li>`)}</ol></section>
              <section class="card"><h2>Regole</h2><ul class="pv-lista">${s.regole.map((p) => html`<li>${p}</li>`)}
                <li>Sei <b>${RUOLI[r]}</b>: il tuo responsabile è ${RESPONSABILE[r]}${ZONA[r] ? html`; vedi ${ZONA[r]}` : ""}.</li></ul></section>
            </div>
          </div>`.s;
      }
    };
  }
  Object.keys(SCHEDE).forEach((id) => { V[id] = scheda(id); });

  // Formazione: i documenti da studiare e la Sala demo. Pagina vera, non scheda.
  const DOC = [
    { nome: "Regole del Privato", file: "regole/privato.html", ico: "home" },
    { nome: "Regole della Rete", file: "regole/rete.html", ico: "team" },
    { nome: "Regole del Fornitore di luce e gas", file: "regole/energia.html", ico: "pulse" }
  ];
  V["re-formazione"] = {
    title: "Formazione",
    sub: "Le regole di ogni profilo, da studiare prima di andare dai clienti.",
    render(el) {
      el.innerHTML = html`<div class="doc-griglia">${DOC.map((d) => html`<a class="doc-tile sw-tile rg-tile" href="${d.file}" target="_blank" rel="noopener">
          <span class="rg-ico">${icon(d.ico, 22)}</span><b>${d.nome}</b><small>Documento con la carta intestata AncheCasa. Si scarica in PDF.</small></a>`)}</div>
        <p class="note">Gli altri profili (impresa, artigiano, fornitore…) arrivano man mano.</p>`.s;
    }
  };
})();
