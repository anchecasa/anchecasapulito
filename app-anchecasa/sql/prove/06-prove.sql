-- Prove della parte 6 (dopo 05-prove e app-06). Utenti: 6 admin, 12 Rete Italia, 8 sviluppo Centro, 9 capoarea Lazio, 10 agente, 11 sub-agente, 7 estraneo.
\set ON_ERROR_STOP 0
create or replace function pg_temp.u(n int) returns uuid language sql as $$ select ('00000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid $$;
create or replace function pg_temp.come(n int) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', pg_temp.u(n)::text, false);
  perform set_config('request.jwt.claims', json_build_object('email', (select email from auth.users where id = pg_temp.u(n)))::text, false);
end $$;
reset role;
update marketplace.app_impostazioni set valore = valore || '{"percentuale_vendita":20}'::jsonb where chiave = 'provvigioni';
set role authenticated;

-- ===== Sala strategia
select pg_temp.come(9); select marketplace.app_strategia_apri('Puntare sugli impiantisti del Lazio', 'Molte richieste di impianti, pochi fornitori iscritti.', 'zone') is not null as "S1 capoarea apre";
\echo [atteso errore] agente apre un argomento
select pg_temp.come(10); select marketplace.app_strategia_apri('Idea agente', '', 'altro');
select pg_temp.come(10); select 'S2 agente vede la sala: '||count(*) from marketplace.app_strategie;
select pg_temp.come(8); select marketplace.app_strategia_commenta((select id from marketplace.app_strategie where tema='zone'), 'Sono d''accordo, partiamo da Roma.');
select 'S3 commenti: '||jsonb_array_length(commenti) from marketplace.app_strategie where tema='zone';
\echo [atteso errore] capoarea decide
select pg_temp.come(9); select marketplace.app_strategia_decidi((select id from marketplace.app_strategie where tema='zone'), true, '', '');
select pg_temp.come(6); select 'S4 admin sì con linea A: '||marketplace.app_strategia_decidi((select id from marketplace.app_strategie where tema='zone'), true, 'Ottobre: 10 impiantisti nel Lazio', '');
select pg_temp.come(12); select 'S5 Rete Italia cambia la linea: '||marketplace.app_strategia_decidi((select id from marketplace.app_strategie where tema='zone'), true, 'Ottobre: 15 impiantisti nel Lazio', '');
select 'S5b voto admin azzerato: '||coalesce(voto_admin,'vuoto') from marketplace.app_strategie where tema='zone';
select pg_temp.come(6); select 'S6 admin conferma: '||marketplace.app_strategia_decidi((select id from marketplace.app_strategie where tema='zone'), true, '', 'ok');
select pg_temp.come(10); select 'S7 agente vede la linea: '||linea from marketplace.app_linee_decise();
select pg_temp.come(7); select 'S8 estraneo vede linee: '||count(*) from marketplace.app_linee_decise();
select pg_temp.come(8); select marketplace.app_strategia_apri('Sconto 20% sui moduli', '', 'prezzi') is not null as "S9 sviluppo apre";
select pg_temp.come(12); select 'S10 Rete Italia dice no: '||marketplace.app_strategia_decidi((select id from marketplace.app_strategie where tema='prezzi'), false, '', 'non ora');
\echo [atteso errore] decidere un argomento chiuso
select pg_temp.come(6); select marketplace.app_strategia_decidi((select id from marketplace.app_strategie where tema='prezzi'), true, '', '');
\echo [atteso errore] scrittura a mano nella sala
select pg_temp.come(9); update marketplace.app_strategie set stato = 'decisa';

-- ===== Lavori a SAL
select pg_temp.come(10); insert into marketplace.app_affari (cliente_nome, cliente_tipo, cliente_regione, descrizione, valore) values ('Famiglia Bianchi', 'privato', 'Lazio', 'Ristrutturazione completa', 100000);
select 'L1 lavoro registrato: '||stato from marketplace.app_affari where cliente_nome='Famiglia Bianchi';
\echo [atteso errore] agente si mette da solo come chi segue il cantiere
select pg_temp.come(10); insert into marketplace.app_affari (cliente_nome, segue) values ('Furbo', pg_temp.u(10));
\echo [atteso errore] agente firma
select pg_temp.come(10); select marketplace.app_affare_firma((select id from marketplace.app_affari where cliente_nome='Famiglia Bianchi'), 100000, 20000, null, null, null);
select pg_temp.come(6); select marketplace.app_affare_firma((select id from marketplace.app_affari where cliente_nome='Famiglia Bianchi'), 100000, 20000, pg_temp.u(9), pg_temp.u(10), pg_temp.u(8));
select 'L2 firmato, tranche: '||(select count(*) from marketplace.app_affari_tranche t join marketplace.app_affari a on a.id=t.affare where a.cliente_nome='Famiglia Bianchi');
select pg_temp.come(10); select 'L3 agente vede il margine: '||count(*) from marketplace.app_affari_margine;
select pg_temp.come(10); select 'L3b agente vede le tranche: '||count(*) from marketplace.app_affari_tranche;
select pg_temp.come(6); select 'L4 tranche 1 incassata, alla rete: '||marketplace.app_tranche_incassata((select id from marketplace.app_affari where cliente_nome='Famiglia Bianchi'), 1, 30000);
select 'L5 '||ruolo||' '||importo from marketplace.app_provvigioni where affare=(select id from marketplace.app_affari where cliente_nome='Famiglia Bianchi') and tranche=1 order by importo desc, ruolo;
select 'L6 metà lavori incassata a metà: '||marketplace.app_tranche_incassata((select id from marketplace.app_affari where cliente_nome='Famiglia Bianchi'), 2, 15000);
\echo [atteso errore] tranche 1 di nuovo
select marketplace.app_tranche_incassata((select id from marketplace.app_affari where cliente_nome='Famiglia Bianchi'), 1, 30000);
select pg_temp.come(10); select 'L7 agente: provvigioni dal lavoro '||sum(importo) from marketplace.app_provvigioni where affare is not null and beneficiario=pg_temp.u(10);
select pg_temp.come(6); select 'L8 collaudo: '||marketplace.app_tranche_incassata((select id from marketplace.app_affari where cliente_nome='Famiglia Bianchi'), 3, 40000);
select 'L9 lavoro: '||stato from marketplace.app_affari where cliente_nome='Famiglia Bianchi';

-- ===== Privati: nessuna provvigione sulla vendita
select pg_temp.come(11); insert into marketplace.app_vendite (cliente_nome, cliente_tipo, cosa, importo, tipo_importo) values ('Signor Rossi', 'privato', 'corso', 100, 'una_tantum');
select pg_temp.come(6); update marketplace.app_vendite set stato='attiva' where cliente_nome='Signor Rossi';
select 'P1 provvigioni sul privato: '||count(*) from marketplace.app_provvigioni where vendita=(select id from marketplace.app_vendite where cliente_nome='Signor Rossi');
select pg_temp.come(11); insert into marketplace.app_vendite (cliente_nome, cliente_tipo, cosa, importo, tipo_importo) values ('Bar Sport', 'azienda', 'corso', 100, 'una_tantum');
select pg_temp.come(6); update marketplace.app_vendite set stato='attiva' where cliente_nome='Bar Sport';
select 'P2 provvigioni sull''azienda: '||count(*) from marketplace.app_provvigioni where vendita=(select id from marketplace.app_vendite where cliente_nome='Bar Sport');

-- ===== Obiettivi
select pg_temp.come(12); select marketplace.app_fissa_obiettivo(pg_temp.u(10), current_date, 4, 300, 1, 50000, 'Ottobre');
select pg_temp.come(6); select marketplace.app_fissa_obiettivo(null, current_date, 40, 3000, 8, 600000, 'Italia');
select pg_temp.come(6); select marketplace.app_fissa_obiettivo(null, current_date, 45, 3000, 8, 600000, 'Italia corretto');
select 'O1 obiettivi Italia (uno solo): '||count(*)||' aziende '||max(aziende) from marketplace.app_obiettivi where utente is null;
\echo [atteso errore] agente fissa un obiettivo
select pg_temp.come(10); select marketplace.app_fissa_obiettivo(pg_temp.u(10), current_date, 1, 0, 0, 0, '');
select pg_temp.come(10); select 'O2 agente vede: '||count(*) from marketplace.app_obiettivi;
select pg_temp.come(9); select 'O3 capoarea vede: '||count(*) from marketplace.app_obiettivi;
select pg_temp.come(7); select 'O4 estraneo vede: '||count(*) from marketplace.app_obiettivi;
