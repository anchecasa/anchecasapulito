-- =============================================================================
-- AncheCasa app · parte 5: PROPOSTE NELLA RETE e DECISIONE INSIEME (10.10.2026)
-- Da eseguire DOPO app-04. Si può rieseguire senza danni.
--
-- Regole decise da Nando:
--  - Nella rete nessuno entra senza il sì dell'admin e del Responsabile Rete Italia.
--  - Tutti possono proporre una persona (sviluppo rete, capoarea, agente, sub-agente).
--  - Decidono insieme: admin, Responsabile Rete Italia e lo sviluppo rete dell'area.
--    Entra se dicono sì l'admin, il Responsabile Rete Italia (se c'è) e lo sviluppo rete dell'area (se c'è).
--    Basta un no di uno dei tre e la proposta è respinta.
--  - Solo l'admin crea direttamente l'invito del Responsabile Rete Italia.
--  - Quando la proposta passa, l'invito nasce da solo e chi ha proposto riceve il link.
-- =============================================================================

create table if not exists marketplace.app_proposte_rete (
  id uuid primary key default gen_random_uuid(),
  proposto_da uuid not null references auth.users(id) on delete cascade,
  ruolo text not null check (ruolo in ('sviluppo', 'capoarea', 'agente', 'subagente')),
  nome text not null check (length(btrim(nome)) between 2 and 80),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono text not null default '' check (length(telefono) <= 40),
  regione text not null default '' check (length(regione) <= 40),
  area text not null default '' check (area in ('', 'Nord', 'Centro', 'Sud e isole')),
  superiore uuid references auth.users(id) on delete set null,
  note text not null default '' check (length(note) <= 600),
  voto_admin text check (voto_admin in ('si', 'no')),
  voto_reteitalia text check (voto_reteitalia in ('si', 'no')),
  voto_sviluppo text check (voto_sviluppo in ('si', 'no')),
  serve_reteitalia boolean not null default true,
  serve_sviluppo boolean not null default false,
  commenti jsonb not null default '[]'::jsonb,
  stato text not null default 'proposta' check (stato in ('proposta', 'approvata', 'respinta')),
  invito uuid references marketplace.app_inviti(id) on delete set null,
  creato timestamptz not null default now(),
  deciso timestamptz
);
alter table marketplace.app_proposte_rete enable row level security;

-- area di una regione
create or replace function marketplace.app_area_di(p_regione text)
returns text language sql immutable set search_path = marketplace, public as $$
  select case
    when p_regione = any (marketplace.app_regioni_area('Nord')) then 'Nord'
    when p_regione = any (marketplace.app_regioni_area('Centro')) then 'Centro'
    when p_regione = any (marketplace.app_regioni_area('Sud e isole')) then 'Sud e isole'
    else '' end;
$$;

-- il mio ruolo nella rete (attivo)
create or replace function marketplace.app_mio_ruolo_rete()
returns text language sql stable security definer set search_path = marketplace, public as $$
  select ruolo from marketplace.app_rete where utente = auth.uid() and stato = 'attivo';
$$;

-- chi vede una proposta: chi l'ha fatta, l'admin, il Responsabile Rete Italia, lo sviluppo rete di quell'area
create or replace function marketplace.app_vedo_proposta(p_proposto_da uuid, p_area text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select p_proposto_da = auth.uid() or marketplace.is_admin() or marketplace.app_sono_rete_italia()
    or exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo' and ruolo = 'sviluppo' and area = p_area and p_area <> '');
$$;
drop policy if exists app_proposte_leggi on marketplace.app_proposte_rete;
create policy app_proposte_leggi on marketplace.app_proposte_rete for select using (marketplace.app_vedo_proposta(proposto_da, area));
revoke insert, update, delete on marketplace.app_proposte_rete from authenticated, anon;
grant select on marketplace.app_proposte_rete to authenticated;

-- inviti diretti nella rete: solo l'admin, e solo per il Responsabile Rete Italia
create or replace function marketplace.app_puo_invitare(p_cosa text, p_target uuid, p_ruolo text)
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  if p_cosa = 'rete' then return marketplace.is_admin() and p_ruolo = 'reteitalia'; end if;
  if marketplace.is_admin() then return true; end if;
  if p_cosa = 'org' then return marketplace.app_gestisce(p_target); end if;
  if p_cosa = 'cantiere' then
    return exists (select 1 from marketplace.app_record r where r.id = p_target and r.tipo = 'cantiere' and marketplace.app_gestisce(r.org));
  end if;
  return false;
end;
$$;

-- esito: quando ci sono tutti i sì, nasce l'invito; un no respinge
create or replace function marketplace.app_proposta_esito(p_id uuid)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  p marketplace.app_proposte_rete%rowtype;
  v_inv uuid;
begin
  select * into p from marketplace.app_proposte_rete where id = p_id for update;
  if p.stato <> 'proposta' then return p.stato; end if;
  if p.voto_admin = 'no' or p.voto_reteitalia = 'no' or p.voto_sviluppo = 'no' then
    update marketplace.app_proposte_rete set stato = 'respinta', deciso = now() where id = p_id;
    perform marketplace.app_notifica(p.proposto_da, 'Proposta non accolta: ' || p.nome, 'rete-proposte');
    return 'respinta';
  end if;
  if p.voto_admin = 'si' and (not p.serve_reteitalia or p.voto_reteitalia = 'si') and (not p.serve_sviluppo or p.voto_sviluppo = 'si') then
    insert into marketplace.app_inviti (cosa, ruolo, email, nome, creato_da)
      values ('rete', p.ruolo, lower(p.email), p.nome, p.proposto_da) returning id into v_inv;
    update marketplace.app_proposte_rete set stato = 'approvata', deciso = now(), invito = v_inv where id = p_id;
    perform marketplace.app_notifica(p.proposto_da, 'Approvata: ' || p.nome || '. Manda il link d''invito.', 'rete-proposte');
    perform marketplace.app_notifica_admin('Rete: approvato ' || p.nome || ', invito pronto', 'rete-proposte');
    return 'approvata';
  end if;
  return 'proposta';
end;
$$;

-- proporre una persona
create or replace function marketplace.app_proponi_rete(p_ruolo text, p_nome text, p_email text, p_telefono text, p_regione text, p_note text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_mio text; v_admin boolean; v_area text; v_sup uuid; v_id uuid; v_ri uuid; v_sv uuid;
  livello int; liv_mio int;
begin
  v_admin := marketplace.is_admin();
  v_mio := marketplace.app_mio_ruolo_rete();
  if not v_admin and v_mio is null then raise exception 'non_autorizzato'; end if;
  if p_ruolo not in ('sviluppo', 'capoarea', 'agente', 'subagente') then raise exception 'ruolo_non_valido'; end if;
  if exists (select 1 from marketplace.app_proposte_rete where lower(email) = lower(p_email) and stato = 'proposta') then raise exception 'gia_proposto'; end if;
  v_area := marketplace.app_area_di(coalesce(p_regione, ''));
  if v_area = '' then select area into v_area from marketplace.app_rete where utente = auth.uid(); v_area := coalesce(v_area, ''); end if;
  -- va sotto chi propone se è il livello giusto subito sopra
  livello := array_position(array['reteitalia', 'sviluppo', 'capoarea', 'agente', 'subagente'], p_ruolo);
  liv_mio := array_position(array['reteitalia', 'sviluppo', 'capoarea', 'agente', 'subagente'], v_mio);
  if liv_mio is not null and liv_mio = livello - 1 then v_sup := auth.uid(); end if;
  select utente into v_ri from marketplace.app_rete where ruolo = 'reteitalia' and stato = 'attivo' order by creato limit 1;
  select utente into v_sv from marketplace.app_rete where ruolo = 'sviluppo' and stato = 'attivo' and area = v_area and v_area <> '' order by creato limit 1;
  insert into marketplace.app_proposte_rete (proposto_da, ruolo, nome, email, telefono, regione, area, superiore, note,
      serve_reteitalia, serve_sviluppo, voto_admin, voto_reteitalia, voto_sviluppo)
    values (auth.uid(), p_ruolo, btrim(p_nome), lower(btrim(p_email)), coalesce(p_telefono, ''), coalesce(p_regione, ''), v_area, v_sup, coalesce(p_note, ''),
      v_ri is not null, v_sv is not null and p_ruolo <> 'sviluppo',
      case when v_admin then 'si' end, case when v_mio = 'reteitalia' then 'si' end, case when v_mio = 'sviluppo' and p_ruolo <> 'sviluppo' then 'si' end)
    returning id into v_id;
  perform marketplace.app_notifica_admin('Rete: nuova proposta, ' || btrim(p_nome), 'rete-proposte');
  if v_ri is not null and v_ri <> auth.uid() then perform marketplace.app_notifica(v_ri, 'Proposta da decidere: ' || btrim(p_nome), 'rete-proposte'); end if;
  if v_sv is not null and v_sv <> auth.uid() and p_ruolo <> 'sviluppo' then perform marketplace.app_notifica(v_sv, 'Proposta da decidere: ' || btrim(p_nome), 'rete-proposte'); end if;
  perform marketplace.app_proposta_esito(v_id);
  return v_id;
end;
$$;

-- votare: admin, Responsabile Rete Italia, sviluppo rete dell'area
create or replace function marketplace.app_vota_proposta(p_id uuid, p_si boolean, p_nota text)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  p marketplace.app_proposte_rete%rowtype;
  v_chi text; v_voto text := case when p_si then 'si' else 'no' end;
begin
  select * into p from marketplace.app_proposte_rete where id = p_id;
  if not found or p.stato <> 'proposta' then raise exception 'proposta_chiusa'; end if;
  if marketplace.is_admin() then v_chi := 'admin';
  elsif marketplace.app_mio_ruolo_rete() = 'reteitalia' then v_chi := 'reteitalia';
  elsif exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo' and ruolo = 'sviluppo' and area = p.area and p.area <> '') and p.serve_sviluppo then v_chi := 'sviluppo';
  else raise exception 'non_autorizzato'; end if;
  if v_chi = 'admin' then update marketplace.app_proposte_rete set voto_admin = v_voto where id = p_id;
  elsif v_chi = 'reteitalia' then update marketplace.app_proposte_rete set voto_reteitalia = v_voto where id = p_id;
  else update marketplace.app_proposte_rete set voto_sviluppo = v_voto where id = p_id; end if;
  update marketplace.app_proposte_rete set commenti = commenti || jsonb_build_array(jsonb_build_object('chi', v_chi, 'voto', v_voto, 'nota', left(coalesce(p_nota, ''), 300), 'quando', now()))
    where id = p_id;
  return marketplace.app_proposta_esito(p_id);
end;
$$;

-- accettare un invito della rete: il posto nella catena e la zona arrivano dalla proposta
create or replace function marketplace.app_accetta_invito(p_token text)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  i marketplace.app_inviti%rowtype;
  s marketplace.app_rete%rowtype;
  pr marketplace.app_proposte_rete%rowtype;
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
    if exists (select 1 from marketplace.app_rete where utente = auth.uid()) then raise exception 'gia_nella_rete'; end if;
    select * into pr from marketplace.app_proposte_rete where invito = i.id;
    if found then
      insert into marketplace.app_rete (utente, ruolo, superiore, nome, area, regione)
        values (auth.uid(), i.ruolo, pr.superiore, i.nome, pr.area, pr.regione);
    else
      select * into s from marketplace.app_rete where utente = i.creato_da;
      insert into marketplace.app_rete (utente, ruolo, superiore, nome, area, regione)
        values (auth.uid(), i.ruolo, case when found then i.creato_da else null end, i.nome, coalesce(s.area, ''), coalesce(s.regione, ''));
    end if;
  end if;
  update marketplace.app_inviti set stato = 'accettato' where id = i.id;
  return jsonb_build_object('cosa', i.cosa, 'ruolo', i.ruolo, 'target', i.target);
end;
$$;

-- il link dell'invito nato da una proposta lo vedono chi ha proposto e l'admin
drop policy if exists app_inviti_leggi on marketplace.app_inviti;
create policy app_inviti_leggi on marketplace.app_inviti for select using (creato_da = auth.uid() or marketplace.is_admin());

revoke all on function marketplace.app_proposta_esito(uuid) from public, anon, authenticated;
revoke all on function marketplace.app_mio_ruolo_rete() from public, anon;
revoke all on function marketplace.app_vedo_proposta(uuid, text) from public, anon;
grant execute on function marketplace.app_proponi_rete(text, text, text, text, text, text) to authenticated;
grant execute on function marketplace.app_vota_proposta(uuid, boolean, text) to authenticated;
grant execute on function marketplace.app_mio_ruolo_rete() to authenticated;
grant execute on function marketplace.app_vedo_proposta(uuid, text) to authenticated;
grant execute on function marketplace.app_area_di(text) to authenticated;
