-- app-18 · La Rete nell'area privata (12.10.2026, decisioni di Nando, PROGETTO-DASHBOARD.md)
--
-- Cosa fa, in breve:
--   1. Gli inviti dell'admin (inviti_admin) ricordano nome, ruolo di rete, zona e, per il sub-agente, il suo agente.
--   2. Quando un invitato della rete si iscrive, entra da solo in app_rete con il suo ruolo, la sua zona
--      e il suo responsabile, scelto dalla zona (decisione di Nando).
--   3. Tre tabelle nuove: note sulle persone della rete, riconoscimento del mese, obiettivi pubblicati.
--
-- Solo aggiunte: nessuna colonna cancellata, nessun dato tolto. Si può rilanciare (if not exists, or replace).
-- Le tabelle della rete che ci sono già (app_rete, app_vendite, app_provvigioni, app_obiettivi, app_inviti)
-- non cambiano.

begin;

-- ---------------------------------------------------------------------------
-- 1. INVITI DELL'ADMIN: nome, ruolo di rete, zona, agente del sub-agente
-- ---------------------------------------------------------------------------
alter table marketplace.inviti_admin add column if not exists nome text not null default '';
alter table marketplace.inviti_admin add column if not exists ruolo_rete text;
alter table marketplace.inviti_admin add column if not exists area text not null default '';
alter table marketplace.inviti_admin add column if not exists regione text not null default '';
alter table marketplace.inviti_admin add column if not exists superiore uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inviti_admin_ruolo_rete_check') then
    alter table marketplace.inviti_admin add constraint inviti_admin_ruolo_rete_check
      check (ruolo_rete is null or ruolo_rete in ('reteitalia', 'sviluppo', 'capoarea', 'agente', 'subagente'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inviti_admin_nome_len') then
    alter table marketplace.inviti_admin add constraint inviti_admin_nome_len check (length(nome) <= 120);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. LA ZONA DECIDE CHI STA SOPRA
-- ---------------------------------------------------------------------------
-- Area di una regione (Nord, Centro, Sud e isole).
create or replace function marketplace.app_area_di(p_regione text)
returns text language sql immutable as $$
  select case
    when p_regione in ('Piemonte', 'Valle d''Aosta', 'Lombardia', 'Trentino-Alto Adige', 'Veneto', 'Friuli-Venezia Giulia', 'Liguria', 'Emilia-Romagna') then 'Nord'
    when p_regione in ('Toscana', 'Umbria', 'Marche', 'Lazio') then 'Centro'
    when p_regione in ('Abruzzo', 'Molise', 'Campania', 'Puglia', 'Basilicata', 'Calabria', 'Sicilia', 'Sardegna') then 'Sud e isole'
    else ''
  end;
$$;

-- Il responsabile di chi entra, dalla zona:
--   sviluppo rete → Responsabile Rete Italia
--   capo area     → sviluppo rete della sua area (se manca: Rete Italia)
--   agente        → capo area della sua regione (se manca: sviluppo rete dell'area; se manca: Rete Italia)
--   sub-agente    → l'agente scelto nell'invito (se manca: come l'agente)
-- Con due capi area nella stessa regione si prende il primo entrato; l'admin può cambiarlo.
create or replace function marketplace.app_superiore_per_zona(p_ruolo text, p_area text, p_regione text)
returns uuid language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_area text := coalesce(nullif(p_area, ''), marketplace.app_area_di(p_regione));
  v uuid;
  ri uuid;
begin
  select utente into ri from marketplace.app_rete where ruolo = 'reteitalia' and stato = 'attivo' order by creato limit 1;
  if p_ruolo = 'reteitalia' then return null; end if;
  if p_ruolo = 'sviluppo' then return ri; end if;
  if p_ruolo in ('agente', 'subagente') and coalesce(p_regione, '') <> '' then
    select utente into v from marketplace.app_rete where ruolo = 'capoarea' and stato = 'attivo' and regione = p_regione order by creato limit 1;
    if v is not null then return v; end if;
  end if;
  if v_area <> '' then
    select utente into v from marketplace.app_rete where ruolo = 'sviluppo' and stato = 'attivo' and area = v_area order by creato limit 1;
    if v is not null then return v; end if;
  end if;
  return ri;
end;
$$;
revoke all on function marketplace.app_superiore_per_zona(text, text, text) from public, anon;
grant execute on function marketplace.app_superiore_per_zona(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. ISCRIZIONE: chi arriva con un invito di rete entra in app_rete
--    (stessa funzione del 11.10.2026, migrazione 20261011172000; aggiunto solo il blocco «rete»)
-- ---------------------------------------------------------------------------
create or replace function marketplace.handle_new_user_marketplace()
returns trigger
language plpgsql
security definer
set search_path to 'marketplace', 'public'
as $function$
declare
  v_famiglia marketplace.famiglia;
  v_token text;
  v_inv marketplace.inviti_admin%rowtype;
  v_trovato boolean := false;
  v_verifica marketplace.stato_verifica := 'attesa';
  v_da uuid;
  v_nome text;
  v_tipo text;
  v_area text;
begin
  if new.raw_user_meta_data ? 'famiglia' then
    v_famiglia := (new.raw_user_meta_data->>'famiglia')::marketplace.famiglia;
    v_token := nullif(new.raw_user_meta_data->>'invito', '');

    if v_token is not null then
      select * into v_inv
      from marketplace.inviti_admin
      where token = v_token and stato in ('inviato', 'aperto')
      limit 1;
      if found
         and v_inv.famiglia = v_famiglia
         and (v_inv.mail is null or lower(trim(v_inv.mail)) = lower(trim(new.email))) then
        v_trovato := true;
        v_da := v_inv.creato_da;
        v_verifica := 'verificato';
        if v_famiglia = 'azienda' then
          v_tipo := coalesce(
            nullif(trim(coalesce(v_inv.categoria_id, '')), ''),
            marketplace.codice_categoria(v_inv.categoria)
          );
        end if;
        update marketplace.inviti_admin
        set stato = 'iscritto', iscritto_at = now(), iscritto_id = new.id
        where id = v_inv.id;
      end if;
    end if;

    if v_verifica = 'attesa' and v_famiglia in ('privato', 'azienda') then
      v_verifica := 'verificato';
    end if;

    v_nome := trim(
      coalesce(new.raw_user_meta_data->>'nome', '') || ' ' ||
      coalesce(new.raw_user_meta_data->>'cognome', '')
    );
    if v_nome = '' and v_trovato then
      v_nome := trim(coalesce(v_inv.nome, ''));
    end if;
    if v_nome = '' then
      v_nome := split_part(new.email, '@', 1);
    end if;

    insert into marketplace.profiles (id, famiglia, nome, zona, verifica, invitato_da, tipo_azienda)
    values (
      new.id,
      v_famiglia,
      v_nome,
      coalesce(nullif(trim(new.raw_user_meta_data->>'zona'), ''), nullif(v_inv.regione, ''), nullif(v_inv.area, ''), ''),
      v_verifica,
      v_da,
      v_tipo
    );

    -- 12.10.2026: invito di rete → entra nella rete con ruolo, zona e responsabile.
    if v_trovato and v_famiglia = 'agente' and v_inv.ruolo_rete is not null then
      v_area := coalesce(nullif(v_inv.area, ''), marketplace.app_area_di(v_inv.regione));
      insert into marketplace.app_rete (utente, ruolo, superiore, nome, area, regione)
      values (
        new.id,
        v_inv.ruolo_rete,
        coalesce(v_inv.superiore, marketplace.app_superiore_per_zona(v_inv.ruolo_rete, v_area, v_inv.regione)),
        left(v_nome, 80),
        case when v_area in ('Nord', 'Centro', 'Sud e isole') then v_area else '' end,
        left(coalesce(v_inv.regione, ''), 40)
      )
      on conflict (utente) do nothing;
    end if;
  end if;
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 4. NOTE SULLE PERSONE DELLA RETE («Richiamato il 12.10, riparte lunedì»)
--    Le vedono l'admin, Rete Italia e i responsabili sopra la persona. La persona no.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_rete_note (
  id uuid primary key default gen_random_uuid(),
  persona uuid not null references auth.users(id) on delete cascade,
  testo text not null check (length(btrim(testo)) between 1 and 500),
  autore uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creato timestamptz not null default now()
);
create index if not exists app_rete_note_persona on marketplace.app_rete_note (persona, creato desc);
alter table marketplace.app_rete_note enable row level security;
drop policy if exists app_rete_note_leggi on marketplace.app_rete_note;
create policy app_rete_note_leggi on marketplace.app_rete_note for select using (
  persona <> auth.uid() and marketplace.app_nella_mia_rete(persona)
);
drop policy if exists app_rete_note_scrivi on marketplace.app_rete_note;
create policy app_rete_note_scrivi on marketplace.app_rete_note for insert with check (
  autore = auth.uid() and persona <> auth.uid() and marketplace.app_nella_mia_rete(persona)
);
grant select, insert on marketplace.app_rete_note to authenticated;

-- ---------------------------------------------------------------------------
-- 5. RICONOSCIMENTO DEL MESE («Migliore di ottobre»): lo vede tutta la rete
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_riconoscimenti (
  id uuid primary key default gen_random_uuid(),
  mese date not null check (extract(day from mese) = 1),
  utente uuid not null references auth.users(id) on delete cascade,
  titolo text not null default 'Migliore del mese' check (length(titolo) <= 80),
  creato_da uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creato timestamptz not null default now(),
  unique (mese, utente)
);
alter table marketplace.app_riconoscimenti enable row level security;
drop policy if exists app_riconoscimenti_leggi on marketplace.app_riconoscimenti;
create policy app_riconoscimenti_leggi on marketplace.app_riconoscimenti for select using (
  marketplace.is_admin() or exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo')
);
drop policy if exists app_riconoscimenti_scrivi on marketplace.app_riconoscimenti;
create policy app_riconoscimenti_scrivi on marketplace.app_riconoscimenti for all
  using (marketplace.is_admin() or marketplace.app_sono_rete_italia())
  with check (marketplace.is_admin() or marketplace.app_sono_rete_italia());
grant select, insert, delete on marketplace.app_riconoscimenti to authenticated;

-- ---------------------------------------------------------------------------
-- 6. OBIETTIVI PUBBLICATI (per zona o per persona). Li decidono admin e Rete Italia;
--    in bozza li vedono solo loro, pubblicati li vede la rete.
--    (app_obiettivi dell'app resta com'è.)
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_rete_obiettivi (
  id uuid primary key default gen_random_uuid(),
  mese date not null check (extract(day from mese) = 1),
  per text not null check (per in ('zona', 'persona')),
  utente uuid references auth.users(id) on delete cascade,
  zona text not null default '' check (length(zona) <= 40),
  cosa text not null check (cosa in ('aziende', 'clienti_attivi', 'canoni', 'lavori')),
  quanti numeric(12,2) not null check (quanti > 0),
  pubblicato boolean not null default false,
  creato_da uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creato timestamptz not null default now(),
  check ((per = 'persona' and utente is not null) or (per = 'zona' and zona <> ''))
);
alter table marketplace.app_rete_obiettivi enable row level security;
drop policy if exists app_rete_obiettivi_leggi on marketplace.app_rete_obiettivi;
create policy app_rete_obiettivi_leggi on marketplace.app_rete_obiettivi for select using (
  marketplace.is_admin() or marketplace.app_sono_rete_italia()
  or (pubblicato and exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo'))
);
drop policy if exists app_rete_obiettivi_scrivi on marketplace.app_rete_obiettivi;
create policy app_rete_obiettivi_scrivi on marketplace.app_rete_obiettivi for all
  using (marketplace.is_admin() or marketplace.app_sono_rete_italia())
  with check (marketplace.is_admin() or marketplace.app_sono_rete_italia());
grant select, insert, update, delete on marketplace.app_rete_obiettivi to authenticated;

commit;

-- Controllo, da lanciare dopo (sola lettura):
-- select column_name from information_schema.columns where table_schema = 'marketplace' and table_name = 'inviti_admin' order by 1;
-- select to_regclass('marketplace.app_rete_note'), to_regclass('marketplace.app_riconoscimenti'), to_regclass('marketplace.app_rete_obiettivi');
