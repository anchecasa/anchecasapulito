COMANDO PER CURSOR — App dell'agente sul telefono (area-privata/app/, app-31) · 12.10.2026

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Leggi prima CLAUDE.md. Prima di ogni passo che cambia qualcosa online mostrami cosa farai e aspetta il mio «ok».

REGOLE
1. Nessuna chiave, password, token o indirizzo del database in chat, nei file o nei commit.
2. Non riscrivere i file nuovi: si correggono solo se una prova fallisce, e mi dici cosa hai cambiato.
3. Non toccare dashboard/js/app.js (parti CONGELATE) né la dashboard cliente di Sicura.
4. Annota ogni passo nel Registro di CLAUDE.md.

COSA FA (deciso da Nando alle 19:21: pagina app separata, prima versione con tutto)
Pagina https://entra.anchecasa.it/app/ — la «Vista A chiara» approvata, per agenti della rete e admin, dal telefono.
Stesso accesso dell'area privata (mail e password), stessi dati. Si installa come app (icona sul telefono).
- Home: saluto, sopralluoghi aperti, preventivi in attesa, squadra, provvigioni, «Da fare», ultimi inviti, azioni rapide.
- Tasto +: Sopralluogo Flash, Invita un cliente (solo mail), Segnala una ristrutturazione, Porta una persona in rete.
- Sopralluogo Flash in 5 passi: misure e casa · foto, planimetria, nota vocale registrata dal telefono, video ·
  relazione con l'IA (Gemini, misure lette messe nelle stanze) · invio al cliente per mail (Urgente 48 ore) · domande del tecnico.
  «Nuovo cliente, sono qui adesso» apre una pratica già assegnata all'agente (funzione nuova app-31).
- Clienti: pratiche (sopralluoghi e segnalazioni), inviti con stato (mail inviata, ha aperto, iscritto), vendite.
- Rete: squadra sotto di lui, cartina d'Italia vera (dashboard/js/cartina-italia.js) colorata per regione, porta in rete.
- Altro: formazione e documenti (PDF di dashboard/docs, regole, documenti di app_documenti con stato firma), area privata completa, installa, esci.
- Promemoria «Ricordati di firmare il tuo contratto» se manca la firma (regola del 12.10.2026 17:01: non blocca).

FILE NUOVI
- area-privata/app/index.html, app.css, app.js, manifest.webmanifest
- app-anchecasa/sql/app-31-app-agente.sql (funzione ristrutturazione_nuova_mia)
MODIFICATO
- area-privata/vercel.json (redirect /app → /app/ e Content-Type del manifest dell'app)

PASSO 1 — Prova in locale
Dalla cartella area-privata: npx serve . -l 5500
- http://localhost:5500/app/?demo=1 a larghezza 390: Home, +, Clienti, un sopralluogo (5 passi), Rete con la cartina, Altro.
  Prova: + → Sopralluogo Flash → «Nuovo cliente, sono qui adesso» → salva → passo 4 invio (doppio tocco). In demo non parte nulla.
- Nessuna pagina deve scorrere di lato. Mostrami cosa vedi e aspetta il mio «ok».

PASSO 2 — Database
& "<psql>" "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f app-anchecasa\sql\app-31-app-agente.sql
(oppure il collegamento già usato oggi, progetto edsvmnxojsmknjuhobqa). Controllo in fondo al file.

PASSO 3 — Pubblicazione
Confronto dei file online con quelli locali come oggi (se online c'è qualcosa che manca in locale, fermati).
Poi da area-privata: npx vercel deploy --prod
Controlla 200: /app/ , /app/app.js , /app/app.css , /app/manifest.webmanifest (Content-Type application/manifest+json), /dashboard/js/cartina-italia.js
e che /app (senza barra) porti a /app/.

PASSO 4 — Prova vera (solo con l'account di Nando o un agente di prova, nessuna mail a clienti veri)
Dal telefono di Nando apri https://entra.anchecasa.it/app/, entra (la password la scrive Nando), controlla Home, Rete con la cartina, Altro con i documenti.
Se serve un sopralluogo di prova: + → Sopralluogo Flash → nuovo cliente «PROVA app» con mail palumbofernando12+app-prova@gmail.com.
Poi cancella la pratica di prova (e i suoi file nel bucket) come fatto oggi.
Prova anche «Invita un cliente» verso palumbofernando12+invito-app@gmail.com: dimmi se la mail parte. Se la funzione invia-invito-marketplace
risponde con un errore per l'agente, l'app mostra il link da copiare: dimmi l'errore esatto, non cambiare la funzione da solo.

PASSO 5 — GitHub
Commit SOLO dei file elencati sopra + CLAUDE.md + questo file. Messaggio:
«App della rete sul telefono (Vista A chiara): home, sopralluogo flash, clienti, rete con cartina, formazione (app-31)»
Push su origin dopo il mio «ok». Alla fine la tabella passo · fatto · cosa hai visto.
