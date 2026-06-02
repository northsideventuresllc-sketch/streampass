import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AmbientBg } from "@/components/afterglow/ambient-bg";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <AmbientBg />
      <div className="relative z-10 max-w-xl text-center">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
          Northside Intelligence · Sector 1B
        </p>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          <span className="text-gradient">Stream Pass</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-muted">
          Cross-platform streaming command center. Watch parties, AI picks,
          subscription pulse — one afterglow dashboard.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/signup" className="btn-primary px-10 py-3.5">
            Get started
          </Link>
          <Link href="/login" className="btn-secondary px-10 py-3.5">
            Sign in
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-8 z-10">
        <span className="badge-magenta">A Northside Intelligence Project</span>
      </footer>
    </div>
  );
}
