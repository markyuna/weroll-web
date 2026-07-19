// Archivo: components/live-sessions.tsx
// "Roll with me": hook de estado + Realtime, marcadores de avatar sobre el
// mapa de spots y panel de control (empezar/terminar sesión). Los marcadores
// deben renderizarse dentro del MapContainer de spots-map, por eso el estado
// vive en un hook y no en un único componente.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { avatarColor, avatarInitial } from "@/components/avatar";
import {
  LIVE_SESSION_DURATIONS_H,
  roundCoordinate,
  type LiveSession,
  type LiveSessionRow,
} from "@/lib/live-sessions";

const ICON_SIZE = 36;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Avatar circular con borde verde "en vivo"; HTML plano porque los iconos de
// Leaflet no son React (mismo patrón que route-display-map).
function liveAvatarIcon(username: string, avatarUrl: string | null): L.DivIcon {
  let inner: string;
  let background = "#18181b";
  if (avatarUrl) {
    inner = `<img src="${escapeHtml(avatarUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;" />`;
  } else {
    const c = avatarColor(username);
    background = c.background;
    inner = `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;color:${c.color};font-weight:600;font-size:15px;">${escapeHtml(avatarInitial(username))}</span>`;
  }
  return L.divIcon({
    className: "",
    html: `<div style="width:${ICON_SIZE}px;height:${ICON_SIZE}px;border-radius:9999px;border:3px solid #4ade80;background:${background};overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.5);">${inner}</div>`,
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
  });
}

export type CreateSessionError = "location" | "save" | null;

export function useLiveSessions(initialSessions: LiveSession[], userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [sessions, setSessions] = useState<LiveSession[]>(initialSessions);
  const [now, setNow] = useState(() => Date.now());

  // Tic de expiración: filtra sesiones caducadas y refresca el "tiempo
  // restante" de los popups sin recargar.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("live-sessions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_sessions" },
        async (payload) => {
          const row = payload.new as LiveSessionRow;
          // El payload trae solo la fila; el perfil del marcador se trae aparte.
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", row.user_id)
            .maybeSingle();
          setSessions((prev) =>
            prev.some((s) => s.id === row.id)
              ? prev
              : [...prev.filter((s) => s.user_id !== row.user_id), { ...row, profiles: profile ?? null }]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "live_sessions" },
        (payload) => {
          const oldRow = payload.old as Partial<LiveSessionRow>;
          setSessions((prev) => prev.filter((s) => s.id !== oldRow.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const activeSessions = sessions.filter((s) => new Date(s.expires_at).getTime() > now);
  const mySession = userId ? activeSessions.find((s) => s.user_id === userId) ?? null : null;

  async function createSession(durationHours: number, message: string): Promise<CreateSessionError> {
    if (!userId) return "save";

    let position: GeolocationPosition;
    try {
      position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000 })
      );
    } catch {
      return "location";
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, skate_type")
      .eq("id", userId)
      .maybeSingle();

    // Purga oportunista: borra mis sesiones anteriores (activas o expiradas).
    await supabase.from("live_sessions").delete().eq("user_id", userId);

    const { data: row, error } = await supabase
      .from("live_sessions")
      .insert({
        user_id: userId,
        latitude: roundCoordinate(position.coords.latitude),
        longitude: roundCoordinate(position.coords.longitude),
        message: message.trim() || null,
        skate_type: profile?.skate_type ?? null,
        expires_at: new Date(Date.now() + durationHours * 3_600_000).toISOString(),
      })
      .select("id, user_id, latitude, longitude, message, skate_type, started_at, expires_at")
      .single()
      .overrideTypes<LiveSessionRow, { merge: false }>();

    if (error || !row) return "save";

    setSessions((prev) => [
      ...prev.filter((s) => s.user_id !== userId),
      {
        ...row,
        profiles: profile
          ? { username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url }
          : null,
      },
    ]);
    return null;
  }

  async function endSession(): Promise<boolean> {
    if (!mySession) return true;
    const { error } = await supabase.from("live_sessions").delete().eq("id", mySession.id);
    if (error) return false;
    setSessions((prev) => prev.filter((s) => s.id !== mySession.id));
    return true;
  }

  return { activeSessions, mySession, now, createSession, endSession };
}

export function LiveSessionMarkers({
  sessions,
  userId,
  now,
  onEnd,
}: {
  sessions: LiveSession[];
  userId: string | null;
  now: number;
  onEnd: () => Promise<boolean>;
}) {
  const t = useTranslations("LiveSessions");
  const tSkateType = useTranslations("SkateType");

  return (
    <>
      {sessions.map((session) => {
        const username = session.profiles?.username ?? "?";
        const minutesLeft = Math.max(1, Math.round((new Date(session.expires_at).getTime() - now) / 60_000));
        const hoursLeft = Math.floor(minutesLeft / 60);
        return (
          <Marker
            key={session.id}
            position={[session.latitude, session.longitude]}
            icon={liveAvatarIcon(username, session.profiles?.avatar_url ?? null)}
            zIndexOffset={800}
          >
            <Popup className="weroll-popup">
              <div className="min-w-36">
                {session.profiles ? (
                  <Link
                    href={`/u/${session.profiles.username}`}
                    className="font-semibold text-amber-400 hover:underline"
                  >
                    {session.profiles.display_name || session.profiles.username}
                  </Link>
                ) : (
                  <p className="font-semibold text-white">{t("unknownUser")}</p>
                )}
                {session.message && <p className="text-sm text-zinc-300 mt-1">{session.message}</p>}
                {session.skate_type && tSkateType.has(session.skate_type) && (
                  <p className="text-sm text-zinc-400 mt-1">{tSkateType(session.skate_type)}</p>
                )}
                <p className="text-sm text-zinc-400 mt-1">
                  {hoursLeft > 0
                    ? t("timeLeftHours", { hours: hoursLeft, minutes: minutesLeft % 60 })
                    : t("timeLeftMinutes", { minutes: minutesLeft })}
                </p>
                {userId === session.user_id && (
                  <button
                    type="button"
                    onClick={onEnd}
                    className="mt-2 text-sm font-medium text-red-400 hover:underline"
                  >
                    {t("endButton")}
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export function LiveSessionControls({
  userId,
  mySession,
  onCreate,
  onEnd,
}: {
  userId: string | null;
  mySession: LiveSession | null;
  onCreate: (durationHours: number, message: string) => Promise<CreateSessionError>;
  onEnd: () => Promise<boolean>;
}) {
  const t = useTranslations("LiveSessions");
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<number>(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userId) return null;

  async function handleEnd() {
    setBusy(true);
    setError(null);
    const ok = await onEnd();
    if (!ok) setError(t("endError"));
    setBusy(false);
  }

  async function handleStart() {
    setBusy(true);
    setError(null);
    const result = await onCreate(duration, message);
    if (result) {
      setError(t(result === "location" ? "locationError" : "saveError"));
    } else {
      setOpen(false);
      setMessage("");
    }
    setBusy(false);
  }

  const inputClass =
    "w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400";

  return (
    <div className="mb-3">
      {mySession ? (
        <button
          type="button"
          disabled={busy}
          onClick={handleEnd}
          className="rounded-lg border border-red-400/40 text-red-400 font-medium px-4 py-2 text-sm hover:bg-red-400/10 transition disabled:opacity-50"
        >
          {t("endButton")}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={
              open
                ? "rounded-lg border border-zinc-700 text-zinc-300 font-medium px-4 py-2 text-sm hover:border-zinc-500 transition"
                : "rounded-lg bg-emerald-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-emerald-300 transition"
            }
          >
            {open ? t("cancel") : <>🛼 {t("startButton")}</>}
          </button>

          {open && (
            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="live_duration" className="block text-sm text-zinc-300 mb-1">
                    {t("durationLabel")}
                  </label>
                  <select
                    id="live_duration"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className={inputClass}
                  >
                    {LIVE_SESSION_DURATIONS_H.map((hours) => (
                      <option key={hours} value={hours}>
                        {t("durationOption", { hours })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="live_message" className="block text-sm text-zinc-300 mb-1">
                    {t("messageLabel")}
                  </label>
                  <input
                    id="live_message"
                    type="text"
                    maxLength={80}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500">{t("privacyHint")}</p>
              <button
                type="button"
                disabled={busy}
                onClick={handleStart}
                className="rounded-lg bg-emerald-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-emerald-300 transition disabled:opacity-50"
              >
                {t("start")}
              </button>
            </div>
          )}
        </>
      )}
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
