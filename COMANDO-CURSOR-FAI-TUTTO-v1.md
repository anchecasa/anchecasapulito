COMANDO PER CURSOR — Fai tu tutto: app AncheCasa 2.7 e SuperMastro online, senza chiedermi niente (11.10.2026)

Modalità Agent. Parla in italiano semplice. Nando NON deve fare nessun passaggio: non chiedergli password, login o conferme.
Tutti gli accessi ci sono già sul PC, nel file C:\Users\palum\Desktop\04-SuperMastro\web\.env.local
(SUPABASE_DB_PASSWORD, SUPABASE_ACCESS_TOKEN, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, GEMINI_API_KEY…).
Gli script pronti li leggono da soli e non li mostrano mai.

REGOLE
1. Non stampare, copiare o salvare altrove chiavi, password o token. Non aprire il file .env.local per leggerlo.
2. Non modificare i file SQL, le funzioni e il codice dell'app o di SuperMastro. Se uno script si ferma con «FERMATO»,
   leggi il motivo: se è un problema dell'ambiente (pacchetto mancante, comando non trovato, login di gh) risolvilo e rilancia;
   se è un errore del codice o del database, fermati e riportalo parola per parola.
3. Non toccare: area-privata, sito, magazine, sicura, anchebandi, ecosistema-anchecasa.
4. Annota ogni passo in cima al «Registro delle modifiche» di C:\Users\palum\Desktop\ANCHECASA-PULITO\CLAUDE.md.

======================================================================
PARTE 1 — App AncheCasa
======================================================================
Cartella: C:\Users\palum\Desktop\ANCHECASA-PULITO\app-anchecasa
1. Se in C:\Users\palum\Desktop\04-SuperMastro non c'è node_modules\pg: lì esegui «npm install».
2. Lancia:   node scripts/online-tutto.mjs
   Fa da solo, in ordine, fermandosi al primo errore:
   - database: esegue solo i file SQL che mancano (app-08 … app-13) e verifica permessi e cartelle;
   - funzioni: pubblica sdi-gateway, sopralluogo-flash, subappalti-mail, gare-analisi e imposta i secrets che si possono creare da soli;
   - app: pubblica su Cloudflare Pages, collega app.anchecasa.it, aggiunge l'app agli indirizzi ammessi da Supabase, controlla online.
   Se uno dei tre passi si ferma per un motivo d'ambiente, dopo averlo risolto puoi rilanciare solo quel passo:
   node scripts/online-1-database.mjs   |   node scripts/online-2-funzioni.mjs   |   node scripts/online-3-app.mjs
   (rilanciarli non fa danni: rifanno solo quello che manca).
3. Git, nella cartella ANCHECASA-PULITO: commit dei file di app-anchecasa/ e di CLAUDE.md (senza dist/ e supabase/.temp/),
   messaggio «App AncheCasa 2.7 online: magazzino e mezzi, logo, script di pubblicazione», poi push su main.
   Non includere i file di altri lavori (area-privata, anchebandi, supabase/migrations/20261011103000_e_procurement.sql).

======================================================================
PARTE 2 — SuperMastro
======================================================================
Cartella: C:\Users\palum\Desktop\04-SuperMastro (repo anchecasa/supermastro-sos). Leggi docs\SUPERMASTRO-CORREZIONI-v1.md e web\AGENTS.md.
Non toccare supermastro-app/, social-campaign/, _claude-temp/.
1. Git: crea il ramo feat/sm-completamento dal punto attuale e fai commit di web/ (senza node_modules, .next, .open-next, .wrangler,
   tsconfig.tsbuildinfo, file *.bak-*, .env*, .dev.vars), supabase/migrations/, scripts/, .github/workflows/, docs/.
   Messaggio: «SuperMastro completo: 7 fasi + correzioni di sicurezza (11.10.2026)».
2. Controlli (devono passare tutti; se un errore è di compilazione o lint in un file elencato in docs\SUPERMASTRO-CORREZIONI-v1.md
   puoi correggerlo senza cambiare cosa fa il codice, poi rifai i controlli):
     cd web ; npm ci (solo se serve) ; npm run test:sos (16 su 16) ; npm run lint ; npx tsc --noEmit -p .
     cd .. ; npm run build ; npm run audit:rls
3. Database: dalla cartella principale «npm run db:push» (applica solo le migrazioni nuove 20261011…), poi «npm run audit:rls».
4. Secrets nuovi: «node scripts/online-segreti-sos.mjs» (crea SOS_SHARE_SECRET e CRON_SECRET nel Worker e in GitHub, senza mostrarli).
   Se dice che «gh» non è collegato: prova «gh auth status»; se gh non c'è o non è collegato, vai avanti e segnalalo alla fine.
5. Online: push del ramo, Pull Request verso main con il riepilogo di docs\SUPERMASTRO-CORREZIONI-v1.md, merge su main
   (solo se tutti i controlli del punto 2 sono passati). Poi pubblica il Worker:
     gh workflow run deploy.yml -f deploy_worker=true   e segui con «gh run watch» fino alla fine.
   Se gh non è disponibile: da web «npm run deploy» (usa CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID di web\.env.local come variabili d'ambiente del comando, senza stamparle).
6. Controlli online:
   - https://supermastro.anchecasa.it si apre e mostra il procione;
   - https://supermastro.anchecasa.it/admin senza accesso porta al login;
   - POST https://supermastro.anchecasa.it/api/cron/nightly senza intestazione risponde 401;
   - «gh workflow run sos-nightly.yml» e poi esito verde (se gh c'è).

======================================================================
ALLA FINE
======================================================================
Scrivi a Nando in poche righe semplici: cosa è online (indirizzi), esito dei controlli, e SOLO le cose che non si possono fare da qui
(per esempio: account per le mail ai fornitori MAIL_*, contratto del gateway SdI, restrizioni della chiave Google Maps se la mappa
non si vede su app.anchecasa.it). Ricorda di cancellare la cartella 04-SuperMastro\_claude-temp (file temporanei di Claude).
