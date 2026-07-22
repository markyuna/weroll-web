-- Nuevo tipo de notificación: invitar buddies al crear un grupo. No hay
-- columna group_id en notifications (solo event_id); el id del grupo viaja
-- en el payload jsonb y components/notification-list-item.tsx arma el
-- enlace a /grupos/{groupId} a partir de ahí.
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
      'group_invite'
    )
  );
