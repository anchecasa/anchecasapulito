-- app-19 · Fornitori di energia (luce e gas) nell'area privata (12.10.2026, decisioni di Nando, PROGETTO-DASHBOARD.md)
--
-- Il giro:
--   1. Il cliente (dal Magazine, Check Bollette, o dalla sua dashboard) chiede offerte: consumi, zona, contatti, consenso.
--   2. La richiesta arriva a TUTTI i fornitori di luce e gas, SENZA nome, mail e telefono.
--   3. Ogni fornitore manda una proposta (su carta AncheCasa con il suo logo).
--   4. Il cliente, dal link nella mail, confronta e preme «Accetto, contattatemi» su una proposta.
--   5. Solo quel fornitore vede nome, mail e telefono. Poi segna «contratto attivato».
--   6. La provvigione è nell'accordo: la scrive l'admin dalla sua dashboard e la invia; il fornitore la conferma,
--      e SOLO DOPO può mandare proposte (decisione di Nando, 12.10.2026 09:16).
--
-- Comprende la migrazione del 09.10.2026 (20261009100000_energia_offerte_proposte.sql), mai applicata:
-- qui è ripetuta con «if not exists», quindi va bene anche se nel frattempo è stata applicata.
-- Solo aggiunte. Si può rilanciare.

begin;

-- ---------------------------------------------------------------------------
-- 0. Tabelle del 09.10.2026: carta intestata, offerte, proposte
-- ---------------------------------------------------------------------------
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
  prezzo_luce numeric(10, 5),
  prezzo_gas  numeric(10, 5),
  quota_mese  numeric(10, 2),
  bonus       numeric(10, 2),
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
  numero       text not null,
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
  stato        text not null default 'inviata',
  created_at   timestamptz not null default now(),
  unique (azienda_id, numero)
);
create index if not exists energia_proposte_azienda_idx on marketplace.energia_proposte (azienda_id, created_at desc);

alter table marketplace.energia_carta    enable row level security;
alter table marketplace.energia_offerte  enable row level security;
alter table marketplace.energia_proposte enable row level security;

-- ---------------------------------------------------------------------------
-- 1. Chi è un fornitore di energia
-- ---------------------------------------------------------------------------
create or replace function marketplace.energia_sono_fornitore()
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.profiles p
    where p.id = auth.uid() and p.verifica = 'verificato' and p.tipo_azienda = 'azienda_luce_gas'
  );
$$;
revoke all on function marketplace.energia_sono_fornitore() from public, anon;
grant execute on function marketplace.energia_sono_fornitore() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. RICHIESTE DEI CLIENTI
-- ---------------------------------------------------------------------------
create table if not exists marketplace.energia_richieste (
  id               uuid primary key default gen_random_uuid(),
  token            text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  creato           timestamptz not null default now(),
  fonte            text not null default 'magazine' check (fonte in ('magazine', 'dashboard', 'rete')),
  tipo             text not null check (tipo in ('luce', 'gas', 'duale')),
  cliente_tipo     text not null default 'privato' check (cliente_tipo in ('privato', 'impresa')),
  regione          text not null default '' check (length(regione) <= 40),
  comune           text not null default '' check (length(comune) <= 80),
  consumo_luce     numeric(12, 2),
  consumo_gas      numeric(12, 2),
  spesa_mese       numeric(10, 2),
  fornitore_attuale text not null default '' check (length(fornitore_attuale) <= 80),
  nota             text not null default '' check (length(nota) <= 500),
  nome             text not null check (length(btrim(nome)) between 2 and 120),
  mail             text not null check (mail ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono         text not null default '' check (length(telefono) <= 30),
  consenso         boolean not null check (consenso),
  privato_id       uuid references auth.users (id) on delete set null,
  inviato_da       uuid references auth.users (id) on delete set null,
  stato            text not null default 'aperta' check (stato in ('aperta', 'scelta', 'chiusa')),
  proposta_scelta  uuid,
  scelta_il        timestamptz,
  avvisato_il      timestamptz
);
create index if not exists energia_richieste_stato on marketplace.energia_richieste (stato, creato desc);
create index if not exists energia_richieste_mail on marketplace.energia_richieste (lower(mail), creato desc);
alter table marketplace.energia_richieste enable row level security;

-- Le righe intere (con i contatti) le leggono solo l'admin e il privato che ha fatto la richiesta.
drop policy if exists energia_richieste_admin on marketplace.energia_richieste;
create policy energia_richieste_admin on marketplace.energia_richieste for select using (marketplace.is_admin());
drop policy if exists energia_richieste_mie on marketplace.energia_richieste;
create policy energia_richieste_mie on marketplace.energia_richieste for select using (privato_id = auth.uid());
grant select on marketplace.energia_richieste to authenticated;

-- Nuova richiesta: dal Magazine (senza accesso) o dalla dashboard. Restituisce il token del link per le proposte.
create or replace function marketplace.energia_nuova_richiesta(p jsonb)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_mail text := lower(btrim(coalesce(p->>'mail', '')));
  v_tok text;
  v_tipo text := coalesce(nullif(p->>'tipo', ''), 'duale');
begin
  if coalesce((p->>'consenso')::boolean, false) is not true then raise exception 'serve_il_consenso'; end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'mail_non_valida'; end if;
  if (select count(*) from marketplace.energia_richieste where lower(mail) = v_mail and creato > now() - interval '1 day') >= 3 then
    raise exception 'troppe_richieste';
  end if;
  insert into marketplace.energia_richieste (fonte, tipo, cliente_tipo, regione, comune, consumo_luce, consumo_gas, spesa_mese,
    fornitore_attuale, nota, nome, mail, telefono, consenso, privato_id, inviato_da)
  values (
    case when p->>'fonte' in ('magazine', 'dashboard', 'rete') then p->>'fonte' else 'magazine' end,
    case when v_tipo in ('luce', 'gas', 'duale') then v_tipo else 'duale' end,
    case when p->>'cliente_tipo' = 'impresa' then 'impresa' else 'privato' end,
    left(coalesce(p->>'regione', ''), 40), left(coalesce(p->>'comune', ''), 80),
    nullif(p->>'consumo_luce', '')::numeric, nullif(p->>'consumo_gas', '')::numeric, nullif(p->>'spesa_mese', '')::numeric,
    left(coalesce(p->>'fornitore_attuale', ''), 80), left(coalesce(p->>'nota', ''), 500),
    left(btrim(coalesce(p->>'nome', '')), 120), v_mail, left(btrim(coalesce(p->>'telefono', '')), 30), true,
    auth.uid(),
    case when p->>'fonte' = 'rete' then auth.uid() else null end
  )
  returning token into v_tok;
  return v_tok;
end;
$$;
revoke all on function marketplace.energia_nuova_richiesta(jsonb) from public;
grant execute on function marketplace.energia_nuova_richiesta(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. PROPOSTE legate alle richieste
-- ---------------------------------------------------------------------------
alter table marketplace.energia_proposte add column if not exists richiesta_id uuid references marketplace.energia_richieste (id) on delete cascade;
alter table marketplace.energia_proposte add column if not exists risparmio_annuo numeric(12, 2);
alter table marketplace.energia_proposte add column if not exists attivata_il timestamptz;
do $$
declare c record;
begin
  for c in select conname from pg_constraint where conrelid = 'marketplace.energia_proposte'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%stato%' loop
    execute format('alter table marketplace.energia_proposte drop constraint %I', c.conname);
  end loop;
  alter table marketplace.energia_proposte add constraint energia_proposte_stato_check
    check (stato in ('inviata', 'accettata', 'rifiutata', 'attivata'));
end $$;
create unique index if not exists energia_proposte_una_per_richiesta on marketplace.energia_proposte (richiesta_id, azienda_id) where richiesta_id is not null;

create or replace function marketplace.energia_richiesta_aperta(p_id uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.energia_richieste where id = p_id and stato = 'aperta');
$$;
grant execute on function marketplace.energia_richiesta_aperta(uuid) to authenticated;

-- Regole: ogni azienda vede e cambia le sue righe; la proposta su una richiesta solo se la richiesta è aperta
-- e chi scrive è un fornitore di energia. L'admin vede tutto.
drop policy if exists energia_carta_proprie on marketplace.energia_carta;
create policy energia_carta_proprie on marketplace.energia_carta
  for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());
drop policy if exists energia_carta_admin on marketplace.energia_carta;
create policy energia_carta_admin on marketplace.energia_carta for select using (marketplace.is_admin());

drop policy if exists energia_offerte_proprie on marketplace.energia_offerte;
create policy energia_offerte_proprie on marketplace.energia_offerte
  for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());
drop policy if exists energia_offerte_pubbliche on marketplace.energia_offerte;
create policy energia_offerte_pubbliche on marketplace.energia_offerte
  for select to anon, authenticated using (attiva = true);

drop policy if exists energia_proposte_proprie on marketplace.energia_proposte;
create policy energia_proposte_proprie on marketplace.energia_proposte
  for select to authenticated using (azienda_id = auth.uid() or marketplace.is_admin());
drop policy if exists energia_proposte_nuove on marketplace.energia_proposte;
create policy energia_proposte_nuove on marketplace.energia_proposte
  for insert to authenticated with check (
    azienda_id = auth.uid() and stato = 'inviata'
    and (richiesta_id is null or (marketplace.energia_sono_fornitore() and marketplace.energia_richiesta_aperta(richiesta_id)))
  );
drop policy if exists energia_proposte_cambia on marketplace.energia_proposte;
create policy energia_proposte_cambia on marketplace.energia_proposte
  for update to authenticated using (azienda_id = auth.uid() and stato = 'inviata') with check (azienda_id = auth.uid() and stato in ('inviata', 'rifiutata'));
drop policy if exists energia_proposte_togli on marketplace.energia_proposte;
create policy energia_proposte_togli on marketplace.energia_proposte
  for delete to authenticated using (azienda_id = auth.uid() and stato = 'inviata');

grant select on marketplace.energia_offerte to anon;
grant select, insert, update, delete on marketplace.energia_carta, marketplace.energia_offerte, marketplace.energia_proposte to authenticated;

-- Le richieste per il fornitore: senza contatti, tranne quando il cliente ha scelto la sua proposta.
create or replace function marketplace.energia_richieste_per_me()
returns table (
  id uuid, creato timestamptz, fonte text, tipo text, cliente_tipo text, regione text, comune text,
  consumo_luce numeric, consumo_gas numeric, spesa_mese numeric, fornitore_attuale text, nota text, stato text,
  mia_proposta uuid, mia_stato text, scelta_mia boolean, nome text, mail text, telefono text, proposte int
) language sql stable security definer set search_path = marketplace, public as $$
  select r.id, r.creato, r.fonte, r.tipo, r.cliente_tipo, r.regione, r.comune,
    r.consumo_luce, r.consumo_gas, r.spesa_mese, r.fornitore_attuale, r.nota, r.stato,
    p.id, p.stato, (r.proposta_scelta is not null and r.proposta_scelta = p.id),
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.nome else '' end,
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.mail else '' end,
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.telefono else '' end,
    (select count(*)::int from marketplace.energia_proposte x where x.richiesta_id = r.id)
  from marketplace.energia_richieste r
  left join marketplace.energia_proposte p on p.richiesta_id = r.id and p.azienda_id = auth.uid()
  where marketplace.energia_sono_fornitore()
    and (r.stato = 'aperta' or p.id is not null)
  order by r.creato desc
  limit 300;
$$;
revoke all on function marketplace.energia_richieste_per_me() from public, anon;
grant execute on function marketplace.energia_richieste_per_me() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. LA PAGINA DEL CLIENTE (dal link nella mail, senza accesso)
-- ---------------------------------------------------------------------------
create or replace function marketplace.energia_le_mie_proposte(p_token text)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  r marketplace.energia_richieste%rowtype;
begin
  select * into r from marketplace.energia_richieste where token = p_token;
  if not found then return null; end if;
  return jsonb_build_object(
    'richiesta', jsonb_build_object('tipo', r.tipo, 'nome', split_part(r.nome, ' ', 1), 'creato', r.creato, 'stato', r.stato,
      'consumo_luce', r.consumo_luce, 'consumo_gas', r.consumo_gas, 'spesa_mese', r.spesa_mese, 'proposta_scelta', r.proposta_scelta),
    'proposte', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'numero', p.numero, 'stato', p.stato, 'stima_annua', p.stima_annua, 'risparmio_annuo', p.risparmio_annuo,
        'nota', p.nota, 'creato', p.created_at,
        'azienda', coalesce(nullif(c.ragione, ''), pr.nome, 'Fornitore'), 'logo', coalesce(pr.logo_url, ''),
        'offerta', case when o.id is null then null else jsonb_build_object('nome', o.nome, 'tipo', o.tipo, 'prezzo', o.prezzo,
          'durata_mesi', o.durata_mesi, 'prezzo_luce', o.prezzo_luce, 'prezzo_gas', o.prezzo_gas, 'quota_mese', o.quota_mese, 'bonus', o.bonus) end
      ) order by p.stima_annua nulls last, p.created_at)
      from marketplace.energia_proposte p
      left join marketplace.energia_carta c on c.azienda_id = p.azienda_id
      left join marketplace.profiles pr on pr.id = p.azienda_id
      left join marketplace.energia_offerte o on o.id = p.offerta_id
      where p.richiesta_id = r.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function marketplace.energia_le_mie_proposte(text) from public;
grant execute on function marketplace.energia_le_mie_proposte(text) to anon, authenticated;

create or replace function marketplace.energia_accetta(p_token text, p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.energia_richieste%rowtype;
begin
  select * into r from marketplace.energia_richieste where token = p_token for update;
  if not found then raise exception 'richiesta_non_trovata'; end if;
  if r.stato <> 'aperta' then raise exception 'gia_scelta'; end if;
  if not exists (select 1 from marketplace.energia_proposte where id = p_proposta and richiesta_id = r.id) then raise exception 'proposta_non_trovata'; end if;
  update marketplace.energia_richieste set stato = 'scelta', proposta_scelta = p_proposta, scelta_il = now() where id = r.id;
  update marketplace.energia_proposte set stato = 'accettata' where id = p_proposta;
end;
$$;
revoke all on function marketplace.energia_accetta(text, uuid) from public;
grant execute on function marketplace.energia_accetta(text, uuid) to anon, authenticated;

-- Il fornitore segna il contratto attivato (da qui nasce la provvigione).
create or replace function marketplace.energia_contratto_attivato(p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.energia_proposte set stato = 'attivata', attivata_il = now()
  where id = p_proposta and azienda_id = auth.uid() and stato = 'accettata';
  if not found then raise exception 'non_si_puo'; end if;
  update marketplace.energia_richieste set stato = 'chiusa' where proposta_scelta = p_proposta;
end;
$$;
revoke all on function marketplace.energia_contratto_attivato(uuid) from public, anon;
grant execute on function marketplace.energia_contratto_attivato(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. ACCORDO CON IL FORNITORE (provvigione): la scrive l'admin, il fornitore la conferma
-- ---------------------------------------------------------------------------
create table if not exists marketplace.fornitori_accordi (
  azienda_id    uuid primary key references auth.users (id) on delete cascade,
  tipo          text not null default 'fisso' check (tipo in ('percentuale', 'fisso')),
  valore        numeric(10, 2) not null check (valore >= 0),
  su_cosa       text not null default 'per ogni contratto attivato' check (length(su_cosa) <= 120),
  note          text not null default '' check (length(note) <= 500),
  scritto_da    uuid references auth.users (id) on delete set null,
  scritto_il    timestamptz not null default now(),
  confermato_il timestamptz
);
alter table marketplace.fornitori_accordi enable row level security;
drop policy if exists fornitori_accordi_admin on marketplace.fornitori_accordi;
create policy fornitori_accordi_admin on marketplace.fornitori_accordi for all using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists fornitori_accordi_mio on marketplace.fornitori_accordi;
create policy fornitori_accordi_mio on marketplace.fornitori_accordi for select using (azienda_id = auth.uid());
grant select, insert, update on marketplace.fornitori_accordi to authenticated;

-- Se l'admin cambia la provvigione, il fornitore deve confermarla di nuovo.
create or replace function marketplace.fornitori_accordo_cambiato()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and (new.tipo, new.valore, new.su_cosa) is distinct from (old.tipo, old.valore, old.su_cosa) then
    new.confermato_il := null;
    new.scritto_il := now();
  end if;
  return new;
end;
$$;
drop trigger if exists fornitori_accordo_cambiato on marketplace.fornitori_accordi;
create trigger fornitori_accordo_cambiato before update on marketplace.fornitori_accordi
  for each row execute function marketplace.fornitori_accordo_cambiato();

create or replace function marketplace.fornitori_conferma_accordo()
returns void language sql security definer set search_path = marketplace, public as $$
  update marketplace.fornitori_accordi set confermato_il = now() where azienda_id = auth.uid() and confermato_il is null;
$$;
revoke all on function marketplace.fornitori_conferma_accordo() from public, anon;
grant execute on function marketplace.fornitori_conferma_accordo() to authenticated;

-- Decisione di Nando (12.10.2026, 09:16): il fornitore manda proposte ai clienti solo dopo aver confermato l'accordo.
create or replace function marketplace.fornitori_accordo_ok()
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.fornitori_accordi where azienda_id = auth.uid() and confermato_il is not null);
$$;
revoke all on function marketplace.fornitori_accordo_ok() from public, anon;
grant execute on function marketplace.fornitori_accordo_ok() to authenticated;

drop policy if exists energia_proposte_nuove on marketplace.energia_proposte;
create policy energia_proposte_nuove on marketplace.energia_proposte
  for insert to authenticated with check (
    azienda_id = auth.uid() and stato = 'inviata' and marketplace.fornitori_accordo_ok()
    and (richiesta_id is null or (marketplace.energia_sono_fornitore() and marketplace.energia_richiesta_aperta(richiesta_id)))
  );

-- Elenco dei fornitori per l'admin (pagina Fornitori): chi sono, accordo, numeri.
create or replace function marketplace.fornitori_per_admin()
returns table (id uuid, nome text, mail text, tipo_azienda text, verifica text, creato timestamptz,
  accordo_tipo text, accordo_valore numeric, accordo_su text, accordo_note text, accordo_scritto timestamptz, accordo_confermato timestamptz,
  offerte int, proposte int, scelte int, attivati int)
language sql stable security definer set search_path = marketplace, public, auth as $$
  select p.id, p.nome, u.email::text, p.tipo_azienda, p.verifica::text, u.created_at,
    a.tipo, a.valore, a.su_cosa, a.note, a.scritto_il, a.confermato_il,
    (select count(*)::int from marketplace.energia_offerte o where o.azienda_id = p.id and o.attiva),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id and x.stato in ('accettata', 'attivata')),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id and x.stato = 'attivata')
  from marketplace.profiles p
  join auth.users u on u.id = p.id
  left join marketplace.fornitori_accordi a on a.azienda_id = p.id
  where marketplace.is_admin()
    and p.famiglia = 'azienda'
    and p.tipo_azienda in ('azienda_luce_gas', 'azienda_materiali_edili', 'azienda_noleggio_attrezzature', 'azienda_fornitori_it')
  order by u.created_at desc;
$$;
revoke all on function marketplace.fornitori_per_admin() from public, anon;
grant execute on function marketplace.fornitori_per_admin() to authenticated;

commit;

-- Controllo (sola lettura):
-- select to_regclass('marketplace.energia_richieste'), to_regclass('marketplace.fornitori_accordi'), to_regclass('marketplace.energia_proposte');
-- select proname from pg_proc where proname like 'energia_%' or proname like 'fornitori_%' order by 1;
