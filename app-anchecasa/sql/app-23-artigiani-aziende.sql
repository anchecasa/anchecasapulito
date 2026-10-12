-- app-23 · Artigiani e regole comuni delle aziende (12.10.2026, decisioni di Nando 12:11 e 12:20, PROGETTO-DASHBOARD.md)
--
-- Aziende (tutte):
--   · prova gratis 14 giorni, poi l'admin segna «attiva fino al …» quando l'azienda paga (bonifico). Senza, resta iscritta ma non riceve lavori.
--   · verifica obbligatoria: visura e DURC (e assicurazione) caricati e controllati dall'admin, se no niente lavori.
-- Artigiano (14,90 €/mese + 4,99 € a intervento):
--   · «Ho un guasto» / «Trova artigiano»: la richiesta va a UN artigiano alla volta (il più vicino, libero, con le recensioni migliori;
--     con «Trova artigiano» prima quello scelto dal privato). 15 minuti se urgente, 2 ore se normale; poi passa al secondo e al terzo.
--     Se nessuno accetta, va all'admin.
--   · nome, telefono e indirizzo del cliente solo dopo che l'artigiano ha accettato.
--   · «Lavoro fatto» con l'importo; il cliente conferma (dopo 7 giorni vale come confermato); scattano i 4,99 €;
--     garanzia AncheCasa 30 giorni; recensione solo dopo il lavoro confermato, l'artigiano risponde una volta.
--   · il pagamento dentro l'app arriverà dopo (solo con artigiani iscritti): per ora si registrano lavoro, importo e 4,99 €.
-- Si può rilanciare.

begin;

-- ---------------------------------------------------------------------------
-- 0. Stato dell'azienda: prova, abbonamento, documenti
-- ---------------------------------------------------------------------------
create table if not exists marketplace.aziende_stato (
  azienda_id     uuid primary key references auth.users (id) on delete cascade,
  prova_dal      date not null default current_date,
  attiva_fino    date,
  documenti_ok   boolean not null default false,
  verificata_il  timestamptz,
  note           text not null default '' check (length(note) <= 500),
  updated_at     timestamptz not null default now()
);
alter table marketplace.aziende_stato enable row level security;
drop policy if exists aziende_stato_mio on marketplace.aziende_stato;
create policy aziende_stato_mio on marketplace.aziende_stato for select using (azienda_id = auth.uid());
drop policy if exists aziende_stato_admin on marketplace.aziende_stato;
create policy aziende_stato_admin on marketplace.aziende_stato for all using (marketplace.is_admin()) with check (marketplace.is_admin());
grant select on marketplace.aziende_stato to authenticated;
grant insert, update on marketplace.aziende_stato to authenticated;

-- Le aziende già iscritte partono oggi con la prova.
insert into marketplace.aziende_stato (azienda_id)
select p.id from marketplace.profiles p where p.famiglia = 'azienda'
on conflict (azienda_id) do nothing;

create table if not exists marketplace.aziende_documenti (
  id          uuid primary key default gen_random_uuid(),
  azienda_id  uuid not null references auth.users (id) on delete cascade,
  tipo        text not null check (tipo in ('visura', 'durc', 'assicurazione', 'altro')),
  file_path   text not null check (length(file_path) <= 300),
  scadenza    date,
  stato       text not null default 'caricato' check (stato in ('caricato', 'ok', 'rifiutato')),
  nota        text not null default '' check (length(nota) <= 300),
  created_at  timestamptz not null default now()
);
create index if not exists aziende_documenti_azienda on marketplace.aziende_documenti (azienda_id, created_at desc);
alter table marketplace.aziende_documenti enable row level security;
drop policy if exists aziende_documenti_miei on marketplace.aziende_documenti;
create policy aziende_documenti_miei on marketplace.aziende_documenti for select using (azienda_id = auth.uid());
drop policy if exists aziende_documenti_carica on marketplace.aziende_documenti;
create policy aziende_documenti_carica on marketplace.aziende_documenti for insert with check (azienda_id = auth.uid() and stato = 'caricato');
drop policy if exists aziende_documenti_togli on marketplace.aziende_documenti;
create policy aziende_documenti_togli on marketplace.aziende_documenti for delete using (azienda_id = auth.uid() and stato = 'caricato');
drop policy if exists aziende_documenti_admin on marketplace.aziende_documenti;
create policy aziende_documenti_admin on marketplace.aziende_documenti for all using (marketplace.is_admin()) with check (marketplace.is_admin());
grant select, insert, delete on marketplace.aziende_documenti to authenticated;
grant update on marketplace.aziende_documenti to authenticated;

-- File dei documenti: cartella privata per azienda (aziende-documenti/<id azienda>/...). Li legge solo l'azienda e l'admin.
insert into storage.buckets (id, name, public) values ('aziende-documenti', 'aziende-documenti', false) on conflict (id) do nothing;
drop policy if exists "aziende_documenti_file_miei" on storage.objects;
create policy "aziende_documenti_file_miei" on storage.objects for all to authenticated
  using (bucket_id = 'aziende-documenti' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'aziende-documenti' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "aziende_documenti_file_admin" on storage.objects;
create policy "aziende_documenti_file_admin" on storage.objects for select to authenticated
  using (bucket_id = 'aziende-documenti' and marketplace.is_admin());

-- Lo stato della mia azienda (crea la riga la prima volta: la prova parte da lì).
create or replace function marketplace.azienda_mio_stato()
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare s marketplace.aziende_stato%rowtype;
begin
  if not exists (select 1 from marketplace.profiles where id = auth.uid() and famiglia = 'azienda') then return null; end if;
  insert into marketplace.aziende_stato (azienda_id) values (auth.uid()) on conflict (azienda_id) do nothing;
  select * into s from marketplace.aziende_stato where azienda_id = auth.uid();
  return jsonb_build_object(
    'prova_dal', s.prova_dal, 'prova_fino', s.prova_dal + 13, 'attiva_fino', s.attiva_fino, 'documenti_ok', s.documenti_ok,
    'in_prova', s.prova_dal + 13 >= current_date and (s.attiva_fino is null or s.attiva_fino < current_date),
    'attiva', s.attiva_fino is not null and s.attiva_fino >= current_date,
    'puo_lavorare', marketplace.azienda_puo_lavorare(auth.uid()));
end;
$$;

create or replace function marketplace.azienda_puo_lavorare(p_azienda uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.aziende_stato s where s.azienda_id = p_azienda and s.documenti_ok
    and ((s.attiva_fino is not null and s.attiva_fino >= current_date) or s.prova_dal + 13 >= current_date));
$$;
revoke all on function marketplace.azienda_puo_lavorare(uuid) from public, anon;
grant execute on function marketplace.azienda_puo_lavorare(uuid) to authenticated;
revoke all on function marketplace.azienda_mio_stato() from public, anon;
grant execute on function marketplace.azienda_mio_stato() to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Artigiani: mestieri e disponibilità (la zona è in fornitori_zona, app-21)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.artigiani (
  azienda_id  uuid primary key references auth.users (id) on delete cascade,
  mestieri    text[] not null default '{}',
  libero      boolean not null default true,
  notte       boolean not null default false,
  festivi     boolean not null default false,
  updated_at  timestamptz not null default now()
);
alter table marketplace.artigiani enable row level security;
drop policy if exists artigiani_mio on marketplace.artigiani;
create policy artigiani_mio on marketplace.artigiani for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());
drop policy if exists artigiani_admin on marketplace.artigiani;
create policy artigiani_admin on marketplace.artigiani for select using (marketplace.is_admin());
grant select, insert, update on marketplace.artigiani to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Guasti e interventi
-- ---------------------------------------------------------------------------
create table if not exists marketplace.guasti (
  id               uuid primary key default gen_random_uuid(),
  token            text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  creato           timestamptz not null default now(),
  tipo             text not null default 'guasto' check (tipo in ('guasto', 'trova')),
  mestiere         text not null check (length(mestiere) between 2 and 40),
  descrizione      text not null default '' check (length(descrizione) <= 800),
  urgente          boolean not null default false,
  comune           text not null default '' check (length(comune) <= 80),
  provincia        text not null check (length(provincia) = 2),
  indirizzo        text not null default '' check (length(indirizzo) <= 160),
  nome             text not null check (length(btrim(nome)) between 2 and 120),
  telefono         text not null check (length(btrim(telefono)) between 6 and 30),
  mail             text not null check (mail ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  privato_id       uuid references auth.users (id) on delete set null,
  scelto           uuid references auth.users (id) on delete set null,
  stato            text not null default 'cerca' check (stato in ('cerca', 'assegnato', 'accettato', 'fatto', 'confermato', 'admin', 'annullato')),
  artigiano_id     uuid references auth.users (id) on delete set null,
  offerto_il       timestamptz,
  scade_il         timestamptz,
  tentativi        smallint not null default 0,
  rifiutati        uuid[] not null default '{}',
  accettato_il     timestamptz,
  fatto_il         timestamptz,
  importo          numeric(10, 2),
  nota_lavoro      text not null default '' check (length(nota_lavoro) <= 500),
  confermato_il    timestamptz,
  confermato_auto  boolean not null default false,
  fee              numeric(6, 2) not null default 4.99,
  garanzia_fino    date,
  garanzia_il      timestamptz,
  garanzia_nota    text not null default '' check (length(garanzia_nota) <= 500),
  avvisato_offerta timestamptz,
  avvisato_stato   text not null default '',
  avvisato_admin   timestamptz
);
create index if not exists guasti_stato on marketplace.guasti (stato, scade_il);
create index if not exists guasti_artigiano on marketplace.guasti (artigiano_id, creato desc);
alter table marketplace.guasti enable row level security;
drop policy if exists guasti_miei on marketplace.guasti;
create policy guasti_miei on marketplace.guasti for select using (privato_id = auth.uid());
drop policy if exists guasti_admin on marketplace.guasti;
create policy guasti_admin on marketplace.guasti for select using (marketplace.is_admin());
grant select on marketplace.guasti to authenticated;

create table if not exists marketplace.recensioni (
  id           uuid primary key default gen_random_uuid(),
  guasto_id    uuid not null unique references marketplace.guasti (id) on delete cascade,
  azienda_id   uuid not null references auth.users (id) on delete cascade,
  voto         smallint not null check (voto between 1 and 5),
  testo        text not null default '' check (length(testo) <= 600),
  autore       text not null default '' check (length(autore) <= 60),
  risposta     text not null default '' check (length(risposta) <= 600),
  risposta_il  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists recensioni_azienda on marketplace.recensioni (azienda_id, created_at desc);
alter table marketplace.recensioni enable row level security;
drop policy if exists recensioni_tutti on marketplace.recensioni;
create policy recensioni_tutti on marketplace.recensioni for select using (true);
grant select on marketplace.recensioni to anon, authenticated;

create or replace function marketplace.artigiano_voto(p_azienda uuid)
returns numeric language sql stable security definer set search_path = marketplace, public as $$
  select round(avg(voto)::numeric, 1) from marketplace.recensioni where azienda_id = p_azienda;
$$;
grant execute on function marketplace.artigiano_voto(uuid) to anon, authenticated;

-- Il prossimo artigiano: verificato, del mestiere, con documenti e abbonamento (o prova), libero, che copre la zona,
-- non già passato; prima quello scelto dal privato, poi il più vicino, poi il voto migliore.
-- Urgente fuori dalle 8–20 solo a chi è reperibile di notte.
create or replace function marketplace.guasti_assegna(p_id uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  g marketplace.guasti%rowtype;
  cand uuid;
  ora int := extract(hour from (now() at time zone 'Europe/Rome'))::int;
begin
  select * into g from marketplace.guasti where id = p_id for update;
  if not found or g.stato not in ('cerca', 'assegnato') then return; end if;
  if g.tentativi >= 3 then
    update marketplace.guasti set stato = 'admin', artigiano_id = null, scade_il = null where id = p_id;
    return;
  end if;
  select a.azienda_id into cand
  from marketplace.artigiani a
  join marketplace.profiles p on p.id = a.azienda_id and p.verifica = 'verificato' and p.tipo_azienda = 'azienda_artigiani'
  where g.mestiere = any (a.mestieri) and a.libero
    and marketplace.azienda_puo_lavorare(a.azienda_id)
    and marketplace.prev_copre(a.azienda_id, g.provincia)
    and not (a.azienda_id = any (g.rifiutati))
    and (not g.urgente or a.notte or ora between 8 and 19)
  order by (a.azienda_id = g.scelto) desc, marketplace.prev_vicinanza(a.azienda_id, g.comune, g.provincia),
    marketplace.artigiano_voto(a.azienda_id) desc nulls last, random()
  limit 1;
  if cand is null then
    update marketplace.guasti set stato = 'admin', artigiano_id = null, scade_il = null where id = p_id;
    return;
  end if;
  update marketplace.guasti set stato = 'assegnato', artigiano_id = cand, offerto_il = now(),
    scade_il = now() + case when g.urgente then interval '15 minutes' else interval '2 hours' end,
    tentativi = tentativi + 1
  where id = p_id;
end;
$$;
revoke all on function marketplace.guasti_assegna(uuid) from public, anon, authenticated;

-- Il privato chiede (dalla sua dashboard: serve l'accesso). Restituisce il token della pagina guasto.html.
create or replace function marketplace.guasti_nuovo(p jsonb)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid; v_tok text; v_mail text := lower(btrim(coalesce(p->>'mail', '')));
begin
  if auth.uid() is null then raise exception 'serve_accesso'; end if;
  if length(coalesce(p->>'provincia', '')) <> 2 then raise exception 'serve_la_provincia'; end if;
  if (select count(*) from marketplace.guasti where privato_id = auth.uid() and creato > now() - interval '1 day') >= 5 then raise exception 'troppe_richieste'; end if;
  insert into marketplace.guasti (tipo, mestiere, descrizione, urgente, comune, provincia, indirizzo, nome, telefono, mail, privato_id, scelto)
  values (case when p->>'tipo' = 'trova' then 'trova' else 'guasto' end, left(coalesce(p->>'mestiere', ''), 40), left(coalesce(p->>'descrizione', ''), 800),
    coalesce((p->>'urgente')::boolean, false), left(coalesce(p->>'comune', ''), 80), upper(p->>'provincia'), left(coalesce(p->>'indirizzo', ''), 160),
    left(btrim(coalesce(p->>'nome', '')), 120), left(btrim(coalesce(p->>'telefono', '')), 30), v_mail, auth.uid(), nullif(p->>'scelto', '')::uuid)
  returning id, token into v_id, v_tok;
  perform marketplace.guasti_assegna(v_id);
  return v_tok;
end;
$$;
revoke all on function marketplace.guasti_nuovo(jsonb) from public, anon;
grant execute on function marketplace.guasti_nuovo(jsonb) to authenticated;

-- Artigiani della zona per «Trova artigiano» (nome, comune, voto; niente contatti).
create or replace function marketplace.artigiani_zona(p_provincia text, p_comune text, p_mestiere text)
returns table (id uuid, nome text, comune text, mestieri text[], voto numeric, recensioni int, libero boolean, vicinanza int)
language sql stable security definer set search_path = marketplace, public as $$
  select a.azienda_id, coalesce(p.nome, 'Artigiano'), coalesce(z.sede_comune, ''), a.mestieri,
    marketplace.artigiano_voto(a.azienda_id), (select count(*)::int from marketplace.recensioni r where r.azienda_id = a.azienda_id),
    a.libero, marketplace.prev_vicinanza(a.azienda_id, p_comune, p_provincia)
  from marketplace.artigiani a
  join marketplace.profiles p on p.id = a.azienda_id and p.verifica = 'verificato' and p.tipo_azienda = 'azienda_artigiani'
  left join marketplace.fornitori_zona z on z.azienda_id = a.azienda_id
  where (p_mestiere is null or p_mestiere = '' or p_mestiere = any (a.mestieri))
    and marketplace.azienda_puo_lavorare(a.azienda_id) and marketplace.prev_copre(a.azienda_id, p_provincia)
  order by 8, 5 desc nulls last
  limit 50;
$$;
revoke all on function marketplace.artigiani_zona(text, text, text) from public, anon;
grant execute on function marketplace.artigiani_zona(text, text, text) to authenticated;

-- Le richieste e gli interventi dell'artigiano. Contatti e indirizzo solo dopo «Accetto».
create or replace function marketplace.guasti_per_me()
returns table (id uuid, creato timestamptz, tipo text, mestiere text, descrizione text, urgente boolean, comune text, provincia text,
  stato text, scade_il timestamptz, accettato_il timestamptz, fatto_il timestamptz, importo numeric, nota_lavoro text,
  confermato_il timestamptz, garanzia_fino date, garanzia_il timestamptz, garanzia_nota text, fee numeric,
  nome text, telefono text, indirizzo text, mail text, voto smallint, recensione text, risposta text, recensione_id uuid)
language sql stable security definer set search_path = marketplace, public as $$
  select g.id, g.creato, g.tipo, g.mestiere, g.descrizione, g.urgente, g.comune, g.provincia,
    g.stato, g.scade_il, g.accettato_il, g.fatto_il, g.importo, g.nota_lavoro, g.confermato_il, g.garanzia_fino, g.garanzia_il, g.garanzia_nota, g.fee,
    case when g.stato in ('accettato', 'fatto', 'confermato') then g.nome else '' end,
    case when g.stato in ('accettato', 'fatto', 'confermato') then g.telefono else '' end,
    case when g.stato in ('accettato', 'fatto', 'confermato') then g.indirizzo else '' end,
    case when g.stato in ('accettato', 'fatto', 'confermato') then g.mail else '' end,
    r.voto, r.testo, r.risposta, r.id
  from marketplace.guasti g
  left join marketplace.recensioni r on r.guasto_id = g.id
  where g.artigiano_id = auth.uid() and (g.stato <> 'assegnato' or g.scade_il > now())
  order by g.creato desc
  limit 300;
$$;
revoke all on function marketplace.guasti_per_me() from public, anon;
grant execute on function marketplace.guasti_per_me() to authenticated;

create or replace function marketplace.guasto_accetta(p_id uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.guasti set stato = 'accettato', accettato_il = now(), scade_il = null
  where id = p_id and artigiano_id = auth.uid() and stato = 'assegnato' and scade_il > now();
  if not found then raise exception 'non_piu_disponibile'; end if;
end;
$$;

create or replace function marketplace.guasto_rifiuta(p_id uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.guasti set rifiutati = array_append(rifiutati, auth.uid())
  where id = p_id and artigiano_id = auth.uid() and stato = 'assegnato';
  if not found then raise exception 'non_si_puo'; end if;
  perform marketplace.guasti_assegna(p_id);
end;
$$;

create or replace function marketplace.guasto_fatto(p_id uuid, p_importo numeric, p_nota text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.guasti set stato = 'fatto', fatto_il = now(), importo = p_importo, nota_lavoro = left(coalesce(p_nota, ''), 500)
  where id = p_id and artigiano_id = auth.uid() and stato = 'accettato';
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;

create or replace function marketplace.recensione_rispondi(p_id uuid, p_testo text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.recensioni set risposta = left(btrim(p_testo), 600), risposta_il = now()
  where id = p_id and azienda_id = auth.uid() and risposta_il is null and length(btrim(p_testo)) > 0;
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;
revoke all on function marketplace.guasto_accetta(uuid) from public, anon;
revoke all on function marketplace.guasto_rifiuta(uuid) from public, anon;
revoke all on function marketplace.guasto_fatto(uuid, numeric, text) from public, anon;
revoke all on function marketplace.recensione_rispondi(uuid, text) from public, anon;
grant execute on function marketplace.guasto_accetta(uuid), marketplace.guasto_rifiuta(uuid), marketplace.guasto_fatto(uuid, numeric, text), marketplace.recensione_rispondi(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. La pagina del privato (guasto.html, anche dal link nella mail)
-- ---------------------------------------------------------------------------
create or replace function marketplace.guasto_info(p_token text)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare g marketplace.guasti%rowtype; r marketplace.recensioni%rowtype; v_art text; v_tel text;
begin
  select * into g from marketplace.guasti where token = p_token;
  if not found then return null; end if;
  select * into r from marketplace.recensioni where guasto_id = g.id;
  if g.stato in ('accettato', 'fatto', 'confermato') then
    select coalesce(p.nome, 'Il tuo artigiano') into v_art from marketplace.profiles p where p.id = g.artigiano_id;
  end if;
  return jsonb_build_object('stato', g.stato, 'tipo', g.tipo, 'mestiere', g.mestiere, 'descrizione', g.descrizione, 'urgente', g.urgente,
    'comune', g.comune, 'creato', g.creato, 'nome', split_part(g.nome, ' ', 1), 'artigiano', v_art, 'tentativi', g.tentativi,
    'accettato_il', g.accettato_il, 'fatto_il', g.fatto_il, 'importo', g.importo, 'nota_lavoro', g.nota_lavoro,
    'confermato_il', g.confermato_il, 'garanzia_fino', g.garanzia_fino, 'garanzia_il', g.garanzia_il,
    'recensione', case when r.id is null then null else jsonb_build_object('voto', r.voto, 'testo', r.testo, 'risposta', r.risposta) end);
end;
$$;

create or replace function marketplace.guasto_conferma(p_token text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.guasti set stato = 'confermato', confermato_il = now(), garanzia_fino = current_date + 30
  where token = p_token and stato = 'fatto';
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;

create or replace function marketplace.guasto_annulla(p_token text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.guasti set stato = 'annullato', scade_il = null where token = p_token and stato in ('cerca', 'assegnato', 'admin');
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;

create or replace function marketplace.guasto_recensione(p_token text, p_voto int, p_testo text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare g marketplace.guasti%rowtype;
begin
  select * into g from marketplace.guasti where token = p_token;
  if not found or g.stato <> 'confermato' or g.artigiano_id is null then raise exception 'non_si_puo'; end if;
  insert into marketplace.recensioni (guasto_id, azienda_id, voto, testo, autore)
  values (g.id, g.artigiano_id, greatest(1, least(5, p_voto)), left(coalesce(p_testo, ''), 600), split_part(g.nome, ' ', 1) || ' ' || left(split_part(g.nome, ' ', 2), 1) || '.')
  on conflict (guasto_id) do nothing;
end;
$$;

create or replace function marketplace.guasto_garanzia(p_token text, p_nota text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.guasti set garanzia_il = now(), garanzia_nota = left(coalesce(p_nota, ''), 500), avvisato_stato = ''
  where token = p_token and stato = 'confermato' and garanzia_fino >= current_date and garanzia_il is null;
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;
revoke all on function marketplace.guasto_info(text), marketplace.guasto_conferma(text), marketplace.guasto_annulla(text), marketplace.guasto_recensione(text, int, text), marketplace.guasto_garanzia(text, text) from public;
grant execute on function marketplace.guasto_info(text), marketplace.guasto_conferma(text), marketplace.guasto_annulla(text), marketplace.guasto_recensione(text, int, text), marketplace.guasto_garanzia(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Il giro ogni 5 minuti (lo chiama preventivi-avvisa, evento «guasti»): passa al prossimo chi non ha risposto,
--    conferma da solo i lavori fatti da più di 7 giorni.
-- ---------------------------------------------------------------------------
create or replace function marketplace.guasti_giro()
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare g record; passati int := 0; confermati int := 0;
begin
  for g in select id, artigiano_id from marketplace.guasti where stato = 'assegnato' and scade_il < now() loop
    update marketplace.guasti set rifiutati = array_append(rifiutati, g.artigiano_id) where id = g.id;
    perform marketplace.guasti_assegna(g.id);
    passati := passati + 1;
  end loop;
  update marketplace.guasti set stato = 'confermato', confermato_il = now(), confermato_auto = true, garanzia_fino = current_date + 30
  where stato = 'fatto' and fatto_il < now() - interval '7 days';
  get diagnostics confermati = row_count;
  return jsonb_build_object('passati', passati, 'confermati', confermati);
end;
$$;
revoke all on function marketplace.guasti_giro() from public, anon, authenticated;
grant execute on function marketplace.guasti_giro() to service_role;

-- ---------------------------------------------------------------------------
-- 5. Admin: aziende (documenti, prova, abbonamento) e guasti
-- ---------------------------------------------------------------------------
create or replace function marketplace.aziende_per_admin()
returns table (id uuid, nome text, mail text, tipo_azienda text, creato timestamptz, prova_dal date, attiva_fino date, documenti_ok boolean,
  documenti jsonb, interventi_mese int, fee_mese numeric)
language sql stable security definer set search_path = marketplace, public, auth as $$
  select p.id, p.nome, u.email::text, p.tipo_azienda, u.created_at, s.prova_dal, s.attiva_fino, coalesce(s.documenti_ok, false),
    coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'tipo', d.tipo, 'file', d.file_path, 'scadenza', d.scadenza, 'stato', d.stato, 'nota', d.nota) order by d.created_at desc)
      from marketplace.aziende_documenti d where d.azienda_id = p.id), '[]'::jsonb),
    (select count(*)::int from marketplace.guasti g where g.artigiano_id = p.id and g.stato = 'confermato' and g.confermato_il >= date_trunc('month', now())),
    (select coalesce(sum(g.fee), 0) from marketplace.guasti g where g.artigiano_id = p.id and g.stato = 'confermato' and g.confermato_il >= date_trunc('month', now()))
  from marketplace.profiles p
  join auth.users u on u.id = p.id
  left join marketplace.aziende_stato s on s.azienda_id = p.id
  where marketplace.is_admin() and p.famiglia = 'azienda'
  order by u.created_at desc
  limit 500;
$$;
revoke all on function marketplace.aziende_per_admin() from public, anon;
grant execute on function marketplace.aziende_per_admin() to authenticated;

create or replace function marketplace.azienda_admin_stato(p_azienda uuid, p_documenti_ok boolean, p_attiva_fino date, p_note text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  insert into marketplace.aziende_stato (azienda_id) values (p_azienda) on conflict (azienda_id) do nothing;
  update marketplace.aziende_stato set documenti_ok = p_documenti_ok, attiva_fino = p_attiva_fino, note = left(coalesce(p_note, ''), 500),
    verificata_il = case when p_documenti_ok and not documenti_ok then now() else verificata_il end, updated_at = now()
  where azienda_id = p_azienda;
end;
$$;
revoke all on function marketplace.azienda_admin_stato(uuid, boolean, date, text) from public, anon;
grant execute on function marketplace.azienda_admin_stato(uuid, boolean, date, text) to authenticated;

create or replace function marketplace.guasti_admin()
returns table (id uuid, token text, creato timestamptz, tipo text, mestiere text, descrizione text, urgente boolean, comune text, provincia text,
  nome text, telefono text, mail text, stato text, artigiano text, tentativi smallint, importo numeric, garanzia_il timestamptz, garanzia_nota text)
language sql stable security definer set search_path = marketplace, public as $$
  select g.id, g.token, g.creato, g.tipo, g.mestiere, g.descrizione, g.urgente, g.comune, g.provincia, g.nome, g.telefono, g.mail, g.stato,
    coalesce(p.nome, ''), g.tentativi, g.importo, g.garanzia_il, g.garanzia_nota
  from marketplace.guasti g left join marketplace.profiles p on p.id = g.artigiano_id
  where marketplace.is_admin()
  order by (g.stato = 'admin') desc, (g.garanzia_il is not null and g.stato = 'confermato') desc, g.creato desc
  limit 300;
$$;
revoke all on function marketplace.guasti_admin() from public, anon;
grant execute on function marketplace.guasti_admin() to authenticated;

-- L'admin affida a mano un guasto rimasto senza artigiano.
create or replace function marketplace.guasto_admin_affida(p_id uuid, p_artigiano uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  update marketplace.guasti set stato = 'assegnato', artigiano_id = p_artigiano, offerto_il = now(), scade_il = now() + interval '2 hours'
  where id = p_id and stato in ('admin', 'cerca', 'assegnato');
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;
revoke all on function marketplace.guasto_admin_affida(uuid, uuid) from public, anon;
grant execute on function marketplace.guasto_admin_affida(uuid, uuid) to authenticated;

commit;

-- Ogni 5 minuti: il giro dei guasti (dopo aver ripubblicato preventivi-avvisa con l'evento «guasti»).
-- create extension if not exists pg_cron; create extension if not exists pg_net;
-- select cron.unschedule(jobid) from cron.job where jobname = 'guasti-giro';
-- select cron.schedule('guasti-giro', '*/5 * * * *', $$ select net.http_post(url := 'https://edsvmnxojsmknjuhobqa.supabase.co/functions/v1/preventivi-avvisa', headers := '{"Content-Type": "application/json"}'::jsonb, body := '{"evento": "guasti"}'::jsonb); $$);

-- Controllo (sola lettura):
-- select to_regclass('marketplace.guasti'), to_regclass('marketplace.artigiani'), to_regclass('marketplace.aziende_stato'), to_regclass('marketplace.aziende_documenti'), to_regclass('marketplace.recensioni');
