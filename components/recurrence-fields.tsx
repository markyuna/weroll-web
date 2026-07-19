// Archivo: components/recurrence-fields.tsx
// Client component: selector de repetición del formulario de nueva randonnée.
// Con "no se repite" muestra el datetime-local de siempre; con una frecuencia
// muestra día de la semana + hora, y el server action calcula la primera
// ocurrencia futura que coincida.
"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { WEEKDAY_CODES, formatRuleWeekday } from "@/lib/recurrence";

const INPUT_CLASS =
  "w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400";

export function RecurrenceFields({
  defaultRecurrence,
  defaultDay,
  defaultTime,
  defaultStartsAt,
}: {
  defaultRecurrence: string;
  defaultDay: string;
  defaultTime: string;
  defaultStartsAt: string;
}) {
  const t = useTranslations("Recurrence");
  const tNuevo = useTranslations("EventoNuevo");
  const locale = useLocale();
  const [recurrence, setRecurrence] = useState(defaultRecurrence || "none");
  const recurring = recurrence !== "none";

  return (
    <>
      <div>
        <label htmlFor="recurrence" className="block text-sm text-zinc-300 mb-1">
          {t("fieldLabel")}
        </label>
        <select
          id="recurrence"
          name="recurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="none">{t("none")}</option>
          <option value="weekly">{t("weekly")}</option>
          <option value="biweekly">{t("biweekly")}</option>
          <option value="monthly">{t("monthly")}</option>
        </select>
      </div>

      {recurring ? (
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recurrence_day" className="block text-sm text-zinc-300 mb-1">
                {t("fieldDay")}
              </label>
              <select
                id="recurrence_day"
                name="recurrence_day"
                required
                defaultValue={defaultDay || "FR"}
                className={INPUT_CLASS}
              >
                {WEEKDAY_CODES.map((code) => {
                  const name = formatRuleWeekday(code, locale);
                  return (
                    <option key={code} value={code}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label htmlFor="recurrence_time" className="block text-sm text-zinc-300 mb-1">
                {t("fieldTime")}
              </label>
              <input
                id="recurrence_time"
                name="recurrence_time"
                type="time"
                required
                defaultValue={defaultTime || "21:00"}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1">{t("firstHint")}</p>
        </div>
      ) : (
        <div>
          <label htmlFor="starts_at" className="block text-sm text-zinc-300 mb-1">
            {tNuevo("fieldStartsAt")}
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={defaultStartsAt}
            className={INPUT_CLASS}
          />
        </div>
      )}
    </>
  );
}
