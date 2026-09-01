import { notFound } from "next/navigation";

import { LeaveRoomButton } from "@/components/leave-room-button";
import { RoomChat } from "@/components/room-chat";
import { RoomCountdown } from "@/components/room-countdown";
import { formatMemberDisplayName } from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/server";

function isRoomExpired(expiresAtIso: string): boolean {
  return new Date(expiresAtIso).getTime() <= new Date().getTime();
}

export default async function ChatRoomPage({
  params,
}: PageProps<"/chat/[roomId]">) {
  const { roomId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("expires_at")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    notFound();
  }

  const ended = isRoomExpired(room.expires_at as string);

  const { data: memberRows } = await supabase
    .from("room_members")
    .select("user_id, joined_at")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  const userIds = (memberRows ?? []).map((m) => m.user_id as string);

  const { data: profileRows } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, nickname, institute, course")
          .in("id", userIds)
      : { data: [] };

  const profilesById = new Map<
    string,
    {
      nickname?: string | null;
      institute?: string | null;
      course?: string | null;
    }
  >();

  for (const p of profileRows ?? []) {
    profilesById.set(p.id as string, p);
  }

  const roster = userIds.map((userId) => {
    const profile = profilesById.get(userId);
    const nickname = profile?.nickname?.trim() || "Freshie";
    const displayName = formatMemberDisplayName(
      profile?.nickname,
      profile?.institute,
    );

    return {
      userId,
      nickname,
      displayName,
      institute: profile?.institute ?? null,
      course: profile?.course ?? null,
    };
  });

  const displayNamesById = Object.fromEntries(
    roster.map((member) => [member.userId, member.displayName]),
  );

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex -space-x-1.5">
          {roster.map((member) => (
            <span
              key={member.userId}
              title={`${member.displayName}${member.course ? ` (${member.course})` : ""}`}
              className="flex size-8 items-center justify-center rounded-full border bg-muted text-xs font-semibold shadow-xs"
            >
              {member.nickname.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </div>
        <RoomCountdown expiresAtIso={room.expires_at as string} />
      </header>

      <RoomChat
        roomId={roomId}
        currentUserId={user.id}
        displayNamesById={displayNamesById}
        ended={ended}
      />

      <div className="flex justify-center">
        <LeaveRoomButton roomId={roomId} />
      </div>
    </section>
  );
}

