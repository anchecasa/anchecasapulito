# Appunti per Francesco — gare private e subappalti

11 ottobre 2026, ore 11:22 (ora di Roma). Scritto da Cursor, per Francesco.

Francesco li vede anche entrando nell'area privata dal computer: la prima pagina è Appunti. Gli altri admin trovano la voce nel menu, accanto a Task.

## Cosa stiamo facendo

Stiamo aggiungendo le gare private nel cruscotto Next, non nell'area privata e non nel sito.

Cartella del programma: `C:\Users\palum\Desktop\BIM-SICUR\ecosistema-anchecasa`

Ramo git: `feature/admin-eprocurement-button`

Questo cruscotto non è online. Non ha un repository remoto e non è collegato a Vercel. L'indirizzo `https://areaprivata.anchecasa.it` è un altro programma (la dashboard in `area-privata`). La voce «Bandi» di quella dashboard è AncheBandi, un elenco pubblico. Non è questo modulo.

## A cosa serve

Un'impresa mette a gara un pacchetto di lavoro. Invita i fornitori dall'Albo, oppure lascia la gara aperta. I fornitori mandano l'offerta a busta chiusa. L'impresa vede gli importi solo dopo la chiusura e poi aggiudica.

Pagine del cruscotto:

- `/admin/e-procurement` — lista e nuovo pacchetto (`?nuovo=1`)
- `/admin/e-procurement/[id]` — documenti, inviti, buste, aggiudicazione
- `/fornitore/gare` — il fornitore vede le gare e risponde

La voce di menu «Gestione e-Procurement & Subappalti» la vede solo il server, e solo se la persona è in `marketplace.admins` oppure ha il ruolo `general_contractor_buyer` in `marketplace.app_org_membri`. Gli altri, aprendo la pagina, tornano al cruscotto.

L'Albo non è una tabella nuova. Un fornitore è una riga di `marketplace.app_org` con `tipo = fornitore` e `stato = attiva`.

## Cosa è già su Supabase

Progetto ANCHECASA, ref `edsvmnxojsmknjuhobqa`, schema `marketplace`. Eseguito da Cursor l'11.10.2026 alle 11:22, con la CLI già collegata all'account. Non è stato un `db push` di tutte le migrazioni: solo questi tre file, in quest'ordine.

1. `app-anchecasa/sql/app-01-supermastro.sql`
2. `app-anchecasa/sql/app-02-completa.sql`
3. `supabase/migrations/20261011103000_e_procurement.sql` (stesso file nel cruscotto e in ANCHECASA-PULITO)

Controllo fatto subito dopo, sul database vero:

- Ci sono `app_org`, `app_ep_gare`, `app_ep_documenti`, `app_ep_inviti`, `app_ep_offerte`, `app_ep_eventi`.
- Il bucket privato `e-procurement` c'è (file fino a 30 MB).
- Il ruolo `general_contractor_buyer` è ammesso su `app_org_membri`, insieme a titolare, responsabile, operatore e consulente.
- `pg_cron` è attivo e il lavoro `anchecasa-ep-chiudi-scadute` gira ogni 5 minuti. Le pagine chiamano comunque `app_ep_chiudi_scadute` all'apertura.
- Admin di piattaforma già presenti: 2.
- Organizzazioni: 0. Fornitori in Albo: 0. Membri con ruolo acquirente: 0.

Lo schema `marketplace` resta quello già esposto alla Data API. Non va tolto.

## Cosa manca, e lo fa Francesco

1. **Il cruscotto non è pubblicato.** Non fare il deploy di produzione finché Nando non lo dice. Per un'anteprima servono un repository git e un progetto Vercel, con queste variabili e senza scriverne i valori nel git:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   Le prime due sono già nel file locale `.env.local` del cruscotto (ignorato da git). La terza non c'è.

2. **Chiave service role.** Senza di lei i documenti restano «in verifica»: AncheBIM calcola il risultato ma non lo scrive sul database. La chiave si prende dal pannello Supabase, Settings, API. Va solo sul server. Mai con il prefisso `NEXT_PUBLIC_`. Mai in un commit.

3. **Prima organizzazione.** Con zero righe in `app_org` la pagina delle gare non ha un'impresa a cui agganciare il pacchetto. Serve almeno un'`app_org` attiva. I due admin già in `marketplace.admins` vedono il menu. Un collega che non è admin va inserito in `app_org_membri` con ruolo `general_contractor_buyer`.

4. **Albo vuoto.** Per invitare qualcuno servono organizzazioni `tipo = fornitore` e `stato = attiva`. Il portale `/fornitore/gare` si apre solo ai membri di un fornitore attivo. A firmare l'offerta sono titolare e responsabile.

5. **SQL dall'app-03 all'app-13 non eseguiti.** Non servono a questo modulo. Restano da lanciare, nello stesso ordine dei file, solo se si vuole il resto dell'app AncheCasa (rete, fatture, sopralluoghi, sicurezza, magazzino). Sono in `app-anchecasa/sql/`.

6. **Codice non ancora in un commit.** Il commit `e675afd` ha il pulsante del menu. La centrale, il dettaglio e il portale fornitori sono sul disco, nel working tree, e non sono stati committati. Non c'è push: il cruscotto non ha remote.

7. **AncheBIM resta il Python locale** (`services/anchebim`), chiamato dal cruscotto. `ANCHEBIM_API_URL` e `ANCHEBIM_API_KEY` sono nel `.env.example` e oggi non vengono usate.

8. **Buste chiuse.** Gli importi non vanno nel registro eventi. L'acquirente li legge solo a gara chiusa o aggiudicata. Non allentare le policy su `app_ep_offerte`.

9. **Non toccare** la dashboard `area-privata`, il sito `anchecasa.it`, il Magazine e AncheSicura per questo lavoro.
