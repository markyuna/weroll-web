-- Eventos recurrentes (randonnées que se repiten).
--
-- `events.recurrence_rule` (existente, hasta ahora sin uso) guarda una regla
-- RRULE simplificada generada por la app:
--   FREQ=WEEKLY;BYDAY=FR;BYHOUR=21;BYMINUTE=0          (semanal)
--   FREQ=WEEKLY;INTERVAL=2;BYDAY=FR;BYHOUR=21;...      (quincenal)
--   FREQ=MONTHLY;BYDAY=2FR;BYHOUR=21;...               (mensual, 2.º viernes)
--
-- Las próximas instancias de un evento recurrente son "virtuales": se
-- calculan en la app a partir de la regla y NO existen como filas hasta que
-- alguien hace RSVP. En ese momento se materializa una fila hija con
-- `parent_event_id` apuntando al evento plantilla, vía la función
-- materialize_event_instance() de más abajo.

alter table public.events
  add column if not exists parent_event_id uuid references public.events (id) on delete cascade;
-- ON DELETE CASCADE: borrar la serie (el evento padre) elimina también sus
-- instancias materializadas y, en cascada, su asistencia. Las instancias no
-- tienen sentido sin la serie.

-- Máximo una instancia por (padre, fecha): hace idempotente la
-- materialización aunque dos usuarios hagan RSVP a la vez.
create unique index if not exists events_parent_starts_at_key
  on public.events (parent_event_id, starts_at)
  where parent_event_id is not null;

-- Materializa (o devuelve, si ya existe) la instancia de un evento
-- recurrente para una fecha concreta. SECURITY DEFINER porque la policy de
-- INSERT sobre events exige auth.uid() = organizer_id, y quien materializa
-- al hacer RSVP normalmente NO es el organizador. La fila hija copia los
-- datos del padre y conserva a su organizador original.
--
-- Nota: no se valida aquí que p_starts_at caiga exactamente sobre la regla
-- (la zona horaria de la regla vive en la app, no en la base); se limita a
-- exigir que el padre sea recurrente y la fecha esté en un rango razonable.
create or replace function public.materialize_event_instance(
  p_parent_id uuid,
  p_starts_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent public.events%rowtype;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para confirmar asistencia';
  end if;

  select * into v_parent
  from public.events
  where id = p_parent_id
    and recurrence_rule is not null
    and parent_event_id is null;
  if not found then
    raise exception 'El evento no es una serie recurrente';
  end if;

  if p_starts_at <= now() or p_starts_at > now() + interval '1 year' then
    raise exception 'La fecha de la instancia está fuera de rango';
  end if;

  select id into v_id
  from public.events
  where parent_event_id = p_parent_id and starts_at = p_starts_at;
  if found then
    return v_id;
  end if;

  insert into public.events (
    title, description, group_id, spot_id, organizer_id,
    starts_at, ends_at, distance_km, difficulty, max_participants,
    status, route_polyline, pause_spot_id, recurrence_rule, parent_event_id
  ) values (
    v_parent.title, v_parent.description, v_parent.group_id, v_parent.spot_id, v_parent.organizer_id,
    p_starts_at,
    case
      when v_parent.ends_at is null then null
      else p_starts_at + (v_parent.ends_at - v_parent.starts_at)
    end,
    v_parent.distance_km, v_parent.difficulty, v_parent.max_participants,
    'programado', v_parent.route_polyline, v_parent.pause_spot_id,
    null, -- la instancia hija no es recurrente por sí misma
    p_parent_id
  )
  on conflict (parent_event_id, starts_at) where parent_event_id is not null
  do nothing
  returning id into v_id;

  -- Carrera perdida contra otro RSVP simultáneo: la fila ya existe.
  if v_id is null then
    select id into v_id
    from public.events
    where parent_event_id = p_parent_id and starts_at = p_starts_at;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.materialize_event_instance(uuid, timestamptz) from public, anon;
grant execute on function public.materialize_event_instance(uuid, timestamptz) to authenticated;
