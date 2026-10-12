-- app-27 · Il sopralluogo arriva al cliente per mail (12.10.2026, decisioni di Nando 14:18-14:47)
--
--   · Dopo il sopralluogo l'agente preme «Invia al cliente»: parte SOLO una mail di AncheCasa (niente WhatsApp).
--   · Se il cliente non ha ancora un account, la mail porta all'invito (inviti_admin, creato_da = l'agente):
--     sceglie la password e diventa cliente dell'agente per sempre (handle_new_user_marketplace, app-18).
--   · Il cliente vede il suo sopralluogo nella pagina sopralluogo.html?t=<link> (foto, lavori, conto alla rovescia).
--   · Preventivo dettagliato: entro 5 giorni, oppure 48 ore se l'agente lo segna urgente. Lo prepara l'admin.
--   · La mail e la pagina passano dalla funzione Supabase «sopralluogo-invito» (chiave di servizio): qui solo colonne e regole.
-- Da eseguire DOPO app-24 e app-26. Si può rilanciare.

begin;

alter table marketplace.ristrutturazioni add column if not exists link uuid;
alter table marketplace.ristrutturazioni add column if not exists urgente boolean not null default false;
alter table marketplace.ristrutturazioni add column if not exists preventivo_entro timestamptz;
alter table marketplace.ristrutturazioni add column if not exists inviato_cliente_il timestamptz;
alter table marketplace.ristrutturazioni add column if not exists invito_token text;
alter table marketplace.ristrutturazioni add column if not exists riepilogo text not null default '';
alter table marketplace.ristrutturazioni add column if not exists pacchetto text not null default '';
alter table marketplace.ristrutturazioni add column if not exists aperto_cliente_il timestamptz;
alter table marketplace.ristrutturazioni add column if not exists cliente_ok_il timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ristrutturazioni_link_unico') then
    alter table marketplace.ristrutturazioni add constraint ristrutturazioni_link_unico unique (link);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ristrutturazioni_riepilogo_len') then
    alter table marketplace.ristrutturazioni add constraint ristrutturazioni_riepilogo_len check (length(riepilogo) <= 1500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ristrutturazioni_pacchetto_ok') then
    alter table marketplace.ristrutturazioni add constraint ristrutturazioni_pacchetto_ok check (pacchetto in ('', 'base', 'medio', 'alto'));
  end if;
end $$;

-- L'agente (o l'admin) prepara l'invio. Restituisce i dati per la mail: la mail la manda la funzione «sopralluogo-invito».
create or replace function marketplace.ristrutturazione_prepara_invio(p_id uuid, p_mail text, p_urgente boolean, p_riepilogo text, p_pacchetto text)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_r marketplace.ristrutturazioni;
  v_mail text := lower(btrim(coalesce(p_mail, '')));
  v_tok text;
  v_iscritto boolean;
  v_agente text;
begin
  if auth.uid() is null then raise exception 'serve_accesso'; end if;
  select * into v_r from marketplace.ristrutturazioni where id = p_id for update;
  if not found then raise exception 'non_trovata'; end if;
  if not (marketplace.is_admin() or v_r.agente_id = auth.uid()) then raise exception 'non_autorizzato'; end if;
  if v_r.stato in ('chiusa', 'persa') then raise exception 'pratica_chiusa'; end if;
  if v_mail = '' then v_mail := lower(btrim(v_r.mail)); end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'mail_non_valida'; end if;
  if coalesce(p_pacchetto, '') not in ('', 'base', 'medio', 'alto') then raise exception 'pacchetto_non_valido'; end if;

  -- Il cliente ha già un account? (stessa mail o pratica nata dal suo profilo)
  v_iscritto := v_r.privato_id is not null or exists (select 1 from auth.users u where lower(u.email) = v_mail);

  -- Invito per mail, legato a chi ha fatto il sopralluogo: chi si iscrive da qui è suo.
  v_tok := v_r.invito_token;
  if not v_iscritto and (v_tok is null or not exists (select 1 from marketplace.inviti_admin i where i.token::text = v_tok and i.stato in ('inviato', 'aperto'))) then
    insert into marketplace.inviti_admin (famiglia, categoria, mail, nome, creato_da)
    values ('privato', 'Privato', v_mail, left(v_r.nome, 120), coalesce(v_r.agente_id, auth.uid()))
    returning token::text into v_tok;
  end if;

  update marketplace.ristrutturazioni set
    mail = v_mail,
    link = coalesce(link, gen_random_uuid()),
    urgente = coalesce(p_urgente, false),
    preventivo_entro = now() + case when coalesce(p_urgente, false) then interval '48 hours' else interval '5 days' end,
    riepilogo = left(coalesce(nullif(btrim(p_riepilogo), ''), riepilogo), 1500),
    pacchetto = coalesce(p_pacchetto, ''),
    invito_token = case when v_iscritto then invito_token else v_tok end,
    stato = case when stato in ('nuova', 'sopralluogo') then 'preventivo' else stato end
  where id = p_id
  returning * into v_r;

  select nome into v_agente from marketplace.profiles where id = v_r.agente_id;

  return jsonb_build_object(
    'id', v_r.id, 'link', v_r.link, 'nome', v_r.nome, 'mail', v_r.mail, 'comune', v_r.comune,
    'descrizione', v_r.descrizione, 'riepilogo', v_r.riepilogo, 'pacchetto', v_r.pacchetto,
    'urgente', v_r.urgente, 'preventivo_entro', v_r.preventivo_entro,
    'iscritto', v_iscritto, 'invito', case when v_iscritto then null else v_tok end,
    'agente', coalesce(v_agente, 'il tuo consulente AncheCasa')
  );
end;
$$;
revoke all on function marketplace.ristrutturazione_prepara_invio(uuid, text, boolean, text, text) from public, anon;
grant execute on function marketplace.ristrutturazione_prepara_invio(uuid, text, boolean, text, text) to authenticated;

-- I sopralluoghi dell'agente, ora con lo stato dell'invio al cliente (sostituisce quella di app-26).
create or replace function marketplace.miei_sopralluoghi()
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'creato', r.creato, 'nome', r.nome, 'telefono', r.telefono, 'mail', r.mail, 'comune', r.comune,
    'provincia', r.provincia, 'indirizzo', r.indirizzo, 'descrizione', r.descrizione, 'budget', r.budget, 'nota_agente', r.nota_agente, 'stato', r.stato,
    'riepilogo', r.riepilogo, 'pacchetto', r.pacchetto, 'urgente', r.urgente, 'preventivo_entro', r.preventivo_entro,
    'inviato_cliente_il', r.inviato_cliente_il, 'aperto_cliente_il', r.aperto_cliente_il, 'cliente_ok_il', r.cliente_ok_il,
    'media', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'path', m.path, 'tipo', m.tipo, 'nota', m.nota, 'creato', m.creato) order by m.creato)
      from marketplace.ristrutturazioni_media m where m.ristrutturazione_id = r.id), '[]'::jsonb)) order by r.creato desc), '[]'::jsonb)
  from marketplace.ristrutturazioni r where r.agente_id = auth.uid();
$$;
revoke all on function marketplace.miei_sopralluoghi() from public, anon;
grant execute on function marketplace.miei_sopralluoghi() to authenticated;

commit;

-- Controllo (sola lettura):
-- select column_name from information_schema.columns where table_schema = 'marketplace' and table_name = 'ristrutturazioni'
--   and column_name in ('link', 'urgente', 'preventivo_entro', 'inviato_cliente_il', 'invito_token', 'riepilogo', 'pacchetto', 'aperto_cliente_il', 'cliente_ok_il');
-- select proname from pg_proc where proname in ('ristrutturazione_prepara_invio', 'miei_sopralluoghi');
