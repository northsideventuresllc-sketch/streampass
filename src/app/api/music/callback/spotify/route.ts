import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeSpotifyCode,
  getSpotifyProfile,
} from "@/lib/music/spotify";
import { cookies } from "next/headers";

function getRedirectUri(request: Request): string {
  const origin = new URL(request.url).origin;
  return `${origin}/api/music/callback/spotify`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/jams?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("spotify_oauth_state")?.value;
  cookieStore.delete("spotify_oauth_state");

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      new URL("/jams?error=invalid_oauth_state", request.url)
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const redirectUri = getRedirectUri(request);
    const tokens = await exchangeSpotifyCode(code, redirectUri);
    const profile = await getSpotifyProfile(tokens.access_token);

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    const { error: upsertError } = await supabase
      .from("streampass_connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "Spotify",
          platform_user_id: profile.id,
          display_name: profile.display_name,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expires_at: expiresAt,
          scopes: tokens.scope.split(" "),
        },
        { onConflict: "user_id,platform" }
      );

    if (upsertError) {
      return NextResponse.redirect(
        new URL("/jams?error=save_failed", request.url)
      );
    }

    return NextResponse.redirect(new URL("/jams?connected=spotify", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/jams?error=spotify_auth_failed", request.url)
    );
  }
}
