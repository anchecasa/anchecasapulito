-- AncheCasa · Luce e gas (09.10.2026)
-- Tabelle per il pack "energia" della dashboard azienda (area-privata/dashboard/js/energia.js):
-- listino offerte, dati della carta intestata e proposte inviate ai clienti.
-- Schema: marketplace (lo stesso di profiles, annunci, luoghi). L'azienda è l'utente autenticato: azienda_id = auth.uid().

create table if not exists marketplace.energia_carta (
  azienda_id uuid primary key references auth.users (id) on delete cascade,
  ragione    text not null default '',
  piva       text not null default '',
  indirizzo  text not null default '',
  telefono   text not null default '',
  mail       text not null default '',
  sito       text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists marketplace.energia_offerte (
  id          uuid primary key default gen_random_uuid(),
  azienda_id  uuid not null references auth.users (id) on delete cascade,
  nome        text not null check (char_length(nome) between 1 and 80),
  tipo        text not null check (tipo in ('luce', 'gas', 'duale')),
  clienti     text not null default 'tutti' check (clienti in ('privati', 'imprese', 'tutti')),
  prezzo      text not null default 'fisso' check (prezzo in ('fisso', 'indicizzato')),
  durata_mesi smallint not null default 12 check (durata_mesi in (12, 24, 36)),
  prezzo_luce numeric(10, 5),          -- €/kWh, parte commerciale
  prezzo_gas  numeric(10, 5),          -- €/Smc, parte commerciale
  quota_mese  numeric(10, 2),          -- €/mese
  bonus       numeric(10, 2),          -- sconto di benvenuto €
  note        text not null default '' check (char_length(note) <= 600),
  attiva      boolean not null default true,
  copertura   text not null default 'italia',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists energia_offerte_azienda_idx on marketplace.energia_offerte (azienda_id);
create index if not exists energia_offerte_attive_idx on marketplace.energia_offerte (attiva, tipo);

create table if not exists marketplace.energia_proposte (
  id           uuid primary key default gen_random_uuid(),
  azienda_id   uuid not null references auth.users (id) on delete cascade,
  offerta_id   uuid references marketplace.energia_offerte (id) on delete set null,
  numero       text not null,           -- AC-EN-2026-0001
  cliente      text not null,
  indirizzo    text not null default '',
  cf           text not null default '',
  mail         text not null default '',
  pod          text not null default '',
  pdr          text not null default '',
  consumo_luce numeric(12, 2),
  consumo_gas  numeric(12, 2),
  stima_annua  numeric(12, 2),
  nota         text not null default '',
  stato        text not null default 'inviata' check (stato in ('inviata', 'accettata', 'rifiutata')),
  created_at   timestamptz not null default now(),
  unique (azienda_id, numero)
);
create index if not exists energia_proposte_azienda_idx on marketplace.energia_proposte (azienda_id, created_at desc);

alter table marketplace.energia_carta    enable row level security;
alter table marketplace.energia_offerte  enable row level security;
alter table marketplace.energia_proposte enable row level security;

-- Ogni azienda vede e modifica solo i propri dati.
drop policy if exists energia_carta_proprie on marketplace.energia_carta;
create policy energia_carta_proprie on marketplace.energia_carta
  for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());

drop policy if exists energia_offerte_proprie on marketplace.energia_offerte;
create policy energia_offerte_proprie on marketplace.energia_offerte
  for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());

-- Le offerte attive sono pubbliche: le vedono i privati in piazza e nel magazine, in tutta Italia.
drop policy if exists energia_offerte_pubbliche on marketplace.energia_offerte;
create policy energia_offerte_pubbliche on marketplace.energia_offerte
  for select to anon, authenticated using (attiva = true);

drop policy if exists energia_proposte_proprie on marketplace.energia_proposte;
create policy energia_proposte_proprie on marketplace.energia_proposte
  for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());

grant select on marketplace.energia_offerte to anon;
grant select, insert, update, delete on marketplace.energia_carta, marketplace.energia_offerte, marketplace.energia_proposte to authenticated;
