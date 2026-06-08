import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/afterglow/page-header";
import { RoomsManager } from "@/components/rooms-manager";
import type { WatchRoom } from "@/lib/types";

export default async function RoomsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberRooms } = await supabase
    .from("streampass_room_members")
    .select("room_id")
    .eq("user_id", user!.id);

  const roomIds = memberRooms?.map((m) => m.room_id) ?? [];

  let rooms: WatchRoom[] = [];

  if (roomIds.length > 0) {
    const { data } = await supabase
      .from("streampass_watch_rooms")
      .select("*")
      .in("id", roomIds)
      .eq("room_type", "watch")
      .order("scheduled_time", { ascending: false });
    rooms = data ?? [];
  }

  return (
    <div className="page-shell">
      <PageHeader
        badge="Social"
        title="Watch Parties"
        subtitle="Sync the countdown. Watch on your own device."
      />
      <RoomsManager initialRooms={rooms} userId={user!.id} />
    </div>
  );
}
