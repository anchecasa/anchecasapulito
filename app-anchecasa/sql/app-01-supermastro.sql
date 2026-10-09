-- ============================================================================
-- APP ANCHECASA · PARTE 1 — profili dell'app, SuperMastro, artigiani, recensioni
-- Preparato il 09.10.2026. Progetto Supabase edsvmnxojsmknjuhobqa, schema "marketplace".
--
-- Regole:
--   - Aggiunge SOLO tabelle e funzioni NUOVE, tutte con il prefisso app_.
--     Non cambia nessuna tabella, tipo o funzione usata dai siti e dall'area privata.
--   - Si può rilanciare (idempotente).
--   - Si esegue a mano: Supabase → SQL Editor → incolla → Run.
--   - Dopo: Storage, bucket "supermastro" creato qui sotto (privato).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. RUOLI DELL'APP — una persona può avere più ruoli (es. privato e segnalatore).
--    Da soli ci si dà solo "privato" e "artigiano"; gli altri li assegna l'admin.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_ruoli (
  utente uuid not null references auth.users(id) on delete cascade,
  ruolo text not null check (ruolo in (
    'privato', 'artigiano', 'impresa', 'fornitore', 'cliente', 'operatore',
    'agente', 'subagente', 'capoarea', 'sviluppo', 'consulente', 'partner'
  )),
  creato timestamptz not null default now(),
  primary key (utente, ruolo)
);
alter table marketplace.app_ruoli enable row level security;

drop policy if exists app_ruoli_leggi on marketplace.app_ruoli;
create policy app_ruoli_leggi on marketplace.app_ruoli
  for select using (utente = auth.uid() or marketplace.is_admin());

drop policy if exists app_ruoli_da_solo on marketplace.app_ruoli;
create policy app_ruoli_da_solo on marketplace.app_ruoli
  for insert with check (utente = auth.uid() and ruolo in ('privato', 'artigiano'));

drop policy if exists app_ruoli_admin on marketplace.app_ruoli;
create policy app_ruoli_admin on marketplace.app_ruoli
  for all using (marketplace.is_admin()) with check (marketplace.is_admin());

-- ---------------------------------------------------------------------------
-- 2. ARTIGIANI DEL PRONTO INTERVENTO
--    Compaiono ai privati solo se l'admin li ha verificati e se sono disponibili.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_artigiani (
  utente uuid primary key references auth.users(id) on delete cascade,
  nome_attivita text not null check (length(btrim(nome_attivita)) between 2 and 80),
  mestieri text[] not null default '{}' check (mestieri <@ array['idraulico', 'elettricista', 'fabbro', 'muratore', 'imbianchino', 'falegname', 'serramentista', 'caldaista', 'tecnico elettrodomestici', 'tecnico condizionatori', 'vetraio', 'giardiniere', 'impresa di pulizie', 'antennista', 'altro']::text[] and cardinality(mestieri) <= 15),
  telefono text not null default '' check (length(telefono) <= 30),
  citta text not null default '' check (length(citta) <= 80),
  lat double precision,
  lng double precision,
  raggio_km int not null default 10 check (raggio_km between 1 and 50),
  disponibile boolean not null default true,
  orari text not null default '' check (length(orari) <= 120),
  piva text not null default '' check (length(piva) <= 20),
  descrizione text not null default '' check (length(descrizione) <= 400),
  stato text not null default 'attesa' check (stato in ('attesa', 'verificato', 'sospeso')),
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
alter table marketplace.app_artigiani enable row level security;

drop policy if exists app_artigiani_suo on marketplace.app_artigiani;
create policy app_artigiani_suo on marketplace.app_artigiani
  for select using (utente = auth.uid() or marketplace.is_admin());

drop policy if exists app_artigiani_crea on marketplace.app_artigiani;
create policy app_artigiani_crea on marketplace.app_artigiani
  for insert with check (utente = auth.uid() and stato = 'attesa');

drop policy if exists app_artigiani_modifica on marketplace.app_artigiani;
create policy app_artigiani_modifica on marketplace.app_artigiani
  for update using (utente = auth.uid() or marketplace.is_admin())
  with check (utente = auth.uid() or marketplace.is_admin());

-- L'artigiano non può cambiarsi lo stato da solo: lo decide solo l'admin.
create or replace function marketplace.app_artigiani_blocca_stato()
returns trigger
language plpgsql
set search_path = marketplace, public
as $$
begin
  if new.stato is distinct from old.stato and not marketplace.is_admin() then
    new.stato := old.stato;
  end if;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_artigiani_blocca_stato on marketplace.app_artigiani;
create trigger app_artigiani_blocca_stato before update on marketplace.app_artigiani
  for each row execute function marketplace.app_artigiani_blocca_stato();

-- ---------------------------------------------------------------------------
-- 3. RICHIESTE DI SUPERMASTRO — nascono dall'analisi del video del privato.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_richieste (
  id uuid primary key default gen_random_uuid(),
  privato uuid not null default auth.uid() references auth.users(id) on delete cascade,
  analisi jsonb not null default '{}'::jsonb,
  problema text not null default '' check (length(problema) <= 80),
  mestiere text not null default 'altro' check (mestiere in ('idraulico', 'elettricista', 'fabbro', 'muratore', 'imbianchino', 'falegname', 'serramentista', 'caldaista', 'tecnico elettrodomestici', 'tecnico condizionatori', 'vetraio', 'giardiniere', 'impresa di pulizie', 'antennista', 'altro')),
  urgenza text not null default 'media' check (urgenza in ('bassa', 'media', 'alta')),
  pericolo boolean not null default false,
  citta text not null default '' check (length(citta) <= 80),
  lat double precision,
  lng double precision,
  telefono text not null default '' check (length(telefono) <= 30),
  nota text not null default '' check (length(nota) <= 400),
  foto int not null default 0 check (foto between 0 and 4),
  stato text not null default 'nuova' check (stato in ('nuova', 'inviata', 'accettata', 'fatta', 'annullata')),
  artigiano uuid references auth.users(id) on delete set null,
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
create index if not exists app_richieste_privato_idx on marketplace.app_richieste (privato, creato desc);
alter table marketplace.app_richieste enable row level security;

drop policy if exists app_richieste_privato on marketplace.app_richieste;
create policy app_richieste_privato on marketplace.app_richieste
  for select using (privato = auth.uid() or marketplace.is_admin());

-- Le richieste NON si creano dal telefono: le crea la funzione supermastro-analisi dopo l'analisi
-- (così l'analisi non si può falsificare). Nessuna policy di insert per gli utenti.
drop policy if exists app_richieste_crea on marketplace.app_richieste;

-- Il privato può solo annullare o aggiornare i suoi dati (citta, telefono, nota, foto);
-- accettazione e chiusura passano dalle funzioni qui sotto.
drop policy if exists app_richieste_modifica on marketplace.app_richieste;
create policy app_richieste_modifica on marketplace.app_richieste
  for update using (privato = auth.uid()) with check (privato = auth.uid());

create or replace function marketplace.app_richieste_blocca()
returns trigger
language plpgsql
set search_path = marketplace, public
as $$
begin
  -- Le funzioni dell'app (security definer) e la funzione supermastro-analisi possono tutto.
  if current_user not in ('authenticated', 'anon') then
    new.aggiornato := now();
    return new;
  end if;
  -- Il privato: a richiesta presa o chiusa non cambia più niente.
  if old.stato not in ('nuova', 'inviata') then
    return old;
  end if;
  new.id := old.id;
  new.privato := old.privato;
  new.artigiano := old.artigiano;
  new.analisi := old.analisi;
  new.problema := old.problema;
  new.mestiere := old.mestiere;
  new.urgenza := old.urgenza;
  new.pericolo := old.pericolo;
  new.creato := old.creato;
  if new.stato is distinct from old.stato and new.stato <> 'annullata' then
    new.stato := old.stato;
  end if;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_richieste_blocca on marketplace.app_richieste;
create trigger app_richieste_blocca before update on marketplace.app_richieste
  for each row execute function marketplace.app_richieste_blocca();

-- ---------------------------------------------------------------------------
-- 4. INVII — a quali artigiani iscritti il privato ha mandato video e analisi.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_invii (
  richiesta uuid not null references marketplace.app_richieste(id) on delete cascade,
  artigiano uuid not null references marketplace.app_artigiani(utente) on delete cascade,
  stato text not null default 'inviata' check (stato in ('inviata', 'accettata', 'rifiutata', 'chiusa')),
  creato timestamptz not null default now(),
  risposto timestamptz,
  primary key (richiesta, artigiano)
);
create index if not exists app_invii_artigiano_idx on marketplace.app_invii (artigiano, creato desc);
alter table marketplace.app_invii enable row level security;

drop policy if exists app_invii_leggi on marketplace.app_invii;
create policy app_invii_leggi on marketplace.app_invii
  for select using (
    artigiano = auth.uid()
    or exists (select 1 from marketplace.app_richieste r where r.id = richiesta and r.privato = auth.uid())
    or marketplace.is_admin()
  );
-- Gli invii si creano solo con la funzione app_invia (controlla artigiano verificato e limiti).

-- Il privato manda la richiesta a uno o più artigiani iscritti e verificati (max 5).
create or replace function marketplace.app_invia(p_richiesta uuid, p_artigiani uuid[])
returns int
language plpgsql
security definer
set search_path = marketplace, public
as $$
declare
  v_r marketplace.app_richieste%rowtype;
  v_n int := 0;
  v_gia int;
  v_a uuid;
  v_righe int;
begin
  select * into v_r from marketplace.app_richieste where id = p_richiesta for update;
  if not found or v_r.privato <> auth.uid() then raise exception 'richiesta_non_tua'; end if;
  if v_r.stato not in ('nuova', 'inviata') then raise exception 'richiesta_chiusa'; end if;
  select count(*) into v_gia from marketplace.app_invii where richiesta = p_richiesta;
  if coalesce(array_length(p_artigiani, 1), 0) = 0 or v_gia + array_length(p_artigiani, 1) > 5 then raise exception 'da_1_a_5_artigiani'; end if;
  foreach v_a in array p_artigiani loop
    if v_a <> auth.uid() and exists (select 1 from marketplace.app_artigiani a where a.utente = v_a and a.stato = 'verificato' and a.disponibile) then
      insert into marketplace.app_invii (richiesta, artigiano) values (p_richiesta, v_a) on conflict do nothing;
      get diagnostics v_righe = row_count;
      v_n := v_n + v_righe;
    end if;
  end loop;
  if v_n > 0 then
    update marketplace.app_richieste set stato = 'inviata' where id = p_richiesta and stato = 'nuova';
  end if;
  return v_n;
end;
$$;

-- L'artigiano risponde: accetta (e vede il telefono del privato) o rifiuta.
create or replace function marketplace.app_rispondi(p_richiesta uuid, p_accetta boolean)
returns text
language plpgsql
security definer
set search_path = marketplace, public
as $$
declare
  v_r marketplace.app_richieste%rowtype;
begin
  if not exists (select 1 from marketplace.app_invii where richiesta = p_richiesta and artigiano = auth.uid() and stato = 'inviata') then
    raise exception 'invio_non_trovato';
  end if;
  if not exists (select 1 from marketplace.app_artigiani where utente = auth.uid() and stato = 'verificato') then
    raise exception 'artigiano_non_verificato';
  end if;
  select * into v_r from marketplace.app_richieste where id = p_richiesta for update;
  if v_r.privato = auth.uid() then raise exception 'richiesta_tua'; end if;
  if not p_accetta then
    update marketplace.app_invii set stato = 'rifiutata', risposto = now() where richiesta = p_richiesta and artigiano = auth.uid();
    return '';
  end if;
  if v_r.stato <> 'inviata' or v_r.artigiano is not null then raise exception 'gia_presa'; end if;
  update marketplace.app_invii set stato = 'accettata', risposto = now() where richiesta = p_richiesta and artigiano = auth.uid();
  update marketplace.app_invii set stato = 'chiusa', risposto = coalesce(risposto, now()) where richiesta = p_richiesta and artigiano <> auth.uid() and stato = 'inviata';
  update marketplace.app_richieste set stato = 'accettata', artigiano = auth.uid() where id = p_richiesta;
  return v_r.telefono;
end;
$$;

-- Per il privato: a chi ha mandato la richiesta e chi l'ha presa (nome e telefono dell'artigiano).
create or replace function marketplace.app_invii_mia_richiesta(p_richiesta uuid)
returns table (artigiano uuid, nome_attivita text, telefono text, stato text, risposto timestamptz)
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select i.artigiano, a.nome_attivita, a.telefono, i.stato, i.risposto
  from marketplace.app_invii i
  join marketplace.app_artigiani a on a.utente = i.artigiano
  join marketplace.app_richieste r on r.id = i.richiesta
  where i.richiesta = p_richiesta and (r.privato = auth.uid() or marketplace.is_admin())
  order by i.creato;
$$;

-- Le richieste che l'artigiano ha ricevuto. Il telefono del privato compare solo dopo che ha accettato.
create or replace function marketplace.app_richieste_ricevute()
returns table (
  id uuid, stato_invio text, stato text, problema text, mestiere text, urgenza text, pericolo boolean,
  analisi jsonb, citta text, lat double precision, lng double precision, foto int, nota text,
  nome_privato text, telefono text, creato timestamptz
)
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select r.id, i.stato, r.stato, r.problema, r.mestiere, r.urgenza, r.pericolo, r.analisi, r.citta,
         case when i.stato = 'accettata' then r.lat else round(r.lat::numeric, 2)::double precision end,
         case when i.stato = 'accettata' then r.lng else round(r.lng::numeric, 2)::double precision end,
         r.foto, r.nota,
         split_part(coalesce(p.nome, ''), ' ', 1),
         case when i.stato = 'accettata' then r.telefono else '' end,
         i.creato
  from marketplace.app_invii i
  join marketplace.app_richieste r on r.id = i.richiesta
  left join marketplace.profiles p on p.id = r.privato
  where i.artigiano = auth.uid()
    and exists (select 1 from marketplace.app_artigiani a where a.utente = auth.uid() and a.stato <> 'sospeso')
  order by i.creato desc
  limit 500;
$$;

-- ---------------------------------------------------------------------------
-- 5. RECENSIONI — solo per lavori veri: il privato recensisce l'artigiano che ha accettato.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_recensioni (
  id uuid primary key default gen_random_uuid(),
  richiesta uuid not null unique references marketplace.app_richieste(id) on delete cascade,
  artigiano uuid not null references auth.users(id) on delete cascade,
  autore uuid not null references auth.users(id) on delete cascade,
  voto numeric(2,1) not null check (voto between 1 and 5),
  voti jsonb not null default '{}'::jsonb,
  testo text not null default '' check (length(testo) <= 600),
  creato timestamptz not null default now()
);
create index if not exists app_recensioni_artigiano_idx on marketplace.app_recensioni (artigiano, creato desc);
alter table marketplace.app_recensioni enable row level security;

drop policy if exists app_recensioni_leggi on marketplace.app_recensioni;
create policy app_recensioni_leggi on marketplace.app_recensioni
  for select using (autore = auth.uid() or artigiano = auth.uid() or marketplace.is_admin());
-- Si scrivono solo con app_recensisci.

create or replace function marketplace.app_recensisci(p_richiesta uuid, p_voti jsonb, p_testo text)
returns uuid
language plpgsql
security definer
set search_path = marketplace, public
as $$
declare
  v_r marketplace.app_richieste%rowtype;
  v_voto numeric(2,1);
  v_id uuid;
  v_voti jsonb := '{}'::jsonb;
  k text;
begin
  select * into v_r from marketplace.app_richieste where id = p_richiesta;
  if not found or v_r.privato <> auth.uid() then raise exception 'richiesta_non_tua'; end if;
  if v_r.artigiano is null or v_r.artigiano = v_r.privato then raise exception 'nessun_artigiano'; end if;
  if v_r.stato <> 'accettata' then raise exception 'richiesta_non_accettata'; end if;
  foreach k in array array['qualita', 'puntualita', 'pulizia', 'prezzo', 'comunicazione'] loop
    if (p_voti ? k) and (p_voti->>k) ~ '^[1-5]$' then
      v_voti := v_voti || jsonb_build_object(k, (p_voti->>k)::int);
    end if;
  end loop;
  if v_voti = '{}'::jsonb then raise exception 'mancano_i_voti'; end if;
  select round(avg(value::int), 1) into v_voto from jsonb_each_text(v_voti);
  insert into marketplace.app_recensioni (richiesta, artigiano, autore, voto, voti, testo)
  values (p_richiesta, v_r.artigiano, auth.uid(), v_voto, v_voti, left(coalesce(p_testo, ''), 600))
  returning id into v_id;
  update marketplace.app_richieste set stato = 'fatta' where id = p_richiesta;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. ARTIGIANI ISCRITTI VICINI — quello che vede il privato (prima degli artigiani di Google).
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_artigiani_vicini(p_lat double precision, p_lng double precision, p_mestiere text)
returns table (
  utente uuid, nome_attivita text, mestieri text[], telefono text, citta text, orari text, descrizione text,
  lat double precision, lng double precision, km double precision, voto numeric, recensioni bigint
)
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select x.utente, x.nome_attivita, x.mestieri, x.telefono, x.citta, x.orari, x.descrizione, x.lat, x.lng, x.km, x.voto, x.recensioni
  from (
    select a.utente, a.nome_attivita, a.mestieri, a.telefono, a.citta, a.orari, a.descrizione, a.lat, a.lng,
      2 * 6371 * asin(sqrt(
        power(sin(radians(a.lat - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(a.lat)) * power(sin(radians(a.lng - p_lng) / 2), 2)
      )) as km,
      (select round(avg(v.voto)::numeric, 1) from marketplace.app_recensioni v where v.artigiano = a.utente) as voto,
      (select count(*) from marketplace.app_recensioni v where v.artigiano = a.utente) as recensioni,
      a.raggio_km
    from marketplace.app_artigiani a
    where a.stato = 'verificato' and a.disponibile
      and a.lat is not null and a.lng is not null
      and (coalesce(p_mestiere, '') in ('', 'altro') or p_mestiere = any (a.mestieri))
  ) x
  where x.km <= greatest(x.raggio_km, 5)
  order by x.km
  limit 10;
$$;

-- ---------------------------------------------------------------------------
-- 7. PASSAGGIO DA ARTIGIANO A IMPRESA — la richiesta la decide l'admin.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_passaggi_impresa (
  id uuid primary key default gen_random_uuid(),
  artigiano uuid not null default auth.uid() references auth.users(id) on delete cascade,
  stato text not null default 'richiesta' check (stato in ('richiesta', 'approvata', 'rifiutata')),
  nota text not null default '' check (length(nota) <= 400),
  creato timestamptz not null default now(),
  deciso timestamptz
);
alter table marketplace.app_passaggi_impresa enable row level security;

drop policy if exists app_passaggi_leggi on marketplace.app_passaggi_impresa;
create policy app_passaggi_leggi on marketplace.app_passaggi_impresa
  for select using (artigiano = auth.uid() or marketplace.is_admin());
drop policy if exists app_passaggi_crea on marketplace.app_passaggi_impresa;
create policy app_passaggi_crea on marketplace.app_passaggi_impresa
  for insert with check (artigiano = auth.uid() and stato = 'richiesta'
    and exists (select 1 from marketplace.app_artigiani a where a.utente = auth.uid() and a.stato = 'verificato'));
create unique index if not exists app_passaggi_una_aperta on marketplace.app_passaggi_impresa (artigiano) where stato = 'richiesta';
drop policy if exists app_passaggi_admin on marketplace.app_passaggi_impresa;
create policy app_passaggi_admin on marketplace.app_passaggi_impresa
  for update using (marketplace.is_admin()) with check (marketplace.is_admin());

-- ---------------------------------------------------------------------------
-- 8. SEGNALAZIONI DEI PRIVATI («Segnala e guadagna»).
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_segnalazioni (
  id uuid primary key default gen_random_uuid(),
  segnalatore uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('ristrutturazione', 'azienda', 'artigiano')),
  nome text not null check (length(btrim(nome)) between 2 and 80),
  telefono text not null default '' check (length(telefono) <= 30),
  note text not null default '' check (length(note) <= 400),
  stato text not null default 'inviata' check (stato in ('inviata', 'in_corso', 'partita', 'non_interessato')),
  creato timestamptz not null default now()
);
alter table marketplace.app_segnalazioni enable row level security;

drop policy if exists app_segnalazioni_suo on marketplace.app_segnalazioni;
create policy app_segnalazioni_suo on marketplace.app_segnalazioni
  for select using (segnalatore = auth.uid() or marketplace.is_admin());
drop policy if exists app_segnalazioni_crea on marketplace.app_segnalazioni;
create or replace function marketplace.app_segnalazioni_oggi()
returns bigint
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select count(*) from marketplace.app_segnalazioni where segnalatore = auth.uid() and creato > now() - interval '1 day';
$$;
revoke all on function marketplace.app_segnalazioni_oggi() from public, anon;
grant execute on function marketplace.app_segnalazioni_oggi() to authenticated;
create policy app_segnalazioni_crea on marketplace.app_segnalazioni
  for insert with check (segnalatore = auth.uid() and stato = 'inviata' and marketplace.app_segnalazioni_oggi() < 10);
drop policy if exists app_segnalazioni_admin on marketplace.app_segnalazioni;
create policy app_segnalazioni_admin on marketplace.app_segnalazioni
  for update using (marketplace.is_admin()) with check (marketplace.is_admin());

-- ---------------------------------------------------------------------------
-- 9. REGISTRO DELLE ANALISI — serve alla funzione supermastro-analisi per il limite giornaliero.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_analisi_log (
  id bigint generated always as identity primary key,
  utente uuid not null default auth.uid() references auth.users(id) on delete cascade,
  motore text not null default '',
  creato timestamptz not null default now()
);
create index if not exists app_analisi_log_idx on marketplace.app_analisi_log (utente, creato desc);
alter table marketplace.app_analisi_log enable row level security;
drop policy if exists app_analisi_log_suo on marketplace.app_analisi_log;
create policy app_analisi_log_suo on marketplace.app_analisi_log
  for select using (utente = auth.uid() or marketplace.is_admin());
drop policy if exists app_analisi_log_crea on marketplace.app_analisi_log;

-- La funzione supermastro-analisi prenota l'analisi PRIMA di chiamare l'intelligenza artificiale:
-- conta e registra in un colpo solo (anche con richieste in parallelo). Limite per persona e limite totale.
create or replace function marketplace.app_prenota_analisi(p_utente uuid, p_max_utente int, p_max_totale int, p_motore text)
returns boolean
language plpgsql
security definer
set search_path = marketplace, public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('app_analisi'));
  if (select count(*) from marketplace.app_analisi_log where utente = p_utente and creato > now() - interval '1 day') >= p_max_utente then
    return false;
  end if;
  if (select count(*) from marketplace.app_analisi_log where creato > now() - interval '1 day') >= p_max_totale then
    return false;
  end if;
  insert into marketplace.app_analisi_log (utente, motore) values (p_utente, left(coalesce(p_motore, ''), 40));
  return true;
end;
$$;
revoke all on function marketplace.app_prenota_analisi(uuid, int, int, text) from public, anon, authenticated;
grant execute on function marketplace.app_prenota_analisi(uuid, int, int, text) to service_role;

-- ---------------------------------------------------------------------------
-- 10. NUMERI PER L'ADMIN
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_numeri_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = marketplace, public
as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  return jsonb_build_object(
    'analisi_30g', (select count(*) from marketplace.app_analisi_log where creato > now() - interval '30 days'),
    'richieste_30g', (select count(*) from marketplace.app_richieste where creato > now() - interval '30 days'),
    'inviate_30g', (select count(*) from marketplace.app_richieste where creato > now() - interval '30 days' and stato <> 'nuova'),
    'accettate_30g', (select count(*) from marketplace.app_richieste where creato > now() - interval '30 days' and artigiano is not null),
    'artigiani_attesa', (select count(*) from marketplace.app_artigiani where stato = 'attesa'),
    'artigiani_verificati', (select count(*) from marketplace.app_artigiani where stato = 'verificato'),
    'passaggi_attesa', (select count(*) from marketplace.app_passaggi_impresa where stato = 'richiesta'),
    'segnalazioni_nuove', (select count(*) from marketplace.app_segnalazioni where stato = 'inviata'),
    'media_voti', (select round(avg(voto)::numeric, 1) from marketplace.app_recensioni),
    'recensioni', (select count(*) from marketplace.app_recensioni)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. PERMESSI SULLE FUNZIONI — solo utenti entrati.
-- ---------------------------------------------------------------------------
revoke all on function marketplace.app_invia(uuid, uuid[]) from public, anon;
revoke all on function marketplace.app_rispondi(uuid, boolean) from public, anon;
revoke all on function marketplace.app_richieste_ricevute() from public, anon;
revoke all on function marketplace.app_artigiani_vicini(double precision, double precision, text) from public, anon;
revoke all on function marketplace.app_recensisci(uuid, jsonb, text) from public, anon;
revoke all on function marketplace.app_numeri_admin() from public, anon;
revoke all on function marketplace.app_invii_mia_richiesta(uuid) from public, anon;
grant execute on function marketplace.app_invia(uuid, uuid[]) to authenticated;
grant execute on function marketplace.app_rispondi(uuid, boolean) to authenticated;
grant execute on function marketplace.app_richieste_ricevute() to authenticated;
grant execute on function marketplace.app_artigiani_vicini(double precision, double precision, text) to authenticated;
grant execute on function marketplace.app_recensisci(uuid, jsonb, text) to authenticated;
grant execute on function marketplace.app_numeri_admin() to authenticated;
grant execute on function marketplace.app_invii_mia_richiesta(uuid) to authenticated;

grant select, insert, update on marketplace.app_ruoli, marketplace.app_artigiani,
  marketplace.app_passaggi_impresa, marketplace.app_segnalazioni to authenticated;
revoke insert, update on marketplace.app_richieste from authenticated, anon;
grant select on marketplace.app_richieste to authenticated;
grant update (citta, lat, lng, telefono, nota, foto, stato) on marketplace.app_richieste to authenticated;
grant all on marketplace.app_richieste, marketplace.app_analisi_log to service_role;
grant delete on marketplace.app_ruoli to authenticated;
grant select on marketplace.app_invii, marketplace.app_recensioni to authenticated;
grant select on marketplace.app_analisi_log to authenticated;
revoke insert on marketplace.app_analisi_log from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 12. FOTO DEL GUASTO (Storage, bucket privato "supermastro").
--     Percorso: <id richiesta>/<n>.jpg. Le vedono il privato, gli artigiani a cui l'ha mandata e l'admin.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('supermastro', 'supermastro', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create or replace function marketplace.app_puo_vedere_foto(p_nome text)
returns boolean
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select exists (
    select 1 from marketplace.app_richieste r
    where r.id::text = split_part(p_nome, '/', 1)
      and (r.privato = auth.uid()
        or exists (select 1 from marketplace.app_invii i where i.richiesta = r.id and i.artigiano = auth.uid())
        or marketplace.is_admin())
  );
$$;
create or replace function marketplace.app_puo_caricare_foto(p_nome text)
returns boolean
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select exists (
    select 1 from marketplace.app_richieste r
    where p_nome = r.id::text || '/' || split_part(p_nome, '/', 2)
      and split_part(p_nome, '/', 2) in ('1.jpg', '2.jpg', '3.jpg', '4.jpg')
      and r.privato = auth.uid() and r.stato in ('nuova', 'inviata')
  );
$$;
grant execute on function marketplace.app_puo_vedere_foto(text) to authenticated;
grant execute on function marketplace.app_puo_caricare_foto(text) to authenticated;

drop policy if exists app_sm_foto_leggi on storage.objects;
create policy app_sm_foto_leggi on storage.objects
  for select to authenticated using (bucket_id = 'supermastro' and marketplace.app_puo_vedere_foto(name));
drop policy if exists app_sm_foto_carica on storage.objects;
create policy app_sm_foto_carica on storage.objects
  for insert to authenticated with check (bucket_id = 'supermastro' and marketplace.app_puo_caricare_foto(name));

notify pgrst, 'reload schema';
