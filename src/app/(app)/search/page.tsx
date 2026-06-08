import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/afterglow/page-header";
import { StreamingSearchPanel } from "@/components/streaming-search-panel";

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: watchlist }, { data: trackedTitles }] = await Promise.all([
    supabase
      .from("streampass_watchlist")
      .select("*")
      .eq("user_id", user!.id),
    supabase
      .from("streampass_tracked_titles")
      .select("*")
      .eq("user_id", user!.id),
  ]);

  return (
    <div className="page-shell max-w-4xl">
      <PageHeader
        badge="Find"
        title="Where to Watch"
        subtitle="Search any show or movie — see every platform it's on, then save to your watchlist or passport."
      />
      <StreamingSearchPanel
        variant="page"
        initialWatchlist={watchlist ?? []}
        initialTrackedTitles={trackedTitles ?? []}
      />
    </div>
  );
}
