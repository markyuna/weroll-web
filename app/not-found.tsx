// Archivo: app/not-found.tsx
// Fallback de la raíz verdadera (fuera de [locale]): solo se usa si el
// propio segmento de idioma no es válido, antes de que exista <html>/<body>.
import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body style={{ background: "#09090b", color: "#fff", fontFamily: "sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>404</h1>
          <p style={{ color: "#a1a1aa" }}>Página no encontrada.</p>
          <Link href="/" style={{ color: "#fbbf24" }}>
            Volver al inicio
          </Link>
        </main>
      </body>
    </html>
  );
}
