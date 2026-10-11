-- ============================================================================
-- APP ANCHECASA · ISCRIZIONE, PROFILI E PULSANTI
-- Dopo app-13. Si può rilanciare. Non va eseguito da qui sul Supabase vero:
-- lo lancia Nando nell'SQL Editor, dopo l'ok.
-- Tre categorie: privato, azienda, fornitore. Si entra subito.
-- I dati si chiedono quando servono. La percentuale la calcola il database.
-- ============================================================================

-- Fornitore c'è già in app_ruoli. Non si toglie nessun ruolo.

-- ---------------------------------------------------------------------------
-- Organizzazione: verifica, ATECO, zone, modo del fornitore
-- ---------------------------------------------------------------------------
alter table marketplace.app_org add column if not exists stato_verifica text not null default 'da_verificare';
alter table marketplace.app_org drop constraint if exists app_org_stato_verifica_check;
alter table marketplace.app_org add constraint app_org_stato_verifica_check
  check (stato_verifica in ('da_verificare', 'verificata', 'sospesa'));
alter table marketplace.app_org add column if not exists verificata_il timestamptz;
alter table marketplace.app_org add column if not exists verificata_da uuid;
alter table marketplace.app_org add column if not exists motivo_sospensione text not null default '';
alter table marketplace.app_org add column if not exists ateco text[] not null default '{}';
alter table marketplace.app_org add column if not exists zone_servite text[] not null default '{}';
alter table marketplace.app_org add column if not exists modo_fornitore text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Profilo dell'iscrizione: una persona, più profili, uno attivo
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_profili (
  id uuid primary key default gen_random_uuid(),
  utente uuid not null references auth.users(id) on delete cascade,
  categoria text not null check (categoria in ('privato', 'azienda', 'fornitore')),
  org uuid references marketplace.app_org(id) on delete set null,
  nome text not null default '',
  telefono text not null default '',
  telefono_verificato boolean not null default false,
  obiettivi text[] not null default '{}',
  passo int not null default 0 check (passo between 0 and 6),
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
alter table marketplace.app_profili add column if not exists aggiornato timestamptz not null default now();
create index if not exists app_profili_utente_idx on marketplace.app_profili (utente);

create table if not exists marketplace.app_profilo_scelto (
  utente uuid primary key references auth.users(id) on delete cascade,
  profilo uuid not null references marketplace.app_profili(id) on delete cascade
);

alter table marketplace.app_profili enable row level security;
alter table marketplace.app_profilo_scelto enable row level security;
drop policy if exists app_profili_propri on marketplace.app_profili;
create policy app_profili_propri on marketplace.app_profili
  for all using (utente = auth.uid() or marketplace.is_admin())
  with check (utente = auth.uid() or marketplace.is_admin());
drop policy if exists app_profilo_scelto_proprio on marketplace.app_profilo_scelto;
create policy app_profilo_scelto_proprio on marketplace.app_profilo_scelto
  for all using (utente = auth.uid() or marketplace.is_admin())
  with check (utente = auth.uid() or marketplace.is_admin());

-- ---------------------------------------------------------------------------
-- Valori provvisori, modificabili da Admin → Impostazioni
-- ---------------------------------------------------------------------------
insert into marketplace.app_impostazioni (chiave, valore) values ('iscrizione', jsonb_build_object(
  'prova_giorni', 14,
  'flash_mese_impresa', 10,
  'pubblica_richiesta', 'gratis',
  'sms_telefono', false,
  'provvisorio', true
)) on conflict (chiave) do update set valore = marketplace.app_impostazioni.valore || excluded.valore, aggiornato = now();

-- Prezzi dei moduli: spenti finché Nando non li riaccende da Impostazioni.
insert into marketplace.app_impostazioni (chiave, valore) values ('prezzi_visibili', 'false'::jsonb)
on conflict (chiave) do nothing;

create or replace function marketplace.app_iscrizione_valore(p_chiave text)
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select coalesce((select valore->p_chiave from marketplace.app_impostazioni where chiave = 'iscrizione'), 'null'::jsonb);
$$;

-- Partita IVA italiana: 11 cifre e codice di controllo. Nessun servizio esterno.
create or replace function marketplace.app_piva_ok(p_piva text)
returns boolean language plpgsql immutable as $$
declare
  s text := regexp_replace(coalesce(p_piva, ''), '[^0-9]', '', 'g');
  i int; n int; somma int := 0; doppio int;
begin
  if length(s) <> 11 then return false; end if;
  for i in 1..10 loop
    n := substr(s, i, 1)::int;
    if i % 2 = 1 then somma := somma + n;
    else
      doppio := n * 2;
      somma := somma + (doppio / 10) + (doppio % 10);
    end if;
  end loop;
  return ((10 - (somma % 10)) % 10) = substr(s, 11, 1)::int;
end;
$$;

-- Telefono: se l'SMS è spento, basta il numero scritto.
create or replace function marketplace.app_telefono_fatto(p_profilo uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select coalesce((
    select case
      when telefono_verificato then true
      when coalesce((select (valore->>'sms_telefono')::boolean from marketplace.app_impostazioni where chiave = 'iscrizione'), false) then false
      else length(btrim(telefono)) >= 8
    end
    from marketplace.app_profili where id = p_profilo
  ), false);
$$;

-- Percentuale: la calcola solo il database.
create or replace function marketplace.app_percentuale_profilo(p_profilo uuid)
returns int language plpgsql stable security definer set search_path = marketplace, public as $$
declare v marketplace.app_profili; o marketplace.app_org; n int := 20;
begin
  select * into v from marketplace.app_profili where id = p_profilo;
  if not found then return 0; end if;
  if cardinality(v.obiettivi) > 0 then n := n + 20; end if;
  if v.categoria = 'privato' then
    if marketplace.app_telefono_fatto(v.id) then n := n + 60; end if;
    return least(n, 100);
  end if;
  if v.org is not null then select * into o from marketplace.app_org where id = v.org; end if;
  if o.id is not null and marketplace.app_piva_ok(o.piva) then n := n + 20; end if;
  if v.categoria = 'fornitore' and o.id is not null and cardinality(o.ateco) > 0 and cardinality(o.zone_servite) > 0 then n := n + 20; end if;
  if o.stato_verifica = 'verificata' then n := n + 20; end if;
  if o.id is not null and marketplace.app_modulo_attivo(o.id, 'base') then n := n + 20; end if;
  return least(n, 100);
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalogo pulsanti
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_pulsanti (
  id text primary key,
  categoria text not null check (categoria in ('privato', 'azienda', 'fornitore', 'tutti')),
  nome text not null,
  livello text not null check (livello in ('gratis', 'abbonamento', 'modulo', 'business', 'consumo')),
  modulo text,
  requisito text not null default 'nessuno' check (requisito in ('nessuno', 'telefono', 'piva_verificata', 'profilo_completo', 'abbonamento', 'modulo')),
  obiettivi text[] not null default '{}',
  ordine int not null default 100,
  prezzo text not null default ''
);
alter table marketplace.app_pulsanti enable row level security;
drop policy if exists app_pulsanti_leggi on marketplace.app_pulsanti;
create policy app_pulsanti_leggi on marketplace.app_pulsanti for select to anon, authenticated using (true);
drop policy if exists app_pulsanti_admin on marketplace.app_pulsanti;
create policy app_pulsanti_admin on marketplace.app_pulsanti for all using (marketplace.is_admin()) with check (marketplace.is_admin());

insert into marketplace.app_pulsanti (id, categoria, nome, livello, modulo, requisito, obiettivi, ordine, prezzo) values
  ('guasto', 'privato', 'Ho un guasto', 'gratis', null, 'nessuno', '{guasto}', 10, ''),
  ('trova', 'privato', 'Trova un artigiano o un''impresa', 'gratis', null, 'nessuno', '{guasto,ristrutturo}', 20, ''),
  ('ristruttura', 'privato', 'Ristruttura con AncheCasa', 'gratis', null, 'telefono', '{ristrutturo}', 30, ''),
  ('mio-cantiere', 'privato', 'Il mio cantiere', 'gratis', null, 'nessuno', '{ristrutturo}', 40, ''),
  ('vendo', 'privato', 'Vendo o affitto', 'gratis', null, 'telefono', '{vendo}', 50, ''),
  ('cerco-casa', 'privato', 'Cerco casa', 'gratis', null, 'telefono', '{cerco-casa}', 60, ''),
  ('cerco-lavoro', 'privato', 'Cerco lavoro', 'gratis', null, 'telefono', '{cerco-lavoro}', 70, ''),
  ('richieste', 'privato', 'Richieste', 'gratis', null, 'telefono', '{}', 80, ''),
  ('chat', 'privato', 'Chat', 'gratis', null, 'telefono', '{}', 90, ''),
  ('bollette', 'privato', 'Check Bollette', 'gratis', null, 'nessuno', '{}', 100, ''),
  ('segnala', 'privato', 'Segnala ad AncheCasa', 'gratis', null, 'nessuno', '{}', 110, ''),
  ('corsi', 'privato', 'Corsi AncheSicura', 'gratis', null, 'nessuno', '{}', 120, ''),
  ('ricevi-clienti', 'azienda', 'Ricevi clienti', 'gratis', null, 'piva_verificata', '{ricevo-clienti}', 10, ''),
  ('pubblico-lavoro', 'azienda', 'Pubblico un lavoro o un appalto', 'gratis', null, 'piva_verificata', '{pubblico-lavoro}', 20, ''),
  ('cerco-fornitori', 'azienda', 'Cerco fornitori', 'gratis', null, 'piva_verificata', '{cerco-fornitori}', 30, ''),
  ('cantieri', 'azienda', 'Gestisco i cantieri', 'modulo', 'cantieri', 'modulo', '{cantieri}', 40, '29 €'),
  ('gare-azienda', 'azienda', 'Partecipo a gare', 'modulo', 'gare', 'modulo', '{gare}', 50, '29 €'),
  ('sicurezza-cantiere', 'azienda', 'Sicurezza Cantiere', 'modulo', 'sicantiere', 'modulo', '{cantieri}', 60, '19 €'),
  ('flash', 'azienda', 'Sopralluogo Flash', 'abbonamento', 'ufficio', 'abbonamento', '{cantieri}', 70, 'provvisorio'),
  ('richieste-ricevute', 'fornitore', 'Richieste ricevute', 'gratis', null, 'nessuno', '{rispondo}', 10, ''),
  ('tutte-richieste', 'fornitore', 'Tutte le richieste della zona', 'abbonamento', 'base', 'abbonamento', '{rispondo}', 20, '99 €'),
  ('rispondo-gare', 'fornitore', 'Rispondo a gare e richieste', 'gratis', null, 'nessuno', '{rispondo}', 30, ''),
  ('notifiche', 'tutti', 'Notifiche', 'gratis', null, 'nessuno', '{}', 10, ''),
  ('profilo', 'tutti', 'Profilo', 'gratis', null, 'nessuno', '{}', 20, ''),
  ('abbonamento', 'tutti', 'Abbonamento e moduli', 'abbonamento', 'base', 'nessuno', '{}', 30, ''),
  ('invita', 'tutti', 'Invita', 'gratis', null, 'nessuno', '{}', 40, ''),
  ('assistenza', 'tutti', 'Assistenza', 'gratis', null, 'nessuno', '{}', 50, ''),
  ('cambia-profilo', 'tutti', 'Cambia profilo', 'gratis', null, 'nessuno', '{}', 5, '')
on conflict (id) do update set
  categoria = excluded.categoria, nome = excluded.nome, livello = excluded.livello, modulo = excluded.modulo,
  requisito = excluded.requisito, obiettivi = excluded.obiettivi, ordine = excluded.ordine, prezzo = excluded.prezzo;

-- «lavoro»: stesso pulsante per azienda e fornitore. Il pacchetto del mestiere, nell'app, decide quali mostrare.
alter table marketplace.app_pulsanti drop constraint if exists app_pulsanti_categoria_check;
alter table marketplace.app_pulsanti add constraint app_pulsanti_categoria_check
  check (categoria in ('privato', 'azienda', 'fornitore', 'tutti', 'lavoro'));

insert into marketplace.app_pulsanti (id, categoria, nome, livello, modulo, requisito, obiettivi, ordine, prezzo) values
  ('mod-ufficio', 'lavoro', 'Ufficio', 'abbonamento', 'ufficio', 'abbonamento', '{}', 80, ''),
  ('mod-sicurezza', 'lavoro', 'Sicurezza', 'modulo', 'sicurezza', 'modulo', '{}', 90, '9 €'),
  ('mod-sicantiere', 'lavoro', 'Sicurezza Cantiere', 'modulo', 'sicantiere', 'modulo', '{cantieri}', 100, '19 €'),
  ('mod-cantieri', 'lavoro', 'Gestisco i cantieri', 'modulo', 'cantieri', 'modulo', '{cantieri}', 110, '29 €'),
  ('mod-gare', 'lavoro', 'Partecipo a gare', 'modulo', 'gare', 'modulo', '{gare}', 120, '29 €'),
  ('mod-lotti', 'lavoro', 'Lotti e subappalti', 'modulo', 'lotti', 'modulo', '{}', 130, '9 €'),
  ('mod-centralino', 'lavoro', 'Centralino', 'modulo', 'centralino', 'modulo', '{}', 140, '19 €'),
  ('mod-magazzino', 'lavoro', 'Magazzino e mezzi', 'modulo', 'magazzino', 'modulo', '{}', 150, '9 €'),
  ('flash', 'lavoro', 'Sopralluogo Flash', 'abbonamento', 'ufficio', 'abbonamento', '{cantieri}', 160, 'provvisorio')
on conflict (id) do update set
  categoria = excluded.categoria, nome = excluded.nome, livello = excluded.livello, modulo = excluded.modulo,
  requisito = excluded.requisito, obiettivi = excluded.obiettivi, ordine = excluded.ordine, prezzo = excluded.prezzo;

-- Profilo attivo dell'utente collegato.
create or replace function marketplace.app_profilo_attivo()
returns marketplace.app_profili language sql stable security definer set search_path = marketplace, public as $$
  select p.* from marketplace.app_profili p
  join marketplace.app_profilo_scelto s on s.profilo = p.id
  where s.utente = auth.uid();
$$;

create or replace function marketplace.app_stato_pulsanti()
returns table (id text, nome text, aspetto text, motivo text, passo text, modulo text, prova boolean, ordine int)
language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v marketplace.app_profili;
  o marketplace.app_org;
  b marketplace.app_pulsanti;
  ha_abb boolean;
  ha_mod boolean;
  ha_cantiere boolean := false;
  prezzi_on boolean := false;
begin
  v := marketplace.app_profilo_attivo();
  if v.id is null then return; end if;
  if v.org is not null then select * into o from marketplace.app_org as org where org.id = v.org; end if;
  ha_abb := v.org is not null and marketplace.app_modulo_attivo(v.org, 'base');
  if to_regclass('marketplace.app_accessi') is not null then
    ha_cantiere := exists (select 1 from marketplace.app_accessi where utente = auth.uid());
  end if;
  select coalesce(valore = 'true'::jsonb, false) into prezzi_on
    from marketplace.app_impostazioni where chiave = 'prezzi_visibili';
  prezzi_on := coalesce(prezzi_on, false);
  for b in select * from marketplace.app_pulsanti loop
    aspetto := 'acceso'; motivo := ''; passo := ''; prova := false;
    if b.categoria <> 'tutti' and b.categoria <> v.categoria
       and not (b.categoria = 'lavoro' and v.categoria in ('azienda', 'fornitore')) then
      aspetto := 'nascosto'; motivo := 'Non è per questa categoria';
    elsif b.id = 'abbonamento' and v.categoria = 'privato' then
      aspetto := 'nascosto'; motivo := 'Il privato non ha abbonamento';
    elsif b.id = 'cambia-profilo' and (select count(*) from marketplace.app_profili where utente = auth.uid()) < 2 then
      aspetto := 'nascosto'; motivo := 'C''è un solo profilo';
    elsif b.id = 'mio-cantiere' and not ha_cantiere then
      aspetto := 'nascosto'; motivo := 'Non hai un cantiere';
    elsif b.requisito = 'telefono' and not marketplace.app_telefono_fatto(v.id) then
      aspetto := 'completa_profilo'; motivo := 'Verifica il telefono: potrai pubblicare e scrivere in chat'; passo := 'telefono';
    elsif b.requisito = 'piva_verificata' and coalesce(o.stato_verifica, 'da_verificare') <> 'verificata' then
      aspetto := 'completa_profilo';
      if o.id is null or length(regexp_replace(coalesce(o.piva, ''), '[^0-9]', '', 'g')) <> 11 then
        motivo := 'Manca la partita IVA'; passo := 'piva';
      elsif v.categoria = 'fornitore' and cardinality(coalesce(o.ateco, '{}')) = 0 then
        motivo := 'Scegli le categorie'; passo := 'categorie';
      else
        motivo := 'Carica i documenti: l''azienda diventa Verificata'; passo := 'documenti';
      end if;
    elsif b.requisito = 'profilo_completo' and marketplace.app_percentuale_profilo(v.id) < 100 then
      aspetto := 'completa_profilo'; motivo := 'Completa il profilo'; passo := 'profilo';
    elsif b.requisito = 'abbonamento' and not ha_abb then
      aspetto := 'attiva'; motivo := 'Prova gratis'; passo := 'abbonamento'; prova := true;
    elsif b.requisito = 'modulo' then
      ha_mod := v.org is not null and b.modulo is not null and marketplace.app_modulo_attivo(v.org, b.modulo);
      if not ha_abb then
        aspetto := 'attiva'; motivo := 'Prima l''abbonamento'; passo := 'abbonamento'; prova := true;
      elsif not ha_mod then
        aspetto := 'attiva';
        motivo := case when prezzi_on then coalesce(nullif(b.prezzo, ''), 'Prova gratis') else 'Prova gratis' end;
        passo := 'modulo'; prova := true;
      end if;
    end if;
    id := b.id; nome := b.nome; modulo := b.modulo; ordine := b.ordine;
    -- Gli obiettivi scelti salgono in cima, senza cambiare l'aspetto.
    if aspetto <> 'nascosto' and b.obiettivi && v.obiettivi then ordine := ordine - 1000; end if;
    return next;
  end loop;
end;
$$;
revoke all on function marketplace.app_stato_pulsanti() from public, anon;
grant execute on function marketplace.app_stato_pulsanti() to authenticated;

-- ---------------------------------------------------------------------------
-- Flash: il controllo c'è, e lascia passare i casi già decisi
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_flash_usi (
  id uuid primary key default gen_random_uuid(),
  org uuid,
  agente uuid,
  creato timestamptz not null default now()
);
alter table marketplace.app_flash_usi enable row level security;
drop policy if exists app_flash_usi_leggi on marketplace.app_flash_usi;
create policy app_flash_usi_leggi on marketplace.app_flash_usi for select to authenticated
  using (agente = auth.uid() or marketplace.is_admin() or (org is not null and marketplace.app_mio_ruolo(org) is not null));

create or replace function marketplace.app_flash_controlla(p_org uuid, p_agente uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  quota int := coalesce((select (valore->>'flash_mese_impresa')::int from marketplace.app_impostazioni where chiave = 'iscrizione'), 10);
  n int;
begin
  if auth.uid() is null or marketplace.is_admin() then return; end if;
  if exists (select 1 from marketplace.app_ruoli where utente = auth.uid() and ruolo = 'fornitore') then return; end if;
  if exists (select 1 from marketplace.app_accessi where utente = auth.uid()) and p_agente is distinct from auth.uid() and not marketplace.app_gestisce(p_org) then
    return;
  end if;
  if to_regclass('marketplace.app_rete') is not null and exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo') then
    select count(*) into n from marketplace.app_flash_usi where agente = auth.uid() and creato > now() - interval '1 day';
    if n >= 20 then raise exception 'Hai già fatto 20 analisi Flash oggi'; end if;
    insert into marketplace.app_flash_usi (org, agente) values (p_org, auth.uid());
    return;
  end if;
  if p_org is not null and marketplace.app_gestisce(p_org) and marketplace.app_modulo_attivo(p_org, 'base') then
    select count(*) into n from marketplace.app_flash_usi where org = p_org and creato >= date_trunc('month', now());
    if n >= quota then raise exception 'Hai usato le analisi Flash comprese in questo mese'; end if;
    insert into marketplace.app_flash_usi (org, agente) values (p_org, auth.uid());
    return;
  end if;
  if p_org is not null and marketplace.app_gestisce(p_org) then
    raise exception 'Sopralluogo Flash è nell''abbonamento impresa';
  end if;
end;
$$;
revoke all on function marketplace.app_flash_controlla(uuid, uuid) from public, anon;
grant execute on function marketplace.app_flash_controlla(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Mail confermata: pubblicare, offrire, accettare un invito con ruolo
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_mail_confermata()
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  if auth.uid() is null then return true; end if;
  return coalesce((select email_confirmed_at is not null from auth.users where id = auth.uid()), false);
exception when undefined_column then
  return true;
end;
$$;

create or replace function marketplace.app_blocca_senza_mail()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if auth.uid() is not null and not marketplace.app_mail_confermata() then
    raise exception 'Conferma la mail per pubblicare';
  end if;
  return new;
end;
$$;

do $$ begin
  if to_regclass('marketplace.app_annunci') is not null then
    execute 'drop trigger if exists app_annunci_mail on marketplace.app_annunci';
    execute 'create trigger app_annunci_mail before insert on marketplace.app_annunci for each row execute function marketplace.app_blocca_senza_mail()';
  end if;
  if to_regclass('marketplace.app_sub_offerte') is not null then
    execute 'drop trigger if exists app_sub_offerte_mail on marketplace.app_sub_offerte';
    execute 'create trigger app_sub_offerte_mail before insert on marketplace.app_sub_offerte for each row execute function marketplace.app_blocca_senza_mail()';
  end if;
  if to_regclass('marketplace.app_rete') is not null then
    execute 'drop trigger if exists app_rete_mail on marketplace.app_rete';
    execute 'create trigger app_rete_mail before insert on marketplace.app_rete for each row execute function marketplace.app_blocca_senza_mail()';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Registro: dove si fermano le iscrizioni
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_iscrizione_eventi (
  id uuid primary key default gen_random_uuid(),
  utente uuid references auth.users(id) on delete set null,
  categoria text not null check (categoria in ('privato', 'azienda', 'fornitore')),
  passo text not null,
  da_dove text not null check (da_dove in ('sito', 'area', 'app', 'link')),
  quando timestamptz not null default now()
);
alter table marketplace.app_iscrizione_eventi enable row level security;
drop policy if exists app_iscrizione_eventi_propri on marketplace.app_iscrizione_eventi;
create policy app_iscrizione_eventi_propri on marketplace.app_iscrizione_eventi
  for select using (utente = auth.uid() or marketplace.is_admin());
drop policy if exists app_iscrizione_eventi_scrivi on marketplace.app_iscrizione_eventi;
create policy app_iscrizione_eventi_scrivi on marketplace.app_iscrizione_eventi
  for insert with check (utente = auth.uid() or marketplace.is_admin());

create or replace function marketplace.app_iscrizione_evento(p_categoria text, p_passo text, p_da text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'entra_per_registrare'; end if;
  if p_categoria not in ('privato', 'azienda', 'fornitore') then raise exception 'categoria'; end if;
  if p_da not in ('sito', 'area', 'app', 'link') then raise exception 'provenienza'; end if;
  insert into marketplace.app_iscrizione_eventi (utente, categoria, passo, da_dove)
  values (auth.uid(), p_categoria, left(btrim(p_passo), 40), p_da) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function marketplace.app_iscrizione_evento(text, text, text) from public;
grant execute on function marketplace.app_iscrizione_evento(text, text, text) to authenticated;

create or replace function marketplace.app_iscrizione_dove(p_giorni int)
returns table (categoria text, passo text, persone int)
language sql stable security definer set search_path = marketplace, public as $$
  select categoria, passo, count(distinct utente)::int as persone
  from marketplace.app_iscrizione_eventi
  where marketplace.is_admin() and quando >= now() - make_interval(days => p_giorni)
  group by categoria, passo
  order by 1, 3 desc;
$$;
revoke all on function marketplace.app_iscrizione_dove(int) from public, anon;
grant execute on function marketplace.app_iscrizione_dove(int) to authenticated;

-- Apre o riprende il profilo. Il passo resta quello già salvato.
create or replace function marketplace.app_profilo_apri(p_categoria text, p_nome text, p_piva text, p_da text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid; v_org uuid; v_ruolo text;
begin
  if auth.uid() is null then raise exception 'entra_per_continuare'; end if;
  if p_categoria not in ('privato', 'azienda', 'fornitore') then raise exception 'categoria'; end if;
  select id into v_id from marketplace.app_profili where utente = auth.uid() and categoria = p_categoria limit 1;
  if v_id is null then
    if p_categoria <> 'privato' then
      if not marketplace.app_piva_ok(p_piva) then raise exception 'La partita IVA non è valida'; end if;
      insert into marketplace.app_org (nome, tipo, piva, titolare, stato_verifica)
      values (left(btrim(coalesce(p_nome, 'Azienda')), 120), case when p_categoria = 'fornitore' then 'fornitore' else 'impresa' end,
              regexp_replace(p_piva, '[^0-9]', '', 'g'), auth.uid(), 'da_verificare')
      returning id into v_org;
      insert into marketplace.app_org_membri (org, utente, ruolo, nome)
      values (v_org, auth.uid(), 'titolare', left(btrim(coalesce(p_nome, 'Titolare')), 80))
      on conflict do nothing;
    end if;
    insert into marketplace.app_profili (utente, categoria, org, nome, passo)
    values (auth.uid(), p_categoria, v_org, left(btrim(coalesce(p_nome, '')), 120), 0)
    returning id into v_id;
    v_ruolo := case when p_categoria = 'privato' then 'privato' else 'fornitore' end;
    if p_categoria = 'azienda' then v_ruolo := 'impresa'; end if;
    insert into marketplace.app_ruoli (utente, ruolo) values (auth.uid(), v_ruolo) on conflict do nothing;
  end if;
  insert into marketplace.app_profilo_scelto (utente, profilo) values (auth.uid(), v_id)
  on conflict (utente) do update set profilo = excluded.profilo;
  perform marketplace.app_iscrizione_evento(p_categoria, 'account', coalesce(p_da, 'sito'));
  return v_id;
end;
$$;
revoke all on function marketplace.app_profilo_apri(text, text, text, text) from public;
grant execute on function marketplace.app_profilo_apri(text, text, text, text) to authenticated;

create or replace function marketplace.app_profilo_passo(p_passo int, p_obiettivi text[], p_telefono text, p_ateco text[], p_zone text[], p_modo text[])
returns int language plpgsql security definer set search_path = marketplace, public as $$
declare v marketplace.app_profili; sms boolean;
begin
  v := marketplace.app_profilo_attivo();
  if v.id is null then raise exception 'profilo_mancante'; end if;
  sms := coalesce((select (valore->>'sms_telefono')::boolean from marketplace.app_impostazioni where chiave = 'iscrizione'), false);
  update marketplace.app_profili set
    passo = greatest(passo, coalesce(p_passo, passo)),
    obiettivi = case when p_obiettivi is null then obiettivi else p_obiettivi end,
    telefono = case when p_telefono is null then telefono else left(btrim(p_telefono), 30) end,
    telefono_verificato = case when sms then telefono_verificato when p_telefono is not null and length(btrim(p_telefono)) >= 8 then true else telefono_verificato end,
    aggiornato = now()
  where id = v.id;
  if v.org is not null and (p_ateco is not null or p_zone is not null or p_modo is not null) then
    update marketplace.app_org set
      ateco = coalesce(p_ateco, ateco),
      zone_servite = coalesce(p_zone, zone_servite),
      modo_fornitore = coalesce(p_modo, modo_fornitore)
    where id = v.org and (marketplace.app_gestisce(id) or titolare = auth.uid());
  end if;
  return marketplace.app_percentuale_profilo(v.id);
end;
$$;
revoke all on function marketplace.app_profilo_passo(int, text[], text, text[], text[], text[]) from public;
grant execute on function marketplace.app_profilo_passo(int, text[], text, text[], text[], text[]) to authenticated;

-- Admin: verifica, chiede un documento, sospende.
create or replace function marketplace.app_org_verifica(p_org uuid, p_esito text, p_motivo text)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare v_cat text;
begin
  if not marketplace.is_admin() then raise exception 'non_autorizzato'; end if;
  if p_esito not in ('verificata', 'da_verificare', 'sospesa') then raise exception 'esito'; end if;
  update marketplace.app_org set
    stato_verifica = p_esito,
    verificata_il = case when p_esito = 'verificata' then now() else verificata_il end,
    verificata_da = case when p_esito = 'verificata' then auth.uid() else verificata_da end,
    motivo_sospensione = case when p_esito = 'sospesa' then left(coalesce(p_motivo, ''), 400) else '' end
  where id = p_org;
  select categoria into v_cat from marketplace.app_profili where org = p_org limit 1;
  return coalesce(v_cat, 'azienda');
end;
$$;
revoke all on function marketplace.app_org_verifica(uuid, text, text) from public;
grant execute on function marketplace.app_org_verifica(uuid, text, text) to authenticated;

grant select, insert, update on marketplace.app_profili, marketplace.app_profilo_scelto, marketplace.app_iscrizione_eventi, marketplace.app_flash_usi to authenticated;
grant select on marketplace.app_pulsanti to anon, authenticated;

-- VIES: pronta e spenta. Per accenderla serve una funzione Edge con il segreto, non il browser.
create or replace function marketplace.app_piva_vies(p_piva text)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  if coalesce((select (valore->>'vies')::boolean from marketplace.app_impostazioni where chiave = 'iscrizione'), false) then
    return jsonb_build_object('accesa', true, 'nota', 'Il controllo VIES si fa dalla funzione Edge, non da qui.');
  end if;
  return jsonb_build_object('accesa', false, 'formato', marketplace.app_piva_ok(p_piva));
end;
$$;
revoke all on function marketplace.app_piva_vies(text) from public, anon;
grant execute on function marketplace.app_piva_vies(text) to authenticated;

-- Sollecito «manca un passo»: una volta per passo, dopo 3 giorni. La mail la manda l'ufficio leggendo la coda.
create table if not exists marketplace.app_solleciti (
  id uuid primary key default gen_random_uuid(),
  profilo uuid,
  passo int,
  creato timestamptz not null default now(),
  unique (profilo, passo)
);
alter table marketplace.app_solleciti enable row level security;
drop policy if exists app_solleciti_admin on marketplace.app_solleciti;
create policy app_solleciti_admin on marketplace.app_solleciti for select using (marketplace.is_admin());

create or replace function marketplace.app_iscrizione_sollecita()
returns int language plpgsql security definer set search_path = marketplace, public as $$
declare n int;
begin
  insert into marketplace.app_solleciti (profilo, passo)
  select id, passo from marketplace.app_profili
  where aggiornato < now() - interval '3 days'
  on conflict (profilo, passo) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function marketplace.app_iscrizione_sollecita() from public, anon, authenticated;

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'app-iscrizione-sollecita';
    perform cron.schedule('app-iscrizione-sollecita', '0 6 * * *', 'select marketplace.app_iscrizione_sollecita()');
  end if;
exception when others then null;
end $$;
