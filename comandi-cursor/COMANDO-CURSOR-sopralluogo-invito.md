COMANDO PER CURSOR — Sopralluogo al cliente per mail + Dossier del tecnico + Relazione IA di tutta la casa (app-27, 28, 29) · 12.10.2026 (v3)
Sostituisce la v1 e la v2 di questo file.

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Leggi prima CLAUDE.md (regole e Registro delle modifiche).
Prima di ogni passo che cambia qualcosa online (database, funzioni, pubblicazione, push) mostrami cosa farai e aspetta il mio «ok».

REGOLE (obbligatorie)
1. Nessuna chiave, password, token o indirizzo del database in chat, nei file o nei commit. Dei secrets mostri solo i NOMI.
2. Non riscrivere i file qui sotto: si correggono solo se una prova fallisce, e mi dici cosa hai cambiato.
3. Se qualcosa dà errore: fermati e mostrami l'errore esatto. Non cancellare mai dati online.
4. Annota ogni passo fatto in cima al «Registro delle modifiche» di CLAUDE.md.
5. Non toccare la dashboard cliente di Sicura e i commenti CONGELATO di app.js.

COSA FA (deciso da Nando)
A. Il sopralluogo arriva al cliente SOLO per mail (mai WhatsApp): mail del marchio con la foto e «Guarda il tuo sopralluogo».
   Chi non ha l'account sceglie la password (invito legato all'agente) e torna da solo alla sua pagina sopralluogo.html.
   Preventivo entro 5 giorni, 48 ore se l'agente segna «Urgente». Conto alla rovescia nella pagina del cliente.
B. Dossier del tecnico (per ora l'admin): Ristrutturazioni → «📋 Apri il dossier». Scadenza, misure con schizzo, dati della casa,
   computo, foto e planimetria, note vocali, dati del comune, chat con l'agente nell'app, «Manda il preventivo al cliente», PDF.
   Appena l'agente manda il sopralluogo, all'admin arriva la mail «Nuovo dossier» con il link che apre il dossier.
C. L'agente, nella pagina Sopralluoghi: «Misure e casa · per il tecnico» (stanze, piano, ascensore, accesso, cose da controllare),
   «📐 Fotografa la planimetria», «🤖 Leggi planimetria e note con l'IA», «Domande del tecnico».
D. IA (Gemini, chiave GEMINI_API_KEY già messa da Nando oggi): trascrive le note vocali, legge la planimetria quotata e le foto,
   propone stanze, voci del computo (MAI prezzi), dubbi e titolo edilizio suggerito.
F. RELAZIONE DI SOPRALLUOGO di TUTTA la casa (app-29, 15:34): interni, impianti, facciata, tetto, giardino. L'IA legge foto, planimetria,
   note vocali e il VIDEO del giro della casa e prepara: sintesi, stato di ogni ambiente (1-5), materiali, criticità con gravità,
   impianti, sicurezza (amianto sospetto, crepe), energia e incentivi «da verificare», priorità, fasi e tempi, documenti da chiedere.
   «✨ Crea il dopo»: simulazione della foto vera (stile a scelta), sempre con la scritta «simulazione». Prima/dopo trascinabile.
   Il cliente vede la relazione SOLO dopo «Pubblica la relazione al cliente». Report scaricabile in PDF. Niente verde: blu e arancio.
E. Il cliente riceve «Il tuo preventivo è pronto», lo vede voce per voce nella sua pagina e preme «Accetto il preventivo»
   (all'admin arriva la mail «Preventivo accettato»).

FILE (già nella cartella)
  NUOVI
  - app-anchecasa/sql/app-27-sopralluogo-invito.sql
  - app-anchecasa/sql/app-28-dossier-tecnico.sql
  - app-anchecasa/sql/app-29-relazione-ia.sql
  - area-privata/js/relazione.js, area-privata/css/relazione.css (la grafica della relazione, uguale per tecnico e cliente)
  - app-anchecasa/supabase/functions/sopralluogo-invito/index.ts
  - app-anchecasa/supabase/functions/dossier-ia/index.ts
  - area-privata/sopralluogo.html, area-privata/js/sopralluogo.js, area-privata/css/sopralluogo.css
  - area-privata/img/sopralluogo-demo/ (prima, base, medio, alto, soggiorno, cucina, giardino, giardino-dopo, facciata, facciata-dopo: solo per le anteprime ?demo=)
  - area-privata/dashboard/js/sopralluogo-invio.js
  - area-privata/dashboard/js/dossier-tecnico.js
  MODIFICATI (poche righe, segnate «12.10.2026 app-27» o «app-28»)
  - area-privata/dashboard/js/imprese.js (riquadro per l'agente; «Apri il dossier»; scadenza in ogni pratica; ?dossier=<id>; AC.imprese.computoBox)
  - area-privata/dashboard/index.html (sopralluogo-invio.js?v=3, dossier-tecnico.js?v=2, imprese.js?v=5)
  - area-privata/js/benvenuto.js (parametro «poi»: dopo la password torna a sopralluogo.html?t=…; accetta solo quella pagina)

======================================================================
PASSO 1 — Prova in locale (nessun cambio online)
======================================================================
Dalla cartella area-privata: npx serve . -l 5500   (oppure python -m http.server 5500)
- http://localhost:5500/sopralluogo.html?demo=1               → pagina del cliente con il conto alla rovescia
- http://localhost:5500/sopralluogo.html?demo=1&preventivo=1  → pagina del cliente con il preventivo e «Accetto il preventivo»
- http://localhost:5500/dashboard/?demo=agente#/agente/re-sopralluoghi → «Misure e casa», «🤖 Leggi con l'IA» (esempio), chat, «Invia al cliente per mail»
- http://localhost:5500/sopralluogo.html?demo=1&relazione=1  → la relazione di tutta la casa come la vede il cliente (prima/dopo da trascinare, «Scarica la relazione (PDF)»)
- http://localhost:5500/dashboard/?demo=admin&dossier=r9#/admin/ristrutturazioni-admin → dossier con la relazione completa: «Pubblica», «Crea il dopo», «Metti le voci nel computo»
- http://localhost:5500/dashboard/?demo=admin&dossier=r2#/admin/ristrutturazioni-admin → il dossier del bagno si apre da solo:
  «Analizza con l'IA» (esempio) → «Metti le voci nel computo» → «Manda il preventivo al cliente» (doppio tocco). In demo non parte nulla.
Mostrami cosa vedi (computer e telefono, larghezza 390) e aspetta il mio «ok».

======================================================================
PASSO 2 — Database: app-27, app-28, app-29
======================================================================
Collegamento come sempre: psql di PostgreSQL 16 con il percorso completo; l'indirizzo lo imposto io in $env:SUPABASE_DB_URL.
Controllo prima (deve dare 2):
  & "<psql>" "$env:SUPABASE_DB_URL" -c "select count(*) from information_schema.tables where table_schema='marketplace' and table_name in ('ristrutturazioni','ristrutturazioni_media');"
Dopo il mio «ok», uno alla volta e in quest'ordine:
  & "<psql>" "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f app-anchecasa\sql\app-27-sopralluogo-invito.sql
  & "<psql>" "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f app-anchecasa\sql\app-28-dossier-tecnico.sql
  & "<psql>" "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f app-anchecasa\sql\app-29-relazione-ia.sql
Controlli: le query in fondo a ciascun file. Si possono rilanciare.

======================================================================
PASSO 3 — Funzioni Supabase «sopralluogo-invito» e «dossier-ia»
======================================================================
Segreti (mostrami solo i NOMI presenti): RESEND_API_KEY, RESEND_FROM, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, GEMINI_API_KEY, ADMIN_MAIL (facoltativa: se manca la mail va a info@anchecasa.it).
Facoltativi: GEMINI_MODEL (testo, predefinito gemini-3.8-flash), GEMINI_IMAGE_MODEL (immagini, predefinito gemini-3.1-flash-image).
Se la chiave di Nando non vede questi modelli la funzione prova da sola i successivi (gemini-3.6-flash, gemini-2.5-flash; gemini-3-pro-image).
Controlla nei log della prima lettura quale modello ha risposto e scrivilo nel Registro di CLAUDE.md.
Limite file su Supabase: Storage → Settings → «Upload file size limit». Per i video serve almeno 50 MB: dimmi quanto è impostato, non cambiarlo da solo.
  npx supabase secrets list --project-ref edsvmnxojsmknjuhobqa
Dopo il mio «ok», dalla cartella app-anchecasa:
  npx supabase functions deploy sopralluogo-invito --project-ref edsvmnxojsmknjuhobqa --no-verify-jwt
  npx supabase functions deploy dossier-ia --project-ref edsvmnxojsmknjuhobqa --no-verify-jwt
(usano ../_shared/mail-marchio.ts che c'è già). Controlla: npx supabase functions list --project-ref edsvmnxojsmknjuhobqa (sotto il limite di 100).
Prove senza mandare mail:
  - sopralluogo-invito con {"azione":"vedi","t":"00000000-0000-0000-0000-000000000000"} → 404 «link_non_valido»
  - dossier-ia senza token con {"azione":"analizza","id":"00000000-0000-0000-0000-000000000000"} → 401 «serve_accesso»

======================================================================
PASSO 4 — Pubblicare l'area privata (Vercel)
======================================================================
SOLO dopo i passi 2 e 3 riusciti. Prima confronta i file online di /dashboard con quelli locali: se online c'è qualcosa
che in locale manca, NON pubblicare e dimmelo. Poi, dalla cartella area-privata (ha già .vercel collegato):
  npx vercel deploy --prod
Controlla che rispondano 200: /sopralluogo.html, /js/sopralluogo.js, /css/sopralluogo.css, /dashboard/js/sopralluogo-invio.js, /dashboard/js/dossier-tecnico.js.

======================================================================
PASSO 5 — Prova vera (mail solo a Nando)
======================================================================
1. Come agente: apri un sopralluogo di prova, carica 2 foto, fotografa una planimetria, registra una nota vocale breve con le misure.
2. Carica anche un video breve («🎥 Video del giro della casa»), poi «🤖 Leggi tutto con l'IA»: in 1-3 minuti le stanze si riempiono; controlla e «Salva misure e casa».
3. Mail del cliente: palumbofernando12@gmail.com, spunta «Urgente», «Invia al cliente per mail».
   Verifica: arriva la mail al cliente (foto + «Guarda il tuo sopralluogo») e all'admin «URGENTE 48 ore · Nuovo dossier».
4. Dalla mail admin «Apri il dossier»: si apre il dossier di quella pratica con la relazione pronta (se no «✨ Prepara la relazione con l'IA»).
   Prova «✨ Crea il dopo» su una foto: compare il prima/dopo. Poi «Pubblica la relazione al cliente» e controlla la pagina del cliente e il PDF.
   «Metti le voci nel computo» → «Compila il computo», metti i prezzi, salva → scrivi una domanda all'agente nella chat.
5. «Manda il preventivo al cliente» → arriva «Il tuo preventivo è pronto»; la pagina mostra il preventivo voce per voce;
   «Accetto il preventivo» → all'admin arriva «Preventivo accettato»; nel dossier il riquadro diventa verde.
Se una mail non arriva o l'IA non risponde: mostrami i log della funzione (Supabase → Edge Functions → Logs).

======================================================================
PASSO 6 — GitHub
======================================================================
git status e ramo attuale (non cambiare ramo da solo: se non sei su main chiedimi).
Commit SOLO dei file elencati sopra in «FILE» + CLAUDE.md + questo COMANDO-CURSOR-sopralluogo-invito.md.
NON includere: _copie-*, _to_delete, dist/, supabase/.temp/, file .env, file di altri lavori in corso (dimmi quali ci sono e lasciali).
  git add <solo i file elencati>
  git commit -m "Sopralluogo al cliente per mail, dossier del tecnico, relazione IA di tutta la casa con simulazioni, preventivo al cliente (app-27, 28, 29)"
Push su origin dopo il mio «ok» (come INVIA-SU-GITHUB.bat): git push -u origin <ramo>
Alla fine dammi una tabella: passo · fatto sì/no · cosa hai controllato.
