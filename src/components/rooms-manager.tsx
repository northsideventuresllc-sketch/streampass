"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VIDEO_STREAMING_SERVICES } from "@/lib/constants";
import { PlatformSelect } from "@/components/platform-select";
import { generateShareCode } from "@/lib/platform-links";
import type { WatchRoom } from "@/lib/types";

interface RoomsManagerProps {
  initialRooms: WatchRoom[];
  userId: string;
}

export function RoomsManager({ initialRooms, userId }: RoomsManagerProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<string>(VIDEO_STREAMING_SERVICES[0]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledTime) return;
    setLoading(true);

    const shareCode = generateShareCode();

    const { data: room, error } = await supabase
      .from("streampass_watch_rooms")
      .insert({
        created_by: userId,
        title: title.trim(),
        platform,
        scheduled_time: new Date(scheduledTime).toISOString(),
        share_code: shareCode,
        room_type: "watch",
      })
      .select()
      .single();

    if (!error && room) {
      await supabase.from("streampass_room_members").insert({
        room_id: room.id,
        user_id: userId,
      });
      setRooms([room, ...rooms]);
      setTitle("");
      setScheduledTime("");
      setShowForm(false);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Watch Party Rooms</h2>
          <p className="text-sm text-muted">
            Create a room, share the link, sync the countdown — watch on your own device.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Room
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you watching?"
              className="input"
              required
            />
            <PlatformSelect
              value={platform}
              onChange={setPlatform}
              mediaType="video"
            />
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="input sm:col-span-2"
              required
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              Create Room
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

      <div className="space-y-3">
        {rooms.length === 0 ? (
          <div className="card text-center">
            <p className="text-sm text-muted">No rooms yet. Create one to start a watch party.</p>
          </div>
        ) : (
          rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.share_code}`}
              className="card flex items-center gap-4 transition hover:border-accent/30"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{room.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="badge-accent">{room.platform}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(room.scheduled_time).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-accent">{room.share_code}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Users className="h-3 w-3" />
                  Join room
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
