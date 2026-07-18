// Archivo: components/spot-report-badge.tsx
// Client component (aunque se use desde Server Components): muestra el
// último reporte de estado de un spot si tiene menos de 24h.
"use client";

import { useLocale, useTranslations } from "next-intl";
import { REPORT_ICONS, type SpotReport } from "@/lib/spot-reports";
import { formatRelativeTime } from "@/lib/relative-time";

export function SpotReportBadge({ report }: { report: SpotReport | null }) {
  const t = useTranslations("SpotReport");
  const locale = useLocale();

  if (!report) return null;

  return (
    <p className="text-xs text-zinc-400 mt-2">
      {REPORT_ICONS[report.report_type] ?? ""} {t(`types.${report.report_type}`)} ·{" "}
      {formatRelativeTime(report.created_at, locale)}
    </p>
  );
}
