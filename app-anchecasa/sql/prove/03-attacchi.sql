-- Prove degli attacchi trovati dalla revisione (dopo 02-prove.sql, stesso database).
\set ON_ERROR_STOP 0
set role authenticated;
create or replace function pg_temp.u(n int) returns uuid language sql as $$ select ('00000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid $$;
create or replace function pg_temp.come(n int) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', pg_temp.u(n)::text, false);
  perform set_config('request.jwt.claims', json_build_object('email', (select email from auth.users where id = pg_temp.u(n)))::text, false);
end $$;
-- G1 invito modificato
select pg_temp.come(7);
insert into marketplace.app_org (id, nome) values ('aaaaaaaa-0000-0000-0000-000000000007','Estraneo Srl');
insert into marketplace.app_inviti (id, token, cosa, target, ruolo, email) values ('12121212-0000-0000-0000-000000000001','tok-x','org','aaaaaaaa-0000-0000-0000-000000000007','operatore','x@x.it');
\echo [atteso errore] cambiare il target dell invito
update marketplace.app_inviti set target='aaaaaaaa-0000-0000-0000-000000000001', ruolo='responsabile' where id='12121212-0000-0000-0000-000000000001';
select 'G1 invito: '||target||' '||ruolo from marketplace.app_inviti where id='12121212-0000-0000-0000-000000000001';
-- G3 vendita riaperta
select pg_temp.come(11);
\echo [atteso errore o nessuna riga] riaprire vendita confermata
update marketplace.app_vendite set stato='proposta' where id='77777777-0000-0000-0000-000000000001';
select 'G3 vendita: '||stato||' provv '||(select count(*) from marketplace.app_provvigioni where vendita='77777777-0000-0000-0000-000000000001') from marketplace.app_vendite where id='77777777-0000-0000-0000-000000000001';
-- G4b gestore inserisce SAL approvato
select pg_temp.come(1);
insert into marketplace.app_record (id, org, tipo, titolo, rif, stato, dati) values ('eeeeeeee-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-000000000001','sal','SAL finto','dddddddd-0000-0000-0000-000000000001','approvato', jsonb_build_object('approvato_da', pg_temp.u(3)));
select 'G4b sal: '||stato||' '||dati::text from marketplace.app_record where id='eeeeeeee-0000-0000-0000-000000000009';
-- G4a partner cambia SAL approvato
select pg_temp.come(4);
update marketplace.app_record set importo=999999 where id='eeeeeeee-0000-0000-0000-000000000001';
select 'G4a importo: '||coalesce(importo::text,'null') from marketplace.app_record where id='eeeeeeee-0000-0000-0000-000000000001';
\echo [atteso errore] partner modifica scheda non sua
update marketplace.app_record set titolo='cambiato' where tipo='cantiere' and id='dddddddd-0000-0000-0000-000000000001';
-- M8 firma dpi del lavoratore
select pg_temp.come(1);
insert into marketplace.app_record (id, org, tipo, titolo, rif) values ('dddddddd-0000-0000-0000-0000000000f1','aaaaaaaa-0000-0000-0000-000000000001','dpi','Casco','cccccccc-0000-0000-0000-000000000001');
select pg_temp.come(2);
update marketplace.app_record set titolo='cambiato', dati='{"firma":"data:image/png;base64,AAA"}' where id='dddddddd-0000-0000-0000-0000000000f1';
select 'M8 dpi: '||titolo||' firmato='||(dati ? 'firma')::text from marketplace.app_record where id='dddddddd-0000-0000-0000-0000000000f1';
-- ingresso dal partner
select pg_temp.come(1); update marketplace.app_record set dati = dati || '{"codice":"AB12CD"}' where id='cccccccc-0000-0000-0000-000000000001';
select pg_temp.come(4); select 'ingresso partner: '||marketplace.app_registra_ingresso('dddddddd-0000-0000-0000-000000000001','ab12cd')::text;
select pg_temp.come(7);
\echo [atteso errore] estraneo registra ingresso
select marketplace.app_registra_ingresso('dddddddd-0000-0000-0000-000000000001','AB12CD');
-- M4 prezzo modulo
select pg_temp.come(7); insert into marketplace.app_moduli (org, modulo, prezzo_mese, attivo_al) values ('aaaaaaaa-0000-0000-0000-000000000007','gare',0.01,'2099-01-01');
select 'M4 prezzo: '||coalesce(prezzo_mese::text,'null')||' al '||coalesce(attivo_al::text,'null') from marketplace.app_moduli where org='aaaaaaaa-0000-0000-0000-000000000007';
-- M5 ordine
insert into marketplace.app_ordini (voce, prezzo) values ('DVR', 0.01);
select 'M5 prezzo ordine: '||prezzo from marketplace.app_ordini where utente=pg_temp.u(7);
-- M6 messaggio falso
select pg_temp.come(3); insert into marketplace.app_messaggi (record, testo, nome, creato) values ('dddddddd-0000-0000-0000-000000000001','ciao','AncheCasa (admin)','2020-01-01');
select 'M6 messaggio: '||nome||' '||(creato > now() - interval '1 minute')::text from marketplace.app_messaggi where testo='ciao';
-- funzioni nascoste
\echo [atteso errore] app_sotto da rpc
select marketplace.app_sotto(pg_temp.u(8));
-- recensione su cantiere finito, partner reale
select pg_temp.come(1); update marketplace.app_record set stato='finito', dati = dati || '{"partner_org":"aaaaaaaa-0000-0000-0000-000000000007"}' where id='dddddddd-0000-0000-0000-000000000001';
select pg_temp.come(3); select 'recensione dopo fine: '||(marketplace.app_recensisci_cantiere('dddddddd-0000-0000-0000-000000000001','{"qualita":5}','ok') is not null);
reset role; select 'recensita org: '||(select nome from marketplace.app_org where id=org) from marketplace.app_recensioni_org;
-- siti
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
insert into marketplace.app_contatti (sito, tipo, nome, email) values ('anchecasa','contatto','Mario Rossi','m@x.it');
\echo [atteso errore] anonimo legge contatti
select count(*) from marketplace.app_contatti;
\echo [atteso errore] anonimo senza contatti
insert into marketplace.app_contatti (sito, tipo, nome) values ('anchecasa','contatto','Senza mail');
reset role; set role authenticated; select pg_temp.come(6); select 'admin vede contatti: '||count(*) from marketplace.app_contatti;
-- moduli base
select pg_temp.come(7); select 'base prezzo: '||coalesce((select prezzo_mese::text from marketplace.app_moduli where org='aaaaaaaa-0000-0000-0000-000000000007' and modulo='gare'),'-');
insert into marketplace.app_moduli (org, modulo) values ('aaaaaaaa-0000-0000-0000-000000000007','base');
select 'base impresa: '||prezzo_mese from marketplace.app_moduli where org='aaaaaaaa-0000-0000-0000-000000000007' and modulo='base';
