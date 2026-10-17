COMANDO PER CURSOR — App AncheCasa sul telefono per TUTTI i profili · 12.10.2026 19:55
(sostituisce COMANDO-CURSOR-app-agente.md e COMANDO-CURSOR-vista-chiara-telefono.md: fai solo questo)

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Leggi prima CLAUDE.md. Prima di ogni passo che cambia qualcosa online mostrami cosa farai e aspetta il mio «ok».

REGOLE
1. Nessuna chiave, password o token in chat, nei file o nei commit.
2. Non toccare dashboard/js/app.js (parti CONGELATE): nessun menu aggiunto, tolto o rinominato.
3. Non riscrivere i file nuovi: si correggono solo se una prova fallisce, e mi dici cosa hai cambiato.
4. Annota ogni passo nel Registro di CLAUDE.md.

COSA FA (deciso da Nando alle 19:43)
- Dal telefono (sotto i 980px) chi apre /dashboard/ va all'app https://entra.anchecasa.it/app/ — privato, azienda/fornitori, rete, admin.
  Da computer non cambia nulla. Nell'app «≡ → Versione per computer» riapre la dashboard intera (solo per quella visita).
- Barra in basso dell'app: le STESSE 4 voci della barra del telefono di oggi di ogni profilo, con il + arancio al centro.
  «Altro» (tutte le altre voci, profilo, impostazioni, esci) è il tasto ≡ in alto a destra.
- Le pagine della dashboard si aprono DENTRO l'app (/dashboard/?inapp=1, stessa sessione, stessi menu di «Pulsanti per profilo»).
- La rete verificata ha in più le pagine native già fatte: Home, Clienti, Sopralluogo Flash, Rete con cartina, Formazione (app-31).
- Il + per profilo: privato (guasto, ristruttura, annuncio, trova…), azienda (pubblica, subappaltatori, preventivo, rapportino…),
  rete (Flash, invita, segnala, porta in rete, registra cliente), admin (Flash, invita, nuova pratica, task, chat del team, appunti).
- Grafica «Vista A chiara» anche dentro le pagine della dashboard sul telefono (dashboard/css/vista-chiara.css).

FILE NUOVI
- area-privata/app/index.html, app.css, app.js, manifest.webmanifest
- area-privata/dashboard/css/vista-chiara.css
- app-anchecasa/sql/app-31-app-agente.sql (funzione ristrutturazione_nuova_mia)
MODIFICATI
- area-privata/vercel.json (redirect /app → /app/ e Content-Type del manifest dell'app)
- area-privata/dashboard/index.html (script in alto: telefono → /app/, modalità ?inapp=1; e vista-chiara.css?v=2 dopo testata.css)

PASSO 1 — Prova in locale
Dalla cartella area-privata: npx serve . -l 5500   e a larghezza 390:
  http://localhost:5500/app/?demo=privato   · ?demo=azienda   · ?demo=agente   · ?demo=admin
In ognuno: le 4 voci in basso, il +, il ≡, una pagina dal ≡, la notifica. Nessuna pagina deve scorrere di lato.
Poi http://localhost:5500/dashboard/?demo=admin#/admin/rete-admin a 390 → deve finire su /app/?demo=admin#d/rete-admin.
Poi la stessa a 1400 → deve restare la dashboard di sempre, identica.
Mostrami cosa vedi e aspetta il mio «ok».

PASSO 2 — Database
& "<psql>" "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f app-anchecasa\sql\app-31-app-agente.sql
(oppure il collegamento già usato oggi, progetto edsvmnxojsmknjuhobqa). Controllo in fondo al file.

PASSO 3 — Pubblicazione
Confronto dei file online con quelli locali come oggi (se online c'è qualcosa che manca in locale, fermati).
Da area-privata: npx vercel deploy --prod
Controlla 200: /app/ , /app/app.js?v=2 , /app/app.css?v=2 , /app/manifest.webmanifest (application/manifest+json),
/dashboard/css/vista-chiara.css?v=2 , /dashboard/js/cartina-italia.js ; e che /app (senza barra) porti a /app/.

PASSO 4 — Prova vera (solo account di Nando o di prova, nessuna mail a clienti veri)
Dal telefono di Nando: https://entra.anchecasa.it/dashboard/ → deve aprirsi l'app. Entra (la password la scrive Nando).
Controlla barra, +, ≡, una pagina della dashboard dentro l'app, «Versione per computer», Esci.
Se il telefono mostra la versione vecchia: chiudi e riapri la pagina.
Se serve un sopralluogo di prova: + → Sopralluogo Flash → nuovo cliente «PROVA app», mail palumbofernando12+app-prova@gmail.com,
poi cancella la pratica di prova (e i suoi file nel bucket) come fatto oggi.

PASSO 5 — GitHub: usa COMANDO-CURSOR-git-main-12-10.md (commit 2 e 3 contengono questi file). Push dopo il mio «ok».
Alla fine la tabella passo · fatto · cosa hai visto.
