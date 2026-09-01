import { Hand, Info } from "lucide-react";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { HubNav } from "@/components/layout/hub-nav";
import { ProfileEditCard } from "@/components/profile-edit-card";
import { SignOutButton } from "@/components/sign-out-button";
import { VibeRetake } from "@/components/vibe-retake";
import { createClient } from "@/lib/supabase/server";
import { VIBE_COUNT } from "@/lib/vibes/questions";

export default async function HubLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("student_number, nickname, age, institute, course, quiz_passed_at, vibes")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.quiz_passed_at || !profile.nickname) {
    redirect("/login");
  }

  const vibes = profile.vibes as number[] | null;
  const vibesMissing = !vibes || vibes.length !== VIBE_COUNT;

  return (
    <div className="mesh-bg relative min-h-dvh">
      {/* Desktop floating sidebar */}
      <aside className="glass-card fixed bottom-4 left-4 top-4 z-40 hidden w-60 flex-col overflow-y-auto rounded-2xl p-4 md:flex">
        <div className="flex items-center gap-3 px-1 py-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Hand className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-extrabold leading-tight text-primary">
              TamaHi!
            </span>
            <span className="block text-xs font-medium text-muted-foreground">
              Freshman Hub
            </span>
          </span>
        </div>

        <HubNav />

        <div className="mt-auto flex flex-col gap-1 border-t border-border/50 pt-4">
          <p className="flex items-start gap-2 px-1 pb-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            Rooms vanish after 24 hours. Be kind, you might meet them again.
          </p>
          <ProfileEditCard
            initial={{
              studentNumber: (profile.student_number as string | null) ?? "",
              nickname: profile.nickname,
              age: profile.age != null ? String(profile.age) : "",
              institute: (profile.institute as string | null) ?? "",
              course: (profile.course as string | null) ?? "",
            }}
          />
          {!vibesMissing ? <VibeRetake /> : null}
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md md:hidden">
        <span className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-primary">
          <Hand className="size-5" />
          TamaHi!
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          Hi, {profile.nickname}
        </span>
      </header>

      {/* Main canvas */}
      <main className="relative z-10 flex w-full flex-col px-4 pb-16 pt-20 md:py-10 md:pl-[17.5rem] md:pr-8">
        {children}
      </main>
    </div>
  );
}
