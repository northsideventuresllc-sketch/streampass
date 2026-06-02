"use client";

import { useState } from "react";
import {
  GripVertical,
  ExternalLink,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STREAMING_SERVICES, STATUS_LABELS, WATCHLIST_STATUSES } from "@/lib/constants";
import { getPlatformDeepLink } from "@/lib/platform-links";
import type { WatchlistItem } from "@/lib/types";
import type { WatchlistStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WatchlistManagerProps {
  initialItems: WatchlistItem[];
}

export function WatchlistManager({ initialItems }: WatchlistManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<string>(STREAMING_SERVICES[0]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const maxOrder = items.reduce((max, i) => Math.max(max, i.priority_order), -1);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("streampass_watchlist")
      .insert({
        user_id: user.id,
        title: title.trim(),
        platform,
        status: "queued",
        priority_order: maxOrder + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data]);
      setTitle("");
    }
    setLoading(false);
  }

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
      <form onSubmit={handleAdd} className="card">
        <h2 className="mb-4 font-semibold">Add to Watchlist</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title name"
            className="input sm:col-span-1"
            required
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="input"
          >
            {STREAMING_SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading} className="btn-primary">
            Add
          </button>
        </div>
      </form>

      <div className="card">
        <h2 className="mb-4 font-semibold">
          Your Queue ({activeItems.length})
        </h2>
        {activeItems.length === 0 ? (
          <p className="text-sm text-muted">
            Your queue is empty. Add titles above to get started.
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
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <span className="badge-magenta mt-1">{item.platform}</span>
                </div>

                <div className="relative">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      updateStatus(item.id, e.target.value as WatchlistStatus)
                    }
                    className="input w-auto appearance-none pr-8 py-1.5 text-xs"
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
