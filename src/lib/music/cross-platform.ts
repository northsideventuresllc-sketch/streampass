import type { CrossPlatformLinks, MusicTrack } from "./types";

interface SongLinkResponse {
  linksByPlatform?: Record<
    string,
    { url?: string; entityUniqueId?: string; nativeAppUriDesktop?: string }
  >;
}

type JamQueueItemLike = {
  track_title: string;
  track_artist: string;
  spotify_url: string | null;
  apple_music_url: string | null;
};

/** Resolve a Spotify URL to links on other streaming platforms via song.link. */
export async function resolveCrossPlatformLinks(
  spotifyUrl: string
): Promise<CrossPlatformLinks> {
  try {
    const res = await fetch(
      `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(spotifyUrl)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { spotify: spotifyUrl };

    const data = (await res.json()) as SongLinkResponse;
    const links = data.linksByPlatform ?? {};

    return {
      spotify: links.spotify?.url ?? spotifyUrl,
      appleMusic: links.appleMusic?.url,
      youtubeMusic: links.youtubeMusic?.url,
      tidal: links.tidal?.url,
      deezer: links.deezer?.url,
    };
  } catch {
    return { spotify: spotifyUrl };
  }
}

/** Enrich a track with cross-platform URLs when we have a Spotify link. */
export async function enrichTrackWithPlatformLinks(
  track: MusicTrack
): Promise<MusicTrack> {
  if (!track.spotifyUrl && !track.spotifyUri) return track;

  const spotifyUrl =
    track.spotifyUrl ??
    (track.spotifyUri
      ? `https://open.spotify.com/track/${track.spotifyUri.replace("spotify:track:", "")}`
      : null);

  if (!spotifyUrl) return track;

  const links = await resolveCrossPlatformLinks(spotifyUrl);

  return {
    ...track,
    spotifyUrl: links.spotify ?? track.spotifyUrl,
    appleMusicUrl: links.appleMusic ?? track.appleMusicUrl,
  };
}

export function getTrackLinkForPlatform(
  track: Pick<
    JamQueueItemLike,
    "track_title" | "track_artist" | "spotify_url" | "apple_music_url"
  >,
  platform: string
): string {
  if (platform === "Spotify" && track.spotify_url) return track.spotify_url;
  if (platform === "Apple Music" && track.apple_music_url)
    return track.apple_music_url;

  const query = `${track.track_title} ${track.track_artist}`;
  if (platform === "Spotify") {
    return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  }
  if (platform === "Apple Music") {
    return `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} ${platform}`)}`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
