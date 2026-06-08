"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Search } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { StreamingSearchSuggestion } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

interface StreamingSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  onSelectSuggestion?: (suggestion: StreamingSearchSuggestion) => void;
  placeholder?: string;
  size?: "hero" | "compact";
  autoFocus?: boolean;
}

async function fetchSuggestions(query: string) {
  const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
  const data = (await res.json()) as {
    suggestions?: StreamingSearchSuggestion[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || "Failed to load suggestions");
  return data.suggestions ?? [];
}

export function StreamingSearchBar({
  value,
  onChange,
  onSubmit,
  onSelectSuggestion,
  placeholder = "Search shows and movies…",
  size = "hero",
  autoFocus = false,
}: StreamingSearchBarProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(value, 260);
  const [suggestions, setSuggestions] = useState<StreamingSearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSuggestions(debouncedQuery)
      .then((items) => {
        if (cancelled) return;
        setSuggestions(items);
        setOpen(true);
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (cancelled) return;
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "Search unavailable");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function chooseSuggestion(suggestion: StreamingSearchSuggestion) {
    onChange(suggestion.title);
    setOpen(false);
    onSelectSuggestion?.(suggestion);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        chooseSuggestion(suggestions[activeIndex]);
        return;
      }
      setOpen(false);
      onSubmit(value.trim());
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown =
    open && value.trim().length >= 2 && (loading || suggestions.length > 0 || error);

  return (
    <div ref={containerRef} className="relative z-[1]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(false);
          onSubmit(value.trim());
        }}
        className={cn("search-bar", size === "compact" && "search-bar--compact")}
      >
        <Search className="search-bar__icon" />
        <input
          type="search"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-bar__input"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showDropdown ? true : undefined}
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
        {loading && <Loader2 className="search-bar__spinner animate-spin" />}
        <button type="submit" className="search-bar__submit">
          Search
        </button>
      </form>

      {showDropdown && (
        <ul id={listboxId} role="listbox" className="search-suggest">
          {loading && suggestions.length === 0 && !error && (
            <li className="search-suggest__empty">Finding titles…</li>
          )}
          {error && <li className="search-suggest__empty">{error}</li>}
          {!loading &&
            !error &&
            suggestions.length === 0 &&
            debouncedQuery.trim().length >= 2 && (
              <li className="search-suggest__empty">No matches yet — press Enter to search.</li>
            )}
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.mediaType}-${suggestion.externalId}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "search-suggest__item",
                  index === activeIndex && "search-suggest__item--active"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseSuggestion(suggestion)}
              >
                {suggestion.posterUrl ? (
                  <Image
                    src={suggestion.posterUrl}
                    alt=""
                    width={36}
                    height={54}
                    className="search-suggest__thumb"
                    unoptimized
                  />
                ) : (
                  <span className="search-suggest__thumb search-suggest__thumb--empty" />
                )}
                <span className="min-w-0 text-left">
                  <span className="block truncate font-medium text-white">
                    {suggestion.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {suggestion.subtitle}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
