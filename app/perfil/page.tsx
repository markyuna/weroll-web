// Archivo: app/perfil/page.tsx
// Server Component: privada, requiere sesión. Edita el perfil vía server action
// y lista las próximas randonnées donde el usuario tiene RSVP.
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RSVP_LABELS, RSVP_STYLES, formatEventDateTime } from "@/lib/events";
import { updateProfile } from "./actions";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const success = sp.success === "1";
  const field = (name: string) => (typeof sp[name] === "string" ? (sp[name] as string) : undefined);

  const [{ data: profile }, { data: myRsvps }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, city, country, skate_type, skill_level, bio")
      .eq("id", user.id)
      .single()
      .overrideTypes<
        {
          username: string;
          display_name: string | null;
          city: string | null;
          country: string | null;
          skate_type: string | null;
          skill_level: string | null;
          bio: string | null;
        },
        { merge: false }
      >(),
    supabase
      .from("event_attendees")
      .select("status, events!inner ( id, title, starts_at )")
      .eq("profile_id", user.id)
      .in("status", ["asistire", "tal_vez"])
      .gt("events.starts_at", new Date().toISOString())
      .order("starts_at", { referencedTable: "events", ascending: true })
      .overrideTypes<
        { status: string; events: { id: string; title: string; starts_at: string } }[],
        { merge: false }
      >(),
  ]);

  const defaults = {
    display_name: field("display_name") ?? profile?.display_name ?? "",
    city: field("city") ?? profile?.city ?? "",
    country: field("country") ?? profile?.country ?? "",
    skate_type: field("skate_type") ?? profile?.skate_type ?? "",
    skill_level: field("skill_level") ?? profile?.skill_level ?? "",
    bio: field("bio") ?? profile?.bio ?? "",
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-1">
          Mi <span className="text-amber-400">perfil</span>
        </h1>
        <p className="text-zinc-400 mb-8">
          @{profile?.username} · {user.email}
        </p>

        {error && (
          <p className="text-sm text-red-400 mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-400 mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
            Perfil actualizado.
          </p>
        )}

        <form action={updateProfile} className="space-y-4">
          <div>
            <label htmlFor="display_name" className="block text-sm text-zinc-300 mb-1">
              Nombre visible
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              defaultValue={defaults.display_name}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm text-zinc-300 mb-1">
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                type="text"
                defaultValue={defaults.city}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm text-zinc-300 mb-1">
                País
              </label>
              <input
                id="country"
                name="country"
                type="text"
                defaultValue={defaults.country}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="skate_type" className="block text-sm text-zinc-300 mb-1">
                Tipo de patín
              </label>
              <select
                id="skate_type"
                name="skate_type"
                defaultValue={defaults.skate_type}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Sin especificar</option>
                <option value="inline">Patines en línea</option>
                <option value="quad">Patines de cuatro ruedas</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
            <div>
              <label htmlFor="skill_level" className="block text-sm text-zinc-300 mb-1">
                Nivel
              </label>
              <select
                id="skill_level"
                name="skill_level"
                defaultValue={defaults.skill_level}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Sin especificar</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm text-zinc-300 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={defaults.bio}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-amber-400 text-zinc-950 font-semibold py-2 hover:bg-amber-300 transition"
          >
            Guardar cambios
          </button>
        </form>

        <div className="mt-10">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            Mis próximas randonnées
          </h2>
          {myRsvps && myRsvps.length > 0 ? (
            <ul className="space-y-3">
              {myRsvps.map((rsvp) => (
                <li key={rsvp.events.id}>
                  <Link
                    href={`/eventos/${rsvp.events.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-amber-400 transition"
                  >
                    <div>
                      <p className="text-white font-medium">{rsvp.events.title}</p>
                      <p className="text-sm text-zinc-400">
                        {formatEventDateTime(rsvp.events.starts_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        RSVP_STYLES[rsvp.status] ?? "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {RSVP_LABELS[rsvp.status] ?? rsvp.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">
              Aún no tienes randonnées próximas.{" "}
              <Link href="/eventos" className="text-amber-400 hover:underline">
                Explora eventos
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
