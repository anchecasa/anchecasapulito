/* Catalogo: moduli dell'app, corsi e servizi AncheSicura. Prezzi della proposta del 09.10.2026
   (i prezzi dei moduli veri si leggono dalle impostazioni, che l'admin cambia dall'app). */
export const MODULI = [
  { id: "ufficio", nome: "Ufficio", ico: "ufficio", desc: "Clienti, preventivi, fatture, documenti", tipi: ["cliente", "preventivo", "fattura", "documento"], compreso: true },
  { id: "sicurezza", nome: "Sicurezza", ico: "scudo", desc: "Dipendenti, corsi, visite, scadenze, DPI firmati, segnalazioni", div: "AncheSicura", tipi: ["dipendente", "segnalazione", "avviso", "sopralluogo"] },
  { id: "sicantiere", nome: "Sicurezza Cantiere", ico: "casco", desc: "Ingressi con codice, verbali del coordinatore, checklist del preposto", div: "AncheSicura", tipi: ["ingresso", "verbale", "checklist"] },
  { id: "cantieri", nome: "Cantiere e SAL", ico: "gru", desc: "Giornale dei lavori, presenze, SAL, cronoprogramma, DDT, app del cliente", tipi: ["cantiere"] },
  { id: "gare", nome: "Gare", ico: "gara", desc: "Analisi del bando con l'IA, partecipa sì o no, esito, gara vinta → cantiere", tipi: ["gara"] },
  { id: "lotti", nome: "Lotti e subappalti", ico: "lotti", desc: "Pubblica lotti e forniture, ricevi offerte da imprese e fornitori", tipi: ["lotto"] },
  { id: "centralino", nome: "Centralino AncheVoice", ico: "tel", desc: "Registro chiamate e richiami (il numero AncheVoice si collega a parte)", div: "AncheVoice", tipi: ["chiamata"] },
  { id: "magazzino", nome: "Magazzino e mezzi", ico: "box", desc: "Giacenze con scorta minima, mezzi, scadenze e manutenzioni", tipi: ["articolo", "mezzo"] },
];
export const PREZZI_PREDEFINITI = { base_impresa: 49, base_fornitore: 99, base_partner: 49, base_artigiano: 14.9, ufficio: 0, sicurezza: 9, sicantiere: 19, cantieri: 29, gare: 29, lotti: 9, centralino: 19, magazzino: 9, pacchetto: 69 };
/** Abbonamento base per tipo di azienda (deciso da Nando il 09.10.2026: abbonamento + moduli). */
export const BASE = {
  impresa: { nome: "Abbonamento Impresa", comprende: ["Modulo Ufficio: clienti, preventivi, fatture, documenti", "Vetrina e recensioni", "Lotti e subappalti degli altri: fai offerte", "Rivendita della sicurezza (30%)", "Corsi AncheSicura a prezzi sotto il mercato"] },
  partner: { nome: "Abbonamento Impresa partner", comprende: ["Modulo Ufficio", "Cantieri AncheCasa assegnati", "Lotti e offerte", "Kit del marchio"] },
  fornitore: { nome: "Abbonamento Fornitore", comprende: ["Listino prodotti e noleggi", "Richieste di fornitura dei cantieri", "Offerte e ordini"] },
  gc: { nome: "AncheCasa GC", comprende: ["Tutto compreso"] },
};

export const CORSI = [
  ["Lavoratori, parte generale (4 ore)", "Online", 29, 40], ["Generale + specifica rischio basso (8 ore)", "Online", 49, 70],
  ["Lavoratori rischio medio (12 ore)", "Online + aula", 129, 180], ["Lavoratori rischio alto (16 ore)", "Online + aula", 159, 210],
  ["Aggiornamento lavoratori (6 ore)", "Online", 45, 65], ["Dirigenti (12 ore)", "Online", 99, 143], ["Datore di lavoro RSPP (16 ore)", "Online", 129, 176],
  ["Preposto (12 ore)", "Aula", 159, 220], ["Antincendio livello 1", "Aula", 139, 200], ["Antincendio livello 2", "Aula", 179, 250],
  ["Primo soccorso gruppo B e C", "Aula", 179, 250], ["Primo soccorso gruppo A", "Aula", 239, 330], ["HACCP", "Online", 29, null],
].map(([nome, modo, prezzo, mercato]) => ({ nome, modo, prezzo, mercato }));
export const SERVIZI = [
  ["Visita medica", 29], ["POS", 59], ["DUVRI", 69], ["DVR", 199], ["PSC", 199], ["RSPP esterno", null],
].map(([nome, prezzo]) => ({ nome, prezzo, da: prezzo != null }));

export const REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];
export const AREE = { Nord: ["Piemonte", "Valle d'Aosta", "Lombardia", "Trentino-Alto Adige", "Veneto", "Friuli-Venezia Giulia", "Liguria", "Emilia-Romagna"], Centro: ["Toscana", "Umbria", "Marche", "Lazio"], "Sud e isole": ["Abruzzo", "Molise", "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna"] };
