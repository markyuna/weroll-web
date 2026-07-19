-- Buddy Match: los campos skill_level y skate_type ya existen en profiles
-- (ver 20260718000000_create_profiles.sql: la tabla real se creó fuera del
-- repo y ambas columnas están confirmadas por introspección, nullable y sin
-- CHECK). Esta migración deja las columnas garantizadas y les añade los
-- CHECK constraints que la app asume:
--   skill_level: principiante | intermedio | avanzado
--   skate_type:  inline | quad | ambos
--
-- NOT VALID: no revalida las filas existentes (podría haber valores legados
-- desconocidos en la base real); solo aplica a escrituras nuevas, que es lo
-- que la app necesita. NULL siempre pasa un CHECK "in (...)".

alter table public.profiles
  add column if not exists skill_level text,
  add column if not exists skate_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_skill_level_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_skill_level_check
      check (skill_level in ('principiante', 'intermedio', 'avanzado')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_skate_type_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_skate_type_check
      check (skate_type in ('inline', 'quad', 'ambos')) not valid;
  end if;
end $$;
