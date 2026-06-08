import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackedTitle } from "@/lib/types";
import type { VideoStreamingService } from "@/lib/constants";

export interface AddToPassportInput {
  title: string;
  platform: VideoStreamingService | string;
}

export async function addToPassport(
  supabase: SupabaseClient,
  userId: string,
  existingTitles: TrackedTitle[],
  input: AddToPassportInput
): Promise<{ data: TrackedTitle | null; error: string | null }> {
  const duplicate = existingTitles.some(
    (item) =>
      item.title.toLowerCase() === input.title.toLowerCase() &&
      item.current_platform === input.platform
  );

  if (duplicate) {
    return { data: null, error: "Already tracked on this platform." };
  }

  const { data, error } = await supabase
    .from("streampass_tracked_titles")
    .insert({
      user_id: userId,
      title: input.title,
      current_platform: input.platform,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
