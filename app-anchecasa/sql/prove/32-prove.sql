-- Prove del simulatore pubblico (app-32). Solo in locale, dopo 00-finto-supabase e app-01…app-11, app-32.
-- Ogni prova che fallisce si ferma con un errore «PROVA FALLITA».
\set ON_ERROR_STOP 1
do $$
declare j jsonb; n int; ok boolean;
begin
  -- 1. senza prezzario: niente numeri
  set local role anon;
  j := marketplace.app_simulatore_stima('bagno', 6, 'Lazio', 'medio');
  if (j->>'disponibile')::boolean or j->>'motivo' <> 'prezzario_mancante' then raise exception 'PROVA FALLITA 1: %', j; end if;
  -- 2. facciata: solo sopralluogo
  j := marketplace.app_simulatore_stima('facciata', 100, 'Lazio', 'medio');
  if j->>'motivo' <> 'serve_sopralluogo' then raise exception 'PROVA FALLITA 2: %', j; end if;
  -- 3. mq fuori misura
  j := marketplace.app_simulatore_stima('bagno', 60, 'Lazio', 'medio');
  if j->>'motivo' <> 'mq_fuori_misura' then raise exception 'PROVA FALLITA 3: %', j; end if;
  -- 4. chi non ha account non legge le ricette né le richieste
  begin perform count(*) from marketplace.app_simulatore_ricette; raise exception 'PROVA FALLITA 4a';
  exception when insufficient_privilege then null; end;
  begin perform count(*) from marketplace.app_contatti; raise exception 'PROVA FALLITA 4b';
  exception when insufficient_privilege then null; end;
  reset role;

  -- 5. prezzario di PROVA nel Lazio: 10 € per ogni lavorazione
  insert into marketplace.app_prezzari (id, fonte, regione, anno) values ('00000000-0000-0000-0000-0000000000a1', 'Prezzario PROVA', 'Lazio', 2025);
  insert into marketplace.app_prezzari_voci select '00000000-0000-0000-0000-0000000000a1', chiave, nome, um, 10 from marketplace.app_stima_lavorazioni;
  insert into marketplace.app_stima_riferimenti select chiave, 'Lazio', '00000000-0000-0000-0000-0000000000a1', chiave from marketplace.app_stima_lavorazioni;
  set local role anon;
  -- bagno 6 mq = 84 unità × 10 € = 840 × 1,2 (medio) = 1008 → ±25% → 800 – 1300
  j := marketplace.app_simulatore_stima('bagno', 6, 'Lazio', 'medio');
  if not (j->>'disponibile')::boolean or (j->>'min')::numeric <> 800 or (j->>'max')::numeric <> 1300 then raise exception 'PROVA FALLITA 5: %', j; end if;
  j := marketplace.app_simulatore_stima('bagno', 6, 'Campania', 'medio');
  if (j->>'disponibile')::boolean then raise exception 'PROVA FALLITA 5b: altra regione senza prezzario %', j; end if;
  reset role;

  -- 6. copertura: con 7 voci su 10 la stima non si dà
  delete from marketplace.app_stima_riferimenti where regione = 'Lazio' and lavorazione in ('sanitari', 'rivestimento', 'pavimento');
  set local role anon;
  j := marketplace.app_simulatore_stima('bagno', 6, 'Lazio', 'medio');
  if (j->>'disponibile')::boolean then raise exception 'PROVA FALLITA 6: %', j; end if;

  -- 7. invio: arriva nelle richieste dai siti con la stima calcolata dal server
  j := marketplace.app_simulatore_invia('pareti', 80, 'Lazio', 'Roma', 'medio', 'entro 3 mesi', 'Prova Uno', '333 1234567', '', '', true, 'AG-12');
  if not (j->>'ok')::boolean then raise exception 'PROVA FALLITA 7: %', j; end if;
  begin perform marketplace.app_simulatore_invia('pareti', 80, 'Lazio', 'Roma', 'medio', '', 'Prova Due', '3331234567', '', '', false); raise exception 'PROVA FALLITA 7b';
  exception when raise_exception then if sqlerrm <> 'serve_il_consenso' then raise; end if; end;
  begin perform marketplace.app_simulatore_invia('pareti', 80, 'Lazio', 'Roma', 'medio', '', 'Prova Tre', '12', '', '', true); raise exception 'PROVA FALLITA 7c';
  exception when raise_exception then if sqlerrm <> 'manca_il_telefono' then raise; end if; end;
  reset role;
  select count(*) into n from marketplace.app_contatti where tipo = 'simulazione' and nome = 'Prova Uno' and stato = 'nuovo'
    and dati->>'codice_agente' = 'AG-12' and dati->>'stima' like '% € (indicativa)';
  if n <> 1 then raise exception 'PROVA FALLITA 7d'; end if;
  raise notice 'Prove del simulatore: tutte superate.';
end $$;
