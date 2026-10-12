# AncheCasa · cartella pulita

Sito ufficiale www.anchecasa.it (cartella `sito`, progetto Vercel anchecasa-pulito), area privata, mail, marchio, sicura.

## Regola fissa: registro delle modifiche

Ogni modifica a questo progetto, fatta da Claude, da Cursor o da una persona, va annotata qui sotto nel **Registro delle modifiche**, prima di chiudere il lavoro.

- Una voce per ogni intervento, la più recente in alto.
- Formato: data e ora (Europe/Rome), chi l'ha fatta, cosa è cambiato, quali file.
- Se si annulla qualcosa, si annota anche l'annullamento.
- Questo file non si cancella e non si sposta: resta nella cartella principale del progetto.

## Regole fisse · 11.10.2026, 17:25 (decisioni di Nando)

1. ANCHECASA-PULITO è l'unica cartella ufficiale di AncheCasa. Le cartelle fuori (ANCHECASA-LAVORO, BIM-SICUR, 04-SuperMastro e le altre) non sono più ufficiali: non si lavora più lì.
2. ~~L'app AncheCasa è l'unica dashboard per privati, aziende e fornitori.~~ **Cambiata il 12.10.2026 da Nando, vedi sotto.**
3. ~~Le funzioni nuove si fanno solo nell'app.~~ **Cambiata il 12.10.2026 da Nando, vedi sotto.**
4. app.anchecasa.it non si usa più per l'app nuova e non si tocca.

## Regole fisse · 12.10.2026, 07:50 (decisioni di Nando)

1. **La dashboard ufficiale di tutti è l'area privata** (cartella `area-privata`): admin, rete, privati, aziende e fornitori. Si adatta al profilo; i pulsanti di ogni profilo li decide l'admin in «Pulsanti per profilo».
2. **Si entra con l'accesso dell'area privata**, anche da https://entra.anchecasa.it: entra.anchecasa.it e areaprivata.anchecasa.it aprono lo stesso sito. L'accesso dell'app (la pagina «Un'app sola per la casa e per il lavoro») non si usa.
3. Le funzioni che oggi esistono solo nell'app (`app-anchecasa`: Ufficio, Cantieri e SAL, Gare, Lotti, Magazzino…) si portano nell'area privata, un profilo alla volta, seguendo `PROGETTO-DASHBOARD.md`. L'app resta come riserva su app-anchecasa.pages.dev.
4. Stile unico: quello dell'area privata (dashboard, accesso e mail).
5. Si progetta, si prova in anteprima e solo con l'ok di Nando si toccano Supabase e la pubblicazione.
6. La dashboard del cliente Sicura (altro progetto) non si tocca.

## Registro delle modifiche

### 12.10.2026 12:05 · Claude — Promemoria in preventivi-avvisa (limite 100 funzioni) e mail della password con il look dell'invito (NON pubblicato)
- Il progetto Supabase ha 100 funzioni (voce Cursor 11:55): `fornitori-promemoria` non si può pubblicare. Il lavoro di ogni giorno (scadute, promemoria dopo 3 giorni, «Hai firmato?» dopo 30) è ora in `preventivi-avvisa`, `{ evento: "giornaliero" }`. `app-22b-promemoria-ogni-giorno.sql` chiama `preventivi-avvisa` con quel corpo. La cartella `fornitori-promemoria` resta solo come riferimento (scritto in cima al file).
- `reset-password-marketplace/index.ts` (scaricata da Cursor): la mail del «Password dimenticata» dell'area privata è ora `MailInvito.avviso("password")` (stesso look dell'invito, `_shared/mail-invito.js`) e il link porta a https://entra.anchecasa.it/nuova-password.html. Token, limite di un invio al minuto e risposte non cambiano.
- Controllati con esbuild e pglast.
- Da fare con l'ok di Nando: ripubblicare `preventivi-avvisa` e `reset-password-marketplace` (verify_jwt spento, con `_shared`), poi eseguire `app-22b`.

### 12.10.2026 11:55 · Cursor — app-22 eseguito, avvisi ripubblicati, area privata online; promemoria fermo al limite di 100 funzioni
- Ok di Nando del 12.10.2026, ore 11:41, per il commit `5fda7c2`. Eseguito `app-anchecasa/sql/app-22-fornitori-regole-giro.sql` sul progetto ANCHECASA. Funzioni: `fornitore_numeri`, `fornitori_chiudi_scadute`, `fornitori_verifica`, `fornitori_verifica_info`, `fornitori_verifiche_admin`. Colonne `promemoria_il`, `verifica_il`, `cliente_firmato`, `cliente_risposta_il` su `energia_richieste` e `servizi_richieste`; su `prev_richieste` c'è `promemoria_il`.
- Ripubblicate con `_shared/mail-marchio.ts`, verify_jwt spento: `energia-avvisa` versione 5, `servizi-avvisa` versione 3, `preventivi-avvisa` versione 2.
- `fornitori-promemoria` non è online. Il progetto ha già 100 funzioni e Supabase risponde 402 «Max number of functions reached». La chiamata a mano risponde 404, corpo `Requested function was not found`: niente scadute, promemoria o verifiche. `app-22b-promemoria-ogni-giorno.sql` non è stato eseguito: lo script dice di lanciarlo dopo che la funzione è pubblicata. Nessun'altra funzione è stata spenta.
- Git push sul ramo main: `c8b8c14..5fda7c2`.
- Area privata, progetto Vercel `area-privata-produzione`, deployment `dpl_Angz3FsvzP8epkf1vh4NQeUGRqoV`, alias https://entra.anchecasa.it e https://areaprivata.anchecasa.it. https://entra.anchecasa.it/verifica.html e https://areaprivata.anchecasa.it/verifica.html rispondono 200, 7714 byte. La dashboard online carica `js/energia.js?v=3`, `js/servizi.js?v=3`, `js/preventivi.js?v=2`, `js/fornitori-admin.js?v=4`.
- Scaricata, senza ripubblicarla, `reset-password-marketplace` (resta versione 15, verify_jwt spento) in `app-anchecasa/supabase/functions/reset-password-marketplace/index.ts`. Il file è nella cartella e non è nel commit `5fda7c2`.
- Sito, magazine, app e Sicura non toccati.
- File: `CLAUDE.md`, `app-anchecasa/supabase/functions/reset-password-marketplace/index.ts`.

### 12.10.2026 11:55 · Claude — Regole del giro fornitori: 5 proposte, scadenza, promemoria, verifica dei contratti, numeri del mese (NON pubblicato, SQL NON eseguito)
- Decisioni di Nando delle 11:41 (punti 2, 3, 4 e verifica dopo 30 giorni). Vale per luce e gas, telefono, finanza, materiali, noleggio, casa.
- `app-anchecasa/sql/app-22-fornitori-regole-giro.sql` (da eseguire solo con l'ok di Nando): massimo 5 proposte per richiesta; richieste aperte solo 15 giorni (stato «scaduta», proposte non scelte → «non scelta»); alla scelta le altre proposte diventano «non scelta»; colonne `promemoria_il`, `verifica_il`, `cliente_firmato`, `cliente_risposta_il`; funzioni `fornitori_chiudi_scadute`, `fornitori_verifica`, `fornitori_verifica_info`, `fornitori_verifiche_admin`, `fornitore_numeri`. Stesse firme delle funzioni già online. Sintassi controllata con pglast.
- `app-anchecasa/sql/app-22b-promemoria-ogni-giorno.sql`: pg_cron alle 6:00 UTC chiama `fornitori-promemoria` (da eseguire dopo aver pubblicato la funzione).
- NUOVA funzione `fornitori-promemoria` (verify_jwt spento): chiude le scadute, promemoria al cliente dopo 3 giorni se ha proposte, mail «Hai firmato con …?» 30 giorni dopo la scelta (luce e gas, telefono, finanza). Ogni mail parte una volta sola. Mail con il look dell'invito (`_shared/mail-marchio.ts`: `mailPromemoria`, `mailVerifica`).
- NUOVA pagina `area-privata/verifica.html` (Sì / No del cliente).
- Dashboard: nella Home di ogni fornitore «Questo mese: richieste ricevute · proposte mandate · scelte · contratti o lavori chiusi» (`AC.numeriMese` in `servizi.js`); nelle richieste «x di 5 proposte · scade tra N giorni». Admin Fornitori: «Contratti da verificare» (il cliente dice firmato, il fornitore non l'ha segnato → «Da controllare»). Pagine del cliente (`offerte.html`, `servizi.html`, `preventivi.html`): richiesta scaduta senza pulsanti. `energia.js` v=3, `servizi.js` v=3, `preventivi.js` v=2, `fornitori-admin.js` v=4.
- Prova in anteprima (Playwright): numeri del mese e righe delle richieste per luce e gas, telefono, materiali; admin. Nessun errore nuovo.
- Da sapere (voce Cursor 11:40): il «Password dimenticata» dell'area privata usa `reset-password-marketplace` (mail vecchia, link su areaprivata), non `auth-email-hook`. Da scaricare in cartella e portare al look dell'invito.
- Sito, magazine, app, Sicura e database non toccati.

### 12.10.2026 11:40 · Cursor — auth-email-hook pubblicata con il look dell'invito
- Ok di Nando del 12.10.2026, ore 11:40, per il commit `c8b8c14`. Pubblicata `auth-email-hook` (versione 170, verify_jwt spento). Con la funzione sono saliti `_shared/mail-invito.js` e `_shared/mail-marchio.ts`. Il gancio «Send email» e i segreti non sono stati toccati. La versione 169 non è stata rimessa: la prova non ha dato errore.
- `invia-invito-marketplace` non è stata ripubblicata. Era già la versione 23, verify_jwt acceso, con il link `https://entra.anchecasa.it/benvenuto.html`.
- Git push sul ramo main: `d4aaf3f..c8b8c14`.
- Prova «Password dimenticata» su https://entra.anchecasa.it, mail `prova-agente-campania-1210@anchecasa.it`. La pagina ha scritto «Se l'indirizzo è registrato, riceverai un'email con il link.» Quel pulsante non passa da `auth-email-hook`: chiama `reset-password-marketplace` (versione 15, non ripubblicata). La mail di quella funzione è quella di prima, più semplice, e il pulsante apre `https://areaprivata.anchecasa.it/nuova-password.html`. La pagina si apre, titolo «AncheCasa · Nuova password». Il look nuovo è nelle mail che partono da `auth-email-hook` (iscrizione e recupero di Auth). La casella non è stata aperta da qui.
- Sito, magazine, app, database e Sicura non toccati.
- File: `CLAUDE.md`.

### 12.10.2026 11:40 · Claude — Mail di iscrizione e di password con il look dell'invito (NON pubblicato)
- Nando: tutte le mail con lo stesso look. Le mail di Supabase Auth le manda `auth-email-hook` (scaricata da Cursor alle 11:20): avevano il layout vecchio (blu chiaro e giallo, logo al centro).
- `app-anchecasa/supabase/functions/auth-email-hook/index.ts`: «signup» e «recovery» usano ora le mail approvate di `mail/invito/mail-invito.js` (copiata in `_shared/mail-invito.js`): `MailInvito.iscrizione(famiglia, {link, nome})` per privato, azienda, agente (richiesta di collaborazione), fornitore; `MailInvito.avviso("password")` per la password. Agente invitato (metadato `invito`): mail «Benvenuto nella rete» con `_shared/mail-marchio.ts`. Gli altri tipi (invite, magiclink, email_change, reauthentication) restano come prima. Firma del webhook, mittente e link non cambiano.
- Controllato con esbuild; mail disegnate e guardate (iscrizione privato e azienda, password).
- Da fare con l'ok di Nando: ripubblicare `auth-email-hook` (verify_jwt spento, come ora), con la cartella `_shared`.

### 12.10.2026 11:30 · Cursor — invito ripubblicato con il link di entra; copia di auth-email-hook nel commit
- Ok di Nando del 12.10.2026, ore 11:26, per il commit `53e5933`. Ripubblicata `invia-invito-marketplace` dal file `mail/invito/funzione-caricata-invia-invito-marketplace.ts` (versione 23). verify_jwt resta acceso. La funzione online ha `https://entra.anchecasa.it/benvenuto.html`. `auth-email-hook` non è stata ripubblicata: resta versione 169.
- Prova del pulsante, senza scrivere sul database e senza mandare una mail: l'indirizzo del pulsante è `https://entra.anchecasa.it/benvenuto.html?invito=…`. Aperto `https://entra.anchecasa.it/benvenuto.html?invito=prova-entra-1210`: titolo «Benvenuto · AncheCasa», la pagina resta su entra. Con un token che non esiste compare «Link non valido».
- Nel commit, insieme a questa voce, la voce delle 11:20 e i file scaricati di `auth-email-hook` (`index.ts`, `deno.json`, `_shared/email-templates/`, `_shared/email-brand/enterprise-layout.tsx`).
- Sito, magazine, app, database e Sicura non toccati.
- File: `CLAUDE.md`, `app-anchecasa/supabase/functions/auth-email-hook/`, `app-anchecasa/supabase/functions/_shared/email-templates/`, `app-anchecasa/supabase/functions/_shared/email-brand/enterprise-layout.tsx`.

### 12.10.2026 11:20 · Cursor — app-21 eseguito, preventivi-avvisa e invito pubblicati, area privata online
- Ok di Nando del 12.10.2026 per il commit `7b63cbf`. Eseguito `app-anchecasa/sql/app-21-fornitori-preventivi-zona.sql` sul progetto ANCHECASA. Controlli: ci sono `prev_richieste`, `prev_proposte`, `fornitori_zona`, `noleggio_mezzi`, `noleggio_occupato`. Funzioni: `prev_accetta`, `prev_categoria_di`, `prev_chiudi`, `prev_copre`, `prev_i_miei_preventivi`, `prev_io`, `prev_nuova_richiesta`, `prev_posso_proporre`, `prev_richieste_per_me`, `prev_tipi_di`, `prev_vicinanza`, `noleggio_liberi`. Nel controllo dei nomi compare anche `preview_invite_link_public`, già presente, perché il nome comincia con `prev_`.
- Pubblicata `preventivi-avvisa` (versione 1, verify_jwt spento) con `_shared/mail-marchio.ts`. `energia-avvisa` resta versione 4 e `servizi-avvisa` versione 2: non sono state ripubblicate.
- Pubblicata `invia-invito-marketplace` dal file `mail/invito/funzione-caricata-invia-invito-marketplace.ts` (versione 22). verify_jwt resta acceso. La voce delle 10:50 diceva che online c'era ancora la copia del 06.10.2026: ora online è questo file.
- Scaricata, senza ripubblicarla, `auth-email-hook` (resta versione 169, verify_jwt spento). In `app-anchecasa/supabase/functions/auth-email-hook/` ci sono `index.ts` e `deno.json`. I modelli che la funzione importa, e che in cartella non c'erano, sono in `_shared/email-templates/` e `_shared/email-brand/enterprise-layout.tsx`. `brand.ts` era già uguale e non è stato riscritto.
- Git push sul ramo main: `d06a837..7b63cbf`.
- Area privata, progetto Vercel `area-privata-produzione`, deployment `dpl_8CD5RSHciNg3zrRqMz1MSY8jvLMJ`, alias https://entra.anchecasa.it e https://areaprivata.anchecasa.it. Online: `js/preventivi.js?v=1`, `js/app.js?v=25`, `js/servizi.js?v=2`. https://entra.anchecasa.it/preventivi.html risponde 200, 12414 byte. La voce delle 11:05 diceva non pubblicato e SQL non eseguito: ora lo SQL è eseguito e le pagine sono online.
- Sito, magazine, app e Sicura non toccati.
- File: `CLAUDE.md`, `app-anchecasa/supabase/functions/auth-email-hook/`, `app-anchecasa/supabase/functions/_shared/email-templates/`, `app-anchecasa/supabase/functions/_shared/email-brand/enterprise-layout.tsx`.

### 12.10.2026 11:05 · Claude — Materiali edili, Noleggio, Servizi per la casa: preventivi con la zona (NON pubblicato, SQL NON eseguito)
- Decisioni di Nando delle 10:47 in `PROGETTO-DASHBOARD.md`. Tabelle e pagine nuove; luce e gas, telefonia e finanza non cambiano (solo la pagina «Offerte per i clienti» della rete ha tre schede in più).
- `app-anchecasa/sql/app-21-fornitori-preventivi-zona.sql` (da eseguire solo con l'ok di Nando): `fornitori_zona`, `prev_richieste`, `prev_proposte`, `noleggio_mezzi`, `noleggio_occupato`; funzioni `prev_*` e `noleggio_liberi`; `fornitori_per_admin` con le nuove categorie. Sintassi controllata con pglast.
- `app-anchecasa/supabase/functions/preventivi-avvisa/index.ts` (nuova, verify_jwt spento) e `_shared/mail-marchio.ts` (`mailPreventivi`, stesso look della mail d'invito, tu per il privato, Lei per le aziende).
- `area-privata/preventivi.html`: pagina del cliente dal link nella mail, preventivi dal più vicino.
- `area-privata/dashboard/js/preventivi.js` (nuovo): fornitore `mat_*`, `nol_*` (con «I miei mezzi»), `cas_*`; impresa `az-materiali`, `az-noleggio` (piega «Per il cantiere»); privato `pv-casa`; rete: schede in `re-offerte` (`servizi.js` v=2).
- `app.js` v=25: tipi `azienda_materiali_edili` → materiali, `azienda_noleggio_attrezzature` → noleggio, `azienda_traslochi`, `_facchinaggio`, `_pulizie`, `_manutenzione_stabili` → casa; profili in Pulsanti per profilo; prima pagina. `fornitori-admin.js` v=3, `sala-demo.js` v=6, `pulsanti-profili.js` v=7, `energia.css` v=4.
- Prova in anteprima (Playwright): i tre fornitori (richiesta, preventivo, ordini, zona, mezzi), impresa (materiali, noleggio con «cosa è libero»), privato, rete, admin. Nessun errore nuovo.
- Fatto alle 11:20, con l'ok di Nando: lo SQL è eseguito, `preventivi-avvisa` è online e l'area privata è pubblicata. Sito, magazine, app e Sicura non toccati.

### 12.10.2026 10:50 · Cursor — energia-avvisa e servizi-avvisa ripubblicate; controllo mail di accesso e invito
- Ok di Nando del 12.10.2026. Ripubblicate `energia-avvisa` (versione 4) e `servizi-avvisa` (versione 2), verify_jwt spento, con `_shared/mail-marchio.ts`. Le altre funzioni non sono state ripubblicate. Il database non è stato toccato.
- Git push sul ramo main: `b98bb7f..d06a837`.
- Solo lettura, niente modifiche. Modelli in Authentication → Email Templates: «Confirm signup» ha oggetto «Conferma il tuo accesso — SuperMastro». «Reset password» ha oggetto «Reset your password» (l'inglese di base). Il corpo di questi due modelli, e quindi il logo dentro il modello, non esce dal config che la CLI sa leggere. Il gancio «Send email» è acceso e punta a `auth-email-hook`: le mail che partono sono quelle della funzione, AncheCasa. Conferma: oggetto «Conferma il tuo Profilo AncheCasa», logo `logo-anchecasa-email.png`. Reset: oggetto «Reimposta la password AncheCasa», stesso logo. Il nome del mittente è «AncheCasa Registrazioni».
- `invia-invito-marketplace` online (versione 21, verify_jwt acceso) non è il file `mail/invito/funzione-caricata-invia-invito-marketplace.ts`. Online è la copia del 06.10.2026: AncheCasa, «Sei invitato su AncheCasa», logo `anchecasa.it/assets/logo/anchecasa-orizzontale-trasparente.png`. Il file in cartella è la mail del 10.10.2026, con logo, curva e dati Palumbo Investment. Nessuna delle due è SuperMastro. Alle 11:20, con l'ok di Nando, la funzione online è stata sostituita con questo file (versione 22, verify_jwt acceso).
- Sito, magazine, area privata, app e Sicura non toccati.
- File: `CLAUDE.md`.

### 12.10.2026 10:45 · Claude — Mail di luce e gas, telefono e finanza con il look della mail d'invito (NON pubblicato)
- Nando: tutte le mail e i moduli di accesso con lo stesso look. Le mail di `energia-avvisa` e `servizi-avvisa` avevano un look semplificato (logo, filo, pulsante, piede blu): ora usano la stessa impaginazione della mail d'invito approvata (`mail/invito/mail-invito.js`, `impagina`): logo e anchecasa.it, filo arancio, foto, etichetta, spunte, pulsante, riquadro blu con 3 passi, curva del marchio, piede blu con logo bianco.
- NUOVO `app-anchecasa/supabase/functions/_shared/mail-marchio.ts` (`mailMarchio`, `mailGiro`): le cinque mail del giro fornitori (richiesta al cliente, richiesta al fornitore, proposta, scelta, accordo). `energia-avvisa/index.ts` e `servizi-avvisa/index.ts` riscritti per usarlo; la logica e i link non cambiano. Controllati con esbuild; mail di prova disegnata (immagini da https://anchecasa.it/assets/mail/).
- Fatto alle 10:50, con l'ok di Nando: `energia-avvisa` e `servizi-avvisa` sono online con `_shared`, verify_jwt spento.
- Sito, magazine, app, Sicura e database non toccati.

### 12.10.2026 10:32 · Cursor — ricontrollo app-20, ok delle 10:26, registro in commit
- Ok di Nando del 12.10.2026, ore 10:26, per il commit `ec49033`. Lo SQL era già eseguito alle 10:28 e non è stato rilanciato. I due controlli tornano a posto: `servizi_richieste`, `servizi_offerte`, `servizi_proposte`; funzioni `servizi_accetta`, `servizi_categoria_di`, `servizi_contratto_attivato`, `servizi_le_mie_proposte`, `servizi_mia_categoria`, `servizi_nuova_richiesta`, `servizi_offerte_pubbliche`, `servizi_richiesta_aperta`, `servizi_richieste_per_me`.
- `servizi-avvisa` è già online, verify_jwt spento, versione 1. Non è stata ripubblicata. `energia-avvisa` e le altre funzioni non sono state toccate.
- GitHub era già su `ec49033`. Area privata già pubblicata, deployment `dpl_7FkRf18ZrGSA77vwvkXqPhwvFtWv`. Controllo online, su entra e su areaprivata: `js/servizi.js?v=1` e `js/app.js?v=24`. https://entra.anchecasa.it/servizi.html risponde 200, 11579 byte.
- Sito, magazine, app e Sicura non toccati.
- File: `CLAUDE.md`.

### 12.10.2026 10:28 · Cursor — app-20 eseguito, servizi-avvisa e area privata pubblicati
- Ok di Nando del 12.10.2026. Eseguito `app-anchecasa/sql/app-20-fornitori-telefonia-finanza.sql` sul progetto ANCHECASA. Controlli: ci sono `servizi_richieste`, `servizi_offerte`, `servizi_proposte`. Funzioni: `servizi_accetta`, `servizi_categoria_di`, `servizi_contratto_attivato`, `servizi_le_mie_proposte`, `servizi_mia_categoria`, `servizi_nuova_richiesta`, `servizi_offerte_pubbliche`, `servizi_richiesta_aperta`, `servizi_richieste_per_me`.
- Pubblicata solo la funzione `servizi-avvisa` (verify_jwt spento, stato attivo, versione 1). Le altre funzioni non sono state toccate.
- GitHub, ramo main: `3ee21f0..ec49033`.
- Area privata, progetto Vercel `area-privata-produzione`, deployment `dpl_7FkRf18ZrGSA77vwvkXqPhwvFtWv`, alias https://entra.anchecasa.it e https://areaprivata.anchecasa.it. Online: `js/servizi.js?v=1`. https://entra.anchecasa.it/servizi.html risponde 200, 11579 byte. La voce delle 10:05 diceva non pubblicato e SQL non eseguito: ora lo SQL è eseguito e le pagine sono online.
- Sito, magazine, app e Sicura non toccati.
- File: `CLAUDE.md`.

### 12.10.2026 10:05 · Claude — Telefonia e internet, Finanza e assicurazioni (NON pubblicato, SQL NON eseguito)
- Decisioni di Nando delle 09:44 in `PROGETTO-DASHBOARD.md` (Fornitori). Stesso giro di luce e gas, motore unico per le due categorie; luce e gas (`energia.js`, `offerte.html`, `energia-avvisa`) non toccato.
- `app-anchecasa/sql/app-20-fornitori-telefonia-finanza.sql` (da eseguire solo con l'ok di Nando): tabelle `servizi_offerte`, `servizi_richieste`, `servizi_proposte`; funzioni `servizi_*`; colonna `energia_carta.iscrizione` (OAM/IVASS); `fornitori_per_admin` con le nuove categorie; `energia_contratto_attivato` e `servizi_contratto_attivato` registrano la vendita al commerciale (`app_vendite`, cosa «servizio») quando la richiesta l'ha fatta lui. Sintassi controllata con pglast.
- `app-anchecasa/supabase/functions/servizi-avvisa/index.ts` (nuova, verify_jwt spento): mail richiesta, proposta, scelta, accordo per telefonia e finanza.
- `area-privata/servizi.html`: pagina del cliente dal link nella mail (come `offerte.html`).
- `area-privata/dashboard/js/servizi.js` (nuovo): dashboard del fornitore (`tel_*`, `fin_*`), pagine `pv-offerte-tel`, `pv-offerte-fin` (privato), `az-telefonia`, `az-finanza` (imprese, piega «Risparmia»), `re-offerte` (rete: luce e gas, telefono, finanza per un cliente). Dati di esempio in anteprima.
- `app.js` v=24: pack `telefonia` e `finanza`, tipi `azienda_telefonia` e `azienda_finanza`, profili in Pulsanti per profilo, prima pagina, voci nuove. `views.js` v=9: categorie d'invito «Fornitori di telefonia e internet» e «Banche, mediatori creditizi e assicurazioni». `fornitori-admin.js` v=2: nuove categorie, richieste telefono e finanza, mail dell'accordo da `servizi-avvisa`. `sala-demo.js` v=5: vetrine Telefono e internet, Finanza e assicurazioni. `pulsanti-profili.js` v=6: «Guarda come» anche per i fornitori. `energia.css` v=3.
- Prova in anteprima (Playwright): fornitore telefonia e finanza (accordo, richiesta, proposta, offerte, clienti), privato, impresa, rete, admin Fornitori, `servizi.html` con dati finti. Nessun errore nuovo.
- Sito, magazine, app, Sicura e database non toccati.

### 12.10.2026 09:42 · Cursor — area privata: profili mai salvati vedono i pulsanti
- Ok di Nando del 12.10.2026, ore 09:38. Pubblicata solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_2aWKwDE3wcJbszzzzMguG1WA3ccp`, alias https://entra.anchecasa.it e https://areaprivata.anchecasa.it. Sito, magazine, app, database e Sicura non toccati.
- Privato, i cinque ruoli della Rete, Azienda e Fornitori, finché l’admin non salva i pulsanti, vedono tutti i loro pulsanti, gratis. Un profilo già salvato resta sulla scelta salvata. Se la lettura delle scelte non riesce, il menu resta vuoto.
- Il fornitore, al primo ingresso, va su `#/azienda/profilo` (prima l’indirizzo usava la famiglia `fornitore`, che la dashboard non apre).
- Controllo online: le due dashboard caricano `js/pulsanti-profili.js?v=5`. In anteprima, senza scelte salvate, il privato vede le sei categorie e il fornitore di materiali vede Pubblica, Chat, Inviti, Il tuo mese, Ufficio e Vendita. Lo script `app.js` online manda il primo ingresso su `#/` più `admin.tipo` più `/profilo`.
- File: `area-privata/dashboard/js/pulsanti-profili.js`, `area-privata/dashboard/js/app.js`, `area-privata/dashboard/index.html`, `CLAUDE.md`.

### 12.10.2026 09:37 · Cursor — ricontrollo di app-19: era già fatto, niente da rifare
- Stessa richiesta delle 09:36, con l’ok di Nando del 12.10.2026 ore 09:25. Push: `Everything up-to-date`, ramo main su `997096a`.
- app-18 non è stato rilanciato. La copia in `_backup-db-1210/handle_new_user_marketplace.sql` è ancora quella di prima di app-18. Le cinque colonne di `inviti_admin` ci sono.
- app-19 non è stato rilanciato. I controlli tornano a posto: `energia_richieste`, `fornitori_accordi`, `energia_proposte`; le undici funzioni `energia_*` e `fornitori_*`.
- `energia-avvisa` è già online, verify_jwt spento, versione 1. Non è stata ripubblicata. Le altre funzioni non sono state toccate.
- Area privata e magazine non sono stati ripubblicati: online restano `dpl_297ohEkVynAXH6W6o6kBKmMZJnk1` e `dpl_4usTGjGKdTBs8Rg5dYbQo9w47dT2`. https://entra.anchecasa.it/offerte.html risponde 200, 10516 byte. Su https://magazine.anchecasa.it/check-bollette c’è «Ricevi offerte migliori» (`check-bollette.js?v=2`); l’analisi luce 228,40 €, 420 kWh, 2 mesi è quella già fatta sulle 09:36, stessa pagina.
- Sito, sicura e app non toccati.
- File: `CLAUDE.md`.

### 12.10.2026 09:36 · Cursor — app-19 eseguito, funzione energia-avvisa, area privata e magazine pubblicati
- GitHub, ramo main: prima `dbd1c03..31c0af7` (fornitori di luce e gas), poi `31c0af7..997096a` (regole del fornitore, già nella cartella al momento della pubblicazione).
- app-18 era già eseguito: colonne nome, ruolo_rete, area, regione, superiore e tabelle `app_rete_note`, `app_riconoscimenti`, `app_rete_obiettivi`. Non è stato rilanciato.
- Eseguito `app-anchecasa/sql/app-19-fornitori-energia.sql` sul progetto ANCHECASA, ok di Nando del 12.10.2026. Controlli: ci sono `energia_richieste`, `fornitori_accordi`, `energia_proposte`, e anche `energia_carta` e `energia_offerte`. Funzioni: `energia_accetta`, `energia_contratto_attivato`, `energia_le_mie_proposte`, `energia_nuova_richiesta`, `energia_richiesta_aperta`, `energia_richieste_per_me`, `energia_sono_fornitore`, `fornitori_accordo_cambiato`, `fornitori_accordo_ok`, `fornitori_conferma_accordo`, `fornitori_per_admin`.
- Pubblicata solo la funzione `energia-avvisa` (verify_jwt spento, stato attivo, versione 1). Le altre funzioni non sono state toccate.
- Area privata, progetto Vercel `area-privata-produzione`, deployment `dpl_297ohEkVynAXH6W6o6kBKmMZJnk1`, alias https://entra.anchecasa.it. https://entra.anchecasa.it/offerte.html risponde 200, 10516 byte. Con la stessa pubblicazione è online anche `dashboard/regole/energia.html` (200, 11987 byte): la voce delle 10:00 diceva non pubblicato. Online: `energia.js?v=2`, `fornitori-admin.js?v=1`, `app.js?v=23`, `regole-admin.js?v=3`, `sala-demo.js?v=4`, `rete-progetto.js?v=2`.
- Magazine, progetto Vercel `magazine-anchecasa`, deployment `dpl_4usTGjGKdTBs8Rg5dYbQo9w47dT2`, alias https://magazine.anchecasa.it. Il primo invio dalla sola cartella si è fermato perché il progetto ha Root Directory `magazine-sito`; il secondo è partito dalla cartella principale. Online: `stile.css?v=5`, `check-bollette.js?v=2`. Su https://magazine.anchecasa.it/check-bollette, luce 228,40 €, 420 kWh, 2 mesi: «Paghi il 25% in più del giusto» e il tasto «Ricevi offerte migliori».
- Sito, sicura e app non toccati.
- File: `CLAUDE.md`.

### 12.10.2026 10:00 · Claude — «Regole del Fornitore di luce e gas» (NON pubblicato)
- `area-privata/dashboard/regole/energia.html`: stessa carta intestata. Chi è, la dashboard, il giro in sei passi, la privacy del cliente, l'accordo (senza conferma niente proposte), offerte e proposta, frasi, domande. 4 pagine A4.
- Pronto in Regole iscritti, in Sala demo (Luce e gas e documenti) e nella Formazione della rete.
- Nando ha dato l'ok anche alla funzione energia-avvisa (09:26).
- File: `regole/energia.html` (nuovo), `js/regole-admin.js` (?v=3), `js/sala-demo.js` (?v=4), `js/rete-progetto.js` (?v=2), `index.html`, `CLAUDE.md`.

### 12.10.2026 09:50 · Claude — Fornitori di luce e gas: giro completo (NON eseguito su Supabase, NON pubblicato)
- `app-anchecasa/sql/app-19-fornitori-energia.sql` (solo aggiunte, rilanciabile): comprende le tabelle del 09.10 mai applicate (energia_carta, energia_offerte, energia_proposte) e aggiunge energia_richieste (contatti visibili solo all'admin e al privato), `energia_nuova_richiesta` (anche senza accesso, max 3 al giorno per mail), `energia_richieste_per_me` (al fornitore senza contatti, con i contatti solo se il cliente ha scelto lui), `energia_le_mie_proposte` e `energia_accetta` (pagina del cliente dal link), `energia_contratto_attivato`, fornitori_accordi con `fornitori_conferma_accordo` (se l'admin cambia la provvigione la conferma si azzera), `fornitori_accordo_ok` (senza accordo confermato niente proposte), `fornitori_per_admin`.
- Nuova funzione `app-anchecasa/supabase/functions/energia-avvisa`: mail al cliente (richiesta ricevuta, nuova proposta), ai fornitori (nuova richiesta, scelta del cliente), al fornitore (accordo da confermare, solo dall'admin). Usa RESEND_API_KEY e RESEND_FROM già presenti.
- Dashboard del fornitore di energia (`js/energia.js` riscritto, tutto sul database): Home, Richieste, Proposte, Le mie offerte con la carta intestata, I miei clienti, Il mio accordo. Niente più pagine vuote dell'Ufficio nel pack energia. Prima pagina: Home.
- Admin: pulsante «Fornitori» in cima (`js/fornitori-admin.js`): elenco, accordo da scrivere e inviare, richieste luce e gas.
- Privato: «Offerte luce e gas» è una pagina vera (`js/energia-privato.js`).
- Pagina pubblica del cliente `area-privata/offerte.html?t=…` (anche su entra.anchecasa.it): proposte una accanto all'altra, «Accetto, contattatemi».
- Magazine, Check Bollette: «Confronta le offerte» (portale ARERA) diventa «Ricevi offerte migliori» con un modulo (nome, mail, telefono, comune, consenso) che manda la richiesta a tutti i fornitori.
- Sala demo: Luce e gas pronta (vetrina con `?tipo=azienda_luce_gas`).
- Provato in locale: vetrina del fornitore (accordo, proposta su richiesta, clienti), Fornitori dell'admin, pagina del privato, modulo del Magazine (richiesta preparata correttamente). Copie di prima: `_copie-energia-0930`, `_copie-magazine-0945`.
- File: `app-anchecasa/sql/app-19-fornitori-energia.sql`, `app-anchecasa/supabase/functions/energia-avvisa/index.ts`, `area-privata/offerte.html`, `area-privata/dashboard/js/energia.js`, `energia-privato.js`, `fornitori-admin.js`, `app.js`, `sala-demo.js`, `css/energia.css`, `css/admin-task.css`, `index.html` (app.js ?v=23), `magazine-sito/check-bollette.html`, `magazine-sito/js/check-bollette.js` (?v=2), `magazine-sito/css/stile.css` (?v=5), `PROGETTO-DASHBOARD.md`, `CLAUDE.md`.

### 12.10.2026 09:11 · Cursor — ricontrollo di app-18: era già fatto, la prova resta
- Stessa richiesta delle 09:07. Ramo main già allineato a `dbd1c03`, push senza commit nuovi.
- La copia in `_backup-db-1210/handle_new_user_marketplace.sql` è quella di prima di app-18: non è stata sovrascritta.
- I due controlli tornano a posto: colonne nome, ruolo_rete, area, regione, superiore; tabelle `app_rete_note`, `app_riconoscimenti`, `app_rete_obiettivi`; la funzione di iscrizione ha il blocco della rete. Lo SQL non è stato rilanciato.
- L'area privata online è ancora il deployment `dpl_4SV8ywGDjyx85LVcmMxbyjE1e7Nj`, con `rete-admin.js?v=2`. Sito, magazine, sicura, app e le altre funzioni non toccati.
- La riga di prova c'è ancora e non è stata cancellata: mail `prova-agente-campania-1210@anchecasa.it`, utente `82d4cdc5-e708-4b7b-abf7-a584ad70326c`, ruolo agente, regione Campania, area Sud e isole, stato attivo. Invito `98bfd4d2-0962-44e6-85d8-961e1bcab215`, stato iscritto.
- File: `CLAUDE.md`.

### 12.10.2026 09:07 · Cursor — app-18 eseguito su Supabase e area privata pubblicata
- GitHub, ramo main: già allineato, `dbd1c03`. Nessun commit nuovo.
- Prima di app-18, copia della funzione `marketplace.handle_new_user_marketplace` in `_backup-db-1210/handle_new_user_marketplace.sql`.
- Eseguito `app-anchecasa/sql/app-18-rete-area-privata.sql` sul progetto ANCHECASA, ok scritto di Nando del 12.10.2026. Controlli: `inviti_admin` ha nome, ruolo_rete, area, regione, superiore. Esistono `app_rete_note`, `app_riconoscimenti`, `app_rete_obiettivi`. La funzione di iscrizione contiene il blocco della rete.
- Pubblicata solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_4SV8ywGDjyx85LVcmMxbyjE1e7Nj`, alias https://entra.anchecasa.it. Online: `inviti-admin.js?v=3`, `rete-admin.js?v=2`, `app.js?v=22`. Sito, magazine, sicura, app e le altre funzioni non toccati.
- Prova, non cancellata. Invito come Agente, zona Campania, mail `prova-agente-campania-1210@anchecasa.it`, nome «Prova Agente Campania», id invito `98bfd4d2-0962-44e6-85d8-961e1bcab215`, stato iscritto. Iscrizione dal token dell'invito. In `marketplace.app_rete`: utente `82d4cdc5-e708-4b7b-abf7-a584ad70326c`, ruolo agente, regione Campania, area «Sud e isole», stato attivo. Il responsabile è vuoto: in rete non c'è ancora un capo area della Campania, né uno sviluppo del Sud, né il Responsabile Rete Italia.
- La voce delle 09:15 diceva app-18 non eseguito e non pubblicato. Lo SQL ora è eseguito e le pagine che lo usano sono online.
- File: `_backup-db-1210/handle_new_user_marketplace.sql`, `CLAUDE.md`.

### 12.10.2026 08:59 · Cursor — pagina Rete pubblicata sull'area privata
- Invio su GitHub, ramo main: `8bf0c45` (pagina Rete con andamento, cartina e obiettivi; Zona negli inviti). Con lui è salito anche `dbd1c03`, già sul ramo (app-18, non eseguito).
- Pubblicata solo la cartella `area-privata` del commit `8bf0c45` sul progetto Vercel `area-privata-produzione`, deployment `dpl_DypxozUupvzSETs2Rfoc1Y2N8xgo`, alias https://entra.anchecasa.it. Sito, magazine, sicura, app e database non toccati. `dbd1c03` resta fuori da questa pubblicazione, come dice la voce delle 09:15.
- Controllo online: https://entra.anchecasa.it/dashboard/index.html carica `js/rete-admin.js?v=1`. Lo script risponde 200, 18901 byte.
- File: `CLAUDE.md`.

### 12.10.2026 09:15 · Claude — Rete collegata a Supabase: app-18 pronto (NON eseguito, NON pubblicato)
- Nuovo `app-anchecasa/sql/app-18-rete-area-privata.sql`, solo aggiunte, rilanciabile:
  1. `inviti_admin`: colonne nome, ruolo_rete, area, regione, superiore.
  2. `app_area_di(regione)` e `app_superiore_per_zona(ruolo, area, regione)`: la zona decide chi sta sopra (sviluppo → Rete Italia; capo area → sviluppo dell'area; agente → capo area della regione, se manca sviluppo dell'area; sub-agente → l'agente scelto nell'invito).
  3. `handle_new_user_marketplace`: stessa funzione dell'11.10 più un blocco: chi si iscrive con un invito di rete entra in `app_rete` con ruolo, zona e responsabile; il nome dell'invito diventa il nome del profilo se la persona non ne scrive uno.
  4. Tabelle nuove con le regole: `app_rete_note` (le vedono admin, Rete Italia e i responsabili sopra, non la persona), `app_riconoscimenti` (li vede tutta la rete, li danno admin e Rete Italia), `app_rete_obiettivi` (bozza solo admin e Rete Italia, pubblicati tutta la rete).
- Inviti: salvano nome, ruolo, zona; per il sub-agente «Sotto quale agente» (agenti attivi da `app_rete`). Senza app-18 l'invito parte lo stesso, con l'avviso.
- Dashboard: per un commerciale vero il ruolo e la zona si leggono da `app_rete` e decidono il menu.
- Pagina Rete: legge `app_rete` e `app_vendite` e calcola crescita, clienti attivi, ultima vendita; note, riconoscimento e obiettivi si salvano nelle tabelle nuove. Con la rete vuota, o in anteprima, dati di esempio con la scritta.
- Provato in locale con ?demo=admin. Copia di prima: `_copie-rete-db-0915`.
- File: `app-anchecasa/sql/app-18-rete-area-privata.sql` (nuovo), `area-privata/dashboard/js/rete-admin.js`, `js/inviti-admin.js`, `js/app.js`, `css/admin-task.css`, `index.html` (app.js ?v=22, inviti-admin ?v=3, rete-admin ?v=2, admin-task.css ?v=13), `CLAUDE.md`.

### 12.10.2026 09:00 · Claude — pagina Rete dell'admin con andamento e cartina; Zona negli inviti (NON pubblicato)
- `js/rete-admin.js` (sostituisce la pagina Rete di inviti-admin.js): quattro schede, niente soldi (decisione di Nando).
  - Andamento: persone nella rete, crescita sul mese prima, clienti attivi, fermi da 30 giorni; «Da richiamare» con Scrivi, Chiama, Nota; «Da premiare» (primi 3) con «Dai il riconoscimento»; classifica completa (solo admin).
  - Cartina: l'Italia colorata per regione (Copertura della rete, Clienti per regione, Obiettivo del mese, Clienti attivi), clic su una regione per le persone, elenco regione per regione, regioni da aprire. Usa `AC.ITALIA_SVG` di `cartina-italia.js`.
  - Obiettivi: per zona o persona, su cosa e quanti; bozza e Pubblica.
  - Strumenti: Segnalazioni e catena, Richieste agenti, Inviti, Contratti, Lavori rete, Sala strategia, Oggi.
- I numeri sono di esempio, con la scritta in alto: quelli veri arrivano con il collegamento a Supabase. Note, riconoscimento e obiettivi in questa versione restano nella pagina.
- Inviti: per i ruoli di rete compare «Zona» (Rete Italia: tutta Italia; Sviluppo rete: Nord, Centro, Sud e isole; gli altri: la regione). Finché Supabase non ha le colonne, ruolo e zona sono scritti nella categoria («Rete - Capo area - Campania»).
- Provato in locale con ?demo=admin. Copia di prima: `_copie-rete-admin-0900`.
- File: `area-privata/dashboard/js/rete-admin.js` (nuovo), `js/inviti-admin.js`, `css/admin-task.css`, `index.html` (inviti-admin ?v=2, rete-admin ?v=1, admin-task.css ?v=12), `PROGETTO-DASHBOARD.md`, `CLAUDE.md`.

### 12.10.2026 08:46 · Cursor — dashboard della Rete e Regole della Rete pubblicate
- Invio su GitHub, ramo main, da `7a78646` a `5df1e95`. I cinque commit chiesti: `7b44e58`, `97b26d9`, `99f6259`, `8d2a58f`, `d5f39b8`. Con loro è salito anche `5df1e95`, già sul ramo (vendere fuori zona, una riga in `regole/rete.html`).
- Pubblicata solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_6yMkxYh2spzZmCm3rQAAkdZ1vYcx`, alias https://entra.anchecasa.it. Sito, magazine, sicura, app e database non toccati.
- Controllo online: https://entra.anchecasa.it/dashboard/regole/rete.html risponde 200, titolo «Regole della Rete · AncheCasa», 14775 byte. https://entra.anchecasa.it/dashboard/js/rete-progetto.js?v=1 risponde 200, 7817 byte. La dashboard carica quello script.
- La voce delle 08:50 diceva non pubblicato. Ora è pubblicato.
- File: `CLAUDE.md`.

### 12.10.2026 08:50 · Claude — dashboard della Rete per ruolo e «Regole della Rete» (NON pubblicato)
- Rete a categorie, deciso da Nando (PROGETTO-DASHBOARD.md): Home; I miei clienti (I miei clienti, Registra un cliente, Invita un cliente); Vendi (Vendi, Sopralluogo Flash); La mia squadra (La mia squadra, Chi è fermo, La cartina, Recensioni della zona, Regioni da aprire, Segnala una persona); Guadagni; Io e AncheCasa (Il mio ruolo, Contratto e documenti, Formazione); Direzione (Linee decise, Sala strategia). Chat dal fumetto.
- Ogni pulsante ha un livello minimo (`vociRete` in `js/app.js`): sub-agente 12 voci, agente 15, capo area 17, sviluppo rete e Rete Italia 18. Il ruolo, in anteprima, arriva da `?ruolo=`; per gli utenti veri si leggerà dal profilo (`ruoloRete`, da collegare su Supabase).
- Pulsanti per profilo: la Rete è divisa nei cinque ruoli, ognuno con «Guarda come».
- Pagine nuove come schede del progetto (`js/rete-progetto.js`, id `re-…`); «Formazione» è una pagina vera con i documenti.
- `regole/rete.html`: Regole della Rete (livelli, chi vede cosa, di chi è il cliente, cosa si vende e ristrutturazioni, come si entra, chi lavora bene, cosa c'è oggi, domande). 5 pagine A4. In Regole iscritti e in Sala demo è «pronto».
- Sala demo: la Rete ha cinque tasti (Sub-agente, Agente, Capo area, Sviluppo rete, Rete Italia), Regole e Contratti.
- Provato in locale con ?demo=agente&ruolo=… per i cinque ruoli e il documento. Copia di prima: `_copie-rete-0845`.
- File: `area-privata/dashboard/js/rete-progetto.js`, `regole/rete.html` (nuovi), `js/app.js`, `js/pulsanti-profili.js`, `js/sala-demo.js`, `js/regole-admin.js`, `regole/regole.css`, `regole/privato.html` (css ?v=2), `index.html` (app.js ?v=21), `CLAUDE.md`.

### 12.10.2026 08:27 · Cursor — prime decisioni sulla Rete su GitHub; area privata ripubblicata
- Invio su GitHub, ramo main: `c909131` c'era già, aggiunto `7a78646` (solo `PROGETTO-DASHBOARD.md`). Pubblicata di nuovo solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_A7Kgh4cVXuAjS2TYGWQrm6Ax8pCx`, alias https://entra.anchecasa.it e https://areaprivata.anchecasa.it. Sito, magazine, sicura, app e database non toccati. Nessuna funzione ripubblicata.
- Controllo online: https://entra.anchecasa.it/dashboard/index.html carica `js/inviti-admin.js?v=1` (10973 byte) e `js/app.js?v=20` (55891 byte). Entrambi rispondono 200.
- Su Supabase, progetto ANCHECASA, `APP_URL` resta `https://app-anchecasa.pages.dev`. Aggiornato solo quel segreto. Gli altri restano com'erano.
- File: `CLAUDE.md`.

### 12.10.2026 08:24 · Cursor — Rete e Inviti pubblicati; APP_URL torna all'app
- Invio su GitHub, ramo main, commit `c909131`. Pubblicata solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_8CVxJ1EqNuirJdaC6r2JkYEdiR7v`, alias https://entra.anchecasa.it e https://areaprivata.anchecasa.it. Sito, magazine, sicura, app e database non toccati. Nessuna funzione ripubblicata.
- Controllo online: https://entra.anchecasa.it/dashboard/index.html carica `js/inviti-admin.js?v=1` e `js/app.js?v=20`. Lo script risponde 200.
- Su Supabase, progetto ANCHECASA, segreti delle funzioni: `APP_URL` è ora `https://app-anchecasa.pages.dev`. Gli altri segreti restano com'erano. I link delle mail dell'app tornano all'app, perché entra.anchecasa.it apre l'area privata.
- La voce delle 08:20 diceva non pubblicato. Rete e Inviti di quel commit ora sono pubblicati. La voce delle 08:21 diceva che `c909131` era rimasto sul computer: ora è su GitHub e online.
- File: `CLAUDE.md`.

### 12.10.2026 08:21 · Cursor — Sala demo pubblicata sull'area privata
- Invio su GitHub, ramo main, commit `634051e` e `ad145f2`. Pubblicata solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_3mQfUGJxVomRcgnC97tPkB4MXM3g`, alias https://areaprivata.anchecasa.it e https://entra.anchecasa.it. Sito, magazine, sicura, app e database non toccati.
- Controllo online: https://areaprivata.anchecasa.it/dashboard/index.html carica `js/sala-demo.js?v=1` e `js/app.js?v=19`. Lo script risponde 200.
- La voce delle 08:05 diceva non pubblicato. La Sala demo di quei commit ora è pubblicata.
- Il commit locale `c909131` (pulsanti Rete e Inviti) non è stato inviato né pubblicato: la voce delle 08:20 resta non pubblicata.
- File: `CLAUDE.md`.

### 12.10.2026 08:20 · Claude — admin: pulsanti «Rete» e «Inviti» in cima (NON pubblicato)
- Su richiesta di Nando: sotto Home due pulsanti, Rete e Inviti (`js/inviti-admin.js`).
- Inviti: un modulo per rete e aziende. Chi inviti (Rete: Responsabile Rete Italia, Sviluppo rete, Capo area, Agente, Sub-agente; poi le categorie delle aziende), nome, mail, telefono. «Invia invito» crea la riga in `inviti_admin` e manda subito la mail con `invia-invito-marketplace`, in un passaggio solo. Sotto, gli inviti mandati con lo stato (mail inviata, aperto, iscritto) e «Rimanda».
- Il nome non ha ancora una colonna in `inviti_admin`: per ora non si salva. Il ruolo di rete finisce nel testo della categoria («Rete - Capo area»), famiglia agente. Da decidere nei dettagli, poi su Supabase alla fine.
- Rete: una pagina con Segnalazioni e chi entra, Richieste agenti, Oggi, Lavori rete, Contratti, Sala strategia, e il rimando a Inviti. La cartella «Rete commerciale» non è più nel menu; Richieste agenti e Genera link escono dal menu ma restano pagine raggiungibili.
- Anteprima (?demo=admin): niente sul database, nessuna mail; l'invito compare nell'elenco.
- `views.js`: espone `AC.categorieInvito` (stesse categorie di Genera link).
- Copia di prima: `_copie-rete-inviti-0820`.
- File: `area-privata/dashboard/js/inviti-admin.js` (nuovo), `js/app.js`, `js/views.js`, `css/admin-task.css`, `index.html` (app.js ?v=20, views.js ?v=8, admin-task.css ?v=11), `CLAUDE.md`.

### 12.10.2026 08:13 · Cursor — entra.anchecasa.it aperto sull'area privata
- Il CNAME `entra` punta a `4b63e92ec2e89ae6.vercel-dns-017.com`, nuvola grigia. Vercel segna il dominio configurato e verificato sul progetto `area-privata-produzione`.
- Emesso il certificato HTTPS. https://entra.anchecasa.it e https://entra.anchecasa.it/dashboard/ rispondono 200, la stessa pagina di https://areaprivata.anchecasa.it. In dashboard ci sono `app.js?v=18`, `testata.css?v=1` e `regole-admin.js?v=1`.
- Sito, magazine, sicura, app e database non toccati.
- File: `CLAUDE.md`.

### 12.10.2026 08:05 · Claude — Sala demo per la presentazione alla rete (NON pubblicato)
- Su richiesta di Nando, per la demo ai commerciali del 13.10: in Formazione nuova voce «Sala demo» (`js/sala-demo.js`).
- Le dashboard: un riquadro per profilo. Pronto il Privato: «Apri la dashboard» (vetrina) e «Regole». Gli altri «In preparazione»; la Rete ha già il tasto Contratti.
- Vetrina (`?demo=<profilo>&vetrina=1`): dati di esempio, nessuna lettura o scrittura sul database, tutti i pulsanti del profilo visibili anche se l'admin non li ha salvati, nastro in basso «Vetrina · dati di esempio, non collegata a nessuno». Nelle schede del privato sparisce la nota interna «Scheda del progetto».
- I documenti per la rete, da scrivere: AncheCasa in 10 minuti, Il listino, Come guadagna la rete, Il percorso del cliente, Regole della rete, Si parte: i primi 90 giorni, Il primo giorno. Pronto: Regole del Privato.
- I contratti: tasto che apre la pagina Contratti dell'admin.
- Provato in locale con ?demo=admin: Sala demo, vetrina del privato, navigazione nelle schede. Copia di prima: `_copie-sala-demo-0805`.
- File: `area-privata/dashboard/js/sala-demo.js` (nuovo), `js/pulsanti-profili.js`, `js/privato-progetto.js`, `js/app.js`, `css/admin-task.css`, `index.html` (app.js ?v=19, pulsanti-profili ?v=3, privato-progetto ?v=2, admin-task.css ?v=10), `CLAUDE.md`.

### 12.10.2026 08:02 · Cursor — entra.anchecasa.it passa all'area privata
- Invio su GitHub, ramo main, commit `b0b0896` e `dffacb4`. Pubblicata solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_F8peyVQNpbEJvHRvpTBSD8vrVa4y`, alias https://areaprivata.anchecasa.it. Sito, magazine, sicura, app e database non toccati.
- Sul progetto Vercel `area-privata-produzione` è aggiunto il dominio `entra.anchecasa.it`. Vercel lo segna ancora con DNS da sistemare. Il record da scrivere, nuvola grigia, è CNAME `entra` verso `4b63e92ec2e89ae6.vercel-dns-017.com`. Oggi il nome punta ancora a `app-anchecasa.pages.dev`.
- Sul progetto Cloudflare Pages `app-anchecasa` è tolto il dominio `entra.anchecasa.it`. Resta solo `app-anchecasa.pages.dev`.
- Su Supabase, Authentication, URL Configuration, è aggiunto `https://entra.anchecasa.it/**`. Gli indirizzi che c'erano restano, ora sono 15.
- La voce delle 07:55 diceva non pubblicato. L'area privata di quel commit ora è pubblicata. Il nome entra si apre sull'area privata solo dopo il cambio del CNAME.
- File: `CLAUDE.md`.

### 12.10.2026 07:55 · Claude — l'area privata è la dashboard di tutti; accesso senza rimando all'app; «Guarda come» (NON pubblicato)
- Decisione di Nando: la dashboard ufficiale di tutti è l'area privata, con il suo accesso anche da entra.anchecasa.it. Nuove regole fisse in cima a questo file; la 2 e la 3 dell'11.10 sono barrate. `PROGETTO-DASHBOARD.md` regola 6 corretta.
- Accesso (`area-privata/js/app.js`): nessuno viene più mandato su https://entra.anchecasa.it (l'app). Tutti vanno in `dashboard/#/<famiglia>/`; il fornitore usa la dashboard dell'azienda (anche in `dashboard/js/app.js`).
- Iscrizione e benvenuto (`js/iscrizione.js`, `js/benvenuto.js`): la mail di conferma torna allo stesso sito da cui ci si iscrive (`location.origin`), non più all'app; dopo l'iscrizione privato, azienda e fornitore vanno all'accesso dell'area privata, che li fa entrare.
- «Guarda come»: in Pulsanti per profilo un tasto apre in una scheda nuova la dashboard di Privato, Rete o Impresa edile senza password (`?demo=`), con dati di esempio. Se nel browser c'è l'accesso dell'admin, il menu usa le scelte vere salvate su Supabase (solo lettura); in anteprima nessuna scrittura sul database.
- Software: l'app diventa «riserva», l'area privata «la dashboard di tutti».
- Da fare fuori dal codice, prima che entra.anchecasa.it apra l'area privata: dominio `entra.anchecasa.it` aggiunto al progetto Vercel `area-privata-produzione` (e tolto dal progetto Cloudflare Pages `app-anchecasa`), record DNS `entra` su Cloudflare verso Vercel, `https://entra.anchecasa.it/**` tra gli indirizzi ammessi di Supabase Authentication.
- Provato in locale: «Guarda come Privato» apre la bacheca del privato con le 6 categorie; pagina di accesso invariata. Copia di prima: `_copie-accesso-0755`.
- File: `CLAUDE.md`, `PROGETTO-DASHBOARD.md`, `area-privata/js/app.js`, `js/iscrizione.js`, `js/benvenuto.js`, `dashboard/js/app.js`, `dashboard/js/pulsanti-profili.js`, `dashboard/js/software-admin.js`, `dashboard/css/admin-task.css`, `dashboard/index.html` (app.js ?v=18, pulsanti-profili ?v=2, software-admin ?v=2, admin-task.css ?v=9).

### 12.10.2026 07:31 · Cursor — progetto dashboard e Regole del Privato pubblicati
- Invio su GitHub, ramo main, commit `377ecde` e `c227481`. Pubblicata solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_J5PUqyF5bYbjhRPz7jzTw3SDq63V`, alias https://areaprivata.anchecasa.it. Sito, app, magazine, sicura e Supabase non toccati.
- Controllo online: https://areaprivata.anchecasa.it/dashboard/index.html carica `js/app.js?v=17` e `js/regole-admin.js?v=1`. https://areaprivata.anchecasa.it/dashboard/regole/privato.html risponde 200, titolo «Regole del Privato · AncheCasa».
- La voce delle 07:40 diceva non pubblicato. Ora è pubblicato.
- File: `CLAUDE.md`.

### 12.10.2026 07:40 · Claude — «Regole iscritti» e documento del Privato (NON pubblicato)
- Su richiesta di Nando: nel menu admin nuova categoria Formazione con «Regole iscritti». Un documento per profilo, per far studiare le logiche agli agenti. Pronto il Privato; Rete, Impresa edile, Artigiano, Subappaltatore e impiantista, Studio tecnico, Fornitore, Luce e gas, Agenzia immobiliare, Committente «da scrivere».
- `area-privata/dashboard/regole/privato.html`: carta intestata come i contratti (logo e dati società, filo arancio, etichetta, curva e piede blu, Manrope). Dodici sezioni con mappa della dashboard, catena degli artigiani, giro dei soldi, flussi, tabelle, «cosa c'è oggi e cosa arriva», frasi per il cliente, domande frequenti. Tasto «Scarica PDF» (stampa A4, 9 pagine).
- Il file è una pagina statica: una volta pubblicato si apre con l'indirizzo anche senza accesso (noindex). Non contiene dati riservati.
- Per aggiungere un profilo: un file in `regole/` e `pronto: true` in `js/regole-admin.js`.
- Provato in locale: pagina admin, documento, PDF, nessuna immagine rotta.
- File: `area-privata/dashboard/regole/privato.html`, `regole/regole.css`, `js/regole-admin.js` (nuovi), `js/app.js`, `css/admin-task.css`, `index.html` (app.js ?v=17, admin-task.css ?v=8), `CLAUDE.md`.

### 12.10.2026 07:25 · Claude — progetto delle dashboard e privato a categorie (NON pubblicato)
- Nuovo `PROGETTO-DASHBOARD.md` nella cartella principale: le decisioni di Nando, profilo per profilo (regole di lavoro, admin, privato). Si costruisce da lì.
- Privato a categorie, tutto gratis: La mia casa (Ho un guasto, Trova artigiano o impresa, Ristruttura con AncheCasa, Il mio cantiere), Bacheca (Bacheca annunci, Pubblica un annuncio), Le mie cose (Le mie richieste, I miei annunci), Risparmia (Check Bollette, Offerte luce e gas), Le mie app, Passaparola (Invita e guadagna credito). Chat dal fumetto in alto.
- Le pagine nuove sono schede del progetto (`js/privato-progetto.js`, id `pv-…`): cosa fa il pulsante, come funziona, regole, e se c'è già nell'app o è da costruire. Pubblica e Inviti restano le pagine di oggi, con il nome nuovo.
- Il menu non mette più una riga sopra la prima cartella.
- Provato in locale con ?demo: admin mette Privato «tutti gratis» e salva; il privato vede le 6 categorie e le schede. Copia di prima: `_copie-privato-0725`.
- File: `PROGETTO-DASHBOARD.md` (nuovo), `area-privata/dashboard/js/privato-progetto.js` (nuovo), `js/app.js`, `css/admin-task.css`, `index.html` (app.js ?v=16, admin-task.css ?v=7), `CLAUDE.md`.

### 12.10.2026 07:01 · Cursor — menu admin a categorie e testata pubblicati
- Invio su GitHub, ramo main, commit `652920b`. Pubblicata solo la cartella `area-privata` sul progetto Vercel `area-privata-produzione`, deployment `dpl_CinAM6rWndaFSPsRfopKuZjnMC7h`, alias https://areaprivata.anchecasa.it. Sito, app, magazine, sicura e Supabase non toccati.
- Controllo online: https://areaprivata.anchecasa.it/dashboard/index.html carica `js/app.js?v=15` e `css/testata.css?v=1`.
- La voce delle 07:00 diceva non pubblicato. Ora è pubblicato.
- File: `CLAUDE.md`.

### 12.10.2026 07:00 · Claude — admin: menu a categorie, testata con Messaggi e Avvisi (NON pubblicato)
- Metodo deciso con Nando: si progetta ogni dashboard insieme, si prova in anteprima sul computer, e solo alla fine si aggiornano Supabase e la pubblicazione. Niente push finché non lo decide lui.
- Menu admin a categorie (cartelle che si aprono): Home sola in cima; Panoramica (Oggi, Appunti), Iscritti (Iscritti registrati, Iscrizioni dal sito, Richieste agenti, Clienti da affidare, Genera link), Rete commerciale (Segnalazioni, Lavori rete, Contratti, Sala strategia), Gare e appalti (Bandi, Terranova, Gare private), Tecnico (AncheBIM), Comunicazione (Magazine), Il mio lavoro (Task, File), Impostazioni piattaforma (Software, Pulsanti per profilo). Per Francesco Appunti resta prima voce.
- Tolta, da computer, la colonna di icone rapide a sinistra (ripeteva il menu, icone senza nome). In alto a destra, prima del logo: Messaggi (fumetto, non letti, apre la Chat) e Avvisi (campanella, pannello «Da fare»). Gli avvisi veri, profilo per profilo, sono da decidere: oggi l'admin vede le segnalazioni da decidere; con ?demo esempi.
- Chat dell'admin non è più nel menu ma resta una pagina permessa (soloTestata). Sul telefono la barra in basso è da rivedere quando si lavora sull'app.
- Provato in locale con ?demo=admin a 1280 px. Copie di prima: `_copie-menu-admin-0655`, `_copie-testata-0700`.
- File: `area-privata/dashboard/js/app.js`, `js/ui.js` (icona bell), `css/testata.css` (nuovo), `index.html` (app.js ?v=15, ui.js ?v=2, testata.css), `CLAUDE.md`.

### 12.10.2026 06:52 · Cursor — Pulsanti per profilo pubblicati sull'area privata
- Invio su GitHub, ramo main, commit `8a680dc`. Pubblicazione Vercel `area-privata-produzione`, deployment `dpl_1yPtsAm9cPekP7f5NQBkaV5rxsuo`, alias https://areaprivata.anchecasa.it.
- Online il tasto admin «Pulsanti per profilo». Lo script `pulsanti-profili.js` e `app.js?v=13` rispondono. Indirizzo https://areaprivata.anchecasa.it/dashboard/#/admin/pulsanti.
- La voce delle 06:50 diceva non pubblicato. Ora è pubblicato.
- File: `CLAUDE.md`.

### 12.10.2026 06:50 · Claude — «Pulsanti per profilo»: ogni dashboard parte vuota, decide l'admin (NON pubblicato)
- Decisione di Nando: si tolgono tutti i pulsanti da ogni dashboard. L'admin sceglie, profilo per profilo e pulsante per pulsante, cosa si vede: Nascosto, Gratis o A pagamento. Prima i gratuiti, poi quelli a pagamento.
- Nuovo tasto admin «Pulsanti per profilo». Profili: Privato, Impresa edile, Subappaltatore, Impiantista, Artigiano, Studio tecnico, Fornitore, Luce e gas, Committente, Rete (agenti e ruoli). Per ognuno l'elenco dei suoi pulsanti, raggruppati come nel menu, con Salva per profilo.
- Le scelte stanno su Supabase in `marketplace.app_impostazioni`, chiave `pulsanti_profili` (tabella e regole già esistenti: legge chi è entrato, scrive solo l'admin). Nessuno SQL nuovo.
- Nel menu di privato, azienda e agente compaiono solo i pulsanti scelti; un indirizzo di un pulsante nascosto riporta alla Bacheca. Un profilo mai salvato non vede nessun pulsante. Restano sempre Bacheca (dal logo), Profilo, Impostazioni ed Esci. L'admin non è toccato.
- A pagamento: il pulsante si vede con «€»; la pagina dice che è a pagamento e di scrivere ad AncheCasa. Chi ha pagato non è ancora distinto: è il passo dopo.
- È una regola di visibilità del menu, non un blocco sui dati.
- Provato in locale con `?demo=` a 1280 px: azienda senza scelte, menu vuoto; salvate 5 voci gratis e 2 a pagamento per Impresa edile, il menu mostra quelle 7, SAL apre l'avviso, Magazzino riporta alla Bacheca; agente senza scelte arriva alla Bacheca. Copia di prima: `_copie-pulsanti-0645`.
- File: `area-privata/dashboard/js/pulsanti-profili.js` (nuovo), `area-privata/dashboard/js/app.js`, `area-privata/dashboard/index.html` (app.js ?v=13, admin-task.css ?v=6), `area-privata/dashboard/css/admin-task.css`, `CLAUDE.md`.

### 12.10.2026 06:35 · Cursor — pagina Software pubblicata sull'area privata
- Invio su GitHub, ramo main, commit `4c65990`. Pubblicazione Vercel `area-privata-produzione`, deployment `dpl_2LrUSpECWhwCxp8EzinhZaGUbzV5`, alias https://areaprivata.anchecasa.it.
- Online la pagina Software: lo script `software-admin.js` risponde e il menu admin ha la voce Software. Indirizzo https://areaprivata.anchecasa.it/dashboard/#/admin/software.
- La voce delle 06:30 diceva non pubblicato. Ora è pubblicato.
- File: `CLAUDE.md`.

### 12.10.2026 06:30 · Claude — pagina «Software» per categoria nell'admin (NON pubblicato)
- Su richiesta di Nando: nel menu admin dell'area privata, secondo tasto dopo Home, c'è «Software». Mostra i 14 software dell'inventario in 6 categorie: Siti pubblici, Dashboard e app, Gare e appalti, Tecnico e progettazione, Rete e contratti, In preparazione. Ogni scheda dice se è online, se è un tasto di questa area o se non è pubblicata.
- I tasti interni (Bandi, Terranova, Gare private, AncheBIM, Contratti, Genera link, Sala strategia) aprono la loro pagina; i siti aprono il loro indirizzo in una scheda nuova. Le voci del menu di prima restano tutte.
- Per aggiungere un software basta una riga nell'elenco CATEGORIE di `software-admin.js`.
- Provato in locale con `?demo=admin` a 1280 px e a 375 px: sul telefono «Software» è nella barra in basso. Copia di prima: `_copie-software-0630`.
- File: `area-privata/dashboard/js/software-admin.js` (nuovo), `area-privata/dashboard/js/app.js` (tasto e nota nel blocco CONGELATO), `area-privata/dashboard/index.html` (script, app.js ?v=12, admin-task.css ?v=5), `area-privata/dashboard/css/admin-task.css`, `CLAUDE.md`.

### 12.10.2026 06:15 · Cursor — cartella inviata su GitHub
- Il lavoro rimasto solo sul computer (chi entra, note vocali, appunti di Francesco) è sul ramo main di https://github.com/anchecasa/anchecasapulito. La cartella ufficiale resta sul Desktop: `C:\Users\palum\Desktop\ANCHECASA-PULITO`.
- Fuori dall'invio: `supabase/.temp/linked-project.json`, file temporaneo della CLI.
- File: `APPUNTI-FRANCESCO.md`, `app-anchecasa/sql/app-16-audio-sopralluogo.sql`, `app-17-chi-entra.sql`, `app-anchecasa/js/viste-rete.js`, `viste-admin.js`, `q.js`, `testi-rete.js`, `sopralluogo-flash/index.ts`, `notify-opportunita-pacchetto/index.ts`, `area-privata/dashboard/` (rete, appunti, views, app.js, index.html), `CLAUDE.md`.

### 11.10.2026 20:22 · Cursor — chi entra: admin da solo, i commerciali segnalano
- L'admin fa entrare chiunque nella rete (Responsabile Rete Italia, sviluppo, capo area, agente, sub-agente) senza un altro sì. Privati, aziende e agenti di commercio li fa entrare da Genera link.
- I commerciali fanno entrare privati e aziende. Per sviluppo rete, agenti e sub-agenti mandano una segnalazione: decide solo l'admin. Un sì crea l'invito, un no la chiude. Capo area e Responsabile Rete Italia li fa entrare l'admin.
- Funzioni aggiornate su Supabase: `app_puo_invitare`, `app_proponi_rete`, `app_vota_proposta`, `app_proposta_esito`, `app_vedo_proposta`.
- File: `app-anchecasa/sql/app-17-chi-entra.sql`, `app-anchecasa/js/viste-rete.js`, `viste-admin.js`, `q.js`, `testi-rete.js`, `area-privata/dashboard/js/rete-proposte.js`, `views.js`, `app.js`, `testi-rete.js`, `area-privata/dashboard/index.html`, `CLAUDE.md`.

### 11.10.2026 20:13 · Cursor — app-15 eseguito, note vocali aperte, Gemini rifiuta la chiave
- app-15 eseguito sul progetto ANCHECASA. `app_soggetti` e `app_rubrica` esistono, 0 righe: le tabelle di partenza erano vuote. Backup fisico assente (PITR spento, elenco vuoto, Docker assente, password rifiutata). Lo SQL non cancella colonne.
- Iscrizione provata: account `prova-iscrizione-1110@anchecasa.it` e riga in `richieste_iscrizione`.
- app-16 eseguito: il bucket `sopralluoghi` accetta le note vocali e le regole lasciano caricare `{sopralluogo}/a/nota.webm` all'agente di quel sopralluogo. Prima il caricamento rispondeva 403 perché passavano solo i jpg.
- Prova Flash: la nota webm è arrivata, la funzione ha prenotato l'analisi e Gemini ha risposto 400 «API key not valid». Niente trascrizione, niente computo, niente stima. I sopralluoghi di prova sono stati cancellati. La funzione online ora risponde `chiave_non_valida` in quel caso, senza ripetere la frase di Google.
- Appunti di Francesco aggiornati: restano il DNS di entra e la sostituzione di GEMINI_API_KEY. app-15 non va rilanciato.
- SuperMastro SOS non pubblicato: l'admin online si apre ancora senza il login nuovo.
- File: `app-anchecasa/sql/app-16-audio-sopralluogo.sql`, `app-anchecasa/supabase/functions/sopralluogo-flash/index.ts`, `area-privata/dashboard/js/appunti-francesco.js`, `area-privata/dashboard/index.html` (script ?v=4), `APPUNTI-FRANCESCO.md`, `CLAUDE.md`.

### 11.10.2026 19:55 · Cursor — appunto urgente per Francesco
- In cima agli Appunti che Francesco vede entrando: DNS di entra.anchecasa.it (CNAME entra → app-anchecasa.pages.dev, nuvola grigia), backup e poi app-15, prova audio di Sopralluogo Flash. Sotto, cosa è già fatto e non va rifatto. Tolta la frase vecchia che diceva che app-03…app-13 non erano eseguiti.
- Stesso testo in cima a APPUNTI-FRANCESCO.md.
- File: area-privata/dashboard/js/appunti-francesco.js, area-privata/dashboard/index.html (script ?v=3), APPUNTI-FRANCESCO.md, CLAUDE.md.

### 11.10.2026 19:47 · Cursor — pubblicato sito, area privata e app (ok scritto di Nando)
- Prezzi visibili: `prezzi_visibili` è `true` su Supabase. Sul sito tornano le cifre di catalogo.js: artigiano 14,90 €, imprese 49 €, fornitori 99 €, moduli 9 / 19 / 29 / 29 / 9 / 9, tutti i moduli 69 €. Accanto restano «Prova gratis 14 giorni» e «Parla con un consulente».
- Il primo invio del sito aveva `ac.js` rotto (l'iscrizione era finita dentro SuperMastro e lo script non partiva). Corretto: l'iscrizione con password crea l'account e scrive la richiesta; senza password, come il consulente, scrive solo la richiesta; SuperMastro ha di nuovo l'elenco dei problemi. Secondo invio: `dpl_Bx9ZtUYgSsXjaPvbSEDMfv78ih3o`, alias https://anchecasa.it, script `ac.js?v=8`.
- Modulo consulente provato su https://anchecasa.it/prezzi: «Richiesta ricevuta». Nel database c'è la riga `consulenza-prezzi` di prova-pubblicazione-1110@anchecasa.it. Non ho creato un account di prova, così non parte una mail di conferma.
- App su Cloudflare Pages, progetto app-anchecasa, produzione https://app-anchecasa.pages.dev e https://7cdaf910.app-anchecasa.pages.dev. Service worker `ac-app-2.9.0`. Provate in locale sul sito pubblicato le cinque «Oggi» (admin, impresa, fornitore, privato, agente) a 375 px e l'admin a 1280 px: menu in basso, tre numeri, Sospendi solo in Aziende, grafico iscrizioni solo da computer, interruttore prezzi acceso.
- Area privata: `dpl_8tz4khcmuTEZEF1E4PLXufdPhmXo`, alias https://areaprivata.anchecasa.it. Login, home.js e manifest rispondono. Non sono entrato: non ho usato una password vera.
- Funzioni spente, dopo aver salvato il codice in `app-anchecasa/supabase/functions-archivio/`: parse-cv, scrape-company-site, installation-bids, omi-lookup, ordine-tracking, presentazione-mappa-search. Pubblicate sopralluogo-flash, subappalti-mail, gare-analisi. Senza accesso rispondono `accesso_richiesto`. `sdi-gateway` resta accesa. 97 funzioni online, 3 posti liberi. La chiave Gemini è tra i segreti, valore non scritto. La prova audio → computo → stima non è stata fatta: serve un agente entrato, con un sopralluogo e un audio.
- app-15 non eseguito: niente backup da cui tornare indietro (PITR spento, elenco backup vuoto, Docker assente, password del database rifiutata). Dettaglio in `APPUNTI-FRANCESCO.md`.
- SuperMastro SOS non pubblicato: il login nuovo è nel codice, il sito online è ancora quello di prima.
- Magazine e AncheSicura non toccati. Niente store. app.anchecasa.it non toccato. DNS di entra.anchecasa.it non scritto.
- Contratto firmabile: solo la versione 10.10.2026. La 11.10.2026 resta in sola lettura.
- File: `sito/` (prezzi, faq, pagine app, `js/ac.js`), `app-anchecasa/` (dashboard telefono, service worker 2.9.0, archivio funzioni), `APPUNTI-FRANCESCO.md`, `CLAUDE.md`.

### 11.10.2026 19:09 · Cursor — dashboard come il modello approvato (NON pubblicato)
- Parte 0. Sul sito non ci sono più le cifre: prezzi.html, le otto pagine app e la FAQ. Al posto, «Prova gratis» e «Parla con un consulente» (modulo consulenza-prezzi). In Iscrizioni dal sito quella richiesta sta in cima, fondo arancio chiaro. I prezzi restano in catalogo.js e in app_impostazioni. prezzi_visibili resta false.
- Parte 0. Condomini, amministratori, grandi aziende e fondi tornano come committenti che pubblicano appalti (iscrizione, ricerca, pagina Appalti, categorie dell'area privata). Il pacchetto gestionale del condominio (anagrafe, assemblee, contabilità) resta nascosto.
- Parte 0. L'Allegato B accorciato è la versione 11.10.2026, «da far vedere all'avvocato, non firmabile». La versione 10.10.2026, con il testo di prima, resta quella che si può firmare. Chi ha già firmato resta su quella.
- Parte 1 e 2. Nell'app, Oggi per azienda, fornitore, privato, rete e admin, con i dati del database. Menu laterale da computer per azienda, fornitore e admin; in basso sul telefono. Privato e rete: cinque voci in basso. Senza numeri inventati: se non c'è niente, il primo passo da fare. In modalità prova la fascia «dati di esempio» resta.
- Provato in locale a 1280 px e a 375 px: le cinque dashboard, i quattro aspetti dei pulsanti, gli stati vuoti con ?vuoto. Non pubblicato. Ramo iscrizione-pulsanti, non main. Nessuno SQL sul Supabase vero.
- File: app-anchecasa/js/viste-dash.js, css/dash.css, app.js, main.js, q.js, sw.js, index.html, pacchetti.js, iscrizione-unica.js; sito/prezzi.html, faq.html, appalti.html, js/ac.js, le pagine app-*; iscrizione-unica (copie); area-privata dashboard (contratti, contratti-modelli, contratto-firma, views.js, app.js); app-anchecasa/docs/modello-dashboard/; CLAUDE.md.

### 11.10.2026 18:36 · Cursor — prezzi nascosti e lucchetto sul passo che manca (NON pubblicato)
- La Parte D non c'era: `prezzi_visibili` non esisteva e i pulsanti mostravano le cifre. Ora l'impostazione è `false` (in `app-14` e nella prova). Sui pulsanti e in Abbonamento e moduli non compare nessuna cifra: «Prova gratis» o «Richiedi l'attivazione». L'admin, in Impostazioni, può riaccenderle. Il listino di anchecasa.it/prezzi non è stato toccato.
- Il lucchetto «Completa il profilo» apre il passo che manca: telefono, partita IVA, documenti o categorie. Prima apriva il profilo in generale.
- Provato in locale (telefono 390 px): privato senza numero arriva a Telefono e, salvato, i lucchetti spariscono; impresa con partita IVA arriva a Documenti; fornitore vede «Prova gratis» e «Richiedi l'attivazione», nessuna €, nessuno scorrimento orizzontale. Partita IVA corta non prosegue.
- Ramo GitHub `iscrizione-pulsanti`, non main. Niente pubblicazione su Vercel, Cloudflare o Supabase.
- File: `app-anchecasa/js/viste-pulsanti.js`, `viste-aziende.js`, `viste-admin.js`, `q.js`, `app-anchecasa/sql/app-14-iscrizione-profili.sql`, `area-privata/dashboard/js/profili-pulsanti.js`, `area-privata/dashboard/js/app.js`, `CLAUDE.md`.

### 11.10.2026 18:18 · Cursor — anagrafica unica, app-15 (NON pubblicato, non eseguito su Supabase)
- Nuove tabelle `marketplace.app_soggetti` e `marketplace.app_rubrica`, albo `marketplace.app_albo` (solo aziende verificate), unione e «non sono la stessa persona». Le colonne vecchie restano. La fattura tiene `cliente_dati` come fotografia.
- Stessa partita IVA da due ditte: un soggetto e due righe di rubrica. Il collega che registra un cliente già preso è bloccato (`cliente_di_un_collega`, 90 giorni e 12 mesi come prima). Il fornitore invitato per mail, quando si iscrive con la stessa partita IVA, rivendica il profilo e ritrova la richiesta.
- Prove due volte sul Postgres locale (porta 5433, database `ac15`): secondo giro 6 soggetti, 2 righe di rubrica, 1 possibile doppione (stessa mail, uno con codice fiscale e uno senza). Un estraneo legge 0 soggetti. La ditta A vede solo la propria nota.
- Nell'app, Clienti e Fornitori cercano per nome, partita IVA e telefono; il salvataggio chiama `app_soggetto_in_rubrica` se il database c'è.
- File: `app-anchecasa/sql/app-15-anagrafica-unica.sql`, `app-anchecasa/sql/prove/15-prove.sql`, `app-anchecasa/js/rubrica.js`, `app-anchecasa/js/app.js`, `app-anchecasa/sw.js`, `CLAUDE.md`.

### 11.10.2026 18:16 · Cursor — mestieri verticali nascosti (NON pubblicato)
- Restano in vista: imprese edili, artigiani, subappaltatori, impiantisti, studi tecnici, materiali, noleggio, fornitori IT. Nascosti, con `nascosto: true` nel codice: condominio, manutenzione stabili, hotel, ristoranti, negozi, capannoni, traslochi, facchinaggio, pulizie, consulenti HSE, agenzie immobiliari, sicurezza armata, APL, industria.
- Chi è già iscritto con un mestiere nascosto vede Ufficio e Sicurezza. I tasti del mestiere non compaiono. Le pagine `app-*.html` di quei mestieri sono in `_archivio/sito-promesse` e in `sito/vercel.json` rimandano a `/app`.
- Tolti dalle scelte dell'iscrizione: pulizie, traslochi e i codici ATECO 81.21, 81.22, 49.41.
- Iscritti veri per mestiere: non contati da qui (niente SQL sul Supabase). Query da lanciare, in sola lettura, dopo app-14:
  `select famiglia, coalesce(tipo_azienda, '') as mestiere, count(*) from marketplace.profiles group by 1, 2 order by 3 desc;`
  e, se c'è la colonna: `select unnest(ateco) as ateco, count(*) from marketplace.app_org group by 1 order by 2 desc;`
- File: `area-privata/dashboard/js/app.js`, `app-anchecasa/js/pacchetti.js`, `iscrizione-unica/iscrizione.js` e le copie, `sito/app.html`, `sito/vercel.json`, `CLAUDE.md`.

### 11.10.2026 18:12 · Cursor — tolte le promesse di servizi che non esistono (NON pubblicato)
- Tolti da menu, piede, prezzi e ricerca: AncheVoice come centralino in vendita, Opportunità, aste, Credit, Predict, BIM 5D, InJobs, Tracking. Il registro delle chiamate nell'app resta, con il nome «Registro chiamate», solo per chi lo ha già attivo. Non si propone e non si vende.
- «Tutti i moduli» resta 69 €. Nando può cambiarlo.
- Spostate in `_archivio/sito-promesse` (niente cancellato): `anchevoice.html`, `opportunita.html`, `strumenti.html`, le pagine `app-` dei mestieri nascosti e le pagine che `vercel.json` già reindirizzava (agente, azienda, privato, login e le altre). Reindirizzamenti: AncheVoice → `/prezzi`, Opportunità → `/`, le altre → `/app` o la pagina che c'era già.
- Mail: tolto «Aste immobiliari con assistenza» da `mail/invito/mail-invito.js` e dalle copie; anteprime rigenerate.
- Area privata: Opportunità, Aste, Credit, Predict, BIM, Tracking e Recruitment (InJobs) non sono nel menu. Il codice delle pagine resta in `views.js`.
- Nell'Allegato B dei cinque contratti in app è tolto il BIM 5D e l'elenco dei mestieri nascosti. Va fatto vedere all'avvocato prima di una firma.
- Il Magazine non promette nessuno di questi servizi. Copia di prima: `_copie-anagrafica-1110`.
- File: `sito/` (pagine e `vercel.json`), `sicura-DA-CARICARE-SU-CLOUDFLARE/`, `sito-nuovo/`, `sicura-nuovo/`, `mail/`, `area-privata/dashboard/js/app.js`, `area-privata/dashboard/js/contratti-modelli.js`, `app-anchecasa/js/catalogo.js`, `app-anchecasa/js/viste-aziende.js`, `app-anchecasa/js/viste-pulsanti.js`, `CLAUDE.md`.

### 11.10.2026 17:58 · Cursor — pulsanti della dashboard solo nell'app (NON pubblicato)
- Privato, azienda e fornitore, dopo l'accesso e dopo l'iscrizione dall'area privata, vanno su https://entra.anchecasa.it. L'admin e la rete (agenti) restano nell'area privata. `visibleNav` non è stato toccato.
- Nell'app la Home del privato è la griglia dei pulsanti: in cima quelli degli obiettivi, «Il mio cantiere» solo se c'è un cantiere. Azienda e fornitore leggono l'aspetto da `app_stato_pulsanti()` quando c'è; se manca, gli stessi quattro aspetti si calcolano in locale. «Attiva» manda la richiesta di oggi, con la prova di 14 giorni segnata provvisoria.
- I pacchetti `TIPO_PACK` e `PACKS` sono copiati in `app-anchecasa/js/pacchetti.js` e decidono i moduli del mestiere. Il fornitore è una categoria: l'ATECO sceglie il pacchetto (43.21 impiantista, 46.73 fornitore di materiali, 41.20 impresa). Nell'area privata i pacchetti non sono cambiati.
- Admin, nell'app: «Iscrizioni: dove si fermano» e «Aziende da verificare» (Verifica, Serve un documento, Sospendi).
- Provato in locale con la modalità prova, telefono: privato (lucchetto sul telefono, guasto e trova in cima), fornitore (Prova gratis su Sicurezza, richiesta salvata), impresa (moduli accesi, aziende da verificare che sparisce dopo Verifica). Non pubblicato.
- File: `app-anchecasa/js/pacchetti.js`, `app-anchecasa/js/viste-pulsanti.js`, `app-anchecasa/js/app.js`, `app-anchecasa/js/db.js`, `app-anchecasa/js/q.js`, `app-anchecasa/css/app.css`, `app-anchecasa/sw.js`, `app-anchecasa/sql/app-14-iscrizione-profili.sql`, `area-privata/js/app.js`, `area-privata/js/iscrizione.js`, `area-privata/js/benvenuto.js`, `CLAUDE.md`.

### 11.10.2026 17:45 · Cursor — pulizia: cartelle inutilizzate in _archivio (niente cancellato)
- Restano al loro posto: `sito-nuovo` (sorgente del sito), `sicura-nuovo` (legge `sito-nuovo` e genera AncheSicura), `sicura-DA-CARICARE-SU-CLOUDFLARE` (è la cartella che va su https://sicura.anchecasa.it).
- Spostate in `_archivio`, dopo copia in `_copie-entra-1110`: `sicura` (sito di prima, l'online usa la cartella da caricare), `superapp`, `superapp-viste` (nessuno script e nessun sito le pubblica), `anchecasapulito` (solo `.gitattributes`).
- `LEGGIMI.txt` aggiornato: cosa c'è, cosa è online e dove, cosa sta in `_archivio`.
- File: `LEGGIMI.txt`, `CLAUDE.md`. Cartelle: `_archivio/sicura`, `_archivio/superapp`, `_archivio/superapp-viste`, `_archivio/anchecasapulito`, `_copie-entra-1110`.

### 11.10.2026 17:43 · Cursor — gare, AncheBIM e SuperMastro SOS copiati dentro (NON pubblicato)
- `business/`: codice del cruscotto da BIM-SICUR\ecosistema-anchecasa, ramo feature/admin-eprocurement-button (src, services, public, configurazione). Non è un sito. SQL app-01 … app-13 non ricopiato. Lo SQL gare era già in `supabase/migrations/20261011103000_e_procurement.sql`. Nessuna chiave.
- `supermastro-sos/`: web, migrazioni 20261011, script e workflow da 04-SuperMastro. Schema public non toccato. Pull request non unita. I repository GitHub ecosistema-anchecasa e supermastro-sos restano.
- File: `business/`, `supermastro-sos/`, `CLAUDE.md`.

### 11.10.2026 17:40 · Cursor — entra.anchecasa.it sull'app (DNS da fare a mano)
- Cloudflare Pages, progetto app-anchecasa: aggiunto entra.anchecasa.it (stato initializing). Tolto app.anchecasa.it da questo progetto. Non ricollegato altrove.
- Il record DNS CNAME «entra» non si può scrivere da qui: il login di wrangler e il token nel file rispondono 403 sulla zona. https://entra.anchecasa.it non risolve. https://app-anchecasa.pages.dev risponde 200, titolo AncheCasa (pubblicazione https://3fd7d0ad.app-anchecasa.pages.dev). Prova da telefono sullo stesso nome: non risolve, per lo stesso motivo.
- Supabase, progetto ANCHECASA: APP_URL impostato su https://entra.anchecasa.it (valore non mostrato). DIAGNOSI_ORIGINI non c'è: le funzioni ammettono già ogni origine, entra compreso, quindi il segreto non è stato creato.
- Nel codice di app-anchecasa, app.anchecasa.it è diventato entra.anchecasa.it (config, LEGGIMI, script, gare-analisi, sdi-gateway, sopralluogo-flash, subappalti-mail). supermastro-analisi non contiene quel nome ed è rimasta in sola lettura. Le funzioni già online non sono state ripubblicate (limite 100). Link all'app nuova in area-privata/dashboard/js/rete-proposte.js e negli appunti. Sito, magazine e sicura non pubblicati.
- File: `app-anchecasa/` (config, LEGGIMI, scripts, funzioni), `area-privata/dashboard/js/rete-proposte.js`, `area-privata/dashboard/js/appunti-francesco.js`, `CLAUDE.md`.

### 11.10.2026 17:20 · Cursor — inviti per mail, iscrizione dal sito, curriculum obbligatorio per l'agente
- Chi riceve l'invito per mail resta già dentro: il profilo nasce verificato, come prima.
- Dal sito, privato e azienda si iscrivono senza autorizzazione e poi completano il profilo. La funzione `handle_new_user_marketplace` è già aggiornata su Supabase e li segna verificati. L'agente dal sito resta una richiesta in attesa.
- Senza curriculum in PDF o Word la richiesta dell'agente non parte. Il file va nel bucket `marketplace-candidature` e l'admin lo apre dalla richiesta.
- File: `supabase/migrations/20261011172000_iscrizione_web.sql`, `area-privata/js/iscrizione.js`, `area-privata/js/app.js`, `area-privata/iscriviti.html`, `area-privata/candidatura-agente.html`, `area-privata/dashboard/js/views.js`, `sito/js/ac.js`, `sito/iscriviti.html`, `sito/agenti.html`, `sito/privacy.html`, `CLAUDE.md`.

### 11.10.2026 17:10 · Cursor — Terranova, Gare private e AncheBIM come tasti dell'area privata (NON pubblicato)
- Su richiesta: i progetti di ieri sera e di oggi sono funzioni di AncheCasa, con un tasto nel menu admin, non siti a parte. Bandi c'era già. Aggiunti Terranova (schema `terranova`, tabella gare), Gare private (`marketplace.app_ep_gare`) e AncheBIM (controllo disegni X, Y, Z). Stesso Supabase dell'area privata. In anteprima `?demo=admin` i tre tasti mostrano esempi.
- Sul telefono restano in barra Home, Iscritti, Bandi e Contratti. I tre tasti nuovi stanno nel menu e in Altro.
- Non pubblicato: restano sul ramo `feat/sm-fase-1-procione`. Nessun sito nuovo su Vercel o Cloudflare.
- File: `area-privata/dashboard/js/funzioni-interne.js` (nuovo), `area-privata/dashboard/js/app.js`, `area-privata/dashboard/index.html`, `CLAUDE.md`.

### 11.10.2026 16:52 · Cursor — lettura di partenza del comando «mettere online» (niente pubblicato)
- Ramo `feat/sm-fase-1-procione`, non main. Non ho cambiato ramo.
- `SUPABASE_DB_URL` non è impostata in questa sessione, quindi psql non è partito. Il controllo in sola lettura è passato dalla CLI già collegata al progetto ANCHECASA.
- app-14 c'è (colonna `app_firme.dati` e le due funzioni). app-15 non c'è (mancano `app_inviti.superiore` e `regione`).
- Funzioni Supabase: 100 su 100. C'è `sdi-gateway`. Mancano `sopralluogo-flash`, `subappalti-mail`, `gare-analisi`.
- Vercel produzione: area-privata circa 5 ore fa, sito e magazine circa 10 ore fa. Cloudflare Pages: app-anchecasa circa 5 ore fa (sorgente `cbdf410`), sicura circa 9 ore fa. https://app.anchecasa.it risponde 522.
- Copia di prima: `_copie-registro-a-1652`. File: `CLAUDE.md`.

### 11.10.2026 16:45 · Claude — area privata installabile come app dal telefono (NON pubblicato)
- `area-privata/manifest.webmanifest` (nome AncheCasa, apre `/`, schermo intero, colore #1f4d7a, icone ufficiali da `marchio/5-simbolo-e-icone/icone-app` copiate in `area-privata/img/app/`), `area-privata/sw.js` minimo (non conserva copie: si vede sempre la versione online).
- Collegati in `area-privata/index.html` (accesso) e `area-privata/dashboard/index.html`: manifest, theme-color, meta per iPhone, registrazione di /sw.js.
- `area-privata/vercel.json`: sw.js e manifest senza cache, tipo application/manifest+json.
- Provato in locale con Chrome: manifest senza errori, service worker attivo, nessun motivo che impedisce l'installazione; con sessione aperta la pagina di accesso porta subito alla dashboard.
- Copia di prima: `_copie-pwa-1640`.
- File: nuovi `area-privata/manifest.webmanifest`, `area-privata/sw.js`, `area-privata/img/app/icona-192.png`, `icona-512.png`, `icona-maskable-512.png`; cambiati `area-privata/index.html`, `area-privata/dashboard/index.html`, `area-privata/vercel.json`, `COMANDO-CURSOR-TUTTO-ONLINE-v2.md`, `CLAUDE.md`.

### 11.10.2026 16:35 · Claude — accesso: chi è già entrato non ridà la password, dopo l'accesso si arriva alla Home (NON pubblicato)
- Pagina di accesso dell'area privata: se c'è già una sessione Supabase aperta (anche nell'app salvata sul telefono) si entra subito nella dashboard. I controlli (admin, profilo verificato) restano nella dashboard, che chiude la sessione e riporta al login se non va bene.
- Dopo l'accesso: admin e profili vanno a `dashboard/#/` (o `#/<famiglia>/`) e la dashboard apre la prima pagina giusta: Home per admin e agenti, Appunti per Francesco, Bacheca per privati e aziende. Prima l'admin finiva su Iscritti.
- Copia di prima: `_copie-login-sessione-1630`.
- File: `area-privata/js/app.js`, `COMANDO-CURSOR-TUTTO-ONLINE-v2.md` (aggiunto il file), `CLAUDE.md`.

### 11.10.2026 16:30 · Claude — da computer la dashboard prende l'aspetto della «viste» (orologio in alto a sinistra), il telefono resta com'è (NON pubblicato)
- Su richiesta di Nando: da computer (oltre 980 px) in alto a sinistra data e orologio come in `ANCHECASA-LAVORO\viste` (stesso disegno, colori della dashboard area privata), sotto una colonna di icone rapide (Home, Chat, Task/Documenti, Contratti, File/Pubblica: solo voci che la persona vede già) e il menu; logo in una barra bianca in alto a destra; l'orologio grigio accanto al titolo sparisce da computer.
- Telefono: nessun cambiamento (barra in alto con logo e «Ciao», barra in basso con Home… e Altro). I nuovi elementi lì sono nascosti.
- Home: da 981 a 1200 px i quattro numeri vanno su due righe.
- Provato in locale con ?demo=admin e ?demo=agente a 1366, 1024 e 390 px: nessun errore, nessuno scorrimento orizzontale.
- Copia di prima: `_copie-dashboard-aspetto-dock-1625`.
- File: nuovo `area-privata/dashboard/css/aspetto-dock.css`; cambiati `area-privata/dashboard/index.html` (blocco data/ora, colonna icone, barra con logo, app.js?v=9), `area-privata/dashboard/js/app.js` (tick, paintNav), `area-privata/dashboard/css/home.css`, `CLAUDE.md`.

### 11.10.2026 16:20 · Claude — Home con grafici e andamenti, tasto «Home» per admin e collaboratori (NON pubblicato)
- Su richiesta di Nando: nuova pagina «Home», primo tasto del menu e della barra in basso del telefono, sia per l'admin sia per gli agenti della rete. È anche la prima pagina dopo l'accesso (Francesco resta su Appunti) e il logo dell'admin porta lì.
- Admin: iscritti, rete attiva, canoni attivi al mese, lavori firmati dell'anno; grafici degli ultimi 12 mesi (nuovi iscritti privati/aziende, nuovi nella rete, canoni attivati, valore lavori firmati) e barre per ruolo, regione e stato dei lavori.
- Collaboratore: la sua squadra, canoni e lavori suoi e della catena, le sue provvigioni (pagate e da pagare) mese per mese, squadra per ruolo, lavori per stato. I filtri li fa già Supabase (app_nella_mia_rete): stesse letture per tutti, nessuna scrittura, nessun SQL nuovo.
- Grafici in HTML/CSS senza librerie; toccando una colonna si legge il dettaglio del mese. Con ?demo=admin|agente mostra numeri d'esempio scritti «Esempio».
- Nota «CONGELATO 20.09.2026» in app.js aggiornata con l'eccezione per il tasto Home.
- Provato in locale con dati d'esempio: telefono 390 px (admin e agente) e computer 1366 px, nessun errore, nessuno scorrimento orizzontale.
- Attenzione alla pubblicazione: la cartella contiene anche i contratti firmabili (voci delle 15:40 e 15:55), che richiedono app-14 su Supabase prima di andare online.
- Copia di prima: `_copie-dashboard-home-1610`.
- File: nuovi `area-privata/dashboard/js/home.js`, `area-privata/dashboard/css/home.css`; cambiati `area-privata/dashboard/js/app.js` (navItems, primaPagina, logo, BREVE), `area-privata/dashboard/index.html` (home.css, home.js, app.js?v=8), `CLAUDE.md`.

### 11.10.2026 15:55 · Claude — compilabili e firmabili dal telefono anche gli altri 4 contratti della rete
- Responsabile Rete Italia, Responsabile sviluppo rete (collaborazione occasionale), Capo area e Sub-agente: stesso funzionamento del contratto Agente (carta intestata, campi da compilare, spunte, firma col dito, «Invia», sola lettura fino alla firma). Testo preso dai PDF versione 10.10.2026 e controllato parola per parola col PDF (articoli e Allegato A); Allegati B e C sono identici in tutti e 5 i contratti.
- Campi propri di ogni contratto: Sviluppo rete senza partita IVA, con documento; Capo area con la «Regione» dell'art. 2.2; Sub-agente con documento, partita IVA ed Enasarco facoltativi e i dati dell'Agente di riferimento (nome, partita IVA, zona). Nell'art. 4.2 dello Sviluppo rete le aree sono in tabella.
- Sub-agente: compare «L'Agente di riferimento · per accettazione», ma la sua firma nell'app non viene ancora raccolta (da decidere).
- Provato in locale con dati finti per tutti e 4 i ruoli (telefono 390 px): blocco, compilazione, invio, dati salvati. NON pubblicato. Serve sempre `app-14` su Supabase prima di pubblicare.
- File: `area-privata/dashboard/js/contratti-modelli.js`, `area-privata/dashboard/js/contratto-firma.js` (riga per altri firmatari), `CLAUDE.md`.

### 11.10.2026 15:40 · Claude — contratto Agente compilabile e firmabile dal telefono, area in sola lettura fino alla firma
- Su richiesta di Nando: il contratto si compila e si firma nell'app, anche da telefono. Carta intestata come la mail d'invito (logo e dati Palumbo Investment in alto con filo arancio, fascia curva e piede blu basso in fondo), senza riquadri scuri e senza i dati di chi ha invitato. Testo del contratto Agente versione 10.10.2026 identico al PDF.
- In Documenti il «Contratto Agente» da firmare apre il contratto con i campi da compilare (dati anagrafici, CF, P.IVA, REA, CCIAA, Enasarco, telefono, PEC, mail, IBAN, zona art. 2.2, luogo), le spunte «letto e accetto» e artt. 1341-1342, la firma col dito e «Invia contratto firmato». Controlli su CF, P.IVA, IBAN e mail. Impronta SHA-256 del testo con i dati compilati.
- Finché il contratto del proprio ruolo non è firmato, l'agente della rete vede tutto ma non registra niente: striscia «La tua area è in sola lettura» con «Firma il contratto» su ogni pagina; i tasti che salvano o inviano sono fermati (Documenti resta libero). Dopo l'invio la striscia sparisce e tutto si attiva. Chi non è in app_rete (anteprime) non è toccato.
- Dopo la firma: «Apri il contratto firmato» in Documenti (copia completa con dati, firma, impronta, «Salva in PDF»); l'admin in Contratti apre la stessa copia da «Ricevuta».
- Database: nuovo `app-anchecasa/sql/app-14-contratto-compilato.sql` (colonna `app_firme.dati`, rpc `app_firma_contratto`, funzione `app_contratto_ok`, policy restrittive: senza firma niente insert in app_vendite e app_affari). NON ancora eseguito su Supabase: va lanciato nell'SQL Editor PRIMA di pubblicare la dashboard, altrimenti l'invio risponde «Manca app-14».
- Gli altri 4 contratti (Rete Italia, Sviluppo, Capo area, Sub-agente) per ora restano col PDF e la firma di prima: il blocco vale anche per loro, si sblocca con quella firma. Per farli compilabili basta aggiungere il loro modello in `contratti-modelli.js`.
- Provato in locale con dati finti (telefono 390 px e computer): sola lettura, blocco dei tasti, compilazione, errori, firma, invio, sblocco, copia firmata. NON pubblicato: lo pubblica Nando.
- Copia di prima: `_copie-dashboard-contratto-firma-1531`.
- File: `area-privata/dashboard/index.html`, `area-privata/dashboard/js/app.js` (una riga dopo paintTop), `area-privata/dashboard/js/contratti.js`, nuovi `area-privata/dashboard/js/contratto-firma.js`, `area-privata/dashboard/js/contratti-modelli.js`, `area-privata/dashboard/css/contratto-firma.css`, `area-privata/dashboard/img/contratto-logo.png`, `contratto-logo-negativo.png`, `contratto-curva.png` (da `sito/assets/mail` e `sito/assets/logo/footer-curva.png`), `app-anchecasa/sql/app-14-contratto-compilato.sql`, `CLAUDE.md`.

### 11.10.2026 12:15 · Cursor — app 2.7 e SuperMastro, quanto si poteva fare senza chiedere conferme
- App: database app-03…app-13 ok. Funzione pubblicata solo sdi-gateway (limite 100 funzioni). Sito su https://app-anchecasa.pages.dev. app.anchecasa.it collegato ma pending, risponde 522. Commit su main: `62b2a93`.
- SuperMastro: prove 16/16, typecheck e build ok, lint 20 errori. Migrazioni 20261011 applicate, controllo RLS ok. Secrets SOS_SHARE_SECRET e CRON_SECRET creati. Pull request https://github.com/anchecasa/supermastro-sos/pull/1 non unita. Il sito online è ancora quello di prima: l'admin si apre senza login. Workflow notturno assente su main.
- Password del database e token nel file non accettati. Appunti aggiornati nella dashboard, voce Appunti.
- File: `area-privata/dashboard/js/appunti-francesco.js`, `area-privata/dashboard/index.html`, `CLAUDE.md`.

### 11.10.2026 11:55 · Cursor — app AncheCasa 2.7 messa online per quanto si poteva da qui
- Database: app-03 … app-13 eseguiti sul progetto ANCHECASA. Verifica dello script superata (18 lavorazioni, piani, fascicolo, bucket fascicolo/loghi/sopralluoghi, link cliente e fornitore, tabelle private non leggibili senza account, avviso scadenze già programmato). Lo script online-1 non si collega: la password nel file risponde «password authentication failed».
- Funzioni: pubblicata solo sdi-gateway. Le altre si fermano con «Max number of functions reached for project, please upgrade Plan or disable spend cap» (100 funzioni già presenti). Il token Supabase nel file risponde 401. Usato il login della CLI già sul PC.
- App: pubblicata su https://app-anchecasa.pages.dev (titolo AncheCasa). Il dominio app.anchecasa.it è stato staccato dal progetto vecchio e collegato a app-anchecasa, ma resta «pending» e l'indirizzo risponde 522/523. Il token Cloudflare nel file non è valido e da qui non si possono cambiare i record DNS.
- Secrets impostati senza mostrarli: APP_URL, SDI_WEBHOOK_SEGRETO. Mancano MAIL_PROVIDER, MAIL_API_KEY, MAIL_MITTENTE, PRIVACY_URL, GEMINI_API_KEY.
- File: `app-anchecasa/`, `CLAUDE.md`.

### 11.10.2026 11:33 · Cursor — Francesco vede gli appunti entrando dal computer
- Nell'area privata, se nome o mail contengono Francesco, la prima pagina è «Appunti». Gli altri admin trovano la voce accanto a Task. Provato in locale: la pagina elenca cosa è fatto e cosa manca, e un admin che non è Francesco resta su Iscritti.
- Pubblicato su https://areaprivata.anchecasa.it, progetto `area-privata-produzione`, deployment `dpl_v3hXfywRTxoA8gDdkq4HhBka9HFh`. Lo script online risponde e contiene il titolo degli appunti.
- File: `area-privata/dashboard/js/appunti-francesco.js`, `area-privata/dashboard/js/app.js`, `area-privata/dashboard/index.html`, `APPUNTI-PER-FRANCESCO.md`, `CLAUDE.md`.

### 11.10.2026 ~11:45 · Claude — script per mettere online tutto senza passaggi a mano (NON eseguiti)
- **Nuovi file**: `app-anchecasa/scripts/_ambiente.mjs` (legge gli accessi già presenti in `04-SuperMastro\web\.env.local`, non li mostra mai), `online-1-database.mjs` (esegue solo i file SQL mancanti app-08…13, uno per volta tutto-o-niente, prova pg_cron, verifica permessi e cartelle), `online-2-funzioni.mjs` (pubblica sdi-gateway, sopralluogo-flash, subappalti-mail, gare-analisi; crea APP_URL e SDI_WEBHOOK_SEGRETO casuale; usa la GEMINI_API_KEY già presente se manca; controlla che le funzioni accettino l'app), `online-3-app.mjs` (Cloudflare Pages «app-anchecasa», dominio app.anchecasa.it e DNS se manca, indirizzo dell'app tra quelli ammessi da Supabase Auth, controlli online), `online-tutto.mjs` (i tre in fila). In SuperMastro: `scripts/online-segreti-sos.mjs` (SOS_SHARE_SECRET e CRON_SECRET creati e allineati, valori mai mostrati).
- **Cambiato nelle funzioni**: `gare-analisi`, `sdi-gateway`, `sopralluogo-flash`, `subappalti-mail` → se `DIAGNOSI_ORIGINI` è impostata, viene sempre ammessa anche l'app (`APP_URL` / https://app.anchecasa.it). `supermastro-analisi` non è stata toccata (file in sola lettura).
- **Provato**: passo 1 su Postgres locale (esegue solo app-13, al secondo giro non fa niente); passi 2 e 3 con Supabase e Cloudflare simulati.

### 11.10.2026 11:22 · Cursor — schema gare su Supabase, appunti per Francesco
- Eseguiti sul progetto ANCHECASA `edsvmnxojsmknjuhobqa`, in ordine: `app-anchecasa/sql/app-01-supermastro.sql`, `app-anchecasa/sql/app-02-completa.sql`, `supabase/migrations/20261011103000_e_procurement.sql`. Controllo: tabelle `app_org` e `app_ep_*`, bucket `e-procurement`, ruolo `general_contractor_buyer`, cron `anchecasa-ep-chiudi-scadute`. Organizzazioni 0, Albo 0, admin di piattaforma 2. App-03 … app-13 non eseguiti. Nessuna service role. Cruscotto non pubblicato.
- Appunti: `APPUNTI-PER-FRANCESCO.md` (copia uguale in `BIM-SICUR\ecosistema-anchecasa`).
- File: `APPUNTI-PER-FRANCESCO.md`, `CLAUDE.md`.

### 11.10.2026 11:15 · Cursor — SQL completo delle gare private copiato, non eseguito
- In `supabase/migrations/20261011103000_e_procurement.sql` c’è lo schema intero che usa il cruscotto Next: gare, documenti, inviti, offerte a busta chiusa, registro. Va lanciato a mano dopo app-01 e app-02. Non eseguito da qui.
- File: `supabase/migrations/20261011103000_e_procurement.sql`, `CLAUDE.md`.

### 11.10.2026 10:45 · Cursor — chiave pubblica Supabase copiata nel cruscotto Next, solo in locale
- Nel file locale `.env.local` di `BIM-SICUR\ecosistema-anchecasa` ci sono l’indirizzo `edsvmnxojsmknjuhobqa` e la chiave publishable già presente nel sito. Non committata. Nessuna chiave nuova sul pannello Supabase e nessuna service role.
- File annotato: `CLAUDE.md`.

### 11.10.2026 ~11:00 · Claude — app-anchecasa 2.7.0: Magazzino e Mezzi collegati al cantiere, logo della ditta, pubblicazione su Cloudflare Pages preparata (NON su Supabase, NON pubblicato)
- **Nuovi file**: `app-anchecasa/sql/app-13-magazzino-mezzi.sql` (tabelle `app_mag_movimenti`, `app_mezzi_uso`; funzioni `app_mag_legge/scrive/operatore`, `app_mag_puo_muovere/usare`, `app_mag_in_cantiere`, `app_scadenza_imposta`, `app_costi_cantiere`, `app_logo_mio`; trigger scadenze dei mezzi verso `app_scadenze`; bucket pubblico `loghi`; `app_stima_pubblica` ora restituisce anche `ditta_logo`), `app-anchecasa/js/mag-api.js`, `app-anchecasa/js/viste-magazzino.js`, `app-anchecasa/scripts/prepara-pubblicazione.mjs`, `app-anchecasa/.gitignore` (`dist/`, `supabase/.temp/`).
- **Cambiato nell'app**: `js/schede.js` (mezzo: «Bollo fino al» e «Costo al giorno»), `js/viste-flash.js` (logo nei Dati fiscali e nella pagina del cliente; «con finitura» solo se c'è), `js/flash-api.js`, `js/app.js`, `sw.js` (2.7.0), `js/config.js` (2.7.0), `LEGGIMI.md` (passo 13 e pubblicazione su Cloudflare Pages).
- **Regole**: la giacenza del deposito resta in `articolo.dati.giacenza` (il semaforo «Da riordinare» continua a funzionare); i movimenti non si cancellano (si corregge con reso o inventario); scarico bloccato se in deposito non basta; un mezzo non può stare in due cantieri negli stessi giorni; i costi reali li vede solo chi gestisce la ditta; il lavoratore può registrare solo scarichi, resi e uso dei mezzi; la manodopera interna non è ancora nei costi (segnalato a schermo).
- **Provato**: SQL due volte su Postgres locale (costo medio 7 €, giacenza, blocchi, sovrapposizione mezzi, costi cantiere 60 € materiali + 380 € mezzi, permessi lavoratore/estraneo, scadenze revisione/assicurazione/bollo/manutenzione); nel browser in modalità prova: magazzino, mezzi, costi del cantiere, logo, più le prove di Flash e subappalti rifatte senza errori; `prepara-pubblicazione.mjs` crea `dist/` con 37 file e nessuna chiave.

### 11.10.2026 10:25 · Cursor — ruolo gare private rinominato, pulsante nel cruscotto Next
- Nel cruscotto `BIM-SICUR\ecosistema-anchecasa` la voce e la card «Gestione e-Procurement & Subappalti» compaiono solo per admin o `general_contractor_buyer`. Non è l’area privata e non è online.
- Lo SQL locale usa quel ruolo al posto di `corporate_buyer`. Non eseguito su Supabase.
- File: `supabase/migrations/20261011103000_e_procurement.sql`, `CLAUDE.md`.

### 11.10.2026 10:20 · Cursor — SQL gare private pronto, non eseguito su Supabase
- La pagina admin delle gare private sta nel cruscotto Next `BIM-SICUR\ecosistema-anchecasa`, ramo `feature/e-procurement`, indirizzo `/admin/e-procurement`. Non è l’area privata e non è online.
- Qui è copiata la migrazione da applicare a mano dopo `app-01` e `app-02`. Non crea un secondo albo: usa `marketplace.app_org` e aggiunge solo il ruolo `corporate_buyer`. CLI Supabase, Docker e `db push` non sono stati usati.
- File: `supabase/migrations/20261011103000_e_procurement.sql`, `CLAUDE.md`.

### 11.10.2026 ~08:45 · Cursor — AncheBandi nella dashboard admin, non un sito a parte (NON pubblicato)
- AncheBandi non ha un dominio suo. La voce «Bandi» sta nel menu admin, subito dopo «Iscritti registrati». L’indirizzo è `https://areaprivata.anchecasa.it/dashboard/#/admin/bandi`.
- La pagina legge `public.anchebandi_feed_items`. Se lo schema non c’è ancora su Supabase, lo dice. In anteprima `?demo=admin` mostra tre gare con la scritta «Esempio».
- In `anchebandi/.env.production.local` l’URL pubblico non è più `bandi.anchecasa.it`: è la dashboard. `APP_DOMAIN` è vuoto, così il deploy non crea un sito a parte. Il deploy non è stato lanciato: manca ancora la password del database.
- File: `area-privata/dashboard/js/app.js`, `area-privata/dashboard/js/bandi-admin.js`, `area-privata/dashboard/index.html`, `anchebandi/.env.production.local`, `CLAUDE.md`.

### 11.10.2026 08:15 · Cursor — Supabase: file SQL e Edge Functions
- File eseguiti: nessuno. Funzioni pubblicate: nessuna.
- Collegamento tentato: MCP Supabase assente. `SUPABASE_DB_URL` assente. `psql` non è nel percorso del terminale; il programma c’è in PostgreSQL 16.
- Verifiche: non eseguite. Secrets: non controllati.
- Problema: manca il collegamento al database. Fermato prima di qualsiasi modifica.

### 11.10.2026 07:25 · Cursor — AncheBIM: dieci piani con quota Z
- Un palazzo con più piani, anche dieci, ha una quota Z in millimetri per piano. Non pubblicato.

### 11.10.2026 07:22 · Cursor — AncheBIM: asse Z in millimetri
- Nel cruscotto `ecosistema-anchecasa` il controllo triplo confronta anche la Z, in millimetri, al millesimo. Non pubblicato.

### 11.10.2026 07:08 · Cursor — cruscotto AncheBIM nel progetto ecosistema-anchecasa (non pubblicato)
- Nel Next.js `BIM-SICUR\ecosistema-anchecasa`: pulsante AncheBIM nel cruscotto `/admin` e pagina `/admin/bim` per analizzare un PDF (controllo triplo) o uno ZIP. Logica copiata dal motore su disco esterno. Non è l’area privata e non è online.
- File: `services/anchebim/`, `src/app/admin/`, `src/app/api/bim/analizza/route.ts`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`.

### 11.10.2026 06:53 · Cursor — pubblicati Vercel e Cloudflare (l’app no)
- Vercel, produzione: progetto `anchecasa-pulito`, deployment `dpl_DMwKw7zBu4Y8YNgJDvbHdxnhX2co`, alias https://anchecasa.it. Il menu Magazine porta a https://magazine.anchecasa.it/.
- Vercel, produzione: progetto `magazine-anchecasa`, deployment `dpl_nCGCQ6dowbtgMVZQLDL8f5ud1UiF`, alias https://magazine.anchecasa.it. Foglio `stile.css?v=4`.
- Vercel, produzione: progetto `area-privata-produzione`, deployment `dpl_6po6X8gYbm5Nr8jDtGme9WtRQ7db`, alias https://areaprivata.anchecasa.it. Favicon risponde 200. Con questo invio vanno online anche dashboard, proposte rete, sala strategia e contratti che il 10.10 erano solo in locale.
- Cloudflare Pages, progetto `sicura`, produzione, deployment `51ba325d`, alias https://sicura.anchecasa.it. Titolo «AncheSicura · La sicurezza di AncheCasa». Senza `LEGGIMI.txt`.
- Non pubblicato: `app-anchecasa` e `app.anchecasa.it`. Supabase non toccato.
- Prova: i quattro indirizzi rispondono 200.
- File annotato: `CLAUDE.md`. In locale è comparso `area-privata/.gitignore` (solo `.vercel` e `.env*`), non è nel commit.

### 11.10.2026 06:47 · Cursor — tutto il lavoro locale mandato su GitHub (main)
- Commit sul ramo `main` di https://github.com/anchecasa/anchecasapulito e push. Dentro: app AncheCasa fino alla 2.6 (rete, strategia, documenti, fatture, sicurezza, Sopralluogo Flash, subappalti), dashboard (proposte, sala strategia, contratti), favicon dell’area privata, bollino del Magazine, spot in `social/`.
- Fuori dal commit: `app-anchecasa/supabase/.temp/` (file temporaneo della CLI). Nessuna chiave. Supabase non è stato aggiornato. I siti online (Vercel, Cloudflare) non sono stati ripubblicati con questo invio.
- File annotato: `CLAUDE.md`.

### 11.10.2026 ~06:45 · Claude — app-anchecasa 2.6.0: subappalti con pagamenti su misura, offerte dei fornitori, Profit Guard, preventivo ufficiale (NON ancora su Supabase, NON pubblicato)
- **Nuovi file**: `app-anchecasa/sql/app-12-subappalti-profit-guard.sql` (tabelle `app_computi`, `app_sub_richieste`, `app_sub_inviti`, `app_sub_offerte`, `app_milestone`, `app_fornitori_zona`, `app_mail_stop`; funzioni `app_milestone_errore/quote/testo`, `app_milestone_preventivo`, `app_profit_guard`, `app_sub_crea/pagamenti/annulla`, `app_invito_leggi/offerta/stop` (senza account, dal link), `app_offerta_decidi`, `app_preventivo_ufficiale`, `app_amministro`; `app_stima_pubblica` ora restituisce anche il nome della ditta), `app-anchecasa/supabase/functions/subappalti-mail/index.ts`, `app-anchecasa/js/sub-api.js`, `app-anchecasa/js/viste-sub.js`.
- **Cambiato nell'app**: `js/viste-flash.js` (punti dove si agganciano i blocchi nuovi, nome della ditta e passo «Preventivo ufficiale» nella pagina del cliente), `js/flash-api.js`, `js/main.js` (pagine pubbliche `#/offerta/…` e `#/offerta-stop/…`), `js/app.js`, `sw.js` (2.6.0), `js/config.js` (2.6.0), `LEGGIMI.md` (passo 12 e funzione `subappalti-mail`).
- **Decisioni di Nando (11.10.2026)**: tutto nell'app 2.3; pagina del cliente con AncheCasa + nome della ditta (cambia la decisione di prima «solo AncheCasa»); inviti ai fornitori solo per mail; pagamenti su misura per ogni richiesta e preventivo (righe a %, a importo fisso, un «saldo»; 30/30/40 è solo la proposta iniziale).
- **Regole**: decide le offerte e approva il preventivo ufficiale il titolare (o l'admin); dopo l'approvazione finale computo e costi sono bloccati; nessun numero inventato (sicurezza, maggiorazioni, prezzi di smaltimento e soglia di margine li scrive l'ufficio o l'admin); chi chiede di non ricevere mail non viene più scritto. Stati delle offerte in italiano: in_revisione (pending_admin_review), approvata, rifiutata, in_trattativa (negotiating).
- **Provato**: SQL due volte su Postgres locale (regole dei pagamenti, quote e arrotondamenti, controproposta, approvazione, blocchi, preventivo con righe di logistica/CER/sicurezza, testo dei pagamenti nelle condizioni); funzione mail con Supabase e Brevo simulati; percorso completo nel browser in modalità prova (agente propone fornitore → ufficio costi e richiesta → due fornitori rispondono → titolare approva → preventivo ufficiale → pagamenti del cliente).

### 11.10.2026 ~06:15 · Claude — app-anchecasa 2.5.0: Sopralluogo Flash, link del cliente, dossier dell'ufficio, «Converti in cantiere attivo» (NON ancora su Supabase, NON pubblicato)
- **Nuovi file**: `app-anchecasa/sql/app-11-sopralluogo-flash.sql` (campi Flash su `app_sopralluoghi`, stati nuovi `in_ufficio` e `budget_ok`; tabelle `app_sopralluoghi_media`, `app_sopralluoghi_pratica`, `app_comuni_sue`, `app_prezzari`, `app_prezzari_voci`, `app_stima_lavorazioni`, `app_stima_riferimenti`, `app_codici_cantiere`; funzioni `app_stima_calcola`, `app_sopralluogo_invia`, `app_stima_pubblica`, `app_stima_ok_budget`, `app_converti_in_cantiere`, `app_flash_posso`), `app-anchecasa/supabase/functions/sopralluogo-flash/index.ts`, `app-anchecasa/js/flash-api.js`, `app-anchecasa/js/viste-flash.js`.
- **Cambiato nell'app**: `js/main.js` (pagina pubblica `#/stima/<token>` senza accesso), `js/app.js` (installa le viste Flash), `js/viste-fatture.js` (stati nuovi del sopralluogo), `sw.js` (versione 2.5.0 e file nuovi), `js/config.js` (2.5.0), `LEGGIMI.md` (passo 11 e funzione `sopralluogo-flash`).
- **Decisioni di Nando applicate**: prezzi solo dai prezzari regionali caricati dall'admin; pagina del cliente solo con marchio AncheCasa, niente nome della ditta, del luogo solo il comune; audio a Gemini, tenuto 90 giorni poi solo testo; titolo edilizio suggerito dall'AI e confermato dal tecnico; vincoli e zona sismica «da verificare» finché il tecnico non li controlla.
- **Provato**: SQL due volte su Postgres locale (stima, link, ok budget senza account, niente nome ditta, conversione bloccata senza computo validato, codice AC-2026-0001); funzione `sopralluogo-flash` con Supabase e Gemini simulati; percorso completo nel browser in modalità prova (agente → cliente → ufficio → cantiere → admin prezzari).

### 11.10.2026 ~05:55 · Claude — app-anchecasa 2.4.1: Sicurezza del cantiere (D.Lgs. 81/08) e scadenziario comune (NON ancora su Supabase, NON pubblicato)
- **Nuovi file**: `app-anchecasa/sql/app-10-sicurezza-cantiere.sql` (tabelle `app_cantiere_soggetti`, `app_fascicolo_requisiti`, `app_fascicolo_documenti`, `app_scadenze`; bucket privato `fascicolo`; funzioni `app_semaforo_soggetto`, `app_fascicolo_cantiere`, `app_sicurezza_cantieri`, `app_scadenze_avvisa` con pg_cron alle 7 di Roma se attivo), `app-anchecasa/js/sic-api.js`, `app-anchecasa/js/viste-sicurezza.js`.
- **Cambiato nel database**: `app_registra_ingresso` (riscritta in app-10, stessa firma): se la persona è nel fascicolo del cantiere vale il semaforo del fascicolo; se non è in regola la ditta riceve un avviso e l'ingresso salva i motivi.
- **Cambiato nell'app**: `js/app.js` (installa le viste della sicurezza dopo le fatture), `sw.js` (versione 2.4.1 e i due file nuovi), `LEGGIMI.md` (passo 10 e pg_cron). Il form dell'ingresso (codice del patentino) ora mostra i motivi del «non in regola».
- **Dove si vede**: Moduli → Sicurezza o Sicurezza Cantiere → «Fascicolo di cantiere» e «Scadenze»; nella scheda di ogni cantiere la riga «Fascicolo di sicurezza» con il semaforo; per un'impresa della rete che fa da subappaltatore: «Dove lavori come subappaltatore» (carica da sola i documenti, la ditta li verifica).
- **Regole**: rosso = manca un documento obbligatorio, scaduto o respinto (non entra); giallo = scade entro 15 giorni o da verificare; DURC 120 giorni e visura 180 giorni dal rilascio se manca la scadenza. Documenti richiesti modificabili dall'admin (tabella `app_fascicolo_requisiti`).
- **Provato**: SQL due volte su Postgres locale (semaforo, DURC caricato dal sub, permessi, ingresso, avvisi una volta al giorno); viste in modalità prova con `db.js` e `q.js` veri.
- **Da verificare con il consulente AncheSicura**: elenco dei documenti richiesti per tipo e le validità predefinite.

### 11.10.2026 ~05:35 · Claude — app-anchecasa 2.4: preventivi e fatture elettroniche (SdI) e Sopralluogo → Preventivo → Cantiere → Fattura (NON ancora su Supabase, NON pubblicato)
- **Nuovi file** (nessun file vecchio toccato tranne i collegamenti qui sotto):
  - `app-anchecasa/sql/app-08-fatture-elettroniche.sql`: tabelle `app_fe_profili` (dati fiscali di chi emette), `app_fe_numeri`, `app_fe_documenti` (preventivi, fatture, acconti, note di credito), `app_fe_righe`, `app_fe_eventi`, `app_fe_piani`, `app_fe_crediti`, `app_fe_costi`, `app_api_usage_logs`; totali e IVA per aliquota calcolati dal database; numerazione; preventivo → fattura; documento bloccato dopo l'invio; credito scalato prima dell'invio e restituito se il gateway fallisce; costi e margini visibili solo all'admin. Tenant = `app_org`; clienti e cantieri restano in `app_record`.
  - `app-anchecasa/sql/app-09-sopralluoghi-pratiche.sql`: tabella `app_sopralluoghi` (agente + ditta + cliente, data, indirizzo, posizione, note, foto nel bucket privato `sopralluoghi`), colonna `sopralluogo` su `app_fe_documenti`, funzioni `app_sopralluogo_a_preventivo`, `app_fe_apri_cantiere` (collega anche l'eventuale affare della rete al cantiere), `app_pratica`, `app_mie_pratiche`, `app_ditte_rete`. NON è il tipo «sopralluogo» di `app_record` (quello resta AncheSicura).
  - `app-anchecasa/supabase/functions/sdi-gateway/index.ts`: XML FatturaPA FPR12, controlli, invio, stato, webhook. Gateway «simulato» finché non c'è il contratto (consegna dopo 20 secondi; codice destinatario XXXXXXX = scarto di prova).
  - `app-anchecasa/js/viste-fatture.js`, `js/fe-api.js`, `js/fe-xml.js` (stessa logica XML della funzione: se si cambia una, si cambia l'altra).
- **Collegamenti nei file esistenti**: `js/app.js` (installa le nuove viste per ultime), `sw.js` (versione ac-app-2.4.0 e i tre file nuovi), `js/config.js` (versione 2.4.0), `LEGGIMI.md` (passi 8 e 9 del database e la funzione sdi-gateway).
- **Dove si vede**: Impresa → Moduli → Ufficio → «Preventivi e fatture elettroniche» e «Sopralluoghi e pratiche»; home dell'agente → «Le mie pratiche» e «Nuovo sopralluogo»; Admin → Cruscotto → «Fatture elettroniche» (invii, costi del gateway, ricavi, margine, pacchetti da assegnare).
- **Provato**: SQL eseguito due volte su un Postgres locale che imita Supabase (regole di accesso e funzioni); giro completo in modalità prova con `db.js` e `q.js` veri. NON provato: lo schema XSD ufficiale dell'Agenzia (va validato con il gateway scelto) e le schermate su un telefono vero.
- **Da decidere (Nando)**: prezzi dei piani (oggi vuoti), costo vivo del gateway, gateway da contrattualizzare, se l'agente deve vedere gli importi della pratica (oggi no).

### 10.10.2026 14:22 · Cursor — dashboard: Contratti, firme, clienti da affidare, Il mio ruolo (NON pubblicato)
- Menu admin: «Contratti» subito dopo «Iscritti registrati», poi «Clienti da affidare». In alto i 5 contratti, il Regolamento e la Circolare 1/2026 come pulsanti che aprono i PDF copiati in `area-privata/dashboard/docs/`. Sotto, quando il database c’è: «firmato da N su M», chi deve ancora firmare, firma, data e ora, impronta, «Ricevuta», «Togli/Rimetti nella cartella» e «Nuova circolare».
- «Clienti da affidare»: testo fisso sulla metà quota e sulle 48 ore; modulo (cliente, partita IVA, telefono o mail, regione, cosa, importo, a chi) che scrive `app_vendite` con `affidato`; elenco con le ore (rosso oltre 48) e «Riassegna».
- Famiglia agente: «Il mio ruolo» (testi di `testi-rete.js`, regole a fisarmonica, «Fai un conto») e «Documenti» (Da firmare / Firmati / Da leggere, firma col dito o col mouse, SHA-256, `app_firma_documento`). In Guadagno, «Registra un cliente» con «Partita IVA (per le aziende)» e il controllo `app_cliente_libero`: se il cliente è di un collega compare «Questo cliente è già registrato da un collega: è suo.» I numeri di esempio restano con la scritta «Esempio». Nelle provvigioni: affidato = «Cliente di AncheCasa affidato (metà quota)»; segnala/chiude/segue/impresa del sub-agente = «… (tuo sub-agente)».
- Su Supabase `marketplace.app_documenti` non c’è (PGRST205). Non ho eseguito SQL e non ho aggiunto file in `supabase/migrations`. Le pagine mostrano «Manca app-07 su Supabase: eseguire app-anchecasa/sql/app-07-regole-clienti-documenti.sql». La firma, la seconda firma rifiutata, l’affido e il blocco della stessa partita IVA si potranno fare solo dopo che Nando lancia `app-01` … `app-07` nell’SQL Editor.
- Prova in locale: i 5 PDF rispondono 200 (`application/pdf`); il contratto del Responsabile Rete Italia si apre nel browser. «Il mio ruolo» per l’agente di esempio fa il conto 73,50 €. Registrare un cliente, senza la tabella, scrive il messaggio di app-07 e non salva nulla.
- Copia di sicurezza: `_copie-dashboard-contratti-1308`. Non pubblicato. `visibleNav`, le famiglie privato e azienda, `sito/`, `sicura/`, `magazine-sito/` e `app-anchecasa/` non sono stati toccati.
- File: `area-privata/dashboard/js/contratti.js`, `area-privata/dashboard/js/testi-rete.js`, `area-privata/dashboard/js/app.js`, `area-privata/dashboard/js/views.js`, `area-privata/dashboard/js/direzione.js`, `area-privata/dashboard/css/admin-task.css`, `area-privata/dashboard/index.html`, `area-privata/dashboard/docs/` (7 PDF), `CLAUDE.md`.

### 10.10.2026 ~12:55 · Claude — rete: Allegato C nei contratti, Regolamento, Circolare 1, app 2.3 (regole dei clienti, Il mio ruolo, Documenti con firma) (NON ancora su Supabase)
- Regole decise da Nando: chi porta tiene (linea), il cliente è di chi lo registra per primo (P.IVA / telefono-mail), iscrizioni dal sito (codice o P.IVA nei 90 giorni), clienti di AncheCasa affidati a metà quota «chi porta» e senza quote di linea, privati solo sui lavori e legati 12 mesi rinnovabili, territorio assegnato dai numeri (capo area con 5 agenti attivi), niente più perdita dei clienti di altre aree.
- ANCHECASA-LAVORO\file pdf: 5 contratti versione 10.10.2026 con Allegato C, nuovi «AncheCasa-Regolamento-della-rete.pdf» e «AncheCasa-Circolare-1-2026-Nuove-regole.pdf». Copia di prima: file pdf\_copie-file-pdf-10-10-1255. Da far vedere all'avvocato.
- app-anchecasa 2.3: sql/app-07-regole-clienti-documenti.sql (+ prove/07-prove.sql, tutte come atteso), js/viste-documenti.js, js/testi-rete.js, docs/ (PDF), ritocchi a viste-rete, viste-admin, viste-direzione, schede (firma), q.js, sw.js, config, LEGGIMI. Copia di prima: _copie-app-1255.
- Comandi per Cursor (dashboard area privata): COMANDO-CURSOR-strategia-sal-obiettivi.txt e COMANDO-CURSOR-contratti-documenti.txt.

### 10.10.2026 12:28 · Cursor — dashboard: sala strategia, lavori a SAL, obiettivi, report del mese (NON pubblicato)
- Nella dashboard admin: «Oggi» (4 barre del mese, obiettivo Italia, quanto manca al giorno, persone ferme, elenco Responsabile Rete Italia e sviluppo, modulo «Fissa gli obiettivi»), «Sala strategia» (In discussione / Decise / Non passate, commenti, linea e voto Sì/No) e «Lavori rete» (Da firmare / In corso / Collaudati, firma, tranche 30/30/40, incasso, provvigioni, «Lavoro perso»). Sulla pagina Iscritti, se ci sono, compaiono i lavori da firmare e gli argomenti che aspettano il voto admin.
- Famiglia agente: in cima a Pubblica e alla bacheca la carta «Oggi» per sé e chi sta sotto, più l’ultima linea decisa. Voce «Linee decise» per tutti. «Sala strategia» solo per Responsabile Rete Italia, sviluppo e capo area. In Guadagno i numeri di esempio restano con la scritta «Esempio»; le provvigioni dei lavori mostrano lavoro, tranche e ruolo, con l’avviso «Sui privati niente provvigioni, solo sui lavori».
- Famiglia azienda: voce «Il tuo mese» e, quando l’azienda è collegata all’app, gli 8 numeri e il PDF su carta intestata (testata blu, fascia arancio, barre, piede Palumbo Investment S.r.l.).
- Su Supabase `marketplace.app_strategie` e `marketplace.app_obiettivi` non ci sono (PGRST205). Non ho eseguito SQL e non ho aggiunto file in `supabase/migrations`. Le pagine mostrano «Manca app-06 su Supabase: eseguire app-anchecasa/sql/app-06-strategia-cantieri-obiettivi.sql». Il voto, la firma con margine 30.000 e valore 120.000, l’incasso della tranche 1 (3.600 € alla rete) e il salvataggio dell’obiettivo Italia si potranno fare solo dopo che Nando lancia `app-01` … `app-06` nell’SQL Editor.
- Copia di sicurezza: `_copie-dashboard-strategia-1218`. Non pubblicato. `visibleNav`, la famiglia privato, `sito/`, `sicura/`, `magazine-sito/` e `app-anchecasa/` non sono stati toccati.
- File: `area-privata/dashboard/js/direzione.js`, `area-privata/dashboard/js/views.js`, `area-privata/dashboard/js/app.js`, `area-privata/dashboard/css/admin-task.css`, `area-privata/dashboard/index.html`, `CLAUDE.md`.

### 10.10.2026 ~12:15 · Claude — app-anchecasa 2.2: sala strategia, lavori a SAL, obiettivi, report del mese (NON ancora su Supabase)
- Decisioni di Nando: sala strategia (i dirigenti ne parlano, decidono admin e Responsabile Rete Italia, la rete vede le «linee decise»); il privato non porta provvigioni, solo se fa un lavoro; provvigioni sui lavori a SAL come da contratto (40% del margine alla rete, tranche 30/30/40, solo sull'incassato); report mensile per l'azienda; ogni giorno tutti (admin compreso) vedono andamento e obiettivi.
- Nuovo `sql/app-06-strategia-cantieri-obiettivi.sql` (dopo app-05) e prove `sql/prove/06-prove.sql`: tutte come atteso.
- Nuovo js/viste-direzione.js; ritocchi a viste-rete.js, viste-admin.js, viste-aziende.js, q.js (prova), app.js, css/app.css, sw.js e config 2.2.0, LEGGIMI.md. Copia di prima: _copie-app-1215.

### 10.10.2026 12:06 · Cursor — dashboard: proposte della rete e catena (NON pubblicato)
- Nella dashboard, chi entra nella rete (sviluppo, capo area, agente, sub-agente) passa da una proposta. Propongono tutti. Decidono insieme admin, Responsabile Rete Italia e lo sviluppo dell’area, se l’area ne ha uno. Basta un no. Con tutti i sì l’invito nasce da solo. L’admin invita direttamente solo il Responsabile Rete Italia.
- Su Supabase la tabella `marketplace.app_proposte_rete` non c’è (risposta PGRST205). Non ho eseguito SQL e non ho aggiunto file in `supabase/migrations`. La pagina admin «Proposte rete» mostra «Manca app-05 su Supabase: eseguire app-anchecasa/sql/app-05-proposte-rete.sql». Il voto vero (sì dell’admin e proposta che resta in attesa finché manca il sì del Responsabile Rete Italia; un no che la respinge) si potrà fare solo dopo che Nando lancia `app-anchecasa/sql/app-01` … `app-05` nell’SQL Editor.
- Menu admin: voce «Proposte rete» dopo «Richieste agenti»; nel menu corto del telefono «Proposte». Se ci sono proposte da decidere, il numero compare sulla voce.
- Pagina: modulo «Proponi una persona», riquadro «Invita il Responsabile Rete Italia», schede «Da decidere», «Tutte», «Respinte/approvate» e «La catena». Sì e No chiamano `app_vota_proposta`. Il link d’invito è `https://app.anchecasa.it/#/invito/` più il codice, come l’app.
- «Genera link»: il gruppo Agente è spento, con «Si entra solo con proposta approvata → Proposte rete». Privato e azienda restano.
- Catena: albero rete Italia → sviluppo → capo area → agente → sub-agente. Il nome apre e chiude chi sta sotto. Giallo se non vende da più di 30 giorni o non ha mai venduto, rosso se è sospeso. Rete vuota: «Nessuno nella rete ancora.»
- Famiglia agente: se la persona non è nella rete vera, Catena resta la tabella di esempio con la scritta «Esempio» e da Inviti si invitano solo privati e aziende. Se è nella rete, Catena mostra il suo ramo e Inviti diventa «Proponi una persona» e «Le mie proposte». Responsabile Rete Italia e sviluppo vedono anche «Da decidere».
- Copia di sicurezza: `_copie-dashboard-proposte-1135`. Non pubblicato. `visibleNav`, `sito/`, `sicura/`, il magazine e `app-anchecasa/` non sono stati toccati.
- File: `area-privata/dashboard/js/rete-proposte.js`, `area-privata/dashboard/js/views.js`, `area-privata/dashboard/js/app.js`, `area-privata/dashboard/css/admin-task.css`, `area-privata/dashboard/index.html`, `CLAUDE.md`.

### 10.10.2026 ~11:55 · Claude — anchecasa.it/magazine: «Avvisami» dal telefono non funzionava (NON ancora pubblicato)
- Problema segnalato da Nando: sul telefono, toccando la mail di «Avvisami gratis quando esce» (app raccolta) la rivista si rifaceva da capo: il modulo spariva, il testo scritto si perdeva e la pagina restava bianca.
- Causa: la tastiera del telefono cambia l'altezza della finestra e `onResize` in sito/js/magazine.js richiamava `build()`.
- Correzione: se cambia solo l'altezza su un telefono, o mentre si scrive in un campo, la rivista non si ricostruisce. Provato su telefono simulato: mail scritta, tastiera chiusa, privacy, invio → «Fatto!».
- File: sito/js/magazine.js (onResize), sito/magazine.html (magazine.js?v=39). Copia di prima: _copie-magazine-1150.

### 10.10.2026 11:27 · Cursor — bollino dei giorni più piccolo, nell’angolo, non copre i visi
- Su magazine.anchecasa.it il cerchio arancio con «81» era 132 px (112 px sul telefono) e stava a metà copertina, sopra i visi. Ora è 80 px sul computer e 70 px sul telefono, nell’angolo in basso a destra, sul divano. I visi di uomo, donna e bambino restano liberi. Il numero e la scritta «giorni per il bonus casa al 50%» restano nel cerchio.
- Pubblicato il progetto Vercel `magazine-anchecasa`. Deployment `dpl_EXMeFZs5NZCNnoYwv6J7gWZ4cpmb`, alias https://magazine.anchecasa.it. `anchecasa-pulito` e https://anchecasa.it/magazine non sono stati toccati.
- Fogli `stile.css?v=4`. File: `magazine-sito/css/stile.css`, `magazine-sito/genera.py`, le 27 pagine HTML di `magazine-sito`, `CLAUDE.md`.

### 10.10.2026 11:20 · Cursor — magazine.anchecasa.it pubblicato: testata grande, copertina della rivista, bollino 81
- I file di `magazine-sito` erano già pronti: non rifatti e non rigenerati. Commit `99a9dcd` sul ramo main: «magazine.anchecasa.it: testata grande come prima, copertina identica alla rivista, giorni del bonus corretti». Push su GitHub (`bfd444d..99a9dcd`).
- Pubblicato il progetto Vercel `magazine-anchecasa`, Root Directory `magazine-sito`. Deployment `dpl_A65yT7eLFqFnDJfUtF1rxfp2LeVY`, alias https://magazine.anchecasa.it. `anchecasa-pulito` e https://anchecasa.it/magazine non sono stati toccati.
- Prova con ricarica senza cache: titolo «Anche Casa Magazine» grande (134 px a 1280 di larghezza, massimo 148 px), «Casa» arancio. Fogli `stile.css?v=3` e `sito.js?v=3`. Copertina uguale a quella della rivista su anchecasa.it/magazine (famiglia, «Verifica la tua bolletta», «83» stampato in copertina). Il bollino arancio dice «81 giorni per il bonus casa al 50%».
- File annotato: `CLAUDE.md`.

### 10.10.2026 ~11:30 · Claude — magazine.anchecasa.it: «AncheCasa Magazine» in prima pagina di nuovo grande come prima (NON ancora pubblicato)
- `css/stile.css` (v=3): testata in prima pagina alla misura di prima (fino a 148 px), restano i tratti sottili più spessi (opsz 20).

### 10.10.2026 ~11:25 · Claude — magazine.anchecasa.it: copertina identica alla rivista, giorni del bonus corretti (NON ancora pubblicato)
- Copertina del N.1 rifatta dai file attuali della rivista (sito/magazine.html, css/magazine.css, js/magazine.js di oggi), con i suoi caratteri: identica a quella che si vede su anchecasa.it/magazine (controllata nel browser). Prima veniva da una copia vecchia. File: `sorgenti-img/copertina-n1.jpg` → `img/copertina-n1-1600.jpg` e `-800.jpg`.
- Bollino dei giorni: conta i giorni interi che restano prima del 31 dicembre, senza oggi né il 31 (9 ottobre = 82, 10 ottobre = 81), come vuole Nando; il 30 dicembre «1», il 31 «Oggi, l'ultimo giorno». `js/sito.js` (v=3).
- Nota: la copertina della rivista (sito/js/magazine.js) ha ancora scritto «83» fisso, dal 9 ottobre.

### 10.10.2026 ~11:20 · Claude — app-anchecasa 2.2: chi entra nella rete lo decidete insieme (NON ancora su Supabase)
- Regola di Nando: tutti propongono; decidono insieme admin, Responsabile Rete Italia e sviluppo rete dell'area. Basta un no per respingere. Passata la proposta, l'invito nasce da solo.
- L'admin invita direttamente solo il Responsabile Rete Italia; nessun altro invita senza proposta approvata.
- Nuovo `sql/app-05-proposte-rete.sql` (da eseguire dopo app-04) e prove `sql/prove/05-prove.sql`.
- Nuove schermate: «Proponi una persona», «Proposte», «La catena» (admin e RRI vedono tutta la rete: clienti, vendite del mese, provvigioni, chi è fermo da più di 30 giorni).
- File: js/viste-rete.js, js/viste-admin.js, js/q.js, LEGGIMI.md. Copia di prima: _copie-app-1012.

### 10.10.2026 ~11:15 · Claude — magazine.anchecasa.it: prima pagina ripristinata come prima (NON ancora pubblicato)
- Su richiesta di Nando: in prima pagina torna la scritta «AncheCasa Magazine» nel carattere della rivista (Bodoni: Anche blu, Casa arancio, Magazine corsivo), al posto del logo; più piccola di prima (max 104 px) e con i tratti sottili più spessi (opsz 20).
- Annullato il cambio di carattere sugli altri titoli (tornano come prima). Copertina sul telefono di nuovo grande come prima.
- Restano: logo originale AncheCasa nella barra in alto, piede solo «© 2026 Palumbo Investment S.r.l.».

### 10.10.2026 11:09 · Cursor — prima pagina del Magazine di nuovo con il titolo grande
- Su https://magazine.anchecasa.it la prima pagina torna com’era: titolo grande «Anche» blu, «Casa» arancio, «Magazine» sotto. Copertina del N.1 e bollino dei giorni al 50% restano.
- In fondo resta solo «© 2026 Palumbo Investment S.r.l.», senza indirizzo, P.IVA e AncheStudio. «Chi siamo» resta «Palumbo Investment S.r.l.» e la mail.
- Prova: titolo 148 px, «Casa» arancio #E56B10, fondo bianco, riga legale esatta. Pubblicazione `dpl_GP1vLudygnfr91X4zHFw34EjhPCM` sul progetto `magazine-anchecasa`. anchecasa.it e l’area privata non sono stati toccati.
- File: `magazine-sito/index.html`, `magazine-sito/css/stile.css`, `magazine-sito/genera.py`, `CLAUDE.md`.

### 10.10.2026 10:59 · Cursor — magazine.anchecasa.it pubblicato con logo originale, Check Bollette, condivisione e iscrizione
- I file di `magazine-sito` erano già pronti: non rifatti e non rigenerati. Commit `bfd444d` sul ramo main: «magazine.anchecasa.it: AncheCasa Magazine N.1 con logo originale, Check Bollette, Cosa è cambiato, condivisione WhatsApp, statistiche». Push su GitHub (`adeada9..bfd444d`).
- Il dominio `magazine.anchecasa.it` è già del progetto Vercel `magazine-anchecasa` (`prj_uKAwJ23AFZdRYZDg0ocWXNf45ucC`). Non è stato creato un secondo progetto. Il collegamento a GitHub non è riuscito: `vercel git connect` su anchecasa/anchecasapulito risponde che manca l’accesso al repository. Root Directory `magazine-sito`, nessun comando di build. Pubblicazione `dpl_2GN9RyNi5SbxHTJzpqmipAfP7QFt`, stato Ready, alias https://magazine.anchecasa.it.
- DNS già a posto: CNAME `magazine` → `2c102f38e8c25313.vercel-dns-017.com`, configurazione corretta, certificato già attivo. Il progetto `anchecasa-pulito`, https://anchecasa.it/magazine e l’area privata non sono stati toccati.
- Prove su https://magazine.anchecasa.it: prima pagina chiara (fondo bianco, `color-scheme: light`), logo originale `img/logo-anchecasa-1120.png`, copertina del N.1, bollino «82 giorni» per il bonus al 50%. In fondo solo «© 2026 Palumbo Investment S.r.l.».
- `/check-bollette`: Gas, 365 €, 210 Smc, 2 mesi. «Analizza la mia bolletta» scrive «Paghi il 21% in più del giusto». «Scarica il report PDF» scarica `AncheCasa-report-bolletta-gas.pdf`, una pagina.
- `/articoli/la-bolletta-smontata`: riquadro «Cosa è cambiato» e «Condividi su WhatsApp» in testa e in fondo.
- Iscrizione in fondo con prova-magazine-logo@anchecasa.it e Comune Teano: «Fatto: ti scriviamo quando esce il prossimo numero.»
- File annotato: `CLAUDE.md`.

### 10.10.2026 10:50 · Cursor — da anchecasa.it, Magazine apre magazine.anchecasa.it
- Nel menu e nel piede di anchecasa.it la voce Magazine porta a https://magazine.anchecasa.it/. Prima apriva la rivista sfogliabile su anchecasa.it/magazine. Quella pagina resta dov’è.
- Pubblicata la cartella `sito` sul progetto `anchecasa-pulito`. Deployment `dpl_6vuYxuyur1Co5wrqAXLwefYchsLY`, alias https://anchecasa.it. Il progetto `magazine-anchecasa` non è stato toccato.
- Prova: su https://anchecasa.it il clic su Magazine apre https://magazine.anchecasa.it/, titolo «AncheCasa Magazine · la casa spiegata bene, gratis». https://anchecasa.it/magazine risponde ancora 200.
- File: le 43 pagine HTML del menu in `sito/`, `sito/js/sito.js`, `CLAUDE.md`.

### 10.10.2026 ~10:50 · Claude — magazine.anchecasa.it: logo originale, piede solo «Palumbo Investment S.r.l.», testata in prima pagina più piccola (NON ancora pubblicato)
- Testata del sito e prima pagina: logo originale AncheCasa (da `assets/logo-colore.png`, ritagliato in `img/logo-anchecasa-560.png` e `-1120.png`) al posto della casetta ridisegnata, con «Magazine» accanto/sotto.
- Prima pagina: «AncheCasa Magazine» più piccolo (logo 400 px su PC, 230 px sul telefono) e Bodoni con tratti più spessi (opsz 24) in tutti i titoli: niente filetti sottilissimi.
- Piede: riga legale solo «© 2026 Palumbo Investment S.r.l.» (tolti indirizzo, P.IVA, AncheStudio); in «Chi siamo» editore solo «Palumbo Investment S.r.l.» e la mail della redazione.

### 10.10.2026 10:40 · Cursor — Chrome apriva «Impossibile raggiungere questa pagina»
- Lo schermo di Chrome diceva `DNS_PROBE_FINISHED_NXDOMAIN` su https://magazine.anchecasa.it. Il nome sul computer risolveva già. Il servizio di rete di Chrome era partito alle 07:14 e teneva la risposta vecchia del modem.
- Riavviato solo quel servizio. Chrome ha aperto la pagina: titolo «AncheCasa Magazine · la casa spiegata bene, gratis».
- File annotato: `CLAUDE.md`.

### 10.10.2026 10:37 · Cursor — magazine.anchecasa.it si apre su questo computer
- Il record e il certificato c’erano già. Il DNS cifrato (Google e Cloudflare, porta 853) risponde con il CNAME e gli indirizzi. Il modem Fastgate di questa rete (`192.168.1.254`, myfastgate.nexxt) alla domanda dell’indirizzo risponde vuoto, quindi il browser non apriva il nome. `www.anchecasa.it` da quel modem si apre.
- DNS del Wi-Fi di questo computer: prima `192.168.1.254` e `2001:b07:ae5:7831:e67:14ff:fee5:caf0`. Ora `1.1.1.1` e `8.8.8.8`, e in IPv6 `2606:4700:4700::1111` e `2001:4860:4860::8888`, con DNS cifrato e senza ripiego sulla porta 53.
- https://magazine.anchecasa.it risponde 200. Pagina aperta: sfondo bianco, «82 giorni per il bonus casa al 50%», copertina del numero 1. `anchecasa-pulito` non è stato toccato.
- Un telefono collegato allo stesso Wi-Fi usa ancora il modem e può non aprire il nome. Con la rete mobile il DNS pubblico lo risolve.
- File annotato: `CLAUDE.md`.

### 10.10.2026 10:24 · Cursor — magazine.anchecasa.it online: CNAME su Cloudflare e certificato
- Il record c’è. I nameserver di Cloudflare e il DNS di Google rispondono: CNAME `magazine.anchecasa.it` → `2c102f38e8c25313.vercel-dns-017.com`, poi gli indirizzi `216.198.79.65` e `64.29.17.65`. Nuvola grigia.
- Vercel, progetto `magazine-anchecasa`: verifica del dominio `configured_correctly`. Il certificato HTTPS mancava e la connessione sicura si chiudeva. Certificato emesso. https://magazine.anchecasa.it risponde 200. `anchecasa-pulito` non è stato toccato. https://anchecasa.it/magazine risponde ancora 200.
- Prova sul sito pubblicato: home «AncheCasa Magazine», copertina, conto al 31.12.2026, sfondo chiaro (`color-scheme: light`). Articolo `/articoli/la-bolletta-smontata`: «Condividi su WhatsApp» in testa e in fondo, riquadro «Cosa è cambiato». `/check-bollette` risponde 200 e il file è identico a quello già provato (luce e gas, PDF di una pagina). Iscrizione `prova-magazine-dns@anchecasa.it`, Comune Teano: `{"ok":true}`.
- Su questo computer il router risponde vuoto alla domanda dell’indirizzo, quindi il browser di questa macchina non apre il nome. Il DNS pubblico sì.
- File annotato: `CLAUDE.md`.

### 10.10.2026 10:11 · Cursor — magazine.anchecasa.it ancora non si apre: manca il DNS
- GitHub: il sito è già su main, commit `582f7dd`. Il collegamento Vercel al repo non parte: manca l'app https://github.com/apps/vercel. Questa nota è il commit successivo.
- Vercel: il progetto `magazine-anchecasa` (`prj_uKAwJ23AFZdRYZDg0ocWXNf45ucC`) è in produzione, Root Directory `magazine-sito`, dominio `magazine.anchecasa.it` collegato. `anchecasa-pulito` non è stato toccato.
- Supabase: la CLI risponde `Invalid access token`. Rilanciata l'azione «Supabase · applica migrazioni» (run `38037004701`): il segreto `SUPABASE_DB_URL` non c'è, quindi lo SQL non parte. L'iscrizione del Magazine aveva già risposto `{"ok":true}` sulla funzione `/api/mag`.
- Cloudflare: il nome `magazine.anchecasa.it` non esiste. `www.anchecasa.it` è un CNAME verso `cname.vercel-dns.com`. La scrittura del record con l'accesso wrangler risponde 403 (può leggere la zona, non i DNS). Il pannello Cloudflare chiede la password di Google e non si entra.
- Resta questo record, nuvola grigia: CNAME `magazine` → `2c102f38e8c25313.vercel-dns-017.com`.
- File annotato: `CLAUDE.md`.

### 10.10.2026 09:58 · Cursor — magazine.anchecasa.it aggiornato: sito chiaro, Check Bollette, condivisione
- Le voci Claude ~09:35 e ~10:05 erano già nei file: non riscritte. I file di `magazine-sito` non sono stati rifatti.
- Commit `582f7dd` sul ramo main: «magazine.anchecasa.it: sito chiaro, Check Bollette, Cosa è cambiato, condivisione WhatsApp, statistiche». Push su GitHub (`ccc49d7..582f7dd`). File: `magazine-sito/` e `CLAUDE.md`.
- Stesso progetto Vercel già creato `magazine-anchecasa` (id `prj_uKAwJ23AFZdRYZDg0ocWXNf45ucC`), Root Directory `magazine-sito`, nessun comando di build. Non è stato creato un secondo progetto e non è stato toccato `anchecasa-pulito`. Pubblicazione `dpl_4vSaktssvXFwJtHWi1Vdk92cxKtX`, stato Ready. Il collegamento a GitHub non è riuscito: manca l'app https://github.com/apps/vercel.
- Il DNS non è ancora a posto. https://magazine.anchecasa.it non risolve (curl: host sconosciuto). Vercel indica il CNAME `magazine` → `2c102f38e8c25313.vercel-dns-017.com`, solo DNS, senza proxy. La scrittura del record su Cloudflare risponde ancora 403.
- https://anchecasa.it/magazine risponde 200.
- Prova sui file pubblicati: sfondo chiaro (`color-scheme: light`, fondo della pagina bianco). `/check-bollette` con Luce, 228,40 € e 420 kWh, 2 mesi: «Paghi il 25% in più del giusto», PDF `AncheCasa-report-bolletta-luce.pdf` di una pagina. Gas, stessi numeri: «Il tuo prezzo è buono», unità Smc, PDF `AncheCasa-report-bolletta-gas.pdf` di una pagina. Articolo `/articoli/la-bolletta-smontata`: «Cosa è cambiato» e «Condividi su WhatsApp» in testa e in fondo, link con `?da=whatsapp`. Iscrizione `POST /api/mag` con prova-magazine-chiaro@anchecasa.it e Comune Teano: `{"ok":true}`, il modulo scrive «Fatto: ti scriviamo quando esce il prossimo numero.»
- Resta da fare, in Cloudflare: CNAME `magazine` → `2c102f38e8c25313.vercel-dns-017.com` (nuvola grigia).
- File annotato: `CLAUDE.md`.

### 10.10.2026 ~10:05 · Claude — magazine.anchecasa.it migliorato (NON ancora pubblicato)
- Niente sfondo scuro (richiesta di Nando): tolta la modalità scura, il sito è sempre chiaro; fascia «App gratuite» e sezione AncheStudio su fondo chiaro. Blu resta solo il piede con la curva del marchio.
- Pulsanti più leggibili: arancio #B9530A con testo bianco (contrasto 4,9:1, prima 3,3:1).
- NUOVA pagina `check-bollette` con lo strumento completo (luce e gas, lancetta, persone in casa, report PDF uguale alla rivista): `js/check-bollette.js` (calcoli e PDF copiati da sito/js/magazine.js: se cambiano i prezzi di riferimento, aggiornarli in tutti e due). Loghi del PDF in `img/logo-colore.png` e `img/anchecasa-payoff-negativo.png`.
- Riquadro «Cosa è cambiato» negli articoli (campo `novita` in contenuti.py): bonus casa e bolletta.
- Condividi su WhatsApp e «Copia il link» in testa e in fondo a ogni articolo (link con ?da=whatsapp / ?da=link).
- Statistiche anonime come la rivista (api/mag.js): aperture, pagine, Check Bollette, PDF, condivisioni, iscrizioni; attive solo su magazine.anchecasa.it; la provenienza comincia con «sito ·» per distinguerle dalla rivista sfogliabile nella pagina Magazine dell'area admin.

### 10.10.2026 09:50 · Cursor — Nuovo sito magazine.anchecasa.it su un progetto Vercel nuovo
- La voce Claude ~09:35 era già nei file: non riscritta. I file di `magazine-sito` non sono stati rifatti.
- Commit `ccc49d7` sul ramo main: «Nuovo sito magazine.anchecasa.it: AncheCasa Magazine N.1». Push su GitHub (`6db10ab..ccc49d7`). File: `magazine-sito/` e `CLAUDE.md`.
- Nuovo progetto Vercel `magazine-anchecasa` (team anchecasas-projects), id `prj_uKAwJ23AFZdRYZDg0ocWXNf45ucC`. Root Directory `magazine-sito`. Framework Other, nessun comando di build impostato: non c'è un package.json, la pubblicazione statica è finita in 255 ms e `api/mag.js` è la funzione `/api/mag`.
- Il collegamento al repo GitHub non è riuscito: sull'account Vercel non c'è l'app GitHub (https://github.com/apps/vercel). Il progetto non è collegato a anchecasa/anchecasapulito. La pubblicazione in produzione è l'invio della cartella `magazine-sito`. Deployment `dpl_Fg45rwPhZde2sf2GDJGZa4s2gjV2`, stato Ready, alias https://magazine-anchecasa.vercel.app (protetto dall'accesso Vercel; i domini propri di produzione no).
- Dominio `magazine.anchecasa.it` aggiunto al progetto, proprietà verificata. Il DNS non è ancora a posto. Vercel indica il CNAME `magazine` → `2c102f38e8c25313.vercel-dns-017.com`, solo DNS, senza il proxy arancione di Cloudflare. Il secondo valore, meno preciso, è `cname.vercel-dns.com`.
- Il record non è stato scritto: la zona Cloudflare `anchecasa.it` (nameserver collins.ns.cloudflare.com e elmo.ns.cloudflare.com) si legge, la modifica dei record DNS risponde 403. Nel browser Cloudflare e GitHub chiedono l'accesso. https://magazine.anchecasa.it non risolve ancora.
- Il progetto `anchecasa-pulito` non è stato toccato. https://anchecasa.it/magazine risponde 200.
- Prova sulla pubblicazione, gli stessi file: home con la copertina del N.1 e il bollino «82 giorni per il bonus casa al 50%»; `/articoli/la-bolletta-smontata` si apre, titolo «La bolletta, smontata». Iscrizione `POST /api/mag` con prova-magazine-sito@anchecasa.it e Comune Teano: risposta `{"ok":true}`. Con quella risposta il modulo in fondo scrive «Fatto: ti scriviamo quando esce il prossimo numero.»
- Resta da fare, da chi entra in Cloudflare: CNAME `magazine` → `2c102f38e8c25313.vercel-dns-017.com` (nuvola grigia). Per i prossimi invii automatici: installare l'app GitHub di Vercel sul repo anchecasa/anchecasapulito e collegare il progetto.
- File annotato: `CLAUDE.md`.

### 10.10.2026 ~09:35 · Claude — NUOVO sito magazine.anchecasa.it (cartella `magazine-sito/`, NON ancora pubblicato)
- Sito ufficiale di AncheCasa Magazine, solo per i cittadini, senza imprese né pubblicità; per chi fa i lavori sempre e solo anchecasa.it. anchecasa.it/magazine (rivista sfogliabile, cartella `sito/`) resta com'è e il nuovo sito ci rimanda con «Sfoglia il numero».
- Pagine: home (testata AncheCasa Magazine, copertina vera del N.1 con il conto alla rovescia dei giorni per il bonus al 50%, «In questo numero», fascia «App gratuite, per sempre», «Da leggere», «Perché esiste questa rivista»), 15 articoli completi del N.1 in `articoli/`, 6 rubriche in `rubriche/`, `app-gratuite` (Check Bollette, SuperMastro, app della raccolta; sezione «Fatte da AncheStudio»), `numeri` (archivio), `chi-siamo` (indipendenza, editore), `404`, `sitemap.xml`, `robots.txt`.
- Contenuti verificati il 10.10.2026: bonus 50% prima casa / 36% altri fino al 31.12.2026, nel 2027 36% / 30%, dal 2028 30%; +37,3% luce vulnerabili IV trimestre 2026 (ARERA); soglia ISEE bonus sociale 9.796 € (20.000 € con 4 figli). Ogni articolo ha data di controllo e fonti.
- Generatore: `magazine-sito/genera.py` + `contenuti.py` (vedi `magazine-sito/LEGGIMI.md`); foto leggere create in `img/` da `sorgenti-img/`. Iscrizione: `magazine-sito/api/mag.js` (copia di `sito/api/mag.js`, stessa tabella Supabase). Piede con la curva del marchio identica a mail e report.
- Pubblicazione: nuovo progetto Vercel con Root Directory `magazine-sito` e dominio magazine.anchecasa.it (DNS: CNAME magazine → cname.vercel-dns.com).

### 10.10.2026 08:51 · Cursor — Sei mail del marchio online: immagini sul sito e script nell'area privata
- La voce Claude ~08:35 era già nei file: non riscritta.
- Commit `6db10ab` sul ramo main: «Sei mail del marchio leggere: inviti e iscrizioni dal sito». Push su GitHub. File: `sito/assets/mail/` (logo.png, logo-negativo.png, curva.png, privato.jpg, azienda.jpg, agente.jpg), `mail/` (invito, iscrizione, area-privata-online), `CLAUDE.md`.
- Il push da solo non avvia Vercel. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito`. Deployment `dpl_HuGJoTTiE1puPt8F3tyF3t2TUT3A`, stato Ready, alias https://anchecasa.it.
- Le sei immagini si aprono, tutte 200: logo.png (png, 4515 byte, 380×97), logo-negativo.png (png, 3315 byte, 340×87), curva.png (png, 2038 byte, 1200×104, fascia arancio chiaro/arancio/blu), privato.jpg, azienda.jpg e agente.jpg (jpeg, 900×450).
- Area privata: partiti dai file già online (deployment `dpl_7rRMon1Sz6og8CBF9Vaha5djX7e6`). Sostituito solo `dashboard/js/mail-modelli-nuove.js` con `mail/area-privata-online/dashboard/js/mail-modelli-nuove.js`. Pubblicato sul progetto `area-privata-produzione`. Deployment `dpl_99A6NpH9URcSfvZHwsK6Gm89pqRs`, stato Ready, alias https://areaprivata.anchecasa.it. Login, icona e il resto della dashboard restano quelli già online. Lo script online è 21637 byte e contiene le sei mail.
- Prova: https://areaprivata.anchecasa.it/dashboard/#/admin/admin-mail rimanda al login. Con gli script ora online e i dati di prova della pagina (invitato da Paola Neri; Marta Riva, Edil Nord Srl, Marco Sala), Privato, Azienda e Agente con «Riceve il link per iscriversi» e con «Si iscrive dal sito» mostrano le mail nuove, con la curva e il logo negativo. Titoli: «La tua casa, con le persone giuste.», «Benvenuto, Marta Riva. Sei dei nostri.», «Nuovi clienti nella sua zona.», «Benvenuti su AncheCasa.», «Costruisci la tua rete con AncheCasa.», «Grazie, Marco Sala: richiesta ricevuta.»
- Supabase resta da fare: il token della CLI non è valido (`Invalid access token`), da qui non si entra. a) Edge Functions → `invia-invito-marketplace`: incollare `mail/invito/funzione-caricata-invia-invito-marketplace.ts` e Deploy. b) Authentication → Email Templates → Confirm signup: incollare `mail/iscrizione/supabase-conferma-iscrizione.html`, oggetto «Conferma la tua mail · AncheCasa», salva.
- File annotato: `CLAUDE.md`.

### 10.10.2026 08:26 · Cursor — Report bollette con la curva del marchio, online su anchecasa.it
- Le voci Claude ~08:15 e ~08:25 erano già nei file: non riscritte.
- Commit `6930f96` sul ramo main: «Report bollette nuovo con la curva del marchio identica alle mail». Push su GitHub. File: `sito/js/magazine.js`, `sito/magazine.html`, `sito/assets/logo/footer-curva.png`, `sito/assets/logo/anchecasa-payoff-negativo.png`, `CLAUDE.md`. `mail/area-privata-online` era già nel commit precedente, niente di nuovo da aggiungere.
- Il push da solo non avvia Vercel. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito`. Deployment `dpl_Akg3xzsLNYwghbKzfER4qfbj5gxp`, stato Ready, alias https://anchecasa.it. Area privata non ripubblicata.
- https://anchecasa.it/assets/logo/footer-curva.png risponde 200, immagine png, 10687 byte, 1200×104. Fascia arancio chiaro, arancio e blu, quasi piatta a sinistra, sale verso destra.
- Prova su https://anchecasa.it/magazine, pagine 7–8, `magazine.js?v=38`. Luce, 228,40 €, 420 kWh, 2 mesi: «Paghi il 25% in più del giusto», risparmio circa 276 €. «Scarica il PDF» scarica `AncheCasa-report-bolletta-luce.pdf`, una pagina. In fondo la curva arancio chiaro, arancio e blu come la mail, più alta a destra, e il logo bianco con «Casa» arancio, «AncheCasa · Costruiamo fiducia · anchecasa.it».
- Rifatto con Gas, stessi numeri (228,40 € e 420 Smc): «La tua bolletta del gas, letta.», file `AncheCasa-report-bolletta-gas.pdf`, una pagina, stessa curva e stesso logo bianco.
- File annotato: `CLAUDE.md`.

### 10.10.2026 ~08:35 · Claude — Sei mail del marchio con il look approvato, leggere: 3 inviti + 3 iscrizioni dal sito (NON ancora pubblicato)
- `mail/invito/mail-invito.js` riscritto (fonte unica): `MailInvito.crea(famiglia, {link, invitante, categoria})` per gli inviti e NUOVO `MailInvito.iscrizione(famiglia, {link, nome})` per chi si iscrive dal sito. Stesso look della mail approvata: logo a sinistra e anchecasa.it, filo arancio, foto, etichetta, spunte su cerchio chiaro, pulsante, riquadro blu con 3 passi, curva del marchio, piede blu con logo bianco e «Casa» arancio, dati società corretti «Palumbo Investment S.r.l. · Via Giusti 22, 81057 Teano (CE) · P.IVA 04724830619» (prima c'erano 87057 e 04724810619, sbagliati).
- Iscrizione dal sito: privato e azienda si iscrivono subito (confermano ed entrano); agente = «Richiesta di collaborazione»: conferma la mail, completa il profilo, AncheCasa lo valuta e approva.
- Leggere: immagini nuove in `sito/assets/mail/` (privato.jpg 41 KB, azienda.jpg 52 KB, agente.jpg 45 KB 900×450; logo.png 4 KB, logo-negativo.png 3 KB, curva.png 2 KB) invece delle foto da ~300 KB; larghezza/altezza scritte e colore di fondo, la mail compare subito.
- Copie: blocco MAIL-INVITO in `funzione-caricata-invia-invito-marketplace.ts` (da incollare e distribuire su Supabase); `mail/invito/ufficiali/invito-*.html` rigenerate; NUOVE `mail/iscrizione/iscrizione-agente.html`, `-azienda.html`, `-privato.html`.
- NUOVO `mail/iscrizione/supabase-conferma-iscrizione.html`: modello per Supabase → Authentication → Email Templates → «Confirm signup». Una sola mail che cambia con `{{ .Data.famiglia }}` (agente / azienda / privato, il dato che mette l'iscrizione nel signUp) e usa `{{ .ConfirmationURL }}`.
- `mail/area-privata-online/dashboard/js/mail-modelli-nuove.js` aggiornato: la pagina «Mail del marchio» mostra tutte e sei le mail nuove (anche «Si iscrive dal sito»).

### 10.10.2026 ~08:25 · Claude — Curva del marchio identica alla mail approvata, nel report bollette e in footer-curva.png (NON ancora pubblicato)
- REGOLA DI MARCHIO (Nando): la fascia curva in fondo alla mail d'invito approvata (arancio chiaro, arancio, blu: quasi piatta a sinistra, sale verso destra) si ripete sempre uguale su tutti i documenti AncheCasa.
- Misurata pixel per pixel sulla mail approvata (larghezza 600): bordi y = ((a·t+b)·t+c)·t+d, t da 0 (sinistra) a 1 (destra). Arancio chiaro [3.1335, -42.8382, 10.2674, 33.5524]; arancio [-1.3827, -26.5596, 1.7325, 40.8033]; blu [0.6414, -21.6553, 2.0786, 47.9497]. Colori: #F49B50, #E56B10, #16304D. Usare questi numeri per ogni nuovo documento.
- `sito/assets/logo/footer-curva.png` rifatta con questa formula (1200×104): è l'immagine che le mail d'invito caricano da anchecasa.it.
- `sito/js/magazine.js`: piede del report PDF con la stessa formula (600 px = 210 mm) e il logo bianco con «Casa» e quadrato arancio come nella mail: nuovo `sito/assets/logo/anchecasa-payoff-negativo.png` (ricavato da `assets/logo-colore.png`, blu → bianco).

### 10.10.2026 08:10 · Cursor — Mail del marchio online: curva sul sito e tre mail d'invito nell'area privata
- Commit `5ac6d1d` sul ramo main: «Mail del marchio: le tre mail d'invito nuove al posto delle vecchie». Push su GitHub. File: `mail/area-privata-online/dashboard/js/mail-modelli-nuove.js`, `sito/assets/logo/footer-curva.png`, `CLAUDE.md`. Le mail in `mail/invito/` non sono state modificate.
- Pubblicata la cartella `sito` sul progetto Vercel `anchecasa-pulito`. Deployment `dpl_DhNuqm4z51ziixJq3EX2CWvyLZXY`, stato Ready, alias https://anchecasa.it. https://anchecasa.it/assets/logo/footer-curva.png risponde 200, immagine png, 9458 byte.
- Con questo invio è andata online anche la correzione già presente nella cartella del Magazine (condivisione WhatsApp, `magazine.js?v=37`): su https://anchecasa.it/magazine il file è `magazine.js?v=37`. Il report PDF rifatto alle ~08:15 (`magazine.js?v=38`) non c'era ancora al momento dell'invio e online non c'è.
- Area privata: partiti dai file già online (deployment `dpl_7hUi9789so9M5JSiTNN2yMiYkAP1`). Aggiunti solo `dashboard/js/mail-modelli-nuove.js` e, in `dashboard/index.html`, `<script src="js/mail-modelli-nuove.js"></script>` subito dopo `js/mail-modelli.js`. Pubblicato sul progetto `area-privata-produzione`. Deployment `dpl_7rRMon1Sz6og8CBF9Vaha5djX7e6`, stato Ready, alias https://areaprivata.anchecasa.it. Login, icona e il resto della dashboard restano quelli già online.
- Prova: la pagina https://areaprivata.anchecasa.it/dashboard/#/admin/admin-mail chiede l'accesso. Con gli script ora online, gli stessi dati di prova della pagina (invitato da Paola Neri), Privato, Azienda e Agente con «Riceve il link per iscriversi» mostrano le mail nuove: «La tua casa, con le persone giuste.», «Nuovi clienti nella sua zona.», «Costruisci la tua rete con AncheCasa.», con la curva in fondo. Le mail «Si iscrive dal sito» restano quelle di prima.

### 10.10.2026 ~08:15 · Claude — Magazine: report PDF Check Bollette rifatto, piede con la stessa curva delle mail (NON ancora pubblicato)
- `sito/js/magazine.js`: eliminato il vecchio report (`caricaLogo` + vecchio `creaPdf` con logo centrato e onde). Al suo posto il report nuovo nello stile delle mail d'invito: testata con logo a sinistra e anchecasa.it a destra, filo arancio, etichetta «REPORT CHECK BOLLETTE · LUCE/GAS», titolo «La tua bolletta della luce, letta.», risultato, lancetta e prezzi, consumi, dati inseriti, riquadro blu «Cosa fare adesso» con i numeri arancio come «Come funziona» della mail.
- Piede: la STESSA curva di `sito/assets/logo/footer-curva.png` usata dalle mail (stessa formula: fascia arancio chiaro, arancio, blu, 1200×80 px → 210×14 mm), poi blu con logo bianco (`assets/logo/anchecasa-payoff-bianco.png`), «AncheCasa · Costruiamo fiducia · anchecasa.it», info@anchecasa.it, © e numero della rivista. Nessun dato societario.
- `sito/magazine.html`: magazine.js?v=38.
- Provato con jsPDF 2.5.1 vero: report luce (228,40 € / 420 kWh) e gas (365 € / 210 Smc) su una pagina A4, nessun errore.

### 10.10.2026 ~08:00 · Claude — «Mail del marchio» dell'area privata: al posto delle mail d'invito vecchie, le tre mail nuove (NON ancora pubblicato)
- Le tre mail nuove sono quelle già pronte in `mail/invito/` (`ufficiali/invito-agente.html`, `invito-azienda.html`, `invito-privato.html`, generate da `mail-invito.js`). NON sono state modificate: annullata una mia modifica delle ~07:55 (file rimessi identici).
- La pagina https://areaprivata.anchecasa.it/dashboard/#/admin/admin-mail (e l'anteprima di «Genera link») le disegna con `dashboard/js/mail-modelli.js`, che esiste solo nella versione online (Vercel `area-privata-produzione`).
- Nuovo `mail/area-privata-online/dashboard/js/mail-modelli-nuove.js`: copia identica di `mail/invito/mail-invito.js` + collegamento: per Privato, Azienda, Agente «Riceve il link» la pagina mostra la mail nuova (oggetto, anteprima, HTML). Le mail «Si iscrive dal sito» restano. Va caricato subito DOPO `js/mail-modelli.js` in `dashboard/index.html` online.
- Nuova immagine `sito/assets/logo/footer-curva.png`: la curva arancio del piede che `mail-invito.js` carica da https://anchecasa.it/assets/logo/footer-curva.png e che online non esisteva.
### 10.10.2026 07:49 · Cursor — Area privata: favicon uguale a anchecasa.it
- https://areaprivata.anchecasa.it usava ancora l’icona vecchia (tetto a triangolo e pallino arancio). Ora è la stessa di anchecasa.it: fondo blu, tetto bianco, quadrato arancio.
- Pubblicata solo l’icona sul progetto Vercel `area-privata-produzione`, deployment `dpl_7hUi9789so9M5JSiTNN2yMiYkAP1`, alias https://areaprivata.anchecasa.it. Login, dashboard e il resto dell’area privata restano quelli già online.
- File dell’icona: `/favicon.svg`, `/favicon.ico`, `/favicon-32x32.png`, `/apple-touch-icon.png`. Il file `/favicon.svg` è identico a quello di anchecasa.it (stesso codice). La dashboard continua a caricare profilo, aste e le altre sezioni.
- Nella cartella `area-privata` le pagine puntano alla stessa icona: `index.html`, `dashboard/index.html`, `iscriviti.html`, `benvenuto.html`, `candidatura-agente.html`, `nuova-password.html`, più i file `favicon.svg`, `favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png` e le altre misure.

### 09.10.2026 ~19:40 · Claude — Magazine: il link condiviso su WhatsApp ora si apre (NON ancora pubblicato)
- Causa: dal telefono il pulsante Condividi passava a WhatsApp testo e link separati (navigator.share text+url): WhatsApp li incollava senza spazio ("…gratis.https://…") o perdeva il link, e il messaggio arrivava con un link che non si apre.
- `sito/js/magazine.js` (v=37): navigator.share manda solo `text` = frase + riga vuota + link; anche il pulsante WhatsApp (wa.me) mette il link su una riga sua (%0A%0A); URL_RIVISTA = https://anchecasa.it/magazine (senza .html, che fa un reindirizzamento).
- `sito/magazine.html`: og:url e canonical = https://anchecasa.it/magazine (prima .html → redirect, l'anteprima di WhatsApp a volte non esce); aggiunti og:image:width/height/type; magazine.js?v=37.
- Provato: sul telefono simulato il testo condiviso è "Ti consiglio… gratis.\n\nhttps://anchecasa.it/magazine?da=condiviso". Sito live controllato: /magazine e /magazine?da=whatsapp rispondono 200, copertina 150 KB.

### 2026-10-09 19:07 · Cursor
- Le voci Claude ~19:00, ~19:05 e ~19:10 erano già nei file: non riscritte.
- Commit `be4ad5f` sul ramo main: «SuperMastro: solo video, da PC solo Come funziona, dopo il video sempre la scheda con guida o artigiano». Push su GitHub. File: `sito/supermastro.html`, `sito/css/supermastro.css`.
- Il push da solo non avvia Vercel. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito`. Deployment `dpl_GxzvUNPAHpQcFRwdrfrsxXjD7EM5`, stato Ready, alias https://anchecasa.it. Area privata non ripubblicata.
- Prova da PC (1280 px): su `/supermastro` si vede «Come funziona SuperMastro», largo 720 px, con i tre passi «Apri SuperMastro dal telefono», «Inquadra il problema per 5 secondi», «Ricevi la soluzione», e il link anchecasa.it/supermastro. Il video, «Registra 5 secondi», «Carica un video» e «Il guasto, da qui.» sono nascosti. CSS `supermastro.css?v=6`.
- Prova da telefono (390 px): il riquadro del computer è nascosto e c’è la registrazione. «Registra 5 secondi» (fotocamera simulata, senza chiave) apre «Video pronto. Tocca quello che si vede.» con 26 problemi. «Scarico intasato o lento» apre «Dal tuo video»: «Puoi provarci tu», Tempo 15-45 minuti, Difficoltà facile, 6 attrezzi e 6 passi, pulsante «Cerca un idraulico vicino a te». La cartina era chiusa e si è aperta con quel pulsante: 4 idraulici a Teano.
- File annotato: `CLAUDE.md`.

### 2026-10-09 ~19:10 · Claude — SuperMastro da PC: solo "Come funziona" (NON ancora pubblicato)
- `sito/supermastro.html`: sul PC (mouse e schermo ≥ 900 px) al posto del video c'è il riquadro "Come funziona SuperMastro" (`.sm-come`).
  - Tre passi con icona: "Apri SuperMastro dal telefono", "Inquadra il problema per 5 secondi", "Ricevi la soluzione". Sotto: anchecasa.it/supermastro e "Copia il link".
- Nascosti sul PC (classe `.sm-solo-tel`): titolo "Il guasto, da qui.", registrazione video, caricamento, riquadri del problema e dell'elenco vecchio. Nessuna foto né caricamento dal PC.
- `css/supermastro.css` v=6 (resta in CRLF).

### 2026-10-09 19:03 · Cursor
- Le voci Claude ~19:00 e ~19:05 erano già nei file: non riscritte. `node --check` su `sito/js/ac.js` e `sito/js/trova-artigiano.js`: ok.
- Commit `28ada77` sul ramo main: «SuperMastro: solo video, dopo il video sempre la scheda con guida o artigiano». Push su GitHub. La chiave OpenAI non è stata data, quindi `OPENAI_API_KEY` non è stata aggiunta.
- Il push da solo non avvia Vercel. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito`. Deployment `dpl_5HoTA8tpa5XLrV8vpLtxxMk5cWcG`, stato Ready, alias https://anchecasa.it. Area privata non ripubblicata. In questo invio non c’è il riquadro PC «Come funziona» delle 19:10, arrivato dopo.
- Prova da telefono (390 px) su https://anchecasa.it/supermastro: `ac.js?v=7`, `trova-artigiano.js?v=6`, «Carica un video» accetta solo `video/*`. Il riquadro del computer è nascosto. «Registra 5 secondi» (fotocamera simulata, senza chiave): compare «Video pronto. Tocca quello che si vede.» con 26 problemi.
- «Scarico intasato o lento» apre la scheda «Dal tuo video»: «Puoi provarci tu», Tempo 15-45 minuti, Difficoltà facile, «Cosa ti serve» (6 attrezzi, il primo è la ventosa), «Come fare, passo per passo» (6 passi). La cartina era chiusa. «Cerca un idraulico vicino a te» la apre su Teano: 4 idraulici.
- «Carica un video» con una foto: «SuperMastro lavora solo con un video: registra 5 secondi sul guasto e riprova.» L’analisi non parte.
- File annotato: `CLAUDE.md`.

### 2026-10-09 ~19:05 · Claude — SuperMastro: solo video, niente foto (NON ancora pubblicato)
- `sito/supermastro.html`: "Carica un video" accetta solo video (`accept="video/*"`). ac.js v=7.
- `sito/js/ac.js`: se arriva un'immagine, non parte l'analisi e compare "SuperMastro lavora solo con un video: registra 5 secondi sul guasto e riprova."

### 2026-10-09 ~19:00 · Claude — SuperMastro: dopo il video si arriva sempre alla soluzione (NON ancora pubblicato)
- Problema visto da Cursor alle 18:09: su Vercel manca `OPENAI_API_KEY`, quindi `/api/supermastro` risponde 503 e il video non viene analizzato. Va aggiunta la chiave (vedi sotto).
- Nel frattempo, quando l'AI non risponde, `js/trova-artigiano.js` rifà l'elenco "Tocca quello che si vede" (`#sm-scelte`) con 26 problemi del dizionario, dentro e fuori casa (rubinetto, scarico, WC, perdite, caldaia, termosifoni, clima, salvavita, presa, luce, serratura, porte, finestre, tapparella, vetro, muffa, crepe, piastrelle, grondaie, tetto, cancello, recinzione, siepe, prato, insetti).
  - Ogni voce apre la stessa scheda "La tua richiesta · Dal tuo video" (`ACTrova.voce(id)`): guida con tempo, difficoltà, attrezzi e passi se si fa da soli, altrimenti "Cerca un <mestiere> vicino a te". La cartina si apre solo con quel pulsante.
- Con la chiave, il video va da solo nella scheda (`ACTrova.risposta`), come prima.
- Provato da telefono simulato, con e senza chiave. Versione trova-artigiano.js v=6. Il file resta con i fine riga Windows (CRLF), come l'ha lasciato git.
- PER ATTIVARE L'ANALISI DEL VIDEO: su Vercel, progetto anchecasa-pulito, Settings → Environment Variables → `OPENAI_API_KEY` (Production) = la chiave OpenAI (la stessa di supermastro.com, se usa OpenAI), poi ripubblicare. Facoltativo: `OPENAI_MODEL` (predefinito gpt-4o-mini).

### 2026-10-09 18:09 · Cursor
- `node --check` su `sito/js/*.js` e `sito/api/*.js`: tutti senza errori di sintassi.
- Commit `67804e4` sul ramo main: «SuperMastro: guida fai da te con attrezzi, professionista solo al clic, Comuni d'Italia, video solo da telefono, solo problemi di casa, pollici per imparare». Nel commit è tornato in `sito/supermastro.html` il riquadro dei pollici (tolto alle 18:08) perché lo script e lo stile c’erano già.
- Il push da solo non avvia Vercel. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito`. Deployment `dpl_3qhEnerWrjfPoZwc39Gs6e8JPS99`, stato Ready, alias https://anchecasa.it. Area privata non ripubblicata. La migrazione `supabase/migrations/20261009183000_supermastro_voti.sql` è su GitHub e resta da applicare su Supabase.
- Prova da telefono (390 px): «rubinetto» → Rubinetto che gocciola → «Tea» → Teano. Scheda «Puoi provarci tu», Tempo 20-40 minuti, Difficoltà facile, «Cosa ti serve» (6 attrezzi), «Come fare, passo per passo» (7 passi). La cartina era chiusa e si è aperta solo con «Cerca un idraulico vicino a te»: 4 idraulici.
- «di che marca sono queste scarpe» → Chiedi a SuperMastro: la pagina ha scritto «Non ho capito bene» e il pulsante dell’artigiano è rimasto. `POST /api/supermastro` risponde 503 `motore_non_configurato`: sul progetto Vercel non c’è `OPENAI_API_KEY`, quindi la regola «solo problemi di casa» non parte.
- Sotto la risposta del rubinetto, pollice in giù, correzione «Era il rubinetto del bidet, non del lavandino», Invia: compare «Grazie! Lo controlliamo e SuperMastro impara». `POST /api/supermastro-voto` risponde 502: la tabella dei voti non c’è ancora su Supabase.
- Da PC (1280 px): «SuperMastro con il video funziona dal telefono» è visibile e il riquadro di registrazione è nascosto.
- File annotato: `CLAUDE.md`.

### 2026-10-09 18:01 · Cursor
- Commit `af752cb` sul ramo main: «SuperMastro: guida fai da te con attrezzi, professionista solo al clic, Comuni d'Italia, video solo da telefono». Poi `68f5d3e` (Photon con `lang=default`, perché `lang=it` rispondeva 400) e `46d40df` (tolto il riquadro dei voti ancora senza script).
- Il push da solo non avvia Vercel. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito`. Deployment `dpl_GTyFQB12rGqukdEwwXoxGrqZvf21`, stato Ready, alias https://anchecasa.it. Area privata non ripubblicata. Le voci delle 18:20 e delle 18:35 restano solo in locale.
- Prova da telefono (390 px): «rubinetto» → Rubinetto che gocciola → «Tea» → Teano (Caserta, CAP 81057). Si apre `/supermastro?p=rubinetto-gocciola&c=Teano&lat=41.25108&lng=14.06715#richiesta`. Scheda «Puoi provarci tu», tempo 20-40 minuti, difficoltà facile, 6 attrezzi e 7 passi. La cartina resta chiusa finché non si preme «Cerca un idraulico vicino a te»: 4 idraulici, il più vicino a 36 km (OpenStreetMap, raggio allargato).
- Da PC (1280 px, mouse): al posto del video c’è «SuperMastro con il video funziona dal telefono», con anchecasa.it/supermastro e «Copia il link». Il riquadro di registrazione è nascosto.
- File annotato: `CLAUDE.md`.

### 2026-10-09 ~18:35 · Claude — SuperMastro impara dai pollici (NON ancora pubblicato)
- Sotto ogni risposta di SuperMastro: "SuperMastro ha capito il problema?" con 👍 Sì / 👎 No. Con No compare "Cos'era invece? Così SuperMastro impara." (`supermastro.html`, `js/trova-artigiano.js`, `css/supermastro.css` v=5, trova-artigiano v=5).
- NUOVO `sito/api/supermastro-voto.js`: salva voto, fonte (testo/video), richiesta, risposta data, mestiere, correzione e città in `marketplace.supermastro_voti` (solo INSERT, approvato sempre false).
- NUOVO `supabase/migrations/20261009183000_supermastro_voti.sql` — DA APPLICARE DAL TECNICO (dopo 20261009170000, usa `magazine_e_admin()`).
  - Tabella con RLS: scrivere tutti, leggere e approvare solo admin.
  - Funzione `supermastro_esempi()`: le ultime 20 correzioni APPROVATE. Provato su Postgres 16: un visitatore non può approvarsi da solo né leggere i voti.
- `api/supermastro.js`: prima di chiamare l'AI legge `supermastro_esempi()` (max 1,5 s; se Supabase non risponde, va avanti senza) e aggiunge le correzioni approvate al prompt come esempi: così SuperMastro impara.
- Come si approva oggi: Supabase → tabella `supermastro_voti` → `approvato = true` sulle correzioni giuste. Si può aggiungere una pagina admin.
- Tenuta la correzione di Cursor delle 18:05 (`comuni.js?v=2`).

### 2026-10-09 18:08 · Cursor
- Tolto da `sito/supermastro.html` il riquadro «SuperMastro ha capito il problema?» finito nel commit precedente senza lo script e senza l’API. Resta nel commit `68f5d3e` se serve riprenderlo. Non pubblicato.
- File: `sito/supermastro.html`, `CLAUDE.md`.

### 2026-10-09 18:05 · Cursor
- Photon non accetta più `lang=it` (risponde 400) e la tendina dei Comuni restava vuota. In `sito/js/comuni.js` la lingua della richiesta è `default`: i nomi restano quelli italiani di OpenStreetMap. «Tea» propone Teano (Caserta) e Teana (Potenza).
- Versione `comuni.js?v=2` in `sito/index.html` e `sito/supermastro.html`.
- File: `sito/js/comuni.js`, `sito/index.html`, `sito/supermastro.html`, `CLAUDE.md`.

### 2026-10-09 ~18:20 · Claude — SuperMastro si occupa solo dei problemi di casa (NON ancora pubblicato)
- `api/supermastro.js`: nel prompt c'è la regola di supermastro.com "solo problemi della casa e della proprietà, dentro e fuori" (impianti, muri, infissi… tetto, cancello, recinzione, prato, giardino, piscina…).
  - Se il video o il testo mostrano altro (oggetti come scarpe, persone, animali, auto, domande personali o di coppia…) il JSON ha `fuori_tema: true`, mestiere "altro", nessuna guida e nessun pericolo.
  - In quel caso "problema" dice cosa si vede ("Un paio di scarpe da ginnastica") e "descrizione" è una risposta gentile in 2 frasi che riconosce la cosa e invita a inquadrare il guasto. `normalizza()` forza questi valori anche se l'AI sbaglia il mestiere.
- `js/trova-artigiano.js` + `css/supermastro.css`: con `fuori_tema` la scheda dice "Questo non è un problema di casa", nasconde guida e "Cerca un professionista" e invita: "Hai un problema in casa, in giardino, al prato o al recinto? Fammelo vedere." (classe `.is-fuori`).
- Versioni supermastro.css e trova-artigiano.js v=4.

### 2026-10-09 ~18:10 · Claude — SuperMastro: guida fai da te con attrezzi, ricerca solo al clic, Comuni d'Italia, video solo dal telefono (NON ancora pubblicato)
- Unito SOPRA il lavoro di Cursor delle 17:33-17:36 (rete certificata `/api/rete-artigiani`, regole supermastro.com nel prompt): unione a tre vie, niente di Cursor è stato tolto.
- `js/problemi.js`: guide fai da te per tutte le 25 voci che si possono fare da soli (campo `g`: `a` attrezzi e materiali, `p` passi dettagliati, `tm` tempo, `d` difficoltà).
- `api/supermastro.js`:
  - l'AI ora restituisce anche `attrezzi` (max 10), `tempo` e `difficolta`, con passi da 4 a 8 dettagliati (il primo è la sicurezza) e descrizione fino a 400 caratteri; max_tokens 1200;
  - restano le regole supermastro.com di Cursor.
- `js/trova-artigiano.js` + `supermastro.html` + `css/supermastro.css`:
  - scheda "La tua richiesta" con chip Tempo e Difficoltà, "Cosa ti serve" (attrezzi), "Come fare, passo per passo", "Quando fermarti";
  - in fondo "Preferisci che lo faccia un professionista?" e "Cerca un <mestiere> vicino a te": la ricerca parte SOLO al clic. Se l'AI non dà passi o attrezzi, si usa la guida del dizionario. Sul gas e sui pericoli niente guida.
- Video: la risposta del video va nella stessa scheda (`ACTrova.risposta`, chiamata da `js/ac.js`), senza ricerca automatica.
  - SuperMastro con il video funziona SOLO dal telefono (`.sm-solo-tel`). Sul PC (mouse e schermo ≥ 900 px) c'è l'avviso "SuperMastro con il video funziona dal telefono" con anchecasa.it/supermastro e "Copia il link".
- NUOVO `js/comuni.js`: campi `data-comuni` (home "Dove?", SuperMastro "Comune o CAP").
  - Suggerisce i Comuni d'Italia mentre scrivi (Photon/OpenStreetMap, città, paesi, frazioni), con provincia, regione e CAP, e tiene le coordinate.
  - Dalla home passano a SuperMastro come `&lat=&lng=`. Se il servizio non risponde, la città si cerca come prima con Nominatim.
- Ricerca artigiani OpenStreetMap: raggio 12 → 30 → 50 km per i paesi piccoli (i certificati della rete restano in cima).
- Testo in cima a SuperMastro aggiornato. Versioni: problemi, trova-artigiano, supermastro.css, cerca-casa.css e cerca-casa.js v=3; ac.js v=6; comuni.js v=1.

### 2026-10-09 17:36 · Cursor
- Commit `3ec8baa51e6ed3c7ae66fbec2d273eebaf6e7ef7` sul ramo main di https://github.com/anchecasa/anchecasapulito. Messaggio: «Home: ricerca intelligente, SuperMastro con risposta e cartina artigiani; Magazine e statistiche».
- Il push da solo non avvia Vercel. Pubblicata la cartella `sito` sul progetto `anchecasa-pulito` in produzione. Deployment `dpl_E7ESrwYmgsqBuKpBcMQo9K15Gj57`, stato Ready, indirizzo https://anchecasa.it. Area privata non ripubblicata.
- Con questo invio è andato online anche il Check Bollette a due schermate e il report PDF con le onde (voce Claude delle 17:45), insieme alla ricerca della home e alla rete certificata.
- Prova da telefono (390 px) su https://anchecasa.it: scritto «idr», scelto Idraulico, città Roma, Cerca. Si apre `/supermastro?p=m-idraulico&c=Roma#richiesta`. «Cerca artigiano» trova 10 idraulici: i primi due sono «Idraulico certificato · Roma», segno blu, «Certificato DM 37/08»; dal terzo in poi OpenStreetMap, segno arancio.
- `POST /api/rete-artigiani` con mestiere idraulico a Roma risponde 200 e mette i certificati in ordine di distanza.
- File annotato: `CLAUDE.md`.

### 2026-10-09 17:33 · Cursor — Logica di supermastro.com innestata nel sito
- Lette le regole dal sito supermastro.com (Palumbo Investment): diagnosi video nella funzione `diagnose-video` (categorie idraulico, elettricista, fabbro, muratore, falegname, giardiniere; confidenza sotto 70 = video non chiaro; `faidate_consigliato` solo se è sicuro; artigiano certificato DM 37/08) e tabella pubblica `artigiani` (approvati, online, con certificazione, il più vicino entro 40 km).
- `sito/api/rete-artigiani.js` (nuovo): restituisce `{ nome, lat, lng, tel, indirizzo, sito, rete: true }`. Nella tabella non ci sono telefono né sito, quindi quei campi restano vuoti. Il nome, se manca la ragione sociale, è «Idraulico certificato · Roma».
- `sito/js/trova-artigiano.js`: `cercaArtigiani()`, commento RETE ANCHECASA, carica prima i certificati e li mette in cima, segno blu sulla cartina. Poi OpenStreetMap.
- `sito/api/supermastro.js`: prompt aggiornato con quelle regole. La risposta JSON resta problema, descrizione, mestiere, urgenza, pericolo, fai_da_te, passi, avvertenze.
- `sito/js/problemi.js`: `ACProblemi.cerca()` alza le voci della categoria SuperMastro («idr» resta sull’idraulico).
- Grafica invariata, a parte il segno blu dei certificati. Versioni: problemi e trova-artigiano `?v=2`, supermastro.css `?v=2`.
- File: `sito/api/rete-artigiani.js`, `sito/api/supermastro.js`, `sito/js/trova-artigiano.js`, `sito/js/problemi.js`, `sito/css/supermastro.css`, `sito/supermastro.html`, `sito/index.html`, `CLAUDE.md`.

### 2026-10-09 ~17:45 · Claude — Check Bollette semplice + report PDF elegante con onde del marchio (NON ancora pubblicato)
- Check Bollette (pagina 8 del magazine), su richiesta: "troppe cose, non si capisce". Ora ci sono due schermate (classe `.mg-cb2`).
  - Prima schermata: Luce/Gas e tre domande numerate ("Quanto hai pagato?", "Quanto hai consumato?", "Di quanti mesi è?"), un pulsante "Analizza la mia bolletta" e una riga "Scoprirai…". Se manca un dato lo dice in rosso e scuote il campo.
  - Seconda schermata (solo la risposta): "Paghi il 29% in più del giusto", "Puoi risparmiare circa 312 € all'anno", lancetta con "Paghi / Prezzo giusto", una riga sui consumi con "Quante persone siete? 1-5+", poi Scarica il PDF, Confronta offerte e "‹ Cambia i dati".
  - Tolti striscia dei passi, esempio sbiadito, badge, barre e riquadri. Le persone in casa ora si scelgono nella risposta (campo nascosto `mg-b-persone`).
- Report PDF (`creaPdf`) rifatto come carta AncheCasa elegante: foglio bianco, logo centrato, filo arancio, titolo "Report Check Bollette", sezioni con titoletto arancio e filo sottile, nessun riquadro scuro. In fondo due onde curve (arancio sotto, blu sopra) con anchecasa.it, info@, © e "Pagina 1 di 1".
  - Provato con un simulatore di jsPDF su canvas: jsPDF da cdnjs qui non si scarica.
- Nota: non ho trovato nel PC un contratto agente con i colori curvati (quelli in Projects/anchecasa-site sono in bianco e nero); le onde sono ricreate dalla descrizione.
- Versioni js v=36, css v=37. Copia della versione precedente: /home/claude/magazine.pre-semplice.js (solo sessione).

### 2026-10-09 ~17:30 · Claude — Home: ricerca intelligente dei problemi → SuperMastro → artigiano su cartina (NON ancora pubblicato)
- `sito/index.html`: tolte le categorie "Più cercati" sotto la ricerca.
  - Il form ha `data-nuova`; carica i NUOVI `js/problemi.js`, `js/cerca-casa.js` e `css/cerca-casa.css`.
  - La sezione in alto non taglia più la tendina.
- NUOVO `js/problemi.js` (`window.ACProblemi`): dizionario di circa 80 problemi in casa e fuori casa più 33 mestieri, con sinonimi e tag OpenStreetMap per mestiere.
  - `cerca(testo)` capisce l'inizio delle parole ("idr"), più parole ("taglio erba"), piccoli errori ("idraulco") e frasi ("il cane ha rotto la zanzariera").
- NUOVO `js/cerca-casa.js`: mentre scrivi suggerisce i problemi con il mestiere evidenziato, ultima voce "Chiedi a SuperMastro: «testo»"; frecce e Invio funzionano.
  - Scelta → il cursore va su "Dove?"; Cerca → `supermastro.html?p=<id>&c=<città>#richiesta` (o `?q=<testo libero>`). La città viene ricordata.
- `js/ac.js`: la vecchia ricerca parte solo se il form NON ha `data-nuova`. Su SuperMastro, `cerca(p)` usa la cartina se c'è `window.ACTrova`.
- `sito/supermastro.html`:
  - nuove sezioni `#richiesta` ("La tua richiesta": consiglio subito dal dizionario, poi la risposta di SuperMastro con passi e "Quando fermarti") e `#artigiani` (cartina Leaflet a metà schermo, elenco sotto con Chiama, segni numerati che aprono la scheda: nome, distanza, indirizzo, Chiama, Indicazioni, Sito);
  - carica Leaflet 1.9.4 da cdnjs, `js/problemi.js`, NUOVO `js/trova-artigiano.js`, NUOVO `css/supermastro.css`;
  - il video di 5 secondi resta sotto (#usa).
- `api/supermastro.js`: ora risponde anche senza video, con `{ testo, citta }` → stesso JSON. Mestieri ampliati.
- Dati artigiani per ora da OpenStreetMap (Overpass per tag craft=…, poi Nominatim). Cartina CARTO Voyager.
  - Provato con dati simulati: questa sessione non raggiunge internet.
- DA FARE (Cursor): innestare la logica di supermastro.com. Punti segnati nel codice:
  1. `js/trova-artigiano.js` → `cercaArtigiani()`, commento "RETE ANCHECASA": prima di OpenStreetMap, gli artigiani certificati della rete (campi `{ nome, lat, lng, tel, indirizzo, sito, rete:true }`).
  2. `api/supermastro.js` → prompt e regole di analisi del video/testo di supermastro.com.
  3. `js/problemi.js` → `ACProblemi.cerca()` se supermastro.com ha un suo riconoscimento dei problemi.
- Copia di sicurezza: `_copie-home-supermastro-1730/`.

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
