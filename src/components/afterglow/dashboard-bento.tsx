"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, CreditCard, Bell, ListVideo, Users, Play } from "lucide-react";
import { BentoCard } from "./bento-card";
import { LiveDot } from "./live-dot";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import { bentoContainer } from "@/lib/motion";
import { formatCurrency, daysSince } from "@/lib/utils";
import { IDLE_DAYS_THRESHOLD } from "@/lib/constants";
import { Countdown } from "./countdown";
import type { UserService, TrackedTitle, WatchRoom } from "@/lib/types";

interface DashboardBentoProps {
  username?: string;
  totalSpend: number;
  watchlistCount: number;
  alerts: TrackedTitle[];
  rooms: WatchRoom[];
  services: UserService[];
  idleCount: number;
}

function isRoomSoon(scheduledTime: string): boolean {
  const diff = new Date(scheduledTime).getTime() - Date.now();
  return diff > 0 && diff < 15 * 60 * 1000;
}

function isRoomLive(scheduledTime: string): boolean {
  return new Date(scheduledTime).getTime() <= Date.now();
}

export function DashboardBento({
  username,
  totalSpend,
  watchlistCount,
  alerts,
  rooms,
  services,
  idleCount,
}: DashboardBentoProps) {
  const reduceMotion = useReducedMotion();
  const heroRoom = rooms[0];
  const soon = heroRoom ? isRoomSoon(heroRoom.scheduled_time) : false;
  const live = heroRoom ? isRoomLive(heroRoom.scheduled_time) : false;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Command center
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {username ? (
            <>
              Hey, <span className="text-gradient">{username}</span>
            </>
          ) : (
            <span className="text-gradient">Stream Pass</span>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your cross-platform pulse — live rooms, AI picks, subscription health.
        </p>
      </header>

      <motion.div
        variants={reduceMotion ? undefined : bentoContainer}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]"
      >
        {heroRoom ? (
          <BentoCard
            variant="hero"
            href={`/rooms/${heroRoom.share_code}`}
            className="lg:col-span-2 lg:row-span-2 min-h-[220px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <RowBadge label="Watch Party" live={soon || live} />
              <Countdown scheduledTime={heroRoom.scheduled_time} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">{heroRoom.title}</h2>
              <p className="mt-1 text-sm text-muted">
                <span className="badge-magenta">{heroRoom.platform}</span>
                <span className="mx-2">·</span>
                Code {heroRoom.share_code}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full border-2 border-card bg-gradient-to-br from-magenta/40 to-violet/40"
                  style={{ marginLeft: i > 0 ? -10 : 0 }}
                />
              ))}
              <span className="ml-2 text-xs text-muted">Friends syncing</span>
            </div>
            {live && (
              <div className="mt-4 flex items-center gap-2 text-live text-sm font-medium">
                <Play className="h-4 w-4" />
                Press Play — open on your device
              </div>
            )}
          </BentoCard>
        ) : (
          <BentoCard
            variant="hero"
            href="/rooms"
            className="lg:col-span-2 lg:row-span-2 min-h-[200px] flex flex-col justify-center items-center text-center"
          >
            <Users className="mb-3 h-10 w-10 text-magenta" />
            <h2 className="font-display text-xl font-bold">Start a Watch Party</h2>
            <p className="mt-2 text-sm text-muted max-w-xs">
              Create a room, share the code, sync the countdown.
            </p>
          </BentoCard>
        )}

        <BentoCard variant="accent-cyan" className="lg:col-span-1">
          <CreditCard className="h-4 w-4 text-cyan" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">
            Monthly spend
          </p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">
            {formatCurrency(totalSpend)}
          </p>
          {idleCount > 0 && (
            <p className="mt-2 text-xs text-warning">
              {idleCount} idle · review savings
            </p>
          )}
          <Link href="/subscriptions" className="mt-3 inline-block text-xs text-cyan hover:underline">
            Subscriptions →
          </Link>
        </BentoCard>

        <BentoCard variant="accent-magenta" className="lg:col-span-1">
          <ListVideo className="h-4 w-4 text-magenta" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">
            Queue
          </p>
          <p className="mt-1 font-display text-3xl font-bold">{watchlistCount}</p>
          <Link href="/watchlist" className="mt-3 inline-block text-xs text-magenta hover:underline">
            Watchlist →
          </Link>
        </BentoCard>

        <BentoCard variant="live" className="lg:col-span-2 lg:col-start-3 lg:row-start-2 lg:row-span-2 min-h-[280px]">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-magenta" />
            <span className="font-display font-semibold">AI Picks</span>
          </div>
          <RecommendationsPanel compact />
        </BentoCard>

        <BentoCard variant="default" className="lg:col-span-1">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-warning" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Passport
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-bold">{alerts.length}</p>
          {alerts.length > 0 ? (
            <Link href="/passport" className="mt-2 block text-xs text-warning hover:underline">
              View alerts →
            </Link>
          ) : (
            <p className="mt-2 text-xs text-muted">All clear</p>
          )}
        </BentoCard>

        {alerts.length > 0 && (
          <BentoCard className="col-span-full border-warning/20">
            <h3 className="mb-3 flex items-center gap-2 font-display font-semibold text-warning">
              <Bell className="h-4 w-4" />
              Passport alerts
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory motion-reduce:overflow-visible">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="min-w-[240px] snap-start rounded-xl border border-white/[0.06] bg-black/40 p-4"
                >
                  <p className="font-medium">{alert.title}</p>
                  <p className="mt-1 text-xs text-warning">{alert.alert_reason}</p>
                </div>
              ))}
            </div>
          </BentoCard>
        )}

        {services.length > 0 && (
          <BentoCard className="col-span-full lg:col-span-2">
            <h3 className="mb-3 font-display font-semibold">Subscription pulse</h3>
            <div className="space-y-2">
              {services.slice(0, 4).map((service) => {
                const days = daysSince(service.last_active_at);
                const isIdle =
                  days === null || days >= IDLE_DAYS_THRESHOLD;
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2"
                  >
                    <span className="text-sm">{service.service_name}</span>
                    <span className={isIdle ? "badge-warning" : "badge-live"}>
                      {isIdle ? "Idle" : "Active"}
                    </span>
                  </div>
                );
              })}
            </div>
          </BentoCard>
        )}

        {rooms.length > 1 && (
          <BentoCard className="col-span-full lg:col-span-2">
            <h3 className="mb-3 font-display font-semibold">More rooms</h3>
            <div className="space-y-2">
              {rooms.slice(1, 4).map((room) => (
                <Link
                  key={room.id}
                  href={`/rooms/${room.share_code}`}
                  className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2 transition hover:bg-black/50"
                >
                  <span className="text-sm font-medium">{room.title}</span>
                  <RoomCountdown scheduledTime={room.scheduled_time} />
                </Link>
              ))}
            </div>
          </BentoCard>
        )}
      </motion.div>
    </div>
  );
}

function RoomCountdown({ scheduledTime }: { scheduledTime: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    function tick() {
      const diff = new Date(scheduledTime).getTime() - Date.now();
      if (diff <= 0) {
        setText("Live");
        return;
      }
      const m = Math.floor(diff / 60000);
      const h = Math.floor(m / 60);
      setText(h > 0 ? `${h}h ${m % 60}m` : `${m}m`);
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [scheduledTime]);
  return <span className="font-mono text-xs text-cyan">{text}</span>;
}

function RowBadge({ label, live }: { label: string; live: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {live && <LiveDot />}
      <span className="badge-live">{label}</span>
    </div>
  );
}
