import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Recommendation } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API key not configured" },
      { status: 500 }
    );
  }

  const [{ data: watchlist }, { data: services }] = await Promise.all([
    supabase
      .from("streampass_watchlist")
      .select("title, platform, status")
      .eq("user_id", user.id)
      .in("status", ["watched", "in_progress"]),
    supabase
      .from("streampass_user_services")
      .select("service_name")
      .eq("user_id", user.id),
  ]);

  const watchedTitles =
    watchlist?.filter((w) => w.status === "watched").map((w) => w.title) ?? [];
  const inProgress =
    watchlist?.filter((w) => w.status === "in_progress").map((w) => w.title) ??
    [];
  const subscribedServices =
    services?.map((s) => s.service_name).join(", ") || "None configured";

  if (watchedTitles.length === 0 && inProgress.length === 0) {
    return NextResponse.json({
      recommendations: [],
      message:
        "Add watched or in-progress titles to your watchlist to unlock AI recommendations.",
    });
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `You are a cross-platform streaming recommendation engine for Stream Pass.

User's subscribed services: ${subscribedServices}
Watched titles: ${watchedTitles.join(", ") || "None"}
Currently in progress: ${inProgress.join(", ") || "None"}

Based on this watch history across ALL platforms, recommend exactly 5 titles the user would enjoy.
Only recommend titles available on services the user is subscribed to (or likely subscribed to).
Each recommendation must specify which platform it lives on.

Respond with ONLY valid JSON array, no markdown:
[
  {"title": "Show Name", "platform": "Netflix", "reasoning": "Brief reason why this fits their taste"}
]`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse recommendations");
    }

    const recommendations = JSON.parse(jsonMatch[0]) as Recommendation[];

    return NextResponse.json({ recommendations: recommendations.slice(0, 5) });
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
