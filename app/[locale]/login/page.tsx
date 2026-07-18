// Archivo: app/[locale]/login/page.tsx
// Página de inicio de sesión con email y contraseña
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const t = useTranslations("Login");
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(t("errorInvalid"));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white mb-1">
          We<span className="text-amber-400">Roll</span> 🛼
        </h1>
        <p className="text-zinc-400 mb-8">{t("subtitle")}</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-zinc-300 mb-1">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-zinc-300 mb-1">
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-400 text-zinc-950 font-semibold py-2 hover:bg-amber-300 transition disabled:opacity-50"
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-6">
          {t("noAccount")}{" "}
          <Link href="/registro" className="text-amber-400 hover:underline">
            {t("signupLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
