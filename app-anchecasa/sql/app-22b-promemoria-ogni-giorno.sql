-- app-22b · Ogni giorno alle 8 (ora italiana circa: 6:00 UTC) chiama la funzione fornitori-promemoria (12.10.2026, app-22).
-- Da eseguire dopo aver pubblicato la funzione fornitori-promemoria (verify_jwt spento).
-- La funzione si può chiamare più volte: ogni mail parte una volta sola. Si può rilanciare.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'fornitori-promemoria';

select cron.schedule(
  'fornitori-promemoria',
  '0 6 * * *',
  $$ select net.http_post(
       url := 'https://edsvmnxojsmknjuhobqa.supabase.co/functions/v1/fornitori-promemoria',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);

-- Controllo (sola lettura):
-- select jobname, schedule, active from cron.job where jobname = 'fornitori-promemoria';
