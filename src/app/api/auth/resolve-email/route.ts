import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
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
