-- Trazado de ruta por evento: polyline dibujada a mano o importada de GPX,
-- y un spot de pausa opcional en el recorrido.
alter table public.events
  add column if not exists route_polyline jsonb,
  add column if not exists pause_spot_id uuid references public.spots (id) on delete set null;
