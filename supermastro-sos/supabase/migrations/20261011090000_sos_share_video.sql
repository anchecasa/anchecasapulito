-- Fase 6 — video condiviso con un'attività trovata sulla mappa.
-- Lettura solo admin. Scritture dal service role.
-- Il file sta nel bucket privato sos-video per 12 mesi.

create table public.artisan_leads (
  id uuid primary key default gen_random_uuid(),
  fonte text not null check (fonte in ('osm', 'google')),
  fonte_id text not null,
  nome text not null,
  mestiere text not null,
  telefono text,
  indirizzo text not null default '',
  lat double precision not null,
  lng double precision not null,
  volte_trovato integer not null default 1 check (volte_trovato >= 1),
  ultima_richiesta_id uuid,
  stato text not null default 'mai' check (stato in ('mai', 'inviato', 'aperto', 'risposto', 'iscritto')),
  opt_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fonte, fonte_id)
);

create table public.sos_shared_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  diagnosis_id uuid references public.sos_video_diagnoses (id) on delete set null,
  lead_id uuid not null references public.artisan_leads (id) on delete cascade,
  video_path text,
  zona text not null default '',
  distanza text not null default '',
  guasto text not null default '',
  scade_il timestamptz not null,
  risposta text check (risposta in ('posso_venire', 'info', 'non_posso')),
  chiedi jsonb not null default '[]'::jsonb,
  otp_hash text,
  otp_phone text,
  otp_expires timestamptz,
  otp_attempts integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.artisan_leads
  add constraint artisan_leads_ultima_richiesta_fk
  foreign key (ultima_richiesta_id) references public.sos_shared_requests (id) on delete set null;

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.artisan_leads (id) on delete cascade,
  tipo text not null check (tipo in ('trovato', 'video_inviato', 'link_aperto', 'risposto', 'iscritto', 'opt_out')),
  request_id uuid references public.sos_shared_requests (id) on delete set null,
  created_at timestamptz not null default now()
);

create index artisan_leads_stato_idx on public.artisan_leads (stato);
create index lead_events_lead_id_idx on public.lead_events (lead_id, created_at desc);
create index sos_shared_requests_diagnosis_idx on public.sos_shared_requests (diagnosis_id);
create index sos_shared_requests_scade_idx on public.sos_shared_requests (scade_il);

create trigger artisan_leads_updated_at
  before update on public.artisan_leads
  for each row execute function public.set_updated_at();

alter table public.artisan_leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.sos_shared_requests enable row level security;

revoke all on table public.artisan_leads from anon, authenticated;
revoke all on table public.lead_events from anon, authenticated;
revoke all on table public.sos_shared_requests from anon, authenticated;
grant select on table public.artisan_leads to authenticated;
grant select on table public.lead_events to authenticated;
grant select on table public.sos_shared_requests to authenticated;

create policy artisan_leads_admin_select
  on public.artisan_leads for select to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy lead_events_admin_select
  on public.lead_events for select to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy sos_shared_requests_admin_select
  on public.sos_shared_requests for select to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sos-video',
  'sos-video',
  false,
  12582912,
  array['video/webm', 'video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
