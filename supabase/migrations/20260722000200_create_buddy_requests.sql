-- Sistema de buddies real: solicitudes con estado persistente entre dos
-- perfiles, en vez de solo la sugerencia de compatibilidad de getBuddies().

create table if not exists public.buddy_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint buddy_requests_no_self check (requester_id <> addressee_id)
);

-- Un único registro por par de usuarios sin importar quién es requester y
-- quién addressee (least/greatest normaliza el par). Volver a pedirse tras
-- un "declined" reutiliza y actualiza la misma fila en vez de insertar otra.
create unique index if not exists buddy_requests_unique_pair_idx
  on public.buddy_requests (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists buddy_requests_addressee_status_idx
  on public.buddy_requests (addressee_id, status);

create index if not exists buddy_requests_requester_status_idx
  on public.buddy_requests (requester_id, status);

alter table public.buddy_requests enable row level security;

create policy "Cada uno ve sus propias solicitudes de buddy"
  on public.buddy_requests for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Un usuario crea una solicitud como requester"
  on public.buddy_requests for insert
  with check (auth.uid() = requester_id);

-- Update cubre dos casos: el addressee acepta/rechaza, y el requester
-- reenvía una solicitud previamente rechazada (vuelve a 'pending').
create policy "Cada parte gestiona su propia solicitud"
  on public.buddy_requests for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Nuevos tipos de notificación para el flujo de buddies. Las filas se crean
-- desde el servidor con el cliente admin (igual que evento_modificado/
-- evento_cancelado en 20260719020000_create_notifications.sql), porque quien
-- dispara la notificación no es el user_id de la fila insertada.
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'evento_modificado',
      'evento_cancelado',
      'buddy_request',
      'buddy_accepted',
      'event_invite'
    )
  );
