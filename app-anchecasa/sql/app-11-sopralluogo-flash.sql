-- =============================================================================
-- AncheCasa app · parte 11: SOPRALLUOGO FLASH, NOTA VOCALE → COMPUTO, STIMA, LINK DEL CLIENTE,
--                           UFFICIO TECNICO E «CONVERTI IN CANTIERE ATTIVO» (11.10.2026)
-- Da eseguire DOPO app-10. Si può rieseguire senza danni.
--
-- Decisioni (Nando, 11.10.2026):
--  1. Prezzi: dai prezzari regionali delle opere pubbliche (non esiste un prezzario nazionale unico).
--     L'admin importa il file della Regione; ogni lavorazione della stima punta a una voce del prezzario.
--     Nessun prezzo inventato: le lavorazioni senza prezzo vengono segnalate.
--  2. Il cliente vede la stima da un link senza password: SOLO marchio AncheCasa, niente nome della ditta,
--     niente indirizzo completo (solo il comune), niente nomi di persone. Il link scade dopo 60 giorni.
--  3. La nota vocale dell'agente va all'AI (Gemini) per trascrizione e computo; l'audio si tiene 90 giorni,
--     poi resta solo il testo.
--  4. Un click «Converti in cantiere attivo»: preventivo dal computo validato (se non c'è), accettato,
--     cantiere aperto con codice univoco AC-AAAA-NNNN e budget iniziale, fascicolo di sicurezza pronto.
--  5. Dopo la conversione lo stesso link del cliente diventa «il mio cantiere»: fasi, avanzamento, ultimi lavori.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Sopralluogo: stati nuovi e campi del Flash
-- ---------------------------------------------------------------------------
alter table marketplace.app_sopralluoghi drop constraint if exists app_sopralluoghi_stato_check;
alter table marketplace.app_sopralluoghi add constraint app_sopralluoghi_stato_check
  check (stato in ('programmato', 'completato', 'in_ufficio', 'budget_ok', 'convertito', 'annullato'));

alter table marketplace.app_sopralluoghi
  add column if not exists comune text not null default '' check (length(comune) <= 60),
  add column if not exists regione text not null default '' check (length(regione) <= 40),
  add column if not exists mq numeric(8,1) check (mq is null or mq between 1 and 100000),
  add column if not exists finitura text not null default 'medio' check (finitura in ('base', 'medio', 'alto')),
  add column if not exists stile text not null default '' check (stile in ('', 'moderno_minimal', 'classico', 'industriale', 'mediterraneo', 'scandinavo', 'rustico')),
  add column if not exists audio text not null default '' check (audio ~ '^([0-9a-f-]{36}/a/[0-9a-z-]{8,40}\.(webm|mp4|m4a|ogg))?$'),
  add column if not exists audio_scade date,
  add column if not exists trascrizione text not null default '' check (length(trascrizione) <= 20000),
  add column if not exists computo jsonb not null default '[]'::jsonb check (jsonb_typeof(computo) = 'array' and pg_column_size(computo) < 100000),
  add column if not exists computo_validato boolean not null default false,
  add column if not exists stima_min numeric(12,2),
  add column if not exists stima_max numeric(12,2),
  add column if not exists stima_note jsonb not null default '[]'::jsonb,
  add column if not exists link uuid unique,
  add column if not exists link_scade timestamptz,
  add column if not exists budget_ok_il timestamptz,
  add column if not exists in_ufficio_il timestamptz;

-- Foto, video e planimetrie per stanza
create table if not exists marketplace.app_sopralluoghi_media (
  id uuid primary key default gen_random_uuid(),
  sopralluogo uuid not null references marketplace.app_sopralluoghi(id) on delete cascade,
  tipo text not null check (tipo in ('foto', 'video', 'planimetria')),
  file text not null check (file ~ '^[0-9a-f-]{36}/m/[0-9a-f-]{36}\.(jpg|png|mp4|webm|pdf)$'),
  stanza text not null default '' check (length(stanza) <= 40),
  creato timestamptz not null default now()
);
create index if not exists app_sopralluoghi_media_s on marketplace.app_sopralluoghi_media (sopralluogo);

-- ---------------------------------------------------------------------------
-- 1b. Pratica edilizia del sopralluogo (titolo previsto, vincoli, ufficio del comune)
--     NIENTE dati inventati: l'AI suggerisce il titolo dalle lavorazioni, il tecnico lo conferma;
--     vincoli e zona sismica restano «da verificare» finché il tecnico non li controlla sulle fonti ufficiali.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_sopralluoghi_pratica (
  sopralluogo uuid primary key references marketplace.app_sopralluoghi(id) on delete cascade,
  titolo text not null default 'da_verificare' check (titolo in ('da_verificare', 'edilizia_libera', 'cila', 'scia', 'scia_alternativa', 'pdc')),
  titolo_motivo text not null default '' check (length(titolo_motivo) <= 500),
  titolo_da text not null default 'ai' check (titolo_da in ('ai', 'tecnico')),
  vincolo_paesaggistico text not null default 'da_verificare' check (vincolo_paesaggistico in ('da_verificare', 'si', 'no')),
  zona_sismica text not null default 'da_verificare' check (zona_sismica in ('da_verificare', '1', '2', '3', '4')),
  altri_vincoli text not null default '' check (length(altri_vincoli) <= 500),
  note text not null default '' check (length(note) <= 1000),
  verificato_da uuid references auth.users(id) on delete set null,
  verificato_il timestamptz
);
-- Ufficio tecnico del comune (SUE): lo scrive l'ufficio una volta, vale per tutti i sopralluoghi in quel comune
create table if not exists marketplace.app_comuni_sue (
  comune text not null check (length(btrim(comune)) between 2 and 60),
  provincia text not null default '' check (provincia ~ '^([A-Z]{2})?$'),
  ufficio text not null default '' check (length(ufficio) <= 120),
  pec text not null default '' check (length(pec) <= 120),
  telefono text not null default '' check (length(telefono) <= 30),
  sito text not null default '' check (length(sito) <= 200),
  note text not null default '' check (length(note) <= 500),
  aggiornato_da uuid references auth.users(id) on delete set null,
  aggiornato timestamptz not null default now(),
  primary key (comune, provincia)
);

-- ---------------------------------------------------------------------------
-- 2. Prezzari regionali e lavorazioni della stima
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_prezzari (
  id uuid primary key default gen_random_uuid(),
  fonte text not null check (length(btrim(fonte)) between 3 and 120),          -- es. «Prezzario Regione Campania 2025»
  regione text not null check (length(regione) <= 40),
  anno int not null check (anno between 2000 and 2100),
  attivo boolean not null default true,
  nota text not null default '' check (length(nota) <= 300),                   -- licenza, link alla delibera
  caricato timestamptz not null default now(),
  unique (regione, anno, fonte)
);
create table if not exists marketplace.app_prezzari_voci (
  prezzario uuid not null references marketplace.app_prezzari(id) on delete cascade,
  codice text not null check (length(btrim(codice)) between 1 and 40),
  descrizione text not null check (length(descrizione) <= 2000),
  um text not null default '' check (length(um) <= 20),
  prezzo numeric(14,4) not null check (prezzo >= 0),
  primary key (prezzario, codice)
);
create index if not exists app_prezzari_voci_testo on marketplace.app_prezzari_voci using gin (to_tsvector('italian', descrizione));

-- Le lavorazioni che l'AI riconosce. Ognuna punta a una voce del prezzario (per regione) e ha un coefficiente
-- per la finitura. Le compila l'admin; finché il codice manca, la stima la segnala come «senza prezzo».
create table if not exists marketplace.app_stima_lavorazioni (
  chiave text primary key check (chiave ~ '^[a-z0-9_]{2,40}$'),
  nome text not null check (length(btrim(nome)) between 2 and 80),
  um text not null check (um in ('mq', 'm', 'n', 'corpo')),
  aliquota numeric(5,2) not null default 10 check (aliquota in (0, 4, 5, 10, 22)),
  attiva boolean not null default true
);
create table if not exists marketplace.app_stima_riferimenti (
  lavorazione text not null references marketplace.app_stima_lavorazioni(chiave) on delete cascade,
  regione text not null check (length(regione) <= 40),
  prezzario uuid not null references marketplace.app_prezzari(id) on delete cascade,
  codice text not null,
  primary key (lavorazione, regione),
  foreign key (prezzario, codice) references marketplace.app_prezzari_voci(prezzario, codice) on delete cascade
);
insert into marketplace.app_stima_lavorazioni (chiave, nome, um, aliquota) values
  ('demolizione_pavimenti', 'Demolizione di pavimenti e massetti', 'mq', 10),
  ('demolizione_rivestimenti', 'Demolizione di rivestimenti', 'mq', 10),
  ('demolizione_tramezzi', 'Demolizione di tramezzi', 'mq', 10),
  ('rimozione_sanitari', 'Rimozione di sanitari', 'n', 10),
  ('massetto', 'Massetto di sottofondo', 'mq', 10),
  ('pavimento', 'Pavimento posato', 'mq', 10),
  ('rivestimento', 'Rivestimento posato', 'mq', 10),
  ('tramezzo', 'Tramezzo in laterizio o cartongesso', 'mq', 10),
  ('intonaco', 'Intonaco', 'mq', 10),
  ('tinteggiatura', 'Tinteggiatura', 'mq', 10),
  ('impianto_elettrico', 'Impianto elettrico (punti)', 'n', 10),
  ('impianto_idrico', 'Impianto idrico-sanitario (punti)', 'n', 10),
  ('sanitari', 'Fornitura e posa di sanitari', 'n', 10),
  ('porte_interne', 'Porte interne', 'n', 10),
  ('infissi', 'Infissi esterni', 'mq', 10),
  ('caldaia', 'Caldaia o generatore', 'n', 10),
  ('ponteggio', 'Ponteggio', 'mq', 10),
  ('smaltimento', 'Trasporto e smaltimento macerie', 'corpo', 10)
on conflict (chiave) do nothing;

-- Coefficienti per la finitura e margine della forbice (le cambia l'admin in app_impostazioni)
insert into marketplace.app_impostazioni (chiave, valore)
values ('stima_flash', '{"finitura": {"base": 1.0, "medio": 1.2, "alto": 1.5}, "forbice": 0.12, "link_giorni": 60, "audio_giorni": 90}'::jsonb)
on conflict (chiave) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Stima: computo × prezzo del prezzario della regione × finitura, con forbice min/max
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_stima_calcola(p_sopralluogo uuid)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi;
  v_imp jsonb;
  v_coef numeric;
  v_forb numeric;
  r jsonb;
  v_prezzo numeric;
  v_tot numeric := 0;
  v_note text[] := '{}';
  v_righe jsonb := '[]'::jsonb;
begin
  select * into v_s from marketplace.app_sopralluoghi where id = p_sopralluogo;
  if not found then raise exception 'sopralluogo_non_trovato'; end if;
  if not (marketplace.app_fe_sistema() or v_s.agente = auth.uid() or marketplace.app_gestisce(v_s.org)) then raise exception 'non_autorizzato'; end if;
  select valore into v_imp from marketplace.app_impostazioni where chiave = 'stima_flash';
  v_coef := coalesce((v_imp->'finitura'->>v_s.finitura)::numeric, 1);
  v_forb := coalesce((v_imp->>'forbice')::numeric, 0.12);
  for r in select * from jsonb_array_elements(v_s.computo) loop
    v_prezzo := coalesce(nullif(r->>'prezzo', '')::numeric, (
      select v.prezzo from marketplace.app_stima_riferimenti rf
        join marketplace.app_prezzari p on p.id = rf.prezzario and p.attivo
        join marketplace.app_prezzari_voci v on v.prezzario = rf.prezzario and v.codice = rf.codice
       where rf.lavorazione = r->>'lavorazione' and rf.regione = v_s.regione));
    if v_prezzo is null then
      v_note := v_note || ('Senza prezzo: ' || coalesce(r->>'descrizione', r->>'lavorazione'));
      continue;
    end if;
    v_tot := v_tot + v_prezzo * coalesce((r->>'quantita')::numeric, 0);
  end loop;
  if v_s.regione = '' then v_note := v_note || 'Manca la regione del cantiere: non so quale prezzario usare.'::text; end if;
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_sopralluoghi
     set stima_min = case when v_tot > 0 then round(v_tot * v_coef * (1 - v_forb), -1) end,
         stima_max = case when v_tot > 0 then round(v_tot * v_coef * (1 + v_forb), -1) end,
         stima_note = to_jsonb(v_note)
   where id = p_sopralluogo;
  perform set_config('app.fe_sistema', '', true);
  return jsonb_build_object('min', case when v_tot > 0 then round(v_tot * v_coef * (1 - v_forb), -1) end,
                            'max', case when v_tot > 0 then round(v_tot * v_coef * (1 + v_forb), -1) end, 'note', to_jsonb(v_note));
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Ufficio tecnico e link del cliente
-- ---------------------------------------------------------------------------
-- L'agente manda il dossier all'ufficio e crea il link per il cliente (60 giorni). Restituisce il token.
create or replace function marketplace.app_sopralluogo_invia(p_sopralluogo uuid)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi;
  v_giorni int;
  v_tok uuid;
begin
  select * into v_s from marketplace.app_sopralluoghi where id = p_sopralluogo for update;
  if not found then raise exception 'sopralluogo_non_trovato'; end if;
  if not (v_s.agente = auth.uid() or marketplace.app_gestisce(v_s.org)) then raise exception 'non_autorizzato'; end if;
  if v_s.stato in ('annullato') then raise exception 'sopralluogo_annullato'; end if;
  select coalesce((valore->>'link_giorni')::int, 60) into v_giorni from marketplace.app_impostazioni where chiave = 'stima_flash';
  v_tok := coalesce(v_s.link, gen_random_uuid());
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_sopralluoghi
     set link = v_tok, link_scade = now() + make_interval(days => coalesce(v_giorni, 60)),
         stato = case when stato in ('programmato', 'completato') then 'in_ufficio' else stato end,
         in_ufficio_il = coalesce(in_ufficio_il, now())
   where id = p_sopralluogo;
  perform set_config('app.fe_sistema', '', true);
  perform marketplace.app_notifica_gestori(v_s.org, 'Nuovo dossier dal sopralluogo: ' || left(coalesce(nullif(v_s.lavori, ''), 'lavori'), 80), 'so-dossier/' || v_s.id);
  return v_tok;
end;
$$;

-- Lavorazioni e coefficienti di stile per la tavola d'atmosfera (solo testo e colori, niente immagini di terzi)
create or replace function marketplace.app_stile_tavola(p_stile text)
returns jsonb language sql immutable as $$
  select case p_stile
    when 'moderno_minimal' then '{"nome":"Moderno minimal","colori":["#F2F1EE","#D9D6D0","#8C8A86","#2B2B2B"],"materiali":["Gres effetto cemento grande formato","Laccato opaco bianco","Profili neri sottili"],"parole":["Linee pulite","Pochi oggetti","Luce diffusa"]}'
    when 'classico' then '{"nome":"Classico","colori":["#F4EDE1","#C9B79C","#8A6E4B","#3E2F22"],"materiali":["Parquet a spina","Boiserie","Ottone"],"parole":["Simmetria","Cornici","Calore"]}'
    when 'industriale' then '{"nome":"Industriale","colori":["#E6E3DF","#9A9590","#5A5550","#1F1E1D"],"materiali":["Microcemento","Ferro nero","Mattone a vista"],"parole":["Materia","Struttura","Contrasto"]}'
    when 'mediterraneo' then '{"nome":"Mediterraneo","colori":["#FBFAF6","#E9E1D3","#2F6FA3","#C76B3E"],"materiali":["Calce bianca","Cotto","Maiolica decorata"],"parole":["Luce","Curve morbide","Blu e terra"]}'
    when 'scandinavo' then '{"nome":"Scandinavo","colori":["#FAFAF7","#E4DDD2","#B8A88F","#3D4A4F"],"materiali":["Rovere chiaro","Tessuti naturali","Ceramica opaca"],"parole":["Semplicità","Legno","Accoglienza"]}'
    when 'rustico' then '{"nome":"Rustico","colori":["#F1E9DD","#C8A27C","#7B5A3C","#3B2C20"],"materiali":["Travi in legno","Pietra","Cotto fatto a mano"],"parole":["Tradizione","Materiali veri","Calore"]}'
    else null end::jsonb;
$$;

-- Pagina del cliente SENZA password: solo ciò che serve, solo marchio AncheCasa.
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
    'preventivo', (select jsonb_build_object('stato', d.stato_preventivo) from marketplace.app_fe_documenti d where d.id = v_s.preventivo),
    'cantiere', case when v_c.id is not null then jsonb_build_object('codice', coalesce(v_c.dati->>'codice', ''), 'stato', v_c.stato, 'inizio', v_c.data,
                  'fasi', v_fasi, 'giornale', v_giornale,
                  'avanzamento', (select round(avg(coalesce((f.dati->>'avanzamento')::numeric, 0))) from marketplace.app_record f where f.rif = v_c.id and f.tipo = 'fase'),
                  'fatture', (select count(*) from marketplace.app_fe_documenti d where d.cantiere = v_c.id and d.tipo <> 'preventivo' and d.bloccato)) end,
    'scade', v_s.link_scade
  );
end;
$$;

-- Il cliente dà l'ok di massima sul budget (dal link, senza password)
create or replace function marketplace.app_stima_ok_budget(p_token uuid)
returns boolean language plpgsql security definer set search_path = marketplace, public as $$
declare v_s marketplace.app_sopralluoghi;
begin
  select * into v_s from marketplace.app_sopralluoghi where link = p_token and link_scade > now() and stato in ('in_ufficio', 'completato', 'programmato', 'budget_ok') for update;
  if not found then return false; end if;
  if v_s.budget_ok_il is not null then return true; end if;
  if v_s.stima_min is null then return false; end if;
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_sopralluoghi set budget_ok_il = now(), stato = 'budget_ok' where id = v_s.id;
  perform set_config('app.fe_sistema', '', true);
  perform marketplace.app_notifica_gestori(v_s.org, 'Il cliente ha dato l''ok al budget: ' || left(coalesce(nullif(v_s.lavori, ''), 'lavori'), 80), 'so-dossier/' || v_s.id);
  if v_s.agente is not null then perform marketplace.app_notifica(v_s.agente, 'Ok al budget dal cliente: ' || left(coalesce(nullif(v_s.lavori, ''), 'lavori'), 80), 'pratica/' || v_s.id); end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Codice univoco del cantiere e «Converti in cantiere attivo»
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_codici_cantiere (
  anno int primary key,
  ultimo int not null default 0
);
create or replace function marketplace.app_nuovo_codice_cantiere()
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare v_n int; v_a int := extract(year from current_date)::int;
begin
  insert into marketplace.app_codici_cantiere (anno, ultimo) values (v_a, 1)
  on conflict (anno) do update set ultimo = marketplace.app_codici_cantiere.ultimo + 1 returning ultimo into v_n;
  return 'AC-' || v_a || '-' || lpad(v_n::text, 4, '0');
end;
$$;

-- Un click: preventivo dal computo (se non c'è), accettato, cantiere con codice e budget, collegamenti.
create or replace function marketplace.app_converti_in_cantiere(p_sopralluogo uuid)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi;
  v_prev uuid;
  v_cant uuid;
  v_cod text;
  r jsonb;
  v_n int := 0;
  v_prezzo numeric;
  v_aliq numeric;
begin
  select * into v_s from marketplace.app_sopralluoghi where id = p_sopralluogo for update;
  if not found then raise exception 'sopralluogo_non_trovato'; end if;
  if not marketplace.app_fe_scrive(v_s.org) then raise exception 'non_autorizzato'; end if;
  if v_s.cantiere is not null then return v_s.cantiere; end if;
  if v_s.stato = 'annullato' then raise exception 'sopralluogo_annullato'; end if;

  -- 1. Preventivo (dal computo validato dall'ufficio, se non c'è già)
  v_prev := coalesce(v_s.preventivo, marketplace.app_sopralluogo_a_preventivo(p_sopralluogo));
  if not exists (select 1 from marketplace.app_fe_righe where documento = v_prev) then
    if jsonb_array_length(v_s.computo) = 0 then raise exception 'computo_vuoto'; end if;
    if not v_s.computo_validato then raise exception 'computo_da_validare'; end if;
    for r in select * from jsonb_array_elements(v_s.computo) loop
      v_n := v_n + 1;
      v_prezzo := coalesce(nullif(r->>'prezzo', '')::numeric, (
        select v.prezzo from marketplace.app_stima_riferimenti rf join marketplace.app_prezzari_voci v on v.prezzario = rf.prezzario and v.codice = rf.codice
         where rf.lavorazione = r->>'lavorazione' and rf.regione = v_s.regione), 0);
      select aliquota into v_aliq from marketplace.app_stima_lavorazioni where chiave = r->>'lavorazione';
      insert into marketplace.app_fe_righe (documento, n, descrizione, quantita, um, prezzo, aliquota)
      values (v_prev, v_n, left(coalesce(nullif(r->>'descrizione', ''), r->>'lavorazione', 'Lavorazione'), 1000),
              greatest(coalesce((r->>'quantita')::numeric, 1), 0.001), left(coalesce(r->>'um', ''), 10), v_prezzo, coalesce(v_aliq, 10));
    end loop;
  end if;
  perform marketplace.app_fe_stato_preventivo(v_prev, 'accettato');

  -- 2. Cantiere (stessa funzione di sempre) + codice univoco e budget
  v_cant := marketplace.app_fe_apri_cantiere(v_prev);
  v_cod := marketplace.app_nuovo_codice_cantiere();
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_record
     set dati = dati || jsonb_build_object('codice', v_cod, 'budget', (select totale from marketplace.app_fe_documenti where id = v_prev),
                                           'stima_min', v_s.stima_min, 'stima_max', v_s.stima_max, 'comune', v_s.comune, 'regione', v_s.regione),
         stato = 'aperto'
   where id = v_cant;
  update marketplace.app_sopralluoghi set stato = 'convertito' where id = p_sopralluogo;
  perform set_config('app.fe_sistema', '', true);
  -- 3. Il fascicolo di sicurezza è legato al cantiere: si apre già con i documenti del cantiere da caricare.
  return v_cant;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Controlli e permessi
-- ---------------------------------------------------------------------------
-- I campi del Flash che decide il sistema (stima, link, budget) non si scrivono a mano.
create or replace function marketplace.app_sopralluoghi_flash()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if marketplace.app_fe_sistema() or marketplace.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.link := null; new.link_scade := null; new.budget_ok_il := null; new.stima_min := null; new.stima_max := null; new.in_ufficio_il := null;
    if new.stato not in ('programmato', 'completato') then new.stato := 'programmato'; end if;
  else
    new.link := old.link; new.link_scade := old.link_scade; new.budget_ok_il := old.budget_ok_il;
    new.stima_min := old.stima_min; new.stima_max := old.stima_max; new.stima_note := old.stima_note; new.in_ufficio_il := old.in_ufficio_il;
    new.audio_scade := old.audio_scade;
    if new.stato in ('in_ufficio', 'budget_ok', 'convertito') and new.stato is distinct from old.stato then new.stato := old.stato; end if;
    -- il computo validato lo tocca solo l'ufficio (chi gestisce la ditta)
    if not marketplace.app_gestisce(old.org) then new.computo_validato := old.computo_validato; end if;
    if old.computo_validato and not marketplace.app_gestisce(old.org) then new.computo := old.computo; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists app_sopralluoghi_flash on marketplace.app_sopralluoghi;
create trigger app_sopralluoghi_flash before insert or update on marketplace.app_sopralluoghi
  for each row execute function marketplace.app_sopralluoghi_flash();

-- La regola di modifica del sopralluogo vale anche per gli stati nuovi
drop policy if exists app_sopralluoghi_cambia on marketplace.app_sopralluoghi;
create policy app_sopralluoghi_cambia on marketplace.app_sopralluoghi for update
  using (marketplace.is_admin() or marketplace.app_gestisce(org) or (agente = auth.uid() and stato in ('programmato', 'completato', 'in_ufficio', 'budget_ok')))
  with check (marketplace.is_admin() or marketplace.app_gestisce(org) or agente = auth.uid());

alter table marketplace.app_sopralluoghi_media enable row level security;
drop policy if exists app_sopralluoghi_media_leggi on marketplace.app_sopralluoghi_media;
create policy app_sopralluoghi_media_leggi on marketplace.app_sopralluoghi_media for select using (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo));
drop policy if exists app_sopralluoghi_media_scrivi on marketplace.app_sopralluoghi_media;
create policy app_sopralluoghi_media_scrivi on marketplace.app_sopralluoghi_media for all
  using (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and (s.agente = auth.uid() or marketplace.app_gestisce(s.org))))
  with check (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and (s.agente = auth.uid() or marketplace.app_gestisce(s.org))));
grant select, insert, update, delete on marketplace.app_sopralluoghi_media to authenticated;

-- Pratica edilizia: la legge chi vede il sopralluogo; la scrive chi lo gestisce. Se cambia un umano, è «tecnico».
create or replace function marketplace.app_sopralluoghi_pratica_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.app_fe_sistema() then
    new.titolo_da := 'tecnico'; new.verificato_da := auth.uid(); new.verificato_il := now();
  end if;
  return new;
end;
$$;
drop trigger if exists app_sopralluoghi_pratica_controlli on marketplace.app_sopralluoghi_pratica;
create trigger app_sopralluoghi_pratica_controlli before insert or update on marketplace.app_sopralluoghi_pratica
  for each row execute function marketplace.app_sopralluoghi_pratica_controlli();
alter table marketplace.app_sopralluoghi_pratica enable row level security;
drop policy if exists app_sopralluoghi_pratica_leggi on marketplace.app_sopralluoghi_pratica;
create policy app_sopralluoghi_pratica_leggi on marketplace.app_sopralluoghi_pratica for select using (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo));
drop policy if exists app_sopralluoghi_pratica_scrivi on marketplace.app_sopralluoghi_pratica;
create policy app_sopralluoghi_pratica_scrivi on marketplace.app_sopralluoghi_pratica for all
  using (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and marketplace.app_gestisce(s.org)))
  with check (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and marketplace.app_gestisce(s.org)));
grant select, insert, update on marketplace.app_sopralluoghi_pratica to authenticated;
alter table marketplace.app_comuni_sue enable row level security;
drop policy if exists app_comuni_sue_leggi on marketplace.app_comuni_sue;
create policy app_comuni_sue_leggi on marketplace.app_comuni_sue for select using (auth.uid() is not null);
drop policy if exists app_comuni_sue_scrivi on marketplace.app_comuni_sue;
create policy app_comuni_sue_scrivi on marketplace.app_comuni_sue for all
  using (marketplace.is_admin() or exists (select 1 from marketplace.app_org_membri m where m.utente = auth.uid() and m.ruolo in ('titolare', 'responsabile')))
  with check (marketplace.is_admin() or exists (select 1 from marketplace.app_org_membri m where m.utente = auth.uid() and m.ruolo in ('titolare', 'responsabile')));
grant select, insert, update on marketplace.app_comuni_sue to authenticated;
grant all on marketplace.app_sopralluoghi_pratica, marketplace.app_comuni_sue to service_role;

alter table marketplace.app_prezzari enable row level security;
alter table marketplace.app_prezzari_voci enable row level security;
alter table marketplace.app_stima_lavorazioni enable row level security;
alter table marketplace.app_stima_riferimenti enable row level security;
alter table marketplace.app_codici_cantiere enable row level security;
drop policy if exists app_prezzari_leggi on marketplace.app_prezzari;
create policy app_prezzari_leggi on marketplace.app_prezzari for select using (auth.uid() is not null);
drop policy if exists app_prezzari_admin on marketplace.app_prezzari;
create policy app_prezzari_admin on marketplace.app_prezzari for all using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists app_prezzari_voci_leggi on marketplace.app_prezzari_voci;
create policy app_prezzari_voci_leggi on marketplace.app_prezzari_voci for select using (auth.uid() is not null);
drop policy if exists app_prezzari_voci_admin on marketplace.app_prezzari_voci;
create policy app_prezzari_voci_admin on marketplace.app_prezzari_voci for all using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists app_stima_lavorazioni_leggi on marketplace.app_stima_lavorazioni;
create policy app_stima_lavorazioni_leggi on marketplace.app_stima_lavorazioni for select using (auth.uid() is not null);
drop policy if exists app_stima_lavorazioni_admin on marketplace.app_stima_lavorazioni;
create policy app_stima_lavorazioni_admin on marketplace.app_stima_lavorazioni for all using (marketplace.is_admin()) with check (marketplace.is_admin());
drop policy if exists app_stima_riferimenti_leggi on marketplace.app_stima_riferimenti;
create policy app_stima_riferimenti_leggi on marketplace.app_stima_riferimenti for select using (auth.uid() is not null);
drop policy if exists app_stima_riferimenti_admin on marketplace.app_stima_riferimenti;
create policy app_stima_riferimenti_admin on marketplace.app_stima_riferimenti for all using (marketplace.is_admin()) with check (marketplace.is_admin());
grant select, insert, update, delete on marketplace.app_prezzari, marketplace.app_prezzari_voci, marketplace.app_stima_lavorazioni, marketplace.app_stima_riferimenti to authenticated;
grant all on marketplace.app_sopralluoghi_media, marketplace.app_prezzari, marketplace.app_prezzari_voci, marketplace.app_stima_lavorazioni,
  marketplace.app_stima_riferimenti, marketplace.app_codici_cantiere to service_role;
grant select on marketplace.app_impostazioni to service_role;

-- File: nota vocale (<id>/a/<nome>.webm|mp4|m4a|ogg) e media (<id>/m/<uuid>.jpg|png|mp4|webm|pdf) nel bucket «sopralluoghi»
update storage.buckets set file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'video/mp4', 'video/webm', 'application/pdf', 'audio/webm', 'audio/mp4', 'audio/ogg']
 where id = 'sopralluoghi';
create or replace function marketplace.app_foto_sopralluogo(p_nome text, p_scrivi boolean)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_sopralluoghi s
    where (p_nome ~ '^[0-9a-f-]{36}/([1-9]|[12][0-9]|30)\.jpg$'
        or p_nome ~ '^[0-9a-f-]{36}/m/[0-9a-f-]{36}\.(jpg|png|mp4|webm|pdf)$'
        or p_nome ~ '^[0-9a-f-]{36}/a/[0-9a-z-]{8,40}\.(webm|mp4|m4a|ogg)$')
      and s.id::text = split_part(p_nome, '/', 1)
      and (case when p_scrivi then (s.agente = auth.uid() or marketplace.app_gestisce(s.org)) and s.stato not in ('annullato', 'convertito')
                else marketplace.app_vedo_sopralluogo(s.org, s.agente) end)
  );
$$;

revoke all on function marketplace.app_stima_calcola(uuid) from public, anon;
revoke all on function marketplace.app_sopralluogo_invia(uuid) from public, anon;
revoke all on function marketplace.app_converti_in_cantiere(uuid) from public, anon;
revoke all on function marketplace.app_nuovo_codice_cantiere() from public, anon, authenticated;
grant execute on function marketplace.app_stima_calcola(uuid) to authenticated, service_role;
grant execute on function marketplace.app_sopralluogo_invia(uuid) to authenticated;
grant execute on function marketplace.app_converti_in_cantiere(uuid) to authenticated;
grant execute on function marketplace.app_stile_tavola(text) to anon, authenticated;
-- Le due sole funzioni aperte a chi non ha l'account: leggere la propria stima e dare l'ok al budget
grant execute on function marketplace.app_stima_pubblica(uuid) to anon, authenticated;
grant execute on function marketplace.app_stima_ok_budget(uuid) to anon, authenticated;
grant usage on schema marketplace to anon;

-- Chi può far analizzare la nota vocale (lo chiede la funzione «sopralluogo-flash» con il token della persona)
create or replace function marketplace.app_flash_posso(p_sopralluogo uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.app_sopralluoghi s
                  where s.id = p_sopralluogo and s.stato not in ('annullato', 'convertito')
                    and (s.agente = auth.uid() or marketplace.app_gestisce(s.org)));
$$;
revoke all on function marketplace.app_flash_posso(uuid) from public, anon;
grant execute on function marketplace.app_flash_posso(uuid) to authenticated;
