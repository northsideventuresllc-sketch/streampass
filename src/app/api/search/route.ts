import { NextResponse } from "next/server";
import { getTmdbApiKey } from "@/lib/tmdb/client";
import {
  getStreamingTitleAvailability,
  searchStreamingTitles,
} from "@/lib/tmdb/search";
import type { TmdbMediaType } from "@/lib/tmdb/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const externalId = searchParams.get("id");
  const mediaType = searchParams.get("type") as TmdbMediaType | null;

  if (!getTmdbApiKey()) {
    return NextResponse.json(
      { error: "Search is not configured. Add TMDB_API_KEY to your environment." },
      { status: 503 }
    );
  }

  try {
    if (externalId && (mediaType === "movie" || mediaType === "tv")) {
      const result = await getStreamingTitleAvailability(
        mediaType,
        Number.parseInt(externalId, 10)
      );
      if (!result) {
        return NextResponse.json({ error: "Title not found" }, { status: 404 });
      }
      return NextResponse.json({ results: [result] });
    }

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchStreamingTitles(query);
    return NextResponse.json({ results, query });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Failed to search titles" }, { status: 500 });
  }
}
