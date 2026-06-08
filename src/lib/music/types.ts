import type { MusicStreamingService } from "@/lib/constants";

export interface MusicTrack {
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  durationMs?: number;
  isrc?: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

export interface CrossPlatformLinks {
  spotify?: string;
  appleMusic?: string;
  youtubeMusic?: string;
  tidal?: string;
  deezer?: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: MusicStreamingService;
  platform_user_id: string | null;
  display_name: string | null;
  connected_at: string;
}

export interface JamQueueItem {
  id: string;
  room_id: string;
  added_by: string;
  track_title: string;
  track_artist: string;
  track_album: string | null;
  track_artwork_url: string | null;
  track_duration_ms: number | null;
  isrc: string | null;
  spotify_uri: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  position: number;
  votes: number;
  added_at: string;
}

export interface JamState {
  room_id: string;
  queue_item_id: string | null;
  started_at: string | null;
  is_playing: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface SpotifySearchTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
  external_ids?: { isrc?: string };
  uri: string;
  external_urls: { spotify: string };
}
