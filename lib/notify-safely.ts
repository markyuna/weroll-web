// Archivo: lib/notify-safely.ts
// Envuelve el insert de notifications vía cliente admin en un try/catch:
// notificar a alguien es un efecto secundario, nunca debería tumbar la
// acción principal (aceptar una solicitud, invitar, salir de un evento...)
// si createAdminClient() falla (p. ej. una env var ausente) o el insert
// da error. Sin esto, cada llamador tenía que acordarse de blindarlo por
// su cuenta — y varios no lo hacían, causando el "server error" reportado
// aunque la acción principal ya se hubiera guardado bien.
import { createAdminClient } from "./supabase/admin";

export async function notifySafely(rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(rows);
    if (error) console.error("No se pudo crear la notificación:", error.message);
  } catch (err) {
    console.error("No se pudo crear la notificación:", err instanceof Error ? err.message : err);
  }
}
