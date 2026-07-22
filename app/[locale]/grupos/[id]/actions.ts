// Archivo: app/[locale]/grupos/[id]/actions.ts
// Server Action: salir de un grupo. El delete lo cubre RLS (cada quien
// borra su propia fila), pero notificar al resto de miembros necesita el
// cliente admin porque su user_id no es el auth.uid() actual.
"use server";

import { createClient } from "@/lib/supabase/server";
import { notifySafely } from "@/lib/notify-safely";

export async function leaveGroup(groupId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const [{ data: group }, { data: me }, { data: remainingMembers }] = await Promise.all([
    supabase.from("groups").select("name").eq("id", groupId).single(),
    supabase.from("profiles").select("username, display_name").eq("id", user.id).single(),
    supabase.from("group_members").select("profile_id").eq("group_id", groupId).neq("profile_id", user.id),
  ]);

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("profile_id", user.id);

  if (error) return { error: "submit" };

  const recipients = (remainingMembers ?? []).map((m) => m.profile_id as string);
  if (recipients.length > 0 && group) {
    await notifySafely(
      recipients.map((profileId) => ({
        user_id: profileId,
        type: "group_left",
        payload: {
          title: group.name,
          fromUsername: me?.username ?? "",
          fromDisplayName: me?.display_name ?? null,
          groupId,
        },
      }))
    );
  }

  return {};
}
