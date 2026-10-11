-- =====================================================================
-- app-14 · Contratto compilato e firmato nell'app (11.10.2026)
--
-- Cosa fa:
--  1. app_firme.dati: i dati che la persona scrive nel contratto (nome, codice fiscale,
--     partita IVA, IBAN, zona, luogo...). Restano insieme alla firma e all'impronta SHA-256.
--  2. app_firma_contratto(...): come app_firma_documento, ma salva anche i dati compilati.
--     app_firma_documento resta com'è (regolamento, circolari, contratti in PDF).
--  3. app_contratto_ok(): vero se la persona può usare tutte le funzioni.
--     Falso solo per chi è nella rete (app_rete attivo) e non ha ancora firmato
--     il contratto attivo del suo ruolo. Admin sempre vero.
--  4. Blocco anche sul server: chi non ha firmato non registra vendite né lavori
--     (policy restrittive su app_vendite e app_affari). Prima della firma si guarda e basta.
--
-- Va eseguito dopo app-07. È idempotente: si può rieseguire.
-- DA APPLICARE DAL TECNICO nell'SQL Editor del progetto ANCHECASA.
-- =====================================================================

do $$
begin
  if to_regclass('marketplace.app_firme') is null or to_regclass('marketplace.app_documenti') is null then
    raise exception 'manca app_firme: eseguire prima app-07-regole-clienti-documenti.sql';
  end if;
end $$;

-- 1. dati compilati nel contratto
alter table marketplace.app_firme add column if not exists dati jsonb not null default '{}'::jsonb;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'app_firme_dati_check') then
    alter table marketplace.app_firme add constraint app_firme_dati_check
      check (jsonb_typeof(dati) = 'object' and pg_column_size(dati) <= 20000);
  end if;
end $$;

-- 2. firma del contratto con i dati
create or replace function marketplace.app_firma_contratto(
  p_documento uuid, p_nome text, p_firma text, p_impronta text, p_dispositivo text, p_dati jsonb)
returns timestamptz language plpgsql security definer set search_path = marketplace, public as $$
declare
  d marketplace.app_documenti;
  v_quando timestamptz;
begin
  if auth.uid() is null then raise exception 'non_autenticato'; end if;
  select * into d from marketplace.app_documenti where id = p_documento;
  if d.id is null or not d.attivo or not marketplace.app_vedo_documento(d.ruoli, d.attivo) then raise exception 'documento_non_trovato'; end if;
  if not d.richiede_firma then raise exception 'documento_senza_firma'; end if;
  if d.tipo <> 'contratto' then raise exception 'non_contratto'; end if;
  if p_dati is null or jsonb_typeof(p_dati) <> 'object' then raise exception 'dati_mancanti'; end if;
  if coalesce(btrim(p_dati->>'cf'), '') = '' or coalesce(btrim(p_dati->>'iban'), '') = '' then raise exception 'dati_mancanti'; end if;
  if exists (select 1 from marketplace.app_firme where documento = p_documento and utente = auth.uid()) then raise exception 'gia_firmato'; end if;
  insert into marketplace.app_firme (documento, utente, nome, firma, impronta, dispositivo, dati)
    values (p_documento, auth.uid(), btrim(p_nome), p_firma, left(coalesce(p_impronta, ''), 128), left(coalesce(p_dispositivo, ''), 300), p_dati)
    returning firmato into v_quando;
  perform marketplace.app_notifica_admin('Contratto firmato: ' || d.titolo || ' · ' || btrim(p_nome), 'ad-documento/' || p_documento);
  return v_quando;
end;
$$;
revoke all on function marketplace.app_firma_contratto(uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function marketplace.app_firma_contratto(uuid, text, text, text, text, jsonb) to authenticated;

-- 3. la persona ha firmato il contratto del suo ruolo?
create or replace function marketplace.app_contratto_ok(p_utente uuid default auth.uid())
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select
    marketplace.is_admin()
    or not exists (select 1 from marketplace.app_rete r where r.utente = p_utente and r.stato = 'attivo')
    or not exists (
      select 1 from marketplace.app_rete r
      join marketplace.app_documenti d
        on d.tipo = 'contratto' and d.attivo and d.richiede_firma and r.ruolo = any (d.ruoli)
      where r.utente = p_utente and r.stato = 'attivo')
    or exists (
      select 1 from marketplace.app_rete r
      join marketplace.app_documenti d
        on d.tipo = 'contratto' and d.attivo and d.richiede_firma and r.ruolo = any (d.ruoli)
      join marketplace.app_firme f on f.documento = d.id and f.utente = p_utente
      where r.utente = p_utente and r.stato = 'attivo');
$$;
revoke all on function marketplace.app_contratto_ok(uuid) from public, anon;
grant execute on function marketplace.app_contratto_ok(uuid) to authenticated;

-- 4. prima della firma niente vendite e niente lavori registrati (si guarda e basta)
do $$
begin
  if to_regclass('marketplace.app_vendite') is not null then
    execute 'drop policy if exists app_vendite_serve_contratto on marketplace.app_vendite';
    execute 'create policy app_vendite_serve_contratto on marketplace.app_vendite as restrictive for insert to authenticated with check (marketplace.app_contratto_ok())';
  end if;
  if to_regclass('marketplace.app_affari') is not null then
    execute 'drop policy if exists app_affari_serve_contratto on marketplace.app_affari';
    execute 'create policy app_affari_serve_contratto on marketplace.app_affari as restrictive for insert to authenticated with check (marketplace.app_contratto_ok())';
  end if;
end $$;

-- Prova veloce (da utente della rete senza firma deve dare false):
--   select marketplace.app_contratto_ok();
