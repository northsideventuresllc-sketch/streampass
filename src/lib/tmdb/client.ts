const TMDB_BASE = "https://api.themoviedb.org/3";

export function getTmdbApiKey(): string | null {
  return process.env.TMDB_API_KEY ?? null;
}

export function posterUrl(path: string | null | undefined, size = "w342"): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured");
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}
