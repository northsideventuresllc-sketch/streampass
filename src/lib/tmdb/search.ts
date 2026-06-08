import { posterUrl, tmdbFetch } from "./client";
import { extractPlatformOptions } from "./providers";
import type {
  StreamingSearchHit,
  StreamingSearchSuggestion,
  TmdbMediaType,
} from "./types";

interface TmdbSearchItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
}

interface TmdbSearchResponse {
  results: TmdbSearchItem[];
}

interface TmdbProviderPayload {
  results?: {
    US?: {
      flatrate?: Array<{ provider_name: string }>;
      free?: Array<{ provider_name: string }>;
      ads?: Array<{ provider_name: string }>;
    };
  };
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function yearFromDate(date?: string): number | null {
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function displayTitle(item: TmdbSearchItem): string {
  return item.title ?? item.name ?? "Untitled";
}

function originalTitle(item: TmdbSearchItem): string {
  return item.original_title ?? item.original_name ?? displayTitle(item);
}

function mediaLabel(type: TmdbMediaType): string {
  return type === "movie" ? "Movie" : "TV Series";
}

export function scoreSearchHit(query: string, item: TmdbSearchItem): number {
  const q = normalizeText(query);
  if (!q) return 0;

  const title = normalizeText(displayTitle(item));
  const original = normalizeText(originalTitle(item));

  let accuracy = 0;
  if (title === q || original === q) accuracy = 1;
  else if (title.startsWith(q) || original.startsWith(q)) accuracy = 0.88;
  else if (title.includes(q) || original.includes(q)) accuracy = 0.72;
  else {
    const words = q.split(" ").filter(Boolean);
    const matched = words.filter(
      (word) => title.includes(word) || original.includes(word)
    ).length;
    accuracy = words.length ? (matched / words.length) * 0.55 : 0;
  }

  const popularity = Math.min((item.popularity ?? 0) / 120, 1);
  const ratingBoost = ((item.vote_average ?? 0) / 10) * 0.15;

  return accuracy * 0.7 + popularity * 0.2 + ratingBoost * 0.1;
}

function toSuggestion(
  item: TmdbSearchItem,
  mediaType: TmdbMediaType
): StreamingSearchSuggestion {
  const title = displayTitle(item);
  const year = yearFromDate(item.release_date ?? item.first_air_date);

  return {
    externalId: item.id,
    mediaType,
    title,
    subtitle: [mediaLabel(mediaType), year ? String(year) : null]
      .filter(Boolean)
      .join(" · "),
    posterUrl: posterUrl(item.poster_path, "w92"),
    releaseYear: year,
  };
}

function filterSearchItems(results: TmdbSearchItem[]): Array<{
  item: TmdbSearchItem;
  mediaType: TmdbMediaType;
}> {
  return results
    .filter(
      (item): item is TmdbSearchItem & { media_type: TmdbMediaType } =>
        item.media_type === "movie" || item.media_type === "tv"
    )
    .map((item) => ({ item, mediaType: item.media_type }));
}

async function fetchAvailability(
  mediaType: TmdbMediaType,
  externalId: number,
  title: string
) {
  const payload = await tmdbFetch<TmdbProviderPayload>(
    `/${mediaType}/${externalId}/watch/providers`
  );
  return extractPlatformOptions(payload, title);
}

export async function suggestStreamingTitles(
  query: string
): Promise<StreamingSearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const data = await tmdbFetch<TmdbSearchResponse>("/search/multi", {
    query: trimmed,
    include_adult: "false",
    language: "en-US",
  });

  return filterSearchItems(data.results)
    .slice(0, 8)
    .map(({ item, mediaType }) => toSuggestion(item, mediaType));
}

export async function searchStreamingTitles(
  query: string
): Promise<StreamingSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const data = await tmdbFetch<TmdbSearchResponse>("/search/multi", {
    query: trimmed,
    include_adult: "false",
    language: "en-US",
  });

  const ranked = filterSearchItems(data.results)
    .map(({ item, mediaType }) => ({
      item,
      mediaType,
      score: scoreSearchHit(trimmed, item),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const hits = await Promise.all(
    ranked.map(async ({ item, mediaType, score }, index) => {
      const title = displayTitle(item);
      const platforms = await fetchAvailability(mediaType, item.id, title);

      return {
        externalId: item.id,
        mediaType,
        title,
        overview: item.overview?.trim() || "No description available.",
        posterUrl: posterUrl(item.poster_path, "w342"),
        releaseYear: yearFromDate(item.release_date ?? item.first_air_date),
        rating: item.vote_average ?? null,
        platforms,
        score,
        isTopMatch: index === 0,
      } satisfies StreamingSearchHit;
    })
  );

  return hits;
}

export async function getStreamingTitleAvailability(
  mediaType: TmdbMediaType,
  externalId: number
): Promise<StreamingSearchHit | null> {
  const path = mediaType === "movie" ? "/movie/" : "/tv/";
  const item = await tmdbFetch<TmdbSearchItem>(`${path}${externalId}`, {
    language: "en-US",
  });

  const title = displayTitle(item);
  const platforms = await fetchAvailability(mediaType, externalId, title);

  return {
    externalId,
    mediaType,
    title,
    overview: item.overview?.trim() || "No description available.",
    posterUrl: posterUrl(item.poster_path, "w342"),
    releaseYear: yearFromDate(item.release_date ?? item.first_air_date),
    rating: item.vote_average ?? null,
    platforms,
    score: 1,
    isTopMatch: true,
  };
}
