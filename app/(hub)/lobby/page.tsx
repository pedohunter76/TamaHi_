import { MessagesSquare, Users } from "lucide-react";

import { LobbyQueue } from "@/components/lobby-queue";
import { VibeSetupCard } from "@/components/vibe-setup-card";
import { createClient } from "@/lib/supabase/server";
import { VIBE_COUNT } from "@/lib/vibes/questions";

export default async function LobbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname = "freshie";

  let vibesMissing = true;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, vibes")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.nickname) {
      nickname = profile.nickname;
    }

    const vibes = profile?.vibes as number[] | null;

    vibesMissing = !vibes || vibes.length !== VIBE_COUNT;
  }
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="relative w-max text-4xl font-extrabold tracking-tight text-primary md:text-5xl">
          Welcome to the Lobby
          <span
            aria-hidden
            className="absolute -bottom-1 left-0 -z-10 h-3 w-full -rotate-1 rounded-sm bg-secondary/50 md:h-4"
          />
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Hey {nickname} — groups of 4 freshies with matching vibes get seated
          together. The room opens the moment your batch is full.
        </p>
      </section>

      {vibesMissing ? (
        <section className="glass-card rounded-2xl p-6 md:p-8">
          <VibeSetupCard />
        </section>
      ) : (
        <LobbyQueue />
      )}

      {/* Campus buzz */}
      <section className="glass-card rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-bold tracking-tight">Campus Buzz</h2>
        <div className="mt-4 flex flex-col divide-y divide-border/60">
          <article className="flex items-start gap-4 py-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <MessagesSquare className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-bold">
                USG Announcement
                <span className="ml-2 text-xs font-medium text-muted-foreground">
                  2h ago
                </span>
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Welcome walk schedules have been updated for IAS and IABF. Check
                the official groups for exact timings.
              </p>
            </div>
          </article>
          <article className="flex items-start gap-4 py-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary/25 text-secondary-foreground">
              <Users className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-bold">
                IABF Freshies &apos;26
                <span className="ml-2 rounded border border-secondary/50 bg-secondary/20 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-foreground">
                  Official
                </span>
                <span className="ml-2 text-xs font-medium text-muted-foreground">
                  5h ago
                </span>
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Block 3 group chats are open. Say hi to your blockmates before
                day one.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
