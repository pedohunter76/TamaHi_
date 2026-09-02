import { GraduationCap } from "lucide-react";

import { CustomIcebreakerManager } from "@/components/custom-icebreaker-manager";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { SocialHandlesForm } from "@/components/social-handles-form";
import { VibeSetupCard } from "@/components/vibe-setup-card";
import { getInstituteShortName } from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("student_number, nickname, age, institute, course, created_at")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  // Fetch real statistics
  const { data: myRooms } = user
    ? await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", user.id)
    : { data: [] };

  const roomsJoined = myRooms?.length ?? 0;
  const roomIds = (myRooms ?? []).map((r) => r.room_id as string);

  const { data: coMembers } =
    roomIds.length > 0 && user
      ? await supabase
          .from("room_members")
          .select("user_id")
          .in("room_id", roomIds)
          .neq("user_id", user.id)
      : { data: [] };

  const connectionsCount = new Set((coMembers ?? []).map((m) => m.user_id)).size;

  const nickname = (profile?.nickname as string | null)?.trim() || "Tamaraw Freshie";
  const initial = nickname.slice(0, 1).toUpperCase();
  const instShort = getInstituteShortName(profile?.institute as string | null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Profile Card with Gradient Banner */}
      <section className="glass-card relative overflow-hidden rounded-3xl shadow-card-md">
        {/* Banner */}
        <div
          className="h-28 w-full"
          style={{
            background: "linear-gradient(135deg, #006633 60%, #FDB913)",
          }}
        />

        {/* Avatar & Main Info */}
        <div className="relative flex flex-col items-center px-6 pb-6 pt-0 text-center">
          {/* Avatar circle */}
          <div className="-mt-12 flex size-22 items-center justify-center rounded-full border-4 border-white bg-[#006633] text-2xl font-black text-white shadow-card-md">
            {initial}
          </div>

          <div className="mt-3 flex flex-col items-center gap-1.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {nickname}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {profile?.course ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#006633] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#FDB913]">
                  <GraduationCap className="size-3.5" />
                  {profile.course}
                </span>
              ) : null}
              {instShort ? (
                <span className="rounded-full border border-[#e5e7eb] bg-[#f0faf5] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#006633]">
                  {instShort}
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Far Eastern University Manila · A.Y. 2026–2027
            </p>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid w-full grid-cols-3 gap-3 border-t border-[#e5e7eb] pt-4">
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-[#006633]">{roomsJoined}</span>
              <span className="text-[11px] font-medium text-muted-foreground">Rooms Joined</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-[#006633]">{connectionsCount}</span>
              <span className="text-[11px] font-medium text-muted-foreground">Connections</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-lg font-black text-[#006633]">
                1 <span className="text-base">🔥</span>
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">Day Streak</span>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Profile Form */}
      <section className="glass-card flex flex-col gap-5 rounded-2xl p-6 shadow-card-sm md:p-8">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#006633]">Edit Freshie Profile</h2>
          <p className="text-xs text-muted-foreground">
            Update your student number, nickname, institute, and course program.
          </p>
        </div>
        <ProfileForm
          initial={{
            studentNumber: (profile?.student_number as string | null) ?? "",
            nickname: (profile?.nickname as string | null) ?? "",
            age:
              profile?.age != null && profile.age !== undefined
                ? String(profile.age)
                : "",
            institute: (profile?.institute as string | null) ?? "",
            course: (profile?.course as string | null) ?? "",
          }}
          submitLabel="Save changes"
        />
      </section>

      {/* Social Handles */}
      <section className="glass-card flex flex-col gap-4 rounded-2xl p-6 shadow-card-sm md:p-8">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#006633]">
            Tamaraw Social Handles
          </h2>
          <p className="text-xs text-muted-foreground">
            Save your Instagram, Telegram, or Discord handles to easily share them with batchmates before rooms expire.
          </p>
        </div>
        <SocialHandlesForm />
      </section>

      {/* Custom Icebreakers Manager */}
      <section className="glass-card flex flex-col gap-4 rounded-2xl p-6 shadow-card-sm md:p-8">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#006633]">
            My Custom Icebreakers
          </h2>
          <p className="text-xs text-muted-foreground">
            Create and organize your own custom questions by category to quickly drop them into batch chat rooms.
          </p>
        </div>
        <CustomIcebreakerManager />
      </section>

      {/* Vibes Quiz / Retake */}
      <section className="glass-card flex flex-col gap-4 rounded-2xl p-6 shadow-card-sm md:p-8">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#006633]">Your Campus Vibes</h2>
          <p className="text-xs text-muted-foreground">
            Matchmaking algorithm uses these 5 questions to seat you with like-minded freshies.
          </p>
        </div>
        <VibeSetupCard />
      </section>

      {/* Sign Out */}
      <div className="flex justify-center pb-4">
        <SignOutButton />
      </div>
    </div>
  );
}

