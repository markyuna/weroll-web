alter table public.profiles
  add column if not exists skate_style text
  check (skate_style in ('fitness_distancia', 'artistico_dance', 'derby', 'urbano_casual'));
