# Inventario del cruscotto Next.js

Letto l'11.10.2026. Serve a chi riprende il codice. Non contiene chiavi né password.

Repository: https://github.com/anchecasa/ecosistema-anchecasa (privato).
Ramo di lavoro e ramo predefinito su GitHub: `feature/admin-eprocurement-button`.
Non esiste un ramo `main`. `master` è solo lo scheletro iniziale di Create Next App.
`feature/e-procurement` è un ramo precedente, fermo prima del portale fornitori e delle migrazioni app-01…app-13.

Database usato: progetto Supabase ANCHECASA, schema `marketplace`. Questo cruscotto non ha un database suo.

## 1. Versioni

| Pacchetto | Versione |
| --- | --- |
| next | 16.3.5 |
| react / react-dom | 19.2.8 |
| typescript | ^5 |
| tailwindcss e @tailwindcss/postcss | ^4 |
| @supabase/ssr | ^0.12.7 |
| @supabase/supabase-js | ^2.117.3 |
| stripe | assente |

Router: App Router, cartella `src/app`. Non c'è `pages/`.
I client Supabase leggono lo schema `marketplace` (`src/lib/supabase/server.ts`).

## 2. Albero fino a 4 livelli

Esclusi `node_modules`, `.next`, `.git`, `.vercel`.

```
public/
  file.svg, globe.svg, next.svg, vercel.svg, window.svg
services/anchebim/
  analizza_ingresso.py
  estrai_abaco_triplo.py
  estrazione_forense_cme_abaco.py
  json_canonico.py
sql/app-anchecasa/
  app-01-supermastro.sql … app-13-magazzino-mezzi.sql
src/app/
  admin/layout.tsx, page.tsx
  admin/bim/
  admin/e-procurement/
  api/bim/
  fornitore/layout.tsx
  fornitore/gare/
  login/page.tsx
  layout.tsx, page.tsx, globals.css, favicon.ico
src/components/
  admin/ (barra-admin, admin-procurement-nav-item, admin-procurement-launcher)
  e-procurement/ (nuova-gara, tabella-gare, scelta-fornitori, ui, procurement-nav-button)
  e-procurement/dettaglio/ (azioni-gara, documenti, inviti, offerte)
  e-procurement/fornitore/ (modulo-offerta)
src/lib/
  anchebim/analizza.ts
  e-procurement/ (context, dati, documenti, fornitore, schemi, tipi, formato, caricamento, anchebim)
  eprocurement/ (auth, ruoli)
  supabase/ (browser, env, middleware, server, service)
src/middleware.ts
supabase/migrations/20261011103000_e_procurement.sql
supabase/tests/e_procurement_prove.sql
.env.example
.gitignore
AGENTS.md
APPUNTI-PER-FRANCESCO.md
CLAUDE.md
package.json
```

## 3. Rotte

| URL | File | Protetta | Ruolo |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | no: rimanda a `/admin` | — |
| `/login` | `src/app/login/page.tsx` | no | — |
| `/admin` | `src/app/admin/page.tsx` | sì, middleware | utente entrato |
| `/admin/bim` | `src/app/admin/bim/page.tsx` | sì, middleware | utente entrato |
| `/admin/e-procurement` | `src/app/admin/e-procurement/page.tsx` | sì | admin oppure `general_contractor_buyer` |
| `/admin/e-procurement/[id]` | `src/app/admin/e-procurement/[id]/page.tsx` | sì | lo stesso |
| `/fornitore/gare` | `src/app/fornitore/gare/page.tsx` | sì | membro di un'organizzazione `fornitore` attiva |
| `/fornitore/gare/[id]` | `src/app/fornitore/gare/[id]/page.tsx` | sì | lo stesso; per inviare l'offerta serve titolare o responsabile |
| `POST /api/bim/analizza` | `src/app/api/bim/analizza/route.ts` | no | il middleware non copre `/api` |

Il middleware (`src/middleware.ts`) copre `/admin`, `/fornitore` e `/login`. Senza utente, `/admin` e `/fornitore` vanno a `/login`. Il layout delle gare (`src/app/admin/e-procurement/layout.tsx`) rimanda a `/admin` chi è entrato ma non ha il ruolo. Il layout fornitore (`src/app/fornitore/layout.tsx`) mostra la pagina vuota se l'account non è un fornitore attivo dell'Albo.

## 4. Menu e layout

- Barra laterale admin: `src/components/admin/barra-admin.tsx`, montata da `src/app/admin/layout.tsx`.
- Voci: Cruscotto (`/admin`), AncheBIM (`/admin/bim`), e «Gestione e-Procurement & Subappalti» (`/admin/e-procurement`) solo se `canAccessProcurement()` è vero (`src/components/admin/admin-procurement-nav-item.tsx`).
- Sul cruscotto, la stessa voce compare come card (`src/components/admin/admin-procurement-launcher.tsx`).
- Layout radice: `src/app/layout.tsx` (solo html, body e caratteri). Non c'è una navbar del sito.
- Area fornitore: testata nel layout `src/app/fornitore/layout.tsx` («AncheCasa · Gare»), senza la barra admin.

## 5. Otto moduli

| Modulo | Cartelle e rotte in questo repo | Tabelle | Stato |
| --- | --- | --- | --- |
| AncheBandi | nessuna | nessuna qui | ASSENTE |
| AncheQuotes | nessuna | nessuna qui | ASSENTE |
| AncheCasa Core (cantieri, SAL, 81/08) | solo SQL: `sql/app-anchecasa/app-06` e `app-10`. Nessuna pagina | `app_strategie`, `app_affari`, `app_affari_tranche`, `app_obiettivi`, `app_cantiere_soggetti`, `app_fascicolo_*`, `app_scadenze` | PARZIALE: database presente, schermate assenti |
| Centrale RFP (e-procurement) | `src/app/admin/e-procurement`, `src/app/fornitore/gare`, `src/components/e-procurement`, `src/lib/e-procurement` | `app_ep_gare`, `app_ep_documenti`, `app_ep_inviti`, `app_ep_offerte`, `app_ep_eventi` | COMPLETO |
| AncheCompass (prezzari, SUE) | solo SQL `app-11`. Nessuna pagina | `app_prezzari`, `app_prezzari_voci`, `app_comuni_sue`, `app_stima_*` | PARZIALE: database presente, schermate assenti |
| AncheFatture (SdI) | solo SQL `app-08`. Nessuna pagina e nessuna Edge Function in questo repo | `app_fe_profili`, `app_fe_documenti`, `app_fe_righe`, `app_fe_piani`, `app_fe_crediti` | PARZIALE: database presente, invio SdI e schermate assenti |
| Terranova | nessuna cartella | nessuna in questo repo | ASSENTE |
| AncheBIM (X/Y/Z, SHA-256) | `services/anchebim/*.py`, `src/lib/anchebim/analizza.ts`, `/admin/bim`, `POST /api/bim/analizza` | nessuna tabella sua: l'esito sta su `app_ep_documenti` | PARZIALE: in locale Python fa il controllo triplo; la pagina pubblica su Vercel calcola solo SHA-256 perché lì Python non c'è |

## 6. Supabase

Migrazioni in questo repo, in ordine di esecuzione previsto:

1. `sql/app-anchecasa/app-01-supermastro.sql` … `app-13-magazzino-mezzi.sql` (a mano, non sono in `supabase/migrations`)
2. `supabase/migrations/20261011103000_e_procurement.sql` (dopo app-01 e app-02)

Controllo sul database l'11.10.2026: esistono `marketplace.app_org`, `app_ep_gare`, `app_fe_documenti`, `app_prezzari`, `app_mag_movimenti`, `app_scadenze`, `app_strategie`, `admins`. Quindi app-01…app-13 e la migrazione delle gare sono già state eseguite a mano. Non risultano in `supabase_migrations.schema_migrations` con questi nomi: la CLI non le ha registrate.

Tabelle principali dello schema `marketplace`: organizzazioni e membri (`app_org`, `app_org_membri`), ruoli persona (`app_ruoli`), record, rete, vendite, strategie e affari, documenti e firme, fatture elettroniche, fascicolo 81/08, prezzari e stime, magazzino e mezzi, subappalti, gare private (`app_ep_*`). Elenco completo dei `create table` nei file SQL.

Ruoli:

- `marketplace.admins`: amministratori di piattaforma. La centrale li legge da lì.
- `app_org_membri.ruolo`: `titolare`, `responsabile`, `operatore`, `consulente`, più `general_contractor_buyer` aggiunto dalla migrazione gare.
- `app_ruoli.ruolo`: `privato`, `artigiano`, `impresa`, `fornitore`, `cliente`, `operatore`, `agente`, `subagente`, `capoarea`, `sviluppo`, `consulente`, `partner`. La rete aggiunge il Responsabile Rete Italia in app-04.
- Chi apre la centrale: riga in `admins` oppure membro con `general_contractor_buyer` (`src/lib/eprocurement/ruoli.ts`).
- Chi entra nel portale fornitori: membro di un'`app_org` con tipo `fornitore` e stato `attiva`.

RLS: ogni tabella dei file SQL ha `enable row level security`. Sulle gare le policy sono `app_ep_gare_leggi/crea/modifica/elimina`, `app_ep_documenti_leggi/crea/elimina`, `app_ep_inviti_leggi/crea/elimina/risposta`, `app_ep_offerte_leggi/invia/aggiorna`, `app_ep_eventi_leggi`, e sul bucket `app_ep_file_leggi/carica/togli`. Le offerte in busta chiusa non sono leggibili dal committente prima della scadenza: lo fa la policy di lettura.

Cron nello SQL: `anchecasa-ep-chiudi-scadute` ogni 5 minuti; `app-scadenze-avvisa` alle 7 di Roma (0 5 UTC).

Edge Functions: nessuna cartella `supabase/functions` in questo repo. L'invio SdI e le mail stanno nell'app AncheCasa, non qui.

## 7. Abbonamenti

Stripe non è tra le dipendenze. Non ci sono tabelle di piani o di prova in questo repo. Non c'è la pagina `/pricing`.

## 8. Codice fermo, doppioni, cose da fare

- `src/components/e-procurement/procurement-nav-button.tsx` non è importato da nessuna pagina. La card usata è `AdminProcurementLauncher`.
- Due cartelle vicine: `src/lib/e-procurement` (dati e pagine) e `src/lib/eprocurement` (solo controllo del ruolo). Entrambe servono.
- Icone predefinite di Next in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) non fanno parte del cruscotto.
- In `src` e `services` non ci sono commenti `TODO` o `FIXME`.
- `POST /api/bim/analizza` accetta il file senza controllare l'accesso.
- L'Albo fornitori sul database è ancora vuoto: il portale non ha aziende a cui inviare una gara.
- I file app-01…app-13 stanno in `sql/`, non in `supabase/migrations`: un `db push` di questo repo non li rilancia.
