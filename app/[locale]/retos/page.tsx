// Archivo: app/[locale]/retos/page.tsx
// Server Component público: reto semanal global — ranking de confirmaciones
// de asistencia de la semana en curso (lunes a domingo, UTC), calculado
// sobre xp_events ('confirmar_asistencia', que solo se otorga una vez por
// evento y usuario). Respeta profiles.hide_from_rankings.
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";

const TOP_N = 10;

// Lunes 00:00 UTC de la semana en curso.
function startOfWeekUtc(now: Date): Date {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday));
}

const DATE_LOCALES: Record<string, string> = { es: "es-ES", en: "en-US", fr: "fr-FR" };

export default async function RetosPage() {
  const t = await getTranslations("Retos");
  const locale = await getLocale();
  const supabase = await createClient();

  const weekStart = startOfWeekUtc(new Date());
  const weekEnd = new Date(weekStart.getTime() + 6 * 86_400_000);

  const [{ data: xpRows }, { data: { user } }] = await Promise.all([
    supabase
      .from("xp_events")
      .select("user_id")
      .eq("action", "confirmar_asistencia")
      .gte("created_at", weekStart.toISOString())
      .overrideTypes<{ user_id: string }[], { merge: false }>(),
    supabase.auth.getUser(),
  ]);

  const countsByUser = new Map<string, number>();
  for (const row of xpRows ?? []) {
    countsByUser.set(row.user_id, (countsByUser.get(row.user_id) ?? 0) + 1);
  }

  type RankedProfile = {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    count: number;
  };
  let ranking: RankedProfile[] = [];
  if (countsByUser.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, hide_from_rankings")
      .in("id", [...countsByUser.keys()])
      .overrideTypes<
        {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          hide_from_rankings: boolean;
        }[],
        { merge: false }
      >();

    ranking = (profiles ?? [])
      .filter((p) => !p.hide_from_rankings)
      .map((p) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        count: countsByUser.get(p.id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count || a.username.localeCompare(b.username));
  }

  // Mi situación: posición en el ranking, u oculto por elección propia.
  let myPosition: number | null = null;
  let iAmHidden = false;
  if (user) {
    const index = ranking.findIndex((p) => p.id === user.id);
    if (index >= 0) {
      myPosition = index + 1;
    } else if (countsByUser.has(user.id)) {
      const { data: me } = await supabase
        .from("profiles")
        .select("hide_from_rankings")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<{ hide_from_rankings: boolean } | null, { merge: false }>();
      iAmHidden = Boolean(me?.hide_from_rankings);
    }
  }

  const dateFormat = new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-1">
          {t.rich("title", {
            amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
          })}
        </h1>
        <p className="text-zinc-400">{t("subtitle")}</p>
        <p className="text-sm text-zinc-500 mb-8">
          {t("weekRange", { from: dateFormat.format(weekStart), to: dateFormat.format(weekEnd) })}
        </p>

        {ranking.length === 0 ? (
          <p className="text-zinc-400">
            {t("empty")}{" "}
            <Link href="/eventos" className="text-amber-400 hover:underline">
              {t("emptyCta")}
            </Link>
          </p>
        ) : (
          <ol className="space-y-3">
            {ranking.slice(0, TOP_N).map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center gap-4 rounded-xl bg-zinc-900 border border-zinc-800 p-4"
              >
                <span
                  className={`w-8 text-center text-lg font-bold ${
                    index === 0 ? "text-amber-400" : "text-zinc-500"
                  }`}
                >
                  {index + 1}
                </span>
                <Avatar username={entry.username} avatarUrl={entry.avatar_url} size={40} />
                <Link
                  href={`/u/${entry.username}`}
                  className="min-w-0 flex-1 truncate text-white font-medium hover:text-amber-400 transition"
                >
                  {entry.display_name || entry.username}
                </Link>
                <span className="shrink-0 rounded-full bg-amber-400/10 text-amber-400 px-2.5 py-1 text-xs font-medium">
                  {t("rsvpCount", { count: entry.count })}
                </span>
              </li>
            ))}
          </ol>
        )}

        {myPosition !== null && (
          <p className="text-sm text-zinc-400 mt-6">{t("yourPosition", { position: myPosition })}</p>
        )}
        {iAmHidden && (
          <p className="text-sm text-zinc-500 mt-6">
            {t("youAreHidden")}{" "}
            <Link href="/perfil" className="text-amber-400 hover:underline">
              {t("youAreHiddenLink")}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
