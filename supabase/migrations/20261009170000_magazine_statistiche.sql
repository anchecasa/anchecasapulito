-- AncheCasa · Magazine: statistiche di lettura e iscritti agli avvisi (09.10.2026)
-- Chi scrive: la funzione Vercel sito/api/mag.js (chiave pubblica, solo INSERT).
-- Chi legge: solo gli admin (marketplace.admins), dalla pagina "Magazine" della dashboard admin
-- (area-privata/dashboard/js/magazine-admin.js) tramite la funzione magazine_riepilogo().
-- Privacy: niente IP, niente cookie. "sessione" è un codice casuale che vive solo finché la scheda è aperta.

create table if not exists marketplace.magazine_eventi (
  id          uuid primary key default gen_random_uuid(),
  creato      timestamptz not null default now(),
  numero      smallint not null default 1 check (numero between 1 and 999),
  evento      text not null check (evento in ('apertura', 'pagina', 'bollette_uso', 'bollette_pdf', 'offerte', 'condividi', 'avvisi')),
  pagina      smallint check (pagina between 0 and 200),
  dettaglio   text not null default '' check (char_length(dettaglio) <= 60),
  sessione    text not null check (char_length(sessione) between 6 and 40),
  dispositivo text not null default '' check (dispositivo in ('', 'telefono', 'tablet', 'pc')),
  citta       text not null default '' check (char_length(citta) <= 80),
  regione     text not null default '' check (char_length(regione) <= 20),
  paese       text not null default '' check (char_length(paese) <= 4),
  provenienza text not null default '' check (char_length(provenienza) <= 80)
);
create index if not exists magazine_eventi_creato_idx on marketplace.magazine_eventi (creato desc);
create index if not exists magazine_eventi_tipo_idx on marketplace.magazine_eventi (numero, evento, creato);

create table if not exists marketplace.magazine_iscritti (
  id         uuid primary key default gen_random_uuid(),
  creato     timestamptz not null default now(),
  mail       text not null check (char_length(mail) between 5 and 160 and mail like '%@%.%'),
  comune     text not null default '' check (char_length(comune) <= 80),
  interesse  text not null default '' check (char_length(interesse) <= 120),
  numero     smallint not null default 1,
  citta_rete text not null default '' check (char_length(citta_rete) <= 80),
  privacy    boolean not null check (privacy = true),
  privacy_at timestamptz not null default now()
);
create unique index if not exists magazine_iscritti_mail_uq on marketplace.magazine_iscritti (lower(mail));

-- Chi è admin: funzione a parte, così le regole non dipendono dai permessi sulla tabella admins.
create or replace function marketplace.magazine_e_admin()
returns boolean
language sql
stable
security definer
set search_path = marketplace, public
as $$ select exists (select 1 from marketplace.admins a where a.id = auth.uid()) $$;
revoke all on function marketplace.magazine_e_admin() from public, anon;
grant execute on function marketplace.magazine_e_admin() to authenticated;

alter table marketplace.magazine_eventi  enable row level security;
alter table marketplace.magazine_iscritti enable row level security;

-- Scrivere: chiunque (la rivista è pubblica), solo righe nuove.
drop policy if exists magazine_eventi_scrivi on marketplace.magazine_eventi;
create policy magazine_eventi_scrivi on marketplace.magazine_eventi
  for insert to anon, authenticated with check (true);

drop policy if exists magazine_iscritti_scrivi on marketplace.magazine_iscritti;
create policy magazine_iscritti_scrivi on marketplace.magazine_iscritti
  for insert to anon, authenticated with check (privacy = true);

-- Leggere e cancellare: solo gli admin.
drop policy if exists magazine_eventi_admin on marketplace.magazine_eventi;
create policy magazine_eventi_admin on marketplace.magazine_eventi
  for select to authenticated using (marketplace.magazine_e_admin());

drop policy if exists magazine_iscritti_admin_leggi on marketplace.magazine_iscritti;
create policy magazine_iscritti_admin_leggi on marketplace.magazine_iscritti
  for select to authenticated using (marketplace.magazine_e_admin());

drop policy if exists magazine_iscritti_admin_cancella on marketplace.magazine_iscritti;
create policy magazine_iscritti_admin_cancella on marketplace.magazine_iscritti
  for delete to authenticated using (marketplace.magazine_e_admin());

grant insert on marketplace.magazine_eventi, marketplace.magazine_iscritti to anon, authenticated;
grant select on marketplace.magazine_eventi, marketplace.magazine_iscritti to authenticated;
grant delete on marketplace.magazine_iscritti to authenticated;

-- Riepilogo per la dashboard admin: un solo JSON già contato, senza scaricare le righe.
create or replace function marketplace.magazine_riepilogo(p_dal timestamptz default now() - interval '30 days', p_numero smallint default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = marketplace, public
as $$
declare
  r jsonb;
begin
  if not exists (select 1 from marketplace.admins a where a.id = auth.uid()) then
    raise exception 'solo admin';
  end if;

  with ev as (
    select * from marketplace.magazine_eventi
    where creato >= p_dal and (p_numero is null or numero = p_numero)
  ),
  ap as (
    select distinct on (sessione) sessione, citta, regione, paese, dispositivo, provenienza, creato
    from ev where evento = 'apertura' order by sessione, creato
  )
  select jsonb_build_object(
    'lettori',      (select count(*) from ap),
    'pagine_viste', (select count(*) from ev where evento = 'pagina'),
    'azioni',       coalesce((select jsonb_object_agg(evento, n) from (
                      select evento, count(distinct sessione) as n from ev where evento <> 'pagina' group by evento) x), '{}'::jsonb),
    'per_giorno',   coalesce((select jsonb_agg(jsonb_build_object('giorno', g, 'lettori', n) order by g) from (
                      select (creato at time zone 'Europe/Rome')::date as g, count(*) as n from ap group by 1) x), '[]'::jsonb),
    'per_pagina',   coalesce((select jsonb_agg(jsonb_build_object('pagina', pagina, 'lettori', n) order by pagina) from (
                      select pagina, count(distinct sessione) as n from ev where evento = 'pagina' and pagina is not null group by pagina) x), '[]'::jsonb),
    'citta',        coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'lettori', n) order by n desc) from (
                      select coalesce(nullif(citta, ''), 'Non rilevata') as nome, count(*) as n from ap group by 1 order by 2 desc limit 20) x), '[]'::jsonb),
    'dispositivi',  coalesce((select jsonb_object_agg(d, n) from (
                      select coalesce(nullif(dispositivo, ''), 'altro') as d, count(*) as n from ap group by 1) x), '{}'::jsonb),
    'provenienze',  coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'lettori', n) order by n desc) from (
                      select coalesce(nullif(provenienza, ''), 'diretto') as nome, count(*) as n from ap group by 1 order by 2 desc limit 12) x), '[]'::jsonb),
    'condivisioni', coalesce((select jsonb_agg(jsonb_build_object('canale', canale, 'volte', n) order by n desc) from (
                      select coalesce(nullif(dettaglio, ''), 'menu') as canale, count(*) as n from ev where evento = 'condividi' group by 1) x), '[]'::jsonb),
    'iscritti',     (select count(*) from marketplace.magazine_iscritti where creato >= p_dal)
  ) into r;

  return r;
end;
$$;

revoke all on function marketplace.magazine_riepilogo(timestamptz, smallint) from public, anon;
grant execute on function marketplace.magazine_riepilogo(timestamptz, smallint) to authenticated;
