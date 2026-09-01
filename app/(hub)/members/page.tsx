import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getInstituteShortName } from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/server";

function formatMetDate(isoString: string | null): string {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

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
          .select("id, nickname, institute, course, created_at")
          .in("id", memberIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );

  // 4. Map unique met members
  const metFreshies = memberIds.map((id) => {
    const profile = profileMap.get(id);
    const latestMembership = coMembers?.find((m) => m.user_id === id);
    const instituteShort = getInstituteShortName(profile?.institute);

    return {
      id,
      nickname: profile?.nickname?.trim() || "Freshie",
      instituteShort,
      institute: profile?.institute ?? null,
      course: profile?.course ?? null,
      metAt: latestMembership?.joined_at ?? profile?.created_at ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            Connections
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
          Met Freshies
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Your personal Tamaraw circle — classmates and blockmates you&apos;ve
          met across batch chats.
        </p>
      </section>

      {metFreshies.length === 0 ? (
        <section className="glass-card flex flex-col items-center gap-4 rounded-2xl p-10 text-center md:p-14">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-8" />
          </span>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">No connections yet</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              After your first lobby match, the freshies you shared a room with
              will show up here with their institute and course.
            </p>
          </div>
          <Button asChild className="mt-2 rounded-xl font-bold">
            <Link href="/lobby">
              Find my people in Lobby
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metFreshies.map((member) => (
            <article
              key={member.id}
              className="glass-card flex flex-col justify-between gap-4 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-bold text-primary shadow-xs">
                  {member.nickname.slice(0, 1).toUpperCase()}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-base font-bold text-foreground">
                      {member.nickname}
                    </h2>
                    {member.instituteShort ? (
                      <span className="shrink-0 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {member.instituteShort}
                      </span>
                    ) : null}
                  </div>
                  {member.course ? (
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <GraduationCap className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{member.course}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">FEU Freshie</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3 text-primary" />
                  Matched in lobby
                </span>
                <span className="font-medium">{formatMetDate(member.metAt)}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
