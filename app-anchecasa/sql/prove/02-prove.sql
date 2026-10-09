-- Prove della parte 2 (solo in locale).
grant select on auth.users to authenticated; -- solo per le prove
\set ON_ERROR_STOP 0
create or replace function pg_temp.u(n int) returns uuid language sql as $$ select ('00000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid $$;
insert into auth.users select pg_temp.u(i), x from (values (1,'t@x.it'),(2,'o@x.it'),(3,'c@x.it'),(4,'pa@x.it'),(5,'f@x.it'),(6,'admin2@x.it'),(7,'x@x.it'),(8,'sv@x.it'),(9,'ca@x.it'),(10,'ag@x.it'),(11,'sa@x.it'),(12,'k@x.it')) v(i,x);
insert into marketplace.admins (id) values (pg_temp.u(6));
create or replace function pg_temp.come(n int) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', pg_temp.u(n)::text, false);
  perform set_config('request.jwt.claims', json_build_object('email', (select email from auth.users where id = pg_temp.u(n)))::text, false);
end $$;
set role authenticated;
-- 1 azienda
select pg_temp.come(1);
insert into marketplace.app_org (id, nome, tipo, regione) values ('aaaaaaaa-0000-0000-0000-000000000001','Edil Prova','impresa','Lazio');
\echo [atteso errore] impresa si crea gc
insert into marketplace.app_org (nome, tipo) values ('Finto GC','gc');
update marketplace.app_org set tipo='gc', stato='attiva' where id='aaaaaaaa-0000-0000-0000-000000000001';
select '1 org: '||tipo||' membro '||(select ruolo from marketplace.app_org_membri where utente=pg_temp.u(1)) from marketplace.app_org;
-- 2 moduli
\echo [atteso errore] scheda senza modulo
insert into marketplace.app_record (org, tipo, titolo) values ('aaaaaaaa-0000-0000-0000-000000000001','cliente','Mario');
insert into marketplace.app_moduli (org, modulo) values ('aaaaaaaa-0000-0000-0000-000000000001','pacchetto');
update marketplace.app_moduli set stato='attivo';
select '2 modulo dopo tentativo: '||stato from marketplace.app_moduli;
select pg_temp.come(6);
update marketplace.app_moduli set stato='attivo', prezzo_mese=69;
insert into marketplace.app_moduli (org, modulo, stato) values ('aaaaaaaa-0000-0000-0000-000000000001','base','attivo');
select pg_temp.come(1);
insert into marketplace.app_record (id, org, tipo, titolo, modulo) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','cliente','Mario Cliente','finto');
select '2 cliente: modulo='||modulo from marketplace.app_record;
select pg_temp.come(7);
select '3 estraneo vede schede: '||count(*) from marketplace.app_record;
-- 4 inviti operatore
select pg_temp.come(1);
insert into marketplace.app_inviti (token, cosa, target, ruolo, email) values ('tok-op','org','aaaaaaaa-0000-0000-0000-000000000001','operatore','o@x.it');
\echo [atteso errore] titolare invita titolare
insert into marketplace.app_inviti (cosa, target, ruolo, email) values ('org','aaaaaaaa-0000-0000-0000-000000000001','titolare','o@x.it');
select pg_temp.come(7);
select '4 estraneo apre invito: '||marketplace.app_apri_invito('tok-op')::text;
\echo [atteso errore] estraneo accetta invito non suo
select marketplace.app_accetta_invito('tok-op');
select pg_temp.come(2);
select '4 operatore accetta: '||marketplace.app_accetta_invito('tok-op')::text;
-- 5 dipendenti
select pg_temp.come(1);
insert into marketplace.app_record (id, org, tipo, titolo, dati) values ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','dipendente','Operatore Due', jsonb_build_object('utente', pg_temp.u(2)));
insert into marketplace.app_record (org, tipo, titolo) values ('aaaaaaaa-0000-0000-0000-000000000001','dipendente','Altro dipendente');
insert into marketplace.app_record (org, tipo, titolo, rif, scadenza) values ('aaaaaaaa-0000-0000-0000-000000000001','attestato','Corso generale','cccccccc-0000-0000-0000-000000000001', current_date + 20);
select pg_temp.come(2);
select '5 operatore vede: '||string_agg(tipo||':'||titolo, ', ' order by tipo) from marketplace.app_record;
insert into marketplace.app_record (org, tipo, titolo, stato) values ('aaaaaaaa-0000-0000-0000-000000000001','segnalazione','Ponteggio senza parapetto','chiusa');
\echo [atteso errore] operatore crea cliente
insert into marketplace.app_record (org, tipo, titolo) values ('aaaaaaaa-0000-0000-0000-000000000001','cliente','x');
select pg_temp.come(1);
select '5 notifiche titolare: '||string_agg(testo, ' | ') from marketplace.app_notifiche;
select '5 stato segnalazione forzato: '||stato from marketplace.app_record where tipo='segnalazione';
-- 6 cantiere
insert into marketplace.app_record (id, org, tipo, titolo) values ('dddddddd-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','cantiere','Via Roma 1');
insert into marketplace.app_inviti (token, cosa, target, ruolo, email) values ('tok-c','cantiere','dddddddd-0000-0000-0000-000000000001','cliente','c@x.it'),('tok-p','cantiere','dddddddd-0000-0000-0000-000000000001','partner','pa@x.it');
select pg_temp.come(3); select marketplace.app_accetta_invito('tok-c');
select pg_temp.come(4); select marketplace.app_accetta_invito('tok-p');
insert into marketplace.app_record (org, tipo, titolo, rif) values ('aaaaaaaa-0000-0000-0000-000000000002','giornale','Getto solaio','dddddddd-0000-0000-0000-000000000001');
insert into marketplace.app_record (id, org, tipo, titolo, rif, stato, importo, dati) values ('eeeeeeee-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','sal','SAL 1','dddddddd-0000-0000-0000-000000000001','approvato',10000,'{"approvato_da":"finto"}');
select '6 sal del partner: '||stato||' '||dati::text from marketplace.app_record where tipo='sal';
\echo [atteso errore] partner crea cliente
insert into marketplace.app_record (org, tipo, titolo, rif) values ('aaaaaaaa-0000-0000-0000-000000000001','cliente','x','dddddddd-0000-0000-0000-000000000001');
select pg_temp.come(3);
select '6 cliente vede: '||string_agg(tipo||':'||titolo, ', ' order by tipo) from marketplace.app_record;
insert into marketplace.app_record (org, tipo, titolo, rif) values ('aaaaaaaa-0000-0000-0000-000000000001','segnalazione_cliente','Ritardo','dddddddd-0000-0000-0000-000000000001');
\echo [atteso errore] cliente approva sal in bozza
select marketplace.app_approva_sal('eeeeeeee-0000-0000-0000-000000000001', true, 'ok');
select pg_temp.come(1);
update marketplace.app_record set stato='inviato' where id='eeeeeeee-0000-0000-0000-000000000001';
select pg_temp.come(4);
\echo [atteso errore] partner approva
select marketplace.app_approva_sal('eeeeeeee-0000-0000-0000-000000000001', true, 'ok');
update marketplace.app_record set stato='approvato' where id='eeeeeeee-0000-0000-0000-000000000001';
select '6 sal dopo trucco partner: '||stato from marketplace.app_record where tipo='sal';
select pg_temp.come(3);
select '6 notifiche cliente: '||string_agg(testo, ' | ') from marketplace.app_notifiche;
select marketplace.app_approva_sal('eeeeeeee-0000-0000-0000-000000000001', true, 'Tutto ok');
select '6 sal: '||stato from marketplace.app_record where tipo='sal';
insert into marketplace.app_messaggi (record, testo) values ('dddddddd-0000-0000-0000-000000000001','Buongiorno');
select '6 recensione: '||(marketplace.app_recensisci_cantiere('dddddddd-0000-0000-0000-000000000001','{"qualita":5,"puntualita":3}','Bene') is not null);
select pg_temp.come(7);
\echo [atteso errore] estraneo scrive in chat
insert into marketplace.app_messaggi (record, testo) values ('dddddddd-0000-0000-0000-000000000001','spam');
\echo [atteso errore] estraneo recensisce
select marketplace.app_recensisci_cantiere('dddddddd-0000-0000-0000-000000000001','{"qualita":1}','x');
-- 8 lotti e offerte
select pg_temp.come(5);
insert into marketplace.app_org (id, nome, tipo, regione) values ('aaaaaaaa-0000-0000-0000-000000000005','Fornitore Prova','fornitore','Lazio');
select pg_temp.come(6); insert into marketplace.app_moduli (org, modulo, stato) values ('aaaaaaaa-0000-0000-0000-000000000005','base','attivo');
select pg_temp.come(1);
insert into marketplace.app_record (id, org, tipo, titolo, stato, pubblico) values ('ffffffff-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','lotto','Fornitura laterizi','aperto',true);
insert into marketplace.app_record (org, tipo, titolo, pubblico) values ('aaaaaaaa-0000-0000-0000-000000000001','cliente','Pubblico finto',true);
select pg_temp.come(5);
select '8 fornitore vede: '||string_agg(tipo||':'||titolo, ', ') from marketplace.app_record;
insert into marketplace.app_offerte (id, lotto, org, prezzo) values ('99999999-0000-0000-0000-000000000001','ffffffff-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000005',4300);
\echo [atteso errore] fornitore accetta la sua offerta
select marketplace.app_decidi_offerta('99999999-0000-0000-0000-000000000001','accettata');
select pg_temp.come(1);
select marketplace.app_decidi_offerta('99999999-0000-0000-0000-000000000001','accettata');
select '8 lotto: '||stato from marketplace.app_record where id='ffffffff-0000-0000-0000-000000000001';
select pg_temp.come(5);
select '8 notifiche fornitore: '||string_agg(testo, ' | ') from marketplace.app_notifiche;
select pg_temp.come(7);
\echo [atteso errore] estraneo offre per azienda altrui
insert into marketplace.app_offerte (lotto, org, prezzo) values ('ffffffff-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000005',1);
-- 9 rete
select pg_temp.come(6);
insert into marketplace.app_inviti (token, cosa, ruolo, email, nome) values ('tok-sv','rete','sviluppo','sv@x.it','Sviluppo Centro');
select pg_temp.come(8); select marketplace.app_accetta_invito('tok-sv');
select pg_temp.come(6); update marketplace.app_rete set area='Centro', regione='Lazio' where utente=pg_temp.u(8);
select pg_temp.come(8);
insert into marketplace.app_inviti (token, cosa, ruolo, email) values ('tok-ca','rete','capoarea','ca@x.it');
\echo [atteso errore] sviluppo invita agente
insert into marketplace.app_inviti (cosa, ruolo, email) values ('rete','agente','zz@x.it');
select pg_temp.come(9); select marketplace.app_accetta_invito('tok-ca');
insert into marketplace.app_inviti (token, cosa, ruolo, email) values ('tok-ag','rete','agente','ag@x.it');
select pg_temp.come(10); select marketplace.app_accetta_invito('tok-ag');
insert into marketplace.app_inviti (token, cosa, ruolo, email) values ('tok-sa','rete','subagente','sa@x.it');
select pg_temp.come(11); select marketplace.app_accetta_invito('tok-sa');
select '9 sub-agente: '||ruolo||' area '||area||' regione '||regione from marketplace.app_rete where utente=pg_temp.u(11);
insert into marketplace.app_vendite (id, cliente_nome, cosa, importo) values ('77777777-0000-0000-0000-000000000001','Bar Centrale','modulo',100);
\echo [atteso errore] sub-agente si conferma la vendita
update marketplace.app_vendite set stato='attiva';
select pg_temp.come(6); update marketplace.app_vendite set stato='attiva' where id='77777777-0000-0000-0000-000000000001';
select '9 provvigioni: '||string_agg(ruolo||'='||importo, ', ') from marketplace.app_provvigioni;
select pg_temp.come(8); select '9 sviluppo vede vendite: '||count(*)||' rete '||(select count(*) from marketplace.app_rete) from marketplace.app_vendite;
select pg_temp.come(7); select '9 estraneo vede vendite: '||count(*) from marketplace.app_vendite;
select pg_temp.come(11); select '9 sub-agente vede rete: '||count(*) from marketplace.app_rete;
-- 10 ordini con codice
reset role; select set_config('prova.codice', (select codice from marketplace.app_rete where utente=pg_temp.u(10)), false); set role authenticated;
select pg_temp.come(2);
insert into marketplace.app_ordini (id, voce, quantita, prezzo, codice_venditore) values ('66666666-0000-0000-0000-000000000001','Corso HACCP',3,29,lower(current_setting('prova.codice')));
select pg_temp.come(6); select marketplace.app_conferma_ordine('66666666-0000-0000-0000-000000000001');
select '10 provvigione agente da ordine: '||string_agg(importo::text, ',') from marketplace.app_provvigioni where beneficiario=pg_temp.u(10);
-- 11 rivendita
select pg_temp.come(1);
insert into marketplace.app_rivendite (org, cliente_nome, servizio, importo, percentuale) values ('aaaaaaaa-0000-0000-0000-000000000001','Hotel Sole','DVR',199,50);
select '11 percentuale: '||percentuale from marketplace.app_rivendite;
-- 12 report
select pg_temp.come(9); select '12 capoarea report: '||count(*)||' '||max(nome) from marketplace.app_report_recensioni();
select pg_temp.come(8); select '12 sviluppo report: '||count(*) from marketplace.app_report_recensioni();
select pg_temp.come(10);
\echo [atteso errore] agente report
select count(*) from marketplace.app_report_recensioni();
-- 13 profili
select pg_temp.come(3); select '13 cliente: '||marketplace.app_miei_profili()::text;
select pg_temp.come(2); select '13 operatore: '||(marketplace.app_miei_profili()->'org')::text;
-- 14 documenti
select pg_temp.come(1);
insert into storage.objects (bucket_id, name) values ('documenti','aaaaaaaa-0000-0000-0000-000000000001/dddddddd-0000-0000-0000-000000000001/foto.jpg');
select pg_temp.come(3); select '14 cliente vede file: '||count(*) from storage.objects where bucket_id='documenti';
select pg_temp.come(7); select '14 estraneo vede file: '||count(*) from storage.objects where bucket_id='documenti';
\echo [atteso errore] estraneo carica file
insert into storage.objects (bucket_id, name) values ('documenti','aaaaaaaa-0000-0000-0000-000000000001/dddddddd-0000-0000-0000-000000000001/x.jpg');
-- 15 consulente
select pg_temp.come(1);
insert into marketplace.app_inviti (token, cosa, target, ruolo, email) values ('tok-k','org','aaaaaaaa-0000-0000-0000-000000000001','consulente','k@x.it');
select pg_temp.come(12); select marketplace.app_accetta_invito('tok-k');
select '15 consulente vede: '||string_agg(distinct tipo, ', ') from marketplace.app_record;
insert into marketplace.app_record (org, tipo, titolo) values ('aaaaaaaa-0000-0000-0000-000000000001','sopralluogo','Visita trimestrale');
\echo [atteso errore] consulente crea fattura
insert into marketplace.app_record (org, tipo, titolo) values ('aaaaaaaa-0000-0000-0000-000000000001','fattura','x');
-- 16 admin numeri
select pg_temp.come(6); select '16 numeri: '||marketplace.app_numeri_admin2()::text;
-- 17 bacheca
select pg_temp.come(3);
insert into marketplace.app_annunci (id, categoria, titolo) values ('a1a1a1a1-0000-0000-0000-000000000001','affitto','Stanza per studenti');
insert into marketplace.app_annunci (categoria, titolo) select 'lavoro', 'Annuncio '||g from generate_series(1,4) g;
\echo [atteso errore] sesto annuncio del giorno
insert into marketplace.app_annunci (categoria, titolo) values ('lavoro','Troppi');
insert into storage.objects (bucket_id, name) values ('annunci','a1a1a1a1-0000-0000-0000-000000000001/1.jpg');
select pg_temp.come(7); select '17 estraneo vede annunci: '||count(*) from marketplace.app_annunci;
select '17 estraneo vede foto: '||count(*) from storage.objects where bucket_id='annunci';
\echo [atteso errore] estraneo carica foto su annuncio altrui
insert into storage.objects (bucket_id, name) values ('annunci','a1a1a1a1-0000-0000-0000-000000000001/2.jpg');
select pg_temp.come(6); update marketplace.app_annunci set stato='nascosto' where id='a1a1a1a1-0000-0000-0000-000000000001';
select pg_temp.come(3); update marketplace.app_annunci set stato='pubblicato' where id='a1a1a1a1-0000-0000-0000-000000000001';
select '17 dopo tentativo autore: '||stato from marketplace.app_annunci where id='a1a1a1a1-0000-0000-0000-000000000001';
select pg_temp.come(7); select '17 estraneo vede ora: '||count(*) from marketplace.app_annunci;
