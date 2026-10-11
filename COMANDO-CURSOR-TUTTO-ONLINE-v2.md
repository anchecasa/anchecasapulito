COMANDO PER CURSOR — Mettere online tutto quello che è rimasto in ANCHECASA-PULITO · 11.10.2026 (v2)
Sostituisce: COMANDO-CURSOR-contratti-firma-online.txt, COMANDO-CURSOR-area-rete-admin.txt, COMANDO-CURSOR-regola-inviti-admin.txt
e le parti non finite di COMANDO-CURSOR-TUTTO-ONLINE-v1.md.

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Leggi prima CLAUDE.md (regole e Registro delle modifiche).
Prima di ogni passo che cambia qualcosa online (database, funzioni, pubblicazioni, DNS, push) mostrami cosa farai e aspetta il mio «ok».

REGOLE (obbligatorie)
1. Nessuna chiave, password, token o indirizzo del database in chat, nei file o nei commit. Dei secrets mostri solo i NOMI.
2. Non riscrivere il lavoro già fatto (elenco in PARTE B). Si corregge solo se una prova fallisce, e mi dici cosa hai cambiato.
3. Se qualcosa dà errore: fermati e mostrami l'errore esatto. Non cancellare mai dati online.
4. Ogni passo fatto va annotato in cima al «Registro delle modifiche» di CLAUDE.md (non cancellarlo, non spostarlo).
5. Prima di toccare file: copia di sicurezza in _copie-<cosa>-<ora>.

======================================================================
PARTE A — Situazione di partenza (solo lettura)
======================================================================
A1. git status e ramo attuale. ATTENZIONE: ora la cartella è sul ramo «feat/sm-fase-1-procione», non su main.
    Non cambiare ramo da solo: dimmi cosa c'è di modificato e chiedimi se portare tutto su main.
A2. Collegamento al database: come in v1 (psql di PostgreSQL 16 con il percorso completo; l'indirizzo lo imposto io in
    $env:SUPABASE_DB_URL dal pulsante «Connect» → «Session pooler»; tu non lo leggi e non lo salvi).
    Prova: & "<psql>" "$env:SUPABASE_DB_URL" -c "select current_database();"
A3. Mostrami una tabella con cosa c'è online e cosa no:
    - Supabase: app-14 eseguito? (colonna marketplace.app_firme.dati) · app-15 eseguito? · funzioni pubblicate (npx supabase functions list --project-ref edsvmnxojsmknjuhobqa, quante sono sul limite di 100)
    - Vercel: area-privata-produzione, anchecasa-pulito (sito), magazine-anchecasa: data dell'ultimo deploy in produzione
    - Cloudflare Pages: sicura e app-anchecasa: ultimo deploy; app.anchecasa.it risponde ancora 522?
    Poi aspetta il mio «ok».

======================================================================
PARTE B — Lavoro già scritto, da NON riscrivere (solo provare e pubblicare)
======================================================================
Tutto in area-privata/dashboard, annotato in CLAUDE.md:
- Contratti compilabili e firmabili dal telefono, area della rete in sola lettura fino alla firma (voci 15:40 e 15:55):
  js/contratto-firma.js, js/contratti-modelli.js, js/contratti.js, css/contratto-firma.css, img/contratto-*.png,
  + app-anchecasa/sql/app-14-contratto-compilato.sql
- Home con grafici e andamenti, tasto «Home» primo per admin e agenti, anche nella barra del telefono (voce 16:20):
  js/home.js, css/home.css
- Da computer aspetto della dashboard «viste»: data e orologio in alto a sinistra, colonna di icone, logo in alto a destra;
  il telefono resta com'è (voce 16:30): css/aspetto-dock.css
- AncheBandi nel menu admin (voce ~08:45): js/bandi-admin.js · Appunti per Francesco: js/appunti-francesco.js
- index.html (carica tutti i file sopra, app.js?v=9) e js/app.js (navItems, primaPagina, tick, paintNav, riga contrattoFirma)
- Pagina di accesso area-privata/js/app.js (voce 16:35): chi ha già la sessione entra subito, dopo l'accesso si arriva alla Home
- App installabile dal telefono (voce 16:45): area-privata/manifest.webmanifest, area-privata/sw.js, area-privata/img/app/*.png,
  area-privata/index.html, area-privata/dashboard/index.html, area-privata/vercel.json

======================================================================
PARTE C — Area «Rete» admin + l'admin invita direttamente tutti i ruoli (da scrivere)
======================================================================
Unisce i due comandi vecchi «area-rete-admin» e «regola-inviti-admin»: UN SOLO file SQL, app-15-rete-admin.sql.
Mostrami prima il piano con i file che tocchi, poi procedi.

C1. NUOVO app-anchecasa/sql/app-15-rete-admin.sql — rieseguibile (if not exists, create or replace, tutto in begin/commit).
    a. alter table marketplace.app_inviti add column if not exists superiore uuid references auth.users(id) on delete set null;
       alter table marketplace.app_inviti add column if not exists regione text not null default '' check (length(regione) <= 40);
    b. marketplace.app_puo_invitare(p_cosa, p_target, p_ruolo): il ramo
         if p_cosa = 'rete' then return marketplace.is_admin() and p_ruolo = 'reteitalia'; end if;
       diventa
         if p_cosa = 'rete' then return marketplace.is_admin() and p_ruolo in ('reteitalia','sviluppo','capoarea','agente','subagente'); end if;
       Il resto identico. app_proponi_rete, app_vota_proposta, app_proposta_esito NON si toccano.
    c. Trigger BEFORE INSERT su app_inviti solo per cosa='rete': errore 'gia_nella_rete' (mail già di un utente in app_rete, confronto
       in minuscolo con auth.users.email); 'invito_gia_aperto' (invito 'inviato' per la stessa mail); 'superiore_non_valido' (il superiore
       deve essere attivo in app_rete con ruolo SOPRA: reteitalia > sviluppo > capoarea > agente > subagente; reteitalia senza superiore).
    d. marketplace.app_accetta_invito(p_token): copia quella di app-05 e cambia solo il ramo «rete senza proposta»: se l'invito ha
       superiore o regione usa i.superiore, i.regione e area = marketplace.app_area_di(i.regione); altrimenti come oggi.
    e. Grant come nei file precedenti; in fondo query di controllo commentate.

C2. Nuova pagina #/admin/rete: js/rete-admin.js + css/rete-admin.css (caricati in index.html), 4 schede:
    a. Albero: riusa montaCatena() di rete-proposte.js; ruolo, regione, sopra, stato, contratto firmato sì/no (app_firme);
       filtri ruolo/regione/stato, ricerca, contatori; scheda persona con sottoposti, firme, azioni (reinvia mail, cambia responsabile, sospendi/riattiva).
    b. Crea persona: ruolo (5), nome, mail, regione, responsabile sopra (solo ruoli superiori, si aggiorna col ruolo; nascosto per reteitalia).
       Insert in app_inviti (cosa:'rete', ruolo, email, nome, superiore, regione) → invito subito, senza voti; «Copia link» e «Invia mail» con
       window.acDb.functions.invoke("invia-invito-marketplace", { body: { token } }) come in views.js (~riga 2660).
       Se la funzione non accetta gli inviti rete NON modificarla: dimmelo.
       Errori in italiano: gia_nella_rete, invito_gia_aperto, superiore_non_valido; colonna mancante → «Manca app-15: va eseguito su Supabase».
    c. Approvazioni: in un elenco le proposte (app_proposte_rete) e le candidature di Richieste agenti, con le azioni che esistono già.
    d. Contratti e firme: per ogni contratto chi ha firmato e chi manca, «Sollecita» per chi manca.
    In rete-proposte.js il blocco «Invita il Responsabile Rete Italia» diventa «Crea direttamente (solo admin)» e porta alla scheda b.
    Le pagine proposte-rete e richieste-agenti restano.
C3. Menu (js/app.js) — ATTENZIONE, la Home c'è già e resta prima:
    - Telefono (barra in basso): Home · Iscritti · Rete · Contratti · Altro.
    - Computer: voce «Rete» subito dopo Iscritti registrati; badge AC.reteBadge sulla voce Rete. Aggiungi «rete» anche alla colonna di
      icone rapide (RAPIDE in paintNav) e a BREVE. Aggiorna la nota CONGELATO con l'eccezione.
C4. Stile attuale (dashboard.css, home.css, aspetto-dock.css), nessuna libreria nuova. Telefono: schede scorrevoli, tabelle → card, tasti ≥ 44 px.

======================================================================
PARTE D — Supabase
======================================================================
D1. app-14 (se A3 dice che manca), poi app-15, uno alla volta, dopo il mio «ok»:
      & "<psql>" "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f app-anchecasa\sql\<file>.sql
D2. Verifica app-14: colonna app_firme.dati; funzioni app_firma_contratto(uuid,text,text,text,text,jsonb) e app_contratto_ok(uuid);
    policy app_vendite_serve_contratto e app_affari_serve_contratto.
    Verifica app-15: colonne app_inviti.superiore e regione; app_puo_invitare('rete', null, 'agente') vero per un admin; trigger presente.
D3. Funzioni non ancora pubblicate (stamattina limite di 100): sopralluogo-flash, subappalti-mail, gare-analisi.
    Elencami le funzioni pubblicate che sembrano vecchie o di prova. NON cancellarne nessuna: decido io.
    Se libero spazio, pubblicale come in v1 (B4) e prova che rispondano «accesso_richiesto» senza accesso.
D4. Secrets: solo i NOMI mancanti tra GEMINI_API_KEY, SDI_WEBHOOK_SEGRETO, MAIL_PROVIDER, MAIL_API_KEY, MAIL_MITTENTE, APP_URL, PRIVACY_URL, DIAGNOSI_ORIGINI.

======================================================================
PARTE E — Prove in locale prima di pubblicare (npx serve dalla cartella area-privata)
======================================================================
A 390 px (telefono) e 1366 px (computer), nessun errore in console:
- Pagina di accesso con sessione già aperta → entra da sola nella Home; senza sessione resta sul modulo.
- ?demo=admin e ?demo=agente: la Home si apre per prima, grafici visibili; telefono con barra in basso Home…; computer con data e
  orologio in alto a sinistra, icone e logo in alto a destra; nessuno scorrimento orizzontale.
- Con utenti veri (dopo D1): admin entra, Home con i numeri veri; agente senza firma vede la striscia «sola lettura», firma il contratto
  dal telefono (prova Agente e Sub-agente), la striscia sparisce, in Documenti «Apri il contratto firmato»; da admin · Contratti · Ricevuta.
  Righe di prova in app_firme di utenti finti: toglile tu dal database alla fine.
- Rete admin: crea un agente con capo area sopra, prova mail doppia e superiore sbagliato.

======================================================================
PARTE F — GitHub
======================================================================
Commit (sul ramo deciso in A1) dei file di area-privata/dashboard, area-privata/js/app.js, area-privata/index.html, area-privata/manifest.webmanifest,
area-privata/sw.js, area-privata/img/app/, area-privata/vercel.json, app-anchecasa/sql/app-14 e app-15, CLAUDE.md e dei COMANDO-CURSOR-*.
Messaggio: «Area privata: Home con grafici, aspetto da computer con orologio a sinistra, contratti firmabili dal telefono, area Rete admin (app-14, app-15)».
NON includere: supabase/migrations/20261011103000_e_procurement.sql, _copie-*, _to_delete, dist/, supabase/.temp/ — dimmi che ci sono e lasciali.
Push su origin (anchecasa/anchecasapulito) dopo il mio «ok».

======================================================================
PARTE G — Vercel
======================================================================
G1. Area privata (progetto area-privata-produzione, https://areaprivata.anchecasa.it) — SOLO dopo D1 riuscito:
    prima confronta i file online di /dashboard con quelli locali: se online c'è qualcosa che in locale manca, NON pubblicare e dimmelo.
    Poi, dalla cartella area-privata (ha già .vercel collegato): npx vercel deploy --prod
    Controlla: /dashboard/js/home.js, /dashboard/css/aspetto-dock.css, /dashboard/js/contratto-firma.js, /dashboard/js/rete-admin.js rispondono 200;
    l'admin entra e vede la Home; da telefono la barra in basso parte da Home.
    App: /manifest.webmanifest e /sw.js rispondono 200 (manifest con Content-Type application/manifest+json); in Chrome DevTools →
    Application → Manifest nessun errore; dal telefono Android compare «Installa app», da iPhone «Aggiungi alla schermata Home»;
    aperta dall'icona, dopo il primo accesso non chiede più la password.
G2. Sito (anchecasa-pulito, cartella sito) e Magazine (magazine-anchecasa, cartella magazine-sito): dal Registro non risultano modifiche
    dopo la pubblicazione delle 06:53. Confronta online/locale: se sono uguali NON ripubblicare; se no dimmi cosa cambia e aspetta il mio «ok».

======================================================================
PARTE H — Cloudflare
======================================================================
H1. App (Pages «app-anchecasa»): cd app-anchecasa; node scripts/prepara-pubblicazione.mjs; npx wrangler pages deploy dist --project-name app-anchecasa --branch main
    (solo se il contenuto è cambiato dall'ultimo deploy). Controlla che i file .sql NON siano online (404).
H2. app.anchecasa.it risponde 522/523 da stamattina: controlla in Cloudflare (Workers & Pages → app-anchecasa → Custom domains e DNS)
    perché è «pending» e dimmi esattamente cosa devo cliccare io. Il token nel file non è valido: non usarlo, usa il login di wrangler.
H3. AncheSicura (Pages «sicura», cartella sicura-DA-CARICARE-SU-CLOUDFLARE): confronta con l'online, ripubblica solo se diverso e dopo il mio «ok».
H4. Ricordami (li faccio io): Supabase → Authentication → URL Configuration con https://app.anchecasa.it; chiave Google Maps con https://app.anchecasa.it/*.

======================================================================
ALLA FINE
======================================================================
Voce nel Registro di CLAUDE.md e un riassunto in poche righe:
app-14 e app-15 eseguiti sì/no · funzioni pubblicate · commit (hash e ramo) · cosa è stato pubblicato su Vercel e Cloudflare con gli indirizzi ·
esito delle prove · secrets mancanti (solo nomi) · cosa resta da fare a me.
