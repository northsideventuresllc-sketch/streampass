import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// SECURITY (2026-09-14 audit): this endpoint returns the real account email
// for any submitted identifier and is unauthenticated by necessity (it runs
// before login) — that makes it a username -> email enumeration oracle with
// no limit in front of it. Rate-limit by IP to slow mass enumeration; this is
// deliberately generous since it also gates real login attempts.
const RESOLVE_EMAIL_RATE_LIMIT = 10;
const RESOLVE_EMAIL_RATE_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(
    `resolve-email:${ip}`,
    RESOLVE_EMAIL_RATE_LIMIT,
    RESOLVE_EMAIL_RATE_WINDOW_MS
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let body: { identifier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const identifier = body.identifier?.trim();
  if (!identifier) {
    return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceRoleKey && supabaseUrl) {
    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: email, error } = await admin.rpc("streampass_email_for_login", {
      login_identifier: identifier,
    });

    if (error) {
      return NextResponse.json({ error: "Could not resolve login" }, { status: 500 });
    }

    if (!email) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ email });
  }

  return NextResponse.json(
    { error: "Username sign-in is unavailable. Try your email instead." },
    { status: 503 }
  );
}
