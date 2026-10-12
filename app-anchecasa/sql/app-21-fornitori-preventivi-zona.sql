-- app-21 · Fornitori a preventivo con la zona: Materiali edili, Noleggio, Servizi per la casa (12.10.2026, decisioni di Nando 10:47)
--
-- Decisioni:
--   · Materiali e noleggio: chiedono solo le aziende (imprese, artigiani...), il privato no. Servizi per la casa: il privato sì.
--   · La richiesta va a chi copre la zona del cantiere, partendo dal più vicino (stesso comune, stessa provincia, poi la zona coperta).
--   · Prezzi solo nel preventivo: il listino del fornitore non è pubblico.
--   · Ordine e pagamento fuori da AncheCasa. Il fornitore segna «consegnato» / «noleggio finito» / «lavoro fatto».
--   · Nome e contatti del cliente solo dopo la scelta.
--   · Nessuna provvigione: questi fornitori pagheranno per stare su AncheCasa (da decidere). Nessun accordo da confermare.
--   · Noleggio: il noleggiatore tiene i suoi mezzi e il calendario; l'impresa vede subito cosa è libero (senza prezzi).
--   · Rete: il commerciale chiede per un suo cliente; a lavoro chiuso la vendita va a lui (app_vendite, app-20).
--
-- Tabelle nuove, niente di luce e gas, telefonia e finanza viene toccato (tranne fornitori_per_admin, solo lettura per l'admin).
-- Si può rilanciare.

begin;

-- ---------------------------------------------------------------------------
-- 0. Categorie e zona del fornitore
-- ---------------------------------------------------------------------------
create or replace function marketplace.prev_categoria_di(p_tipo text)
returns text language sql immutable as $$
  select case
    when p_tipo = 'azienda_materiali_edili' then 'materiali'
    when p_tipo = 'azienda_noleggio_attrezzature' then 'noleggio'
    when p_tipo in ('azienda_traslochi', 'azienda_facchinaggio', 'azienda_pulizie', 'azienda_manutenzione_stabili') then 'casa'
    else null end;
$$;

-- Servizi per la casa: quali richieste riceve ogni mestiere.
create or replace function marketplace.prev_tipi_di(p_tipo text)
returns text[] language sql immutable as $$
  select case p_tipo
    when 'azienda_traslochi' then array['trasloco', 'facchinaggio', 'sgombero']
    when 'azienda_facchinaggio' then array['facchinaggio', 'trasloco', 'sgombero']
    when 'azienda_pulizie' then array['pulizie', 'sanificazione']
    when 'azienda_manutenzione_stabili' then array['giardinaggio', 'manutenzione']
    else null end;
$$;

create table if not exists marketplace.fornitori_zona (
  azienda_id     uuid primary key references auth.users (id) on delete cascade,
  sede_comune    text not null default '' check (length(sede_comune) <= 80),
  sede_provincia text not null default '' check (length(sede_provincia) <= 2),
  sede_regione   text not null default '' check (length(sede_regione) <= 40),
  province       text[] not null default '{}',
  updated_at     timestamptz not null default now()
);
alter table marketplace.fornitori_zona enable row level security;
drop policy if exists fornitori_zona_mia on marketplace.fornitori_zona;
create policy fornitori_zona_mia on marketplace.fornitori_zona for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());
drop policy if exists fornitori_zona_admin on marketplace.fornitori_zona;
create policy fornitori_zona_admin on marketplace.fornitori_zona for select using (marketplace.is_admin());
grant select, insert, update on marketplace.fornitori_zona to authenticated;

-- Il fornitore copre la provincia? Senza zona scritta copre la provincia della sede.
create or replace function marketplace.prev_copre(p_azienda uuid, p_provincia text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select coalesce((
    select case when cardinality(z.province) > 0 then upper(p_provincia) = any (z.province) else upper(z.sede_provincia) = upper(p_provincia) end
    from marketplace.fornitori_zona z where z.azienda_id = p_azienda), false);
$$;
revoke all on function marketplace.prev_copre(uuid, text) from public, anon;

-- Quanto è vicino: 0 stesso comune, 1 stessa provincia, 2 zona coperta.
create or replace function marketplace.prev_vicinanza(p_azienda uuid, p_comune text, p_provincia text)
returns int language sql stable security definer set search_path = marketplace, public as $$
  select coalesce((
    select case when lower(btrim(z.sede_comune)) = lower(btrim(p_comune)) and btrim(p_comune) <> '' then 0
                when upper(z.sede_provincia) = upper(p_provincia) then 1 else 2 end
    from marketplace.fornitori_zona z where z.azienda_id = p_azienda), 2);
$$;
revoke all on function marketplace.prev_vicinanza(uuid, text, text) from public, anon;

create or replace function marketplace.prev_io()
returns table (categoria text, tipi text[]) language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.prev_categoria_di(p.tipo_azienda), marketplace.prev_tipi_di(p.tipo_azienda)
  from marketplace.profiles p where p.id = auth.uid() and p.verifica = 'verificato';
$$;
revoke all on function marketplace.prev_io() from public, anon;
grant execute on function marketplace.prev_io() to authenticated;

-- ---------------------------------------------------------------------------
-- 1. RICHIESTE DI PREVENTIVO
-- ---------------------------------------------------------------------------
create table if not exists marketplace.prev_richieste (
  id              uuid primary key default gen_random_uuid(),
  token           text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  creato          timestamptz not null default now(),
  categoria       text not null check (categoria in ('materiali', 'noleggio', 'casa')),
  fonte           text not null default 'dashboard' check (fonte in ('dashboard', 'rete', 'magazine')),
  tipo            text not null default '' check (length(tipo) <= 40),
  cliente_tipo    text not null default 'impresa' check (cliente_tipo in ('privato', 'impresa')),
  comune          text not null default '' check (length(comune) <= 80),
  provincia       text not null check (length(provincia) = 2),
  regione         text not null default '' check (length(regione) <= 40),
  indirizzo       text not null default '' check (length(indirizzo) <= 160),
  dal             date,
  al              date,
  con_operatore   boolean,
  righe           jsonb not null default '[]'::jsonb,
  nota            text not null default '' check (length(nota) <= 800),
  nome            text not null check (length(btrim(nome)) between 2 and 120),
  mail            text not null check (mail ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono        text not null default '' check (length(telefono) <= 30),
  consenso        boolean not null check (consenso),
  richiedente_id  uuid references auth.users (id) on delete set null,
  inviato_da      uuid references auth.users (id) on delete set null,
  stato           text not null default 'aperta' check (stato in ('aperta', 'scelta', 'chiusa', 'annullata')),
  proposta_scelta uuid,
  scelta_il       timestamptz,
  avvisato_il     timestamptz,
  check (al is null or dal is null or al >= dal)
);
create index if not exists prev_richieste_zona on marketplace.prev_richieste (categoria, stato, provincia, creato desc);
alter table marketplace.prev_richieste enable row level security;
drop policy if exists prev_richieste_admin on marketplace.prev_richieste;
create policy prev_richieste_admin on marketplace.prev_richieste for select using (marketplace.is_admin());
drop policy if exists prev_richieste_mie on marketplace.prev_richieste;
create policy prev_richieste_mie on marketplace.prev_richieste for select using (richiedente_id = auth.uid() or inviato_da = auth.uid());
grant select on marketplace.prev_richieste to authenticated;

create or replace function marketplace.prev_nuova_richiesta(p jsonb)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_cat text := p->>'categoria';
  v_mail text := lower(btrim(coalesce(p->>'mail', '')));
  v_fam text;
  v_rete boolean := p->>'fonte' = 'rete';
  v_tok text;
begin
  if v_cat not in ('materiali', 'noleggio', 'casa') then raise exception 'categoria_non_valida'; end if;
  if coalesce((p->>'consenso')::boolean, false) is not true then raise exception 'serve_il_consenso'; end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'mail_non_valida'; end if;
  if length(coalesce(p->>'provincia', '')) <> 2 then raise exception 'serve_la_provincia'; end if;
  select famiglia::text into v_fam from marketplace.profiles where id = auth.uid();
  if v_rete and coalesce(v_fam, '') <> 'agente' then raise exception 'solo_la_rete'; end if;
  -- Decisione di Nando: materiali e noleggio li chiedono solo le aziende (o la rete per un'azienda), il privato no.
  if v_cat in ('materiali', 'noleggio') and not v_rete and coalesce(v_fam, '') not in ('azienda', 'fornitore') then raise exception 'solo_aziende'; end if;
  if (select count(*) from marketplace.prev_richieste where lower(mail) = v_mail and creato > now() - interval '1 day') >= 8 then
    raise exception 'troppe_richieste';
  end if;
  insert into marketplace.prev_richieste (categoria, fonte, tipo, cliente_tipo, comune, provincia, regione, indirizzo, dal, al, con_operatore, righe, nota,
    nome, mail, telefono, consenso, richiedente_id, inviato_da)
  values (
    v_cat, case when v_rete then 'rete' else 'dashboard' end,
    left(coalesce(p->>'tipo', ''), 40),
    case when v_cat = 'casa' and p->>'cliente_tipo' <> 'impresa' then 'privato' else 'impresa' end,
    left(coalesce(p->>'comune', ''), 80), upper(p->>'provincia'), left(coalesce(p->>'regione', ''), 40), left(coalesce(p->>'indirizzo', ''), 160),
    nullif(p->>'dal', '')::date, nullif(p->>'al', '')::date, nullif(p->>'con_operatore', '')::boolean,
    case when jsonb_typeof(p->'righe') = 'array' then p->'righe' else '[]'::jsonb end,
    left(coalesce(p->>'nota', ''), 800),
    left(btrim(coalesce(p->>'nome', '')), 120), v_mail, left(btrim(coalesce(p->>'telefono', '')), 30), true,
    case when v_rete then null else auth.uid() end, case when v_rete then auth.uid() else null end
  )
  returning token into v_tok;
  return v_tok;
end;
$$;
revoke all on function marketplace.prev_nuova_richiesta(jsonb) from public, anon;
grant execute on function marketplace.prev_nuova_richiesta(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. PREVENTIVI DEI FORNITORI
-- ---------------------------------------------------------------------------
create table if not exists marketplace.prev_proposte (
  id            uuid primary key default gen_random_uuid(),
  azienda_id    uuid not null references auth.users (id) on delete cascade,
  categoria     text not null check (categoria in ('materiali', 'noleggio', 'casa')),
  richiesta_id  uuid not null references marketplace.prev_richieste (id) on delete cascade,
  numero        text not null,
  righe         jsonb not null default '[]'::jsonb,
  totale        numeric(14, 2),
  iva_inclusa   boolean not null default false,
  consegna      text not null default '' check (length(consegna) <= 160),
  valida_giorni smallint not null default 15 check (valida_giorni between 1 and 180),
  nota          text not null default '' check (length(nota) <= 600),
  stato         text not null default 'inviata' check (stato in ('inviata', 'accettata', 'rifiutata', 'chiusa')),
  created_at    timestamptz not null default now(),
  chiusa_il     timestamptz,
  unique (azienda_id, numero),
  unique (richiesta_id, azienda_id)
);
create index if not exists prev_proposte_azienda_idx on marketplace.prev_proposte (azienda_id, created_at desc);
alter table marketplace.prev_proposte enable row level security;

create or replace function marketplace.prev_posso_proporre(p_richiesta uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.prev_richieste r, marketplace.profiles p
    where r.id = p_richiesta and r.stato = 'aperta'
      and p.id = auth.uid() and p.verifica = 'verificato'
      and marketplace.prev_categoria_di(p.tipo_azienda) = r.categoria
      and (r.categoria <> 'casa' or r.tipo = any (marketplace.prev_tipi_di(p.tipo_azienda)))
      and marketplace.prev_copre(p.id, r.provincia)
  );
$$;
revoke all on function marketplace.prev_posso_proporre(uuid) from public, anon;
grant execute on function marketplace.prev_posso_proporre(uuid) to authenticated;

drop policy if exists prev_proposte_proprie on marketplace.prev_proposte;
create policy prev_proposte_proprie on marketplace.prev_proposte for select to authenticated using (azienda_id = auth.uid() or marketplace.is_admin());
drop policy if exists prev_proposte_nuove on marketplace.prev_proposte;
create policy prev_proposte_nuove on marketplace.prev_proposte for insert to authenticated
  with check (azienda_id = auth.uid() and stato = 'inviata' and marketplace.prev_posso_proporre(richiesta_id));
drop policy if exists prev_proposte_togli on marketplace.prev_proposte;
create policy prev_proposte_togli on marketplace.prev_proposte for delete to authenticated using (azienda_id = auth.uid() and stato = 'inviata');
grant select, insert, delete on marketplace.prev_proposte to authenticated;

-- Le richieste per me: della mia categoria (e del mio mestiere per la casa), nella mia zona, dalla più vicina.
-- Senza nome, mail, telefono e indirizzo, tranne quando il cliente ha scelto il mio preventivo.
create or replace function marketplace.prev_richieste_per_me()
returns table (
  id uuid, creato timestamptz, categoria text, fonte text, tipo text, cliente_tipo text, comune text, provincia text, regione text,
  dal date, al date, con_operatore boolean, righe jsonb, nota text, stato text, vicinanza int,
  mia_proposta uuid, mio_stato text, scelta_mia boolean, nome text, mail text, telefono text, indirizzo text, proposte int
) language sql stable security definer set search_path = marketplace, public as $$
  select r.id, r.creato, r.categoria, r.fonte, r.tipo, r.cliente_tipo, r.comune, r.provincia, r.regione,
    r.dal, r.al, r.con_operatore, r.righe, r.nota, r.stato, marketplace.prev_vicinanza(me.id, r.comune, r.provincia),
    x.id, x.stato, (r.proposta_scelta is not null and r.proposta_scelta = x.id),
    case when r.proposta_scelta = x.id then r.nome else '' end,
    case when r.proposta_scelta = x.id then r.mail else '' end,
    case when r.proposta_scelta = x.id then r.telefono else '' end,
    case when r.proposta_scelta = x.id then r.indirizzo else '' end,
    (select count(*)::int from marketplace.prev_proposte y where y.richiesta_id = r.id)
  from marketplace.profiles me
  join marketplace.prev_richieste r on r.categoria = marketplace.prev_categoria_di(me.tipo_azienda)
  left join marketplace.prev_proposte x on x.richiesta_id = r.id and x.azienda_id = me.id
  where me.id = auth.uid() and me.verifica = 'verificato'
    and (x.id is not null or (
      r.stato = 'aperta'
      and (r.categoria <> 'casa' or r.tipo = any (marketplace.prev_tipi_di(me.tipo_azienda)))
      and marketplace.prev_copre(me.id, r.provincia)))
  order by (r.stato = 'aperta') desc, marketplace.prev_vicinanza(me.id, r.comune, r.provincia), r.creato desc
  limit 300;
$$;
revoke all on function marketplace.prev_richieste_per_me() from public, anon;
grant execute on function marketplace.prev_richieste_per_me() to authenticated;

-- Il fornitore segna il lavoro chiuso (consegnato / noleggio finito / lavoro fatto). Se la richiesta l'ha fatta un commerciale, la vendita è sua.
create or replace function marketplace.prev_chiudi(p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.prev_richieste%rowtype;
  v_az text;
begin
  update marketplace.prev_proposte set stato = 'chiusa', chiusa_il = now()
  where id = p_proposta and azienda_id = auth.uid() and stato = 'accettata';
  if not found then raise exception 'non_si_puo'; end if;
  update marketplace.prev_richieste set stato = 'chiusa' where proposta_scelta = p_proposta returning * into r;
  if r.inviato_da is not null then
    select coalesce(pr.nome, 'fornitore') into v_az from marketplace.profiles pr where pr.id = auth.uid();
    perform marketplace.fornitori_vendita_al_commerciale(r.inviato_da, r.nome, r.regione,
      (case r.categoria when 'materiali' then 'Materiali edili' when 'noleggio' then 'Noleggio' else 'Servizi per la casa' end) || ' · ' || coalesce(v_az, ''));
  end if;
end;
$$;
revoke all on function marketplace.prev_chiudi(uuid) from public, anon;
grant execute on function marketplace.prev_chiudi(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. LA PAGINA DEL CLIENTE (preventivi.html, dal link nella mail)
-- ---------------------------------------------------------------------------
create or replace function marketplace.prev_i_miei_preventivi(p_token text)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  r marketplace.prev_richieste%rowtype;
begin
  select * into r from marketplace.prev_richieste where token = p_token;
  if not found then return null; end if;
  return jsonb_build_object(
    'richiesta', jsonb_build_object('categoria', r.categoria, 'tipo', r.tipo, 'nome', split_part(r.nome, ' ', 1), 'creato', r.creato, 'stato', r.stato,
      'comune', r.comune, 'provincia', r.provincia, 'dal', r.dal, 'al', r.al, 'con_operatore', r.con_operatore, 'righe', r.righe,
      'cliente_tipo', r.cliente_tipo, 'proposta_scelta', r.proposta_scelta),
    'proposte', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'numero', x.numero, 'stato', x.stato, 'righe', x.righe, 'totale', x.totale, 'iva_inclusa', x.iva_inclusa,
        'consegna', x.consegna, 'valida_giorni', x.valida_giorni, 'nota', x.nota, 'creato', x.created_at,
        'azienda', coalesce(pr.nome, 'Fornitore'), 'logo', coalesce(pr.logo_url, ''),
        'vicinanza', marketplace.prev_vicinanza(x.azienda_id, r.comune, r.provincia),
        'sede', coalesce((select z.sede_comune from marketplace.fornitori_zona z where z.azienda_id = x.azienda_id), '')
      ) order by marketplace.prev_vicinanza(x.azienda_id, r.comune, r.provincia), x.totale nulls last)
      from marketplace.prev_proposte x
      left join marketplace.profiles pr on pr.id = x.azienda_id
      where x.richiesta_id = r.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function marketplace.prev_i_miei_preventivi(text) from public;
grant execute on function marketplace.prev_i_miei_preventivi(text) to anon, authenticated;

create or replace function marketplace.prev_accetta(p_token text, p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.prev_richieste%rowtype;
begin
  select * into r from marketplace.prev_richieste where token = p_token for update;
  if not found then raise exception 'richiesta_non_trovata'; end if;
  if r.stato <> 'aperta' then raise exception 'gia_scelta'; end if;
  if not exists (select 1 from marketplace.prev_proposte where id = p_proposta and richiesta_id = r.id) then raise exception 'proposta_non_trovata'; end if;
  update marketplace.prev_richieste set stato = 'scelta', proposta_scelta = p_proposta, scelta_il = now() where id = r.id;
  update marketplace.prev_proposte set stato = 'accettata' where id = p_proposta;
  update marketplace.prev_proposte set stato = 'rifiutata' where richiesta_id = r.id and id <> p_proposta and stato = 'inviata';
end;
$$;
revoke all on function marketplace.prev_accetta(text, uuid) from public;
grant execute on function marketplace.prev_accetta(text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. NOLEGGIO: mezzi e calendario
-- ---------------------------------------------------------------------------
create table if not exists marketplace.noleggio_mezzi (
  id            uuid primary key default gen_random_uuid(),
  azienda_id    uuid not null references auth.users (id) on delete cascade,
  nome          text not null check (char_length(nome) between 1 and 80),
  tipo          text not null check (char_length(tipo) between 1 and 40),
  con_operatore boolean not null default false,
  prezzo_giorno numeric(10, 2),
  note          text not null default '' check (char_length(note) <= 300),
  attivo        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists noleggio_mezzi_azienda on marketplace.noleggio_mezzi (azienda_id);
alter table marketplace.noleggio_mezzi enable row level security;
drop policy if exists noleggio_mezzi_miei on marketplace.noleggio_mezzi;
create policy noleggio_mezzi_miei on marketplace.noleggio_mezzi for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());
drop policy if exists noleggio_mezzi_admin on marketplace.noleggio_mezzi;
create policy noleggio_mezzi_admin on marketplace.noleggio_mezzi for select using (marketplace.is_admin());
grant select, insert, update, delete on marketplace.noleggio_mezzi to authenticated;

create table if not exists marketplace.noleggio_occupato (
  id       uuid primary key default gen_random_uuid(),
  mezzo_id uuid not null references marketplace.noleggio_mezzi (id) on delete cascade,
  dal      date not null,
  al       date not null,
  nota     text not null default '' check (char_length(nota) <= 200),
  check (al >= dal)
);
create index if not exists noleggio_occupato_mezzo on marketplace.noleggio_occupato (mezzo_id, dal);
alter table marketplace.noleggio_occupato enable row level security;
drop policy if exists noleggio_occupato_miei on marketplace.noleggio_occupato;
create policy noleggio_occupato_miei on marketplace.noleggio_occupato for all to authenticated
  using (exists (select 1 from marketplace.noleggio_mezzi m where m.id = mezzo_id and m.azienda_id = auth.uid()))
  with check (exists (select 1 from marketplace.noleggio_mezzi m where m.id = mezzo_id and m.azienda_id = auth.uid()));
grant select, insert, update, delete on marketplace.noleggio_occupato to authenticated;

-- Cosa è libero in quella provincia e in quelle date (senza prezzi: il prezzo è nel preventivo). Per aziende, rete e admin.
create or replace function marketplace.noleggio_liberi(p_provincia text, p_comune text, p_dal date, p_al date)
returns table (mezzo uuid, azienda text, sede text, vicinanza int, nome text, tipo text, con_operatore boolean, note text)
language sql stable security definer set search_path = marketplace, public as $$
  select m.id, coalesce(pr.nome, 'Noleggiatore'), coalesce(z.sede_comune, ''), marketplace.prev_vicinanza(m.azienda_id, p_comune, p_provincia),
    m.nome, m.tipo, m.con_operatore, m.note
  from marketplace.noleggio_mezzi m
  join marketplace.profiles pr on pr.id = m.azienda_id and pr.verifica = 'verificato' and pr.tipo_azienda = 'azienda_noleggio_attrezzature'
  left join marketplace.fornitori_zona z on z.azienda_id = m.azienda_id
  where m.attivo
    and marketplace.prev_copre(m.azienda_id, p_provincia)
    and (marketplace.is_admin() or exists (select 1 from marketplace.profiles me where me.id = auth.uid() and me.famiglia::text in ('azienda', 'agente', 'fornitore')))
    and not exists (select 1 from marketplace.noleggio_occupato o where o.mezzo_id = m.id and o.dal <= coalesce(p_al, p_dal) and o.al >= p_dal)
  order by 4, m.tipo, m.nome
  limit 200;
$$;
revoke all on function marketplace.noleggio_liberi(text, text, date, date) from public, anon;
grant execute on function marketplace.noleggio_liberi(text, text, date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. ADMIN: elenco fornitori con le nuove categorie e i numeri
-- ---------------------------------------------------------------------------
create or replace function marketplace.fornitori_per_admin()
returns table (id uuid, nome text, mail text, tipo_azienda text, verifica text, creato timestamptz,
  accordo_tipo text, accordo_valore numeric, accordo_su text, accordo_note text, accordo_scritto timestamptz, accordo_confermato timestamptz,
  offerte int, proposte int, scelte int, attivati int)
language sql stable security definer set search_path = marketplace, public, auth as $$
  select p.id, p.nome, u.email::text, p.tipo_azienda, p.verifica::text, u.created_at,
    a.tipo, a.valore, a.su_cosa, a.note, a.scritto_il, a.confermato_il,
    (select count(*)::int from marketplace.energia_offerte o where o.azienda_id = p.id and o.attiva)
      + (select count(*)::int from marketplace.servizi_offerte o where o.azienda_id = p.id and o.attiva)
      + (select count(*)::int from marketplace.noleggio_mezzi o where o.azienda_id = p.id and o.attivo),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id)
      + (select count(*)::int from marketplace.servizi_proposte x where x.azienda_id = p.id)
      + (select count(*)::int from marketplace.prev_proposte x where x.azienda_id = p.id),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id and x.stato in ('accettata', 'attivata'))
      + (select count(*)::int from marketplace.servizi_proposte x where x.azienda_id = p.id and x.stato in ('accettata', 'attivata'))
      + (select count(*)::int from marketplace.prev_proposte x where x.azienda_id = p.id and x.stato in ('accettata', 'chiusa')),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id and x.stato = 'attivata')
      + (select count(*)::int from marketplace.servizi_proposte x where x.azienda_id = p.id and x.stato = 'attivata')
      + (select count(*)::int from marketplace.prev_proposte x where x.azienda_id = p.id and x.stato = 'chiusa')
  from marketplace.profiles p
  join auth.users u on u.id = p.id
  left join marketplace.fornitori_accordi a on a.azienda_id = p.id
  where marketplace.is_admin()
    and p.famiglia = 'azienda'
    and p.tipo_azienda in ('azienda_luce_gas', 'azienda_telefonia', 'azienda_finanza', 'azienda_materiali_edili', 'azienda_noleggio_attrezzature',
      'azienda_fornitori_it', 'azienda_traslochi', 'azienda_facchinaggio', 'azienda_pulizie', 'azienda_manutenzione_stabili')
  order by u.created_at desc;
$$;
revoke all on function marketplace.fornitori_per_admin() from public, anon;
grant execute on function marketplace.fornitori_per_admin() to authenticated;

commit;

-- Controllo (sola lettura):
-- select to_regclass('marketplace.prev_richieste'), to_regclass('marketplace.prev_proposte'), to_regclass('marketplace.fornitori_zona'), to_regclass('marketplace.noleggio_mezzi'), to_regclass('marketplace.noleggio_occupato');
-- select proname from pg_proc where proname like 'prev_%' or proname like 'noleggio_%' order by 1;
