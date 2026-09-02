import { notFound } from "next/navigation";

import { TopNav } from "@/components/layout/top-nav";
import { RoomChat, type RoomParticipant } from "@/components/room-chat";
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
          .select("id, nickname, institute, course, vibes")
          .in("id", userIds)
      : { data: [] };

  const profilesById = new Map<
    string,
    {
      nickname?: string | null;
      institute?: string | null;
      course?: string | null;
      vibes?: number[] | null;
    }
  >();

  for (const p of profileRows ?? []) {
    profilesById.set(p.id as string, p);
  }

  const roster: RoomParticipant[] = userIds.map((userId) => {
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
      vibes: (profile?.vibes as number[] | null) ?? null,
    };
  });

  const displayNamesById = Object.fromEntries(
    roster.map((member) => [member.userId, member.displayName]),
  );

  return (
    <div className="mesh-bg relative min-h-dvh flex flex-col overflow-x-hidden">
      {/* Dynamic Ambient Background Shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-12 size-96 rounded-full bg-gradient-to-br from-[#006633]/15 to-transparent blur-3xl animate-pulse-glow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-40 size-96 rounded-full bg-gradient-to-bl from-[#FDB913]/20 to-transparent blur-3xl animate-pulse-glow"
        style={{ animationDelay: "2.5s" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-20 left-1/3 size-80 rounded-full bg-gradient-to-tr from-[#16a34a]/10 to-transparent blur-3xl animate-float-slow"
      />

      {/* Subtle Floating Geometric Emblems */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-8 top-32 hidden size-16 rounded-2xl border border-[#006633]/15 bg-white/40 p-3 shadow-2xs backdrop-blur-xs lg:flex items-center justify-center animate-float-slow text-[#006633]"
      >
        <span className="text-xl font-black">🔰</span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 top-60 hidden size-14 rounded-full border border-[#FDB913]/30 bg-white/40 shadow-2xs backdrop-blur-xs lg:flex items-center justify-center animate-float-reverse text-base font-black text-[#FDB913]"
      >
        ✨
      </div>

      <TopNav />
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-3.5 pb-8 pt-18 sm:px-6 md:pt-20">
        <RoomChat
          roomId={roomId}
          currentUserId={user.id}
          displayNamesById={displayNamesById}
          roster={roster}
          expiresAtIso={room.expires_at as string}
          ended={ended}
        />
      </main>
    </div>
  );
}


