import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(request: Request) {
  const adminKey = process.env.STREAMPASS_ADMIN_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { error: "Admin key not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { id, current_platform, expires_at } = body as {
    id: string;
    current_platform?: string;
    expires_at?: string | null;
  };

  if (!id) {
    return NextResponse.json({ error: "Missing title id" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing, error: fetchError } = await admin
    .from("streampass_tracked_titles")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Title not found" }, { status: 404 });
  }

  const platformChanged =
    current_platform && current_platform !== existing.current_platform;
  const expiringSoon =
    expires_at &&
    new Date(expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  let alertReason: string | null = null;
  if (platformChanged) {
    alertReason = `Moved from ${existing.current_platform} to ${current_platform}`;
  } else if (expiringSoon) {
    alertReason = `Expiring soon on ${existing.current_platform}`;
  }

  const { data, error } = await admin
    .from("streampass_tracked_titles")
    .update({
      previous_platform: platformChanged
        ? existing.current_platform
        : existing.previous_platform,
      current_platform: current_platform ?? existing.current_platform,
      expires_at: expires_at !== undefined ? expires_at : existing.expires_at,
      alert_triggered: Boolean(alertReason),
      alert_reason: alertReason,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ title: data });
}
