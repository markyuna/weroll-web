// Archivo: components/buddy-search.tsx
// Campo de búsqueda de patinadores en /buddies: debounce en cliente,
// resultados vía /api/profiles/search (server-side, máx. 20).
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "./avatar";
import { Card } from "./card";

type SearchResult = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  skate_type: string | null;
};

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export function BuddySearch() {
  const t = useTranslations("Buddies");
  const tSkateType = useTranslations("SkateType");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearched(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="mb-10">
      <label htmlFor="buddy-search" className="block text-sm font-medium text-zinc-300 mb-2">
        {t("searchLabel")}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          aria-hidden
        >
          🔍
        </span>
        <input
          id="buddy-search"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 pl-10 pr-3 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {loading && <p className="text-sm text-zinc-500 mt-3">{t("searchLoading")}</p>}

      {!loading && searched && results.length === 0 && (
        <p className="text-sm text-zinc-500 mt-3">{t("searchEmpty")}</p>
      )}

      {!loading && results.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 mt-4">
          {results.map((profile) => {
            const skateTypeLabel =
              profile.skate_type && tSkateType.has(profile.skate_type)
                ? tSkateType(profile.skate_type)
                : profile.skate_type;

            return (
              <li key={profile.id}>
                <Card href={`/u/${profile.username}`} className="flex items-center gap-3 p-4">
                  <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={44} />
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {profile.display_name || profile.username}
                    </p>
                    <p className="text-sm text-zinc-400 truncate">
                      @{profile.username}
                      {profile.city ? ` · ${profile.city}` : ""}
                      {skateTypeLabel ? ` · ${skateTypeLabel}` : ""}
                    </p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
