"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  Sparkles,
  CreditCard,
  Bell,
  ListVideo,
  Users,
  Play,
  Plus,
} from "lucide-react";
import { BentoCard } from "./bento-card";
import { LiveDot } from "./live-dot";
import { Countdown } from "./countdown";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import { bentoContainer } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils";
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
}: DashboardBentoProps) {
  const reduceMotion = useReducedMotion();
  const heroRoom = rooms[0];
  const soon = heroRoom ? isRoomSoon(heroRoom.scheduled_time) : false;
  const live = heroRoom ? isRoomLive(heroRoom.scheduled_time) : false;

  return (
    <div className="page-shell">
      <header className="page-header-3d mb-6 lg:mb-8">
        <div className="page-header-spotlight" aria-hidden />
        <p className="relative z-[1] mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#a1a1aa]">
          Afterglow · Command Center
        </p>
        <h1 className="relative z-[1] font-display text-3xl font-bold tracking-tight md:text-4xl">
          {username ? (
            <>
              Hey,{" "}
              <span className="text-gradient-hero">{username}</span>
            </>
          ) : (
            <span className="text-gradient-hero">Stream Pass</span>
          )}
        </h1>
      </header>

      <motion.div
        variants={reduceMotion ? undefined : bentoContainer}
        initial={false}
        animate="show"
        className="dashboard-bento"
      >
        <motion.div
          variants={reduceMotion ? undefined : bentoContainer}
          className="dashboard-bento__main"
        >
          {heroRoom ? (
            <BentoCard
              variant="hero"
              href={`/rooms/${heroRoom.share_code}`}
              className="relative z-[1] flex min-h-[280px] flex-col justify-between"
            >
              <div className="relative z-[1] flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  {(soon || live) && <LiveDot />}
                  <span className="badge-live">Watch Party</span>
                </div>
                <Countdown scheduledTime={heroRoom.scheduled_time} />
              </div>

              <div className="relative z-[1] mt-6">
                <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
                  {heroRoom.title}
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#a1a1aa]">
                  <span className="badge-magenta">{heroRoom.platform}</span>
                  <span>Code {heroRoom.share_code}</span>
                </p>
              </div>

              <div className="relative z-[1] mt-6 flex items-center justify-between">
                <div className="avatar-stack">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="text-xs text-[#a1a1aa]">Friends syncing</span>
              </div>

              {live && (
                <div className="relative z-[1] mt-4 flex items-center gap-2 text-sm font-medium text-[#4ade80]">
                  <Play className="h-4 w-4" />
                  Press Play on your device
                </div>
              )}
            </BentoCard>
          ) : (
            <BentoCard
              variant="hero"
              href="/rooms"
              className="relative z-[1] flex min-h-[280px] flex-col justify-between"
            >
              <div className="relative z-[1] flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <LiveDot />
                  <span className="badge-live">Watch Party · LIVE</span>
                </div>
                <span className="countdown-display">00:42:18</span>
              </div>

              <div className="relative z-[1]">
                <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
                  Your next watch party
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#a1a1aa]">
                  <span className="badge-magenta">Any platform</span>
                  <span>Sync · Chat · Press Play together</span>
                </p>
              </div>

              <div className="relative z-[1] flex items-center justify-between">
                <div className="avatar-stack">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[#e879f9]">
                  <Plus className="h-4 w-4" />
                  Create room
                </span>
              </div>
            </BentoCard>
          )}

          <div className="dashboard-bento__stats">
            <BentoCard variant="cyan" tilt className="flex flex-col justify-between">
              <CreditCard className="h-5 w-5 text-[#22d3ee]" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#a1a1aa]">
                  Monthly spend
                </p>
                <p className="stat-value mt-2 text-white">
                  {formatCurrency(totalSpend)}
                </p>
              </div>
              <Link
                href="/subscriptions"
                className="mt-3 text-xs text-[#22d3ee] hover:underline"
              >
                Subscriptions →
              </Link>
            </BentoCard>

            <BentoCard variant="magenta" tilt className="flex flex-col justify-between">
              <ListVideo className="h-5 w-5 text-[#e879f9]" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#a1a1aa]">
                  Queue
                </p>
                <p className="stat-value mt-2 text-white">{watchlistCount}</p>
              </div>
              <Link
                href="/watchlist"
                className="mt-3 text-xs text-[#e879f9] hover:underline"
              >
                Watchlist →
              </Link>
            </BentoCard>
          </div>
        </motion.div>

        <BentoCard variant="ai" className="dashboard-bento__ai flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#e879f9]" />
              <span className="font-display text-lg font-semibold text-white">
                AI Picks
              </span>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <RecommendationsPanel compact />
          </div>
        </BentoCard>
      </motion.div>

      {(alerts.length > 0 || rooms.length > 1) && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {alerts.length > 0 && (
            <BentoCard className="border-[rgba(251,191,36,0.3)]">
              <div className="mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#fbbf24]" />
                <span className="font-display font-semibold text-[#fbbf24]">
                  Passport · {alerts.length}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="min-w-[200px] shrink-0 rounded-xl border border-white/10 bg-black/50 p-3"
                  >
                    <p className="text-sm font-medium text-white">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-xs text-[#fbbf24]">
                      {alert.alert_reason}
                    </p>
                  </div>
                ))}
              </div>
            </BentoCard>
          )}

          {rooms.length > 1 && (
            <BentoCard>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#e879f9]" />
                <span className="font-display font-semibold text-white">
                  More rooms
                </span>
              </div>
              <div className="space-y-2">
                {rooms.slice(1, 3).map((room) => (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.share_code}`}
                    className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 text-sm transition hover:bg-black/60"
                  >
                    <span className="text-white">{room.title}</span>
                    <span className="badge-magenta">{room.platform}</span>
                  </Link>
                ))}
              </div>
            </BentoCard>
          )}
        </div>
      )}
    </div>
  );
}
