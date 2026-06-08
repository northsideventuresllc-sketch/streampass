import type { MusicTrack, SpotifySearchTrack } from "./types";
import { enrichTrackWithPlatformLinks } from "./cross-platform";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export function isSpotifyConfigured(): boolean {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET
  );
}

export function getSpotifyAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const scopes = [
    "user-read-email",
    "user-read-private",
    "user-modify-playback-state",
    "user-read-playback-state",
    "streaming",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeSpotifyCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshSpotifyToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error("Spotify token refresh failed");
  }

  return res.json();
}

async function getClientCredentialsToken(): Promise<string | null> {
  if (!isSpotifyConfigured()) return null;

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token as string;
}

function spotifyTrackToMusicTrack(item: SpotifySearchTrack): MusicTrack {
  return {
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    album: item.album.name,
    artworkUrl: item.album.images[0]?.url,
    durationMs: item.duration_ms,
    isrc: item.external_ids?.isrc,
    spotifyUri: item.uri,
    spotifyUrl: item.external_urls.spotify,
  };
}

export async function searchSpotifyTracks(
  query: string,
  accessToken?: string
): Promise<MusicTrack[]> {
  const token = accessToken ?? (await getClientCredentialsToken());
  if (!token) return [];

  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "12",
  });

  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const items = (data.tracks?.items ?? []) as SpotifySearchTrack[];

  const tracks = items.map(spotifyTrackToMusicTrack);
  return Promise.all(tracks.map(enrichTrackWithPlatformLinks));
}

export async function getSpotifyProfile(accessToken: string): Promise<{
  id: string;
  display_name: string | null;
  email: string | null;
}> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Spotify profile");
  return res.json();
}
