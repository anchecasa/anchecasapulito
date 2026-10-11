/* Q: accesso semplice alle tabelle dell'app, uguale nei due motori.
   - vero: Supabase (le regole di sicurezza le applica il database);
   - prova: tabelle di ESEMPIO nel browser (nessuna regola: è solo per vedere l'app). */
import { DB } from "./db.js";

/* ======================================================================== */
/* MOTORE VERO                                                               */
/* ======================================================================== */
function qVero() {
  const sb = DB.sb;
  const ok = (r) => { if (r.error) throw r.error; return r.data; };
  function filtri(q, o) {
    o = o || {};
    Object.entries(o.eq || {}).forEach(([k, v]) => { q = v === null ? q.is(k, null) : q.eq(k, v); });
    Object.entries(o.neq || {}).forEach(([k, v]) => { q = q.neq(k, v); });
    Object.entries(o.in || {}).forEach(([k, v]) => { q = q.in(k, v); });
    Object.entries(o.gte || {}).forEach(([k, v]) => { q = q.gte(k, v); });
    Object.entries(o.lte || {}).forEach(([k, v]) => { q = q.lte(k, v); });
    return q;
  }
  return {
    async sel(tab, o = {}) {
      let q = filtri(sb.from(tab).select(o.cols || "*"), o);
      if (o.ord) q = q.order(o.ord[0], { ascending: !!o.ord[1] });
      q = q.limit(o.lim || 300);
      return ok(await q);
    },
    async uno(tab, eq) { return ok(await filtri(sb.from(tab).select("*"), { eq }).maybeSingle()); },
    async ins(tab, riga) { const d = ok(await sb.from(tab).insert(riga).select()); return Array.isArray(riga) ? d : d[0]; },
    async upd(tab, eq, patch) { return ok(await filtri(sb.from(tab).update(patch), { eq }).select()); },
    async del(tab, eq) { ok(await filtri(sb.from(tab).delete(), { eq })); },
    async rpc(nome, args) { return ok(await sb.rpc(nome, args || {})); },
    async funzione(nome, body) {
      const r = await sb.functions.invoke(nome, { body });
      if (r.error) { let m = "non_riuscita"; try { m = (await r.error.context.json()).error || m; } catch (e) { /* niente */ } throw new Error(m); }
      return r.data;
    },
    file: {
      async carica(percorso, blob, bucket = "documenti") { ok(await sb.storage.from(bucket).upload(percorso, blob, { contentType: blob.type || "application/octet-stream", upsert: false })); },
      async lista(cartella, bucket = "documenti") { const d = ok(await sb.storage.from(bucket).list(cartella, { limit: 100, sortBy: { column: "created_at", order: "desc" } })); return (d || []).filter((f) => f.id).map((f) => ({ nome: f.name, percorso: cartella + "/" + f.name, tipo: (f.metadata || {}).mimetype || "" })); },
      async url(percorso, bucket = "documenti") { const r = await sb.storage.from(bucket).createSignedUrl(percorso, 3600); return r.data ? r.data.signedUrl : ""; },
    },
  };
}

/* ======================================================================== */
/* MOTORE PROVA                                                              */
/* ======================================================================== */
function qProva() {
  const CHIAVE = "anchecasa-app-prova2-v6";
  const adesso = () => new Date().toISOString();
  const giorni = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const fa = (ore) => new Date(Date.now() - ore * 3600e3).toISOString();
  const id = (p) => (p || "x") + "-" + Math.random().toString(36).slice(2, 10);
  const io = () => DB.idUtente();

  function seme() {
    const t = {};
    const T = (n, righe) => { t[n] = righe; };
    T("app_impostazioni", [
      { chiave: "prezzi_moduli", valore: { base_impresa: 49, base_fornitore: 99, base_partner: 49, base_artigiano: 14.9, ufficio: 0, sicurezza: 9, sicantiere: 19, cantieri: 29, gare: 29, lotti: 9, centralino: 19, magazzino: 9, pacchetto: 69 } },
      { chiave: "cantieri", valore: { rete: 40, tranche: [30, 30, 40], segnala: 10, chiude: 25, segue: 30, impresa: 10, sviluppo: 12, capoarea: 8, reteitalia: 5 } },
      { chiave: "provvigioni", valore: { percentuale_vendita: 20, chi_porta: 70, sviluppo: 17, capoarea: 8, reteitalia: 5, subagente: 70, agente: 30, nota: "Quote della rete del 09.10.2026: 70 chi porta il cliente, 17 sviluppo rete, 8 capo area, 5 Rete Italia. La quota sul venduto (20%) è di esempio." } },
      { chiave: "rivendita", valore: { percentuale: 30 } },
      { chiave: "segnalazioni", valore: { premio: "" } },
      { chiave: "passaggio_impresa", valore: { interventi: 20, media: 4.5 } },
    ]);
    T("app_org", [
      { id: "o-gc", nome: "AncheCasa General Contractor", tipo: "gc", piva: "", citta: "Roma", regione: "Lazio", telefono: "", email: "", descrizione: "", titolare: "u-admin", stato: "attiva", creato: fa(900) },
      { id: "o-imp", nome: "Edil Esempio Srl", tipo: "impresa", piva: "00000000002", citta: "Roma", regione: "Lazio", telefono: "000 000 0201", email: "info@esempio.it", descrizione: "Impresa di ESEMPIO per la prova.", titolare: "u-impresa", stato: "attiva", creato: fa(800) },
      { id: "o-forn", nome: "Laterizi Esempio", tipo: "fornitore", piva: "", citta: "Latina", regione: "Lazio", telefono: "000 000 0202", email: "", descrizione: "Fornitore di ESEMPIO: materiali e noleggio.", titolare: "u-fornitore", stato: "attiva", creato: fa(700) },
      { id: "o-part", nome: "Partner Esempio Srl", tipo: "partner", piva: "", citta: "Roma", regione: "Lazio", telefono: "000 000 0203", email: "", descrizione: "Impresa partner di ESEMPIO.", titolare: "u-partner", stato: "attiva", creato: fa(600) },
    ]);
    T("app_org_membri", [
      { org: "o-gc", utente: "u-admin", ruolo: "titolare", nome: "Admin" }, { org: "o-imp", utente: "u-impresa", ruolo: "titolare", nome: "Roberto" },
      { org: "o-imp", utente: "u-operatore", ruolo: "operatore", nome: "Luca" }, { org: "o-imp", utente: "u-consulente", ruolo: "consulente", nome: "Elena" },
      { org: "o-forn", utente: "u-fornitore", ruolo: "titolare", nome: "Sara" }, { org: "o-part", utente: "u-partner", ruolo: "titolare", nome: "Paolo" },
    ]);
    T("app_moduli", [
      { org: "o-imp", modulo: "base", stato: "attivo", prezzo_mese: 49, richiesto: fa(500), attivo_dal: giorni(-20), attivo_al: null, note: "" },
      { org: "o-imp", modulo: "pacchetto", stato: "attivo", prezzo_mese: 69, richiesto: fa(500), attivo_dal: giorni(-20), attivo_al: null, note: "" },
      { org: "o-forn", modulo: "base", stato: "attivo", prezzo_mese: 99, richiesto: fa(500), attivo_dal: giorni(-20), attivo_al: null, note: "" },
      { org: "o-part", modulo: "base", stato: "attivo", prezzo_mese: 49, richiesto: fa(500), attivo_dal: giorni(-20), attivo_al: null, note: "" },
      { org: "o-gc", modulo: "base", stato: "attivo", prezzo_mese: 0, richiesto: fa(900), attivo_dal: giorni(-60), attivo_al: null, note: "" },
      { org: "o-gc", modulo: "pacchetto", stato: "attivo", prezzo_mese: 0, richiesto: fa(900), attivo_dal: giorni(-60), attivo_al: null, note: "" },
      { org: "o-part", modulo: "cantieri", stato: "richiesto", prezzo_mese: null, richiesto: fa(3), attivo_dal: null, attivo_al: null, note: "" },
    ]);
    const R = [];
    const rec = (o) => { const r = Object.assign({ id: id("r"), org: "o-imp", titolo: "", stato: "", data: null, scadenza: null, importo: null, rif: null, dati: {}, pubblico: false, creato_da: "u-impresa", creato: fa(R.length + 1), aggiornato: fa(R.length + 1) }, o); r.modulo = moduloDi(r.tipo); R.push(r); return r.id; };
    const c1 = rec({ tipo: "cliente", titolo: "Condominio Via Verdi (esempio)", dati: { telefono: "000 000 0301", email: "", indirizzo: "Via Verdi 3, Roma" } });
    rec({ tipo: "cliente", titolo: "Famiglia Rossi (esempio)", dati: { telefono: "000 000 0302" } });
    rec({ tipo: "preventivo", titolo: "Rifacimento facciata", data: giorni(-5), stato: "inviato", importo: 18300, dati: { cliente: c1, cliente_nome: "Condominio Via Verdi (esempio)", iva: 10, righe: [{ d: "Ponteggio", q: 1, p: 3500 }, { d: "Rifacimento intonaco (mq)", q: 320, p: 35 }, { d: "Tinteggiatura (mq)", q: 320, p: 11.25 }] } });
    rec({ tipo: "fattura", titolo: "FT 12/2026", data: giorni(-30), scadenza: giorni(-1), stato: "da incassare", importo: 4200, dati: { cliente_nome: "Famiglia Rossi (esempio)" } });
    const d1 = rec({ tipo: "dipendente", titolo: "Luca (esempio)", dati: { mansione: "Muratore", utente: "u-operatore", codice: "LU7K2M" } });
    const d2 = rec({ tipo: "dipendente", titolo: "Marco R. (esempio)", dati: { mansione: "Carpentiere", codice: "MR4P9X" } });
    const d3 = rec({ tipo: "dipendente", titolo: "Sara T. (esempio)", dati: { mansione: "Impiegata", codice: "ST2Q8D" } });
    rec({ tipo: "attestato", titolo: "Formazione generale e specifica", rif: d1, data: giorni(-700), scadenza: giorni(25) });
    rec({ tipo: "visita", titolo: "Visita medica", rif: d1, data: giorni(-300), scadenza: giorni(65), stato: "idoneo" });
    rec({ tipo: "attestato", titolo: "Preposto", rif: d2, data: giorni(-1800), scadenza: giorni(-12) });
    rec({ tipo: "visita", titolo: "Visita medica", rif: d2, data: giorni(-200), scadenza: giorni(160), stato: "idoneo" });
    rec({ tipo: "attestato", titolo: "Formazione generale e specifica", rif: d3, data: giorni(-100), scadenza: giorni(1700) });
    rec({ tipo: "dpi", titolo: "Casco e guanti", rif: d1, data: giorni(-1), dati: {} });
    const can = rec({ tipo: "cantiere", titolo: "Via Garibaldi 12, Roma (esempio)", stato: "in corso", data: giorni(-40), scadenza: giorni(80), importo: 240000, dati: { committente: "Condominio Via Verdi (esempio)", indirizzo: "Via Garibaldi 12, Roma", avanzamento: 62 } });
    rec({ tipo: "fase", titolo: "Demolizioni", rif: can, data: giorni(-40), scadenza: giorni(-25), dati: { avanzamento: 100 } });
    rec({ tipo: "fase", titolo: "Strutture", rif: can, data: giorni(-24), scadenza: giorni(10), dati: { avanzamento: 70 } });
    rec({ tipo: "fase", titolo: "Impianti", rif: can, data: giorni(5), scadenza: giorni(45), dati: { avanzamento: 0 } });
    rec({ tipo: "giornale", titolo: "Getto del solaio del secondo piano", rif: can, data: giorni(-1), dati: { meteo: "Sereno", persone: 6 } });
    rec({ tipo: "presenza", titolo: "Luca (esempio)", rif: can, data: giorni(-1), dati: { ore: 8, utente: "u-operatore" } });
    rec({ tipo: "sal", titolo: "SAL 3", rif: can, data: giorni(-3), importo: 48000, stato: "bozza" });
    rec({ tipo: "verbale", titolo: "Verbale del coordinatore n. 4", rif: can, data: giorni(-6), dati: { esito: "Conforme con prescrizioni", prescrizioni: "Completare il parapetto lato nord." } });
    rec({ tipo: "gara", titolo: "Manutenzione scuole comunali (esempio)", importo: 480000, scadenza: giorni(9), stato: "da valutare", dati: { ente: "Comune di esempio", categorie: "OG1 cl. II", analisi: { oggetto: "Manutenzione straordinaria scuole", ente: "Comune di esempio", importo: 480000, scadenza: giorni(9), categorie: ["OG1 cl. II"], criterio: "offerta economicamente più vantaggiosa", requisiti: ["SOA OG1 classifica II", "Sopralluogo obbligatorio"], documenti: ["DGUE", "Garanzia provvisoria 2%", "Offerta tecnica"], sopralluogo: "obbligatorio entro 5 giorni prima della scadenza", rischi: ["Penali alte per ritardo"], punteggio: 78, consiglio: "Partecipa: categorie in linea e importo adatto. ESEMPIO." } } });
    rec({ tipo: "gara", titolo: "Coperture palestra (esempio)", importo: 210000, scadenza: giorni(-20), stato: "vinta", dati: { ente: "Comune di esempio 2", esito: { ribasso: "18,4%", posizione: "1ª" } } });
    const lot = rec({ tipo: "lotto", titolo: "Fornitura laterizi · Via Garibaldi (esempio)", stato: "aperto", pubblico: true, scadenza: giorni(4), importo: 5000, dati: { genere: "fornitura", luogo: "Roma", descrizione: "12.000 mattoni forati 8×25×25 consegnati in cantiere." } });
    rec({ tipo: "chiamata", titolo: "Numero nuovo (esempio)", data: giorni(0), stato: "da richiamare", dati: { numero: "000 000 0401", esito: "persa", note: "Chiede un preventivo per un bagno" } });
    rec({ tipo: "articolo", titolo: "Cemento 32,5 R (esempio)", dati: { giacenza: 8, minimo: 20, unita: "sacchi" } });
    rec({ tipo: "articolo", titolo: "Mattoni forati (esempio)", dati: { giacenza: 3200, minimo: 1000, unita: "pezzi" } });
    rec({ tipo: "mezzo", titolo: "Furgone Daily (esempio)", scadenza: giorni(15), dati: { targa: "AB000CD", assicurazione: giorni(120) } });
    rec({ tipo: "segnalazione", titolo: "Parapetto mancante lato nord (esempio)", stato: "aperta", creato_da: "u-operatore", dati: { dove: "Via Garibaldi 12", descrizione: "Manca il parapetto al secondo piano." } });
    rec({ tipo: "avviso", titolo: "Riunione di sicurezza lunedì alle 8 (esempio)" });
    const v = rec({ org: "o-gc", creato_da: "u-admin", tipo: "cantiere", titolo: "Villa Bianchi, Frascati (esempio)", stato: "in corso", data: giorni(-30), scadenza: giorni(30), importo: 86000, dati: { committente: "Anna (esempio)", indirizzo: "Via dei Colli 4, Frascati", avanzamento: 55, partner_org: "o-part", partner_nome: "Partner Esempio Srl", fideiussione: "Fideiussione di esempio", conto: "Conto dedicato di esempio" } });
    rec({ org: "o-gc", creato_da: "u-admin", tipo: "fase", titolo: "Bagno", rif: v, data: giorni(-30), scadenza: giorni(-5), dati: { avanzamento: 100 } });
    rec({ org: "o-gc", creato_da: "u-admin", tipo: "fase", titolo: "Cucina", rif: v, data: giorni(-4), scadenza: giorni(25), dati: { avanzamento: 30 } });
    rec({ org: "o-gc", creato_da: "u-partner", tipo: "giornale", titolo: "Posa piastrelle del bagno completata", rif: v, data: giorni(-2), dati: { persone: 2 } });
    rec({ org: "o-gc", creato_da: "u-partner", tipo: "sal", titolo: "SAL 2 · Bagno finito", rif: v, data: giorni(-2), importo: 21500, stato: "inviato" });
    rec({ org: "o-forn", creato_da: "u-fornitore", tipo: "prodotto", titolo: "Mattone forato 8×25×25", importo: 0.48, pubblico: true, dati: { unita: "pezzo", descrizione: "Disponibili 12.000 pezzi" } });
    rec({ org: "o-forn", creato_da: "u-fornitore", tipo: "prodotto", titolo: "Cemento 32,5 R", importo: 6.9, pubblico: true, dati: { unita: "sacco" } });
    rec({ org: "o-forn", creato_da: "u-fornitore", tipo: "prodotto", titolo: "Miniescavatore 1,8 t (noleggio)", importo: 120, pubblico: true, dati: { unita: "giorno", noleggio: true } });
    T("app_record", R);
    T("app_accessi", [{ record: v, utente: "u-cliente", ruolo: "cliente", creato: fa(700) }, { record: v, utente: "u-partner", ruolo: "partner", creato: fa(700) }]);
    T("app_offerte", [{ id: "of-1", lotto: lot, org: "o-forn", prezzo: 4300, tempi: "5 giorni", note: "Trasporto compreso (esempio).", stato: "inviata", creato: fa(5) }]);
    T("app_messaggi", [{ id: "m1", record: v, autore: "u-admin", nome: "AncheCasa", testo: "Buongiorno Anna, domani si comincia con la cucina.", creato: fa(20) }, { id: "m2", record: v, autore: "u-cliente", nome: "Anna", testo: "Perfetto, grazie!", creato: fa(19) }]);
    T("app_inviti", []);
    T("app_rete", [
      { utente: "u-reteitalia", ruolo: "reteitalia", superiore: null, nome: "Giulia R. (esempio)", area: "", regione: "", codice: "RIT000", stato: "attivo", accordo_firmato: fa(950), creato: fa(950) },
      { utente: "u-sviluppo", ruolo: "sviluppo", superiore: "u-reteitalia", nome: "Responsabile Centro (esempio)", area: "Centro", regione: "Lazio", codice: "SVC001", stato: "attivo", accordo_firmato: null, creato: fa(900) },
      { utente: "u-capoarea", ruolo: "capoarea", superiore: "u-sviluppo", nome: "Luca C. (esempio)", area: "Centro", regione: "Lazio", codice: "CAL002", stato: "attivo", accordo_firmato: fa(800), creato: fa(800) },
      { utente: "u-agente", ruolo: "agente", superiore: "u-capoarea", nome: "Francesca (esempio)", area: "Centro", regione: "Lazio", codice: "AGF003", stato: "attivo", accordo_firmato: fa(700), creato: fa(700) },
      { utente: "u-subagente", ruolo: "subagente", superiore: "u-agente", nome: "Marta (esempio)", area: "Centro", regione: "Lazio", codice: "SAM004", stato: "attivo", accordo_firmato: fa(600), creato: fa(600) },
      { utente: "u-sv-nord", ruolo: "sviluppo", superiore: "u-reteitalia", nome: "Andrea N. (esempio)", area: "Nord", regione: "", codice: "SVN005", stato: "attivo", accordo_firmato: fa(500), creato: fa(500) },
      { utente: "u-ca-lomb", ruolo: "capoarea", superiore: "u-sv-nord", nome: "Paola L. (esempio)", area: "Nord", regione: "Lombardia", codice: "CAL006", stato: "attivo", accordo_firmato: fa(400), creato: fa(400) },
      { utente: "u-ag-mi", ruolo: "agente", superiore: "u-ca-lomb", nome: "Davide M. (esempio)", area: "Nord", regione: "Lombardia", codice: "AGD007", stato: "attivo", accordo_firmato: fa(300), creato: fa(300) },
      { utente: "u-ag-camp", ruolo: "agente", superiore: "u-reteitalia", nome: "Rosa N. (esempio)", area: "Sud e isole", regione: "Campania", codice: "AGR008", stato: "attivo", accordo_firmato: fa(200), creato: fa(200) },
    ]);
    T("app_vendite", [
      { id: "ve-1", venditore: "u-subagente", cliente_nome: "Bar Centrale (esempio)", cliente_contatto: "", cliente_regione: "Lazio", cliente_tipo: "azienda", cosa: "corso", dettaglio: "HACCP per 3 persone", importo: 87, tipo_importo: "una_tantum", stato: "attiva", creato: fa(100), attivata: fa(90) },
      { id: "ve-3", venditore: "u-ag-mi", cliente_nome: "Impresa Brianza (esempio)", cliente_contatto: "", cliente_regione: "Lombardia", cosa: "pacchetto", dettaglio: "Impresa completa", importo: 69, tipo_importo: "mese", stato: "attiva", creato: fa(60), attivata: fa(55) },
      { id: "ve-4", venditore: "u-ag-camp", cliente_nome: "Edil Napoli (esempio)", cliente_contatto: "", cliente_regione: "Campania", cosa: "modulo", dettaglio: "Sicurezza Cantiere", importo: 19, tipo_importo: "mese", stato: "proposta", creato: fa(8), attivata: null },
      { id: "ve-5", venditore: "u-agente", cliente_nome: "Studio Tecnico Riva (esempio)", cliente_contatto: "", cliente_regione: "Lazio", cliente_tipo: "azienda", cosa: "modulo", dettaglio: "Cantiere e SAL", importo: 29, tipo_importo: "mese", stato: "attiva", creato: fa(30), attivata: fa(1) },
      { id: "ve-6", venditore: "u-agente", cliente_nome: "Studio Verdi (esempio, dal sito)", cliente_contatto: "000 000 0901", cliente_regione: "Lazio", cliente_tipo: "azienda", cliente_piva: "", affidato: true, cosa: "modulo", dettaglio: "Abbonamento Impresa", importo: 49, tipo_importo: "mese", stato: "proposta", creato: fa(60), attivata: null },
      { id: "ve-2", venditore: "u-agente", cliente_nome: "Hotel Sole (esempio)", cliente_contatto: "000 000 0501", cliente_regione: "Lazio", cosa: "modulo", dettaglio: "Sicurezza", importo: 9, tipo_importo: "mese", stato: "proposta", creato: fa(10), attivata: null },
    ]);
    T("app_provvigioni", [
      { id: "pv-1", vendita: "ve-1", beneficiario: "u-subagente", ruolo: "subagente", importo: 8.53, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      { id: "pv-2", vendita: "ve-1", beneficiario: "u-agente", ruolo: "agente", importo: 3.65, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      { id: "pv-3", vendita: "ve-1", beneficiario: "u-capoarea", ruolo: "capoarea", importo: 1.39, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      { id: "pv-4", vendita: "ve-1", beneficiario: "u-sviluppo", ruolo: "sviluppo", importo: 2.96, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      { id: "pv-5", vendita: "ve-1", beneficiario: "u-reteitalia", ruolo: "reteitalia", importo: 0.87, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      { id: "pv-6", vendita: "ve-3", beneficiario: "u-ag-mi", ruolo: "agente", importo: 9.66, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      { id: "pv-7", vendita: "ve-3", beneficiario: "u-ca-lomb", ruolo: "capoarea", importo: 1.1, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      { id: "pv-8", vendita: "ve-3", beneficiario: "u-sv-nord", ruolo: "sviluppo", importo: 2.35, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      { id: "pv-9", vendita: "ve-3", beneficiario: "u-reteitalia", ruolo: "reteitalia", importo: 0.69, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(90) },
      ...[["u-agente", "segnala", 180], ["u-capoarea", "chiude", 450], ["u-agente", "segue", 540], ["u-capoarea", "capoarea", 144], ["u-sviluppo", "sviluppo", 216], ["u-reteitalia", "reteitalia", 90]].map(([b, r, i], k) => ({ id: "pv-a" + k, vendita: null, affare: "af-1", tranche: 1, beneficiario: b, ruolo: r, importo: i, mese: giorni(-5).slice(0, 8) + "01", stato: "maturata", creato: fa(28) })),
    ]);
    const mese1 = adesso().slice(0, 8) + "01";
    T("app_affari", [
      { id: "af-1", segnalato_da: "u-agente", cliente_nome: "Famiglia Verdi (esempio)", cliente_tipo: "privato", cliente_contatto: "000 000 0801", cliente_regione: "Lazio", descrizione: "Ristrutturazione appartamento 90 mq (esempio)", valore: 60000, chiude: "u-capoarea", segue: "u-agente", impresa_da: null, cantiere: null, stato: "firmato", creato: fa(400), firmato: fa(30), chiuso: null },
      { id: "af-2", segnalato_da: "u-subagente", cliente_nome: "Condominio Aurora (esempio)", cliente_tipo: "condominio", cliente_contatto: "", cliente_regione: "Lazio", descrizione: "Rifacimento facciata e tetto (esempio)", valore: 120000, chiude: null, segue: null, impresa_da: null, cantiere: null, stato: "proposta", creato: fa(50), firmato: null, chiuso: null },
    ]);
    T("app_affari_margine", [{ affare: "af-1", margine: 15000, aggiornato: fa(30) }]);
    T("app_affari_tranche", [
      { affare: "af-1", n: 1, nome: "Firma e acconto", quota: 30, incassato: 18000, incassato_il: fa(28), stato: "incassata" },
      { affare: "af-1", n: 2, nome: "Metà lavori", quota: 30, incassato: 0, incassato_il: null, stato: "attesa" },
      { affare: "af-1", n: 3, nome: "Collaudo", quota: 40, incassato: 0, incassato_il: null, stato: "attesa" },
    ]);
    T("app_obiettivi", [
      { id: "ob-1", utente: null, mese: mese1, aziende: 40, canoni: 2000, lavori: 6, valore: 400000, nota: "Obiettivi di ESEMPIO", fissato_da: "u-admin", aggiornato: fa(200) },
      { id: "ob-2", utente: "u-sviluppo", mese: mese1, aziende: 15, canoni: 800, lavori: 3, valore: 200000, nota: "", fissato_da: "u-reteitalia", aggiornato: fa(200) },
      { id: "ob-3", utente: "u-capoarea", mese: mese1, aziende: 8, canoni: 300, lavori: 2, valore: 120000, nota: "", fissato_da: "u-reteitalia", aggiornato: fa(200) },
      { id: "ob-4", utente: "u-agente", mese: mese1, aziende: 4, canoni: 150, lavori: 1, valore: 50000, nota: "Esempio: 1 azienda a settimana", fissato_da: "u-reteitalia", aggiornato: fa(200) },
      { id: "ob-5", utente: "u-subagente", mese: mese1, aziende: 2, canoni: 60, lavori: 1, valore: 30000, nota: "", fissato_da: "u-reteitalia", aggiornato: fa(200) },
    ]);
    T("app_strategie", [
      { id: "st-1", aperta_da: "u-capoarea", titolo: "Puntare sugli impiantisti del Lazio (esempio)", testo: "Esempio. Nel Lazio arrivano molte richieste di impianti e abbiamo pochi impiantisti iscritti. Propongo un mese dedicato: ogni agente porta 2 impiantisti.", tema: "zone", linea: "Novembre: ogni agente del Lazio porta 2 impiantisti. Il capo area fa il punto ogni lunedì.", voto_admin: null, voto_reteitalia: "si", serve_reteitalia: true,
        commenti: [{ utente: "u-sviluppo", nome: "Responsabile Centro (esempio)", ruolo: "sviluppo", testo: "D'accordo. Partiamo da Roma e Latina, dove abbiamo più richieste.", quando: fa(30) }, { utente: "u-reteitalia", nome: "Giulia R. (esempio)", ruolo: "reteitalia", voto: "si", testo: "Sì, con il punto del lunedì.", linea: "Novembre: ogni agente del Lazio porta 2 impiantisti. Il capo area fa il punto ogni lunedì.", quando: fa(20) }],
        stato: "aperta", creato: fa(50), aggiornato: fa(20), deciso: null },
      { id: "st-2", aperta_da: "u-sv-nord", titolo: "Mese della sicurezza (esempio)", testo: "Esempio.", tema: "prodotti", linea: "Esempio: a ottobre ogni cliente con il modulo Sicurezza riceve un corso preposto in omaggio. Lo propone ogni agente nelle prime visite.", voto_admin: "si", voto_reteitalia: "si", serve_reteitalia: true, commenti: [], stato: "decisa", creato: fa(300), aggiornato: fa(240), deciso: fa(240) },
    ]);
    const DOC = (id, tipo, titolo, testo, file, ruoli) => ({ id, tipo, titolo, testo, file, ruoli, richiede_firma: true, versione: "10.10.2026", attivo: true, creato_da: "u-admin", pubblicato: fa(2) });
    T("app_documenti", [
      DOC("doc-1", "circolare", "Circolare n. 1/2026 · Nuove regole della rete", "Dal 10 ottobre 2026: chi porta tiene, il cliente è di chi lo registra per primo, clienti fuori zona, iscrizioni dal sito, clienti di AncheCasa affidati, privati, territorio. Firmandola accetti le nuove regole (Allegato C).", "docs/AncheCasa-Circolare-1-2026-Nuove-regole.pdf", []),
      DOC("doc-2", "regolamento", "Regolamento della rete AncheCasa", "Le figure, come si guadagna e le regole uguali per tutti.", "docs/AncheCasa-Regolamento-della-rete.pdf", []),
      DOC("doc-3", "contratto", "Contratto Responsabile Rete Italia", "Il tuo contratto, con gli Allegati A, B e C.", "docs/AncheCasa-5Contratto-Responsabile-Rete-Italia.pdf", ["reteitalia"]),
      DOC("doc-4", "contratto", "Contratto Responsabile sviluppo rete", "Il tuo contratto, con gli Allegati A, B e C.", "docs/AncheCasa-1Contratto-Assistente-Sviluppo-Rete.pdf", ["sviluppo"]),
      DOC("doc-5", "contratto", "Contratto Capo area", "Il tuo contratto, con gli Allegati A, B e C.", "docs/AncheCasa-2Contratto-Capo-Area.pdf", ["capoarea"]),
      DOC("doc-6", "contratto", "Contratto Agente", "Il tuo contratto, con gli Allegati A, B e C.", "docs/AncheCasa-3Contratto-Agente.pdf", ["agente"]),
      DOC("doc-7", "contratto", "Contratto Sub-agente", "Il tuo contratto, con gli Allegati A, B e C.", "docs/AncheCasa-4Contratto-Subagente.pdf", ["subagente"]),
    ]);
    const FIRMA_ES = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAyCAYAAAAZUZThAAAAeklEQVR4nO3BMQEAAADCoPVPbQhfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAMGqcAAWvJ+0wAAAAASUVORK5CYII=";
    T("app_firme", [{ id: "fi-1", documento: "doc-5", utente: "u-capoarea", nome: "Luca C. (esempio)", firma: FIRMA_ES, impronta: "esempio", dispositivo: "esempio", firmato: fa(1) }]);
    T("app_proposte_rete", [
      { id: "pr-1", proposto_da: "u-capoarea", ruolo: "agente", nome: "Stefano B. (esempio)", email: "stefano@esempio.it", telefono: "", regione: "Lazio", area: "Centro", superiore: "u-capoarea", note: "Ex agente immobiliare, conosce le imprese di Latina.", voto_admin: null, voto_reteitalia: "si", voto_sviluppo: null, serve_reteitalia: true, serve_sviluppo: true, commenti: [{ chi: "reteitalia", voto: "si", nota: "Profilo buono.", quando: fa(2) }], stato: "proposta", invito: null, creato: fa(3), deciso: null },
      { id: "pr-2", proposto_da: "u-agente", ruolo: "subagente", nome: "Chiara P. (esempio)", email: "chiara@esempio.it", telefono: "", regione: "Lazio", area: "Centro", superiore: "u-agente", note: "", voto_admin: "no", voto_reteitalia: null, voto_sviluppo: null, serve_reteitalia: true, serve_sviluppo: true, commenti: [{ chi: "admin", voto: "no", nota: "Manca la partita IVA.", quando: fa(20) }], stato: "respinta", invito: null, creato: fa(25), deciso: fa(20) },
    ]);
    T("app_ordini", [{ id: "or-1", utente: "u-impresa", org: "o-imp", voce: "Preposto (12 ore) · Aula", quantita: 1, prezzo: 159, codice_venditore: "", note: "Per Marco R.", stato: "richiesto", creato: fa(30) }]);
    T("app_rivendite", [{ id: "rv-1", org: "o-imp", cliente_nome: "Hotel Sole (esempio)", cliente_contatto: "", servizio: "DVR", importo: 199, percentuale: 30, stato: "richiesta", creato: fa(50) }]);
    T("app_recensioni_org", [{ id: "ro-1", org: "o-part", lavoro: v, autore: "u-cliente", voto: 4.6, voti: { qualita: 5, puntualita: 4, pulizia: 5, prezzo: 5, comunicazione: 4 }, testo: "Recensione di esempio.", creato: fa(48) }]);
    T("app_contatti", [
      { id: "ct-1", sito: "anchesicura", tipo: "rete_sicura", nome: "Sicurezza Esempio Srl", email: "info@esempio.it", telefono: "", dati: { regione: "Puglia", servizi: "RSPP, CSE, formazione (esempio)" }, stato: "nuovo", creato: fa(3) },
      { id: "ct-2", sito: "anchecasa", tipo: "sopralluogo", nome: "Mario (esempio)", email: "", telefono: "000 000 0701", dati: { lavoro: "Bagno da rifare, Roma (esempio)" }, stato: "nuovo", creato: fa(6) },
    ]);
    T("app_annunci", [
      { id: "an-1", autore: "u-cliente", categoria: "affitto", titolo: "Stanza singola vicino all'università (esempio)", testo: "Annuncio di ESEMPIO. Stanza luminosa, spese comprese.", prezzo: 380, citta: "Roma", regione: "Lazio", contatto: "000 000 0601", foto: 0, stato: "pubblicato", creato: fa(30), aggiornato: fa(30) },
      { id: "an-2", autore: "u-privato", categoria: "vendita", titolo: "Bilocale ristrutturato (esempio)", testo: "Annuncio di ESEMPIO. 55 mq, terzo piano con ascensore.", prezzo: 189000, citta: "Roma", regione: "Lazio", contatto: "", foto: 0, stato: "pubblicato", creato: fa(60), aggiornato: fa(60) },
      { id: "an-3", autore: "u-impresa", categoria: "lavoro", titolo: "Cerchiamo muratore con esperienza (esempio)", testo: "Annuncio di ESEMPIO. Contratto a tempo indeterminato.", prezzo: null, citta: "Roma", regione: "Lazio", contatto: "info@esempio.it", foto: 0, stato: "pubblicato", creato: fa(80), aggiornato: fa(80) },
    ]);
    T("app_notifiche", [
      { id: "n1", utente: "u-impresa", testo: "Nuova offerta su un tuo lotto", link: "scheda/" + lot, letto: false, creato: fa(5) },
      { id: "n2", utente: "u-impresa", testo: "Nuova segnalazione: Parapetto mancante lato nord", link: "elenco/segnalazione", letto: false, creato: fa(8) },
      { id: "n3", utente: "u-cliente", testo: "SAL da approvare: SAL 2 · Bagno finito", link: "cl-cantiere/" + v, letto: false, creato: fa(2) },
    ]);
    return t;
  }

  function moduloDi(tipo) {
    if (["cliente", "preventivo", "fattura", "documento"].includes(tipo)) return "ufficio";
    if (["dipendente", "attestato", "visita", "dpi", "sopralluogo", "segnalazione", "avviso"].includes(tipo)) return "sicurezza";
    if (["verbale", "checklist", "ingresso"].includes(tipo)) return "sicantiere";
    if (["cantiere", "giornale", "presenza", "sal", "fase", "ddt", "segnalazione_cliente"].includes(tipo)) return "cantieri";
    return { gara: "gare", lotto: "lotti", chiamata: "centralino", articolo: "magazzino", mezzo: "magazzino", manutenzione: "magazzino", prodotto: "listino" }[tipo];
  }

  let t;
  try { t = JSON.parse(localStorage.getItem(CHIAVE) || "null"); } catch (e) { t = null; }
  if (!t || !t.app_org) t = seme();
  const salva = () => { try { localStorage.setItem(CHIAVE, JSON.stringify(t)); } catch (e) { /* niente */ } };
  const tab = (n) => (t[n] = t[n] || []);
  const copia = (x) => JSON.parse(JSON.stringify(x));
  const passa = (r, o) => {
    o = o || {};
    for (const [k, v] of Object.entries(o.eq || {})) if ((r[k] ?? null) !== v) return false;
    for (const [k, v] of Object.entries(o.neq || {})) if (r[k] === v) return false;
    for (const [k, v] of Object.entries(o.in || {})) if (!v.includes(r[k])) return false;
    for (const [k, v] of Object.entries(o.gte || {})) if (!(r[k] >= v)) return false;
    for (const [k, v] of Object.entries(o.lte || {})) if (!(r[k] <= v)) return false;
    return true;
  };
  const notifica = (utente, testo, link) => tab("app_notifiche").unshift({ id: id("n"), utente, testo, link, letto: false, creato: adesso() });
  const gestori = (org) => tab("app_org_membri").filter((m) => m.org === org && ["titolare", "responsabile"].includes(m.ruolo)).map((m) => m.utente);
  const provvigioni = (v) => {
    if (v.cliente_tipo === "privato") return; // 10.10.2026: sui privati niente provvigioni, solo sui lavori
    if (v.affidato) { // cliente di AncheCasa affidato: metà della quota di chi porta, e basta (Allegato C.5)
      const p0 = (tab("app_impostazioni").find((x) => x.chiave === "provvigioni") || {}).valore || {};
      const m0 = Math.round(v.importo * (p0.percentuale_vendita || 0)) / 100;
      if (m0 > 0) tab("app_provvigioni").push({ id: id("pv"), vendita: v.id, beneficiario: v.venditore, ruolo: "affidato", importo: Math.round(m0 * (p0.chi_porta ?? 70) / 2) / 100, mese: adesso().slice(0, 8) + "01", stato: "maturata", creato: adesso() });
      notifica(v.venditore, "Vendita confermata: " + v.cliente_nome, "rete-vendite"); return;
    }
    const p = (tab("app_impostazioni").find((x) => x.chiave === "provvigioni") || {}).valore || {};
    const monte = Math.round(v.importo * (p.percentuale_vendita || 0)) / 100;
    if (monte <= 0) return;
    const rete = (u) => tab("app_rete").find((x) => x.utente === u);
    const me = rete(v.venditore) || {};
    const add = (b, ruolo, imp) => tab("app_provvigioni").push({ id: id("pv"), vendita: v.id, beneficiario: b, ruolo, importo: Math.round(imp * 100) / 100, mese: adesso().slice(0, 8) + "01", stato: "maturata", creato: adesso() });
    // come app-04: chi porta il cliente, poi le quote di ruolo nella catena (venditore compreso); Rete Italia comunque al responsabile attivo
    const porta = monte * (p.chi_porta ?? 70) / 100;
    if (me.ruolo === "subagente" && me.superiore) { add(v.venditore, "subagente", porta * (p.subagente ?? 70) / 100); add(me.superiore, "agente", porta * (p.agente ?? 30) / 100); }
    else add(v.venditore, me.ruolo || "venditore", porta);
    const pagati = [];
    let cur = v.venditore;
    for (let i = 0; i < 7 && cur; i++) { const r = rete(cur); if (!r) break; if (r.stato === "attivo" && ["capoarea", "sviluppo", "reteitalia"].includes(r.ruolo) && !pagati.includes(r.ruolo)) { const q = monte * (p[r.ruolo] || 0) / 100; if (q > 0) add(r.utente, r.ruolo, q); pagati.push(r.ruolo); } cur = r.superiore; }
    if (!pagati.includes("reteitalia")) { const ri = tab("app_rete").find((x) => x.ruolo === "reteitalia" && x.stato === "attivo"); const q = monte * (p.reteitalia || 0) / 100; if (ri && q > 0) add(ri.utente, "reteitalia", q); }
    notifica(v.venditore, "Vendita confermata: " + v.cliente_nome, "rete-vendite");
  };
  const esitoProposta = (p) => {
    if (p.stato !== "proposta") return p.stato;
    if ([p.voto_admin, p.voto_reteitalia, p.voto_sviluppo].includes("no")) { p.stato = "respinta"; p.deciso = adesso(); notifica(p.proposto_da, "Proposta non accolta: " + p.nome, "rete-proposte"); return "respinta"; }
    if (p.voto_admin === "si" && (!p.serve_reteitalia || p.voto_reteitalia === "si") && (!p.serve_sviluppo || p.voto_sviluppo === "si")) {
      const inv = { id: id("in"), token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2), cosa: "rete", target: null, ruolo: p.ruolo, email: p.email, nome: p.nome, stato: "inviato", creato_da: p.proposto_da, creato: adesso() };
      tab("app_inviti").unshift(inv); p.stato = "approvata"; p.deciso = adesso(); p.invito = inv.id;
      notifica(p.proposto_da, "Approvata: " + p.nome + ". Manda il link d'invito.", "rete-proposte"); return "approvata";
    }
    return "proposta";
  };
  const cifre = (x) => String(x || "").replace(/\D/g, "");
  const normC = (x) => { x = String(x || ""); return x.includes("@") ? x.trim().toLowerCase() : cifre(x).length >= 6 ? cifre(x).slice(-10) : ""; };
  const clienteDiAltri = (u, tipo, piva, cont) => {
    const pv = cifre(piva), c = normC(cont), d90 = Date.now() - 90 * 864e5, d12 = Date.now() - 365 * 864e5;
    const righe = [...tab("app_vendite").map((v) => ({ chi: v.venditore, piva: v.cliente_piva, cont: v.cliente_contatto, creato: v.creato, ok: v.stato === "attiva" || (v.stato === "proposta" && new Date(v.creato) > d90), vivo: v.stato !== "persa" })),
      ...tab("app_affari").map((a) => ({ chi: a.segnalato_da, piva: a.cliente_piva, cont: a.cliente_contatto, creato: a.creato, ok: ["firmato", "chiuso"].includes(a.stato) || (a.stato === "proposta" && new Date(a.creato) > d90), vivo: a.stato !== "perso" }))];
    if (pv.length >= 11) { const x = righe.filter((r) => cifre(r.piva) === pv && r.chi !== u && r.ok).sort((a, b) => (a.creato > b.creato ? 1 : -1))[0]; return x ? x.chi : null; }
    if (["privato", "condominio"].includes(tipo) && c) { const x = righe.filter((r) => normC(r.cont) === c && r.vivo && new Date(r.creato) > d12).sort((a, b) => (a.creato < b.creato ? 1 : -1))[0]; return x && x.chi !== u ? x.chi : null; }
    return null;
  };
  const DOPO_INS = {
    app_vendite(r) {
      if (r.affidato && !isAdmin()) throw new Error("solo_admin_affida");
      if (!isAdmin() && clienteDiAltri(r.venditore, r.cliente_tipo, r.cliente_piva, r.cliente_contatto)) throw new Error("cliente_di_un_collega");
      if (r.affidato) notifica(r.venditore, "Ti è stato affidato un cliente di AncheCasa: chiama " + r.cliente_nome + " entro 48 ore", "re-vendita/" + r.id);
    },
    app_affari(r) { if (!isAdmin() && clienteDiAltri(r.segnalato_da, r.cliente_tipo, r.cliente_piva, r.cliente_contatto)) throw new Error("cliente_di_un_collega"); },
    app_documenti(r) { if (r.attivo) tab("app_rete").filter((x) => x.stato === "attivo" && (!(r.ruoli || []).length || r.ruoli.includes(x.ruolo))).forEach((x) => notifica(x.utente, (r.richiede_firma ? "Da firmare: " : "Nuovo documento: ") + r.titolo, "documento/" + r.id)); },
    app_org(r) { tab("app_org_membri").push({ org: r.id, utente: r.titolare, ruolo: "titolare", nome: "", creato: adesso() }); },
    app_record(r) {
      r.modulo = moduloDi(r.tipo);
      if (r.rif) { const p = tab("app_record").find((x) => x.id === r.rif); if (p) r.org = p.org; }
      if (["segnalazione", "segnalazione_cliente"].includes(r.tipo)) gestori(r.org).forEach((u) => notifica(u, "Nuova segnalazione: " + r.titolo, "scheda/" + r.id));
    },
    app_offerte(r) { const l = tab("app_record").find((x) => x.id === r.lotto); if (l) gestori(l.org).forEach((u) => notifica(u, "Nuova offerta su un tuo lotto", "scheda/" + l.id)); },
    app_moduli() { notifica("u-admin", "Richiesta di attivazione di un modulo", "ad-moduli"); },
    app_ordini(r) { const l = { "Visita medica": 29, POS: 59, DUVRI: 69, DVR: 199, PSC: 199, "RSPP esterno": 0 }; r.prezzo = l[r.voce] ?? r.prezzo; notifica("u-admin", "Nuovo ordine AncheSicura: " + r.voce, "ad-ordini"); },
    app_rivendite(r) { r.percentuale = (tab("app_impostazioni").find((x) => x.chiave === "rivendita") || { valore: { percentuale: 30 } }).valore.percentuale; },
  };
  const DOPO_UPD = {
    app_record(r, prima) {
      if (r.tipo === "sal" && r.stato === "inviato" && prima.stato !== "inviato") tab("app_accessi").filter((a) => a.record === r.rif && a.ruolo === "cliente").forEach((a) => notifica(a.utente, "SAL da approvare: " + r.titolo, "scheda/" + r.id));
    },
    app_vendite(r, prima) {
      if (r.stato === "attiva" && prima.stato !== "attiva") { r.attivata = adesso(); provvigioni(r); }
      if (r.affidato && r.venditore !== prima.venditore) notifica(r.venditore, "Ti è stato affidato un cliente di AncheCasa: chiama " + r.cliente_nome + " entro 48 ore", "re-vendita/" + r.id);
    },
    app_moduli(r, prima) { if (r.stato === "attivo" && prima.stato !== "attivo") gestori(r.org).forEach((u) => notifica(u, "Modulo attivo: " + r.modulo, "moduli")); },
  };
  const PREDEF = {
    app_record: () => ({ id: id("r"), titolo: "", stato: "", data: null, scadenza: null, importo: null, rif: null, dati: {}, pubblico: false, creato_da: io(), creato: adesso(), aggiornato: adesso() }),
    app_org: () => ({ id: id("o"), piva: "", citta: "", regione: "", telefono: "", email: "", descrizione: "", titolare: io(), stato: "attiva", tipo: "impresa", creato: adesso() }),
    app_inviti: () => ({ id: id("i"), token: id("t") + id("t"), stato: "inviato", creato_da: io(), creato: adesso(), nome: "" }),
    app_affari: () => ({ id: id("af"), segnalato_da: io(), cliente_tipo: "privato", cliente_piva: "", cliente_contatto: "", cliente_regione: "", descrizione: "", valore: 0, chiude: null, segue: null, impresa_da: null, cantiere: null, stato: "proposta", creato: adesso(), firmato: null, chiuso: null }),
    app_documenti: () => ({ id: id("doc"), tipo: "circolare", testo: "", file: "", ruoli: [], richiede_firma: true, versione: "", attivo: true, creato_da: io(), pubblicato: adesso() }),
    app_vendite: () => ({ id: id("ve"), venditore: io(), cliente_tipo: "azienda", cliente_piva: "", affidato: false, cliente_contatto: "", cliente_regione: "", dettaglio: "", tipo_importo: "mese", stato: "proposta", creato: adesso(), attivata: null }),
    app_ordini: () => ({ id: id("or"), utente: io(), org: null, quantita: 1, codice_venditore: "", note: "", stato: "richiesto", creato: adesso() }),
    app_rivendite: () => ({ id: id("rv"), cliente_contatto: "", percentuale: 30, stato: "richiesta", creato: adesso() }),
    app_offerte: () => ({ id: id("of"), tempi: "", note: "", stato: "inviata", creato: adesso() }),
    app_messaggi: () => ({ id: id("m"), autore: io(), nome: "", creato: adesso() }),
    app_annunci: () => ({ id: id("an"), autore: io(), testo: "", prezzo: null, citta: "", regione: "", contatto: "", foto: 0, stato: "pubblicato", creato: adesso(), aggiornato: adesso() }),
    app_moduli: () => ({ stato: "richiesto", prezzo_mese: null, richiesto: adesso(), attivo_dal: null, attivo_al: null, note: "" }),
    app_contatti: () => ({ id: id("ct"), email: "", telefono: "", dati: {}, stato: "nuovo", creato: adesso() }),
  };
  const membro = (org, u) => tab("app_org_membri").find((m) => m.org === org && m.utente === (u || io()));
  const isAdmin = () => !!((DB.datiProva().utenti.admin || {}).id === io());
  const dirigenteProva = () => isAdmin() || tab("app_rete").some((r) => r.utente === io() && r.stato === "attivo" && ["reteitalia", "sviluppo", "capoarea"].includes(r.ruolo));

  const RPC = {
    app_miei_profili() {
      const me = Object.values(DB.datiProva().utenti).find((u) => u.id === io()) || { ruoli: [] };
      return {
        ruoli: me.ruoli, admin: isAdmin(),
        org: tab("app_org_membri").filter((m) => m.utente === io()).map((m) => { const o = tab("app_org").find((x) => x.id === m.org) || {}; return { id: o.id, nome: o.nome, tipo: o.tipo, ruolo: m.ruolo, stato: o.stato }; }),
        accessi: tab("app_accessi").filter((a) => a.utente === io()).map((a) => { const r = tab("app_record").find((x) => x.id === a.record) || {}; return { record: a.record, ruolo: a.ruolo, titolo: r.titolo, org: r.org }; }),
        rete: (() => { const r = tab("app_rete").find((x) => x.utente === io()); return r ? { ruolo: r.ruolo, codice: r.codice, area: r.area, regione: r.regione, stato: r.stato, accordo: r.accordo_firmato, superiore: r.superiore } : null; })(),
      };
    },
    app_sotto({ p_utente }) {
      const out = []; const giu = (u, l) => { if (l > 6) return; tab("app_rete").filter((r) => r.superiore === u).forEach((r) => { out.push(r.utente); giu(r.utente, l + 1); }); };
      giu(p_utente, 1); return out;
    },
    app_numeri_admin2() {
      const rec = tab("app_record");
      const rete = {}; tab("app_rete").filter((r) => r.stato === "attivo").forEach((r) => { rete[r.ruolo] = (rete[r.ruolo] || 0) + 1; });
      return {
        aziende: tab("app_org").filter((o) => o.tipo !== "gc").length, moduli_attivi: tab("app_moduli").filter((m) => m.stato === "attivo").length,
        moduli_richiesti: tab("app_moduli").filter((m) => m.stato === "richiesto").length, canoni_mese: tab("app_moduli").filter((m) => m.stato === "attivo").reduce((s, m) => s + Number(m.prezzo_mese || 0), 0),
        cantieri_gc: rec.filter((r) => r.org === "o-gc" && r.tipo === "cantiere").length, segnalazioni_cantiere: rec.filter((r) => r.tipo === "segnalazione_cliente" && ["", "aperta"].includes(r.stato)).length,
        ordini_richiesti: tab("app_ordini").filter((o) => o.stato === "richiesto").length, ordini_mese: tab("app_ordini").filter((o) => ["confermato", "svolto"].includes(o.stato)).reduce((s, o) => s + o.prezzo * o.quantita, 0),
        vendite_proposte: tab("app_vendite").filter((v) => v.stato === "proposta").length, provvigioni_maturate: tab("app_provvigioni").filter((p) => p.stato === "maturata").reduce((s, p) => s + Number(p.importo), 0),
        rivendite_richieste: tab("app_rivendite").filter((r) => r.stato === "richiesta").length, rete,
        gare: rec.filter((r) => r.tipo === "gara").length, contatti_nuovi: tab("app_contatti").filter((c) => c.stato === "nuovo").length, gare_vinte: rec.filter((r) => r.tipo === "gara" && r.stato === "vinta").length,
        lotti_aperti: rec.filter((r) => r.tipo === "lotto" && r.pubblico && r.stato === "aperto").length, aziende_sicurezza: new Set(tab("app_moduli").filter((m) => m.stato === "attivo" && ["sicurezza", "pacchetto"].includes(m.modulo)).map((m) => m.org)).size,
      };
    },
    app_report_recensioni() {
      const d = DB.datiProva();
      const art = d.recensioni.map((v) => { const a = d.artigiani.find((x) => x.utente === v.artigiano) || {}; const r = d.richieste.find((x) => x.id === v.richiesta) || {}; return { tipo: "artigiano", soggetto: a.utente, nome: a.nome_attivita, regione: a.regione || "Lazio", lavoro: v.richiesta, lavoro_nome: r.problema || "Pronto intervento", voto: v.voto, voti: v.voti, testo: v.testo, creato: v.creato }; });
      const org = tab("app_recensioni_org").map((v) => { const o = tab("app_org").find((x) => x.id === v.org) || {}; const c = tab("app_record").find((x) => x.id === v.lavoro) || {}; return { tipo: "impresa", soggetto: o.id, nome: o.nome, regione: o.regione, lavoro: c.id, lavoro_nome: c.titolo, voto: v.voto, voti: v.voti, testo: v.testo, creato: v.creato }; });
      return [...art, ...org];
    },
    app_apri_invito({ p_token }) {
      const i = tab("app_inviti").find((x) => x.token === p_token);
      if (!i || i.stato !== "inviato") return { ok: false, motivo: "invito_non_valido" };
      const dove = i.cosa === "org" ? (tab("app_org").find((o) => o.id === i.target) || {}).nome : i.cosa === "cantiere" ? (tab("app_record").find((r) => r.id === i.target) || {}).titolo : "Rete commerciale AncheCasa";
      return { ok: true, cosa: i.cosa, ruolo: i.ruolo, dove };
    },
    app_accetta_invito({ p_token }) {
      const i = tab("app_inviti").find((x) => x.token === p_token);
      if (!i || i.stato !== "inviato") throw new Error("invito_non_valido");
      if (i.cosa === "org") { const m = membro(i.target); if (m) { if (m.ruolo !== "titolare") m.ruolo = i.ruolo; } else tab("app_org_membri").push({ org: i.target, utente: io(), ruolo: i.ruolo, nome: i.nome, creato: adesso() }); }
      else if (i.cosa === "cantiere") { if (!tab("app_accessi").some((a) => a.record === i.target && a.utente === io())) tab("app_accessi").push({ record: i.target, utente: io(), ruolo: i.ruolo, creato: adesso() }); }
      else { const pr = tab("app_proposte_rete").find((x) => x.invito === i.id); const s = pr ? { utente: pr.superiore, area: pr.area, regione: pr.regione } : (tab("app_rete").find((r) => r.utente === i.creato_da) || {}); const vecchio = tab("app_rete").find((r) => r.utente === io()); const riga = { utente: io(), ruolo: i.ruolo, superiore: s.utente || null, nome: i.nome, area: s.area || "", regione: s.regione || "", codice: Math.random().toString(36).slice(2, 8).toUpperCase(), stato: "attivo", accordo_firmato: null, creato: adesso() }; if (vecchio) Object.assign(vecchio, riga, { codice: vecchio.codice }); else tab("app_rete").push(riga); }
      i.stato = "accettato";
      return { cosa: i.cosa, ruolo: i.ruolo, target: i.target };
    },
    app_approva_sal({ p_sal, p_approva, p_nota }) {
      const s = tab("app_record").find((r) => r.id === p_sal);
      if (!s || s.stato !== "inviato") throw new Error("sal_non_da_approvare");
      s.stato = p_approva ? "approvato" : "contestato"; s.dati = Object.assign({}, s.dati, { approvato_da: io(), approvato_il: adesso(), nota_cliente: p_nota || "" });
      gestori(s.org).forEach((u) => notifica(u, "SAL " + s.stato + " dal cliente: " + s.titolo, "scheda/" + s.id));
    },
    app_decidi_offerta({ p_offerta, p_stato }) {
      const o = tab("app_offerte").find((x) => x.id === p_offerta);
      o.stato = p_stato;
      if (p_stato === "accettata") { const l = tab("app_record").find((r) => r.id === o.lotto); l.stato = "assegnato"; l.dati = Object.assign({}, l.dati, { offerta: o.id, assegnato_a: o.org }); }
      if (["accettata", "rifiutata"].includes(p_stato)) gestori(o.org).forEach((u) => notifica(u, "La tua offerta è stata " + p_stato, "offerte"));
    },
    app_recensisci_cantiere({ p_cantiere, p_voti, p_testo }) {
      const c = tab("app_record").find((r) => r.id === p_cantiere);
      if (tab("app_recensioni_org").some((v) => v.lavoro === p_cantiere && v.autore === io())) throw new Error("duplicate key");
      const vs = Object.values(p_voti).map(Number);
      tab("app_recensioni_org").push({ id: id("ro"), org: (c.dati || {}).partner_org || c.org, lavoro: c.id, autore: io(), voto: Math.round((vs.reduce((a, b) => a + b, 0) / vs.length) * 10) / 10, voti: p_voti, testo: p_testo, creato: adesso() });
    },
    app_conferma_ordine({ p_ordine }) {
      const o = tab("app_ordini").find((x) => x.id === p_ordine); o.stato = "confermato";
      const v = tab("app_rete").find((r) => r.codice === String(o.codice_venditore || "").toUpperCase());
      if (v) { const ve = Object.assign(PREDEF.app_vendite(), { venditore: v.utente, cliente_nome: (tab("app_org").find((x) => x.id === o.org) || {}).nome || "Cliente", cosa: "corso", dettaglio: o.voce, importo: o.prezzo * o.quantita, tipo_importo: "una_tantum", stato: "attiva", attivata: adesso() }); tab("app_vendite").unshift(ve); provvigioni(ve); }
    },
    app_registra_ingresso({ p_cantiere, p_codice }) {
      const c = tab("app_record").find((r) => r.id === p_cantiere);
      const d = tab("app_record").find((r) => r.tipo === "dipendente" && String((r.dati || {}).codice || "").toUpperCase() === String(p_codice).trim().toUpperCase());
      if (!d) throw new Error("codice_non_trovato");
      const sc = tab("app_record").filter((r) => r.rif === d.id && ["attestato", "visita"].includes(r.tipo) && r.scadenza).map((r) => r.scadenza).sort()[0];
      const ok = !!sc && sc >= adesso().slice(0, 10);
      tab("app_record").unshift(Object.assign(PREDEF.app_record(), { org: c.org, modulo: "sicantiere", tipo: "ingresso", rif: c.id, titolo: d.titolo, data: adesso().slice(0, 10), stato: ok ? "in regola" : "non in regola", dati: { codice: String(p_codice).toUpperCase() } }));
      return { nome: d.titolo, in_regola: ok, scadenza: sc };
    },
    app_proponi_rete({ p_ruolo, p_nome, p_email, p_telefono, p_regione, p_note }) {
      const me = tab("app_rete").find((r) => r.utente === io() && r.stato === "attivo");
      if (!isAdmin() && !me) throw new Error("non_autorizzato");
      if (tab("app_proposte_rete").some((x) => x.email === String(p_email).toLowerCase() && x.stato === "proposta")) throw new Error("gia_proposto");
      const AR = { Nord: ["Piemonte", "Valle d'Aosta", "Lombardia", "Trentino-Alto Adige", "Veneto", "Friuli-Venezia Giulia", "Liguria", "Emilia-Romagna"], Centro: ["Toscana", "Umbria", "Marche", "Lazio"], "Sud e isole": ["Abruzzo", "Molise", "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna"] };
      const area = Object.keys(AR).find((a) => AR[a].includes(p_regione)) || (me && me.area) || "";
      const liv = ["reteitalia", "sviluppo", "capoarea", "agente", "subagente"];
      const ri = tab("app_rete").find((r) => r.ruolo === "reteitalia" && r.stato === "attivo");
      const sv = tab("app_rete").find((r) => r.ruolo === "sviluppo" && r.stato === "attivo" && r.area === area && area);
      const p = { id: id("pr"), proposto_da: io(), ruolo: p_ruolo, nome: p_nome, email: String(p_email).toLowerCase(), telefono: p_telefono || "", regione: p_regione || "", area, superiore: me && liv.indexOf(me.ruolo) === liv.indexOf(p_ruolo) - 1 ? io() : null, note: p_note || "",
        serve_reteitalia: !!ri, serve_sviluppo: !!sv && p_ruolo !== "sviluppo", voto_admin: isAdmin() ? "si" : null, voto_reteitalia: me && me.ruolo === "reteitalia" ? "si" : null, voto_sviluppo: me && me.ruolo === "sviluppo" && p_ruolo !== "sviluppo" ? "si" : null, commenti: [], stato: "proposta", invito: null, creato: adesso(), deciso: null };
      tab("app_proposte_rete").unshift(p);
      tab("app_notifiche"); if (ri && ri.utente !== io()) notifica(ri.utente, "Proposta da decidere: " + p_nome, "rete-proposte");
      esitoProposta(p); return p.id;
    },
    app_vota_proposta({ p_id, p_si, p_nota }) {
      const p = tab("app_proposte_rete").find((x) => x.id === p_id);
      if (!p || p.stato !== "proposta") throw new Error("proposta_chiusa");
      const me = tab("app_rete").find((r) => r.utente === io() && r.stato === "attivo") || {};
      const chi = isAdmin() ? "admin" : me.ruolo === "reteitalia" ? "reteitalia" : me.ruolo === "sviluppo" && me.area === p.area && p.serve_sviluppo ? "sviluppo" : null;
      if (!chi) throw new Error("non_autorizzato");
      p["voto_" + chi] = p_si ? "si" : "no";
      p.commenti = (p.commenti || []).concat([{ chi, voto: p_si ? "si" : "no", nota: p_nota || "", quando: adesso() }]);
      return esitoProposta(p);
    },
    app_strategia_apri({ p_titolo, p_testo, p_tema }) {
      if (!dirigenteProva()) throw new Error("non_autorizzato");
      const s = { id: id("st"), aperta_da: io(), titolo: String(p_titolo).trim(), testo: String(p_testo || "").trim(), tema: p_tema || "altro", linea: "", voto_admin: null, voto_reteitalia: null, serve_reteitalia: tab("app_rete").some((r) => r.ruolo === "reteitalia" && r.stato === "attivo"), commenti: [], stato: "aperta", creato: adesso(), aggiornato: adesso(), deciso: null };
      tab("app_strategie").unshift(s);
      notifica("u-admin", "Sala strategia: " + s.titolo, "strategia/" + s.id);
      tab("app_rete").filter((r) => r.stato === "attivo" && ["reteitalia", "sviluppo", "capoarea"].includes(r.ruolo) && r.utente !== io()).forEach((r) => notifica(r.utente, "Sala strategia: " + s.titolo, "strategia/" + s.id));
      return s.id;
    },
    app_strategia_commenta({ p_id, p_testo }) {
      if (!dirigenteProva()) throw new Error("non_autorizzato");
      const s = tab("app_strategie").find((x) => x.id === p_id);
      if (!s || s.stato !== "aperta") throw new Error("argomento_chiuso");
      const me = tab("app_rete").find((r) => r.utente === io()) || {};
      s.commenti = (s.commenti || []).concat([{ utente: io(), nome: me.nome || (isAdmin() ? "Admin" : ""), ruolo: me.ruolo || (isAdmin() ? "admin" : ""), testo: String(p_testo).trim(), quando: adesso() }]); s.aggiornato = adesso();
      if (s.aperta_da !== io()) notifica(s.aperta_da, "Nuovo commento: " + s.titolo, "strategia/" + s.id);
    },
    app_strategia_decidi({ p_id, p_si, p_linea, p_nota }) {
      const me = tab("app_rete").find((r) => r.utente === io() && r.stato === "attivo") || {};
      const chi = isAdmin() ? "admin" : me.ruolo === "reteitalia" ? "reteitalia" : null;
      if (!chi) throw new Error("non_autorizzato");
      const s = tab("app_strategie").find((x) => x.id === p_id);
      if (!s || s.stato !== "aperta") throw new Error("argomento_chiuso");
      const linea = String(p_linea || "").trim();
      s.commenti = (s.commenti || []).concat([{ utente: io(), nome: me.nome || "Admin", ruolo: chi, voto: p_si ? "si" : "no", testo: String(p_nota || "").trim(), linea, quando: adesso() }]); s.aggiornato = adesso();
      if (!p_si) { s["voto_" + chi] = "no"; s.stato = "scartata"; s.deciso = adesso(); notifica(s.aperta_da, "Sala strategia, non passa: " + s.titolo, "strategia/" + s.id); return "scartata"; }
      if (linea && linea !== s.linea) { s.linea = linea; s[chi === "admin" ? "voto_reteitalia" : "voto_admin"] = null; }
      s["voto_" + chi] = "si"; if (!s.linea) s.linea = s.titolo;
      if (s.voto_admin === "si" && (!s.serve_reteitalia || s.voto_reteitalia === "si")) { s.stato = "decisa"; s.deciso = adesso(); tab("app_rete").filter((r) => r.stato === "attivo").forEach((r) => notifica(r.utente, "Nuova linea decisa: " + s.titolo, "linee")); return "decisa"; }
      return "in_attesa";
    },
    app_linee_decise() { return tab("app_strategie").filter((s) => s.stato === "decisa").sort((a, b) => (a.deciso < b.deciso ? 1 : -1)).map((s) => ({ id: s.id, titolo: s.titolo, linea: s.linea, tema: s.tema, deciso: s.deciso })); },
    app_affare_firma({ p_affare, p_valore, p_margine, p_chiude, p_segue, p_impresa_da }) {
      if (!isAdmin()) throw new Error("non_autorizzato");
      const a = tab("app_affari").find((x) => x.id === p_affare);
      if (!a || !["proposta", "firmato"].includes(a.stato)) throw new Error("lavoro_non_modificabile");
      const prima = a.stato;
      Object.assign(a, { valore: Number(p_valore) || 0, chiude: p_chiude, segue: p_segue, impresa_da: p_impresa_da, stato: "firmato", firmato: a.firmato || adesso() });
      const m = tab("app_affari_margine").find((x) => x.affare === p_affare); if (m) { m.margine = Number(p_margine); m.aggiornato = adesso(); } else tab("app_affari_margine").push({ affare: p_affare, margine: Number(p_margine), aggiornato: adesso() });
      const q = ((tab("app_impostazioni").find((x) => x.chiave === "cantieri") || {}).valore || {}).tranche || [30, 30, 40];
      ["Firma e acconto", "Metà lavori", "Collaudo"].forEach((nome, k) => { if (!tab("app_affari_tranche").some((t) => t.affare === p_affare && t.n === k + 1)) tab("app_affari_tranche").push({ affare: p_affare, n: k + 1, nome, quota: q[k], incassato: 0, incassato_il: null, stato: "attesa" }); });
      if (prima === "proposta") notifica(a.segnalato_da, "Lavoro firmato: " + a.cliente_nome, "re-lavoro/" + a.id);
    },
    app_tranche_incassata({ p_affare, p_n, p_incasso }) {
      if (!isAdmin()) throw new Error("non_autorizzato");
      const a = tab("app_affari").find((x) => x.id === p_affare);
      if (!a || a.stato !== "firmato") throw new Error("lavoro_non_firmato");
      const t = tab("app_affari_tranche").find((x) => x.affare === p_affare && x.n === Number(p_n));
      if (!t || t.stato !== "attesa") throw new Error("tranche_gia_incassata");
      const p = (tab("app_impostazioni").find((x) => x.chiave === "cantieri") || {}).valore || {};
      const marg = (tab("app_affari_margine").find((x) => x.affare === p_affare) || {}).margine || 0;
      const atteso = a.valore * t.quota / 100;
      const fr = atteso > 0 ? Math.min(1, Number(p_incasso) / atteso) : 1;
      const monte = Math.round(marg * (p.rete ?? 40) / 100 * t.quota / 100 * fr * 100) / 100;
      Object.assign(t, { incassato: Number(p_incasso), incassato_il: adesso(), stato: "incassata" });
      if (t.n === 3) { a.stato = "chiuso"; a.chiuso = adesso(); }
      if (monte <= 0) return 0;
      const add = (b, ruolo, q) => { const imp = Math.round(monte * (q || 0)) / 100; if (b && imp > 0) tab("app_provvigioni").push({ id: id("pv"), vendita: null, affare: a.id, tranche: t.n, beneficiario: b, ruolo, importo: imp, mese: adesso().slice(0, 8) + "01", stato: "maturata", creato: adesso() }); };
      const pv = (tab("app_impostazioni").find((x) => x.chiave === "provvigioni") || {}).valore || {};
      const ruolo = (b, r, q) => { const rr = tab("app_rete").find((x) => x.utente === b); if (rr && rr.ruolo === "subagente" && rr.superiore) { add(b, r, (q || 0) * (pv.subagente ?? 70) / 100); add(rr.superiore, r + "_agente", (q || 0) * (pv.agente ?? 30) / 100); } else add(b, r, q); };
      ruolo(a.segnalato_da, "segnala", p.segnala); ruolo(a.chiude, "chiude", p.chiude); ruolo(a.segue, "segue", p.segue); ruolo(a.impresa_da, "impresa", p.impresa);
      const pagati = []; let cur = a.segnalato_da;
      for (let i = 0; i < 7 && cur; i++) { const r = tab("app_rete").find((x) => x.utente === cur); if (!r) break; if (r.stato === "attivo" && ["capoarea", "sviluppo", "reteitalia"].includes(r.ruolo) && !pagati.includes(r.ruolo)) { add(r.utente, r.ruolo, p[r.ruolo]); pagati.push(r.ruolo); } cur = r.superiore; }
      if (!pagati.includes("reteitalia")) { const ri = tab("app_rete").find((x) => x.ruolo === "reteitalia" && x.stato === "attivo"); if (ri) add(ri.utente, "reteitalia", p.reteitalia); }
      [...new Set(tab("app_provvigioni").filter((x) => x.affare === a.id && x.tranche === t.n).map((x) => x.beneficiario))].forEach((b) => notifica(b, "Incassata la tranche " + t.n + " di " + a.cliente_nome + ": provvigioni maturate", "re-guadagni"));
      return monte;
    },
    app_fissa_obiettivo({ p_utente, p_mese, p_aziende, p_canoni, p_lavori, p_valore, p_nota }) {
      const me = tab("app_rete").find((r) => r.utente === io() && r.stato === "attivo") || {};
      if (!isAdmin() && me.ruolo !== "reteitalia") throw new Error("non_autorizzato");
      const mese = String(p_mese || adesso()).slice(0, 8) + "01";
      const riga = { aziende: Number(p_aziende) || 0, canoni: Number(p_canoni) || 0, lavori: Number(p_lavori) || 0, valore: Number(p_valore) || 0, nota: p_nota || "", fissato_da: io(), aggiornato: adesso() };
      const o = tab("app_obiettivi").find((x) => (x.utente || null) === (p_utente || null) && x.mese === mese);
      if (o) Object.assign(o, riga); else tab("app_obiettivi").push(Object.assign({ id: id("ob"), utente: p_utente || null, mese }, riga));
      if (p_utente && p_utente !== io()) notifica(p_utente, "Nuovi obiettivi del mese", "obiettivi");
    },
    app_cliente_libero({ p_tipo, p_piva, p_contatto }) { return !clienteDiAltri(io(), p_tipo, p_piva, p_contatto); },
    app_firma_documento({ p_documento, p_nome, p_firma, p_impronta, p_dispositivo }) {
      const d = tab("app_documenti").find((x) => x.id === p_documento);
      const me = tab("app_rete").find((r) => r.utente === io() && r.stato === "attivo");
      if (!d || !d.attivo || (!isAdmin() && !(me && (!(d.ruoli || []).length || d.ruoli.includes(me.ruolo))))) throw new Error("documento_non_trovato");
      if (!d.richiede_firma) throw new Error("documento_senza_firma");
      if (tab("app_firme").some((f) => f.documento === p_documento && f.utente === io())) throw new Error("gia_firmato");
      const q = adesso();
      tab("app_firme").push({ id: id("fi"), documento: p_documento, utente: io(), nome: p_nome, firma: p_firma, impronta: p_impronta || "", dispositivo: p_dispositivo || "", firmato: q });
      notifica("u-admin", "Firmato: " + d.titolo + " · " + p_nome, "ad-documento/" + p_documento);
      return q;
    },
    app_firma_accordo() { const r = tab("app_rete").find((x) => x.utente === io()); if (r && !r.accordo_firmato) r.accordo_firmato = adesso(); },
    app_utente_da_mail({ p_email }) { const u = Object.values(DB.datiProva().utenti).find((x) => x.email === String(p_email).toLowerCase().trim()); return u ? u.id : null; },
  };

  const FILE = {};
  return {
    async sel(n, o = {}) {
      let r = tab(n).filter((x) => passa(x, o));
      if (o.ord) { const [k, asc] = o.ord; r = r.slice().sort((a, b) => ((a[k] ?? "") > (b[k] ?? "") ? 1 : (a[k] ?? "") < (b[k] ?? "") ? -1 : 0) * (asc ? 1 : -1)); }
      return copia(r.slice(0, o.lim || 300));
    },
    async uno(n, eq) { const r = tab(n).find((x) => passa(x, { eq })); return r ? copia(r) : null; },
    async ins(n, riga) {
      const righe = (Array.isArray(riga) ? riga : [riga]).map((x) => Object.assign((PREDEF[n] || (() => ({})))(), copia(x)));
      righe.forEach((x) => { if (DOPO_INS[n]) DOPO_INS[n](x); tab(n).unshift(x); });
      salva();
      return copia(Array.isArray(riga) ? righe : righe[0]);
    },
    async upd(n, eq, patch) {
      const righe = tab(n).filter((x) => passa(x, { eq }));
      righe.forEach((x) => { const prima = copia(x); Object.assign(x, copia(patch)); if (n === "app_record") x.aggiornato = adesso(); if (DOPO_UPD[n]) DOPO_UPD[n](x, prima); });
      salva(); return copia(righe);
    },
    async del(n, eq) {
      const via = tab(n).filter((x) => passa(x, { eq })).map((x) => x.id);
      t[n] = tab(n).filter((x) => !passa(x, { eq }));
      if (n === "app_record") t.app_record = t.app_record.filter((x) => !via.includes(x.rif));
      salva();
    },
    async rpc(nome, args) {
      if (!RPC[nome]) throw new Error("funzione non disponibile nella prova: " + nome);
      const r = RPC[nome](args || {}); salva(); return copia(r ?? null);
    },
    async funzione(nome) {
      await new Promise((r) => setTimeout(r, 1200));
      if (nome === "gare-analisi") return { ok: true, motore: "prova", analisi: { oggetto: "ESEMPIO: lavori di manutenzione", ente: "Ente di esempio", importo: 350000, scadenza: giorni(14), luogo: "Roma", categorie: ["OG1 cl. II"], criterio: "minor prezzo", requisiti: ["SOA OG1 classifica II"], documenti: ["DGUE", "Garanzia provvisoria"], sopralluogo: "facoltativo", rischi: ["Tempi stretti"], punteggio: 70, consiglio: "Valuta: analisi di ESEMPIO, nella prova non si usa l'intelligenza artificiale.", esempio: true } };
      throw new Error("non_riuscita");
    },
    file: {
      async carica(percorso, blob, bucket = "documenti") { FILE[bucket + ":" + percorso] = { url: URL.createObjectURL(blob), tipo: blob.type }; },
      async lista(cartella, bucket = "documenti") { const pre = bucket + ":" + cartella + "/"; return Object.keys(FILE).filter((p) => p.startsWith(pre)).map((p) => ({ nome: p.split("/").pop(), percorso: p.slice(bucket.length + 1), tipo: FILE[p].tipo })); },
      async url(percorso, bucket = "documenti") { return (FILE[bucket + ":" + percorso] || {}).url || ""; },
    },
    azzera() { t = seme(); salva(); },
  };
}

export const Q = DB.prova ? qProva() : qVero();
