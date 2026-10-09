-- Prove della parte 4: Responsabile Rete Italia e nuove quote (dopo 02-prove.sql e app-04).
\set ON_ERROR_STOP 0
create or replace function pg_temp.u(n int) returns uuid language sql as $$ select ('00000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid $$;
create or replace function pg_temp.come(n int) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', pg_temp.u(n)::text, false);
  perform set_config('request.jwt.claims', json_build_object('email', (select email from auth.users where id = pg_temp.u(n)))::text, false);
end $$;
set role authenticated;
select pg_temp.come(6);
insert into marketplace.app_inviti (token, cosa, ruolo, email, nome) values ('tok-ri','rete','reteitalia','k@x.it','Rete Italia');
select pg_temp.come(12); select marketplace.app_accetta_invito('tok-ri');
select 'R1 ruolo: '||ruolo from marketplace.app_rete where utente=pg_temp.u(12);
\echo [atteso errore] rete italia invita un capoarea
insert into marketplace.app_inviti (cosa, ruolo, email) values ('rete','capoarea','zz@x.it');
insert into marketplace.app_inviti (cosa, ruolo, email) values ('rete','sviluppo','nord@x.it');
select 'R2 invito sviluppo ok: '||count(*) from marketplace.app_inviti where email='nord@x.it';
\echo [atteso errore] sviluppo invita rete italia
select pg_temp.come(8); insert into marketplace.app_inviti (cosa, ruolo, email) values ('rete','reteitalia','zz2@x.it');
select pg_temp.come(6); update marketplace.app_rete set superiore=pg_temp.u(12) where utente=pg_temp.u(8);
select 'R3 impostazioni: '||(valore->>'chi_porta')||'/'||(valore->>'sviluppo')||'/'||(valore->>'capoarea')||'/'||(valore->>'reteitalia') from marketplace.app_impostazioni where chiave='provvigioni';
-- vendita del sub-agente: 100 € → monte 20 € (percentuale_vendita 20)
select pg_temp.come(11);
insert into marketplace.app_vendite (id, cliente_nome, cosa, importo) values ('77777777-0000-0000-0000-000000000004','Hotel Prova','modulo',100);
select pg_temp.come(6); update marketplace.app_vendite set stato='attiva' where id='77777777-0000-0000-0000-000000000004';
select 'R4 provvigioni: '||string_agg(ruolo||'='||importo, ', ' order by importo desc)||' totale '||sum(importo) from marketplace.app_provvigioni where vendita='77777777-0000-0000-0000-000000000004';
-- vendita del capoarea (prende chi porta + quota capo area)
select pg_temp.come(9);
insert into marketplace.app_vendite (id, cliente_nome, cosa, importo) values ('77777777-0000-0000-0000-000000000005','Impresa Prova','modulo',50);
select pg_temp.come(6); update marketplace.app_vendite set stato='attiva' where id='77777777-0000-0000-0000-000000000005';
select 'R5 provvigioni capoarea: '||string_agg(ruolo||'='||importo, ', ' order by importo desc)||' totale '||sum(importo) from marketplace.app_provvigioni where vendita='77777777-0000-0000-0000-000000000005';
-- sviluppo senza Rete Italia sopra: la quota Rete Italia va comunque al Responsabile attivo
select pg_temp.come(6); update marketplace.app_rete set superiore=null where utente=pg_temp.u(8);
select pg_temp.come(10);
insert into marketplace.app_vendite (id, cliente_nome, cosa, importo) values ('77777777-0000-0000-0000-000000000006','Bar Prova','corso',10);
select pg_temp.come(6); update marketplace.app_vendite set stato='attiva' where id='77777777-0000-0000-0000-000000000006';
select 'R6 provvigioni: '||string_agg(ruolo||'='||importo, ', ' order by importo desc) from marketplace.app_provvigioni where vendita='77777777-0000-0000-0000-000000000006';
select pg_temp.come(12); select 'R7 rete italia vede vendite '||count(*)||' rete '||(select count(*) from marketplace.app_rete)||' provv '||(select count(*) from marketplace.app_provvigioni) from marketplace.app_vendite;
select 'R8 report rete italia: '||count(*) from marketplace.app_report_recensioni();
select pg_temp.come(7); select 'R9 estraneo vede vendite: '||count(*) from marketplace.app_vendite;
select pg_temp.come(10); select 'R10 agente vede rete: '||count(*) from marketplace.app_rete;
