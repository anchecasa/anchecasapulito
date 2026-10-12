-- app-22 · Regole del giro fornitori (12.10.2026, decisioni di Nando 11:41)
--
--   1. Massimo 5 proposte (o preventivi) per richiesta: dopo la quinta la richiesta non arriva più agli altri fornitori.
--   2. Le richieste scadono dopo 15 giorni: stato «scaduta», le proposte non scelte diventano «non scelta».
--      Promemoria al cliente dopo 3 giorni se ha proposte da guardare (funzione fornitori-promemoria, una volta al giorno).
--   3. Quando il cliente sceglie, le altre proposte diventano subito «non scelta».
--   4. Verifica dei contratti (luce e gas, telefono, finanza): 30 giorni dopo la scelta AncheCasa chiede al cliente
--      «Hai firmato?». La risposta la vede l'admin accanto a quello che ha segnato il fornitore.
--   5. I numeri del fornitore nel mese: richieste ricevute, proposte, scelte, contratti o lavori chiusi.
--
-- Vale per i tre giri: energia (app-19), servizi (app-20), preventivi (app-21). Stesse firme delle funzioni: le pagine
-- online continuano a funzionare. Si può rilanciare.

begin;

-- ---------------------------------------------------------------------------
-- 0. Colonne e stato «scaduta»
-- ---------------------------------------------------------------------------
alter table marketplace.energia_richieste add column if not exists promemoria_il timestamptz;
alter table marketplace.energia_richieste add column if not exists verifica_il timestamptz;
alter table marketplace.energia_richieste add column if not exists cliente_firmato boolean;
alter table marketplace.energia_richieste add column if not exists cliente_risposta_il timestamptz;
alter table marketplace.servizi_richieste add column if not exists promemoria_il timestamptz;
alter table marketplace.servizi_richieste add column if not exists verifica_il timestamptz;
alter table marketplace.servizi_richieste add column if not exists cliente_firmato boolean;
alter table marketplace.servizi_richieste add column if not exists cliente_risposta_il timestamptz;
alter table marketplace.prev_richieste add column if not exists promemoria_il timestamptz;

do $$
declare c record;
begin
  for c in select conrelid::regclass::text as t, conname from pg_constraint
           where conrelid in ('marketplace.energia_richieste'::regclass, 'marketplace.servizi_richieste'::regclass, 'marketplace.prev_richieste'::regclass)
             and contype = 'c' and pg_get_constraintdef(oid) ilike '%(stato %' loop
    execute format('alter table %s drop constraint %I', c.t, c.conname);
  end loop;
end $$;
alter table marketplace.energia_richieste add constraint energia_richieste_stato_check check (stato in ('aperta', 'scelta', 'chiusa', 'scaduta'));
alter table marketplace.servizi_richieste add constraint servizi_richieste_stato_check check (stato in ('aperta', 'scelta', 'chiusa', 'scaduta'));
alter table marketplace.prev_richieste add constraint prev_richieste_stato_check check (stato in ('aperta', 'scelta', 'chiusa', 'annullata', 'scaduta'));

-- ---------------------------------------------------------------------------
-- 1. Richiesta «aperta» = stato aperta, meno di 15 giorni, meno di 5 proposte
-- ---------------------------------------------------------------------------
create or replace function marketplace.energia_richiesta_aperta(p_id uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.energia_richieste r where r.id = p_id and r.stato = 'aperta' and r.creato > now() - interval '15 days'
    and (select count(*) from marketplace.energia_proposte x where x.richiesta_id = r.id) < 5);
$$;

create or replace function marketplace.servizi_richiesta_aperta(p_id uuid, p_categoria text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.servizi_richieste r where r.id = p_id and r.stato = 'aperta' and r.categoria = p_categoria
    and r.creato > now() - interval '15 days'
    and (select count(*) from marketplace.servizi_proposte x where x.richiesta_id = r.id) < 5);
$$;

create or replace function marketplace.prev_posso_proporre(p_richiesta uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.prev_richieste r, marketplace.profiles p
    where r.id = p_richiesta and r.stato = 'aperta' and r.creato > now() - interval '15 days'
      and (select count(*) from marketplace.prev_proposte x where x.richiesta_id = r.id) < 5
      and p.id = auth.uid() and p.verifica = 'verificato'
      and marketplace.prev_categoria_di(p.tipo_azienda) = r.categoria
      and (r.categoria <> 'casa' or r.tipo = any (marketplace.prev_tipi_di(p.tipo_azienda)))
      and marketplace.prev_copre(p.id, r.provincia)
  );
$$;

-- Le richieste per il fornitore: le aperte solo se non scadute e non piene; le sue sempre.
create or replace function marketplace.energia_richieste_per_me()
returns table (
  id uuid, creato timestamptz, fonte text, tipo text, cliente_tipo text, regione text, comune text,
  consumo_luce numeric, consumo_gas numeric, spesa_mese numeric, fornitore_attuale text, nota text, stato text,
  mia_proposta uuid, mia_stato text, scelta_mia boolean, nome text, mail text, telefono text, proposte int
) language sql stable security definer set search_path = marketplace, public as $$
  select r.id, r.creato, r.fonte, r.tipo, r.cliente_tipo, r.regione, r.comune,
    r.consumo_luce, r.consumo_gas, r.spesa_mese, r.fornitore_attuale, r.nota, r.stato,
    p.id, p.stato, (r.proposta_scelta is not null and r.proposta_scelta = p.id),
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.nome else '' end,
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.mail else '' end,
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.telefono else '' end,
    (select count(*)::int from marketplace.energia_proposte x where x.richiesta_id = r.id)
  from marketplace.energia_richieste r
  left join marketplace.energia_proposte p on p.richiesta_id = r.id and p.azienda_id = auth.uid()
  where marketplace.energia_sono_fornitore()
    and (p.id is not null or marketplace.energia_richiesta_aperta(r.id))
  order by r.creato desc
  limit 300;
$$;

create or replace function marketplace.servizi_richieste_per_me()
returns table (
  id uuid, creato timestamptz, categoria text, fonte text, tipo text, cliente_tipo text, regione text, comune text,
  spesa_mese numeric, importo numeric, durata_mesi smallint, quanti smallint, attuale text, nota text, stato text,
  mia_proposta uuid, mia_stato text, scelta_mia boolean, nome text, mail text, telefono text, proposte int
) language sql stable security definer set search_path = marketplace, public as $$
  select r.id, r.creato, r.categoria, r.fonte, r.tipo, r.cliente_tipo, r.regione, r.comune,
    r.spesa_mese, r.importo, r.durata_mesi, r.quanti, r.attuale, r.nota, r.stato,
    p.id, p.stato, (r.proposta_scelta is not null and r.proposta_scelta = p.id),
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.nome else '' end,
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.mail else '' end,
    case when r.proposta_scelta is not null and r.proposta_scelta = p.id then r.telefono else '' end,
    (select count(*)::int from marketplace.servizi_proposte x where x.richiesta_id = r.id)
  from marketplace.servizi_richieste r
  left join marketplace.servizi_proposte p on p.richiesta_id = r.id and p.azienda_id = auth.uid()
  where r.categoria = marketplace.servizi_mia_categoria()
    and (p.id is not null or marketplace.servizi_richiesta_aperta(r.id, r.categoria))
  order by r.creato desc
  limit 300;
$$;

create or replace function marketplace.prev_richieste_per_me()
returns table (
  id uuid, creato timestamptz, categoria text, fonte text, tipo text, cliente_tipo text, comune text, provincia text, regione text,
  dal date, al date, con_operatore boolean, righe jsonb, nota text, stato text, vicinanza int,
  mia_proposta uuid, mio_stato text, scelta_mia boolean, nome text, mail text, telefono text, indirizzo text, proposte int
) language sql stable security definer set search_path = marketplace, public as $$
  select r.id, r.creato, r.categoria, r.fonte, r.tipo, r.cliente_tipo, r.comune, r.provincia, r.regione,
    r.dal, r.al, r.con_operatore, r.righe, r.nota, r.stato, marketplace.prev_vicinanza(me.id, r.comune, r.provincia),
    x.id, x.stato, (r.proposta_scelta is not null and r.proposta_scelta = x.id),
    case when r.proposta_scelta = x.id then r.nome else '' end,
    case when r.proposta_scelta = x.id then r.mail else '' end,
    case when r.proposta_scelta = x.id then r.telefono else '' end,
    case when r.proposta_scelta = x.id then r.indirizzo else '' end,
    (select count(*)::int from marketplace.prev_proposte y where y.richiesta_id = r.id)
  from marketplace.profiles me
  join marketplace.prev_richieste r on r.categoria = marketplace.prev_categoria_di(me.tipo_azienda)
  left join marketplace.prev_proposte x on x.richiesta_id = r.id and x.azienda_id = me.id
  where me.id = auth.uid() and me.verifica = 'verificato'
    and (x.id is not null or (
      r.stato = 'aperta' and r.creato > now() - interval '15 days'
      and (select count(*) from marketplace.prev_proposte y where y.richiesta_id = r.id) < 5
      and (r.categoria <> 'casa' or r.tipo = any (marketplace.prev_tipi_di(me.tipo_azienda)))
      and marketplace.prev_copre(me.id, r.provincia)))
  order by (r.stato = 'aperta') desc, marketplace.prev_vicinanza(me.id, r.comune, r.provincia), r.creato desc
  limit 300;
$$;

-- ---------------------------------------------------------------------------
-- 2. La scelta del cliente: niente scelta su richieste scadute; le altre proposte diventano «non scelta»
-- ---------------------------------------------------------------------------
create or replace function marketplace.energia_accetta(p_token text, p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.energia_richieste%rowtype;
begin
  select * into r from marketplace.energia_richieste where token = p_token for update;
  if not found then raise exception 'richiesta_non_trovata'; end if;
  if r.stato <> 'aperta' then raise exception 'gia_scelta'; end if;
  if r.creato < now() - interval '15 days' then raise exception 'scaduta'; end if;
  if not exists (select 1 from marketplace.energia_proposte where id = p_proposta and richiesta_id = r.id) then raise exception 'proposta_non_trovata'; end if;
  update marketplace.energia_richieste set stato = 'scelta', proposta_scelta = p_proposta, scelta_il = now() where id = r.id;
  update marketplace.energia_proposte set stato = 'accettata' where id = p_proposta;
  update marketplace.energia_proposte set stato = 'rifiutata' where richiesta_id = r.id and id <> p_proposta and stato = 'inviata';
end;
$$;

create or replace function marketplace.servizi_accetta(p_token text, p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.servizi_richieste%rowtype;
begin
  select * into r from marketplace.servizi_richieste where token = p_token for update;
  if not found then raise exception 'richiesta_non_trovata'; end if;
  if r.stato <> 'aperta' then raise exception 'gia_scelta'; end if;
  if r.creato < now() - interval '15 days' then raise exception 'scaduta'; end if;
  if not exists (select 1 from marketplace.servizi_proposte where id = p_proposta and richiesta_id = r.id) then raise exception 'proposta_non_trovata'; end if;
  update marketplace.servizi_richieste set stato = 'scelta', proposta_scelta = p_proposta, scelta_il = now() where id = r.id;
  update marketplace.servizi_proposte set stato = 'accettata' where id = p_proposta;
  update marketplace.servizi_proposte set stato = 'rifiutata' where richiesta_id = r.id and id <> p_proposta and stato = 'inviata';
end;
$$;

create or replace function marketplace.prev_accetta(p_token text, p_proposta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare
  r marketplace.prev_richieste%rowtype;
begin
  select * into r from marketplace.prev_richieste where token = p_token for update;
  if not found then raise exception 'richiesta_non_trovata'; end if;
  if r.stato <> 'aperta' then raise exception 'gia_scelta'; end if;
  if r.creato < now() - interval '15 days' then raise exception 'scaduta'; end if;
  if not exists (select 1 from marketplace.prev_proposte where id = p_proposta and richiesta_id = r.id) then raise exception 'proposta_non_trovata'; end if;
  update marketplace.prev_richieste set stato = 'scelta', proposta_scelta = p_proposta, scelta_il = now() where id = r.id;
  update marketplace.prev_proposte set stato = 'accettata' where id = p_proposta;
  update marketplace.prev_proposte set stato = 'rifiutata' where richiesta_id = r.id and id <> p_proposta and stato = 'inviata';
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Chiusura delle richieste scadute (la chiama ogni giorno la funzione fornitori-promemoria)
-- ---------------------------------------------------------------------------
create or replace function marketplace.fornitori_chiudi_scadute()
returns int language plpgsql security definer set search_path = marketplace, public as $$
declare n int := 0; k int;
begin
  update marketplace.energia_proposte x set stato = 'rifiutata' from marketplace.energia_richieste r
    where x.richiesta_id = r.id and x.stato = 'inviata' and r.stato = 'aperta' and r.creato < now() - interval '15 days';
  update marketplace.energia_richieste set stato = 'scaduta' where stato = 'aperta' and creato < now() - interval '15 days';
  get diagnostics k = row_count; n := n + k;
  update marketplace.servizi_proposte x set stato = 'rifiutata' from marketplace.servizi_richieste r
    where x.richiesta_id = r.id and x.stato = 'inviata' and r.stato = 'aperta' and r.creato < now() - interval '15 days';
  update marketplace.servizi_richieste set stato = 'scaduta' where stato = 'aperta' and creato < now() - interval '15 days';
  get diagnostics k = row_count; n := n + k;
  update marketplace.prev_proposte x set stato = 'rifiutata' from marketplace.prev_richieste r
    where x.richiesta_id = r.id and x.stato = 'inviata' and r.stato = 'aperta' and r.creato < now() - interval '15 days';
  update marketplace.prev_richieste set stato = 'scaduta' where stato = 'aperta' and creato < now() - interval '15 days';
  get diagnostics k = row_count; n := n + k;
  return n;
end;
$$;
revoke all on function marketplace.fornitori_chiudi_scadute() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Verifica dei contratti: il cliente risponde «Hai firmato?» dal link nella mail (verifica.html)
-- ---------------------------------------------------------------------------
create or replace function marketplace.fornitori_verifica_info(p_categoria text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare v jsonb;
begin
  if p_categoria = 'energia' then
    select jsonb_build_object('nome', split_part(r.nome, ' ', 1), 'azienda', coalesce(nullif(c.ragione, ''), pr.nome, 'il fornitore'),
      'categoria', 'Luce e gas', 'stato', r.stato, 'risposta', r.cliente_firmato)
    into v from marketplace.energia_richieste r
    left join marketplace.energia_proposte x on x.id = r.proposta_scelta
    left join marketplace.energia_carta c on c.azienda_id = x.azienda_id
    left join marketplace.profiles pr on pr.id = x.azienda_id
    where r.token = p_token and r.proposta_scelta is not null;
  else
    select jsonb_build_object('nome', split_part(r.nome, ' ', 1), 'azienda', coalesce(nullif(c.ragione, ''), pr.nome, 'il fornitore'),
      'categoria', case r.categoria when 'telefonia' then 'Telefono e internet' else 'Finanza e assicurazioni' end, 'stato', r.stato, 'risposta', r.cliente_firmato)
    into v from marketplace.servizi_richieste r
    left join marketplace.servizi_proposte x on x.id = r.proposta_scelta
    left join marketplace.energia_carta c on c.azienda_id = x.azienda_id
    left join marketplace.profiles pr on pr.id = x.azienda_id
    where r.token = p_token and r.proposta_scelta is not null;
  end if;
  return v;
end;
$$;
revoke all on function marketplace.fornitori_verifica_info(text, text) from public;
grant execute on function marketplace.fornitori_verifica_info(text, text) to anon, authenticated;

create or replace function marketplace.fornitori_verifica(p_categoria text, p_token text, p_firmato boolean)
returns void language plpgsql security definer set search_path = marketplace, public as $$
begin
  if p_categoria = 'energia' then
    update marketplace.energia_richieste set cliente_firmato = p_firmato, cliente_risposta_il = now() where token = p_token and proposta_scelta is not null;
  else
    update marketplace.servizi_richieste set cliente_firmato = p_firmato, cliente_risposta_il = now() where token = p_token and proposta_scelta is not null;
  end if;
  if not found then raise exception 'richiesta_non_trovata'; end if;
end;
$$;
revoke all on function marketplace.fornitori_verifica(text, text, boolean) from public;
grant execute on function marketplace.fornitori_verifica(text, text, boolean) to anon, authenticated;

-- Per l'admin: le scelte con la risposta del cliente e quello che ha segnato il fornitore.
create or replace function marketplace.fornitori_verifiche_admin()
returns table (categoria text, cliente text, mail text, fornitore text, scelta_il timestamptz, chiesto_il timestamptz,
  cliente_firmato boolean, risposta_il timestamptz, attivato boolean)
language sql stable security definer set search_path = marketplace, public as $$
  select 'Luce e gas', r.nome, r.mail, coalesce(pr.nome, ''), r.scelta_il, r.verifica_il, r.cliente_firmato, r.cliente_risposta_il, x.stato = 'attivata'
  from marketplace.energia_richieste r join marketplace.energia_proposte x on x.id = r.proposta_scelta
  left join marketplace.profiles pr on pr.id = x.azienda_id
  where marketplace.is_admin() and r.proposta_scelta is not null
  union all
  select case r.categoria when 'telefonia' then 'Telefono e internet' else 'Finanza e assicurazioni' end, r.nome, r.mail, coalesce(pr.nome, ''),
    r.scelta_il, r.verifica_il, r.cliente_firmato, r.cliente_risposta_il, x.stato = 'attivata'
  from marketplace.servizi_richieste r join marketplace.servizi_proposte x on x.id = r.proposta_scelta
  left join marketplace.profiles pr on pr.id = x.azienda_id
  where marketplace.is_admin() and r.proposta_scelta is not null
  order by 5 desc
  limit 300;
$$;
revoke all on function marketplace.fornitori_verifiche_admin() from public, anon;
grant execute on function marketplace.fornitori_verifiche_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. I numeri del fornitore nel mese
-- ---------------------------------------------------------------------------
create or replace function marketplace.fornitore_numeri()
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  me marketplace.profiles%rowtype;
  inizio timestamptz := date_trunc('month', now());
  ric int := 0; pro int := 0; sce int := 0; chi int := 0;
  cat text;
begin
  select * into me from marketplace.profiles where id = auth.uid();
  if not found then return null; end if;
  if me.tipo_azienda = 'azienda_luce_gas' then
    select count(*) into ric from marketplace.energia_richieste where creato >= inizio;
    select count(*), count(*) filter (where stato in ('accettata', 'attivata')), count(*) filter (where stato = 'attivata')
      into pro, sce, chi from marketplace.energia_proposte where azienda_id = me.id and created_at >= inizio;
  elsif marketplace.servizi_categoria_di(me.tipo_azienda) is not null then
    cat := marketplace.servizi_categoria_di(me.tipo_azienda);
    select count(*) into ric from marketplace.servizi_richieste where categoria = cat and creato >= inizio;
    select count(*), count(*) filter (where stato in ('accettata', 'attivata')), count(*) filter (where stato = 'attivata')
      into pro, sce, chi from marketplace.servizi_proposte where azienda_id = me.id and created_at >= inizio;
  elsif marketplace.prev_categoria_di(me.tipo_azienda) is not null then
    cat := marketplace.prev_categoria_di(me.tipo_azienda);
    select count(*) into ric from marketplace.prev_richieste r where r.categoria = cat and r.creato >= inizio
      and (cat <> 'casa' or r.tipo = any (marketplace.prev_tipi_di(me.tipo_azienda))) and marketplace.prev_copre(me.id, r.provincia);
    select count(*), count(*) filter (where stato in ('accettata', 'chiusa')), count(*) filter (where stato = 'chiusa')
      into pro, sce, chi from marketplace.prev_proposte where azienda_id = me.id and created_at >= inizio;
  end if;
  return jsonb_build_object('ricevute', ric, 'proposte', pro, 'scelte', sce, 'chiusi', chi);
end;
$$;
revoke all on function marketplace.fornitore_numeri() from public, anon;
grant execute on function marketplace.fornitore_numeri() to authenticated;

commit;

-- Controllo (sola lettura):
-- select proname from pg_proc where proname in ('fornitori_chiudi_scadute', 'fornitori_verifica', 'fornitori_verifica_info', 'fornitori_verifiche_admin', 'fornitore_numeri');
-- select column_name from information_schema.columns where table_schema = 'marketplace' and table_name = 'energia_richieste' and column_name in ('promemoria_il', 'verifica_il', 'cliente_firmato');
