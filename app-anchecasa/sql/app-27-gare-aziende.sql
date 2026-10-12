-- app-27 · Gare per le aziende, prezzo nelle richieste dei cantieri (12.10.2026, decisioni di Nando 15:10)
--
--   · «Cerca gare»: le aziende edili e i general contractor cercano le gare di AncheBandi (public.anchebandi_feed_items)
--     per provincia e parola. Modulo a pagamento: si apre quando l'admin lo attiva per l'azienda (aziende_stato.moduli).
--   · «Le mie gare»: il Terranova di ogni azienda. La gara scelta si segue fino all'esito: stato, scadenza,
--     documenti da preparare, ribasso offerto, note. Da una gara si apre il cantiere per chiedere subappalti e forniture.
--   · Gare private: non le fa nessuno. AncheCasa e i general contractor pubblicano una richiesta dal cantiere,
--     anche con un prezzo (importo a base), e si risponde con l'offerta (app-25).
-- Da eseguire dopo app-25 e app-26. Si può rilanciare.

begin;

-- ---------------------------------------------------------------------------
-- 0. MODULI A PAGAMENTO attivati dall'admin per ogni azienda («Aziende» → Moduli attivi): gare, predict, anchebim
-- ---------------------------------------------------------------------------
alter table marketplace.aziende_stato add column if not exists moduli text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- 1. CERCA GARE (AncheBandi) per le aziende
-- ---------------------------------------------------------------------------
create or replace function marketplace.gare_cerca(p_province text[], p_testo text, p_solo_aperte boolean)
returns table (id text, kind text, title text, contracting_authority text, municipality text, province text, region text, amount_cents bigint,
  submission_deadline timestamptz, published_at timestamptz, cig_code text, lifecycle_status text, summary text, sector text, procedure_type text)
language sql stable security definer set search_path = marketplace, public as $$
  select f.id::text, f.kind::text, f.title::text, f.contracting_authority::text, f.municipality::text, f.province::text, f.region::text, f.amount_cents::bigint,
    f.submission_deadline::timestamptz, f.published_at::timestamptz, f.cig_code::text, f.lifecycle_status::text, left(f.summary::text, 600), f.sector::text, f.procedure_type::text
  from public.anchebandi_feed_items f
  where (marketplace.is_admin() or (exists (select 1 from marketplace.profiles p where p.id = auth.uid() and p.famiglia = 'azienda' and p.verifica = 'verificato')
           and marketplace.azienda_puo_lavorare(auth.uid())
           and exists (select 1 from marketplace.aziende_stato st where st.azienda_id = auth.uid() and 'gare' = any (st.moduli))))
    and (p_province is null or cardinality(p_province) = 0 or upper(f.province::text) = any (p_province))
    and (coalesce(btrim(p_testo), '') = '' or (coalesce(f.title::text, '') || ' ' || coalesce(f.contracting_authority::text, '') || ' ' || coalesce(f.municipality::text, '') || ' ' || coalesce(f.cig_code::text, '')) ilike '%' || btrim(p_testo) || '%')
    and (not coalesce(p_solo_aperte, true) or (f.submission_deadline is null or f.submission_deadline::timestamptz >= now()) and coalesce(f.lifecycle_status::text, 'pubblicato') not in ('annullato', 'aggiudicato'))
  order by f.submission_deadline nulls last, f.published_at desc
  limit 150;
$$;
revoke all on function marketplace.gare_cerca(text[], text, boolean) from public, anon;
grant execute on function marketplace.gare_cerca(text[], text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. LE MIE GARE (il Terranova di ogni azienda)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.gare_mie (
  id          uuid primary key default gen_random_uuid(),
  azienda_id  uuid not null references auth.users (id) on delete cascade,
  creato      timestamptz not null default now(),
  bando_id    text not null default '' check (length(bando_id) <= 80),
  titolo      text not null check (length(btrim(titolo)) between 2 and 300),
  ente        text not null default '' check (length(ente) <= 200),
  comune      text not null default '' check (length(comune) <= 80),
  provincia   text not null default '' check (length(provincia) <= 2),
  cig         text not null default '' check (length(cig) <= 20),
  importo     numeric(14, 2),
  scadenza    timestamptz,
  stato       text not null default 'analisi' check (stato in ('analisi', 'pronta', 'presentata', 'vinta', 'persa', 'rinuncia')),
  checklist   jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array' and jsonb_array_length(checklist) <= 40),
  ribasso     numeric(6, 3) check (ribasso is null or ribasso between 0 and 100),
  note        text not null default '' check (length(note) <= 2000),
  cantiere_id uuid references marketplace.cantieri (id) on delete set null,
  unique (azienda_id, bando_id)
);
create index if not exists gare_mie_azienda on marketplace.gare_mie (azienda_id, scadenza);
alter table marketplace.gare_mie enable row level security;
drop policy if exists gare_mie_mie on marketplace.gare_mie;
create policy gare_mie_mie on marketplace.gare_mie for all to authenticated using (azienda_id = auth.uid()) with check (azienda_id = auth.uid());
drop policy if exists gare_mie_admin on marketplace.gare_mie;
create policy gare_mie_admin on marketplace.gare_mie for select using (marketplace.is_admin());
grant select, insert, update, delete on marketplace.gare_mie to authenticated;

-- ---------------------------------------------------------------------------
-- 3. PREZZO NELLE RICHIESTE DEI CANTIERI (importo a base, facoltativo)
-- ---------------------------------------------------------------------------
alter table marketplace.cantiere_richieste add column if not exists prezzo numeric(14, 2) check (prezzo is null or prezzo > 0);

create or replace function marketplace.cantiere_pubblica(p jsonb)
returns uuid language plpgsql security definer set search_path = marketplace, public, auth as $$
declare
  c marketplace.cantieri%rowtype;
  v_id uuid; v_s text; v_mail text; v_az uuid; v_lim int;
begin
  select * into c from marketplace.cantieri where id = nullif(p->>'cantiere_id', '')::uuid and azienda_id = auth.uid();
  if not found then raise exception 'cantiere_non_trovato'; end if;
  if not marketplace.is_admin() then
    if not marketplace.azienda_puo_lavorare(auth.uid()) then raise exception 'serve_verifica'; end if;
    select coalesce((select limite_richieste from marketplace.aziende_stato where azienda_id = auth.uid()), 20) into v_lim;
    if (select count(*) from marketplace.cantiere_richieste where azienda_id = auth.uid() and creato > now() - interval '30 days') >= v_lim then raise exception 'limite_mese'; end if;
  end if;
  if p->>'tipo' not in ('materiali', 'noleggio', 'lavori', 'impianti', 'personale') then raise exception 'tipo_non_valido'; end if;
  if jsonb_typeof(p->'voci') <> 'array' or jsonb_array_length(p->'voci') = 0 then raise exception 'servono_le_voci'; end if;
  if exists (select 1 from jsonb_array_elements(p->'voci') x where coalesce(x->>'id', '') = '' or length(btrim(coalesce(x->>'voce', ''))) < 2 or coalesce(x->>'servizio', '') = '') then raise exception 'voce_non_valida'; end if;
  insert into marketplace.cantiere_richieste (cantiere_id, azienda_id, tipo, titolo, voci, pagamenti, scadenza, urgente, nota, parent_id, prezzo)
  values (c.id, auth.uid(), p->>'tipo', left(btrim(coalesce(p->>'titolo', '')), 120), p->'voci', left(coalesce(p->>'pagamenti', ''), 300),
    nullif(p->>'scadenza', '')::date, coalesce((p->>'urgente')::boolean, false), left(coalesce(p->>'nota', ''), 1500), nullif(p->>'parent_id', '')::uuid,
    case when nullif(p->>'prezzo', '')::numeric > 0 then round(nullif(p->>'prezzo', '')::numeric, 2) else null end)
  returning id into v_id;
  -- Le prime 10 della zona per ogni servizio richiesto.
  for v_s in select distinct x->>'servizio' from jsonb_array_elements(p->'voci') x loop
    insert into marketplace.cantiere_invitati (richiesta_id, azienda_id, motivo)
    select v_id, d.azienda_id, 'zona' from marketplace.cnt_destinatari(v_s, c.provincia, c.comune, auth.uid(), 10) d
    on conflict do nothing;
  end loop;
  -- Ditte di fiducia: se sono già iscritte entrano tra gli invitati, altrimenti ricevono l'invito a iscriversi.
  if jsonb_typeof(p->'inviti') = 'array' then
    for v_mail in select distinct lower(btrim(x)) from jsonb_array_elements_text(p->'inviti') x limit 10 loop
      continue when v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';
      select u.id into v_az from auth.users u join marketplace.profiles pr on pr.id = u.id where lower(u.email) = v_mail and pr.famiglia = 'azienda' limit 1;
      if v_az is not null and v_az <> auth.uid() then
        insert into marketplace.cantiere_invitati (richiesta_id, azienda_id, motivo) values (v_id, v_az, 'invito')
        on conflict (richiesta_id, azienda_id) do update set motivo = 'invito';
      elsif v_az is null then
        insert into marketplace.cantiere_inviti_mail (richiesta_id, email) values (v_id, v_mail) on conflict do nothing;
      end if;
      v_az := null;
    end loop;
  end if;
  return v_id;
end;
$$;

create or replace function marketplace.cantiere_richieste_per_me()
returns jsonb language sql stable security definer set search_path = marketplace, public, auth as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'creato', r.creato, 'tipo', r.tipo, 'titolo', r.titolo, 'voci', r.voci, 'pagamenti', r.pagamenti, 'scadenza', r.scadenza,
    'urgente', r.urgente, 'nota', r.nota, 'prezzo', r.prezzo, 'stato', r.stato, 'motivo_invito', i.motivo,
    'cantiere', c.nome, 'comune', c.comune, 'provincia', c.provincia, 'committente', c.committente, 'dal', c.dal, 'al', c.al,
    'vicinanza', marketplace.prev_vicinanza(i.azienda_id, c.comune, c.provincia),
    'richiedente_id', r.azienda_id,
    'richiedente', case when marketplace.is_admin_utente(r.azienda_id) then 'AncheCasa' else coalesce(pr.nome, 'Azienda') end,
    'voto_richiedente', marketplace.cnt_voto(r.azienda_id, 'committente'),
    'offerte', (select count(*) from marketplace.cantiere_offerte y where y.richiesta_id = r.id),
    'mia', (select to_jsonb(o) from marketplace.cantiere_offerte o where o.richiesta_id = r.id and o.azienda_id = i.azienda_id),
    'indirizzo', case when exists (select 1 from marketplace.cantiere_offerte o where o.richiesta_id = r.id and o.azienda_id = i.azienda_id and o.stato in ('scelta', 'parziale')) then c.indirizzo else '' end,
    'mail', case when exists (select 1 from marketplace.cantiere_offerte o where o.richiesta_id = r.id and o.azienda_id = i.azienda_id and o.stato in ('scelta', 'parziale')) then u.email::text else '' end,
    'mio_voto', (select v.voto from marketplace.aziende_voti v where v.richiesta_id = r.id and v.da_azienda = i.azienda_id and v.a_azienda = r.azienda_id),
    'domande', coalesce((select jsonb_agg(jsonb_build_object('testo', d.testo, 'sopralluogo', d.sopralluogo, 'risposta', d.risposta, 'mia', d.azienda_id = i.azienda_id) order by d.creato)
      from marketplace.cantiere_domande d where d.richiesta_id = r.id and (d.risposta <> '' or d.azienda_id = i.azienda_id)), '[]'::jsonb)
  ) order by (r.stato = 'aperta') desc, r.creato desc), '[]'::jsonb)
  from marketplace.cantiere_invitati i
  join marketplace.cantiere_richieste r on r.id = i.richiesta_id
  join marketplace.cantieri c on c.id = r.cantiere_id
  left join marketplace.profiles pr on pr.id = r.azienda_id
  join auth.users u on u.id = r.azienda_id
  where i.azienda_id = auth.uid() and r.creato > now() - interval '180 days';
$$;

commit;

-- Controllo (sola lettura):
-- select to_regclass('marketplace.gare_mie'), (select count(*) from information_schema.columns where table_schema = 'marketplace' and table_name = 'cantiere_richieste' and column_name = 'prezzo');
-- select proname from pg_proc where proname in ('gare_cerca', 'cantiere_pubblica', 'cantiere_richieste_per_me');
