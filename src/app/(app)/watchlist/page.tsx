import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/afterglow/page-header";
import { WatchlistManager } from "@/components/watchlist-manager";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: items }, { data: trackedTitles }] = await Promise.all([
    supabase
      .from("streampass_watchlist")
      .select("*")
      .eq("user_id", user!.id)
      .order("priority_order", { ascending: true }),
    supabase
      .from("streampass_tracked_titles")
      .select("*")
      .eq("user_id", user!.id),
  ]);

  return (
    <div className="page-shell">
      <PageHeader
        badge="Library"
        title="Watchlist"
        subtitle="Your saved queue across every platform. Drag to reorder."
      />
      <WatchlistManager
        initialItems={items ?? []}
        initialTrackedTitles={trackedTitles ?? []}
      />
    </div>
  );
}
