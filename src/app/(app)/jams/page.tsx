import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/afterglow/page-header";
import { JamsManager } from "@/components/jams-manager";
import type { WatchRoom, ConnectedAccount } from "@/lib/types";

export default async function JamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: memberRooms }, { data: connectedAccounts }] =
    await Promise.all([
      supabase
        .from("streampass_room_members")
        .select("room_id")
        .eq("user_id", user!.id),
      supabase
        .from("streampass_connected_accounts")
        .select("id, user_id, platform, platform_user_id, display_name, connected_at")
        .eq("user_id", user!.id),
    ]);

  const roomIds = memberRooms?.map((m) => m.room_id) ?? [];

  let jams: WatchRoom[] = [];

  if (roomIds.length > 0) {
    const { data } = await supabase
      .from("streampass_watch_rooms")
      .select("*")
      .in("id", roomIds)
      .eq("room_type", "listen")
      .order("scheduled_time", { ascending: false });
    jams = data ?? [];
  }

  return (
    <div className="page-shell">
      <PageHeader
        badge="Music"
        title="Listening Jams"
        subtitle="One shared queue. Everyone listens on their own platform."
      />
      <JamsManager
        initialJams={jams}
        userId={user!.id}
        connectedAccounts={(connectedAccounts ?? []) as ConnectedAccount[]}
        preferredPlatform={null}
      />
    </div>
  );
}
