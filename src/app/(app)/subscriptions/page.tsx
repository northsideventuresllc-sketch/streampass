import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/afterglow/page-header";
import { SubscriptionsManager } from "@/components/subscriptions-manager";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: services } = await supabase
    .from("streampass_user_services")
    .select("*")
    .eq("user_id", user!.id)
    .order("service_name");

  return (
    <div className="page-shell">
      <PageHeader
        badge="Intelligence"
        title="Subscriptions"
        subtitle="Track spend, spot idle services, find savings."
      />
      <SubscriptionsManager initialServices={services ?? []} />
    </div>
  );
}
