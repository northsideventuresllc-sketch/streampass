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

export interface WatchRoom {
  id: string;
  created_by: string;
  title: string;
  platform: string;
  scheduled_time: string;
  share_code: string;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
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
