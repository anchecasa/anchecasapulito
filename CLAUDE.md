# AncheCasa · cartella pulita

Sito ufficiale www.anchecasa.it (cartella `sito`, progetto Vercel anchecasa-pulito), area privata, mail, marchio, sicura.

## Regola fissa: registro delle modifiche

Ogni modifica a questo progetto, fatta da Claude, da Cursor o da una persona, va annotata qui sotto nel **Registro delle modifiche**, prima di chiudere il lavoro.

- Una voce per ogni intervento, la più recente in alto.
- Formato: data e ora (Europe/Rome), chi l'ha fatta, cosa è cambiato, quali file.
- Se si annulla qualcosa, si annota anche l'annullamento.
- Questo file non si cancella e non si sposta: resta nella cartella principale del progetto.

## Registro delle modifiche

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
