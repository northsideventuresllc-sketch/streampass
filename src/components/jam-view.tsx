"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Send,
  Play,
  SkipForward,
  Plus,
  Search,
  Music2,
  ExternalLink,
  ThumbsUp,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  getTrackLinkForPlatform,
  formatDuration,
} from "@/lib/music/cross-platform";
import { MUSIC_STREAMING_SERVICES } from "@/lib/constants";
import { LiveDot } from "@/components/afterglow/live-dot";
import { Countdown } from "@/components/afterglow/countdown";
import { spring } from "@/lib/motion";
import type {
  WatchRoom,
  RoomMessage,
  JamQueueItem,
  JamState,
} from "@/lib/types";
import type { MusicTrack } from "@/lib/music/types";

type EnrichedMessage = RoomMessage & {
  profile?: { username: string } | null;
};

type EnrichedMember = {
  user_id: string;
  listening_platform: string | null;
  profile?: { username: string } | null;
};

interface JamViewProps {
  room: WatchRoom;
  userId: string;
  initialMessages: EnrichedMessage[];
  initialQueue: JamQueueItem[];
  initialState: JamState | null;
  initialMembers: EnrichedMember[];
  userPlatform: string;
  isHost: boolean;
}

export function JamView({
  room,
  userId,
  initialMessages,
  initialQueue,
  initialState,
  initialMembers,
  userPlatform: initialUserPlatform,
  isHost,
}: JamViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [queue, setQueue] = useState(initialQueue);
  const [jamState, setJamState] = useState(initialState);
  const [members, setMembers] = useState(initialMembers);
  const [newMessage, setNewMessage] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [joined, setJoined] = useState(false);
  const [userPlatform, setUserPlatform] = useState(initialUserPlatform);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const reduceMotion = useReducedMotion();

  const nowPlaying = queue.find((q) => q.id === jamState?.queue_item_id);

  useEffect(() => {
    async function joinRoom() {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(`streampass_music_platform_${userId}`)
          : null;

      const platform = stored ?? userPlatform;

      const { error } = await supabase.from("streampass_room_members").upsert(
        {
          room_id: room.id,
          user_id: userId,
          listening_platform: platform,
        },
        { onConflict: "room_id,user_id" }
      );
      if (!error) {
        setJoined(true);
        setUserPlatform(platform);
      }
    }
    joinRoom();
  }, [room.id, userId, supabase, userPlatform]);

  useEffect(() => {
    const channel = supabase
      .channel(`jam-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "streampass_room_messages",
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const msg = payload.new as RoomMessage;
          const { data: profile } = await supabase
            .from("streampass_profiles")
            .select("username")
            .eq("id", msg.user_id)
            .single();
          setMessages((prev) => [
            ...prev,
            { ...msg, profile: profile ?? undefined },
          ]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "streampass_jam_queue",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setQueue((prev) =>
              [...prev, payload.new as JamQueueItem].sort(
                (a, b) => a.position - b.position
              )
            );
          } else if (payload.eventType === "UPDATE") {
            setQueue((prev) =>
              prev
                .map((q) =>
                  q.id === (payload.new as JamQueueItem).id
                    ? (payload.new as JamQueueItem)
                    : q
                )
                .sort((a, b) => a.position - b.position)
            );
          } else if (payload.eventType === "DELETE") {
            setQueue((prev) =>
              prev.filter((q) => q.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "streampass_jam_state",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            setJamState(payload.new as JamState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, supabase]);

  useEffect(() => {
    function checkLive() {
      setIsLive(new Date(room.scheduled_time).getTime() <= Date.now());
    }
    checkLive();
    const interval = setInterval(checkLive, 1000);
    return () => clearInterval(interval);
  }, [room.scheduled_time]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const searchTracks = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.tracks ?? []);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchTracks(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchTracks]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !joined) return;
    const { error } = await supabase.from("streampass_room_messages").insert({
      room_id: room.id,
      user_id: userId,
      message: newMessage.trim(),
    });
    if (!error) setNewMessage("");
  }

  async function addTrackToQueue(track: MusicTrack) {
    const maxPosition =
      queue.length > 0 ? Math.max(...queue.map((q) => q.position)) + 1 : 0;

    await supabase.from("streampass_jam_queue").insert({
      room_id: room.id,
      added_by: userId,
      track_title: track.title,
      track_artist: track.artist,
      track_album: track.album ?? null,
      track_artwork_url: track.artworkUrl ?? null,
      track_duration_ms: track.durationMs ?? null,
      isrc: track.isrc ?? null,
      spotify_uri: track.spotifyUri ?? null,
      spotify_url: track.spotifyUrl ?? null,
      apple_music_url: track.appleMusicUrl ?? null,
      position: maxPosition,
    });

    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function addManualTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim() || !manualArtist.trim()) return;
    await addTrackToQueue({
      title: manualTitle.trim(),
      artist: manualArtist.trim(),
    });
    setManualTitle("");
    setManualArtist("");
  }

  async function voteTrack(itemId: string, currentVotes: number) {
    await supabase
      .from("streampass_jam_queue")
      .update({ votes: currentVotes + 1 })
      .eq("id", itemId);
  }

  async function playTrack(item: JamQueueItem) {
    if (!isHost) return;
    await supabase.from("streampass_jam_state").upsert({
      room_id: room.id,
      queue_item_id: item.id,
      started_at: new Date().toISOString(),
      is_playing: true,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  }

  async function skipToNext() {
    if (!isHost || queue.length === 0) return;
    const currentIdx = nowPlaying
      ? queue.findIndex((q) => q.id === nowPlaying.id)
      : -1;
    const nextItem = queue[currentIdx + 1] ?? queue[0];
    if (nextItem) await playTrack(nextItem);
  }

  async function removeFromQueue(itemId: string) {
    await supabase.from("streampass_jam_queue").delete().eq("id", itemId);
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/jams/${room.share_code}`
      : `/jams/${room.share_code}`;

  const playLink = nowPlaying
    ? getTrackLinkForPlatform(nowPlaying, userPlatform)
    : null;

  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-8">
      <div className="flex items-center gap-4">
        <Link
          href="/jams"
          className="btn-secondary flex items-center gap-2 py-1.5 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {(isLive || !reduceMotion) && isLive && <LiveDot />}
            <h1 className="truncate font-display text-2xl font-bold">
              {room.title}
            </h1>
          </div>
          <p className="text-sm text-muted">
            <span className="badge-magenta">{userPlatform}</span>
            <span className="mx-2">·</span>
            <span className="font-mono text-cyan">{room.share_code}</span>
            {isHost && (
              <>
                <span className="mx-2">·</span>
                <span className="text-xs text-live">Host</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Platform picker for this jam */}
      <div className="card flex flex-wrap items-center gap-3">
        <Music2 className="h-4 w-4 text-magenta" />
        <span className="text-sm text-muted">Listen on:</span>
        {MUSIC_STREAMING_SERVICES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setUserPlatform(p);
              localStorage.setItem(`streampass_music_platform_${userId}`, p);
              supabase
                .from("streampass_room_members")
                .update({ listening_platform: p })
                .eq("room_id", room.id)
                .eq("user_id", userId);
            }}
            className={
              userPlatform === p ? "btn-primary text-xs py-1" : "btn-secondary text-xs py-1"
            }
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Now playing + countdown */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bento-card border-magenta/30 text-center">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {isLive ? "Now playing" : "Starts in"}
            </p>
            {!isLive ? (
              <Countdown scheduledTime={room.scheduled_time} />
            ) : nowPlaying ? (
              <div className="space-y-3">
                {nowPlaying.track_artwork_url && (
                  <Image
                    src={nowPlaying.track_artwork_url}
                    alt=""
                    width={120}
                    height={120}
                    className="mx-auto rounded-xl"
                    unoptimized
                  />
                )}
                <div>
                  <p className="font-display font-semibold">
                    {nowPlaying.track_title}
                  </p>
                  <p className="text-sm text-muted">
                    {nowPlaying.track_artist}
                  </p>
                  <p className="mt-1 font-mono text-xs text-cyan">
                    {formatDuration(nowPlaying.track_duration_ms)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Queue is empty — add a track to start
              </p>
            )}
            <p className="mt-4 break-all text-xs text-muted">
              Share: {shareUrl}
            </p>
          </div>

          {/* Members */}
          <div className="bento-card">
            <h3 className="mb-2 text-sm font-semibold">
              In the jam ({members.length})
            </h3>
            <ul className="space-y-1.5">
              {members.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between text-xs"
                >
                  <span>{m.profile?.username ?? "User"}</span>
                  <span className="badge-accent text-[10px]">
                    {m.listening_platform ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Queue + search */}
        <div className="bento-card flex flex-col lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display font-semibold">Shared queue</h2>
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="btn-primary flex items-center gap-1.5 text-xs"
            >
              <Plus className="h-3 w-3" />
              Add track
            </button>
          </div>

          {showSearch && (
            <div className="mb-4 space-y-3 rounded-xl border border-white/[0.06] bg-black/40 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracks…"
                  className="input pl-9"
                />
              </div>
              {searching && (
                <p className="text-xs text-muted">Searching…</p>
              )}
              {searchResults.length > 0 && (
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {searchResults.map((track) => (
                    <li key={`${track.title}-${track.artist}`}>
                      <button
                        type="button"
                        onClick={() => addTrackToQueue(track)}
                        className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition hover:bg-white/[0.05]"
                      >
                        {track.artworkUrl && (
                          <Image
                            src={track.artworkUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded"
                            unoptimized
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{track.title}</span>
                          <span className="text-muted"> — {track.artist}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form
                onSubmit={addManualTrack}
                className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3"
              >
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Track title"
                  className="input flex-1 min-w-[120px]"
                />
                <input
                  type="text"
                  value={manualArtist}
                  onChange={(e) => setManualArtist(e.target.value)}
                  placeholder="Artist"
                  className="input flex-1 min-w-[120px]"
                />
                <button type="submit" className="btn-secondary text-xs">
                  Add manually
                </button>
              </form>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto">
            {queue.length === 0 ? (
              <p className="text-sm text-muted">
                No tracks yet. Be the first to add something.
              </p>
            ) : (
              queue.map((item, idx) => {
                const isNowPlaying = item.id === jamState?.queue_item_id;
                const trackLink = getTrackLinkForPlatform(item, userPlatform);

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                      isNowPlaying
                        ? "border border-magenta/30 bg-magenta/10"
                        : "border border-white/[0.06] bg-black/40"
                    }`}
                  >
                    <span className="w-5 font-mono text-xs text-muted">
                      {idx + 1}
                    </span>
                    {item.track_artwork_url ? (
                      <Image
                        src={item.track_artwork_url}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-white/[0.05]">
                        <Music2 className="h-4 w-4 text-muted" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.track_title}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {item.track_artist}
                      </p>
                    </div>
                    <span className="hidden font-mono text-xs text-muted sm:block">
                      {formatDuration(item.track_duration_ms)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => voteTrack(item.id, item.votes)}
                        className="btn-secondary flex items-center gap-0.5 px-2 py-1 text-xs"
                        title="Vote"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {item.votes > 0 && item.votes}
                      </button>
                      {isHost && (
                        <button
                          type="button"
                          onClick={() => playTrack(item)}
                          className="btn-secondary p-1.5"
                          title="Play now"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                      )}
                      <a
                        href={trackLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary p-1.5"
                        title={`Open in ${userPlatform}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {(isHost || item.added_by === userId) && (
                        <button
                          type="button"
                          onClick={() => removeFromQueue(item.id)}
                          className="btn-secondary p-1.5 text-xs text-danger"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bento-card flex min-h-[280px] flex-col">
        <h2 className="mb-3 font-display font-semibold">Jam chat</h2>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-3 text-sm ${
                msg.user_id === userId
                  ? "ml-8 border border-magenta/20 bg-magenta/10"
                  : "mr-8 border border-white/[0.06] bg-black/40"
              }`}
            >
              <span className="text-xs font-medium text-cyan">
                {msg.profile?.username ?? "User"}
              </span>
              <p className="mt-0.5">{msg.message}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="mt-3 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            className="input flex-1"
          />
          <button type="submit" className="btn-primary px-4">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Press play bar */}
      <AnimatePresence>
        {isLive && nowPlaying && playLink && (
          <motion.div
            initial={reduceMotion ? false : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : spring}
            className="press-play-bar"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-display font-semibold text-live">
                  <LiveDot />
                  Now playing
                </p>
                <p className="truncate text-xs text-muted">
                  {nowPlaying.track_title} — {nowPlaying.track_artist}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isHost && (
                  <button
                    type="button"
                    onClick={skipToNext}
                    className="btn-secondary p-2"
                    title="Skip"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                )}
                <a
                  href={playLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Open in {userPlatform}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
