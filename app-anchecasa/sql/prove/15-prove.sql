-- Prove anagrafica unica. Solo Postgres locale. Non eseguirla su Supabase.
-- Ordine: 00-finto-supabase.sql, poi questo file (chiama app-15 due volte).
\set ON_ERROR_STOP on

create table if not exists marketplace.app_org (
  id uuid primary key default gen_random_uuid(),
  nome text not null default '',
  tipo text not null default 'impresa',
  piva text not null default '',
  stato text not null default 'attiva',
  stato_verifica text not null default 'da_verificare',
  ateco text[] not null default '{}',
  zone_servite text[] not null default '{}',
  modo_fornitore text[] not null default '{}',
  titolare uuid
);
create table if not exists marketplace.app_org_membri (
  org uuid not null,
  utente uuid not null,
  ruolo text not null default 'titolare',
  primary key (org, utente)
);
create table if not exists marketplace.app_record (
  id uuid primary key default gen_random_uuid(),
  org uuid,
  tipo text not null default 'cliente',
  titolo text not null default '',
  dati jsonb not null default '{}'::jsonb,
  soggetto uuid
);
create table if not exists marketplace.app_vendite (
  id uuid primary key default gen_random_uuid(),
  venditore uuid,
  cliente_nome text not null default '',
  cliente_tipo text not null default 'azienda',
  cliente_piva text not null default '',
  cliente_contatto text not null default '',
  stato text not null default 'proposta',
  affidato boolean not null default false,
  creato timestamptz not null default now(),
  soggetto uuid
);
create table if not exists marketplace.app_affari (
  id uuid primary key default gen_random_uuid(),
  segnalato_da uuid,
  cliente_nome text not null default '',
  cliente_tipo text not null default 'azienda',
  cliente_piva text not null default '',
  cliente_contatto text not null default '',
  stato text not null default 'proposta',
  creato timestamptz not null default now(),
  soggetto uuid
);
create table if not exists marketplace.app_fe_documenti (
  id uuid primary key default gen_random_uuid(),
  org uuid,
  cliente_dati jsonb not null default '{}'::jsonb,
  soggetto uuid
);
create table if not exists marketplace.app_sopralluoghi (
  id uuid primary key default gen_random_uuid(),
  org uuid,
  cliente_dati jsonb not null default '{}'::jsonb,
  soggetto uuid
);
create table if not exists marketplace.app_fornitori_zona (
  id uuid primary key default gen_random_uuid(),
  org uuid,
  email text not null default '',
  ditta text not null default '',
  nome text not null default '',
  telefono text not null default '',
  comune text not null default '',
  soggetto uuid
);
create table if not exists marketplace.app_sub_inviti (
  id uuid primary key default gen_random_uuid(),
  email text not null default '',
  ditta text not null default '',
  soggetto uuid
);
create table if not exists marketplace.app_contatti (
  id uuid primary key default gen_random_uuid(),
  nome text not null default '',
  email text not null default '',
  telefono text not null default '',
  dati jsonb not null default '{}'::jsonb,
  soggetto uuid
);
create table if not exists marketplace.app_segnalazioni (
  id uuid primary key default gen_random_uuid(),
  nome text not null default '',
  telefono text not null default '',
  soggetto uuid
);

\ir ../app-15-anagrafica-unica.sql

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'ditta-a@prova.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'ditta-b@prova.local'),
  ('00000000-0000-0000-0000-0000000000b1', 'agente-a@prova.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'agente-b@prova.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'estraneo@prova.local'),
  ('00000000-0000-0000-0000-0000000000d1', 'admin-anag@prova.local')
on conflict (id) do nothing;
insert into marketplace.admins (id) values ('00000000-0000-0000-0000-0000000000d1') on conflict do nothing;

insert into marketplace.app_org (id, nome, piva, titolare, stato_verifica) values
  ('00000000-0000-0000-0000-000000000aa1', 'Ditta A', '00000000000', '00000000-0000-0000-0000-0000000000a1', 'da_verificare'),
  ('00000000-0000-0000-0000-000000000aa2', 'Ditta B', '00000000000', '00000000-0000-0000-0000-0000000000a2', 'da_verificare');
insert into marketplace.app_org_membri (org, utente, ruolo) values
  ('00000000-0000-0000-0000-000000000aa1', '00000000-0000-0000-0000-0000000000a1', 'titolare'),
  ('00000000-0000-0000-0000-000000000aa2', '00000000-0000-0000-0000-0000000000a2', 'titolare');

-- Stessa partita IVA da due ditte: un soggetto, due righe di rubrica.
select marketplace.app_soggetto_assicura('azienda', '', '', 'Rossi Costruzioni', '', '11111111111', 'rossi@prova.local', '3331234567', '', 'Teano', 'CE', 'Campania', 'ditta');
insert into marketplace.app_rubrica (org, soggetto, ruolo, note)
select '00000000-0000-0000-0000-000000000aa1', id, 'cliente', 'nota della ditta A'
from marketplace.app_soggetti where partita_iva = '11111111111';
insert into marketplace.app_rubrica (org, soggetto, ruolo, note)
select '00000000-0000-0000-0000-000000000aa2', id, 'cliente', 'nota della ditta B'
from marketplace.app_soggetti where partita_iva = '11111111111';

-- Fattura vecchia: i dati del momento restano.
insert into marketplace.app_fe_documenti (id, org, cliente_dati)
values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000aa1', '{"nome":"Vecchio Nome","email":"vecchio@prova.local"}'::jsonb);

-- Fornitore invitato per mail, non ancora iscritto.
select marketplace.app_soggetto_assicura('azienda', '', '', 'Forniture Verdi', '', '22222222222', 'verdi@prova.local', '', '', '', '', '', 'import');
insert into marketplace.app_sub_inviti (id, email, ditta)
values ('00000000-0000-0000-0000-0000000000e1', 'verdi@prova.local', 'Forniture Verdi');
insert into marketplace.app_org (id, nome, piva, titolare, stato_verifica)
values ('00000000-0000-0000-0000-000000000aa3', 'Forniture Verdi', '22222222222', '00000000-0000-0000-0000-0000000000a1', 'verificata');

-- Un agente registra l'azienda, il collega no.
insert into marketplace.app_vendite (venditore, cliente_nome, cliente_tipo, cliente_piva, cliente_contatto, stato)
values ('00000000-0000-0000-0000-0000000000b1', 'Bianchi Srl', 'azienda', '33333333333', 'bianchi@prova.local', 'proposta');

do $$
begin
  insert into marketplace.app_vendite (venditore, cliente_nome, cliente_tipo, cliente_piva, cliente_contatto, stato)
  values ('00000000-0000-0000-0000-0000000000b2', 'Bianchi Srl', 'azienda', '33333333333', 'altro@prova.local', 'proposta');
  raise exception 'il collega non doveva registrare';
exception when others then
  if sqlerrm <> 'cliente_di_un_collega' then raise; end if;
end $$;

-- Possibile doppione: stesso indirizzo mail, uno con codice fiscale e uno senza. Non si uniscono da soli.
select marketplace.app_soggetto_assicura('persona', 'Luca', 'Neri', '', 'NRILCU80A01F839X', '', 'luca@prova.local', '', '', '', '', '', 'sito');
select marketplace.app_soggetto_assicura('persona', 'Luca', 'Neri', '', '', '', 'luca@prova.local', '3401234567', '', '', '', '', 'import');

select marketplace.app_anagrafica_collega();

do $$
declare n int; note_a int; note_b int; visti int;
begin
  select count(*) into n from marketplace.app_soggetti where partita_iva = '11111111111' and unito_in is null;
  if n <> 1 then raise exception 'atteso 1 soggetto per la partita IVA, trovati %', n; end if;
  select count(*) into n from marketplace.app_rubrica where soggetto = (select id from marketplace.app_soggetti where partita_iva = '11111111111');
  if n <> 2 then raise exception 'attese 2 righe di rubrica, trovate %', n; end if;
  if (select cliente_dati->>'nome' from marketplace.app_fe_documenti where id = '00000000-0000-0000-0000-0000000000f1') <> 'Vecchio Nome' then
    raise exception 'la fattura ha cambiato i dati del cliente';
  end if;
  if (select soggetto from marketplace.app_fe_documenti where id = '00000000-0000-0000-0000-0000000000f1') is null then
    raise exception 'la fattura non è collegata al soggetto';
  end if;
  if not (select rivendicato from marketplace.app_soggetti where partita_iva = '22222222222') then
    raise exception 'il fornitore non ha rivendicato il profilo';
  end if;
  if (select soggetto from marketplace.app_sub_inviti where id = '00000000-0000-0000-0000-0000000000e1') is null then
    raise exception 'la richiesta del fornitore non è stata ritrovata';
  end if;
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', false);
  select count(*) into n from marketplace.app_soggetti_doppioni();
  if n < 1 then raise exception 'il doppione della mail non è in elenco'; end if;
  raise notice 'OK soggetti piva unica, rubrica doppia, fattura ferma, profilo rivendicato, doppioni %', n;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select 'ditta A vede soggetti ' || count(*) from marketplace.app_soggetti;
select 'ditta A vede note ' || count(*) || ' ' || coalesce(string_agg(note, ' | '), '') from marketplace.app_rubrica;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
select 'estraneo vede soggetti ' || count(*) from marketplace.app_soggetti;
reset role;

do $$
declare n_a int; n_e int; nota text;
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  set local role authenticated;
  select count(*) into n_a from marketplace.app_soggetti;
  select string_agg(note, '|') into nota from marketplace.app_rubrica;
  if nota not like '%ditta A%' or nota like '%ditta B%' then
    raise exception 'la ditta A vede le note sbagliate: %', nota;
  end if;
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
  select count(*) into n_e from marketplace.app_soggetti;
  if n_e <> 0 then raise exception 'l estraneo legge % soggetti', n_e; end if;
  raise notice 'OK visibilita ditta A % soggetti, estraneo %', n_a, n_e;
end $$;

create table pg_temp.conti as
select (select count(*) from marketplace.app_soggetti) as soggetti,
       (select count(*) from marketplace.app_rubrica) as rubrica,
       (select count(*) from marketplace.app_soggetti_doppioni()) as doppioni;

\ir ../app-15-anagrafica-unica.sql

do $$
declare s int; r int; d int;
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
  select count(*) into s from marketplace.app_soggetti;
  select count(*) into r from marketplace.app_rubrica;
  select count(*) into d from marketplace.app_soggetti_doppioni();
  if s <> (select soggetti from pg_temp.conti) or r <> (select rubrica from pg_temp.conti) then
    raise exception 'il secondo giro ha creato doppioni: soggetti % rubrica %', s, r;
  end if;
  raise notice 'SECONDO GIRO ok soggetti % rubrica % doppioni %', s, r, d;
end $$;
