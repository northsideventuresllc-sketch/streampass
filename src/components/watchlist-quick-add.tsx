"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StreamingSearchBar } from "@/components/streaming-search-bar";
import { StreamingSearchResultCard } from "@/components/streaming-search-result-card";
import { addToWatchlist } from "@/lib/watchlist-add";
import { addToPassport } from "@/lib/passport-add";
import type { StreamingSearchHit, StreamingSearchSuggestion } from "@/lib/tmdb/types";
import type { TrackedTitle, WatchlistItem } from "@/lib/types";

interface WatchlistQuickAddProps {
  items: WatchlistItem[];
  trackedTitles?: TrackedTitle[];
  onAdded: (item: WatchlistItem) => void;
  onPassportAdded?: (title: TrackedTitle) => void;
}

async function fetchTitleAvailability(
  suggestion: StreamingSearchSuggestion
): Promise<StreamingSearchHit | null> {
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
  return data.results?.[0] ?? null;
}

export function WatchlistQuickAdd({
  items,
  trackedTitles = [],
  onAdded,
  onPassportAdded,
}: WatchlistQuickAddProps) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StreamingSearchHit | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingPlatform, setAddingPlatform] = useState<string | null>(null);
  const [addingPassportPlatform, setAddingPassportPlatform] = useState<string | null>(null);
  const [passportTitles, setPassportTitles] = useState(trackedTitles);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectSuggestion(suggestion: StreamingSearchSuggestion) {
    setLoading(true);
    setError(null);
    setMessage(null);
    setSelected(null);

    try {
      const hit = await fetchTitleAvailability(suggestion);
      if (!hit) {
        setError("Could not load streaming options for that title.");
        return;
      }
      setSelected(hit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(hit: StreamingSearchHit, platform: string) {
    setAddingPlatform(platform);
    setMessage(null);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: addError } = await addToWatchlist(
      supabase,
      user.id,
      items,
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
      setError(addError);
    } else if (data) {
      onAdded(data);
      setMessage(`Added "${hit.title}" on ${platform}.`);
      setSelected(null);
      setQuery("");
    }

    setAddingPlatform(null);
  }

  async function handleAddToPassport(hit: StreamingSearchHit, platform: string) {
    setAddingPassportPlatform(platform);
    setMessage(null);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: addError } = await addToPassport(
      supabase,
      user.id,
      passportTitles,
      { title: hit.title, platform }
    );

    if (addError) {
      setError(addError);
    } else if (data) {
      setPassportTitles((prev) => [data, ...prev]);
      onPassportAdded?.(data);
      setMessage(`Now tracking "${hit.title}" on ${platform}.`);
    }

    setAddingPassportPlatform(null);
  }

  return (
    <div className="card quick-add-card space-y-4">
      <div>
        <h2 className="font-semibold">Quick add</h2>
        <p className="mt-1 text-sm text-muted">
          Search a show, pick it, choose a platform — add to your queue or passport.
        </p>
      </div>

      <StreamingSearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => undefined}
        onSelectSuggestion={handleSelectSuggestion}
        size="compact"
        placeholder="Search to add…"
      />

      {loading && <p className="text-sm text-muted">Loading streaming options…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      {selected && (
        <StreamingSearchResultCard
          hit={selected}
          onAdd={handleAdd}
          onAddToPassport={handleAddToPassport}
          addingPlatform={addingPlatform}
          addingPassportPlatform={addingPassportPlatform}
          compact
        />
      )}
    </div>
  );
}
