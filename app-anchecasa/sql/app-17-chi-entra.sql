-- =============================================================================
-- AncheCasa app · parte 17: chi fa entrare chi (11.10.2026)
-- Da eseguire dopo app-05. Si può rieseguire senza danni.
--
-- Regola di Nando:
--  - L'admin fa entrare chiunque, senza un altro sì.
--  - I commerciali fanno entrare privati e aziende.
--  - Per sviluppo rete, agenti e sub-agenti i commerciali segnalano.
--  - Quelle segnalazioni le decide solo l'admin. Un sì crea l'invito. Un no le chiude.
--  - Capo area e Responsabile Rete Italia li fa entrare l'admin, direttamente.
-- =============================================================================

-- Nella rete l'invito diretto lo crea solo l'admin, per qualunque ruolo.
-- Organizzazione e cantiere restano come prima.
create or replace function marketplace.app_puo_invitare(p_cosa text, p_target uuid, p_ruolo text)
returns boolean language plpgsql stable security definer set search_path = marketplace, public as $$
begin
  if p_cosa = 'rete' then return marketplace.is_admin(); end if;
  if marketplace.is_admin() then return true; end if;
  if p_cosa = 'org' then return marketplace.app_gestisce(p_target); end if;
  if p_cosa = 'cantiere' then
    return exists (select 1 from marketplace.app_record r where r.id = p_target and r.tipo = 'cantiere' and marketplace.app_gestisce(r.org));
  end if;
  return false;
end;
$$;

-- La segnalazione la vedono chi l'ha fatta e l'admin.
create or replace function marketplace.app_vedo_proposta(p_proposto_da uuid, p_area text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select p_proposto_da = auth.uid() or marketplace.is_admin();
$$;

-- Decide solo il voto dell'admin.
create or replace function marketplace.app_proposta_esito(p_id uuid)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  p marketplace.app_proposte_rete%rowtype;
  v_inv uuid;
begin
  select * into p from marketplace.app_proposte_rete where id = p_id for update;
  if p.stato <> 'proposta' then return p.stato; end if;
  if p.voto_admin = 'no' then
    update marketplace.app_proposte_rete set stato = 'respinta', deciso = now() where id = p_id;
    perform marketplace.app_notifica(p.proposto_da, 'Segnalazione non accolta: ' || p.nome, 'rete-proposte');
    return 'respinta';
  end if;
  if p.voto_admin = 'si' then
    insert into marketplace.app_inviti (cosa, ruolo, email, nome, creato_da)
      values ('rete', p.ruolo, lower(p.email), p.nome, p.proposto_da) returning id into v_inv;
    update marketplace.app_proposte_rete set stato = 'approvata', deciso = now(), invito = v_inv where id = p_id;
    perform marketplace.app_notifica(p.proposto_da, 'Approvata: ' || p.nome || '. Manda il link d''invito.', 'rete-proposte');
    return 'approvata';
  end if;
  return 'proposta';
end;
$$;

-- Segnalare: i commerciali segnalano sviluppo rete, agente o sub-agente.
-- L'admin, se usa questa funzione, approva subito.
create or replace function marketplace.app_proponi_rete(p_ruolo text, p_nome text, p_email text, p_telefono text, p_regione text, p_note text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_mio text; v_admin boolean; v_area text; v_sup uuid; v_id uuid;
  livello int; liv_mio int;
begin
  v_admin := marketplace.is_admin();
  v_mio := marketplace.app_mio_ruolo_rete();
  if not v_admin and v_mio is null then raise exception 'non_autorizzato'; end if;
  if v_admin then
    if p_ruolo not in ('sviluppo', 'capoarea', 'agente', 'subagente') then raise exception 'ruolo_non_valido'; end if;
  elsif p_ruolo not in ('sviluppo', 'agente', 'subagente') then
    raise exception 'ruolo_non_valido';
  end if;
  if exists (select 1 from marketplace.app_proposte_rete where lower(email) = lower(p_email) and stato = 'proposta') then raise exception 'gia_proposto'; end if;
  v_area := marketplace.app_area_di(coalesce(p_regione, ''));
  if v_area = '' then select area into v_area from marketplace.app_rete where utente = auth.uid(); v_area := coalesce(v_area, ''); end if;
  livello := array_position(array['reteitalia', 'sviluppo', 'capoarea', 'agente', 'subagente'], p_ruolo);
  liv_mio := array_position(array['reteitalia', 'sviluppo', 'capoarea', 'agente', 'subagente'], v_mio);
  if liv_mio is not null and liv_mio = livello - 1 then v_sup := auth.uid(); end if;
  insert into marketplace.app_proposte_rete (proposto_da, ruolo, nome, email, telefono, regione, area, superiore, note,
      serve_reteitalia, serve_sviluppo, voto_admin)
    values (auth.uid(), p_ruolo, btrim(p_nome), lower(btrim(p_email)), coalesce(p_telefono, ''), coalesce(p_regione, ''), v_area, v_sup, coalesce(p_note, ''),
      false, false, case when v_admin then 'si' end)
    returning id into v_id;
  if not v_admin then
    perform marketplace.app_notifica_admin('Rete: segnalazione di ' || btrim(p_nome), 'rete-proposte');
  end if;
  perform marketplace.app_proposta_esito(v_id);
  return v_id;
end;
$$;

-- Vota solo l'admin.
create or replace function marketplace.app_vota_proposta(p_id uuid, p_si boolean, p_nota text)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare
  p marketplace.app_proposte_rete%rowtype;
  v_voto text := case when p_si then 'si' else 'no' end;
begin
  if not marketplace.is_admin() then raise exception 'non_autorizzato'; end if;
  select * into p from marketplace.app_proposte_rete where id = p_id;
  if not found or p.stato <> 'proposta' then raise exception 'proposta_chiusa'; end if;
  update marketplace.app_proposte_rete
    set voto_admin = v_voto,
        commenti = commenti || jsonb_build_array(jsonb_build_object('chi', 'admin', 'voto', v_voto, 'nota', left(coalesce(p_nota, ''), 300), 'quando', now()))
    where id = p_id;
  return marketplace.app_proposta_esito(p_id);
end;
$$;

-- Le segnalazioni già aperte aspettano solo l'admin.
update marketplace.app_proposte_rete
set serve_reteitalia = false, serve_sviluppo = false
where stato = 'proposta';

do $$
declare r uuid;
begin
  for r in select id from marketplace.app_proposte_rete where stato = 'proposta' and voto_admin = 'si' loop
    perform marketplace.app_proposta_esito(r);
  end loop;
end $$;
