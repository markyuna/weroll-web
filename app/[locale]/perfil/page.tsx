// Archivo: app/[locale]/perfil/page.tsx
// Server Component: privada, requiere sesión. Edita el perfil vía server action
// y lista las próximas randonnées donde el usuario tiene RSVP.
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { RSVP_STYLES, formatEventDateTime } from "@/lib/events";
import { SKATE_TYPES, SKATE_STYLES } from "@/lib/profiles";
import { updateProfile } from "./actions";

const SKILL_LEVELS = ["principiante", "intermedio", "avanzado"] as const;

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("Perfil");
  const tSkateType = await getTranslations("SkateType");
  const tSkateStyle = await getTranslations("SkateStyle");
  const tDifficulty = await getTranslations("Difficulty");
  const tRsvp = await getTranslations("Rsvp");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const success = sp.success === "1";
  const field = (name: string) => (typeof sp[name] === "string" ? (sp[name] as string) : undefined);

  const [{ data: profile }, { data: myRsvps }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, city, country, skate_type, skate_style, skill_level, bio")
      .eq("id", user.id)
      .single()
      .overrideTypes<
        {
          username: string;
          display_name: string | null;
          city: string | null;
          country: string | null;
          skate_type: string | null;
          skate_style: string | null;
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
    skate_style: field("skate_style") ?? profile?.skate_style ?? "",
    skill_level: field("skill_level") ?? profile?.skill_level ?? "",
    bio: field("bio") ?? profile?.bio ?? "",
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-1">
          {t.rich("title", {
            amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
          })}
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
            {t("updated")}
          </p>
        )}

        <form action={updateProfile} className="space-y-4">
          <div>
            <label htmlFor="display_name" className="block text-sm text-zinc-300 mb-1">
              {t("fieldDisplayName")}
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
                {t("fieldCity")}
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
                {t("fieldCountry")}
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
                {t("fieldSkateType")}
              </label>
              <select
                id="skate_type"
                name="skate_type"
                defaultValue={defaults.skate_type}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">{t("unspecified")}</option>
                {SKATE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {tSkateType(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="skill_level" className="block text-sm text-zinc-300 mb-1">
                {t("fieldSkillLevel")}
              </label>
              <select
                id="skill_level"
                name="skill_level"
                defaultValue={defaults.skill_level}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">{t("unspecified")}</option>
                {SKILL_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {tDifficulty(level)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="skate_style" className="block text-sm text-zinc-300 mb-1">
              {t("fieldSkateStyle")}
            </label>
            <select
              id="skate_style"
              name="skate_style"
              defaultValue={defaults.skate_style}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">{t("unspecified")}</option>
              {SKATE_STYLES.map((style) => (
                <option key={style} value={style}>
                  {tSkateStyle(style)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm text-zinc-300 mb-1">
              {t("fieldBio")}
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
            {t("save")}
          </button>
        </form>

        <div id="mis-randonnees" className="mt-10 scroll-mt-24">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            {t("myRidesTitle")}
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
                        {formatEventDateTime(rsvp.events.starts_at, locale)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        RSVP_STYLES[rsvp.status] ?? "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {tRsvp.has(rsvp.status) ? tRsvp(rsvp.status) : rsvp.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">
              {t("noRides")}{" "}
              <Link href="/eventos" className="text-amber-400 hover:underline">
                {t("noRidesCta")}
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
