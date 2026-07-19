// Archivo: scripts/seed-demo-users.ts
// One-off: puebla la base con usuarios de demostración realistas (perfiles,
// RSVPs sobre eventos futuros existentes, spot_reports y un evento nuevo
// con ruta). Pensado para un entorno de demo/staging, no para producción
// con datos reales.
//
// Uso:
//   npx tsx scripts/seed-demo-users.ts            # dry-run, no escribe nada
//   npx tsx scripts/seed-demo-users.ts --apply    # ejecuta de verdad
//
// Requiere en el entorno (se carga automáticamente desde .env.local si
// existe, igual que hace Next.js):
//   SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY   -- nunca hardcodear esta clave
//
// Gamificación: los triggers de xp_events/user_badges (ver
// 20260719000000_add_gamification.sql) están definidos sobre
// events/event_attendees/spots/spot_reports y se disparan solos con los
// inserts reales de este script. Este script NUNCA escribe en xp_events
// ni user_badges directamente.
//
// Idempotencia: cada usuario demo se busca primero por email
// (auth.admin.listUsers), los perfiles se upsertean por id, los RSVPs se
// upsertean por (event_id, profile_id), y los spot_reports / el evento
// demo se comprueban por su clave natural antes de insertar. Correr el
// script dos veces no duplica nada.
//
// Cómo listar y borrar los usuarios demo después: ver el comentario al
// final de este archivo.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// --- Carga manual de .env.local: este script corre fuera del runtime de
// Next.js, que es quien normalmente lo carga. ---
function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Usuarios demo ----------------------------------------------------------
//
// skate_style solo admite estos 4 valores (CHECK de
// 20260718000500_add_skate_style.sql): fitness_distancia, artistico_dance,
// derby, urbano_casual. No existe un valor "freestyle" en el schema real:
// en vez de inventar uno que rompería el CHECK constraint, el quinto
// usuario se deja con skate_style null. Si preferís que reuse uno de los 4
// valores existentes, cambialo abajo antes de --apply.

type DemoUser = {
  email: string;
  username: string;
  display_name: string;
  city: string;
  country: string;
  skate_type: "inline" | "quad" | "ambos";
  skate_style: "fitness_distancia" | "artistico_dance" | "derby" | "urbano_casual" | null;
  skill_level: "principiante" | "intermedio" | "avanzado";
  bio: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "demo1@weroll-demo.test",
    username: "roller_lea",
    display_name: "Léa",
    city: "Paris",
    country: "Francia",
    skate_type: "inline",
    skate_style: "fitness_distancia",
    skill_level: "intermedio",
    bio: "Rodando por el Sena todos los domingos. Fitness skater de corazón.",
  },
  {
    email: "demo2@weroll-demo.test",
    username: "quad_mateo",
    display_name: "Mateo",
    city: "Madrid",
    country: "España",
    skate_type: "quad",
    skate_style: "artistico_dance",
    skill_level: "avanzado",
    bio: "Patín artístico y dance skating. Siempre con música en los cascos.",
  },
  {
    email: "demo3@weroll-demo.test",
    username: "night_skater_75",
    display_name: "Yohann",
    city: "Paris",
    country: "Francia",
    skate_type: "inline",
    skate_style: "derby",
    skill_level: "avanzado",
    bio: "Roller derby entre semana, randonnées nocturnas el finde.",
  },
  {
    email: "demo4@weroll-demo.test",
    username: "patina_urbano_cami",
    display_name: "Camila",
    city: "Barcelona",
    country: "España",
    skate_type: "quad",
    skate_style: "urbano_casual",
    skill_level: "principiante",
    bio: "Empezando en el patinaje urbano, buscando grupo para no rodar sola.",
  },
  {
    email: "demo5@weroll-demo.test",
    username: "rollergirl_manon",
    display_name: "Manon",
    city: "Lyon",
    country: "Francia",
    skate_type: "ambos",
    skate_style: null, // ver nota sobre "freestyle" arriba
    skill_level: "intermedio",
    bio: "Un poco de todo: freestyle, distancia, lo que caiga.",
  },
];

// --- Reportes de spot a crear (comentarios cortos en francés) --------------
const SPOT_REPORT_PLANS: { type: string; comment: string }[] = [
  { type: "todo_ok", comment: "Revêtement nickel ce matin, parfait pour rouler." },
  { type: "superficie_mojada", comment: "Un peu humide côté quai, prudence dans les virages." },
  { type: "obras", comment: "Travaux sur une partie du chemin, il faut contourner." },
];

// --- Evento demo con ruta, organizado por el primer usuario demo -----------
const DEMO_EVENT = {
  title: "Rando demo - Canal Saint-Martin",
  description: "Randonnée tranquille le long du canal, niveau intermédiaire, rythme cool.",
  difficulty: "intermedio",
  distance_km: 8.5,
  // 4 puntos simples: Canal Saint-Martin -> République -> Bastille -> Nation.
  route_polyline: [
    [48.8709, 2.3628],
    [48.8677, 2.3646],
    [48.8646, 2.3707],
    [48.8532, 2.3691],
  ] as [number, number][],
};

function randomPassword() {
  return randomBytes(18).toString("base64url");
}

async function main() {
  console.log(
    APPLY
      ? "MODO: --apply (esto va a escribir en la base)"
      : "MODO: dry-run (no se escribe nada; volvé a correr con --apply para ejecutar)"
  );
  console.log("");

  // 1) Resolver usuarios demo existentes por email.
  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const demoEmails = new Set(DEMO_USERS.map((u) => u.email));
  const existingByEmail = new Map(
    usersPage.users.filter((u) => u.email && demoEmails.has(u.email)).map((u) => [u.email as string, u])
  );

  const usersToCreate = DEMO_USERS.filter((u) => !existingByEmail.has(u.email));
  const usersAlreadyThere = DEMO_USERS.filter((u) => existingByEmail.has(u.email));

  console.log(`Usuarios demo a crear: ${usersToCreate.length}`);
  for (const u of usersToCreate) console.log(`  + ${u.email}  (@${u.username})`);
  console.log(`Usuarios demo ya existentes (se reusan): ${usersAlreadyThere.length}`);
  for (const u of usersAlreadyThere) {
    console.log(`  = ${u.email}  (@${u.username})  id=${existingByEmail.get(u.email)!.id}`);
  }

  const userIdByEmail = new Map<string, string>();
  for (const u of usersAlreadyThere) userIdByEmail.set(u.email, existingByEmail.get(u.email)!.id);

  if (APPLY) {
    for (const u of usersToCreate) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { is_demo: true },
      });
      if (error || !data.user) {
        console.error(`  ! Error creando ${u.email}:`, error?.message);
        continue;
      }
      userIdByEmail.set(u.email, data.user.id);
      console.log(`  + creado ${u.email} -> id ${data.user.id}`);
    }
  }

  // 2) Perfiles. No hay trigger que los cree solo desde auth admin, así que
  //    se upsertean explícitamente (por id) para cada usuario resuelto.
  console.log("");
  console.log(APPLY ? "Perfiles (upsert):" : "Perfiles que se upsertearían:");
  for (const u of DEMO_USERS) {
    const id = userIdByEmail.get(u.email);
    if (!id) {
      console.log(`  - @${u.username}: usuario aún no existe (se creará con --apply)`);
      continue;
    }
    console.log(`  ${APPLY ? "*" : "-"} @${u.username}  skate_style=${u.skate_style ?? "null"}  skill=${u.skill_level}  id=${id}`);
    if (APPLY) {
      const { error } = await admin.from("profiles").upsert(
        {
          id,
          username: u.username,
          display_name: u.display_name,
          city: u.city,
          country: u.country,
          skate_type: u.skate_type,
          skate_style: u.skate_style,
          skill_level: u.skill_level,
          bio: u.bio,
        },
        { onConflict: "id" }
      );
      if (error) console.error(`    ! Error en upsert de perfil @${u.username}:`, error.message);
    }
  }

  // 3) RSVPs sobre eventos futuros existentes: 2-4 asistentes demo por
  //    evento, no todos los usuarios demo en todos los eventos.
  console.log("");
  const { data: upcomingEvents, error: eventsError } = await admin
    .from("events")
    .select("id, title")
    .gt("starts_at", new Date().toISOString())
    .overrideTypes<{ id: string; title: string }[], { merge: false }>();
  if (eventsError) throw eventsError;

  console.log(`Eventos futuros encontrados: ${upcomingEvents?.length ?? 0}`);
  console.log(APPLY ? "Repartiendo RSVPs:" : "RSVPs que se repartirían (la selección real con --apply puede variar, es aleatoria):");

  for (const ev of upcomingEvents ?? []) {
    const shuffled = [...DEMO_USERS].sort(() => Math.random() - 0.5);
    const attendeeCount = Math.min(2 + Math.floor(Math.random() * 3), shuffled.length); // 2-4
    const picked = shuffled.slice(0, attendeeCount).map((u) => ({
      user: u,
      status: Math.random() < 0.7 ? "asistire" : ("tal_vez" as const),
    }));

    console.log(`  ${ev.title}:`);
    for (const p of picked) console.log(`    - @${p.user.username} -> ${p.status}`);

    if (APPLY) {
      for (const p of picked) {
        const profileId = userIdByEmail.get(p.user.email);
        if (!profileId) continue;
        const { error } = await admin
          .from("event_attendees")
          .upsert({ event_id: ev.id, profile_id: profileId, status: p.status }, { onConflict: "event_id,profile_id" });
        if (error) console.error(`      ! Error RSVP @${p.user.username}:`, error.message);
      }
    }
  }

  // 4) Spot reports.
  console.log("");
  const { data: spots, error: spotsError } = await admin
    .from("spots")
    .select("id, name")
    .limit(10)
    .overrideTypes<{ id: string; name: string }[], { merge: false }>();
  if (spotsError) throw spotsError;

  console.log(APPLY ? "Spot reports:" : "Spot reports que se crearían:");
  if (!spots || spots.length === 0) {
    console.log("  (no hay spots existentes, se omite)");
  } else {
    for (let i = 0; i < SPOT_REPORT_PLANS.length; i++) {
      const plan = SPOT_REPORT_PLANS[i];
      const spot = spots[i % spots.length];
      const user = DEMO_USERS[i % DEMO_USERS.length];
      const profileId = userIdByEmail.get(user.email);

      if (APPLY && profileId) {
        const { data: dup } = await admin
          .from("spot_reports")
          .select("id")
          .eq("spot_id", spot.id)
          .eq("profile_id", profileId)
          .eq("comment", plan.comment)
          .maybeSingle();
        if (dup) {
          console.log(`  = ya existe: "${plan.comment}" (${spot.name}, @${user.username})`);
          continue;
        }
        const { error } = await admin.from("spot_reports").insert({
          spot_id: spot.id,
          profile_id: profileId,
          report_type: plan.type,
          comment: plan.comment,
        });
        if (error) console.error(`  ! Error creando reporte en ${spot.name}:`, error.message);
        else console.log(`  + "${plan.comment}" (${spot.name}, @${user.username})`);
      } else {
        console.log(`  - "${plan.comment}" (${spot.name}, @${user.username})`);
      }
    }
  }

  // 5) Evento demo con ruta, organizado por el primer usuario demo.
  console.log("");
  const organizer = DEMO_USERS[0];
  const organizerId = userIdByEmail.get(organizer.email);
  const spotForEvent = spots && spots.length > 0 ? spots[0] : null;
  const startsAt = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000);
  startsAt.setUTCHours(19, 0, 0, 0);

  console.log(`Evento demo: "${DEMO_EVENT.title}" organizado por @${organizer.username}`);
  console.log(`  spot: ${spotForEvent?.name ?? "(sin spots existentes, se crearía sin spot)"}`);
  console.log(`  starts_at: ${startsAt.toISOString()}`);
  console.log(`  route_polyline: ${DEMO_EVENT.route_polyline.length} puntos`);

  if (APPLY && organizerId) {
    const { data: existingDemoEvent } = await admin
      .from("events")
      .select("id")
      .eq("title", DEMO_EVENT.title)
      .eq("organizer_id", organizerId)
      .maybeSingle();

    if (existingDemoEvent) {
      console.log(`  = ya existe (id ${existingDemoEvent.id}), se omite`);
    } else {
      const { data: newEvent, error } = await admin
        .from("events")
        .insert({
          title: DEMO_EVENT.title,
          description: DEMO_EVENT.description,
          organizer_id: organizerId,
          spot_id: spotForEvent?.id ?? null,
          starts_at: startsAt.toISOString(),
          difficulty: DEMO_EVENT.difficulty,
          distance_km: DEMO_EVENT.distance_km,
          route_polyline: DEMO_EVENT.route_polyline,
        })
        .select("id")
        .single();
      if (error || !newEvent) {
        console.error("  ! Error creando evento demo:", error?.message);
      } else {
        console.log(`  + creado (id ${newEvent.id})`);
        // El organizador queda como asistente confirmado, igual que hace
        // el server action de /eventos/nuevo.
        await admin
          .from("event_attendees")
          .upsert({ event_id: newEvent.id, profile_id: organizerId, status: "asistire" }, { onConflict: "event_id,profile_id" });
      }
    }
  }

  console.log("");
  console.log(APPLY ? "Listo." : "Dry-run terminado. Nada se escribió. Corré con --apply para ejecutar de verdad.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/*
Cómo listar los usuarios demo después (SQL Editor):

  select id, email, created_at
  from auth.users
  where raw_user_meta_data->>'is_demo' = 'true';

Cómo eliminarlos: events.organizer_id NO cascadea (on delete no action,
ver 20260718000100_create_events.sql) — hay que ocuparse primero de los
eventos que organizan, o el delete de más abajo falla.

  -- Opción A: borrar directamente sus eventos (arrastra sus
  -- event_attendees vía cascade):
  delete from public.events
  where organizer_id in (
    select id from auth.users where raw_user_meta_data->>'is_demo' = 'true'
  );

  -- Opción B: en vez de borrarlos, reasignarlos a otro organizador:
  -- update public.events set organizer_id = '<otro-id>'
  -- where organizer_id in (
  --   select id from auth.users where raw_user_meta_data->>'is_demo' = 'true'
  -- );

Luego, borrar los perfiles (esto sí cascada sobre event_attendees,
spot_reports, notifications, xp_events y user_badges sin problema):

  delete from public.profiles
  where id in (
    select id from auth.users where raw_user_meta_data->>'is_demo' = 'true'
  );

Y por último, los usuarios de auth (requiere privilegios sobre el esquema
auth desde el SQL Editor, o el Admin API con
auth.admin.deleteUser(id) por cada id de la primera consulta):

  delete from auth.users
  where raw_user_meta_data->>'is_demo' = 'true';
*/
