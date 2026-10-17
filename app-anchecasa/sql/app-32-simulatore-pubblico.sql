-- ============================================================================
-- APP ANCHECASA · PARTE 32 — «Quanto costa ristrutturare?» (simulatore pubblico)
-- Preparato il 16.10.2026. Si esegue DOPO app-11 (prezzari) e app-03 (richieste dai siti).
-- Si può rilanciare senza danni.
--
-- Chi naviga sul web, SENZA account:
--   1. sceglie il lavoro (bagno, cucina, pareti, casa completa…), i mq, la regione e la finitura;
--   2. vede una FORBICE di prezzo indicativa, calcolata con lo stesso motore del Sopralluogo Flash:
--      quantità di partenza × prezzo della voce del prezzario regionale × coefficiente di finitura;
--   3. lascia nome e telefono → la richiesta arriva all'admin (Richieste dai siti, tipo «Simulazione»)
--      con la stima allegata. L'admin la affida alla ditta convenzionata, che fa il Sopralluogo Flash vero.
--
-- Regola: niente prezzi inventati. Se per quella regione mancano i prezzi di troppe lavorazioni,
-- la stima risulta «non disponibile» e la pagina chiede solo il sopralluogo gratuito.
-- Le quantità di partenza (ricette) sono COEFFICIENTI DA FAR VERIFICARE all'ufficio tecnico:
-- si cambiano in marketplace.app_simulatore_ricette senza toccare l'app.
-- ============================================================================

-- 1. Le richieste dal simulatore finiscono nelle richieste dai siti con il tipo «simulazione»
do $$
declare v_nome text;
begin
  select conname into v_nome from pg_constraint
   where conrelid = 'marketplace.app_contatti'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%tipo%iscrizione%';
  if v_nome is not null then execute format('alter table marketplace.app_contatti drop constraint %I', v_nome); end if;
end $$;
alter table marketplace.app_contatti add constraint app_contatti_tipo_check
  check (tipo in ('iscrizione', 'contatto', 'sopralluogo', 'opportunita', 'rete_sicura', 'offerta_sicura', 'corso', 'albo', 'lavora', 'partner', 'agente', 'simulazione'));

-- 2. Tipi di lavoro del simulatore e quantità di partenza per mq di superficie
create table if not exists marketplace.app_simulatore_tipi (
  chiave text primary key check (chiave ~ '^[a-z_]{2,30}$'),
  nome text not null check (length(btrim(nome)) between 2 and 60),
  spiegazione text not null default '' check (length(spiegazione) <= 160),
  mq_min int not null default 2 check (mq_min > 0),
  mq_max int not null default 400 check (mq_max >= mq_min),
  ordine int not null default 0,
  attivo boolean not null default true,
  solo_sopralluogo boolean not null default false   -- es. facciate: nessuna stima, solo richiesta di sopralluogo
);
create table if not exists marketplace.app_simulatore_ricette (
  tipo text not null references marketplace.app_simulatore_tipi(chiave) on delete cascade,
  lavorazione text not null references marketplace.app_stima_lavorazioni(chiave) on delete cascade,
  per_mq numeric(8,3) not null default 0 check (per_mq >= 0),     -- quantità per ogni mq indicato dal cliente
  fisso numeric(8,2) not null default 0 check (fisso >= 0),       -- quantità fissa (es. 4 sanitari)
  primary key (tipo, lavorazione),
  check (per_mq > 0 or fisso > 0)
);
alter table marketplace.app_simulatore_tipi enable row level security;
alter table marketplace.app_simulatore_ricette enable row level security;
drop policy if exists app_sim_tipi_leggi on marketplace.app_simulatore_tipi;
create policy app_sim_tipi_leggi on marketplace.app_simulatore_tipi for select to anon, authenticated using (attivo or marketplace.is_admin());
drop policy if exists app_sim_tipi_admin on marketplace.app_simulatore_tipi;
create policy app_sim_tipi_admin on marketplace.app_simulatore_tipi for all to authenticated using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists app_sim_ricette_admin on marketplace.app_simulatore_ricette;
create policy app_sim_ricette_admin on marketplace.app_simulatore_ricette for all to authenticated using (marketplace.is_admin()) with check (marketplace.is_admin());
revoke all on marketplace.app_simulatore_tipi, marketplace.app_simulatore_ricette from anon, authenticated;
grant select on marketplace.app_simulatore_tipi to anon, authenticated;
grant insert, update, delete on marketplace.app_simulatore_tipi to authenticated;
grant select, insert, update, delete on marketplace.app_simulatore_ricette to authenticated;
grant all on marketplace.app_simulatore_tipi, marketplace.app_simulatore_ricette to service_role;

insert into marketplace.app_simulatore_tipi (chiave, nome, spiegazione, mq_min, mq_max, ordine, solo_sopralluogo) values
  ('bagno', 'Bagno', 'Pavimento, rivestimento, sanitari e impianti del bagno', 2, 20, 1, false),
  ('cucina', 'Cucina', 'Pavimento, rivestimento e impianti (mobili esclusi)', 4, 40, 2, false),
  ('pareti', 'Pareti e tinteggiatura', 'Ripresa intonaci e tinteggiatura di pareti e soffitti', 5, 400, 3, false),
  ('completa', 'Casa completa', 'Dalla demolizione alla consegna, impianti e infissi compresi', 25, 400, 4, false),
  ('facciata', 'Condominio o facciata', 'Serve vedere il palazzo: ti mandiamo un tecnico', 1, 100000, 5, true),
  ('altro', 'Altro', 'Raccontaci il lavoro: ti richiamiamo noi', 1, 100000, 6, true)
on conflict (chiave) do nothing;

-- Quantità di PARTENZA (da far verificare all'ufficio tecnico). «per_mq» = quantità per mq di pavimento indicato.
insert into marketplace.app_simulatore_ricette (tipo, lavorazione, per_mq, fisso) values
  -- bagno: pareti piastrellate circa 3,5 volte il pavimento in un bagno piccolo
  ('bagno', 'demolizione_pavimenti', 1, 0),
  ('bagno', 'demolizione_rivestimenti', 3.5, 0),
  ('bagno', 'rimozione_sanitari', 0, 4),
  ('bagno', 'massetto', 1, 0),
  ('bagno', 'pavimento', 1, 0),
  ('bagno', 'rivestimento', 3.5, 0),
  ('bagno', 'impianto_idrico', 0, 6),
  ('bagno', 'impianto_elettrico', 0, 4),
  ('bagno', 'sanitari', 0, 4),
  ('bagno', 'tinteggiatura', 1, 0),
  -- cucina
  ('cucina', 'demolizione_pavimenti', 1, 0),
  ('cucina', 'massetto', 1, 0),
  ('cucina', 'pavimento', 1, 0),
  ('cucina', 'rivestimento', 0, 6),
  ('cucina', 'impianto_idrico', 0, 3),
  ('cucina', 'impianto_elettrico', 0, 8),
  ('cucina', 'tinteggiatura', 3.5, 0),
  -- pareti e tinteggiatura: pareti + soffitto circa 3,5 volte il pavimento
  ('pareti', 'intonaco', 0.3, 0),
  ('pareti', 'tinteggiatura', 3.5, 0),
  -- casa completa
  ('completa', 'demolizione_pavimenti', 1, 0),
  ('completa', 'demolizione_rivestimenti', 0.4, 0),
  ('completa', 'demolizione_tramezzi', 0.2, 0),
  ('completa', 'rimozione_sanitari', 0.08, 0),
  ('completa', 'massetto', 1, 0),
  ('completa', 'pavimento', 1, 0),
  ('completa', 'rivestimento', 0.4, 0),
  ('completa', 'tramezzo', 0.2, 0),
  ('completa', 'intonaco', 0.5, 0),
  ('completa', 'tinteggiatura', 3.5, 0),
  ('completa', 'impianto_elettrico', 0.5, 0),
  ('completa', 'impianto_idrico', 0.15, 0),
  ('completa', 'sanitari', 0.08, 0),
  ('completa', 'porte_interne', 0.08, 0),
  ('completa', 'infissi', 0.15, 0)
on conflict (tipo, lavorazione) do nothing;

-- Impostazioni del simulatore (le cambia l'admin): forbice più larga del Flash perché nessuno ha visto la casa;
-- «copertura» = quota minima delle lavorazioni che deve avere un prezzo, altrimenti niente stima.
insert into marketplace.app_impostazioni (chiave, valore)
values ('simulatore', '{"forbice": 0.25, "copertura": 0.8, "attivo": true}'::jsonb)
on conflict (chiave) do nothing;

-- 3. Calcolo della stima (pubblico, non scrive niente)
create or replace function marketplace.app_simulatore_stima(p_tipo text, p_mq numeric, p_regione text, p_finitura text)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_t marketplace.app_simulatore_tipi;
  v_sim jsonb;
  v_flash jsonb;
  v_coef numeric;
  v_forb numeric;
  v_cop numeric;
  r record;
  v_prezzo numeric;
  v_tot numeric := 0;
  v_n int := 0;
  v_ok int := 0;
  v_fonti text[] := '{}';
  v_fonte text;
begin
  select * into v_t from marketplace.app_simulatore_tipi where chiave = p_tipo and attivo;
  if not found then return jsonb_build_object('disponibile', false, 'motivo', 'tipo_sconosciuto'); end if;
  if v_t.solo_sopralluogo then return jsonb_build_object('disponibile', false, 'motivo', 'serve_sopralluogo'); end if;
  if p_mq is null or p_mq < v_t.mq_min or p_mq > v_t.mq_max then
    return jsonb_build_object('disponibile', false, 'motivo', 'mq_fuori_misura', 'mq_min', v_t.mq_min, 'mq_max', v_t.mq_max);
  end if;
  select valore into v_sim from marketplace.app_impostazioni where chiave = 'simulatore';
  if coalesce((v_sim->>'attivo')::boolean, true) = false then return jsonb_build_object('disponibile', false, 'motivo', 'spento'); end if;
  select valore into v_flash from marketplace.app_impostazioni where chiave = 'stima_flash';
  v_coef := coalesce((v_flash->'finitura'->>coalesce(p_finitura, 'medio'))::numeric, 1);
  v_forb := least(greatest(coalesce((v_sim->>'forbice')::numeric, 0.25), 0.05), 0.6);
  v_cop := least(greatest(coalesce((v_sim->>'copertura')::numeric, 0.8), 0.5), 1);
  for r in select rc.lavorazione, rc.per_mq, rc.fisso from marketplace.app_simulatore_ricette rc
             join marketplace.app_stima_lavorazioni l on l.chiave = rc.lavorazione and l.attiva
            where rc.tipo = p_tipo loop
    v_n := v_n + 1;
    select v.prezzo, p.fonte || ' ' || p.anno into v_prezzo, v_fonte
      from marketplace.app_stima_riferimenti rf
      join marketplace.app_prezzari p on p.id = rf.prezzario and p.attivo
      join marketplace.app_prezzari_voci v on v.prezzario = rf.prezzario and v.codice = rf.codice
     where rf.lavorazione = r.lavorazione and rf.regione = p_regione;
    if v_prezzo is null then continue; end if;
    v_ok := v_ok + 1;
    v_tot := v_tot + v_prezzo * (r.per_mq * p_mq + r.fisso);
    if not v_fonte = any (v_fonti) then v_fonti := v_fonti || v_fonte; end if;
  end loop;
  if v_n = 0 or v_tot <= 0 or v_ok::numeric / v_n < v_cop then
    return jsonb_build_object('disponibile', false, 'motivo', 'prezzario_mancante', 'regione', p_regione);
  end if;
  -- se manca qualche voce, la forbice si allarga in proporzione (meglio larga che sbagliata)
  v_tot := v_tot * v_n / v_ok;
  return jsonb_build_object(
    'disponibile', true,
    'min', round(v_tot * v_coef * (1 - v_forb), -2),
    'max', round(v_tot * v_coef * (1 + v_forb), -2),
    'completa', v_ok = v_n,
    'fonti', to_jsonb(v_fonti),
    'regione', p_regione
  );
end;
$$;

-- 4. Invio della richiesta: ricalcola la stima sul server (il telefono non decide niente) e la mette nelle richieste dai siti
create or replace function marketplace.app_simulatore_invia(
  p_tipo text, p_mq numeric, p_regione text, p_comune text, p_finitura text, p_quando text,
  p_nome text, p_telefono text, p_email text, p_note text, p_consenso boolean, p_codice text default '')
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_stima jsonb;
  v_tipo text;
  v_id uuid;
  v_tel text := left(btrim(coalesce(p_telefono, '')), 30);
begin
  if coalesce(p_consenso, false) = false then raise exception 'serve_il_consenso'; end if;
  if length(btrim(coalesce(p_nome, ''))) < 2 then raise exception 'manca_il_nome'; end if;
  if length(regexp_replace(v_tel, '\D', '', 'g')) < 6 then raise exception 'manca_il_telefono'; end if;
  select nome into v_tipo from marketplace.app_simulatore_tipi where chiave = p_tipo and attivo;
  if v_tipo is null then raise exception 'tipo_sconosciuto'; end if;
  v_stima := marketplace.app_simulatore_stima(p_tipo, p_mq, p_regione, p_finitura);
  insert into marketplace.app_contatti (sito, tipo, nome, email, telefono, dati)
  values ('anchecasa', 'simulazione', left(btrim(p_nome), 120), left(btrim(coalesce(p_email, '')), 120), v_tel,
    jsonb_strip_nulls(jsonb_build_object(
      'lavoro', v_tipo,
      'tipo_chiave', p_tipo,
      'mq', p_mq,
      'regione', left(coalesce(p_regione, ''), 40),
      'comune', left(btrim(coalesce(p_comune, '')), 80),
      'finitura', left(coalesce(p_finitura, ''), 10),
      'quando', left(coalesce(p_quando, ''), 30),
      'stima', case when (v_stima->>'disponibile')::boolean
                    then replace(to_char((v_stima->>'min')::numeric, 'FM999G999G990'), ',', '.') || ' – ' || replace(to_char((v_stima->>'max')::numeric, 'FM999G999G990'), ',', '.') || ' € (indicativa)'
                    else 'non disponibile' end,
      'note', nullif(left(btrim(coalesce(p_note, '')), 600), ''),
      'codice_agente', nullif(left(btrim(coalesce(p_codice, '')), 30), ''),
      'prossimo_passo', 'Affidare a una ditta convenzionata: chiamata entro 48 ore e Sopralluogo Flash'
    )))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'stima', v_stima, 'rif', v_id);
end;
$$;

-- 5. Scheda lavori da condividere con la ditta di fiducia del cliente: SENZA prezzi e SENZA telefono del cliente.
--    Si apre con il riferimento (uuid, non indovinabile) per 90 giorni. La ditta può chiedere di lavorare con AncheCasa.
create or replace function marketplace.app_simulatore_scheda(p_rif uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_c marketplace.app_contatti;
  v_mq numeric;
  v_voci jsonb;
begin
  select * into v_c from marketplace.app_contatti
   where id = p_rif and tipo = 'simulazione' and stato <> 'scartato' and creato > now() - interval '90 days';
  if not found then return jsonb_build_object('trovato', false); end if;
  v_mq := nullif(v_c.dati->>'mq', '')::numeric;
  select coalesce(jsonb_agg(jsonb_build_object('nome', l.nome, 'um', l.um,
           'quantita', case when v_mq is null then null else round(rc.per_mq * v_mq + rc.fisso, 1) end) order by l.nome), '[]'::jsonb)
    into v_voci
    from marketplace.app_simulatore_ricette rc join marketplace.app_stima_lavorazioni l on l.chiave = rc.lavorazione and l.attiva
   where rc.tipo = v_c.dati->>'tipo_chiave';
  return jsonb_build_object(
    'trovato', true,
    'data', v_c.creato,
    'cliente', split_part(btrim(v_c.nome), ' ', 1) || coalesce(' ' || nullif(left(split_part(btrim(v_c.nome), ' ', 2), 1), '') || '.', ''),
    'lavoro', v_c.dati->>'lavoro',
    'mq', v_mq,
    'comune', v_c.dati->>'comune',
    'regione', v_c.dati->>'regione',
    'finitura', v_c.dati->>'finitura',
    'quando', v_c.dati->>'quando',
    'note', v_c.dati->>'note',
    'voci', v_voci
  );
end;
$$;

-- La ditta di fiducia chiede di lavorare con AncheCasa dalla scheda: arriva come «Partner» con il riferimento del cliente.
create or replace function marketplace.app_simulatore_ditta(p_rif uuid, p_ditta text, p_referente text, p_telefono text, p_email text,
  p_piva text, p_comune text, p_mestieri text, p_consenso boolean)
returns boolean language plpgsql security definer set search_path = marketplace, public as $$
declare v_c marketplace.app_contatti; v_tel text := left(btrim(coalesce(p_telefono, '')), 30);
begin
  if coalesce(p_consenso, false) = false then raise exception 'serve_il_consenso'; end if;
  if length(btrim(coalesce(p_ditta, ''))) < 2 then raise exception 'manca_la_ditta'; end if;
  if length(regexp_replace(v_tel, '\D', '', 'g')) < 6 then raise exception 'manca_il_telefono'; end if;
  select * into v_c from marketplace.app_contatti where id = p_rif and tipo = 'simulazione';
  insert into marketplace.app_contatti (sito, tipo, nome, email, telefono, dati)
  values ('anchecasa', 'partner', left(btrim(p_ditta), 120), left(btrim(coalesce(p_email, '')), 120), v_tel,
    jsonb_strip_nulls(jsonb_build_object(
      'origine', 'Ditta di fiducia di un cliente (scheda «Quanto costa»)',
      'referente', nullif(left(btrim(coalesce(p_referente, '')), 80), ''),
      'partita_iva', nullif(left(regexp_replace(coalesce(p_piva, ''), '\s', '', 'g'), 16), ''),
      'comune', nullif(left(btrim(coalesce(p_comune, '')), 80), ''),
      'mestieri', nullif(left(btrim(coalesce(p_mestieri, '')), 200), ''),
      'cliente', case when v_c.id is not null then v_c.nome || ' · ' || v_c.telefono end,
      'lavoro_del_cliente', case when v_c.id is not null then (v_c.dati->>'lavoro') || coalesce(' · ' || (v_c.dati->>'comune'), '') end,
      'rif_simulazione', v_c.id
    )));
  return true;
end;
$$;

revoke all on function marketplace.app_simulatore_scheda(uuid) from public;
revoke all on function marketplace.app_simulatore_ditta(uuid, text, text, text, text, text, text, text, boolean) from public;
grant execute on function marketplace.app_simulatore_scheda(uuid) to anon, authenticated, service_role;
grant execute on function marketplace.app_simulatore_ditta(uuid, text, text, text, text, text, text, text, boolean) to anon, authenticated, service_role;

revoke all on function marketplace.app_simulatore_stima(text, numeric, text, text) from public;
revoke all on function marketplace.app_simulatore_invia(text, numeric, text, text, text, text, text, text, text, text, boolean, text) from public;
grant execute on function marketplace.app_simulatore_stima(text, numeric, text, text) to anon, authenticated, service_role;
grant execute on function marketplace.app_simulatore_invia(text, numeric, text, text, text, text, text, text, text, text, boolean, text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
