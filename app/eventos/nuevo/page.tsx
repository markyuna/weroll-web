// Archivo: app/eventos/nuevo/page.tsx
// Server Component: solo para usuarios autenticados; redirige a /login si no hay sesión.
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "./actions";

export default async function NuevoEventoPage({
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
  const field = (name: string) => (typeof sp[name] === "string" ? (sp[name] as string) : "");

  const { data: spots } = await supabase
    .from("spots")
    .select("id, name, city")
    .order("name", { ascending: true })
    .overrideTypes<{ id: string; name: string; city: string | null }[], { merge: false }>();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/eventos" className="text-sm text-amber-400 hover:underline">
          ← Volver a eventos
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4 mb-1">
          Crear <span className="text-amber-400">randonnée</span>
        </h1>
        <p className="text-zinc-400 mb-8">
          Organiza una nueva ruta. Quedarás como asistente confirmado automáticamente.
        </p>

        {error && (
          <p className="text-sm text-red-400 mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2">
            {error}
          </p>
        )}

        <form action={createEvent} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm text-zinc-300 mb-1">
              Título
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={field("title")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm text-zinc-300 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              defaultValue={field("description")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="spot_id" className="block text-sm text-zinc-300 mb-1">
              Spot
            </label>
            <select
              id="spot_id"
              name="spot_id"
              required
              defaultValue={field("spot_id")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="" disabled>
                Selecciona un spot
              </option>
              {spots?.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                  {spot.city ? ` — ${spot.city}` : ""}
                </option>
              ))}
            </select>
            {(!spots || spots.length === 0) && (
              <p className="text-xs text-zinc-500 mt-1">Todavía no hay spots disponibles.</p>
            )}
          </div>

          <div>
            <label htmlFor="starts_at" className="block text-sm text-zinc-300 mb-1">
              Fecha y hora de inicio
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              defaultValue={field("starts_at")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="distance_km" className="block text-sm text-zinc-300 mb-1">
                Distancia (km)
              </label>
              <input
                id="distance_km"
                name="distance_km"
                type="number"
                min="0"
                step="0.1"
                placeholder="Opcional"
                defaultValue={field("distance_km")}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label htmlFor="max_participants" className="block text-sm text-zinc-300 mb-1">
                Máx. participantes
              </label>
              <input
                id="max_participants"
                name="max_participants"
                type="number"
                min="1"
                step="1"
                placeholder="Sin límite"
                defaultValue={field("max_participants")}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm text-zinc-300 mb-1">
              Dificultad
            </label>
            <select
              id="difficulty"
              name="difficulty"
              required
              defaultValue={field("difficulty")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="" disabled>
                Selecciona una dificultad
              </option>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-amber-400 text-zinc-950 font-semibold py-2 hover:bg-amber-300 transition"
          >
            Crear randonnée
          </button>
        </form>
      </div>
    </main>
  );
}
