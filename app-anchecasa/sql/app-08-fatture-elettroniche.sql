-- =============================================================================
-- AncheCasa app · parte 8: FATTURE ELETTRONICHE E PREVENTIVI (SdI) (11.10.2026)
-- Da eseguire DOPO app-07. Si può rieseguire senza danni.
-- Aggiunge solo tabelle app_fe_… e app_api_usage_logs: le tabelle esistenti non vengono toccate.
--
-- Decisioni (Nando, 11.10.2026):
--  1. Un modulo centrale per tutte le aziende del network (tenant = marketplace.app_org), comprese le società
--     del gruppo (Palumbo Investment S.r.l.). Clienti e cantieri NON si duplicano: il documento punta ai record
--     che esistono già in marketplace.app_record (tipo 'cliente' e 'cantiere') e salva una fotografia dei dati
--     fiscali del cliente al momento dell'emissione.
--  2. Preventivo → fattura con un tocco. Il preventivo resta, la fattura ricorda da dove viene.
--  3. L'invio allo SdI passa da un gateway esterno (oggi «simulato»). La chiave del gateway NON sta nelle
--     tabelle: sta nei Secrets della funzione sdi-gateway. Nel profilo si scrive solo il NOME del secret.
--  4. Rivendita: AncheCasa vende pacchetti di invii o abbonamenti. Prima di ogni invio si controlla il credito.
--     Ogni chiamata al gateway registra costo vivo e ricavo: il margine per azienda è sempre aggiornato.
--     Costi e margini li vede solo l'admin.
--  5. I campi «di sistema» (numero, stato SdI, XML, id SdI, totali) li cambia solo il sistema
--     (le funzioni qui sotto o la funzione sdi-gateway con la chiave di servizio).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Interruttore «lo sta facendo il sistema»
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_fe_sistema()
returns boolean language sql stable as $$
  select coalesce(current_setting('app.fe_sistema', true), '') = '1'
      or coalesce(auth.role(), '') = 'service_role';
$$;

-- ---------------------------------------------------------------------------
-- 1. Dati fiscali dell'azienda che emette (cedente/prestatore)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_fe_profili (
  org uuid primary key references marketplace.app_org(id) on delete cascade,
  denominazione text not null default '' check (length(denominazione) <= 80),
  piva text not null default '' check (piva ~ '^([0-9]{11})?$'),
  cf text not null default '' check (cf ~ '^([A-Z0-9]{11}|[A-Z0-9]{16})?$'),
  regime text not null default 'RF01' check (regime ~ '^RF(0[1-9]|1[0-9])$'),
  indirizzo text not null default '' check (length(indirizzo) <= 60),
  civico text not null default '' check (length(civico) <= 8),
  cap text not null default '' check (cap ~ '^([0-9]{5})?$'),
  comune text not null default '' check (length(comune) <= 60),
  provincia text not null default '' check (provincia ~ '^([A-Z]{2})?$'),
  nazione text not null default 'IT' check (nazione ~ '^[A-Z]{2}$'),
  rea_ufficio text not null default '' check (rea_ufficio ~ '^([A-Z]{2})?$'),
  rea_numero text not null default '' check (length(rea_numero) <= 20),
  iban text not null default '' check (iban ~ '^([A-Z]{2}[0-9]{2}[A-Z0-9]{11,30})?$'),
  pec text not null default '' check (length(pec) <= 120),
  telefono text not null default '' check (length(telefono) <= 30),
  email text not null default '' check (length(email) <= 120),
  logo text not null default '' check (length(logo) <= 300),              -- percorso nel bucket «documenti»
  condizioni text not null default '' check (length(condizioni) <= 1500), -- condizioni standard dei preventivi
  -- Gateway: lo imposta solo l'admin
  gateway text not null default 'simulato' check (gateway in ('simulato', 'aruba', 'openapi', 'acube', 'altro')),
  gateway_rif text not null default '' check (length(gateway_rif) <= 120),           -- id del conto presso il gateway
  gateway_segreto text not null default '' check (gateway_segreto ~ '^[A-Za-z0-9_-]{0,60}$'), -- NOME del secret, mai il valore
  aggiornato timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Numerazione (per azienda, anno, sezionale e tipo)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_fe_numeri (
  org uuid not null references marketplace.app_org(id) on delete cascade,
  anno int not null check (anno between 2000 and 2100),
  sezionale text not null default '' check (sezionale ~ '^[A-Z0-9]{0,6}$'),
  tipo text not null check (tipo in ('preventivo', 'fattura')),
  ultimo int not null default 0 check (ultimo >= 0),
  primary key (org, anno, sezionale, tipo)
);

-- ---------------------------------------------------------------------------
-- 3. Documenti: preventivi, fatture, acconti, note di credito
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_fe_documenti (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  tipo text not null check (tipo in ('preventivo', 'fattura', 'acconto', 'nota_credito')),
  tipo_sdi text check (tipo_sdi in ('TD01', 'TD02', 'TD04')),          -- null per i preventivi
  sezionale text not null default '' check (sezionale ~ '^[A-Z0-9]{0,6}$'),
  anno int,
  numero text check (numero is null or length(numero) between 1 and 20),
  data date not null default current_date,
  scadenza_pagamento date,
  validita_giorni int check (validita_giorni is null or validita_giorni between 1 and 365),   -- solo preventivi
  cliente uuid references marketplace.app_record(id) on delete set null,
  cantiere uuid references marketplace.app_record(id) on delete set null,
  cliente_dati jsonb not null default '{}'::jsonb check (pg_column_size(cliente_dati) < 8000),
  oggetto text not null default '' check (length(oggetto) <= 200),
  note text not null default '' check (length(note) <= 2000),
  condizioni text not null default '' check (length(condizioni) <= 1500),
  pagamento text not null default 'MP05' check (pagamento ~ '^MP(0[1-9]|1[0-9]|2[0-3])$'),   -- MP05 = bonifico
  sconto numeric(5,2) not null default 0 check (sconto between 0 and 100),
  bollo boolean not null default false,
  imponibile numeric(14,2) not null default 0,
  iva numeric(14,2) not null default 0,
  totale numeric(14,2) not null default 0,
  stato_preventivo text check (stato_preventivo in ('bozza', 'inviato', 'accettato', 'rifiutato')),
  stato_sdi text not null default 'non_inviato' check (stato_sdi in ('non_inviato', 'in_invio', 'inviato', 'consegnato', 'mancata_consegna', 'scartato', 'accettato', 'rifiutato')),
  incassato boolean not null default false,
  bloccato boolean not null default false,       -- dopo l'invio non si modifica più (si fa una nota di credito)
  origine uuid references marketplace.app_fe_documenti(id) on delete set null,   -- preventivo da cui nasce
  sdi_id text check (sdi_id is null or length(sdi_id) <= 80),
  sdi_file text check (sdi_file is null or length(sdi_file) <= 60),
  xml text check (xml is null or length(xml) <= 2000000),
  xml_sha256 text check (xml_sha256 is null or xml_sha256 ~ '^[a-f0-9]{64}$'),
  esito jsonb not null default '{}'::jsonb check (pg_column_size(esito) < 20000),
  inviato timestamptz,
  consegnato timestamptz,
  creato_da uuid default auth.uid() references auth.users(id) on delete set null,
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now(),
  check ((tipo = 'preventivo') = (tipo_sdi is null)),
  check ((tipo = 'preventivo') = (stato_preventivo is not null))
);
create unique index if not exists app_fe_documenti_numero_unico
  on marketplace.app_fe_documenti (org, (case when tipo = 'preventivo' then 'P' else 'F' end), anno, sezionale, numero)
  where numero is not null;
create index if not exists app_fe_documenti_org_data on marketplace.app_fe_documenti (org, data desc);
create index if not exists app_fe_documenti_sdi on marketplace.app_fe_documenti (sdi_id) where sdi_id is not null;
create index if not exists app_fe_documenti_cantiere on marketplace.app_fe_documenti (cantiere) where cantiere is not null;

create table if not exists marketplace.app_fe_righe (
  id uuid primary key default gen_random_uuid(),
  documento uuid not null references marketplace.app_fe_documenti(id) on delete cascade,
  n int not null check (n between 1 and 9999),
  descrizione text not null check (length(btrim(descrizione)) between 1 and 1000),
  quantita numeric(14,3) not null default 1 check (quantita > 0),
  um text not null default '' check (length(um) <= 10),
  prezzo numeric(16,4) not null default 0,
  sconto numeric(5,2) not null default 0 check (sconto between 0 and 100),
  aliquota numeric(5,2) not null default 22 check (aliquota in (0, 4, 5, 10, 22)),
  natura text check (natura is null or natura in ('N1', 'N2.1', 'N2.2', 'N3.1', 'N3.2', 'N3.3', 'N3.4', 'N3.5', 'N3.6', 'N4', 'N5', 'N6.1', 'N6.2', 'N6.3', 'N6.4', 'N6.5', 'N6.6', 'N6.7', 'N6.8', 'N6.9', 'N7')),
  totale numeric(16,2) generated always as (round(quantita * prezzo * (1 - sconto / 100), 2)) stored,
  unique (documento, n),
  check ((aliquota = 0) = (natura is not null))      -- IVA 0 vuole sempre la Natura (es. N6.3 reverse charge edilizia)
);

create table if not exists marketplace.app_fe_eventi (
  id bigint generated always as identity primary key,
  documento uuid not null references marketplace.app_fe_documenti(id) on delete cascade,
  tipo text not null check (tipo in ('creato', 'numerato', 'convertito', 'xml', 'inviato', 'notifica', 'errore', 'stato')),
  stato_sdi text,
  testo text not null default '' check (length(testo) <= 500),
  dati jsonb not null default '{}'::jsonb check (pg_column_size(dati) < 20000),
  creato timestamptz not null default now()
);
create index if not exists app_fe_eventi_doc on marketplace.app_fe_eventi (documento, creato desc);

-- ---------------------------------------------------------------------------
-- 4. Rivendita: piani, crediti, costi del gateway, registro dei consumi
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_fe_piani (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  nome text not null check (length(btrim(nome)) between 2 and 80),
  tipo text not null check (tipo in ('pacchetto', 'abbonamento', 'consumo')),
  invii int check (invii is null or invii > 0),                 -- null solo per «consumo»
  durata_giorni int check (durata_giorni is null or durata_giorni between 1 and 1100),
  prezzo numeric(10,2) check (prezzo is null or prezzo >= 0),   -- null = lo decide Nando da Admin
  prezzo_invio numeric(10,4) check (prezzo_invio is null or prezzo_invio >= 0),   -- per «consumo»
  attivo boolean not null default true,
  check ((tipo = 'consumo') = (invii is null))
);
insert into marketplace.app_fe_piani (id, nome, tipo, invii, durata_giorni, prezzo, prezzo_invio) values
  ('pacchetto-50', 'Pacchetto 50 invii', 'pacchetto', 50, 365, null, null),
  ('pacchetto-200', 'Pacchetto 200 invii', 'pacchetto', 200, 365, null, null),
  ('abbonamento-anno', 'Abbonamento annuale (600 invii)', 'abbonamento', 600, 365, null, null),
  ('consumo', 'A consumo', 'consumo', null, null, null, null),
  ('interno', 'Società del gruppo (uso interno)', 'abbonamento', 100000, 1100, 0, null)
on conflict (id) do nothing;

create table if not exists marketplace.app_fe_crediti (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  piano text not null references marketplace.app_fe_piani(id),
  invii_totali int,                                  -- null = a consumo
  invii_usati int not null default 0 check (invii_usati >= 0),
  prezzo_pagato numeric(10,2) not null default 0 check (prezzo_pagato >= 0),
  prezzo_invio numeric(10,4),                        -- a consumo: quanto si addebita per invio
  valido_dal date not null default current_date,
  valido_al date,
  stato text not null default 'attivo' check (stato in ('attivo', 'sospeso', 'chiuso')),
  note text not null default '' check (length(note) <= 300),
  creato_da uuid default auth.uid() references auth.users(id) on delete set null,
  creato timestamptz not null default now(),
  check (invii_totali is null or invii_usati <= invii_totali)
);
create index if not exists app_fe_crediti_org on marketplace.app_fe_crediti (org, stato, valido_al);

create table if not exists marketplace.app_fe_costi (
  operazione text primary key check (operazione in ('invio_fe', 'ricezione', 'verifica_piva', 'stato', 'genera_xml')),
  costo numeric(10,4) not null default 0 check (costo >= 0),     -- costo vivo verso il gateway, per operazione
  aggiornato timestamptz not null default now()
);
insert into marketplace.app_fe_costi (operazione, costo) values
  ('invio_fe', 0), ('ricezione', 0), ('verifica_piva', 0), ('stato', 0), ('genera_xml', 0)
on conflict (operazione) do nothing;

create table if not exists marketplace.app_api_usage_logs (
  id bigint generated always as identity primary key,
  org uuid not null references marketplace.app_org(id) on delete cascade,
  utente uuid references auth.users(id) on delete set null,
  operazione text not null check (operazione in ('invio_fe', 'ricezione', 'verifica_piva', 'stato', 'genera_xml')),
  documento uuid references marketplace.app_fe_documenti(id) on delete set null,
  credito uuid references marketplace.app_fe_crediti(id) on delete set null,
  gateway text not null default '' check (length(gateway) <= 20),
  costo_api numeric(10,4) not null default 0,
  ricavo numeric(10,4) not null default 0,
  esito text not null default 'ok' check (esito in ('ok', 'errore', 'rimborsato')),
  dettaglio text not null default '' check (length(dettaglio) <= 300),
  creato timestamptz not null default now()
);
create index if not exists app_api_usage_logs_org on marketplace.app_api_usage_logs (org, creato desc);

-- ---------------------------------------------------------------------------
-- 5. Controlli automatici
-- ---------------------------------------------------------------------------
-- Cliente e cantiere: record della stessa azienda e del tipo giusto.
-- Campi di sistema: solo il sistema. Documento inviato: si può solo segnare «incassato».
create or replace function marketplace.app_fe_documenti_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if new.cliente is not null and not exists (select 1 from marketplace.app_record where id = new.cliente and org = new.org and tipo = 'cliente') then
    raise exception 'cliente_non_valido';
  end if;
  if new.cantiere is not null and not exists (select 1 from marketplace.app_record where id = new.cantiere and org = new.org and tipo = 'cantiere') then
    raise exception 'cantiere_non_valido';
  end if;
  if tg_op = 'INSERT' then
    if not marketplace.app_fe_sistema() then
      new.numero := null; new.anno := null; new.stato_sdi := 'non_inviato'; new.bloccato := false; new.origine := null;
      new.sdi_id := null; new.sdi_file := null; new.xml := null; new.xml_sha256 := null; new.esito := '{}'::jsonb;
      new.inviato := null; new.consegnato := null; new.imponibile := 0; new.iva := 0; new.totale := 0;
      new.creato_da := auth.uid();
    end if;
    return new;
  end if;
  if new.org <> old.org or new.tipo <> old.tipo then raise exception 'non_modificabile'; end if;
  if not marketplace.app_fe_sistema() then
    if old.bloccato and row(new.oggetto, new.note, new.data, new.cliente, new.cantiere, new.cliente_dati, new.sconto, new.bollo, new.pagamento, new.scadenza_pagamento)
       is distinct from row(old.oggetto, old.note, old.data, old.cliente, old.cantiere, old.cliente_dati, old.sconto, old.bollo, old.pagamento, old.scadenza_pagamento) then
      raise exception 'documento_bloccato';
    end if;
    new.numero := old.numero; new.anno := old.anno; new.stato_sdi := old.stato_sdi; new.bloccato := old.bloccato;
    new.sdi_id := old.sdi_id; new.sdi_file := old.sdi_file; new.xml := old.xml; new.xml_sha256 := old.xml_sha256; new.esito := old.esito;
    new.inviato := old.inviato; new.consegnato := old.consegnato; new.origine := old.origine;
    new.imponibile := old.imponibile; new.iva := old.iva; new.totale := old.totale; new.creato_da := old.creato_da;
  end if;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_fe_documenti_controlli on marketplace.app_fe_documenti;
create trigger app_fe_documenti_controlli before insert or update on marketplace.app_fe_documenti
  for each row execute function marketplace.app_fe_documenti_controlli();

-- Ricalcolo dei totali: imposta arrotondata per aliquota, come vuole il riepilogo dell'XML.
create or replace function marketplace.app_fe_ricalcola(p_documento uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_doc marketplace.app_fe_documenti;
  v_imp numeric(14,2) := 0;
  v_iva numeric(14,2) := 0;
  v_forf boolean;
begin
  select * into v_doc from marketplace.app_fe_documenti where id = p_documento;
  if not found then return; end if;
  select coalesce(sum(imp), 0), coalesce(sum(round(imp * aliquota / 100, 2)), 0) into v_imp, v_iva
  from (
    select r.aliquota, r.natura, round(sum(r.totale) * (1 - v_doc.sconto / 100), 2) as imp
    from marketplace.app_fe_righe r where r.documento = p_documento
    group by r.aliquota, r.natura
  ) g;
  select regime = 'RF19' into v_forf from marketplace.app_fe_profili where org = v_doc.org;
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_fe_documenti
     set imponibile = v_imp, iva = v_iva,
         bollo = case when coalesce(v_forf, false) and v_imp > 77.47 then true else bollo end,
         totale = v_imp + v_iva
   where id = p_documento;
  perform set_config('app.fe_sistema', '', true);
end;
$$;

create or replace function marketplace.app_fe_righe_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_doc uuid := coalesce(new.documento, old.documento);
begin
  if not marketplace.app_fe_sistema() and exists (select 1 from marketplace.app_fe_documenti where id = v_doc and bloccato) then
    raise exception 'documento_bloccato';
  end if;
  if tg_op = 'UPDATE' and new.documento <> old.documento then raise exception 'non_modificabile'; end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists app_fe_righe_controlli on marketplace.app_fe_righe;
create trigger app_fe_righe_controlli before insert or update or delete on marketplace.app_fe_righe
  for each row execute function marketplace.app_fe_righe_controlli();

create or replace function marketplace.app_fe_righe_dopo()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  perform marketplace.app_fe_ricalcola(coalesce(new.documento, old.documento));
  return null;
end;
$$;
drop trigger if exists app_fe_righe_dopo on marketplace.app_fe_righe;
create trigger app_fe_righe_dopo after insert or update or delete on marketplace.app_fe_righe
  for each row execute function marketplace.app_fe_righe_dopo();

-- Lo sconto sul documento cambia i totali.
create or replace function marketplace.app_fe_documenti_dopo()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if new.sconto is distinct from old.sconto then perform marketplace.app_fe_ricalcola(new.id); end if;
  return null;
end;
$$;
drop trigger if exists app_fe_documenti_dopo on marketplace.app_fe_documenti;
create trigger app_fe_documenti_dopo after update of sconto on marketplace.app_fe_documenti
  for each row execute function marketplace.app_fe_documenti_dopo();

-- I campi del gateway nel profilo li cambia solo l'admin.
create or replace function marketplace.app_fe_profili_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not (marketplace.is_admin() or marketplace.app_fe_sistema()) then
    if tg_op = 'INSERT' then
      new.gateway := 'simulato'; new.gateway_rif := ''; new.gateway_segreto := '';
    else
      new.gateway := old.gateway; new.gateway_rif := old.gateway_rif; new.gateway_segreto := old.gateway_segreto;
    end if;
  end if;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_fe_profili_controlli on marketplace.app_fe_profili;
create trigger app_fe_profili_controlli before insert or update on marketplace.app_fe_profili
  for each row execute function marketplace.app_fe_profili_controlli();

-- ---------------------------------------------------------------------------
-- 6. Permessi (RLS)
-- ---------------------------------------------------------------------------
-- Legge: titolare e responsabile dell'azienda, l'admin. Scrive: chi gestisce l'azienda con l'Ufficio attivo.
create or replace function marketplace.app_fe_legge(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or coalesce(marketplace.app_mio_ruolo(p_org) in ('titolare', 'responsabile'), false);
$$;
create or replace function marketplace.app_fe_scrive(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or (marketplace.app_gestisce(p_org) and marketplace.app_modulo_attivo(p_org, 'ufficio'));
$$;

alter table marketplace.app_fe_profili enable row level security;
drop policy if exists app_fe_profili_leggi on marketplace.app_fe_profili;
create policy app_fe_profili_leggi on marketplace.app_fe_profili for select using (marketplace.app_fe_legge(org));
drop policy if exists app_fe_profili_scrivi on marketplace.app_fe_profili;
create policy app_fe_profili_scrivi on marketplace.app_fe_profili for insert with check (marketplace.app_fe_scrive(org));
drop policy if exists app_fe_profili_cambia on marketplace.app_fe_profili;
create policy app_fe_profili_cambia on marketplace.app_fe_profili for update using (marketplace.app_fe_scrive(org)) with check (marketplace.app_fe_scrive(org));
grant select, insert, update on marketplace.app_fe_profili to authenticated;

alter table marketplace.app_fe_numeri enable row level security;
drop policy if exists app_fe_numeri_leggi on marketplace.app_fe_numeri;
create policy app_fe_numeri_leggi on marketplace.app_fe_numeri for select using (marketplace.app_fe_legge(org));
grant select on marketplace.app_fe_numeri to authenticated;

alter table marketplace.app_fe_documenti enable row level security;
drop policy if exists app_fe_documenti_leggi on marketplace.app_fe_documenti;
create policy app_fe_documenti_leggi on marketplace.app_fe_documenti for select using (marketplace.app_fe_legge(org));
drop policy if exists app_fe_documenti_crea on marketplace.app_fe_documenti;
create policy app_fe_documenti_crea on marketplace.app_fe_documenti for insert with check (marketplace.app_fe_scrive(org));
drop policy if exists app_fe_documenti_cambia on marketplace.app_fe_documenti;
create policy app_fe_documenti_cambia on marketplace.app_fe_documenti for update using (marketplace.app_fe_scrive(org)) with check (marketplace.app_fe_scrive(org));
drop policy if exists app_fe_documenti_cancella on marketplace.app_fe_documenti;
create policy app_fe_documenti_cancella on marketplace.app_fe_documenti for delete using (marketplace.app_fe_scrive(org) and not bloccato and (tipo = 'preventivo' or numero is null));
grant select, insert, update, delete on marketplace.app_fe_documenti to authenticated;

alter table marketplace.app_fe_righe enable row level security;
drop policy if exists app_fe_righe_leggi on marketplace.app_fe_righe;
create policy app_fe_righe_leggi on marketplace.app_fe_righe for select using (exists (select 1 from marketplace.app_fe_documenti d where d.id = documento));
drop policy if exists app_fe_righe_scrivi on marketplace.app_fe_righe;
create policy app_fe_righe_scrivi on marketplace.app_fe_righe for all
  using (exists (select 1 from marketplace.app_fe_documenti d where d.id = documento and marketplace.app_fe_scrive(d.org)))
  with check (exists (select 1 from marketplace.app_fe_documenti d where d.id = documento and marketplace.app_fe_scrive(d.org)));
grant select, insert, update, delete on marketplace.app_fe_righe to authenticated;

alter table marketplace.app_fe_eventi enable row level security;
drop policy if exists app_fe_eventi_leggi on marketplace.app_fe_eventi;
create policy app_fe_eventi_leggi on marketplace.app_fe_eventi for select using (exists (select 1 from marketplace.app_fe_documenti d where d.id = documento));
grant select on marketplace.app_fe_eventi to authenticated;

alter table marketplace.app_fe_piani enable row level security;
drop policy if exists app_fe_piani_leggi on marketplace.app_fe_piani;
create policy app_fe_piani_leggi on marketplace.app_fe_piani for select using (auth.uid() is not null);
drop policy if exists app_fe_piani_admin on marketplace.app_fe_piani;
create policy app_fe_piani_admin on marketplace.app_fe_piani for all using (marketplace.is_admin()) with check (marketplace.is_admin());
grant select, insert, update on marketplace.app_fe_piani to authenticated;

alter table marketplace.app_fe_crediti enable row level security;
drop policy if exists app_fe_crediti_leggi on marketplace.app_fe_crediti;
create policy app_fe_crediti_leggi on marketplace.app_fe_crediti for select using (marketplace.app_fe_legge(org));
drop policy if exists app_fe_crediti_admin on marketplace.app_fe_crediti;
create policy app_fe_crediti_admin on marketplace.app_fe_crediti for all using (marketplace.is_admin()) with check (marketplace.is_admin());
grant select, insert, update on marketplace.app_fe_crediti to authenticated;

alter table marketplace.app_fe_costi enable row level security;
drop policy if exists app_fe_costi_admin on marketplace.app_fe_costi;
create policy app_fe_costi_admin on marketplace.app_fe_costi for all using (marketplace.is_admin()) with check (marketplace.is_admin());
grant select, update on marketplace.app_fe_costi to authenticated;

alter table marketplace.app_api_usage_logs enable row level security;
drop policy if exists app_api_usage_logs_admin on marketplace.app_api_usage_logs;
create policy app_api_usage_logs_admin on marketplace.app_api_usage_logs for select using (marketplace.is_admin());
grant select on marketplace.app_api_usage_logs to authenticated;   -- scrive solo la funzione sdi-gateway

-- ---------------------------------------------------------------------------
-- 7. Funzioni
-- ---------------------------------------------------------------------------
-- 7.1 Numero del documento (preventivo: al salvataggio; fattura: all'invio allo SdI)
create or replace function marketplace.app_fe_numera(p_documento uuid)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_doc marketplace.app_fe_documenti;
  v_tipo text;
  v_anno int;
  v_n int;
  v_num text;
begin
  select * into v_doc from marketplace.app_fe_documenti where id = p_documento for update;
  if not found then raise exception 'documento_non_trovato'; end if;
  if not (marketplace.app_fe_sistema() or marketplace.app_fe_scrive(v_doc.org)) then raise exception 'non_autorizzato'; end if;
  if v_doc.numero is not null then return v_doc.numero; end if;
  v_tipo := case when v_doc.tipo = 'preventivo' then 'preventivo' else 'fattura' end;
  v_anno := extract(year from v_doc.data)::int;
  insert into marketplace.app_fe_numeri (org, anno, sezionale, tipo, ultimo) values (v_doc.org, v_anno, v_doc.sezionale, v_tipo, 1)
  on conflict (org, anno, sezionale, tipo) do update set ultimo = marketplace.app_fe_numeri.ultimo + 1
  returning ultimo into v_n;
  v_num := v_n::text || case when v_doc.sezionale <> '' then '/' || v_doc.sezionale else '' end;
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_fe_documenti set numero = v_num, anno = v_anno where id = p_documento;
  insert into marketplace.app_fe_eventi (documento, tipo, testo) values (p_documento, 'numerato', 'Numero ' || v_num || '/' || v_anno);
  perform set_config('app.fe_sistema', '', true);
  return v_num;
end;
$$;

-- 7.2 Dal preventivo accettato nasce la fattura (stesse righe, stesso cliente e cantiere)
create or replace function marketplace.app_fe_da_preventivo(p_preventivo uuid, p_tipo_sdi text default 'TD01')
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_p marketplace.app_fe_documenti;
  v_id uuid;
begin
  select * into v_p from marketplace.app_fe_documenti where id = p_preventivo;
  if not found or v_p.tipo <> 'preventivo' then raise exception 'preventivo_non_trovato'; end if;
  if not marketplace.app_fe_scrive(v_p.org) then raise exception 'non_autorizzato'; end if;
  if p_tipo_sdi not in ('TD01', 'TD02') then raise exception 'tipo_non_valido'; end if;
  perform set_config('app.fe_sistema', '1', true);
  insert into marketplace.app_fe_documenti (org, tipo, tipo_sdi, sezionale, data, cliente, cantiere, cliente_dati, oggetto, note, pagamento, sconto, origine, creato_da)
  values (v_p.org, case when p_tipo_sdi = 'TD02' then 'acconto' else 'fattura' end, p_tipo_sdi, v_p.sezionale, current_date, v_p.cliente, v_p.cantiere,
          v_p.cliente_dati, v_p.oggetto, v_p.note, v_p.pagamento, v_p.sconto, v_p.id, auth.uid())
  returning id into v_id;
  insert into marketplace.app_fe_righe (documento, n, descrizione, quantita, um, prezzo, sconto, aliquota, natura)
  select v_id, n, descrizione, quantita, um, prezzo, sconto, aliquota, natura from marketplace.app_fe_righe where documento = p_preventivo;
  update marketplace.app_fe_documenti set stato_preventivo = 'accettato' where id = p_preventivo;
  insert into marketplace.app_fe_eventi (documento, tipo, testo) values (v_id, 'convertito', 'Dal preventivo ' || coalesce(v_p.numero, '') || '/' || coalesce(v_p.anno::text, ''));
  perform set_config('app.fe_sistema', '', true);
  perform marketplace.app_fe_ricalcola(v_id);
  return v_id;
end;
$$;

-- 7.3 Stato del preventivo (bozza → inviato → accettato o rifiutato)
create or replace function marketplace.app_fe_stato_preventivo(p_preventivo uuid, p_stato text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare v_p marketplace.app_fe_documenti;
begin
  select * into v_p from marketplace.app_fe_documenti where id = p_preventivo;
  if not found or v_p.tipo <> 'preventivo' then raise exception 'preventivo_non_trovato'; end if;
  if not marketplace.app_fe_scrive(v_p.org) then raise exception 'non_autorizzato'; end if;
  if p_stato not in ('bozza', 'inviato', 'accettato', 'rifiutato') then raise exception 'stato_non_valido'; end if;
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_fe_documenti set stato_preventivo = p_stato where id = p_preventivo;
  insert into marketplace.app_fe_eventi (documento, tipo, testo) values (p_preventivo, 'stato', 'Preventivo: ' || p_stato);
  perform set_config('app.fe_sistema', '', true);
end;
$$;

-- 7.4 Credito prima dell'invio: lo chiama SOLO la funzione sdi-gateway (chiave di servizio).
--     Prende il credito attivo che scade prima, scala un invio e dice quanto rende quell'invio.
create or replace function marketplace.app_fe_prenota_invio(p_org uuid)
returns table (credito uuid, ricavo numeric) language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_c marketplace.app_fe_crediti;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'non_autorizzato'; end if;
  if not marketplace.app_modulo_attivo(p_org, 'ufficio') then raise exception 'modulo_non_attivo'; end if;
  select * into v_c from marketplace.app_fe_crediti c
   where c.org = p_org and c.stato = 'attivo' and c.valido_dal <= current_date
     and (c.valido_al is null or c.valido_al >= current_date)
     and (c.invii_totali is null or c.invii_usati < c.invii_totali)
   order by (c.invii_totali is null), c.valido_al nulls last, c.creato
   limit 1 for update skip locked;
  if not found then
    if exists (select 1 from marketplace.app_fe_crediti c where c.org = p_org and c.stato = 'attivo') then raise exception 'crediti_esauriti'; end if;
    raise exception 'nessun_piano_attivo';
  end if;
  update marketplace.app_fe_crediti set invii_usati = invii_usati + 1 where id = v_c.id;
  credito := v_c.id;
  ricavo := case when v_c.invii_totali is null then coalesce(v_c.prezzo_invio, 0)
                 else round(v_c.prezzo_pagato / greatest(v_c.invii_totali, 1), 4) end;
  return next;
end;
$$;
create or replace function marketplace.app_fe_rimborsa_invio(p_credito uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'non_autorizzato'; end if;
  update marketplace.app_fe_crediti set invii_usati = greatest(invii_usati - 1, 0) where id = p_credito;
end;
$$;

-- 7.5 Quello che l'azienda vede dei suoi consumi (mai i costi di AncheCasa)
create or replace function marketplace.app_fe_miei_consumi(p_org uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare v jsonb;
begin
  if not marketplace.app_fe_legge(p_org) then raise exception 'non_autorizzato'; end if;
  select jsonb_build_object(
    'crediti', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'piano', p.nome, 'tipo', p.tipo, 'totali', c.invii_totali, 'usati', c.invii_usati,
                          'valido_al', c.valido_al, 'stato', c.stato) order by c.valido_al nulls last)
                        from marketplace.app_fe_crediti c join marketplace.app_fe_piani p on p.id = c.piano where c.org = p_org and c.stato <> 'chiuso'), '[]'::jsonb),
    'residui', (select case when bool_or(c.invii_totali is null) then null else coalesce(sum(c.invii_totali - c.invii_usati), 0) end
                from marketplace.app_fe_crediti c where c.org = p_org and c.stato = 'attivo' and (c.valido_al is null or c.valido_al >= current_date)),
    'mesi', coalesce((select jsonb_agg(jsonb_build_object('mese', m, 'invii', n) order by m desc) from (
               select to_char(date_trunc('month', creato), 'YYYY-MM') m, count(*) n from marketplace.app_api_usage_logs
               where org = p_org and operazione = 'invio_fe' and esito = 'ok' and creato > now() - interval '12 months' group by 1) x), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

-- 7.6 Cruscotto del Super Admin: volumi, costi vivi, ricavi e margine per azienda in un mese
create or replace function marketplace.app_fe_riepilogo_admin(p_mese date default date_trunc('month', current_date)::date)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_da timestamptz := date_trunc('month', p_mese);
  v_a timestamptz := date_trunc('month', p_mese) + interval '1 month';
  v jsonb;
begin
  if not marketplace.is_admin() then raise exception 'non_autorizzato'; end if;
  select jsonb_build_object(
    'mese', to_char(v_da, 'YYYY-MM'),
    'totale', (select jsonb_build_object('invii', count(*) filter (where operazione = 'invio_fe' and esito = 'ok'),
                 'costo', coalesce(sum(costo_api) filter (where esito <> 'rimborsato'), 0),
                 'ricavo', coalesce(sum(ricavo) filter (where esito = 'ok'), 0))
               from marketplace.app_api_usage_logs where creato >= v_da and creato < v_a),
    'aziende', coalesce((select jsonb_agg(x order by (x->>'ricavo')::numeric desc) from (
        select jsonb_build_object('org', l.org, 'nome', o.nome,
          'invii', count(*) filter (where l.operazione = 'invio_fe' and l.esito = 'ok'),
          'scartati', (select count(*) from marketplace.app_fe_documenti d where d.org = l.org and d.stato_sdi = 'scartato' and d.inviato >= v_da and d.inviato < v_a),
          'costo', coalesce(sum(l.costo_api) filter (where l.esito <> 'rimborsato'), 0),
          'ricavo', coalesce(sum(l.ricavo) filter (where l.esito = 'ok'), 0)) x
        from marketplace.app_api_usage_logs l join marketplace.app_org o on o.id = l.org
        where l.creato >= v_da and l.creato < v_a group by l.org, o.nome) t), '[]'::jsonb),
    'in_esaurimento', coalesce((select jsonb_agg(jsonb_build_object('org', c.org, 'nome', o.nome, 'residui', c.invii_totali - c.invii_usati, 'valido_al', c.valido_al))
        from marketplace.app_fe_crediti c join marketplace.app_org o on o.id = c.org
        where c.stato = 'attivo' and c.invii_totali is not null and (c.invii_totali - c.invii_usati) <= greatest(5, c.invii_totali / 10)), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

revoke all on function marketplace.app_fe_numera(uuid) from public, anon;
revoke all on function marketplace.app_fe_da_preventivo(uuid, text) from public, anon;
revoke all on function marketplace.app_fe_stato_preventivo(uuid, text) from public, anon;
revoke all on function marketplace.app_fe_prenota_invio(uuid) from public, anon, authenticated;
revoke all on function marketplace.app_fe_rimborsa_invio(uuid) from public, anon, authenticated;
revoke all on function marketplace.app_fe_miei_consumi(uuid) from public, anon;
revoke all on function marketplace.app_fe_riepilogo_admin(date) from public, anon;
revoke all on function marketplace.app_fe_ricalcola(uuid) from public, anon, authenticated;
grant execute on function marketplace.app_fe_legge(uuid) to authenticated;
grant execute on function marketplace.app_fe_scrive(uuid) to authenticated;
grant execute on function marketplace.app_fe_numera(uuid) to authenticated;
grant execute on function marketplace.app_fe_da_preventivo(uuid, text) to authenticated;
grant execute on function marketplace.app_fe_stato_preventivo(uuid, text) to authenticated;
grant execute on function marketplace.app_fe_miei_consumi(uuid) to authenticated;
grant execute on function marketplace.app_fe_riepilogo_admin(date) to authenticated;
grant execute on function marketplace.app_fe_prenota_invio(uuid) to service_role;
grant execute on function marketplace.app_fe_rimborsa_invio(uuid) to service_role;
grant execute on function marketplace.app_fe_numera(uuid) to service_role;
grant execute on function marketplace.app_fe_ricalcola(uuid) to service_role;
grant execute on function marketplace.app_fe_legge(uuid), marketplace.app_fe_scrive(uuid) to service_role;
-- La funzione sdi-gateway lavora con la chiave di servizio
grant all on marketplace.app_fe_profili, marketplace.app_fe_numeri, marketplace.app_fe_documenti, marketplace.app_fe_righe,
  marketplace.app_fe_eventi, marketplace.app_fe_piani, marketplace.app_fe_crediti, marketplace.app_fe_costi,
  marketplace.app_api_usage_logs to service_role;

-- Stato SdI in tempo reale nell'app (se la pubblicazione realtime esiste)
do $$ begin
  begin
    alter publication supabase_realtime add table marketplace.app_fe_documenti;
  exception when duplicate_object then null; when undefined_object then null;
  end;
end $$;
