-- =============================================================================
-- AncheCasa app · parte 4: RESPONSABILE RETE ITALIA e nuove quote della rete (09.10.2026)
-- Da eseguire DOPO app-01, app-02 e app-03. Si può rieseguire senza danni.
--
-- Rete: Responsabile Rete Italia → Sviluppo rete (Nord, Centro, Sud e isole) → Capoarea → Agente → Sub-agente.
-- Quote della rete sul venduto (decise da Nando il 09.10.2026, come nei contratti):
--   chi porta il cliente 70% · sviluppo rete 17% · capo area 8% · Responsabile Rete Italia 5%.
--   Il sub-agente tiene il 70% della quota di chi porta il cliente, il 30% va al suo agente.
-- =============================================================================

-- 1. Il nuovo ruolo nelle tabelle della rete e degli inviti
do $$
declare c record;
begin
  for c in select conname from pg_constraint where conrelid = 'marketplace.app_rete'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%ruolo%' loop
    execute format('alter table marketplace.app_rete drop constraint %I', c.conname);
  end loop;
  for c in select conname from pg_constraint where conrelid = 'marketplace.app_inviti'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%cantiere%' loop
    execute format('alter table marketplace.app_inviti drop constraint %I', c.conname);
  end loop;
end $$;
alter table marketplace.app_rete add constraint app_rete_ruolo_check check (ruolo in ('reteitalia', 'sviluppo', 'capoarea', 'agente', 'subagente'));
alter table marketplace.app_inviti add constraint app_inviti_cosa_ruolo_check check (
  (cosa = 'org' and ruolo in ('responsabile', 'operatore', 'consulente') and target is not null)
  or (cosa = 'cantiere' and ruolo in ('cliente', 'partner') and target is not null)
  or (cosa = 'rete' and ruolo in ('reteitalia', 'sviluppo', 'capoarea', 'agente', 'subagente'))
);

-- 2. Chi può invitare chi: il Responsabile Rete Italia invita gli sviluppo rete (lui lo crea solo l'admin)
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
    return (v_mio = 'reteitalia' and p_ruolo = 'sviluppo') or (v_mio = 'sviluppo' and p_ruolo = 'capoarea')
      or (v_mio = 'capoarea' and p_ruolo = 'agente') or (v_mio = 'agente' and p_ruolo = 'subagente');
  end if;
  return false;
end;
$$;

-- 3. Il Responsabile Rete Italia vede tutta la rete (persone, vendite, provvigioni)
create or replace function marketplace.app_sono_rete_italia()
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.app_rete where utente = auth.uid() and ruolo = 'reteitalia' and stato = 'attivo');
$$;
create or replace function marketplace.app_nella_mia_rete(p_utente uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select p_utente = auth.uid() or marketplace.is_admin() or marketplace.app_sono_rete_italia()
    or p_utente in (select marketplace.app_sotto(auth.uid()));
$$;
revoke all on function marketplace.app_sono_rete_italia() from public, anon;
grant execute on function marketplace.app_sono_rete_italia() to authenticated;

-- 4. Nuove quote nelle impostazioni (l'admin le può cambiare dall'app)
insert into marketplace.app_impostazioni (chiave, valore) values ('provvigioni', '{}'::jsonb) on conflict (chiave) do nothing;
update marketplace.app_impostazioni
  set valore = valore || '{"chi_porta":70,"subagente":70,"agente":30,"sviluppo":17,"capoarea":8,"reteitalia":5,"nota":"Quote della rete decise il 09.10.2026: 70 chi porta il cliente, 17 sviluppo rete, 8 capo area, 5 Responsabile Rete Italia."}'::jsonb
  where chiave = 'provvigioni';

-- 5. Provvigioni quando l'admin conferma una vendita
--    monte = importo × percentuale_vendita. Poi: chi porta il cliente, e le quote di ruolo di chi sta sopra
--    (capo area, sviluppo rete, Rete Italia: la prima persona con quel ruolo nella catena, venditore compreso).
--    La quota Rete Italia va comunque al Responsabile Rete Italia attivo, anche se non è nella catena.
create or replace function marketplace.app_vendita_provvigioni()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  p jsonb;
  monte numeric;
  porta numeric;
  v_ruolo text;
  v_sup uuid;
  v_cur uuid;
  v_r text;
  v_ri uuid;
  pagati text[] := array[]::text[];
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
  porta := monte * coalesce((p->>'chi_porta')::numeric, 70) / 100;
  select ruolo, superiore into v_ruolo, v_sup from marketplace.app_rete where utente = new.venditore;
  if v_ruolo = 'subagente' and v_sup is not null then
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values
      (new.id, new.venditore, 'subagente', round(porta * coalesce((p->>'subagente')::numeric, 70) / 100, 2)),
      (new.id, v_sup, 'agente', round(porta * coalesce((p->>'agente')::numeric, 30) / 100, 2));
  else
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, new.venditore, coalesce(v_ruolo, 'venditore'), round(porta, 2));
  end if;
  -- quote di ruolo lungo la catena (venditore compreso)
  v_cur := new.venditore;
  for i in 1..7 loop
    exit when v_cur is null;
    select ruolo, superiore into v_r, v_sup from marketplace.app_rete where utente = v_cur and stato = 'attivo';
    if v_r in ('capoarea', 'sviluppo', 'reteitalia') and not (v_r = any (pagati)) then
      v_quota := round(monte * coalesce((p->>v_r)::numeric, 0) / 100, 2);
      if v_quota > 0 then insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, v_cur, v_r, v_quota); end if;
      pagati := pagati || v_r;
    end if;
    v_cur := v_sup;
  end loop;
  if not ('reteitalia' = any (pagati)) then
    select utente into v_ri from marketplace.app_rete where ruolo = 'reteitalia' and stato = 'attivo' order by creato limit 1;
    v_quota := round(monte * coalesce((p->>'reteitalia')::numeric, 0) / 100, 2);
    if v_ri is not null and v_quota > 0 then insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, v_ri, 'reteitalia', v_quota); end if;
  end if;
  return new;
end;
$$;

-- 6. Report recensioni: il Responsabile Rete Italia vede tutta Italia
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
    if v_ruolo = 'reteitalia' then v_regioni := null;
    elsif v_ruolo = 'sviluppo' then v_regioni := marketplace.app_regioni_area(v_area);
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
