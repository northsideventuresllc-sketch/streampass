export const VIDEO_STREAMING_SERVICES = [
  "Netflix",
  "Hulu",
  "Disney+",
  "Max",
  "Prime",
  "Apple TV+",
  "Peacock",
  "Paramount+",
] as const;

export const MUSIC_STREAMING_SERVICES = ["Spotify", "Apple Music"] as const;

/** All tracked subscription platforms (video + music). */
export const STREAMING_SERVICES = [
  ...VIDEO_STREAMING_SERVICES,
  ...MUSIC_STREAMING_SERVICES,
] as const;

export type VideoStreamingService = (typeof VIDEO_STREAMING_SERVICES)[number];
export type MusicStreamingService = (typeof MUSIC_STREAMING_SERVICES)[number];
export type StreamingService = (typeof STREAMING_SERVICES)[number];

export type MediaType = "video" | "music";

export function isMusicService(service: string): service is MusicStreamingService {
  return (MUSIC_STREAMING_SERVICES as readonly string[]).includes(service);
}

export function isVideoService(service: string): service is VideoStreamingService {
  return (VIDEO_STREAMING_SERVICES as readonly string[]).includes(service);
}

export function servicesForMediaType(type: MediaType) {
  return type === "music" ? MUSIC_STREAMING_SERVICES : VIDEO_STREAMING_SERVICES;
}

export const WATCHLIST_STATUSES = [
  "queued",
  "in_progress",
  "watched",
  "dropped",
] as const;

export type WatchlistStatus = (typeof WATCHLIST_STATUSES)[number];

export const STATUS_LABELS: Record<WatchlistStatus, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  watched: "Watched",
  dropped: "Dropped",
};

export const IDLE_DAYS_THRESHOLD = 14;
export const EXPIRING_SOON_DAYS = 7;

/** Static app-store / play-store mark (PNG). Web UI uses live text logo. */
export const BRAND_APP_ICON_PATH = "/branding/streampass-app-icon.png";

export const HOME_SLOGAN =
  "Where your watchlist outruns the algorithm.";

export const HOME_FEATURE_LINES = [
  "Track what you're paying for — all in one place.",
  "Host watch parties and chat with friends.",
  "Jam together — Spotify, Apple Music, any platform.",
  "Get pinged when shows jump platforms.",
  "AI picks built from what you actually watch.",
  "Sync your queue across every service.",
] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/search", label: "Search", icon: "Search" },
  { href: "/watchlist", label: "Watchlist", icon: "ListVideo" },
  { href: "/discover", label: "Discover", icon: "Sparkles" },
  { href: "/jams", label: "Jams", icon: "Headphones" },
  { href: "/subscriptions", label: "Subscriptions", icon: "CreditCard" },
  { href: "/passport", label: "Passport", icon: "Bell" },
  { href: "/rooms", label: "Rooms", icon: "Users" },
] as const;
