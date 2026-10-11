-- Correzioni alle fasi 4 e 6 (11.10.2026). Funziona sia se le migrazioni 0700 e 0900
-- sono già state applicate, sia se si applicano adesso: ogni comando si può ripetere.

-- Fase 4: un solo voto per diagnosi (il server aggiorna il voto finché è in attesa).
-- Se ci sono già doppioni, si tiene il voto più recente.
delete from public.sos_diagnosis_feedback f
 using public.sos_diagnosis_feedback g
 where f.diagnosis_id = g.diagnosis_id
   and (f.created_at, f.id) < (g.created_at, g.id);
create unique index if not exists sos_diagnosis_feedback_one_per_diagnosis
  on public.sos_diagnosis_feedback (diagnosis_id);

-- Fase 6: opt-out anche per numero di telefono (formato +39...).
alter table public.artisan_leads add column if not exists telefono_norm text;
create index if not exists artisan_leads_telefono_norm_idx
  on public.artisan_leads (telefono_norm) where telefono_norm is not null;

-- Fase 6: limiti del codice SMS e consenso del privato.
alter table public.sos_shared_requests
  add column if not exists otp_sent_at timestamptz,          -- 60 secondi tra due codici
  add column if not exists otp_day date,
  add column if not exists otp_day_count integer not null default 0,  -- massimo 3 al giorno
  add column if not exists artigiano_telefono text,          -- cellulare dell'artigiano confermato con il codice
  add column if not exists verificato_il timestamptz,
  add column if not exists cliente_telefono text,            -- il privato accetta: solo allora l'artigiano vede il numero
  add column if not exists accettato_il timestamptz;

-- Fase 6: foto dell'iPhone (HEIC/HEIF) accettate nelle risposte del privato.
update storage.buckets
   set allowed_mime_types = array['video/webm', 'video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
 where id = 'sos-video';
