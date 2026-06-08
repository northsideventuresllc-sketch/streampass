"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StreamingSearchBar } from "@/components/streaming-search-bar";
import { StreamingSearchResultCard } from "@/components/streaming-search-result-card";
import { addToWatchlist } from "@/lib/watchlist-add";
import { addToPassport } from "@/lib/passport-add";
import type { StreamingSearchHit, StreamingSearchSuggestion } from "@/lib/tmdb/types";
import type { TrackedTitle, WatchlistItem } from "@/lib/types";

interface StreamingSearchPanelProps {
  initialWatchlist?: WatchlistItem[];
  initialTrackedTitles?: TrackedTitle[];
  variant?: "page" | "embedded";
}

async function fetchResults(query: string): Promise<StreamingSearchHit[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const data = (await res.json()) as {
    results?: StreamingSearchHit[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || "Search failed");
  return data.results ?? [];
}

async function fetchTitleAvailability(
  suggestion: StreamingSearchSuggestion
): Promise<StreamingSearchHit[]> {
  const params = new URLSearchParams({
    id: String(suggestion.externalId),
    type: suggestion.mediaType,
  });
  const res = await fetch(`/api/search?${params.toString()}`);
  const data = (await res.json()) as {
    results?: StreamingSearchHit[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || "Search failed");
  return data.results ?? [];
}

export function StreamingSearchPanel({
  initialWatchlist = [],
  initialTrackedTitles = [],
  variant = "page",
}: StreamingSearchPanelProps) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [lockedQuery, setLockedQuery] = useState<string | null>(null);
  const [results, setResults] = useState<StreamingSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [trackedTitles, setTrackedTitles] = useState(initialTrackedTitles);
  const [addingPlatform, setAddingPlatform] = useState<string | null>(null);
  const [addingPassportPlatform, setAddingPassportPlatform] = useState<string | null>(null);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const [addedPassportKeys, setAddedPassportKeys] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const runSearch = useCallback(async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (trimmed.length < 2) return;

    setLockedQuery(trimmed);
    setLoading(true);
    setError(null);

    try {
      const hits = await fetchResults(trimmed);
      setResults(hits);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleSelectSuggestion(suggestion: StreamingSearchSuggestion) {
    setLockedQuery(suggestion.title);
    setLoading(true);
    setError(null);

    try {
      const hits = await fetchTitleAvailability(suggestion);
      setResults(hits);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(hit: StreamingSearchHit, platform: string) {
    setAddingPlatform(platform);
    setToast(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setToast("Sign in to save titles to your watchlist.");
      setAddingPlatform(null);
      return;
    }

    const { data, error: addError } = await addToWatchlist(
      supabase,
      user.id,
      watchlist,
      {
        title: hit.title,
        platform,
        externalId: hit.externalId,
        mediaType: hit.mediaType,
        posterUrl: hit.posterUrl,
        releaseYear: hit.releaseYear,
      }
    );

    if (addError) {
      setToast(addError);
    } else if (data) {
      setWatchlist((prev) => [...prev, data]);
      setAddedKeys((prev) => new Set(prev).add(`${hit.externalId}:${platform}`));
      setToast(`Added "${hit.title}" on ${platform}.`);
    }

    setAddingPlatform(null);
  }

  async function handleAddToPassport(hit: StreamingSearchHit, platform: string) {
    setAddingPassportPlatform(platform);
    setToast(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setToast("Sign in to track titles in your passport.");
      setAddingPassportPlatform(null);
      return;
    }

    const { data, error: addError } = await addToPassport(
      supabase,
      user.id,
      trackedTitles,
      { title: hit.title, platform }
    );

    if (addError) {
      setToast(addError);
    } else if (data) {
      setTrackedTitles((prev) => [data, ...prev]);
      setAddedPassportKeys((prev) =>
        new Set(prev).add(`${hit.externalId}:${platform}`)
      );
      setToast(`Now tracking "${hit.title}" on ${platform}.`);
    }

    setAddingPassportPlatform(null);
  }

  const featured = results[0];
  const related = results.slice(1);

  return (
    <div className={variant === "page" ? "space-y-8" : "space-y-4"}>
      <StreamingSearchBar
        value={query}
        onChange={setQuery}
        onSubmit={runSearch}
        onSelectSuggestion={handleSelectSuggestion}
        size={variant === "page" ? "hero" : "compact"}
        autoFocus={variant === "page"}
      />

      {toast && <p className="text-sm text-success">{toast}</p>}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking where {lockedQuery ? `"${lockedQuery}"` : "that title"} is streaming…
        </div>
      )}

      {error && !loading && <p className="text-sm text-danger">{error}</p>}

      {!loading && lockedQuery && results.length === 0 && !error && (
        <div className="card text-sm text-muted">
          No results for &ldquo;{lockedQuery}&rdquo;. Try a different spelling or shorter query.
        </div>
      )}

      {!loading && featured && (
        <div className="space-y-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Results for &ldquo;{lockedQuery}&rdquo;
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Where to watch
            </h2>
          </div>

          <StreamingSearchResultCard
            hit={featured}
            onAdd={handleAdd}
            onAddToPassport={handleAddToPassport}
            addingPlatform={addingPlatform}
            addingPassportPlatform={addingPassportPlatform}
            addedPlatforms={
              new Set(
                [...addedKeys]
                  .filter((key) => key.startsWith(`${featured.externalId}:`))
                  .map((key) => key.split(":")[1]!)
              )
            }
            addedPassportPlatforms={
              new Set(
                [...addedPassportKeys]
                  .filter((key) => key.startsWith(`${featured.externalId}:`))
                  .map((key) => key.split(":")[1]!)
              )
            }
          />

          {related.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-lg font-semibold text-white">
                Related matches
              </h3>
              <div className="grid gap-4">
                {related.map((hit) => (
                  <StreamingSearchResultCard
                    key={`${hit.mediaType}-${hit.externalId}`}
                    hit={hit}
                    onAdd={handleAdd}
                    onAddToPassport={handleAddToPassport}
                    addingPlatform={addingPlatform}
                    addingPassportPlatform={addingPassportPlatform}
                    addedPlatforms={
                      new Set(
                        [...addedKeys]
                          .filter((key) => key.startsWith(`${hit.externalId}:`))
                          .map((key) => key.split(":")[1]!)
                      )
                    }
                    addedPassportPlatforms={
                      new Set(
                        [...addedPassportKeys]
                          .filter((key) => key.startsWith(`${hit.externalId}:`))
                          .map((key) => key.split(":")[1]!)
                      )
                    }
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!lockedQuery && variant === "page" && (
        <div className="card text-sm text-muted">
          Start typing to see suggestions, then press Enter or pick a title to see
          where it&apos;s streaming and add it to your watchlist or passport.
        </div>
      )}
    </div>
  );
}
