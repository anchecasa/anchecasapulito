-- ============================================================================
-- APP ANCHECASA · PARTE 2 — tutta l'app: aziende e moduli, cantieri, sicurezza, gare, lotti,
-- fornitori, rete commerciale, rivendita, ordini AncheSicura, recensioni e report, notifiche.
-- Preparato il 09.10.2026. Progetto edsvmnxojsmknjuhobqa, schema "marketplace".
--
--   - Si esegue DOPO app-01-supermastro.sql. Si può rilanciare (idempotente).
--   - Aggiunge solo oggetti NUOVI con prefisso app_ (più una colonna "regione" su app_artigiani).
--     Non tocca tabelle, tipi o funzioni dei siti e dell'area privata.
--   - Supabase → SQL Editor → incolla → Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. IMPOSTAZIONI (prezzi, percentuali): le cambia l'admin dall'app.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_impostazioni (
  chiave text primary key check (chiave ~ '^[a-z_]{2,40}$'),
  valore jsonb not null,
  aggiornato timestamptz not null default now()
);
alter table marketplace.app_impostazioni enable row level security;
drop policy if exists app_impostazioni_leggi on marketplace.app_impostazioni;
create policy app_impostazioni_leggi on marketplace.app_impostazioni for select to authenticated using (true);
drop policy if exists app_impostazioni_admin on marketplace.app_impostazioni;
create policy app_impostazioni_admin on marketplace.app_impostazioni for all using (marketplace.is_admin()) with check (marketplace.is_admin());

insert into marketplace.app_impostazioni (chiave, valore) values
  ('prezzi_moduli', '{"base_impresa":49,"base_fornitore":99,"base_partner":49,"base_artigiano":14.9,"ufficio":0,"sicurezza":9,"sicantiere":19,"cantieri":29,"gare":29,"lotti":9,"centralino":19,"magazzino":9,"pacchetto":69}'),
  ('provvigioni', '{"percentuale_vendita":20,"subagente":70,"agente":30,"capoarea":0,"sviluppo":0,"nota":"Percentuali di esempio: le decide Nando."}'),
  ('rivendita', '{"percentuale":30}'),
  ('segnalazioni', '{"premio":""}'),
  ('passaggio_impresa', '{"interventi":20,"media":4.5}')
on conflict (chiave) do nothing;

-- ---------------------------------------------------------------------------
-- 1. AZIENDE (imprese, fornitori, partner, consulenti, AncheCasa general contractor)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_org (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) between 2 and 120),
  tipo text not null default 'impresa' check (tipo in ('impresa', 'fornitore', 'partner', 'consulente', 'gc')),
  piva text not null default '' check (length(piva) <= 20),
  citta text not null default '' check (length(citta) <= 80),
  regione text not null default '' check (length(regione) <= 40),
  telefono text not null default '' check (length(telefono) <= 30),
  email text not null default '' check (length(email) <= 120),
  descrizione text not null default '' check (length(descrizione) <= 600),
  titolare uuid not null default auth.uid() references auth.users(id) on delete restrict,
  stato text not null default 'attiva' check (stato in ('attiva', 'sospesa')),
  creato timestamptz not null default now()
);

create table if not exists marketplace.app_org_membri (
  org uuid not null references marketplace.app_org(id) on delete cascade,
  utente uuid not null references auth.users(id) on delete cascade,
  ruolo text not null check (ruolo in ('titolare', 'responsabile', 'operatore', 'consulente')),
  nome text not null default '' check (length(nome) <= 80),
  creato timestamptz not null default now(),
  primary key (org, utente)
);
create index if not exists app_org_membri_utente_idx on marketplace.app_org_membri (utente);

-- Ruolo di chi chiama in un'azienda (null se non è dentro).
create or replace function marketplace.app_mio_ruolo(p_org uuid)
returns text language sql stable security definer set search_path = marketplace, public as $$
  select ruolo from marketplace.app_org_membri where org = p_org and utente = auth.uid();
$$;
create or replace function marketplace.app_gestisce(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or (
    coalesce(marketplace.app_mio_ruolo(p_org) in ('titolare', 'responsabile'), false)
    and exists (select 1 from marketplace.app_org where id = p_org and stato = 'attiva')
  );
$$;

alter table marketplace.app_org enable row level security;
alter table marketplace.app_org_membri enable row level security;

-- Le aziende attive (non i consulenti singoli né AncheCasa GC) sono visibili agli utenti entrati:
-- servono per fornitori, lotti, offerte. I dati sono quelli dell'attività, non personali.
drop policy if exists app_org_leggi on marketplace.app_org;
create or replace function marketplace.app_ho_accesso_org(p_org uuid)
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  return exists (select 1 from marketplace.app_accessi a join marketplace.app_record r on r.id = a.record where a.utente = auth.uid() and r.org = p_org);
end;
$$;
create policy app_org_leggi on marketplace.app_org for select to authenticated using (
  marketplace.app_mio_ruolo(id) is not null or marketplace.is_admin()
  or (stato = 'attiva' and tipo in ('impresa', 'fornitore', 'partner'))
  or marketplace.app_ho_accesso_org(id)
);
drop policy if exists app_org_crea on marketplace.app_org;
create policy app_org_crea on marketplace.app_org for insert to authenticated with check (
  titolare = auth.uid() and stato = 'attiva' and (tipo in ('impresa', 'fornitore') or marketplace.is_admin())
);
drop policy if exists app_org_modifica on marketplace.app_org;
create policy app_org_modifica on marketplace.app_org for update using (marketplace.app_gestisce(id)) with check (marketplace.app_gestisce(id));

create or replace function marketplace.app_org_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if tg_op = 'INSERT' then
    insert into marketplace.app_org_membri (org, utente, ruolo) values (new.id, new.titolare, 'titolare') on conflict do nothing;
    return new;
  end if;
  if not marketplace.is_admin() then
    new.tipo := old.tipo; new.stato := old.stato; new.titolare := old.titolare; new.creato := old.creato;
  end if;
  return new;
end;
$$;
drop trigger if exists app_org_ins on marketplace.app_org;
create trigger app_org_ins after insert on marketplace.app_org for each row execute function marketplace.app_org_controlli();
drop trigger if exists app_org_upd on marketplace.app_org;
create trigger app_org_upd before update on marketplace.app_org for each row execute function marketplace.app_org_controlli();

drop policy if exists app_membri_leggi on marketplace.app_org_membri;
create policy app_membri_leggi on marketplace.app_org_membri for select using (
  utente = auth.uid() or marketplace.app_mio_ruolo(org) is not null or marketplace.is_admin()
);
drop policy if exists app_membri_gestisci on marketplace.app_org_membri;
create policy app_membri_gestisci on marketplace.app_org_membri for update using (marketplace.app_gestisce(org) and ruolo <> 'titolare')
  with check (marketplace.app_gestisce(org) and ruolo in ('responsabile', 'operatore', 'consulente'));
drop policy if exists app_membri_togli on marketplace.app_org_membri;
create policy app_membri_togli on marketplace.app_org_membri for delete using (marketplace.app_gestisce(org) and ruolo <> 'titolare');
drop policy if exists app_membri_admin on marketplace.app_org_membri;
create policy app_membri_admin on marketplace.app_org_membri for insert with check (marketplace.is_admin());

-- ---------------------------------------------------------------------------
-- 2. MODULI A PAGAMENTO — l'azienda chiede, l'admin attiva (dopo il pagamento).
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_moduli (
  org uuid not null references marketplace.app_org(id) on delete cascade,
  -- base = abbonamento dell'azienda (Impresa 49 €, Fornitore 99 €): comprende Ufficio e listino.
  -- pacchetto = tutti i moduli in più insieme.
  modulo text not null check (modulo in ('base', 'ufficio', 'sicurezza', 'sicantiere', 'cantieri', 'gare', 'lotti', 'centralino', 'magazzino', 'pacchetto')),
  stato text not null default 'richiesto' check (stato in ('richiesto', 'attivo', 'sospeso')),
  prezzo_mese numeric(8,2),
  richiesto timestamptz not null default now(),
  attivo_dal date,
  attivo_al date,
  note text not null default '' check (length(note) <= 300),
  primary key (org, modulo)
);
alter table marketplace.app_moduli enable row level security;
drop policy if exists app_moduli_leggi on marketplace.app_moduli;
create policy app_moduli_leggi on marketplace.app_moduli for select using (marketplace.app_mio_ruolo(org) is not null or marketplace.is_admin());
drop policy if exists app_moduli_chiedi on marketplace.app_moduli;
create policy app_moduli_chiedi on marketplace.app_moduli for insert with check (
  (marketplace.app_gestisce(org) and stato = 'richiesto') or marketplace.is_admin()
);
drop policy if exists app_moduli_admin on marketplace.app_moduli;
create policy app_moduli_admin on marketplace.app_moduli for update using (marketplace.is_admin()) with check (marketplace.is_admin());

create or replace function marketplace.app_moduli_prezzo()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then
    new.prezzo_mese := (select (valore->>(case when new.modulo = 'base' then 'base_' || (select tipo from marketplace.app_org where id = new.org) else new.modulo end))::numeric
      from marketplace.app_impostazioni where chiave = 'prezzi_moduli');
    new.attivo_dal := null; new.attivo_al := null; new.stato := 'richiesto'; new.richiesto := now();
  end if;
  return new;
end;
$$;
drop trigger if exists app_moduli_prezzo on marketplace.app_moduli;
create trigger app_moduli_prezzo before insert on marketplace.app_moduli for each row execute function marketplace.app_moduli_prezzo();

create or replace function marketplace.app_modulo_attivo(p_org uuid, p_modulo text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_moduli m
    where m.org = p_org and m.stato = 'attivo' and (m.attivo_al is null or m.attivo_al >= current_date)
      and (case when p_modulo in ('ufficio', 'listino', 'base') then m.modulo = 'base'
                else m.modulo = p_modulo or m.modulo = 'pacchetto' end)
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. ACCESSI A UN CANTIERE (proprietario del cantiere = cliente, impresa partner = partner)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_accessi (
  record uuid not null,
  utente uuid not null references auth.users(id) on delete cascade,
  ruolo text not null check (ruolo in ('cliente', 'partner')),
  creato timestamptz not null default now(),
  primary key (record, utente)
);
create index if not exists app_accessi_utente_idx on marketplace.app_accessi (utente);

-- ---------------------------------------------------------------------------
-- 4. SCHEDE DEI MODULI (una tabella per tutto: clienti, preventivi, dipendenti, cantieri, SAL…)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_record (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  modulo text not null,
  tipo text not null check (tipo in (
    'cliente', 'preventivo', 'fattura', 'documento',
    'dipendente', 'attestato', 'visita', 'dpi', 'sopralluogo',
    'verbale', 'checklist', 'ingresso',
    'cantiere', 'giornale', 'presenza', 'sal', 'fase', 'ddt', 'segnalazione_cliente',
    'segnalazione', 'avviso',
    'gara', 'lotto', 'chiamata', 'articolo', 'mezzo', 'manutenzione', 'prodotto'
  )),
  titolo text not null default '' check (length(titolo) <= 160),
  stato text not null default '' check (length(stato) <= 30),
  data date,
  scadenza date,
  importo numeric(12,2),
  rif uuid references marketplace.app_record(id) on delete cascade,
  dati jsonb not null default '{}'::jsonb check (pg_column_size(dati) < 200000),
  pubblico boolean not null default false,
  creato_da uuid default auth.uid() references auth.users(id) on delete set null,
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
create index if not exists app_record_org_idx on marketplace.app_record (org, tipo, creato desc);
create index if not exists app_record_rif_idx on marketplace.app_record (rif);
create index if not exists app_record_pubblico_idx on marketplace.app_record (tipo) where pubblico;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'app_accessi_record_fk') then
    alter table marketplace.app_accessi add constraint app_accessi_record_fk foreign key (record) references marketplace.app_record(id) on delete cascade;
  end if;
end $$;

-- Il modulo di ogni tipo di scheda (deciso qui, non dal telefono).
create or replace function marketplace.app_modulo_di(p_tipo text)
returns text language sql immutable as $$
  select case
    when p_tipo in ('cliente', 'preventivo', 'fattura', 'documento') then 'ufficio'
    when p_tipo in ('dipendente', 'attestato', 'visita', 'dpi', 'sopralluogo', 'segnalazione', 'avviso') then 'sicurezza'
    when p_tipo in ('verbale', 'checklist', 'ingresso') then 'sicantiere'
    when p_tipo in ('cantiere', 'giornale', 'presenza', 'sal', 'fase', 'ddt', 'segnalazione_cliente') then 'cantieri'
    when p_tipo = 'gara' then 'gare'
    when p_tipo = 'lotto' then 'lotti'
    when p_tipo = 'chiamata' then 'centralino'
    when p_tipo in ('articolo', 'mezzo', 'manutenzione') then 'magazzino'
    when p_tipo = 'prodotto' then 'listino'
  end;
$$;

-- Accesso di chi chiama a un cantiere (o alla scheda madre): 'cliente', 'partner' o null.
create or replace function marketplace.app_accesso(p_id uuid, p_rif uuid)
returns text language sql stable security definer set search_path = marketplace, public as $$
  select ruolo from marketplace.app_accessi
  where utente = auth.uid() and record in (p_id, p_rif)
  order by case ruolo when 'partner' then 0 else 1 end
  limit 1;
$$;

-- Il dipendente collegato a chi chiama (per il lavoratore).
create or replace function marketplace.app_mio_dipendente(p_org uuid)
returns uuid language sql stable security definer set search_path = marketplace, public as $$
  select id from marketplace.app_record where org = p_org and tipo = 'dipendente' and dati->>'utente' = auth.uid()::text limit 1;
$$;

create or replace function marketplace.app_puo_leggere(p_org uuid, p_tipo text, p_modulo text, p_id uuid, p_rif uuid, p_dati jsonb, p_pubblico boolean)
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_ruolo text;
  v_acc text;
begin
  if auth.uid() is null then return false; end if;
  if marketplace.is_admin() then return true; end if;
  if p_pubblico and p_tipo in ('lotto', 'prodotto') then return true; end if;
  v_ruolo := marketplace.app_mio_ruolo(p_org);
  if v_ruolo in ('titolare', 'responsabile') then return true; end if;
  if v_ruolo = 'consulente' and p_modulo in ('sicurezza', 'sicantiere') then return true; end if;
  if v_ruolo = 'operatore' then
    if p_tipo in ('cantiere', 'fase', 'giornale', 'avviso', 'segnalazione') then return true; end if;
    if p_tipo in ('dipendente', 'presenza') and p_dati->>'utente' = auth.uid()::text then return true; end if;
    if p_tipo in ('attestato', 'visita', 'dpi') and p_rif is not null and p_rif = marketplace.app_mio_dipendente(p_org) then return true; end if;
  end if;
  v_acc := marketplace.app_accesso(p_id, p_rif);
  if v_acc = 'partner' and p_tipo in ('cantiere', 'fase', 'giornale', 'presenza', 'sal', 'ingresso', 'verbale', 'segnalazione_cliente', 'documento') then return true; end if;
  if v_acc = 'cliente' and p_tipo = 'sal' then
    return exists (select 1 from marketplace.app_record where id = p_id and stato not in ('', 'bozza'));
  end if;
  if v_acc = 'cliente' and (p_tipo in ('cantiere', 'fase', 'giornale', 'segnalazione_cliente')
     or (p_tipo = 'documento' and p_dati->>'condiviso' = 'true')) then return true; end if;
  return false;
end;
$$;

create or replace function marketplace.app_puo_scrivere(p_org uuid, p_tipo text, p_modulo text, p_id uuid, p_rif uuid, p_dati jsonb)
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_ruolo text;
  v_acc text;
begin
  if auth.uid() is null then return false; end if;
  if marketplace.is_admin() then return true; end if;
  if not exists (select 1 from marketplace.app_org where id = p_org and stato = 'attiva') then return false; end if;
  v_ruolo := marketplace.app_mio_ruolo(p_org);
  if v_ruolo in ('titolare', 'responsabile') and marketplace.app_modulo_attivo(p_org, p_modulo) then return true; end if;
  if v_ruolo = 'consulente' and p_modulo in ('sicurezza', 'sicantiere') and marketplace.app_modulo_attivo(p_org, p_modulo) then return true; end if;
  if v_ruolo = 'operatore' then
    if p_tipo = 'segnalazione' then return true; end if;
    if p_tipo = 'presenza' and p_dati->>'utente' = auth.uid()::text then return true; end if;
    if p_tipo = 'dpi' and p_rif is not null and p_rif = marketplace.app_mio_dipendente(p_org) then return true; end if;
  end if;
  v_acc := marketplace.app_accesso(p_id, p_rif);
  if v_acc = 'partner' and p_tipo in ('giornale', 'presenza', 'sal', 'ingresso', 'verbale') then return true; end if;
  if v_acc = 'cliente' and p_tipo = 'segnalazione_cliente' then return true; end if;
  return false;
end;
$$;

alter table marketplace.app_record enable row level security;
drop policy if exists app_record_leggi on marketplace.app_record;
create policy app_record_leggi on marketplace.app_record for select using (
  marketplace.app_puo_leggere(org, tipo, modulo, id, rif, dati, pubblico)
);
drop policy if exists app_record_crea on marketplace.app_record;
create policy app_record_crea on marketplace.app_record for insert with check (
  marketplace.app_puo_scrivere(org, tipo, modulo, id, rif, dati)
);
drop policy if exists app_record_modifica on marketplace.app_record;
create policy app_record_modifica on marketplace.app_record for update
  using (marketplace.app_puo_scrivere(org, tipo, modulo, id, rif, dati))
  with check (marketplace.app_puo_scrivere(org, tipo, modulo, id, rif, dati));
drop policy if exists app_record_cancella on marketplace.app_record;
create policy app_record_cancella on marketplace.app_record for delete using (marketplace.app_gestisce(org));

-- Prima di salvare: modulo dal tipo, azienda dalla scheda madre, campi che non si cambiano.
-- L'azienda di una scheda (per le schede figlie). Serve al controllo qui sotto.
create or replace function marketplace.app_org_di(p_record uuid)
returns uuid language sql stable security definer set search_path = marketplace, public as $$
  select org from marketplace.app_record r where r.id = p_record
    and marketplace.app_puo_leggere(r.org, r.tipo, r.modulo, r.id, r.rif, r.dati, r.pubblico);
$$;

-- NB: questa funzione NON è security definer, così current_user dice chi sta davvero scrivendo
-- (authenticated = un utente dall'app; postgres/service_role = una funzione dell'app o Supabase).
create or replace function marketplace.app_record_controlli()
returns trigger language plpgsql set search_path = marketplace, public as $$
declare
  v_ruolo text;
  v_gest boolean;
  v_utente boolean := current_user in ('authenticated', 'anon');
begin
  new.modulo := marketplace.app_modulo_di(new.tipo);
  if new.rif is not null then
    new.org := marketplace.app_org_di(new.rif);
    if new.org is null then raise exception 'scheda_madre_non_trovata'; end if;
  end if;
  if new.pubblico and new.tipo not in ('lotto', 'prodotto') then new.pubblico := false; end if;
  v_gest := marketplace.app_gestisce(coalesce(new.org, old.org));

  -- SAL: «approvato» e «contestato» li mette solo il cliente con app_approva_sal.
  if v_utente and new.tipo = 'sal' and not marketplace.is_admin() then
    if tg_op = 'INSERT' then
      if new.stato not in ('bozza', 'inviato') then new.stato := 'bozza'; end if;
      new.dati := new.dati - 'approvato_da' - 'approvato_il' - 'nota_cliente';
    else
      if new.stato in ('approvato', 'contestato') and new.stato is distinct from old.stato then new.stato := old.stato; end if;
      new.dati := (new.dati - 'approvato_da' - 'approvato_il' - 'nota_cliente')
        || jsonb_strip_nulls(jsonb_build_object('approvato_da', old.dati->'approvato_da', 'approvato_il', old.dati->'approvato_il', 'nota_cliente', old.dati->'nota_cliente'));
    end if;
  end if;

  if tg_op = 'INSERT' then
    new.creato_da := auth.uid();
    new.creato := now();
    if v_utente and not v_gest then
      if new.tipo in ('segnalazione', 'segnalazione_cliente') then new.stato := 'aperta'; end if;
      new.pubblico := false;
    end if;
  elsif v_utente and not marketplace.is_admin() then
    new.id := old.id; new.org := old.org; new.tipo := old.tipo; new.modulo := old.modulo; new.rif := old.rif;
    new.creato_da := old.creato_da; new.creato := old.creato;
    if not v_gest then
      v_ruolo := marketplace.app_mio_ruolo(old.org);
      -- Il lavoratore sui DPI: può solo mettere la sua firma (una volta).
      if v_ruolo = 'operatore' and old.tipo = 'dpi' then
        if old.dati ? 'firma' and coalesce(old.dati->>'firma', '') <> '' then return old; end if;
        new.titolo := old.titolo; new.stato := old.stato; new.data := old.data; new.scadenza := old.scadenza; new.importo := old.importo;
        new.dati := old.dati || jsonb_build_object('firma', left(coalesce(new.dati->>'firma', ''), 150000), 'firmato_il', now());
      elsif v_ruolo = 'consulente' and old.modulo in ('sicurezza', 'sicantiere') then
        null; -- il consulente lavora sulle schede della sicurezza
      else
        -- Partner e altri: solo le schede che hanno creato loro, e un SAL solo finché è in bozza.
        if old.creato_da is distinct from auth.uid() then raise exception 'non_autorizzato'; end if;
        if old.tipo = 'sal' and old.stato not in ('', 'bozza') then return old; end if;
        if old.tipo = 'sal' and new.stato not in ('bozza', 'inviato') then new.stato := old.stato; end if;
      end if;
    end if;
  end if;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_record_controlli on marketplace.app_record;
create trigger app_record_controlli before insert or update on marketplace.app_record for each row execute function marketplace.app_record_controlli();

alter table marketplace.app_accessi enable row level security;
drop policy if exists app_accessi_leggi on marketplace.app_accessi;
create policy app_accessi_leggi on marketplace.app_accessi for select using (
  utente = auth.uid() or marketplace.is_admin()
  or exists (select 1 from marketplace.app_record r where r.id = record and marketplace.app_gestisce(r.org))
);
drop policy if exists app_accessi_gestisci on marketplace.app_accessi;
create policy app_accessi_gestisci on marketplace.app_accessi for delete using (
  marketplace.is_admin() or exists (select 1 from marketplace.app_record r where r.id = record and marketplace.app_gestisce(r.org))
);

-- Il proprietario del cantiere approva un SAL (o lo contesta).
create or replace function marketplace.app_approva_sal(p_sal uuid, p_approva boolean, p_nota text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  v marketplace.app_record%rowtype;
begin
  select * into v from marketplace.app_record where id = p_sal and tipo = 'sal' for update;
  if not found then raise exception 'sal_non_trovato'; end if;
  if coalesce(marketplace.app_accesso(v.id, v.rif), '') <> 'cliente' then raise exception 'non_autorizzato'; end if;
  if v.stato <> 'inviato' then raise exception 'sal_non_da_approvare'; end if;
  update marketplace.app_record
    set stato = case when p_approva then 'approvato' else 'contestato' end,
        dati = dati || jsonb_build_object('approvato_da', auth.uid(), 'approvato_il', now(), 'nota_cliente', left(coalesce(p_nota, ''), 400))
    where id = p_sal;
end;
$$;

-- Ingresso in cantiere con il codice del patentino: controlla corsi e visite e registra l'ingresso.
create or replace function marketplace.app_registra_ingresso(p_cantiere uuid, p_codice text)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  c marketplace.app_record%rowtype;
  d marketplace.app_record%rowtype;
  v_scad date;
  v_ok boolean;
begin
  select * into c from marketplace.app_record where id = p_cantiere and tipo = 'cantiere';
  if not found or not (marketplace.app_gestisce(c.org) or coalesce(marketplace.app_accesso(c.id, null), '') = 'partner') then raise exception 'non_autorizzato'; end if;
  select * into d from marketplace.app_record r where r.tipo = 'dipendente' and upper(r.dati->>'codice') = upper(btrim(p_codice))
    and (r.org = c.org or r.org in (select m.org from marketplace.app_org_membri m where m.utente = auth.uid() and m.ruolo in ('titolare', 'responsabile')))
    limit 1;
  if not found then raise exception 'codice_non_trovato'; end if;
  select min(scadenza) into v_scad from marketplace.app_record where rif = d.id and tipo in ('attestato', 'visita') and scadenza is not null;
  v_ok := v_scad is not null and v_scad >= current_date;
  insert into marketplace.app_record (org, tipo, rif, titolo, data, stato, dati, creato_da)
    values (c.org, 'ingresso', c.id, d.titolo, current_date, case when v_ok then 'in regola' else 'non in regola' end, jsonb_build_object('codice', upper(btrim(p_codice))), auth.uid());
  return jsonb_build_object('nome', d.titolo, 'in_regola', v_ok, 'scadenza', v_scad);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. OFFERTE SUI LOTTI (subappalti e forniture)
-- ---------------------------------------------------------------------------
-- Può fare offerte chi gestisce un'azienda con l'abbonamento attivo.
create or replace function marketplace.app_puo_offrire(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.app_gestisce(p_org) and marketplace.app_modulo_attivo(p_org, 'base');
$$;

create table if not exists marketplace.app_offerte (
  id uuid primary key default gen_random_uuid(),
  lotto uuid not null references marketplace.app_record(id) on delete cascade,
  org uuid not null references marketplace.app_org(id) on delete cascade,
  prezzo numeric(12,2) not null check (prezzo >= 0),
  tempi text not null default '' check (length(tempi) <= 120),
  note text not null default '' check (length(note) <= 600),
  stato text not null default 'inviata' check (stato in ('inviata', 'accettata', 'rifiutata', 'ritirata')),
  creato timestamptz not null default now(),
  unique (lotto, org)
);
alter table marketplace.app_offerte enable row level security;
drop policy if exists app_offerte_leggi on marketplace.app_offerte;
create policy app_offerte_leggi on marketplace.app_offerte for select using (
  marketplace.app_mio_ruolo(org) is not null or marketplace.is_admin()
  or exists (select 1 from marketplace.app_record r where r.id = lotto and marketplace.app_gestisce(r.org))
);
drop policy if exists app_offerte_crea on marketplace.app_offerte;
create policy app_offerte_crea on marketplace.app_offerte for insert with check (
  marketplace.app_puo_offrire(org) and stato = 'inviata'
  and exists (select 1 from marketplace.app_record r where r.id = lotto and r.tipo = 'lotto' and r.pubblico and r.stato = 'aperto' and r.org <> app_offerte.org)
);
-- Accettare/rifiutare (chi ha pubblicato il lotto) o ritirare (chi ha offerto): con app_decidi_offerta.
create or replace function marketplace.app_decidi_offerta(p_offerta uuid, p_stato text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  o marketplace.app_offerte%rowtype;
  v_lotto_org uuid;
begin
  select * into o from marketplace.app_offerte where id = p_offerta for update;
  if not found then raise exception 'offerta_non_trovata'; end if;
  select org into v_lotto_org from marketplace.app_record where id = o.lotto for update;
  if p_stato in ('accettata', 'rifiutata') and marketplace.app_gestisce(v_lotto_org) and o.stato = 'inviata' then
    if p_stato = 'accettata' and not exists (select 1 from marketplace.app_record where id = o.lotto and stato = 'aperto') then raise exception 'lotto_non_aperto'; end if;
    update marketplace.app_offerte set stato = p_stato where id = p_offerta;
    if p_stato = 'accettata' then
      update marketplace.app_record set stato = 'assegnato', dati = dati || jsonb_build_object('offerta', p_offerta, 'assegnato_a', o.org) where id = o.lotto;
      update marketplace.app_offerte set stato = 'rifiutata' where lotto = o.lotto and id <> p_offerta and stato = 'inviata';
    end if;
  elsif p_stato = 'ritirata' and marketplace.app_gestisce(o.org) and o.stato = 'inviata' then
    update marketplace.app_offerte set stato = 'ritirata' where id = p_offerta;
  else
    raise exception 'non_autorizzato';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. MESSAGGI DEL CANTIERE (chat tra impresa, proprietario e partner)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_messaggi (
  id uuid primary key default gen_random_uuid(),
  record uuid not null references marketplace.app_record(id) on delete cascade,
  autore uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null default '' check (length(nome) <= 80),
  testo text not null check (length(btrim(testo)) between 1 and 2000),
  creato timestamptz not null default now()
);
create index if not exists app_messaggi_record_idx on marketplace.app_messaggi (record, creato);
alter table marketplace.app_messaggi enable row level security;
drop policy if exists app_messaggi_leggi on marketplace.app_messaggi;
create policy app_messaggi_leggi on marketplace.app_messaggi for select using (
  exists (select 1 from marketplace.app_record r where r.id = record and r.tipo = 'cantiere'
    and (marketplace.app_mio_ruolo(r.org) in ('titolare', 'responsabile') or marketplace.app_accesso(r.id, null) is not null or marketplace.is_admin()))
);
drop policy if exists app_messaggi_scrivi on marketplace.app_messaggi;
create policy app_messaggi_scrivi on marketplace.app_messaggi for insert with check (
  autore = auth.uid() and exists (select 1 from marketplace.app_record r where r.id = record and r.tipo = 'cantiere'
    and (marketplace.app_mio_ruolo(r.org) in ('titolare', 'responsabile') or marketplace.app_accesso(r.id, null) is not null or marketplace.is_admin()))
);

-- ---------------------------------------------------------------------------
-- 7. INVITI (in azienda, in un cantiere, nella rete commerciale)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_rete (
  utente uuid primary key references auth.users(id) on delete cascade,
  ruolo text not null check (ruolo in ('sviluppo', 'capoarea', 'agente', 'subagente')),
  superiore uuid references auth.users(id) on delete set null,
  nome text not null default '' check (length(nome) <= 80),
  area text not null default '' check (area in ('', 'Nord', 'Centro', 'Sud e isole')),
  regione text not null default '' check (length(regione) <= 40),
  codice text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  stato text not null default 'attivo' check (stato in ('attivo', 'sospeso')),
  accordo_firmato timestamptz,
  creato timestamptz not null default now()
);

create table if not exists marketplace.app_inviti (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  cosa text not null check (cosa in ('org', 'cantiere', 'rete')),
  target uuid,
  ruolo text not null,
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nome text not null default '' check (length(nome) <= 80),
  stato text not null default 'inviato' check (stato in ('inviato', 'accettato', 'annullato')),
  creato_da uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creato timestamptz not null default now(),
  check (
    (cosa = 'org' and ruolo in ('responsabile', 'operatore', 'consulente') and target is not null)
    or (cosa = 'cantiere' and ruolo in ('cliente', 'partner') and target is not null)
    or (cosa = 'rete' and ruolo in ('sviluppo', 'capoarea', 'agente', 'subagente'))
  )
);
alter table marketplace.app_inviti enable row level security;

create or replace function marketplace.app_puo_invitare(p_cosa text, p_target uuid, p_ruolo text)
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_mio text;
begin
  if marketplace.is_admin() then return true; end if;
  if p_cosa = 'org' then return marketplace.app_gestisce(p_target); end if;
  if p_cosa = 'cantiere' then
    return exists (select 1 from marketplace.app_record r where r.id = p_target and r.tipo = 'cantiere' and marketplace.app_gestisce(r.org));
  end if;
  if p_cosa = 'rete' then
    select ruolo into v_mio from marketplace.app_rete where utente = auth.uid() and stato = 'attivo';
    return (v_mio = 'sviluppo' and p_ruolo = 'capoarea') or (v_mio = 'capoarea' and p_ruolo = 'agente') or (v_mio = 'agente' and p_ruolo = 'subagente');
  end if;
  return false;
end;
$$;

drop policy if exists app_inviti_leggi on marketplace.app_inviti;
create policy app_inviti_leggi on marketplace.app_inviti for select using (creato_da = auth.uid() or marketplace.is_admin());
drop policy if exists app_inviti_crea on marketplace.app_inviti;
create policy app_inviti_crea on marketplace.app_inviti for insert with check (
  creato_da = auth.uid() and stato = 'inviato' and marketplace.app_puo_invitare(cosa, target, ruolo)
);
-- Un invito si può solo annullare (si cambia solo la colonna stato: vedi i permessi in fondo).
drop policy if exists app_inviti_annulla on marketplace.app_inviti;
create policy app_inviti_annulla on marketplace.app_inviti for update using (stato = 'inviato' and (creato_da = auth.uid() or marketplace.is_admin()))
  with check (stato = 'annullato');

-- Cosa dice un invito (per la pagina che lo apre). Solo a chi ha la stessa mail.
create or replace function marketplace.app_apri_invito(p_token text)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  i marketplace.app_inviti%rowtype;
  v_nome text;
begin
  select * into i from marketplace.app_inviti where token = p_token;
  if not found or i.stato <> 'inviato' then return jsonb_build_object('ok', false, 'motivo', 'invito_non_valido'); end if;
  if lower(i.email) <> lower(coalesce(auth.jwt()->>'email', '')) then return jsonb_build_object('ok', false, 'motivo', 'mail_diversa', 'email', i.email); end if;
  if i.cosa = 'org' then select nome into v_nome from marketplace.app_org where id = i.target;
  elsif i.cosa = 'cantiere' then select titolo into v_nome from marketplace.app_record where id = i.target;
  else v_nome := 'Rete commerciale AncheCasa'; end if;
  return jsonb_build_object('ok', true, 'cosa', i.cosa, 'ruolo', i.ruolo, 'dove', v_nome);
end;
$$;

create or replace function marketplace.app_accetta_invito(p_token text)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  i marketplace.app_inviti%rowtype;
  s marketplace.app_rete%rowtype;
begin
  select * into i from marketplace.app_inviti where token = p_token for update;
  if not found or i.stato <> 'inviato' then raise exception 'invito_non_valido'; end if;
  if lower(i.email) <> lower(coalesce(auth.jwt()->>'email', '')) then raise exception 'mail_diversa'; end if;
  if i.cosa = 'org' then
    insert into marketplace.app_org_membri (org, utente, ruolo, nome) values (i.target, auth.uid(), i.ruolo, i.nome)
      on conflict (org, utente) do update set ruolo = excluded.ruolo where marketplace.app_org_membri.ruolo <> 'titolare';
  elsif i.cosa = 'cantiere' then
    insert into marketplace.app_accessi (record, utente, ruolo) values (i.target, auth.uid(), i.ruolo)
      on conflict (record, utente) do update set ruolo = excluded.ruolo;
  else
    select * into s from marketplace.app_rete where utente = i.creato_da;
    if exists (select 1 from marketplace.app_rete where utente = auth.uid()) then raise exception 'gia_nella_rete'; end if;
    insert into marketplace.app_rete (utente, ruolo, superiore, nome, area, regione)
      values (auth.uid(), i.ruolo, case when found then i.creato_da else null end, i.nome, coalesce(s.area, ''), coalesce(s.regione, ''));
  end if;
  update marketplace.app_inviti set stato = 'accettato' where id = i.id;
  return jsonb_build_object('cosa', i.cosa, 'ruolo', i.ruolo, 'target', i.target);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. RETE COMMERCIALE: sviluppo rete → capoarea → agente → sub-agente
-- ---------------------------------------------------------------------------
alter table marketplace.app_rete enable row level security;

-- Tutti quelli sotto una persona (la sua squadra, a ogni livello).
create or replace function marketplace.app_sotto(p_utente uuid)
returns setof uuid language sql stable security definer set search_path = marketplace, public as $$
  with recursive giu as (
    select utente, 1 as livello from marketplace.app_rete where superiore = p_utente
    union all
    select r.utente, g.livello + 1 from marketplace.app_rete r join giu g on r.superiore = g.utente where g.livello < 6
  )
  select utente from giu;
$$;
create or replace function marketplace.app_nella_mia_rete(p_utente uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select p_utente = auth.uid() or marketplace.is_admin() or p_utente in (select marketplace.app_sotto(auth.uid()));
$$;

drop policy if exists app_rete_leggi on marketplace.app_rete;
create policy app_rete_leggi on marketplace.app_rete for select using (marketplace.app_nella_mia_rete(utente));
drop policy if exists app_rete_admin on marketplace.app_rete;
create policy app_rete_admin on marketplace.app_rete for all using (marketplace.is_admin()) with check (marketplace.is_admin());

-- Il responsabile sviluppo rete firma l'accordo dall'app.
create or replace function marketplace.app_firma_accordo()
returns void language sql security definer set search_path = marketplace, public as $$
  update marketplace.app_rete set accordo_firmato = now() where utente = auth.uid() and accordo_firmato is null;
$$;

-- Vendite della rete (moduli, corsi, servizi, ristrutturazioni). L'admin le conferma.
create table if not exists marketplace.app_vendite (
  id uuid primary key default gen_random_uuid(),
  venditore uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_nome text not null check (length(btrim(cliente_nome)) between 2 and 120),
  cliente_contatto text not null default '' check (length(cliente_contatto) <= 120),
  cliente_regione text not null default '' check (length(cliente_regione) <= 40),
  cosa text not null check (cosa in ('modulo', 'pacchetto', 'corso', 'servizio', 'ristrutturazione', 'supermastro', 'altro')),
  dettaglio text not null default '' check (length(dettaglio) <= 200),
  importo numeric(12,2) not null default 0 check (importo >= 0),
  tipo_importo text not null default 'mese' check (tipo_importo in ('mese', 'una_tantum')),
  stato text not null default 'proposta' check (stato in ('proposta', 'attiva', 'persa')),
  creato timestamptz not null default now(),
  attivata timestamptz
);
alter table marketplace.app_vendite enable row level security;
drop policy if exists app_vendite_leggi on marketplace.app_vendite;
create policy app_vendite_leggi on marketplace.app_vendite for select using (marketplace.app_nella_mia_rete(venditore));
drop policy if exists app_vendite_crea on marketplace.app_vendite;
create policy app_vendite_crea on marketplace.app_vendite for insert with check (
  venditore = auth.uid() and stato = 'proposta' and exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo')
);
drop policy if exists app_vendite_persa on marketplace.app_vendite;
create policy app_vendite_persa on marketplace.app_vendite for update using ((venditore = auth.uid() and stato = 'proposta') or marketplace.is_admin())
  with check (marketplace.is_admin() or (venditore = auth.uid() and stato = 'persa'));

create table if not exists marketplace.app_provvigioni (
  id uuid primary key default gen_random_uuid(),
  vendita uuid not null references marketplace.app_vendite(id) on delete cascade,
  beneficiario uuid not null references auth.users(id) on delete cascade,
  ruolo text not null,
  importo numeric(12,2) not null,
  mese date not null default date_trunc('month', now())::date,
  stato text not null default 'maturata' check (stato in ('maturata', 'pagata')),
  creato timestamptz not null default now()
);
alter table marketplace.app_provvigioni enable row level security;
drop policy if exists app_provvigioni_leggi on marketplace.app_provvigioni;
create policy app_provvigioni_leggi on marketplace.app_provvigioni for select using (marketplace.app_nella_mia_rete(beneficiario));
drop policy if exists app_provvigioni_admin on marketplace.app_provvigioni;
create policy app_provvigioni_admin on marketplace.app_provvigioni for update using (marketplace.is_admin()) with check (marketplace.is_admin());

-- Quando l'admin conferma una vendita: provvigioni a chi ha venduto e alla sua catena,
-- con le percentuali delle impostazioni.
create or replace function marketplace.app_vendita_provvigioni()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  p jsonb;
  monte numeric;
  v_ruolo text;
  v_sup uuid;
  v_sup_ruolo text;
  v_cur uuid;
  v_quota numeric;
begin
  if old.stato = 'attiva' and current_user in ('authenticated', 'anon') then
    raise exception 'vendita_gia_confermata';
  end if;
  if not (new.stato = 'attiva' and old.stato is distinct from 'attiva') then return new; end if;
  new.attivata := now();
  select valore into p from marketplace.app_impostazioni where chiave = 'provvigioni';
  monte := round(new.importo * coalesce((p->>'percentuale_vendita')::numeric, 0) / 100, 2);
  if monte <= 0 then return new; end if;
  select ruolo, superiore into v_ruolo, v_sup from marketplace.app_rete where utente = new.venditore;
  if v_ruolo = 'subagente' and v_sup is not null then
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values
      (new.id, new.venditore, 'subagente', round(monte * coalesce((p->>'subagente')::numeric, 70) / 100, 2)),
      (new.id, v_sup, 'agente', round(monte * coalesce((p->>'agente')::numeric, 30) / 100, 2));
    v_cur := v_sup;
  else
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, new.venditore, coalesce(v_ruolo, 'venditore'), monte);
    v_cur := new.venditore;
  end if;
  -- Quote in più per capoarea e sviluppo rete sopra (se le percentuali sono maggiori di zero).
  for i in 1..4 loop
    select superiore into v_sup from marketplace.app_rete where utente = v_cur;
    exit when v_sup is null;
    select ruolo into v_sup_ruolo from marketplace.app_rete where utente = v_sup;
    v_quota := round(monte * coalesce((p->>v_sup_ruolo)::numeric, 0) / 100, 2);
    if v_sup_ruolo in ('capoarea', 'sviluppo') and v_quota > 0 then
      insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, v_sup, v_sup_ruolo, v_quota);
    end if;
    v_cur := v_sup;
  end loop;
  return new;
end;
$$;
drop trigger if exists app_vendita_provvigioni on marketplace.app_vendite;
create trigger app_vendita_provvigioni before update on marketplace.app_vendite for each row execute function marketplace.app_vendita_provvigioni();

-- ---------------------------------------------------------------------------
-- 9. ANCHESICURA: ordini di corsi e servizi, rivendita delle aziende (30%)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_ordini (
  id uuid primary key default gen_random_uuid(),
  utente uuid not null default auth.uid() references auth.users(id) on delete cascade,
  org uuid references marketplace.app_org(id) on delete set null,
  voce text not null check (length(voce) between 2 and 120),
  quantita int not null default 1 check (quantita between 1 and 500),
  prezzo numeric(10,2) not null check (prezzo >= 0),
  codice_venditore text not null default '' check (length(codice_venditore) <= 12),
  note text not null default '' check (length(note) <= 400),
  stato text not null default 'richiesto' check (stato in ('richiesto', 'confermato', 'svolto', 'annullato')),
  creato timestamptz not null default now()
);
alter table marketplace.app_ordini enable row level security;
drop policy if exists app_ordini_leggi on marketplace.app_ordini;
create policy app_ordini_leggi on marketplace.app_ordini for select using (
  utente = auth.uid() or marketplace.is_admin() or (org is not null and marketplace.app_gestisce(org))
);
drop policy if exists app_ordini_crea on marketplace.app_ordini;
create policy app_ordini_crea on marketplace.app_ordini for insert with check (
  utente = auth.uid() and stato = 'richiesto' and (org is null or marketplace.app_mio_ruolo(org) is not null)
);
drop policy if exists app_ordini_admin on marketplace.app_ordini;
create policy app_ordini_admin on marketplace.app_ordini for update using (marketplace.is_admin()) with check (marketplace.is_admin());

-- Prezzo dal listino AncheSicura (impostazioni), mai dal telefono. Niente codice venditore di se stessi.
insert into marketplace.app_impostazioni (chiave, valore) values ('listino_anchesicura', '{
  "Lavoratori, parte generale (4 ore)": 29, "Generale + specifica rischio basso (8 ore)": 49, "Lavoratori rischio medio (12 ore)": 129,
  "Lavoratori rischio alto (16 ore)": 159, "Aggiornamento lavoratori (6 ore)": 45, "Dirigenti (12 ore)": 99, "Datore di lavoro RSPP (16 ore)": 129,
  "Preposto (12 ore)": 159, "Antincendio livello 1": 139, "Antincendio livello 2": 179, "Primo soccorso gruppo B e C": 179,
  "Primo soccorso gruppo A": 239, "HACCP": 29, "Visita medica": 29, "POS": 59, "DUVRI": 69, "DVR": 199, "PSC": 199, "RSPP esterno": 0
}') on conflict (chiave) do nothing;
create or replace function marketplace.app_ordini_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then
    new.prezzo := coalesce((select (valore->>new.voce)::numeric from marketplace.app_impostazioni where chiave = 'listino_anchesicura'), 0);
    new.creato := now(); new.stato := 'richiesto';
    if exists (select 1 from marketplace.app_rete where utente = auth.uid() and codice = upper(new.codice_venditore)) then new.codice_venditore := ''; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists app_ordini_controlli on marketplace.app_ordini;
create trigger app_ordini_controlli before insert on marketplace.app_ordini for each row execute function marketplace.app_ordini_controlli();

-- Quando l'admin conferma un ordine con il codice di un venditore, nasce la vendita (e le provvigioni).
create or replace function marketplace.app_conferma_ordine(p_ordine uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  o marketplace.app_ordini%rowtype;
  v_vend uuid;
  v_id uuid;
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  select * into o from marketplace.app_ordini where id = p_ordine for update;
  if not found or o.stato <> 'richiesto' then raise exception 'ordine_non_valido'; end if;
  update marketplace.app_ordini set stato = 'confermato' where id = p_ordine;
  if o.codice_venditore <> '' then
    select utente into v_vend from marketplace.app_rete where codice = upper(o.codice_venditore) and stato = 'attivo';
    if v_vend is not null then
      insert into marketplace.app_vendite (venditore, cliente_nome, cosa, dettaglio, importo, tipo_importo, stato)
        values (v_vend, coalesce((select nome from marketplace.app_org where id = o.org), 'Cliente'), 'corso', o.voce, o.prezzo * o.quantita, 'una_tantum', 'proposta')
        returning id into v_id;
      update marketplace.app_vendite set stato = 'attiva' where id = v_id;
    end if;
  end if;
end;
$$;

create table if not exists marketplace.app_rivendite (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  cliente_nome text not null check (length(btrim(cliente_nome)) between 2 and 120),
  cliente_contatto text not null default '' check (length(cliente_contatto) <= 120),
  servizio text not null check (length(servizio) between 2 and 200),
  importo numeric(12,2) not null check (importo >= 0),
  percentuale numeric(5,2) not null default 30,
  stato text not null default 'richiesta' check (stato in ('richiesta', 'confermata', 'pagata', 'quota_pagata', 'annullata')),
  creato timestamptz not null default now()
);
alter table marketplace.app_rivendite enable row level security;
drop policy if exists app_rivendite_leggi on marketplace.app_rivendite;
create policy app_rivendite_leggi on marketplace.app_rivendite for select using (marketplace.app_gestisce(org));
drop policy if exists app_rivendite_crea on marketplace.app_rivendite;
create policy app_rivendite_crea on marketplace.app_rivendite for insert with check (marketplace.app_gestisce(org) and stato = 'richiesta');
drop policy if exists app_rivendite_admin on marketplace.app_rivendite;
create policy app_rivendite_admin on marketplace.app_rivendite for update using (marketplace.is_admin()) with check (marketplace.is_admin());
create or replace function marketplace.app_rivendita_percentuale()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then
    new.percentuale := coalesce((select (valore->>'percentuale')::numeric from marketplace.app_impostazioni where chiave = 'rivendita'), 30);
  end if;
  return new;
end;
$$;
drop trigger if exists app_rivendita_percentuale on marketplace.app_rivendite;
create trigger app_rivendita_percentuale before insert on marketplace.app_rivendite for each row execute function marketplace.app_rivendita_percentuale();

-- ---------------------------------------------------------------------------
-- 10. RECENSIONI DELLE IMPRESE e REPORT (admin, sviluppo rete, capoarea)
-- ---------------------------------------------------------------------------
alter table marketplace.app_artigiani add column if not exists regione text not null default '';

create table if not exists marketplace.app_recensioni_org (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  lavoro uuid not null references marketplace.app_record(id) on delete cascade,
  autore uuid not null references auth.users(id) on delete cascade,
  voto numeric(2,1) not null check (voto between 1 and 5),
  voti jsonb not null default '{}'::jsonb,
  testo text not null default '' check (length(testo) <= 600),
  creato timestamptz not null default now(),
  unique (lavoro, autore)
);
alter table marketplace.app_recensioni_org enable row level security;
drop policy if exists app_recensioni_org_leggi on marketplace.app_recensioni_org;
create policy app_recensioni_org_leggi on marketplace.app_recensioni_org for select using (
  autore = auth.uid() or marketplace.app_mio_ruolo(org) is not null or marketplace.is_admin()
);

-- Il proprietario recensisce il cantiere (l'impresa che l'ha fatto: la partner se c'è, se no l'azienda del cantiere).
create or replace function marketplace.app_recensisci_cantiere(p_cantiere uuid, p_voti jsonb, p_testo text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  c marketplace.app_record%rowtype;
  v_org uuid;
  v_voti jsonb := '{}'::jsonb;
  v_voto numeric(2,1);
  v_id uuid;
  k text;
begin
  select * into c from marketplace.app_record where id = p_cantiere and tipo = 'cantiere';
  if not found or coalesce(marketplace.app_accesso(c.id, null), '') <> 'cliente' then raise exception 'non_autorizzato'; end if;
  if c.stato <> 'finito' then raise exception 'cantiere_non_finito'; end if;
  foreach k in array array['qualita', 'puntualita', 'pulizia', 'prezzo', 'comunicazione'] loop
    if (p_voti ? k) and (p_voti->>k) ~ '^[1-5]$' then v_voti := v_voti || jsonb_build_object(k, (p_voti->>k)::int); end if;
  end loop;
  if v_voti = '{}'::jsonb then raise exception 'mancano_i_voti'; end if;
  select round(avg(value::int), 1) into v_voto from jsonb_each_text(v_voti);
  -- L'impresa recensita: la partner del cantiere solo se un suo titolare/responsabile ha davvero l'accesso partner.
  select m.org into v_org from marketplace.app_accessi a join marketplace.app_org_membri m on m.utente = a.utente and m.ruolo in ('titolare', 'responsabile')
    where a.record = c.id and a.ruolo = 'partner' and m.org::text = coalesce(c.dati->>'partner_org', '') limit 1;
  v_org := coalesce(v_org, c.org);
  if marketplace.app_mio_ruolo(c.org) is not null or marketplace.app_mio_ruolo(v_org) is not null then raise exception 'non_autorizzato'; end if;
  insert into marketplace.app_recensioni_org (org, lavoro, autore, voto, voti, testo)
    values (v_org, c.id, auth.uid(), v_voto, v_voti, left(coalesce(p_testo, ''), 600))
    returning id into v_id;
  return v_id;
end;
$$;

create or replace function marketplace.app_regioni_area(p_area text)
returns text[] language sql immutable as $$
  select case p_area
    when 'Nord' then array['Piemonte', 'Valle d''Aosta', 'Lombardia', 'Trentino-Alto Adige', 'Veneto', 'Friuli-Venezia Giulia', 'Liguria', 'Emilia-Romagna']
    when 'Centro' then array['Toscana', 'Umbria', 'Marche', 'Lazio']
    when 'Sud e isole' then array['Abruzzo', 'Molise', 'Campania', 'Puglia', 'Basilicata', 'Calabria', 'Sicilia', 'Sardegna']
    else array[]::text[] end;
$$;

-- Tutte le recensioni che chi chiama può vedere nel report:
-- admin = tutta Italia; sviluppo rete = la sua area; capoarea = la sua regione.
create or replace function marketplace.app_report_recensioni()
returns table (tipo text, soggetto uuid, nome text, regione text, lavoro uuid, lavoro_nome text, voto numeric, voti jsonb, testo text, creato timestamptz)
language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_ruolo text; v_area text; v_regione text; v_regioni text[];
begin
  if marketplace.is_admin() then
    v_regioni := null;
  else
    select x.ruolo, x.area, x.regione into v_ruolo, v_area, v_regione from marketplace.app_rete x where x.utente = auth.uid() and x.stato = 'attivo';
    if v_ruolo = 'sviluppo' then v_regioni := marketplace.app_regioni_area(v_area);
    elsif v_ruolo = 'capoarea' then v_regioni := array[v_regione];
    else raise exception 'non_autorizzato'; end if;
  end if;
  return query
    select 'artigiano'::text, a.utente, a.nome_attivita, a.regione, r.id, r.problema, v.voto, v.voti, v.testo, v.creato
    from marketplace.app_recensioni v
    join marketplace.app_artigiani a on a.utente = v.artigiano
    join marketplace.app_richieste r on r.id = v.richiesta
    where v_regioni is null or a.regione = any (v_regioni)
    union all
    select 'impresa'::text, o.id, o.nome, o.regione, c.id, c.titolo, v.voto, v.voti, v.testo, v.creato
    from marketplace.app_recensioni_org v
    join marketplace.app_org o on o.id = v.org
    join marketplace.app_record c on c.id = v.lavoro
    where v_regioni is null or o.regione = any (v_regioni)
    order by 10 desc
    limit 2000;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. NOTIFICHE dentro l'app
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_notifiche (
  id uuid primary key default gen_random_uuid(),
  utente uuid not null references auth.users(id) on delete cascade,
  testo text not null check (length(testo) <= 200),
  link text not null default '' check (length(link) <= 120),
  letto boolean not null default false,
  creato timestamptz not null default now()
);
create index if not exists app_notifiche_utente_idx on marketplace.app_notifiche (utente, creato desc);
alter table marketplace.app_notifiche enable row level security;
drop policy if exists app_notifiche_mie on marketplace.app_notifiche;
create policy app_notifiche_mie on marketplace.app_notifiche for select using (utente = auth.uid());
drop policy if exists app_notifiche_lette on marketplace.app_notifiche;
create policy app_notifiche_lette on marketplace.app_notifiche for update using (utente = auth.uid()) with check (utente = auth.uid());

create or replace function marketplace.app_notifica(p_utente uuid, p_testo text, p_link text)
returns void language sql security definer set search_path = marketplace, public as $$
  insert into marketplace.app_notifiche (utente, testo, link) select p_utente, left(p_testo, 200), left(coalesce(p_link, ''), 120) where p_utente is not null;
$$;
create or replace function marketplace.app_notifica_gestori(p_org uuid, p_testo text, p_link text)
returns void language sql security definer set search_path = marketplace, public as $$
  insert into marketplace.app_notifiche (utente, testo, link)
  select utente, left(p_testo, 200), left(coalesce(p_link, ''), 120) from marketplace.app_org_membri where org = p_org and ruolo in ('titolare', 'responsabile');
$$;
create or replace function marketplace.app_notifica_admin(p_testo text, p_link text)
returns void language sql security definer set search_path = marketplace, public as $$
  insert into marketplace.app_notifiche (utente, testo, link) select id, left(p_testo, 200), left(coalesce(p_link, ''), 120) from marketplace.admins;
$$;

create or replace function marketplace.app_eventi()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_org uuid;
begin
  if tg_table_name = 'app_invii' then
    perform marketplace.app_notifica(new.artigiano, 'Nuova richiesta da SuperMastro', 'ar-richiesta/' || new.richiesta);
  elsif tg_table_name = 'app_richieste' then
    if new.artigiano is not null and old.artigiano is null then
      perform marketplace.app_notifica(new.privato, 'Un artigiano ha accettato la tua richiesta', 'richiesta/' || new.id);
    end if;
  elsif tg_table_name = 'app_offerte' then
    if tg_op = 'INSERT' then
      select org into v_org from marketplace.app_record where id = new.lotto;
      perform marketplace.app_notifica_gestori(v_org, 'Nuova offerta su un tuo lotto', 'scheda/' || new.lotto);
    elsif new.stato is distinct from old.stato and new.stato in ('accettata', 'rifiutata') then
      perform marketplace.app_notifica_gestori(new.org, 'La tua offerta è stata ' || new.stato, 'offerte');
    end if;
  elsif tg_table_name = 'app_record' then
    if tg_op = 'INSERT' and new.tipo in ('segnalazione', 'segnalazione_cliente') then
      perform marketplace.app_notifica_gestori(new.org, 'Nuova segnalazione: ' || left(new.titolo, 80), 'scheda/' || new.id);
    elsif tg_op = 'UPDATE' and new.tipo = 'sal' and new.stato = 'inviato' and old.stato is distinct from 'inviato' then
      perform marketplace.app_notifica(a.utente, 'SAL da approvare: ' || left(new.titolo, 80), 'scheda/' || new.id)
        from marketplace.app_accessi a where a.record = new.rif and a.ruolo = 'cliente';
    elsif tg_op = 'UPDATE' and new.tipo = 'sal' and new.stato in ('approvato', 'contestato') and old.stato = 'inviato' then
      perform marketplace.app_notifica_gestori(new.org, 'SAL ' || new.stato || ' dal cliente: ' || left(new.titolo, 80), 'scheda/' || new.id);
    end if;
  elsif tg_table_name = 'app_moduli' then
    if tg_op = 'INSERT' then
      perform marketplace.app_notifica_admin('Richiesta di attivazione modulo ' || new.modulo, 'ad-moduli');
    elsif new.stato = 'attivo' and old.stato is distinct from 'attivo' then
      perform marketplace.app_notifica_gestori(new.org, 'Modulo attivo: ' || new.modulo, 'moduli');
    end if;
  elsif tg_table_name = 'app_vendite' then
    if new.stato = 'attiva' and old.stato is distinct from 'attiva' then
      perform marketplace.app_notifica(new.venditore, 'Vendita confermata: ' || left(new.cliente_nome, 80), 'rete-vendite');
    end if;
  elsif tg_table_name = 'app_ordini' then
    perform marketplace.app_notifica_admin('Nuovo ordine AncheSicura: ' || left(new.voce, 80), 'ad-ordini');
  end if;
  return new;
end;
$$;
drop trigger if exists app_eventi_invii on marketplace.app_invii;
create trigger app_eventi_invii after insert on marketplace.app_invii for each row execute function marketplace.app_eventi();
drop trigger if exists app_eventi_richieste on marketplace.app_richieste;
create trigger app_eventi_richieste after update on marketplace.app_richieste for each row execute function marketplace.app_eventi();
drop trigger if exists app_eventi_offerte on marketplace.app_offerte;
create trigger app_eventi_offerte after insert or update on marketplace.app_offerte for each row execute function marketplace.app_eventi();
drop trigger if exists app_eventi_record on marketplace.app_record;
create trigger app_eventi_record after insert or update on marketplace.app_record for each row execute function marketplace.app_eventi();
drop trigger if exists app_eventi_moduli on marketplace.app_moduli;
create trigger app_eventi_moduli after insert or update on marketplace.app_moduli for each row execute function marketplace.app_eventi();
drop trigger if exists app_eventi_vendite on marketplace.app_vendite;
create trigger app_eventi_vendite after update on marketplace.app_vendite for each row execute function marketplace.app_eventi();
drop trigger if exists app_eventi_ordini on marketplace.app_ordini;
create trigger app_eventi_ordini after insert on marketplace.app_ordini for each row execute function marketplace.app_eventi();

-- ---------------------------------------------------------------------------
-- 12. I MIEI PROFILI (quali parti dell'app vede chi entra) e NUMERI DELL'ADMIN
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_miei_profili()
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select jsonb_build_object(
    'ruoli', coalesce((select jsonb_agg(ruolo) from marketplace.app_ruoli where utente = auth.uid()), '[]'::jsonb),
    'admin', marketplace.is_admin(),
    'org', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'nome', o.nome, 'tipo', o.tipo, 'ruolo', m.ruolo, 'stato', o.stato) order by o.creato)
      from marketplace.app_org_membri m join marketplace.app_org o on o.id = m.org where m.utente = auth.uid()), '[]'::jsonb),
    'accessi', coalesce((select jsonb_agg(jsonb_build_object('record', a.record, 'ruolo', a.ruolo, 'titolo', r.titolo, 'org', r.org))
      from marketplace.app_accessi a join marketplace.app_record r on r.id = a.record where a.utente = auth.uid()), '[]'::jsonb),
    'rete', (select jsonb_build_object('ruolo', ruolo, 'codice', codice, 'area', area, 'regione', regione, 'stato', stato, 'accordo', accordo_firmato, 'superiore', superiore)
      from marketplace.app_rete where utente = auth.uid())
  );
$$;

create or replace function marketplace.app_numeri_admin2()
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  return jsonb_build_object(
    'aziende', (select count(*) from marketplace.app_org where tipo <> 'gc'),
    'moduli_attivi', (select count(*) from marketplace.app_moduli where stato = 'attivo'),
    'moduli_richiesti', (select count(*) from marketplace.app_moduli where stato = 'richiesto'),
    'canoni_mese', (select coalesce(sum(prezzo_mese), 0) from marketplace.app_moduli where stato = 'attivo'),
    'contatti_nuovi', (select count(*) from marketplace.app_contatti where stato = 'nuovo'),
    'cantieri_gc', (select count(*) from marketplace.app_record r join marketplace.app_org o on o.id = r.org where o.tipo = 'gc' and r.tipo = 'cantiere'),
    'segnalazioni_cantiere', (select count(*) from marketplace.app_record where tipo = 'segnalazione_cliente' and stato in ('', 'aperta')),
    'ordini_richiesti', (select count(*) from marketplace.app_ordini where stato = 'richiesto'),
    'ordini_mese', (select coalesce(sum(prezzo * quantita), 0) from marketplace.app_ordini where stato in ('confermato', 'svolto') and creato > date_trunc('month', now())),
    'vendite_proposte', (select count(*) from marketplace.app_vendite where stato = 'proposta'),
    'provvigioni_maturate', (select coalesce(sum(importo), 0) from marketplace.app_provvigioni where stato = 'maturata'),
    'rivendite_richieste', (select count(*) from marketplace.app_rivendite where stato = 'richiesta'),
    'rete', (select coalesce(jsonb_object_agg(ruolo, n), '{}'::jsonb) from (select ruolo, count(*) n from marketplace.app_rete where stato = 'attivo' group by ruolo) x),
    'gare', (select count(*) from marketplace.app_record where tipo = 'gara'),
    'gare_vinte', (select count(*) from marketplace.app_record where tipo = 'gara' and stato = 'vinta'),
    'lotti_aperti', (select count(*) from marketplace.app_record where tipo = 'lotto' and pubblico and stato = 'aperto'),
    'aziende_sicurezza', (select count(distinct org) from marketplace.app_moduli where stato = 'attivo' and modulo in ('sicurezza', 'pacchetto'))
  );
end;
$$;

-- Admin: trovare un utente dalla mail (per assegnarlo alla rete o a un'azienda).
create or replace function marketplace.app_utente_da_mail(p_email text)
returns uuid language plpgsql stable security definer set search_path = marketplace, public, auth as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  return (select id from auth.users where lower(email) = lower(btrim(p_email)) limit 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- 13. ANALISI DELLE GARE (la usa la funzione gare-analisi: prenota come per i video)
-- ---------------------------------------------------------------------------
-- (riusa app_prenota_analisi della parte 1)

-- ---------------------------------------------------------------------------
-- 14. DOCUMENTI E FOTO DEI MODULI (Storage, bucket privato "documenti")
--     Percorso: <id azienda>/<id scheda>/<nome file>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documenti', 'documenti', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword', 'application/vnd.ms-excel', 'text/plain', 'text/csv'])
on conflict (id) do update set allowed_mime_types = excluded.allowed_mime_types;

create or replace function marketplace.app_file_scheda(p_nome text, p_scrivi boolean)
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  r marketplace.app_record%rowtype;
begin
  if p_nome !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,100}$' then return false; end if;
  select * into r from marketplace.app_record where id::text = split_part(p_nome, '/', 2) and org::text = split_part(p_nome, '/', 1);
  if not found then return false; end if;
  if p_scrivi then return marketplace.app_puo_scrivere(r.org, r.tipo, r.modulo, r.id, r.rif, r.dati); end if;
  return marketplace.app_puo_leggere(r.org, r.tipo, r.modulo, r.id, r.rif, r.dati, r.pubblico);
end;
$$;
grant execute on function marketplace.app_file_scheda(text, boolean) to authenticated;
drop policy if exists app_documenti_leggi on storage.objects;
create policy app_documenti_leggi on storage.objects for select to authenticated using (bucket_id = 'documenti' and marketplace.app_file_scheda(name, false));
drop policy if exists app_documenti_carica on storage.objects;
create policy app_documenti_carica on storage.objects for insert to authenticated with check (bucket_id = 'documenti' and marketplace.app_file_scheda(name, true));

-- ---------------------------------------------------------------------------
-- 14b. BACHECA (vendita, affitto, alloggi per studenti, lavoro) — annunci dei privati e di tutti
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_annunci (
  id uuid primary key default gen_random_uuid(),
  autore uuid not null default auth.uid() references auth.users(id) on delete cascade,
  categoria text not null check (categoria in ('vendita', 'affitto', 'studenti', 'lavoro')),
  titolo text not null check (length(btrim(titolo)) between 3 and 120),
  testo text not null default '' check (length(testo) <= 2000),
  prezzo numeric(12,2) check (prezzo is null or prezzo >= 0),
  citta text not null default '' check (length(citta) <= 80),
  regione text not null default '' check (length(regione) <= 40),
  contatto text not null default '' check (length(contatto) <= 120),
  foto int not null default 0 check (foto between 0 and 6),
  stato text not null default 'pubblicato' check (stato in ('pubblicato', 'nascosto', 'chiuso')),
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
create index if not exists app_annunci_cat_idx on marketplace.app_annunci (categoria, creato desc) where stato = 'pubblicato';
alter table marketplace.app_annunci enable row level security;
create or replace function marketplace.app_annunci_oggi()
returns bigint language sql stable security definer set search_path = marketplace, public as $$
  select count(*) from marketplace.app_annunci where autore = auth.uid() and creato > now() - interval '1 day';
$$;
drop policy if exists app_annunci_leggi on marketplace.app_annunci;
create policy app_annunci_leggi on marketplace.app_annunci for select to authenticated using (stato = 'pubblicato' or autore = auth.uid() or marketplace.is_admin());
drop policy if exists app_annunci_crea on marketplace.app_annunci;
create policy app_annunci_crea on marketplace.app_annunci for insert to authenticated with check (autore = auth.uid() and stato = 'pubblicato' and marketplace.app_annunci_oggi() < 5);
drop policy if exists app_annunci_modifica on marketplace.app_annunci;
create policy app_annunci_modifica on marketplace.app_annunci for update using (autore = auth.uid() or marketplace.is_admin())
  with check ((autore = auth.uid() and stato in ('pubblicato', 'chiuso')) or marketplace.is_admin());
drop policy if exists app_annunci_cancella on marketplace.app_annunci;
create policy app_annunci_cancella on marketplace.app_annunci for delete using (autore = auth.uid() or marketplace.is_admin());
-- Un annuncio nascosto dall'admin resta nascosto: l'autore non lo può ripubblicare da solo.
create or replace function marketplace.app_annunci_controlli()
returns trigger language plpgsql set search_path = marketplace, public as $$
begin
  if current_user in ('authenticated', 'anon') and not marketplace.is_admin() then
    new.autore := old.autore; new.creato := old.creato;
    if old.stato = 'nascosto' then new.stato := 'nascosto'; end if;
  end if;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_annunci_controlli on marketplace.app_annunci;
create trigger app_annunci_controlli before update on marketplace.app_annunci for each row execute function marketplace.app_annunci_controlli();

-- Foto degli annunci: bucket privato "annunci", percorso <id annuncio>/<1..6>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('annunci', 'annunci', false, 3145728, array['image/jpeg'])
on conflict (id) do nothing;
create or replace function marketplace.app_foto_annuncio(p_nome text, p_scrivi boolean)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_annunci a
    where p_nome ~ '^[0-9a-f-]{36}/[1-6]\.jpg$' and a.id::text = split_part(p_nome, '/', 1)
      and (case when p_scrivi then a.autore = auth.uid() else (a.stato = 'pubblicato' or a.autore = auth.uid() or marketplace.is_admin()) end)
  );
$$;
grant execute on function marketplace.app_foto_annuncio(text, boolean) to authenticated;
drop policy if exists app_annunci_foto_leggi on storage.objects;
create policy app_annunci_foto_leggi on storage.objects for select to authenticated using (bucket_id = 'annunci' and marketplace.app_foto_annuncio(name, false));
drop policy if exists app_annunci_foto_carica on storage.objects;
create policy app_annunci_foto_carica on storage.objects for insert to authenticated with check (bucket_id = 'annunci' and marketplace.app_foto_annuncio(name, true));

-- ---------------------------------------------------------------------------
-- 14c. DATE E NOMI DECISI DAL SERVER (non dal telefono)
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_mio_nome()
returns text language sql stable security definer set search_path = marketplace, public as $$
  select left(coalesce((select nome from marketplace.profiles where id = auth.uid()), ''), 80);
$$;
grant execute on function marketplace.app_mio_nome() to authenticated;
-- NB: non security definer, così current_user dice se scrive un utente dall'app.
create or replace function marketplace.app_creato_ora()
returns trigger language plpgsql set search_path = marketplace, public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.creato := now();
    if tg_table_name = 'app_messaggi' then
      new.autore := auth.uid();
      new.nome := marketplace.app_mio_nome();
    end if;
  end if;
  return new;
end;
$$;
do $$
declare t text;
begin
  foreach t in array array['app_annunci', 'app_messaggi', 'app_vendite', 'app_offerte', 'app_rivendite', 'app_inviti', 'app_org'] loop
    execute format('drop trigger if exists app_creato_ora on marketplace.%I', t);
    execute format('create trigger app_creato_ora before insert on marketplace.%I for each row execute function marketplace.app_creato_ora()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 15. PERMESSI
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on marketplace.app_org, marketplace.app_org_membri, marketplace.app_moduli, marketplace.app_accessi,
  marketplace.app_record, marketplace.app_offerte, marketplace.app_messaggi, marketplace.app_inviti, marketplace.app_rete,
  marketplace.app_vendite, marketplace.app_provvigioni, marketplace.app_ordini, marketplace.app_rivendite,
  marketplace.app_recensioni_org, marketplace.app_notifiche, marketplace.app_impostazioni, marketplace.app_annunci to authenticated;
revoke delete on marketplace.app_org, marketplace.app_vendite, marketplace.app_provvigioni, marketplace.app_ordini,
  marketplace.app_rivendite, marketplace.app_recensioni_org, marketplace.app_notifiche, marketplace.app_offerte,
  marketplace.app_messaggi, marketplace.app_inviti, marketplace.app_impostazioni from authenticated;
revoke all on marketplace.app_org, marketplace.app_org_membri, marketplace.app_moduli, marketplace.app_accessi,
  marketplace.app_record, marketplace.app_offerte, marketplace.app_messaggi, marketplace.app_inviti, marketplace.app_rete,
  marketplace.app_vendite, marketplace.app_provvigioni, marketplace.app_ordini, marketplace.app_rivendite,
  marketplace.app_recensioni_org, marketplace.app_notifiche, marketplace.app_impostazioni, marketplace.app_annunci from anon;

-- Colonne che si possono cambiare dal telefono.
revoke update on marketplace.app_inviti, marketplace.app_org_membri, marketplace.app_notifiche, marketplace.app_vendite from authenticated;
grant update (stato) on marketplace.app_inviti, marketplace.app_vendite to authenticated;
grant update (ruolo, nome) on marketplace.app_org_membri to authenticated;
grant update (letto) on marketplace.app_notifiche to authenticated;

do $$
declare f text;
begin
  foreach f in array array['app_modulo_attivo(uuid, text)', 'app_sotto(uuid)', 'app_mio_dipendente(uuid)'] loop
    execute format('revoke all on function marketplace.%s from public, anon, authenticated', f);
  end loop;
  foreach f in array array[
    'app_mio_ruolo(uuid)', 'app_gestisce(uuid)', 'app_puo_offrire(uuid)', 'app_accesso(uuid, uuid)', 'app_ho_accesso_org(uuid)', 'app_registra_ingresso(uuid, text)',
    'app_puo_leggere(uuid, text, text, uuid, uuid, jsonb, boolean)', 'app_puo_scrivere(uuid, text, text, uuid, uuid, jsonb)',
    'app_approva_sal(uuid, boolean, text)', 'app_decidi_offerta(uuid, text)', 'app_puo_invitare(text, uuid, text)',
    'app_apri_invito(text)', 'app_accetta_invito(text)', 'app_nella_mia_rete(uuid)', 'app_firma_accordo()',
    'app_conferma_ordine(uuid)', 'app_recensisci_cantiere(uuid, jsonb, text)', 'app_report_recensioni()',
    'app_miei_profili()', 'app_numeri_admin2()', 'app_org_di(uuid)', 'app_annunci_oggi()', 'app_utente_da_mail(text)', 'app_file_scheda(text, boolean)'
  ] loop
    execute format('revoke all on function marketplace.%s from public, anon', f);
    execute format('grant execute on function marketplace.%s to authenticated', f);
  end loop;
  foreach f in array array['app_notifica(uuid, text, text)', 'app_notifica_gestori(uuid, text, text)', 'app_notifica_admin(text, text)'] loop
    execute format('revoke all on function marketplace.%s from public, anon, authenticated', f);
  end loop;
end $$;

notify pgrst, 'reload schema';
