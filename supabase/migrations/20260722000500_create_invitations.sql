-- Invitaciones a evento/grupo con estado persistente (antes solo se
-- mandaba una notificación "FYI" de tipo event_invite/group_invite sin
-- backing table). target_id es polimórfico (apunta a events o a groups
-- según `type`), por eso no lleva FK — igual que notifications.payload ya
-- guardaba groupId sin FK para group_invite.
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('event', 'group')),
  target_id uuid not null,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint invitations_no_self check (inviter_id <> invitee_id)
);

-- Una sola invitación por (evento/grupo, invitado): declinar bloquea
-- reinvitar al mismo target, tal como pide el flujo.
create unique index if not exists invitations_unique_target_invitee_idx
  on public.invitations (type, target_id, invitee_id);

create index if not exists invitations_invitee_status_idx
  on public.invitations (invitee_id, status);

create index if not exists invitations_target_idx
  on public.invitations (type, target_id);

alter table public.invitations enable row level security;

create policy "Cada quien ve sus invitaciones (enviadas o recibidas)"
  on public.invitations for select
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "El invitador crea la invitación"
  on public.invitations for insert
  with check (auth.uid() = inviter_id);

create policy "El invitado responde su propia invitación"
  on public.invitations for update
  using (auth.uid() = invitee_id)
  with check (auth.uid() = invitee_id);

-- Nuevo tipo de notificación: avisa al invitador cuando aceptan su
-- invitación. event_invite/group_invite se reutilizan (mismo payload +
-- invitationId nuevo) para las notificaciones con botones Aceptar/Rechazar.
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
      'invitation_accepted'
    )
  );
