-- ============================================================================
-- APP ANCHECASA · PARTE 3 — richieste dai siti anchecasa.it e AncheSicura
-- Preparato il 09.10.2026. Si esegue DOPO app-01 e app-02. Si può rilanciare.
-- I moduli dei siti (iscrizione, contatti, sopralluogo, Opportunità, rete AncheSicura,
-- corsi) scrivono qui; l'admin le legge nell'app (Da fare → Richieste dai siti).
-- Chiunque può scrivere (anche senza account), nessuno legge tranne l'admin.
-- ============================================================================
create table if not exists marketplace.app_contatti (
  id uuid primary key default gen_random_uuid(),
  sito text not null check (sito in ('anchecasa', 'anchesicura')),
  tipo text not null check (tipo in ('iscrizione', 'contatto', 'sopralluogo', 'opportunita', 'rete_sicura', 'offerta_sicura', 'corso', 'albo', 'lavora', 'partner', 'agente')),
  nome text not null check (length(btrim(nome)) between 2 and 120),
  email text not null default '' check (length(email) <= 120),
  telefono text not null default '' check (length(telefono) <= 30),
  dati jsonb not null default '{}'::jsonb check (pg_column_size(dati) < 8000),
  stato text not null default 'nuovo' check (stato in ('nuovo', 'in_corso', 'fatto', 'scartato')),
  creato timestamptz not null default now()
);
create index if not exists app_contatti_idx on marketplace.app_contatti (stato, creato desc);
alter table marketplace.app_contatti enable row level security;

drop policy if exists app_contatti_scrivi on marketplace.app_contatti;
create policy app_contatti_scrivi on marketplace.app_contatti for insert to anon, authenticated
  with check (stato = 'nuovo' and (email <> '' or telefono <> ''));
drop policy if exists app_contatti_admin on marketplace.app_contatti;
create policy app_contatti_admin on marketplace.app_contatti for select using (marketplace.is_admin());
drop policy if exists app_contatti_admin_mod on marketplace.app_contatti;
create policy app_contatti_admin_mod on marketplace.app_contatti for update using (marketplace.is_admin()) with check (marketplace.is_admin());

-- Data decisa dal server e limite contro i messaggi a raffica (max 30 richieste al minuto in tutto).
create or replace function marketplace.app_contatti_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  new.creato := now();
  new.stato := 'nuovo';
  if (select count(*) from marketplace.app_contatti where creato > now() - interval '1 minute') >= 30 then
    raise exception 'troppe_richieste';
  end if;
  perform marketplace.app_notifica_admin('Nuova richiesta dal sito ' || new.sito || ': ' || left(new.nome, 60), 'ad-contatti');
  return new;
end;
$$;
drop trigger if exists app_contatti_controlli on marketplace.app_contatti;
create trigger app_contatti_controlli before insert on marketplace.app_contatti for each row execute function marketplace.app_contatti_controlli();

revoke all on marketplace.app_contatti from anon, authenticated;
grant insert (sito, tipo, nome, email, telefono, dati) on marketplace.app_contatti to anon, authenticated;
grant select on marketplace.app_contatti to authenticated;
grant update (stato) on marketplace.app_contatti to authenticated;

notify pgrst, 'reload schema';
