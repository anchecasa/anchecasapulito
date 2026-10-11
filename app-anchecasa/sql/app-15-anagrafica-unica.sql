-- =============================================================================
-- AncheCasa app · parte 15: ANAGRAFICA UNICA (11.10.2026)
-- Da eseguire DOPO app-14. Si può rieseguire: non cancella colonne e non crea doppioni.
-- Non unisce in automatico i nomi simili.
-- =============================================================================

create or replace function marketplace.app_solo_cifre(p text)
returns text language sql immutable as $$ select regexp_replace(coalesce(p, ''), '\D', '', 'g') $$;

create or replace function marketplace.app_norm_mail(p text)
returns text language sql immutable as $$
  select case when position('@' in coalesce(p, '')) > 0 then lower(btrim(p)) else '' end
$$;

create or replace function marketplace.app_norm_tel(p text)
returns text language sql immutable as $$
  select case
    when length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) < 8 then ''
    when left(regexp_replace(p, '\D', '', 'g'), 2) = '39' and length(regexp_replace(p, '\D', '', 'g')) >= 11
      then '+' || regexp_replace(p, '\D', '', 'g')
    else '+39' || right(regexp_replace(p, '\D', '', 'g'), 10)
  end
$$;

create table if not exists marketplace.app_soggetti (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('persona', 'azienda')),
  nome text not null default '',
  cognome text not null default '',
  ragione_sociale text not null default '',
  codice_fiscale text not null default '',
  partita_iva text not null default '',
  mail text not null default '',
  telefono text not null default '',
  indirizzo text not null default '',
  comune text not null default '',
  provincia text not null default '',
  regione text not null default '',
  origine text not null default 'import' check (origine in ('sito', 'app', 'rete', 'ditta', 'import')),
  account uuid,
  org uuid,
  rivendicato boolean not null default false,
  unito_in uuid,
  creato timestamptz not null default now()
);

create unique index if not exists app_soggetti_piva on marketplace.app_soggetti (partita_iva)
  where tipo = 'azienda' and partita_iva <> '' and unito_in is null;
create unique index if not exists app_soggetti_cf on marketplace.app_soggetti (codice_fiscale)
  where tipo = 'persona' and codice_fiscale <> '' and unito_in is null;
create unique index if not exists app_soggetti_mail on marketplace.app_soggetti (mail)
  where tipo = 'persona' and codice_fiscale = '' and mail <> '' and unito_in is null;
create unique index if not exists app_soggetti_tel on marketplace.app_soggetti (telefono)
  where tipo = 'persona' and codice_fiscale = '' and mail = '' and telefono <> '' and unito_in is null;
create unique index if not exists app_soggetti_az_mail on marketplace.app_soggetti (mail)
  where tipo = 'azienda' and partita_iva = '' and mail <> '' and unito_in is null;

create table if not exists marketplace.app_rubrica (
  id uuid primary key default gen_random_uuid(),
  org uuid not null,
  soggetto uuid not null references marketplace.app_soggetti(id),
  ruolo text not null check (ruolo in ('cliente', 'fornitore', 'subappaltatore', 'professionista', 'altro')),
  note text not null default '',
  record_id uuid,
  dal timestamptz not null default now(),
  unique (org, soggetto, ruolo)
);

create table if not exists marketplace.app_soggetti_unioni (
  id uuid primary key default gen_random_uuid(),
  tiene uuid not null,
  tolto uuid not null,
  chi uuid,
  il timestamptz not null default now()
);
create table if not exists marketplace.app_soggetti_diversi (
  a uuid not null,
  b uuid not null,
  chi uuid,
  il timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);

do $$
declare r record;
begin
  for r in select unnest(array['app_record','app_vendite','app_affari','app_sopralluoghi','app_fe_documenti','app_segnalazioni','app_contatti','richieste_iscrizione','app_fornitori_zona','app_sub_inviti']) as t
  loop
    if to_regclass('marketplace.' || r.t) is not null then
      execute format('alter table marketplace.%I add column if not exists soggetto uuid', r.t);
    end if;
  end loop;
end $$;

create or replace function marketplace.app_vedo_org(p_org uuid)
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
declare v boolean;
begin
  if p_org is null then return false; end if;
  if marketplace.is_admin() then return true; end if;
  if to_regprocedure('marketplace.app_mio_ruolo(uuid)') is not null then
    execute 'select marketplace.app_mio_ruolo($1) is not null' into v using p_org;
    return coalesce(v, false);
  end if;
  return exists (select 1 from marketplace.app_org_membri m where m.org = p_org and m.utente = auth.uid());
end;
$$;

create or replace function marketplace.app_soggetto_assicura(
  p_tipo text, p_nome text, p_cognome text, p_ragione text, p_cf text, p_piva text,
  p_mail text, p_tel text, p_indirizzo text, p_comune text, p_provincia text, p_regione text, p_origine text
) returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_tipo text := case when p_tipo = 'azienda' or length(marketplace.app_solo_cifre(p_piva)) = 11 then 'azienda' else 'persona' end;
  v_cf text := upper(regexp_replace(coalesce(p_cf, ''), '[^A-Za-z0-9]', '', 'g'));
  v_piva text := marketplace.app_solo_cifre(p_piva);
  v_mail text := marketplace.app_norm_mail(p_mail);
  v_tel text := marketplace.app_norm_tel(p_tel);
  v_origine text := case when p_origine in ('sito','app','rete','ditta','import') then p_origine else 'import' end;
  v uuid;
begin
  if length(v_piva) > 0 and length(v_piva) <> 11 then v_piva := ''; end if;
  if v_tipo = 'azienda' and v_piva <> '' then
    select id into v from marketplace.app_soggetti where tipo = 'azienda' and partita_iva = v_piva and unito_in is null limit 1;
  elsif v_tipo = 'azienda' and v_mail <> '' then
    select id into v from marketplace.app_soggetti where tipo = 'azienda' and mail = v_mail and partita_iva = '' and unito_in is null limit 1;
  elsif v_tipo = 'persona' and length(v_cf) = 16 then
    select id into v from marketplace.app_soggetti where tipo = 'persona' and codice_fiscale = v_cf and unito_in is null limit 1;
  elsif v_tipo = 'persona' and v_mail <> '' then
    select id into v from marketplace.app_soggetti where tipo = 'persona' and mail = v_mail and codice_fiscale = '' and unito_in is null limit 1;
  elsif v_tipo = 'persona' and v_tel <> '' then
    select id into v from marketplace.app_soggetti where tipo = 'persona' and telefono = v_tel and codice_fiscale = '' and mail = '' and unito_in is null limit 1;
  end if;
  if v is null then
    insert into marketplace.app_soggetti (tipo, nome, cognome, ragione_sociale, codice_fiscale, partita_iva, mail, telefono, indirizzo, comune, provincia, regione, origine)
    values (v_tipo, left(btrim(coalesce(p_nome, '')), 80), left(btrim(coalesce(p_cognome, '')), 80), left(btrim(coalesce(p_ragione, '')), 160),
            case when v_tipo = 'persona' then v_cf else '' end, case when v_tipo = 'azienda' then v_piva else '' end,
            v_mail, v_tel, left(coalesce(p_indirizzo, ''), 160), left(coalesce(p_comune, ''), 80), left(coalesce(p_provincia, ''), 40), left(coalesce(p_regione, ''), 40), v_origine)
    returning id into v;
  else
    update marketplace.app_soggetti set
      nome = case when nome = '' then left(btrim(coalesce(p_nome, '')), 80) else nome end,
      cognome = case when cognome = '' then left(btrim(coalesce(p_cognome, '')), 80) else cognome end,
      ragione_sociale = case when ragione_sociale = '' then left(btrim(coalesce(p_ragione, '')), 160) else ragione_sociale end,
      mail = case when mail = '' then v_mail else mail end,
      telefono = case when telefono = '' then v_tel else telefono end
    where id = v;
  end if;
  return v;
end;
$$;

create or replace function marketplace.app_soggetto_in_rubrica(
  p_org uuid, p_ruolo text, p_nome text, p_mail text, p_tel text, p_piva text, p_cf text, p_record uuid
) returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_ruolo text := case when p_ruolo in ('cliente','fornitore','subappaltatore','professionista','altro') then p_ruolo else 'cliente' end;
  v_piva text := marketplace.app_solo_cifre(p_piva);
  v_tipo text := case when length(v_piva) = 11 then 'azienda' else 'persona' end;
  v_nome text := btrim(coalesce(p_nome, ''));
  v uuid;
begin
  if not marketplace.app_vedo_org(p_org) and not marketplace.is_admin() then raise exception 'non_autorizzato'; end if;
  v := marketplace.app_soggetto_assicura(
    v_tipo,
    case when v_tipo = 'persona' then split_part(v_nome, ' ', 1) else '' end,
    case when v_tipo = 'persona' and position(' ' in v_nome) > 0 then btrim(substr(v_nome, position(' ' in v_nome) + 1)) else '' end,
    case when v_tipo = 'azienda' then v_nome else '' end,
    p_cf, p_piva, p_mail, p_tel, '', '', '', '', 'ditta');
  insert into marketplace.app_rubrica (org, soggetto, ruolo, record_id)
  values (p_org, v, v_ruolo, p_record)
  on conflict (org, soggetto, ruolo) do update set record_id = coalesce(marketplace.app_rubrica.record_id, excluded.record_id);
  if p_record is not null and to_regclass('marketplace.app_record') is not null then
    update marketplace.app_record set soggetto = v where id = p_record and (soggetto is null or soggetto = v);
  end if;
  return v;
end;
$$;

create or replace function marketplace.app_rubrica_elenco(p_ruolo text, p_testo text)
returns table (id uuid, titolo text, telefono text, mail text, partita_iva text, ruolo text)
language plpgsql stable security definer set search_path = marketplace, public as $$
declare q text := lower(btrim(coalesce(p_testo, '')));
begin
  return query
  select s.id, left(case when s.tipo = 'azienda' then s.ragione_sociale else btrim(s.nome || ' ' || s.cognome) end, 160),
         s.telefono, s.mail, s.partita_iva, r.ruolo
  from marketplace.app_rubrica r
  join marketplace.app_soggetti s on s.id = r.soggetto and s.unito_in is null
  where marketplace.app_vedo_org(r.org)
    and (p_ruolo is null or p_ruolo = '' or r.ruolo = p_ruolo)
    and (q = '' or lower(s.ragione_sociale || ' ' || s.nome || ' ' || s.cognome) like '%' || q || '%'
         or s.partita_iva like '%' || marketplace.app_solo_cifre(q) || '%'
         or s.telefono like '%' || right(marketplace.app_solo_cifre(q), 8) || '%'
         or s.mail like '%' || q || '%');
end;
$$;

create or replace function marketplace.app_soggetto_scheda(p_record uuid)
returns table (cosa text, dettaglio text)
language plpgsql stable security definer set search_path = marketplace, public as $$
declare v uuid;
begin
  if to_regclass('marketplace.app_record') is null then return; end if;
  select soggetto into v from marketplace.app_record where id = p_record;
  if v is null then return; end if;
  if not exists (select 1 from marketplace.app_rubrica r where r.soggetto = v and marketplace.app_vedo_org(r.org)) and not marketplace.is_admin() then
    return;
  end if;
  if to_regclass('marketplace.app_sopralluoghi') is not null then
    return query select 'Sopralluogo'::text, left(coalesce(s.cliente_dati->>'denominazione', s.cliente_dati->>'nome', ''), 160)
      from marketplace.app_sopralluoghi s where s.soggetto = v limit 20;
  end if;
  if to_regclass('marketplace.app_fe_documenti') is not null then
    return query select 'Documento'::text, left(coalesce(d.cliente_dati->>'denominazione', d.cliente_dati->>'nome', ''), 160)
      from marketplace.app_fe_documenti d where d.soggetto = v limit 20;
  end if;
end;
$$;

-- Albo: solo aziende verificate, se le colonne di app-14 ci sono.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'marketplace' and table_name = 'app_org' and column_name = 'stato_verifica') then
    execute $v$
      create or replace view marketplace.app_albo as
      select id, nome, piva, tipo, ateco, zone_servite, modo_fornitore, stato_verifica
      from marketplace.app_org
      where stato = 'attiva' and stato_verifica = 'verificata'
    $v$;
  elsif to_regclass('marketplace.app_org') is not null then
    execute 'create or replace view marketplace.app_albo as select id, nome, piva, tipo from marketplace.app_org where stato = ''attiva''';
  end if;
end $$;

create or replace function marketplace.app_rivendica_org()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare v_piva text := marketplace.app_solo_cifre(new.piva);
begin
  if length(v_piva) <> 11 then return new; end if;
  update marketplace.app_soggetti
     set org = new.id, rivendicato = true, account = coalesce(account, new.titolare)
   where tipo = 'azienda' and partita_iva = v_piva and unito_in is null;
  if to_regclass('marketplace.app_sub_inviti') is not null then
    update marketplace.app_sub_inviti i
       set soggetto = s.id
      from marketplace.app_soggetti s
     where s.tipo = 'azienda' and s.partita_iva = v_piva and s.unito_in is null
       and marketplace.app_norm_mail(i.email) = s.mail and s.mail <> '';
  end if;
  if to_regclass('marketplace.app_fornitori_zona') is not null then
    update marketplace.app_fornitori_zona f
       set soggetto = s.id
      from marketplace.app_soggetti s
     where s.tipo = 'azienda' and s.partita_iva = v_piva and s.unito_in is null
       and f.soggetto is null
       and marketplace.app_norm_mail(f.email) = s.mail;
  end if;
  return new;
end;
$$;
drop trigger if exists app_org_rivendica on marketplace.app_org;
create trigger app_org_rivendica after insert or update of piva on marketplace.app_org
  for each row execute function marketplace.app_rivendica_org();

-- Il cliente è di chi lo registra per primo. Stesse durate di app-07. Non dice di chi è.
create or replace function marketplace.app_cliente_di_altri(p_utente uuid, p_tipo text, p_piva text, p_contatto text)
returns uuid language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_piva text := marketplace.app_solo_cifre(p_piva);
  v_cont text := case when position('@' in coalesce(p_contatto, '')) > 0 then lower(btrim(p_contatto))
                      when length(marketplace.app_solo_cifre(p_contatto)) >= 6 then right(marketplace.app_solo_cifre(p_contatto), 10) else '' end;
  v uuid;
begin
  if length(v_piva) >= 11 then
    select x.chi into v from (
      select venditore as chi, creato from marketplace.app_vendite
       where marketplace.app_solo_cifre(cliente_piva) = v_piva and venditore <> p_utente
         and (stato = 'attiva' or (stato = 'proposta' and creato > now() - interval '90 days'))
      union all
      select segnalato_da, creato from marketplace.app_affari
       where marketplace.app_solo_cifre(cliente_piva) = v_piva and segnalato_da <> p_utente
         and (stato in ('firmato', 'chiuso') or (stato = 'proposta' and creato > now() - interval '90 days'))
      union all
      select ve.venditore, ve.creato from marketplace.app_vendite ve
        join marketplace.app_soggetti s on s.id = ve.soggetto
       where s.partita_iva = v_piva and ve.venditore <> p_utente
         and (ve.stato = 'attiva' or (ve.stato = 'proposta' and ve.creato > now() - interval '90 days'))
    ) x order by x.creato limit 1;
    return v;
  end if;
  if p_tipo in ('privato', 'condominio') and v_cont <> '' then
    select x.chi into v from (
      select venditore as chi, creato from marketplace.app_vendite
       where right(marketplace.app_solo_cifre(cliente_contatto), 10) = v_cont and stato <> 'persa' and creato > now() - interval '12 months'
      union all
      select segnalato_da, creato from marketplace.app_affari
       where right(marketplace.app_solo_cifre(cliente_contatto), 10) = v_cont and stato <> 'perso' and creato > now() - interval '12 months'
    ) x order by x.creato desc limit 1;
    if v = p_utente then return null; end if;
    return v;
  end if;
  return null;
end;
$$;

create or replace function marketplace.app_controlla_cliente()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare v_chi uuid; v_utente uuid; v_soggetto uuid;
begin
  if tg_table_name = 'app_vendite' then v_utente := new.venditore;
  else v_utente := new.segnalato_da; end if;
  if marketplace.is_admin() then return new; end if;
  v_chi := marketplace.app_cliente_di_altri(v_utente, new.cliente_tipo, new.cliente_piva, new.cliente_contatto);
  if v_chi is not null then raise exception 'cliente_di_un_collega'; end if;
  v_soggetto := marketplace.app_soggetto_assicura(
    case when length(marketplace.app_solo_cifre(new.cliente_piva)) = 11 then 'azienda' else 'persona' end,
    case when length(marketplace.app_solo_cifre(new.cliente_piva)) = 11 then '' else split_part(coalesce(new.cliente_nome, ''), ' ', 1) end,
    '', case when length(marketplace.app_solo_cifre(new.cliente_piva)) = 11 then coalesce(new.cliente_nome, '') else '' end,
    '', new.cliente_piva, case when position('@' in coalesce(new.cliente_contatto, '')) > 0 then new.cliente_contatto else '' end,
    case when position('@' in coalesce(new.cliente_contatto, '')) > 0 then '' else new.cliente_contatto end,
    '', '', '', '', 'rete');
  new.soggetto := v_soggetto;
  return new;
end;
$$;

drop trigger if exists app_vendite_controlla on marketplace.app_vendite;
create trigger app_vendite_controlla before insert on marketplace.app_vendite
  for each row execute function marketplace.app_controlla_cliente();
drop trigger if exists app_affari_controlla on marketplace.app_affari;
create trigger app_affari_controlla before insert on marketplace.app_affari
  for each row execute function marketplace.app_controlla_cliente();

create or replace function marketplace.app_cliente_libero(p_tipo text, p_piva text, p_contatto text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.app_cliente_di_altri(auth.uid(), p_tipo, p_piva, p_contatto) is null;
$$;

create or replace function marketplace.app_soggetti_doppioni()
returns table (motivo text, a uuid, b uuid, dettaglio text)
language sql stable security definer set search_path = marketplace, public as $$
  select x.motivo, x.a, x.b, x.dettaglio from (
    select 'stessa mail'::text as motivo, s1.id as a, s2.id as b, s1.mail as dettaglio
      from marketplace.app_soggetti s1
      join marketplace.app_soggetti s2 on s1.mail = s2.mail and s1.mail <> '' and s1.id < s2.id
     where s1.unito_in is null and s2.unito_in is null
    union all
    select 'stesso telefono', s1.id, s2.id, s1.telefono
      from marketplace.app_soggetti s1
      join marketplace.app_soggetti s2 on s1.telefono = s2.telefono and s1.telefono <> '' and s1.id < s2.id
     where s1.unito_in is null and s2.unito_in is null
    union all
    select 'partita iva', s1.id, s2.id, s1.partita_iva
      from marketplace.app_soggetti s1
      join marketplace.app_soggetti s2 on s1.partita_iva = s2.partita_iva and length(s1.partita_iva) = 11 and s1.id < s2.id
     where s1.unito_in is null and s2.unito_in is null
  ) x
  where marketplace.is_admin()
    and not exists (select 1 from marketplace.app_soggetti_diversi d where d.a = least(x.a, x.b) and d.b = greatest(x.a, x.b));
$$;

create or replace function marketplace.app_soggetti_unisci(p_tiene uuid, p_toglie uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare r record;
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  if p_tiene = p_toglie or p_tiene is null or p_toglie is null then raise exception 'soggetti_non_validi'; end if;
  update marketplace.app_rubrica t set soggetto = p_tiene
   where t.soggetto = p_toglie
     and not exists (select 1 from marketplace.app_rubrica x where x.org = t.org and x.soggetto = p_tiene and x.ruolo = t.ruolo);
  delete from marketplace.app_rubrica where soggetto = p_toglie;
  for r in select table_name from information_schema.columns
            where table_schema = 'marketplace' and column_name = 'soggetto' and table_name <> 'app_soggetti'
  loop
    execute format('update marketplace.%I set soggetto = $1 where soggetto = $2', r.table_name) using p_tiene, p_toglie;
  end loop;
  update marketplace.app_soggetti set unito_in = p_tiene where id = p_toglie;
  insert into marketplace.app_soggetti_unioni (tiene, tolto, chi) values (p_tiene, p_toglie, auth.uid());
end;
$$;

create or replace function marketplace.app_soggetti_diversi(p_a uuid, p_b uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  insert into marketplace.app_soggetti_diversi (a, b, chi) values (least(p_a, p_b), greatest(p_a, p_b), auth.uid())
  on conflict (a, b) do nothing;
end;
$$;

create or replace function marketplace.app_anagrafica_collega()
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare r record; v uuid; v_mail text; v_tel text; v_piva text; v_nome text;
begin
  if to_regclass('marketplace.app_record') is not null then
    for r in select * from marketplace.app_record where tipo in ('cliente', 'fornitore') loop
      select soggetto into v from marketplace.app_rubrica where record_id = r.id limit 1;
      if v is not null then
        update marketplace.app_record set soggetto = v where id = r.id and soggetto is distinct from v;
        continue;
      end if;
      v_mail := coalesce(r.dati->>'email', r.dati->>'mail', '');
      v_tel := coalesce(r.dati->>'telefono', r.dati->>'tel', '');
      v_piva := coalesce(r.dati->>'piva', r.dati->>'partita_iva', '');
      v := marketplace.app_soggetto_assicura(
        case when length(marketplace.app_solo_cifre(v_piva)) = 11 then 'azienda' else 'persona' end,
        case when length(marketplace.app_solo_cifre(v_piva)) = 11 then '' else split_part(coalesce(r.titolo, ''), ' ', 1) end,
        '', case when length(marketplace.app_solo_cifre(v_piva)) = 11 then coalesce(r.titolo, '') else '' end,
        coalesce(r.dati->>'cf', ''), v_piva, v_mail, v_tel, coalesce(r.dati->>'indirizzo', ''), '', '', '', 'ditta');
      insert into marketplace.app_rubrica (org, soggetto, ruolo, record_id)
      values (r.org, v, case when r.tipo = 'fornitore' then 'fornitore' else 'cliente' end, r.id)
      on conflict (org, soggetto, ruolo) do nothing;
      update marketplace.app_record set soggetto = v where id = r.id and soggetto is distinct from v;
    end loop;
  end if;
  if to_regclass('marketplace.app_vendite') is not null then
    for r in select * from marketplace.app_vendite where soggetto is null loop
      update marketplace.app_vendite set soggetto = marketplace.app_soggetto_assicura(
        case when length(marketplace.app_solo_cifre(r.cliente_piva)) = 11 then 'azienda' else 'persona' end,
        split_part(coalesce(r.cliente_nome, ''), ' ', 1), '', coalesce(r.cliente_nome, ''),
        '', r.cliente_piva,
        case when position('@' in coalesce(r.cliente_contatto, '')) > 0 then r.cliente_contatto else '' end,
        case when position('@' in coalesce(r.cliente_contatto, '')) > 0 then '' else coalesce(r.cliente_contatto, '') end,
        '', '', '', '', 'rete')
      where id = r.id;
    end loop;
  end if;
  if to_regclass('marketplace.app_fe_documenti') is not null then
    for r in select * from marketplace.app_fe_documenti where soggetto is null and cliente_dati is not null loop
      v_nome := coalesce(nullif(r.cliente_dati->>'denominazione', ''), btrim(coalesce(r.cliente_dati->>'nome', '') || ' ' || coalesce(r.cliente_dati->>'cognome', '')));
      v_piva := coalesce(r.cliente_dati->>'piva', r.cliente_dati->>'partita_iva', '');
      v := marketplace.app_soggetto_assicura(
        case when length(marketplace.app_solo_cifre(v_piva)) = 11 then 'azienda' else 'persona' end,
        coalesce(r.cliente_dati->>'nome', ''), coalesce(r.cliente_dati->>'cognome', ''),
        case when length(marketplace.app_solo_cifre(v_piva)) = 11 then v_nome else '' end,
        coalesce(r.cliente_dati->>'cf', ''), v_piva, coalesce(r.cliente_dati->>'email', r.cliente_dati->>'mail', ''),
        coalesce(r.cliente_dati->>'telefono', ''), '', '', '', '', 'import');
      update marketplace.app_fe_documenti set soggetto = v where id = r.id;
    end loop;
  end if;
  if to_regclass('marketplace.app_sopralluoghi') is not null then
    for r in select * from marketplace.app_sopralluoghi where soggetto is null loop
      v_nome := coalesce(nullif(r.cliente_dati->>'denominazione', ''), btrim(coalesce(r.cliente_dati->>'nome', '') || ' ' || coalesce(r.cliente_dati->>'cognome', '')));
      v_piva := coalesce(r.cliente_dati->>'piva', '');
      v := marketplace.app_soggetto_assicura(
        case when length(marketplace.app_solo_cifre(v_piva)) = 11 then 'azienda' else 'persona' end,
        coalesce(r.cliente_dati->>'nome', ''), coalesce(r.cliente_dati->>'cognome', ''),
        case when length(marketplace.app_solo_cifre(v_piva)) = 11 then v_nome else '' end,
        '', v_piva, coalesce(r.cliente_dati->>'email', ''), coalesce(r.cliente_dati->>'telefono', ''),
        '', coalesce(r.cliente_dati->>'comune', ''), '', '', 'app');
      update marketplace.app_sopralluoghi set soggetto = v where id = r.id;
    end loop;
  end if;
  if to_regclass('marketplace.app_fornitori_zona') is not null then
    for r in select * from marketplace.app_fornitori_zona where soggetto is null loop
      v := marketplace.app_soggetto_assicura('azienda', '', '', coalesce(r.ditta, r.nome, 'Fornitore'), '', '', r.email, coalesce(r.telefono, ''), '', coalesce(r.comune, ''), '', '', 'import');
      update marketplace.app_fornitori_zona set soggetto = v where id = r.id;
    end loop;
  end if;
  if to_regclass('marketplace.app_contatti') is not null then
    for r in select * from marketplace.app_contatti where soggetto is null and (email <> '' or telefono <> '') loop
      v := marketplace.app_soggetto_assicura('persona', r.nome, '', '', '', coalesce(r.dati->>'piva', ''), r.email, r.telefono, '', '', '', '', 'sito');
      update marketplace.app_contatti set soggetto = v where id = r.id and v is not null;
    end loop;
  end if;
  if to_regclass('marketplace.app_segnalazioni') is not null then
    for r in select * from marketplace.app_segnalazioni where soggetto is null and telefono <> '' loop
      v := marketplace.app_soggetto_assicura('persona', r.nome, '', '', '', '', '', r.telefono, '', '', '', '', 'rete');
      update marketplace.app_segnalazioni set soggetto = v where id = r.id and v is not null;
    end loop;
  end if;
end;
$$;

select marketplace.app_anagrafica_collega();

alter table marketplace.app_soggetti enable row level security;
alter table marketplace.app_rubrica enable row level security;
drop policy if exists app_soggetti_leggi on marketplace.app_soggetti;
create policy app_soggetti_leggi on marketplace.app_soggetti for select to authenticated using (
  marketplace.is_admin()
  or account = auth.uid()
  or exists (select 1 from marketplace.app_rubrica r where r.soggetto = app_soggetti.id and marketplace.app_vedo_org(r.org))
);
drop policy if exists app_rubrica_leggi on marketplace.app_rubrica;
create policy app_rubrica_leggi on marketplace.app_rubrica for select to authenticated using (marketplace.app_vedo_org(org) or marketplace.is_admin());

revoke all on marketplace.app_soggetti from public, anon;
revoke all on marketplace.app_rubrica from public, anon;
grant select on marketplace.app_soggetti to authenticated;
grant select on marketplace.app_rubrica to authenticated;
do $$ begin
  if to_regclass('marketplace.app_albo') is not null then
    execute 'revoke all on marketplace.app_albo from public, anon';
    execute 'grant select on marketplace.app_albo to authenticated';
  end if;
end $$;

revoke all on function marketplace.app_soggetto_assicura(text, text, text, text, text, text, text, text, text, text, text, text, text) from public, anon;
revoke all on function marketplace.app_soggetto_in_rubrica(uuid, text, text, text, text, text, text, uuid) from public, anon;
grant execute on function marketplace.app_soggetto_in_rubrica(uuid, text, text, text, text, text, text, uuid) to authenticated;
grant execute on function marketplace.app_rubrica_elenco(text, text) to authenticated;
grant execute on function marketplace.app_soggetto_scheda(uuid) to authenticated;
grant execute on function marketplace.app_cliente_libero(text, text, text) to authenticated;
revoke all on function marketplace.app_soggetti_doppioni() from public, anon, authenticated;
grant execute on function marketplace.app_soggetti_doppioni() to authenticated;
revoke all on function marketplace.app_soggetti_unisci(uuid, uuid) from public, anon;
grant execute on function marketplace.app_soggetti_unisci(uuid, uuid) to authenticated;
revoke all on function marketplace.app_soggetti_diversi(uuid, uuid) from public, anon;
grant execute on function marketplace.app_soggetti_diversi(uuid, uuid) to authenticated;
