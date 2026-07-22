"use server";

import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { notifyContactMessage } from "@/lib/notify-contact";

export type ContactFormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  weroll_nickname?: string;
  subject?: string;
  message?: string;
  submit?: string;
};

export type ContactFormResult =
  | { success: true }
  | { success: false; errors: ContactFormErrors };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone) return true; // opcional
  return phone.replace(/\D/g, "").length >= 8;
}

export async function submitContactForm(formData: FormData): Promise<ContactFormResult> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const werollNickname = String(formData.get("weroll_nickname") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const message = String(formData.get("message") ?? "");

  const errors: ContactFormErrors = {};

  if (!name || name.trim().length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres";
  }
  if (!email || !validateEmail(email)) {
    errors.email = "Por favor ingresa un email válido";
  }
  if (phone && !validatePhone(phone)) {
    errors.phone = "El teléfono no es válido";
  }
  if (!werollNickname || werollNickname.trim().length < 2) {
    errors.weroll_nickname = "El nickname de WeRoll es obligatorio";
  }
  if (!subject || subject.trim().length < 3) {
    errors.subject = "El asunto debe tener al menos 3 caracteres";
  }
  if (!message || message.trim().length < 10) {
    errors.message = "El mensaje debe tener al menos 10 caracteres";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const trimmedPhone = phone.trim() || null;

  const supabase = await createClient();
  const { error: dbError } = await supabase.from("contact_messages").insert({
    name: name.trim(),
    email: email.trim(),
    phone: trimmedPhone,
    weroll_nickname: werollNickname.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });

  if (dbError) {
    console.error("Supabase error al guardar mensaje de contacto:", dbError.message);
    return { success: false, errors: { submit: "No se pudo guardar el mensaje. Inténtalo de nuevo." } };
  }

  // El mensaje ya está guardado: el envío de emails es best-effort y nunca
  // debe hacer fallar la petición (Resend en modo sandbox, sin dominio
  // verificado, puede no entregar a direcciones externas).
  const locale = await getLocale();
  await notifyContactMessage({
    locale,
    name: name.trim(),
    email: email.trim(),
    phone: trimmedPhone,
    werollNickname: werollNickname.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });

  return { success: true };
}
