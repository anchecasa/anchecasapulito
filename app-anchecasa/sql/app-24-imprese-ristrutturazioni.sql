-- app-24 · Imprese, ristrutturazioni con AncheCasa general contractor, cantieri, subappalti, piccoli lavori
-- (12.10.2026, decisioni di Nando 12:11 e 12:20, PROGETTO-DASHBOARD.md)
--
--   · Ristrutturazioni: AncheCasa fa da general contractor. Il privato chiede (o la rete segnala), l'admin manda un agente
--     per il sopralluogo, fa il preventivo, firma con il privato, poi SCEGLIE l'impresa e le affida il lavoro.
--   · L'impresa vede solo il suo importo (quanto le paga AncheCasa), non il prezzo del privato.
--   · Il privato in «Il mio cantiere» vede solo AncheCasa: avanzamento, foto della settimana, SAL da pagare. Non vede l'impresa.
--   · Subappalti: l'impresa cerca subappaltatori e impiantisti verificati per zona e chiede la disponibilità.
--   · Piccoli lavori («Trova impresa»): come i preventivi dei fornitori, alle imprese della zona (massimo 5);
--     l'admin è sempre avvisato e può passarli a una ristrutturazione (agente) o lasciarli alle imprese.
--   · Per ricevere lavori servono documenti verificati e prova o abbonamento attivo (app-23).
-- Si può rilanciare.

begin;

-- ---------------------------------------------------------------------------
-- 1. RISTRUTTURAZIONI (la pratica di AncheCasa con il privato)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.ristrutturazioni (
  id              uuid primary key default gen_random_uuid(),
  creato          timestamptz not null default now(),
  origine         text not null default 'privato' check (origine in ('privato', 'rete', 'lavori', 'admin')),
  privato_id      uuid references auth.users (id) on delete set null,
  inviato_da      uuid references auth.users (id) on delete set null,
  nome            text not null check (length(btrim(nome)) between 2 and 120),
  telefono        text not null default '' check (length(telefono) <= 30),
  mail            text not null default '' check (length(mail) <= 160),
  comune          text not null default '' check (length(comune) <= 80),
  provincia       text not null default '' check (length(provincia) <= 2),
  indirizzo       text not null default '' check (length(indirizzo) <= 160),
  descrizione     text not null default '' check (length(descrizione) <= 1500),
  budget          text not null default '' check (length(budget) <= 60),
  agente_id       uuid references auth.users (id) on delete set null,
  nota_agente     text not null default '' check (length(nota_agente) <= 1500),
  stato           text not null default 'nuova' check (stato in ('nuova', 'sopralluogo', 'preventivo', 'firmata', 'in_cantiere', 'chiusa', 'persa')),
  importo_cliente numeric(14, 2),
  note_admin      text not null default '' check (length(note_admin) <= 1500),
  avvisato_admin  timestamptz,
  avvisato_agente uuid
);
alter table marketplace.ristrutturazioni add column if not exists avvisato_agente uuid;
create index if not exists ristrutturazioni_stato on marketplace.ristrutturazioni (stato, creato desc);
alter table marketplace.ristrutturazioni enable row level security;
drop policy if exists ristrutturazioni_admin on marketplace.ristrutturazioni;
create policy ristrutturazioni_admin on marketplace.ristrutturazioni for all using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists ristrutturazioni_mie on marketplace.ristrutturazioni;
create policy ristrutturazioni_mie on marketplace.ristrutturazioni for select using (privato_id = auth.uid() or inviato_da = auth.uid() or agente_id = auth.uid());
grant select, insert, update on marketplace.ristrutturazioni to authenticated;

create or replace function marketplace.ristrutturazione_nuova(p jsonb)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid; v_fam text;
begin
  if auth.uid() is null then raise exception 'serve_accesso'; end if;
  select famiglia::text into v_fam from marketplace.profiles where id = auth.uid();
  if (select count(*) from marketplace.ristrutturazioni where (privato_id = auth.uid() or inviato_da = auth.uid()) and creato > now() - interval '1 day') >= 5 then raise exception 'troppe_richieste'; end if;
  insert into marketplace.ristrutturazioni (origine, privato_id, inviato_da, nome, telefono, mail, comune, provincia, indirizzo, descrizione, budget)
  values (case when v_fam = 'agente' then 'rete' else 'privato' end,
    case when v_fam = 'agente' then null else auth.uid() end, case when v_fam = 'agente' then auth.uid() else null end,
    left(btrim(coalesce(p->>'nome', '')), 120), left(coalesce(p->>'telefono', ''), 30), left(lower(coalesce(p->>'mail', '')), 160),
    left(coalesce(p->>'comune', ''), 80), upper(left(coalesce(p->>'provincia', ''), 2)), left(coalesce(p->>'indirizzo', ''), 160),
    left(coalesce(p->>'descrizione', ''), 1500), left(coalesce(p->>'budget', ''), 60))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function marketplace.ristrutturazione_nuova(jsonb) from public, anon;
grant execute on function marketplace.ristrutturazione_nuova(jsonb) to authenticated;

-- L'agente assegnato scrive com'è andato il sopralluogo.
create or replace function marketplace.ristrutturazione_agente(p_id uuid, p_nota text, p_fatto boolean)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.ristrutturazioni set nota_agente = left(coalesce(p_nota, ''), 1500),
    stato = case when p_fatto and stato in ('nuova', 'sopralluogo') then 'preventivo' else stato end
  where id = p_id and agente_id = auth.uid();
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;
revoke all on function marketplace.ristrutturazione_agente(uuid, text, boolean) from public, anon;
grant execute on function marketplace.ristrutturazione_agente(uuid, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. COMMESSE: il lavoro che AncheCasa affida a un'impresa
-- ---------------------------------------------------------------------------
create table if not exists marketplace.commesse (
  id                 uuid primary key default gen_random_uuid(),
  ristrutturazione_id uuid references marketplace.ristrutturazioni (id) on delete set null,
  creato             timestamptz not null default now(),
  titolo             text not null check (length(btrim(titolo)) between 2 and 120),
  descrizione        text not null default '' check (length(descrizione) <= 2000),
  comune             text not null default '' check (length(comune) <= 80),
  provincia          text not null default '' check (length(provincia) <= 2),
  indirizzo          text not null default '' check (length(indirizzo) <= 160),
  importo_impresa    numeric(14, 2),
  inizio             date,
  fine               date,
  referente          text not null default '' check (length(referente) <= 160),
  impresa_id         uuid not null references auth.users (id) on delete cascade,
  stato              text not null default 'proposta' check (stato in ('proposta', 'accettata', 'rifiutata', 'in_corso', 'finita')),
  avanzamento        smallint not null default 0 check (avanzamento between 0 and 100),
  risposta_il        timestamptz,
  nota_impresa       text not null default '' check (length(nota_impresa) <= 800),
  avvisato_impresa   timestamptz,
  avvisato_admin     timestamptz
);
create index if not exists commesse_impresa on marketplace.commesse (impresa_id, creato desc);
alter table marketplace.commesse enable row level security;
drop policy if exists commesse_admin on marketplace.commesse;
create policy commesse_admin on marketplace.commesse for all using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists commesse_mie on marketplace.commesse;
create policy commesse_mie on marketplace.commesse for select using (impresa_id = auth.uid());
grant select, insert, update on marketplace.commesse to authenticated;

create or replace function marketplace.commessa_rispondi(p_id uuid, p_accetta boolean, p_nota text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.commesse set stato = case when p_accetta then 'accettata' else 'rifiutata' end, risposta_il = now(),
    nota_impresa = left(coalesce(p_nota, ''), 800), avvisato_admin = null
  where id = p_id and impresa_id = auth.uid() and stato = 'proposta';
  if not found then raise exception 'non_si_puo'; end if;
  -- Lavoro accettato: la pratica del cliente passa a «lavori in corso».
  if p_accetta then
    update marketplace.ristrutturazioni r set stato = 'in_cantiere'
    from marketplace.commesse c where c.id = p_id and r.id = c.ristrutturazione_id and r.stato in ('preventivo', 'firmata');
  end if;
end;
$$;

create or replace function marketplace.commessa_avanzamento(p_id uuid, p_percento int)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.commesse set avanzamento = greatest(0, least(100, p_percento)),
    stato = case when p_percento >= 100 then 'finita' when stato = 'accettata' then 'in_corso' else stato end
  where id = p_id and impresa_id = auth.uid() and stato in ('accettata', 'in_corso');
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;
revoke all on function marketplace.commessa_rispondi(uuid, boolean, text), marketplace.commessa_avanzamento(uuid, int) from public, anon;
grant execute on function marketplace.commessa_rispondi(uuid, boolean, text), marketplace.commessa_avanzamento(uuid, int) to authenticated;

-- Giornale dei lavori (con foto). Il privato vede le voci «visibile al cliente», senza il nome dell'impresa.
create table if not exists marketplace.cantiere_giornale (
  id          uuid primary key default gen_random_uuid(),
  commessa_id uuid not null references marketplace.commesse (id) on delete cascade,
  creato      timestamptz not null default now(),
  data        date not null default current_date,
  testo       text not null default '' check (length(testo) <= 1500),
  foto        text[] not null default '{}',
  visibile_cliente boolean not null default true,
  autore      uuid references auth.users (id) on delete set null
);
create index if not exists cantiere_giornale_commessa on marketplace.cantiere_giornale (commessa_id, data desc);
alter table marketplace.cantiere_giornale enable row level security;
drop policy if exists cantiere_giornale_admin on marketplace.cantiere_giornale;
create policy cantiere_giornale_admin on marketplace.cantiere_giornale for all using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists cantiere_giornale_impresa on marketplace.cantiere_giornale;
create policy cantiere_giornale_impresa on marketplace.cantiere_giornale for all
  using (exists (select 1 from marketplace.commesse c where c.id = commessa_id and c.impresa_id = auth.uid()))
  with check (exists (select 1 from marketplace.commesse c where c.id = commessa_id and c.impresa_id = auth.uid() and c.stato in ('accettata', 'in_corso', 'finita')));
grant select, insert, update, delete on marketplace.cantiere_giornale to authenticated;

-- Foto dei cantieri: cartella privata per commessa (cantieri/<id commessa>/...). Le leggono l'impresa, l'admin e (con link firmato dalla funzione) il privato.
insert into storage.buckets (id, name, public) values ('cantieri', 'cantieri', false) on conflict (id) do nothing;
drop policy if exists "cantieri_foto_impresa" on storage.objects;
create policy "cantieri_foto_impresa" on storage.objects for all to authenticated
  using (bucket_id = 'cantieri' and exists (select 1 from marketplace.commesse c where c.id::text = (storage.foldername(name))[1] and c.impresa_id = auth.uid()))
  with check (bucket_id = 'cantieri' and exists (select 1 from marketplace.commesse c where c.id::text = (storage.foldername(name))[1] and c.impresa_id = auth.uid()));
drop policy if exists "cantieri_foto_admin" on storage.objects;
create policy "cantieri_foto_admin" on storage.objects for select to authenticated using (bucket_id = 'cantieri' and marketplace.is_admin());
drop policy if exists "cantieri_foto_privato" on storage.objects;
create policy "cantieri_foto_privato" on storage.objects for select to authenticated
  using (bucket_id = 'cantieri' and exists (select 1 from marketplace.commesse c join marketplace.ristrutturazioni r on r.id = c.ristrutturazione_id
    where c.id::text = (storage.foldername(name))[1] and r.privato_id = auth.uid()));

-- SAL: «impresa» = quello che AncheCasa paga all'impresa; «cliente» = quello che il privato paga ad AncheCasa.
create table if not exists marketplace.commesse_sal (
  id          uuid primary key default gen_random_uuid(),
  commessa_id uuid not null references marketplace.commesse (id) on delete cascade,
  per         text not null check (per in ('impresa', 'cliente')),
  numero      smallint not null default 1,
  descrizione text not null default '' check (length(descrizione) <= 200),
  importo     numeric(14, 2) not null default 0,
  stato       text not null default 'previsto' check (stato in ('previsto', 'maturato', 'pagato')),
  data        date,
  creato      timestamptz not null default now()
);
create index if not exists commesse_sal_commessa on marketplace.commesse_sal (commessa_id, per, numero);
alter table marketplace.commesse_sal enable row level security;
drop policy if exists commesse_sal_admin on marketplace.commesse_sal;
create policy commesse_sal_admin on marketplace.commesse_sal for all using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists commesse_sal_impresa on marketplace.commesse_sal;
create policy commesse_sal_impresa on marketplace.commesse_sal for select
  using (per = 'impresa' and exists (select 1 from marketplace.commesse c where c.id = commessa_id and c.impresa_id = auth.uid()));
grant select, insert, update, delete on marketplace.commesse_sal to authenticated;

-- «Il mio cantiere» del privato: solo AncheCasa, niente impresa.
create or replace function marketplace.mio_cantiere()
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'creato', r.creato, 'stato', r.stato, 'descrizione', r.descrizione, 'comune', r.comune, 'importo', r.importo_cliente,
    'cantiere', case when c.id is null then null else jsonb_build_object('id', c.id, 'titolo', c.titolo, 'inizio', c.inizio, 'fine', c.fine, 'avanzamento', c.avanzamento, 'stato', c.stato) end,
    'giornale', coalesce((select jsonb_agg(jsonb_build_object('data', g.data, 'testo', g.testo, 'foto', g.foto) order by g.data desc)
      from marketplace.cantiere_giornale g where g.commessa_id = c.id and g.visibile_cliente), '[]'::jsonb),
    'sal', coalesce((select jsonb_agg(jsonb_build_object('numero', s.numero, 'descrizione', s.descrizione, 'importo', s.importo, 'stato', s.stato, 'data', s.data) order by s.numero)
      from marketplace.commesse_sal s where s.commessa_id = c.id and s.per = 'cliente'), '[]'::jsonb)
  ) order by r.creato desc), '[]'::jsonb)
  from marketplace.ristrutturazioni r
  left join lateral (select * from marketplace.commesse c0 where c0.ristrutturazione_id = r.id and c0.stato in ('accettata', 'in_corso', 'finita') order by c0.creato desc limit 1) c on true
  where r.privato_id = auth.uid();
$$;
revoke all on function marketplace.mio_cantiere() from public, anon;
grant execute on function marketplace.mio_cantiere() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. AZIENDE DELLA ZONA (per i subappalti e per l'admin quando affida un lavoro)
-- ---------------------------------------------------------------------------
create or replace function marketplace.aziende_cerca(p_tipi text[], p_provincia text, p_comune text)
returns table (id uuid, nome text, tipo_azienda text, comune text, vicinanza int, puo_lavorare boolean)
language sql stable security definer set search_path = marketplace, public as $$
  select p.id, coalesce(p.nome, 'Azienda'), p.tipo_azienda, coalesce(z.sede_comune, ''),
    marketplace.prev_vicinanza(p.id, p_comune, p_provincia), marketplace.azienda_puo_lavorare(p.id)
  from marketplace.profiles p
  left join marketplace.fornitori_zona z on z.azienda_id = p.id
  where p.famiglia = 'azienda' and p.verifica = 'verificato' and p.tipo_azienda = any (p_tipi)
    and (p_provincia is null or p_provincia = '' or marketplace.prev_copre(p.id, p_provincia))
    and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    and (marketplace.is_admin() or marketplace.azienda_puo_lavorare(p.id))
  order by 6 desc, 5, 2
  limit 100;
$$;
revoke all on function marketplace.aziende_cerca(text[], text, text) from public, anon;
grant execute on function marketplace.aziende_cerca(text[], text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. SUBAPPALTI: l'impresa chiede la disponibilità a un subappaltatore o impiantista
-- ---------------------------------------------------------------------------
create table if not exists marketplace.subappalti_richieste (
  id           uuid primary key default gen_random_uuid(),
  creato       timestamptz not null default now(),
  da_azienda   uuid not null references auth.users (id) on delete cascade,
  a_azienda    uuid not null references auth.users (id) on delete cascade,
  commessa_id  uuid references marketplace.commesse (id) on delete set null,
  lavorazione  text not null check (length(btrim(lavorazione)) between 2 and 120),
  descrizione  text not null default '' check (length(descrizione) <= 1000),
  comune       text not null default '' check (length(comune) <= 80),
  provincia    text not null default '' check (length(provincia) <= 2),
  dal          date,
  al           date,
  stato        text not null default 'inviata' check (stato in ('inviata', 'accettata', 'rifiutata')),
  risposta     text not null default '' check (length(risposta) <= 600),
  risposta_il  timestamptz,
  avvisato     text not null default ''
);
create index if not exists subappalti_da on marketplace.subappalti_richieste (da_azienda, creato desc);
create index if not exists subappalti_a on marketplace.subappalti_richieste (a_azienda, creato desc);
alter table marketplace.subappalti_richieste enable row level security;
drop policy if exists subappalti_admin on marketplace.subappalti_richieste;
create policy subappalti_admin on marketplace.subappalti_richieste for select using (marketplace.is_admin());
grant select on marketplace.subappalti_richieste to authenticated;

create or replace function marketplace.subappalto_chiedi(p jsonb)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid;
begin
  if not marketplace.azienda_puo_lavorare(auth.uid()) then raise exception 'serve_verifica'; end if;
  if (select count(*) from marketplace.subappalti_richieste where da_azienda = auth.uid() and creato > now() - interval '1 day') >= 30 then raise exception 'troppe_richieste'; end if;
  insert into marketplace.subappalti_richieste (da_azienda, a_azienda, commessa_id, lavorazione, descrizione, comune, provincia, dal, al)
  values (auth.uid(), (p->>'a_azienda')::uuid,
    case when exists (select 1 from marketplace.commesse c where c.id = nullif(p->>'commessa_id', '')::uuid and c.impresa_id = auth.uid()) then nullif(p->>'commessa_id', '')::uuid else null end,
    left(btrim(coalesce(p->>'lavorazione', '')), 120), left(coalesce(p->>'descrizione', ''), 1000), left(coalesce(p->>'comune', ''), 80),
    upper(left(coalesce(p->>'provincia', ''), 2)), nullif(p->>'dal', '')::date, nullif(p->>'al', '')::date)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function marketplace.subappalto_rispondi(p_id uuid, p_accetta boolean, p_risposta text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.subappalti_richieste set stato = case when p_accetta then 'accettata' else 'rifiutata' end,
    risposta = left(coalesce(p_risposta, ''), 600), risposta_il = now()
  where id = p_id and a_azienda = auth.uid() and stato = 'inviata';
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;

-- Le richieste mandate e ricevute; mail e telefono dell'altro solo quando la richiesta è accettata.
create or replace function marketplace.subappalti_miei()
returns table (id uuid, creato timestamptz, verso text, altra text, altra_tipo text, lavorazione text, descrizione text, comune text, provincia text,
  dal date, al date, stato text, risposta text, mail text)
language sql stable security definer set search_path = marketplace, public, auth as $$
  select s.id, s.creato, case when s.da_azienda = auth.uid() then 'mandata' else 'ricevuta' end,
    coalesce(p.nome, 'Azienda'), p.tipo_azienda, s.lavorazione, s.descrizione, s.comune, s.provincia, s.dal, s.al, s.stato, s.risposta,
    case when s.stato = 'accettata' then u.email::text else '' end
  from marketplace.subappalti_richieste s
  join marketplace.profiles p on p.id = case when s.da_azienda = auth.uid() then s.a_azienda else s.da_azienda end
  join auth.users u on u.id = p.id
  where s.da_azienda = auth.uid() or s.a_azienda = auth.uid()
  order by s.creato desc
  limit 200;
$$;
revoke all on function marketplace.subappalto_chiedi(jsonb), marketplace.subappalto_rispondi(uuid, boolean, text), marketplace.subappalti_miei() from public, anon;
grant execute on function marketplace.subappalto_chiedi(jsonb), marketplace.subappalto_rispondi(uuid, boolean, text), marketplace.subappalti_miei() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. PICCOLI LAVORI («Trova impresa»): una categoria in più nel giro dei preventivi (app-21, app-22)
-- ---------------------------------------------------------------------------
do $$
declare c record;
begin
  for c in select conrelid::regclass::text as t, conname from pg_constraint
           where conrelid in ('marketplace.prev_richieste'::regclass, 'marketplace.prev_proposte'::regclass)
             and contype = 'c' and pg_get_constraintdef(oid) ilike '%(categoria %' loop
    execute format('alter table %s drop constraint %I', c.t, c.conname);
  end loop;
end $$;
alter table marketplace.prev_richieste add constraint prev_richieste_categoria_check check (categoria in ('materiali', 'noleggio', 'casa', 'lavori'));
alter table marketplace.prev_proposte add constraint prev_proposte_categoria_check check (categoria in ('materiali', 'noleggio', 'casa', 'lavori'));
alter table marketplace.prev_richieste add column if not exists smistata text not null default '' check (smistata in ('', 'imprese', 'ristrutturazione'));
alter table marketplace.prev_richieste add column if not exists avvisato_admin timestamptz;

create or replace function marketplace.prev_categoria_di(p_tipo text)
returns text language sql immutable as $$
  select case
    when p_tipo = 'azienda_materiali_edili' then 'materiali'
    when p_tipo = 'azienda_noleggio_attrezzature' then 'noleggio'
    when p_tipo in ('azienda_traslochi', 'azienda_facchinaggio', 'azienda_pulizie', 'azienda_manutenzione_stabili') then 'casa'
    when p_tipo in ('impresa', 'azienda_imprese_edili', 'azienda_subappaltatori', 'azienda_impiantisti') then 'lavori'
    else null end;
$$;

-- Per i piccoli lavori l'impresa deve avere documenti verificati e prova o abbonamento (app-23).
create or replace function marketplace.prev_posso_proporre(p_richiesta uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.prev_richieste r, marketplace.profiles p
    where r.id = p_richiesta and r.stato = 'aperta' and r.creato > now() - interval '15 days'
      and (select count(*) from marketplace.prev_proposte x where x.richiesta_id = r.id) < 5
      and p.id = auth.uid() and p.verifica = 'verificato'
      and marketplace.prev_categoria_di(p.tipo_azienda) = r.categoria
      and (r.categoria <> 'casa' or r.tipo = any (marketplace.prev_tipi_di(p.tipo_azienda)))
      and (r.categoria <> 'lavori' or (marketplace.azienda_puo_lavorare(p.id) and r.smistata <> 'ristrutturazione'))
      and marketplace.prev_copre(p.id, r.provincia)
  );
$$;

-- Le richieste per il fornitore (app-22) con i piccoli lavori: solo alle imprese che possono lavorare.
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
      r.stato = 'aperta' and r.creato > now() - interval '15 days'
      and (select count(*) from marketplace.prev_proposte y where y.richiesta_id = r.id) < 5
      and (r.categoria <> 'casa' or r.tipo = any (marketplace.prev_tipi_di(me.tipo_azienda)))
      and (r.categoria <> 'lavori' or (marketplace.azienda_puo_lavorare(me.id) and r.smistata <> 'ristrutturazione'))
      and marketplace.prev_copre(me.id, r.provincia)))
  order by (r.stato = 'aperta') desc, marketplace.prev_vicinanza(me.id, r.comune, r.provincia), r.creato desc
  limit 300;
$$;
revoke all on function marketplace.prev_richieste_per_me() from public, anon;
grant execute on function marketplace.prev_richieste_per_me() to authenticated;

create or replace function marketplace.prev_nuova_richiesta(p jsonb)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_cat text := p->>'categoria';
  v_mail text := lower(btrim(coalesce(p->>'mail', '')));
  v_fam text;
  v_rete boolean := p->>'fonte' = 'rete';
  v_tok text;
begin
  if v_cat not in ('materiali', 'noleggio', 'casa', 'lavori') then raise exception 'categoria_non_valida'; end if;
  if coalesce((p->>'consenso')::boolean, false) is not true then raise exception 'serve_il_consenso'; end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'mail_non_valida'; end if;
  if length(coalesce(p->>'provincia', '')) <> 2 then raise exception 'serve_la_provincia'; end if;
  select famiglia::text into v_fam from marketplace.profiles where id = auth.uid();
  if v_rete and coalesce(v_fam, '') <> 'agente' then raise exception 'solo_la_rete'; end if;
  if v_cat in ('materiali', 'noleggio') and not v_rete and coalesce(v_fam, '') not in ('azienda', 'fornitore') then raise exception 'solo_aziende'; end if;
  if (select count(*) from marketplace.prev_richieste where lower(mail) = v_mail and creato > now() - interval '1 day') >= 8 then
    raise exception 'troppe_richieste';
  end if;
  insert into marketplace.prev_richieste (categoria, fonte, tipo, cliente_tipo, comune, provincia, regione, indirizzo, dal, al, con_operatore, righe, nota,
    nome, mail, telefono, consenso, richiedente_id, inviato_da)
  values (
    v_cat, case when v_rete then 'rete' else 'dashboard' end,
    left(coalesce(p->>'tipo', ''), 40),
    case when v_cat in ('casa', 'lavori') and p->>'cliente_tipo' <> 'impresa' then 'privato' else 'impresa' end,
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

-- L'admin smista un piccolo lavoro: lo lascia alle imprese o lo passa a una ristrutturazione (che poi affida a un agente).
create or replace function marketplace.lavori_smista(p_id uuid, p_dove text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare r marketplace.prev_richieste%rowtype; v_id uuid;
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  select * into r from marketplace.prev_richieste where id = p_id and categoria = 'lavori' for update;
  if not found then raise exception 'non_trovata'; end if;
  if p_dove = 'ristrutturazione' then
    insert into marketplace.ristrutturazioni (origine, privato_id, inviato_da, nome, telefono, mail, comune, provincia, indirizzo, descrizione)
    values ('lavori', r.richiedente_id, r.inviato_da, r.nome, r.telefono, r.mail, r.comune, r.provincia, r.indirizzo, r.nota)
    returning id into v_id;
    update marketplace.prev_richieste set smistata = 'ristrutturazione', stato = case when stato = 'aperta' then 'annullata' else stato end where id = p_id;
    update marketplace.prev_proposte set stato = 'rifiutata' where richiesta_id = p_id and stato = 'inviata';
  else
    update marketplace.prev_richieste set smistata = 'imprese' where id = p_id;
  end if;
  return v_id;
end;
$$;
revoke all on function marketplace.lavori_smista(uuid, text) from public, anon;
grant execute on function marketplace.lavori_smista(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. ADMIN: tutte le ristrutturazioni, le commesse e i loro SAL in una chiamata
-- ---------------------------------------------------------------------------
create or replace function marketplace.ristrutturazioni_admin()
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select case when not marketplace.is_admin() then null else jsonb_build_object(
    'ristrutturazioni', coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object('agente', coalesce(pa.nome, ''), 'segnalata_da', coalesce(ps.nome, '')) order by r.creato desc)
      from marketplace.ristrutturazioni r left join marketplace.profiles pa on pa.id = r.agente_id left join marketplace.profiles ps on ps.id = r.inviato_da), '[]'::jsonb),
    'commesse', coalesce((select jsonb_agg(to_jsonb(c) || jsonb_build_object('impresa', coalesce(pi.nome, ''),
        'sal', coalesce((select jsonb_agg(to_jsonb(s) order by s.per, s.numero) from marketplace.commesse_sal s where s.commessa_id = c.id), '[]'::jsonb)) order by c.creato desc)
      from marketplace.commesse c left join marketplace.profiles pi on pi.id = c.impresa_id), '[]'::jsonb),
    'lavori', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'creato', x.creato, 'nome', x.nome, 'telefono', x.telefono, 'mail', x.mail, 'comune', x.comune,
        'provincia', x.provincia, 'nota', x.nota, 'stato', x.stato, 'smistata', x.smistata, 'fonte', x.fonte,
        'proposte', (select count(*) from marketplace.prev_proposte y where y.richiesta_id = x.id)) order by x.creato desc)
      from marketplace.prev_richieste x where x.categoria = 'lavori'), '[]'::jsonb),
    'agenti', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'regione', coalesce(ar.regione, ''), 'ruolo', coalesce(ar.ruolo, '')) order by p.nome)
      from marketplace.profiles p left join marketplace.app_rete ar on ar.utente = p.id where p.famiglia = 'agente' and p.verifica = 'verificato'), '[]'::jsonb)
  ) end;
$$;
revoke all on function marketplace.ristrutturazioni_admin() from public, anon;
grant execute on function marketplace.ristrutturazioni_admin() to authenticated;

commit;

-- Controllo (sola lettura):
-- select to_regclass('marketplace.ristrutturazioni'), to_regclass('marketplace.commesse'), to_regclass('marketplace.cantiere_giornale'), to_regclass('marketplace.commesse_sal'), to_regclass('marketplace.subappalti_richieste');
-- select proname from pg_proc where proname in ('ristrutturazione_nuova', 'commessa_rispondi', 'mio_cantiere', 'aziende_cerca', 'subappalto_chiedi', 'lavori_smista', 'ristrutturazioni_admin');
