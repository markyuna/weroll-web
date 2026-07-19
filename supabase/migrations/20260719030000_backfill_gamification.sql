-- Backfill único de gamificación: genera en xp_events/user_badges lo que
-- los triggers de 20260719000000_add_gamification.sql habrían creado para
-- datos que ya existían antes de esa migración.
--
-- NO ejecutar automáticamente: revisar y correr a mano, una sola vez, en el
-- SQL Editor.
--
-- Por qué no dispara doble XP con los triggers actuales:
-- los 4 triggers (grant_xp_on_event_insert, grant_xp_on_rsvp,
-- grant_xp_on_spot_insert, grant_xp_on_spot_report_insert) son todos
-- "AFTER INSERT" (el de RSVP también "AFTER UPDATE") sobre events,
-- event_attendees, spots y spot_reports respectivamente. Este script no
-- inserta ni actualiza ninguna fila en esas cuatro tablas — solo lee de
-- ellas e inserta directamente en xp_events y user_badges — así que
-- ninguno de esos triggers puede dispararse. Tampoco hay triggers
-- definidos sobre xp_events/user_badges que pudieran encadenarse.
--
-- Por qué es idempotente sin filtrar por fecha:
-- cada INSERT usa "not exists" contra xp_events por (user_id, action,
-- reference_id) [o contra user_badges por (user_id, badge_id) para los
-- badges] antes de insertar. Cualquier evento/spot/RSVP/reporte creado
-- DESPUÉS de que la migración de gamificación quedara activa ya tiene sus
-- filas de xp_events puestas por el trigger correspondiente, así que el
-- "not exists" las encuentra y las salta solo; no hace falta un corte por
-- fecha, y correr este script dos veces no duplica nada.
--
-- Caso especial "reportar_spot": a diferencia de confirmar_asistencia, el
-- trigger de spot_reports NO deduplica por (user_id, spot_id) — un mismo
-- usuario puede ganar 10 XP varias veces si reporta el mismo spot más de
-- una vez, porque reference_id es el spot_id (no el id del reporte). Aun
-- así este backfill es correcto: dentro de un único INSERT...SELECT, el
-- "not exists" se evalúa contra la foto de xp_events al inicio de la
-- sentencia (no contra las filas que la propia sentencia va insertando),
-- así que en la primera corrida SÍ se insertan todos los reportes
-- históricos duplicados; solo una segunda corrida completa del script
-- quedaría bloqueada para ese mismo (user_id, spot_id) — que es
-- exactamente el comportamiento de idempotencia pedido para un script
-- pensado para correr una única vez.

begin;

-- 1) Eventos existentes: +50 XP "crear_evento" al organizador.
insert into public.xp_events (user_id, action, points, reference_id)
select e.organizer_id, 'crear_evento', 50, e.id
from public.events e
where not exists (
  select 1 from public.xp_events x
  where x.user_id = e.organizer_id
    and x.action = 'crear_evento'
    and x.reference_id = e.id
);

-- 1b) +20 XP extra "ruta_dibujada" si el evento ya nació con trazado.
insert into public.xp_events (user_id, action, points, reference_id)
select e.organizer_id, 'ruta_dibujada', 20, e.id
from public.events e
where e.route_polyline is not null
  and not exists (
    select 1 from public.xp_events x
    where x.user_id = e.organizer_id
      and x.action = 'ruta_dibujada'
      and x.reference_id = e.id
  );

-- 1c) Badge "organizador": todo usuario con al menos un evento creado.
insert into public.user_badges (user_id, badge_id)
select distinct e.organizer_id, 'organizador'
from public.events e
where not exists (
  select 1 from public.user_badges b
  where b.user_id = e.organizer_id and b.badge_id = 'organizador'
);

-- 2) Spots existentes: +40 XP "crear_spot" a quien lo creó.
insert into public.xp_events (user_id, action, points, reference_id)
select s.created_by, 'crear_spot', 40, s.id
from public.spots s
where not exists (
  select 1 from public.xp_events x
  where x.user_id = s.created_by
    and x.action = 'crear_spot'
    and x.reference_id = s.id
);

-- 2b) Badge "explorador": usuarios con 10 spots o más creados en total.
insert into public.user_badges (user_id, badge_id)
select counts.created_by, 'explorador'
from (
  select created_by, count(*) as spot_count
  from public.spots
  group by created_by
) counts
where counts.spot_count >= 10
  and not exists (
    select 1 from public.user_badges b
    where b.user_id = counts.created_by and b.badge_id = 'explorador'
  );

-- 3) RSVP confirmados ('asistire'): +30 XP "confirmar_asistencia" por
--    evento/usuario (event_attendees ya tiene PK (event_id, profile_id),
--    así que no hace falta distinct aquí).
insert into public.xp_events (user_id, action, points, reference_id)
select ea.profile_id, 'confirmar_asistencia', 30, ea.event_id
from public.event_attendees ea
where ea.status = 'asistire'
  and not exists (
    select 1 from public.xp_events x
    where x.user_id = ea.profile_id
      and x.action = 'confirmar_asistencia'
      and x.reference_id = ea.event_id
  );

-- 3b) Badge "primera_rando": todo usuario con al menos una asistencia
--     confirmada ('asistire') en toda su cuenta.
insert into public.user_badges (user_id, badge_id)
select distinct ea.profile_id, 'primera_rando'
from public.event_attendees ea
where ea.status = 'asistire'
  and not exists (
    select 1 from public.user_badges b
    where b.user_id = ea.profile_id and b.badge_id = 'primera_rando'
  );

-- 3c) Badge "madrugador": asistencia confirmada a un evento que empieza
--     entre las 4:00 y las 7:00 UTC (mismo criterio que el trigger:
--     no hay timezone por spot, así que se usa UTC directamente).
insert into public.user_badges (user_id, badge_id)
select distinct ea.profile_id, 'madrugador'
from public.event_attendees ea
join public.events e on e.id = ea.event_id
where ea.status = 'asistire'
  and extract(hour from (e.starts_at at time zone 'UTC')) >= 4
  and extract(hour from (e.starts_at at time zone 'UTC')) < 7
  and not exists (
    select 1 from public.user_badges b
    where b.user_id = ea.profile_id and b.badge_id = 'madrugador'
  );

-- 4) Reportes de spot existentes: +10 XP "reportar_spot" (uno por fila de
--    spot_reports, ver nota sobre duplicados arriba).
insert into public.xp_events (user_id, action, points, reference_id)
select sr.profile_id, 'reportar_spot', 10, sr.spot_id
from public.spot_reports sr
where not exists (
  select 1 from public.xp_events x
  where x.user_id = sr.profile_id
    and x.action = 'reportar_spot'
    and x.reference_id = sr.spot_id
);

commit;

-- Verificación opcional tras correr el backfill: XP total y badges por
-- usuario, para comparar contra lo esperado antes de cerrar.
-- select user_id, sum(points) as xp_total from public.xp_events group by user_id order by xp_total desc;
-- select user_id, array_agg(badge_id) as badges from public.user_badges group by user_id;
