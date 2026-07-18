// Archivo: app/[locale]/grupos/[id]/page.tsx
// Server Component: detalle de un grupo, miembros y próximas randonnées.
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingEvents } from "@/lib/events";
import { EventCard } from "@/components/event-card";
import { JoinLeaveButton } from "./join-leave-button";

export default async function GrupoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Grupos");
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, description, city, country")
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<
      { id: string; name: string; description: string | null; city: string | null; country: string | null } | null,
      { merge: false }
    >();

  if (!group) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: members }, { data: events }] = await Promise.all([
    supabase
      .from("group_members")
      .select("role, profiles ( username )")
      .eq("group_id", id)
      .order("joined_at", { ascending: true })
      .overrideTypes<{ role: string; profiles: { username: string } | null }[], { merge: false }>(),
    getUpcomingEvents(supabase, { groupId: id }),
  ]);

  const { data: myMembership } = user
    ? await supabase
        .from("group_members")
        .select("profile_id")
        .eq("group_id", id)
        .eq("profile_id", user.id)
        .maybeSingle()
    : { data: null };
  const location = [group.city, group.country].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/grupos" className="text-sm text-amber-400 hover:underline">
          {t("back")}
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4">{group.name}</h1>
        {location && <p className="text-zinc-400 mt-1">{location}</p>}
        {group.description && (
          <p className="text-zinc-200 mt-6 leading-relaxed">{group.description}</p>
        )}

        <div className="mt-6">
          <JoinLeaveButton
            groupId={group.id}
            userId={user?.id ?? null}
            isMember={!!myMembership}
          />
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            {t("membersTitle", { count: members?.length ?? 0 })}
          </h2>
          {members && members.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {members.map((m, i) =>
                m.profiles?.username ? (
                  <li key={i}>
                    <Link
                      href={`/u/${m.profiles.username}`}
                      className="block rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:border-amber-400 hover:text-amber-400 transition"
                    >
                      {m.profiles.username}
                      {m.role === "admin" ? " ★" : ""}
                    </Link>
                  </li>
                ) : null
              )}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">{t("noMembers")}</p>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            {t("upcomingTitle")}
          </h2>
          {events && events.length > 0 ? (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">{t("noEvents")}</p>
          )}
        </div>
      </div>
    </main>
  );
}
