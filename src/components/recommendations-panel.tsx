"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Recommendation } from "@/lib/types";
import { getPlatformDeepLink } from "@/lib/platform-links";

export function RecommendationsPanel({ compact = false }: { compact?: boolean }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommendations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRecommendations(data.recommendations ?? []);
      setMessage(data.message ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecs();
  }, []);

  return (
    <div className={compact ? "flex h-full flex-col" : "card"}>
      {!compact && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-semibold">AI Picks</h2>
          <button
            onClick={fetchRecs}
            disabled={loading}
            className="btn-secondary flex items-center gap-1.5 py-1.5 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      )}
      {compact && (
        <button
          onClick={fetchRecs}
          disabled={loading}
          className="mb-3 ml-auto btn-secondary flex w-fit items-center gap-1.5 py-1 text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      )}

      {loading && (
        <p className="text-sm text-muted">Analyzing watch history…</p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && !loading && (
        <p className="text-sm text-muted">{message}</p>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="space-y-2 overflow-y-auto">
          {recommendations.map((rec, i) => (
            <div
              key={`${rec.title}-${i}`}
              className="rounded-xl border border-white/[0.06] bg-black/40 p-3 transition hover:border-magenta/30"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium">{rec.title}</h3>
                <span className="badge-magenta shrink-0 text-[10px]">
                  {rec.platform}
                </span>
              </div>
              <p className="mb-2 line-clamp-2 text-xs text-muted">
                {rec.reasoning}
              </p>
              <a
                href={getPlatformDeepLink(rec.platform, rec.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan hover:underline"
              >
                Open on {rec.platform} →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
