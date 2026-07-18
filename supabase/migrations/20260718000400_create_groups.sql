-- groups y group_members ya existían en el proyecto real de Supabase (creadas
-- fuera de las migraciones del repo, igual que spots/events). Documenta el
-- esquema real verificado por introspección y añade la policy de UPDATE que
-- faltaba (los admins no podían editar el grupo: sin ella, un PATCH devuelve
-- 200 con 0 filas afectadas en vez de aplicar el cambio).

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  city text not null,
  country text not null,
  cover_url text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "Los grupos son visibles públicamente"
  on public.groups for select
  using (true);

create policy "Un usuario autenticado puede crear grupos"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Un admin del grupo puede editarlo"
  on public.groups for update
  using (
    exists (
      select 1
      from public.group_members
      where group_members.group_id = groups.id
        and group_members.profile_id = auth.uid()
        and group_members.role = 'admin'
    )
  );

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

alter table public.group_members enable row level security;

create policy "La membresía es visible públicamente"
  on public.group_members for select
  using (true);

create policy "Un usuario puede unirse a un grupo"
  on public.group_members for insert
  with check (auth.uid() = profile_id);

create policy "Un usuario puede salir de un grupo"
  on public.group_members for delete
  using (auth.uid() = profile_id);
