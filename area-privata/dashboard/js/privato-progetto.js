/* PRIVATO · schede del progetto (12.10.2026, deciso da Nando con Claude, vedi PROGETTO-DASHBOARD.md).
   Ogni pulsante del privato che non esiste ancora qui ha una scheda: cosa fa, come funziona, le regole,
   e se la funzione c'è già nell'app o è da costruire. Quando la funzione vera arriva, la scheda si sostituisce. */
(function () {
  const AC = window.AC;
  const { html } = AC.ui;
  const V = AC.views;

  const STATO = {
    app: { lab: "C'è già nell'app, da collegare", cls: "sw-in" },
    parte: { lab: "C'è in parte", cls: "sw-in" },
    nuovo: { lab: "Da costruire", cls: "sw-off" }
  };

  const SCHEDE = {
    guasto: {
      title: "Ho un guasto",
      sub: "Un video di 5 secondi, SuperMastro dice cosa fare o chi chiamare.",
      stato: "parte",
      passi: [
        "Il privato filma il guasto dal telefono (da computer vede come funziona).",
        "SuperMastro riconosce il problema: se si risolve da soli mostra la guida, altrimenti cerca l'artigiano.",
        "La richiesta va a un artigiano: il più vicino, libero, con le recensioni migliori.",
        "Se non accetta entro 15 minuti passa al secondo, poi al terzo. Se nessuno accetta, la gestisce AncheCasa.",
        "Il privato vede sempre a che punto è. Funziona anche di notte e nei festivi."
      ],
      regole: [
        "Serve il telefono verificato con WhatsApp: qualcuno deve venire a casa.",
        "L'artigiano vede il numero solo dopo aver accettato.",
        "Finché in zona non ci sono artigiani iscritti, SuperMastro mostra l'elenco da Maps e il privato chiama lui."
      ]
    },
    trova: {
      title: "Pronto intervento · artigiano",
      sub: "Cerca per mestiere e zona, manda la richiesta.",
      stato: "parte",
      passi: [
        "Il privato sceglie il mestiere e la zona, descrive il lavoro.",
        "La richiesta va a un artigiano; senza risposta entro 2 ore passa al secondo, poi al terzo, poi ad AncheCasa.",
        "Si parla in chat dentro AncheCasa.",
        "Con l'artigiano iscritto il privato paga tramite l'app. A lavoro fatto conferma con un tocco."
      ],
      regole: [
        "L'artigiano paga 4,99 € a lavoro fatto (senza conferma entro 7 giorni vale come fatto).",
        "Garanzia AncheCasa 30 giorni solo con artigiani iscritti e lavori chiusi nell'app.",
        "Dopo il lavoro, recensione con il sistema interno di AncheCasa (da progettare)."
      ]
    },
    ristruttura: {
      title: "Ristruttura con AncheCasa",
      sub: "Il lavoro lo segue AncheCasa, dal sopralluogo al cantiere.",
      stato: "parte",
      passi: [
        "Il privato manda la richiesta.",
        "Un agente fa il sopralluogo con Sopralluogo Flash: foto e nota vocale diventano computo e stima.",
        "Arriva il preventivo.",
        "Si firma il contratto e si apre «Il mio cantiere»."
      ],
      regole: ["Serve il telefono verificato con WhatsApp.", "Il credito AncheCasa si può spendere qui."]
    },
    "mio-cantiere": {
      title: "Il mio cantiere",
      sub: "Si vede solo quando c'è un cantiere aperto.",
      stato: "app",
      passi: [
        "Avanzamento dei lavori in percentuale, con le foto di ogni settimana.",
        "SAL da pagare e SAL pagati.",
        "Documenti del cantiere: contratto, permessi, certificazioni.",
        "Chat con il responsabile del cantiere."
      ],
      regole: ["Il pulsante compare da solo quando il contratto è firmato."]
    },
    annunci: {
      title: "Bacheca annunci",
      sub: "Casa e lavoro: la vedono tutti, per rispondere ci si iscrive.",
      stato: "parte",
      passi: [
        "Annunci di casa (vendo, affitto, cerco) e di lavoro (offro, cerco).",
        "Filtri per tipo e zona.",
        "Per rispondere si scrive in chat dentro AncheCasa."
      ],
      regole: [
        "Anche chi non è iscritto vede gli annunci (anche dal sito); per rispondere ci si iscrive.",
        "Ci pubblicano anche le agenzie immobiliari: piano gratuito, poi a pagamento."
      ]
    },
    "mie-richieste": {
      title: "Le mie richieste",
      sub: "Guasti, lavori, ristrutturazioni: a che punto sono.",
      stato: "app",
      passi: ["Ogni richiesta con il suo stato: in cerca, accettata, in corso, fatta.", "Da qui si conferma «lavoro fatto» e si lascia la recensione."],
      regole: []
    },
    "miei-annunci": {
      title: "I miei annunci",
      sub: "Gli annunci che hai pubblicato.",
      stato: "parte",
      passi: ["Elenco con le risposte ricevute.", "Rinnovo, modifica, chiusura."],
      regole: ["Gli annunci escono subito, AncheCasa controlla dopo.", "Durano 60 giorni: prima della scadenza arriva un avviso per rinnovarli."]
    },
    "check-bollette": {
      title: "Check Bollette",
      sub: "Controlla la bolletta di luce e gas.",
      stato: "parte",
      passi: ["Il privato carica o inserisce i dati della bolletta.", "Vede quanto spende rispetto al mercato.", "Se può risparmiare, un tasto porta alle Offerte luce e gas."],
      regole: ["Oggi è sul Magazine (magazine.anchecasa.it/check-bollette): va portato anche qui."]
    },
    "offerte-luce": {
      title: "Offerte luce e gas",
      sub: "Le offerte dei fornitori iscritti ad AncheCasa.",
      stato: "nuovo",
      passi: ["Il privato vede le offerte dei fornitori di luce e gas iscritti (e di altri fornitori).", "Chiede l'offerta dentro AncheCasa.", "Il fornitore risponde dalla sua dashboard."],
      regole: ["Tutto passa da AncheCasa: si sa chi ha portato il cliente."]
    },
    "mie-app": {
      title: "Le mie app",
      sub: "Ogni 15 giorni il Magazine porta un'app nuova, gratis.",
      stato: "nuovo",
      passi: ["Ogni uscita del Magazine aggiunge un'app allo scaffale.", "Le app restano per sempre.", "Check Bollette è la prima."],
      regole: ["Più avanti ci saranno anche app a pagamento, con il segno €."]
    }
  };

  // Pagine che esistono già, rinominate per il privato (il contenuto resta quello di oggi).
  const RINOMINA = {
    pubblica: { title: "Pubblica un annuncio", note: "Pagina di oggi. Va adattata: annuncio di casa o di lavoro, esce subito, dura 60 giorni." },
    inviti: { title: "Invita e guadagna credito", note: "Pagina di oggi degli inviti. Da aggiungere: credito AncheCasa (proposta in PROGETTO-DASHBOARD.md, cifre da confermare)." }
  };

  function scheda(id) {
    const s = SCHEDE[id];
    const st = STATO[s.stato];
    return {
      title: s.title,
      sub: s.sub,
      render(el) {
        el.innerHTML = html`
          <div class="pv-scheda">
            <p><span class="sw-stato ${st.cls}">${st.lab}</span>${AC.pulsanti && AC.pulsanti.vetrina ? "" : html` <span class="note">Scheda del progetto: qui si vede cosa farà il pulsante.</span>`}</p>
            <div class="pv-due">
              <section class="card"><h2>Come funziona</h2><ol class="pv-lista">${s.passi.map((p) => html`<li>${p}</li>`)}</ol></section>
              ${s.regole.length ? html`<section class="card"><h2>Regole</h2><ul class="pv-lista">${s.regole.map((p) => html`<li>${p}</li>`)}</ul></section>` : ""}
            </div>
          </div>`.s;
      }
    };
  }
  Object.keys(SCHEDE).forEach((id) => { V["pv-" + id] = scheda(id); });

  AC.privatoProgetto = { RINOMINA };
})();
