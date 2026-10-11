-- Fase 4 — pollice sulla diagnosi. Solo chi ha fatto la diagnosi inserisce.
-- Solo l'admin legge e aggiorna.

create table public.sos_diagnosis_feedback (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references public.sos_video_diagnoses (id) on delete cascade,
  vote text not null check (vote in ('up', 'down')),
  correzione text not null default '',
  stato text not null default 'in_attesa' check (stato in ('in_attesa', 'approvata', 'scartata')),
  revisionata_da uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index sos_diagnosis_feedback_approved_idx
  on public.sos_diagnosis_feedback (created_at desc)
  where stato = 'approvata';

alter table public.sos_diagnosis_feedback enable row level security;

revoke all on table public.sos_diagnosis_feedback from anon, authenticated;
grant insert on table public.sos_diagnosis_feedback to authenticated;
grant select, update on table public.sos_diagnosis_feedback to authenticated;

create policy sos_diagnosis_feedback_insert_owner
  on public.sos_diagnosis_feedback
  for insert
  to authenticated
  with check (
    stato = 'in_attesa'
    and revisionata_da is null
    and exists (
      select 1
      from public.sos_video_diagnoses d
      where d.id = diagnosis_id
        and d.user_id = auth.uid()
    )
  );

create policy sos_diagnosis_feedback_admin_select
  on public.sos_diagnosis_feedback
  for select
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy sos_diagnosis_feedback_admin_update
  on public.sos_diagnosis_feedback
  for update
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));
