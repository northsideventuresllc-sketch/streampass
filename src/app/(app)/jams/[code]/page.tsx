import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JamView } from "@/components/jam-view";
import { MUSIC_STREAMING_SERVICES } from "@/lib/constants";

interface JamPageProps {
  params: Promise<{ code: string }>;
}

export default async function JamPage({ params }: JamPageProps) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: room } = await supabase
    .from("streampass_watch_rooms")
    .select("*")
    .eq("share_code", code.toUpperCase())
    .eq("room_type", "listen")
    .single();

  if (!room) notFound();

  const [
    { data: messages },
    { data: queue },
    { data: jamState },
    { data: members },
    { data: connectedAccount },
  ] = await Promise.all([
    supabase
      .from("streampass_room_messages")
      .select("*")
      .eq("room_id", room.id)
      .order("sent_at", { ascending: true })
      .limit(100),
    supabase
      .from("streampass_jam_queue")
      .select("*")
      .eq("room_id", room.id)
      .order("position", { ascending: true }),
    supabase
      .from("streampass_jam_state")
      .select("*")
      .eq("room_id", room.id)
      .maybeSingle(),
    supabase
      .from("streampass_room_members")
      .select("user_id, listening_platform")
      .eq("room_id", room.id),
    supabase
      .from("streampass_connected_accounts")
      .select("platform")
      .eq("user_id", user!.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const allUserIds = [
    ...new Set([
      ...(messages?.map((m) => m.user_id) ?? []),
      ...(members?.map((m) => m.user_id) ?? []),
    ]),
  ];

  const { data: profiles } = allUserIds.length
    ? await supabase
        .from("streampass_profiles")
        .select("id, username")
        .in("id", allUserIds)
    : { data: [] };

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const enrichedMessages =
    messages?.map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id),
    })) ?? [];

  const enrichedMembers =
    members?.map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id),
    })) ?? [];

  const userPlatform =
    connectedAccount?.platform ?? MUSIC_STREAMING_SERVICES[0];

  return (
    <JamView
      room={room}
      userId={user!.id}
      initialMessages={enrichedMessages}
      initialQueue={queue ?? []}
      initialState={jamState}
      initialMembers={enrichedMembers}
      userPlatform={userPlatform}
      isHost={room.created_by === user!.id}
    />
  );
}
