// Archivo: components/quality-stars.tsx
// Calidad del pavimento (1-5) representada con iconos de estrella.
export function QualityStars({ quality }: { quality: number | null }) {
  const value = quality ?? 0;

  return (
    <span aria-label={`Calidad del pavimento: ${value} de 5`} className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? "text-amber-400" : "text-zinc-700"}>
          ★
        </span>
      ))}
    </span>
  );
}
