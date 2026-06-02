export const STREAMING_SERVICES = [
  "Netflix",
  "Hulu",
  "Disney+",
  "Max",
  "Prime",
  "Apple TV+",
  "Peacock",
  "Paramount+",
  "Spotify",
  "Apple Music",
] as const;

export type StreamingService = (typeof STREAMING_SERVICES)[number];

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

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/watchlist", label: "Watchlist", icon: "ListVideo" },
  { href: "/discover", label: "Discover", icon: "Sparkles" },
  { href: "/subscriptions", label: "Subscriptions", icon: "CreditCard" },
  { href: "/passport", label: "Passport", icon: "Bell" },
  { href: "/rooms", label: "Rooms", icon: "Users" },
] as const;
