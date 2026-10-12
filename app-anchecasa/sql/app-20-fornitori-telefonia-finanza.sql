-- app-20 · Fornitori di Telefonia e internet e di Finanza e assicurazioni (12.10.2026, decisioni di Nando, PROGETTO-DASHBOARD.md)
--
-- Stesso giro di luce e gas (app-19), con tabelle proprie: luce e gas non si tocca.
--   1. Il cliente (privato, impresa, o un commerciale della rete per un suo cliente) chiede offerte.
--   2. La richiesta arriva a TUTTI i fornitori di quella categoria, SENZA nome, mail e telefono.
--   3. Ogni fornitore manda una proposta (su carta AncheCasa con il suo logo). Solo dopo aver confermato l'accordo (app-19).
--   4. Il cliente, dal link nella mail (servizi.html), sceglie una proposta: solo quel fornitore riceve i contatti.
--   5. Il fornitore segna «contratto attivato». Se la richiesta l'ha fatta un commerciale, la vendita va a lui (app_vendite).
-- Il privato vede anche le offerte pubblicate dai fornitori (servizi_offerte_pubbliche).
-- Finanza: il fornitore scrive la sua iscrizione OAM o IVASS nella carta intestata; compare sulle proposte.
--
-- Solo aggiunte, più una modifica: energia_contratto_attivato ora registra la vendita al commerciale (decisione di Nando, 09:44).
-- Si può rilanciare.

begin;

-- ---------------------------------------------------------------------------
-- 0. Categorie: tipo_azienda → categoria
-- ---------------------------------------------------------------------------
create or replace function marketplace.servizi_categoria_di(p_tipo text)
returns text language sql immutable as $$
  select case p_tipo when 'azienda_telefonia' then 'telefonia' when 'azienda_finanza' then 'finanza' else null end;
$$;

create or replace function marketplace.servizi_mia_categoria()
returns text language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.servizi_categoria_di(p.tipo_azienda) from marketplace.profiles p
  where p.id = auth.uid() and p.verifica = 'verificato';
$$;
revoke all on function marketplace.servizi_mia_categoria() from public, anon;
grant execute on function marketplace.servizi_mia_categoria() to authenticated;

-- Carta intestata: la stessa di luce e gas, più l'iscrizione OAM / IVASS per la finanza.
alter table marketplace.energia_carta add column if not exists iscrizione text not null default '';

-- ---------------------------------------------------------------------------
-- 1. OFFERTE (il listino del fornitore)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.servizi_offerte (
  id           uuid primary key default gen_random_uuid(),
  azienda_id   uuid not null references auth.users (id) on delete cascade,
  categoria    text not null check (categoria in ('telefonia', 'finanza')),
  nome         text not null check (char_length(nome) between 1 and 80),
  tipo         text not null check (char_length(tipo) between 1 and 40),
  clienti      text not null default 'tutti' check (clienti in ('privati', 'imprese', 'tutti')),
  prezzo       numeric(12, 2),
  prezzo_su    text not null default 'mese' check (prezzo_su in ('mese', 'anno', 'una_tantum', 'da_calcolare')),
  attivazione  numeric(10, 2),
  durata_mesi  smallint check (durata_mesi is null or durata_mesi between 0 and 480),
  dettagli     text not null default '' check (char_length(dettagli) <= 200),
  note         text not null default '' check (char_length(note) <= 600),
  attiva       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists servizi_offerte_azienda_idx on marketplace.servizi_offerte (azienda_id);
create index if not exists servizi_offerte_attive_idx on marketplace.servizi_offerte (categoria, attiva);
alter table marketplace.servizi_offerte enable row level security;

drop policy if exists servizi_offerte_proprie on marketplace.servizi_offerte;
create policy servizi_offerte_proprie on marketplace.servizi_offerte
  for all to authenticated
  using (azienda_id = auth.uid())
  with check (azienda_id = auth.uid() and categoria = marketplace.servizi_mia_categoria());
drop policy if exists servizi_offerte_admin on marketplace.servizi_offerte;
create policy servizi_offerte_admin on marketplace.servizi_offerte for select using (marketplace.is_admin());
grant select, insert, update, delete on marketplace.servizi_offerte to authenticated;

-- Le offerte attive, con il nome e il logo del fornitore (per il privato, l'impresa e il commerciale).
create or replace function marketplace.servizi_offerte_pubbliche(p_categoria text)
returns table (id uuid, azienda text, logo text, iscrizione text, nome text, tipo text, clienti text, prezzo numeric, prezzo_su text,
  attivazione numeric, durata_mesi smallint, dettagli text, note text)
language sql stable security definer set search_path = marketplace, public as $$
  select o.id, coalesce(nullif(c.ragione, ''), pr.nome, 'Fornitore'), coalesce(pr.logo_url, ''), coalesce(c.iscrizione, ''),
    o.nome, o.tipo, o.clienti, o.prezzo, o.prezzo_su, o.attivazione, o.durata_mesi, o.dettagli, o.note
  from marketplace.servizi_offerte o
  join marketplace.profiles pr on pr.id = o.azienda_id and pr.verifica = 'verificato'
  left join marketplace.energia_carta c on c.azienda_id = o.azienda_id
  where o.attiva and o.categoria = p_categoria
  order by o.prezzo nulls last, o.created_at desc
  limit 200;
$$;
revoke all on function marketplace.servizi_offerte_pubbliche(text) from public;
grant execute on function marketplace.servizi_offerte_pubbliche(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. RICHIESTE DEI CLIENTI
-- ---------------------------------------------------------------------------
create table if not exists marketplace.servizi_richieste (
  id               uuid primary key default gen_random_uuid(),
  token            text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  creato           timestamptz not null default now(),
  categoria        text not null check (categoria in ('telefonia', 'finanza')),
  fonte            text not null default 'dashboard' check (fonte in ('magazine', 'dashboard', 'rete')),
  tipo             text not null check (char_length(tipo) between 1 and 40),
  cliente_tipo     text not null default 'privato' check (cliente_tipo in ('privato', 'impresa')),
  regione          text not null default '' check (length(regione) <= 40),
  comune           text not null default '' check (length(comune) <= 80),
  spesa_mese       numeric(10, 2),
  importo          numeric(14, 2),
  durata_mesi      smallint check (durata_mesi is null or durata_mesi between 0 and 480),
  quanti           smallint check (quanti is null or quanti between 0 and 999),
  attuale          text not null default '' check (length(attuale) <= 80),
  nota             text not null default '' check (length(nota) <= 500),
  nome             text not null check (length(btrim(nome)) between 2 and 120),
  mail             text not null check (mail ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono         text not null default '' check (length(telefono) <= 30),
  consenso         boolean not null check (consenso),
  richiedente_id   uuid references auth.users (id) on delete set null,
  inviato_da       uuid references auth.users (id) on delete set null,
  stato            text not null default 'aperta' check (stato in ('aperta', 'scelta', 'chiusa')),
  proposta_scelta  uuid,
  scelta_il        timestamptz,
  avvisato_il      timestamptz
);
create index if not exists servizi_richieste_stato on marketplace.servizi_richieste (categoria, stato, creato desc);
create index if not exists servizi_richieste_mail on marketplace.servizi_richieste (lower(mail), creato desc);
alter table marketplace.servizi_richieste enable row level security;

-- Le righe intere (con i contatti) le leggono solo l'admin e chi ha fatto la richiesta (cliente o commerciale).
drop policy if exists servizi_richieste_admin on marketplace.servizi_richieste;
create policy servizi_richieste_admin on marketplace.servizi_richieste for select using (marketplace.is_admin());
drop policy if exists servizi_richieste_mie on marketplace.servizi_richieste;
create policy servizi_richieste_mie on marketplace.servizi_richieste for select using (richiedente_id = auth.uid() or inviato_da = auth.uid());
grant select on marketplace.servizi_richieste to authenticated;

create or replace function marketplace.servizi_nuova_richiesta(p jsonb)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_mail text := lower(btrim(coalesce(p->>'mail', '')));
  v_cat text := p->>'categoria';
  v_tok text;
begin
  if v_cat not in ('telefonia', 'finanza') then raise exception 'categoria_non_valida'; end if;
  if coalesce((p->>'consenso')::boolean, false) is not true then raise exception 'serve_il_consenso'; end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'mail_non_valida'; end if;
  if (select count(*) from marketplace.servizi_richieste where lower(mail) = v_mail and creato > now() - interval '1 day') >= 5 then
    raise exception 'troppe_richieste';
  end if;
  insert into marketplace.servizi_richieste (categoria, fonte, tipo, cliente_tipo, regione, comune, spesa_mese, importo, durata_mesi, quanti,
    attuale, nota, nome, mail, telefono, consenso, richiedente_id, inviato_da)
  values (
    v_cat,
    case when p->>'fonte' in ('magazine', 'dashboard', 'rete') then p->>'fonte' else 'dashboard' end,
    left(coalesce(nullif(p->>'tipo', ''), 'altro'), 40),
    case when p->>'cliente_tipo' = 'impresa' then 'impresa' else 'privato' end,
    left(coalesce(p->>'regione', ''), 40), left(coalesce(p->>'comune', ''), 80),
    nullif(p->>'spesa_mese', '')::numeric, nullif(p->>'importo', '')::numeric,
    nullif(p->>'durata_mesi', '')::smallint, nullif(p->>'quanti', '')::smallint,
    left(coalesce(p->>'attuale', ''), 80), left(coalesce(p->>'nota', ''), 500),
    left(btrim(coalesce(p->>'nome', '')), 120), v_mail, left(btrim(coalesce(p->>'telefono', '')), 30), true,
    case when p->>'fonte' = 'rete' then null else auth.uid() end,
    case when p->>'fonte' = 'rete' then auth.uid() else null end
  )
  returning token into v_tok;
  return v_tok;
end;
$$;
revoke all on function marketplace.servizi_nuova_richiesta(jsonb) from public;
grant execute on function marketplace.servizi_nuova_richiesta(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. PROPOSTE
-- ---------------------------------------------------------------------------
create table if not exists marketplace.servizi_proposte (
  id           uuid primary key default gen_random_uuid(),
  azienda_id   uuid not null references auth.users (id) on delete cascade,
  categoria    text not null check (categoria in ('telefonia', 'finanza')),
  offerta_id   uuid references marketplace.servizi_offerte (id) on delete set null,
  richiesta_id uuid references marketplace.servizi_richieste (id) on delete cascade,
  numero       text not null,
  cliente      text not null,
  mail         text not null default '',
  prezzo       numeric(12, 2),
  prezzo_su    text not null default 'mese' check (prezzo_su in ('mese', 'anno', 'una_tantum', 'da_calcolare')),
  nota         text not null default '' check (char_length(nota) <= 400),
  stato        text not null default 'inviata' check (stato in ('inviata', 'accettata', 'rifiutata', 'attivata')),
  created_at   timestamptz not null default now(),
  attivata_il  timestamptz,
  unique (azienda_id, numero)
);
create index if not exists servizi_proposte_azienda_idx on marketplace.servizi_proposte (azienda_id, created_at desc);
create unique index if not exists servizi_proposte_una_per_richiesta on marketplace.servizi_proposte (richiesta_id, azienda_id) where richiesta_id is not null;
alter table marketplace.servizi_proposte enable row level security;

create or replace function marketplace.servizi_richiesta_aperta(p_id uuid, p_categoria text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.servizi_richieste where id = p_id and stato = 'aperta' and categoria = p_categoria);
$$;
grant execute on function marketplace.servizi_richiesta_aperta(uuid, text) to authenticated;

drop policy if exists servizi_proposte_proprie on marketplace.servizi_proposte;
create policy servizi_proposte_proprie on marketplace.servizi_proposte
  for select to authenticated using (azienda_id = auth.uid() or marketplace.is_admin());
drop policy if exists servizi_proposte_nuove on marketplace.servizi_proposte;
create policy servizi_proposte_nuove on marketplace.servizi_proposte
  for insert to authenticated with check (
    azienda_id = auth.uid() and stato = 'inviata'
    and categoria = marketplace.servizi_mia_categoria()
    and marketplace.fornitori_accordo_ok()
    and (richiesta_id is null or marketplace.servizi_richiesta_aperta(richiesta_id, categoria))
  );
drop policy if exists servizi_proposte_cambia on marketplace.servizi_proposte;
create policy servizi_proposte_cambia on marketplace.servizi_proposte
  for update to authenticated using (azienda_id = auth.uid() and stato = 'inviata') with check (azienda_id = auth.uid() and stato in ('inviata', 'rifiutata'));
drop policy if exists servizi_proposte_togli on marketplace.servizi_proposte;
create policy servizi_proposte_togli on marketplace.servizi_proposte
  for delete to authenticated using (azienda_id = auth.uid() and stato = 'inviata');
grant select, insert, update, delete on marketplace.servizi_proposte to authenticated;

-- Le richieste della mia categoria: senza contatti, tranne quando il cliente ha scelto la mia proposta.
create or replace function marketplace.servizi_richieste_per_me()
returns table (
  id uuid, creato timestamptz, categoria text, fonte text, tipo text, cliente_tipo text, regione text, comune text,
  spesa_mese numeric, importo numeric, durata_mesi smallint, quanti smallint, attuale text, nota text, stato text,
  mia_proposta uuid, mia_stato text, scelta_mia boolean, nome text, mail text, telefono text, proposte int
) language sql stable security definer set search_path = marketplace, public as $$
  select r.id, r.creato, r.categoria, r.fonte, r.tipo, r.cliente_tipo, r.regione, r.comune,
    r.spesa_mese, r.importo, r.durata_mesi, r.quanti, r.attuale, r.nota, r.stato,
    p.id, p.stato, (r.proposta_scelta is not null and r.proposta_scelta = p.id),
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.nome else '' end,
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.mail else '' end,
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.telefono else '' end,
    (select count(*)::int from marketplace.servizi_proposte x where x.richiesta_id = r.id)
  from marketplace.servizi_richieste r
  left join marketplace.servizi_proposte p on p.richiesta_id = r.id and p.azienda_id = auth.uid()
  where r.categoria = marketplace.servizi_mia_categoria()
    and (r.stato = 'aperta' or p.id is not null)
  order by r.creato desc
  limit 300;
$$;
revoke all on function marketplace.servizi_richieste_per_me() from public, anon;
grant execute on function marketplace.servizi_richieste_per_me() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. LA PAGINA DEL CLIENTE (servizi.html, dal link nella mail, senza accesso)
-- ---------------------------------------------------------------------------
create or replace function marketplace.servizi_le_mie_proposte(p_token text)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  r marketplace.servizi_richieste%rowtype;
begin
  select * into r from marketplace.servizi_richieste where token = p_token;
  if not found then return null; end if;
  return jsonb_build_object(
    'richiesta', jsonb_build_object('categoria', r.categoria, 'tipo', r.tipo, 'nome', split_part(r.nome, ' ', 1), 'creato', r.creato,
      'stato', r.stato, 'spesa_mese', r.spesa_mese, 'importo', r.importo, 'durata_mesi', r.durata_mesi, 'quanti', r.quanti,
      'proposta_scelta', r.proposta_scelta),
    'proposte', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'numero', p.numero, 'stato', p.stato, 'prezzo', p.prezzo, 'prezzo_su', p.prezzo_su, 'nota', p.nota, 'creato', p.created_at,
        'azienda', coalesce(nullif(c.ragione, ''), pr.nome, 'Fornitore'), 'logo', coalesce(pr.logo_url, ''), 'iscrizione', coalesce(c.iscrizione, ''),
        'offerta', case when o.id is null then null else jsonb_build_object('nome', o.nome, 'tipo', o.tipo, 'durata_mesi', o.durata_mesi,
          'attivazione', o.attivazione, 'dettagli', o.dettagli, 'note', o.note) end
      ) order by p.prezzo nulls last, p.created_at)
      from marketplace.servizi_proposte p
      left join marketplace.energia_carta c on c.azienda_id = p.azienda_id
      left join marketplace.profiles pr on pr.id = p.azienda_id
      left join marketplace.servizi_offerte o on o.id = p.offerta_id
      where p.richiesta_id = r.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function marketplace.servizi_le_mie_proposte(text) from public;
grant execute on function marketplace.servizi_le_mie_proposte(text) to anon, authenticated;

create or replace function marketplace.servizi_accetta(p_token text, p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.servizi_richieste%rowtype;
begin
  select * into r from marketplace.servizi_richieste where token = p_token for update;
  if not found then raise exception 'richiesta_non_trovata'; end if;
  if r.stato <> 'aperta' then raise exception 'gia_scelta'; end if;
  if not exists (select 1 from marketplace.servizi_proposte where id = p_proposta and richiesta_id = r.id) then raise exception 'proposta_non_trovata'; end if;
  update marketplace.servizi_richieste set stato = 'scelta', proposta_scelta = p_proposta, scelta_il = now() where id = r.id;
  update marketplace.servizi_proposte set stato = 'accettata' where id = p_proposta;
end;
$$;
revoke all on function marketplace.servizi_accetta(text, uuid) from public;
grant execute on function marketplace.servizi_accetta(text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. CONTRATTO ATTIVATO · la vendita va al commerciale che ha fatto la richiesta (decisione di Nando, 12.10.2026 09:44)
-- ---------------------------------------------------------------------------
create or replace function marketplace.fornitori_vendita_al_commerciale(p_venditore uuid, p_cliente text, p_regione text, p_dettaglio text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if p_venditore is null then return; end if;
  begin
    insert into marketplace.app_vendite (venditore, cliente_nome, cliente_regione, cosa, dettaglio, importo, tipo_importo, stato, attivata)
    values (p_venditore, left(coalesce(nullif(btrim(p_cliente), ''), 'Cliente'), 120), left(coalesce(p_regione, ''), 40), 'servizio',
      left(p_dettaglio, 200), 0, 'una_tantum', 'attiva', now());
  exception when others then
    -- La vendita al commerciale non deve mai bloccare il contratto: l'admin la vede comunque dalla richiesta.
    null;
  end;
end;
$$;
revoke all on function marketplace.fornitori_vendita_al_commerciale(uuid, text, text, text) from public, anon, authenticated;

create or replace function marketplace.servizi_contratto_attivato(p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.servizi_richieste%rowtype;
  v_az text;
begin
  update marketplace.servizi_proposte set stato = 'attivata', attivata_il = now()
  where id = p_proposta and azienda_id = auth.uid() and stato = 'accettata';
  if not found then raise exception 'non_si_puo'; end if;
  update marketplace.servizi_richieste set stato = 'chiusa' where proposta_scelta = p_proposta returning * into r;
  if r.inviato_da is not null then
    select coalesce(nullif(c.ragione, ''), pr.nome, 'fornitore') into v_az
    from marketplace.profiles pr left join marketplace.energia_carta c on c.azienda_id = pr.id where pr.id = auth.uid();
    perform marketplace.fornitori_vendita_al_commerciale(r.inviato_da, r.nome, r.regione,
      (case r.categoria when 'telefonia' then 'Telefonia e internet' else 'Finanza e assicurazioni' end) || ' · ' || r.tipo || ' · ' || coalesce(v_az, ''));
  end if;
end;
$$;
revoke all on function marketplace.servizi_contratto_attivato(uuid) from public, anon;
grant execute on function marketplace.servizi_contratto_attivato(uuid) to authenticated;

-- Luce e gas: stessa regola per le richieste fatte da un commerciale (fonte «rete», inviato_da).
create or replace function marketplace.energia_contratto_attivato(p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.energia_richieste%rowtype;
  v_az text;
begin
  update marketplace.energia_proposte set stato = 'attivata', attivata_il = now()
  where id = p_proposta and azienda_id = auth.uid() and stato = 'accettata';
  if not found then raise exception 'non_si_puo'; end if;
  update marketplace.energia_richieste set stato = 'chiusa' where proposta_scelta = p_proposta returning * into r;
  if r.inviato_da is not null then
    select coalesce(nullif(c.ragione, ''), pr.nome, 'fornitore') into v_az
    from marketplace.profiles pr left join marketplace.energia_carta c on c.azienda_id = pr.id where pr.id = auth.uid();
    perform marketplace.fornitori_vendita_al_commerciale(r.inviato_da, r.nome, r.regione, 'Luce e gas · ' || r.tipo || ' · ' || coalesce(v_az, ''));
  end if;
end;
$$;
revoke all on function marketplace.energia_contratto_attivato(uuid) from public, anon;
grant execute on function marketplace.energia_contratto_attivato(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. ADMIN: elenco fornitori con le nuove categorie e i numeri di tutte e tre
-- ---------------------------------------------------------------------------
create or replace function marketplace.fornitori_per_admin()
returns table (id uuid, nome text, mail text, tipo_azienda text, verifica text, creato timestamptz,
  accordo_tipo text, accordo_valore numeric, accordo_su text, accordo_note text, accordo_scritto timestamptz, accordo_confermato timestamptz,
  offerte int, proposte int, scelte int, attivati int)
language sql stable security definer set search_path = marketplace, public, auth as $$
  select p.id, p.nome, u.email::text, p.tipo_azienda, p.verifica::text, u.created_at,
    a.tipo, a.valore, a.su_cosa, a.note, a.scritto_il, a.confermato_il,
    (select count(*)::int from marketplace.energia_offerte o where o.azienda_id = p.id and o.attiva)
      + (select count(*)::int from marketplace.servizi_offerte o where o.azienda_id = p.id and o.attiva),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id)
      + (select count(*)::int from marketplace.servizi_proposte x where x.azienda_id = p.id),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id and x.stato in ('accettata', 'attivata'))
      + (select count(*)::int from marketplace.servizi_proposte x where x.azienda_id = p.id and x.stato in ('accettata', 'attivata')),
    (select count(*)::int from marketplace.energia_proposte x where x.azienda_id = p.id and x.stato = 'attivata')
      + (select count(*)::int from marketplace.servizi_proposte x where x.azienda_id = p.id and x.stato = 'attivata')
  from marketplace.profiles p
  join auth.users u on u.id = p.id
  left join marketplace.fornitori_accordi a on a.azienda_id = p.id
  where marketplace.is_admin()
    and p.famiglia = 'azienda'
    and p.tipo_azienda in ('azienda_luce_gas', 'azienda_telefonia', 'azienda_finanza', 'azienda_materiali_edili', 'azienda_noleggio_attrezzature', 'azienda_fornitori_it')
  order by u.created_at desc;
$$;
revoke all on function marketplace.fornitori_per_admin() from public, anon;
grant execute on function marketplace.fornitori_per_admin() to authenticated;

commit;

-- Controllo (sola lettura):
-- select to_regclass('marketplace.servizi_richieste'), to_regclass('marketplace.servizi_offerte'), to_regclass('marketplace.servizi_proposte');
-- select proname from pg_proc where proname like 'servizi_%' order by 1;
