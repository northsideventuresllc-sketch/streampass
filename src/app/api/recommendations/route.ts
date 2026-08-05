import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isVideoService } from "@/lib/constants";
import type { Recommendation } from "@/lib/types";
import { callAxonLocal } from "@/lib/axon-local-relay";

const GEMINI_MODEL = "gemini-2.0-flash";

function parseRecommendations(text: string): Recommendation[] | null {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as Recommendation[];
  } catch {
    return null;
  }
}

async function callGeminiOnce(apiKey: string, prompt: string): Promise<string | null> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
      }),
    }
  );
  if (!r.ok) return null;
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text)
    .join("")
    ?.trim();
  return text || null;
}

async function callGemini(prompt: string): Promise<string | null> {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_BACKUP].filter(
    (k): k is string => Boolean(k)
  );
  for (const key of keys) {
    try {
      const text = await callGeminiOnce(key, prompt);
      if (text) return text;
    } catch {
      // try next key
    }
  }
  return null;
}

async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  if (!anthropicKey && !hasGemini) {
    return NextResponse.json(
      { error: "No recommendation provider configured" },
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
    watchlist
      ?.filter((w) => w.status === "watched" && isVideoService(w.platform))
      .map((w) => w.title) ?? [];
  const inProgress =
    watchlist
      ?.filter((w) => w.status === "in_progress" && isVideoService(w.platform))
      .map((w) => w.title) ?? [];
  const subscribedVideoServices =
    services
      ?.filter((s) => isVideoService(s.service_name))
      .map((s) => s.service_name)
      .join(", ") || "None configured";

  if (watchedTitles.length === 0 && inProgress.length === 0) {
    return NextResponse.json({
      recommendations: [],
      message:
        "Add watched or in-progress titles to your watchlist to unlock AI recommendations.",
    });
  }

  const prompt = `You are a cross-platform video streaming recommendation engine for Stream Pass.

User's subscribed video services: ${subscribedVideoServices}
Watched titles: ${watchedTitles.join(", ") || "None"}
Currently in progress: ${inProgress.join(", ") || "None"}

Based on this watch history across video platforms, recommend exactly 5 TV shows or movies the user would enjoy.
Only recommend titles available on video services the user is subscribed to.
Do not recommend music, podcasts, or audio-only content.
Each recommendation must specify which video platform it lives on.

Respond with ONLY valid JSON array, no markdown:
[
  {"title": "Show Name", "platform": "Netflix", "reasoning": "Brief reason why this fits their taste"}
]`;

  try {
    // AXON-EVERYWHERE-PROJECT (2026-08-05): AXON-local (Mac mini) -> Gemini main ->
    // Gemini backup -> Anthropic (paid, last resort). Decision #598 item 11 / #619.
    // AXON-local returns null (and this app falls through unchanged) until
    // NI_BRAIN_SUPABASE_URL / NI_BRAIN_SUPABASE_SERVICE_ROLE_KEY are set in this app's env.
    let text: string | null = await callAxonLocal(
      "You are a cross-platform video streaming recommendation engine for Stream Pass. Respond with ONLY valid JSON, no markdown.",
      prompt,
    ).catch(() => null);
    if (!text && hasGemini) {
      text = await callGemini(prompt);
    }
    if (!text && anthropicKey) {
      text = await callAnthropic(anthropicKey, prompt);
    }
    if (!text) {
      throw new Error("No recommendation provider produced a response");
    }

    const recommendations = parseRecommendations(text);
    if (!recommendations) {
      throw new Error("Could not parse recommendations");
    }

    return NextResponse.json({ recommendations: recommendations.slice(0, 5) });
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
