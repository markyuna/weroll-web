// Archivo: app/[locale]/registro/page.tsx
// Página de registro: crea el usuario en auth y su fila en profiles
"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const t = useTranslations("Registro");
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Crear el usuario en Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !data.user) {
      setLoading(false);
      setError(
        signUpError?.message === "User already registered"
          ? t("errorEmailTaken")
          : t("errorGeneric")
      );
      return;
    }

    // 2. Crear su perfil en la tabla profiles
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      username: username.toLowerCase().trim(),
    });

    setLoading(false);

    if (profileError) {
      setError(
        profileError.code === "23505" ? t("errorUsernameTaken") : t("errorProfile")
      );
      return;
    }

    router.push("/bienvenida");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl uppercase leading-[0.95] text-white mb-1 flex items-center gap-2">
          {t.rich("title", {
            amber: (chunks) => <span className="text-gradient-brand">{chunks}</span>,
          })}
          <Image src="/icon_roll.png" alt="WeRoll" width={426} height={363} className="h-10 w-auto" />
        </h1>
        <p className="text-zinc-400 mb-8">{t("subtitle")}</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-zinc-300 mb-1">
              {t("username")}
            </label>
            <input
              id="username"
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-brand text-zinc-950 font-semibold py-2 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-6">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-amber-400 hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
