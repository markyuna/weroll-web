-- Avatares con foto: bucket público "avatars" en Supabase Storage.
--
-- profiles.avatar_url ya existe (ver 20260718000000_create_profiles.sql);
-- el add column es defensivo. El bucket es público (lectura por URL), con
-- límite de 2MB y solo imágenes; el límite real de la app es menor porque
-- el cliente redimensiona a 256×256 antes de subir.
--
-- RLS sobre storage.objects: cada usuario solo puede escribir bajo su propio
-- prefijo {user_id}/... — (storage.foldername(name))[1] es el primer
-- segmento de la ruta del objeto.

alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Avatares visibles públicamente'
  ) then
    create policy "Avatares visibles públicamente"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Subir avatar bajo mi prefijo'
  ) then
    create policy "Subir avatar bajo mi prefijo"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Reemplazar avatar bajo mi prefijo'
  ) then
    create policy "Reemplazar avatar bajo mi prefijo"
      on storage.objects for update to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Borrar avatar bajo mi prefijo'
  ) then
    create policy "Borrar avatar bajo mi prefijo"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
