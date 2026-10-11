-- =============================================================================
-- AncheCasa app · parte 7: REGOLE DEI CLIENTI e DOCUMENTI DA FIRMARE (10.10.2026)
-- Da eseguire DOPO app-06. Si può rieseguire senza danni.
--
-- Regole decise da Nando (Allegato C dei contratti, versione 10.10.2026):
--  - Il cliente è di chi lo registra per primo. Aziende: partita IVA (vale finché il cliente è attivo,
--    e per 90 giorni dalla registrazione). Privati: telefono o mail, per 12 mesi che ripartono a ogni registrazione.
--  - Clienti di AncheCasa affidati (portati dall'admin o arrivati dal sito senza codice): all'affidatario
--    metà della quota «chi porta»; niente quote di sviluppo, capo area e Rete Italia.
--  - Sub-agente: anche sui lavori le sue quote si dividono 70% a lui e 30% al suo agente (contratto, art. 4.7).
--  - Cartella documenti: contratti, regolamento e circolari; si firmano sul telefono e la firma arriva all'admin.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Clienti: partita IVA, affidamento, blocco dei clienti già registrati
-- ---------------------------------------------------------------------------
alter table marketplace.app_vendite add column if not exists cliente_piva text not null default '';
alter table marketplace.app_vendite add column if not exists affidato boolean not null default false;
alter table marketplace.app_affari add column if not exists cliente_piva text not null default '';

create or replace function marketplace.app_solo_cifre(p text)
returns text language sql immutable as $$ select regexp_replace(coalesce(p, ''), '\D', '', 'g') $$;
create or replace function marketplace.app_norm_contatto(p text)
returns text language sql immutable as $$
  select case when position('@' in coalesce(p, '')) > 0 then lower(btrim(p))
              when length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) >= 6 then right(regexp_replace(p, '\D', '', 'g'), 10)
              else '' end
$$;

-- di chi è il cliente? restituisce l'utente che lo ha già (null se è libero o è già di chi chiede)
create or replace function marketplace.app_cliente_di_altri(p_utente uuid, p_tipo text, p_piva text, p_contatto text)
returns uuid language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_piva text := marketplace.app_solo_cifre(p_piva);
  v_cont text := marketplace.app_norm_contatto(p_contatto);
  v uuid;
begin
  if length(v_piva) >= 11 then
    select x.chi into v from (
      select venditore as chi, creato from marketplace.app_vendite
       where marketplace.app_solo_cifre(cliente_piva) = v_piva and venditore <> p_utente
         and (stato = 'attiva' or (stato = 'proposta' and creato > now() - interval '90 days'))
      union all
      select segnalato_da, creato from marketplace.app_affari
       where marketplace.app_solo_cifre(cliente_piva) = v_piva and segnalato_da <> p_utente
         and (stato in ('firmato', 'chiuso') or (stato = 'proposta' and creato > now() - interval '90 days'))
    ) x order by x.creato limit 1;
    return v;
  end if;
  if p_tipo in ('privato', 'condominio') and v_cont <> '' then
    -- vale l'ultima registrazione degli ultimi 12 mesi: se è di un altro, il privato è suo
    select x.chi into v from (
      select venditore as chi, creato from marketplace.app_vendite
       where marketplace.app_norm_contatto(cliente_contatto) = v_cont and stato <> 'persa' and creato > now() - interval '12 months'
      union all
      select segnalato_da, creato from marketplace.app_affari
       where marketplace.app_norm_contatto(cliente_contatto) = v_cont and stato <> 'perso' and creato > now() - interval '12 months'
    ) x order by x.creato desc limit 1;
    if v = p_utente then return null; end if;
    return v;
  end if;
  return null;
end;
$$;
revoke all on function marketplace.app_cliente_di_altri(uuid, text, text, text) from public, anon, authenticated;

-- controllo prima di registrare una vendita o un lavoro
create or replace function marketplace.app_controlla_cliente()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_chi uuid;
  v_utente uuid;
begin
  if tg_table_name = 'app_vendite' then
    v_utente := new.venditore;
    if new.affidato and not marketplace.is_admin() then raise exception 'solo_admin_affida'; end if;
  else
    v_utente := new.segnalato_da;
  end if;
  if marketplace.is_admin() then return new; end if;
  v_chi := marketplace.app_cliente_di_altri(v_utente, new.cliente_tipo, new.cliente_piva, new.cliente_contatto);
  if v_chi is not null then raise exception 'cliente_di_un_collega'; end if;
  return new;
end;
$$;
drop trigger if exists app_vendite_controlla on marketplace.app_vendite;
create trigger app_vendite_controlla before insert on marketplace.app_vendite for each row execute function marketplace.app_controlla_cliente();
drop trigger if exists app_affari_controlla on marketplace.app_affari;
create trigger app_affari_controlla before insert on marketplace.app_affari for each row execute function marketplace.app_controlla_cliente();

-- per il modulo: il cliente è libero? (risponde solo sì/no, non dice di chi è)
create or replace function marketplace.app_cliente_libero(p_tipo text, p_piva text, p_contatto text)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.app_cliente_di_altri(auth.uid(), p_tipo, p_piva, p_contatto) is null;
$$;
revoke all on function marketplace.app_cliente_libero(text, text, text) from public, anon;
grant execute on function marketplace.app_cliente_libero(text, text, text) to authenticated;

-- l'admin affida un cliente di AncheCasa a una persona della rete (e può riassegnarlo se non è ancora confermato)
drop policy if exists app_vendite_admin_crea on marketplace.app_vendite;
create policy app_vendite_admin_crea on marketplace.app_vendite for insert with check (marketplace.is_admin());
drop policy if exists app_affari_admin_crea on marketplace.app_affari;
create policy app_affari_admin_crea on marketplace.app_affari for insert with check (marketplace.is_admin());

create or replace function marketplace.app_avvisa_affidato()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if new.affidato and (tg_op = 'INSERT' or old.venditore is distinct from new.venditore) then
    perform marketplace.app_notifica(new.venditore, 'Ti è stato affidato un cliente di AncheCasa: chiama ' || new.cliente_nome || ' entro 48 ore', 're-vendita/' || new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists app_vendite_affidato on marketplace.app_vendite;
create trigger app_vendite_affidato after insert or update of venditore on marketplace.app_vendite for each row execute function marketplace.app_avvisa_affidato();

-- provvigioni delle vendite: privati niente; clienti affidati metà quota «chi porta» e nient'altro
create or replace function marketplace.app_vendita_provvigioni()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare
  p jsonb;
  monte numeric;
  porta numeric;
  v_ruolo text;
  v_sup uuid;
  v_cur uuid;
  v_r text;
  v_ri uuid;
  pagati text[] := array[]::text[];
  v_quota numeric;
begin
  if old.stato = 'attiva' and current_user in ('authenticated', 'anon') then
    raise exception 'vendita_gia_confermata';
  end if;
  if not (new.stato = 'attiva' and old.stato is distinct from 'attiva') then return new; end if;
  new.attivata := now();
  if new.cliente_tipo = 'privato' then return new; end if;
  select valore into p from marketplace.app_impostazioni where chiave = 'provvigioni';
  monte := round(new.importo * coalesce((p->>'percentuale_vendita')::numeric, 0) / 100, 2);
  if monte <= 0 then return new; end if;
  porta := monte * coalesce((p->>'chi_porta')::numeric, 70) / 100;
  select ruolo, superiore into v_ruolo, v_sup from marketplace.app_rete where utente = new.venditore;
  -- cliente di AncheCasa affidato: metà della quota di chi porta, a chi lo segue, e basta (Allegato C.5)
  if new.affidato then
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, new.venditore, 'affidato', round(porta / 2, 2));
    return new;
  end if;
  if v_ruolo = 'subagente' and v_sup is not null then
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values
      (new.id, new.venditore, 'subagente', round(porta * coalesce((p->>'subagente')::numeric, 70) / 100, 2)),
      (new.id, v_sup, 'agente', round(porta * coalesce((p->>'agente')::numeric, 30) / 100, 2));
  else
    insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, new.venditore, coalesce(v_ruolo, 'venditore'), round(porta, 2));
  end if;
  v_cur := new.venditore;
  for i in 1..7 loop
    exit when v_cur is null;
    select ruolo, superiore into v_r, v_sup from marketplace.app_rete where utente = v_cur and stato = 'attivo';
    if v_r in ('capoarea', 'sviluppo', 'reteitalia') and not (v_r = any (pagati)) then
      v_quota := round(monte * coalesce((p->>v_r)::numeric, 0) / 100, 2);
      if v_quota > 0 then insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, v_cur, v_r, v_quota); end if;
      pagati := pagati || v_r;
    end if;
    v_cur := v_sup;
  end loop;
  if not ('reteitalia' = any (pagati)) then
    select utente into v_ri from marketplace.app_rete where ruolo = 'reteitalia' and stato = 'attivo' order by creato limit 1;
    v_quota := round(monte * coalesce((p->>'reteitalia')::numeric, 0) / 100, 2);
    if v_ri is not null and v_quota > 0 then insert into marketplace.app_provvigioni (vendita, beneficiario, ruolo, importo) values (new.id, v_ri, 'reteitalia', v_quota); end if;
  end if;
  return new;
end;
$$;

-- lavori: le quote di ruolo del sub-agente si dividono 70/30 con il suo agente (contratto sub-agente, art. 4.7)
create or replace function marketplace.app_tranche_incassata(p_affare uuid, p_n int, p_incasso numeric)
returns numeric language plpgsql security definer set search_path = marketplace, public as $$
declare
  a marketplace.app_affari;
  tr marketplace.app_affari_tranche;
  p jsonb;
  pv jsonb;
  v_margine numeric;
  v_frazione numeric;
  monte numeric;
  v_cur uuid; v_r text; v_sup uuid; v_ri uuid; v_quota numeric;
  pagati text[] := array[]::text[];
  x record;
  v_ruolo_b text; v_sup_b uuid;
begin
  if not marketplace.is_admin() then raise exception 'non_autorizzato'; end if;
  select * into a from marketplace.app_affari where id = p_affare for update;
  if a.id is null or a.stato <> 'firmato' then raise exception 'lavoro_non_firmato'; end if;
  select * into tr from marketplace.app_affari_tranche where affare = p_affare and n = p_n for update;
  if tr.affare is null or tr.stato <> 'attesa' then raise exception 'tranche_gia_incassata'; end if;
  if coalesce(p_incasso, -1) < 0 then raise exception 'importo_non_valido'; end if;
  select margine into v_margine from marketplace.app_affari_margine where affare = p_affare;
  select valore into p from marketplace.app_impostazioni where chiave = 'cantieri';
  select valore into pv from marketplace.app_impostazioni where chiave = 'provvigioni';
  v_frazione := case when a.valore * tr.quota / 100 > 0 then least(1, p_incasso / (a.valore * tr.quota / 100)) else 1 end;
  monte := round(coalesce(v_margine, 0) * coalesce((p->>'rete')::numeric, 40) / 100 * tr.quota / 100 * v_frazione, 2);

  update marketplace.app_affari_tranche set incassato = p_incasso, incassato_il = now(), stato = 'incassata' where affare = p_affare and n = p_n;
  if p_n = 3 then update marketplace.app_affari set stato = 'chiuso', chiuso = now() where id = p_affare; end if;
  if monte <= 0 then return 0; end if;

  for x in select * from (values (a.segnalato_da, 'segnala'), (a.chiude, 'chiude'), (a.segue, 'segue'), (a.impresa_da, 'impresa')) as t(b, r)
           where t.b is not null and coalesce((p->>t.r)::numeric, 0) > 0 loop
    v_quota := monte * coalesce((p->>x.r)::numeric, 0) / 100;
    select ruolo, superiore into v_ruolo_b, v_sup_b from marketplace.app_rete where utente = x.b;
    if v_ruolo_b = 'subagente' and v_sup_b is not null then
      insert into marketplace.app_provvigioni (affare, tranche, beneficiario, ruolo, importo) values
        (p_affare, p_n, x.b, x.r, round(v_quota * coalesce((pv->>'subagente')::numeric, 70) / 100, 2)),
        (p_affare, p_n, v_sup_b, x.r || '_agente', round(v_quota * coalesce((pv->>'agente')::numeric, 30) / 100, 2));
    else
      insert into marketplace.app_provvigioni (affare, tranche, beneficiario, ruolo, importo) values (p_affare, p_n, x.b, x.r, round(v_quota, 2));
    end if;
  end loop;
  v_cur := a.segnalato_da;
  for i in 1..7 loop
    exit when v_cur is null;
    select ruolo, superiore into v_r, v_sup from marketplace.app_rete where utente = v_cur and stato = 'attivo';
    if v_r in ('capoarea', 'sviluppo', 'reteitalia') and not (v_r = any (pagati)) then
      v_quota := round(monte * coalesce((p->>v_r)::numeric, 0) / 100, 2);
      if v_quota > 0 then insert into marketplace.app_provvigioni (affare, tranche, beneficiario, ruolo, importo) values (p_affare, p_n, v_cur, v_r, v_quota); end if;
      pagati := pagati || v_r;
    end if;
    v_cur := v_sup;
  end loop;
  if not ('reteitalia' = any (pagati)) then
    select utente into v_ri from marketplace.app_rete where ruolo = 'reteitalia' and stato = 'attivo' order by creato limit 1;
    v_quota := round(monte * coalesce((p->>'reteitalia')::numeric, 0) / 100, 2);
    if v_ri is not null and v_quota > 0 then insert into marketplace.app_provvigioni (affare, tranche, beneficiario, ruolo, importo) values (p_affare, p_n, v_ri, 'reteitalia', v_quota); end if;
  end if;
  insert into marketplace.app_notifiche (utente, testo, link)
    select distinct beneficiario, left('Incassata la tranche ' || p_n || ' di ' || a.cliente_nome || ': provvigioni maturate', 200), 're-guadagni'
    from marketplace.app_provvigioni where affare = p_affare and tranche = p_n;
  return monte;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Documenti: contratti, regolamento, circolari. Firma sul telefono, la firma arriva all'admin.
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_documenti (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'circolare' check (tipo in ('contratto', 'regolamento', 'circolare', 'altro')),
  titolo text not null check (length(btrim(titolo)) between 3 and 160),
  testo text not null default '' check (length(testo) <= 20000),
  file text not null default '' check (length(file) <= 200),          -- PDF pubblicato con l'app (es. docs/....pdf)
  ruoli text[] not null default '{}',                                -- vuoto = tutta la rete
  richiede_firma boolean not null default true,
  versione text not null default '' check (length(versione) <= 40),
  attivo boolean not null default true,
  creato_da uuid references auth.users(id) on delete set null default auth.uid(),
  pubblicato timestamptz not null default now()
);
alter table marketplace.app_documenti enable row level security;
create or replace function marketplace.app_vedo_documento(p_ruoli text[], p_attivo boolean)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or (p_attivo and exists (
    select 1 from marketplace.app_rete r where r.utente = auth.uid() and r.stato = 'attivo' and (cardinality(p_ruoli) = 0 or r.ruolo = any (p_ruoli))));
$$;
drop policy if exists app_documenti_leggi on marketplace.app_documenti;
create policy app_documenti_leggi on marketplace.app_documenti for select using (marketplace.app_vedo_documento(ruoli, attivo));
drop policy if exists app_documenti_admin on marketplace.app_documenti;
create policy app_documenti_admin on marketplace.app_documenti for all using (marketplace.is_admin()) with check (marketplace.is_admin());
grant select, insert, update on marketplace.app_documenti to authenticated;

create table if not exists marketplace.app_firme (
  id uuid primary key default gen_random_uuid(),
  documento uuid not null references marketplace.app_documenti(id) on delete restrict,
  utente uuid not null references auth.users(id) on delete restrict,
  nome text not null check (length(btrim(nome)) between 3 and 120),
  firma text not null check (firma like 'data:image/png;base64,%' and length(firma) <= 400000),
  impronta text not null default '' check (length(impronta) <= 128),   -- SHA-256 del documento firmato
  dispositivo text not null default '' check (length(dispositivo) <= 300),
  firmato timestamptz not null default now(),
  unique (documento, utente)
);
alter table marketplace.app_firme enable row level security;
drop policy if exists app_firme_leggi on marketplace.app_firme;
create policy app_firme_leggi on marketplace.app_firme for select using (utente = auth.uid() or marketplace.is_admin());
revoke insert, update, delete on marketplace.app_firme from authenticated, anon;
grant select on marketplace.app_firme to authenticated;

create or replace function marketplace.app_firma_documento(p_documento uuid, p_nome text, p_firma text, p_impronta text, p_dispositivo text)
returns timestamptz language plpgsql security definer set search_path = marketplace, public as $$
declare
  d marketplace.app_documenti;
  v_quando timestamptz;
begin
  select * into d from marketplace.app_documenti where id = p_documento;
  if d.id is null or not d.attivo or not marketplace.app_vedo_documento(d.ruoli, d.attivo) then raise exception 'documento_non_trovato'; end if;
  if not d.richiede_firma then raise exception 'documento_senza_firma'; end if;
  if exists (select 1 from marketplace.app_firme where documento = p_documento and utente = auth.uid()) then raise exception 'gia_firmato'; end if;
  insert into marketplace.app_firme (documento, utente, nome, firma, impronta, dispositivo)
    values (p_documento, auth.uid(), btrim(p_nome), p_firma, left(coalesce(p_impronta, ''), 128), left(coalesce(p_dispositivo, ''), 300))
    returning firmato into v_quando;
  perform marketplace.app_notifica_admin('Firmato: ' || d.titolo || ' · ' || btrim(p_nome), 'ad-documento/' || p_documento);
  return v_quando;
end;
$$;
revoke all on function marketplace.app_firma_documento(uuid, text, text, text, text) from public, anon;
grant execute on function marketplace.app_firma_documento(uuid, text, text, text, text) to authenticated;

-- avviso a chi deve leggere o firmare un documento nuovo
create or replace function marketplace.app_avvisa_documento()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if new.attivo then
    insert into marketplace.app_notifiche (utente, testo, link)
      select r.utente, left(case when new.richiede_firma then 'Da firmare: ' else 'Nuovo documento: ' end || new.titolo, 200), 'documento/' || new.id
      from marketplace.app_rete r where r.stato = 'attivo' and (cardinality(new.ruoli) = 0 or r.ruolo = any (new.ruoli));
  end if;
  return new;
end;
$$;
drop trigger if exists app_documenti_avviso on marketplace.app_documenti;
create trigger app_documenti_avviso after insert on marketplace.app_documenti for each row execute function marketplace.app_avvisa_documento();

-- i documenti di partenza (PDF nella cartella docs dell'app)
insert into marketplace.app_documenti (tipo, titolo, testo, file, ruoli, richiede_firma, versione)
select * from (values
  ('circolare', 'Circolare n. 1/2026 · Nuove regole della rete', 'Dal 10 ottobre 2026: chi porta tiene, il cliente è di chi lo registra per primo, clienti fuori zona, iscrizioni dal sito, clienti di AncheCasa affidati, privati, territorio. Firmandola accetti le nuove regole (Allegato C).', 'docs/AncheCasa-Circolare-1-2026-Nuove-regole.pdf', '{}'::text[], true, '10.10.2026'),
  ('regolamento', 'Regolamento della rete AncheCasa', 'Le figure, come si guadagna e le regole uguali per tutti.', 'docs/AncheCasa-Regolamento-della-rete.pdf', '{}'::text[], true, '10.10.2026'),
  ('contratto', 'Contratto Responsabile Rete Italia', 'Il tuo contratto, con gli Allegati A, B e C.', 'docs/AncheCasa-5Contratto-Responsabile-Rete-Italia.pdf', '{reteitalia}'::text[], true, '10.10.2026'),
  ('contratto', 'Contratto Responsabile sviluppo rete', 'Il tuo contratto, con gli Allegati A, B e C.', 'docs/AncheCasa-1Contratto-Assistente-Sviluppo-Rete.pdf', '{sviluppo}'::text[], true, '10.10.2026'),
  ('contratto', 'Contratto Capo area', 'Il tuo contratto, con gli Allegati A, B e C.', 'docs/AncheCasa-2Contratto-Capo-Area.pdf', '{capoarea}'::text[], true, '10.10.2026'),
  ('contratto', 'Contratto Agente', 'Il tuo contratto, con gli Allegati A, B e C.', 'docs/AncheCasa-3Contratto-Agente.pdf', '{agente}'::text[], true, '10.10.2026'),
  ('contratto', 'Contratto Sub-agente', 'Il tuo contratto, con gli Allegati A, B e C.', 'docs/AncheCasa-4Contratto-Subagente.pdf', '{subagente}'::text[], true, '10.10.2026')
) as v(tipo, titolo, testo, file, ruoli, richiede_firma, versione)
where not exists (select 1 from marketplace.app_documenti d where d.file = v.file);

