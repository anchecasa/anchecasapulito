-- =====================================================================
-- Gare private (e-Procurement) nel cruscotto admin · versione completa
--
-- Usa lo schema reale dell'app AncheCasa, non crea un secondo albo:
--   azienda committente  = marketplace.app_org
--   fornitore dell'Albo  = marketplace.app_org con tipo = 'fornitore' e stato = 'attiva'
--   admin di piattaforma = marketplace.is_admin()
--   buyer                = marketplace.app_org_membri.ruolo = 'general_contractor_buyer'
--
-- Contenuto: gare, documenti (SHA-256 + esito AncheBIM), inviti, offerte a busta chiusa,
-- aggiudicazione, registro attività, notifiche in-app, chiusura automatica, Storage privato.
-- Va eseguito dopo app-01 e app-02. È idempotente: si può rieseguire.
-- =====================================================================

do $$
begin
  if to_regclass('marketplace.app_org') is null or to_regclass('marketplace.app_org_membri') is null then
    raise exception 'manca app_org: eseguire prima app-01 e app-02';
  end if;
  if to_regprocedure('marketplace.is_admin()') is null then
    raise exception 'manca marketplace.is_admin()';
  end if;
  if to_regprocedure('marketplace.app_notifica(uuid, text, text)') is null then
    raise exception 'manca marketplace.app_notifica: eseguire prima app-02';
  end if;
end $$;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Ruolo general_contractor_buyer: si AGGIUNGE ai ruoli già ammessi, senza toglierne nessuno
-- ---------------------------------------------------------------------
do $$
declare
  v_nome text;
  v_def text;
begin
  select c.conname, pg_get_constraintdef(c.oid) into v_nome, v_def
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'marketplace' and t.relname = 'app_org_membri' and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%ruolo%'
  limit 1;

  if v_def is null then
    return; -- nessun vincolo sui ruoli: niente da fare
  end if;
  if v_def ilike '%general_contractor_buyer%' then
    return; -- già aggiunto
  end if;

  execute format('alter table marketplace.app_org_membri drop constraint %I', v_nome);
  execute format(
    'alter table marketplace.app_org_membri add constraint %I check ((%s) or ruolo = %L)',
    v_nome,
    regexp_replace(v_def, '^CHECK\s*', ''),
    'general_contractor_buyer'
  );
end $$;

-- ---------------------------------------------------------------------
-- 2. Tabelle
-- ---------------------------------------------------------------------
create sequence if not exists marketplace.app_ep_codice_seq;

create table if not exists marketplace.app_ep_gare (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  codice text unique,
  titolo text not null check (length(btrim(titolo)) between 3 and 180),
  descrizione text not null default '' check (length(descrizione) <= 4000),
  capitolato text not null default '' check (length(capitolato) <= 50000),
  budget numeric(14,2) check (budget is null or budget > 0),
  scadenza timestamptz,
  visibilita text not null default 'inviti' check (visibilita in ('inviti', 'aperta')),
  stato text not null default 'bozza' check (stato in ('bozza', 'pubblicata', 'chiusa', 'aggiudicata', 'annullata')),
  creato_da uuid not null default auth.uid() references auth.users(id),
  pubblicato_il timestamptz,
  chiusa_il timestamptz,
  offerta_vincitrice uuid,
  aggiudicata_il timestamptz,
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);

-- Colonne aggiunte se la tabella esisteva già in una versione precedente
alter table marketplace.app_ep_gare add column if not exists codice text unique;
alter table marketplace.app_ep_gare add column if not exists capitolato text not null default '';
alter table marketplace.app_ep_gare add column if not exists budget numeric(14,2);
alter table marketplace.app_ep_gare add column if not exists visibilita text not null default 'inviti';
alter table marketplace.app_ep_gare add column if not exists chiusa_il timestamptz;
alter table marketplace.app_ep_gare add column if not exists offerta_vincitrice uuid;
alter table marketplace.app_ep_gare add column if not exists aggiudicata_il timestamptz;
alter table marketplace.app_ep_gare add column if not exists aggiornato timestamptz not null default now();
alter table marketplace.app_ep_gare drop constraint if exists app_ep_gare_stato_check;
alter table marketplace.app_ep_gare add constraint app_ep_gare_stato_check
  check (stato in ('bozza', 'pubblicata', 'chiusa', 'aggiudicata', 'annullata'));

create index if not exists app_ep_gare_org_idx on marketplace.app_ep_gare (org, creato desc);
create index if not exists app_ep_gare_aperte_idx on marketplace.app_ep_gare (scadenza) where stato = 'pubblicata';

create table if not exists marketplace.app_ep_documenti (
  id uuid primary key default gen_random_uuid(),
  gara uuid not null references marketplace.app_ep_gare(id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 180),
  percorso text not null unique check (length(percorso) <= 300),
  mime text not null default 'application/octet-stream' check (length(mime) <= 120),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  byte bigint not null check (byte > 0 and byte <= 31457280),
  esito text not null default 'in_verifica' check (esito in ('in_verifica', 'verificato', 'avvisi', 'respinto')),
  esito_bim jsonb,
  certificato text,
  verificato_il timestamptz,
  caricato_da uuid not null default auth.uid() references auth.users(id),
  creato timestamptz not null default now()
);

alter table marketplace.app_ep_documenti add column if not exists mime text not null default 'application/octet-stream';
alter table marketplace.app_ep_documenti add column if not exists esito text not null default 'in_verifica';
alter table marketplace.app_ep_documenti add column if not exists certificato text;
alter table marketplace.app_ep_documenti add column if not exists verificato_il timestamptz;
alter table marketplace.app_ep_documenti add column if not exists caricato_da uuid default auth.uid() references auth.users(id);

create index if not exists app_ep_documenti_gara_idx on marketplace.app_ep_documenti (gara);

create table if not exists marketplace.app_ep_inviti (
  gara uuid not null references marketplace.app_ep_gare(id) on delete cascade,
  fornitore uuid not null references marketplace.app_org(id) on delete cascade,
  stato text not null default 'invitato' check (stato in ('invitato', 'visto', 'rinuncia', 'offerta')),
  invitato_da uuid default auth.uid() references auth.users(id),
  risposto_il timestamptz,
  creato timestamptz not null default now(),
  primary key (gara, fornitore)
);

alter table marketplace.app_ep_inviti add column if not exists stato text not null default 'invitato';
alter table marketplace.app_ep_inviti add column if not exists invitato_da uuid default auth.uid() references auth.users(id);
alter table marketplace.app_ep_inviti add column if not exists risposto_il timestamptz;

create index if not exists app_ep_inviti_fornitore_idx on marketplace.app_ep_inviti (fornitore);

create table if not exists marketplace.app_ep_offerte (
  id uuid primary key default gen_random_uuid(),
  gara uuid not null references marketplace.app_ep_gare(id) on delete cascade,
  fornitore uuid not null references marketplace.app_org(id) on delete cascade,
  importo numeric(14,2) not null check (importo > 0),
  note text not null default '' check (length(note) <= 5000),
  inviata_da uuid not null default auth.uid() references auth.users(id),
  inviata_il timestamptz not null default now(),
  unique (gara, fornitore)
);

alter table marketplace.app_ep_gare drop constraint if exists app_ep_gare_vincitrice_fkey;
alter table marketplace.app_ep_gare add constraint app_ep_gare_vincitrice_fkey
  foreign key (offerta_vincitrice) references marketplace.app_ep_offerte(id) on delete set null;

create table if not exists marketplace.app_ep_eventi (
  id bigint generated always as identity primary key,
  gara uuid not null references marketplace.app_ep_gare(id) on delete cascade,
  utente uuid default auth.uid(),
  evento text not null,
  dati jsonb not null default '{}'::jsonb,
  creato timestamptz not null default now()
);
create index if not exists app_ep_eventi_gara_idx on marketplace.app_ep_eventi (gara, creato desc);

-- ---------------------------------------------------------------------
-- 3. Chi può fare cosa (security definer: niente ricorsioni RLS)
-- ---------------------------------------------------------------------

-- Chi gestisce le gare di un'azienda: admin di piattaforma o buyer di quell'azienda
create or replace function marketplace.app_ep_gestisce(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or exists (
    select 1 from marketplace.app_org_membri m
    join marketplace.app_org o on o.id = m.org
    where m.org = p_org and m.utente = auth.uid()
      and m.ruolo = 'general_contractor_buyer' and o.stato = 'attiva'
  );
$$;

-- Chi è dentro un fornitore attivo dell'Albo (qualsiasi ruolo: può leggere)
create or replace function marketplace.app_ep_nel_fornitore(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_org_membri m
    join marketplace.app_org o on o.id = m.org
    where m.org = p_org and m.utente = auth.uid() and o.tipo = 'fornitore' and o.stato = 'attiva'
  );
$$;

-- Chi può firmare un'offerta per il fornitore: titolare o responsabile
create or replace function marketplace.app_ep_firma_fornitore(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_org_membri m
    join marketplace.app_org o on o.id = m.org
    where m.org = p_org and m.utente = auth.uid() and o.tipo = 'fornitore' and o.stato = 'attiva'
      and m.ruolo in ('titolare', 'responsabile')
  );
$$;

-- Il fornitore (org) può vedere la gara?
create or replace function marketplace.app_ep_fornitore_vede(p_gara uuid, p_fornitore uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_ep_gare g
    join marketplace.app_org o on o.id = p_fornitore and o.tipo = 'fornitore' and o.stato = 'attiva'
    where g.id = p_gara
      and g.stato in ('pubblicata', 'chiusa', 'aggiudicata', 'annullata')
      and (
        g.visibilita = 'aperta'
        or exists (select 1 from marketplace.app_ep_inviti i where i.gara = g.id and i.fornitore = p_fornitore)
      )
  );
$$;

-- L'utente corrente (come membro di un qualsiasi fornitore) può vedere la gara?
create or replace function marketplace.app_ep_vede(p_gara uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_org_membri m
    where m.utente = auth.uid() and marketplace.app_ep_fornitore_vede(p_gara, m.org)
  );
$$;

create or replace function marketplace.app_ep_gestisce_gara(p_gara uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.app_ep_gare g where g.id = p_gara and marketplace.app_ep_gestisce(g.org));
$$;

-- Notifiche in-app (usa marketplace.app_notifiche già esistente)
create or replace function marketplace.app_ep_notifica_fornitore(p_org uuid, p_testo text, p_link text)
returns void language sql security definer set search_path = marketplace, public as $$
  insert into marketplace.app_notifiche (utente, testo, link)
  select m.utente, left(p_testo, 200), left(p_link, 120)
  from marketplace.app_org_membri m where m.org = p_org and m.ruolo in ('titolare', 'responsabile');
$$;

create or replace function marketplace.app_ep_notifica_buyer(p_gara uuid, p_testo text)
returns void language sql security definer set search_path = marketplace, public as $$
  insert into marketplace.app_notifiche (utente, testo, link)
  select distinct u, left(p_testo, 200), left('/admin/e-procurement/' || p_gara, 120)
  from (
    select g.creato_da as u from marketplace.app_ep_gare g where g.id = p_gara
    union
    select m.utente from marketplace.app_ep_gare g
    join marketplace.app_org_membri m on m.org = g.org and m.ruolo = 'general_contractor_buyer'
    where g.id = p_gara
  ) x where u is not null;
$$;

-- ---------------------------------------------------------------------
-- 4. Regole della gara (trigger)
-- ---------------------------------------------------------------------
create or replace function marketplace.app_ep_gare_regole()
returns trigger language plpgsql set search_path = marketplace, public as $$
declare
  v_chiusura boolean := false;
begin
  if tg_op = 'INSERT' then
    new.stato := 'bozza';
    new.pubblicato_il := null;
    new.chiusa_il := null;
    new.offerta_vincitrice := null;
    new.aggiudicata_il := null;
    new.codice := 'GARA-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('marketplace.app_ep_codice_seq')::text, 5, '0');
    new.creato := now();
    new.aggiornato := now();
    return new;
  end if;

  new.aggiornato := now();

  if new.org is distinct from old.org or new.creato_da is distinct from old.creato_da
     or new.codice is distinct from old.codice or new.creato is distinct from old.creato then
    raise exception 'Azienda, autore e codice della gara non si cambiano' using errcode = '42501';
  end if;

  if new.stato is distinct from old.stato then
    if not (
         (old.stato = 'bozza'      and new.stato in ('pubblicata', 'annullata'))
      or (old.stato = 'pubblicata' and new.stato in ('chiusa', 'annullata'))
      or (old.stato = 'chiusa'     and new.stato in ('aggiudicata', 'annullata'))
    ) then
      raise exception 'Passaggio di stato non ammesso: % → %', old.stato, new.stato using errcode = '22023';
    end if;

    if new.stato = 'pubblicata' then
      if new.scadenza is null or new.scadenza <= now() + interval '1 hour' then
        raise exception 'Per pubblicare serve una scadenza ad almeno un''ora da adesso' using errcode = '22023';
      end if;
      if new.visibilita = 'inviti' and not exists (select 1 from marketplace.app_ep_inviti i where i.gara = new.id) then
        raise exception 'Una gara su invito richiede almeno un fornitore invitato' using errcode = '22023';
      end if;
      if exists (select 1 from marketplace.app_ep_documenti d where d.gara = new.id and d.esito = 'respinto') then
        raise exception 'Togli i documenti respinti prima di pubblicare' using errcode = '22023';
      end if;
      new.pubblicato_il := now();

    elsif new.stato = 'chiusa' then
      -- La chiusura, anche anticipata, termina la finestra offerte e apre le buste
      new.chiusa_il := now();
      new.scadenza := least(old.scadenza, now());
      v_chiusura := true;

    elsif new.stato = 'aggiudicata' then
      if new.offerta_vincitrice is null or not exists (
        select 1 from marketplace.app_ep_offerte o where o.id = new.offerta_vincitrice and o.gara = new.id
      ) then
        raise exception 'Scegli l''offerta da aggiudicare' using errcode = '22023';
      end if;
      new.aggiudicata_il := now();
    end if;
  end if;

  if new.offerta_vincitrice is distinct from old.offerta_vincitrice
     and not (old.stato = 'chiusa' and new.stato = 'aggiudicata') then
    raise exception 'L''offerta vincitrice si sceglie solo aggiudicando una gara chiusa' using errcode = '22023';
  end if;

  -- Dopo la pubblicazione il bando non si modifica: si può solo prorogare
  if old.stato <> 'bozza' then
    if (new.titolo, new.descrizione, new.capitolato, new.budget, new.visibilita)
       is distinct from (old.titolo, old.descrizione, old.capitolato, old.budget, old.visibilita) then
      raise exception 'Una gara pubblicata non si modifica: si può solo prorogare la scadenza' using errcode = '42501';
    end if;
    if not v_chiusura and new.scadenza is distinct from old.scadenza then
      if old.stato <> 'pubblicata' then
        raise exception 'La scadenza di una gara conclusa non si cambia' using errcode = '22023';
      end if;
      if new.scadenza is null or new.scadenza < old.scadenza then
        raise exception 'La scadenza si può solo prorogare' using errcode = '22023';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists app_ep_gare_regole on marketplace.app_ep_gare;
create trigger app_ep_gare_regole before insert or update on marketplace.app_ep_gare
  for each row execute function marketplace.app_ep_gare_regole();

-- Esito AncheBIM: lo scrive solo il server (service_role). Impronta e percorso non cambiano.
create or replace function marketplace.app_ep_documenti_regole()
returns trigger language plpgsql set search_path = marketplace, public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.esito := 'in_verifica';
      new.esito_bim := null;
      new.certificato := null;
      new.verificato_il := null;
      new.caricato_da := auth.uid();
    else
      new.esito := old.esito;
      new.esito_bim := old.esito_bim;
      new.certificato := old.certificato;
      new.verificato_il := old.verificato_il;
    end if;
  end if;
  if tg_op = 'UPDATE' and (new.sha256, new.percorso, new.gara, new.byte) is distinct from (old.sha256, old.percorso, old.gara, old.byte) then
    raise exception 'Impronta, percorso e dimensione di un documento non si cambiano' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists app_ep_documenti_regole on marketplace.app_ep_documenti;
create trigger app_ep_documenti_regole before insert or update on marketplace.app_ep_documenti
  for each row execute function marketplace.app_ep_documenti_regole();

-- Inviti: il fornitore segna solo "visto" o "rinuncia"; "offerta" la mette il sistema
create or replace function marketplace.app_ep_inviti_regole()
returns trigger language plpgsql set search_path = marketplace, public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.stato := 'invitato';
      new.risposto_il := null;
      new.invitato_da := auth.uid();
    elsif new.stato is distinct from old.stato then
      if old.stato = 'offerta' then
        raise exception 'Offerta già presentata: l''invito non cambia' using errcode = '22023';
      end if;
      if new.stato not in ('visto', 'rinuncia') then
        raise exception 'Risposta all''invito non valida' using errcode = '22023';
      end if;
      if old.stato = 'rinuncia' and new.stato = 'visto' then
        new.stato := 'rinuncia';
      end if;
      new.risposto_il := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists app_ep_inviti_regole on marketplace.app_ep_inviti;
create trigger app_ep_inviti_regole before insert or update on marketplace.app_ep_inviti
  for each row execute function marketplace.app_ep_inviti_regole();

-- Offerte: data e autore li mette il sistema; dopo l'invio l'invito passa a "offerta"
create or replace function marketplace.app_ep_offerte_regole()
returns trigger language plpgsql set search_path = marketplace, public as $$
begin
  if tg_op = 'UPDATE' and (new.gara, new.fornitore) is distinct from (old.gara, old.fornitore) then
    raise exception 'Gara e fornitore di un''offerta non si cambiano' using errcode = '42501';
  end if;
  new.inviata_il := now();
  new.inviata_da := coalesce(auth.uid(), new.inviata_da);
  return new;
end;
$$;

drop trigger if exists app_ep_offerte_regole on marketplace.app_ep_offerte;
create trigger app_ep_offerte_regole before insert or update on marketplace.app_ep_offerte
  for each row execute function marketplace.app_ep_offerte_regole();

create or replace function marketplace.app_ep_offerte_dopo()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_titolo text;
begin
  insert into marketplace.app_ep_inviti (gara, fornitore, stato, invitato_da, risposto_il)
  values (new.gara, new.fornitore, 'offerta', new.inviata_da, now())
  on conflict (gara, fornitore) do update set stato = 'offerta', risposto_il = now();

  if tg_op = 'INSERT' then
    select titolo into v_titolo from marketplace.app_ep_gare where id = new.gara;
    perform marketplace.app_ep_notifica_buyer(new.gara, 'Nuova offerta ricevuta (busta chiusa): ' || v_titolo);
  end if;
  return new;
end;
$$;

drop trigger if exists app_ep_offerte_dopo on marketplace.app_ep_offerte;
create trigger app_ep_offerte_dopo after insert on marketplace.app_ep_offerte
  for each row execute function marketplace.app_ep_offerte_dopo();

-- ---------------------------------------------------------------------
-- 5. Registro attività e notifiche
-- ---------------------------------------------------------------------
create or replace function marketplace.app_ep_registro()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_link text;
  r record;
begin
  if tg_table_name = 'app_ep_gare' then
    v_link := '/fornitore/gare/' || new.id;
    if tg_op = 'INSERT' then
      insert into app_ep_eventi (gara, evento, dati) values (new.id, 'creata', jsonb_build_object('titolo', new.titolo));
      return new;
    end if;

    if new.stato is distinct from old.stato then
      insert into app_ep_eventi (gara, evento, dati)
      values (new.id, 'stato_' || new.stato, jsonb_build_object('da', old.stato, 'offerta', new.offerta_vincitrice));

      if new.stato = 'pubblicata' then
        for r in select fornitore from app_ep_inviti where gara = new.id loop
          perform app_ep_notifica_fornitore(r.fornitore, 'Sei invitato a una gara privata: ' || new.titolo, v_link);
        end loop;
      elsif new.stato = 'chiusa' then
        perform app_ep_notifica_buyer(new.id, 'Gara chiusa, buste aperte: ' || new.titolo);
      elsif new.stato = 'aggiudicata' then
        for r in select o.fornitore, (o.id = new.offerta_vincitrice) as vince from app_ep_offerte o where o.gara = new.id loop
          perform app_ep_notifica_fornitore(
            r.fornitore,
            case when r.vince then 'La tua offerta è stata aggiudicata: ' else 'Gara aggiudicata ad altro fornitore: ' end || new.titolo,
            v_link
          );
        end loop;
      elsif new.stato = 'annullata' and old.stato <> 'bozza' then
        for r in select fornitore from app_ep_inviti where gara = new.id loop
          perform app_ep_notifica_fornitore(r.fornitore, 'Gara annullata: ' || new.titolo, v_link);
        end loop;
      end if;
    end if;

    if new.scadenza is distinct from old.scadenza and new.stato = old.stato then
      insert into app_ep_eventi (gara, evento, dati)
      values (new.id, 'scadenza_prorogata', jsonb_build_object('da', old.scadenza, 'a', new.scadenza));
      if new.stato = 'pubblicata' then
        for r in select fornitore from app_ep_inviti where gara = new.id and stato <> 'rinuncia' loop
          perform app_ep_notifica_fornitore(r.fornitore, 'Scadenza prorogata: ' || new.titolo, v_link);
        end loop;
      end if;
    end if;

    if old.stato = 'bozza' and new.stato = 'bozza'
       and (new.titolo, new.descrizione, new.capitolato, new.budget, new.visibilita, new.scadenza)
           is distinct from (old.titolo, old.descrizione, old.capitolato, old.budget, old.visibilita, old.scadenza) then
      insert into app_ep_eventi (gara, evento) values (new.id, 'bozza_modificata');
    end if;
    return new;
  end if;

  if tg_table_name = 'app_ep_inviti' then
    if tg_op = 'INSERT' then
      insert into app_ep_eventi (gara, evento, dati)
      values (new.gara, case when new.stato = 'offerta' then 'fornitore_partecipa' else 'fornitore_invitato' end,
              jsonb_build_object('fornitore', new.fornitore));
      if new.stato = 'invitato' and exists (select 1 from app_ep_gare g where g.id = new.gara and g.stato = 'pubblicata') then
        perform app_ep_notifica_fornitore(new.fornitore,
          'Sei invitato a una gara privata: ' || (select titolo from app_ep_gare where id = new.gara),
          '/fornitore/gare/' || new.gara);
      end if;
    elsif tg_op = 'UPDATE' and new.stato is distinct from old.stato then
      insert into app_ep_eventi (gara, evento, dati)
      values (new.gara, 'invito_' || new.stato, jsonb_build_object('fornitore', new.fornitore));
    elsif tg_op = 'DELETE' and exists (select 1 from app_ep_gare where id = old.gara) then
      insert into app_ep_eventi (gara, evento, dati)
      values (old.gara, 'invito_tolto', jsonb_build_object('fornitore', old.fornitore));
    end if;
    return coalesce(new, old);
  end if;

  if tg_table_name = 'app_ep_documenti' then
    if tg_op = 'INSERT' then
      insert into app_ep_eventi (gara, evento, dati)
      values (new.gara, 'documento_caricato', jsonb_build_object('nome', new.nome, 'sha256', new.sha256));
    elsif tg_op = 'UPDATE' and new.esito is distinct from old.esito then
      insert into app_ep_eventi (gara, utente, evento, dati)
      values (new.gara, null, 'documento_' || new.esito, jsonb_build_object('nome', new.nome, 'certificato', new.certificato));
    elsif tg_op = 'DELETE' and exists (select 1 from app_ep_gare where id = old.gara) then
      insert into app_ep_eventi (gara, evento, dati) values (old.gara, 'documento_tolto', jsonb_build_object('nome', old.nome));
    end if;
    return coalesce(new, old);
  end if;

  if tg_table_name = 'app_ep_offerte' then
    -- l'importo NON va nel registro: resterebbe leggibile prima dell'apertura delle buste
    insert into app_ep_eventi (gara, evento, dati)
    values (new.gara, case when tg_op = 'INSERT' then 'offerta_ricevuta' else 'offerta_aggiornata' end,
            jsonb_build_object('fornitore', new.fornitore));
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists app_ep_registro on marketplace.app_ep_gare;
create trigger app_ep_registro after insert or update on marketplace.app_ep_gare
  for each row execute function marketplace.app_ep_registro();
drop trigger if exists app_ep_registro on marketplace.app_ep_inviti;
create trigger app_ep_registro after insert or update or delete on marketplace.app_ep_inviti
  for each row execute function marketplace.app_ep_registro();
drop trigger if exists app_ep_registro on marketplace.app_ep_documenti;
create trigger app_ep_registro after insert or update or delete on marketplace.app_ep_documenti
  for each row execute function marketplace.app_ep_registro();
drop trigger if exists app_ep_registro on marketplace.app_ep_offerte;
create trigger app_ep_registro after insert or update on marketplace.app_ep_offerte
  for each row execute function marketplace.app_ep_registro();

-- ---------------------------------------------------------------------
-- 6. Funzioni di lettura per le pagine
-- ---------------------------------------------------------------------

-- Albo fornitori per chi gestisce almeno un'azienda
create or replace function marketplace.app_ep_albo()
returns table (id uuid, nome text, piva text, citta text, regione text)
language sql stable security definer set search_path = marketplace, public as $$
  select o.id, o.nome, o.piva, o.citta, o.regione
  from marketplace.app_org o
  where o.tipo = 'fornitore' and o.stato = 'attiva'
    and (
      marketplace.is_admin()
      or exists (select 1 from marketplace.app_org_membri m where m.utente = auth.uid() and m.ruolo = 'general_contractor_buyer')
    )
  order by o.nome
  limit 2000;
$$;

-- Riepilogo gare per il committente (conteggi senza importi)
create or replace function marketplace.app_ep_riepilogo(p_org uuid)
returns table (
  id uuid, codice text, titolo text, stato text, visibilita text, budget numeric, scadenza timestamptz,
  pubblicato_il timestamptz, creato timestamptz, invitati int, offerte int, documenti int, verificati int
)
language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  if not marketplace.app_ep_gestisce(p_org) then
    raise exception 'Accesso negato' using errcode = '42501';
  end if;
  return query
  select g.id, g.codice, g.titolo, g.stato, g.visibilita, g.budget, g.scadenza, g.pubblicato_il, g.creato,
    (select count(*)::int from marketplace.app_ep_inviti i where i.gara = g.id),
    (select count(*)::int from marketplace.app_ep_offerte o where o.gara = g.id),
    (select count(*)::int from marketplace.app_ep_documenti d where d.gara = g.id),
    (select count(*)::int from marketplace.app_ep_documenti d where d.gara = g.id and d.esito = 'verificato')
  from marketplace.app_ep_gare g
  where g.org = p_org
  order by g.creato desc
  limit 500;
end;
$$;

-- Gare visibili al fornitore corrente, con nome del committente e stato del suo invito
create or replace function marketplace.app_ep_mie_gare()
returns table (
  id uuid, codice text, titolo text, stato text, visibilita text, budget numeric, scadenza timestamptz,
  committente text, fornitore uuid, fornitore_nome text, mio_stato text, ho_offerto boolean, vinta boolean
)
language sql stable security definer set search_path = marketplace, public as $$
  select distinct on (g.id)
    g.id, g.codice, g.titolo, g.stato, g.visibilita, g.budget, g.scadenza,
    c.nome, f.id, f.nome,
    coalesce(i.stato, 'aperta'),
    exists (select 1 from marketplace.app_ep_offerte o where o.gara = g.id and o.fornitore = f.id),
    exists (select 1 from marketplace.app_ep_offerte o where o.gara = g.id and o.fornitore = f.id and o.id = g.offerta_vincitrice)
  from marketplace.app_org_membri m
  join marketplace.app_org f on f.id = m.org and f.tipo = 'fornitore' and f.stato = 'attiva'
  join marketplace.app_ep_gare g on marketplace.app_ep_fornitore_vede(g.id, f.id)
  join marketplace.app_org c on c.id = g.org
  left join marketplace.app_ep_inviti i on i.gara = g.id and i.fornitore = f.id
  where m.utente = auth.uid()
  order by g.id, (i.stato is null), f.nome;
$$;

-- Chiude le gare scadute. Innocua: chiude solo ciò che è già scaduto.
-- La chiamano pg_cron (se attivo) e le pagine a ogni apertura.
create or replace function marketplace.app_ep_chiudi_scadute()
returns integer language plpgsql security definer set search_path = marketplace, public as $$
declare
  n integer;
begin
  update marketplace.app_ep_gare set stato = 'chiusa' where stato = 'pubblicata' and scadenza <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------
alter table marketplace.app_ep_gare enable row level security;
alter table marketplace.app_ep_documenti enable row level security;
alter table marketplace.app_ep_inviti enable row level security;
alter table marketplace.app_ep_offerte enable row level security;
alter table marketplace.app_ep_eventi enable row level security;

-- Politiche della versione precedente
drop policy if exists app_ep_gare_gestione on marketplace.app_ep_gare;
drop policy if exists app_ep_gare_fornitore on marketplace.app_ep_gare;
drop policy if exists app_ep_documenti_gestione on marketplace.app_ep_documenti;
drop policy if exists app_ep_documenti_fornitore on marketplace.app_ep_documenti;
drop policy if exists app_ep_inviti_gestione on marketplace.app_ep_inviti;

-- Gare
drop policy if exists app_ep_gare_leggi on marketplace.app_ep_gare;
create policy app_ep_gare_leggi on marketplace.app_ep_gare for select to authenticated
  using (marketplace.app_ep_gestisce(org) or marketplace.app_ep_vede(id));
drop policy if exists app_ep_gare_crea on marketplace.app_ep_gare;
create policy app_ep_gare_crea on marketplace.app_ep_gare for insert to authenticated
  with check (marketplace.app_ep_gestisce(org) and creato_da = auth.uid());
drop policy if exists app_ep_gare_modifica on marketplace.app_ep_gare;
create policy app_ep_gare_modifica on marketplace.app_ep_gare for update to authenticated
  using (marketplace.app_ep_gestisce(org)) with check (marketplace.app_ep_gestisce(org));
drop policy if exists app_ep_gare_elimina on marketplace.app_ep_gare;
create policy app_ep_gare_elimina on marketplace.app_ep_gare for delete to authenticated
  using (marketplace.app_ep_gestisce(org) and stato = 'bozza');

-- Documenti
drop policy if exists app_ep_documenti_leggi on marketplace.app_ep_documenti;
create policy app_ep_documenti_leggi on marketplace.app_ep_documenti for select to authenticated
  using (marketplace.app_ep_gestisce_gara(gara) or marketplace.app_ep_vede(gara));
drop policy if exists app_ep_documenti_crea on marketplace.app_ep_documenti;
create policy app_ep_documenti_crea on marketplace.app_ep_documenti for insert to authenticated
  with check (exists (
    select 1 from marketplace.app_ep_gare g
    where g.id = gara and g.stato in ('bozza', 'pubblicata') and marketplace.app_ep_gestisce(g.org)
  ));
drop policy if exists app_ep_documenti_elimina on marketplace.app_ep_documenti;
create policy app_ep_documenti_elimina on marketplace.app_ep_documenti for delete to authenticated
  using (exists (
    select 1 from marketplace.app_ep_gare g
    where g.id = gara and g.stato = 'bozza' and marketplace.app_ep_gestisce(g.org)
  ));

-- Inviti
drop policy if exists app_ep_inviti_leggi on marketplace.app_ep_inviti;
create policy app_ep_inviti_leggi on marketplace.app_ep_inviti for select to authenticated
  using (marketplace.app_ep_gestisce_gara(gara) or (marketplace.app_ep_nel_fornitore(fornitore) and marketplace.app_ep_vede(gara)));
drop policy if exists app_ep_inviti_crea on marketplace.app_ep_inviti;
create policy app_ep_inviti_crea on marketplace.app_ep_inviti for insert to authenticated
  with check (
    exists (select 1 from marketplace.app_ep_gare g
            where g.id = gara and g.stato in ('bozza', 'pubblicata') and marketplace.app_ep_gestisce(g.org))
    and exists (select 1 from marketplace.app_org o where o.id = fornitore and o.tipo = 'fornitore' and o.stato = 'attiva')
  );
drop policy if exists app_ep_inviti_elimina on marketplace.app_ep_inviti;
create policy app_ep_inviti_elimina on marketplace.app_ep_inviti for delete to authenticated
  using (exists (select 1 from marketplace.app_ep_gare g where g.id = gara and g.stato = 'bozza' and marketplace.app_ep_gestisce(g.org)));
drop policy if exists app_ep_inviti_risposta on marketplace.app_ep_inviti;
create policy app_ep_inviti_risposta on marketplace.app_ep_inviti for update to authenticated
  using (marketplace.app_ep_firma_fornitore(fornitore) and marketplace.app_ep_vede(gara))
  with check (marketplace.app_ep_firma_fornitore(fornitore));

-- Offerte: busta chiusa. Il committente le legge solo dopo la scadenza o la chiusura.
drop policy if exists app_ep_offerte_leggi on marketplace.app_ep_offerte;
create policy app_ep_offerte_leggi on marketplace.app_ep_offerte for select to authenticated
  using (
    marketplace.app_ep_nel_fornitore(fornitore)
    or exists (
      select 1 from marketplace.app_ep_gare g
      where g.id = gara and marketplace.app_ep_gestisce(g.org)
        and (g.stato in ('chiusa', 'aggiudicata', 'annullata') or g.scadenza <= now())
    )
  );
drop policy if exists app_ep_offerte_invia on marketplace.app_ep_offerte;
create policy app_ep_offerte_invia on marketplace.app_ep_offerte for insert to authenticated
  with check (
    marketplace.app_ep_firma_fornitore(fornitore)
    and marketplace.app_ep_fornitore_vede(gara, fornitore)
    and not exists (select 1 from marketplace.app_ep_inviti i
                    where i.gara = app_ep_offerte.gara and i.fornitore = app_ep_offerte.fornitore and i.stato = 'rinuncia')
    and exists (select 1 from marketplace.app_ep_gare g where g.id = gara and g.stato = 'pubblicata' and g.scadenza > now())
  );
drop policy if exists app_ep_offerte_aggiorna on marketplace.app_ep_offerte;
create policy app_ep_offerte_aggiorna on marketplace.app_ep_offerte for update to authenticated
  using (
    marketplace.app_ep_firma_fornitore(fornitore)
    and exists (select 1 from marketplace.app_ep_gare g where g.id = gara and g.stato = 'pubblicata' and g.scadenza > now())
  )
  with check (marketplace.app_ep_firma_fornitore(fornitore));

-- Registro: solo chi gestisce la gara, in sola lettura
drop policy if exists app_ep_eventi_leggi on marketplace.app_ep_eventi;
create policy app_ep_eventi_leggi on marketplace.app_ep_eventi for select to authenticated
  using (marketplace.app_ep_gestisce_gara(gara));

-- ---------------------------------------------------------------------
-- 8. Permessi (lo schema marketplace non li dà in automatico)
-- ---------------------------------------------------------------------
grant select, insert, update, delete on marketplace.app_ep_gare, marketplace.app_ep_documenti, marketplace.app_ep_inviti to authenticated;
grant select, insert on marketplace.app_ep_offerte to authenticated;
grant select on marketplace.app_ep_eventi to authenticated;
revoke all on marketplace.app_ep_gare, marketplace.app_ep_documenti, marketplace.app_ep_inviti,
  marketplace.app_ep_offerte, marketplace.app_ep_eventi from anon;
revoke update on marketplace.app_ep_inviti, marketplace.app_ep_offerte from authenticated;
grant update (stato) on marketplace.app_ep_inviti to authenticated;
grant update (importo, note) on marketplace.app_ep_offerte to authenticated;
revoke update on marketplace.app_ep_documenti from authenticated; -- l'esito lo scrive solo il server
grant usage on sequence marketplace.app_ep_codice_seq to authenticated;
grant all on marketplace.app_ep_gare, marketplace.app_ep_documenti, marketplace.app_ep_inviti,
  marketplace.app_ep_offerte, marketplace.app_ep_eventi to service_role;

do $$
declare f text;
begin
  -- funzioni interne: nessuno le chiama dall'app
  foreach f in array array[
    'app_ep_notifica_fornitore(uuid, text, text)', 'app_ep_notifica_buyer(uuid, text)'
  ] loop
    execute format('revoke all on function marketplace.%s from public, anon, authenticated', f);
  end loop;
  -- funzioni usabili da utenti autenticati
  foreach f in array array[
    'app_ep_gestisce(uuid)', 'app_ep_nel_fornitore(uuid)', 'app_ep_firma_fornitore(uuid)',
    'app_ep_fornitore_vede(uuid, uuid)', 'app_ep_vede(uuid)', 'app_ep_gestisce_gara(uuid)',
    'app_ep_albo()', 'app_ep_riepilogo(uuid)', 'app_ep_mie_gare()', 'app_ep_chiudi_scadute()'
  ] loop
    execute format('revoke all on function marketplace.%s from public, anon', f);
    execute format('grant execute on function marketplace.%s to authenticated', f);
  end loop;
end $$;

-- Funzioni della versione precedente (nomi generici nello schema condiviso): non servono più
drop function if exists marketplace.app_ep_leggo_file(text, boolean) cascade;
drop function if exists marketplace.can_supplier_view_tender(uuid) cascade;
drop function if exists marketplace.is_supplier_member(uuid) cascade;
drop function if exists marketplace.has_tenant_role(uuid, text[]) cascade;

-- ---------------------------------------------------------------------
-- 9. Storage: bucket privato, percorso {gara}/{sha256}-{nome}
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('e-procurement', 'e-procurement', false, 31457280, null)
on conflict (id) do update set public = false, file_size_limit = 31457280, allowed_mime_types = null;

create or replace function marketplace.app_ep_file(p_nome text, p_azione text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_ep_gare g
    where p_nome ~ '^[0-9a-f-]{36}/[0-9a-f]{64}-'
      and g.id::text = split_part(p_nome, '/', 1)
      and case p_azione
        when 'carica' then g.stato in ('bozza', 'pubblicata') and marketplace.app_ep_gestisce(g.org)
        when 'togli'  then g.stato = 'bozza' and marketplace.app_ep_gestisce(g.org)
        else marketplace.app_ep_gestisce(g.org) or marketplace.app_ep_vede(g.id)
      end
  );
$$;
revoke all on function marketplace.app_ep_file(text, text) from public, anon;
grant execute on function marketplace.app_ep_file(text, text) to authenticated;

drop policy if exists app_ep_file_leggi on storage.objects;
create policy app_ep_file_leggi on storage.objects for select to authenticated
  using (bucket_id = 'e-procurement' and marketplace.app_ep_file(name, 'leggi'));
drop policy if exists app_ep_file_carica on storage.objects;
create policy app_ep_file_carica on storage.objects for insert to authenticated
  with check (bucket_id = 'e-procurement' and marketplace.app_ep_file(name, 'carica'));
drop policy if exists app_ep_file_togli on storage.objects;
create policy app_ep_file_togli on storage.objects for delete to authenticated
  using (bucket_id = 'e-procurement' and marketplace.app_ep_file(name, 'togli'));

-- ---------------------------------------------------------------------
-- 10. Chiusura automatica ogni 5 minuti (se pg_cron è attivo)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('anchecasa-ep-chiudi-scadute', '*/5 * * * *', 'select marketplace.app_ep_chiudi_scadute()');
  else
    raise notice 'pg_cron non attivo: le gare scadute si chiudono comunque all''apertura delle pagine';
  end if;
exception when others then
  raise notice 'pianificazione pg_cron non riuscita: %', sqlerrm;
end $$;

notify pgrst, 'reload schema';
