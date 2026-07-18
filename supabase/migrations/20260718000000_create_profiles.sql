-- Tabla de perfiles públicos, uno por usuario de auth.users.
--
-- Nota: esta migración se corrigió tras inspeccionar el esquema real ya
-- desplegado en el proyecto de Supabase (creado fuera de las migraciones
-- del repo). Las columnas siguientes están confirmadas por introspección
-- vía REST; los tipos de display_name/avatar_url/city/country/skate_type/
-- skill_level/bio son la mejor aproximación (nullable, sin CHECK conocido)
-- y conviene revisarlos contra la base real si se necesita precisión total.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  city text,
  country text,
  skate_type text,
  skill_level text,
  bio text,
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
