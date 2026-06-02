"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Play } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { getPlatformDeepLink } from "@/lib/platform-links";
import { LiveDot } from "@/components/afterglow/live-dot";
import { Countdown } from "@/components/afterglow/countdown";
import { spring } from "@/lib/motion";
import type { WatchRoom, RoomMessage } from "@/lib/types";

type EnrichedMessage = RoomMessage & {
  profile?: { username: string } | null;
};

interface RoomViewProps {
  room: WatchRoom;
  userId: string;
  username: string;
  initialMessages: EnrichedMessage[];
}

export function RoomView({
  room,
  userId,
  username,
  initialMessages,
}: RoomViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [joined, setJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    async function joinRoom() {
      const { error } = await supabase.from("streampass_room_members").upsert(
        { room_id: room.id, user_id: userId },
        { onConflict: "room_id,user_id", ignoreDuplicates: true }
      );
      if (!error) setJoined(true);
    }
    joinRoom();
  }, [room.id, userId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`room-${room.id}`)
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

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/rooms/${room.share_code}`
      : `/rooms/${room.share_code}`;

  const platformLink = getPlatformDeepLink(room.platform, room.title);

  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-8">
      <div className="flex items-center gap-4">
        <Link
          href="/rooms"
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
            <span className="badge-magenta">{room.platform}</span>
            <span className="mx-2">·</span>
            <span className="font-mono text-cyan">{room.share_code}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bento-card border-magenta/30 text-center lg:col-span-1">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Sync countdown
          </p>
          <Countdown scheduledTime={room.scheduled_time} />
          <p className="mt-4 break-all text-xs text-muted">Share: {shareUrl}</p>
        </div>

        <div className="bento-card flex min-h-[400px] flex-col lg:col-span-2 lg:min-h-[calc(100vh-14rem)]">
          <h2 className="mb-3 font-display font-semibold">Room chat</h2>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-muted">No messages yet. Say hello!</p>
            ) : (
              messages.map((msg) => (
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
              ))
            )}
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
      </div>

      <AnimatePresence>
        {isLive && (
          <motion.div
            initial={reduceMotion ? false : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : spring}
            className="press-play-bar"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 font-display font-semibold text-live">
                  <LiveDot />
                  Press Play
                </p>
                <p className="text-xs text-muted">
                  Open {room.platform} on your device — synced with the room
                </p>
              </div>
              <a
                href={platformLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary shrink-0 inline-flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Open
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
