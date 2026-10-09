# AncheCasa · cartella pulita su GitHub

Questo repository è la copia ufficiale di `Desktop\ANCHECASA-PULITO`. Ogni modifica si annota in `CLAUDE.md`.

## Vercel (una volta sola)

1. **Sito www.anchecasa.it** — progetto Vercel `anchecasa-pulito`:
   Settings → Git → Connect Git Repository → questo repository.
   Settings → General → **Root Directory: `sito`**. Framework: Other. Nessun comando di build.
   Da quel momento ogni invio su `main` pubblica il sito.
2. **Area privata (areaprivata.anchecasa.it)** — progetto Vercel dell'area privata:
   collegarlo a questo repository con **Root Directory: `area-privata`**.

## Supabase (una volta sola, a cura del tecnico)

Le tabelle nuove stanno in `supabase/migrations/`. L'automazione `.github/workflows/supabase.yml`
le applica a ogni invio su `main`, solo quelle non ancora applicate (registro in `marketplace._migrazioni_pulito`).

Serve un segreto nel repository: Settings → Secrets and variables → Actions → New repository secret
- **`SUPABASE_DB_URL`**: la stringa di connessione Postgres del progetto
  (Supabase → Project Settings → Database → Connection string → URI, con la password).

Senza il segreto l'automazione non tocca nulla e lo scrive nel riepilogo.
Per applicarle a mano: `SUPABASE_DB_URL=... bash scripts/applica-migrazioni.sh`.

### Migrazioni presenti
- `20261009100000_energia_offerte_proposte.sql` — luce e gas: carta intestata, offerte (pubbliche se attive), proposte. RLS: ogni azienda vede solo i propri dati.
