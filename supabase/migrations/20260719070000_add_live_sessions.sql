-- Sesiones en vivo "Roll with me": un usuario anuncia que está patinando
-- ahora mismo; los demás lo ven como marcador en el mapa de /spots en tiempo
-- real (Supabase Realtime) hasta que la sesión expira o la termina.
--
-- Privacidad: latitude/longitude llegan YA redondeadas (~300 m) desde el
-- cliente; la base nunca almacena la posición exacta.
--
-- Terminar antes de tiempo = DELETE de la fila (no un UPDATE de expires_at):
-- los eventos DELETE de Realtime llegan a todos los suscriptores, mientras
-- que un UPDATE que dejara la fila fuera de la policy de SELECT sería
-- filtrado por Realtime y los demás clientes no se enterarían. Las filas
-- expiradas quedan invisibles por la policy y se purgan de forma oportunista
-- (cada usuario borra las suyas al crear una sesión nueva).

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  message text,
  skate_type text check (skate_type in ('inline', 'quad', 'ambos')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint live_sessions_duration_check
    check (expires_at > started_at and expires_at <= started_at + interval '4 hours')
);

create index if not exists live_sessions_expires_at_idx on public.live_sessions (expires_at);
create index if not exists live_sessions_user_id_idx on public.live_sessions (user_id);

alter table public.live_sessions enable row level security;

-- Lectura pública, pero SOLO de sesiones activas: las expiradas desaparecen
-- de las consultas sin necesidad de borrarlas al momento.
create policy "Sesiones activas visibles públicamente"
  on public.live_sessions for select
  using (expires_at > now());

create policy "Un usuario crea sus propias sesiones"
  on public.live_sessions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Un usuario termina sus propias sesiones"
  on public.live_sessions for delete to authenticated
  using (auth.uid() = user_id);

-- Realtime: añadir la tabla a la publicación que usa Supabase Realtime.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'live_sessions'
    )
  then
    alter publication supabase_realtime add table public.live_sessions;
  end if;
end $$;
