-- AncheCasa · SuperMastro impara dai pollici (09.10.2026)
-- Sotto ogni risposta: "SuperMastro ha capito il problema?" 👍 / 👎 (+ "Cos'era invece?").
-- Scrive: la funzione Vercel sito/api/supermastro-voto.js (chiave pubblica, solo INSERT, approvato sempre false).
-- Impara: un admin mette approvato = true sulle correzioni giuste; la funzione supermastro_esempi() le dà
-- a sito/api/supermastro.js, che le aggiunge al prompt come esempi. Niente dati personali.

create table if not exists marketplace.supermastro_voti (
  id         uuid primary key default gen_random_uuid(),
  creato     timestamptz not null default now(),
  voto       smallint not null check (voto in (-1, 1)),
  fonte      text not null default 'testo' check (fonte in ('testo', 'video')),
  richiesta  text not null default '' check (char_length(richiesta) <= 300),
  problema   text not null default '' check (char_length(problema) <= 80),
  mestiere   text not null default '' check (char_length(mestiere) <= 40),
  correzione text not null default '' check (char_length(correzione) <= 200),
  citta      text not null default '' check (char_length(citta) <= 80),
  approvato  boolean not null default false
);
create index if not exists supermastro_voti_creato_idx on marketplace.supermastro_voti (creato desc);
create index if not exists supermastro_voti_approvati_idx on marketplace.supermastro_voti (approvato) where approvato;

alter table marketplace.supermastro_voti enable row level security;

drop policy if exists supermastro_voti_scrivi on marketplace.supermastro_voti;
create policy supermastro_voti_scrivi on marketplace.supermastro_voti
  for insert to anon, authenticated with check (approvato = false);

-- Leggere e approvare: solo gli admin (funzione definita in 20261009170000_magazine_statistiche.sql).
drop policy if exists supermastro_voti_admin_leggi on marketplace.supermastro_voti;
create policy supermastro_voti_admin_leggi on marketplace.supermastro_voti
  for select to authenticated using (marketplace.magazine_e_admin());
drop policy if exists supermastro_voti_admin_approva on marketplace.supermastro_voti;
create policy supermastro_voti_admin_approva on marketplace.supermastro_voti
  for update to authenticated using (marketplace.magazine_e_admin()) with check (marketplace.magazine_e_admin());

grant insert on marketplace.supermastro_voti to anon, authenticated;
grant select, update on marketplace.supermastro_voti to authenticated;

-- Esempi per il prompt: solo le correzioni approvate, solo i campi utili, le ultime 20.
create or replace function marketplace.supermastro_esempi()
returns jsonb
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('richiesta', richiesta, 'sbagliato', problema, 'giusto', correzione, 'mestiere', mestiere) order by creato desc), '[]'::jsonb)
  from (select * from marketplace.supermastro_voti where approvato and voto = -1 and correzione <> '' order by creato desc limit 20) x;
$$;
revoke all on function marketplace.supermastro_esempi() from public;
grant execute on function marketplace.supermastro_esempi() to anon, authenticated;
