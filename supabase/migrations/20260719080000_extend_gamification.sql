-- Gamificación extendida.
--
-- Cambios sobre 20260719000000_add_gamification.sql:
--   - badge "madrugador": la ventana pasa de [4,7) a "< 8" horas UTC
--     (el prompt del feature pide "antes de las 8h"; sigue sin haber
--     timezone por spot, así que se mantiene UTC).
--   - badge "explorador": umbral de 10 → 5 spots creados.
--   - badges nuevos: "social" (unirse a 3 grupos) y "constante" (confirmar
--     asistencia en 4 semanas consecutivas).
--   - XP nuevo: 'sesion_live' +10 al crear una sesión Roll with me, con tope
--     de un premio por día — las sesiones se crean y borran a voluntad y sin
--     tope serían XP infinito.
--   - 'reportar_spot' YA otorga +10 desde la migración original; se deja
--     como está a propósito (cambiarlo a +5 partiría el historial en dos).
--   - profiles.hide_from_rankings para ocultarse de los rankings de /retos.
--
-- El backfill del final es idempotente (not exists / on conflict) y NO
-- duplica XP ni badges ya otorgados; correr esta migración dos veces es
-- seguro.

alter table public.profiles
  add column if not exists hide_from_rankings boolean not null default false;

insert into public.badges (id, sort_order) values
  ('social', 5),
  ('constante', 6)
on conflict (id) do nothing;


-- RSVP: se redefine para ampliar "madrugador" a <8h UTC y evaluar
-- "constante" (4 semanas consecutivas con alguna asistencia confirmada,
-- medidas sobre el historial inmutable de xp_events).
create or replace function public.grant_xp_on_rsvp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_starts_at timestamptz;
  v_hour_utc int;
  v_constante boolean;
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
    if v_hour_utc < 8 then
      insert into public.user_badges (user_id, badge_id)
      values (new.profile_id, 'madrugador')
      on conflict do nothing;
    end if;
  end if;

  -- "constante": 4 semanas consecutivas con al menos una confirmación.
  -- Detección de islas: semanas distintas menos un ranking correlativo dan
  -- el mismo "grupo" cuando las semanas son consecutivas.
  if not exists (
    select 1 from public.user_badges
    where user_id = new.profile_id and badge_id = 'constante'
  ) then
    select exists (
      select 1
      from (
        select w - (row_number() over (order by w)) * interval '7 days' as grp
        from (
          select distinct date_trunc('week', created_at) as w
          from public.xp_events
          where user_id = new.profile_id and action = 'confirmar_asistencia'
        ) weeks
      ) runs
      group by grp
      having count(*) >= 4
    ) into v_constante;

    if v_constante then
      insert into public.user_badges (user_id, badge_id)
      values (new.profile_id, 'constante')
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;


-- Spots: umbral de "explorador" 10 → 5.
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

  if v_spot_count >= 5 then
    insert into public.user_badges (user_id, badge_id)
    values (new.created_by, 'explorador')
    on conflict do nothing;
  end if;

  return new;
end;
$$;


-- Roll with me: +10 XP al iniciar sesión en vivo, máximo una vez al día.
create or replace function public.grant_xp_on_live_session_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.xp_events
    where user_id = new.user_id
      and action = 'sesion_live'
      and created_at >= date_trunc('day', now())
  ) then
    insert into public.xp_events (user_id, action, points, reference_id)
    values (new.user_id, 'sesion_live', 10, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grant_xp_on_live_session_insert on public.live_sessions;
create trigger trg_grant_xp_on_live_session_insert
  after insert on public.live_sessions
  for each row
  execute function public.grant_xp_on_live_session_insert();


-- "social": unirse al tercer grupo.
create or replace function public.grant_badge_on_group_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.group_members where profile_id = new.profile_id
  ) >= 3 then
    insert into public.user_badges (user_id, badge_id)
    values (new.profile_id, 'social')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grant_badge_on_group_join on public.group_members;
create trigger trg_grant_badge_on_group_join
  after insert on public.group_members
  for each row
  execute function public.grant_badge_on_group_join();


-- ── Backfill retroactivo idempotente ────────────────────────────────────

-- explorador: usuarios que ya tienen 5+ spots con el umbral nuevo.
insert into public.user_badges (user_id, badge_id)
select created_by, 'explorador'
from public.spots
group by created_by
having count(*) >= 5
on conflict do nothing;

-- madrugador: RSVPs históricos a eventos que empiezan antes de las 8h UTC.
insert into public.user_badges (user_id, badge_id)
select distinct ea.profile_id, 'madrugador'
from public.event_attendees ea
join public.events e on e.id = ea.event_id
where ea.status = 'asistire'
  and extract(hour from (e.starts_at at time zone 'UTC')) < 8
on conflict do nothing;

-- social: miembros de 3+ grupos.
insert into public.user_badges (user_id, badge_id)
select profile_id, 'social'
from public.group_members
group by profile_id
having count(*) >= 3
on conflict do nothing;

-- constante: 4 semanas consecutivas en el historial de confirmaciones.
insert into public.user_badges (user_id, badge_id)
select distinct user_id, 'constante'
from (
  select user_id, grp
  from (
    select user_id, w,
           w - (row_number() over (partition by user_id order by w)) * interval '7 days' as grp
    from (
      select distinct user_id, date_trunc('week', created_at) as w
      from public.xp_events
      where action = 'confirmar_asistencia'
    ) weeks
  ) runs
  group by user_id, grp
  having count(*) >= 4
) qualifying
on conflict do nothing;

-- sesion_live: sesiones aún presentes en la tabla sin XP otorgado
-- (deduplicado por reference_id, así que no duplica puntos ya dados).
insert into public.xp_events (user_id, action, points, reference_id)
select ls.user_id, 'sesion_live', 10, ls.id
from public.live_sessions ls
where not exists (
  select 1 from public.xp_events x
  where x.user_id = ls.user_id
    and x.action = 'sesion_live'
    and x.reference_id = ls.id
);
