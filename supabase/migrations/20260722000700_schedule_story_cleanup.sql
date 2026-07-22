-- Programa la limpieza horaria de historias caducadas. Separado de
-- 20260722000600 porque pg_cron depende del plan/proyecto de Supabase — si
-- esto falla, las tablas y RLS de historias ya quedaron creadas igual.
create extension if not exists pg_cron with schema extensions;

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'cleanup-expired-event-stories';
exception when others then
  null;
end $$;

select cron.schedule(
  'cleanup-expired-event-stories',
  '0 * * * *',
  $$select public.cleanup_expired_event_stories();$$
);
