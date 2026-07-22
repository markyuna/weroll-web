-- Notificar a los demás cuando alguien sale de un evento (borra su RSVP) o
-- de un grupo. Las policies de DELETE ya existen en las dos tablas
-- (verificado por introspección: "quitar mi rsvp" en event_attendees,
-- "salir de grupos" en group_members) — solo falta el tipo de notificación.
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'evento_modificado',
      'evento_cancelado',
      'buddy_request',
      'buddy_accepted',
      'event_invite',
      'group_invite',
      'event_left',
      'group_left'
    )
  );
