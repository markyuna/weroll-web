// Archivo: app/[locale]/eventos/[id]/editar/page.tsx
// Server Component: formulario de edición, solo para el organizador.
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteEventButton } from "@/components/delete-event-button";
import { updateEvent, deleteEvent } from "./actions";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditarEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("EventoNuevo");
  const tEdit = await getTranslations("EventoEditar");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, organizer_id, spot_id, starts_at, distance_km, max_participants, difficulty")
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<
      {
        id: string;
        title: string;
        description: string | null;
        organizer_id: string;
        spot_id: string | null;
        starts_at: string;
        distance_km: number | null;
        max_participants: number | null;
        difficulty: string | null;
      } | null,
      { merge: false }
    >();

  if (!event) notFound();
  if (event.organizer_id !== user.id) {
    redirect({ href: `/eventos/${id}`, locale });
    return;
  }

  const { data: spots } = await supabase
    .from("spots")
    .select("id, name, city")
    .order("name", { ascending: true })
    .overrideTypes<{ id: string; name: string; city: string | null }[], { merge: false }>();

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const field = (name: string, fallback: string) =>
    typeof sp[name] === "string" ? (sp[name] as string) : fallback;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Link href={`/eventos/${id}`} className="text-sm text-amber-400 hover:underline">
          {tEdit("back")}
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4 mb-1">
          {tEdit.rich("title", {
            amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
          })}
        </h1>
        <p className="text-zinc-400 mb-8">{tEdit("subtitle")}</p>

        {error && (
          <p className="text-sm text-red-400 mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2">
            {error}
          </p>
        )}

        <form action={updateEvent.bind(null, id)} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm text-zinc-300 mb-1">
              {t("fieldTitle")}
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={field("title", event.title)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm text-zinc-300 mb-1">
              {t("fieldDescription")}
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              defaultValue={field("description", event.description ?? "")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="spot_id" className="block text-sm text-zinc-300 mb-1">
              {t("fieldSpot")}
            </label>
            <select
              id="spot_id"
              name="spot_id"
              required
              defaultValue={field("spot_id", event.spot_id ?? "")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="" disabled>
                {t("fieldSpotPlaceholder")}
              </option>
              {spots?.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                  {spot.city ? ` — ${spot.city}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="starts_at" className="block text-sm text-zinc-300 mb-1">
              {t("fieldStartsAt")}
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              defaultValue={field("starts_at", toLocalInputValue(event.starts_at))}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="distance_km" className="block text-sm text-zinc-300 mb-1">
                {t("fieldDistance")}
              </label>
              <input
                id="distance_km"
                name="distance_km"
                type="number"
                min="0"
                step="0.01"
                placeholder={t("fieldDistancePlaceholder")}
                defaultValue={field("distance_km", event.distance_km != null ? String(event.distance_km) : "")}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label htmlFor="max_participants" className="block text-sm text-zinc-300 mb-1">
                {t("fieldMaxParticipants")}
              </label>
              <input
                id="max_participants"
                name="max_participants"
                type="number"
                min="1"
                step="1"
                placeholder={t("fieldMaxParticipantsPlaceholder")}
                defaultValue={field(
                  "max_participants",
                  event.max_participants != null ? String(event.max_participants) : ""
                )}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm text-zinc-300 mb-1">
              {t("fieldDifficulty")}
            </label>
            <select
              id="difficulty"
              name="difficulty"
              required
              defaultValue={field("difficulty", event.difficulty ?? "")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="" disabled>
                {t("fieldDifficultyPlaceholder")}
              </option>
              <option value="principiante">{t("difficultyPrincipiante")}</option>
              <option value="intermedio">{t("difficultyIntermedio")}</option>
              <option value="avanzado">{t("difficultyAvanzado")}</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-amber-400 text-zinc-950 font-semibold py-2 hover:bg-amber-300 transition"
          >
            {tEdit("submit")}
          </button>
        </form>

        <div className="mt-6 border-t border-zinc-800 pt-6">
          <DeleteEventButton onDelete={deleteEvent.bind(null, id)} />
        </div>
      </div>
    </main>
  );
}
