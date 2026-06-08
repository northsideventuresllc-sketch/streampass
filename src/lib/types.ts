import type { StreamingService, WatchlistStatus } from "./constants";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserService {
  id: string;
  user_id: string;
  service_name: StreamingService | string;
  monthly_cost: number;
  subscribed_at: string;
  last_active_at: string | null;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  status: WatchlistStatus;
  priority_order: number;
  added_at: string;
  watched_at: string | null;
  external_id?: string | null;
  media_type?: "movie" | "tv" | null;
  poster_url?: string | null;
  release_year?: number | null;
}

export interface TrackedTitle {
  id: string;
  user_id: string;
  title: string;
  current_platform: string;
  previous_platform: string | null;
  expires_at: string | null;
  alert_triggered: boolean;
  alert_reason: string | null;
  tracked_at: string;
}

export type RoomType = "watch" | "listen";

export interface WatchRoom {
  id: string;
  created_by: string;
  title: string;
  platform: string;
  scheduled_time: string;
  share_code: string;
  created_at: string;
  room_type?: RoomType;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  listening_platform?: string | null;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: string;
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

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  sent_at: string;
}

export interface Recommendation {
  title: string;
  platform: string;
  reasoning: string;
}
