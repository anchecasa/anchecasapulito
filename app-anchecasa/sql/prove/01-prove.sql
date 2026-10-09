-- Prove dei permessi (solo in locale).
\set ON_ERROR_STOP 0
insert into auth.users values ('00000000-0000-0000-0000-00000000000a','p@x'),('00000000-0000-0000-0000-00000000000b','a@x'),('00000000-0000-0000-0000-00000000000c','b@x'),('00000000-0000-0000-0000-00000000000d','admin@x'),('00000000-0000-0000-0000-00000000000e','e@x');
insert into marketplace.profiles values ('00000000-0000-0000-0000-00000000000a','Giulia Rossi');
insert into marketplace.admins values ('00000000-0000-0000-0000-00000000000d');
create or replace function pg_temp.come(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, false); end $$;
set role authenticated;
-- 1 ruoli
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
insert into marketplace.app_ruoli (utente, ruolo) values ('00000000-0000-0000-0000-00000000000a','privato');
\echo [atteso errore] privato si dà agente
insert into marketplace.app_ruoli (utente, ruolo) values ('00000000-0000-0000-0000-00000000000a','agente');
-- 2 artigiani
select pg_temp.come('00000000-0000-0000-0000-00000000000b');
\echo [atteso errore] artigiano si crea verificato
insert into marketplace.app_artigiani (utente, nome_attivita, mestieri, lat, lng, stato) values ('00000000-0000-0000-0000-00000000000b','Idraulica Monti','{idraulico}',41.87,12.46,'verificato');
insert into marketplace.app_artigiani (utente, nome_attivita, mestieri, telefono, lat, lng) values ('00000000-0000-0000-0000-00000000000b','Idraulica Monti','{idraulico}','3330000000',41.87,12.46);
update marketplace.app_artigiani set stato='verificato' where utente='00000000-0000-0000-0000-00000000000b';
select 'stato A dopo tentativo: '||stato from marketplace.app_artigiani;
select pg_temp.come('00000000-0000-0000-0000-00000000000c');
insert into marketplace.app_artigiani (utente, nome_attivita, mestieri, lat, lng) values ('00000000-0000-0000-0000-00000000000c','Non verificato','{idraulico}',41.871,12.461);
select pg_temp.come('00000000-0000-0000-0000-00000000000d');
update marketplace.app_artigiani set stato='verificato' where utente='00000000-0000-0000-0000-00000000000b';
select 'admin vede artigiani: '||count(*) from marketplace.app_artigiani;
-- 3 richiesta
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
\echo [atteso errore] privato crea richiesta da solo
insert into marketplace.app_richieste (problema, mestiere) values ('falsa','idraulico');
reset role; set role service_role;
insert into marketplace.app_richieste (id, privato, problema, mestiere, lat, lng) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000000a','Perdita sifone','idraulico',41.872,12.462);
select 'prenota: '||marketplace.app_prenota_analisi('00000000-0000-0000-0000-00000000000a', 1, 100, 'prova')||' poi '||marketplace.app_prenota_analisi('00000000-0000-0000-0000-00000000000a', 1, 100, 'prova');
reset role; set role authenticated;
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
\echo [atteso errore] privato prenota analisi
select marketplace.app_prenota_analisi('00000000-0000-0000-0000-00000000000a', 100, 100, 'x');
update marketplace.app_richieste set telefono='3471111111', problema='cambiato', urgenza='alta' where id='11111111-1111-1111-1111-111111111111';
update marketplace.app_richieste set telefono='3471111111', citta='Roma' where id='11111111-1111-1111-1111-111111111111';
insert into storage.objects (bucket_id, name) values ('supermastro','11111111-1111-1111-1111-111111111111/1.jpg');
select 'dopo modifica privato: '||problema||' '||urgenza||' tel '||telefono from marketplace.app_richieste;
\echo [atteso errore] privato cambia analisi
update marketplace.app_richieste set analisi='{"x":1}' where id='11111111-1111-1111-1111-111111111111';
select pg_temp.come('00000000-0000-0000-0000-00000000000e');
select 'estraneo vede richieste: '||count(*) from marketplace.app_richieste;
-- 4 vicini
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
select 'vicini: '||string_agg(nome_attivita||' '||round(km::numeric,2), ', ') from marketplace.app_artigiani_vicini(41.872,12.462,'idraulico');
select 'vicini elettricista: '||count(*) from marketplace.app_artigiani_vicini(41.872,12.462,'elettricista');
-- 5 invio
select 'inviati: '||marketplace.app_invia('11111111-1111-1111-1111-111111111111', array['00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000c']::uuid[]);
update marketplace.app_richieste set stato='accettata', artigiano='00000000-0000-0000-0000-00000000000a' where id='11111111-1111-1111-1111-111111111111';
select 'dopo trucco privato: '||stato||' artigiano='||coalesce(artigiano::text,'-') from marketplace.app_richieste;
-- 6 risposta
select pg_temp.come('00000000-0000-0000-0000-00000000000b');
select 'prima: tel="'||telefono||'" nome='||nome_privato from marketplace.app_richieste_ricevute();
select 'accetta → '||marketplace.app_rispondi('11111111-1111-1111-1111-111111111111', true);
select 'dopo: tel="'||telefono||'"' from marketplace.app_richieste_ricevute();
select 'artigiano legge richieste direttamente: '||count(*) from marketplace.app_richieste;
-- 7 estraneo
select pg_temp.come('00000000-0000-0000-0000-00000000000e');
\echo [atteso errore] estraneo risponde
select marketplace.app_rispondi('11111111-1111-1111-1111-111111111111', true);
\echo [atteso errore] estraneo recensisce
select marketplace.app_recensisci('11111111-1111-1111-1111-111111111111','{"qualita":5}','x');
-- 8 recensione
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
select 'recensione: '||(marketplace.app_recensisci('11111111-1111-1111-1111-111111111111','{"qualita":5,"puntualita":4,"pulizia":5,"prezzo":5,"comunicazione":4,"x":9}','Bravo') is not null);
\echo [atteso errore] seconda recensione
select marketplace.app_recensisci('11111111-1111-1111-1111-111111111111','{"qualita":1}','no');
select 'stato richiesta: '||stato from marketplace.app_richieste;
select 'vicini con voto: '||nome_attivita||' voto '||voto||' ('||recensioni||')' from marketplace.app_artigiani_vicini(41.872,12.462,'idraulico');
select pg_temp.come('00000000-0000-0000-0000-00000000000b');
select 'artigiano vede recensioni: '||count(*)||' voti '||max(voti::text) from marketplace.app_recensioni;
-- 9 foto
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
insert into storage.objects (bucket_id, name) values ('supermastro','11111111-1111-1111-1111-111111111111/1.jpg');
select pg_temp.come('00000000-0000-0000-0000-00000000000e');
\echo [atteso errore] estraneo carica foto
insert into storage.objects (bucket_id, name) values ('supermastro','11111111-1111-1111-1111-111111111111/2.jpg');
select 'estraneo vede foto: '||count(*) from storage.objects;
select pg_temp.come('00000000-0000-0000-0000-00000000000b');
select 'artigiano vede foto: '||count(*) from storage.objects;
-- 10 admin
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
\echo [atteso errore] privato numeri admin
select marketplace.app_numeri_admin();
select pg_temp.come('00000000-0000-0000-0000-00000000000d');
select 'numeri: '||marketplace.app_numeri_admin()::text;
-- 11 segnalazione e passaggio
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
insert into marketplace.app_segnalazioni (tipo, nome) values ('ristrutturazione','Paolo');
\echo [atteso errore] segnalazione già partita
insert into marketplace.app_segnalazioni (tipo, nome, stato) values ('azienda','Bar','partita');
select pg_temp.come('00000000-0000-0000-0000-00000000000b');
insert into marketplace.app_passaggi_impresa (nota) values ('ho tutto');
\echo [atteso nessuna riga cambiata] artigiano si approva
update marketplace.app_passaggi_impresa set stato='approvata';
select 'passaggio: '||stato from marketplace.app_passaggi_impresa;
-- anon
reset role; set role anon; select pg_temp.come('');
\echo [atteso errore] anonimo vicini
select * from marketplace.app_artigiani_vicini(41.8,12.4,'idraulico');
reset role; set role authenticated;
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
select 'privato vede invii: '||string_agg(nome_attivita||' '||telefono||' '||stato, ', ') from marketplace.app_invii_mia_richiesta('11111111-1111-1111-1111-111111111111');
select pg_temp.come('00000000-0000-0000-0000-00000000000e');
select 'estraneo vede invii: '||count(*) from marketplace.app_invii_mia_richiesta('11111111-1111-1111-1111-111111111111');

-- attacchi del revisore
reset role; set role authenticated;
select pg_temp.come('00000000-0000-0000-0000-00000000000b');
\echo [atteso errore] mestiere con codice
update marketplace.app_artigiani set mestieri='{"<img src=x>"}' where utente='00000000-0000-0000-0000-00000000000b';
select pg_temp.come('00000000-0000-0000-0000-00000000000a');
\echo [atteso nessun cambio] privato modifica richiesta fatta
update marketplace.app_richieste set telefono='999' where id='11111111-1111-1111-1111-111111111111';
select 'tel dopo fatta: '||telefono from marketplace.app_richieste;
\echo [atteso errore] foto con nome strano
insert into storage.objects (bucket_id, name) values ('supermastro','11111111-1111-1111-1111-111111111111/x.exe');
