# AncheCasa · cartella pulita

Sito ufficiale www.anchecasa.it (cartella `sito`, progetto Vercel anchecasa-pulito), area privata, mail, marchio, sicura.

## Regola fissa: registro delle modifiche

Ogni modifica a questo progetto, fatta da Claude, da Cursor o da una persona, va annotata qui sotto nel **Registro delle modifiche**, prima di chiudere il lavoro.

- Una voce per ogni intervento, la più recente in alto.
- Formato: data e ora (Europe/Rome), chi l'ha fatta, cosa è cambiato, quali file.
- Se si annulla qualcosa, si annota anche l'annullamento.
- Questo file non si cancella e non si sposta: resta nella cartella principale del progetto.

## Registro delle modifiche

### 2026-10-09 16:57 · Cursor
- Commit `bad3db7cb6df38577d9568e67fcd73bd401f2879` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: pagine grandi sul telefono con testata, Check Bollette con Analizza, copertina leggibile, statistiche e pagina admin». In questo commit sono cambiati solo i file del Magazine e `CLAUDE.md`.
- Pubblicato https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_BxoA7TD7kDueTabrYEPKGRpni2Mq`, alias https://anchecasa.it). Il push da solo non avvia Vercel.
- Controllato https://anchecasa.it/magazine (da /magazine.html) a 390×844. css `?v=36`, js `?v=34`. La testata del sito è visibile (55 px, logo 30 px). La pagina occupa il 99% della larghezza. La capsula dei pulsanti sta sotto la pagina e non copre «Scarica il report PDF» (pagina 8). Copertina con la famiglia, «83 giorni» e i richiami in basso.
- File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html`, `CLAUDE.md`.

### 2026-10-09 ~18:15 · Claude — Telefono: torna la testata, pagine grandi quanto lo schermo (NON ancora pubblicato)
- Sul telefono la testata del sito è di nuovo visibile, ma più sottile (54 px, logo 30 px).
  - La capsula dei pulsanti sta subito SOTTO la pagina, non sopra: non copre più pulsanti come "Scarica il report PDF".
- Pagina singola con altezza variabile (`altezzaSingola()` in magazine.js): da 640 a 760 unità di disegno, in base allo schermo; larghezza di disegno sempre 400.
  - La pagina passa da circa il 76% al 86-99% della larghezza del telefono.
  - Al cambio di altezza si ricostruisce.
- `adattaFoto()`: se la pagina è più corta di 740, la foto in alto di ogni pagina si accorcia della stessa misura (minimo 120 px), così i testi restano interi.
  - Classe `.mg-corto` (altezza < 700): Check Bollette senza sottotitolo e passi, editoriale con titolo più piccolo, pagina 7 senza la nota sulle proporzioni.
- Copertina sul telefono: richiami in fondo, più compatti, colonna al 47%: volti liberi.
- Controllo automatico di tutte le pagine (PC, telefono, telefono piccolo): nessun testo tagliato. Versioni css v=36, js v=34.

### 2026-10-09 16:33 · Cursor
- Commit `a277a364d0cfbfc8d2742d1e1203449ae39edcdd` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: copertina leggibile, Check Bollette con Analizza, rifinitura pagine, schermo pieno sul telefono, pulsanti in vetro, statistiche e pagina admin». In questo commit sono cambiati solo i file del Magazine e `CLAUDE.md`: area privata e migrazione erano già nel commit precedente.
- Pubblicato https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_Epo8ApgpFBcqCGj2GSwsYnyPfZwN`, alias https://anchecasa.it). Il push da solo non avvia Vercel.
- Controllato https://anchecasa.it/magazine (da /magazine.html). css `?v=33`, js `?v=31`.
  - PC (1280×800): barra del sito visibile, rivista a due pagine. Check Bollette, pagine 7–8: a campi vuoti «Analizza» dice che mancano totale e consumo; con 182,40 € e 420 kWh il badge diventa «Il tuo risultato» e il PDF si accende.
  - Telefono (390×844): barra del sito nascosta, copertina con la famiglia e i richiami in basso («83 giorni», Energia, Cantiere, Tendenze), capsula in vetro in basso (Home, Indietro, Condividi, Avanti, Schermo intero).
- File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html`, `CLAUDE.md`.

### 2026-10-09 ~17:55 · Claude — Copertina leggibile, rifinitura pagine, Check Bollette con "Analizza" (NON ancora pubblicato)
- Copertina: torna la disposizione di prima (richiami in basso).
  - Leggibilità con ombre sottili sotto le lettere e un alone morbido solo dietro i blocchi di testo; sfumature generali alleggerite su richiesta ("non esagerare con lo scuro").
  - Telefono: foto spostata a destra (object-position 4%) e colonna dei richiami al 51%, così i volti restano liberi.
- Rifinitura pagine:
  - editoriale con "In questo numero" (3 voci cliccabili: pag. 8, 4, 2) e foto più bassa;
  - sillabazione italiana (hyphens) nei testi giustificati;
  - su PC foto più alte a pagina 11-12 (330 px) e 15-16 (370 px);
  - telefono: pagina 7 e 12 senza righe tagliate, piè di pagina con il solo numero sotto la capsula.
- Check Bollette:
  - tolto il riquadro nero "Esempio" che copriva i grafici: ora c'è una riga leggera sopra i grafici ("Esempio · Scrivi totale e consumo qui sopra e premi Analizza");
  - i campi vuoti sono bianchi con bordo arancio che pulsa piano e la scritta "Scrivi qui";
  - nuovo pulsante "Analizza" accanto a periodo e persone: prima mostra l'esempio, dopo il risultato vero (badge "Il tuo risultato", riga "La tua bolletta: …"), poi si aggiorna mentre si correggono i dati;
  - se manca un dato lo dice e scuote il campo; esempio meno sbiadito (opacity .78).
- Controllo automatico di tutte le pagine (PC, telefono, telefono piccolo): nessun testo tagliato. La "A–Z" del glossario è solo decorazione.
- Versioni css v=33, js v=31.

### 2026-10-09 16:22 · Cursor
- Commit `6dc156268aefae81b99b3249857ebd4d33bb2223` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: statistiche anonime e pagina admin Magazine, schermo pieno sul telefono, pulsanti in vetro, copertina con bambino, Check Bollette con grafici, retro solo app raccolta».
- Pubblicato https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_HbiYZWxy3ZeKtJ7QMvjSxKRRgFSL`, alias https://anchecasa.it). Il push da solo non avvia Vercel. L’area privata non è stata ripubblicata in questo intervento.
- GET https://anchecasa.it/api/mag risponde 405 con `{"error":"metodo_non_ammesso"}`.
- Controllato https://anchecasa.it/magazine (da /magazine.html) a 390×844. La barra del sito è nascosta, la rivista occupa lo schermo, in basso c’è la capsula in vetro (Home, Indietro, Condividi, Avanti, Schermo intero). Copertina con il bambino e «83». css `?v=30`, js `?v=29`.
- La migrazione `supabase/migrations/20261009170000_magazine_statistiche.sql` è nel commit e resta da applicare su Supabase.
- File: `sito/` (tra cui `sito/api/mag.js`, `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html`), `area-privata/dashboard/` (tra cui `js/magazine-admin.js` e `css/magazine-admin.css`), `supabase/migrations/20261009170000_magazine_statistiche.sql`, `CLAUDE.md`.

### 2026-10-09 ~17:10 · Claude — Rivista a schermo pieno sul telefono + pulsanti in vetro quasi invisibile (NON ancora pubblicato)
- Telefono (larghezza < 700 px o altezza < 520 px): `magazine.js` mette `body.mg-phone`.
  - La testata del sito sparisce e la rivista prende tutta l'altezza.
  - I pulsanti diventano una capsula in vetro sopra il fondo della pagina: Home, indietro, condividi, avanti e, solo dove il browser lo permette (Android/PC, non iPhone), "schermo intero" (Fullscreen API).
- `magazine.html`: theme-color scuro (#141c28) e meta per "Aggiungi a Home". Su iPhone lo schermo pieno vero si ha solo da lì: Safari non permette ai siti di nascondere la barra.
- Copertina sul telefono: "83 giorni" alzato sopra la capsula, slogan nascosto.
- Tutti i pulsanti (PC e telefono) ora sono in vetro quasi invisibile: velo trasparente, bordo sottile, frecce e icone bianche, niente cerchi arancioni pieni.
- Versioni css v=30, js v=29.

### 2026-10-09 ~16:45 · Claude — Statistiche del Magazine + pagina "Magazine" nel pannello admin (NON ancora pubblicato)
- `sito/js/magazine.js`: conteggio anonimo (modulo STAT, in alto nel file) di apertura, pagine viste, Check Bollette usato, report PDF, «Confronta offerte», condivisioni per canale e iscrizioni agli avvisi.
  - Niente cookie: c'è solo un codice casuale in sessionStorage. Conta solo su anchecasa.it; per provare altrove si usa `?stat=prova`.
  - I link condivisi portano `?da=whatsapp|facebook|telegram|email|link|condiviso`, così si vede da dove arrivano i lettori.
  - Il modulo "Avvisami" ora scrive tramite `/api/mag`.
- NUOVO `sito/api/mag.js`: funzione Vercel. Aggiunge città, regione e paese dalle intestazioni Vercel (l'IP non viene salvato) e scrive su Supabase con la chiave pubblica.
  - Gli iscritti vanno in `magazine_iscritti`; se la tabella non c'è ancora vanno in `richieste_iscrizione`, come prima.
- NUOVO `supabase/migrations/20261009170000_magazine_statistiche.sql`, DA APPLICARE DAL TECNICO:
  - tabelle `marketplace.magazine_eventi` e `marketplace.magazine_iscritti`, con RLS (scrivere: tutti, solo INSERT; leggere: solo admin);
  - funzioni `magazine_e_admin()` e `magazine_riepilogo(p_dal, p_numero)`;
  - provato su Postgres 16 locale: si può rilanciare e i permessi sono verificati.
- Area privata, dashboard admin: nuova voce "Magazine" (`app.js`, navItems admin), NUOVI `js/magazine-admin.js` e `css/magazine-admin.css`, caricati in `index.html`.
  - Mostra: lettori, pagine a testa, % fino al retro, Check Bollette, condivisioni, iscritti, % da telefono, lettori al giorno, provenienza, fino a dove leggono pagina per pagina, città, azioni, canali, dispositivi, elenco iscritti con ricerca e "Scarica per Excel" (CSV).
  - Anteprima: `?demo=admin#/admin/magazine`.
  - A ogni nuovo numero aggiornare `PAGINE_N1` in magazine-admin.js.
- `views.js` (Iscrizioni dal sito): le righe con `dati.modulo = "magazine-avvisi"` non compaiono più lì; si vedono in Magazine.
- File dell'area privata salvati con CRLF come gli altri.

### 2026-10-09 16:06 · Cursor
- Commit `96b3a06853ea927ec0141a58426b88e31e6d3805` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: copertina con bambino, Check Bollette con grafici dal vivo, retro solo app raccolta, pagina 2 con app nel telefono, pulsante Condividi, date ottobre/novembre, report bollette senza dati societari».
- Pubblicato https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_6YbpePDXn2jgM9mFaCvVDchzPaz8`, alias https://anchecasa.it). Il push da solo non avvia Vercel.
- Controllato https://anchecasa.it/magazine (da /magazine.html), telefono. Copertina: famiglia con il bambino, richiami in alto a sinistra, «83 giorni» in basso. Pagina 2: telefono con il secchio CARTA e riquadro stasera/domani. Pagina 8: a campi vuoti i grafici sono un esempio («Così vedrai la tua bolletta», badge Esempio, PDF spento); con 182,40 € e 420 kWh il badge diventa «Il tuo risultato», i grafici si aggiornano e «Scarica il report PDF» si accende. Retro: solo «Arriva l’app della raccolta», con «Avvisami quando esce» e «Condividi la rivista». Date «Ottobre 2026» e «1° novembre 2026». css e js `?v=27`. Nel report restano anchecasa.it e info@anchecasa.it, senza Palumbo, P.IVA o REA.
- File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html`, `sito/magazine/numero-1/` (copertina.jpg, copertina-con-bambino-canva.jpg, copertina-senza-bambino.jpg), `CLAUDE.md`.

### 2026-10-09 ~16:35 · Claude — Copertina con il bambino (NON ancora pubblicato)
- `copertina.jpg` sostituita con la stessa foto modificata in Canva: stessa coppia e stesso soggiorno, in più un bambino davanti ai genitori. Originale: `copertina-senza-bambino.jpg`; file scaricato da Canva: `copertina-con-bambino-canva.jpg`.
- Telefono (pagina singola): i tre richiami Energia/Cantiere/Tendenze vanno in alto a sinistra sul muro e "83 giorni" resta in basso, così il volto del bambino resta libero. PC invariato. Testo alternativo aggiornato ("Una famiglia…"). Versioni css/js v=27.

### 2026-10-09 ~16:20 · Claude — Check Bollette su una schermata con grafici dal vivo + retro solo app raccolta (NON ancora pubblicato)
- Pagina 8, Check Bollette: tornato al layout della prima versione, su una sola schermata.
  - Striscia con i 3 passi "Luce o gas → Totale e consumo → Risultato e PDF".
  - Campi vuoti; periodo e persone sono menu con valori di partenza "2 mesi" e "3".
  - Sotto, i grafici: lancetta del prezzo, barre "Tu / Famiglia tipo" sul consumo annuo, spesa annua e risparmio, più i due giudizi.
  - A campi vuoti i grafici mostrano un ESEMPIO sbiadito (210 € / 420 kWh, paga il 15% in più) con l'etichetta "Così vedrai la tua bolletta". Scrivendo i propri numeri i grafici si colorano e il badge passa a "Il tuo risultato".
  - Il PDF parte solo con i dati veri.
  - Nel codice: `calcolaBolletta()` restituisce `esempio`/`manca`; `aggiornaBolletta()` e `initBolletta()` sono riscritti; `creaPdf()` non è toccata. Copia della versione precedente: /home/claude/magazine.pre-cb.js (solo sessione).
- Retro: "Nel numero 2" parla solo dell'app della raccolta (tolti calcolatore bonus, muffa e fotovoltaico). Pulsanti "Avvisami quando esce" (porta a pagina 2) e "Condividi la rivista".
- Versioni css/js v=26.

### 2026-10-09 15:37 · Cursor
- Commit `43cf32e411940bafe27dbcba201f77348264a9bd` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: pagina 2 con secchio nel telefono e riquadro stasera/domani, pulsante Condividi, anteprima WhatsApp/Facebook». La foto originale Canva era già nel commit precedente e non è cambiata.
- Pubblicato https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_54jMsFC8SwdhB3EUaz1NFo323zVv`, alias https://anchecasa.it). Il push da solo non avvia Vercel.
- Controllato https://anchecasa.it/magazine (da /magazine.html): pagina 2 «Cosa porto fuori stasera?», telefono con il secchio CARTA, riquadro Comune di Bergamo con Stasera (carta e cartone, 20:00–24:00) e Domani (plastica e metalli), pulsante Condividi tra Indietro e Avanti. Il pannello elenca WhatsApp, Facebook, Telegram, Email e Copia link. css e js `?v=24`. Anteprima: og:image assoluto sulla copertina.
- File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html`, `sito/magazine/numero-1/rifiuti-casa.jpg`, `CLAUDE.md`.

### 2026-10-09 ~16:00 · Claude — Magazine: telefono pagina 2 rifatto + pulsante Condividi (NON ancora pubblicato)
- `rifiuti-casa.jpg`: il telefono adesso mostra un grande secchio blu con "STASERA · CARTA · 20:00–24:00", applicato dritto sullo schermo e leggibile da lontano.
- Pagina 2: torna il riquadro trasparente sulla foto: "Comune di Bergamo · Stasera: Carta e cartone, dalle 20:00 alle 24:00 · Domani: Plastica e metalli".
- Condividi: pulsante tondo in vetro tra Indietro e Avanti. Sul telefono apre il menu di condivisione del sistema; sul PC apre un pannello con WhatsApp, Facebook, Telegram, Email e Copia link. Sul retro c'è il pulsante "Ti è piaciuta? Condividila". Codice in fondo a `js/magazine.js`, stile in fondo a `css/magazine.css`.
- `magazine.html`: og:image e og:url assoluti (https://anchecasa.it/...) e twitter:card, per l'anteprima con copertina su WhatsApp e Facebook. Versioni css/js v=24.

### 2026-10-09 15:32 · Cursor
- Commit `0d482d60c1eb3205a1e58af7254853de20ff6da6` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: pagina 2 'Cosa porto fuori stasera?' con app nel telefono, date ottobre/novembre, report bollette senza dati societari».
- Il push non ha fatto partire Vercel da solo. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito` in produzione. Deployment `dpl_FePsT4V2qwnVstzw3ty7f6JrtVvw`, stato Ready, indirizzo https://anchecasa.it.
- Controllo su https://anchecasa.it/magazine.html (si apre come /magazine). Titolo «AncheCasa Magazine · N. 1 · Ottobre 2026». Pagina 2: «Cosa porto fuori stasera?», foto della cucina con i contenitori e l’app nel telefono, barra «Avvisami gratis quando esce». In basso «Indietro» e «Avanti». Il file online è `magazine.js?v=22`: date «Ottobre 2026» e «1° novembre 2026», niente Palumbo né P.IVA nel report. La foto `rifiuti-casa.jpg` risponde.
- File: `CLAUDE.md`.

### 2026-10-09 ~15:45 · Claude — Magazine pagina 2 rifatta: "Cosa porto fuori stasera?" (NON ancora pubblicato)
- Nuova foto `sito/magazine/numero-1/rifiuti-casa.jpg`: donna in una cucina moderna con quattro contenitori di design per la differenziata. Nel telefono è stata inserita la schermata vera dell'app AncheCasa ("Stasera porta fuori la carta", Bergamo, esponi 20–24). L'originale Canva è `rifiuti-casa-originale-canva.jpg`.
- Pagina a tutta foto: titolo navy sul muro a sinistra; la barra in vetro "Avvisami gratis quando esce" è compatta in basso a destra e si apre al tocco.
- Versioni css/js v=22. Questa scrittura include anche le date (Ottobre 2026, dal 1° novembre ogni 15 giorni) e il report bollette senza dati societari, che nella scrittura delle 15:20 non erano arrivati sul PC.
- La vecchia foto `rifiuti.jpg` non è più usata.

### 2026-10-09 15:20 · Cursor
- Commit `fc6ef42a0d706d9b89c8b096aba93dbed8acc9d0` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: pagina 2 raccolta, pulsanti vetro, date ottobre/novembre, report bollette senza dati societari».
- Il push non ha fatto partire Vercel da solo. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito` in produzione. Deployment `dpl_TfR6ii8r5tTCi59pHTbhJGE3DpxY`, stato Ready, indirizzo https://anchecasa.it.
- Controllo su https://anchecasa.it/magazine.html (si apre come /magazine). Online: pulsanti «Indietro» e «Avanti» con classe vetro, pagina 2 «La raccolta, senza pensieri» e barra «Avvisami gratis quando esce». La pagina carica `magazine.css?v=20` e `magazine.js?v=19`.
- Nel file pubblicato le date sono ancora «9 ottobre 2026» e «23 ottobre 2026», e il report PDF ha ancora Palumbo Investment, indirizzo, P.IVA e REA. Quei due punti del messaggio di commit non sono nel codice di `sito/js/magazine.js`.
- File: `CLAUDE.md`.

### 2026-10-09 ~15:20 · Claude — Magazine: pagina 2, pulsanti vetro, date, report bollette (NON ancora pubblicato)
- `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html` (css v=20, js v=20). Copia di sicurezza: `_copie-magazine-1520/`.
- Pagina 2 "La raccolta, senza pensieri": titolo e testo in una fascia blu sopra la foto (il volto resta libero); modulo "Avvisami gratis" ridotto a una barra in vetro che si apre solo al tocco.
- Pulsanti Indietro/Avanti: effetto vetro con frecce arancio nei cerchi, stile brand.
- Date: tolto "9 ottobre". Ora "N. 1 · Ottobre 2026 · Il primo numero"; prossimo numero 1° novembre 2026, poi ogni 15 giorni (NUMERO in magazine.js).
- Report PDF Check Bollette: tolti ragione sociale, indirizzo, P.IVA e REA. Restano solo anchecasa.it, info@anchecasa.it e "© anno AncheCasa".

### 2026-10-09 15:06 · Cursor
- Commit `e31e443db6ea53b408b2fc771169a95540c70161` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: pagina della raccolta e soli tasti Indietro e Avanti».
- Cartella `sito` pubblicata sul progetto Vercel `anchecasa-pulito` in produzione. Deployment `dpl_d8uCDhg9B2AzFhAQqF5ozr1DZ3QK`, indirizzo https://anchecasa.it.
- Controllo su https://anchecasa.it/magazine. Da computer (1280 px) e da telefono (390 px): sotto la rivista ci sono solo «‹ Indietro» e «Avanti ›». Pagina 2 è «La raccolta, senza pensieri», con la foto `rifiuti.jpg` (1024×1536) e il modulo «Avvisami quando esce». Pagina 8, Check Bollette: campi vuoti, «Verifica la mia bolletta» spento.
- Prova del modulo da anchecasa.it: mail prova-magazine-avvisi@anchecasa.it, Comune Roma. Supabase ha risposto 201 e il sito ha scritto «Fatto!». Riga in `marketplace.richieste_iscrizione`, famiglia «privato», dati.modulo «magazine-avvisi». La lettura dell’elenco da qui è negata (manca il permesso di lettura), come per le prove precedenti.
- File del Magazine non modificati in questo intervento. File annotato: `CLAUDE.md`.

### 2026-10-09 14:55 · Cursor
- Commit `d2de8d7689cf06b92de6ae02c66c546efadcab29` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Magazine: Check Bollette come modulo guidato (campi vuoti, 3 passi, risultato dopo la verifica)».
- Cartella `sito` pubblicata sul progetto Vercel `anchecasa-pulito` in produzione. Deployment `dpl_AEnpmpYaa5U28pzhpwwxUvVANs6T`, indirizzo https://anchecasa.it.
- Controllo su https://anchecasa.it/magazine. Da computer (1280 px, pagine 7–8) e da telefono (390 px, pagina 8): il tasto «Verifica la tua bolletta» in copertina apre lo strumento. I campi sono vuoti. «Verifica la mia bolletta» resta spento finché mancano i dati. Con totale 182,40, consumo 420, 2 mesi e 3 persone compare «Il risultato della tua bolletta», con «‹ Cambia i dati» e «Scarica il report PDF». Il file scaricato è `AncheCasa-report-bolletta-luce.pdf`.
- Al controllo la pagina online carica `js/magazine.js?v=18` e `css/magazine.css?v=19`.
- File: `CLAUDE.md`.

### 2026-10-09 14:53 · Cursor
- Pubblicato su https://anchecasa.it il report PDF «Check Bollette» del Magazine, su carta intestata AncheCasa. Progetto Vercel `anchecasa-pulito`, deployment `dpl_8d6nko4QFYhhuRDVbDwZBv7Y8Awk` (https://anchecasa-pulito-i779i2vav-anchecasas-projects.vercel.app).
- Provato in locale e poi sul sito: Magazine, pagina 8, «Verifica la mia bolletta» e «Scarica il report PDF», sia Luce sia Gas. File scaricati: `AncheCasa-report-bolletta-luce.pdf` e `AncheCasa-report-bolletta-gas.pdf`. Logo AncheCasa a colori in alto a sinistra (`sito/assets/logo-colore.png`), dati di Palumbo Investment S.r.l., fascia blu con numero AC-CB-data-ora, testi dentro i riquadri, piè di pagina «Pag. 1 di 1». jsPDF 2.5.1 da cdnjs. Resta la funzione nuova (commento «Report PDF su carta intestata AncheCasa»), non quella vecchia in Times.
- La pagina online carica `js/magazine.js?v=18`. Con questo invio è andato online anche il resto della cartella `sito` già pronto in locale: la pagina «La raccolta, senza pensieri», i due pulsanti Indietro e Avanti (`css/magazine.css?v=19`) e la barra del sito in `css/ac.css`.
- File: `sito/magazine.html`, `sito/js/magazine.js`, `CLAUDE.md`.

### 2026-10-09 14:52 · Claude
- Magazine, pagina 2: sostituita l'anteprima con la foto vera scaricata da Canva (1024×1536), rinominata `sito/magazine/numero-1/rifiuti.jpg`.
- NON ancora pubblicato su anchecasa.it.

### 2026-10-09 15:05 · Claude
- Magazine, vista: sotto la rivista solo due pulsanti, «‹ Indietro» e «Avanti ›», stesso arancio (tolti contatore pagine, Sommario, schermo intero, suggerimento). La rivista si ingrandisce fino a riempire lo spazio sotto la barra del sito (limite di zoom da 1,25 a 1,8 su computer). La barra del sito resta (scelta delle 13:21).
- Magazine, pagina 2: tolto il sommario. Al suo posto «In arrivo · con il numero 2 — La raccolta, senza pensieri»: l'app gratuita AncheCasa per la raccolta dei rifiuti collegata al calendario del Comune (cosa, che giorno, a che ora, avviso la sera prima), foto a tutta pagina (`sito/magazine/numero-1/rifiuti.jpg`, per ora anteprima piccola: sostituire con la foto Canva MAHXhLtH70Y) e modulo «Avvisami quando esce» (mail, Comune, spunta privacy).
- Il modulo scrive in `marketplace.richieste_iscrizione` come gli altri moduli del sito: famiglia «privato», dati.modulo «magazine-avvisi» (Mail, Comune, Interesse, Numero, Privacy). Fuori da anchecasa.it (anteprime) non scrive nel database.
- Retro: «L'app gratuita per la raccolta dei rifiuti» è la prima voce di «Nel numero 2».
- File: `sito/js/magazine.js` (`?v=18`), `sito/css/magazine.css` (`?v=19`), `sito/magazine.html`, `sito/magazine/numero-1/rifiuti.jpg`. Copia di prima: `_copie-magazine-1435` (+ le versioni intermedie annotate sopra).
- NON ancora pubblicato su anchecasa.it.

### 2026-10-09 14:45 · Claude
- anchecasa.it, barra in alto: il logo AncheCasa non si schiaccia più (tra 961 e 1180 px si riduceva fino a sparire). Il menu passa alle tre righe sotto i 1180 px (prima 960), perché il menu intero non sta nella barra sotto ~1160 px.
- File: solo `sito/css/ac.css` (le due soglie 960 → 1180 e tre righe in fondo). Copia di prima: `_copie-sito-header-1437`. Il file coincide con il ac.css online (deploy dpl_4V4EPDEnw75Q69oU9S8jF4UMjs9x) più queste righe.
- NON ancora pubblicato. Attenzione: `sito/magazine.html` e `sito/js/magazine.js` locali sono diversi da quelli online (PDF Check Bollette delle 13:37, mai pubblicato): con PUBBLICA-SITO-VERCEL.bat va online anche quello. Nel deploy online ci sono anche i file `.wrangler/cache/*`, che non servono al sito: da escludere.

### 2026-10-09 14:50 · Claude
- Magazine, Check Bollette (pag. 8) rifatto come modulo guidato, perché sembrava già compilato: campi VUOTI con esempio solo come suggerimento grigio; 3 passi numerati (1 Luce o Gas, 2 «Copia due numeri dalla bolletta» con indicazione di dove trovarli, 3 mesi della bolletta e persone in casa a pulsanti); barra «2 di 4 dati · manca il consumo»; il pulsante «Verifica la mia bolletta» si attiva solo a dati completi.
- Il risultato si apre in una seconda schermata («Il risultato della tua bolletta», tasto «‹ Cambia i dati») con contatore, cifre, giudizi, «Scarica il report PDF» e «Confronta offerte». «Prova con un esempio» resta come link facoltativo e il risultato porta l'etichetta ESEMPIO.
- Accetta numeri con la virgola (182,40). Corretto «il 11%» in «l'11%».
- Ripristinata la variabile `PARTNER_ENERGIA = { nome, url }`: se compilata, il secondo pulsante porta all'azienda luce e gas partner.
- Report PDF, copertina e altre pagine NON toccati.
- File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html` (versioni `?v=16` e `?v=18`). Copia di prima: `_copie-magazine-1435`.
- NON ancora pubblicato su anchecasa.it.

### 2026-10-09 14:32 · Claude
- AncheSicura, barra in alto: tolto il pulsante «AncheCasa» accanto a «Chiedi un'offerta» (ai link verso anchecasa.it pensa il piè di pagina). Con lo spazio liberato il menu intero sta nella barra fino a 1181 px: il passaggio alle tre righe torna sotto i 1180 px (era stato alzato a 1320 alle 14:25).
- File: le 9 pagine HTML (riga del pulsante tolta, `sicura.css?v=` +1) e `css/sicura.css` (solo la soglia), in `sicura-DA-CARICARE-SU-CLOUDFLARE` e `sicura-nuovo`. La regola `.verso-casa` resta nel CSS, inutilizzata. Copia di prima: `_copie-sicura-menu-1427`.
- NON ancora pubblicato su Cloudflare.

### 2026-10-09 14:25 · Claude
- AncheSicura, barra in alto: tolto il logo AncheSicura, al suo posto il logo AncheCasa (`assets/anchecasa-colore.png`, identico a `sito/assets/logo-colore.png`). Stessa altezza di anchecasa.it: barra 77 px, logo 46 px da computer e 36 px da telefono (tolta la regola che lo teneva a 36 px ovunque).
- Il logo non si schiaccia più: `.testata .marchio` non si restringe (prima, con il menu lungo, il logo veniva compresso in larghezza e risultava deformato). Il menu passa alle tre righe sotto i 1320 px (prima 1200) perché logo intero e 8 voci non stavano nella barra tra 1200 e 1290 px.
- File: le 9 pagine HTML (solo il logo e `sicura.css?v=` +1) e `css/sicura.css`, sia in `sicura-DA-CARICARE-SU-CLOUDFLARE` sia in `sicura-nuovo`. `sicura-nuovo/genera.py` NON è allineato (era già indietro rispetto alla modifica Cursor delle 12:57). Copia di prima: `_copie-sicura-header-1419`.
- NON ancora pubblicato su Cloudflare.

### 2026-10-09 14:18 · Cursor
- Aggiornato Vercel: pubblicato https://anchecasa.it, progetto `anchecasa-pulito` (deployment `dpl_4V4EPDEnw75Q69oU9S8jF4UMjs9x`). Con questo invio è andato online anche il report PDF di Check Bollette su carta intestata, che alle 13:37 era ancora da pubblicare.
- Aggiornato Cloudflare Pages: pubblicato https://sicura.anchecasa.it, progetto «sicura», ramo main, deployment `df91a1c4` (https://df91a1c4.sicura-212.pages.dev). Stessi file di `sicura-DA-CARICARE-SU-CLOUDFLARE`, senza `LEGGIMI.txt`.
- Supabase non aggiornato: il token della CLI non è più valido e da qui il login automatico non parte. La migrazione `supabase/migrations/20261009100000_energia_offerte_proposte.sql` resta da applicare. Anche `app-anchecasa/sql/app-04-rete-italia.sql` resta da eseguire su Supabase.
- File: `CLAUDE.md`.

### 2026-10-09 13:50 · Claude
- App 2.1: nuovo ruolo **Responsabile Rete Italia** (sopra i tre sviluppo rete). Vista sua nell'app: Italia (numeri di tutta la rete e le tre aree), Aree (regione per regione), Clienti, Report recensioni di tutta Italia, Guadagni, Squadra, accordo. Admin: il ruolo compare in Rete e nelle Impostazioni delle provvigioni.
- Nuove quote della rete (decise da Nando il 09.10.2026): chi porta il cliente 70, sviluppo rete 17, capo area 8, Rete Italia 5; cantieri: segnala 10, chiude 25, segue 30, porta l'impresa 10, sviluppo 12, capo area 8, Rete Italia 5.
- File: `app-anchecasa/js/*` (viste-rete, viste-admin, viste-comuni, main, q, db, config), `app-anchecasa/sql/app-04-rete-italia.sql` (da eseguire su Supabase dopo app-03), `sql/prove/04-prove.sql`, `LEGGIMI.md`. Copia di prima: `_copie-app-anchecasa-1343`.
- In `ANCHECASA-LAVORO/file pdf`: presentazione riunione e AncheVoice rifatte (pptx + pdf), 4 contratti con le nuove quote e il nuovo contratto 5 Responsabile Rete Italia (bozza da far controllare). Copia di prima: `ANCHECASA-LAVORO/_copie-file-pdf-09-10-1331`.

### 2026-10-09 13:37 · Claude
- Magazine, report PDF «Check Bollette» rifatto su carta intestata AncheCasa come i contratti: logo AncheCasa a colori e dati di Palumbo Investment in alto, fascia blu con numero del report (AC-CB-data-ora), tre numeri grandi (costo medio, spesa annua, risparmio), contachilometri del prezzo, giudizi Prezzo e Consumi con bollino colorato, barre di confronto con una famiglia simile, dati della bolletta, «Cosa fare adesso», note e piè di pagina «Pag. 1 di 1». Nome del file: AncheCasa-report-bolletta-luce/gas.pdf.
- File: `sito/js/magazine.js` (solo la funzione del PDF, sostituita), `sito/magazine.html` (versione `?v=15`). Copia di prima: `_copie-magazine-1336`. Il logo viene da `sito/assets/logo-colore.png`.
- NON ancora pubblicato. Per Cursor: non rimettere la vecchia funzione `scaricaPdf`.

### 2026-10-09 13:34 · Cursor
- Magazine si apre sempre sulla copertina, da computer, tablet e telefono. Prima tornava all’ultima pagina aperta.
- Con il dito, uno scorrimento a sinistra va avanti e uno a destra torna indietro. Un movimento in verticale non gira la pagina.
- Pubblicato su https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_BNvaT61S47nNyKMEJBXxVSuJc6R6`).
- File: `sito/js/magazine.js` (versione `?v=14`), `sito/css/magazine.css` (versione `?v=17`), `sito/magazine.html`, `CLAUDE.md`.

### 2026-10-09 13:30 · Cursor
- Check Bollette si usa per fare una verifica. In copertina c’è «Verifica la tua bolletta». A pagina 8 la scritta dice di mettere i numeri della propria bolletta e di premere «Verifica la mia bolletta». I numeri di partenza sono un esempio. Dopo la verifica compare il risultato e il tasto diventa «Scarica il report PDF».
- Pubblicato su https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_759orQHCSfXq39d999HVNMWzPmRd`).
- File: `sito/js/magazine.js` (versione `?v=13`), `sito/css/magazine.css` (versione `?v=16`), `sito/magazine.html`, `CLAUDE.md`.

### 2026-10-09 13:21 · Cursor
- Magazine usa la stessa barra del sito: logo AncheCasa, menu (Per la casa, Per le aziende, Lavora con noi, Come funziona, Prezzi, Magazine) e i tasti Accedi e Iscriviti. Prima, aprendo il Magazine, comparivano un altro logo e un altro menu.
- La rivista riempie lo schermo sotto la barra, da computer, tablet e telefono.
- Pubblicato su https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_DAD6TNeYkN6pVV3LGNZaoMcb5qc7`).
- File: `sito/magazine.html`, `sito/css/magazine.css` (versione `?v=13`), `CLAUDE.md`.

### 2026-10-09 13:17 · Cursor
- Magazine si apre a schermo pieno da computer, da tablet e da telefono. Menu e piè di pagina restano nascosti. In alto a sinistra c'è il tasto Home per tornare al sito.
- Pubblicato su https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_72VUqjqaPEAErfAxHiRnBZ89FQnh`).
- File: `sito/css/magazine.css`, `sito/magazine.html` (versione file `?v=12`), `CLAUDE.md`.

### 2026-10-09 13:16 · Cursor
- Magazine nel menu del sito, da computer, tablet e telefono: voce «Magazine» dopo «Prezzi», dentro la barra e dentro il menu che si apre con le tre righe.
- Pubblicato su https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_G5qo4qYgMAmFmuw1NL5WaHHePyWt`). Con questo invio è andato online anche SuperMastro al posto del tasto «Fai il video».
- File: le 42 pagine HTML del menu in `sito/`, `CLAUDE.md`.

### 2026-10-09 13:10 · Cursor
- Al posto del tasto «Fai il video» c'è SuperMastro. In home il tasto e la fascia in alto portano a `/supermastro#usa`. Nella pagina SuperMastro lo strumento è lì: video di 5 secondi, poi problema, spiegazione e artigiano vicino.
- Dopo il video i fotogrammi vanno a `sito/api/supermastro.js` (stessa logica del tecnico: problema, descrizione, mestiere, urgenza, fai da te o avvertenze). La chiave OpenAI resta sul server. Se la chiave manca, dopo il video si conferma cosa si vede e partono spiegazione e ricerca.
- File: `sito/index.html`, `sito/supermastro.html`, `sito/trova.html`, `sito/js/ac.js`, `sito/api/supermastro.js`, `CLAUDE.md`. Da pubblicare su anchecasa.it con `PUBBLICA-SITO-VERCEL.bat`.

### 2026-10-09 12:57 · Cursor
- AncheSicura ha una sola barra: logo AncheSicura, menu (Servizi, Corsi online, App, Settori, Tutta Italia, Chi siamo, Contatti, Entra nella rete) e il tasto AncheCasa che porta a https://www.anchecasa.it/. Da telefono resta il menu a tendina e il tasto AncheCasa. Tolta la seconda barra di AncheCasa.
- Pubblicato su https://sicura.anchecasa.it, progetto Cloudflare Pages «sicura», ramo main, deployment `70aab83b` (https://70aab83b.sicura-212.pages.dev). Senza `LEGGIMI.txt`.
- File: le 9 pagine HTML e `css/sicura.css` in `sicura-DA-CARICARE-SU-CLOUDFLARE` e in `sicura-nuovo`, `CLAUDE.md`.

### 2026-10-09 12:50 · Cursor
- Pubblicato https://anchecasa.it sul progetto Vercel `anchecasa-pulito` (deployment `dpl_ArnCUtxvNvYZa2s7ThRFvyDYBYAS`). Magazine e rimandi delle pagine vecchie non modificati: `/magazine` risponde, `/privato` rimanda a `/come-funziona`.
- Pubblicato https://sicura.anchecasa.it sul progetto Cloudflare Pages «sicura», ramo main, deployment `e6b08c75` (https://e6b08c75.sicura-212.pages.dev). Caricato il contenuto di `sicura-DA-CARICARE-SU-CLOUDFLARE`, senza `LEGGIMI.txt`. In linea c’è la barra di AncheCasa e, sotto, la barra AncheSicura.
- Le copie di prima restano in `_copie-sito-1226` e `_copie-sicura-DA-CARICARE-SU-CLOUDFLARE-1226`.
- File: `CLAUDE.md`. Nessuna pagina modificata in questo intervento.

### 2026-10-09 12:43 · Cursor
- SuperMastro da telefono, pagina Trova artigiano: registra un video di 5 secondi con la fotocamera, poi dice il problema e se si può fare da soli. Se serve un artigiano, elenca i più vicini, con Chiama quando c’è il numero e la scheda su Google Maps.
- Aggiornati i tre passi nella pagina SuperMastro.
- Pubblicato su https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_2FhjJDya5qz9kygVnU3f71bMXPRY`). Con questo invio è andata online anche la grafica preparata alle 12:30 (foto e barre), che era ancora da pubblicare.
- File: `sito/trova.html`, `sito/supermastro.html`, `sito/js/ac.js`, `sito/css/ac.css`, `CLAUDE.md`.

### 2026-10-09 12:30 · Claude
- Sicura come divisione di AncheCasa: in alto la stessa barra di AncheCasa (menu, Accedi, Iscriviti, link a anchecasa.it), sotto una seconda barra AncheSicura (Servizi, Corsi, App, Settori, Tutta Italia, Chi siamo, Contatti, Entra nella rete). In fondo lo stesso piè di pagina di AncheCasa. Logo AncheSicura non più stirato.
- Immagini rifatte su tutti e due i siti: nelle prime sezioni il testo sta sul blu e la foto a destra (da telefono sopra al testo), così testo e foto non si sovrappongono più. Nuove foto ritagliate in `img/pannelli`; le foto di `sito/img/foto` ritagliate in 16:10 per non tagliare loghi e persone (originali nella copia `_copie-sito-1226`).
- File: `sito/css/ac.css`, `sito/*.html` (nuove), `sito/img/pannelli`, `sito/img/foto`; `sicura-DA-CARICARE-SU-CLOUDFLARE` rifatta; sorgenti in `sito-nuovo` e `sicura-nuovo`. Magazine e vercel.json non toccati.
- Da pubblicare: anchecasa.it con PUBBLICA-SITO-VERCEL.bat, sicura su Cloudflare Pages (progetto «sicura»).

### 2026-10-09 12:25 · Cursor
- Magazine nel menu del sito, anche da telefono: voce «Magazine» dopo «Prezzi», dentro il menu che si apre con le tre righe. Prima c’era solo nel piè di pagina.
- Pubblicato su https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_CnwUA8mg3rTzE9nMHBt3Uie1S1Y8`).
- File: le 42 pagine HTML del menu in `sito/` (da `index.html` alle pagine app, servizi, contatti e legali), `CLAUDE.md`.

### 2026-10-09 12:14 · Cursor
- Pubblicato il sito nuovo su https://sicura.anchecasa.it, progetto Cloudflare Pages «sicura», ramo main, deployment `b7bbb993-a2cd-4faa-b358-9d09dbec966b` (anche https://b7bbb993.sicura-212.pages.dev). Caricato il contenuto di `sicura-DA-CARICARE-SU-CLOUDFLARE`, senza `LEGGIMI.txt`. La cartella `sicura` (versione di prima) non è stata toccata.
- Controllato in linea: home, /corsi (listino e documenti), /app (schermate e prezzi 9 € e 19 €). Nessuna barra di anteprima. Le immagini rispondono.
- Prova «Chiedi un'offerta» da https://sicura.anchecasa.it/contatti: nome «Prova pubblicazione Sicura», mail prova-pubblicazione@anchecasa.it, città Roma. Il sito ha risposto «Grazie, richiesta ricevuta». Da questa sessione non si apre l'elenco dell'area privata.
- File: `CLAUDE.md`. Nessuna pagina del sito modificata in questo intervento.

### 2026-10-09 12:12 · Claude
- Nuovo sito sicura.anchecasa.it pronto in `sicura-DA-CARICARE-SU-CLOUDFLARE` (versione finale, senza barra anteprima): listino corsi con prezzi e media di mercato, documenti e visite con prezzi, nuova pagina App AncheSicura con schermate dell'app (moduli Sicurezza 9 €, Sicurezza Cantiere 19 €), moduli che scrivono in `marketplace.richieste_iscrizione` (mail di riserva rete@anchecasa.it). Istruzioni nel LEGGIMI.txt della cartella.
- Sorgente aggiornata in `sicura-nuovo` (copia di prima in `_copie-sicura-nuovo-...`). La cartella `sicura` (versione online di prima) non è stata toccata.
- NON ancora pubblicato: lo carica Nando su Cloudflare Pages, progetto «sicura».

### 2026-10-09 12:06 · Cursor
- Pubblicato il sito nuovo su https://anchecasa.it, progetto Vercel `anchecasa-pulito` (deployment `dpl_FhGxsRUWUsSkFzggK6Mae4SRypwt`). Homepage con ricerca e SuperMastro. Magazine ancora in versione 11. Gli indirizzi vecchi rimandano alle pagine nuove. Prezzi online: Artigiano 14,90 €, Impresa 49 €, Fornitore 99 €, tutti i moduli 69 €.
- Prova di iscrizione inviata a `marketplace.richieste_iscrizione` (nome «Prova pubblicazione», mail prova-pubblicazione@anchecasa.it). Il database l’ha accettata. Da questa sessione non si apre l’elenco dell’area privata.
- I tre file SQL dell’app (`app-01-supermastro.sql`, `app-02-completa.sql`, `app-03-siti.sql`) restano da eseguire nel SQL Editor di Supabase. Per il sito non servono.
- Da qui in avanti il Magazine si lavora da solo. Le pagine nuove del sito non si rimettono com’erano.
- File: `CLAUDE.md`. Nessuna pagina del sito modificata in questo intervento.

### 2026-10-09 12:02 · Cursor
- Codice GitHub accettato. Inviato il ramo main su https://github.com/anchecasa/anchecasapulito, con i tre commit già pronti, magazine compreso.
- L’azione Supabase non è partita. Parte solo quando cambiano i file in `supabase/migrations`.
- File: `CLAUDE.md`.

### 2026-10-09 12:00 · Claude
- Autorizzazione di Nando (09.10.2026 11:55): «autorizzo modifica pubblica su cartella anchecasapulita su vercel cloudflare e supabase». Scelta di Nando: nuovo sito + Magazine; Sicura dopo prezzi e app.
- Cartella `sito`: messo il NUOVO sito (quello con barra di ricerca e SuperMastro video 5 secondi) sopra il vecchio. Il Magazine resta com'era (`magazine.html`, `magazine/`, `css/magazine.css`, `js/magazine.js`, `css/sito.css`, `js/sito.js` non toccati). Le vecchie pagine (privato, artigiano, impresa, login…) restano nella cartella ma `vercel.json` le rimanda alle pagine nuove.
- Prezzi: Artigiano 14,90 €; Impresa 49 € con Ufficio compreso; Fornitore 99 €; moduli in più da 9 € (Sicurezza 9, Sicurezza Cantiere 19, Cantiere e SAL 29, Gare 29, Lotti 9, Centralino 19, Magazzino 9), tutti 69 €.
- Moduli del sito (iscrizione, contatti, sopralluogo, agenti, partner, opportunità): scrivono in `marketplace.richieste_iscrizione` come il sito di prima; se non parte, si apre la mail a info@anchecasa.it.
- Copia del sito di prima: `_copie-sito-prima-del-nuovo-1159`. Per tornare indietro: rimettere quella cartella al posto di `sito` oppure rollback su Vercel.
- NON ancora pubblicato: lo pubblica Nando con `PUBBLICA-SITO-VERCEL.bat`.
- Per Cursor: il Magazine si lavora come prima; non sovrascrivere `index.html`, `css/ac.css`, `js/ac.js` e le pagine nuove con quelle vecchie.

### 2026-10-09 11:42 · Cursor
- Magazine, apertura: la pagina non si sposta più al primo disegno, l’angolo della copertina non si solleva da solo, e uno scorrimento del dito non gira la pagina.
- Magazine da telefono e da tablet in verticale: la rivista copre tutto lo schermo, menu e piè di pagina restano nascosti, in alto a sinistra c’è il tasto Home per tornare al sito.
- Sommario: ogni voce ha la foto. Le voci non sono più pulsanti e non portano a un’altra pagina, così si può scorrere l’elenco. Il tasto Sommario in basso resta.
- File: `sito/css/magazine.css`, `sito/js/magazine.js`, `sito/magazine.html` (versione file `?v=11`). Non ancora pubblicato su anchecasa.it.

### 2026-10-09 11:33 · Cursor
- Magazine da PC: il piè di pagina resta in fondo allo schermo, sopra la rivista. Non compare più dietro e non sparisce all’apertura.
- Magazine da telefono: tolta la riscrittura dell’altezza a ogni movimento della barra. Al refresh la pagina si apre una volta sola, a schermo, senza i rimbalzi.
- File: `sito/css/magazine.css`, `sito/js/magazine.js`, `sito/magazine.html` (versione file `?v=10`). Pubblicato su https://anchecasa.it.

### 2026-10-09 11:24 · Cursor
- Il repository vero su GitHub è `anchecasa/anchecasapulito` (vuoto). Il nome con il trattino non esiste. Aggiornato il collegamento e `INVIA-SU-GITHUB.bat`.
- Vercel è già in produzione con il magazine `?v=9` su https://anchecasa.it. Non serve un secondo invio.
- Cloudflare Pages non ha un progetto anchecasapulito. Il dominio punta già a Vercel.
- Supabase: il token della CLI è ancora scaduto, la migrazione luce e gas non è applicata da qui.
- File: `INVIA-SU-GITHUB.bat`.

### 2026-10-09 11:05 · Cursor
- Magazine sul telefono: tolta l’entrata che spostava e rimpiccioliva la pagina (il rimbalzo). La rivista resta ferma e riempie lo schermo visibile sotto il menu, senza far scorrere il sito. L’altezza segue la barra del browser.
- File: `sito/css/magazine.css`, `sito/js/magazine.js`, `sito/magazine.html` (versione file `?v=9`). Pubblicato su https://anchecasa.it.

### 2026-10-09 10:54 · Cursor
- Pubblicato in produzione il sito sul progetto Vercel `anchecasa-pulito` (https://anchecasa.it, magazine verificato) e l'area privata sul progetto `area-privata-produzione` (https://areaprivata.anchecasa.it).
- Repository git locale pronto per `https://github.com/anchecasa/anchecasa-pulito.git`, con `.github/workflows/supabase.yml`. L'invio su GitHub è fermo: il token dell'account `anchecasa` non è più valido e manca la chiave SSH.
- Supabase: il token della CLI non è valido, quindi la migrazione `supabase/migrations/20261009100000_energia_offerte_proposte.sql` non è stata applicata.
- Cloudflare: i nameserver di anchecasa.it sono Cloudflare e i record puntano già a Vercel. Non c'è un progetto Pages chiamato anchecasapulito (i progetti presenti sono altri, per esempio `sicura` e `anchecasa`).
- File: `.gitignore` (esclusa la cache `.wrangler`), `.github/workflows/supabase.yml`.

### 2026-10-09 10:40 · Claude
- Creato `INVIA-SU-GITHUB.bat` nella cartella principale: con doppio clic inizializza git (se manca), collega `https://github.com/anchecasa/anchecasa-pulito.git`, crea `.github/workflows/supabase.yml` da `scripts/supabase-workflow.yml`, fa commit e invia su `main` con l'accesso GitHub di chi lo avvia. Si può rilanciare a ogni aggiornamento.

### 2026-10-09 10:35 · Claude
- Preparato il repository GitHub della cartella (esclusi `_*` e `.vercel`), pronto da inviare a `anchecasa/anchecasa-pulito` appena l'account GitHub è collegato a Claude.
- Nuovi file: `supabase/migrations/20261009100000_energia_offerte_proposte.sql` (tabelle `marketplace.energia_carta`, `energia_offerte`, `energia_proposte` con RLS), `.github/workflows/supabase.yml` + `scripts/applica-migrazioni.sh` (applicano le migrazioni nuove con il segreto `SUPABASE_DB_URL`), `.gitignore`, `LEGGIMI-GITHUB.md` (collegamento Vercel con Root Directory `sito` e `area-privata`, segreto Supabase).
- Copia temporanea dell'archivio in `_to_delete/anchecasa-pulito-repo.tgz` (si può cancellare).

### 2026-10-09 10:22 · Claude
- Creato `PUBBLICA-SITO-VERCEL.bat` nella cartella principale: con doppio clic pubblica la cartella `sito` sul progetto Vercel `anchecasa-pulito` in produzione (`npx vercel deploy --prod`), con l'accesso Vercel di chi lo avvia.
- Nota: `area-privata` non ha un collegamento Vercel (`.vercel`) in questa cartella; la dashboard luce e gas va pubblicata dal progetto che serve areaprivata.anchecasa.it. La tabella Supabase per offerte e proposte la prepara il tecnico.

### 2026-10-09 10:15 · Claude
- Magazine, controllo pagine (PC e telefono): nessun testo tagliato e nessun testo sotto ~9,5 px effettivi. Alzate le misure minime (piè di pagina, fonti, etichette, app, bolletta disegnata), sommario compatto, foto più basse su telefono nelle pagine 7 e 12, piè di pagina accorciati nelle pagine con foto di lato, nota fonti dell'app accorciata (fonti complete nel PDF).
- Magazine, sommario: miniatura su ogni voce (tetti, architetto, bolletta, grondaia, stretta-mano; tessere grafiche per Check Bollette e Glossario).
- Magazine, report PDF «Check Bollette» rifatto come pagina di rivista con il logo ufficiale AncheCasa (`sito/assets/logo/anchecasa-payoff-bianco.png`): testata blu, tre cifre grandi, contatore a lancetta, risparmio, giudizi, «Cosa fare adesso», piè di pagina della rivista.
- Magazine, pulsante dell'app: non porta più al Portale ARERA ma all'azienda luce e gas partner. Configurazione `PARTNER_ENERGIA = { nome, url }` in cima a `sito/js/magazine.js`: vuoto = «Ricevi un'offerta migliore» verso `/pubblica`. Il Portale ARERA resta come link piccolo.
- File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html` (versione file `?v=8`).

### 2026-10-09 10:10 · Claude
- Area privata, nuova categoria azienda «Fornitori di luce, gas e servizi energetici» (`azienda_luce_gas`, area «Aziende - Energia e utenze») in `area-privata/dashboard/js/views.js` (CATEGORIE_LINK).
- Nuovo pack «energia» con cartella «Luce e gas» e due tasti in `area-privata/dashboard/js/app.js` (eccezione al congelamento, su richiesta esplicita): «Le mie offerte» (listino luce/gas, copertura tutta Italia con un tocco, pubblicazione in piazza, dati della carta intestata) e «Proposte su carta intestata» (anteprima A4 e PDF con marchio AncheCasa + logo dell'azienda dal Profilo, stima annua, storico numerato AC-EN-anno-numero).
- Nuovi file: `area-privata/dashboard/js/energia.js`, `area-privata/dashboard/css/energia.css`, `area-privata/dashboard/img/carta-logo-bianco.png`; caricati in `area-privata/dashboard/index.html`.
- Dati di offerte e proposte per ora nel browser (localStorage, chiave `anchecasa-energia-v1:<mail>`): per averli sul server serve una tabella nello schema `marketplace`.
- Come si iscrive l'azienda: admin · Genera link · Azienda; l'azienda entra, nel Profilo sceglie la categoria luce e gas e carica il logo.

### 2026-10-09 10:00 · Claude
- Magazine, copertina: tolto il bollino. Il richiamo allo strumento è ora un titolo di copertina in alto a destra, allineato a destra con filetto arancio: etichetta «In regalo», «Paghi troppo di bolletta?» in Bodoni, sottotitolo, «pag. 8» (cliccabile, porta allo strumento). Leggera ombra dietro per la leggibilità.
- Il titolo di copertina «Bollette» in basso diventa «Energia · Prima isola, poi scalda» per non ripetere l'argomento.
- File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html` (versione file `?v=7`).

### 2026-10-09 09:55 · Claude
- Magazine: in copertina la scheda rettangolare diventa un bollino rotondo a destra, blu notte con bordo giallo: fulmine giallo, «Paghi troppo luce e gas?», pulsante giallo «Controlla gratis ›». Fisso, porta a pag. 8. File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html` (versione file `?v=6`).

### 2026-10-09 09:52 · Claude
- Magazine: il bollino rotondo arancione in copertina è sostituito da una scheda rettangolare in stile app (fondo blu notte, icona fulmine gialla, freccia gialla): «Gratis · in 30 secondi / Paghi troppo luce e gas? / Controlla la tua bolletta». Porta a pag. 8. File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html` (versione file `?v=5`).

### 2026-10-09 09:48 · Claude
- Magazine: bollino in copertina riscritto perché si capisca cosa fa. Ora dice «Paghi troppo luce e gas?», pulsante «Scoprilo qui», bordo «Controllo gratuito · In 30 secondi · pag. 8». File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html` (versione file `?v=4`).

### 2026-10-09 09:45 · Claude
- Creato questo file `CLAUDE.md` con la regola del registro e la regola Cursor `.cursor/rules/registro-modifiche.mdc`.
- Aggiunto il rimando a `CLAUDE.md` in fondo a `LEGGIMI.txt`.

### 2026-10-09 09:43 · Claude
- Magazine: rifatto il bollino «Check Bollette» in copertina, ora fisso (senza animazione), con scritte ad arco. File: `sito/js/magazine.js`, `sito/css/magazine.css`, `sito/magazine.html` (versione file `?v=3`).

### 2026-10-09 09:40 · Claude
- Magazine: rinominate le 7 foto nuove scaricate da Canva (`editoriale`, `tetti`, `bolletta`, `architetto`, `grondaia`, `stretta-mano`, `retro` .jpg) in `sito/magazine/numero-1/`. Schiarito il velo sulla pagina dei numeri.

### 2026-10-09 09:35 · Claude
- Magazine, grafica v2: carta bianca patinata; pagine di testo rifatte con infografiche (grafico bonus, bonifico disegnato, bolletta smontata, passi energia, percorso pratiche, stagioni, glossario a tessere); foto a tutta pagina per editoriale, numeri, trova impresa, retro; angolo pagina che si solleva; bollino in copertina.
- Strumento gratuito «Check Bollette» (pag. 8) rifatto come app: Luce/Gas, contatore a lancetta, stime annue, risparmio possibile, report PDF (jsPDF da cdnjs).

### 2026-10-09 09:20 · Claude
- Creata la rivista sfogliabile AncheCasa Magazine N.1 (9 ottobre 2026, quindicinale): `sito/magazine.html`, `sito/css/magazine.css`, `sito/js/magazine.js`, foto in `sito/magazine/numero-1/`.
- Aggiunta la voce di menu «Magazine» (`/magazine`) tra Agente e Contatti in `sito/js/sito.js` (array `NAV`).
- Per un nuovo numero: cambiare `NUMERO` e `PAGINE` all'inizio di `sito/js/magazine.js` e creare `sito/magazine/numero-N/`.
