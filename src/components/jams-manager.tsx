"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Headphones, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MUSIC_STREAMING_SERVICES } from "@/lib/constants";
import { generateShareCode } from "@/lib/platform-links";
import { ConnectedMusicServices } from "@/components/connected-music-services";
import type { WatchRoom, ConnectedAccount } from "@/lib/types";

interface JamsManagerProps {
  initialJams: WatchRoom[];
  userId: string;
  connectedAccounts: ConnectedAccount[];
  preferredPlatform: string | null;
}

export function JamsManager({
  initialJams,
  userId,
  connectedAccounts,
  preferredPlatform,
}: JamsManagerProps) {
  const [jams, setJams] = useState(initialJams);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState(
    preferredPlatform ?? MUSIC_STREAMING_SERVICES[0]
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const shareCode = generateShareCode();
    const schedule = scheduledTime
      ? new Date(scheduledTime).toISOString()
      : new Date().toISOString();

    const { data: room, error } = await supabase
      .from("streampass_watch_rooms")
      .insert({
        created_by: userId,
        title: title.trim(),
        platform,
        scheduled_time: schedule,
        share_code: shareCode,
        room_type: "listen",
      })
      .select()
      .single();

    if (!error && room) {
      await supabase.from("streampass_room_members").insert({
        room_id: room.id,
        user_id: userId,
        listening_platform: platform,
      });

      await supabase.from("streampass_jam_state").insert({
        room_id: room.id,
        is_playing: false,
      });

      setJams([room, ...jams]);
      setTitle("");
      setScheduledTime("");
      setShowForm(false);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <ConnectedMusicServices
        initialAccounts={connectedAccounts}
        preferredPlatform={preferredPlatform}
        userId={userId}
      />

      <div className="border-t border-white/[0.06] pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Your jam sessions</h2>
            <p className="text-sm text-muted">
              Start a listening party. Friends join with their own Spotify or
              Apple Music — one shared queue, every platform.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Start Jam
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Jam name (e.g. Friday Night Vibes)"
                className="input sm:col-span-2"
                required
              />
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="input"
              >
                {MUSIC_STREAMING_SERVICES.map((s) => (
                  <option key={s} value={s}>
                    Your platform: {s}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="input"
                placeholder="Start time (optional)"
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              Leave start time empty to begin immediately. Guests pick their own
              platform when they join.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={loading} className="btn-primary">
                Create Jam
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 space-y-3">
          {jams.length === 0 ? (
            <div className="card text-center">
              <Headphones className="mx-auto mb-2 h-8 w-8 text-muted" />
              <p className="text-sm text-muted">
                No jams yet. Connect your music service and start one.
              </p>
            </div>
          ) : (
            jams.map((jam) => (
              <Link
                key={jam.id}
                href={`/jams/${jam.share_code}`}
                className="card flex items-center gap-4 transition hover:border-accent/30"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-magenta/10">
                  <Headphones className="h-6 w-6 text-magenta" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{jam.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="badge-accent">{jam.platform}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(jam.scheduled_time).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-accent">{jam.share_code}</p>
                  <p className="flex items-center justify-end gap-1 text-xs text-muted">
                    <Users className="h-3 w-3" />
                    Join jam
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
