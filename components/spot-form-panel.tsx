// Archivo: components/spot-form-panel.tsx
// Panel/formulario para crear un spot a partir de un punto marcado en el mapa.
import { useTranslations } from "next-intl";
import { StarPicker } from "./star-picker";

export type SpotType = "punto_encuentro" | "ruta" | "skatepark" | "pista";

export type DraftSpot = {
  lat: number;
  lng: number;
  name: string;
  description: string;
  spot_type: SpotType;
  surface_quality: number;
  city: string;
  country: string;
  geocoding: boolean;
  saving: boolean;
  error: string | null;
};

const SPOT_TYPES: SpotType[] = ["punto_encuentro", "ruta", "skatepark", "pista"];

export function SpotFormPanel({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: DraftSpot;
  onChange: (patch: Partial<DraftSpot>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("SpotForm");

  return (
    <div className="mt-4 rounded-xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
          {t("title")}
        </h2>
        <p className="text-xs text-zinc-500">
          {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
        </p>
      </div>

      {draft.error && (
        <p className="text-sm text-red-400 mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2">
          {draft.error}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="draft-name" className="block text-sm text-zinc-300 mb-1">
            {t("fieldName")}
          </label>
          <input
            id="draft-name"
            type="text"
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label htmlFor="draft-description" className="block text-sm text-zinc-300 mb-1">
            {t("fieldDescription")}
          </label>
          <textarea
            id="draft-description"
            rows={3}
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="draft-city" className="block text-sm text-zinc-300 mb-1">
              {t("fieldCity")} {draft.geocoding && <span className="text-zinc-500">{t("searching")}</span>}
            </label>
            <input
              id="draft-city"
              type="text"
              value={draft.city}
              onChange={(e) => onChange({ city: e.target.value })}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label htmlFor="draft-country" className="block text-sm text-zinc-300 mb-1">
              {t("fieldCountry")} {draft.geocoding && <span className="text-zinc-500">{t("searching")}</span>}
            </label>
            <input
              id="draft-country"
              type="text"
              value={draft.country}
              onChange={(e) => onChange({ country: e.target.value })}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <p className="text-xs text-zinc-500 -mt-2">{t("geocodeHint")}</p>

        <div>
          <label htmlFor="draft-type" className="block text-sm text-zinc-300 mb-1">
            {t("fieldType")}
          </label>
          <select
            id="draft-type"
            value={draft.spot_type}
            onChange={(e) => onChange({ spot_type: e.target.value as SpotType })}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {SPOT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`spotType.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="block text-sm text-zinc-300 mb-1">{t("fieldQuality")}</p>
          <StarPicker
            value={draft.surface_quality}
            onChange={(next) => onChange({ surface_quality: next })}
            groupLabel={t("fieldQuality")}
            starLabel={(n) => t("starLabel", { n })}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={draft.saving}
            onClick={onSave}
            className="flex-1 rounded-lg bg-amber-400 text-zinc-950 font-semibold py-2 hover:bg-amber-300 transition disabled:opacity-50"
          >
            {draft.saving ? t("saving") : t("save")}
          </button>
          <button
            type="button"
            disabled={draft.saving}
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 text-zinc-300 font-medium px-4 py-2 hover:border-zinc-500 transition disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
