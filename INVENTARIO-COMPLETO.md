# Inventario completo · AncheCasa

Letto l'11.10.2026 nella cartella ufficiale `C:\Users\palum\Desktop\ANCHECASA-PULITO`.
Niente chiavi, password o token. Le cartelle `_copie` e `_archivio` non sono software nuovi: sono copie o il posto dove sono finite le cartelle che non si usano più.

## Indice

1. Sito AncheCasa — anchecasa.it, cartelle `sito` e `sito-nuovo`
2. Area privata — areaprivata.anchecasa.it, cartella `area-privata`
3. App AncheCasa — l'app su entra.anchecasa.it, cartella `app-anchecasa`
4. AncheCasa Magazine — magazine.anchecasa.it, cartella `magazine-sito`
5. AncheSicura — sicura.anchecasa.it, cartelle `sicura-nuovo` e `sicura-DA-CARICARE-SU-CLOUDFLARE`
6. SuperMastro — strumento sul sito, pagina `/supermastro`
7. SuperMastro SOS — copia non pubblicata, cartella `supermastro-sos`
8. Gare private — cruscotto Next non pubblicato, cartella `business`
9. AncheBIM — controllo dei disegni, dentro `business` e come tasto dell'area privata
10. AncheBandi — lettura dei bandi, tasto nell'area privata, senza sito proprio
11. Terranova — tasto nell'area privata, schema `terranova`
12. Mail del marchio — modelli delle mail, cartella `mail`
13. Iscrizione unica — modulo condiviso, cartella `iscrizione-unica`
14. Superapp — bozza in archivio, cartelle `_archivio\superapp` e `_archivio\superapp-viste`

## Schede

### 1. Sito AncheCasa

Il sito pubblico per chi cerca un lavoro in casa, un'impresa o un artigiano. Ci stanno la ricerca, SuperMastro, la rivista sfogliabile su `/magazine`, i prezzi, le pagine dei mestieri visibili e l'iscrizione.

- Cartella online: `sito`. Sorgente da cui si genera: `sito-nuovo`.
- Indirizzo: https://anchecasa.it. L'11.10.2026 alle 18:40 risponde 200.
- Pubblicazione: Vercel, progetto `anchecasa-pulito`.
- Database: Supabase, progetto ANCHECASA, schema `marketplace` (iscrizioni e statistiche del magazine).
- Stato: ufficiale e online. `app.anchecasa.it` non si usa più e non si ricollega.

### 2. Area privata

Accesso e dashboard per l'admin e per la rete (agenti e ruoli sopra). I privati, le aziende e i fornitori, dopo l'accesso, vanno sull'app. Qui restano le correzioni finché la funzione non è passata nell'app.

- Cartella: `area-privata`.
- Indirizzo: https://areaprivata.anchecasa.it. L'11.10.2026 alle 18:40 risponde 200.
- Pubblicazione: Vercel, progetto `area-privata-produzione`.
- Database: lo stesso Supabase, schema `marketplace`.
- Dentro, come tasti e non come siti: Home, iscritti, contratti, rete, Bandi, Terranova, Gare private, AncheBIM, Appunti per Francesco.
- Stato: ufficiale e online. Si installa dal telefono (manifest e service worker).

### 3. App AncheCasa

L'unica dashboard per privati, aziende e fornitori. Profili, pulsanti, moduli, cantieri, fatture, sicurezza, magazzino, rete.

- Cartella: `app-anchecasa`.
- Indirizzo previsto: https://entra.anchecasa.it. Il nome non è nel DNS: l'11.10.2026 non si risolve. Risponde 200 https://app-anchecasa.pages.dev (ultimo deploy di produzione `3fd7d0ad`, commit `687b432`, precedente al ramo `iscrizione-pulsanti`).
- Pubblicazione: Cloudflare Pages, progetto `app-anchecasa`. Il ramo `iscrizione-pulsanti` non è stato pubblicato.
- Database: Supabase ANCHECASA, schema `marketplace`. I file SQL dell'app vanno da `app-01` in poi. `app-14` dei profili e `app-15` dell'anagrafica non sono stati eseguiti sul database vero.
- Stato: ufficiale. Il codice nuovo sta sul ramo `iscrizione-pulsanti`, non su main.
- Modello della dashboard, copiato l'11.10.2026 (gli originali restano in Download): `app-anchecasa\docs\modello-dashboard\` con `Main.dc.html`, `Fornitore.dc.html`, `Privato.dc.html`, `Rete.dc.html`, `Admin.dc.html`. Quei cinque file non sono in questo invio su GitHub.

### 4. AncheCasa Magazine

Sito della rivista per i cittadini, senza imprese e senza pubblicità. Check Bollette, articoli, iscrizione agli avvisi.

- Cartella: `magazine-sito`.
- Indirizzo: https://magazine.anchecasa.it. L'11.10.2026 alle 18:40 risponde 200.
- La rivista sfogliabile resta su https://anchecasa.it/magazine, dentro il sito, e non è un secondo software.
- Pubblicazione: Vercel, progetto `magazine-anchecasa`, Root Directory `magazine-sito`.
- Database: stessa iscrizione del sito, funzione `/api/mag`, schema `marketplace`.
- Stato: ufficiale e online.

### 5. AncheSicura

Sito della divisione sicurezza: corsi, documenti, app, settori, rete.

- Sorgente: `sicura-nuovo`. File che vanno online: `sicura-DA-CARICARE-SU-CLOUDFLARE`.
- Indirizzo: https://sicura.anchecasa.it. L'11.10.2026 alle 18:40 risponde 200.
- Pubblicazione: Cloudflare Pages, progetto `sicura`.
- Il sito di prima è in `_archivio\sicura` e non è più quello online.
- Stato: ufficiale e online.

### 6. SuperMastro

Strumento sul sito: dal telefono un video di 5 secondi sul guasto, poi la scheda con la guida o la ricerca dell'artigiano. Dal computer si vede solo «Come funziona».

- Codice: `sito\supermastro.html`, `sito\js\trova-artigiano.js`, `sito\js\ac.js`, `sito\api\supermastro.js`.
- Indirizzo: https://anchecasa.it/supermastro.
- Database: le correzioni dei pollici prevedono `marketplace.supermastro_voti`. La tabella, se manca sul database vero, va applicata con la migrazione già nel repository.
- Stato: è una funzione del sito, già nella cartella che va su anchecasa.it. Non ha un dominio suo.

### 7. SuperMastro SOS

Copia del lavoro del mattino dell'11.10.2026 (web, migrazioni, script). Iscrizione artigiani e rete SOS, separata da quella dell'app finché non si uniscono.

- Cartella: `supermastro-sos`. Il sito è in `supermastro-sos\web` (Next.js, nome pacchetto `web`).
- Repository di origine: supermastro-sos, pull request non unita. Qui è una copia.
- Database: schema `public` (per esempio `workers`, `profiles`), non `marketplace`.
- Stato: non pubblicato da questa cartella. Non è la dashboard ufficiale. L'artigiano, da decisione, dovrà iscriversi una volta sola con il modulo dell'app.

### 8. Gare private

Cruscotto per le gare private tra general contractor e fornitori: gare, documenti, inviti, offerte a busta chiusa.

- Cartella: `business` (Next.js, nome pacchetto `ecosistema-anchecasa`). Non è un sito.
- Pagine: `/admin/e-procurement` e il portale fornitore.
- Database: schema `marketplace`, tabelle `app_ep_*`. Lo SQL è in `supabase\migrations\20261011103000_e_procurement.sql`.
- Lo stesso tasto esiste nell'area privata (`funzioni-interne.js`), con esempi in anteprima.
- Stato: non pubblicato. Va messo nell'app, non su un dominio nuovo.

### 9. AncheBIM

Controllo di un disegno su tre assi, X Y Z, in millimetri.

- Codice: `business\services\anchebim` e le pagine admin del cruscotto. Tasto anche nell'area privata.
- Non ha un indirizzo suo.
- Stato: non pubblicato. È una funzione di AncheCasa, non un sito.

### 10. AncheBandi

Lettura dei bandi pubblici nella dashboard admin.

- Codice: `area-privata\dashboard\js\bandi-admin.js`.
- Indirizzo: https://areaprivata.anchecasa.it/dashboard/#/admin/bandi. Non esiste bandi.anchecasa.it.
- Database: legge `public.anchebandi_feed_items`. Se lo schema non c'è, la pagina lo dice.
- Stato: funzione dell'area privata. In anteprima `?demo=admin` mostra esempi.

### 11. Terranova

Elenco gare letto dallo schema `terranova`.

- Codice: `area-privata\dashboard\js\funzioni-interne.js`, voce di menu admin.
- Non ha un sito suo. Stesso Supabase dell'area privata.
- In anteprima mostra due gare di esempio.
- Stato: tasto dell'area privata, non pubblicato come sito.

### 12. Mail del marchio

Le mail di invito e di iscrizione (privato, azienda, agente, fornitore) e i modelli per Supabase.

- Cartella: `mail`. Immagini sul sito: `sito\assets\mail`.
- Non è un sito. Le mail partono dalle funzioni e dai modelli di Supabase Authentication.
- Stato: ufficiale come modelli. Le funzioni online vanno aggiornate a mano sul pannello, quando Nando lo chiede.

### 13. Iscrizione unica

Un solo modulo per iscriversi: privato, azienda, fornitore. Poi «Cosa vuoi fare?».

- Cartella fonte: `iscrizione-unica`. Copie in `sito\iscrizione-unica`, `area-privata\iscrizione-unica`, `app-anchecasa\js\iscrizione-unica.js`.
- Non ha un indirizzo suo: vive nel sito, nell'area privata e nell'app.
- Database: funzioni di `app-14-iscrizione-profili.sql`, non ancora eseguite sul Supabase vero.
- Stato: codice sul ramo `iscrizione-pulsanti`. Non pubblicato con quel ramo.

### 14. Superapp

Bozza vecchia di un'app unica, con le viste fotografate.

- Cartelle: `_archivio\superapp` e `_archivio\superapp-viste`.
- Nessuno script e nessun sito le pubblicano.
- Stato: archivio. Non è ufficiale. Non si lavora lì.

## Parte 3

Risposte lette dalle cartelle e dai controlli HTTP dell'11.10.2026, ore 18:40 (Europa/Roma).

**Quali software sono online adesso, e con quale indirizzo?**

- Sito AncheCasa: https://anchecasa.it risponde 200. SuperMastro è una sua pagina.
- Area privata: https://areaprivata.anchecasa.it risponde 200. AncheBandi, Terranova, Gare private e AncheBIM, come tasti, stanno qui: i tasti ci sono nel codice; Terranova, Gare private e AncheBIM in anteprima usano esempi se il database non risponde.
- AncheCasa Magazine: https://magazine.anchecasa.it risponde 200.
- AncheSicura: https://sicura.anchecasa.it risponde 200.
- App AncheCasa: https://app-anchecasa.pages.dev risponde 200. https://entra.anchecasa.it non si risolve: manca il CNAME `entra` su Cloudflare.

**Quali non sono pubblicati?**

SuperMastro SOS, il cruscotto Gare private, AncheBIM come motore nel cruscotto `business`, la Superapp. L'iscrizione unica e i prezzi nascosti dell'app stanno sul ramo `iscrizione-pulsanti` e non sono nel deploy delle 17:38 circa.

**Quale cartella è quella ufficiale?**

Una sola: `C:\Users\palum\Desktop\ANCHECASA-PULITO`. Dentro, per ciascun software, la cartella scritta nella scheda. `sito-nuovo` e `sicura-nuovo` restano come sorgenti. `_archivio` non si usa per lavorare.

**Quale database usano?**

Un progetto Supabase, ANCHECASA. Il sito, l'area privata, l'app, il magazine, le gare private e l'iscrizione usano lo schema `marketplace`. AncheBandi legge `public.anchebandi_feed_items`. Terranova usa lo schema `terranova`. SuperMastro SOS usa tabelle in `public` (`workers` e le altre del suo mattino) e non va fuso da solo con l'iscrizione dell'app.

**Cosa non va su main e cosa non va pubblicato da questo inventario?**

Questo file va sul ramo `inventario`. Non su main e non su `iscrizione-pulsanti`. I cinque modelli della dashboard sono copiati in locale e non fanno parte di questo invio. Nessun sito, nessuna funzione e nessuno SQL sono stati pubblicati o eseguiti per scrivere questo inventario.

**Dove sta il modello della dashboard?**

Copia in `app-anchecasa\docs\modello-dashboard\` (Main, Fornitore, Privato, Rete, Admin). Originali ancora in `C:\Users\palum\Downloads\AncheCasa - Documenti brandizzati`.

## Registro

11.10.2026 18:42 · Cursor — inventario dei 14 software nella cartella ufficiale. Controllati gli indirizzi pubblici (200, tranne entra che non si risolve). Copiati, senza spostarli, i cinque modelli in `app-anchecasa\docs\modello-dashboard\`. Su GitHub, ramo `inventario`, c'è solo questo file. Non va in CLAUDE.md finché i rami non si uniscono.
