import { CampusBuzz } from "@/components/campus-buzz";
import { LobbyQueue } from "@/components/lobby-queue";
import { VibeSetupCard } from "@/components/vibe-setup-card";
import { getInstituteShortName } from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/server";
import { VIBE_COUNT } from "@/lib/vibes/questions";

export default async function LobbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname = "Freshie";
  let institute: string | null = null;
  let course: string | null = null;
  let vibesMissing = true;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, institute, course, vibes")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.nickname) {
      nickname = profile.nickname;
    }
    institute = profile?.institute ?? null;
    course = profile?.course ?? null;

    const vibes = profile?.vibes as number[] | null;
    vibesMissing = !vibes || vibes.length !== VIBE_COUNT;
  }

  const instShort = getInstituteShortName(institute);

  return (
    <div className="flex flex-col gap-8">
      {/* Lobby Welcome Header */}
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full bg-[#f0faf5] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#006633]">
            Campus Matchmaking Hub
          </span>
          {instShort ? (
            <span className="rounded-full border border-[#006633]/20 bg-white px-2.5 py-0.5 text-[10px] font-black uppercase text-[#006633]">
              {instShort} Freshie
            </span>
          ) : null}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#006633] md:text-4xl">
          Tamaraw Match Lobby
        </h1>
        <p className="max-w-2xl text-sm md:text-base leading-relaxed text-muted-foreground">
          Welcome back, <span className="font-bold text-foreground">{nickname}</span>{course ? ` (${course})` : ""}!
          Groups of 4 freshies with matching campus vibes get seated into 24-hour batch rooms automatically.
        </p>
      </section>

      {/* Vibe Setup if Missing, else Live Matchmaker Queue */}
      {vibesMissing ? (
        <section className="glass-card rounded-3xl p-6 md:p-8 shadow-card-sm">
          <VibeSetupCard />
        </section>
      ) : (
        <LobbyQueue />
      )}

      {/* Campus Buzz & Official Announcements */}
      <CampusBuzz />
    </div>
  );
}
