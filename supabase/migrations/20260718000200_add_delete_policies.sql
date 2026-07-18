-- Faltaban policies de DELETE en spots y profiles: sin ellas, un DELETE por
-- REST devuelve 204 pero no borra nada (RLS lo filtra en silencio), lo que
-- llevó a acumular filas de prueba imposibles de limpiar por API.

create policy "borrar mi spot"
  on public.spots for delete
  using (auth.uid() = created_by);

create policy "borrar mi perfil"
  on public.profiles for delete
  using (auth.uid() = id);
