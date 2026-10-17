COMANDO PER CURSOR — Mettere online tutto il lavoro dell'11.10.2026 (app AncheCasa 2.7 + SuperMastro)

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Prima di ogni passo che cambia qualcosa online (database, funzioni, secrets, pubblicazioni, push) mostrami cosa farai e aspetta il mio «ok».

REGOLE (obbligatorie)
1. Nessuna chiave, password, token o indirizzo del database in chat, nei file o nei commit. Dei secrets mostri solo i NOMI.
2. Non modificare i file SQL, le funzioni e i file JS dell'app. Se qualcosa dà errore: fermati e mostrami l'errore esatto.
3. Non toccare: area-privata, sito, magazine, sicura, anchebandi, ecosistema-anchecasa (sono altri lavori).
4. Ogni passo fatto va annotato in cima al «Registro delle modifiche» di CLAUDE.md (non cancellarlo, non spostarlo).

======================================================================
PARTE A — Collegarsi al database (stamattina ti eri fermato qui)
======================================================================
Il problema era: niente MCP di Supabase, niente SUPABASE_DB_URL, psql non nel percorso.
A1. Cerca psql: "C:\Program Files\PostgreSQL\16\bin\psql.exe" (o la cartella di PostgreSQL 16 che trovi). Usalo con il percorso completo.
A2. Chiedimi di impostare io l'indirizzo del database nel terminale di Cursor (PowerShell):
      $env:SUPABASE_DB_URL = "<lo incollo io>"
    Dove lo prendo io: Supabase → progetto edsvmnxojsmknjuhobqa → pulsante «Connect» → «Session pooler»
    (quello che funziona da qualsiasi rete), con la password del database al posto di [YOUR-PASSWORD].
    Tu NON devi leggerlo, stamparlo o salvarlo in un file.
A3. Prova il collegamento (solo lettura):  & "<percorso psql>" "$env:SUPABASE_DB_URL" -c "select current_database();"

======================================================================
PARTE B — App AncheCasa (cartella app-anchecasa)
======================================================================
B1. Controllo (solo lettura) — mostrami la tabella:
select file, gia_fatto from (values
 ('app-01', to_regclass('marketplace.app_richieste') is not null),
 ('app-02', to_regclass('marketplace.app_org') is not null),
 ('app-03', to_regclass('marketplace.app_contatti') is not null),
 ('app-04', exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'marketplace' and p.proname = 'app_puo_invitare')),
 ('app-05', to_regclass('marketplace.app_proposte_rete') is not null),
 ('app-06', to_regclass('marketplace.app_strategie') is not null),
 ('app-07', to_regclass('marketplace.app_documenti') is not null),
 ('app-08', to_regclass('marketplace.app_fe_documenti') is not null),
 ('app-09', to_regclass('marketplace.app_sopralluoghi') is not null),
 ('app-10', to_regclass('marketplace.app_scadenze') is not null),
 ('app-11', to_regclass('marketplace.app_prezzari') is not null),
 ('app-12', to_regclass('marketplace.app_sub_richieste') is not null),
 ('app-13', to_regclass('marketplace.app_mag_movimenti') is not null),
 ('pg_cron attivo', exists (select 1 from pg_extension where extname = 'pg_cron'))
) v(file, gia_fatto) order by file;
Se manca uno tra app-01 e app-07: dimmelo e fermati. Se pg_cron è false: chiedimi di attivarlo
(Supabase → Database → Extensions → pg_cron) e aspetta il mio «fatto». Poi aspetta il mio «ok».

B2. Esegui SOLO i file mancanti, uno alla volta, in ordine (app-08 → app-13):
      & "<percorso psql>" "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f sql\<file>.sql
    Dopo ognuno: «app-XX fatto» oppure l'errore (e ti fermi).

B3. Verifica — riesegui B1 (tutti true) e poi:
select
 (select count(*) from marketplace.app_stima_lavorazioni) as lavorazioni_18,
 (select count(*) from marketplace.app_fe_piani) as piani_fatture,
 (select count(*) from marketplace.app_fascicolo_requisiti) as requisiti_fascicolo,
 exists (select 1 from marketplace.app_impostazioni where chiave = 'stima_flash') as impostazioni_stima,
 exists (select 1 from marketplace.app_impostazioni where chiave = 'profit_guard') as impostazioni_profit_guard,
 (select string_agg(id || case when public then ' (pubblico)' else '' end, ', ' order by id) from storage.buckets where id in ('sopralluoghi', 'fascicolo', 'loghi')) as bucket,
 has_function_privilege('anon', 'marketplace.app_stima_pubblica(uuid)', 'execute') as link_cliente_aperto,
 has_function_privilege('anon', 'marketplace.app_invito_leggi(uuid)', 'execute') as link_fornitore_aperto,
 has_table_privilege('anon', 'marketplace.app_sopralluoghi', 'select') as anon_sopralluoghi_deve_essere_false,
 has_table_privilege('anon', 'marketplace.app_sub_offerte', 'select') as anon_offerte_deve_essere_false,
 has_table_privilege('anon', 'marketplace.app_mag_movimenti', 'select') as anon_magazzino_deve_essere_false;
Giusto se: lavorazioni_18 = 18; piani e requisiti > 0; impostazioni true;
bucket «fascicolo, loghi (pubblico), sopralluoghi»; i due «aperto» true; gli ultimi tre false. Se non torna: fermati.

B4. Funzioni (Edge Functions). Chiedimi di fare io «npx supabase login» nel terminale (si apre il browser). Poi, dopo il mio «ok»:
      npx supabase functions deploy sdi-gateway --project-ref edsvmnxojsmknjuhobqa --no-verify-jwt
      npx supabase functions deploy sopralluogo-flash --project-ref edsvmnxojsmknjuhobqa --no-verify-jwt
      npx supabase functions deploy subappalti-mail --project-ref edsvmnxojsmknjuhobqa --no-verify-jwt
    (dalla cartella app-anchecasa; se ti chiede Docker, aggiungi --use-api). Non toccare supermastro-analisi e gare-analisi.
    Prova senza accesso (non scrive niente), tutte e tre devono rispondere «accesso_richiesto»:
      curl.exe -s -X POST https://edsvmnxojsmknjuhobqa.supabase.co/functions/v1/sdi-gateway -H "Content-Type: application/json" -d "{}"
      (idem per sopralluogo-flash e subappalti-mail)

B5. Secrets — «npx supabase secrets list --project-ref edsvmnxojsmknjuhobqa», SOLO i nomi. Dimmi quali MANCANO tra:
      GEMINI_API_KEY, SDI_WEBHOOK_SEGRETO, MAIL_PROVIDER, MAIL_API_KEY, MAIL_MITTENTE, APP_URL, PRIVACY_URL, DIAGNOSI_ORIGINI.
    Non crearli tu. Valori da mettere io: APP_URL = https://app.anchecasa.it ;
    DIAGNOSI_ORIGINI deve contenere anche https://app.anchecasa.it (se esiste già, me lo ricordi senza mostrarmi il valore).

B6. Pubblicazione dell'app su Cloudflare Pages (dopo il mio «ok»):
      cd app-anchecasa
      node scripts/prepara-pubblicazione.mjs          → deve dire «OK: dist/ pronta …»
      npx wrangler pages project list                  → se non c'è «app-anchecasa»:
      npx wrangler pages project create app-anchecasa --production-branch main
      npx wrangler pages deploy dist --project-name app-anchecasa --branch main
    Poi dimmi l'indirizzo *.pages.dev e chiedimi di collegare io il dominio:
    Cloudflare → Workers & Pages → app-anchecasa → Custom domains → app.anchecasa.it.
    Ricordami anche (li faccio io): Supabase → Authentication → URL Configuration → aggiungere https://app.anchecasa.it;
    Google Cloud → chiave Maps → aggiungere https://app.anchecasa.it/* alle restrizioni.

B7. Controllo online: apri l'indirizzo *.pages.dev e poi https://app.anchecasa.it (quando c'è):
    - si apre la pagina di accesso;
    - https://…/index.html?prova → «Impresa · titolare» → Moduli → Magazzino: un articolo → «Arrivo merce» funziona;
    - https://…/sql/app-13-magazzino-mezzi.sql deve dare errore 404 (i file SQL NON devono essere online).

B8. Git (dopo il mio «ok»): commit in ANCHECASA-PULITO dei file dell'app (app-anchecasa/, CLAUDE.md), senza dist/ e supabase/.temp/.
    Messaggio: «App AncheCasa 2.7: magazzino e mezzi, logo della ditta, pubblicazione su Cloudflare Pages». Push su main solo dopo il mio «ok».
    Non includere i file di altri lavori (area-privata, anchebandi, supabase/migrations/20261011103000_e_procurement.sql): dimmi che ci sono e lasciali.

======================================================================
PARTE C — SuperMastro
======================================================================
Chiudi questa cartella e apri C:\Users\palum\Desktop\04-SuperMastro.
Segui il comando che c'è nel file docs\COMANDO-CURSOR-SUPERMASTRO-ONLINE-v1.md (passi 1–7), con le stesse regole di qui.
Per il database usa lo stesso indirizzo $env:SUPABASE_DB_URL (è lo stesso progetto Supabase) se «npm run db:push» lo chiede.

======================================================================
ALLA FINE
======================================================================
Scrivimi in poche righe, per l'app e per SuperMastro: cosa è stato eseguito e pubblicato, esito delle verifiche,
secrets mancanti (solo i nomi), indirizzi online, cosa resta da fare a me.
