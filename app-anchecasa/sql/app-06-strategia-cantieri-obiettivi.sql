-- =============================================================================
-- AncheCasa app · parte 6: SALA STRATEGIA, LAVORI A SAL, OBIETTIVI (10.10.2026)
-- Da eseguire DOPO app-05. Si può rieseguire senza danni.
--
-- Decisioni di Nando (10.10.2026):
--  1. Sala strategia: i dirigenti (sviluppo rete, capi area, Responsabile Rete Italia, admin) aprono
--     un argomento e ne parlano. Decidono admin e Responsabile Rete Italia: se dicono sì tutti e due
--     diventa una «linea decisa» che vede tutta la rete. Se uno cambia il testo della linea,
--     l'altro deve ridire sì. Basta un no e l'argomento è scartato.
--  2. Il cliente privato non porta provvigioni, solo se fa un lavoro (contratti, art. 4.6).
--  3. Lavori (cantieri) a SAL come da contratto (Allegato A.2 e art. 4):
--     alla rete il 40% del margine lordo, diviso: chi segnala 10, chi chiude 25, chi segue il cantiere 30,
--     chi ha portato l'impresa 10, sviluppo rete 12, capo area 8, Responsabile Rete Italia 5.
--     Matura per tranche e solo sull'incassato: 30% firma e acconto, 30% metà lavori, 40% collaudo.
--     Il margine lo vede e lo scrive solo l'admin (non si comunica alla rete).
--  4. Obiettivi del mese: li fissano admin e Responsabile Rete Italia, per tutta Italia e per persona
--     (la persona risponde per sé e per chi ha sotto). Ognuno li vede ogni giorno nella sua home.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Chi è un dirigente
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_sono_dirigente()
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo' and ruolo in ('reteitalia', 'sviluppo', 'capoarea'));
$$;
revoke all on function marketplace.app_sono_dirigente() from public, anon;
grant execute on function marketplace.app_sono_dirigente() to authenticated;

-- ---------------------------------------------------------------------------
-- 1. SALA STRATEGIA
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_strategie (
  id uuid primary key default gen_random_uuid(),
  aperta_da uuid not null references auth.users(id) on delete cascade,
  titolo text not null check (length(btrim(titolo)) between 3 and 140),
  testo text not null default '' check (length(testo) <= 2000),
  tema text not null default 'altro' check (tema in ('vendite', 'zone', 'prodotti', 'persone', 'prezzi', 'altro')),
  linea text not null default '' check (length(linea) <= 1000),
  voto_admin text check (voto_admin in ('si', 'no')),
  voto_reteitalia text check (voto_reteitalia in ('si', 'no')),
  serve_reteitalia boolean not null default true,
  commenti jsonb not null default '[]'::jsonb,
  stato text not null default 'aperta' check (stato in ('aperta', 'decisa', 'scartata')),
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now(),
  deciso timestamptz
);
alter table marketplace.app_strategie enable row level security;
drop policy if exists app_strategie_leggi on marketplace.app_strategie;
create policy app_strategie_leggi on marketplace.app_strategie for select using (marketplace.app_sono_dirigente());
revoke insert, update, delete on marketplace.app_strategie from authenticated, anon;
grant select on marketplace.app_strategie to authenticated;

create or replace function marketplace.app_nome_rete(p_utente uuid)
returns text language sql stable security definer set search_path = marketplace, public as $$
  select coalesce((select nullif(nome, '') from marketplace.app_rete where utente = p_utente), case when exists (select 1 from marketplace.admins where id = p_utente) then 'Admin' else 'AncheCasa' end);
$$;
revoke all on function marketplace.app_nome_rete(uuid) from public, anon, authenticated;

create or replace function marketplace.app_strategia_apri(p_titolo text, p_testo text, p_tema text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_id uuid;
  v_ri boolean;
begin
  if not marketplace.app_sono_dirigente() then raise exception 'non_autorizzato'; end if;
  v_ri := exists (select 1 from marketplace.app_rete where ruolo = 'reteitalia' and stato = 'attivo');
  insert into marketplace.app_strategie (aperta_da, titolo, testo, tema, serve_reteitalia)
    values (auth.uid(), btrim(p_titolo), btrim(coalesce(p_testo, '')), coalesce(nullif(p_tema, ''), 'altro'), v_ri)
    returning id into v_id;
  perform marketplace.app_notifica_admin('Sala strategia: ' || btrim(p_titolo), 'strategia/' || v_id);
  insert into marketplace.app_notifiche (utente, testo, link)
    select utente, left('Sala strategia: ' || btrim(p_titolo), 200), 'strategia/' || v_id
    from marketplace.app_rete where stato = 'attivo' and ruolo in ('reteitalia', 'sviluppo', 'capoarea') and utente <> auth.uid();
  return v_id;
end;
$$;

create or replace function marketplace.app_strategia_commenta(p_id uuid, p_testo text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  s marketplace.app_strategie;
begin
  if not marketplace.app_sono_dirigente() then raise exception 'non_autorizzato'; end if;
  if length(btrim(coalesce(p_testo, ''))) < 2 or length(p_testo) > 1000 then raise exception 'testo_non_valido'; end if;
  select * into s from marketplace.app_strategie where id = p_id for update;
  if s.id is null or s.stato <> 'aperta' then raise exception 'argomento_chiuso'; end if;
  update marketplace.app_strategie set
    commenti = commenti || jsonb_build_array(jsonb_build_object('utente', auth.uid(), 'nome', marketplace.app_nome_rete(auth.uid()), 'ruolo', coalesce(marketplace.app_mio_ruolo_rete(), case when marketplace.is_admin() then 'admin' else '' end), 'testo', btrim(p_testo), 'quando', now())),
    aggiornato = now()
  where id = p_id;
  if s.aperta_da <> auth.uid() then perform marketplace.app_notifica(s.aperta_da, 'Nuovo commento: ' || s.titolo, 'strategia/' || p_id); end if;
end;
$$;

-- Decidono admin e Responsabile Rete Italia. Restituisce: decisa, in_attesa, scartata.
create or replace function marketplace.app_strategia_decidi(p_id uuid, p_si boolean, p_linea text, p_nota text)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  s marketplace.app_strategie;
  v_chi text;
  v_linea text := btrim(coalesce(p_linea, ''));
begin
  if marketplace.is_admin() then v_chi := 'admin';
  elsif exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo' and ruolo = 'reteitalia') then v_chi := 'reteitalia';
  else raise exception 'non_autorizzato'; end if;
  if length(v_linea) > 1000 then raise exception 'testo_non_valido'; end if;
  select * into s from marketplace.app_strategie where id = p_id for update;
  if s.id is null or s.stato <> 'aperta' then raise exception 'argomento_chiuso'; end if;

  s.commenti := s.commenti || jsonb_build_array(jsonb_build_object('utente', auth.uid(), 'nome', marketplace.app_nome_rete(auth.uid()), 'ruolo', v_chi, 'voto', case when p_si then 'si' else 'no' end, 'testo', btrim(coalesce(p_nota, '')), 'linea', v_linea, 'quando', now()));
  if not p_si then
    update marketplace.app_strategie set commenti = s.commenti, stato = 'scartata', deciso = now(), aggiornato = now(),
      voto_admin = case when v_chi = 'admin' then 'no' else voto_admin end,
      voto_reteitalia = case when v_chi = 'reteitalia' then 'no' else voto_reteitalia end
    where id = p_id;
    perform marketplace.app_notifica(s.aperta_da, 'Sala strategia, non passa: ' || s.titolo, 'strategia/' || p_id);
    return 'scartata';
  end if;

  -- se cambia il testo della linea, l'altro deve ridire sì
  if v_linea <> '' and v_linea is distinct from s.linea then
    s.linea := v_linea;
    if v_chi = 'admin' then s.voto_reteitalia := null; else s.voto_admin := null; end if;
  end if;
  if v_chi = 'admin' then s.voto_admin := 'si'; else s.voto_reteitalia := 'si'; end if;
  if s.linea = '' then s.linea := s.titolo; end if;

  if s.voto_admin = 'si' and (not s.serve_reteitalia or s.voto_reteitalia = 'si') then
    update marketplace.app_strategie set commenti = s.commenti, linea = s.linea, voto_admin = s.voto_admin, voto_reteitalia = s.voto_reteitalia,
      stato = 'decisa', deciso = now(), aggiornato = now() where id = p_id;
    insert into marketplace.app_notifiche (utente, testo, link)
      select utente, left('Nuova linea decisa: ' || s.titolo, 200), 'linee' from marketplace.app_rete where stato = 'attivo';
    return 'decisa';
  end if;
  update marketplace.app_strategie set commenti = s.commenti, linea = s.linea, voto_admin = s.voto_admin, voto_reteitalia = s.voto_reteitalia, aggiornato = now() where id = p_id;
  if v_chi = 'admin' then
    insert into marketplace.app_notifiche (utente, testo, link)
      select utente, left('Da decidere in sala strategia: ' || s.titolo, 200), 'strategia/' || p_id from marketplace.app_rete where stato = 'attivo' and ruolo = 'reteitalia';
  else
    perform marketplace.app_notifica_admin('Da decidere in sala strategia: ' || s.titolo, 'strategia/' || p_id);
  end if;
  return 'in_attesa';
end;
$$;

-- Le linee decise le vede tutta la rete (senza la discussione).
create or replace function marketplace.app_linee_decise()
returns table (id uuid, titolo text, linea text, tema text, deciso timestamptz)
language sql stable security definer set search_path = marketplace, public as $$
  select s.id, s.titolo, s.linea, s.tema, s.deciso from marketplace.app_strategie s
  where s.stato = 'decisa' and (marketplace.is_admin() or exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo'))
  order by s.deciso desc limit 50;
$$;

revoke all on function marketplace.app_strategia_apri(text, text, text) from public, anon;
revoke all on function marketplace.app_strategia_commenta(uuid, text) from public, anon;
revoke all on function marketplace.app_strategia_decidi(uuid, boolean, text, text) from public, anon;
revoke all on function marketplace.app_linee_decise() from public, anon;
grant execute on function marketplace.app_strategia_apri(text, text, text) to authenticated;
grant execute on function marketplace.app_strategia_commenta(uuid, text) to authenticated;
grant execute on function marketplace.app_strategia_decidi(uuid, boolean, text, text) to authenticated;
grant execute on function marketplace.app_linee_decise() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. PRIVATI: nessuna provvigione sulle vendite, solo sui lavori
-- ---------------------------------------------------------------------------
alter table marketplace.app_vendite add column if not exists cliente_tipo text not null default 'azienda';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'app_vendite_cliente_tipo_check') then
    alter table marketplace.app_vendite add constraint app_vendite_cliente_tipo_check check (cliente_tipo in ('azienda', 'privato'));
  end if;
end $$;

create or replace function marketplace.app_vendita_provvigioni()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  p jsonb;
  monte numeric;
  porta numeric;
  v_ruolo text;
  v_sup uuid;
  v_cur uuid;
  v_r text;
  v_ri uuid;
  pagati text[] := array[]::text[];
  v_quota numeric;
begin
  if old.stato = 'attiva' and current_user in ('authenticated', 'anon') then
    raise exception 'vendita_gia_confermata';
  end if;
  if not (new.stato = 'attiva' and old.stato is distinct from 'attiva') then return new; end if;
  new.attivata := now();
  -- 10.10.2026: il cliente privato non porta provvigioni (solo se fa un lavoro: vedi app_affari)
  if new.cliente_tipo = 'privato' then return new; end if;
  select valore into p from marketplace.app_impostazioni where chiave = 'provvigioni';
  monte := round(new.importo * coalesce((p->>'percentuale_vendita')::numeric, 0) / 100, 2);
  if monte <= 0 then return new; end if;
  porta := monte * coalesce((p->>'chi_porta')::numeric, 70) / 100;
  select ruolo, superiore into v_ruolo, v_sup from marketplace.app_rete where utente = new.venditore;
  if v_ruolo = 'subagente' and v_sup is not null then
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values
      (new.id, new.venditore, 'subagente', round(porta * coalesce((p->>'subagente')::numeric, 70) / 100, 2)),
      (new.id, v_sup, 'agente', round(porta * coalesce((p->>'agente')::numeric, 30) / 100, 2));
  else
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, new.venditore, coalesce(v_ruolo, 'venditore'), round(porta, 2));
  end if;
  v_cur := new.venditore;
  for i in 1..7 loop
    exit when v_cur is null;
    select ruolo, superiore into v_r, v_sup from marketplace.app_rete where utente = v_cur and stato = 'attivo';
    if v_r in ('capoarea', 'sviluppo', 'reteitalia') and not (v_r = any (pagati)) then
      v_quota := round(monte * coalesce((p->>v_r)::numeric, 0) / 100, 2);
      if v_quota > 0 then insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, v_cur, v_r, v_quota); end if;
      pagati := pagati || v_r;
    end if;
    v_cur := v_sup;
  end loop;
  if not ('reteitalia' = any (pagati)) then
    select utente into v_ri from marketplace.app_rete where ruolo = 'reteitalia' and stato = 'attivo' order by creato limit 1;
    v_quota := round(monte * coalesce((p->>'reteitalia')::numeric, 0) / 100, 2);
    if v_ri is not null and v_quota > 0 then insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, v_ri, 'reteitalia', v_quota); end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. LAVORI (cantieri) portati dalla rete, provvigioni a SAL
-- ---------------------------------------------------------------------------
insert into marketplace.app_impostazioni (chiave, valore) values ('cantieri', '{}'::jsonb) on conflict (chiave) do nothing;
update marketplace.app_impostazioni
  set valore = '{"rete":40,"tranche":[30,30,40],"segnala":10,"chiude":25,"segue":30,"impresa":10,"sviluppo":12,"capoarea":8,"reteitalia":5,"nota":"Contratti, Allegato A.2: 40% del margine lordo alla rete; tranche 30 firma e acconto, 30 metà lavori, 40 collaudo."}'::jsonb || valore
  where chiave = 'cantieri';

create table if not exists marketplace.app_affari (
  id uuid primary key default gen_random_uuid(),
  segnalato_da uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_nome text not null check (length(btrim(cliente_nome)) between 2 and 120),
  cliente_tipo text not null default 'privato' check (cliente_tipo in ('privato', 'azienda', 'condominio')),
  cliente_contatto text not null default '' check (length(cliente_contatto) <= 120),
  cliente_regione text not null default '' check (length(cliente_regione) <= 40),
  descrizione text not null default '' check (length(descrizione) <= 600),
  valore numeric(12,2) not null default 0 check (valore >= 0),
  chiude uuid references auth.users(id) on delete set null,
  segue uuid references auth.users(id) on delete set null,
  impresa_da uuid references auth.users(id) on delete set null,
  cantiere uuid references marketplace.app_record(id) on delete set null,
  stato text not null default 'proposta' check (stato in ('proposta', 'firmato', 'chiuso', 'perso')),
  creato timestamptz not null default now(),
  firmato timestamptz,
  chiuso timestamptz
);
create index if not exists app_affari_segnalato_idx on marketplace.app_affari (segnalato_da);
alter table marketplace.app_affari enable row level security;
drop policy if exists app_affari_leggi on marketplace.app_affari;
create policy app_affari_leggi on marketplace.app_affari for select using (
  marketplace.app_nella_mia_rete(segnalato_da) or auth.uid() in (chiude, segue, impresa_da)
);
drop policy if exists app_affari_crea on marketplace.app_affari;
create policy app_affari_crea on marketplace.app_affari for insert with check (
  segnalato_da = auth.uid() and stato = 'proposta' and chiude is null and segue is null and impresa_da is null and cantiere is null
  and exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo')
);
drop policy if exists app_affari_cambia on marketplace.app_affari;
create policy app_affari_cambia on marketplace.app_affari for update
  using ((segnalato_da = auth.uid() and stato = 'proposta') or marketplace.is_admin())
  with check (marketplace.is_admin() or (stato in ('proposta', 'perso') and chiude is null and segue is null and impresa_da is null and cantiere is null));
grant select, insert, update on marketplace.app_affari to authenticated;

-- il margine: solo admin
create table if not exists marketplace.app_affari_margine (
  affare uuid primary key references marketplace.app_affari(id) on delete cascade,
  margine numeric(12,2) not null check (margine >= 0),
  aggiornato timestamptz not null default now()
);
alter table marketplace.app_affari_margine enable row level security;
drop policy if exists app_affari_margine_admin on marketplace.app_affari_margine;
create policy app_affari_margine_admin on marketplace.app_affari_margine for select using (marketplace.is_admin());
revoke insert, update, delete on marketplace.app_affari_margine from authenticated, anon;
grant select on marketplace.app_affari_margine to authenticated;

create table if not exists marketplace.app_affari_tranche (
  affare uuid not null references marketplace.app_affari(id) on delete cascade,
  n smallint not null check (n between 1 and 3),
  nome text not null,
  quota numeric(5,2) not null,
  incassato numeric(12,2) not null default 0,
  incassato_il timestamptz,
  stato text not null default 'attesa' check (stato in ('attesa', 'incassata')),
  primary key (affare, n)
);
alter table marketplace.app_affari_tranche enable row level security;
drop policy if exists app_affari_tranche_leggi on marketplace.app_affari_tranche;
create policy app_affari_tranche_leggi on marketplace.app_affari_tranche for select using (exists (select 1 from marketplace.app_affari a where a.id = affare));
revoke insert, update, delete on marketplace.app_affari_tranche from authenticated, anon;
grant select on marketplace.app_affari_tranche to authenticated;

-- le provvigioni possono venire da una vendita o da un lavoro
alter table marketplace.app_provvigioni alter column vendita drop not null;
alter table marketplace.app_provvigioni add column if not exists affare uuid references marketplace.app_affari(id) on delete cascade;
alter table marketplace.app_provvigioni add column if not exists tranche smallint;
alter table marketplace.app_provvigioni drop constraint if exists app_provvigioni_origine_check;
alter table marketplace.app_provvigioni add constraint app_provvigioni_origine_check check (vendita is not null or affare is not null);

-- L'admin firma il lavoro: valore, margine, chi chiude, chi segue, chi ha portato l'impresa. Nascono le 3 tranche.
-- Si può richiamare per correggere i ruoli o il margine finché il lavoro non è chiuso.
create or replace function marketplace.app_affare_firma(p_affare uuid, p_valore numeric, p_margine numeric, p_chiude uuid, p_segue uuid, p_impresa_da uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  a marketplace.app_affari;
  p jsonb;
  t jsonb;
begin
  if not marketplace.is_admin() then raise exception 'non_autorizzato'; end if;
  select * into a from marketplace.app_affari where id = p_affare for update;
  if a.id is null or a.stato not in ('proposta', 'firmato') then raise exception 'lavoro_non_modificabile'; end if;
  if coalesce(p_margine, -1) < 0 or coalesce(p_valore, -1) < 0 then raise exception 'importo_non_valido'; end if;
  select valore into p from marketplace.app_impostazioni where chiave = 'cantieri';
  t := coalesce(p->'tranche', '[30,30,40]'::jsonb);
  update marketplace.app_affari set valore = p_valore, chiude = p_chiude, segue = p_segue, impresa_da = p_impresa_da,
    stato = 'firmato', firmato = coalesce(firmato, now()) where id = p_affare;
  insert into marketplace.app_affari_margine (affare, margine) values (p_affare, p_margine)
    on conflict (affare) do update set margine = excluded.margine, aggiornato = now();
  insert into marketplace.app_affari_tranche (affare, n, nome, quota) values
    (p_affare, 1, 'Firma e acconto', coalesce((t->>0)::numeric, 30)),
    (p_affare, 2, 'Metà lavori', coalesce((t->>1)::numeric, 30)),
    (p_affare, 3, 'Collaudo', coalesce((t->>2)::numeric, 40))
  on conflict (affare, n) do nothing;
  if a.stato = 'proposta' then
    perform marketplace.app_notifica(a.segnalato_da, 'Lavoro firmato: ' || a.cliente_nome, 're-lavoro/' || p_affare);
  end if;
end;
$$;

-- L'admin registra l'incasso di una tranche: maturano le provvigioni di quella tranche, in proporzione all'incassato.
create or replace function marketplace.app_tranche_incassata(p_affare uuid, p_n int, p_incasso numeric)
returns numeric language plpgsql security definer set search_path = marketplace, public as $$
declare
  a marketplace.app_affari;
  tr marketplace.app_affari_tranche;
  p jsonb;
  v_margine numeric;
  v_frazione numeric;
  monte numeric;
  v_cur uuid; v_r text; v_sup uuid; v_ri uuid; v_quota numeric;
  pagati text[] := array[]::text[];
begin
  if not marketplace.is_admin() then raise exception 'non_autorizzato'; end if;
  select * into a from marketplace.app_affari where id = p_affare for update;
  if a.id is null or a.stato <> 'firmato' then raise exception 'lavoro_non_firmato'; end if;
  select * into tr from marketplace.app_affari_tranche where affare = p_affare and n = p_n for update;
  if tr.affare is null or tr.stato <> 'attesa' then raise exception 'tranche_gia_incassata'; end if;
  if coalesce(p_incasso, -1) < 0 then raise exception 'importo_non_valido'; end if;
  select margine into v_margine from marketplace.app_affari_margine where affare = p_affare;
  select valore into p from marketplace.app_impostazioni where chiave = 'cantieri';
  v_frazione := case when a.valore * tr.quota / 100 > 0 then least(1, p_incasso / (a.valore * tr.quota / 100)) else 1 end;
  monte := round(coalesce(v_margine, 0) * coalesce((p->>'rete')::numeric, 40) / 100 * tr.quota / 100 * v_frazione, 2);

  update marketplace.app_affari_tranche set incassato = p_incasso, incassato_il = now(), stato = 'incassata' where affare = p_affare and n = p_n;
  if p_n = 3 then update marketplace.app_affari set stato = 'chiuso', chiuso = now() where id = p_affare; end if;
  if monte <= 0 then return 0; end if;

  -- ruoli sul lavoro
  insert into marketplace.app_provvigioni (affare, tranche, beneficiario, ruolo, importo)
  select p_affare, p_n, x.b, x.r, round(monte * coalesce((p->>x.r)::numeric, 0) / 100, 2)
  from (values (a.segnalato_da, 'segnala'), (a.chiude, 'chiude'), (a.segue, 'segue'), (a.impresa_da, 'impresa')) as x(b, r)
  where x.b is not null and coalesce((p->>x.r)::numeric, 0) > 0;
  -- quote di ruolo lungo la catena di chi ha segnalato
  v_cur := a.segnalato_da;
  for i in 1..7 loop
    exit when v_cur is null;
    select ruolo, superiore into v_r, v_sup from marketplace.app_rete where utente = v_cur and stato = 'attivo';
    if v_r in ('capoarea', 'sviluppo', 'reteitalia') and not (v_r = any (pagati)) then
      v_quota := round(monte * coalesce((p->>v_r)::numeric, 0) / 100, 2);
      if v_quota > 0 then insert into marketplace.app_provvigioni (affare, tranche, beneficiario, ruolo, importo) values (p_affare, p_n, v_cur, v_r, v_quota); end if;
      pagati := pagati || v_r;
    end if;
    v_cur := v_sup;
  end loop;
  if not ('reteitalia' = any (pagati)) then
    select utente into v_ri from marketplace.app_rete where ruolo = 'reteitalia' and stato = 'attivo' order by creato limit 1;
    v_quota := round(monte * coalesce((p->>'reteitalia')::numeric, 0) / 100, 2);
    if v_ri is not null and v_quota > 0 then insert into marketplace.app_provvigioni (affare, tranche, beneficiario, ruolo, importo) values (p_affare, p_n, v_ri, 'reteitalia', v_quota); end if;
  end if;
  insert into marketplace.app_notifiche (utente, testo, link)
    select distinct beneficiario, left('Incassata la tranche ' || p_n || ' di ' || a.cliente_nome || ': provvigioni maturate', 200), 're-guadagni'
    from marketplace.app_provvigioni where affare = p_affare and tranche = p_n;
  return monte;
end;
$$;

revoke all on function marketplace.app_affare_firma(uuid, numeric, numeric, uuid, uuid, uuid) from public, anon;
revoke all on function marketplace.app_tranche_incassata(uuid, int, numeric) from public, anon;
grant execute on function marketplace.app_affare_firma(uuid, numeric, numeric, uuid, uuid, uuid) to authenticated;
grant execute on function marketplace.app_tranche_incassata(uuid, int, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. OBIETTIVI DEL MESE
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_obiettivi (
  id uuid primary key default gen_random_uuid(),
  utente uuid references auth.users(id) on delete cascade,   -- vuoto = tutta Italia
  mese date not null check (extract(day from mese) = 1),
  aziende int not null default 0 check (aziende >= 0),          -- nuove aziende clienti attivate
  canoni numeric(12,2) not null default 0 check (canoni >= 0),  -- nuovi canoni al mese
  lavori int not null default 0 check (lavori >= 0),            -- lavori firmati
  valore numeric(12,2) not null default 0 check (valore >= 0),  -- valore dei lavori firmati
  nota text not null default '' check (length(nota) <= 300),
  fissato_da uuid references auth.users(id) on delete set null,
  aggiornato timestamptz not null default now()
);
create unique index if not exists app_obiettivi_unico on marketplace.app_obiettivi (coalesce(utente, '00000000-0000-0000-0000-000000000000'::uuid), mese);
alter table marketplace.app_obiettivi enable row level security;
drop policy if exists app_obiettivi_leggi on marketplace.app_obiettivi;
create policy app_obiettivi_leggi on marketplace.app_obiettivi for select using (
  (utente is null and (marketplace.is_admin() or exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo')))
  or (utente is not null and marketplace.app_nella_mia_rete(utente))
);
revoke insert, update, delete on marketplace.app_obiettivi from authenticated, anon;
grant select on marketplace.app_obiettivi to authenticated;

create or replace function marketplace.app_fissa_obiettivo(p_utente uuid, p_mese date, p_aziende int, p_canoni numeric, p_lavori int, p_valore numeric, p_nota text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_mese date := date_trunc('month', coalesce(p_mese, now()))::date;
begin
  if not (marketplace.is_admin() or exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo' and ruolo = 'reteitalia')) then
    raise exception 'non_autorizzato';
  end if;
  if p_utente is not null and not exists (select 1 from marketplace.app_rete where utente = p_utente) then raise exception 'persona_non_trovata'; end if;
  if least(coalesce(p_aziende, 0), coalesce(p_lavori, 0)) < 0 or least(coalesce(p_canoni, 0), coalesce(p_valore, 0)) < 0 then raise exception 'importo_non_valido'; end if;
  update marketplace.app_obiettivi set aziende = coalesce(p_aziende, 0), canoni = coalesce(p_canoni, 0), lavori = coalesce(p_lavori, 0), valore = coalesce(p_valore, 0),
    nota = left(coalesce(p_nota, ''), 300), fissato_da = auth.uid(), aggiornato = now()
  where utente is not distinct from p_utente and mese = v_mese;
  if not found then
    insert into marketplace.app_obiettivi (utente, mese, aziende, canoni, lavori, valore, nota, fissato_da)
    values (p_utente, v_mese, coalesce(p_aziende, 0), coalesce(p_canoni, 0), coalesce(p_lavori, 0), coalesce(p_valore, 0), left(coalesce(p_nota, ''), 300), auth.uid());
  end if;
  if p_utente is not null and p_utente <> auth.uid() then perform marketplace.app_notifica(p_utente, 'Nuovi obiettivi del mese', 'obiettivi'); end if;
end;
$$;
revoke all on function marketplace.app_fissa_obiettivo(uuid, date, int, numeric, int, numeric, text) from public, anon;
grant execute on function marketplace.app_fissa_obiettivo(uuid, date, int, numeric, int, numeric, text) to authenticated;
