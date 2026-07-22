-- Usuario de Instagram del perfil (sin @, en minúsculas — normalizado en
-- app vía lib/instagram.ts). Sin OAuth ni API de Meta: es un campo de texto
-- introducido a mano, no verificado.
alter table public.profiles
  add column if not exists instagram_handle text;

-- Reglas de Instagram: 1-30 caracteres, letras/números/punto/guion bajo,
-- no puede empezar ni terminar en punto ni tener dos puntos seguidos.
alter table public.profiles
  drop constraint if exists profiles_instagram_handle_format;

alter table public.profiles
  add constraint profiles_instagram_handle_format check (
    instagram_handle is null
    or (
      instagram_handle ~ '^[a-z0-9_](\.?[a-z0-9_]){0,29}$'
      and length(instagram_handle) <= 30
    )
  );

comment on column public.profiles.instagram_handle is
  'Usuario de Instagram sin @, en minúsculas. Introducido a mano, no verificado.';

-- Nota RLS: no se toca ninguna policy. "lectura publica" (profiles for
-- select using (true), sin restringir a un rol) ya expone todo el perfil
-- públicamente — es el mismo comportamiento de siempre para username,
-- avatar_url, city, etc., que /u/[username] ya muestra sin sesión. Este
-- campo queda expuesto en las mismas condiciones, no es una regresión.
