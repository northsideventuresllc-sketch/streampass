import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchSpotifyTracks, isSpotifyConfigured } from "@/lib/music/spotify";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  let accessToken: string | undefined;

  if (isSpotifyConfigured()) {
    const { data: account } = await supabase
      .from("streampass_connected_accounts")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("platform", "Spotify")
      .single();

    accessToken = account?.access_token ?? undefined;
  }

  const tracks = await searchSpotifyTracks(q, accessToken);

  return NextResponse.json({ tracks });
}
