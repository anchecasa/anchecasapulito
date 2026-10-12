-- app-22b · Ogni giorno alle 8 (ora italiana circa: 6:00 UTC) chiama preventivi-avvisa con {"evento":"giornaliero"} (12.10.2026, app-22).
-- Il lavoro di ogni giorno sta in preventivi-avvisa: il progetto ha raggiunto il limite di 100 funzioni.
-- Da eseguire dopo aver ripubblicato preventivi-avvisa (verify_jwt spento).
-- La funzione si può chiamare più volte: ogni mail parte una volta sola. Si può rilanciare.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'fornitori-promemoria';

select cron.schedule(
  'fornitori-promemoria',
  '0 6 * * *',
  $$ select net.http_post(
       url := 'https://edsvmnxojsmknjuhobqa.supabase.co/functions/v1/preventivi-avvisa',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{"evento": "giornaliero"}'::jsonb
     ); $$
);

-- Controllo (sola lettura):
-- select jobname, schedule, active from cron.job where jobname = 'fornitori-promemoria';
