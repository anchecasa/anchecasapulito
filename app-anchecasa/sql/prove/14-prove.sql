-- Prove iscrizione e pulsanti. Dopo 00-finto, app-01, app-02 e app-14-iscrizione-profili.
-- Si può rilanciare. Non eseguirla su Supabase.
\set ON_ERROR_STOP 0
alter table auth.users add column if not exists email_confirmed_at timestamptz;

create or replace function pg_temp.u(n int) returns uuid language sql as $$
  select ('00000000-0000-0000-0000-0000000002' || lpad(n::text, 2, '0'))::uuid
$$;
create or replace function pg_temp.come(n int) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', pg_temp.u(n)::text, false);
  perform set_config('request.jwt.claims', json_build_object('email', 'p' || n || '@prova.local')::text, false);
end $$;

insert into auth.users (id, email) values
  (pg_temp.u(30), 'privato30@prova.local'),
  (pg_temp.u(31), 'azienda31@prova.local'),
  (pg_temp.u(32), 'azienda32@prova.local'),
  (pg_temp.u(33), 'fornitore33@prova.local'),
  (pg_temp.u(34), 'estraneo34@prova.local'),
  (pg_temp.u(6), 'admin6@prova.local')
on conflict (id) do nothing;
insert into marketplace.admins (id) values (pg_temp.u(6)) on conflict do nothing;
update auth.users set email_confirmed_at = now() where id in (pg_temp.u(30), pg_temp.u(31), pg_temp.u(32), pg_temp.u(33), pg_temp.u(6));
update auth.users set email_confirmed_at = null where id = pg_temp.u(34);

set role authenticated;

select pg_temp.come(30);
select marketplace.app_profilo_apri('privato', 'Mario Prova', '', 'sito');
select 'P1 ristruttura '||aspetto||' chat '||(select aspetto from marketplace.app_stato_pulsanti() where id = 'chat')
  from marketplace.app_stato_pulsanti() where id = 'ristruttura';
select 'P2 pulsanti azienda nascosti '||count(*) from marketplace.app_stato_pulsanti() where id = 'ricevi-clienti' and aspetto = 'nascosto';

select pg_temp.come(31);
select marketplace.app_profilo_apri('azienda', 'Edil Prova Srl', '00000000000', 'sito');
select 'A1 ricevi clienti '||aspetto from marketplace.app_stato_pulsanti() where id = 'ricevi-clienti';

select pg_temp.come(32);
select marketplace.app_profilo_apri('azienda', 'Impresa Verificata', '00000000000', 'sito');
reset role;
select pg_temp.come(6);
update marketplace.app_org set stato_verifica = 'verificata' where titolare = pg_temp.u(32);
insert into marketplace.app_moduli (org, modulo, stato, attivo_dal)
select id, 'base', 'attivo', current_date from marketplace.app_org where titolare = pg_temp.u(32)
on conflict (org, modulo) do update set stato = 'attivo', attivo_dal = current_date;
set role authenticated;
select pg_temp.come(32);
select 'A2 sicurezza cantiere '||aspetto from marketplace.app_stato_pulsanti() where id = 'sicurezza-cantiere';

select pg_temp.come(33);
select marketplace.app_profilo_apri('fornitore', 'Forniture Rossi', '00000000000', 'link');
select 'F1 richieste '||(select aspetto from marketplace.app_stato_pulsanti() where id = 'richieste-ricevute')
  ||' zona '||aspetto from marketplace.app_stato_pulsanti() where id = 'tutte-richieste';

select pg_temp.come(34);
select 'E1 estraneo non legge il profilo altrui '||count(*) from marketplace.app_profili where utente = pg_temp.u(30);

-- Flash oltre la quota
reset role;
insert into marketplace.app_flash_usi (org, agente)
select org.id, pg_temp.u(32) from marketplace.app_org org
cross join generate_series(1, 10) where org.titolare = pg_temp.u(32);
set role authenticated;
select pg_temp.come(32);
\echo [atteso errore] Flash oltre la quota
select marketplace.app_flash_controlla((select id from marketplace.app_org where titolare = pg_temp.u(32)), pg_temp.u(32));

-- Offerta con mail non confermata. Se manca app-12, la prova crea la tabella minima e lo stesso controllo.
reset role;
do $$ begin
  if to_regclass('marketplace.app_sub_offerte') is null then
    create table marketplace.app_sub_offerte (
      id uuid primary key default gen_random_uuid(),
      richiesta uuid, invito uuid, importo numeric, ditta text
    );
    create trigger app_sub_offerte_mail before insert on marketplace.app_sub_offerte
      for each row execute function marketplace.app_blocca_senza_mail();
  end if;
  execute 'grant insert on marketplace.app_sub_offerte to authenticated';
end $$;
set role authenticated;
select pg_temp.come(34);
\echo [atteso errore] offerta con mail non confermata
insert into marketplace.app_sub_offerte (importo, ditta) values (100, 'Ditta senza mail');
