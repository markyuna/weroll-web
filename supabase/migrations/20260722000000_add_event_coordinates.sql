-- Permite crear una randonnée sin spot: si el organizador no elige uno de la
-- lista, marca un punto suelto en el mapa y se guarda aquí. Nullable y
-- aditiva; spot_id ya era opcional a nivel de base (el bloqueo era solo del
-- formulario).
alter table public.events
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
