-- app-25 · Cantieri e richieste tra aziende (12.10.2026, decisioni di Nando 13:24-13:42, PROGETTO-DASHBOARD.md)
--
--   · Ogni azienda (e AncheCasa) può essere general contractor: crea i suoi cantieri e da lì pubblica le richieste
--     (materiali, noleggio, lavori in subappalto, impianti, personale tramite agenzia).
--   · Niente elenco da sfogliare: la richiesta arriva alle prime 10 aziende della zona che offrono quel servizio
--     («Cosa offro»), prima gli sponsor poi le più vicine. Chi pubblica può invitare le sue ditte di fiducia per mail
--     e cercare i subappaltatori che hanno detto di lavorare in subappalto in quel settore e in quella zona (senza contatti).
--   · Offerta voce per voce. Materiali: si possono togliere voci; chi chiede sceglie più fornitori, voce per voce,
--     e ripubblica le voci scoperte. Lavori: si offre anche per una sola lavorazione, ma per intero.
--   · Le condizioni di pagamento le mette chi pubblica. «Non scelto» sempre con il motivo.
--   · Si vede nome e voto (pagamenti) di chi chiede; l'indirizzo esatto e i contatti solo dopo la scelta.
--   · Bollino «documenti ok» (DURC, POS, patente a crediti); voti nei due sensi; domande e sopralluogo da AncheCasa.
--   · Nessuna offerta in 48 ore: la richiesta si allarga alla regione e la rete della regione riceve la mail.
--   · Al massimo 20 richieste al mese (l'admin può alzare il limite). Sponsor «fino al» lo segna l'admin.
-- Da eseguire dopo app-23 e app-24. Si può rilanciare.

begin;

-- ---------------------------------------------------------------------------
-- 0. Aggiunte alle aziende: sponsor, limite, documenti, cosa offro, voti
-- ---------------------------------------------------------------------------
alter table marketplace.aziende_stato add column if not exists sponsor_fino date;
alter table marketplace.aziende_stato add column if not exists limite_richieste int not null default 20 check (limite_richieste between 0 and 1000);

do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'marketplace.aziende_documenti'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%(tipo %' loop
    execute format('alter table marketplace.aziende_documenti drop constraint %I', c.conname);
  end loop;
end $$;
alter table marketplace.aziende_documenti add constraint aziende_documenti_tipo_check
  check (tipo in ('visura', 'durc', 'assicurazione', 'pos', 'patente', 'abilitazione', 'altro'));

-- Cosa offre ogni azienda (codici in js/cantieri.js). subappalto = disponibile a lavorare in subappalto.
create table if not exists marketplace.aziende_offro (
  azienda_id  uuid primary key references auth.users (id) on delete cascade,
  servizi     text[] not null default '{}',
  subappalto  boolean not null default true,
  note        text not null default '' check (length(note) <= 500),
  updated_at  timestamptz not null default now()
);
alter table marketplace.aziende_offro enable row level security;
drop policy if exists aziende_offro_mia on marketplace.aziende_offro;
create policy aziende_offro_mia on marketplace.aziende_offro for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());
drop policy if exists aziende_offro_admin on marketplace.aziende_offro;
create policy aziende_offro_admin on marketplace.aziende_offro for select using (marketplace.is_admin());
grant select, insert, update on marketplace.aziende_offro to authenticated;

-- Senza «Cosa offro» compilato valgono i servizi del tipo di azienda.
create or replace function marketplace.cnt_servizi(p_azienda uuid)
returns text[] language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(
    (select o.servizi from marketplace.aziende_offro o where o.azienda_id = p_azienda and cardinality(o.servizi) > 0),
    (select case p.tipo_azienda
       when 'azienda_materiali_edili' then array['materiali']
       when 'azienda_noleggio_attrezzature' then array['noleggio']
       when 'apl' then array['personale']
       else array[]::text[] end
     from marketplace.profiles p where p.id = p_azienda),
    array[]::text[]);
$$;

create or replace function marketplace.cnt_bollino(p_azienda uuid)
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select jsonb_build_object(
    'ok', coalesce((select s.documenti_ok from marketplace.aziende_stato s where s.azienda_id = p_azienda), false),
    'tipi', coalesce((select jsonb_agg(distinct d.tipo) from marketplace.aziende_documenti d where d.azienda_id = p_azienda and d.stato = 'ok'
                        and (d.scadenza is null or d.scadenza >= current_date)), '[]'::jsonb));
$$;

create or replace function marketplace.cnt_sponsor(p_azienda uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select coalesce((select s.sponsor_fino >= current_date from marketplace.aziende_stato s where s.azienda_id = p_azienda), false);
$$;

-- AncheCasa (admin) quando pubblica i suoi cantieri si vede come «AncheCasa».
create or replace function marketplace.is_admin_utente(p_utente uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.admins a where a.id = p_utente);
$$;

-- Voti nei due sensi: «esecutore» = chi ha lavorato (qualità e tempi), «committente» = chi ha chiesto (pagamenti).
create table if not exists marketplace.aziende_voti (
  id          uuid primary key default gen_random_uuid(),
  richiesta_id uuid not null,
  da_azienda  uuid not null references auth.users (id) on delete cascade,
  a_azienda   uuid not null references auth.users (id) on delete cascade,
  ruolo       text not null check (ruolo in ('esecutore', 'committente')),
  voto        smallint not null check (voto between 1 and 5),
  testo       text not null default '' check (length(testo) <= 800),
  creato      timestamptz not null default now(),
  unique (richiesta_id, da_azienda, a_azienda)
);
alter table marketplace.aziende_voti enable row level security;
drop policy if exists aziende_voti_admin on marketplace.aziende_voti;
create policy aziende_voti_admin on marketplace.aziende_voti for select using (marketplace.is_admin());

create or replace function marketplace.cnt_voto(p_azienda uuid, p_ruolo text)
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select jsonb_build_object('media', round(avg(v.voto)::numeric, 1), 'n', count(*))
  from marketplace.aziende_voti v where v.a_azienda = p_azienda and v.ruolo = p_ruolo;
$$;

revoke all on function marketplace.cnt_servizi(uuid), marketplace.cnt_bollino(uuid), marketplace.cnt_sponsor(uuid), marketplace.cnt_voto(uuid, text) from public, anon;
grant execute on function marketplace.cnt_servizi(uuid), marketplace.cnt_bollino(uuid), marketplace.cnt_sponsor(uuid), marketplace.cnt_voto(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 1. CANTIERI
-- ---------------------------------------------------------------------------
create table if not exists marketplace.cantieri (
  id          uuid primary key default gen_random_uuid(),
  azienda_id  uuid not null references auth.users (id) on delete cascade,
  creato      timestamptz not null default now(),
  nome        text not null check (length(btrim(nome)) between 2 and 120),
  committente text not null default 'privato' check (committente in ('privato', 'pubblico')),
  cig         text not null default '' check (length(cig) <= 20),
  cup         text not null default '' check (length(cup) <= 20),
  indirizzo   text not null default '' check (length(indirizzo) <= 160),
  comune      text not null default '' check (length(comune) <= 80),
  provincia   text not null check (length(provincia) = 2),
  regione     text not null default '' check (length(regione) <= 40),
  dal         date,
  al          date,
  importo     numeric(14, 2),
  note        text not null default '' check (length(note) <= 1000),
  stato       text not null default 'aperto' check (stato in ('aperto', 'chiuso'))
);
create index if not exists cantieri_azienda on marketplace.cantieri (azienda_id, creato desc);
alter table marketplace.cantieri enable row level security;
drop policy if exists cantieri_miei on marketplace.cantieri;
create policy cantieri_miei on marketplace.cantieri for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());
drop policy if exists cantieri_admin on marketplace.cantieri;
create policy cantieri_admin on marketplace.cantieri for select using (marketplace.is_admin());
grant select, insert, update on marketplace.cantieri to authenticated;

create table if not exists marketplace.cantiere_richieste (
  id          uuid primary key default gen_random_uuid(),
  cantiere_id uuid not null references marketplace.cantieri (id) on delete cascade,
  azienda_id  uuid not null references auth.users (id) on delete cascade,
  creato      timestamptz not null default now(),
  tipo        text not null check (tipo in ('materiali', 'noleggio', 'lavori', 'impianti', 'personale')),
  titolo      text not null check (length(btrim(titolo)) between 2 and 120),
  voci        jsonb not null check (jsonb_typeof(voci) = 'array' and jsonb_array_length(voci) between 1 and 80),
  pagamenti   text not null default '' check (length(pagamenti) <= 300),
  scadenza    date,
  urgente     boolean not null default false,
  nota        text not null default '' check (length(nota) <= 1500),
  stato       text not null default 'aperta' check (stato in ('aperta', 'scelta', 'annullata')),
  parent_id   uuid references marketplace.cantiere_richieste (id) on delete set null,
  scelta_il   timestamptz,
  allargata_il timestamptz,
  avvisato_rete timestamptz
);
create index if not exists cantiere_richieste_cantiere on marketplace.cantiere_richieste (cantiere_id, creato desc);
create index if not exists cantiere_richieste_aperte on marketplace.cantiere_richieste (stato, creato);
alter table marketplace.cantiere_richieste enable row level security;
drop policy if exists cantiere_richieste_mie on marketplace.cantiere_richieste;
create policy cantiere_richieste_mie on marketplace.cantiere_richieste for select using (azienda_id = auth.uid() or marketplace.is_admin());

create table if not exists marketplace.cantiere_invitati (
  richiesta_id uuid not null references marketplace.cantiere_richieste (id) on delete cascade,
  azienda_id   uuid not null references auth.users (id) on delete cascade,
  motivo       text not null default 'zona' check (motivo in ('zona', 'regione', 'invito', 'cerca')),
  creato       timestamptz not null default now(),
  avvisato_il  timestamptz,
  primary key (richiesta_id, azienda_id)
);
create index if not exists cantiere_invitati_azienda on marketplace.cantiere_invitati (azienda_id, creato desc);
alter table marketplace.cantiere_invitati enable row level security;
drop policy if exists cantiere_invitati_admin on marketplace.cantiere_invitati;
create policy cantiere_invitati_admin on marketplace.cantiere_invitati for select using (marketplace.is_admin());

-- Ditte di fiducia invitate per mail (anche non iscritte: ricevono l'invito a iscriversi).
create table if not exists marketplace.cantiere_inviti_mail (
  id           uuid primary key default gen_random_uuid(),
  richiesta_id uuid not null references marketplace.cantiere_richieste (id) on delete cascade,
  email        text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 160),
  creato       timestamptz not null default now(),
  avvisato_il  timestamptz,
  unique (richiesta_id, email)
);
alter table marketplace.cantiere_inviti_mail enable row level security;
drop policy if exists cantiere_inviti_mail_admin on marketplace.cantiere_inviti_mail;
create policy cantiere_inviti_mail_admin on marketplace.cantiere_inviti_mail for select using (marketplace.is_admin());

create table if not exists marketplace.cantiere_offerte (
  id           uuid primary key default gen_random_uuid(),
  richiesta_id uuid not null references marketplace.cantiere_richieste (id) on delete cascade,
  azienda_id   uuid not null references auth.users (id) on delete cascade,
  creato       timestamptz not null default now(),
  righe        jsonb not null check (jsonb_typeof(righe) = 'array'),
  totale       numeric(14, 2) not null default 0,
  tempi        text not null default '' check (length(tempi) <= 120),
  giorni       int check (giorni is null or giorni between 1 and 1000),
  nota         text not null default '' check (length(nota) <= 1000),
  stato        text not null default 'inviata' check (stato in ('inviata', 'scelta', 'parziale', 'non_scelta')),
  voci_scelte  text[] not null default '{}',
  motivo       text not null default '' check (motivo in ('', 'prezzo', 'tempi', 'voci_mancanti', 'fiducia', 'annullato')),
  motivo_nota  text not null default '' check (length(motivo_nota) <= 300),
  avvisato     text not null default '',
  unique (richiesta_id, azienda_id)
);
alter table marketplace.cantiere_offerte enable row level security;
drop policy if exists cantiere_offerte_admin on marketplace.cantiere_offerte;
create policy cantiere_offerte_admin on marketplace.cantiere_offerte for select using (marketplace.is_admin());

create table if not exists marketplace.cantiere_domande (
  id           uuid primary key default gen_random_uuid(),
  richiesta_id uuid not null references marketplace.cantiere_richieste (id) on delete cascade,
  azienda_id   uuid not null references auth.users (id) on delete cascade,
  creato       timestamptz not null default now(),
  testo        text not null check (length(btrim(testo)) between 2 and 800),
  sopralluogo  boolean not null default false,
  risposta     text not null default '' check (length(risposta) <= 1500),
  risposta_il  timestamptz,
  avvisato     text not null default ''
);
alter table marketplace.cantiere_domande enable row level security;
drop policy if exists cantiere_domande_admin on marketplace.cantiere_domande;
create policy cantiere_domande_admin on marketplace.cantiere_domande for select using (marketplace.is_admin());

-- ---------------------------------------------------------------------------
-- 2. FUNZIONI DI CHI PUBBLICA
-- ---------------------------------------------------------------------------
-- Le prime p_quanti aziende che offrono p_servizio e coprono la provincia: prima gli sponsor, poi le più vicine, poi il voto.
create or replace function marketplace.cnt_destinatari(p_servizio text, p_provincia text, p_comune text, p_escludi uuid, p_quanti int)
returns table (azienda_id uuid) language sql stable security definer set search_path = marketplace, public as $$
  select p.id from marketplace.profiles p
  where p.famiglia = 'azienda' and p.verifica = 'verificato' and p.id <> p_escludi
    and p_servizio = any (marketplace.cnt_servizi(p.id))
    and marketplace.prev_copre(p.id, p_provincia)
    and marketplace.azienda_puo_lavorare(p.id)
  order by marketplace.cnt_sponsor(p.id) desc, marketplace.prev_vicinanza(p.id, p_comune, p_provincia),
    coalesce((marketplace.cnt_voto(p.id, 'esecutore')->>'media')::numeric, 0) desc
  limit p_quanti;
$$;
revoke all on function marketplace.cnt_destinatari(text, text, text, uuid, int) from public, anon, authenticated;

create or replace function marketplace.cantiere_salva(p jsonb)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid := nullif(p->>'id', '')::uuid;
begin
  if auth.uid() is null then raise exception 'serve_accesso'; end if;
  if not marketplace.is_admin() and coalesce((select famiglia::text from marketplace.profiles where id = auth.uid()), '') <> 'azienda' then raise exception 'solo_aziende'; end if;
  if length(coalesce(p->>'provincia', '')) <> 2 then raise exception 'serve_la_provincia'; end if;
  if v_id is null then
    insert into marketplace.cantieri (azienda_id, nome, committente, cig, cup, indirizzo, comune, provincia, regione, dal, al, importo, note)
    values (auth.uid(), left(btrim(coalesce(p->>'nome', '')), 120), case when p->>'committente' = 'pubblico' then 'pubblico' else 'privato' end,
      left(coalesce(p->>'cig', ''), 20), left(coalesce(p->>'cup', ''), 20), left(coalesce(p->>'indirizzo', ''), 160), left(coalesce(p->>'comune', ''), 80),
      upper(p->>'provincia'), left(coalesce(p->>'regione', ''), 40), nullif(p->>'dal', '')::date, nullif(p->>'al', '')::date,
      nullif(p->>'importo', '')::numeric, left(coalesce(p->>'note', ''), 1000))
    returning id into v_id;
  else
    update marketplace.cantieri set nome = left(btrim(coalesce(p->>'nome', '')), 120), committente = case when p->>'committente' = 'pubblico' then 'pubblico' else 'privato' end,
      cig = left(coalesce(p->>'cig', ''), 20), cup = left(coalesce(p->>'cup', ''), 20), indirizzo = left(coalesce(p->>'indirizzo', ''), 160),
      comune = left(coalesce(p->>'comune', ''), 80), provincia = upper(p->>'provincia'), regione = left(coalesce(p->>'regione', ''), 40),
      dal = nullif(p->>'dal', '')::date, al = nullif(p->>'al', '')::date, importo = nullif(p->>'importo', '')::numeric,
      note = left(coalesce(p->>'note', ''), 1000), stato = case when p->>'stato' = 'chiuso' then 'chiuso' else 'aperto' end
    where id = v_id and azienda_id = auth.uid();
    if not found then raise exception 'non_si_puo'; end if;
  end if;
  return v_id;
end;
$$;

-- I miei cantieri con le richieste e i numeri di ognuna.
create or replace function marketplace.cantieri_miei()
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(jsonb_agg(to_jsonb(c) || jsonb_build_object('richieste', coalesce((
      select jsonb_agg(to_jsonb(r) || jsonb_build_object(
        'offerte', (select count(*) from marketplace.cantiere_offerte o where o.richiesta_id = r.id),
        'invitati', (select count(*) from marketplace.cantiere_invitati i where i.richiesta_id = r.id),
        'domande', (select count(*) from marketplace.cantiere_domande d where d.richiesta_id = r.id and d.risposta = '')) order by r.creato desc)
      from marketplace.cantiere_richieste r where r.cantiere_id = c.id), '[]'::jsonb)) order by c.stato, c.creato desc), '[]'::jsonb)
  from marketplace.cantieri c where c.azienda_id = auth.uid();
$$;

create or replace function marketplace.cantiere_pubblica(p jsonb)
returns uuid language plpgsql security definer set search_path = marketplace, public, auth as $$
declare
  c marketplace.cantieri%rowtype;
  v_id uuid; v_s text; v_mail text; v_az uuid; v_lim int;
begin
  select * into c from marketplace.cantieri where id = nullif(p->>'cantiere_id', '')::uuid and azienda_id = auth.uid();
  if not found then raise exception 'cantiere_non_trovato'; end if;
  if not marketplace.is_admin() then
    if not marketplace.azienda_puo_lavorare(auth.uid()) then raise exception 'serve_verifica'; end if;
    select coalesce((select limite_richieste from marketplace.aziende_stato where azienda_id = auth.uid()), 20) into v_lim;
    if (select count(*) from marketplace.cantiere_richieste where azienda_id = auth.uid() and creato > now() - interval '30 days') >= v_lim then raise exception 'limite_mese'; end if;
  end if;
  if p->>'tipo' not in ('materiali', 'noleggio', 'lavori', 'impianti', 'personale') then raise exception 'tipo_non_valido'; end if;
  if jsonb_typeof(p->'voci') <> 'array' or jsonb_array_length(p->'voci') = 0 then raise exception 'servono_le_voci'; end if;
  if exists (select 1 from jsonb_array_elements(p->'voci') x where coalesce(x->>'id', '') = '' or length(btrim(coalesce(x->>'voce', ''))) < 2 or coalesce(x->>'servizio', '') = '') then raise exception 'voce_non_valida'; end if;
  insert into marketplace.cantiere_richieste (cantiere_id, azienda_id, tipo, titolo, voci, pagamenti, scadenza, urgente, nota, parent_id)
  values (c.id, auth.uid(), p->>'tipo', left(btrim(coalesce(p->>'titolo', '')), 120), p->'voci', left(coalesce(p->>'pagamenti', ''), 300),
    nullif(p->>'scadenza', '')::date, coalesce((p->>'urgente')::boolean, false), left(coalesce(p->>'nota', ''), 1500), nullif(p->>'parent_id', '')::uuid)
  returning id into v_id;
  -- Le prime 10 della zona per ogni servizio richiesto.
  for v_s in select distinct x->>'servizio' from jsonb_array_elements(p->'voci') x loop
    insert into marketplace.cantiere_invitati (richiesta_id, azienda_id, motivo)
    select v_id, d.azienda_id, 'zona' from marketplace.cnt_destinatari(v_s, c.provincia, c.comune, auth.uid(), 10) d
    on conflict do nothing;
  end loop;
  -- Ditte di fiducia: se sono già iscritte entrano tra gli invitati, altrimenti ricevono l'invito a iscriversi.
  if jsonb_typeof(p->'inviti') = 'array' then
    for v_mail in select distinct lower(btrim(x)) from jsonb_array_elements_text(p->'inviti') x limit 10 loop
      continue when v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';
      select u.id into v_az from auth.users u join marketplace.profiles pr on pr.id = u.id where lower(u.email) = v_mail and pr.famiglia = 'azienda' limit 1;
      if v_az is not null and v_az <> auth.uid() then
        insert into marketplace.cantiere_invitati (richiesta_id, azienda_id, motivo) values (v_id, v_az, 'invito')
        on conflict (richiesta_id, azienda_id) do update set motivo = 'invito';
      elsif v_az is null then
        insert into marketplace.cantiere_inviti_mail (richiesta_id, email) values (v_id, v_mail) on conflict do nothing;
      end if;
      v_az := null;
    end loop;
  end if;
  return v_id;
end;
$$;

create or replace function marketplace.cantiere_annulla(p_richiesta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.cantiere_richieste set stato = 'annullata' where id = p_richiesta and azienda_id = auth.uid() and stato = 'aperta';
  if not found then raise exception 'non_si_puo'; end if;
  update marketplace.cantiere_offerte set stato = 'non_scelta', motivo = 'annullato' where richiesta_id = p_richiesta and stato = 'inviata';
end;
$$;

-- Subappaltatori che hanno detto di lavorare in subappalto in quel settore e in quella zona. Niente contatti.
create or replace function marketplace.subappaltatori_cerca(p_servizio text, p_provincia text, p_comune text)
returns table (id uuid, nome text, comune text, vicinanza int, sponsor boolean, bollino jsonb, voto jsonb)
language sql stable security definer set search_path = marketplace, public as $$
  select p.id, coalesce(p.nome, 'Azienda'), coalesce(z.sede_comune, ''), marketplace.prev_vicinanza(p.id, p_comune, p_provincia),
    marketplace.cnt_sponsor(p.id), marketplace.cnt_bollino(p.id), marketplace.cnt_voto(p.id, 'esecutore')
  from marketplace.profiles p
  join marketplace.aziende_offro o on o.azienda_id = p.id and o.subappalto
  left join marketplace.fornitori_zona z on z.azienda_id = p.id
  where auth.uid() is not null and p.famiglia = 'azienda' and p.verifica = 'verificato' and p.id <> auth.uid()
    and p_servizio = any (o.servizi) and marketplace.prev_copre(p.id, p_provincia) and marketplace.azienda_puo_lavorare(p.id)
  order by 5 desc, 4, 2
  limit 50;
$$;

create or replace function marketplace.cantiere_invita(p_richiesta uuid, p_azienda uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not exists (select 1 from marketplace.cantiere_richieste where id = p_richiesta and azienda_id = auth.uid() and stato = 'aperta') then raise exception 'non_si_puo'; end if;
  if not exists (select 1 from marketplace.aziende_offro o, marketplace.profiles p where o.azienda_id = p_azienda and o.subappalto and p.id = p_azienda and p.verifica = 'verificato') then raise exception 'azienda_non_disponibile'; end if;
  insert into marketplace.cantiere_invitati (richiesta_id, azienda_id, motivo) values (p_richiesta, p_azienda, 'cerca') on conflict do nothing;
end;
$$;

-- Le offerte arrivate (per chi ha pubblicato). Mail solo delle aziende scelte.
create or replace function marketplace.cantiere_offerte_di(p_richiesta uuid)
returns jsonb language sql stable security definer set search_path = marketplace, public, auth as $$
  select case when not exists (select 1 from marketplace.cantiere_richieste r where r.id = p_richiesta and (r.azienda_id = auth.uid() or marketplace.is_admin())) then null else jsonb_build_object(
    'offerte', coalesce((select jsonb_agg(to_jsonb(o) || jsonb_build_object('azienda', coalesce(p.nome, 'Azienda'), 'bollino', marketplace.cnt_bollino(o.azienda_id),
        'voto', marketplace.cnt_voto(o.azienda_id, 'esecutore'), 'sponsor', marketplace.cnt_sponsor(o.azienda_id),
        'vicinanza', marketplace.prev_vicinanza(o.azienda_id, c.comune, c.provincia),
        'mail', case when o.stato in ('scelta', 'parziale') then u.email::text else '' end,
        'mio_voto', (select v.voto from marketplace.aziende_voti v where v.richiesta_id = o.richiesta_id and v.da_azienda = auth.uid() and v.a_azienda = o.azienda_id)) order by o.totale)
      from marketplace.cantiere_offerte o join marketplace.cantiere_richieste r on r.id = o.richiesta_id join marketplace.cantieri c on c.id = r.cantiere_id
      join marketplace.profiles p on p.id = o.azienda_id join auth.users u on u.id = o.azienda_id
      where o.richiesta_id = p_richiesta), '[]'::jsonb),
    'domande', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'creato', d.creato, 'testo', d.testo, 'sopralluogo', d.sopralluogo, 'risposta', d.risposta,
        'azienda', coalesce(p.nome, 'Azienda')) order by d.creato) from marketplace.cantiere_domande d join marketplace.profiles p on p.id = d.azienda_id where d.richiesta_id = p_richiesta), '[]'::jsonb),
    'invitati', (select count(*) from marketplace.cantiere_invitati i where i.richiesta_id = p_richiesta)) end;
$$;

-- La scelta: p_scelte = {id voce: id offerta}; p_motivi = {id offerta: {motivo, nota}} per chi non è scelto.
create or replace function marketplace.cantiere_scegli(p_richiesta uuid, p_scelte jsonb, p_motivi jsonb)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.cantiere_richieste%rowtype; o record; v record; g record;
  v_scelte text[]; v_righe text[]; v_m text; v_scoperte jsonb;
begin
  select * into r from marketplace.cantiere_richieste where id = p_richiesta and azienda_id = auth.uid() for update;
  if not found then raise exception 'non_trovata'; end if;
  if r.stato <> 'aperta' then raise exception 'gia_scelta'; end if;
  if jsonb_typeof(p_scelte) <> 'object' then raise exception 'scelta_non_valida'; end if;
  -- Ogni voce scelta deve avere un prezzo nell'offerta indicata.
  for v in select key as voce, value #>> '{}' as offerta from jsonb_each(p_scelte) loop
    if not exists (select 1 from marketplace.cantiere_offerte x, jsonb_array_elements(x.righe) e
                   where x.id = v.offerta::uuid and x.richiesta_id = r.id and e->>'id' = v.voce) then raise exception 'voce_senza_prezzo'; end if;
  end loop;
  -- Lavori e impianti: ogni lavorazione intera e a una sola azienda.
  if r.tipo in ('lavori', 'impianti') then
    for g in select x->>'servizio' as s, count(*) as n, count(p_scelte->>(x->>'id')) as scelte, count(distinct p_scelte->>(x->>'id')) as aziende
             from jsonb_array_elements(r.voci) x group by 1 loop
      if g.scelte > 0 and (g.scelte < g.n or g.aziende > 1) then raise exception 'lavorazione_intera'; end if;
    end loop;
  end if;
  for o in select * from marketplace.cantiere_offerte where richiesta_id = r.id loop
    select coalesce(array_agg(key), '{}') into v_scelte from jsonb_each_text(p_scelte) where value = o.id::text;
    select coalesce(array_agg(e->>'id'), '{}') into v_righe from jsonb_array_elements(o.righe) e;
    v_m := coalesce(p_motivi->o.id::text->>'motivo', '');
    if cardinality(v_scelte) = 0 then
      if v_m not in ('prezzo', 'tempi', 'voci_mancanti', 'fiducia', 'annullato') then raise exception 'serve_il_motivo'; end if;
      update marketplace.cantiere_offerte set stato = 'non_scelta', voci_scelte = '{}', motivo = v_m, motivo_nota = left(coalesce(p_motivi->o.id::text->>'nota', ''), 300) where id = o.id;
    else
      update marketplace.cantiere_offerte set stato = case when v_righe <@ v_scelte then 'scelta' else 'parziale' end, voci_scelte = v_scelte,
        motivo = case when v_righe <@ v_scelte then '' when v_m in ('prezzo', 'tempi', 'voci_mancanti', 'fiducia', 'annullato') then v_m else 'prezzo' end,
        motivo_nota = left(coalesce(p_motivi->o.id::text->>'nota', ''), 300) where id = o.id;
    end if;
  end loop;
  update marketplace.cantiere_richieste set stato = 'scelta', scelta_il = now() where id = r.id;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_scoperte from jsonb_array_elements(r.voci) x where not p_scelte ? (x->>'id');
  return jsonb_build_object('scoperte', v_scoperte);
end;
$$;

create or replace function marketplace.cantiere_rispondi(p_domanda uuid, p_risposta text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  update marketplace.cantiere_domande d set risposta = left(coalesce(p_risposta, ''), 1500), risposta_il = now()
  from marketplace.cantiere_richieste r where d.id = p_domanda and r.id = d.richiesta_id and r.azienda_id = auth.uid();
  if not found then raise exception 'non_si_puo'; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. FUNZIONI DI CHI RICEVE
-- ---------------------------------------------------------------------------
create or replace function marketplace.cantiere_richieste_per_me()
returns jsonb language sql stable security definer set search_path = marketplace, public, auth as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'creato', r.creato, 'tipo', r.tipo, 'titolo', r.titolo, 'voci', r.voci, 'pagamenti', r.pagamenti, 'scadenza', r.scadenza,
    'urgente', r.urgente, 'nota', r.nota, 'stato', r.stato, 'motivo_invito', i.motivo,
    'cantiere', c.nome, 'comune', c.comune, 'provincia', c.provincia, 'committente', c.committente, 'dal', c.dal, 'al', c.al,
    'vicinanza', marketplace.prev_vicinanza(i.azienda_id, c.comune, c.provincia),
    'richiedente_id', r.azienda_id,
    'richiedente', case when marketplace.is_admin_utente(r.azienda_id) then 'AncheCasa' else coalesce(pr.nome, 'Azienda') end,
    'voto_richiedente', marketplace.cnt_voto(r.azienda_id, 'committente'),
    'offerte', (select count(*) from marketplace.cantiere_offerte y where y.richiesta_id = r.id),
    'mia', (select to_jsonb(o) from marketplace.cantiere_offerte o where o.richiesta_id = r.id and o.azienda_id = i.azienda_id),
    'indirizzo', case when exists (select 1 from marketplace.cantiere_offerte o where o.richiesta_id = r.id and o.azienda_id = i.azienda_id and o.stato in ('scelta', 'parziale')) then c.indirizzo else '' end,
    'mail', case when exists (select 1 from marketplace.cantiere_offerte o where o.richiesta_id = r.id and o.azienda_id = i.azienda_id and o.stato in ('scelta', 'parziale')) then u.email::text else '' end,
    'mio_voto', (select v.voto from marketplace.aziende_voti v where v.richiesta_id = r.id and v.da_azienda = i.azienda_id and v.a_azienda = r.azienda_id),
    'domande', coalesce((select jsonb_agg(jsonb_build_object('testo', d.testo, 'sopralluogo', d.sopralluogo, 'risposta', d.risposta, 'mia', d.azienda_id = i.azienda_id) order by d.creato)
      from marketplace.cantiere_domande d where d.richiesta_id = r.id and (d.risposta <> '' or d.azienda_id = i.azienda_id)), '[]'::jsonb)
  ) order by (r.stato = 'aperta') desc, r.creato desc), '[]'::jsonb)
  from marketplace.cantiere_invitati i
  join marketplace.cantiere_richieste r on r.id = i.richiesta_id
  join marketplace.cantieri c on c.id = r.cantiere_id
  left join marketplace.profiles pr on pr.id = r.azienda_id
  join auth.users u on u.id = r.azienda_id
  where i.azienda_id = auth.uid() and r.creato > now() - interval '180 days';
$$;

-- p = {richiesta, righe:[{id, prezzo}], tempi, giorni, nota}. Prezzo unitario; il totale lo calcola il database.
create or replace function marketplace.cantiere_offri(p jsonb)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.cantiere_richieste%rowtype; v_id uuid; v_tot numeric := 0; g record; e record;
begin
  select * into r from marketplace.cantiere_richieste where id = nullif(p->>'richiesta', '')::uuid;
  if not found then raise exception 'non_trovata'; end if;
  if not exists (select 1 from marketplace.cantiere_invitati where richiesta_id = r.id and azienda_id = auth.uid()) then raise exception 'non_invitato'; end if;
  if r.stato <> 'aperta' or (r.scadenza is not null and r.scadenza < current_date) then raise exception 'chiusa'; end if;
  if jsonb_typeof(p->'righe') <> 'array' or jsonb_array_length(p->'righe') = 0 then raise exception 'servono_i_prezzi'; end if;
  for e in select x->>'id' as id, nullif(x->>'prezzo', '')::numeric as prezzo from jsonb_array_elements(p->'righe') x loop
    if e.prezzo is null or e.prezzo <= 0 then raise exception 'prezzo_non_valido'; end if;
    select v_tot + e.prezzo * coalesce(nullif(v->>'qta', '')::numeric, 1) into v_tot from jsonb_array_elements(r.voci) v where v->>'id' = e.id;
    if not found then raise exception 'voce_sconosciuta'; end if;
  end loop;
  if r.tipo in ('lavori', 'impianti') then
    for g in select x->>'servizio' as s, count(*) as n,
               count(*) filter (where exists (select 1 from jsonb_array_elements(p->'righe') y where y->>'id' = x->>'id')) as prezzate
             from jsonb_array_elements(r.voci) x group by 1 loop
      if g.prezzate > 0 and g.prezzate < g.n then raise exception 'lavorazione_intera'; end if;
    end loop;
  end if;
  insert into marketplace.cantiere_offerte (richiesta_id, azienda_id, righe, totale, tempi, giorni, nota)
  values (r.id, auth.uid(), p->'righe', round(v_tot, 2), left(coalesce(p->>'tempi', ''), 120), nullif(p->>'giorni', '')::int, left(coalesce(p->>'nota', ''), 1000))
  on conflict (richiesta_id, azienda_id) do update set righe = excluded.righe, totale = excluded.totale, tempi = excluded.tempi, giorni = excluded.giorni,
    nota = excluded.nota, creato = now(), avvisato = ''
  where marketplace.cantiere_offerte.stato = 'inviata'
  returning id into v_id;
  if v_id is null then raise exception 'gia_decisa'; end if;
  return v_id;
end;
$$;

create or replace function marketplace.cantiere_domanda(p_richiesta uuid, p_testo text, p_sopralluogo boolean)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not exists (select 1 from marketplace.cantiere_invitati i join marketplace.cantiere_richieste r on r.id = i.richiesta_id
                 where i.richiesta_id = p_richiesta and i.azienda_id = auth.uid() and r.stato = 'aperta') then raise exception 'non_si_puo'; end if;
  if (select count(*) from marketplace.cantiere_domande where richiesta_id = p_richiesta and azienda_id = auth.uid()) >= 10 then raise exception 'troppe_domande'; end if;
  insert into marketplace.cantiere_domande (richiesta_id, azienda_id, testo, sopralluogo) values (p_richiesta, auth.uid(), left(btrim(p_testo), 800), coalesce(p_sopralluogo, false));
end;
$$;

-- Voto dopo la scelta: chi ha chiesto vota chi ha lavorato, chi ha lavorato vota chi ha chiesto.
create or replace function marketplace.cantiere_voto(p_richiesta uuid, p_azienda uuid, p_voto int, p_testo text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare r marketplace.cantiere_richieste%rowtype; v_ruolo text;
begin
  select * into r from marketplace.cantiere_richieste where id = p_richiesta and stato = 'scelta';
  if not found then raise exception 'non_si_puo'; end if;
  if r.azienda_id = auth.uid() and exists (select 1 from marketplace.cantiere_offerte where richiesta_id = r.id and azienda_id = p_azienda and stato in ('scelta', 'parziale')) then v_ruolo := 'esecutore';
  elsif p_azienda = r.azienda_id and exists (select 1 from marketplace.cantiere_offerte where richiesta_id = r.id and azienda_id = auth.uid() and stato in ('scelta', 'parziale')) then v_ruolo := 'committente';
  else raise exception 'non_si_puo'; end if;
  insert into marketplace.aziende_voti (richiesta_id, da_azienda, a_azienda, ruolo, voto, testo)
  values (r.id, auth.uid(), p_azienda, v_ruolo, greatest(1, least(5, p_voto)), left(coalesce(p_testo, ''), 800))
  on conflict (richiesta_id, da_azienda, a_azienda) do update set voto = excluded.voto, testo = excluded.testo, creato = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. ADMIN E RETE: scheda delle aziende con i voti; giro dei 48 giorni
-- ---------------------------------------------------------------------------
create or replace function marketplace.aziende_voti_scheda(p_regione text)
returns table (id uuid, nome text, tipo_azienda text, comune text, regione text, servizi text[], esecutore jsonb, committente jsonb, bollino jsonb, sponsor boolean,
  richieste int, offerte int)
language sql stable security definer set search_path = marketplace, public as $$
  select p.id, coalesce(p.nome, 'Azienda'), p.tipo_azienda, coalesce(z.sede_comune, ''), coalesce(z.sede_regione, ''), marketplace.cnt_servizi(p.id),
    marketplace.cnt_voto(p.id, 'esecutore'), marketplace.cnt_voto(p.id, 'committente'), marketplace.cnt_bollino(p.id), marketplace.cnt_sponsor(p.id),
    (select count(*)::int from marketplace.cantiere_richieste r where r.azienda_id = p.id),
    (select count(*)::int from marketplace.cantiere_offerte o where o.azienda_id = p.id)
  from marketplace.profiles p left join marketplace.fornitori_zona z on z.azienda_id = p.id
  where p.famiglia = 'azienda'
    and (marketplace.is_admin() or exists (select 1 from marketplace.profiles me where me.id = auth.uid() and me.famiglia::text = 'agente'))
    and (coalesce(p_regione, '') = '' or z.sede_regione = p_regione)
  order by coalesce((marketplace.cnt_voto(p.id, 'esecutore')->>'media')::numeric, 0) desc, 2
  limit 500;
$$;

-- Sponsor e limite delle richieste (admin).
create or replace function marketplace.azienda_admin_sponsor(p_azienda uuid, p_sponsor_fino date, p_limite int)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  insert into marketplace.aziende_stato (azienda_id, sponsor_fino, limite_richieste) values (p_azienda, p_sponsor_fino, coalesce(p_limite, 20))
  on conflict (azienda_id) do update set sponsor_fino = excluded.sponsor_fino, limite_richieste = excluded.limite_richieste, updated_at = now();
end;
$$;

-- Ogni 5 minuti (preventivi-avvisa): richieste aperte da 48 ore senza offerte → altre 10 aziende della regione.
create or replace function marketplace.cantieri_giro()
returns int language plpgsql security definer set search_path = marketplace, public as $$
declare r record; v_s text; n int := 0;
begin
  for r in select q.*, c.regione, c.comune, c.provincia from marketplace.cantiere_richieste q join marketplace.cantieri c on c.id = q.cantiere_id
           where q.stato = 'aperta' and q.allargata_il is null and q.creato < now() - interval '48 hours'
             and not exists (select 1 from marketplace.cantiere_offerte o where o.richiesta_id = q.id) loop
    for v_s in select distinct x->>'servizio' from jsonb_array_elements(r.voci) x loop
      insert into marketplace.cantiere_invitati (richiesta_id, azienda_id, motivo)
      select r.id, p.id, 'regione' from marketplace.profiles p join marketplace.fornitori_zona z on z.azienda_id = p.id
      where p.famiglia = 'azienda' and p.verifica = 'verificato' and p.id <> r.azienda_id and z.sede_regione = r.regione and r.regione <> ''
        and v_s = any (marketplace.cnt_servizi(p.id)) and marketplace.azienda_puo_lavorare(p.id)
        and not exists (select 1 from marketplace.cantiere_invitati i where i.richiesta_id = r.id and i.azienda_id = p.id)
      order by marketplace.cnt_sponsor(p.id) desc, marketplace.prev_vicinanza(p.id, r.comune, r.provincia)
      limit 10
      on conflict do nothing;
    end loop;
    update marketplace.cantiere_richieste set allargata_il = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function marketplace.cantiere_salva(jsonb), marketplace.cantieri_miei(), marketplace.cantiere_pubblica(jsonb), marketplace.cantiere_annulla(uuid),
  marketplace.subappaltatori_cerca(text, text, text), marketplace.cantiere_invita(uuid, uuid), marketplace.cantiere_offerte_di(uuid),
  marketplace.cantiere_scegli(uuid, jsonb, jsonb), marketplace.cantiere_rispondi(uuid, text), marketplace.cantiere_richieste_per_me(),
  marketplace.cantiere_offri(jsonb), marketplace.cantiere_domanda(uuid, text, boolean), marketplace.cantiere_voto(uuid, uuid, int, text),
  marketplace.is_admin_utente(uuid), marketplace.aziende_voti_scheda(text), marketplace.azienda_admin_sponsor(uuid, date, int) from public, anon;
grant execute on function marketplace.cantiere_salva(jsonb), marketplace.cantieri_miei(), marketplace.cantiere_pubblica(jsonb), marketplace.cantiere_annulla(uuid),
  marketplace.subappaltatori_cerca(text, text, text), marketplace.cantiere_invita(uuid, uuid), marketplace.cantiere_offerte_di(uuid),
  marketplace.cantiere_scegli(uuid, jsonb, jsonb), marketplace.cantiere_rispondi(uuid, text), marketplace.cantiere_richieste_per_me(),
  marketplace.cantiere_offri(jsonb), marketplace.cantiere_domanda(uuid, text, boolean), marketplace.cantiere_voto(uuid, uuid, int, text),
  marketplace.is_admin_utente(uuid), marketplace.aziende_voti_scheda(text), marketplace.azienda_admin_sponsor(uuid, date, int) to authenticated;
revoke all on function marketplace.cantieri_giro() from public, anon, authenticated;
grant execute on function marketplace.cantieri_giro() to service_role;

commit;

-- Controllo (sola lettura):
-- select to_regclass('marketplace.cantieri'), to_regclass('marketplace.cantiere_richieste'), to_regclass('marketplace.cantiere_offerte'), to_regclass('marketplace.aziende_offro'), to_regclass('marketplace.aziende_voti');
-- select proname from pg_proc where proname in ('cantiere_pubblica', 'cantiere_offri', 'cantiere_scegli', 'cantiere_richieste_per_me', 'subappaltatori_cerca', 'cantieri_giro', 'aziende_voti_scheda');
