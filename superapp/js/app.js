/* Super app AncheCasa — prototipo cliccabile (09.10.2026). Dati di esempio. */
(function () {
  const $ = (s, c) => (c || document).querySelector(s);
  const P = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    casa: P('<path d="M3 11l9-7 9 7"/><path d="M6 10v10h12V10"/>'),
    cerca: P('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    piu: P('<path d="M12 5v14M5 12h14"/>'),
    lista: P('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    utente: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
    video: P('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>'),
    chat: P('<path d="M4 5h16v11H8l-4 4z"/>'),
    foto: P('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-8 8"/>'),
    euro: P('<path d="M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10"/>'),
    doc: P('<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/>'),
    scudo: P('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'),
    casco: P('<path d="M3 17h18M5 17v-3a7 7 0 0 1 14 0v3"/><path d="M10 7V5h4v2"/>'),
    gru: P('<path d="M6 21V4l12 3"/><path d="M6 7h12M15 7v6M13 13h4v3h-4z M3 21h8"/>'),
    gara: P('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/>'),
    lotti: P('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>'),
    tel: P('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    box: P('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'),
    stella: P('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
    ufficio: P('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>'),
    campana: P('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    indietro: P('<path d="M15 18l-6-6 6-6"/>'),
    freccia: P('<path d="M9 18l6-6-6-6"/>'),
    qr: P('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v7h-7"/>'),
    allarme: P('<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 18h.01"/>'),
    rete: P('<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5L6.5 16M12 11.5l5.5 4.5"/>'),
    calendario: P('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    griglia: P('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    corso: P('<path d="M2 8l10-5 10 5-10 5z"/><path d="M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>'),
    firma: P('<path d="M3 17c3 0 4-8 7-8s1 8 4 8 3-4 5-4"/><path d="M3 21h18"/>'),
    kit: P('<path d="M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4a4 4 0 0 1-8 0z"/>'),
    grafico: P('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    ok: P('<path d="M5 12l5 5 9-10"/>'),
    no: P('<path d="M6 6l12 12M18 6L6 18"/>'),
    mappa: P('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  };
  const eur = (n) => (n == null ? "su preventivo" : (Number.isInteger(n) ? n : n.toFixed(2).replace(".", ",")) + " €");

  /* ---------- componenti ---------- */
  const voce = (ico, t, s, route, col, dx) => `<div class="card tap" ${route ? `data-go="${route}"` : ""}><div class="riga"><span class="ico ${col || ""}">${I[ico] || ""}</span><div class="cresci"><b>${t}</b>${s ? `<small>${s}</small>` : ""}</div>${dx || (route ? `<span class="freccia">${I.freccia}</span>` : "")}</div></div>`;
  const lista = (righe) => `<div class="lista">${righe.join("")}</div>`;
  const tile = (ico, t, s, route, col, extra) => `<div class="tile" data-go="${route}"><span class="ico ${col || ""}">${I[ico]}</span><b>${t}</b>${s ? `<small>${s}</small>` : ""}${extra || ""}</div>`;
  const sez = (t, corpo, link) => `<div class="sez"><h2>${t}${link || ""}</h2>${corpo}</div>`;
  const stato = (c, t) => `<span class="stato ${c}">${t}</span>`;
  const num = (v, t, c) => `<div class="num ${c || ""}"><b>${v}</b><small>${t}</small></div>`;
  const btn = (t, azione, cls) => `<button class="btn ${cls || ""}" data-az="${azione}">${t}</button>`;
  const campo = (t, html) => `<label class="campo"><span>${t}</span>${html}</label>`;

  /* ---------- profili ---------- */
  const PROFILI = {
    privato: { corto: "Privato", nome: "Privato", chi: "Giulia", tabs: [["home", "casa", "Home"], ["cerca", "cerca", "Cerca"], ["pubblica", "piu", "Pubblica", true], ["richieste", "lista", "Richieste"], ["profilo", "utente", "Profilo"]], desc: "Trova l'artigiano, SuperMastro, bacheca, ristrutturazione" },
    artigiano: { corto: "Artigiano", nome: "Artigiano · pronto intervento", chi: "Idraulica Monti", tabs: [["ar-home", "casa", "Oggi"], ["ar-richieste", "video", "Richieste"], ["ar-stato", "ok", "Disponibile", true], ["ar-recensioni", "stella", "Recensioni"], ["profilo", "utente", "Profilo"]], desc: "Solo pronto intervento: riceve i clienti da SuperMastro. Quando ha i requisiti passa a Impresa" },
    cliente: { corto: "Il mio cantiere", nome: "Proprietario del cantiere", chi: "Giulia", tabs: [["cantiere", "casa", "Cantiere"], ["foto", "foto", "Foto"], ["segnala", "allarme", "Segnala", true], ["pagamenti", "euro", "Pagamenti"], ["profilo", "utente", "Profilo"]], desc: "Segui la tua ristrutturazione con AncheCasa" },
    azienda: { corto: "Impresa", nome: "Impresa · titolare", chi: "Edil Rossi Srl", tabs: [["az-home", "casa", "Oggi"], ["moduli", "griglia", "Moduli"], ["az-nuovo", "piu", "Nuovo", true], ["chat", "chat", "Chat"], ["profilo", "utente", "Profilo"]], desc: "Ufficio, cantieri e SAL, gare, sicurezza, centralino" },
    operatore: { corto: "Lavoratore", nome: "Lavoratore", chi: "Marco", tabs: [["op-home", "casa", "Oggi"], ["patentino", "qr", "Patentino"], ["segnala-op", "allarme", "Segnala", true], ["corsi", "corso", "Corsi"], ["profilo", "utente", "Profilo"]], desc: "Patentino QR, corsi online, DPI, segnalazioni" },
    sviluppo: { corto: "Sviluppo", nome: "Responsabile sviluppo rete", chi: "Responsabile Centro", tabs: [["sv-home", "casa", "Oggi"], ["sv-aziende", "ufficio", "Aziende"], ["sv-inserisci", "piu", "Inserisci", true], ["sv-area", "rete", "Area"], ["profilo", "utente", "Profilo"]], desc: "Creato solo dall'admin: inserisce aziende in tutta Italia, poi guida la sua area (Nord, Centro o Sud e isole)" },
    capoarea: { corto: "Capoarea", nome: "Capoarea agenti", chi: "Luca", tabs: [["ca-home", "casa", "Oggi"], ["ca-squadra", "rete", "Squadra"], ["ca-nuovo", "piu", "Recluta", true], ["ca-numeri", "grafico", "Numeri"], ["profilo", "utente", "Profilo"]], desc: "Guida gli agenti della sua zona: obiettivi, clienti, provvigioni della squadra" },
    agente: { corto: "Agente", nome: "Agente", chi: "Francesca", tabs: [["ag-home", "casa", "Oggi"], ["vendi", "euro", "Vendi"], ["ag-invita", "piu", "Invita", true], ["rete", "rete", "Rete"], ["profilo", "utente", "Profilo"]], desc: "Vende tutto a tutti e segue i suoi sub-agenti" },
    subagente: { corto: "Sub-agente", nome: "Sub-agente", chi: "Marta", tabs: [["sa-home", "casa", "Oggi"], ["vendi", "euro", "Vendi"], ["ag-invita", "piu", "Invita", true], ["sa-guadagni", "euro", "Guadagni"], ["profilo", "utente", "Profilo"]], desc: "Porta clienti con il codice del suo agente: a lui il 70%, all'agente il 30%" },
    fornitore: { corto: "Fornitore", nome: "Fornitore", chi: "Laterizi Lazio", tabs: [["fo-home", "casa", "Oggi"], ["fo-ordini", "box", "Ordini"], ["fo-offerta", "piu", "Offerta", true], ["fo-listino", "lista", "Listino"], ["profilo", "utente", "Profilo"]], desc: "Materiali e noleggi: ordini dai cantieri, richieste dei general contractor, consegne" },
    partner: { corto: "Partner", nome: "Impresa partner di città", chi: "Bianchi Costruzioni", tabs: [["pa-home", "casa", "Oggi"], ["pa-lavori", "gru", "Lavori"], ["pa-sal", "piu", "SAL", true], ["kit", "kit", "Kit"], ["profilo", "utente", "Profilo"]], desc: "I cantieri che AncheCasa ti assegna" },
    consulente: { corto: "AncheSicura", nome: "Consulente AncheSicura", chi: "Studio Verdi", tabs: [["co-home", "casa", "Oggi"], ["co-aziende", "ufficio", "Aziende"], ["verbale", "piu", "Verbale", true], ["co-agenda", "calendario", "Agenda"], ["profilo", "utente", "Profilo"]], desc: "Le aziende che segui per AncheSicura" },
    admin: { corto: "Admin", nome: "AncheCasa · amministrazione", chi: "Nando", tabs: [["ad-home", "grafico", "Cruscotto"], ["gc", "gru", "Cantieri"], ["ad-segn", "allarme", "Segnalazioni"], ["economia", "euro", "Economia"], ["profilo", "utente", "Profilo"]], desc: "Cantieri da general contractor, segnalazioni, economia" },
  };

  /* ---------- schermate ---------- */
  const V = {};
  const S = { profilo: null, storia: [], attivi: { ufficio: true, sicurezza: true, cantieri: true, gare: true, centralino: true, recensioni: true } };

  // ---- comuni
  V.profilo = () => ({ t: "Profilo", h: `<div class="pad">
    <div class="card"><div class="riga"><span class="ico blu">${I.utente}</span><div class="cresci"><b>${PROFILI[S.profilo].chi}</b><small>${PROFILI[S.profilo].nome}</small></div></div></div>
    ${sez("Account", lista([voce("doc", "I miei dati", "Nome, mail, telefono", "toast:Dati del profilo"), voce("campana", "Notifiche", "Cosa ti avvisiamo e come", "notifiche"), voce("euro", "Abbonamenti e pagamenti", S.profilo === "azienda" ? "Moduli attivi e fatture" : "Metodi di pagamento", S.profilo === "azienda" ? "moduli" : "toast:Pagamenti")]))}
    ${S.profilo === "privato" ? sez("Segnalatore", lista([voce("rete", "Le mie segnalazioni", "3 segnalazioni · 1 lavoro partito", "segnala-amico", "arancio")])) : ""}
    ${S.profilo === "artigiano" ? sez("Cresci con AncheCasa", lista([voce("azienda", "Passa a Impresa", "Se hai i requisiti: cantieri, lotti e moduli", "ar-up", "arancio")])) : ""}
    ${sez("Prova un altro profilo", lista(Object.keys(PROFILI).filter((k) => k !== S.profilo).map((k) => voce("utente", PROFILI[k].nome, PROFILI[k].desc, "profilo:" + k, "blu"))))}
    ${btn("Esci dal prototipo", "esci", "chiaro")}</div>` });
  const NOTIFICHE = {
    privato: [["rete", "La tua segnalazione è partita", "Ristrutturazione di Paolo · sopralluogo fissato", "segnala-amico", "verde"], ["video", "SuperMastro ha analizzato il tuo video", "Perdita dal sifone · 2 idraulici iscritti vicino", "video-analisi", "blu"], ["utente", "Nuovo preventivo", "Rifare il bagno · Bagni Roma", "richiesta", "verde"], ["stella", "Lascia una recensione", "Idraulica Monti ha finito il lavoro", "recensione", "giallo"]],
    artigiano: [["video", "Nuova richiesta da SuperMastro", "Perdita dal sifone · 1,2 km", "ar-richiesta", "arancio"], ["stella", "Nuova recensione", "5 stelle · Giulia", "ar-recensioni", "verde"], ["ok", "Hai i requisiti per passare a Impresa", "Manca solo il DURC", "ar-up", "blu"]],
    cliente: [["foto", "Nuove foto dal cantiere", "Posa del massetto · oggi", "foto", "blu"], ["euro", "SAL 3 pronto da approvare", "Pagamento dal conto dedicato", "pagamenti", "giallo"], ["chat", "Messaggio dal direttore lavori", "Domani arriva il ponteggio", "chat", ""]],
    azienda: [["scudo", "Corso preposto scaduto", "Marco R. · Risolvi con AncheSicura", "sicurezza", "rosso"], ["gara", "Nuova gara adatta a te", "Coperture palestra · punteggio 91", "gara", ""], ["tel", "Chiamata persa", "Fornitore laterizi · 11:05", "centralino", "giallo"], ["stella", "Nuova recensione", "5 stelle · Villa Bianchi", "recensioni", "verde"]],
    operatore: [["corso", "Corso da fare entro venerdì", "Aggiornamento lavoratori · online", "corso", "giallo"], ["casco", "DPI da firmare", "Nuovi guanti e casco", "dpi", ""]],
    sviluppo: [["ufficio", "Azienda verificata dall'admin", "Impianti Neri Srl · ora è iscritta", "sv-aziende", "verde"], ["calendario", "Fase 1: mancano 54 giorni", "Poi l'admin assegna le aree", "sv-area", "blu"]],
    capoarea: [["rete", "Nuovo agente nella squadra", "Paolo · Frosinone", "ca-squadra", "blu"], ["allarme", "Agente sotto obiettivo", "Stefano · 2 clienti su 8", "ca-squadra", "giallo"]],
    subagente: [["euro", "Provvigione maturata", "Bar Centrale · corso HACCP", "sa-guadagni", "verde"], ["utente", "Cliente da richiamare", "Pizzeria Roma", "vendi", "giallo"]],
    agente: [["euro", "Provvigione maturata", "Edil Rossi ha attivato il pacchetto", "rete", "verde"], ["rete", "Nuovo iscritto dal tuo invito", "Marta · Roma", "rete", "blu"]],
    fornitore: [["lotti", "Nuova richiesta di fornitura", "Laterizi · Scuola Rodari", "fo-offerta", "giallo"], ["box", "Ordine confermato", "Bianchi Costruzioni · piastrelle", "fo-ordini", "verde"]],
    partner: [["gru", "SAL approvato", "Via Garibaldi · SAL 3", "pa-sal", "verde"], ["casco", "Ingressi di oggi", "6 persone registrate col QR", "ingressi", "blu"]],
    consulente: [["scudo", "Visita in agenda domani", "Edil Rossi · ore 9", "co-agenda", "blu"], ["allarme", "Azienda con scadenze", "Edil Rossi · 2 in rosso", "co-azienda", "rosso"]],
    admin: [["allarme", "Segnalazione del cliente", "Ritardo Via Ostiense", "ad-segn", "giallo"], ["video", "Analisi SuperMastro da controllare", "12 in attesa", "ad-supermastro", "blu"], ["euro", "Incassi del giorno", "Vedi l'economia", "economia", "verde"]],
  };
  V.notifiche = () => ({ t: "Notifiche", back: true, h: `<div class="pad">${lista((NOTIFICHE[S.profilo] || []).map((n) => voce(...n)))}</div>` });
  V.chat = () => ({ t: "Chat", back: S.profilo !== "azienda", h: `<div class="pad">
    <div class="bolla">Buongiorno, domani alle 8 arriva il ponteggio in Via Garibaldi.</div>
    <div class="bolla mia">Perfetto, avviso il cliente dall'app.</div>
    <div class="bolla">Ho caricato le foto della posa di oggi nel giornale dei lavori.</div>
    <div class="campo" style="margin-top:14px"><input placeholder="Scrivi un messaggio"></div>${btn("Invia", "toast:Messaggio inviato")}</div>` });

  // ---- privato
  V.home = () => ({ t: "", logo: true, h: `<div class="pad">
    <p class="saluto">Ciao Giulia,<br>di cosa hai bisogno?</p><p class="sotto">Artigiani, imprese e servizi della tua zona.</p>
    <div class="ricerca" data-go="cerca">${I.cerca}<span>Idraulico, ristrutturazione, imbianchino…</span></div>
    <div class="eroe" style="margin-top:14px" data-go="video"><h3>Guasto in casa? 5 secondi.</h3><p>Fai un video del guasto: SuperMastro lo analizza, ti dice cosa fare subito e ti mostra sulla mappa gli artigiani vicini.</p>${btn(I.video + " Fai il video", "go:video")}</div>
    <div class="card tap" data-go="segnala-amico" style="margin-top:14px"><div class="riga"><span class="ico">${I.rete}</span><div class="cresci"><b>Segnala e guadagna</b><small>Conosci chi deve ristrutturare o un'azienda? Segnalalo ad AncheCasa</small></div><span class="freccia">${I.freccia}</span></div></div>
    <div style="height:16px"></div>
    ${sez("Ristruttura con AncheCasa", `<div class="card tap" data-go="ristruttura"><div class="foto calda">Cantiere AncheCasa</div><h3 style="margin-top:10px">Un referente, un contratto, garantito</h3><p>Imprese selezionate, fideiussione, conto dedicato e l'app del tuo cantiere.</p></div>`)}
    ${sez("Bacheca", `<div class="griglia2">${tile("casa", "Vendita", "Case in vendita", "bacheca", "blu")}${tile("doc", "Affitto", "Case e stanze", "bacheca", "blu")}${tile("corso", "Studenti", "Alloggi vicino all'università", "bacheca", "blu")}${tile("ufficio", "Lavoro", "Cerco e offro", "bacheca", "blu")}</div>`, `<a data-go="bacheca">Apri</a>`)}
    ${sez("Servizi AncheCasa", lista([voce("scudo", "AncheSicura", "Corsi e sicurezza per chi lavora in casa tua", "corsi-listino", "blu"), voce("euro", "Finanziamenti", "Chiedi in chat a banche e broker della rete", "toast:In arrivo: finanziamenti in chat"), voce("gara", "Aste immobiliari", "Le aste della tua zona", "toast:Aste della tua zona")]))}
    </div>` });
  V.cerca = () => ({ t: "Trova l'artigiano", h: `<div class="pad">
    <div class="campo"><input placeholder="Che lavoro?" value="Idraulico"></div><div class="campo"><input placeholder="Dove?" value="Roma, Monteverde"></div>
    <div class="foto" style="height:150px">${I.mappa}&nbsp;Mappa della zona</div><div style="height:14px"></div>
    ${btn(I.mappa + " Mostra sulla mappa", "go:mappa")}<div style="height:14px"></div>
    ${sez("Oppure fai il video", lista([voce("video", "SuperMastro", "5 secondi: analisi del guasto e artigiani vicini", "video")]))}
    <p class="sotto" style="font-size:12.5px">Nel prototipo gli artigiani sono di esempio.</p></div>` });
  V.video = () => ({ t: "SuperMastro", back: true, h: `<div class="pad">
    <div class="foto scura" style="height:300px;font-size:15px;flex-direction:column;gap:8px">● REC 0:03 / 0:05<small style="font-weight:500;opacity:.8">Inquadra il guasto da vicino, tieni fermo il telefono</small></div>
    <div style="height:14px"></div>${btn(I.video + " Invia il video", "go:video-analisi")}
    <p class="sotto" style="font-size:12.5px;margin-top:10px">SuperMastro guarda il video e ti spiega cosa succede.</p></div>` });
  V["video-analisi"] = () => ({ t: "Analisi del video", back: true, h: `<div class="pad">
    <div class="eroe"><h3>Perdita dal sifone del lavello</h3><p>Il raccordo sotto il lavello gocciola: la guarnizione è usurata o il dado è allentato.</p>${stato("arancio", "Urgenza media")}</div><div style="height:14px"></div>
    ${sez("Cosa ho visto", lista([voce("video", "Acqua che gocciola dal raccordo", "Secondo 0:02 del video", null, "blu"), voce("allarme", "Fondo del mobile bagnato", "Rischio di gonfiore del legno", null, "giallo"), voce("ok", "Nessun segno di perdita dal rubinetto", "Il problema è sotto, non sopra", null, "verde")]))}
    ${sez("Cosa fare subito", `<div class="card"><p>1. Chiudi il rubinetto sotto il lavello.<br>2. Metti una bacinella sotto il sifone.<br>3. Asciuga il fondo del mobile.</p></div>`)}
    ${sez("Chi serve", `<div class="card"><div class="riga"><span class="ico">${I.utente}</span><div class="cresci"><b>Idraulico</b><small>Lavoro breve: sostituzione guarnizione o sifone</small></div></div></div>`)}
    ${btn(I.mappa + " Trova l'idraulico vicino a me", "go:mappa")}<div style="height:8px"></div>${btn("Provo da solo: come si fa", "toast:Guida passo passo aperta", "chiaro")}</div>` });
  V.mappa = () => ({ t: "Idraulici vicino a te", back: true, h: `<div class="pad">
    <div class="foto" style="height:190px;background:linear-gradient(135deg,#dfe7d6,#c7d6e6);color:var(--blu);flex-direction:column;gap:6px">${I.mappa}<b>Mappa · Roma Monteverde</b><small style="font-weight:500">Tu sei qui · 7 idraulici entro 3 km</small></div><div style="height:14px"></div>
    ${sez("Iscritti AncheCasa", lista([voce("utente", "Idraulica Monti", "★ 4,9 · 1,2 km · verificato · risponde in chat", "toast:Video e analisi inviati in chat a Idraulica Monti", "verde", stato("verde", "Iscritto")), voce("utente", "Termoidraulica Sole", "★ 4,7 · 2,8 km · verificato", "toast:Video e analisi inviati in chat", "verde", stato("verde", "Iscritto"))]))}
    <p class="sotto" style="font-size:13px;margin:-4px 0 12px">Agli iscritti mandi il video e l'analisi: sanno già cosa trovano.</p>
    ${sez("I 5 più vicini su Google Maps", lista([["Idraulico Rossi", "0,6 km · aperto ora"], ["Pronto Intervento Casa", "0,9 km · 24 ore su 24"], ["F.lli Bianco Impianti", "1,4 km · aperto ora"], ["Idrotermica Verde", "1,9 km · chiude alle 18"], ["Servizi Idraulici Lazio", "2,3 km · aperto ora"]].map((x) => voce("tel", x[0], x[1], null, "blu", `<button class="btn piccolo" data-az="toast:Chiamata a ${x[0]}">Chiama</button>`))))}
    <p class="sotto" style="font-size:12.5px">Chiami tu direttamente. Nel prototipo i nomi sono di esempio: nell'app vera arrivano da Google Maps.</p></div>` });
  V.bacheca = () => ({ t: "Bacheca", back: true, h: `<div class="pad">
    <div class="pillole"><span class="pillola on">Tutto</span><span class="pillola">Vendita</span><span class="pillola">Affitto</span><span class="pillola">Studenti</span><span class="pillola">Lavoro</span></div><div style="height:12px"></div>
    <div class="card"><div class="foto">Foto annuncio</div><h3 style="margin-top:10px">Bilocale vicino a Roma Tre</h3><p>Affitto · stanza per studenti · 450 €/mese</p><div class="btns">${btn("Scrivi in chat", "toast:Chat aperta", "piccolo")}</div></div>
    <div class="card"><h3>Cercasi muratore con esperienza</h3><p>Lavoro · Impresa edile · Roma Nord</p><div class="btns">${btn("Candidati in chat", "toast:Candidatura inviata", "piccolo")}</div></div>
    <p class="sotto" style="font-size:12.5px;margin-top:12px">Annunci di esempio.</p></div>` });
  V.pubblica = () => ({ t: "Pubblica", h: `<div class="pad">
    <div class="pillole"><span class="pillola on">Richiesta lavoro</span><span class="pillola">Annuncio bacheca</span></div><div style="height:12px"></div>
    ${campo("Cosa ti serve", `<input placeholder="Es. rifare il bagno">`)}${campo("Dove", `<input placeholder="Città o CAP">`)}${campo("Foto o video", `<button class="btn chiaro" data-az="toast:Fotocamera aperta">${I.foto} Aggiungi</button>`)}${campo("Descrizione", `<textarea placeholder="Due righe sul lavoro"></textarea>`)}
    ${btn("Pubblica", "toast:Pubblicata: ti rispondono in chat")}</div>` });
  V.richieste = () => ({ t: "Le mie richieste", h: `<div class="pad">${lista([
    voce("doc", "Rifare il bagno", "3 preventivi ricevuti", "richiesta", "", stato("arancio", "Da scegliere")),
    voce("video", "Perdita lavello", "Idraulica Monti · giovedì 10:00", "richiesta", "verde", stato("verde", "Fissato")),
    voce("ok", "Tinteggiatura camera", "Lavoro fatto · lascia la recensione", "recensione", "blu", stato("blu", "Recensisci"))])}</div>` });
  V.richiesta = () => ({ t: "Rifare il bagno", back: true, h: `<div class="pad">
    ${sez("Preventivi", lista([voce("utente", "Idraulica Monti", "4.800 € · 8 giorni · ★ 4,9", "toast:Preventivo accettato", "verde"), voce("utente", "Bagni Roma", "5.200 € · 6 giorni · ★ 4,6", "toast:Preventivo accettato"), voce("utente", "Casa Nuova", "4.950 € · 10 giorni · ★ 4,8", "toast:Preventivo accettato")]))}
    ${btn("Apri la chat", "go:chat", "chiaro")}<div style="height:8px"></div>${btn("Fallo con AncheCasa, garantito", "go:ristruttura")}</div>` });
  V.recensione = () => ({ t: "Recensione", back: true, h: `<div class="pad"><div class="card"><h3>Tinteggiatura camera</h3><p>Colori Bianchi · lavoro fatto il 3 ottobre</p><p class="stelle" style="font-size:30px;margin-top:10px">★★★★★</p></div><div style="height:12px"></div>${campo("Due righe", `<textarea placeholder="Com'è andata?"></textarea>`)}${btn("Pubblica la recensione", "toast:Recensione pubblicata")}</div>` });
  V.ristruttura = () => ({ t: "Ristruttura con AncheCasa", back: true, h: `<div class="pad">
    ${lista([voce("scudo", "Imprese selezionate", "Una per una, da AncheCasa", null, "verde"), voce("doc", "Fideiussione", "Sul lavoro che affidi", null, "verde"), voce("euro", "Conto dedicato", "I tuoi pagamenti non si mescolano", null, "verde"), voce("casa", "L'app del tuo cantiere", "Segui tutto, segnali, AncheCasa interviene", "profilo:cliente", "verde")])}
    <div style="height:14px"></div>${campo("Che lavoro?", `<select><option>Ristrutturazione completa</option><option>Bagno</option><option>Cucina</option></select>`)}${campo("Dove", `<input placeholder="Città o CAP">`)}${btn("Chiedi il sopralluogo gratuito", "toast:Richiesta inviata: ti richiamiamo")}</div>` });

  // ---- proprietario del cantiere
  V.cantiere = () => ({ t: "", logo: true, h: `<div class="pad">
    <div class="eroe"><h3>Via Garibaldi 12 · bagno e cucina</h3><p>Referente AncheCasa: Luca · impresa partner: Bianchi Costruzioni</p><div class="barra-av"><i style="width:62%"></i></div><p style="margin:8px 0 0">Avanzamento 62% · fine prevista 14 novembre</p></div><div style="height:16px"></div>
    ${sez("Fasi", `<div class="card"><div class="tl"><div class="p fatto"><b>Demolizioni</b><small>Fatto il 22 settembre</small></div><div class="p fatto"><b>Impianti</b><small>Fatto il 4 ottobre · verbale firmato</small></div><div class="p ora"><b>Massetti e piastrelle</b><small>In corso · oggi posa bagno</small></div><div class="p"><b>Cucina e finiture</b><small>Dal 28 ottobre</small></div><div class="p"><b>Consegna</b><small>14 novembre</small></div></div></div>`)}
    ${sez("Ultime foto", `<div class="fotos"><div class="foto">Oggi</div><div class="foto">Ieri</div><div class="foto">Impianti</div></div>`, `<a data-go="foto">Tutte</a>`)}
    ${sez("Documenti", lista([voce("doc", "Contratto con AncheCasa", "Firmato il 10 settembre", "toast:Documento aperto", "blu"), voce("scudo", "Fideiussione", "A garanzia del lavoro", "toast:Documento aperto", "verde"), voce("doc", "SAL 2", "Approvato da te il 6 ottobre", "pagamenti", "blu")]))}
    ${btn(I.chat + " Scrivi al referente", "go:chat", "blu")}</div>` });
  V.foto = () => ({ t: "Foto del cantiere", h: `<div class="pad"><div class="fotos">${Array.from({ length: 12 }, (_, i) => `<div class="foto ${i % 3 === 1 ? "calda" : ""}">${["Oggi", "Ieri", "3 ott", "1 ott"][i % 4]}</div>`).join("")}</div></div>` });
  V.segnala = () => ({ t: "Segnala un problema", h: `<div class="pad"><p class="sotto">Qualcosa non va? Scrivilo qui: AncheCasa interviene con l'impresa.</p>
    ${campo("Che succede", `<select><option>Ritardo</option><option>Lavoro fatto male</option><option>Danno</option><option>Sicurezza</option><option>Altro</option></select>`)}${campo("Foto", `<button class="btn chiaro" data-az="toast:Fotocamera aperta">${I.foto} Aggiungi foto</button>`)}${campo("Descrizione", `<textarea></textarea>`)}
    ${btn("Invia ad AncheCasa", "toast:Segnalazione inviata: il referente ti risponde entro 24 ore")}
    ${sez("Le tue segnalazioni", lista([voce("ok", "Polvere sulle scale", "Risolta il 2 ottobre", null, "verde", stato("verde", "Risolta"))]))}</div>` });
  V.pagamenti = () => ({ t: "Pagamenti", h: `<div class="pad">
    <div class="griglia2">${num("24.000 €", "Valore del contratto")}${num("13.200 €", "Pagato finora", "verde")}</div><div style="height:12px"></div>
    <div class="avviso">I tuoi pagamenti vanno su un conto dedicato al tuo cantiere e passano all'impresa solo con il SAL approvato da te.</div><div style="height:12px"></div>
    ${lista([voce("ok", "Anticipo", "4.800 € · pagato", null, "verde"), voce("ok", "SAL 1", "4.200 € · pagato", null, "verde"), voce("ok", "SAL 2", "4.200 € · pagato", null, "verde"), voce("doc", "SAL 3", "5.400 € · da approvare", "toast:SAL 3 approvato", "", stato("arancio", "Approva")), voce("doc", "Saldo", "5.400 € · alla consegna", null, "blu")])}</div>` });

  // ---- azienda
  V["az-home"] = () => ({ t: "", logo: true, h: `<div class="pad">
    <p class="saluto">Buongiorno,<br>Edil Rossi Srl</p><p class="sotto">Ecco cosa serve oggi.</p>
    <div class="griglia2">${num("2", "Dipendenti non in regola", "rosso")}${num("3", "Cantieri attivi")}${num("1", "Gara in scadenza", "giallo")}${num("1", "Chiamata persa", "giallo")}</div><div style="height:16px"></div>
    ${sez("Da fare", lista([voce("scudo", "Marco R.: corso preposto scaduto", "Risolvi con AncheSicura · 159 €", "risolvi", "rosso"), voce("gara", "Coperture palestra Aprilia", "Punteggio 91 · scade tra 5 giorni", "gara", ""), voce("doc", "SAL 3 Via Garibaldi", "Da inviare al cliente", "sal", "blu"), voce("tel", "Fornitore laterizi", "Chiamata persa alle 11:05", "centralino", "giallo")]))}
    ${sez("I tuoi moduli", `<div class="griglia3">${D.moduli.filter((m) => S.attivi[m.id]).map((m) => tile(m.ico, m.nome, "", m.id, "blu")).join("")}${tile("piu", "Aggiungi", "", "moduli", "")}</div>`)}</div>` });
  V.moduli = () => ({ t: "Moduli", h: `<div class="pad">
    <p class="sotto">Compri solo quello che ti serve. Prezzi al mese, pagamento annuale. Bozza da confermare.</p>
    <div class="eroe"><h3>Pacchetto ${D.pacchetto.nome}</h3><p>Tutti i moduli insieme</p><p class="prezzo" style="color:#fff">${D.pacchetto.prezzo} € <small style="color:rgba(255,255,255,.7)">al mese invece di ${D.pacchetto.invece} €</small></p>${btn("Attiva il pacchetto", "attiva:tutti")}</div><div style="height:14px"></div>
    ${D.moduli.map((m) => `<div class="card"><div class="riga"><span class="ico ${S.attivi[m.id] ? "verde" : "blu"}">${I[m.ico]}</span><div class="cresci"><b>${m.nome}</b><small>${m.desc}${m.div ? " · " + m.div : ""}</small></div></div><div class="riga" style="margin-top:10px"><div class="cresci"><span class="prezzo">${m.incluso ? "Incluso" : m.prezzo + " €"}</span> ${m.incluso ? "" : "<small>al mese</small>"}${m.nota ? `<br><small style="color:var(--grigio)">${m.nota}</small>` : ""}</div>${S.attivi[m.id] ? `<button class="btn piccolo chiaro" data-go="${m.id}">Apri</button>` : `<button class="btn piccolo" data-az="attiva:${m.id}">Attiva</button>`}</div></div>`).join("")}
    ${sez("Vendi e guadagna", lista([voce("euro", "Rivendi la sicurezza ai tuoi clienti", "Ti riconosciamo il 30%", "rivendi", "verde")]))}</div>` });
  V["az-nuovo"] = () => ({ t: "Crea", h: `<div class="pad"><div class="griglia2">${tile("doc", "Preventivo", "Per un cliente", "preventivo", "blu")}${tile("gru", "Giornale", "Cosa si è fatto oggi", "cantiere-az", "blu")}${tile("foto", "DDT da foto", "Fotografa la bolla", "toast:Fotocamera aperta", "blu")}${tile("lotti", "Lotto", "Cerca un subappaltatore", "lotti", "blu")}${tile("scudo", "Dipendente", "Aggiungi alla sicurezza", "sicurezza", "blu")}${tile("utente", "Cliente", "Nuovo cliente", "ufficio", "blu")}</div></div>` });
  V.ufficio = () => ({ t: "Ufficio", back: true, h: `<div class="pad"><div class="griglia2">${num("48", "Clienti")}${num("5", "Preventivi aperti", "giallo")}${num("12.400 €", "Da incassare")}${num("2", "Fatture scadute", "rosso")}</div><div style="height:14px"></div>
    ${lista([voce("utente", "Clienti", "Schede, lavori fatti, contatti", "toast:Clienti"), voce("doc", "Preventivi", "Fatti in pochi minuti, mandati in chat", "preventivo"), voce("euro", "Fatture", "Emesse e da incassare", "toast:Fatture"), voce("doc", "Documenti", "DURC, visure, certificati", "toast:Documenti"), voce("utente", "Titolare e operatori", "Chi vede cosa", "toast:Permessi")])}</div>` });
  V.preventivo = () => ({ t: "Nuovo preventivo", back: true, h: `<div class="pad">${campo("Cliente", `<input value="Giulia · Via Garibaldi">`)}${campo("Lavorazioni", `<textarea>Rifacimento bagno 6 mq, impianti, piastrelle, sanitari</textarea>`)}${campo("Importo", `<input value="4.800 €">`)}${btn("Manda in chat al cliente", "toast:Preventivo inviato")}</div>` });
  V.cantieri = () => ({ t: "Cantiere e SAL", back: true, h: `<div class="pad">${D.cantieri.map((c) => `<div class="card tap" data-go="cantiere-az"><div class="riga"><div class="cresci"><b>${c.nome}</b><small>${c.tipo} · ${c.sal}</small></div>${stato(c.stato, c.av + "%")}</div><div class="barra-av" style="margin-top:10px"><i style="width:${c.av}%"></i></div></div>`).join("")}</div>` });
  V["cantiere-az"] = () => ({ t: "Via Garibaldi 12", back: true, h: `<div class="pad">
    <div class="griglia2">${num("62%", "Avanzamento")}${num("6", "Presenti oggi", "verde")}</div><div style="height:14px"></div>
    ${lista([voce("doc", "Giornale dei lavori", "Oggi: posa piastrelle bagno · 4 foto", "toast:Giornale"), voce("utente", "Presenze", "6 entrati con QR · 0 bloccati", "ingressi", "verde"), voce("doc", "Rapportini", "Ore e materiali di oggi", "toast:Rapportini"), voce("euro", "SAL", "SAL 3 da inviare", "sal"), voce("calendario", "Cronoprogramma", "In linea con il piano", "toast:Cronoprogramma"), voce("foto", "DDT da foto", "2 bolle lette oggi", "toast:DDT"), voce("scudo", "Sicurezza del cantiere", "POS, verbali, checklist", "sicantiere", "verde")])}</div>` });
  V.sal = () => ({ t: "SAL", back: true, h: `<div class="pad">${lista([voce("ok", "SAL 1", "4.200 € · approvato", null, "verde"), voce("ok", "SAL 2", "4.200 € · approvato", null, "verde"), voce("doc", "SAL 3", "5.400 € · pronto", null, "", stato("arancio", "Da inviare"))])}<div style="height:12px"></div>${btn("Invia SAL 3 al cliente nell'app", "toast:SAL inviato: il cliente lo approva dall'app")}</div>` });
  V.gare = () => ({ t: "Gare", back: true, h: `<div class="pad"><div class="pillole"><span class="pillola on">Adatte a te</span><span class="pillola">In corso</span><span class="pillola">Vinte</span><span class="pillola">Perse</span></div><div style="height:12px"></div>
    ${D.gare.map((g) => `<div class="card tap" data-go="gara"><div class="riga"><div class="cresci"><b>${g.nome}</b><small>${g.ente} · ${g.importo} · ${g.cat}</small></div>${stato(g.punti >= 80 ? "verde" : "giallo", g.punti + "/100")}</div><p>Scade ${g.scade}</p></div>`).join("")}<p class="sotto" style="font-size:12.5px;margin-top:10px">Gare di esempio. Il punteggio è quanto la gara è adatta alla tua impresa.</p></div>` });
  V.gara = () => ({ t: "Analisi della gara", back: true, h: `<div class="pad">
    <div class="eroe"><h3>Coperture palestra · Aprilia</h3><p>210.000 € · OG1 classe I · scade tra 5 giorni</p><p class="prezzo" style="color:#fff">91/100 <small style="color:rgba(255,255,255,.7)">conviene partecipare</small></p></div><div style="height:14px"></div>
    ${sez("Requisiti letti dal bando", lista([voce("ok", "SOA OG1 classe I", "Ce l'hai", null, "verde"), voce("ok", "Fatturato ultimi 3 anni", "Sufficiente", null, "verde"), voce("allarme", "Sopralluogo obbligatorio", "Da fissare entro il 14", null, "giallo"), voce("ok", "Distanza dalla sede", "18 km", null, "verde")]))}
    ${sez("Cosa dice l'analisi", `<div class="card"><p>Ribasso medio delle ultime 5 gare simili di questo ente: <b>18,4%</b>. Imprese che partecipano di solito: 12. Ti consiglio un ribasso tra 16% e 19%.</p></div>`)}
    ${btn("Partecipa: prepara le buste", "toast:Buste create: amministrativa, tecnica, economica")}<div style="height:8px"></div>${btn("Simula l'esito: gara vinta", "go:esito", "chiaro")}</div>` });
  V.esito = () => ({ t: "Gara vinta", back: true, h: `<div class="pad"><div class="card"><div class="riga"><span class="ico verde">${I.gara}</span><div class="cresci"><b>Hai vinto con il ribasso del 17,2%</b><small>Seconda classificata: 16,9%</small></div></div></div><div style="height:12px"></div>
    ${sez("Analisi dopo la gara", `<div class="card"><p>Hai vinto per lo 0,3%. Il punteggio tecnico è stato più alto della media. Margine stimato sul lavoro: 11%.</p></div>`)}
    ${btn("Crea il cantiere da questa gara", "toast:Cantiere creato con cronoprogramma, SAL e sicurezza già impostati")}</div>` });
  V.sicurezza = () => ({ t: "Sicurezza", back: true, h: `<div class="pad">
    <div class="griglia3">${num("2", "Scaduti", "rosso")}${num("2", "In scadenza", "giallo")}${num("2", "In regola", "verde")}</div><div style="height:14px"></div>
    ${sez("Dipendenti", lista(D.dipendenti.map((d) => voce("utente", d.nome + " · " + d.mansione, d.cosa, d.stato === "verde" ? "patentino" : "risolvi", d.stato, stato(d.stato, d.stato === "verde" ? "OK" : d.stato === "giallo" ? "Presto" : "Scaduto")))))}
    ${sez("Strumenti", lista([voce("doc", "Report per l'ispezione", "Tutti i documenti in un file", "toast:Cartella pronta per l'ispettore"), voce("firma", "Consegna DPI", "Firma dal telefono del lavoratore", "dpi"), voce("corso", "Corsi online", "Iscrivi i dipendenti", "corsi-listino")]))}
    <div style="text-align:center;margin-top:8px"><img src="assets/anchesicura.png" alt="AncheSicura" style="height:30px"></div></div>` });
  V.risolvi = () => ({ t: "Risolvi con AncheSicura", back: true, h: `<div class="pad"><div class="card"><h3>Marco R. · corso preposto</h3><p>Scaduto da 12 giorni. Lo prenotiamo noi in aula vicino al tuo cantiere.</p></div><div style="height:12px"></div>
    ${lista([voce("calendario", "Aula di Roma Est", "Martedì 21 e giovedì 23 ottobre", null, "blu", `<span class="prezzo">159 €</span>`), voce("calendario", "Aula di Roma Sud", "Lunedì 27 e mercoledì 29 ottobre", null, "blu", `<span class="prezzo">159 €</span>`)])}
    <div style="height:12px"></div>${btn("Prenota e paga", "toast:Prenotato: lo vedi nel patentino di Marco")}<p class="sotto" style="font-size:12.5px;margin-top:10px">Prezzo di mercato per questo corso: circa 220 €.</p></div>` });
  V.sicantiere = () => ({ t: "Sicurezza Cantiere", back: true, h: `<div class="pad">${lista([voce("qr", "Ingressi con QR", "Oggi 6 entrati, 0 bloccati", "ingressi", "verde"), voce("doc", "Verbali del coordinatore", "Ultimo: 6 ottobre, 2 prescrizioni", "toast:Verbale aperto"), voce("ok", "Checklist del preposto", "Fatta oggi alle 7:45", "toast:Checklist"), voce("allarme", "Segnalazioni", "1 aperta: parapetto lato nord", "toast:Segnalazione", "giallo"), voce("rete", "Subappaltatori", "2 imprese, documenti in regola", "toast:Subappaltatori", "verde")])}</div>` });
  V.ingressi = () => ({ t: "Ingressi di oggi", back: true, h: `<div class="pad"><div class="avviso">Il lavoratore mostra il QR: l'app controlla corsi e visita e lo fa entrare solo se è in regola.</div><div style="height:12px"></div>
    ${lista([voce("ok", "Paolo M.", "Entrato 7:32", null, "verde"), voce("ok", "Sara T.", "Entrata 7:40", null, "verde"), voce("no", "Giorgio F.", "Bloccato 7:51 · formazione specifica mancante", "risolvi", "rosso")])}</div>` });
  V.lotti = () => ({ t: "Lotti e subappalti", back: true, h: `<div class="pad">${btn("Pubblica un lotto", "toast:Lotto pubblicato: lo vedono le imprese della zona")}<div style="height:14px"></div>
    ${sez("I tuoi lotti", lista([voce("lotti", "Impianto elettrico · Scuola Rodari", "4 offerte · scade venerdì", "toast:Confronta le offerte", "", stato("arancio", "4 offerte")), voce("lotti", "Fornitura laterizi", "2 offerte", "toast:Confronta le offerte")]))}
    ${sez("Albo fornitori", lista([voce("rete", "12 imprese e fornitori qualificati", "Categorie, zona, documenti e recensioni", "toast:Albo")]))}</div>` });
  V.centralino = () => ({ t: "Centralino AncheVoice", back: true, h: `<div class="pad"><div class="eroe"><h3>06 1234 5678</h3><p>Il numero della tua impresa. Smista a ufficio, cantiere o artigiano.</p></div><div style="height:14px"></div>
    ${sez("Chiamate di oggi", lista(D.chiamate.map((c) => voce("tel", c.chi + " · " + c.ora, c.esito, "toast:Chiamata aperta", c.tipo === "rosso" ? "rosso" : c.tipo === "arancio" ? "" : "verde"))))}
    ${sez("Regole", lista([voce("calendario", "Orari", "Lun-ven 8-18, poi segreteria", "toast:Orari"), voce("rete", "Smistamento", "1 Ufficio · 2 Cantieri · 3 Preventivi", "toast:Smistamento")]))}</div>` });
  V.magazzino = () => ({ t: "Magazzino e mezzi", back: true, h: `<div class="pad">${lista([voce("box", "Cemento 32,5", "42 sacchi", null, "blu"), voce("box", "Piastrelle 60×60", "18 mq · sotto scorta", null, "giallo"), voce("gru", "Miniescavatore", "Tagliando tra 30 ore", null, "blu")])}</div>` });
  V.recensioni = () => ({ t: "Recensioni", back: true, h: `<div class="pad"><div class="griglia2">${num("4,8", "Media su 37")}${num("100%", "Risposte date", "verde")}</div><div style="height:12px"></div>
    <div class="card"><p class="stelle">★★★★★</p><h3>Villa Bianchi</h3><p>Puntuali e puliti, il cantiere seguito dall'app è comodissimo.</p>${btn("Rispondi", "toast:Risposta pubblicata", "piccolo chiaro")}</div></div>` });
  V.rivendi = () => ({ t: "Rivendi la sicurezza", back: true, h: `<div class="pad"><div class="eroe"><h3>Guadagni il 30%</h3><p>Proponi corsi e servizi AncheSicura ai tuoi clienti. Pagano AncheCasa, a te arriva il 30% in automatico.</p>${btn("Condividi il tuo link", "toast:Link copiato: anchecasa.it/s/EDILROSSI")}</div><div style="height:14px"></div>
    ${sez("Questo mese", `<div class="griglia2">${num("6", "Clienti che hanno comprato")}${num("212 €", "Il tuo 30%", "verde")}</div>`)}
    ${sez("Estratto", lista([voce("corso", "Bar Centrale", "3 corsi HACCP · 87 €", null, "verde", "+26,10 €"), voce("scudo", "Hotel Sole", "DVR · 199 €", null, "verde", "+59,70 €")]))}</div>` });

  // ---- lavoratore
  V["op-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Ciao Marco</p><p class="sotto">Edil Rossi Srl · Muratore</p>
    <div class="card" style="border-color:var(--rosso)"><div class="riga"><span class="ico rosso">${I.scudo}</span><div class="cresci"><b>Non sei in regola</b><small>Corso preposto scaduto: l'azienda l'ha già prenotato</small></div></div></div><div style="height:12px"></div>
    ${btn(I.qr + " Mostra il patentino per entrare", "go:patentino")}<div style="height:16px"></div>
    ${sez("Da fare", lista([voce("corso", "Aggiornamento lavoratori", "Online · 2 lezioni su 6", "corso", ""), voce("firma", "Firma consegna DPI", "Scarpe e guanti nuovi", "dpi", "giallo")]))}</div>` });
  V.patentino = () => ({ t: "Patentino", h: `<div class="pad" style="text-align:center"><div class="qr"></div><p class="saluto" style="font-size:20px">Marco R.</p><p class="sotto">Muratore · Edil Rossi Srl</p></div><div class="pad" style="padding-top:0">
    ${lista([voce("ok", "Formazione generale e specifica", "Valida fino al 2029", null, "verde"), voce("no", "Preposto", "Scaduto · prenotato il 21 ottobre", null, "rosso"), voce("ok", "Visita medica", "Idoneo · fino a marzo 2027", null, "verde"), voce("ok", "DPI", "Casco, scarpe, imbracatura", null, "verde")])}</div>` });
  V["segnala-op"] = () => ({ t: "Segnala un pericolo", h: `<div class="pad">${campo("Cosa hai visto", `<select><option>Pericolo</option><option>Quasi incidente</option><option>Infortunio</option><option>DPI mancanti</option></select>`)}${campo("Foto", `<button class="btn chiaro" data-az="toast:Fotocamera aperta">${I.foto} Scatta</button>`)}${campo("Dove e cosa", `<textarea placeholder="Es. parapetto mancante lato nord, secondo piano"></textarea>`)}
    <label class="campo" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox"> <span>Invia senza il mio nome</span></label>${btn("Invia", "toast:Segnalazione inviata al preposto e al coordinatore")}</div>` });
  V.corsi = () => ({ t: "I miei corsi", h: `<div class="pad">${lista([voce("corso", "Aggiornamento lavoratori", "Online · 33% fatto", "corso"), voce("corso", "Preposto", "In aula · 21 e 23 ottobre", null, "blu"), voce("ok", "Formazione specifica rischio alto", "Fatto · attestato nel patentino", null, "verde")])}</div>` });
  V.corso = () => ({ t: "Aggiornamento lavoratori", back: true, h: `<div class="pad"><div class="foto scura" style="height:200px;font-size:15px">▶ Lezione 3 · Lavori in quota</div><div style="height:12px"></div><div class="barra-av"><i style="width:33%"></i></div><p class="sotto" style="margin-top:6px">2 lezioni su 6 · puoi fermarti e riprendere quando vuoi</p>
    ${lista([voce("ok", "Lezione 1 · Rischi e prevenzione", "Fatta", null, "verde"), voce("ok", "Lezione 2 · DPI", "Fatta", null, "verde"), voce("video", "Lezione 3 · Lavori in quota", "In corso", null), voce("doc", "Test finale", "Dopo l'ultima lezione", null, "blu")])}</div>` });
  V.dpi = () => ({ t: "Consegna DPI", back: true, h: `<div class="pad">${lista([voce("ok", "Scarpe antinfortunistiche S3", "Taglia 43", null, "verde"), voce("ok", "Guanti antitaglio", "2 paia", null, "verde")])}<div style="height:12px"></div><div class="card" style="height:140px;display:grid;place-items:center;color:var(--grigio)">${I.firma} Firma qui con il dito</div><div style="height:12px"></div>${btn("Conferma la consegna", "toast:Consegna firmata e salvata nel fascicolo")}</div>` });

  // ---- agente
  V["ag-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Ciao Francesca</p><p class="sotto">Agente AncheCasa · Roma · capoarea Luca</p>
    <div class="griglia2">${num("1.240 €", "Provvigioni del mese", "verde")}${num("23", "Clienti nella tua rete")}</div><div style="height:16px"></div>
    ${sez("Da richiamare", lista([voce("utente", "Hotel Sole", "Interessato al modulo Sicurezza", "vendi"), voce("utente", "Bar Centrale", "Corsi HACCP per 3 persone", "vendi")]))}
    ${sez("Puoi vendere", `<div class="griglia2">${tile("griglia", "Moduli app", "A ogni azienda", "vendi", "blu")}${tile("corso", "Corsi", "AncheSicura", "corsi-listino", "blu")}${tile("scudo", "Servizi sicurezza", "DVR, visite, RSPP", "corsi-listino", "blu")}${tile("casa", "Ristrutturazioni", "AncheCasa garantita", "vendi", "blu")}</div>`)}</div>` });
  V.vendi = () => ({ t: "Vendi", h: `<div class="pad"><p class="sotto">Scegli cosa proporre: al cliente arriva la proposta nell'app con il tuo codice.</p>
    ${sez("Moduli dell'app", lista(D.moduli.filter((m) => !m.incluso).map((m) => voce(m.ico, m.nome, m.prezzo + " € al mese", "toast:Proposta inviata", "blu"))))}
    ${sez("Pacchetto", lista([voce("griglia", "Impresa completa", D.pacchetto.prezzo + " € al mese", "toast:Proposta inviata", "")]))}
    ${sez("Altro", lista([voce("corso", "Corsi AncheSicura", "Da 29 € a persona", "corsi-listino", "blu"), voce("video", "SuperMastro per le imprese", "Ricevere i clienti dai video", "toast:Proposta inviata", "blu"), voce("casa", "Ristrutturazione con AncheCasa", "Sopralluogo gratuito", "toast:Proposta inviata", "blu"), voce("tel", "Centralino AncheVoice", "19 € al mese", "toast:Proposta inviata", "blu")]))}</div>` });
  V["ag-invita"] = () => ({ t: "Invita", h: `<div class="pad">${campo("Chi inviti", `<select><option>Azienda</option><option>Privato</option><option>Sub-agente della tua squadra</option></select>`)}${campo("Mail", `<input placeholder="mail@azienda.it">`)}${btn("Manda l'invito", "toast:Invito inviato: entra con il tuo codice")}</div>` });
  V.rete = () => ({ t: "La mia rete", h: `<div class="pad"><div class="griglia2">${num("23", "Clienti")}${num("4", "Sub-agenti")}</div><div style="height:12px"></div>${lista([voce("utente", "Edil Rossi Srl", "Impresa completa · dal 2 settembre", null, "verde"), voce("utente", "Hotel Sole", "Invito aperto, non ancora iscritto", null, "giallo"), voce("rete", "Marta (sub-agente)", "6 clienti · a te il 30% delle sue provvigioni", null, "blu")])}</div>` });

  // ---- report recensioni (admin, sviluppo rete, capoarea)
  const ZONA_REP = () => (S.profilo === "admin" ? "Tutta Italia" : S.profilo === "sviluppo" ? "Area Centro" : "Lazio · la tua zona");
  V["report-rec"] = () => ({ t: "Report recensioni", back: true, h: `<div class="pad">
    <p class="sotto">${ZONA_REP()} · ultimi 90 giorni · solo recensioni di lavori fatti e pagati</p>
    <div class="pillole" style="margin:10px 0 12px"><span class="pillola on">Per impresa</span><span class="pillola" data-go="report-lavori">Per lavoro</span></div>
    <div class="griglia2">${num("4,6", "Media generale", "verde")}${num("1.284", "Recensioni")}${num("3", "Imprese sotto 3,5", "rosso")}${num("94%", "Lavori finiti nei tempi")}</div><div style="height:14px"></div>
    ${sez("Imprese", lista([["Edil Rossi Srl", "4,8", "38 lavori · in salita", "verde"], ["Idraulica Monti", "4,9", "23 interventi · pronto intervento", "verde"], ["Bagni Roma", "4,3", "12 lavori · stabile", "verde"], ["Costruzioni Sud", "3,9", "9 lavori · in calo", "giallo"], ["Ristrutturazioni Lampo", "3,1", "7 lavori · 2 segnalazioni", "rosso"]].map((x) => voce("stella", x[0], x[2], "report-impresa", x[3], stato(x[3], "★ " + x[1])))))}
    ${btn("Scarica il report PDF", "toast:Report PDF pronto")}</div>` });
  V["report-lavori"] = () => ({ t: "Report per lavoro", back: true, h: `<div class="pad"><p class="sotto">${ZONA_REP()} · ultimi 90 giorni</p><div class="pillole" style="margin:10px 0 12px"><span class="pillola" data-az="indietro">Per impresa</span><span class="pillola on">Per lavoro</span></div>
    ${lista([["Bagno · Villa Bianchi, Frascati", "Edil Rossi · ★ 5,0 · finito in anticipo", "verde"], ["Palazzina · Via Garibaldi, Roma", "Edil Rossi · ★ 4,7 · in corso (SAL 3)", "verde"], ["Perdita sifone · Monteverde", "Idraulica Monti · ★ 5,0 · 40 minuti", "verde"], ["Cucina · Via Ostiense", "Costruzioni Sud · ★ 3,4 · 12 giorni di ritardo", "giallo"], ["Bagno · Ostia", "Ristrutturazioni Lampo · ★ 2,6 · segnalazione aperta", "rosso"]].map((x) => voce("casa", x[0], x[1], "report-impresa", x[2])))}<div style="height:12px"></div>${btn("Scarica il report PDF", "toast:Report PDF pronto")}</div>` });
  V["report-impresa"] = () => ({ t: "Edil Rossi Srl", back: true, h: `<div class="pad">
    <div class="eroe"><h3>★ 4,8 su 5</h3><p>38 lavori · 112 recensioni · iscritta dal 2025</p>${stato("verde", "Affidabile")}</div><div style="height:14px"></div>
    ${sez("Voti per voce", lista([["Qualità del lavoro", "4,9"], ["Puntualità", "4,6"], ["Pulizia del cantiere", "4,8"], ["Prezzo rispettato", "4,9"], ["Comunicazione", "4,7"]].map((x) => voce("ok", x[0], "", null, "verde", stato("verde", "★ " + x[1])))))}
    ${sez("Ultimi lavori", lista([voce("casa", "Bagno · Villa Bianchi", "★ 5,0 · «Precisi e puliti»", null, "verde"), voce("casa", "Facciata · Scuola Rodari", "★ 4,5 · ente pubblico", null, "verde"), voce("allarme", "Segnalazioni", "1 chiusa in 2 giorni", null, "giallo")]))}
    ${btn("Scarica il report dell'impresa", "toast:Report PDF pronto")}</div>` });

  // ---- segnalatore (è un privato)
  V["segnala-amico"] = () => ({ t: "Segnala e guadagna", back: true, h: `<div class="pad">
    <div class="eroe"><h3>Segnala ad AncheCasa</h3><p>Chi deve ristrutturare, un'azienda che ha bisogno di sicurezza o di un'impresa seria. Se il lavoro parte, ricevi un premio.</p></div><div style="height:14px"></div>
    ${campo("Chi segnali", `<select><option>Una persona che deve ristrutturare</option><option>Un'azienda (sicurezza, moduli, corsi)</option><option>Un'impresa o un artigiano da iscrivere</option></select>`)}${campo("Nome", `<input placeholder="Nome e cognome o azienda">`)}${campo("Telefono", `<input placeholder="Lo chiamiamo noi">`)}${campo("Due parole", `<textarea placeholder="Cosa gli serve"></textarea>`)}
    ${btn("Invia la segnalazione", "toast:Segnalazione inviata: ti avvisiamo quando lo chiamiamo")}<div style="height:16px"></div>
    ${sez("Le mie segnalazioni", lista([voce("casa", "Paolo · ristrutturazione bagno", "Sopralluogo fissato", null, "verde", stato("verde", "Partita")), voce("ufficio", "Bar Centrale · corsi", "Chiamato, in attesa", null, "giallo", stato("giallo", "In corso")), voce("utente", "Elettricista Mario", "Invito inviato", null, "blu", stato("blu", "Inviato"))]))}
    <p class="sotto" style="font-size:12.5px">Importo del premio: da decidere.</p></div>` });

  // ---- sviluppo rete
  V["sv-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Sviluppo rete</p><p class="sotto">Fase 1 · tutta Italia · mancano 54 giorni</p>
    <div class="griglia2">${num("37", "Aziende inserite")}${num("21", "Verificate dall'admin", "verde")}${num("9", "In attesa", "giallo")}${num("3", "Capiarea")}</div><div style="height:16px"></div>
    ${sez("Da fare oggi", lista([voce("ufficio", "Impianti Neri Srl", "Invito aperto, non ha ancora finito l'iscrizione", "sv-aziende", "giallo"), voce("rete", "Colloquio nuovo capoarea", "Marche · ore 15", "sv-area", "blu")]))}
    ${sez("Report", lista([voce("stella", "Recensioni dell'area", "Rating per impresa e per lavoro", "report-rec", "verde", stato("verde", "★ 4,6"))]))}
    ${sez("Accordo", lista([voce("firma", "Accordo di collaborazione", "Firmato il 7 ottobre", "toast:Accordo firmato", "verde", stato("verde", "Firmato"))]))}</div>` });
  V["sv-aziende"] = () => ({ t: "Aziende inserite", h: `<div class="pad">${lista([voce("ufficio", "Edil Rossi Srl · Roma", "Verificata · Impresa completa", null, "verde", stato("verde", "Iscritta")), voce("ufficio", "Impianti Neri Srl · Milano", "Invito aperto", null, "giallo", stato("giallo", "Invitata")), voce("ufficio", "Costruzioni Sud · Bari", "Documenti da controllare", null, "blu", stato("blu", "Verifica admin"))])}</div>` });
  V["sv-inserisci"] = () => ({ t: "Inserisci un'azienda", h: `<div class="pad">${campo("Ragione sociale", `<input placeholder="Nome dell'azienda">`)}${campo("Partita IVA", `<input placeholder="11 cifre">`)}${campo("Mail", `<input placeholder="mail@azienda.it">`)}${campo("Regione", `<select><option>Lazio</option><option>Lombardia</option><option>Campania</option></select>`)}${btn("Inserisci e invita", "toast:Invito inviato: poi la verifica l'admin")}</div>` });
  V["sv-area"] = () => ({ t: "La mia area", h: `<div class="pad"><div class="card"><h3>Centro</h3><p>Toscana, Umbria, Marche, Lazio. L'area diventa tua alla fine della fase 1.</p></div><div style="height:12px"></div>
    ${sez("Struttura dell'area", lista([voce("rete", "Luca · capoarea Lazio", "5 agenti · 14 sub-agenti", "toast:Squadra di Luca", "blu"), voce("rete", "Capoarea Toscana", "Da nominare", "toast:Proponi un capoarea", "giallo"), voce("utente", "Segnalatori privati", "42 nell'area", null, "blu")]))}</div>` });

  // ---- capoarea
  V["ca-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Ciao Luca</p><p class="sotto">Capoarea agenti · Lazio</p>
    <div class="griglia2">${num("5", "Agenti")}${num("14", "Sub-agenti")}${num("118", "Clienti della squadra")}${num("4.870 €", "Provvigioni della squadra", "verde")}</div><div style="height:16px"></div>
    ${sez("Da seguire", lista([voce("allarme", "Stefano sotto obiettivo", "2 clienti su 8 questo mese", "ca-squadra", "giallo"), voce("rete", "Paolo, nuovo agente", "Deve fare la formazione", "ca-squadra", "blu")]))}
    ${sez("Report", lista([voce("stella", "Recensioni della zona", "Rating per impresa e per lavoro", "report-rec", "verde", stato("verde", "★ 4,6"))]))}</div>` });
  V["ca-squadra"] = () => ({ t: "La mia squadra", h: `<div class="pad">${lista([voce("rete", "Francesca · agente Roma", "23 clienti · 4 sub-agenti", null, "verde", stato("verde", "In linea")), voce("rete", "Stefano · agente Latina", "2 clienti su 8", null, "giallo", stato("giallo", "Sotto")), voce("rete", "Paolo · agente Frosinone", "Nuovo · formazione da fare", null, "blu", stato("blu", "Nuovo"))])}</div>` });
  V["ca-nuovo"] = () => ({ t: "Nuovo agente", h: `<div class="pad">${campo("Nome", `<input placeholder="Nome e cognome">`)}${campo("Mail", `<input placeholder="mail">`)}${campo("Zona", `<input placeholder="Città o provincia">`)}${btn("Manda l'invito", "toast:Invito inviato: entra nella tua squadra")}</div>` });
  V["ca-numeri"] = () => ({ t: "Numeri della squadra", h: `<div class="pad"><div class="griglia2">${num("31", "Clienti nuovi nel mese", "verde")}${num("12", "Moduli venduti")}${num("64", "Corsi venduti")}${num("3", "Ristrutturazioni")}</div><div style="height:12px"></div>${lista([voce("stella", "Report recensioni", "Le imprese portate dalla squadra", "report-rec", "verde")])}</div>` });

  // ---- sub-agente
  V["sa-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Ciao Marta</p><p class="sotto">Sub-agente · agente Francesca</p>
    <div class="griglia2">${num("310 €", "Provvigioni del mese", "verde")}${num("6", "Clienti")}</div><div style="height:16px"></div>
    ${sez("Da richiamare", lista([voce("utente", "Pizzeria Roma", "Corsi HACCP", "vendi"), voce("utente", "Studio Bianchi", "Modulo Ufficio", "vendi")]))}
    <div class="card"><p>Il tuo codice è collegato a Francesca: a te il 70% della provvigione, a lei il 30%.</p></div></div>` });
  V["sa-guadagni"] = () => ({ t: "Guadagni", h: `<div class="pad"><div class="griglia2">${num("310 €", "Questo mese", "verde")}${num("1.120 €", "Da inizio anno")}</div><div style="height:12px"></div>${lista([voce("euro", "Bar Centrale · corso HACCP", "Tu 70% · Francesca 30%", null, "verde"), voce("euro", "Studio Bianchi · Ufficio", "Tu 70% · Francesca 30%", null, "verde")])}</div>` });

  // ---- artigiano (solo pronto intervento)
  V["ar-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Idraulica Monti</p><p class="sotto">Artigiano · pronto intervento · Roma Monteverde</p>
    <div class="card" data-go="ar-stato" style="display:flex;align-items:center;gap:10px;margin:12px 0">${stato("verde", "Disponibile ora")}<small style="flex:1">Ricevi le richieste entro 5 km</small><span style="color:var(--blu)">${I.freccia}</span></div>
    <div class="griglia2">${num("2", "Richieste nuove", "giallo")}${num("23", "Interventi nel mese")}${num("4,9", "Valutazione", "verde")}${num("31 min", "Tempo medio di risposta")}</div><div style="height:16px"></div>
    ${sez("Richieste da SuperMastro", lista([voce("video", "Perdita dal sifone del lavello", "Giulia · 1,2 km · urgenza media", "ar-richiesta", "", stato("arancio", "Nuova")), voce("video", "Scarico della doccia lento", "Marco · 3,1 km · non urgente", "ar-richiesta", "", stato("arancio", "Nuova"))]))}
    <div class="eroe" data-go="ar-up"><h3>Cresci: passa a Impresa</h3><p>Con i requisiti in regola entri nei cantieri AncheCasa, nei lotti e nei moduli per le imprese.</p></div></div>` });
  V["ar-richieste"] = () => ({ t: "Richieste", h: `<div class="pad">${lista([voce("video", "Perdita dal sifone del lavello", "Giulia · 1,2 km · oggi 08:02", "ar-richiesta", "arancio", stato("arancio", "Nuova")), voce("video", "Scarico della doccia lento", "Marco · 3,1 km · oggi 07:40", "ar-richiesta", "arancio", stato("arancio", "Nuova")), voce("ok", "Rubinetto cucina", "Anna · ieri", "toast:Intervento chiuso", "verde", stato("verde", "Fatto")), voce("ok", "Caldaia in blocco", "Paolo · lunedì", "toast:Intervento chiuso", "verde", stato("verde", "Fatto"))])}</div>` });
  V["ar-richiesta"] = () => ({ t: "Nuova richiesta", back: true, h: `<div class="pad">
    <div class="foto scura" style="height:170px;flex-direction:column;gap:6px">${I.video}<b>Video del cliente · 0:05</b></div><div style="height:12px"></div>
    <div class="eroe"><h3>Perdita dal sifone del lavello</h3><p>Analisi di SuperMastro: guarnizione usurata o dado allentato. Fondo del mobile bagnato.</p>${stato("arancio", "Urgenza media")}</div><div style="height:12px"></div>
    ${lista([voce("utente", "Giulia", "Via Donna Olimpia · 1,2 km da te", null, "blu"), voce("box", "Cosa portare", "Guarnizioni e sifone da 40 mm", null, "blu")])}<div style="height:12px"></div>
    ${btn(I.tel + " Accetta e chiama", "toast:Richiesta accettata: chiamata a Giulia")}<div style="height:8px"></div>${btn("Manda un prezzo indicativo", "toast:Prezzo indicativo inviato in chat", "chiaro")}<div style="height:8px"></div>${btn("Non posso", "toast:La richiesta passa al prossimo artigiano", "chiaro")}</div>` });
  V["ar-stato"] = () => ({ t: "Disponibilità", h: `<div class="pad"><div class="card"><div class="riga"><span class="ico verde">${I.ok}</span><div class="cresci"><b>Disponibile ora</b><small>Compari nella mappa di SuperMastro tra i primi</small></div>${btn("Pausa", "toast:Sei in pausa: non ricevi richieste", "chiaro piccolo")}</div></div><div style="height:12px"></div>
    ${campo("Mestiere", `<input value="Idraulico">`)}${campo("Zona", `<input value="Entro 5 km da Roma Monteverde">`)}${campo("Orari", `<input value="Lun-Sab 7-20 · urgenze anche la domenica">`)}${btn("Salva", "toast:Disponibilità salvata")}</div>` });
  V["ar-recensioni"] = () => ({ t: "Recensioni", h: `<div class="pad"><div class="griglia2">${num("4,9", "Media", "verde")}${num("41", "Recensioni")}</div><div style="height:12px"></div>${lista([voce("stella", "★★★★★ Giulia", "Arrivato in 40 minuti, pulito e gentile", null, "verde"), voce("stella", "★★★★★ Paolo", "Caldaia ripartita subito", null, "verde"), voce("stella", "★★★★☆ Anna", "Bravo, un po' di ritardo", null, "giallo")])}</div>` });
  V["ar-up"] = () => ({ t: "Passa a Impresa", back: true, h: `<div class="pad">
    <div class="eroe"><h3>Da artigiano a Impresa AncheCasa</h3><p>Oggi ricevi solo i pronto interventi. Come Impresa entri nei cantieri AncheCasa, nei lotti e nei moduli per le imprese.</p></div><div style="height:14px"></div>
    ${sez("I tuoi requisiti", lista([voce("ok", "Partita IVA", "Verificata", null, "verde", stato("verde", "Ok")), voce("ok", "Iscrizione alla Camera di Commercio", "Verificata", null, "verde", stato("verde", "Ok")), voce("ok", "Assicurazione RC", "Valida fino a marzo", null, "verde", stato("verde", "Ok")), voce("ok", "Almeno 20 interventi con media 4,5", "23 interventi · media 4,9", null, "verde", stato("verde", "Ok")), voce("allarme", "DURC regolare", "Da caricare", "toast:Carica il DURC", "rosso", stato("rosso", "Manca"))]))}
    ${sez("Cosa cambia", `<div class="card"><p>Tieni il tuo profilo, le recensioni e i clienti. Si aggiungono cantieri, preventivi, SAL, lotti e i moduli che scegli.</p></div>`)}
    ${btn("Chiedi il passaggio a Impresa", "toast:Richiesta inviata: AncheCasa controlla i documenti")}
    <p class="sotto" style="font-size:12.5px;margin-top:10px">Requisiti di esempio: quelli veri li decide AncheCasa.</p></div>` });

  // ---- fornitore
  V["fo-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Laterizi Lazio</p><p class="sotto">Fornitore · materiali edili e noleggio</p>
    <div class="griglia2">${num("4", "Ordini da consegnare")}${num("2", "Richieste dai general contractor", "giallo")}</div><div style="height:16px"></div>
    ${sez("Richieste nuove", lista([voce("lotti", "Fornitura laterizi · Scuola Rodari", "Edil Rossi · scade venerdì", "fo-offerta", "", stato("arancio", "Rispondi")), voce("gru", "Noleggio miniescavatore 5 giorni", "Bianchi Costruzioni · dal 20 ottobre", "fo-offerta", "", stato("arancio", "Rispondi"))]))}
    ${sez("Consegne di oggi", lista([voce("box", "Via Garibaldi 12", "30 sacchi cemento · ore 8", "toast:Consegna confermata con foto del DDT", "verde")]))}</div>` });
  V["fo-ordini"] = () => ({ t: "Ordini", h: `<div class="pad">${lista([voce("box", "Edil Rossi · Via Garibaldi", "Cemento e laterizi · 1.240 €", null, "verde", stato("verde", "Consegnato")), voce("box", "Bianchi Costruzioni", "Piastrelle 60×60 · 860 €", null, "giallo", stato("giallo", "Domani")), voce("box", "Casa Nuova", "Malta e collanti · 310 €", null, "blu", stato("blu", "Nuovo"))])}</div>` });
  V["fo-offerta"] = () => ({ t: "Manda un'offerta", h: `<div class="pad"><div class="card"><h3>Fornitura laterizi · Scuola Rodari</h3><p>Edil Rossi Srl · consegna a Latina · scade venerdì</p></div><div style="height:12px"></div>${campo("Prezzo", `<input value="4.300 €">`)}${campo("Consegna", `<input value="Entro 5 giorni dall'ordine">`)}${campo("Note", `<textarea>Prezzo comprensivo di trasporto e scarico.</textarea>`)}${btn("Invia l'offerta", "toast:Offerta inviata: la vedi in Ordini se accettata")}</div>` });
  V["fo-listino"] = () => ({ t: "Listino", h: `<div class="pad">${lista([voce("box", "Mattone forato 8×25×25", "0,48 € al pezzo · 12.000 disponibili", null, "blu"), voce("box", "Cemento 32,5 R", "6,90 € al sacco", null, "blu"), voce("gru", "Miniescavatore 1,8 t", "120 € al giorno · libero dal 20", null, "blu")])}<div style="height:12px"></div>${btn("Aggiungi un prodotto", "toast:Nuovo prodotto")}</div>` });

  // ---- partner
  V["pa-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Bianchi Costruzioni</p><p class="sotto">Partner AncheCasa · Roma</p>
    <div class="griglia2">${num("3", "Cantieri assegnati")}${num("1", "Sopralluogo domani", "giallo")}</div><div style="height:16px"></div>
    ${sez("Nuovo lavoro da AncheCasa", `<div class="card"><h3>Bagno, Via Ostiense 40</h3><p>Sopralluogo fatto da AncheCasa · 6.200 € · inizio 3 novembre</p><div class="btns">${btn("Accetta", "toast:Lavoro accettato", "piccolo")}${btn("Rifiuta", "toast:Rifiutato", "piccolo chiaro")}</div></div>`)}</div>` });
  V["pa-lavori"] = () => V.cantieri();
  V["pa-sal"] = () => V.sal();
  V.kit = () => ({ t: "Kit del marchio", h: `<div class="pad">${lista([voce("gru", "Livrea furgoni", "2 furgoni fatti · ordina il terzo", "toast:Ordine inviato", "verde"), voce("kit", "Divise", "Giacche, polo, caschi con il logo", "toast:Ordine inviato", "blu"), voce("doc", "Striscioni di cantiere", "3 × 1 m e 6 × 2 m", "toast:Ordine inviato", "blu")])}</div>` });

  // ---- consulente AncheSicura
  V["co-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Studio Verdi</p><p class="sotto">Società della rete AncheSicura · Roma</p>
    <div class="griglia2">${num("14", "Aziende seguite")}${num("2", "Sopralluoghi oggi", "giallo")}</div><div style="height:16px"></div>
    ${sez("Oggi", lista([voce("casco", "Via Garibaldi 12 · ore 10", "Verbale del coordinatore", "verbale", ""), voce("ufficio", "Hotel Sole · ore 15", "Aggiornamento DVR", "co-azienda", "blu")]))}</div>` });
  V["co-aziende"] = () => ({ t: "Aziende seguite", h: `<div class="pad">${lista([voce("ufficio", "Edil Rossi Srl", "2 dipendenti non in regola", "co-azienda", "rosso"), voce("ufficio", "Hotel Sole", "DVR da aggiornare", "co-azienda", "giallo"), voce("ufficio", "Bar Centrale", "Tutto in regola", "co-azienda", "verde")])}</div>` });
  V["co-azienda"] = () => V.sicurezza();
  V["co-agenda"] = () => ({ t: "Agenda", h: `<div class="pad">${lista([voce("calendario", "Oggi 10:00", "Via Garibaldi 12 · verbale", null, "blu"), voce("calendario", "Oggi 15:00", "Hotel Sole · DVR", null, "blu"), voce("calendario", "Domani 9:00", "Corso preposti · aula Roma Est", null, "blu")])}</div>` });
  V.verbale = () => ({ t: "Nuovo verbale", h: `<div class="pad">${campo("Cantiere", `<select><option>Via Garibaldi 12</option></select>`)}${campo("Foto", `<button class="btn chiaro" data-az="toast:Fotocamera aperta">${I.foto} Aggiungi foto</button>`)}${campo("Prescrizioni", `<textarea>Parapetto lato nord da completare entro oggi.</textarea>`)}${btn("Firma e invia all'impresa", "toast:Verbale firmato e inviato")}</div>` });

  // ---- admin
  V["ad-home"] = () => ({ t: "", logo: true, h: `<div class="pad"><p class="saluto">Cruscotto AncheCasa</p><p class="sotto">Numeri di esempio.</p>
    <div class="griglia2">${num("1.284", "Iscritti")}${num("312", "Moduli attivi")}${num("18", "Cantieri da GC")}${num("4", "Segnalazioni aperte", "giallo")}</div><div style="height:16px"></div>
    ${sez("Le divisioni", `<div class="griglia2">${tile("gru", "AncheCasa GC", "Cantieri e partner", "gc", "blu")}${tile("scudo", "AncheSicura", "Aziende, corsi, consulenti", "ad-sicura", "blu")}${tile("video", "SuperMastro", "Video analizzati, artigiani", "ad-supermastro", "blu")}${tile("tel", "AncheVoice", "Numeri attivi, chiamate", "ad-voice", "blu")}${tile("gara", "Gare e lotti", "Gare seguite, lotti", "ad-gare", "blu")}${tile("rete", "Rete commerciale", "Sviluppo, capiarea, agenti", "ad-agenti", "blu")}${tile("stella", "Recensioni", "Report per impresa e lavoro", "report-rec", "blu")}</div>`)}
    ${sez("Da guardare", lista([voce("allarme", "Ritardo Via Ostiense", "Segnalato dal cliente", "ad-segn", "giallo"), voce("stella", "Recensione da controllare", "1 stella · Bagni Roma", "toast:Recensione aperta", "rosso")]))}</div>` });
  V["ad-sicura"] = () => ({ t: "AncheSicura", back: true, h: `<div class="pad"><div style="text-align:center;margin-bottom:12px"><img src="assets/anchesicura.png" alt="AncheSicura" style="height:32px"></div><div class="griglia2">${num("146", "Aziende con il modulo")}${num("38", "Società della rete")}${num("412", "Corsi venduti nel mese")}${num("27", "Dipendenti scaduti", "rosso")}</div><div style="height:12px"></div>${lista([voce("utente", "Candidature società", "3 da valutare", "toast:Candidature", "giallo"), voce("corso", "Listino corsi e servizi", "Prezzi e aule", "corsi-listino", "blu")])}</div>` });
  V["ad-supermastro"] = () => ({ t: "SuperMastro", back: true, h: `<div class="pad"><div class="griglia2">${num("318", "Video analizzati nel mese")}${num("72%", "Chiamano un artigiano", "verde")}${num("41%", "Scelgono un iscritto")}${num("12", "Analisi da controllare", "giallo")}</div><div style="height:12px"></div>${lista([voce("video", "Ultime analisi", "Idraulico 46% · elettricista 21% · fabbro 12%", "toast:Analisi", "blu")])}</div>` });
  V["ad-voice"] = () => ({ t: "AncheVoice", back: true, h: `<div class="pad"><div class="griglia2">${num("54", "Numeri attivi")}${num("2.310", "Chiamate nel mese")}</div></div>` });
  V["ad-gare"] = () => ({ t: "Gare e lotti", back: true, h: `<div class="pad"><div class="griglia2">${num("88", "Imprese con Gare")}${num("31", "Gare vinte dagli iscritti", "verde")}${num("64", "Lotti pubblicati")}${num("212", "Offerte ricevute")}</div></div>` });
  V["ad-agenti"] = () => ({ t: "Rete commerciale", back: true, h: `<div class="pad">${lista([voce("rete", "Responsabili sviluppo rete", "3 · Nord, Centro, Sud e isole", "toast:Genera link sviluppo rete (solo admin)", "blu"), voce("rete", "Capiarea", "9", null, "blu"), voce("rete", "Agenti", "42", null, "blu"), voce("rete", "Sub-agenti", "117", null, "blu"), voce("utente", "Segnalatori privati", "380", null, "blu")])}<div style="height:12px"></div><div class="griglia2">${num("3.120 €", "Provvigioni del mese")}${num("61", "Segnalazioni partite", "verde")}</div><div style="height:12px"></div>${lista([voce("rete", "Francesca · Roma", "23 clienti · 1.240 €", null, "blu"), voce("rete", "Marta · Roma", "6 clienti · 310 €", null, "blu")])}</div>` });
  V.gc = () => ({ t: "Cantieri AncheCasa", h: `<div class="pad">${D.cantieri.map((c) => `<div class="card tap" data-go="gc-dett"><div class="riga"><div class="cresci"><b>${c.nome}</b><small>${c.tipo}</small></div>${stato(c.stato, c.av + "%")}</div></div>`).join("")}</div>` });
  V["gc-dett"] = () => ({ t: "Via Garibaldi 12", back: true, h: `<div class="pad">${lista([voce("utente", "Cliente", "Giulia · app del cantiere attiva", null, "blu"), voce("gru", "Impresa partner", "Bianchi Costruzioni", null, "blu"), voce("utente", "Referente", "Luca", null, "blu"), voce("euro", "Conto dedicato", "13.200 € incassati · 9.000 € girati all'impresa", null, "verde"), voce("scudo", "Fideiussione", "Attiva fino al 2027", null, "verde"), voce("doc", "SAL 3", "In attesa dell'approvazione del cliente", null, "giallo")])}</div>` });
  V["ad-segn"] = () => ({ t: "Segnalazioni", h: `<div class="pad">${lista([voce("casa", "Cliente · Via Ostiense", "Ritardo nella posa", "toast:Assegnata al referente", "giallo", stato("giallo", "Aperta")), voce("casco", "Lavoratore · Scuola Rodari", "Parapetto mancante (anonima)", "toast:Inviata al coordinatore", "rosso", stato("rosso", "Urgente")), voce("utente", "Utente · bacheca", "Annuncio sospetto", "toast:Annuncio nascosto", "blu", stato("blu", "Da vedere"))])}</div>` });
  V.economia = () => ({ t: "Economia", h: `<div class="pad"><div class="griglia2">${num("21.480 €", "Incassi del mese")}${num("3.120 €", "Provvigioni agenti")}${num("640 €", "30% alle aziende")}${num("9.800 €", "Corsi e servizi")}</div><div style="height:14px"></div>
    ${sez("Per modulo", lista(D.moduli.filter((m) => !m.incluso).map((m) => voce(m.ico, m.nome, "attivi: esempio", null, "blu"))))}</div>` });

  // ---- listino corsi e servizi AncheSicura (per tutti)
  V["corsi-listino"] = () => ({ t: "Corsi e servizi AncheSicura", back: true, h: `<div class="pad"><div style="text-align:center;margin-bottom:12px"><img src="assets/anchesicura.png" alt="AncheSicura" style="height:34px"></div>
    <p class="sotto">Prezzi per persona, IVA esclusa. Bozza da confermare.</p>
    ${sez("Corsi", lista(D.corsi.map((c) => voce("corso", c.nome, c.modo + (c.mercato ? ` · mercato ${c.mercato} €` : ""), "toast:Aggiunto alla richiesta", c.modo === "Aula" ? "blu" : "", `<span class="prezzo">${c.prezzo} €</span>`))))}
    ${sez("Servizi", lista(D.servizi.map((s) => voce("scudo", s.nome, s.da ? "a partire da" : "", "toast:Richiesta inviata", "blu", `<span class="prezzo">${eur(s.prezzo)}</span>`))))}</div>` });


  /* ---------- motore ---------- */
  const app = $("#app");
  function render() {
    const prof = PROFILI[S.profilo];
    if (!prof) return ingresso();
    const cur = S.storia[S.storia.length - 1];
    const f = V[cur] || V[prof.tabs[0][0]];
    const v = f();
    const back = S.storia.length > 1 && (v.back || !prof.tabs.some((t) => t[0] === cur));
    app.innerHTML = `<div class="esempio">Prototipo · dati di esempio</div>
      <div class="alto">${back ? `<button class="indietro" data-az="indietro" aria-label="Indietro">${I.indietro}</button>` : ""}${v.logo ? `<img class="logo" src="assets/logo-colore.png" alt="AncheCasa">` : ""}<div class="tit">${v.t}</div>
      <button class="chip-profilo" data-go="profilo">${prof.corto}</button><button class="campana" data-go="notifiche" aria-label="Notifiche">${I.campana}<i></i></button></div>
      <div class="schermo" id="schermo">${v.h}</div>
      <nav class="basso">${prof.tabs.map((t) => `<button class="${t[3] ? "piu" : ""} ${cur === t[0] ? "on" : ""}" data-tab="${t[0]}">${t[3] ? `<span class="tondo">${I[t[1]]}</span>` : I[t[1]]}<span>${t[2]}</span></button>`).join("")}</nav>`;
  }
  function ingresso() {
    app.innerHTML = `<div class="schermo"><div class="ingresso"><img class="logo" src="assets/logo-colore.png" alt="AncheCasa · Costruiamo fiducia">
      <h1>Un'app sola per la casa e per il lavoro.</h1><p>Scegli chi sei e prova l'app. È un prototipo: i dati sono di esempio.</p>
      ${lista(Object.keys(PROFILI).map((k) => voce(k === "admin" ? "grafico" : k === "operatore" ? "casco" : k === "agente" || k === "sviluppo" || k === "capoarea" || k === "subagente" ? "rete" : k === "consulente" ? "scudo" : k === "partner" ? "gru" : k === "fornitore" ? "box" : k === "artigiano" ? "kit" : k === "azienda" ? "ufficio" : k === "cliente" ? "casa" : "utente", PROFILI[k].nome, PROFILI[k].desc, "profilo:" + k, k === "admin" ? "blu" : "")))}</div></div>`;
  }
  function vai(r) {
    if (r.indexOf("toast:") === 0) return toast(r.slice(6));
    if (r.indexOf("profilo:") === 0) { S.profilo = r.slice(8); S.storia = [PROFILI[S.profilo].tabs[0][0]]; render(); return; }
    if (D.moduli.some((m) => m.id === r) && S.profilo === "azienda" && !S.attivi[r]) return foglioModulo(r);
    S.storia.push(r); render(); $("#schermo") && ($("#schermo").scrollTop = 0);
  }
  function toast(t) {
    const old = $(".toast"); if (old) old.remove();
    const d = document.createElement("div"); d.className = "toast"; d.textContent = t; app.appendChild(d); setTimeout(() => d.remove(), 2600);
  }
  function foglioModulo(id) {
    const m = D.moduli.find((x) => x.id === id);
    const v = document.createElement("div"); v.className = "velo";
    v.innerHTML = `<div class="foglio"><div class="maniglia"></div><h2>${m.nome}</h2><p class="sotto">${m.desc}</p><p class="prezzo">${m.prezzo} € <small>al mese, pagamento annuale</small></p>${btn("Attiva " + m.nome, "attiva:" + id)}<div style="height:8px"></div>${btn("Non ora", "chiudi", "chiaro")}</div>`;
    app.appendChild(v);
  }
  document.addEventListener("click", (e) => {
    const velo = e.target.classList && e.target.classList.contains("velo") ? e.target : null;
    if (velo) return velo.remove();
    const t = e.target.closest("[data-go],[data-az],[data-tab]"); if (!t) return;
    if (t.dataset.tab) { S.storia = [t.dataset.tab]; render(); return; }
    if (t.dataset.go) return vai(t.dataset.go);
    const a = t.dataset.az;
    if (a === "indietro") { S.storia.pop(); render(); return; }
    if (a === "esci") { S.profilo = null; S.storia = []; render(); return; }
    if (a === "chiudi") { const v = $(".velo"); v && v.remove(); return; }
    if (a.indexOf("go:") === 0) return vai(a.slice(3));
    if (a.indexOf("attiva:") === 0) {
      const id = a.slice(7); const v = $(".velo"); v && v.remove();
      if (id === "tutti") D.moduli.forEach((m) => (S.attivi[m.id] = true)); else S.attivi[id] = true;
      render(); toast(id === "tutti" ? "Pacchetto Impresa completa attivo" : "Modulo attivato"); return;
    }
    if (a.indexOf("toast:") === 0) return toast(a.slice(6));
  });
  window.__AC = { vai, S, render, PROFILI };
  render();
})();
