-- Dal sito: privato e azienda entrano senza autorizzazione.
-- L'agente resta in attesa finché l'amministrazione non lo accetta.
-- Chi arriva con un invito per mail resta verificato, come prima.

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
  v_verifica marketplace.stato_verifica := 'attesa';
  v_da uuid;
  v_nome text;
  v_tipo text;
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
    if v_nome = '' then
      v_nome := split_part(new.email, '@', 1);
    end if;

    insert into marketplace.profiles (id, famiglia, nome, zona, verifica, invitato_da, tipo_azienda)
    values (
      new.id,
      v_famiglia,
      v_nome,
      coalesce(nullif(trim(new.raw_user_meta_data->>'zona'), ''), ''),
      v_verifica,
      v_da,
      v_tipo
    );
  end if;
  return new;
end;
$function$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('marketplace-candidature', 'marketplace-candidature', false, 8388608)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists marketplace_cv_insert on storage.objects;
create policy marketplace_cv_insert on storage.objects
for insert to anon, authenticated
with check (
  bucket_id = 'marketplace-candidature'
  and name like 'agente/%'
  and lower(storage.extension(name)) in ('pdf', 'doc', 'docx')
);

drop policy if exists marketplace_cv_admin_read on storage.objects;
create policy marketplace_cv_admin_read on storage.objects
for select to authenticated
using (
  bucket_id = 'marketplace-candidature'
  and exists (select 1 from marketplace.admins a where a.id = auth.uid())
);
