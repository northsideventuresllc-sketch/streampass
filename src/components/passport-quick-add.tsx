"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StreamingSearchBar } from "@/components/streaming-search-bar";
import { StreamingSearchResultCard } from "@/components/streaming-search-result-card";
import { addToPassport } from "@/lib/passport-add";
import type { StreamingSearchHit, StreamingSearchSuggestion } from "@/lib/tmdb/types";
import type { TrackedTitle } from "@/lib/types";

interface PassportQuickAddProps {
  titles: TrackedTitle[];
  onAdded: (title: TrackedTitle) => void;
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

export function PassportQuickAdd({ titles, onAdded }: PassportQuickAddProps) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StreamingSearchHit | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingPassportPlatform, setAddingPassportPlatform] = useState<string | null>(null);
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
      titles,
      { title: hit.title, platform }
    );

    if (addError) {
      setError(addError);
    } else if (data) {
      onAdded(data);
      setMessage(`Now tracking "${hit.title}" on ${platform}.`);
      setSelected(null);
      setQuery("");
    }

    setAddingPassportPlatform(null);
  }

  return (
    <div className="card quick-add-card space-y-4">
      <div>
        <h2 className="font-semibold">Quick add</h2>
        <p className="mt-1 text-sm text-muted">
          Search a show, pick it, choose a platform — then get alerts when it moves.
        </p>
      </div>

      <StreamingSearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => undefined}
        onSelectSuggestion={handleSelectSuggestion}
        size="compact"
        placeholder="Search to track…"
      />

      {loading && <p className="text-sm text-muted">Loading streaming options…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      {selected && (
        <StreamingSearchResultCard
          hit={selected}
          onAddToPassport={handleAddToPassport}
          addingPassportPlatform={addingPassportPlatform}
          compact
        />
      )}
    </div>
  );
}
