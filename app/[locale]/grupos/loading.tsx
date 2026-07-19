// Archivo: app/[locale]/grupos/loading.tsx
// Skeleton de la lista de grupos.
export default function GruposLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16" aria-busy>
      <div className="mx-auto max-w-3xl">
        <div className="skeleton h-9 w-56 max-w-full rounded-lg" />
        <div className="skeleton mt-3 h-5 w-80 max-w-full rounded-lg" />
        <div className="skeleton mt-6 h-10 rounded-lg" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
