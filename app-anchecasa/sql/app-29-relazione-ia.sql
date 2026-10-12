-- app-29 · La relazione di sopralluogo fatta con l'IA, per tutta la casa (12.10.2026, richiesta di Nando alle 15:34)
--
--   · Non solo il bagno: stanze, impianti, facciata, copertura, giardino, terrazzi. L'agente carica foto, note vocali
--     e anche un VIDEO del giro della casa; la funzione «dossier-ia» li legge tutti con Gemini.
--   · «Crea il dopo»: dalla foto vera l'IA disegna come potrebbe venire (render). Le immagini fatte dall'IA hanno fonte = 'ia'
--     e prima_id = la foto da cui nascono: nella relazione si vedono prima e dopo, sempre con la scritta «simulazione».
--   · La relazione la vede il cliente SOLO quando il tecnico (o l'admin) preme «Pubblica la relazione al cliente».
-- Da eseguire DOPO app-28. Si può rilanciare.

begin;

-- Video del giro della casa e immagini fatte dall'IA.
alter table marketplace.ristrutturazioni_media add column if not exists fonte text not null default 'agente';
alter table marketplace.ristrutturazioni_media add column if not exists prima_id uuid references marketplace.ristrutturazioni_media (id) on delete cascade;
do $$
declare c text;
begin
  -- il vecchio controllo su tipo (solo foto e audio) lascia posto a quello nuovo con il video
  for c in select conname from pg_constraint where conrelid = 'marketplace.ristrutturazioni_media'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%tipo%' and pg_get_constraintdef(oid) not ilike '%video%' loop
    execute format('alter table marketplace.ristrutturazioni_media drop constraint %I', c);
  end loop;
  if not exists (select 1 from pg_constraint where conname = 'ristrutturazioni_media_tipo_v2') then
    alter table marketplace.ristrutturazioni_media add constraint ristrutturazioni_media_tipo_v2 check (tipo in ('foto', 'audio', 'video'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ristrutturazioni_media_fonte_ok') then
    alter table marketplace.ristrutturazioni_media add constraint ristrutturazioni_media_fonte_ok check (fonte in ('agente', 'ia'));
  end if;
end $$;

-- La relazione si pubblica al cliente solo con il via del tecnico.
alter table marketplace.ristrutturazioni add column if not exists relazione_pubblicata_il timestamptz;

-- L'agente aggiunge foto, audio e ora anche video (fino a 120 file per pratica).
create or replace function marketplace.ristrutturazione_media_aggiungi(p_id uuid, p_path text, p_tipo text, p_nota text)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid;
begin
  if not (marketplace.is_admin() or exists (select 1 from marketplace.ristrutturazioni where id = p_id and (agente_id = auth.uid() or tecnico_id = auth.uid()))) then raise exception 'non_si_puo'; end if;
  if split_part(coalesce(p_path, ''), '/', 1) <> p_id::text then raise exception 'cartella_sbagliata'; end if;
  if (select count(*) from marketplace.ristrutturazioni_media where ristrutturazione_id = p_id) >= 120 then raise exception 'troppi_file'; end if;
  insert into marketplace.ristrutturazioni_media (ristrutturazione_id, path, tipo, nota)
  values (p_id, p_path, case when p_tipo in ('audio', 'video') then p_tipo else 'foto' end, left(coalesce(p_nota, ''), 300))
  returning id into v_id;
  return v_id;
end;
$$;

-- Pubblica (o ritira) la relazione per il cliente.
create or replace function marketplace.ristrutturazione_pubblica_relazione(p_id uuid, p_si boolean)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if not marketplace.ristrutturazione_tecnico_puo(p_id) then raise exception 'non_autorizzato'; end if;
  if p_si and not exists (select 1 from marketplace.ristrutturazioni where id = p_id and ia->>'stato' = 'fatto') then raise exception 'manca_la_relazione'; end if;
  update marketplace.ristrutturazioni set relazione_pubblicata_il = case when p_si then now() else null end where id = p_id;
end;
$$;

-- Il dossier: ora anche fonte e prima_id dei file (sostituisce quella di app-28).
create or replace function marketplace.ristrutturazione_dossier(p_id uuid)
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select case when not marketplace.ristrutturazione_tecnico_puo(p_id) then null else (
    select to_jsonb(r) || jsonb_build_object(
      'agente', coalesce(pa.nome, ''), 'tecnico', coalesce(pt.nome, ''),
      'media', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'path', m.path, 'tipo', m.tipo, 'nota', m.nota, 'creato', m.creato, 'fonte', m.fonte, 'prima_id', m.prima_id) order by m.creato)
        from marketplace.ristrutturazioni_media m where m.ristrutturazione_id = r.id), '[]'::jsonb),
      'messaggi', marketplace.ristrutturazione_messaggi(r.id),
      'territorio', (select to_jsonb(c) from marketplace.comuni_dati c where lower(c.comune) = lower(r.comune) and upper(c.provincia) = upper(r.provincia)))
    from marketplace.ristrutturazioni r left join marketplace.profiles pa on pa.id = r.agente_id left join marketplace.profiles pt on pt.id = r.tecnico_id
    where r.id = p_id) end;
$$;

revoke all on function marketplace.ristrutturazione_media_aggiungi(uuid, text, text, text), marketplace.ristrutturazione_pubblica_relazione(uuid, boolean),
  marketplace.ristrutturazione_dossier(uuid) from public, anon;
grant execute on function marketplace.ristrutturazione_media_aggiungi(uuid, text, text, text), marketplace.ristrutturazione_pubblica_relazione(uuid, boolean),
  marketplace.ristrutturazione_dossier(uuid) to authenticated;

-- Il tecnico assegnato carica anche lui nel bucket della sua pratica (foto aggiuntive, render).
drop policy if exists sopralluoghi_tecnico_scrivi on storage.objects;
create policy sopralluoghi_tecnico_scrivi on storage.objects for insert to authenticated
  with check (bucket_id = 'sopralluoghi' and exists (select 1 from marketplace.ristrutturazioni r
    where r.id::text = (storage.foldername(name))[1] and r.tecnico_id = auth.uid()));

commit;

-- Controllo (sola lettura):
-- select column_name from information_schema.columns where table_schema = 'marketplace' and table_name = 'ristrutturazioni_media' and column_name in ('fonte', 'prima_id');
-- select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'marketplace.ristrutturazioni_media'::regclass and contype = 'c';
-- select proname from pg_proc where proname = 'ristrutturazione_pubblica_relazione';
