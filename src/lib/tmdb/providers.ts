import type { VideoStreamingService } from "@/lib/constants";
import { VIDEO_STREAMING_SERVICES } from "@/lib/constants";
import { getPlatformDeepLink } from "@/lib/platform-links";

/** TMDB US watch-provider names mapped to Stream Pass services. */
const PROVIDER_ALIASES: Record<string, VideoStreamingService> = {
  netflix: "Netflix",
  hulu: "Hulu",
  "disney plus": "Disney+",
  "amazon prime video": "Prime",
  prime: "Prime",
  "apple tv plus": "Apple TV+",
  "apple tv+": "Apple TV+",
  max: "Max",
  "hbo max": "Max",
  peacock: "Peacock",
  "peacock premium": "Peacock",
  "paramount plus": "Paramount+",
  "paramount+": "Paramount+",
};

function normalizeProviderName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function mapProviderToService(
  providerName: string
): VideoStreamingService | null {
  const normalized = normalizeProviderName(providerName);
  if (PROVIDER_ALIASES[normalized]) {
    return PROVIDER_ALIASES[normalized];
  }

  for (const service of VIDEO_STREAMING_SERVICES) {
    if (normalized.includes(normalizeProviderName(service))) {
      return service;
    }
  }

  return null;
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

export function extractPlatformOptions(
  payload: TmdbProviderPayload,
  title: string
): Array<{ service: VideoStreamingService; link: string }> {
  const us = payload.results?.US;
  if (!us) return [];

  const providers = [...(us.flatrate ?? []), ...(us.free ?? []), ...(us.ads ?? [])];
  const seen = new Set<VideoStreamingService>();
  const options: Array<{ service: VideoStreamingService; link: string }> = [];

  for (const provider of providers) {
    const service = mapProviderToService(provider.provider_name);
    if (!service || seen.has(service)) continue;
    seen.add(service);
    options.push({
      service,
      link: getPlatformDeepLink(service, title),
    });
  }

  return options.sort((a, b) =>
    VIDEO_STREAMING_SERVICES.indexOf(a.service) -
    VIDEO_STREAMING_SERVICES.indexOf(b.service)
  );
}
