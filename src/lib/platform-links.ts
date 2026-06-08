import type { StreamingService } from "./constants";
import { VIDEO_STREAMING_SERVICES, MUSIC_STREAMING_SERVICES } from "./constants";

const VIDEO_PLATFORM_URLS: Record<
  (typeof VIDEO_STREAMING_SERVICES)[number],
  (title: string) => string
> = {
  Netflix: (title) =>
    `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  Hulu: (title) =>
    `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
  "Disney+": (title) =>
    `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
  Max: (title) =>
    `https://play.max.com/search?q=${encodeURIComponent(title)}`,
  Prime: (title) =>
    `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
  "Apple TV+": (title) =>
    `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  Peacock: (title) =>
    `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`,
  "Paramount+": (title) =>
    `https://www.paramountplus.com/search/?q=${encodeURIComponent(title)}`,
};

const MUSIC_PLATFORM_URLS: Record<
  (typeof MUSIC_STREAMING_SERVICES)[number],
  (title: string) => string
> = {
  Spotify: (title) =>
    `https://open.spotify.com/search/${encodeURIComponent(title)}`,
  "Apple Music": (title) =>
    `https://music.apple.com/us/search?term=${encodeURIComponent(title)}`,
};

const PLATFORM_URLS: Record<StreamingService, (title: string) => string> = {
  ...VIDEO_PLATFORM_URLS,
  ...MUSIC_PLATFORM_URLS,
};

export function getPlatformDeepLink(
  platform: string,
  title: string
): string {
  const builder = PLATFORM_URLS[platform as StreamingService];
  if (builder) return builder(title);
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} ${platform}`)}`;
}

export function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
