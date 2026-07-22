-- Mensajes del formulario de contacto público. Cualquiera puede enviar uno
-- (autenticado o no); solo se lee desde el cliente admin (dashboard o
-- Server Actions con service_role), nunca desde el propio navegador.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  weroll_nickname text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Cualquiera puede enviar un mensaje de contacto"
  on public.contact_messages for insert
  with check (true);
