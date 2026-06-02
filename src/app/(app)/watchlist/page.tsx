import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/afterglow/page-header";
import { WatchlistManager } from "@/components/watchlist-manager";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("streampass_watchlist")
    .select("*")
    .eq("user_id", user!.id)
    .order("priority_order", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        badge="Library"
        title="Watchlist"
        subtitle="One queue across every platform. Drag to reorder."
      />
      <WatchlistManager initialItems={items ?? []} />
    </div>
  );
}
