-- =============================================================================
-- AncheCasa app · parte 12: COMPUTO UFFICIALE (sicurezza, logistica, smaltimento CER), PROFIT GUARD (MON),
--                           SUBAPPALTI CON PAGAMENTI SU MISURA, OFFERTE DEI FORNITORI, APPROVAZIONE
--                           AMMINISTRATIVA, PREVENTIVO UFFICIALE BLINDATO (11.10.2026)
-- Da eseguire DOPO app-11. Si può rieseguire senza danni.
--
-- Decisioni (Nando, 11.10.2026):
--  1. Tutto dentro l'app 2.3 e le tabelle che ci sono già (sopralluogo = app_sopralluoghi, preventivo = app_fe_documenti).
--  2. Pagina del cliente: marchio AncheCasa + nome della ditta che fa i lavori.
--  3. Inviti ai fornitori solo per mail (funzione «subappalti-mail»).
--  4. Pagamenti su misura per ogni richiesta e per ogni preventivo: righe libere (descrizione, evento) a percentuale,
--     a importo fisso, più al massimo una riga «saldo» che prende il resto. 30/30/40 è solo la proposta iniziale.
-- Niente numeri inventati: percentuali di sicurezza, maggiorazioni, prezzi di smaltimento e soglia di margine
-- li scrive il tecnico o l'admin. Finché mancano, il Profit Guard lo dice.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Computo ufficiale: sicurezza, logistica (ZTL, piani), smaltimento CER, costi interni
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_computi (
  sopralluogo uuid primary key references marketplace.app_sopralluoghi(id) on delete cascade,
  sicurezza_perc numeric(5,2) check (sicurezza_perc is null or sicurezza_perc between 0 and 100),
  sicurezza_importo numeric(12,2) check (sicurezza_importo is null or sicurezza_importo >= 0), -- se c'è (es. dal PSC) vale questo
  ztl boolean not null default false,
  ztl_costo numeric(10,2) not null default 0 check (ztl_costo >= 0),
  piano int check (piano is null or piano between -3 and 80),
  ascensore boolean,
  piano_perc numeric(5,2) not null default 0 check (piano_perc between 0 and 100),       -- maggiorazione trasporto ai piani
  smaltimento jsonb not null default '[]'::jsonb check (jsonb_typeof(smaltimento) = 'array' and jsonb_array_length(smaltimento) <= 20),
  spese_generali_perc numeric(5,2) not null default 0 check (spese_generali_perc between 0 and 100),
  costi_interni numeric(12,2) not null default 0 check (costi_interni >= 0),            -- manodopera e materiali propri
  note text not null default '' check (length(note) <= 1000),
  blindato_il timestamptz,
  blindato_da uuid references auth.users(id) on delete set null,
  aggiornato timestamptz not null default now()
);

-- Soglia di margine del Profit Guard: la decide l'admin (vuota = «da impostare»)
insert into marketplace.app_impostazioni (chiave, valore) values ('profit_guard', '{"margine_minimo": null}'::jsonb)
on conflict (chiave) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Subappalti: richieste, inviti, offerte, contatti proposti dall'agente, blocco mail
-- ---------------------------------------------------------------------------
create table if not exists marketplace.app_sub_richieste (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  sopralluogo uuid not null references marketplace.app_sopralluoghi(id) on delete cascade,
  titolo text not null check (length(btrim(titolo)) between 3 and 120),
  descrizione text not null default '' check (length(descrizione) <= 3000),
  voci jsonb not null default '[]'::jsonb check (jsonb_typeof(voci) = 'array' and jsonb_array_length(voci) <= 80),
  mestiere text not null default '' check (length(mestiere) <= 60),
  comune text not null default '' check (length(comune) <= 60),
  scadenza date not null,
  stato text not null default 'aperta' check (stato in ('aperta', 'assegnata', 'annullata')),
  creato_da uuid references auth.users(id) on delete set null default auth.uid(),
  creato timestamptz not null default now()
);
create index if not exists app_sub_richieste_s on marketplace.app_sub_richieste (sopralluogo);

create table if not exists marketplace.app_sub_inviti (
  id uuid primary key default gen_random_uuid(),
  richiesta uuid not null references marketplace.app_sub_richieste(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 120),
  nome text not null default '' check (length(nome) <= 80),
  ditta text not null default '' check (length(ditta) <= 120),
  telefono text not null default '' check (length(telefono) <= 30),
  rete_org uuid references marketplace.app_org(id) on delete set null,
  origine text not null default 'territorio' check (origine in ('rete', 'territorio')),
  invitato_da uuid references auth.users(id) on delete set null,
  stato_mail text not null default 'da_inviare' check (stato_mail in ('da_inviare', 'inviata', 'errore', 'bloccata')),
  mail_errore text not null default '' check (length(mail_errore) <= 300),
  inviata_il timestamptz,
  aperto_il timestamptz,
  creato timestamptz not null default now(),
  unique (richiesta, email)
);

create table if not exists marketplace.app_sub_offerte (
  id uuid primary key default gen_random_uuid(),
  richiesta uuid not null references marketplace.app_sub_richieste(id) on delete cascade,
  invito uuid not null unique references marketplace.app_sub_inviti(id) on delete cascade,
  importo numeric(14,2) not null check (importo > 0),
  tempi_giorni int check (tempi_giorni is null or tempi_giorni between 1 and 1000),
  note text not null default '' check (length(note) <= 2000),
  ditta text not null default '' check (length(ditta) <= 120),
  piva text not null default '' check (length(piva) <= 20),
  accetta_pagamenti boolean not null,                -- false = ha proposto pagamenti diversi (righe in app_milestone)
  stato text not null default 'in_revisione' check (stato in ('in_revisione', 'approvata', 'rifiutata', 'in_trattativa')),
  nota_admin text not null default '' check (length(nota_admin) <= 1000),
  piano_pagamenti jsonb,                              -- fotografia finale con gli importi, all'approvazione
  deciso_da uuid references auth.users(id) on delete set null,
  deciso_il timestamptz,
  creato timestamptz not null default now(),
  aggiornato timestamptz not null default now()
);
create index if not exists app_sub_offerte_r on marketplace.app_sub_offerte (richiesta);
create index if not exists app_sub_offerte_stato on marketplace.app_sub_offerte (stato);

-- Pagamenti su misura: di una richiesta, di un preventivo o di una controproposta del fornitore
create table if not exists marketplace.app_milestone (
  id uuid primary key default gen_random_uuid(),
  richiesta uuid references marketplace.app_sub_richieste(id) on delete cascade,
  documento uuid references marketplace.app_fe_documenti(id) on delete cascade,
  offerta uuid references marketplace.app_sub_offerte(id) on delete cascade,
  n int not null check (n between 1 and 30),
  descrizione text not null check (length(btrim(descrizione)) between 2 and 200),
  evento text not null default '' check (length(evento) <= 200),
  tipo text not null check (tipo in ('perc', 'importo', 'saldo')),
  valore numeric(14,2),
  check (num_nonnulls(richiesta, documento, offerta) = 1),
  check ((tipo = 'saldo' and valore is null) or (tipo = 'perc' and valore > 0 and valore <= 100) or (tipo = 'importo' and valore > 0))
);
create index if not exists app_milestone_r on marketplace.app_milestone (richiesta);
create index if not exists app_milestone_d on marketplace.app_milestone (documento);
create index if not exists app_milestone_o on marketplace.app_milestone (offerta);

-- Fornitori della zona proposti dall'agente (non ancora iscritti)
create table if not exists marketplace.app_fornitori_zona (
  id uuid primary key default gen_random_uuid(),
  org uuid not null references marketplace.app_org(id) on delete cascade,
  sopralluogo uuid references marketplace.app_sopralluoghi(id) on delete set null,
  proposto_da uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null default '' check (length(nome) <= 80),
  ditta text not null check (length(btrim(ditta)) between 2 and 120),
  mestiere text not null default '' check (length(mestiere) <= 60),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 120),
  telefono text not null default '' check (length(telefono) <= 30),
  comune text not null default '' check (length(comune) <= 60),
  note text not null default '' check (length(note) <= 300),
  creato timestamptz not null default now(),
  unique (org, email)
);

-- Chi ha chiesto di non ricevere più mail
create table if not exists marketplace.app_mail_stop (
  email text primary key check (email = lower(email)),
  il timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Pagamenti su misura: controllo e calcolo delle quote
--    Regole: almeno una riga; al massimo una «saldo».
--    Senza saldo: solo percentuali che fanno 100. Con saldo: percentuali sotto 100, importi fissi liberi,
--    il saldo prende il resto (non può venire negativo).
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_milestone_errore(p jsonb)
returns text language plpgsql immutable as $$
declare r jsonb; v_saldo int := 0; v_perc numeric := 0; v_imp int := 0; v numeric;
begin
  if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) = 0 then return 'pagamenti_vuoti'; end if;
  if jsonb_array_length(p) > 30 then return 'pagamenti_troppi'; end if;
  for r in select * from jsonb_array_elements(p) loop
    if length(btrim(coalesce(r->>'descrizione', ''))) < 2 then return 'pagamento_senza_descrizione'; end if;
    if length(coalesce(r->>'descrizione', '')) > 200 or length(coalesce(r->>'evento', '')) > 200 then return 'pagamento_testo_lungo'; end if;
    case r->>'tipo'
      when 'saldo' then v_saldo := v_saldo + 1;
      when 'perc' then
        v := nullif(r->>'valore', '')::numeric;
        if v is null or v <= 0 or v > 100 then return 'percentuale_non_valida'; end if;
        v_perc := v_perc + v;
      when 'importo' then
        v := nullif(r->>'valore', '')::numeric;
        if v is null or v <= 0 then return 'importo_non_valido'; end if;
        v_imp := v_imp + 1;
      else return 'tipo_pagamento_non_valido';
    end case;
  end loop;
  if v_saldo > 1 then return 'un_solo_saldo'; end if;
  if v_saldo = 0 and v_imp > 0 then return 'con_importi_fissi_serve_il_saldo'; end if;
  if v_saldo = 0 and v_perc <> 100 then return 'percentuali_non_fanno_100'; end if;
  if v_saldo = 1 and v_perc >= 100 then return 'percentuali_oltre_100'; end if;
  return null;
exception when invalid_text_representation then return 'numero_non_valido';
end;
$$;

-- Quote in euro per un totale: [{n, descrizione, evento, tipo, valore, importo}]
create or replace function marketplace.app_milestone_quote(p jsonb, p_totale numeric)
returns jsonb language plpgsql immutable as $$
declare r jsonb; v_out jsonb := '[]'::jsonb; v_usato numeric := 0; v_q numeric; v_n int := 0; v_saldo_idx int;
begin
  if marketplace.app_milestone_errore(p) is not null then raise exception '%', marketplace.app_milestone_errore(p); end if;
  for r in select * from jsonb_array_elements(p) loop
    v_n := v_n + 1;
    v_q := case r->>'tipo' when 'perc' then round(p_totale * (r->>'valore')::numeric / 100, 2) when 'importo' then (r->>'valore')::numeric else null end;
    if v_q is not null then v_usato := v_usato + v_q; else v_saldo_idx := v_n; end if;
    v_out := v_out || jsonb_build_array(jsonb_build_object('n', v_n, 'descrizione', btrim(r->>'descrizione'), 'evento', coalesce(r->>'evento', ''), 'tipo', r->>'tipo',
                                                           'valore', nullif(r->>'valore', '')::numeric, 'importo', v_q));
  end loop;
  if v_saldo_idx is not null then
    if p_totale - v_usato < 0 then raise exception 'importi_fissi_oltre_il_totale'; end if;
    v_out := jsonb_set(v_out, array[(v_saldo_idx - 1)::text, 'importo'], to_jsonb(p_totale - v_usato));
  elsif v_usato <> p_totale then
    -- arrotondamenti delle percentuali: la differenza di centesimi va sull'ultima rata
    v_out := jsonb_set(v_out, array[(v_n - 1)::text, 'importo'], to_jsonb((v_out->(v_n - 1)->>'importo')::numeric + (p_totale - v_usato)));
  end if;
  return v_out;
end;
$$;

-- Righe salvate → jsonb (per richiesta, documento o offerta)
create or replace function marketplace.app_milestone_di(p_richiesta uuid, p_documento uuid, p_offerta uuid)
returns jsonb language sql stable security definer set search_path = marketplace, public as $$
  select coalesce(jsonb_agg(jsonb_build_object('descrizione', descrizione, 'evento', evento, 'tipo', tipo, 'valore', valore) order by n), '[]'::jsonb)
    from marketplace.app_milestone
   where (p_richiesta is not null and richiesta = p_richiesta) or (p_documento is not null and documento = p_documento) or (p_offerta is not null and offerta = p_offerta);
$$;

create or replace function marketplace.app_milestone_scrivi_interna(p_richiesta uuid, p_documento uuid, p_offerta uuid, p jsonb)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare v_err text := marketplace.app_milestone_errore(p); r jsonb; v_n int := 0;
begin
  if v_err is not null then raise exception '%', v_err; end if;
  delete from marketplace.app_milestone
   where (p_richiesta is not null and richiesta = p_richiesta) or (p_documento is not null and documento = p_documento) or (p_offerta is not null and offerta = p_offerta);
  for r in select * from jsonb_array_elements(p) loop
    v_n := v_n + 1;
    insert into marketplace.app_milestone (richiesta, documento, offerta, n, descrizione, evento, tipo, valore)
    values (p_richiesta, p_documento, p_offerta, v_n, btrim(r->>'descrizione'), btrim(coalesce(r->>'evento', '')), r->>'tipo',
            case when r->>'tipo' = 'saldo' then null else (r->>'valore')::numeric end);
  end loop;
end;
$$;
revoke all on function marketplace.app_milestone_scrivi_interna(uuid, uuid, uuid, jsonb) from public, anon, authenticated;


-- Testo dei pagamenti per le condizioni del preventivo
create or replace function marketplace.app_milestone_testo(p jsonb, p_totale numeric)
returns text language sql immutable as $$
  select 'Pagamenti:' || E'\n' || string_agg(format('%s) %s%s: %s € (%s)', x->>'n', x->>'descrizione', coalesce(' – ' || nullif(x->>'evento', ''), ''),
           replace(to_char((x->>'importo')::numeric, 'FM999999990.00'), '.', ','),
           case x->>'tipo' when 'perc' then replace(rtrim(rtrim((x->>'valore'), '0'), '.'), '.', ',') || '%' when 'importo' then 'importo fisso' else 'saldo' end), E'\n' order by (x->>'n')::int)
    from jsonb_array_elements(marketplace.app_milestone_quote(p, p_totale)) x;
$$;
create or replace function marketplace.app_condizioni_con_pagamenti(p_documento uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare v_d marketplace.app_fe_documenti; v_pag jsonb; v_resto text;
begin
  select * into v_d from marketplace.app_fe_documenti where id = p_documento;
  v_pag := marketplace.app_milestone_di(null, p_documento, null);
  if jsonb_array_length(v_pag) = 0 then return; end if;
  -- toglie il blocco «Pagamenti:» precedente e tiene il resto delle condizioni
  v_resto := case when v_d.condizioni like 'Pagamenti:%' then coalesce(substring(v_d.condizioni from position(E'\n\n' in v_d.condizioni) + 2), '') else v_d.condizioni end;
  if v_d.condizioni like 'Pagamenti:%' and position(E'\n\n' in v_d.condizioni) = 0 then v_resto := ''; end if;
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_fe_documenti set condizioni = left(marketplace.app_milestone_testo(v_pag, v_d.totale) || case when v_resto <> '' then E'\n\n' || v_resto else '' end, 2000)
   where id = p_documento;
  perform set_config('app.fe_sistema', '', true);
end;
$$;
revoke all on function marketplace.app_condizioni_con_pagamenti(uuid) from public, anon, authenticated;

-- Pagamenti del preventivo al cliente (l'ufficio li decide per ogni commessa)
create or replace function marketplace.app_milestone_preventivo(p_documento uuid, p jsonb)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare v_d marketplace.app_fe_documenti;
begin
  select * into v_d from marketplace.app_fe_documenti where id = p_documento;
  if not found or v_d.tipo <> 'preventivo' then raise exception 'preventivo_non_trovato'; end if;
  if not marketplace.app_fe_scrive(v_d.org) then raise exception 'non_autorizzato'; end if;
  if v_d.stato_preventivo = 'accettato' then raise exception 'preventivo_gia_accettato'; end if;
  perform marketplace.app_milestone_quote(p, v_d.totale);   -- gli importi fissi devono stare nel totale
  perform marketplace.app_milestone_scrivi_interna(null, p_documento, null, p);
  perform marketplace.app_condizioni_con_pagamenti(p_documento);
  return marketplace.app_milestone_quote(p, v_d.totale);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Profit Guard: ricavi preventivati, costi chiusi con i fornitori, MON
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_profit_guard(p_sopralluogo uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi;
  v_c marketplace.app_computi;
  r jsonb;
  v_prezzo numeric;
  v_lavori numeric := 0;
  v_senza text[] := '{}';
  v_piano numeric; v_ztl numeric; v_smalt numeric := 0; v_sic numeric; v_ricavo numeric;
  v_sub numeric; v_sub_n int; v_aperte int; v_spese numeric; v_costi numeric; v_mon numeric; v_perc numeric; v_soglia numeric; v_sem text;
begin
  select * into v_s from marketplace.app_sopralluoghi where id = p_sopralluogo;
  if not found then raise exception 'sopralluogo_non_trovato'; end if;
  if not marketplace.app_fe_legge(v_s.org) then raise exception 'non_autorizzato'; end if;
  select * into v_c from marketplace.app_computi where sopralluogo = p_sopralluogo;

  for r in select * from jsonb_array_elements(v_s.computo) loop
    v_prezzo := coalesce(nullif(r->>'prezzo', '')::numeric, (
      select v.prezzo from marketplace.app_stima_riferimenti rf
        join marketplace.app_prezzari p on p.id = rf.prezzario and p.attivo
        join marketplace.app_prezzari_voci v on v.prezzario = rf.prezzario and v.codice = rf.codice
       where rf.lavorazione = r->>'lavorazione' and rf.regione = v_s.regione));
    if v_prezzo is null then v_senza := v_senza || coalesce(r->>'descrizione', r->>'lavorazione'); continue; end if;
    v_lavori := v_lavori + round(v_prezzo * coalesce((r->>'quantita')::numeric, 0), 2);
  end loop;

  v_piano := round(v_lavori * coalesce(v_c.piano_perc, 0) / 100, 2);
  v_ztl := case when coalesce(v_c.ztl, false) then coalesce(v_c.ztl_costo, 0) else 0 end;
  select coalesce(sum(round(coalesce((x->>'tonnellate')::numeric, 0) * coalesce((x->>'prezzo_t')::numeric, 0), 2)), 0) into v_smalt
    from jsonb_array_elements(coalesce(v_c.smaltimento, '[]'::jsonb)) x;
  v_sic := coalesce(v_c.sicurezza_importo, round((v_lavori + v_piano) * coalesce(v_c.sicurezza_perc, 0) / 100, 2));
  v_ricavo := v_lavori + v_piano + v_ztl + v_smalt + v_sic;

  select coalesce(sum(o.importo), 0), count(*) into v_sub, v_sub_n from marketplace.app_sub_offerte o
    join marketplace.app_sub_richieste q on q.id = o.richiesta where q.sopralluogo = p_sopralluogo and o.stato = 'approvata';
  select count(*) into v_aperte from marketplace.app_sub_richieste where sopralluogo = p_sopralluogo and stato = 'aperta';
  v_spese := round(v_ricavo * coalesce(v_c.spese_generali_perc, 0) / 100, 2);
  -- ZTL, smaltimento e sicurezza sono costi «passanti»: entrano nei ricavi e nei costi
  v_costi := v_sub + coalesce(v_c.costi_interni, 0) + v_spese + v_sic + v_ztl + v_smalt;
  v_mon := v_ricavo - v_costi;
  v_perc := case when v_ricavo > 0 then round(v_mon / v_ricavo * 100, 1) end;
  select nullif(valore->>'margine_minimo', '')::numeric into v_soglia from marketplace.app_impostazioni where chiave = 'profit_guard';
  v_sem := case when v_ricavo <= 0 then 'grigio' when v_mon < 0 then 'rosso' when v_soglia is null then 'grigio'
                when v_perc >= v_soglia then 'verde' else 'giallo' end;
  return jsonb_build_object(
    'ricavi', jsonb_build_object('lavori', v_lavori, 'piani', v_piano, 'ztl', v_ztl, 'smaltimento', v_smalt, 'sicurezza', v_sic, 'totale', v_ricavo),
    'costi', jsonb_build_object('subappalti', v_sub, 'subappalti_n', v_sub_n, 'interni', coalesce(v_c.costi_interni, 0), 'spese_generali', v_spese,
                                'passanti', v_sic + v_ztl + v_smalt, 'totale', v_costi),
    'mon', v_mon, 'mon_perc', v_perc, 'soglia', v_soglia, 'semaforo', v_sem,
    'richieste_aperte', v_aperte, 'senza_prezzo', to_jsonb(v_senza),
    'blindato', v_c.blindato_il is not null, 'preventivo', v_s.preventivo
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Subappalti: creare la richiesta con i suoi pagamenti, chi può invitare
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_sub_crea(p_sopralluogo uuid, p_titolo text, p_descrizione text, p_voci jsonb, p_mestiere text, p_scadenza date, p_pagamenti jsonb)
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare v_s marketplace.app_sopralluoghi; v_id uuid;
begin
  select * into v_s from marketplace.app_sopralluoghi where id = p_sopralluogo;
  if not found then raise exception 'sopralluogo_non_trovato'; end if;
  if not marketplace.app_fe_scrive(v_s.org) then raise exception 'non_autorizzato'; end if;
  if not (marketplace.is_admin() or marketplace.app_modulo_attivo(v_s.org, 'base')
      or (to_regclass('marketplace.app_rete') is not null and exists (select 1 from marketplace.app_rete where utente = auth.uid() and stato = 'attivo'))) then
    raise exception 'Subappalti è nell''abbonamento impresa';
  end if;
  if p_scadenza is null or p_scadenza < current_date then raise exception 'scadenza_non_valida'; end if;
  if marketplace.app_milestone_errore(p_pagamenti) is not null then raise exception '%', marketplace.app_milestone_errore(p_pagamenti); end if;
  if exists (select 1 from marketplace.app_computi where sopralluogo = p_sopralluogo and blindato_il is not null) then raise exception 'preventivo_blindato'; end if;
  insert into marketplace.app_sub_richieste (org, sopralluogo, titolo, descrizione, voci, mestiere, comune, scadenza)
  values (v_s.org, p_sopralluogo, btrim(p_titolo), coalesce(p_descrizione, ''), coalesce(p_voci, '[]'::jsonb), coalesce(p_mestiere, ''), v_s.comune, p_scadenza)
  returning id into v_id;
  perform marketplace.app_milestone_scrivi_interna(v_id, null, null, p_pagamenti);
  return v_id;
end;
$$;

-- Cambiare i pagamenti di una richiesta: solo finché non ci sono offerte
create or replace function marketplace.app_sub_pagamenti(p_richiesta uuid, p_pagamenti jsonb)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare v_r marketplace.app_sub_richieste;
begin
  select * into v_r from marketplace.app_sub_richieste where id = p_richiesta;
  if not found then raise exception 'richiesta_non_trovata'; end if;
  if not marketplace.app_fe_scrive(v_r.org) then raise exception 'non_autorizzato'; end if;
  if v_r.stato <> 'aperta' then raise exception 'richiesta_chiusa'; end if;
  if exists (select 1 from marketplace.app_sub_offerte where richiesta = p_richiesta) then raise exception 'ci_sono_gia_offerte'; end if;
  perform marketplace.app_milestone_scrivi_interna(p_richiesta, null, null, p_pagamenti);
end;
$$;

create or replace function marketplace.app_sub_annulla(p_richiesta uuid)
returns void language plpgsql security definer set search_path = marketplace, public as $$
declare v_r marketplace.app_sub_richieste;
begin
  select * into v_r from marketplace.app_sub_richieste where id = p_richiesta;
  if not found then raise exception 'richiesta_non_trovata'; end if;
  if not marketplace.app_fe_scrive(v_r.org) then raise exception 'non_autorizzato'; end if;
  if v_r.stato = 'assegnata' then raise exception 'richiesta_gia_assegnata'; end if;
  update marketplace.app_sub_richieste set stato = 'annullata' where id = p_richiesta;
  update marketplace.app_sub_offerte set stato = 'rifiutata', nota_admin = 'Richiesta annullata', deciso_da = auth.uid(), deciso_il = now(), aggiornato = now()
   where richiesta = p_richiesta and stato in ('in_revisione', 'in_trattativa');
end;
$$;

-- La funzione «subappalti-mail» chiede con il token della persona se può invitare: ufficio della ditta,
-- oppure l'agente che ha fatto quel sopralluogo (reclutamento dei fornitori di zona).
create or replace function marketplace.app_sub_posso_invitare(p_richiesta uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (select 1 from marketplace.app_sub_richieste r join marketplace.app_sopralluoghi s on s.id = r.sopralluogo
                  where r.id = p_richiesta and r.stato = 'aperta' and r.scadenza >= current_date
                    and (marketplace.app_fe_scrive(r.org) or s.agente = auth.uid()));
$$;

-- Fornitori iscritti alla rete con una mail (per invitarli)
create or replace function marketplace.app_fornitori_rete()
returns table (id uuid, nome text, citta text, tipo text, email text) language sql stable security definer set search_path = marketplace, public as $$
  select o.id, o.nome, o.citta, o.tipo, o.email from marketplace.app_org o
   where o.stato = 'attiva' and o.tipo in ('impresa', 'partner', 'fornitore') and o.email <> ''
     and (marketplace.is_admin() or exists (select 1 from marketplace.app_org_membri m where m.utente = auth.uid() and m.ruolo in ('titolare', 'responsabile')))
   order by o.nome limit 500;
$$;

-- ---------------------------------------------------------------------------
-- 6. Portale del fornitore (dal link nella mail, senza password)
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_invito_leggi(p_token uuid)
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare v_i marketplace.app_sub_inviti; v_r marketplace.app_sub_richieste; v_o marketplace.app_sub_offerte;
begin
  select * into v_i from marketplace.app_sub_inviti where token = p_token;
  if not found then return jsonb_build_object('trovato', false); end if;
  select * into v_r from marketplace.app_sub_richieste where id = v_i.richiesta;
  select * into v_o from marketplace.app_sub_offerte where invito = v_i.id;
  if v_i.aperto_il is null then update marketplace.app_sub_inviti set aperto_il = now() where id = v_i.id; end if;
  return jsonb_build_object(
    'trovato', true,
    'ditta', (select nome from marketplace.app_org where id = v_r.org),
    'titolo', v_r.titolo, 'descrizione', v_r.descrizione, 'voci', v_r.voci, 'mestiere', v_r.mestiere, 'comune', v_r.comune,
    'scadenza', v_r.scadenza, 'stato', v_r.stato,
    'aperta', v_r.stato = 'aperta' and v_r.scadenza >= current_date,
    'pagamenti', marketplace.app_milestone_di(v_r.id, null, null),
    'invitato', jsonb_build_object('nome', v_i.nome, 'ditta', v_i.ditta),
    'bloccato', exists (select 1 from marketplace.app_mail_stop where email = v_i.email),
    'offerta', case when v_o.id is not null then jsonb_build_object('importo', v_o.importo, 'ditta', v_o.ditta, 'tempi_giorni', v_o.tempi_giorni, 'note', v_o.note, 'stato', v_o.stato,
                    'accetta_pagamenti', v_o.accetta_pagamenti, 'controproposta', marketplace.app_milestone_di(null, null, v_o.id),
                    'nota_admin', case when v_o.stato in ('in_trattativa', 'rifiutata') then v_o.nota_admin else '' end,
                    'piano_pagamenti', v_o.piano_pagamenti) end
  );
end;
$$;

-- Offerta del fornitore: accetta i pagamenti della ditta, oppure propone i suoi (controproposta).
-- Si può rimandare finché è «in revisione» o «in trattativa».
create or replace function marketplace.app_invito_offerta(p_token uuid, p_importo numeric, p_tempi int, p_note text, p_ditta text, p_piva text,
                                                          p_accetto boolean, p_controproposta jsonb default null)
returns text language plpgsql security definer set search_path = marketplace, public as $$
declare v_i marketplace.app_sub_inviti; v_r marketplace.app_sub_richieste; v_o marketplace.app_sub_offerte; v_id uuid; v_pag jsonb;
begin
  select * into v_i from marketplace.app_sub_inviti where token = p_token;
  if not found then raise exception 'invito_non_trovato'; end if;
  select * into v_r from marketplace.app_sub_richieste where id = v_i.richiesta for update;
  if v_r.stato <> 'aperta' or v_r.scadenza < current_date then raise exception 'richiesta_chiusa'; end if;
  if p_importo is null or p_importo <= 0 or p_importo > 100000000 then raise exception 'importo_non_valido'; end if;
  if length(btrim(coalesce(p_ditta, ''))) < 2 then raise exception 'manca_la_ditta'; end if;
  v_pag := case when coalesce(p_accetto, false) then marketplace.app_milestone_di(v_r.id, null, null) else p_controproposta end;
  if not coalesce(p_accetto, false) and marketplace.app_milestone_errore(p_controproposta) is not null then raise exception '%', marketplace.app_milestone_errore(p_controproposta); end if;
  perform marketplace.app_milestone_quote(v_pag, p_importo);  -- controlla che gli importi fissi stiano nel totale
  select * into v_o from marketplace.app_sub_offerte where invito = v_i.id for update;
  if v_o.id is not null and v_o.stato not in ('in_revisione', 'in_trattativa') then raise exception 'offerta_gia_decisa'; end if;
  insert into marketplace.app_sub_offerte (richiesta, invito, importo, tempi_giorni, note, ditta, piva, accetta_pagamenti, stato)
  values (v_r.id, v_i.id, round(p_importo, 2), p_tempi, left(coalesce(p_note, ''), 2000), left(btrim(p_ditta), 120), left(btrim(coalesce(p_piva, '')), 20), coalesce(p_accetto, false), 'in_revisione')
  on conflict (invito) do update set importo = excluded.importo, tempi_giorni = excluded.tempi_giorni, note = excluded.note, ditta = excluded.ditta,
    piva = excluded.piva, accetta_pagamenti = excluded.accetta_pagamenti, stato = 'in_revisione', aggiornato = now()
  returning id into v_id;
  if coalesce(p_accetto, false) then delete from marketplace.app_milestone where offerta = v_id;
  else perform marketplace.app_milestone_scrivi_interna(null, null, v_id, p_controproposta); end if;
  perform marketplace.app_notifica_gestori(v_r.org, 'Nuova offerta di ' || left(btrim(p_ditta), 60) || ' per «' || left(v_r.titolo, 60) || '»', 'sub-vedi/' || v_r.id);
  return 'in_revisione';
end;
$$;

create or replace function marketplace.app_invito_stop(p_token uuid)
returns boolean language plpgsql security definer set search_path = marketplace, public as $$
declare v_i marketplace.app_sub_inviti;
begin
  select * into v_i from marketplace.app_sub_inviti where token = p_token;
  if not found then return false; end if;
  insert into marketplace.app_mail_stop (email) values (v_i.email) on conflict do nothing;
  update marketplace.app_sub_inviti set stato_mail = 'bloccata' where email = v_i.email and stato_mail = 'da_inviare';
  delete from marketplace.app_fornitori_zona where email = v_i.email;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Amministrazione: decide le offerte. Approvare = costo chiuso nel Profit Guard, altre offerte rifiutate.
--    Decide il titolare della ditta (l'amministrazione) o l'admin AncheCasa.
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_amministro(p_org uuid)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select marketplace.is_admin() or coalesce(marketplace.app_mio_ruolo(p_org) = 'titolare', false);
$$;

create or replace function marketplace.app_offerta_decidi(p_offerta uuid, p_decisione text, p_nota text default '')
returns jsonb language plpgsql security definer set search_path = marketplace, public as $$
declare v_o marketplace.app_sub_offerte; v_r marketplace.app_sub_richieste; v_pag jsonb;
begin
  select * into v_o from marketplace.app_sub_offerte where id = p_offerta for update;
  if not found then raise exception 'offerta_non_trovata'; end if;
  select * into v_r from marketplace.app_sub_richieste where id = v_o.richiesta for update;
  if not marketplace.app_amministro(v_r.org) then raise exception 'non_autorizzato'; end if;
  if p_decisione not in ('approvata', 'rifiutata', 'in_trattativa') then raise exception 'decisione_non_valida'; end if;
  if v_o.stato in ('approvata', 'rifiutata') then raise exception 'offerta_gia_decisa'; end if;
  if p_decisione = 'in_trattativa' and length(btrim(coalesce(p_nota, ''))) < 3 then raise exception 'scrivi_cosa_negoziare'; end if;
  if p_decisione = 'approvata' then
    if v_r.stato <> 'aperta' then raise exception 'richiesta_chiusa'; end if;
    if exists (select 1 from marketplace.app_computi where sopralluogo = v_r.sopralluogo and blindato_il is not null) then raise exception 'preventivo_blindato'; end if;
    v_pag := case when v_o.accetta_pagamenti then marketplace.app_milestone_di(v_r.id, null, null) else marketplace.app_milestone_di(null, null, v_o.id) end;
    update marketplace.app_sub_offerte set stato = 'approvata', nota_admin = left(coalesce(p_nota, ''), 1000), deciso_da = auth.uid(), deciso_il = now(), aggiornato = now(),
           piano_pagamenti = marketplace.app_milestone_quote(v_pag, v_o.importo)
     where id = p_offerta;
    update marketplace.app_sub_offerte set stato = 'rifiutata', nota_admin = 'Assegnata a un altro fornitore', deciso_da = auth.uid(), deciso_il = now(), aggiornato = now()
     where richiesta = v_r.id and id <> p_offerta and stato in ('in_revisione', 'in_trattativa');
    update marketplace.app_sub_richieste set stato = 'assegnata' where id = v_r.id;
  else
    update marketplace.app_sub_offerte set stato = p_decisione, nota_admin = left(coalesce(p_nota, ''), 1000), deciso_da = auth.uid(), deciso_il = now(), aggiornato = now()
     where id = p_offerta;
  end if;
  return marketplace.app_profit_guard(v_r.sopralluogo);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Preventivo ufficiale: approvazione amministrativa finale. Blinda computo e costi.
--    Servono: computo validato, nessuna richiesta di subappalto aperta, margine sopra la soglia
--    (oppure «forza», con la nota del perché).
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_preventivo_ufficiale(p_sopralluogo uuid, p_forza boolean default false, p_nota text default '')
returns uuid language plpgsql security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi; v_c marketplace.app_computi; v_pg jsonb; v_prev uuid; v_d marketplace.app_fe_documenti;
  r jsonb; v_n int := 0; v_prezzo numeric; v_aliq numeric;
begin
  select * into v_s from marketplace.app_sopralluoghi where id = p_sopralluogo for update;
  if not found then raise exception 'sopralluogo_non_trovato'; end if;
  if not (marketplace.app_amministro(v_s.org) and marketplace.app_fe_scrive(v_s.org)) then raise exception 'non_autorizzato'; end if;
  if not v_s.computo_validato or jsonb_array_length(v_s.computo) = 0 then raise exception 'computo_da_validare'; end if;
  select * into v_c from marketplace.app_computi where sopralluogo = p_sopralluogo;
  if v_c.blindato_il is not null then return v_s.preventivo; end if;
  v_pg := marketplace.app_profit_guard(p_sopralluogo);
  if (v_pg->>'richieste_aperte')::int > 0 then raise exception 'subappalti_aperti'; end if;
  if jsonb_array_length(v_pg->'senza_prezzo') > 0 then raise exception 'voci_senza_prezzo'; end if;
  if v_pg->>'semaforo' <> 'verde' and not coalesce(p_forza, false) then raise exception 'margine_da_confermare'; end if;
  if v_pg->>'semaforo' <> 'verde' and length(btrim(coalesce(p_nota, ''))) < 5 then raise exception 'scrivi_perche_forzi'; end if;

  v_prev := coalesce(v_s.preventivo, marketplace.app_sopralluogo_a_preventivo(p_sopralluogo));
  select * into v_d from marketplace.app_fe_documenti where id = v_prev;
  if v_d.bloccato or v_d.stato_preventivo = 'accettato' then raise exception 'preventivo_gia_accettato'; end if;
  delete from marketplace.app_fe_righe where documento = v_prev;
  for r in select * from jsonb_array_elements(v_s.computo) loop
    v_n := v_n + 1;
    v_prezzo := coalesce(nullif(r->>'prezzo', '')::numeric, (
      select v.prezzo from marketplace.app_stima_riferimenti rf join marketplace.app_prezzari p on p.id = rf.prezzario and p.attivo
        join marketplace.app_prezzari_voci v on v.prezzario = rf.prezzario and v.codice = rf.codice
       where rf.lavorazione = r->>'lavorazione' and rf.regione = v_s.regione));
    select aliquota into v_aliq from marketplace.app_stima_lavorazioni where chiave = r->>'lavorazione';
    insert into marketplace.app_fe_righe (documento, n, descrizione, quantita, um, prezzo, aliquota)
    values (v_prev, v_n, left(coalesce(nullif(r->>'descrizione', ''), r->>'lavorazione', 'Lavorazione'), 1000),
            greatest(coalesce((r->>'quantita')::numeric, 1), 0.001), left(coalesce(r->>'um', ''), 10), v_prezzo, coalesce(v_aliq, 10));
  end loop;
  if (v_pg->'ricavi'->>'piani')::numeric > 0 then
    v_n := v_n + 1; insert into marketplace.app_fe_righe (documento, n, descrizione, quantita, um, prezzo, aliquota)
    values (v_prev, v_n, 'Maggiorazione per trasporto ai piani' || case when v_c.piano is not null then ' (piano ' || v_c.piano || case when v_c.ascensore then ', con ascensore' when v_c.ascensore = false then ', senza ascensore' else '' end || ')' else '' end,
            1, 'corpo', (v_pg->'ricavi'->>'piani')::numeric, 10);
  end if;
  if (v_pg->'ricavi'->>'ztl')::numeric > 0 then
    v_n := v_n + 1; insert into marketplace.app_fe_righe (documento, n, descrizione, quantita, um, prezzo, aliquota)
    values (v_prev, v_n, 'Accesso in ZTL: permessi e logistica', 1, 'corpo', (v_pg->'ricavi'->>'ztl')::numeric, 10);
  end if;
  for r in select * from jsonb_array_elements(coalesce(v_c.smaltimento, '[]'::jsonb)) loop
    if coalesce((r->>'tonnellate')::numeric, 0) > 0 and coalesce((r->>'prezzo_t')::numeric, 0) > 0 then
      v_n := v_n + 1; insert into marketplace.app_fe_righe (documento, n, descrizione, quantita, um, prezzo, aliquota)
      values (v_prev, v_n, left('Trasporto e smaltimento rifiuti CER ' || coalesce(r->>'cer', '') || coalesce(' · ' || nullif(r->>'descrizione', ''), ''), 1000),
              (r->>'tonnellate')::numeric, 't', (r->>'prezzo_t')::numeric, 10);
    end if;
  end loop;
  if (v_pg->'ricavi'->>'sicurezza')::numeric > 0 then
    v_n := v_n + 1; insert into marketplace.app_fe_righe (documento, n, descrizione, quantita, um, prezzo, aliquota)
    values (v_prev, v_n, 'Oneri della sicurezza (D.Lgs. 81/08), non soggetti a ribasso', 1, 'corpo', (v_pg->'ricavi'->>'sicurezza')::numeric, 10);
  end if;

  -- Pagamenti del cliente: se l'ufficio li ha già decisi, finiscono nelle condizioni del preventivo
  perform marketplace.app_condizioni_con_pagamenti(v_prev);

  insert into marketplace.app_computi (sopralluogo) values (p_sopralluogo) on conflict do nothing;
  perform set_config('app.fe_sistema', '1', true);
  update marketplace.app_computi set blindato_il = now(), blindato_da = auth.uid(),
         note = left(note || case when coalesce(p_forza, false) and v_pg->>'semaforo' <> 'verde' then E'\nApprovato sotto soglia: ' || btrim(p_nota) else '' end, 1000)
   where sopralluogo = p_sopralluogo;
  perform set_config('app.fe_sistema', '', true);
  insert into marketplace.app_fe_eventi (documento, tipo, testo) values (v_prev, 'stato', 'Preventivo ufficiale approvato dall''amministrazione (MON ' || coalesce(v_pg->>'mon_perc', '–') || '%)');
  return v_prev;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Controlli: computo e costi bloccati dopo l'approvazione finale
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_computi_controlli()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
declare r jsonb;
begin
  if marketplace.app_fe_sistema() then new.aggiornato := now(); return new; end if;
  if tg_op = 'UPDATE' and old.blindato_il is not null then raise exception 'preventivo_blindato'; end if;
  new.blindato_il := case when tg_op = 'UPDATE' then old.blindato_il end;
  new.blindato_da := case when tg_op = 'UPDATE' then old.blindato_da end;
  for r in select * from jsonb_array_elements(new.smaltimento) loop
    if coalesce(r->>'cer', '') !~ '^[0-9]{2} [0-9]{2} [0-9]{2}\*?$' then raise exception 'codice_cer_non_valido'; end if;
    if coalesce((r->>'tonnellate')::numeric, -1) < 0 or coalesce((r->>'prezzo_t')::numeric, -1) < 0 then raise exception 'smaltimento_non_valido'; end if;
  end loop;
  new.aggiornato := now();
  return new;
end;
$$;
drop trigger if exists app_computi_controlli on marketplace.app_computi;
create trigger app_computi_controlli before insert or update on marketplace.app_computi for each row execute function marketplace.app_computi_controlli();

create or replace function marketplace.app_sopralluoghi_blindato()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if marketplace.app_fe_sistema() then return new; end if;
  if (new.computo is distinct from old.computo or new.computo_validato is distinct from old.computo_validato or new.regione is distinct from old.regione)
     and exists (select 1 from marketplace.app_computi where sopralluogo = old.id and blindato_il is not null) then
    raise exception 'preventivo_blindato';
  end if;
  return new;
end;
$$;
drop trigger if exists app_sopralluoghi_blindato on marketplace.app_sopralluoghi;
create trigger app_sopralluoghi_blindato before update on marketplace.app_sopralluoghi for each row execute function marketplace.app_sopralluoghi_blindato();

-- ---------------------------------------------------------------------------
-- 10. Pagina del cliente: marchio AncheCasa + nome della ditta (decisione dell'11.10.2026)
-- ---------------------------------------------------------------------------
create or replace function marketplace.app_stima_pubblica(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = marketplace, public as $$
declare
  v_s marketplace.app_sopralluoghi;
  v_c marketplace.app_record;
  v_fasi jsonb;
  v_giornale jsonb;
begin
  select * into v_s from marketplace.app_sopralluoghi where link = p_token and link_scade > now() and stato <> 'annullato';
  if not found then return jsonb_build_object('trovato', false); end if;
  if v_s.cantiere is not null then
    select * into v_c from marketplace.app_record where id = v_s.cantiere;
    select coalesce(jsonb_agg(jsonb_build_object('titolo', f.titolo, 'avanzamento', coalesce((f.dati->>'avanzamento')::int, 0), 'inizio', f.data, 'fine', f.scadenza) order by f.data nulls last), '[]'::jsonb)
      into v_fasi from marketplace.app_record f where f.rif = v_s.cantiere and f.tipo = 'fase';
    select coalesce(jsonb_agg(x order by x->>'data' desc), '[]'::jsonb) into v_giornale from (
      select jsonb_build_object('data', g.data, 'testo', left(g.titolo, 160)) x from marketplace.app_record g
       where g.rif = v_s.cantiere and g.tipo = 'giornale' order by g.data desc nulls last limit 8) t;
  end if;
  return jsonb_build_object(
    'trovato', true,
    'ditta', (select o.nome from marketplace.app_org o where o.id = v_s.org),
    'stato', v_s.stato,
    'quando', v_s.quando,
    'comune', v_s.comune,
    'lavori', v_s.lavori,
    'mq', v_s.mq,
    'finitura', v_s.finitura,
    'stile', marketplace.app_stile_tavola(v_s.stile),
    'stima_min', v_s.stima_min,
    'stima_max', v_s.stima_max,
    'budget_ok', v_s.budget_ok_il is not null,
    'pratica', (select jsonb_build_object('titolo', p.titolo, 'confermato', p.titolo_da = 'tecnico') from marketplace.app_sopralluoghi_pratica p where p.sopralluogo = v_s.id),
    'ufficiale', exists (select 1 from marketplace.app_computi k where k.sopralluogo = v_s.id and k.blindato_il is not null),
    'preventivo', (select jsonb_build_object('stato', d.stato_preventivo) from marketplace.app_fe_documenti d where d.id = v_s.preventivo),
    'cantiere', case when v_c.id is not null then jsonb_build_object('codice', coalesce(v_c.dati->>'codice', ''), 'stato', v_c.stato, 'inizio', v_c.data,
                  'fasi', v_fasi, 'giornale', v_giornale,
                  'avanzamento', (select round(avg(coalesce((f.dati->>'avanzamento')::numeric, 0))) from marketplace.app_record f where f.rif = v_c.id and f.tipo = 'fase'),
                  'fatture', (select count(*) from marketplace.app_fe_documenti d where d.cantiere = v_c.id and d.tipo <> 'preventivo' and d.bloccato)) end,
    'scade', v_s.link_scade
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Permessi
-- ---------------------------------------------------------------------------
alter table marketplace.app_computi enable row level security;
drop policy if exists app_computi_leggi on marketplace.app_computi;
create policy app_computi_leggi on marketplace.app_computi for select
  using (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and marketplace.app_fe_legge(s.org)));
drop policy if exists app_computi_scrivi on marketplace.app_computi;
create policy app_computi_scrivi on marketplace.app_computi for all
  using (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and marketplace.app_fe_scrive(s.org)))
  with check (exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and marketplace.app_fe_scrive(s.org)));
grant select, insert, update on marketplace.app_computi to authenticated;

alter table marketplace.app_sub_richieste enable row level security;
drop policy if exists app_sub_richieste_leggi on marketplace.app_sub_richieste;
create policy app_sub_richieste_leggi on marketplace.app_sub_richieste for select
  using (marketplace.app_fe_legge(org) or exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and s.agente = auth.uid()));
drop policy if exists app_sub_richieste_cambia on marketplace.app_sub_richieste;
create policy app_sub_richieste_cambia on marketplace.app_sub_richieste for update using (marketplace.app_fe_scrive(org)) with check (marketplace.app_fe_scrive(org));
grant select, update (titolo, descrizione, voci, mestiere, scadenza) on marketplace.app_sub_richieste to authenticated;

alter table marketplace.app_sub_inviti enable row level security;
drop policy if exists app_sub_inviti_leggi on marketplace.app_sub_inviti;
create policy app_sub_inviti_leggi on marketplace.app_sub_inviti for select
  using (exists (select 1 from marketplace.app_sub_richieste r where r.id = richiesta and marketplace.app_fe_legge(r.org)));
grant select (id, richiesta, email, nome, ditta, telefono, rete_org, origine, invitato_da, stato_mail, mail_errore, inviata_il, aperto_il, creato) on marketplace.app_sub_inviti to authenticated;

alter table marketplace.app_sub_offerte enable row level security;
drop policy if exists app_sub_offerte_leggi on marketplace.app_sub_offerte;
create policy app_sub_offerte_leggi on marketplace.app_sub_offerte for select
  using (exists (select 1 from marketplace.app_sub_richieste r where r.id = richiesta and marketplace.app_fe_legge(r.org)));
grant select on marketplace.app_sub_offerte to authenticated;

alter table marketplace.app_milestone enable row level security;
drop policy if exists app_milestone_leggi on marketplace.app_milestone;
create policy app_milestone_leggi on marketplace.app_milestone for select using (
  exists (select 1 from marketplace.app_sub_richieste r where r.id = richiesta and (marketplace.app_fe_legge(r.org)
          or exists (select 1 from marketplace.app_sopralluoghi s where s.id = r.sopralluogo and s.agente = auth.uid())))
  or exists (select 1 from marketplace.app_fe_documenti d where d.id = documento and marketplace.app_fe_legge(d.org))
  or exists (select 1 from marketplace.app_sub_offerte o join marketplace.app_sub_richieste r on r.id = o.richiesta where o.id = offerta and marketplace.app_fe_legge(r.org)));
grant select on marketplace.app_milestone to authenticated;

alter table marketplace.app_fornitori_zona enable row level security;
drop policy if exists app_fornitori_zona_leggi on marketplace.app_fornitori_zona;
create policy app_fornitori_zona_leggi on marketplace.app_fornitori_zona for select using (proposto_da = auth.uid() or marketplace.app_fe_legge(org));
drop policy if exists app_fornitori_zona_nuovo on marketplace.app_fornitori_zona;
create policy app_fornitori_zona_nuovo on marketplace.app_fornitori_zona for insert with check (
  proposto_da = auth.uid() and not exists (select 1 from marketplace.app_mail_stop m where m.email = app_fornitori_zona.email)
  and (marketplace.app_fe_legge(org) or exists (select 1 from marketplace.app_sopralluoghi s where s.id = sopralluogo and s.org = app_fornitori_zona.org and s.agente = auth.uid())));
drop policy if exists app_fornitori_zona_via on marketplace.app_fornitori_zona;
create policy app_fornitori_zona_via on marketplace.app_fornitori_zona for delete using (proposto_da = auth.uid() or marketplace.app_fe_scrive(org));
grant select, insert, delete on marketplace.app_fornitori_zona to authenticated;

alter table marketplace.app_mail_stop enable row level security;   -- nessuna regola: solo funzioni e service_role

grant all on marketplace.app_computi, marketplace.app_sub_richieste, marketplace.app_sub_inviti, marketplace.app_sub_offerte, marketplace.app_milestone,
  marketplace.app_fornitori_zona, marketplace.app_mail_stop to service_role;
grant select on marketplace.app_org to service_role;

revoke all on function marketplace.app_milestone_preventivo(uuid, jsonb) from public, anon;
revoke all on function marketplace.app_profit_guard(uuid) from public, anon;
revoke all on function marketplace.app_sub_crea(uuid, text, text, jsonb, text, date, jsonb) from public, anon;
revoke all on function marketplace.app_sub_pagamenti(uuid, jsonb) from public, anon;
revoke all on function marketplace.app_sub_annulla(uuid) from public, anon;
revoke all on function marketplace.app_sub_posso_invitare(uuid) from public, anon;
revoke all on function marketplace.app_fornitori_rete() from public, anon;
revoke all on function marketplace.app_offerta_decidi(uuid, text, text) from public, anon;
revoke all on function marketplace.app_preventivo_ufficiale(uuid, boolean, text) from public, anon;
revoke all on function marketplace.app_amministro(uuid) from public, anon;
revoke all on function marketplace.app_invito_leggi(uuid) from public;
revoke all on function marketplace.app_invito_offerta(uuid, numeric, int, text, text, text, boolean, jsonb) from public;
revoke all on function marketplace.app_invito_stop(uuid) from public;
revoke all on function marketplace.app_milestone_di(uuid, uuid, uuid) from public, anon;
grant execute on function marketplace.app_milestone_errore(jsonb) to anon, authenticated;
grant execute on function marketplace.app_milestone_quote(jsonb, numeric) to anon, authenticated;
grant execute on function marketplace.app_milestone_testo(jsonb, numeric) to authenticated;
grant execute on function marketplace.app_milestone_di(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function marketplace.app_milestone_preventivo(uuid, jsonb) to authenticated;
grant execute on function marketplace.app_profit_guard(uuid) to authenticated;
grant execute on function marketplace.app_sub_crea(uuid, text, text, jsonb, text, date, jsonb) to authenticated;
grant execute on function marketplace.app_sub_pagamenti(uuid, jsonb) to authenticated;
grant execute on function marketplace.app_sub_annulla(uuid) to authenticated;
grant execute on function marketplace.app_sub_posso_invitare(uuid) to authenticated;
grant execute on function marketplace.app_fornitori_rete() to authenticated;
grant execute on function marketplace.app_offerta_decidi(uuid, text, text) to authenticated;
grant execute on function marketplace.app_preventivo_ufficiale(uuid, boolean, text) to authenticated;
grant execute on function marketplace.app_amministro(uuid) to authenticated;
-- Le sole funzioni aperte a chi non ha l'account (il fornitore dal link nella mail)
grant execute on function marketplace.app_invito_leggi(uuid) to anon, authenticated;
grant execute on function marketplace.app_invito_offerta(uuid, numeric, int, text, text, text, boolean, jsonb) to anon, authenticated;
grant execute on function marketplace.app_invito_stop(uuid) to anon, authenticated;
