-- Nota vocale del sopralluogo. Il bucket accettava solo le foto jpg, quindi l'audio non partiva.
-- Si può rieseguire. Le foto restano com'erano.

update storage.buckets
set file_size_limit = 15000000,
    allowed_mime_types = array['image/jpeg', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg']
where id = 'sopralluoghi';

create or replace function marketplace.app_audio_sopralluogo(p_nome text, p_scrivi boolean)
returns boolean language sql stable security definer set search_path = marketplace, public as $$
  select exists (
    select 1 from marketplace.app_sopralluoghi s
    where p_nome ~ '^[0-9a-f-]{36}/a/[A-Za-z0-9_-]+\.(ogg|webm|m4a|mp4|mp3)$'
      and s.id::text = split_part(p_nome, '/', 1)
      and (case when p_scrivi then (s.agente = auth.uid() or marketplace.app_gestisce(s.org)) and s.stato <> 'annullato'
                else marketplace.app_vedo_sopralluogo(s.org, s.agente) end)
  );
$$;
grant execute on function marketplace.app_audio_sopralluogo(text, boolean) to authenticated;

drop policy if exists app_sopralluoghi_audio_leggi on storage.objects;
create policy app_sopralluoghi_audio_leggi on storage.objects for select to authenticated
  using (bucket_id = 'sopralluoghi' and marketplace.app_audio_sopralluogo(name, false));
drop policy if exists app_sopralluoghi_audio_carica on storage.objects;
create policy app_sopralluoghi_audio_carica on storage.objects for insert to authenticated
  with check (bucket_id = 'sopralluoghi' and marketplace.app_audio_sopralluogo(name, true));

delete from marketplace.app_sopralluoghi
where id = '995430fc-fc40-47c9-a549-6ff62c38a46e' and lavori like 'PROVA pubblicazione%';
