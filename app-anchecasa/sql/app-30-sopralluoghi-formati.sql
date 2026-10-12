-- app-30 · Formati accettati dal bucket «sopralluoghi» (12.10.2026, prova vera delle 17:11)
--
-- Il bucket accettava solo image/jpeg e alcuni audio: rifiutava i video (video/mp4 → 400 invalid_mime_type),
-- le foto PNG/HEIC dell'iPhone e anche le simulazioni «Crea il dopo» che l'IA salva in PNG.
-- Qui si AGGIUNGONO i formati che servono, senza togliere quelli già presenti. Il limite di 50 MB non cambia.
-- Si può rilanciare.

update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(allowed_mime_types, array[]::text[]) || array[
    -- foto (anche iPhone) e simulazioni dell'IA
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    -- note vocali (Android, iPhone, registratore del browser)
    'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/x-m4a', 'audio/wav', 'audio/x-wav',
    -- video del giro della casa (Android mp4/webm, iPhone mov)
    'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'
  ]) as t
)
where id = 'sopralluoghi'
  and allowed_mime_types is not null;  -- se è null il bucket accetta già tutto: non si tocca

-- Controllo (sola lettura):
-- select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'sopralluoghi';
