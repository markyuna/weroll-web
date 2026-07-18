-- Spots, eventos (randonnées) y asistencia.
--
-- Nota: igual que profiles, estas tres tablas ya existían en el proyecto de
-- Supabase real (creadas fuera de las migraciones del repo). Este archivo
-- documenta el esquema tal como se verificó por introspección vía REST
-- (columnas, CHECK constraints y policies de RLS confirmados en vivo), para
-- que `supabase/migrations` deje de estar desincronizado con la base real.
-- `group_id` y `recurrence_rule` existen en `events` pero no se usan todavía
-- en la app (probablemente para una feature de grupos/recurrencia futura).

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.spots enable row level security;

create policy "Los spots son visibles públicamente"
  on public.spots for select
  using (true);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  group_id uuid,
  spot_id uuid references public.spots (id) on delete set null,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
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
