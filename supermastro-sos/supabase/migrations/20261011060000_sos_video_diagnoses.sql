-- Fase 3 — diagnosi video. Il file video non si salva.

create table public.sos_video_diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id uuid not null,
  esito text not null check (
    esito in ('fai_da_te', 'professionista', 'pericolo', 'da_verificare', 'fuori_tema')
  ),
  skill_slug text not null,
  titolo text not null,
  payload jsonb not null,
  model text not null,
  confidence double precision not null,
  created_at timestamptz not null default now()
);

create index sos_video_diagnoses_user_id_idx
  on public.sos_video_diagnoses (user_id);

alter table public.sos_video_diagnoses enable row level security;

revoke all on table public.sos_video_diagnoses from anon, authenticated;
grant select on table public.sos_video_diagnoses to authenticated;

create policy sos_video_diagnoses_select_own
  on public.sos_video_diagnoses
  for select
  to authenticated
  using (user_id = auth.uid());
