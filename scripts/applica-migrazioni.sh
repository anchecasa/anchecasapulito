#!/usr/bin/env bash
# Applica al database Supabase gli script di supabase/migrations non ancora applicati.
# Tiene traccia in marketplace._migrazioni_pulito, così non tocca la cronologia delle altre migrazioni del progetto.
set -euo pipefail
: "${SUPABASE_DB_URL:?Manca il segreto SUPABASE_DB_URL}"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -c "create table if not exists marketplace._migrazioni_pulito (nome text primary key, applicata_il timestamptz not null default now());"
for f in $(ls supabase/migrations/*.sql | sort); do
  nome=$(basename "$f")
  gia=$(psql "$SUPABASE_DB_URL" -tA -c "select 1 from marketplace._migrazioni_pulito where nome = '$nome'")
  if [ "$gia" = "1" ]; then echo "già applicata: $nome"; continue; fi
  echo "applico: $nome"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -1 -f "$f" -c "insert into marketplace._migrazioni_pulito (nome) values ('$nome');"
done
echo "Database aggiornato."
