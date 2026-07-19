-- Spots, eventos (randonnées) y asistencia.
--
-- Nota: igual que profiles, estas tres tablas ya existían en el proyecto de
-- Supabase real (creadas fuera de las migraciones del repo). Este archivo
-- documenta el esquema tal como se verificó por introspección vía REST
-- (columnas, CHECK constraints y policies de RLS confirmados en vivo), para
-- que `supabase/migrations` deje de estar desincronizado con la base real.
-- `recurrence_rule` existe en `events` pero no se usa todavía en la app
-- (probablemente para una feature de recurrencia futura). `group_id` sí se
-- usa (grupo organizador); su FK real se documenta en
-- 20260718000400_create_groups.sql, porque `groups` no existe todavía en
-- este punto de la migración.
--
-- Reglas de ON DELETE verificadas contra pg_catalog/information_schema en
-- la base real (2026-07-19) — cada columna de FK abajo indica la regla
-- real, que no siempre coincide con lo que se podría asumir por defecto.

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  city text,
  country text,
  surface_quality integer check (surface_quality between 1 and 5),
  spot_type text check (spot_type in ('punto_encuentro', 'ruta', 'skatepark', 'pista')),
  photo_url text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.spots enable row level security;

create policy "Los spots son visibles públicamente"
  on public.spots for select
  using (true);

create policy "Un usuario autenticado puede crear spots"
  on public.spots for insert
  with check (auth.uid() = created_by);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  -- FK real hacia public.groups(id) on delete set null, añadida en
  -- 20260718000400_create_groups.sql (groups no existe todavía aquí).
  group_id uuid,
  spot_id uuid references public.spots (id) on delete set null,
  -- Decisión explícita: NO cascadea. Si cascadeara, borrar el perfil de un
  -- organizador borraría en silencio todos sus eventos futuros — y con
  -- ellos, el historial de asistencia (event_attendees) de todos los demás
  -- asistentes, que no tienen nada que ver con esa baja de cuenta. Con
  -- NO ACTION, borrar un perfil que organiza eventos falla hasta que se
  -- reasignen o borren esos eventos explícitamente, evitando la pérdida de
  -- datos de terceros como efecto colateral no intencionado.
  organizer_id uuid not null references public.profiles (id) on delete no action,
  starts_at timestamptz not null,
  ends_at timestamptz,
  distance_km numeric,
  difficulty text check (difficulty in ('principiante', 'intermedio', 'avanzado')),
  max_participants integer,
  status text not null default 'programado',
  recurrence_rule text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Los eventos son visibles públicamente"
  on public.events for select
  using (true);

create policy "Un usuario autenticado puede crear eventos como organizador"
  on public.events for insert
  with check (auth.uid() = organizer_id);

create policy "El organizador puede editar su evento"
  on public.events for update
  using (auth.uid() = organizer_id);

create policy "El organizador puede borrar su evento"
  on public.events for delete
  using (auth.uid() = organizer_id);

create table if not exists public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('asistire', 'tal_vez', 'no_asistire')),
  checked_in boolean not null default false,
  responded_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

alter table public.event_attendees enable row level security;

create policy "La asistencia es visible públicamente"
  on public.event_attendees for select
  using (true);

create policy "Un usuario gestiona su propia asistencia"
  on public.event_attendees for insert
  with check (auth.uid() = profile_id);

create policy "Un usuario actualiza su propia asistencia"
  on public.event_attendees for update
  using (auth.uid() = profile_id);
