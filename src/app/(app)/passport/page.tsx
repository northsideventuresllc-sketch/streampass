import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/afterglow/page-header";
import { PassportManager } from "@/components/passport-manager";

export default async function PassportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: titles } = await supabase
    .from("streampass_tracked_titles")
    .select("*")
    .eq("user_id", user!.id)
    .order("tracked_at", { ascending: false });

  return (
    <div className="page-shell">
      <PageHeader
        badge="Alerts"
        title="Content Passport"
        subtitle="Track shows and movies — get notified when they move or expire."
      />
      <PassportManager initialTitles={titles ?? []} />
    </div>
  );
}
