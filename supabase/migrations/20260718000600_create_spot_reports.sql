-- Reportes de estado de spots al estilo Waze: cualquiera puede leerlos, solo
-- el autor puede insertar en su propio nombre o borrar su propio reporte.
create table if not exists public.spot_reports (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  report_type text not null check (
    report_type in ('superficie_mojada', 'obras', 'vidrios', 'evento_multitudinario', 'todo_ok')
  ),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.spot_reports enable row level security;

create policy "Los reportes son visibles públicamente"
  on public.spot_reports for select
  using (true);

create policy "Un usuario puede crear su propio reporte"
  on public.spot_reports for insert
  with check (auth.uid() = profile_id);

create policy "Un usuario puede borrar su propio reporte"
  on public.spot_reports for delete
  using (auth.uid() = profile_id);
