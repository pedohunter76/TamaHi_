import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { MetFreshiesList, type MetFreshie } from "@/components/met-freshies-list";
import { Button } from "@/components/ui/button";
import { getInstituteShortName } from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/server";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Current user's vibes
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("vibes")
    .eq("id", user.id)
    .maybeSingle();

  const currentUserVibes = (myProfile?.vibes as number[] | null) ?? null;

  // 1. Find all rooms the user has joined
  const { data: myRooms } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", user.id);

  const roomIds = (myRooms ?? []).map((r) => r.room_id as string);

  // 2. Find all co-members from those rooms
  const { data: coMembers } =
    roomIds.length > 0
      ? await supabase
          .from("room_members")
          .select("user_id, joined_at, room_id")
          .in("room_id", roomIds)
          .neq("user_id", user.id)
          .order("joined_at", { ascending: false })
      : { data: [] };

  const memberIds = Array.from(
    new Set((coMembers ?? []).map((m) => m.user_id as string)),
  );

  // 3. Fetch profiles of co-members
  const { data: profiles } =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, nickname, institute, course, vibes, created_at")
          .in("id", memberIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );

  // 4. Map unique met members
  const metFreshies: MetFreshie[] = memberIds.map((id) => {
    const profile = profileMap.get(id);
    const latestMembership = coMembers?.find((m) => m.user_id === id);
    const instituteShort = getInstituteShortName(profile?.institute);

    return {
      id,
      nickname: profile?.nickname?.trim() || "Freshie",
      instituteShort,
      institute: profile?.institute ?? null,
      course: profile?.course ?? null,
      vibes: (profile?.vibes as number[] | null) ?? null,
      metAt: latestMembership?.joined_at ?? profile?.created_at ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-fit rounded-full bg-[#f0faf5] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#006633]">
            Connections
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#006633] md:text-4xl">
          Met Freshies
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Your personal Tamaraw circle — classmates and blockmates you&apos;ve
          met across batch chats. Click any card to view your vibe match.
        </p>
      </section>

      {metFreshies.length === 0 ? (
        <section className="glass-card flex flex-col items-center gap-4 rounded-2xl p-10 text-center md:p-14">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-[#006633]/10 text-[#006633]">
            <Users className="size-8" />
          </span>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">No connections yet</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              After your first lobby match, the freshies you shared a room with
              will show up here with their institute and course.
            </p>
          </div>
          <Button asChild className="mt-2 h-12 rounded-xl bg-[#006633] px-6 font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]">
            <Link href="/lobby">
              Find my people in Lobby
              <ArrowRight className="ml-1.5 size-4.5" />
            </Link>
          </Button>
        </section>
      ) : (
        <MetFreshiesList
          members={metFreshies}
          currentUserVibes={currentUserVibes}
        />
      )}
    </div>
  );
}

