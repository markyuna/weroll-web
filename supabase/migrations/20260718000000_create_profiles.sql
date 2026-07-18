-- Tabla de perfiles públicos, uno por usuario de auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Los perfiles son visibles públicamente"
  on public.profiles for select
  using (true);

create policy "Un usuario puede crear su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Un usuario puede actualizar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);
