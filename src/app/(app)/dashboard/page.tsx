import { createClient } from "@/lib/supabase/server";
import { DashboardBento } from "@/components/afterglow/dashboard-bento";
import { IDLE_DAYS_THRESHOLD } from "@/lib/constants";
import { daysSince } from "@/lib/utils";

function scheduledAfterLast24Hours(): string {
  const cutoff = new Date();
  cutoff.setTime(cutoff.getTime() - 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
}

export default async function DashboardPage() {
  const roomsScheduledAfter = scheduledAfterLast24Hours();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: services },
    { data: alerts },
    { data: rooms },
    { count: watchlistCount },
  ] = await Promise.all([
    supabase
      .from("streampass_profiles")
      .select("username")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("streampass_user_services")
      .select("*")
      .eq("user_id", user!.id),
    supabase
      .from("streampass_tracked_titles")
      .select("*")
      .eq("user_id", user!.id)
      .eq("alert_triggered", true),
    supabase
      .from("streampass_watch_rooms")
      .select("*")
      .gte("scheduled_time", roomsScheduledAfter)
      .order("scheduled_time", { ascending: true })
      .limit(5),
    supabase
      .from("streampass_watchlist")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .in("status", ["queued", "in_progress"]),
  ]);

  const totalSpend =
    services?.reduce((sum, s) => sum + Number(s.monthly_cost), 0) ?? 0;
  const idleCount =
    services?.filter((s) => {
      const days = daysSince(s.last_active_at);
      return days === null || days >= IDLE_DAYS_THRESHOLD;
    }).length ?? 0;

  return (
    <DashboardBento
      username={profile?.username}
      totalSpend={totalSpend}
      watchlistCount={watchlistCount ?? 0}
      alerts={alerts ?? []}
      rooms={rooms ?? []}
      services={services ?? []}
      idleCount={idleCount}
    />
  );
}
