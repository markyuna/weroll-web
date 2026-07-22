// Archivo: lib/notify-contact.ts
// Server-only: emails del formulario de contacto vía Resend. Igual que
// lib/notify-event-change.ts, el envío es best-effort — si Resend falla o
// no hay API key, se registra el error pero nunca se lanza, porque el
// mensaje ya quedó guardado en contact_messages antes de llamar aquí.
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";

const FROM_EMAIL = "WeRoll <onboarding@resend.dev>";

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

function wrapEmailHtml(heading: string, bodyHtml: string) {
  return `
    <div style="font-family:sans-serif;background:#09090b;color:#fafafa;padding:32px;">
      <div style="max-width:480px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;">
        <h1 style="font-size:18px;margin:0 0 4px;">We<span style="color:#fbbf24;">Roll</span></h1>
        <h2 style="font-size:16px;margin:16px 0 12px;color:#fafafa;">${heading}</h2>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyContactMessage({
  locale,
  name,
  email,
  phone,
  werollNickname,
  subject,
  message,
}: {
  locale: string;
  name: string;
  email: string;
  phone: string | null;
  werollNickname: string;
  subject: string;
  message: string;
}) {
  const tEmail = await getTranslations({ locale, namespace: "ContactEmail" });

  const confirmationSubject = tEmail("confirmationSubject");
  const confirmationHtml = wrapEmailHtml(
    confirmationSubject,
    `
      <p style="color:#d4d4d8;font-size:14px;">${tEmail("confirmationIntro", { name: escapeHtml(name) })}</p>
      <div style="background:#111113;border-left:3px solid #fbbf24;padding:12px 16px;margin-top:16px;border-radius:6px;">
        <p style="margin:0;color:#a1a1aa;font-size:13px;"><strong style="color:#e4e4e7;">${tEmail(
          "labelSubject"
        )}:</strong> ${escapeHtml(subject)}</p>
      </div>
      <p style="color:#71717a;font-size:12px;margin-top:20px;">${tEmail("confirmationFooter")}</p>
    `
  );

  const teamEmail = process.env.CONTACT_TEAM_EMAIL;
  const teamSubject = `Nuevo mensaje de contacto: ${subject}`;
  const teamHtml = wrapEmailHtml(
    "Nuevo mensaje de contacto",
    `
      <p style="color:#d4d4d8;font-size:14px;"><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p style="color:#d4d4d8;font-size:14px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="color:#d4d4d8;font-size:14px;"><strong>Teléfono:</strong> ${phone ? escapeHtml(phone) : "No proporcionado"}</p>
      <p style="color:#d4d4d8;font-size:14px;"><strong>Nickname WeRoll:</strong> ${escapeHtml(werollNickname)}</p>
      <p style="color:#d4d4d8;font-size:14px;"><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
      <p style="color:#d4d4d8;font-size:14px;margin-top:12px;white-space:pre-wrap;">${escapeHtml(message)}</p>
    `
  );

  await Promise.all([
    sendEmail(email, confirmationSubject, confirmationHtml),
    teamEmail ? sendEmail(teamEmail, teamSubject, teamHtml) : Promise.resolve(),
  ]);
}
