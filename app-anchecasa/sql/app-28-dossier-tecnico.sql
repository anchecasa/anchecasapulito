-- app-28 · Il dossier del tecnico AncheCasa (12.10.2026, approvato da Nando alle 15:12)
--
--   · L'agente, dal sopralluogo, salva le misure di ogni stanza, i dati della casa (piano, ascensore, accesso…) e le cose da controllare.
--     La planimetria la fotografa in casa: è una foto della pratica con nota «Planimetria».
--   · Il tecnico (per ora l'admin; poi l'account del tecnico abilitato, colonna tecnico_id) apre il DOSSIER: misure, pre-computo,
--     foto, note vocali, dati del comune, domande all'agente nell'app, scadenza 5 giorni o 48 ore.
--   · I dati del comune stanno in marketplace.comuni_dati: li riempie Terranova (o l'admin a mano dal dossier).
--   · «Manda il preventivo al cliente»: fotografa il computo (solo prezzi al cliente, mai i costi) in «preventivo».
--     La mail la manda la funzione «sopralluogo-invito» (azione "preventivo"); il cliente lo vede e lo accetta dalla sua pagina.
--   · «Analizza con l'IA» (funzione «dossier-ia», chiave GEMINI_API_KEY): trascrive le note vocali, legge la planimetria e le foto,
--     propone stanze e voci (mai prezzi). Il risultato sta nella colonna «ia»: il tecnico e l'agente lo confermano.
-- Da eseguire DOPO app-27. Si può rilanciare.

begin;

alter table marketplace.ristrutturazioni add column if not exists ambienti jsonb not null default '[]'::jsonb;
alter table marketplace.ristrutturazioni add column if not exists immobile jsonb not null default '{}'::jsonb;
alter table marketplace.ristrutturazioni add column if not exists criticita text not null default '';
alter table marketplace.ristrutturazioni add column if not exists tecnico_id uuid references auth.users (id) on delete set null;
alter table marketplace.ristrutturazioni add column if not exists preventivo jsonb;
alter table marketplace.ristrutturazioni add column if not exists preventivo_mandato_il timestamptz;
alter table marketplace.ristrutturazioni add column if not exists preventivo_accettato_il timestamptz;
-- Lettura dell'intelligenza artificiale (funzione «dossier-ia», Gemini): trascrizioni, stanze dalla planimetria, voci proposte, dubbi.
alter table marketplace.ristrutturazioni add column if not exists ia jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ristrutturazioni_criticita_len') then
    alter table marketplace.ristrutturazioni add constraint ristrutturazioni_criticita_len check (length(criticita) <= 1500);
  end if;
end $$;

-- Le domande tra tecnico e agente: solo nell'app (niente telefono, niente WhatsApp).
create table if not exists marketplace.ristrutturazioni_messaggi (
  id                  uuid primary key default gen_random_uuid(),
  ristrutturazione_id uuid not null references marketplace.ristrutturazioni (id) on delete cascade,
  autore              uuid references auth.users (id) on delete set null default auth.uid(),
  testo               text not null check (length(btrim(testo)) between 1 and 1000),
  creato              timestamptz not null default now()
);
create index if not exists ristrutturazioni_messaggi_pratica on marketplace.ristrutturazioni_messaggi (ristrutturazione_id, creato);
alter table marketplace.ristrutturazioni_messaggi enable row level security;
-- Nessuna policy: si legge e si scrive solo con le funzioni qui sotto.

-- I dati del territorio, comune per comune (li porta Terranova; l'admin può correggerli).
create table if not exists marketplace.comuni_dati (
  comune          text not null check (length(comune) between 1 and 80),
  provincia       text not null check (length(provincia) <= 2),
  zona_sismica    text not null default '' check (length(zona_sismica) <= 10),
  zona_climatica  text not null default '' check (length(zona_climatica) <= 4),
  prezzario       text not null default '' check (length(prezzario) <= 80),
  omi_min         numeric(10, 2),
  omi_max         numeric(10, 2),
  vincoli         text not null default '' check (length(vincoli) <= 500),
  fonte           text not null default 'terranova' check (length(fonte) <= 40),
  aggiornato      timestamptz not null default now(),
  primary key (comune, provincia)
);
alter table marketplace.comuni_dati enable row level security;
drop policy if exists comuni_dati_leggi on marketplace.comuni_dati;
create policy comuni_dati_leggi on marketplace.comuni_dati for select to authenticated using (true);
drop policy if exists comuni_dati_admin on marketplace.comuni_dati;
create policy comuni_dati_admin on marketplace.comuni_dati for all using (marketplace.is_admin()) with check (marketplace.is_admin());

-- Chi può lavorare sulla pratica: admin, agente del sopralluogo, tecnico assegnato.
create or replace function marketplace.ristrutturazione_puo(p_id uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select auth.uid() is not null and (marketplace.is_admin() or exists (select 1 from marketplace.ristrutturazioni r
    where r.id = p_id and (r.agente_id = auth.uid() or r.tecnico_id = auth.uid())));
$$;
-- Chi prepara il preventivo: admin o tecnico assegnato.
create or replace function marketplace.ristrutturazione_tecnico_puo(p_id uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select auth.uid() is not null and (marketplace.is_admin() or exists (select 1 from marketplace.ristrutturazioni r where r.id = p_id and r.tecnico_id = auth.uid()));
$$;

-- L'agente salva misure, dati della casa e cose da controllare.
-- ambienti: [{ id, nome, larg, lung, alt, h_riv, porta, finestra, note }] (metri); immobile: { piano, ascensore, condominio, anno, accesso, parcheggio, tempi }
create or replace function marketplace.ristrutturazione_misure(p_id uuid, p_ambienti jsonb, p_immobile jsonb, p_criticita text)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.ristrutturazione_puo(p_id) then raise exception 'non_autorizzato'; end if;
  if jsonb_typeof(coalesce(p_ambienti, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_ambienti, '[]'::jsonb)) > 30 then raise exception 'ambienti_non_validi'; end if;
  if jsonb_typeof(coalesce(p_immobile, '{}'::jsonb)) <> 'object' then raise exception 'immobile_non_valido'; end if;
  if length(coalesce(p_ambienti, '[]'::jsonb)::text) > 20000 or length(coalesce(p_immobile, '{}'::jsonb)::text) > 4000 then raise exception 'troppo_lungo'; end if;
  update marketplace.ristrutturazioni set ambienti = coalesce(p_ambienti, '[]'::jsonb), immobile = coalesce(p_immobile, '{}'::jsonb),
    criticita = left(coalesce(p_criticita, ''), 1500)
  where id = p_id;
end;
$$;

-- Messaggi della pratica.
create or replace function marketplace.ristrutturazione_messaggio(p_id uuid, p_testo text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid;
begin
  if not marketplace.ristrutturazione_puo(p_id) then raise exception 'non_autorizzato'; end if;
  if length(btrim(coalesce(p_testo, ''))) not between 1 and 1000 then raise exception 'testo_non_valido'; end if;
  insert into marketplace.ristrutturazioni_messaggi (ristrutturazione_id, autore, testo) values (p_id, auth.uid(), btrim(p_testo)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function marketplace.ristrutturazione_messaggi(p_id uuid)
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select case when not marketplace.ristrutturazione_puo(p_id) then null else coalesce((select jsonb_agg(jsonb_build_object(
      'id', m.id, 'testo', m.testo, 'creato', m.creato, 'mio', m.autore = auth.uid(), 'autore', coalesce(p.nome, 'AncheCasa')) order by m.creato)
    from marketplace.ristrutturazioni_messaggi m left join marketplace.profiles p on p.id = m.autore where m.ristrutturazione_id = p_id), '[]'::jsonb) end;
$$;

-- Il dossier completo per il tecnico.
create or replace function marketplace.ristrutturazione_dossier(p_id uuid)
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select case when not marketplace.ristrutturazione_tecnico_puo(p_id) then null else (
    select to_jsonb(r) || jsonb_build_object(
      'agente', coalesce(pa.nome, ''), 'tecnico', coalesce(pt.nome, ''),
      'media', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'path', m.path, 'tipo', m.tipo, 'nota', m.nota, 'creato', m.creato) order by m.creato)
        from marketplace.ristrutturazioni_media m where m.ristrutturazione_id = r.id), '[]'::jsonb),
      'messaggi', marketplace.ristrutturazione_messaggi(r.id),
      'territorio', (select to_jsonb(c) from marketplace.comuni_dati c where lower(c.comune) = lower(r.comune) and upper(c.provincia) = upper(r.provincia)))
    from marketplace.ristrutturazioni r left join marketplace.profiles pa on pa.id = r.agente_id left join marketplace.profiles pt on pt.id = r.tecnico_id
    where r.id = p_id) end;
$$;

-- L'admin assegna la pratica a un tecnico (quando ci saranno gli account dei tecnici abilitati).
create or replace function marketplace.ristrutturazione_assegna_tecnico(p_id uuid, p_tecnico uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  update marketplace.ristrutturazioni set tecnico_id = p_tecnico where id = p_id;
  if not found then raise exception 'non_trovata'; end if;
end;
$$;

-- Il computo lo salva anche il tecnico assegnato (stessa firma di app-26).
create or replace function marketplace.ristrutturazione_computo(p_id uuid, p_computo jsonb, p_sicurezza numeric, p_spese numeric)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.ristrutturazione_tecnico_puo(p_id) then raise exception 'solo_admin'; end if;
  if jsonb_typeof(p_computo) <> 'array' or jsonb_array_length(p_computo) > 200 then raise exception 'computo_non_valido'; end if;
  update marketplace.ristrutturazioni set computo = p_computo, sicurezza_perc = greatest(0, least(100, coalesce(p_sicurezza, 0))),
    spese_perc = greatest(0, least(100, coalesce(p_spese, 0)))
  where id = p_id;
  if not found then raise exception 'non_trovata'; end if;
end;
$$;

-- «Manda il preventivo al cliente»: fotografia del computo con i soli prezzi al cliente.
create or replace function marketplace.ristrutturazione_prepara_preventivo(p_id uuid, p_nota text)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_r marketplace.ristrutturazioni;
  v_voci jsonb;
  v_tot numeric;
  v_agente text;
begin
  if not marketplace.ristrutturazione_tecnico_puo(p_id) then raise exception 'non_autorizzato'; end if;
  select * into v_r from marketplace.ristrutturazioni where id = p_id for update;
  if not found then raise exception 'non_trovata'; end if;
  if v_r.stato in ('chiusa', 'persa') then raise exception 'pratica_chiusa'; end if;
  if v_r.link is null or coalesce(v_r.mail, '') = '' then raise exception 'manca_invio_sopralluogo'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('voce', x->>'voce', 'servizio', coalesce(x->>'servizio', ''),
           'qta', coalesce(nullif(x->>'qta', '')::numeric, 1), 'um', coalesce(x->>'um', ''),
           'prezzo', nullif(x->>'prezzo', '')::numeric,
           'totale', round(nullif(x->>'prezzo', '')::numeric * coalesce(nullif(x->>'qta', '')::numeric, 1), 2))), '[]'::jsonb),
         coalesce(sum(round(nullif(x->>'prezzo', '')::numeric * coalesce(nullif(x->>'qta', '')::numeric, 1), 2)), 0)
    into v_voci, v_tot
  from jsonb_array_elements(v_r.computo) x
  where length(coalesce(x->>'voce', '')) >= 2 and nullif(x->>'prezzo', '') is not null;

  if jsonb_array_length(v_voci) = 0 or v_tot <= 0 then raise exception 'computo_senza_prezzi'; end if;

  update marketplace.ristrutturazioni set
    preventivo = jsonb_build_object('voci', v_voci, 'totale', v_tot, 'nota', left(coalesce(p_nota, ''), 1000), 'creato', now(), 'iva', 'esclusa'),
    preventivo_mandato_il = now(), preventivo_accettato_il = null, importo_cliente = v_tot
  where id = p_id
  returning * into v_r;

  select nome into v_agente from marketplace.profiles where id = v_r.agente_id;
  return jsonb_build_object('id', v_r.id, 'link', v_r.link, 'mail', v_r.mail, 'nome', v_r.nome, 'comune', v_r.comune,
    'totale', v_tot, 'voci', jsonb_array_length(v_voci), 'agente', coalesce(v_agente, 'il tuo consulente AncheCasa'), 'agente_id', v_r.agente_id);
end;
$$;

-- I sopralluoghi dell'agente: ora anche misure, casa e cose da controllare (sostituisce quella di app-27).
create or replace function marketplace.miei_sopralluoghi()
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'creato', r.creato, 'nome', r.nome, 'telefono', r.telefono, 'mail', r.mail, 'comune', r.comune,
    'provincia', r.provincia, 'indirizzo', r.indirizzo, 'descrizione', r.descrizione, 'budget', r.budget, 'nota_agente', r.nota_agente, 'stato', r.stato,
    'riepilogo', r.riepilogo, 'pacchetto', r.pacchetto, 'urgente', r.urgente, 'preventivo_entro', r.preventivo_entro,
    'inviato_cliente_il', r.inviato_cliente_il, 'aperto_cliente_il', r.aperto_cliente_il, 'cliente_ok_il', r.cliente_ok_il,
    'ambienti', r.ambienti, 'immobile', r.immobile, 'criticita', r.criticita, 'ia', r.ia,
    'preventivo_mandato_il', r.preventivo_mandato_il, 'preventivo_accettato_il', r.preventivo_accettato_il,
    'media', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'path', m.path, 'tipo', m.tipo, 'nota', m.nota, 'creato', m.creato) order by m.creato)
      from marketplace.ristrutturazioni_media m where m.ristrutturazione_id = r.id), '[]'::jsonb)) order by r.creato desc), '[]'::jsonb)
  from marketplace.ristrutturazioni r where r.agente_id = auth.uid();
$$;

revoke all on function marketplace.ristrutturazione_puo(uuid), marketplace.ristrutturazione_tecnico_puo(uuid),
  marketplace.ristrutturazione_misure(uuid, jsonb, jsonb, text), marketplace.ristrutturazione_messaggio(uuid, text), marketplace.ristrutturazione_messaggi(uuid),
  marketplace.ristrutturazione_dossier(uuid), marketplace.ristrutturazione_assegna_tecnico(uuid, uuid),
  marketplace.ristrutturazione_computo(uuid, jsonb, numeric, numeric), marketplace.ristrutturazione_prepara_preventivo(uuid, text),
  marketplace.miei_sopralluoghi() from public, anon;
grant execute on function marketplace.ristrutturazione_puo(uuid), marketplace.ristrutturazione_tecnico_puo(uuid),
  marketplace.ristrutturazione_misure(uuid, jsonb, jsonb, text), marketplace.ristrutturazione_messaggio(uuid, text), marketplace.ristrutturazione_messaggi(uuid),
  marketplace.ristrutturazione_dossier(uuid), marketplace.ristrutturazione_assegna_tecnico(uuid, uuid),
  marketplace.ristrutturazione_computo(uuid, jsonb, numeric, numeric), marketplace.ristrutturazione_prepara_preventivo(uuid, text),
  marketplace.miei_sopralluoghi() to authenticated;

-- Il tecnico assegnato vede le foto della sua pratica nel bucket privato «sopralluoghi».
drop policy if exists sopralluoghi_tecnico_leggi on storage.objects;
create policy sopralluoghi_tecnico_leggi on storage.objects for select to authenticated
  using (bucket_id = 'sopralluoghi' and exists (select 1 from marketplace.ristrutturazioni r
    where r.id::text = (storage.foldername(name))[1] and r.tecnico_id = auth.uid()));

commit;

-- Controllo (sola lettura):
-- select column_name from information_schema.columns where table_schema = 'marketplace' and table_name = 'ristrutturazioni'
--   and column_name in ('ambienti', 'immobile', 'criticita', 'tecnico_id', 'preventivo', 'preventivo_mandato_il', 'preventivo_accettato_il');
-- select to_regclass('marketplace.ristrutturazioni_messaggi'), to_regclass('marketplace.comuni_dati');
-- select proname from pg_proc where proname in ('ristrutturazione_dossier', 'ristrutturazione_misure', 'ristrutturazione_messaggio', 'ristrutturazione_prepara_preventivo');
