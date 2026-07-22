// Archivo: app/[locale]/grupos/[id]/join-leave-button.tsx
// Client component: único elemento interactivo de la página del grupo.
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { leaveGroup } from "./actions";

export function JoinLeaveButton({
  groupId,
  userId,
  isMember,
}: {
  groupId: string;
  userId: string | null;
  isMember: boolean;
}) {
  const t = useTranslations("Grupos");
  const router = useRouter();
  const supabase = createClient();
  const [member, setMember] = useState(isMember);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    return (
      <p className="text-sm text-zinc-400">
        <Link href="/login" className="text-amber-400 hover:underline">
          {t("loginPromptLink")}
        </Link>{" "}
        {t("loginPromptSuffix")}
      </p>
    );
  }

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      if (member) {
        const result = await leaveGroup(groupId);
        if (result.error) {
          setError(t("membershipError"));
          return;
        }
      } else {
        const { error: upsertError } = await supabase
          .from("group_members")
          .upsert(
            { group_id: groupId, profile_id: userId, role: "member" },
            { onConflict: "group_id,profile_id" }
          );

        if (upsertError) {
          setError(t("membershipError"));
          return;
        }
      }

      setMember((v) => !v);
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={handleToggle}
        className={
          member
            ? "rounded-lg border border-zinc-700 text-zinc-300 font-medium px-4 py-2 hover:border-zinc-500 transition disabled:opacity-50"
            : "rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 hover:bg-amber-300 transition disabled:opacity-50"
        }
      >
        {member ? t("leave") : t("join")}
      </button>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
