"use client";

import { useState } from "react";
import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STREAMING_SERVICES } from "@/lib/constants";
import type { TrackedTitle } from "@/lib/types";

interface PassportManagerProps {
  initialTitles: TrackedTitle[];
}

export function PassportManager({ initialTitles }: PassportManagerProps) {
  const [titles, setTitles] = useState(initialTitles);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<string>(STREAMING_SERVICES[0]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("streampass_tracked_titles")
      .insert({
        user_id: user.id,
        title: title.trim(),
        current_platform: platform,
      })
      .select()
      .single();

    if (!error && data) {
      setTitles([data, ...titles]);
      setTitle("");
    }
    setLoading(false);
  }

  async function dismissAlert(id: string) {
    const { data, error } = await supabase
      .from("streampass_tracked_titles")
      .update({ alert_triggered: false, alert_reason: null })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setTitles(titles.map((t) => (t.id === id ? data : t)));
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("streampass_tracked_titles")
      .delete()
      .eq("id", id);
    if (!error) setTitles(titles.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleTrack} className="card">
        <h2 className="mb-4 font-semibold">Track a Title</h2>
        <p className="mb-4 text-sm text-muted">
          Get alerts when a tracked title changes platforms or is expiring soon.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title to track"
            className="input"
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
          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Track
          </button>
        </div>
      </form>

      <div className="card">
        <h2 className="mb-4 font-semibold">Tracked Titles ({titles.length})</h2>
        {titles.length === 0 ? (
          <p className="text-sm text-muted">No titles tracked yet.</p>
        ) : (
          <div className="space-y-2">
            {titles.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-lg border border-card-border bg-background p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    {item.alert_triggered && (
                      <span className="badge-danger flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Alert
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Currently on{" "}
                    <span className="text-accent">{item.current_platform}</span>
                    {item.previous_platform && (
                      <> (was {item.previous_platform})</>
                    )}
                  </p>
                  {item.alert_reason && (
                    <p className="mt-1 text-xs text-warning">
                      {item.alert_reason}
                    </p>
                  )}
                  {item.expires_at && (
                    <p className="mt-1 text-xs text-muted">
                      Expires:{" "}
                      {new Date(item.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {item.alert_triggered && (
                    <button
                      onClick={() => dismissAlert(item.id)}
                      className="rounded p-1.5 text-muted transition hover:bg-card hover:text-foreground"
                      title="Dismiss alert"
                    >
                      <BellOff className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
