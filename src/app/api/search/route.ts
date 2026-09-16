import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTmdbApiKey } from "@/lib/tmdb/client";
import {
  getStreamingTitleAvailability,
  searchStreamingTitles,
} from "@/lib/tmdb/search";
import type { TmdbMediaType } from "@/lib/tmdb/types";

export async function GET(request: Request) {
  // SECURITY (2026-09-14 audit): middleware excludes /api/* from its login
  // redirect, so this route is reachable unauthenticated unless it checks the
  // session itself. Every caller (streaming-search-bar, watchlist/passport
  // quick-add, the /search page) lives behind the logged-in `(app)` layout, so
  // there is no legitimate anonymous use to preserve — match the session
  // check already used by /api/recommendations.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
