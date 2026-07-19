// Archivo: app/[locale]/buddies/loading.tsx
// Skeleton de Buddy Match.
export default function BuddiesLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16" aria-busy>
      <div className="mx-auto max-w-3xl">
        <div className="skeleton h-9 w-64 max-w-full rounded-lg" />
        <div className="skeleton mt-3 h-5 w-80 max-w-full rounded-lg" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
