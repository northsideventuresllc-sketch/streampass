"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ExternalLink, ListPlus, Star } from "lucide-react";
import type { StreamingSearchHit } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

interface StreamingSearchResultCardProps {
  hit: StreamingSearchHit;
  onAdd?: (hit: StreamingSearchHit, platform: string) => void;
  onAddToPassport?: (hit: StreamingSearchHit, platform: string) => void;
  addingPlatform?: string | null;
  addingPassportPlatform?: string | null;
  addedPlatforms?: Set<string>;
  addedPassportPlatforms?: Set<string>;
  compact?: boolean;
}

export function StreamingSearchResultCard({
  hit,
  onAdd,
  onAddToPassport,
  addingPlatform,
  addingPassportPlatform,
  addedPlatforms,
  addedPassportPlatforms,
  compact = false,
}: StreamingSearchResultCardProps) {
  const mediaLabel = hit.mediaType === "movie" ? "Movie" : "TV Series";

  return (
    <article
      className={cn(
        "search-result-card",
        hit.isTopMatch && !compact && "search-result-card--featured"
      )}
    >
      <div className="search-result-card__media">
        {hit.posterUrl ? (
          <Image
            src={hit.posterUrl}
            alt=""
            width={compact ? 88 : 120}
            height={compact ? 132 : 180}
            className="search-result-card__poster"
            unoptimized
          />
        ) : (
          <div className="search-result-card__poster search-result-card__poster--empty">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              No art
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {hit.isTopMatch && !compact && (
                <span className="badge-live text-[10px]">Top match</span>
              )}
              <span className="badge-accent text-[10px]">{mediaLabel}</span>
              {hit.releaseYear && (
                <span className="text-xs text-muted">{hit.releaseYear}</span>
              )}
              {hit.rating !== null && hit.rating > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Star className="h-3 w-3 text-warning" />
                  {hit.rating.toFixed(1)}
                </span>
              )}
            </div>
            <h3 className="mt-2 font-display text-xl font-bold text-white md:text-2xl">
              {hit.title}
            </h3>
          </div>
          {!compact && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Match {Math.round(hit.score * 100)}%
            </span>
          )}
        </div>

        <p className={cn("mt-3 text-sm text-muted", compact ? "line-clamp-2" : "line-clamp-3")}>
          {hit.overview}
        </p>

        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            Available on
          </p>
          {hit.platforms.length === 0 ? (
            <p className="text-sm text-muted">
              No US streaming options found right now.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hit.platforms.map((platform) => {
                const added = addedPlatforms?.has(platform.service);
                const adding = addingPlatform === platform.service;
                const passportAdded = addedPassportPlatforms?.has(platform.service);
                const passportAdding = addingPassportPlatform === platform.service;

                return (
                  <div
                    key={platform.service}
                    className="search-platform-chip"
                  >
                    <span className="badge-magenta">{platform.service}</span>
                    <Link
                      href={platform.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="search-platform-chip__link"
                    >
                      Open
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {onAdd && (
                      <button
                        type="button"
                        disabled={adding || added}
                        onClick={() => onAdd(hit, platform.service)}
                        className="search-platform-chip__add"
                      >
                        <ListPlus className="h-3.5 w-3.5" />
                        {added ? "Added" : adding ? "Adding…" : "Watchlist"}
                      </button>
                    )}
                    {onAddToPassport && (
                      <button
                        type="button"
                        disabled={passportAdding || passportAdded}
                        onClick={() => onAddToPassport(hit, platform.service)}
                        className="search-platform-chip__passport"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        {passportAdded ? "Tracked" : passportAdding ? "Tracking…" : "Passport"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
