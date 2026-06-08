import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSpotifyAuthUrl, isSpotifyConfigured } from "@/lib/music/spotify";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

function getRedirectUri(request: Request): string {
  const origin = new URL(request.url).origin;
  return `${origin}/api/music/callback/spotify`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isSpotifyConfigured()) {
    return NextResponse.redirect(
      new URL("/jams?error=spotify_not_configured", request.url)
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = getRedirectUri(request);
  const authUrl = getSpotifyAuthUrl(redirectUri, state);

  return NextResponse.redirect(authUrl);
}
