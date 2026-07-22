-- Notifica a organizador + asistentes confirmados cuando alguien publica
-- una historia — la señal de "venid ya".
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
      'group_left',
      'invitation_accepted',
      'event_story'
    )
  );
