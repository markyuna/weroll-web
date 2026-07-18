-- Gamificación: XP y badges.
--
-- xp_events y user_badges solo se escriben desde triggers SECURITY DEFINER
-- (dueños de las funciones = el rol que corre esta migración, típicamente
-- "postgres", que no está sujeto a RLS). No se define ninguna policy de
-- insert/update/delete para "public"/"anon"/"authenticated", así que un
-- cliente autenticado normal no puede escribir en estas tablas directamente
-- por la API — solo lectura pública.
--
-- badges es un catálogo: id es un slug ('primera_rando', 'organizador', ...)
-- y el nombre/descripción visibles NO se guardan aquí, se traducen en la app
-- con next-intl usando ese slug como clave de mensaje (namespace "Badges",
-- pendiente de UI).

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  points integer not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);

alter table public.xp_events enable row level security;

create policy "El historial de XP es visible públicamente"
  on public.xp_events for select
  using (true);

create table if not exists public.badges (
  id text primary key,
  sort_order integer not null default 0
);

alter table public.badges enable row level security;

create policy "El catálogo de badges es visible públicamente"
  on public.badges for select
  using (true);

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Los badges obtenidos son visibles públicamente"
  on public.user_badges for select
  using (true);

-- Catálogo de badges. sort_order define el orden de despliegue futuro en la UI.
insert into public.badges (id, sort_order) values
  ('primera_rando', 1),
  ('organizador', 2),
  ('explorador', 3),
  ('madrugador', 4)
on conflict (id) do nothing;


-- 1) Crear un evento: +50 XP al organizador, +20 extra si ya nace con
--    trazado de ruta, y badge "organizador" en el primer evento creado.
create or replace function public.grant_xp_on_event_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.xp_events (user_id, action, points, reference_id)
  values (new.organizer_id, 'crear_evento', 50, new.id);

  if new.route_polyline is not null then
    insert into public.xp_events (user_id, action, points, reference_id)
    values (new.organizer_id, 'ruta_dibujada', 20, new.id);
  end if;

  if not exists (
    select 1 from public.user_badges
    where user_id = new.organizer_id and badge_id = 'organizador'
  ) then
    insert into public.user_badges (user_id, badge_id)
    values (new.organizer_id, 'organizador')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grant_xp_on_event_insert on public.events;
create trigger trg_grant_xp_on_event_insert
  after insert on public.events
  for each row
  execute function public.grant_xp_on_event_insert();


-- 2) Confirmar asistencia ('asistire'): +30 XP la primera vez por evento
--    (no se vuelve a otorgar si el usuario alterna tal_vez/asistire),
--    badge "primera_rando" en la primera confirmación de toda su cuenta,
--    y badge "madrugador" si el evento empieza entre las 4:00 y las 7:00
--    UTC (no hay timezone por spot, así que se usa UTC directamente).
create or replace function public.grant_xp_on_rsvp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_starts_at timestamptz;
  v_hour_utc int;
begin
  -- Ya se premió la asistencia a este evento antes: no duplicar.
  if exists (
    select 1 from public.xp_events
    where user_id = new.profile_id
      and action = 'confirmar_asistencia'
      and reference_id = new.event_id
  ) then
    return new;
  end if;

  insert into public.xp_events (user_id, action, points, reference_id)
  values (new.profile_id, 'confirmar_asistencia', 30, new.event_id);

  if not exists (
    select 1 from public.user_badges
    where user_id = new.profile_id and badge_id = 'primera_rando'
  ) then
    insert into public.user_badges (user_id, badge_id)
    values (new.profile_id, 'primera_rando')
    on conflict do nothing;
  end if;

  select starts_at into v_starts_at from public.events where id = new.event_id;

  if v_starts_at is not null then
    v_hour_utc := extract(hour from (v_starts_at at time zone 'UTC'));
    if v_hour_utc >= 4 and v_hour_utc < 7 then
      if not exists (
        select 1 from public.user_badges
        where user_id = new.profile_id and badge_id = 'madrugador'
      ) then
        insert into public.user_badges (user_id, badge_id)
        values (new.profile_id, 'madrugador')
        on conflict do nothing;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grant_xp_on_rsvp on public.event_attendees;
create trigger trg_grant_xp_on_rsvp
  after insert or update on public.event_attendees
  for each row
  when (new.status = 'asistire')
  execute function public.grant_xp_on_rsvp();


-- 3) Crear un spot: +40 XP, badge "explorador" al llegar a 10 spots creados.
create or replace function public.grant_xp_on_spot_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spot_count integer;
begin
  insert into public.xp_events (user_id, action, points, reference_id)
  values (new.created_by, 'crear_spot', 40, new.id);

  select count(*) into v_spot_count
  from public.spots
  where created_by = new.created_by;

  if v_spot_count >= 10 and not exists (
    select 1 from public.user_badges
    where user_id = new.created_by and badge_id = 'explorador'
  ) then
    insert into public.user_badges (user_id, badge_id)
    values (new.created_by, 'explorador')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grant_xp_on_spot_insert on public.spots;
create trigger trg_grant_xp_on_spot_insert
  after insert on public.spots
  for each row
  execute function public.grant_xp_on_spot_insert();


-- 4) Reportar el estado de un spot: +10 XP.
create or replace function public.grant_xp_on_spot_report_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.xp_events (user_id, action, points, reference_id)
  values (new.profile_id, 'reportar_spot', 10, new.spot_id);

  return new;
end;
$$;

drop trigger if exists trg_grant_xp_on_spot_report_insert on public.spot_reports;
create trigger trg_grant_xp_on_spot_report_insert
  after insert on public.spot_reports
  for each row
  execute function public.grant_xp_on_spot_report_insert();
