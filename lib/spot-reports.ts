import type { SupabaseClient } from "@supabase/supabase-js";

export const REPORT_TYPES = [
  "superficie_mojada",
  "obras",
  "vidrios",
  "evento_multitudinario",
  "todo_ok",
] as const;

export const REPORT_ICONS: Record<string, string> = {
  superficie_mojada: "💧",
  obras: "🚧",
  vidrios: "🔺",
  evento_multitudinario: "👥",
  todo_ok: "✅",
};

export type SpotReport = {
  id: string;
  spot_id: string;
  report_type: string;
  comment: string | null;
  created_at: string;
};

// Un reporte por spot: el más reciente de las últimas 24h (si hay).
export async function getRecentReportsBySpot(
  supabase: SupabaseClient
): Promise<Record<string, SpotReport>> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("spot_reports")
    .select("id, spot_id, report_type, comment, created_at")
    .gt("created_at", since)
    .order("created_at", { ascending: false });

  const latestBySpot: Record<string, SpotReport> = {};
  for (const report of (data as SpotReport[] | null) ?? []) {
    if (!latestBySpot[report.spot_id]) {
      latestBySpot[report.spot_id] = report;
    }
  }
  return latestBySpot;
}
