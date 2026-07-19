// Archivo: lib/notify-event-change.ts
// Server-only: crea las notifications in-app y dispara el email vía Resend
// cuando un evento confirmado cambia o se cancela. Se llama desde
// app/[locale]/eventos/[id]/editar/actions.ts tras actualizar/borrar el
// evento. Nunca importar desde un Client Component: usa el SDK de Resend
// y el cliente admin de Supabase (clave secreta).
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { FIELD_LABEL_KEYS, type FieldChange } from "@/lib/notifications";

const FROM_EMAIL = "WeRoll <onboarding@resend.dev>";

async function getAttendeeEmails(admin: SupabaseClient, attendeeIds: string[]) {
  const results = await Promise.all(
    attendeeIds.map(async (id) => {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error || !data.user?.email) return null;
      return data.user.email;
    })
  );
  return results.filter((email): email is string => email !== null);
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error(`RESEND_API_KEY no está configurada; no se envió el email a ${to}.`);
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) console.error(`No se pudo enviar el email a ${to}:`, error.message);
  } catch (err) {
    console.error(`No se pudo enviar el email a ${to}:`, err instanceof Error ? err.message : err);
  }
}

function renderChangesHtml(changes: FieldChange[], fieldLabel: (field: FieldChange["field"]) => string) {
  return changes
    .map(
      (c) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#71717a;">${fieldLabel(c.field)}</td><td style="padding:4px 0;"><span style="color:#a1a1aa;text-decoration:line-through;">${c.before}</span> &rarr; <span style="color:#fbbf24;font-weight:600;">${c.after}</span></td></tr>`
    )
    .join("");
}

function wrapEmailHtml(heading: string, bodyHtml: string, eventUrl: string, ctaLabel: string) {
  return `
    <div style="font-family:sans-serif;background:#09090b;color:#fafafa;padding:32px;">
      <div style="max-width:480px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;">
        <h1 style="font-size:18px;margin:0 0 4px;">We<span style="color:#fbbf24;">Roll</span></h1>
        <h2 style="font-size:16px;margin:16px 0 12px;color:#fafafa;">${heading}</h2>
        ${bodyHtml}
        <a href="${eventUrl}" style="display:inline-block;margin-top:20px;background:#fbbf24;color:#09090b;font-weight:600;text-decoration:none;padding:10px 16px;border-radius:8px;">${ctaLabel}</a>
      </div>
    </div>
  `;
}

export async function notifyEventModified({
  locale,
  eventId,
  eventTitle,
  eventUrl,
  attendeeIds,
  changes,
}: {
  locale: string;
  eventId: string;
  eventTitle: string;
  eventUrl: string;
  attendeeIds: string[];
  changes: FieldChange[];
}) {
  if (attendeeIds.length === 0 || changes.length === 0) return;

  const admin = createAdminClient();
  const payload = { title: eventTitle, changes };

  const { error: insertError } = await admin.from("notifications").insert(
    attendeeIds.map((userId) => ({
      user_id: userId,
      type: "evento_modificado",
      event_id: eventId,
      payload,
    }))
  );
  if (insertError) {
    console.error("No se pudieron crear las notificaciones de cambio:", insertError.message);
  }

  const [tEmail, tFields, emails] = await Promise.all([
    getTranslations({ locale, namespace: "NotificationEmail" }),
    getTranslations({ locale, namespace: "EventoNuevo" }),
    getAttendeeEmails(admin, attendeeIds),
  ]);

  const subject = tEmail("modifiedSubject", { title: eventTitle });
  const bodyHtml = `
    <p style="color:#d4d4d8;font-size:14px;">${tEmail("modifiedIntro", { title: eventTitle })}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;">${renderChangesHtml(
      changes,
      (field) => tFields(FIELD_LABEL_KEYS[field])
    )}</table>
  `;
  const html = wrapEmailHtml(subject, bodyHtml, eventUrl, tEmail("cta"));

  await Promise.all(emails.map((email) => sendEmail(email, subject, html)));
}

export async function notifyEventCancelled({
  locale,
  eventId,
  eventTitle,
  eventUrl,
  attendeeIds,
  startsAt,
  spotName,
}: {
  locale: string;
  eventId: string;
  eventTitle: string;
  eventUrl: string;
  attendeeIds: string[];
  startsAt: string;
  spotName: string | null;
}) {
  if (attendeeIds.length === 0) return;

  const admin = createAdminClient();
  const payload = { title: eventTitle, startsAt, spot: spotName };

  const { error: insertError } = await admin.from("notifications").insert(
    attendeeIds.map((userId) => ({
      user_id: userId,
      type: "evento_cancelado",
      event_id: eventId,
      payload,
    }))
  );
  if (insertError) {
    console.error("No se pudieron crear las notificaciones de cancelación:", insertError.message);
  }

  const [tEmail, emails] = await Promise.all([
    getTranslations({ locale, namespace: "NotificationEmail" }),
    getAttendeeEmails(admin, attendeeIds),
  ]);

  const subject = tEmail("cancelledSubject", { title: eventTitle });
  const bodyHtml = `
    <p style="color:#d4d4d8;font-size:14px;">${tEmail("cancelledIntro", { title: eventTitle })}</p>
    <p style="color:#a1a1aa;font-size:13px;margin-top:8px;">${startsAt}${spotName ? ` &middot; ${spotName}` : ""}</p>
  `;
  const html = wrapEmailHtml(subject, bodyHtml, eventUrl, tEmail("cta"));

  await Promise.all(emails.map((email) => sendEmail(email, subject, html)));
}
