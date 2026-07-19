// Archivo: app/[locale]/eventos/loading.tsx
// Skeleton de la lista de randonnées (shimmer ámbar, ver .skeleton).
export default function EventosLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16" aria-busy>
      <div className="mx-auto max-w-3xl">
        <div className="skeleton h-9 w-72 max-w-full rounded-lg" />
        <div className="skeleton mt-3 h-5 w-96 max-w-full rounded-lg" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
