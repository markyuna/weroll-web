-- Notificaciones a asistentes cuando un evento confirmado cambia o se cancela.
--
-- Solo hay policies de select/update para "authenticated" (leer y marcar
-- como leídas las propias). No se define policy de insert: las filas se
-- crean desde el servidor con el cliente admin (lib/supabase/admin.ts,
-- clave secreta), que bypassea RLS, porque quien dispara la notificación
-- (el organizador) no es el "user_id" de la fila que se inserta.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('evento_modificado', 'evento_cancelado')),
  event_id uuid references public.events (id) on delete set null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Un usuario lee sus propias notificaciones"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Un usuario marca como leídas sus propias notificaciones"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
