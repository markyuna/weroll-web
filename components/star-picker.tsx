// Archivo: components/star-picker.tsx
// Selector interactivo de calidad del pavimento (1-5 estrellas).
export function StarPicker({
  value,
  onChange,
  groupLabel,
  starLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  groupLabel: string;
  starLabel: (n: number) => string;
}) {
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label={groupLabel}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={starLabel(n)}
          onClick={() => onChange(n)}
          className={`text-2xl leading-none transition ${
            n <= value ? "text-amber-400" : "text-zinc-700 hover:text-zinc-500"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
