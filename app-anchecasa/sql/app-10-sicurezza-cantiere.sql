-- =============================================================================
-- AncheCasa app · parte 10: SICUREZZA DEL CANTIERE (D.Lgs. 81/08) E SCADENZIARIO COMUNE (11.10.2026)
-- Da eseguire DOPO app-09. Si può rieseguire senza danni.
--
-- Decisioni (Nando, 11.10.2026):
--  1. Fascicolo elettronico di cantiere: per ogni cantiere (scheda «cantiere» di app_record) l'elenco di chi ci
--     lavora (subappaltatori, lavoratori autonomi, lavoratori) e i loro documenti: DURC, POS, idoneità
--     tecnico-professionale, visura, attestati, idoneità sanitaria, UNILAV. Più i documenti del cantiere
--     (POS dell'affidataria, PSC, notifica preliminare).
--  2. Semaforo per persona e per impresa: rosso = manca un documento obbligatorio, è scaduto o è stato respinto;
--     giallo = scade entro 15 giorni o è da verificare; verde = tutto a posto.
--  3. I lavoratori della ditta riusano corsi e visite che ci sono già (app_record 'attestato' e 'visita').
--  4. Un subappaltatore che è nella rete AncheCasa (app_org) carica da solo i suoi documenti; la ditta li verifica.
--  5. Scadenziario comune (app_scadenze): lo riempiono i documenti del fascicolo; dopo lo useranno mezzi e altro.
--     Avvisi automatici a 30, 7 giorni e il giorno stesso, ogni mattina (pg_cron, se attivo sul progetto).
--  6. All'ingresso in cantiere (codice del patentino) si controlla anche il fascicolo: chi è «rosso» risulta
--     «non in regola» e la ditta riceve un avviso.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Chi può leggere e scrivere la sicurezza di una ditta
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_sic_legge(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or coalesce(marketplace.app_mio_ruolo(p_org) in ('titolare', 'responsabile', 'consulente'), false);
$$;
create or replace function marketplace.app_sic_scrive(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or (
    coalesce(marketplace.app_mio_ruolo(p_org) in ('titolare', 'responsabile', 'consulente'), false)
    and exists (select 1 from marketplace.app_org where id = p_org and stato = 'attiva')
    and (marketplace.app_modulo_attivo(p_org, 'sicantiere') or marketplace.app_modulo_attivo(p_org, 'sicurezza'))
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Chi lavora nel cantiere
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_cantiere_soggetti (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,                  -- ditta affidataria
  cantiere uuid not null references marketplace.app_record(id) on delete cascade,
  tipo text not null check (tipo in ('subappaltatore', 'lavoratore_autonomo', 'lavoratore')),
  nome text not null check (length(btrim(nome)) between 2 and 120),
  piva text not null default '' check (piva ~ '^([0-9]{11})?$'),
  sub_org uuid references marketplace.app_org(id) on delete set null,                      -- se il subappaltatore è nella rete
  dipendente uuid references marketplace.app_record(id) on delete set null,                -- lavoratore della ditta
  di uuid references marketplace.app_cantiere_soggetti(id) on delete cascade,              -- lavoratore DI un subappaltatore
  mansione text not null default '' check (length(mansione) <= 80),
  telefono text not null default '' check (length(telefono) <= 30),
  dal date,
  al date,
  stato text not null default 'attivo' check (stato in ('attivo', 'sospeso', 'uscito')),
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
create index if not exists app_cantiere_soggetti_cant on marketplace.app_cantiere_soggetti (cantiere);
create index if not exists app_cantiere_soggetti_sub on marketplace.app_cantiere_soggetti (sub_org) where sub_org is not null;

-- ---------------------------------------------------------------------------
-- 3. Documenti richiesti (si possono cambiare da Admin) e documenti caricati
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_fascicolo_requisiti (
  per text not null check (per in ('cantiere', 'subappaltatore', 'lavoratore_autonomo', 'lavoratore')),
  documento text not null,
  obbligatorio boolean not null default true,
  validita_giorni int check (validita_giorni is null or validita_giorni > 0),   -- se il documento non porta la scadenza
  nota text not null default '' check (length(nota) <= 200),
  primary key (per, documento)
);
insert into marketplace.app_fascicolo_requisiti (per, documento, obbligatorio, validita_giorni, nota) values
  ('cantiere', 'pos', true, null, 'POS dell''impresa affidataria (art. 89 e 96)'),
  ('cantiere', 'psc', false, null, 'Se c''è il coordinatore per l''esecuzione'),
  ('cantiere', 'notifica_preliminare', false, null, 'Se dovuta (art. 99)'),
  ('subappaltatore', 'visura', true, 180, 'Iscrizione alla Camera di Commercio'),
  ('subappaltatore', 'durc', true, 120, 'Regolarità contributiva'),
  ('subappaltatore', 'pos', true, null, 'Piano operativo di sicurezza'),
  ('subappaltatore', 'itp', true, null, 'Idoneità tecnico-professionale (Allegato XVII)'),
  ('lavoratore_autonomo', 'visura', true, 180, 'Iscrizione alla Camera di Commercio'),
  ('lavoratore_autonomo', 'durc', true, 120, 'Regolarità contributiva'),
  ('lavoratore_autonomo', 'itp', true, null, 'Idoneità tecnico-professionale, attrezzature e DPI (Allegato XVII)'),
  ('lavoratore', 'attestato', true, null, 'Formazione generale e specifica'),
  ('lavoratore', 'idoneita_sanitaria', true, null, 'Visita medica'),
  ('lavoratore', 'unilav', true, null, 'Comunicazione di assunzione')
on conflict (per, documento) do nothing;

create table if not exists marketplace.app_fascicolo_documenti (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  cantiere uuid not null references marketplace.app_record(id) on delete cascade,
  soggetto uuid references marketplace.app_cantiere_soggetti(id) on delete cascade,        -- null = documento del cantiere
  documento text not null check (documento in ('durc', 'pos', 'itp', 'visura', 'dvr', 'attestato', 'idoneita_sanitaria', 'unilav', 'psc', 'notifica_preliminare', 'pimus', 'altro')),
  titolo text not null default '' check (length(titolo) <= 160),
  rilasciato date,
  scade date,
  file text not null default '' check (file ~ '^([0-9a-f-]{36}\.(pdf|jpg|png))?$'),       -- bucket «fascicolo»
  verifica text not null default 'da_verificare' check (verifica in ('da_verificare', 'valido', 'respinto')),
  nota text not null default '' check (length(nota) <= 500),
  caricato_da uuid default auth.uid() references auth.users(id) on delete set null,
  verificato_da uuid references auth.users(id) on delete set null,
  verificato_il timestamptz,
  creato timestamptz not null default now()
);
create index if not exists app_fascicolo_documenti_cant on marketplace.app_fascicolo_documenti (cantiere, soggetto);
create index if not exists app_fascicolo_documenti_scade on marketplace.app_fascicolo_documenti (scade) where scade is not null;

-- ---------------------------------------------------------------------------
-- 4. Scadenziario comune
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_scadenze (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  ambito text not null check (ambito in ('sicurezza', 'mezzo', 'magazzino', 'fattura', 'altro')),
  origine text not null check (length(origine) <= 40),        -- tabella di provenienza (es. app_fascicolo_documenti)
  origine_id uuid not null,
  cantiere uuid references marketplace.app_record(id) on delete cascade,
  titolo text not null check (length(titolo) <= 200),
  scade date not null,
  avvisa int[] not null default '{30,7,0}',
  ultimo_avviso date,
  stato text not null default 'attiva' check (stato in ('attiva', 'risolta')),
  unique (origine, origine_id)
);
create index if not exists app_scadenze_quando on marketplace.app_scadenze (org, scade) where stato = 'attiva';

-- ---------------------------------------------------------------------------
-- 5. Controlli automatici
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_cantiere_soggetti_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not exists (select 1 from marketplace.app_record where id = new.cantiere and org = new.org and tipo = 'cantiere') then raise exception 'cantiere_non_valido'; end if;
  if new.dipendente is not null and not exists (select 1 from marketplace.app_record where id = new.dipendente and tipo = 'dipendente'
       and (org = new.org or org = (select sub_org from marketplace.app_cantiere_soggetti where id = new.di))) then
    raise exception 'dipendente_non_valido';
  end if;
  if new.di is not null and not exists (select 1 from marketplace.app_cantiere_soggetti where id = new.di and cantiere = new.cantiere and tipo = 'subappaltatore') then
    raise exception 'impresa_non_valida';
  end if;
  if new.tipo <> 'lavoratore' then new.dipendente := null; new.di := null; end if;
  if tg_op = 'UPDATE' then new.org := old.org; new.cantiere := old.cantiere; end if;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_cantiere_soggetti_controlli on marketplace.app_cantiere_soggetti;
create trigger app_cantiere_soggetti_controlli before insert or update on marketplace.app_cantiere_soggetti
  for each row execute function marketplace.app_cantiere_soggetti_controlli();

-- Il subappaltatore che gestisce la sua impresa nella rete (sub_org)
create or replace function marketplace.app_sic_sono_sub(p_soggetto uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.app_cantiere_soggetti s
                 where (s.id = p_soggetto or s.id = (select di from marketplace.app_cantiere_soggetti where id = p_soggetto))
                   and s.sub_org is not null and marketplace.app_gestisce(s.sub_org));
$$;

create or replace function marketplace.app_fascicolo_documenti_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_per text;
  v_val int;
begin
  if new.soggetto is not null then
    select s.tipo into v_per from marketplace.app_cantiere_soggetti s where s.id = new.soggetto and s.cantiere = new.cantiere;
    if not found then raise exception 'soggetto_non_valido'; end if;
  else
    v_per := 'cantiere';
  end if;
  select org into new.org from marketplace.app_record where id = new.cantiere and tipo = 'cantiere';
  if new.org is null then raise exception 'cantiere_non_valido'; end if;
  -- Scadenza predefinita (es. DURC 120 giorni dal rilascio) se il documento non la porta
  if new.scade is null and new.rilasciato is not null then
    select validita_giorni into v_val from marketplace.app_fascicolo_requisiti where per = v_per and documento = new.documento;
    if v_val is not null then new.scade := new.rilasciato + v_val; end if;
  end if;
  if tg_op = 'INSERT' then
    new.caricato_da := auth.uid();
    if not (marketplace.app_sic_scrive(new.org) or marketplace.app_fe_sistema()) then
      new.verifica := 'da_verificare'; new.verificato_da := null; new.verificato_il := null;   -- caricato dal subappaltatore
    elsif new.verifica <> 'da_verificare' then
      new.verificato_da := auth.uid(); new.verificato_il := now();
    end if;
  else
    new.org := old.org; new.cantiere := old.cantiere; new.soggetto := old.soggetto; new.caricato_da := old.caricato_da;
    if new.verifica is distinct from old.verifica then
      if not (marketplace.app_sic_scrive(new.org) or marketplace.app_fe_sistema()) then new.verifica := old.verifica;
      else new.verificato_da := auth.uid(); new.verificato_il := now(); end if;
    end if;
    -- il subappaltatore che corregge un documento lo rimette «da verificare»
    if not marketplace.app_sic_scrive(new.org) and row(new.file, new.scade, new.rilasciato) is distinct from row(old.file, old.scade, old.rilasciato) then
      new.verifica := 'da_verificare';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists app_fascicolo_documenti_controlli on marketplace.app_fascicolo_documenti;
create trigger app_fascicolo_documenti_controlli before insert or update on marketplace.app_fascicolo_documenti
  for each row execute function marketplace.app_fascicolo_documenti_controlli();

-- Ogni documento con scadenza finisce nello scadenziario comune
create or replace function marketplace.app_fascicolo_scadenze()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare v_nome text;
begin
  if tg_op = 'DELETE' then
    delete from marketplace.app_scadenze where origine = 'app_fascicolo_documenti' and origine_id = old.id;
    return null;
  end if;
  if new.scade is null or new.verifica = 'respinto' then
    delete from marketplace.app_scadenze where origine = 'app_fascicolo_documenti' and origine_id = new.id;
    return null;
  end if;
  select coalesce(s.nome, '') into v_nome from marketplace.app_cantiere_soggetti s where s.id = new.soggetto;
  insert into marketplace.app_scadenze (org, ambito, origine, origine_id, cantiere, titolo, scade)
  values (new.org, 'sicurezza', 'app_fascicolo_documenti', new.id, new.cantiere,
          left(upper(replace(new.documento, '_', ' ')) || coalesce(' · ' || nullif(v_nome, ''), '') || coalesce(' · ' || (select titolo from marketplace.app_record where id = new.cantiere), ''), 200), new.scade)
  on conflict (origine, origine_id) do update set scade = excluded.scade, titolo = excluded.titolo, stato = 'attiva',
    ultimo_avviso = case when marketplace.app_scadenze.scade <> excluded.scade then null else marketplace.app_scadenze.ultimo_avviso end;
  return null;
end;
$$;
drop trigger if exists app_fascicolo_scadenze on marketplace.app_fascicolo_documenti;
create trigger app_fascicolo_scadenze after insert or update or delete on marketplace.app_fascicolo_documenti
  for each row execute function marketplace.app_fascicolo_scadenze();

-- ---------------------------------------------------------------------------
-- 6. Semaforo
-- ---------------------------------------------------------------------------
-- Un documento richiesto: c'è, è valido o da verificare, non è scaduto?
-- Per i lavoratori della ditta valgono anche i corsi e le visite già registrati (app_record).
create or replace function marketplace.app_semaforo_soggetto(p_soggetto uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_cantiere_soggetti;
  r record;
  v_doc marketplace.app_fascicolo_documenti;
  v_scad date;
  v_rossi text[] := '{}';
  v_gialli text[] := '{}';
  v_nome text;
begin
  select * into v_s from marketplace.app_cantiere_soggetti where id = p_soggetto;
  if not found then return null; end if;
  if v_s.stato = 'sospeso' then return jsonb_build_object('colore', 'rosso', 'motivi', jsonb_build_array('Sospeso dalla ditta')); end if;
  for r in select documento, nota from marketplace.app_fascicolo_requisiti where per = v_s.tipo and obbligatorio loop
    v_nome := upper(replace(r.documento, '_', ' '));
    select * into v_doc from marketplace.app_fascicolo_documenti d
     where d.soggetto = p_soggetto and d.documento = r.documento and d.verifica <> 'respinto'
     order by (d.verifica = 'valido') desc, d.scade desc nulls first limit 1;
    v_scad := null;
    if v_doc.id is null and v_s.dipendente is not null then
      -- corsi e visite già nell'app
      select max(x.scadenza) into v_scad from marketplace.app_record x
       where x.rif = v_s.dipendente and x.scadenza is not null
         and ((r.documento = 'attestato' and x.tipo = 'attestato')
           or (r.documento = 'idoneita_sanitaria' and x.tipo = 'visita' and coalesce(x.stato, '') <> 'non idoneo'));
      if v_scad is null then v_rossi := v_rossi || ('Manca ' || v_nome);
      elsif v_scad < current_date then v_rossi := v_rossi || (v_nome || ' scaduto il ' || to_char(v_scad, 'DD/MM/YYYY'));
      elsif v_scad <= current_date + 15 then v_gialli := v_gialli || (v_nome || ' scade il ' || to_char(v_scad, 'DD/MM/YYYY'));
      end if;
      continue;
    end if;
    if v_doc.id is null then v_rossi := v_rossi || ('Manca ' || v_nome);
    elsif v_doc.scade is not null and v_doc.scade < current_date then v_rossi := v_rossi || (v_nome || ' scaduto il ' || to_char(v_doc.scade, 'DD/MM/YYYY'));
    else
      if v_doc.verifica = 'da_verificare' then v_gialli := v_gialli || (v_nome || ' da verificare'); end if;
      if v_doc.scade is not null and v_doc.scade <= current_date + 15 then v_gialli := v_gialli || (v_nome || ' scade il ' || to_char(v_doc.scade, 'DD/MM/YYYY')); end if;
    end if;
  end loop;
  -- il lavoratore di un subappaltatore «rosso» non entra
  if v_s.di is not null and (marketplace.app_semaforo_soggetto(v_s.di)->>'colore') = 'rosso' then
    v_rossi := v_rossi || ('L''impresa ' || (select nome from marketplace.app_cantiere_soggetti where id = v_s.di) || ' non è in regola');
  end if;
  if v_s.al is not null and v_s.al < current_date then v_rossi := v_rossi || ('Autorizzato fino al ' || to_char(v_s.al, 'DD/MM/YYYY')); end if;
  return jsonb_build_object(
    'colore', case when cardinality(v_rossi) > 0 then 'rosso' when cardinality(v_gialli) > 0 then 'giallo' else 'verde' end,
    'motivi', to_jsonb(v_rossi || v_gialli));
end;
$$;

-- Fascicolo di un cantiere: soggetti con semaforo, documenti del cantiere, quanti rossi
create or replace function marketplace.app_fascicolo_cantiere(p_cantiere uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_org uuid;
  v_ditta boolean;
  v jsonb;
begin
  select org into v_org from marketplace.app_record where id = p_cantiere and tipo = 'cantiere';
  if v_org is null then raise exception 'cantiere_non_trovato'; end if;
  v_ditta := marketplace.app_sic_legge(v_org);
  if not v_ditta and not exists (select 1 from marketplace.app_cantiere_soggetti s where s.cantiere = p_cantiere and s.sub_org is not null and marketplace.app_gestisce(s.sub_org)) then
    raise exception 'non_autorizzato';
  end if;
  select jsonb_build_object(
    'cantiere', (select jsonb_build_object('id', id, 'titolo', titolo, 'stato', stato, 'org', org) from marketplace.app_record where id = p_cantiere),
    'ditta', v_ditta,
    'soggetti', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'tipo', s.tipo, 'nome', s.nome, 'piva', s.piva, 'mansione', s.mansione, 'di', s.di,
                   'stato', s.stato, 'dal', s.dal, 'al', s.al, 'sub_org', s.sub_org, 'semaforo', marketplace.app_semaforo_soggetto(s.id)) order by s.di nulls first, s.tipo, s.nome)
                 from marketplace.app_cantiere_soggetti s
                 where s.cantiere = p_cantiere and s.stato <> 'uscito'
                   and (v_ditta or marketplace.app_sic_sono_sub(s.id))), '[]'::jsonb),
    'documenti_cantiere', case when v_ditta then coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'documento', d.documento, 'titolo', d.titolo, 'scade', d.scade, 'verifica', d.verifica, 'file', d.file))
                 from marketplace.app_fascicolo_documenti d where d.cantiere = p_cantiere and d.soggetto is null), '[]'::jsonb) else '[]'::jsonb end,
    'mancano_cantiere', case when v_ditta then coalesce((select jsonb_agg(q.documento) from marketplace.app_fascicolo_requisiti q
                 where q.per = 'cantiere' and q.obbligatorio and not exists (select 1 from marketplace.app_fascicolo_documenti d
                   where d.cantiere = p_cantiere and d.soggetto is null and d.documento = q.documento and d.verifica <> 'respinto' and (d.scade is null or d.scade >= current_date))), '[]'::jsonb) else '[]'::jsonb end
  ) into v;
  return v;
end;
$$;

-- Riassunto per la home della sicurezza: cantieri della ditta con rossi e gialli
create or replace function marketplace.app_sicurezza_cantieri(p_org uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  if not marketplace.app_sic_legge(p_org) then raise exception 'non_autorizzato'; end if;
  return coalesce((select jsonb_agg(x order by (x->>'rossi')::int desc, x->>'titolo') from (
    select jsonb_build_object('id', c.id, 'titolo', c.titolo, 'stato', c.stato,
      'soggetti', count(s.id),
      'rossi', count(s.id) filter (where marketplace.app_semaforo_soggetto(s.id)->>'colore' = 'rosso'),
      'gialli', count(s.id) filter (where marketplace.app_semaforo_soggetto(s.id)->>'colore' = 'giallo')) x
    from marketplace.app_record c left join marketplace.app_cantiere_soggetti s on s.cantiere = c.id and s.stato = 'attivo'
    where c.org = p_org and c.tipo = 'cantiere' and coalesce(c.stato, '') not in ('chiuso', 'concluso')
    group by c.id, c.titolo, c.stato) t), '[]'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Avvisi automatici (ogni mattina)
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_scadenze_avvisa()
returns int language plpgsql security definer set search_path = marketplace, public as $$
declare
  s record;
  n int := 0;
  v_giorni int;
  v_sub uuid;
begin
  for s in select * from marketplace.app_scadenze where stato = 'attiva' and scade <= current_date + 30 loop
    v_giorni := s.scade - current_date;
    -- un avviso al giorno al massimo, e solo nei giorni previsti (o se è già scaduta e non l'abbiamo mai detto)
    if s.ultimo_avviso = current_date then continue; end if;
    if not (v_giorni = any(s.avvisa) or (v_giorni < 0 and s.ultimo_avviso is null)) then continue; end if;
    perform marketplace.app_notifica_gestori(s.org,
      case when v_giorni < 0 then 'Scaduto: ' when v_giorni = 0 then 'Scade oggi: ' else 'Scade tra ' || v_giorni || ' giorni: ' end || s.titolo,
      case when s.cantiere is not null then 'sic-cantiere/' || s.cantiere else 'sic-scadenze' end);
    if s.origine = 'app_fascicolo_documenti' then
      select so.sub_org into v_sub from marketplace.app_fascicolo_documenti d join marketplace.app_cantiere_soggetti so on so.id = d.soggetto where d.id = s.origine_id;
      if v_sub is not null then
        perform marketplace.app_notifica_gestori(v_sub, 'Documento da rinnovare per il cantiere: ' || s.titolo, 'sic-cantiere/' || s.cantiere);
      end if;
    end if;
    update marketplace.app_scadenze set ultimo_avviso = current_date where id = s.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- pg_cron: ogni mattina alle 7 (ora di Roma ≈ 5 UTC). Se pg_cron non è attivo non succede niente:
-- lo si attiva da Supabase → Database → Extensions → pg_cron e si riesegue questo file.
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'app-scadenze-avvisa';
    perform cron.schedule('app-scadenze-avvisa', '0 5 * * *', 'select marketplace.app_scadenze_avvisa()');
  end if;
exception when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Ingresso in cantiere: al controllo di corsi e visite si aggiunge il fascicolo
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_registra_ingresso(p_cantiere uuid, p_codice text)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  c marketplace.app_record%rowtype;
  d marketplace.app_record%rowtype;
  v_scad date;
  v_ok boolean;
  v_sogg uuid;
  v_sem jsonb;
begin
  select * into c from marketplace.app_record where id = p_cantiere and tipo = 'cantiere';
  if not found or not (marketplace.app_gestisce(c.org) or coalesce(marketplace.app_accesso(c.id, null), '') = 'partner') then raise exception 'non_autorizzato'; end if;
  select * into d from marketplace.app_record r where r.tipo = 'dipendente' and upper(r.dati->>'codice') = upper(btrim(p_codice))
    and (r.org = c.org or r.org in (select m.org from marketplace.app_org_membri m where m.utente = auth.uid() and m.ruolo in ('titolare', 'responsabile')))
    limit 1;
  if not found then raise exception 'codice_non_trovato'; end if;
  select min(scadenza) into v_scad from marketplace.app_record where rif = d.id and tipo in ('attestato', 'visita') and scadenza is not null;
  v_ok := v_scad is not null and v_scad >= current_date;
  -- Se la persona è nel fascicolo di questo cantiere, vale il semaforo del fascicolo
  select id into v_sogg from marketplace.app_cantiere_soggetti where cantiere = c.id and dipendente = d.id and stato <> 'uscito' limit 1;
  if v_sogg is not null then
    v_sem := marketplace.app_semaforo_soggetto(v_sogg);
    v_ok := (v_sem->>'colore') <> 'rosso';
  end if;
  insert into marketplace.app_record (org, tipo, rif, titolo, data, stato, dati, creato_da)
    values (c.org, 'ingresso', c.id, d.titolo, current_date, case when v_ok then 'in regola' else 'non in regola' end,
            jsonb_strip_nulls(jsonb_build_object('codice', upper(btrim(p_codice)), 'motivi', v_sem->'motivi')), auth.uid());
  if not v_ok then
    perform marketplace.app_notifica_gestori(c.org, 'Ingresso NON in regola: ' || d.titolo || ' · ' || c.titolo, 'sic-cantiere/' || c.id);
  end if;
  return jsonb_build_object('nome', d.titolo, 'in_regola', v_ok, 'scadenza', v_scad, 'motivi', coalesce(v_sem->'motivi', '[]'::jsonb));
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Permessi
-- ---------------------------------------------------------------------------
alter table marketplace.app_cantiere_soggetti enable row level security;
drop policy if exists app_cantiere_soggetti_leggi on marketplace.app_cantiere_soggetti;
create policy app_cantiere_soggetti_leggi on marketplace.app_cantiere_soggetti for select using (marketplace.app_sic_legge(org) or marketplace.app_sic_sono_sub(id));
drop policy if exists app_cantiere_soggetti_scrivi on marketplace.app_cantiere_soggetti;
create policy app_cantiere_soggetti_scrivi on marketplace.app_cantiere_soggetti for all using (marketplace.app_sic_scrive(org)) with check (marketplace.app_sic_scrive(org));
-- il subappaltatore della rete aggiunge i suoi lavoratori
drop policy if exists app_cantiere_soggetti_sub on marketplace.app_cantiere_soggetti;
create policy app_cantiere_soggetti_sub on marketplace.app_cantiere_soggetti for insert with check (tipo = 'lavoratore' and di is not null and marketplace.app_sic_sono_sub(di));
grant select, insert, update, delete on marketplace.app_cantiere_soggetti to authenticated;

alter table marketplace.app_fascicolo_requisiti enable row level security;
drop policy if exists app_fascicolo_requisiti_leggi on marketplace.app_fascicolo_requisiti;
create policy app_fascicolo_requisiti_leggi on marketplace.app_fascicolo_requisiti for select using (auth.uid() is not null);
drop policy if exists app_fascicolo_requisiti_admin on marketplace.app_fascicolo_requisiti;
create policy app_fascicolo_requisiti_admin on marketplace.app_fascicolo_requisiti for all using (marketplace.is_admin()) with check (marketplace.is_admin());
grant select, insert, update, delete on marketplace.app_fascicolo_requisiti to authenticated;

alter table marketplace.app_fascicolo_documenti enable row level security;
drop policy if exists app_fascicolo_documenti_leggi on marketplace.app_fascicolo_documenti;
create policy app_fascicolo_documenti_leggi on marketplace.app_fascicolo_documenti for select using (marketplace.app_sic_legge(org) or (soggetto is not null and marketplace.app_sic_sono_sub(soggetto)));
drop policy if exists app_fascicolo_documenti_crea on marketplace.app_fascicolo_documenti;
create policy app_fascicolo_documenti_crea on marketplace.app_fascicolo_documenti for insert with check (
  marketplace.app_sic_scrive((select org from marketplace.app_record where id = cantiere)) or (soggetto is not null and marketplace.app_sic_sono_sub(soggetto)));
drop policy if exists app_fascicolo_documenti_cambia on marketplace.app_fascicolo_documenti;
create policy app_fascicolo_documenti_cambia on marketplace.app_fascicolo_documenti for update
  using (marketplace.app_sic_scrive(org) or (soggetto is not null and marketplace.app_sic_sono_sub(soggetto) and verifica <> 'valido'))
  with check (marketplace.app_sic_scrive(org) or (soggetto is not null and marketplace.app_sic_sono_sub(soggetto)));
drop policy if exists app_fascicolo_documenti_cancella on marketplace.app_fascicolo_documenti;
create policy app_fascicolo_documenti_cancella on marketplace.app_fascicolo_documenti for delete using (marketplace.app_sic_scrive(org));
grant select, insert, update, delete on marketplace.app_fascicolo_documenti to authenticated;

alter table marketplace.app_scadenze enable row level security;
drop policy if exists app_scadenze_leggi on marketplace.app_scadenze;
create policy app_scadenze_leggi on marketplace.app_scadenze for select using (marketplace.app_sic_legge(org) or marketplace.app_fe_legge(org));
drop policy if exists app_scadenze_risolvi on marketplace.app_scadenze;
create policy app_scadenze_risolvi on marketplace.app_scadenze for update using (marketplace.app_gestisce(org)) with check (marketplace.app_gestisce(org));
grant select, update on marketplace.app_scadenze to authenticated;

grant all on marketplace.app_cantiere_soggetti, marketplace.app_fascicolo_documenti, marketplace.app_fascicolo_requisiti, marketplace.app_scadenze to service_role;

-- File del fascicolo: bucket privato «fascicolo», percorso <id documento>.pdf|jpg|png
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fascicolo', 'fascicolo', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
create or replace function marketplace.app_file_fascicolo(p_nome text, p_scrivi boolean)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_fascicolo_documenti d
    where p_nome ~ '^[0-9a-f-]{36}\.(pdf|jpg|png)$' and d.id::text = split_part(p_nome, '.', 1)
      and (marketplace.app_sic_scrive(d.org) or (not p_scrivi and marketplace.app_sic_legge(d.org))
           or (d.soggetto is not null and marketplace.app_sic_sono_sub(d.soggetto) and (not p_scrivi or d.verifica <> 'valido')))
  );
$$;
grant execute on function marketplace.app_file_fascicolo(text, boolean) to authenticated;
drop policy if exists app_fascicolo_file_leggi on storage.objects;
create policy app_fascicolo_file_leggi on storage.objects for select to authenticated using (bucket_id = 'fascicolo' and marketplace.app_file_fascicolo(name, false));
drop policy if exists app_fascicolo_file_carica on storage.objects;
create policy app_fascicolo_file_carica on storage.objects for insert to authenticated with check (bucket_id = 'fascicolo' and marketplace.app_file_fascicolo(name, true));
drop policy if exists app_fascicolo_file_cambia on storage.objects;
create policy app_fascicolo_file_cambia on storage.objects for update to authenticated using (bucket_id = 'fascicolo' and marketplace.app_file_fascicolo(name, true));

revoke all on function marketplace.app_semaforo_soggetto(uuid) from public, anon;
revoke all on function marketplace.app_fascicolo_cantiere(uuid) from public, anon;
revoke all on function marketplace.app_sicurezza_cantieri(uuid) from public, anon;
revoke all on function marketplace.app_scadenze_avvisa() from public, anon, authenticated;
grant execute on function marketplace.app_sic_legge(uuid), marketplace.app_sic_scrive(uuid), marketplace.app_sic_sono_sub(uuid) to authenticated;
grant execute on function marketplace.app_semaforo_soggetto(uuid) to authenticated;
grant execute on function marketplace.app_fascicolo_cantiere(uuid) to authenticated;
grant execute on function marketplace.app_sicurezza_cantieri(uuid) to authenticated;
grant execute on function marketplace.app_scadenze_avvisa() to service_role;
