-- =============================================================================
-- AncheCasa app · parte 9: SOPRALLUOGO E PRATICA (11.10.2026)
-- Da eseguire DOPO app-08. Si può rieseguire senza danni.
--
-- Decisioni (Nando, 11.10.2026):
--  1. Il Sopralluogo apre la pratica: Agente (o tecnico) + Ditta + Cliente.
--     Filo: Sopralluogo → Preventivo → Accettazione e apertura Cantiere → Fattura elettronica (SdI).
--  2. Nuova tabella app_sopralluoghi. NON è il tipo 'sopralluogo' di app_record, che resta il sopralluogo
--     di sicurezza di AncheSicura.
--  3. L'agente spesso non è dentro la ditta: per questo il sopralluogo salva i dati del cliente (cliente_dati).
--     Alla conversione in preventivo il cliente diventa una scheda «cliente» della ditta (se non c'era già).
--  4. Preventivi e fatture ricordano il sopralluogo di origine (colonna sopralluogo). La fattura nata da un
--     preventivo lo eredita da sola.
--  5. Se il sopralluogo nasce da un affare della rete (app_affari), all'apertura del cantiere l'affare viene
--     collegato al cantiere: le provvigioni seguono la stessa pratica.
--  6. Agente e ditta vedono il riepilogo della pratica: «Sopralluogo il 10/10 di Mario per Impresa X →
--     Preventivo 12/2026 accettato → Cantiere attivo → Fattura 3/2026 consegnata».
-- =============================================================================

create table if not exists marketplace.app_sopralluoghi (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,          -- la ditta che farà il lavoro
  agente uuid default auth.uid() references auth.users(id) on delete set null,     -- chi ha fatto il sopralluogo
  tecnico text not null default '' check (length(tecnico) <= 80),                  -- nome, se non usa l'app
  cliente uuid references marketplace.app_record(id) on delete set null,           -- scheda cliente della ditta, se c'è
  cliente_dati jsonb not null default '{}'::jsonb check (pg_column_size(cliente_dati) < 8000),
  quando timestamptz not null default now(),
  indirizzo text not null default '' check (length(indirizzo) <= 200),
  lat numeric(9,6) check (lat is null or lat between -90 and 90),
  lng numeric(9,6) check (lng is null or lng between -180 and 180),
  lavori text not null default '' check (length(lavori) <= 300),                   -- cosa chiede il cliente
  note text not null default '' check (length(note) <= 4000),                      -- note tecniche, misure
  foto int not null default 0 check (foto between 0 and 30),                       -- file in documenti/sopralluoghi/<id>/
  stato text not null default 'programmato' check (stato in ('programmato', 'completato', 'convertito', 'annullato')),
  preventivo uuid references marketplace.app_fe_documenti(id) on delete set null,
  cantiere uuid references marketplace.app_record(id) on delete set null,
  affare uuid references marketplace.app_affari(id) on delete set null,
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
create index if not exists app_sopralluoghi_org on marketplace.app_sopralluoghi (org, quando desc);
create index if not exists app_sopralluoghi_agente on marketplace.app_sopralluoghi (agente, quando desc);

alter table marketplace.app_fe_documenti add column if not exists sopralluogo uuid references marketplace.app_sopralluoghi(id) on delete set null;
create index if not exists app_fe_documenti_sopralluogo on marketplace.app_fe_documenti (sopralluogo) where sopralluogo is not null;

-- ---------------------------------------------------------------------------
-- Chi è un agente della rete
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_sono_in_rete()
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo');
$$;
create or replace function marketplace.app_vedo_sopralluogo(p_org uuid, p_agente uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or p_agente = auth.uid() or marketplace.app_fe_legge(p_org)
      or exists (select 1 from marketplace.app_rete r where r.utente = p_agente and r.superiore = auth.uid());   -- il capo diretto
$$;

-- ---------------------------------------------------------------------------
-- Controlli: i collegamenti (preventivo, cantiere) li mettono solo le funzioni
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_sopralluoghi_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if new.cliente is not null and not exists (select 1 from marketplace.app_record where id = new.cliente and org = new.org and tipo = 'cliente') then
    raise exception 'cliente_non_valido';
  end if;
  if new.affare is not null and not marketplace.is_admin() and not marketplace.app_fe_sistema()
     and not exists (select 1 from marketplace.app_affari a where a.id = new.affare and (a.segnalato_da = auth.uid() or a.chiude = auth.uid() or a.segue = auth.uid())) then
    raise exception 'affare_non_tuo';
  end if;
  if tg_op = 'INSERT' then
    if not (marketplace.is_admin() or marketplace.app_fe_sistema()) then
      new.agente := auth.uid(); new.preventivo := null; new.cantiere := null;
      if new.stato not in ('programmato', 'completato') then new.stato := 'programmato'; end if;
    end if;
    return new;
  end if;
  if not (marketplace.is_admin() or marketplace.app_fe_sistema()) then
    new.id := old.id; new.org := old.org; new.agente := old.agente; new.creato := old.creato;
    new.preventivo := old.preventivo; new.cantiere := old.cantiere;
    if old.stato = 'convertito' then new.stato := old.stato;
    elsif new.stato = 'convertito' then new.stato := old.stato; end if;
  end if;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_sopralluoghi_controlli on marketplace.app_sopralluoghi;
create trigger app_sopralluoghi_controlli before insert or update on marketplace.app_sopralluoghi
  for each row execute function marketplace.app_sopralluoghi_controlli();

-- Sui documenti: il collegamento al sopralluogo lo mette solo il sistema; la fattura lo eredita dal preventivo.
create or replace function marketplace.app_fe_documenti_sopralluogo()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.app_fe_sistema() then
    new.sopralluogo := case when tg_op = 'UPDATE' then old.sopralluogo else null end;
  end if;
  if new.sopralluogo is null and new.origine is not null then
    select sopralluogo into new.sopralluogo from marketplace.app_fe_documenti where id = new.origine;
  end if;
  return new;
end;
$$;
drop trigger if exists app_fe_documenti_sopralluogo on marketplace.app_fe_documenti;
create trigger app_fe_documenti_sopralluogo before insert or update on marketplace.app_fe_documenti
  for each row execute function marketplace.app_fe_documenti_sopralluogo();

-- ---------------------------------------------------------------------------
-- Permessi
-- ---------------------------------------------------------------------------
alter table marketplace.app_sopralluoghi enable row level security;
drop policy if exists app_sopralluoghi_leggi on marketplace.app_sopralluoghi;
create policy app_sopralluoghi_leggi on marketplace.app_sopralluoghi for select using (marketplace.app_vedo_sopralluogo(org, agente));
drop policy if exists app_sopralluoghi_crea on marketplace.app_sopralluoghi;
create policy app_sopralluoghi_crea on marketplace.app_sopralluoghi for insert with check (
  marketplace.is_admin() or marketplace.app_gestisce(org)
  or (marketplace.app_sono_in_rete() and exists (select 1 from marketplace.app_org o where o.id = org and o.stato = 'attiva'))
);
drop policy if exists app_sopralluoghi_cambia on marketplace.app_sopralluoghi;
create policy app_sopralluoghi_cambia on marketplace.app_sopralluoghi for update
  using (marketplace.is_admin() or marketplace.app_gestisce(org) or (agente = auth.uid() and stato in ('programmato', 'completato')))
  with check (marketplace.is_admin() or marketplace.app_gestisce(org) or agente = auth.uid());
grant select, insert, update on marketplace.app_sopralluoghi to authenticated;
grant all on marketplace.app_sopralluoghi to service_role;

-- ---------------------------------------------------------------------------
-- Funzioni del filo
-- ---------------------------------------------------------------------------
-- Sopralluogo → Preventivo (bozza della ditta). Possono farlo la ditta e l'agente del sopralluogo.
create or replace function marketplace.app_sopralluogo_a_preventivo(p_sopralluogo uuid)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi;
  v_cliente uuid;
  v_nome text;
  v_cond text;
  v_id uuid;
begin
  select * into v_s from marketplace.app_sopralluoghi where id = p_sopralluogo for update;
  if not found then raise exception 'sopralluogo_non_trovato'; end if;
  if not (marketplace.app_fe_scrive(v_s.org) or (v_s.agente = auth.uid() and marketplace.app_modulo_attivo(v_s.org, 'ufficio'))) then
    raise exception 'non_autorizzato';
  end if;
  if v_s.preventivo is not null then return v_s.preventivo; end if;
  if v_s.stato = 'annullato' then raise exception 'sopralluogo_annullato'; end if;

  perform set_config('app.fe_sistema', '1', true);
  v_cliente := v_s.cliente;
  if v_cliente is null then
    v_nome := coalesce(nullif(v_s.cliente_dati->>'denominazione', ''), btrim(coalesce(v_s.cliente_dati->>'nome', '') || ' ' || coalesce(v_s.cliente_dati->>'cognome', '')));
    if coalesce(v_nome, '') = '' then raise exception 'manca_il_cliente'; end if;
    insert into marketplace.app_record (org, modulo, tipo, titolo, dati)
    values (v_s.org, 'ufficio', 'cliente', left(v_nome, 160), v_s.cliente_dati || jsonb_build_object('da_sopralluogo', v_s.id))
    returning id into v_cliente;
    update marketplace.app_sopralluoghi set cliente = v_cliente where id = v_s.id;
  end if;
  select condizioni into v_cond from marketplace.app_fe_profili where org = v_s.org;
  insert into marketplace.app_fe_documenti (org, tipo, stato_preventivo, data, validita_giorni, cliente, cliente_dati, oggetto, note, condizioni, sopralluogo, creato_da)
  values (v_s.org, 'preventivo', 'bozza', current_date, 30, v_cliente, v_s.cliente_dati, left(coalesce(nullif(v_s.lavori, ''), 'Lavori da sopralluogo'), 200),
          left('Sopralluogo del ' || to_char(v_s.quando at time zone 'Europe/Rome', 'DD/MM/YYYY') || case when v_s.indirizzo <> '' then ' in ' || v_s.indirizzo else '' end
               || case when v_s.note <> '' then E'.\n' || v_s.note else '' end, 2000),
          coalesce(v_cond, ''), v_s.id, auth.uid())
  returning id into v_id;
  insert into marketplace.app_fe_eventi (documento, tipo, testo) values (v_id, 'creato', 'Dal sopralluogo del ' || to_char(v_s.quando at time zone 'Europe/Rome', 'DD/MM/YYYY'));
  update marketplace.app_sopralluoghi set preventivo = v_id, stato = 'convertito' where id = v_s.id;
  perform marketplace.app_fe_numera(v_id);   -- con l'interruttore acceso; app_fe_numera lo spegne alla fine
  if v_s.agente is distinct from auth.uid() then perform marketplace.app_notifica(v_s.agente, 'Il tuo sopralluogo è diventato un preventivo', 'pratica/' || v_s.id); end if;
  perform marketplace.app_notifica_gestori(v_s.org, 'Nuovo preventivo da sopralluogo: ' || left(coalesce(nullif(v_s.lavori, ''), 'lavori'), 80), 'fe-vedi/' || v_id);
  return v_id;
end;
$$;

-- Preventivo accettato → Cantiere (scheda «cantiere» della ditta). Solo chi gestisce la ditta.
create or replace function marketplace.app_fe_apri_cantiere(p_preventivo uuid)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_p marketplace.app_fe_documenti;
  v_s marketplace.app_sopralluoghi;
  v_id uuid;
begin
  select * into v_p from marketplace.app_fe_documenti where id = p_preventivo for update;
  if not found or v_p.tipo <> 'preventivo' then raise exception 'preventivo_non_trovato'; end if;
  if not marketplace.app_fe_scrive(v_p.org) then raise exception 'non_autorizzato'; end if;
  if v_p.stato_preventivo <> 'accettato' then raise exception 'preventivo_non_accettato'; end if;
  if v_p.cantiere is not null then return v_p.cantiere; end if;
  if v_p.sopralluogo is not null then select * into v_s from marketplace.app_sopralluoghi where id = v_p.sopralluogo; end if;

  perform set_config('app.fe_sistema', '1', true);
  insert into marketplace.app_record (org, modulo, tipo, titolo, stato, data, importo, dati)
  values (v_p.org, 'cantieri', 'cantiere', left(coalesce(nullif(v_p.oggetto, ''), 'Cantiere'), 160), 'aperto', current_date, v_p.imponibile,
          jsonb_strip_nulls(jsonb_build_object('indirizzo', v_s.indirizzo, 'lat', v_s.lat, 'lng', v_s.lng, 'cliente', v_p.cliente,
            'cliente_nome', coalesce(v_p.cliente_dati->>'denominazione', btrim(coalesce(v_p.cliente_dati->>'nome', '') || ' ' || coalesce(v_p.cliente_dati->>'cognome', ''))),
            'preventivo', v_p.id, 'sopralluogo', v_p.sopralluogo)))
  returning id into v_id;
  update marketplace.app_fe_documenti set cantiere = v_id where id = v_p.id or (origine = v_p.id and not bloccato);
  if v_s.id is not null then
    update marketplace.app_sopralluoghi set cantiere = v_id where id = v_s.id;
    if v_s.affare is not null then update marketplace.app_affari set cantiere = v_id where id = v_s.affare and cantiere is null; end if;
  end if;
  insert into marketplace.app_fe_eventi (documento, tipo, testo) values (v_p.id, 'stato', 'Cantiere aperto');
  perform set_config('app.fe_sistema', '', true);
  if v_s.agente is not null then perform marketplace.app_notifica(v_s.agente, 'Cantiere aperto: ' || left(v_p.oggetto, 80), 'pratica/' || v_s.id); end if;
  return v_id;
end;
$$;

-- Riepilogo di una pratica (lo vedono agente, ditta, capo diretto dell'agente, admin)
create or replace function marketplace.app_pratica(p_sopralluogo uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi;
  v_ditta boolean;
  v jsonb;
begin
  select * into v_s from marketplace.app_sopralluoghi where id = p_sopralluogo;
  if not found or not marketplace.app_vedo_sopralluogo(v_s.org, v_s.agente) then raise exception 'pratica_non_trovata'; end if;
  v_ditta := marketplace.app_fe_legge(v_s.org);
  select jsonb_build_object(
    'id', v_s.id, 'stato', v_s.stato, 'quando', v_s.quando, 'indirizzo', v_s.indirizzo, 'lavori', v_s.lavori,
    'agente', coalesce((select nome from marketplace.profiles where id = v_s.agente), nullif(v_s.tecnico, ''), ''),
    'ditta', (select nome from marketplace.app_org where id = v_s.org),
    'cliente', coalesce(nullif(v_s.cliente_dati->>'denominazione', ''), btrim(coalesce(v_s.cliente_dati->>'nome', '') || ' ' || coalesce(v_s.cliente_dati->>'cognome', ''))),
    'preventivo', (select jsonb_build_object('id', d.id, 'numero', d.numero, 'anno', d.anno, 'stato', d.stato_preventivo,
                     'totale', case when v_ditta then d.totale end) from marketplace.app_fe_documenti d where d.id = v_s.preventivo),
    'cantiere', (select jsonb_build_object('id', r.id, 'titolo', r.titolo, 'stato', r.stato) from marketplace.app_record r where r.id = v_s.cantiere),
    'fatture', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'tipo', d.tipo, 'numero', d.numero, 'anno', d.anno, 'stato_sdi', d.stato_sdi,
                     'incassato', d.incassato, 'totale', case when v_ditta then d.totale end) order by d.data)
                   from marketplace.app_fe_documenti d where d.sopralluogo = v_s.id and d.tipo <> 'preventivo'), '[]'::jsonb),
    'ditta_vede', v_ditta
  ) into v;
  return v;
end;
$$;

-- Le pratiche di chi chiede: le sue (agente), quelle delle sue ditte, quelle del suo gruppo diretto
create or replace function marketplace.app_mie_pratiche(p_org uuid default null)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  if auth.uid() is null then raise exception 'accesso_richiesto'; end if;
  return coalesce((
    select jsonb_agg(marketplace.app_pratica(s.id) order by s.quando desc)
    from (select id, quando from marketplace.app_sopralluoghi s
          where (p_org is null or s.org = p_org) and marketplace.app_vedo_sopralluogo(s.org, s.agente)
          order by s.quando desc limit 50) s
  ), '[]'::jsonb);
end;
$$;

-- Le ditte che un agente può scegliere per un sopralluogo (l'agente non è dentro le ditte e non le vede in app_org)
create or replace function marketplace.app_ditte_rete()
returns table (id uuid, nome text, citta text, tipo text) language sql stable security definer set search_path = marketplace, public as $$
  select o.id, o.nome, o.citta, o.tipo from marketplace.app_org o
  where o.stato = 'attiva' and o.tipo in ('impresa', 'partner', 'gc')
    and (marketplace.is_admin() or marketplace.app_sono_in_rete() or marketplace.app_mio_ruolo(o.id) in ('titolare', 'responsabile'))
  order by o.nome limit 500;
$$;

-- Foto del sopralluogo: bucket privato «sopralluoghi», percorso <id sopralluogo>/<1..30>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sopralluoghi', 'sopralluoghi', false, 3145728, array['image/jpeg'])
on conflict (id) do nothing;
create or replace function marketplace.app_foto_sopralluogo(p_nome text, p_scrivi boolean)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_sopralluoghi s
    where p_nome ~ '^[0-9a-f-]{36}/([1-9]|[12][0-9]|30)\.jpg$' and s.id::text = split_part(p_nome, '/', 1)
      and (case when p_scrivi then (s.agente = auth.uid() or marketplace.app_gestisce(s.org)) and s.stato <> 'annullato'
                else marketplace.app_vedo_sopralluogo(s.org, s.agente) end)
  );
$$;
grant execute on function marketplace.app_foto_sopralluogo(text, boolean) to authenticated;
drop policy if exists app_sopralluoghi_foto_leggi on storage.objects;
create policy app_sopralluoghi_foto_leggi on storage.objects for select to authenticated using (bucket_id = 'sopralluoghi' and marketplace.app_foto_sopralluogo(name, false));
drop policy if exists app_sopralluoghi_foto_carica on storage.objects;
create policy app_sopralluoghi_foto_carica on storage.objects for insert to authenticated with check (bucket_id = 'sopralluoghi' and marketplace.app_foto_sopralluogo(name, true));

revoke all on function marketplace.app_ditte_rete() from public, anon;
grant execute on function marketplace.app_ditte_rete() to authenticated;
revoke all on function marketplace.app_sopralluogo_a_preventivo(uuid) from public, anon;
revoke all on function marketplace.app_fe_apri_cantiere(uuid) from public, anon;
revoke all on function marketplace.app_pratica(uuid) from public, anon;
revoke all on function marketplace.app_mie_pratiche(uuid) from public, anon;
grant execute on function marketplace.app_sono_in_rete() to authenticated;
grant execute on function marketplace.app_vedo_sopralluogo(uuid, uuid) to authenticated;
grant execute on function marketplace.app_sopralluogo_a_preventivo(uuid) to authenticated;
grant execute on function marketplace.app_fe_apri_cantiere(uuid) to authenticated;
grant execute on function marketplace.app_pratica(uuid) to authenticated;
grant execute on function marketplace.app_mie_pratiche(uuid) to authenticated;
