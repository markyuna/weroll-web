// Archivo: lib/recurrence.ts
// Reglas de recurrencia de eventos en formato RRULE simplificado:
//   FREQ=WEEKLY;BYDAY=FR;BYHOUR=21;BYMINUTE=0          → cada viernes a las 21:00
//   FREQ=WEEKLY;INTERVAL=2;BYDAY=FR;BYHOUR=21;...      → quincenal
//   FREQ=MONTHLY;BYDAY=2FR;BYHOUR=21;...               → el 2.º viernes de cada mes
//
// Las fechas se calculan en la zona horaria local del proceso, igual que el
// resto de la app (los formularios usan datetime-local y el server action los
// parsea con `new Date(...)` local).

export const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export type RecurrenceFreq = "weekly" | "biweekly" | "monthly";
export const RECURRENCE_FREQS: readonly RecurrenceFreq[] = ["weekly", "biweekly", "monthly"];

export type RecurrenceRule = {
  freq: RecurrenceFreq;
  day: WeekdayCode;
  /** Solo monthly: n-ésimo <día> del mes (1..5), derivado de la primera fecha. */
  nth: number | null;
  hour: number;
  minute: number;
};

// Índice de día de la semana según Date#getDay() (0 = domingo).
const JS_DAY: Record<WeekdayCode, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

export function serializeRule(rule: RecurrenceRule): string {
  const byday = rule.freq === "monthly" ? `${rule.nth ?? 1}${rule.day}` : rule.day;
  return [
    rule.freq === "monthly" ? "FREQ=MONTHLY" : "FREQ=WEEKLY",
    ...(rule.freq === "biweekly" ? ["INTERVAL=2"] : []),
    `BYDAY=${byday}`,
    `BYHOUR=${rule.hour}`,
    `BYMINUTE=${rule.minute}`,
  ].join(";");
}

export function parseRule(raw: string): RecurrenceRule | null {
  const fields = new Map<string, string>();
  for (const part of raw.split(";")) {
    const [key, value] = part.split("=");
    if (key && value) fields.set(key.trim(), value.trim());
  }

  const match = /^([1-5])?([A-Z]{2})$/.exec(fields.get("BYDAY") ?? "");
  const day = match?.[2] as WeekdayCode | undefined;
  if (!day || !(day in JS_DAY)) return null;

  const hour = Number(fields.get("BYHOUR"));
  const minute = Number(fields.get("BYMINUTE"));
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;

  const freq = fields.get("FREQ");
  if (freq === "MONTHLY") {
    const nth = Number(match?.[1] ?? "1");
    if (!Number.isInteger(nth) || nth < 1 || nth > 5) return null;
    return { freq: "monthly", day, nth, hour, minute };
  }
  if (freq === "WEEKLY") {
    const interval = Number(fields.get("INTERVAL") ?? "1");
    if (interval === 1) return { freq: "weekly", day, nth: null, hour, minute };
    if (interval === 2) return { freq: "biweekly", day, nth: null, hour, minute };
  }
  return null;
}

function atRuleTime(rule: RecurrenceRule, year: number, month: number, dayOfMonth: number): Date {
  return new Date(year, month, dayOfMonth, rule.hour, rule.minute, 0, 0);
}

// n-ésimo <día de la semana> del mes, o null si ese mes no lo tiene
// (p. ej. no todos los meses tienen un 5.º viernes).
function nthWeekdayOfMonth(rule: RecurrenceRule, year: number, month: number): Date | null {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (JS_DAY[rule.day] - firstDay + 7) % 7;
  const dayOfMonth = 1 + offset + ((rule.nth ?? 1) - 1) * 7;
  const candidate = atRuleTime(rule, year, month, dayOfMonth);
  return candidate.getMonth() === month ? candidate : null;
}

/**
 * Próximas ocurrencias de la regla, estrictamente posteriores a `after`,
 * ancladas a la fecha del evento base (que define la fase quincenal).
 * `excludeTimes` (epoch ms) permite saltar el propio evento base y las
 * instancias ya materializadas.
 */
export function nextOccurrences(
  rule: RecurrenceRule,
  baseStartsAt: Date,
  options: { after: Date; count: number; excludeTimes?: Set<number> }
): Date[] {
  const { after, count } = options;
  const exclude = options.excludeTimes ?? new Set<number>();
  const result: Date[] = [];
  if (count <= 0) return result;

  if (rule.freq === "monthly") {
    const cursor = new Date(baseStartsAt.getFullYear(), baseStartsAt.getMonth(), 1);
    for (let i = 0; i < 60 && result.length < count; i++) {
      const candidate = nthWeekdayOfMonth(rule, cursor.getFullYear(), cursor.getMonth());
      cursor.setMonth(cursor.getMonth() + 1);
      if (!candidate) continue;
      if (candidate.getTime() < baseStartsAt.getTime()) continue;
      if (candidate.getTime() <= after.getTime()) continue;
      if (exclude.has(candidate.getTime())) continue;
      result.push(candidate);
    }
    return result;
  }

  const stepDays = rule.freq === "biweekly" ? 14 : 7;
  let candidate = atRuleTime(
    rule,
    baseStartsAt.getFullYear(),
    baseStartsAt.getMonth(),
    baseStartsAt.getDate()
  );
  // Por si la fecha base no cae en el día de la regla, avanzar hasta alinear.
  const drift = (JS_DAY[rule.day] - candidate.getDay() + 7) % 7;
  if (drift > 0) {
    candidate = atRuleTime(rule, candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + drift);
  }
  for (let i = 0; i < 300 && result.length < count; i++) {
    if (candidate.getTime() > after.getTime() && !exclude.has(candidate.getTime())) {
      result.push(candidate);
    }
    candidate = atRuleTime(rule, candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + stepDays);
  }
  return result;
}

/**
 * Construye la regla a partir del formulario (frecuencia + día + hora) y
 * calcula la primera ocurrencia: la próxima fecha futura que cae en ese día
 * y hora. Para mensual, el n-ésimo se deriva de esa primera fecha (si cae en
 * el 2.º viernes, la serie es "cada 2.º viernes del mes").
 */
export function buildRule(
  freq: RecurrenceFreq,
  day: WeekdayCode,
  hour: number,
  minute: number,
  from: Date
): { rule: RecurrenceRule; firstOccurrence: Date } {
  let candidate = new Date(from.getFullYear(), from.getMonth(), from.getDate(), hour, minute, 0, 0);
  const drift = (JS_DAY[day] - candidate.getDay() + 7) % 7;
  if (drift > 0) {
    candidate = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + drift, hour, minute);
  }
  if (candidate.getTime() <= from.getTime()) {
    candidate = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 7, hour, minute);
  }
  const rule: RecurrenceRule = {
    freq,
    day,
    nth: freq === "monthly" ? Math.floor((candidate.getDate() - 1) / 7) + 1 : null,
    hour,
    minute,
  };
  return { rule, firstOccurrence: candidate };
}

// Claves de mensaje (namespace "Recurrence") para el resumen traducido
// "Se repite cada viernes a las 21h".
export const RECURRENCE_SUMMARY_KEYS: Record<RecurrenceFreq, string> = {
  weekly: "summaryWeekly",
  biweekly: "summaryBiweekly",
  monthly: "summaryMonthly",
};

const DATE_LOCALES: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
};

export function formatRuleWeekday(day: WeekdayCode, locale: string): string {
  // El 1 de enero de 2023 fue domingo; sumar el índice JS da la fecha de
  // referencia del día buscado.
  const ref = new Date(2023, 0, 1 + JS_DAY[day]);
  return new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? locale, { weekday: "long" }).format(ref);
}

export function formatRuleTime(rule: Pick<RecurrenceRule, "hour" | "minute">, locale: string): string {
  if (locale === "en") {
    const ref = new Date(2023, 0, 1, rule.hour, rule.minute);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: rule.minute === 0 ? undefined : "2-digit",
    }).format(ref);
  }
  // "21h" es la forma coloquial en es/fr cuando la hora es en punto.
  return rule.minute === 0
    ? `${rule.hour}h`
    : `${rule.hour}:${String(rule.minute).padStart(2, "0")}`;
}
