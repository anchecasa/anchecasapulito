-- Artigiani iscritti e attivi, vicini al guasto, per la mappa SuperMastro.
-- Eseguibile solo dal service role: workers e posizioni non sono pubblici.

create or replace function public.sos_network_artisans(
  p_skill text,
  p_lat double precision,
  p_lng double precision
)
returns table (
  id uuid,
  display_name text,
  lat double precision,
  lng double precision,
  distance_km numeric
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    w.id,
    coalesce(nullif(btrim(p.display_name), ''), 'Artigiano della rete') as display_name,
    extensions.st_y(wl.location::extensions.geometry) as lat,
    extensions.st_x(wl.location::extensions.geometry) as lng,
    round(
      (
        extensions.st_distance(
          wl.location,
          extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
        ) / 1000.0
      )::numeric,
      1
    ) as distance_km
  from public.workers w
  inner join public.worker_locations wl on wl.worker_id = w.id
  inner join public.worker_skills ws on ws.worker_id = w.id
  inner join public.skills s on s.id = ws.skill_id
  inner join public.profiles p on p.id = w.user_id
  where w.status = 'active'
    and (
      lower(s.slug) = lower(btrim(p_skill))
      or lower(s.label) = lower(btrim(p_skill))
      or lower(btrim(split_part(s.label, '/', 1))) = lower(btrim(p_skill))
    )
    and extensions.st_dwithin(
      wl.location,
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
      w.service_radius_km * 1000
    )
  order by distance_km asc
  limit 8;
$$;

revoke all on function public.sos_network_artisans(text, double precision, double precision) from public;
revoke all on function public.sos_network_artisans(text, double precision, double precision) from anon, authenticated;
grant execute on function public.sos_network_artisans(text, double precision, double precision) to service_role;
