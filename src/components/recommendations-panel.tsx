"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import type { Recommendation } from "@/lib/types";
import { getPlatformDeepLink } from "@/lib/platform-links";

async function loadRecommendations() {
  const res = await fetch("/api/recommendations");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load");
  return {
    recommendations: (data.recommendations ?? []) as Recommendation[],
    message: (data.message ?? null) as string | null,
  };
}

export function RecommendationsPanel({ compact = false }: { compact?: boolean }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshRecs() {
    setLoading(true);
    setError(null);
    try {
      const data = await loadRecommendations();
      setRecommendations(data.recommendations);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    loadRecommendations()
      .then((data) => {
        if (cancelled) return;
        setRecommendations(data.recommendations);
        setMessage(data.message);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const featured = recommendations[0];
  const rest = recommendations.slice(1);

  return (
    <div className={compact ? "flex h-full flex-col" : "card"}>
      {!compact && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#e879f9]" />
            <h2 className="font-display text-lg font-semibold text-white">
              AI Picks
            </h2>
          </div>
          <button
            onClick={() => void refreshRecs()}
            disabled={loading}
            className="btn-secondary flex items-center gap-1.5 py-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      )}

      {compact && (
        <button
          onClick={() => void refreshRecs()}
          disabled={loading}
          className="mb-3 ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-[#a1a1aa] transition hover:border-[#e879f9]/40"
          aria-label="Refresh recommendations"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      )}

      {loading && (
        <p className="text-sm text-[#a1a1aa]">Analyzing watch history…</p>
      )}
      {error && <p className="text-sm text-[#f87171]">{error}</p>}
      {message && !loading && !featured && (
        <div className="ai-pick-featured">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#e879f9]">
            Preview
          </p>
          <h3 className="mt-2 font-display text-xl font-bold text-white">
            Shōgun
          </h3>
          <p className="mt-2 text-sm text-[#a1a1aa]">
            {message ||
              "Add watched titles to your queue to unlock personalized AI picks across every platform."}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="badge-magenta">Hulu</span>
            <span className="text-xs text-[#71717a]">Example layout</span>
          </div>
        </div>
      )}

      {!loading && featured && (
        <div className="ai-pick-featured mb-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#e879f9]">
            Top pick
          </p>
          <h3 className="mt-2 font-display text-xl font-bold text-white">
            {featured.title}
          </h3>
          <p className="mt-2 text-sm text-[#a1a1aa]">{featured.reasoning}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="badge-magenta">{featured.platform}</span>
            <a
              href={getPlatformDeepLink(featured.platform, featured.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#22d3ee] hover:underline"
            >
              Open →
            </a>
          </div>
        </div>
      )}

      {!loading && rest.length > 0 && (
        <div className="space-y-2 overflow-y-auto">
          {rest.map((rec, i) => (
            <div
              key={`${rec.title}-${i}`}
              className="rounded-xl border border-white/[0.08] bg-black/50 p-3 transition hover:border-[#e879f9]/30"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-white">{rec.title}</h3>
                <span className="badge-magenta shrink-0 text-[10px]">
                  {rec.platform}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-[#a1a1aa]">
                {rec.reasoning}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
