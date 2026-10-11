-- Limiti di frequenza per gli endpoint pubblici SuperMastro (video, voti, SMS).
-- Le chiavi sono hash (niente IP o telefoni in chiaro).
-- RLS attiva e nessuna policy: solo il service role, tramite la funzione.

create table public.sos_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0 check (hits >= 0)
);

create index sos_rate_limits_window_idx on public.sos_rate_limits (window_start);

alter table public.sos_rate_limits enable row level security;

revoke all on table public.sos_rate_limits from public, anon, authenticated;

-- true = richiesta permessa, false = limite superato. Atomica: un solo statement.
create or replace function public.sos_rate_hit(p_key text, p_window_seconds int, p_max int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 200
     or p_window_seconds is null or p_window_seconds <= 0
     or p_max is null or p_max <= 0 then
    return false;
  end if;

  insert into public.sos_rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
          when r.window_start <= now() - make_interval(secs => p_window_seconds) then 1
          else r.hits + 1
        end,
        window_start = case
          when r.window_start <= now() - make_interval(secs => p_window_seconds) then now()
          else r.window_start
        end
  returning hits into v_hits;

  return v_hits <= p_max;
end;
$$;

revoke all on function public.sos_rate_hit(text, int, int) from public;
revoke all on function public.sos_rate_hit(text, int, int) from anon, authenticated;
grant execute on function public.sos_rate_hit(text, int, int) to service_role;
