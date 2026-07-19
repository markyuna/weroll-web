// Archivo: app/[locale]/retos/loading.tsx
// Skeleton del reto semanal (ranking).
export default function RetosLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16" aria-busy>
      <div className="mx-auto max-w-2xl">
        <div className="skeleton h-9 w-64 max-w-full rounded-lg" />
        <div className="skeleton mt-3 h-5 w-80 max-w-full rounded-lg" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-[4.5rem] rounded-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
