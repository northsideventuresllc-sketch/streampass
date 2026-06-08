"use client";

import { useState } from "react";
import Image from "next/image";
import {
  GripVertical,
  ExternalLink,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABELS, WATCHLIST_STATUSES } from "@/lib/constants";
import { getPlatformDeepLink } from "@/lib/platform-links";
import { WatchlistQuickAdd } from "@/components/watchlist-quick-add";
import type { TrackedTitle, WatchlistItem } from "@/lib/types";
import type { WatchlistStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WatchlistManagerProps {
  initialItems: WatchlistItem[];
  initialTrackedTitles?: TrackedTitle[];
}

export function WatchlistManager({
  initialItems,
  initialTrackedTitles = [],
}: WatchlistManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const supabase = createClient();

  async function updateStatus(id: string, status: WatchlistStatus) {
    const updates: Partial<WatchlistItem> = { status };
    if (status === "watched") updates.watched_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("streampass_watchlist")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setItems(items.map((i) => (i.id === id ? data : i)));
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("streampass_watchlist")
      .delete()
      .eq("id", id);
    if (!error) setItems(items.filter((i) => i.id !== id));
  }

  async function persistOrder(reordered: WatchlistItem[]) {
    setItems(reordered);
    await Promise.all(
      reordered.map((item, index) =>
        supabase
          .from("streampass_watchlist")
          .update({ priority_order: index })
          .eq("id", item.id)
      )
    );
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setDragIndex(index);
    setItems(reordered);
  }

  function handleDragEnd() {
    if (dragIndex !== null) persistOrder(items);
    setDragIndex(null);
  }

  const activeItems = items
    .filter((i) => i.status !== "watched" && i.status !== "dropped")
    .sort((a, b) => a.priority_order - b.priority_order);

  return (
    <div className="space-y-6">
      <WatchlistQuickAdd
        items={items}
        trackedTitles={initialTrackedTitles}
        onAdded={(item) => setItems((prev) => [...prev, item])}
      />

      <div className="card">
        <h2 className="mb-4 font-semibold">
          Your Queue ({activeItems.length})
        </h2>
        {activeItems.length === 0 ? (
          <p className="text-sm text-muted">
            Your queue is empty. Use Search or Quick add above to save titles.
          </p>
        ) : (
          <div className="space-y-2">
            {activeItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 p-3 transition hover:border-magenta/20",
                  dragIndex === index && "border-magenta/40 opacity-90"
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted" />

                {item.poster_url ? (
                  <Image
                    src={item.poster_url}
                    alt=""
                    width={44}
                    height={66}
                    className="h-[66px] w-[44px] shrink-0 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-[66px] w-[44px] shrink-0 rounded-lg bg-white/[0.04]" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="badge-magenta">{item.platform}</span>
                    {item.release_year && (
                      <span className="text-xs text-muted">{item.release_year}</span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      updateStatus(item.id, e.target.value as WatchlistStatus)
                    }
                    className="input w-auto appearance-none py-1.5 pr-8 text-xs"
                  >
                    {WATCHLIST_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
                </div>

                <a
                  href={getPlatformDeepLink(item.platform, item.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-1 py-1.5 text-xs"
                >
                  Watch Now
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
