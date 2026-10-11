-- Prove della parte 5 (dopo 02-prove, app-04, 04-prove, app-05). Utenti: 6 admin, 12 Rete Italia, 8 sviluppo Centro, 9 capoarea Lazio, 10 agente, 11 sub-agente, 7 estraneo.
\set ON_ERROR_STOP 0
create or replace function pg_temp.u(n int) returns uuid language sql as $$ select ('00000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid $$;
create or replace function pg_temp.come(n int) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', pg_temp.u(n)::text, false);
  perform set_config('request.jwt.claims', json_build_object('email', (select email from auth.users where id = pg_temp.u(n)))::text, false);
end $$;
reset role;
insert into auth.users (id, email) values (pg_temp.u(20),'nuovo.agente@x.it'),(pg_temp.u(21),'altro@x.it'),(pg_temp.u(22),'nuovo.ri@x.it') on conflict do nothing;
update marketplace.app_rete set superiore = pg_temp.u(12) where utente = pg_temp.u(8);
set role authenticated;
\echo [atteso errore] capoarea invita direttamente un agente
select pg_temp.come(9); insert into marketplace.app_inviti (cosa, ruolo, email) values ('rete','agente','diretto@x.it');
\echo [atteso errore] estraneo propone
select pg_temp.come(7); select marketplace.app_proponi_rete('agente','Tizio','tizio@x.it','','Lazio','');
-- il capoarea propone un agente nel Lazio
select pg_temp.come(9); select marketplace.app_proponi_rete('agente','Nuovo Agente','nuovo.agente@x.it','333','Lazio','Lo conosco da anni') is not null as "P1 proposta fatta";
select 'P2 stato: '||stato||' area '||area||' serve RI '||serve_reteitalia||' serve sviluppo '||serve_sviluppo||' superiore capoarea '||(superiore=pg_temp.u(9)) from marketplace.app_proposte_rete where email='nuovo.agente@x.it';
\echo [atteso errore] agente vota
select pg_temp.come(10); select marketplace.app_vota_proposta((select id from marketplace.app_proposte_rete where email='nuovo.agente@x.it'), true, '');
select pg_temp.come(10); select 'P3 agente vede proposte: '||count(*) from marketplace.app_proposte_rete;
select pg_temp.come(6); select 'P4 admin vota: '||marketplace.app_vota_proposta((select id from marketplace.app_proposte_rete where email='nuovo.agente@x.it'), true, 'ok');
select pg_temp.come(12); select 'P5 Rete Italia vota: '||marketplace.app_vota_proposta((select id from marketplace.app_proposte_rete where email='nuovo.agente@x.it'), true, '');
select pg_temp.come(8); select 'P6 sviluppo vota: '||marketplace.app_vota_proposta((select id from marketplace.app_proposte_rete where email='nuovo.agente@x.it'), true, 'bene');
select pg_temp.come(9); select 'P7 invito al capoarea: '||count(*) from marketplace.app_inviti where email='nuovo.agente@x.it' and stato='inviato';
reset role; select set_config('prova.tok', (select token from marketplace.app_inviti where email='nuovo.agente@x.it'), false); set role authenticated;
select pg_temp.come(20); select marketplace.app_accetta_invito(current_setting('prova.tok'));
select 'P8 nuovo agente: '||ruolo||' regione '||regione||' area '||area||' sotto capoarea '||(superiore=pg_temp.u(9)) from marketplace.app_rete where utente=pg_temp.u(20);
-- un no respinge
select pg_temp.come(10); select marketplace.app_proponi_rete('subagente','Sub Prova','altro@x.it','','Lazio','') is not null as "P9 agente propone";
select pg_temp.come(12); select 'P10 Rete Italia dice no: '||marketplace.app_vota_proposta((select id from marketplace.app_proposte_rete where email='altro@x.it'), false, 'non ora');
select pg_temp.come(10); select 'P11 nessun invito: '||count(*) from marketplace.app_inviti where email='altro@x.it';
\echo [atteso errore] voto su proposta chiusa
select pg_temp.come(6); select marketplace.app_vota_proposta((select id from marketplace.app_proposte_rete where email='altro@x.it'), true, '');
-- l'admin invita direttamente solo il Responsabile Rete Italia
select pg_temp.come(6); insert into marketplace.app_inviti (cosa, ruolo, email) values ('rete','reteitalia','nuovo.ri@x.it');
select 'P12 invito Rete Italia: '||count(*) from marketplace.app_inviti where email='nuovo.ri@x.it';
\echo [atteso errore] admin invita direttamente un agente
insert into marketplace.app_inviti (cosa, ruolo, email) values ('rete','agente','diretto2@x.it');
\echo [atteso errore] proposta scritta a mano
select pg_temp.come(9); insert into marketplace.app_proposte_rete (proposto_da, ruolo, nome, email, stato) values (pg_temp.u(9),'agente','Furbo','furbo@x.it','approvata');
