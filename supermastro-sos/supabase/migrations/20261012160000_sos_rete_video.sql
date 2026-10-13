-- 12.10.2026 — SuperMastro: solo video, anche verso gli artigiani della rete.
-- La vecchia richiesta SOS con la foto non si usa più. All'artigiano iscritto
-- si manda il video del guasto con lo stesso giro di "Mandagli il video":
-- la scheda in artisan_leads nasce con fonte 'rete' e fonte_id 'rete/<id worker>'.
-- Il telefono resta in contact_vault e lo legge solo il server (service role).

alter table public.artisan_leads drop constraint if exists artisan_leads_fonte_check;
alter table public.artisan_leads
  add constraint artisan_leads_fonte_check check (fonte in ('osm', 'google', 'rete'));

-- Le risposte del privato all'artigiano: solo video registrati dal vivo, niente foto.
update storage.buckets
set allowed_mime_types = array['video/webm', 'video/mp4', 'video/quicktime']
where id = 'sos-video';
