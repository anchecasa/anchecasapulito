-- =============================================================================
-- AncheCasa app · parte 13: MAGAZZINO E MEZZI COLLEGATI AL CANTIERE (11.10.2026)
-- Da eseguire DOPO app-12. Si può rieseguire senza danni.
--
-- Cosa aggiunge alle schede «articolo» e «mezzo» che esistono già (modulo «magazzino»):
--  1. Movimenti di magazzino: carico (con costo), scarico al cantiere, reso dal cantiere,
--     trasferimento tra cantieri, rettifica d'inventario. La giacenza del deposito resta in
--     articolo.dati.giacenza (così il semaforo «Da riordinare» continua a funzionare) e il
--     costo medio ponderato in articolo.dati.costo_medio. I movimenti non si cancellano:
--     un errore si corregge con un reso o una rettifica.
--  2. Mezzi assegnati ai cantieri: dal/al, ore, km, carburante, costo al giorno.
--     Un mezzo non può stare in due cantieri negli stessi giorni.
--  3. Scadenze dei mezzi (revisione, assicurazione, bollo, prossima manutenzione)
--     nello scadenziario comune app_scadenze (avvisi a 30, 7 e 0 giorni di app-10).
--  4. Costi reali del cantiere: materiali + mezzi + subappalti approvati, contro il budget
--     e il fatturato. Niente costi inventati: se un dato manca, vale zero e si segnala.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Chi legge e chi scrive
-- ---------------------------------------------------------------------------
-- Legge: titolare, responsabile e lavoratori della ditta (devono vedere cosa c'è in cantiere).
create or replace function marketplace.app_mag_legge(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or coalesce(marketplace.app_mio_ruolo(p_org) in ('titolare', 'responsabile', 'operatore'), false);
$$;
-- Scrive tutto: chi gestisce la ditta, con il modulo magazzino attivo.
create or replace function marketplace.app_mag_scrive(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or (marketplace.app_gestisce(p_org) and marketplace.app_modulo_attivo(p_org, 'magazzino'));
$$;
-- Il lavoratore può solo dire «ho preso questo materiale per il cantiere» o «l'ho riportato»,
-- e segnare l'uso di un mezzo in un cantiere.
create or replace function marketplace.app_mag_operatore(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(marketplace.app_mio_ruolo(p_org) = 'operatore', false) and marketplace.app_modulo_attivo(p_org, 'magazzino');
$$;

-- Controlli per le regole: leggono la scheda con i permessi del sistema (il lavoratore può non vederla).
create or replace function marketplace.app_mag_puo_muovere(p_articolo uuid, p_tipo text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.app_record a where a.id = p_articolo and a.tipo = 'articolo'
                  and (marketplace.app_mag_scrive(a.org) or (marketplace.app_mag_operatore(a.org) and p_tipo in ('scarico', 'reso'))));
$$;
create or replace function marketplace.app_mag_puo_usare(p_mezzo uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.app_record z where z.id = p_mezzo and z.tipo = 'mezzo'
                  and (marketplace.app_mag_scrive(z.org) or marketplace.app_mag_operatore(z.org)));
$$;

-- ---------------------------------------------------------------------------
-- 2. Movimenti di magazzino
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_mag_movimenti (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  articolo uuid not null references marketplace.app_record(id) on delete cascade,
  tipo text not null check (tipo in ('carico', 'scarico', 'reso', 'trasferimento', 'rettifica')),
  quantita numeric(14,3) not null check ((tipo = 'rettifica' and quantita <> 0) or (tipo <> 'rettifica' and quantita > 0)),
  da_cantiere uuid references marketplace.app_record(id) on delete set null,   -- reso, trasferimento
  a_cantiere uuid references marketplace.app_record(id) on delete set null,    -- scarico, trasferimento
  costo_unitario numeric(14,4) check (costo_unitario is null or costo_unitario >= 0),
  ddt uuid references marketplace.app_record(id) on delete set null,
  data date not null default current_date,
  note text not null default '' check (length(note) <= 300),
  creato_da uuid default auth.uid() references auth.users(id) on delete set null,
  creato timestamptz not null default now(),
  check (case tipo
           when 'carico' then da_cantiere is null and a_cantiere is null
           when 'scarico' then a_cantiere is not null and da_cantiere is null
           when 'reso' then da_cantiere is not null and a_cantiere is null
           when 'trasferimento' then da_cantiere is not null and a_cantiere is not null and da_cantiere <> a_cantiere
           when 'rettifica' then da_cantiere is null and a_cantiere is null
         end)
);
create index if not exists app_mag_movimenti_art on marketplace.app_mag_movimenti (articolo, creato desc);
create index if not exists app_mag_movimenti_da on marketplace.app_mag_movimenti (da_cantiere) where da_cantiere is not null;
create index if not exists app_mag_movimenti_a on marketplace.app_mag_movimenti (a_cantiere) where a_cantiere is not null;

-- Quantità di un articolo che si trova in un cantiere (scarichi e trasferimenti in arrivo, meno resi e trasferimenti in uscita)
create or replace function marketplace.app_mag_in_cantiere(p_articolo uuid, p_cantiere uuid)
returns numeric language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(sum(case when m.a_cantiere = p_cantiere then m.quantita else 0 end), 0)
       - coalesce(sum(case when m.da_cantiere = p_cantiere then m.quantita else 0 end), 0)
    from marketplace.app_mag_movimenti m
   where m.articolo = p_articolo and (m.a_cantiere = p_cantiere or m.da_cantiere = p_cantiere);
$$;

-- Prima di salvare: controlli, costo dal costo medio, aggiornamento giacenza del deposito.
create or replace function marketplace.app_mag_movimenti_prima()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_art marketplace.app_record;
  v_giac numeric;
  v_cm numeric;
  v_nuova numeric;
begin
  if tg_op = 'DELETE' then
    -- si cancella solo insieme all'articolo o alla ditta (cascata), mai da solo
    if not exists (select 1 from marketplace.app_record where id = old.articolo) then return old; end if;
    raise exception 'movimento_non_modificabile';
  end if;
  if tg_op <> 'INSERT' then raise exception 'movimento_non_modificabile'; end if;
  select * into v_art from marketplace.app_record where id = new.articolo for update;
  if not found or v_art.tipo <> 'articolo' then raise exception 'articolo_non_valido'; end if;
  new.org := v_art.org;
  if new.da_cantiere is not null and not exists (select 1 from marketplace.app_record where id = new.da_cantiere and org = new.org and tipo = 'cantiere') then raise exception 'cantiere_non_valido'; end if;
  if new.a_cantiere is not null and not exists (select 1 from marketplace.app_record where id = new.a_cantiere and org = new.org and tipo = 'cantiere') then raise exception 'cantiere_non_valido'; end if;
  if new.ddt is not null and not exists (select 1 from marketplace.app_record where id = new.ddt and org = new.org and tipo = 'ddt') then raise exception 'ddt_non_valido'; end if;
  new.creato_da := coalesce(auth.uid(), new.creato_da);
  new.creato := now();

  v_giac := coalesce(nullif(v_art.dati->>'giacenza', '')::numeric, 0);
  v_cm := nullif(v_art.dati->>'costo_medio', '')::numeric;

  if new.tipo = 'carico' then
    if new.costo_unitario is not null then
      v_cm := case when v_cm is null or v_giac <= 0 then new.costo_unitario
                   else round((v_giac * v_cm + new.quantita * new.costo_unitario) / (v_giac + new.quantita), 4) end;
    end if;
    v_nuova := v_giac + new.quantita;
  elsif new.tipo = 'scarico' then
    if new.quantita > v_giac then raise exception 'giacenza_insufficiente'; end if;
    new.costo_unitario := v_cm;                       -- il cantiere paga al costo medio di oggi
    v_nuova := v_giac - new.quantita;
  elsif new.tipo = 'reso' then
    if new.quantita > marketplace.app_mag_in_cantiere(new.articolo, new.da_cantiere) then raise exception 'quantita_oltre_il_cantiere'; end if;
    new.costo_unitario := coalesce(new.costo_unitario, v_cm);
    v_nuova := v_giac + new.quantita;
  elsif new.tipo = 'trasferimento' then
    if new.quantita > marketplace.app_mag_in_cantiere(new.articolo, new.da_cantiere) then raise exception 'quantita_oltre_il_cantiere'; end if;
    new.costo_unitario := coalesce(new.costo_unitario, v_cm);
    v_nuova := v_giac;                                -- il deposito non cambia
  else -- rettifica: differenza contata in inventario
    if v_giac + new.quantita < 0 then raise exception 'giacenza_insufficiente'; end if;
    new.costo_unitario := v_cm;
    v_nuova := v_giac + new.quantita;
  end if;

  update marketplace.app_record
     set dati = dati || jsonb_build_object('giacenza', v_nuova) || case when v_cm is not null then jsonb_build_object('costo_medio', v_cm) else '{}'::jsonb end
   where id = new.articolo;
  return new;
end;
$$;
drop trigger if exists app_mag_movimenti_prima on marketplace.app_mag_movimenti;
create trigger app_mag_movimenti_prima before insert or update or delete on marketplace.app_mag_movimenti
  for each row execute function marketplace.app_mag_movimenti_prima();

-- ---------------------------------------------------------------------------
-- 3. Mezzi nei cantieri
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_mezzi_uso (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  mezzo uuid not null references marketplace.app_record(id) on delete cascade,
  cantiere uuid not null references marketplace.app_record(id) on delete cascade,
  dal date not null,
  al date,
  ore numeric(8,1) check (ore is null or ore >= 0),
  km numeric(10,1) check (km is null or km >= 0),
  litri numeric(8,2) check (litri is null or litri >= 0),
  carburante_euro numeric(10,2) check (carburante_euro is null or carburante_euro >= 0),
  costo_giorno numeric(10,2) check (costo_giorno is null or costo_giorno >= 0),   -- se vuoto: quello del mezzo
  note text not null default '' check (length(note) <= 300),
  creato_da uuid default auth.uid() references auth.users(id) on delete set null,
  creato timestamptz not null default now(),
  check (al is null or al >= dal)
);
create index if not exists app_mezzi_uso_mezzo on marketplace.app_mezzi_uso (mezzo, dal desc);
create index if not exists app_mezzi_uso_cantiere on marketplace.app_mezzi_uso (cantiere);

create or replace function marketplace.app_mezzi_uso_prima()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare v_m marketplace.app_record;
begin
  select * into v_m from marketplace.app_record where id = new.mezzo;
  if not found or v_m.tipo <> 'mezzo' then raise exception 'mezzo_non_valido'; end if;
  new.org := v_m.org;
  if not exists (select 1 from marketplace.app_record where id = new.cantiere and org = new.org and tipo = 'cantiere') then raise exception 'cantiere_non_valido'; end if;
  if new.costo_giorno is null then new.costo_giorno := nullif(v_m.dati->>'costo_giorno', '')::numeric; end if;
  if exists (select 1 from marketplace.app_mezzi_uso u
              where u.mezzo = new.mezzo and u.id <> new.id
                and daterange(u.dal, coalesce(u.al, 'infinity'::date), '[]') && daterange(new.dal, coalesce(new.al, 'infinity'::date), '[]')) then
    raise exception 'mezzo_gia_impegnato';
  end if;
  if tg_op = 'UPDATE' then new.creato_da := old.creato_da; new.creato := old.creato; end if;
  return new;
end;
$$;
drop trigger if exists app_mezzi_uso_prima on marketplace.app_mezzi_uso;
create trigger app_mezzi_uso_prima before insert or update on marketplace.app_mezzi_uso
  for each row execute function marketplace.app_mezzi_uso_prima();

-- ---------------------------------------------------------------------------
-- 4. Scadenze dei mezzi nello scadenziario comune
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_scadenza_imposta(p_org uuid, p_origine text, p_id uuid, p_titolo text, p_scade date)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if p_scade is null then
    delete from marketplace.app_scadenze where origine = p_origine and origine_id = p_id;
    return;
  end if;
  insert into marketplace.app_scadenze (org, ambito, origine, origine_id, titolo, scade)
  values (p_org, 'mezzo', p_origine, p_id, left(p_titolo, 200), p_scade)
  on conflict (origine, origine_id) do update
    set titolo = excluded.titolo,
        scade = excluded.scade,
        stato = 'attiva',
        ultimo_avviso = case when marketplace.app_scadenze.scade is distinct from excluded.scade then null else marketplace.app_scadenze.ultimo_avviso end;
end;
$$;

create or replace function marketplace.app_mezzi_scadenze()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare v_data date; v_mezzo text;
begin
  if new.tipo = 'mezzo' then
    perform marketplace.app_scadenza_imposta(new.org, 'mezzo_revisione', new.id, 'Revisione: ' || new.titolo, new.scadenza);
    begin v_data := nullif(new.dati->>'assicurazione', '')::date; exception when others then v_data := null; end;
    perform marketplace.app_scadenza_imposta(new.org, 'mezzo_assicurazione', new.id, 'Assicurazione: ' || new.titolo, v_data);
    begin v_data := nullif(new.dati->>'bollo', '')::date; exception when others then v_data := null; end;
    perform marketplace.app_scadenza_imposta(new.org, 'mezzo_bollo', new.id, 'Bollo: ' || new.titolo, v_data);
  elsif new.tipo = 'manutenzione' then
    select titolo into v_mezzo from marketplace.app_record where id = new.rif;
    perform marketplace.app_scadenza_imposta(new.org, 'mezzo_manutenzione', new.id,
      'Manutenzione' || coalesce(' ' || nullif(v_mezzo, ''), '') || ': ' || new.titolo, new.scadenza);
  end if;
  return null;
end;
$$;
drop trigger if exists app_mezzi_scadenze on marketplace.app_record;
create trigger app_mezzi_scadenze after insert or update of scadenza, dati, titolo on marketplace.app_record
  for each row when (new.tipo in ('mezzo', 'manutenzione')) execute function marketplace.app_mezzi_scadenze();

create or replace function marketplace.app_mezzi_scadenze_via()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  delete from marketplace.app_scadenze where origine_id = old.id and origine in ('mezzo_revisione', 'mezzo_assicurazione', 'mezzo_bollo', 'mezzo_manutenzione');
  return null;
end;
$$;
drop trigger if exists app_mezzi_scadenze_via on marketplace.app_record;
create trigger app_mezzi_scadenze_via after delete on marketplace.app_record
  for each row when (old.tipo in ('mezzo', 'manutenzione')) execute function marketplace.app_mezzi_scadenze_via();

-- Le scadenze dei mezzi già salvati entrano subito nello scadenziario
do $$
declare r marketplace.app_record;
begin
  for r in select * from marketplace.app_record where tipo in ('mezzo', 'manutenzione') loop
    update marketplace.app_record set titolo = titolo where id = r.id;   -- fa scattare il trigger
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Costi reali del cantiere
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_costi_cantiere(p_cantiere uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_c marketplace.app_record;
  v_mat numeric; v_mat_senza int;
  v_mezzi numeric; v_mezzi_senza int;
  v_sub numeric;
  v_fatt numeric;
  v_budget numeric;
  v_tot numeric;
  v_materiali jsonb; v_lista_mezzi jsonb;
begin
  select * into v_c from marketplace.app_record where id = p_cantiere and tipo = 'cantiere';
  if not found then raise exception 'cantiere_non_trovato'; end if;
  if not marketplace.app_fe_legge(v_c.org) then raise exception 'non_autorizzato'; end if;

  -- Materiali: arrivati meno ripartiti, al costo registrato nel movimento
  select coalesce(sum(case when m.a_cantiere = p_cantiere then 1 else -1 end * m.quantita * coalesce(m.costo_unitario, 0)), 0),
         count(*) filter (where m.costo_unitario is null)
    into v_mat, v_mat_senza
    from marketplace.app_mag_movimenti m
   where m.a_cantiere = p_cantiere or m.da_cantiere = p_cantiere;
  select coalesce(jsonb_agg(x order by x->>'articolo'), '[]'::jsonb) into v_materiali from (
    select jsonb_build_object('articolo', a.titolo, 'unita', coalesce(a.dati->>'unita', ''),
             'quantita', sum(case when m.a_cantiere = p_cantiere then m.quantita else -m.quantita end),
             'costo', round(sum(case when m.a_cantiere = p_cantiere then 1 else -1 end * m.quantita * coalesce(m.costo_unitario, 0)), 2)) x
      from marketplace.app_mag_movimenti m join marketplace.app_record a on a.id = m.articolo
     where m.a_cantiere = p_cantiere or m.da_cantiere = p_cantiere
     group by a.id, a.titolo, a.dati->>'unita') t;

  -- Mezzi: giorni × costo al giorno + carburante
  select coalesce(sum((least(coalesce(u.al, current_date), current_date) - u.dal + 1) * coalesce(u.costo_giorno, 0) + coalesce(u.carburante_euro, 0)), 0),
         count(*) filter (where u.costo_giorno is null)
    into v_mezzi, v_mezzi_senza
    from marketplace.app_mezzi_uso u where u.cantiere = p_cantiere and u.dal <= current_date;
  select coalesce(jsonb_agg(jsonb_build_object('mezzo', z.titolo, 'dal', u.dal, 'al', u.al, 'ore', u.ore, 'km', u.km,
           'costo', round(greatest(least(coalesce(u.al, current_date), current_date) - u.dal + 1, 0) * coalesce(u.costo_giorno, 0) + coalesce(u.carburante_euro, 0), 2)) order by u.dal desc), '[]'::jsonb)
    into v_lista_mezzi
    from marketplace.app_mezzi_uso u join marketplace.app_record z on z.id = u.mezzo where u.cantiere = p_cantiere;

  -- Subappalti approvati (dai sopralluoghi che hanno aperto questo cantiere)
  select coalesce(sum(o.importo), 0) into v_sub
    from marketplace.app_sub_offerte o join marketplace.app_sub_richieste r on r.id = o.richiesta
    join marketplace.app_sopralluoghi s on s.id = r.sopralluogo
   where s.cantiere = p_cantiere and o.stato = 'approvata';

  -- Fatturato: fatture e acconti inviati, meno le note di credito (imponibile)
  select coalesce(sum(case when d.tipo = 'nota_credito' then -d.imponibile else d.imponibile end), 0) into v_fatt
    from marketplace.app_fe_documenti d where d.cantiere = p_cantiere and d.tipo in ('fattura', 'acconto', 'nota_credito') and d.bloccato;

  v_budget := coalesce(nullif(v_c.dati->>'budget', '')::numeric, v_c.importo);
  v_tot := v_mat + v_mezzi + v_sub;
  return jsonb_build_object(
    'budget', v_budget,
    'costi', jsonb_build_object('materiali', round(v_mat, 2), 'mezzi', round(v_mezzi, 2), 'subappalti', v_sub, 'totale', round(v_tot, 2)),
    'fatturato', v_fatt,
    'resta_del_budget', case when v_budget is not null then round(v_budget - v_tot, 2) end,
    'uso_budget_perc', case when coalesce(v_budget, 0) > 0 then round(v_tot / v_budget * 100, 1) end,
    'materiali', v_materiali,
    'mezzi', v_lista_mezzi,
    'avvisi', to_jsonb(array_remove(array[
       case when v_mat_senza > 0 then 'Alcuni materiali non hanno un costo: carica gli arrivi con il prezzo.' end,
       case when v_mezzi_senza > 0 then 'Alcuni mezzi non hanno il costo al giorno: scrivilo nella scheda del mezzo.' end,
       case when v_budget is null then 'Il cantiere non ha un budget.' end,
       'La manodopera interna non è ancora conteggiata.'], null))
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Logo della ditta per la pagina del cliente (cartella pubblica «loghi»)
--    Solo immagini PNG, JPG o WEBP fino a 1 MB, percorso <id ditta>/logo-....<est>.
--    Lo carica chi gestisce la ditta; tutti lo possono vedere (è il marchio pubblico della ditta).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('loghi', 'loghi', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function marketplace.app_logo_mio(p_nome text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select p_nome ~ '^[0-9a-f-]{36}/logo-[0-9a-z]{4,20}\.(png|jpg|webp)$'
     and marketplace.app_fe_scrive(split_part(p_nome, '/', 1)::uuid);
$$;
revoke all on function marketplace.app_logo_mio(text) from public, anon;
grant execute on function marketplace.app_logo_mio(text) to authenticated;
drop policy if exists app_loghi_carica on storage.objects;
create policy app_loghi_carica on storage.objects for insert to authenticated with check (bucket_id = 'loghi' and marketplace.app_logo_mio(name));
drop policy if exists app_loghi_cambia on storage.objects;
create policy app_loghi_cambia on storage.objects for update to authenticated using (bucket_id = 'loghi' and marketplace.app_logo_mio(name)) with check (bucket_id = 'loghi' and marketplace.app_logo_mio(name));
drop policy if exists app_loghi_via on storage.objects;
create policy app_loghi_via on storage.objects for delete to authenticated using (bucket_id = 'loghi' and marketplace.app_logo_mio(name));

-- Pagina del cliente: ora restituisce anche il logo della ditta (se caricato)
create or replace function marketplace.app_stima_pubblica(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi;
  v_c marketplace.app_record;
  v_fasi jsonb;
  v_giornale jsonb;
begin
  select * into v_s from marketplace.app_sopralluoghi where link = p_token and link_scade > now() and stato <> 'annullato';
  if not found then return jsonb_build_object('trovato', false); end if;
  if v_s.cantiere is not null then
    select * into v_c from marketplace.app_record where id = v_s.cantiere;
    select coalesce(jsonb_agg(jsonb_build_object('titolo', f.titolo, 'avanzamento', coalesce((f.dati->>'avanzamento')::int, 0), 'inizio', f.data, 'fine', f.scadenza) order by f.data nulls last), '[]'::jsonb)
      into v_fasi from marketplace.app_record f where f.rif = v_s.cantiere and f.tipo = 'fase';
    select coalesce(jsonb_agg(x order by x->>'data' desc), '[]'::jsonb) into v_giornale from (
      select jsonb_build_object('data', g.data, 'testo', left(g.titolo, 160)) x from marketplace.app_record g
       where g.rif = v_s.cantiere and g.tipo = 'giornale' order by g.data desc nulls last limit 8) t;
  end if;
  return jsonb_build_object(
    'trovato', true,
    'ditta', (select o.nome from marketplace.app_org o where o.id = v_s.org),
    'ditta_logo', (select f.logo from marketplace.app_fe_profili f where f.org = v_s.org and f.logo like 'loghi/%'),
    'stato', v_s.stato,
    'quando', v_s.quando,
    'comune', v_s.comune,
    'lavori', v_s.lavori,
    'mq', v_s.mq,
    'finitura', v_s.finitura,
    'stile', marketplace.app_stile_tavola(v_s.stile),
    'stima_min', v_s.stima_min,
    'stima_max', v_s.stima_max,
    'budget_ok', v_s.budget_ok_il is not null,
    'pratica', (select jsonb_build_object('titolo', p.titolo, 'confermato', p.titolo_da = 'tecnico') from marketplace.app_sopralluoghi_pratica p where p.sopralluogo = v_s.id),
    'ufficiale', exists (select 1 from marketplace.app_computi k where k.sopralluogo = v_s.id and k.blindato_il is not null),
    'preventivo', (select jsonb_build_object('stato', d.stato_preventivo) from marketplace.app_fe_documenti d where d.id = v_s.preventivo),
    'cantiere', case when v_c.id is not null then jsonb_build_object('codice', coalesce(v_c.dati->>'codice', ''), 'stato', v_c.stato, 'inizio', v_c.data,
                  'fasi', v_fasi, 'giornale', v_giornale,
                  'avanzamento', (select round(avg(coalesce((f.dati->>'avanzamento')::numeric, 0))) from marketplace.app_record f where f.rif = v_c.id and f.tipo = 'fase'),
                  'fatture', (select count(*) from marketplace.app_fe_documenti d where d.cantiere = v_c.id and d.tipo <> 'preventivo' and d.bloccato)) end,
    'scade', v_s.link_scade
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Permessi
-- ---------------------------------------------------------------------------
alter table marketplace.app_mag_movimenti enable row level security;
drop policy if exists app_mag_movimenti_leggi on marketplace.app_mag_movimenti;
create policy app_mag_movimenti_leggi on marketplace.app_mag_movimenti for select using (marketplace.app_mag_legge(org));
drop policy if exists app_mag_movimenti_nuovo on marketplace.app_mag_movimenti;
create policy app_mag_movimenti_nuovo on marketplace.app_mag_movimenti for insert with check (marketplace.app_mag_puo_muovere(articolo, tipo));
grant select, insert on marketplace.app_mag_movimenti to authenticated;

alter table marketplace.app_mezzi_uso enable row level security;
drop policy if exists app_mezzi_uso_leggi on marketplace.app_mezzi_uso;
create policy app_mezzi_uso_leggi on marketplace.app_mezzi_uso for select using (marketplace.app_mag_legge(org));
drop policy if exists app_mezzi_uso_nuovo on marketplace.app_mezzi_uso;
create policy app_mezzi_uso_nuovo on marketplace.app_mezzi_uso for insert with check (marketplace.app_mag_puo_usare(mezzo));
drop policy if exists app_mezzi_uso_cambia on marketplace.app_mezzi_uso;
create policy app_mezzi_uso_cambia on marketplace.app_mezzi_uso for update
  using (marketplace.app_mag_scrive(org) or (marketplace.app_mag_operatore(org) and creato_da = auth.uid()))
  with check (marketplace.app_mag_scrive(org) or (marketplace.app_mag_operatore(org) and creato_da = auth.uid()));
drop policy if exists app_mezzi_uso_via on marketplace.app_mezzi_uso;
create policy app_mezzi_uso_via on marketplace.app_mezzi_uso for delete using (marketplace.app_mag_scrive(org));
grant select, insert, update, delete on marketplace.app_mezzi_uso to authenticated;
grant all on marketplace.app_mag_movimenti, marketplace.app_mezzi_uso to service_role;

revoke all on function marketplace.app_scadenza_imposta(uuid, text, uuid, text, date) from public, anon, authenticated;
revoke all on function marketplace.app_costi_cantiere(uuid) from public, anon;
revoke all on function marketplace.app_mag_in_cantiere(uuid, uuid) from public, anon;
grant execute on function marketplace.app_mag_legge(uuid), marketplace.app_mag_scrive(uuid), marketplace.app_mag_operatore(uuid),
  marketplace.app_mag_puo_muovere(uuid, text), marketplace.app_mag_puo_usare(uuid) to authenticated;
grant execute on function marketplace.app_costi_cantiere(uuid) to authenticated;
grant execute on function marketplace.app_mag_in_cantiere(uuid, uuid) to authenticated;
