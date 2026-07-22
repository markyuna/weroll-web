"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitContactForm, type ContactFormErrors } from "./actions";
import { Toast } from "@/components/toast";

export default function ContactPage() {
  const t = useTranslations("Contact");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await submitContactForm(formData);

    if (result.success) {
      setSuccess(true);
      setToast({ message: t("toastSuccess"), type: "success" });
      form.reset();
    } else {
      setErrors(result.errors);
      setToast({
        message: result.errors.submit || t("toastError"),
        type: "error",
      });
    }

    setIsLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="font-display text-4xl text-white mb-4">{t("successTitle")}</h1>
          <p className="text-zinc-400 mb-8">{t("successBody")}</p>
          <Link
            href="/"
            className="inline-block bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 px-8 rounded-full transition-colors"
          >
            {t("successBackHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-20 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4">
            {t("title")}
          </h1>
          <p className="text-zinc-400">{t("subtitle")}</p>
        </div>

        {/* Línea decorativa */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mb-12" />

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-white mb-2">
              {t("fieldName")} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={`w-full bg-zinc-900 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.name ? "border-red-500" : "border-zinc-800"
              }`}
              placeholder={t("fieldNamePlaceholder")}
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-white mb-2">
              {t("fieldEmail")} *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`w-full bg-zinc-900 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.email ? "border-red-500" : "border-zinc-800"
              }`}
              placeholder={t("fieldEmailPlaceholder")}
              required
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-white mb-2">
              {t("fieldPhone")}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`w-full bg-zinc-900 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.phone ? "border-red-500" : "border-zinc-800"
              }`}
              placeholder={t("fieldPhonePlaceholder")}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="weroll_nickname" className="block text-sm font-bold text-white mb-2">
              {t("fieldNickname")} *
            </label>
            <input
              type="text"
              id="weroll_nickname"
              name="weroll_nickname"
              className={`w-full bg-zinc-900 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.weroll_nickname ? "border-red-500" : "border-zinc-800"
              }`}
              placeholder={t("fieldNicknamePlaceholder")}
              required
            />
            {errors.weroll_nickname && (
              <p className="text-red-500 text-sm mt-1">{errors.weroll_nickname}</p>
            )}
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-bold text-white mb-2">
              {t("fieldSubject")} *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className={`w-full bg-zinc-900 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.subject ? "border-red-500" : "border-zinc-800"
              }`}
              placeholder={t("fieldSubjectPlaceholder")}
              required
            />
            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-bold text-white mb-2">
              {t("fieldMessage")} *
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              className={`w-full bg-zinc-900 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition resize-none ${
                errors.message ? "border-red-500" : "border-zinc-800"
              }`}
              placeholder={t("fieldMessagePlaceholder")}
              required
            />
            {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
          </div>

          {errors.submit && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-200">
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-full transition-colors text-lg"
          >
            {isLoading ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
