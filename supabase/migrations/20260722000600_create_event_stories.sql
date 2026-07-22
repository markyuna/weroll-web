-- Historias efímeras de evento (estilo Instagram, expiran a la hora).
-- Solo las ven/publican quienes participan del evento: el organizador o
-- alguien con RSVP "asistire" — es una señal de "venid ya" para esa gente,
-- no contenido público del evento.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stories',
  'stories',
  true,
  700000, -- ~700KB: el cliente comprime a <=500KB, deja margen
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
      and policyname = 'Historias visibles públicamente'
  ) then
    create policy "Historias visibles públicamente"
      on storage.objects for select
      using (bucket_id = 'stories');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Subir historia bajo mi prefijo'
  ) then
    create policy "Subir historia bajo mi prefijo"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'stories'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Borrar historia bajo mi prefijo'
  ) then
    create policy "Borrar historia bajo mi prefijo"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'stories'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

create table if not exists public.event_stories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text,
  instagram_url text,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  created_at timestamptz not null default now(),
  -- Una historia es una foto propia O un embed de Instagram, nunca ambas.
  constraint event_stories_exactly_one_source check (
    (storage_path is not null and instagram_url is null)
    or (storage_path is null and instagram_url is not null)
  )
);

create index if not exists event_stories_event_expires_idx
  on public.event_stories (event_id, expires_at);

alter table public.event_stories enable row level security;

create policy "Ver historias de eventos donde participo"
  on public.event_stories for select
  using (
    expires_at > now()
    and (
      auth.uid() = author_id
      or exists (
        select 1 from public.events
        where events.id = event_stories.event_id and events.organizer_id = auth.uid()
      )
      or exists (
        select 1 from public.event_attendees
        where event_attendees.event_id = event_stories.event_id
          and event_attendees.profile_id = auth.uid()
          and event_attendees.status = 'asistire'
      )
    )
  );

create policy "Publicar historia como asistente u organizador"
  on public.event_stories for insert
  with check (
    auth.uid() = author_id
    and (
      exists (
        select 1 from public.events
        where events.id = event_stories.event_id and events.organizer_id = auth.uid()
      )
      or exists (
        select 1 from public.event_attendees
        where event_attendees.event_id = event_stories.event_id
          and event_attendees.profile_id = auth.uid()
          and event_attendees.status = 'asistire'
      )
    )
  );

create table if not exists public.story_views (
  story_id uuid not null references public.event_stories (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.story_views enable row level security;

create policy "Veo mis propias vistas"
  on public.story_views for select
  using (auth.uid() = viewer_id);

create policy "Registro mi propia vista"
  on public.story_views for insert
  with check (auth.uid() = viewer_id);

-- Limpieza: borra archivos del bucket y filas caducadas. Filtrar
-- expires_at > now() en cada query (app y RLS) ya oculta lo caducado antes
-- de que corra esta función; es la recolección de basura real.
create or replace function public.cleanup_expired_event_stories()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects
  where bucket_id = 'stories'
    and name in (
      select storage_path from public.event_stories
      where expires_at <= now() and storage_path is not null
    );

  delete from public.event_stories
  where expires_at <= now();
end;
$$;
