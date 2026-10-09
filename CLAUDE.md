# AncheCasa · cartella pulita

Sito ufficiale www.anchecasa.it (cartella `sito`, progetto Vercel anchecasa-pulito), area privata, mail, marchio, sicura.

## Regola fissa: registro delle modifiche

Ogni modifica a questo progetto, fatta da Claude, da Cursor o da una persona, va annotata qui sotto nel **Registro delle modifiche**, prima di chiudere il lavoro.

- Una voce per ogni intervento, la più recente in alto.
- Formato: data e ora (Europe/Rome), chi l'ha fatta, cosa è cambiato, quali file.
- Se si annulla qualcosa, si annota anche l'annullamento.
- Questo file non si cancella e non si sposta: resta nella cartella principale del progetto.

## Registro delle modifiche

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
