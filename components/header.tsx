// Archivo: components/header.tsx
// Server Component: header global con el enlace "Mi perfil" cuando hay sesión.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-white">
          We<span className="text-amber-400">Roll</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-300">
          <Link href="/eventos" className="hover:text-amber-400 transition">
            Eventos
          </Link>
          {user ? (
            <Link href="/perfil" className="hover:text-amber-400 transition">
              Mi perfil
            </Link>
          ) : (
            <Link href="/login" className="hover:text-amber-400 transition">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
