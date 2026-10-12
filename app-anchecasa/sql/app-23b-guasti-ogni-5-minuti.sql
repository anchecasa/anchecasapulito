-- app-23b · Ogni 5 minuti il giro dei guasti (12.10.2026, app-23): chi non ha risposto in tempo passa al prossimo artigiano,
-- i lavori fatti da 7 giorni si confermano da soli, partono le mail. Lo fa preventivi-avvisa con {"evento":"guasti"}.
-- Da eseguire dopo aver ripubblicato preventivi-avvisa. Si può rilanciare.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'guasti-giro';

select cron.schedule(
  'guasti-giro',
  '*/5 * * * *',
  $$ select net.http_post(
       url := 'https://edsvmnxojsmknjuhobqa.supabase.co/functions/v1/preventivi-avvisa',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{"evento": "guasti"}'::jsonb
     ); $$
);

-- Controllo (sola lettura):
-- select jobname, schedule, active from cron.job where jobname = 'guasti-giro';
