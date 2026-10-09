-- Solo per le prove in locale: imita le parti di Supabase che servono. NON eseguire su Supabase.
do $$ begin if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if; end $$;
do $$ begin if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; end if; end $$;
create schema auth; create schema storage; create schema marketplace;
grant usage on schema auth, storage, marketplace to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id bigserial primary key, bucket_id text, name text);
alter table storage.objects enable row level security;
grant select, insert on storage.objects to authenticated; grant usage on sequence storage.objects_id_seq to authenticated;
create table marketplace.profiles (id uuid primary key references auth.users(id), nome text not null default '');
create table marketplace.admins (user_id uuid primary key);
create function marketplace.is_admin() returns boolean language sql stable security definer as $$ select exists(select 1 from marketplace.admins where user_id = auth.uid()) $$;
grant execute on function marketplace.is_admin() to anon, authenticated;
