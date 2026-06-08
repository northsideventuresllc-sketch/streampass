import { NextResponse } from "next/server";
import { getTmdbApiKey } from "@/lib/tmdb/client";
import { suggestStreamingTitles } from "@/lib/tmdb/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  if (!getTmdbApiKey()) {
    return NextResponse.json(
      { error: "Search is not configured. Add TMDB_API_KEY to your environment." },
      { status: 503 }
    );
  }

  try {
    const suggestions = await suggestStreamingTitles(query);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Search suggest error:", err);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
