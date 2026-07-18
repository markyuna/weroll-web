// Archivo: components/group-card.tsx
// Tarjeta de grupo: nombre, ciudad/país, nº de miembros, descripción corta.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { GroupCardData } from "@/lib/groups";

export async function GroupCard({ group }: { group: GroupCardData }) {
  const t = await getTranslations("Grupos");
  const memberCount = group.member_count?.[0]?.count ?? 0;
  const location = [group.city, group.country].filter(Boolean).join(", ");

  return (
    <Link
      href={`/grupos/${group.id}`}
      className="block rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-amber-400 transition"
    >
      <h3 className="text-lg font-semibold text-white">{group.name}</h3>
      {location && <p className="text-sm text-zinc-400 mt-1">{location}</p>}
      {group.description && (
        <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{group.description}</p>
      )}
      <p className="text-sm text-amber-400 font-medium mt-4">
        {t("memberCount", { count: memberCount })}
      </p>
    </Link>
  );
}
