import type { VideoStreamingService } from "@/lib/constants";

export type TmdbMediaType = "movie" | "tv";

export interface StreamingPlatformOption {
  service: VideoStreamingService;
  link: string;
}

export interface StreamingSearchHit {
  externalId: number;
  mediaType: TmdbMediaType;
  title: string;
  overview: string;
  posterUrl: string | null;
  releaseYear: number | null;
  rating: number | null;
  platforms: StreamingPlatformOption[];
  score: number;
  isTopMatch: boolean;
}

export interface StreamingSearchSuggestion {
  externalId: number;
  mediaType: TmdbMediaType;
  title: string;
  subtitle: string;
  posterUrl: string | null;
  releaseYear: number | null;
}
