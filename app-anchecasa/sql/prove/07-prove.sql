-- Prove della parte 7 (dopo 06-prove e app-07). Utenti: 6 admin, 12 Rete Italia, 8 sviluppo Centro, 9 capoarea Lazio, 10 agente, 11 sub-agente, 7 estraneo, 20 nuovo agente (sotto il capoarea).
\set ON_ERROR_STOP 0
create or replace function pg_temp.u(n int) returns uuid language sql as $$ select ('00000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid $$;
create or replace function pg_temp.come(n int) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', pg_temp.u(n)::text, false);
  perform set_config('request.jwt.claims', json_build_object('email', (select email from auth.users where id = pg_temp.u(n)))::text, false);
end $$;
set role authenticated;

-- ===== Il cliente è di chi lo registra per primo
select pg_temp.come(10); insert into marketplace.app_vendite (cliente_nome, cliente_tipo, cliente_piva, cosa, importo) values ('Edil Rossi', 'azienda', '01234567890', 'modulo', 49);
select 'K1 agente registra Edil Rossi: '||count(*) from marketplace.app_vendite where cliente_nome='Edil Rossi';
\echo [atteso errore] un collega registra la stessa partita IVA
select pg_temp.come(20); insert into marketplace.app_vendite (cliente_nome, cliente_tipo, cliente_piva, cosa, importo) values ('Edil Rossi srl', 'azienda', 'IT 01234567890', 'pacchetto', 69);
select pg_temp.come(20); select 'K2 per il collega è libero? '||marketplace.app_cliente_libero('azienda','01234567890','');
select pg_temp.come(10); select 'K3 per chi l''ha registrato è libero? '||marketplace.app_cliente_libero('azienda','01234567890','');
select pg_temp.come(10); insert into marketplace.app_vendite (cliente_nome, cliente_tipo, cliente_piva, cosa, importo) values ('Edil Rossi', 'azienda', '01234567890', 'corso', 159);
select 'K4 lo stesso agente vende altro: '||count(*) from marketplace.app_vendite where cliente_nome='Edil Rossi';
-- privati: 12 mesi
select pg_temp.come(10); insert into marketplace.app_vendite (cliente_nome, cliente_tipo, cliente_contatto, cosa, importo) values ('Signora Bianchi', 'privato', '+39 333 123 4567', 'altro', 0);
\echo [atteso errore] un collega registra un lavoro per lo stesso privato
select pg_temp.come(20); insert into marketplace.app_affari (cliente_nome, cliente_tipo, cliente_contatto, valore) values ('Bianchi', 'privato', '3331234567', 20000);
select pg_temp.come(10); insert into marketplace.app_affari (cliente_nome, cliente_tipo, cliente_contatto, valore) values ('Signora Bianchi', 'privato', '333.123.4567', 20000);
select 'K5 il lavoro del privato è dell''agente: '||count(*) from marketplace.app_affari where cliente_nome='Signora Bianchi' and segnalato_da=pg_temp.u(10);
reset role; update marketplace.app_vendite set creato = now() - interval '13 months' where cliente_nome='Signora Bianchi'; update marketplace.app_affari set creato = now() - interval '13 months' where cliente_nome='Signora Bianchi'; set role authenticated;
select pg_temp.come(20); insert into marketplace.app_affari (cliente_nome, cliente_tipo, cliente_contatto, valore) values ('Bianchi dopo un anno', 'privato', '3331234567', 20000);
select 'K6 dopo 12 mesi senza contatti è libero: '||count(*) from marketplace.app_affari where cliente_nome='Bianchi dopo un anno';

-- ===== Clienti di AncheCasa affidati: metà quota, niente quote di linea
\echo [atteso errore] l agente si affida un cliente da solo
select pg_temp.come(10); insert into marketplace.app_vendite (cliente_nome, cosa, importo, affidato) values ('Furbo', 'modulo', 49, true);
select pg_temp.come(6); insert into marketplace.app_vendite (venditore, cliente_nome, cliente_tipo, cliente_piva, cosa, importo, affidato) values (pg_temp.u(10), 'Dal sito Srl', 'azienda', '09999999999', 'modulo', 100, true);
select pg_temp.come(10); select 'A1 avviso all''agente: '||count(*) from marketplace.app_notifiche where utente=pg_temp.u(10) and testo like 'Ti è stato affidato%';
select pg_temp.come(6); update marketplace.app_vendite set stato='attiva' where cliente_nome='Dal sito Srl';
select 'A2 '||ruolo||' '||importo from marketplace.app_provvigioni where vendita=(select id from marketplace.app_vendite where cliente_nome='Dal sito Srl');
select 'A3 righe di provvigione (solo una): '||count(*) from marketplace.app_provvigioni where vendita=(select id from marketplace.app_vendite where cliente_nome='Dal sito Srl');

-- ===== Lavori del sub-agente: 70/30 con il suo agente
select pg_temp.come(11); insert into marketplace.app_affari (cliente_nome, cliente_tipo, cliente_contatto, valore) values ('Condominio Sole', 'condominio', 'sole@condominio.it', 100000);
select pg_temp.come(6); select marketplace.app_affare_firma((select id from marketplace.app_affari where cliente_nome='Condominio Sole'), 100000, 10000, null, pg_temp.u(11), null);
select 'L1 alla rete: '||marketplace.app_tranche_incassata((select id from marketplace.app_affari where cliente_nome='Condominio Sole'), 1, 30000);
select 'L2 '||ruolo||' '||importo from marketplace.app_provvigioni where affare=(select id from marketplace.app_affari where cliente_nome='Condominio Sole') order by importo desc, ruolo;

-- ===== Documenti e firme
select pg_temp.come(10); select 'D1 l''agente vede: '||string_agg(titolo, ' | ' order by titolo) from marketplace.app_documenti;
select pg_temp.come(9); select 'D2 il capoarea vede il contratto agente? '||count(*) from marketplace.app_documenti where titolo='Contratto Agente';
select pg_temp.come(7); select 'D3 estraneo vede: '||count(*) from marketplace.app_documenti;
select pg_temp.come(10); select 'D4 firma: '||(marketplace.app_firma_documento((select id from marketplace.app_documenti where titolo='Contratto Agente'), 'Mario Agente', 'data:image/png;base64,iVBORw0KGgo=', 'abc123', 'prova') is not null);
\echo [atteso errore] seconda firma dello stesso documento
select pg_temp.come(10); select marketplace.app_firma_documento((select id from marketplace.app_documenti where titolo='Contratto Agente'), 'Mario Agente', 'data:image/png;base64,iVBORw0KGgo=', 'abc123', 'prova');
\echo [atteso errore] l agente firma il contratto del capoarea
select pg_temp.come(10); select marketplace.app_firma_documento((select id from marketplace.app_documenti where titolo='Contratto Capo area'), 'Mario Agente', 'data:image/png;base64,iVBORw0KGgo=', '', '');
\echo [atteso errore] firma scritta a mano
select pg_temp.come(10); insert into marketplace.app_firme (documento, utente, nome, firma) values ((select id from marketplace.app_documenti where titolo='Contratto Capo area'), pg_temp.u(10), 'Mario', 'data:image/png;base64,x');
select pg_temp.come(9); select 'D5 il capoarea vede le firme degli altri: '||count(*) from marketplace.app_firme;
select pg_temp.come(6); select 'D6 l''admin vede: '||count(*)||' firma, notifica '||(select count(*) from marketplace.app_notifiche where testo like 'Firmato: Contratto Agente%') from marketplace.app_firme;
\echo [atteso errore] l agente pubblica una circolare
select pg_temp.come(10); insert into marketplace.app_documenti (titolo) values ('Circolare finta');
select pg_temp.come(6); insert into marketplace.app_documenti (tipo, titolo, testo, ruoli) values ('circolare', 'Circolare n. 2 per gli agenti', 'Prova', '{agente}');
select pg_temp.come(11); select 'D7 il sub-agente vede la circolare degli agenti: '||count(*) from marketplace.app_documenti where titolo like 'Circolare n. 2%';
select pg_temp.come(10); select 'D8 l''agente la vede: '||count(*) from marketplace.app_documenti where titolo like 'Circolare n. 2%';
