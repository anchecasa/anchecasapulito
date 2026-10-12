-- app-26 · Ristrutturazioni con Sopralluogo Flash, computo e Profit Guard (12.10.2026, decisioni di Nando 14:28)
--
--   · Sopralluogo Flash dalla dashboard (anche dal telefono): l'agente assegnato, o l'admin, carica foto e note vocali
--     della pratica. Bucket privato «sopralluoghi», cartella = id della ristrutturazione.
--   · Computo della pratica: righe con lavorazione, quantità, prezzo al cliente e costo stimato, più sicurezza e spese generali.
--   · Dalla pratica al cantiere AncheCasa: un clic crea il cantiere (app-25) e le voci del computo diventano richieste
--     alle aziende della zona (materiali, noleggio, lavori, impianti).
--   · Profit Guard: ricavo (prezzo al cliente) meno costi impegnati (imprese affidate + offerte scelte nel cantiere).
--     Sotto la soglia di margine decisa dall'admin (app_impostazioni «profit_guard», app-12) la dashboard avvisa
--     prima di affidare. Gratis per rete e admin.
-- Da eseguire dopo app-24 e app-25. Si può rilanciare.

begin;

alter table marketplace.ristrutturazioni add column if not exists computo jsonb not null default '[]'::jsonb;
alter table marketplace.ristrutturazioni add column if not exists sicurezza_perc numeric(5, 2) not null default 0;
alter table marketplace.ristrutturazioni add column if not exists spese_perc numeric(5, 2) not null default 0;
alter table marketplace.ristrutturazioni add column if not exists cantiere_id uuid references marketplace.cantieri (id) on delete set null;

insert into marketplace.app_impostazioni (chiave, valore) values ('profit_guard', '{"margine_minimo": null}'::jsonb)
on conflict (chiave) do nothing;

-- ---------------------------------------------------------------------------
-- 1. SOPRALLUOGO FLASH: foto e note vocali della pratica
-- ---------------------------------------------------------------------------
create table if not exists marketplace.ristrutturazioni_media (
  id                  uuid primary key default gen_random_uuid(),
  ristrutturazione_id uuid not null references marketplace.ristrutturazioni (id) on delete cascade,
  path                text not null check (length(path) <= 300),
  tipo                text not null check (tipo in ('foto', 'audio')),
  nota                text not null default '' check (length(nota) <= 300),
  autore              uuid references auth.users (id) on delete set null default auth.uid(),
  creato              timestamptz not null default now()
);
create index if not exists ristrutturazioni_media_r on marketplace.ristrutturazioni_media (ristrutturazione_id, creato);
alter table marketplace.ristrutturazioni_media enable row level security;
drop policy if exists ristrutturazioni_media_leggi on marketplace.ristrutturazioni_media;
create policy ristrutturazioni_media_leggi on marketplace.ristrutturazioni_media for select using (
  marketplace.is_admin() or exists (select 1 from marketplace.ristrutturazioni r where r.id = ristrutturazione_id and r.agente_id = auth.uid()));
grant select on marketplace.ristrutturazioni_media to authenticated;

insert into storage.buckets (id, name, public) values ('sopralluoghi', 'sopralluoghi', false) on conflict (id) do nothing;
drop policy if exists "sopralluoghi_agente_admin" on storage.objects;
create policy "sopralluoghi_agente_admin" on storage.objects for all to authenticated
  using (bucket_id = 'sopralluoghi' and (marketplace.is_admin() or exists (select 1 from marketplace.ristrutturazioni r
    where r.id::text = (storage.foldername(name))[1] and r.agente_id = auth.uid())))
  with check (bucket_id = 'sopralluoghi' and (marketplace.is_admin() or exists (select 1 from marketplace.ristrutturazioni r
    where r.id::text = (storage.foldername(name))[1] and r.agente_id = auth.uid())));

create or replace function marketplace.ristrutturazione_media_aggiungi(p_id uuid, p_path text, p_tipo text, p_nota text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid;
begin
  if not (marketplace.is_admin() or exists (select 1 from marketplace.ristrutturazioni where id = p_id and agente_id = auth.uid())) then raise exception 'non_si_puo'; end if;
  if split_part(coalesce(p_path, ''), '/', 1) <> p_id::text then raise exception 'cartella_sbagliata'; end if;
  if (select count(*) from marketplace.ristrutturazioni_media where ristrutturazione_id = p_id) >= 60 then raise exception 'troppi_file'; end if;
  insert into marketplace.ristrutturazioni_media (ristrutturazione_id, path, tipo, nota)
  values (p_id, p_path, case when p_tipo = 'audio' then 'audio' else 'foto' end, left(coalesce(p_nota, ''), 300))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function marketplace.ristrutturazione_media_aggiungi(uuid, text, text, text) from public, anon;
grant execute on function marketplace.ristrutturazione_media_aggiungi(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. COMPUTO E CANTIERE DELLA PRATICA (admin)
-- ---------------------------------------------------------------------------
create or replace function marketplace.ristrutturazione_computo(p_id uuid, p_computo jsonb, p_sicurezza numeric, p_spese numeric)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  if jsonb_typeof(p_computo) <> 'array' or jsonb_array_length(p_computo) > 200 then raise exception 'computo_non_valido'; end if;
  update marketplace.ristrutturazioni set computo = p_computo, sicurezza_perc = greatest(0, least(100, coalesce(p_sicurezza, 0))),
    spese_perc = greatest(0, least(100, coalesce(p_spese, 0)))
  where id = p_id;
  if not found then raise exception 'non_trovata'; end if;
end;
$$;

-- Crea (una volta) il cantiere AncheCasa della pratica: poi le richieste alle aziende partono da lì.
create or replace function marketplace.ristrutturazione_cantiere(p_id uuid, p_regione text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare r marketplace.ristrutturazioni%rowtype; v_id uuid;
begin
  if not marketplace.is_admin() then raise exception 'solo_admin'; end if;
  select * into r from marketplace.ristrutturazioni where id = p_id for update;
  if not found then raise exception 'non_trovata'; end if;
  if r.cantiere_id is not null then return r.cantiere_id; end if;
  if length(coalesce(r.provincia, '')) <> 2 then raise exception 'serve_la_provincia'; end if;
  insert into marketplace.cantieri (azienda_id, nome, committente, indirizzo, comune, provincia, regione, importo, note)
  values (auth.uid(), left('Ristrutturazione ' || r.nome || coalesce(' · ' || nullif(r.comune, ''), ''), 120), 'privato', r.indirizzo, r.comune, r.provincia,
    left(coalesce(p_regione, ''), 40), r.importo_cliente, left(r.descrizione, 1000))
  returning id into v_id;
  update marketplace.ristrutturazioni set cantiere_id = v_id where id = p_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. PROFIT GUARD: ricavo, costi impegnati, margine
-- ---------------------------------------------------------------------------
create or replace function marketplace.ristrutturazione_costi(p_id uuid)
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select jsonb_build_object(
    'imprese', coalesce((select sum(c.importo_impresa) from marketplace.commesse c where c.ristrutturazione_id = r.id and c.stato <> 'rifiutata'), 0),
    'forniture', coalesce((select sum((e->>'prezzo')::numeric * coalesce(nullif(v->>'qta', '')::numeric, 1))
        from marketplace.cantiere_richieste q
        join marketplace.cantiere_offerte o on o.richiesta_id = q.id and o.stato in ('scelta', 'parziale')
        cross join lateral jsonb_array_elements(o.righe) e
        cross join lateral jsonb_array_elements(q.voci) v
        where q.cantiere_id = r.cantiere_id and v->>'id' = e->>'id' and (e->>'id') = any (o.voci_scelte)), 0),
    'stima', coalesce((select sum(coalesce(nullif(x->>'costo', '')::numeric, 0) * coalesce(nullif(x->>'qta', '')::numeric, 1)) from jsonb_array_elements(r.computo) x), 0),
    'computo', coalesce((select sum(coalesce(nullif(x->>'prezzo', '')::numeric, 0) * coalesce(nullif(x->>'qta', '')::numeric, 1)) from jsonb_array_elements(r.computo) x), 0))
  from marketplace.ristrutturazioni r where r.id = p_id and marketplace.is_admin();
$$;
revoke all on function marketplace.ristrutturazione_computo(uuid, jsonb, numeric, numeric), marketplace.ristrutturazione_cantiere(uuid, text),
  marketplace.ristrutturazione_costi(uuid) from public, anon;
grant execute on function marketplace.ristrutturazione_computo(uuid, jsonb, numeric, numeric), marketplace.ristrutturazione_cantiere(uuid, text),
  marketplace.ristrutturazione_costi(uuid) to authenticated;

-- Admin: la stessa chiamata di app-24, con costi, foto e soglia del Profit Guard.
create or replace function marketplace.ristrutturazioni_admin()
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select case when not marketplace.is_admin() then null else jsonb_build_object(
    'margine_minimo', (select (valore->>'margine_minimo')::numeric from marketplace.app_impostazioni where chiave = 'profit_guard'),
    'ristrutturazioni', coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object('agente', coalesce(pa.nome, ''), 'segnalata_da', coalesce(ps.nome, ''),
        'costi', marketplace.ristrutturazione_costi(r.id),
        'media', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'path', m.path, 'tipo', m.tipo, 'nota', m.nota, 'creato', m.creato) order by m.creato)
          from marketplace.ristrutturazioni_media m where m.ristrutturazione_id = r.id), '[]'::jsonb)) order by r.creato desc)
      from marketplace.ristrutturazioni r left join marketplace.profiles pa on pa.id = r.agente_id left join marketplace.profiles ps on ps.id = r.inviato_da), '[]'::jsonb),
    'commesse', coalesce((select jsonb_agg(to_jsonb(c) || jsonb_build_object('impresa', coalesce(pi.nome, ''),
        'sal', coalesce((select jsonb_agg(to_jsonb(s) order by s.per, s.numero) from marketplace.commesse_sal s where s.commessa_id = c.id), '[]'::jsonb)) order by c.creato desc)
      from marketplace.commesse c left join marketplace.profiles pi on pi.id = c.impresa_id), '[]'::jsonb),
    'lavori', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'creato', x.creato, 'nome', x.nome, 'telefono', x.telefono, 'mail', x.mail, 'comune', x.comune,
        'provincia', x.provincia, 'nota', x.nota, 'stato', x.stato, 'smistata', x.smistata, 'fonte', x.fonte,
        'proposte', (select count(*) from marketplace.prev_proposte y where y.richiesta_id = x.id)) order by x.creato desc)
      from marketplace.prev_richieste x where x.categoria = 'lavori'), '[]'::jsonb),
    'agenti', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'regione', coalesce(ar.regione, ''), 'ruolo', coalesce(ar.ruolo, '')) order by p.nome)
      from marketplace.profiles p left join marketplace.app_rete ar on ar.utente = p.id where p.famiglia = 'agente' and p.verifica = 'verificato'), '[]'::jsonb)
  ) end;
$$;
revoke all on function marketplace.ristrutturazioni_admin() from public, anon;
grant execute on function marketplace.ristrutturazioni_admin() to authenticated;

-- L'agente: le foto e le note vocali delle sue pratiche.
create or replace function marketplace.miei_sopralluoghi()
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'creato', r.creato, 'nome', r.nome, 'telefono', r.telefono, 'mail', r.mail, 'comune', r.comune,
    'provincia', r.provincia, 'indirizzo', r.indirizzo, 'descrizione', r.descrizione, 'budget', r.budget, 'nota_agente', r.nota_agente, 'stato', r.stato,
    'media', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'path', m.path, 'tipo', m.tipo, 'nota', m.nota, 'creato', m.creato) order by m.creato)
      from marketplace.ristrutturazioni_media m where m.ristrutturazione_id = r.id), '[]'::jsonb)) order by r.creato desc), '[]'::jsonb)
  from marketplace.ristrutturazioni r where r.agente_id = auth.uid();
$$;
revoke all on function marketplace.miei_sopralluoghi() from public, anon;
grant execute on function marketplace.miei_sopralluoghi() to authenticated;

commit;

-- Controllo (sola lettura):
-- select to_regclass('marketplace.ristrutturazioni_media'), (select count(*) from storage.buckets where id = 'sopralluoghi');
-- select proname from pg_proc where proname in ('ristrutturazione_media_aggiungi', 'ristrutturazione_computo', 'ristrutturazione_cantiere', 'ristrutturazione_costi', 'miei_sopralluoghi');
