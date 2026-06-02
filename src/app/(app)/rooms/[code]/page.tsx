import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoomView } from "@/components/room-view";

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: room } = await supabase
    .from("streampass_watch_rooms")
    .select("*")
    .eq("share_code", code.toUpperCase())
    .single();

  if (!room) notFound();

  const { data: messages } = await supabase
    .from("streampass_room_messages")
    .select("*")
    .eq("room_id", room.id)
    .order("sent_at", { ascending: true })
    .limit(100);

  const userIds = [...new Set(messages?.map((m) => m.user_id) ?? [])];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("streampass_profiles")
        .select("*")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const enrichedMessages =
    messages?.map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id),
    })) ?? [];

  return (
    <RoomView
      room={room}
      userId={user!.id}
      initialMessages={enrichedMessages}
    />
  );
}
