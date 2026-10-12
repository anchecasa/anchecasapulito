-- app-31 · L'app dell'agente sul telefono (area-privata/app/, 12.10.2026, scelta di Nando alle 19:21)
--
-- Dall'app l'agente apre un sopralluogo nuovo direttamente a casa del cliente: la pratica nasce già assegnata a lui
-- (agente_id = chi la crea), stato «sopralluogo», così può subito fare misure, foto, video, IA e mandarla al cliente.
-- (ristrutturazione_nuova di app-24 invece la lascia senza agente: l'assegna l'admin.)
-- L'admin la vede in Ristrutturazioni come tutte le altre (origine «rete») e riceve la solita mail.
-- Da eseguire DOPO app-30. Si può rilanciare.

begin;

create or replace function marketplace.ristrutturazione_nuova_mia(p jsonb)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_id uuid; v_ok boolean;
begin
  if auth.uid() is null then raise exception 'serve_accesso'; end if;
  select marketplace.is_admin() or exists (select 1 from marketplace.profiles pr
    where pr.id = auth.uid() and pr.famiglia::text = 'agente' and pr.verifica::text = 'verificato') into v_ok;
  if not v_ok then raise exception 'solo_rete'; end if;
  if length(btrim(coalesce(p->>'nome', ''))) < 2 then raise exception 'manca_nome'; end if;
  if (select count(*) from marketplace.ristrutturazioni where inviato_da = auth.uid() and creato > now() - interval '1 day') >= 20 then
    raise exception 'troppe_richieste';
  end if;
  insert into marketplace.ristrutturazioni (origine, inviato_da, agente_id, stato, nome, telefono, mail, comune, provincia, indirizzo, descrizione, budget)
  values ('rete', auth.uid(), auth.uid(), 'sopralluogo',
    left(btrim(p->>'nome'), 120), left(coalesce(p->>'telefono', ''), 30), left(lower(btrim(coalesce(p->>'mail', ''))), 160),
    left(coalesce(p->>'comune', ''), 80), upper(left(coalesce(p->>'provincia', ''), 2)), left(coalesce(p->>'indirizzo', ''), 160),
    left(coalesce(p->>'descrizione', ''), 1500), left(coalesce(p->>'budget', ''), 60))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function marketplace.ristrutturazione_nuova_mia(jsonb) from public, anon;
grant execute on function marketplace.ristrutturazione_nuova_mia(jsonb) to authenticated;

commit;

-- Controllo (sola lettura):
-- select proname from pg_proc where proname = 'ristrutturazione_nuova_mia';
