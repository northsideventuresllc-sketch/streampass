import type { SupabaseClient } from "@supabase/supabase-js";
import type { WatchlistItem } from "@/lib/types";
import type { TmdbMediaType } from "@/lib/tmdb/types";
import type { VideoStreamingService } from "@/lib/constants";

export interface AddToWatchlistInput {
  title: string;
  platform: VideoStreamingService | string;
  externalId?: number;
  mediaType?: TmdbMediaType;
  posterUrl?: string | null;
  releaseYear?: number | null;
}

export async function addToWatchlist(
  supabase: SupabaseClient,
  userId: string,
  existingItems: WatchlistItem[],
  input: AddToWatchlistInput
): Promise<{ data: WatchlistItem | null; error: string | null }> {
  const duplicate = existingItems.some(
    (item) =>
      item.title.toLowerCase() === input.title.toLowerCase() &&
      item.platform === input.platform &&
      item.status !== "dropped"
  );

  if (duplicate) {
    return { data: null, error: "Already on your watchlist for this platform." };
  }

  const maxOrder = existingItems.reduce(
    (max, item) => Math.max(max, item.priority_order),
    -1
  );

  const { data, error } = await supabase
    .from("streampass_watchlist")
    .insert({
      user_id: userId,
      title: input.title,
      platform: input.platform,
      status: "queued",
      priority_order: maxOrder + 1,
      external_id: input.externalId ? String(input.externalId) : null,
      media_type: input.mediaType ?? null,
      poster_url: input.posterUrl ?? null,
      release_year: input.releaseYear ?? null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
