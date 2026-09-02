"use client";

import { ArrowLeft, BadgeCheck, Check, Clock, Hand, ShieldCheck, Sparkles, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { VibePicker } from "@/components/vibe-picker";
import { completeOnboarding } from "@/lib/quiz/actions";
import { cn } from "@/lib/utils";
import { VIBE_COUNT } from "@/lib/vibes/questions";

type Step = "profile" | "vibes";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [vibes, setVibes] = useState<number[]>(() =>
    Array<number>(VIBE_COUNT).fill(-1),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleVibes(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!vibes.every((v) => v >= 0)) {
      setError("Answer all five campus vibe questions to continue.");
      return;
    }

    setPending(true);
    try {
      await completeOnboarding(vibes);
      router.replace("/lobby");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not save your vibes. Please try again.",
      );
      setPending(false);
    }
  }

  const answeredAllVibes = vibes.every((v) => v >= 0);

  return (
    <section
      className={cn(
        "relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden p-4 md:p-8",
        step === "vibes" ? "vibe-gradient" : "mesh-bg",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[10%] -top-[20%] h-[60%] w-[60%] rounded-full bg-primary/20 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-secondary/40 blur-[140px]"
      />

      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Left Sidebar Feature Card */}
        <aside className="glass-card hidden flex-col justify-between rounded-3xl p-8 md:flex shadow-card-md">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#006633] text-[#FDB913] shadow-xs">
                <Hand className="size-5" />
              </span>
              <span className="text-xl font-black text-[#006633]">
                TamaHi<span className="text-[#FDB913]">!</span>
              </span>
              <span className="rounded-full bg-[#FDB913] px-2 py-0.5 text-[9px] font-black uppercase text-[#006633]">
                FEU
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                Welcome to the <span className="text-[#006633]">Tamaraw</span> batch hub.
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground pt-1">
                Meet fellow FEU freshies in randomized 4-person rooms matched by your campus lifestyle and study habits.
              </p>
            </div>

            {/* Highlights List */}
            <div className="flex flex-col gap-3 border-t border-[#e5e7eb] pt-4 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#006633]">
                  <Users className="size-3.5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">4-Person Rooms</p>
                  <p className="text-[11px] text-muted-foreground">Seated with like-minded freshies from IAS, IABF, Tech, and more.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#006633]">
                  <Clock className="size-3.5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">24-Hour Ephemeral Chat</p>
                  <p className="text-[11px] text-muted-foreground">Self-destructing batch chats keep conversations fresh and active.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#006633]">
                  <ShieldCheck className="size-3.5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">Honor-System Freshie Gate</p>
                  <p className="text-[11px] text-muted-foreground">Fast guest onboarding without password hassle.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#006633] border border-[#006633]/20">
            <BadgeCheck className="size-5 shrink-0 text-[#006633]" />
            <span className="text-[11px] font-bold">
              Far Eastern University Manila · A.Y. 2026–2027
            </span>
          </div>
        </aside>

        {/* Right Main Interaction Container */}
        <main
          className={cn(
            "glass-card flex flex-col gap-6 rounded-3xl p-6 sm:p-8 md:p-10 shadow-card-lg",
          )}
        >
          {/* Step Progression Timeline */}
          <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("profile")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                  step === "profile"
                    ? "bg-[#006633] text-[#FDB913] shadow-xs"
                    : "bg-[#f0faf5] text-[#006633] hover:bg-[#e2f5ec]",
                )}
              >
                <User className="size-3.5" />
                <span>1. Freshie Profile</span>
                {step === "vibes" ? <Check className="size-3 text-[#16a34a]" /> : null}
              </button>

              <span className="text-muted-foreground/50">➔</span>

              <button
                type="button"
                onClick={() => {
                  if (step === "vibes") return;
                }}
                disabled={step === "profile"}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                  step === "vibes"
                    ? "bg-[#006633] text-[#FDB913] shadow-xs"
                    : "bg-[#f3f4f6] text-muted-foreground opacity-60",
                )}
              >
                <Sparkles className="size-3.5" />
                <span>2. Vibe Check</span>
              </button>
            </div>

            {step === "vibes" ? (
              <button
                type="button"
                onClick={() => setStep("profile")}
                className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-[#006633]"
              >
                <ArrowLeft className="size-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : null}
          </div>

          {/* Header Title */}
          <header className="flex flex-col gap-1 text-left">
            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {step === "profile" ? "Make Your Freshie Profile" : "Campus Vibe Check 🎯"}
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {step === "profile"
                ? "Enter your basic info to create your batch identity card."
                : "Answer these 5 quick campus questions so the algorithm seats you with your crowd."}
            </p>
          </header>

          {error ? (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center text-xs font-bold text-destructive">
              {error}
            </p>
          ) : null}

          {/* STEP 1: PROFILE FORM */}
          {step === "profile" ? (
            <ProfileForm
              submitLabel="Continue to Vibe Check"
              ensureSession
              onSaved={() => setStep("vibes")}
            />
          ) : null}

          {/* STEP 2: VIBE CHECK */}
          {step === "vibes" ? (
            <form onSubmit={handleVibes} className="flex flex-col gap-6">
              <fieldset disabled={pending} className="flex flex-col gap-6">
                <VibePicker value={vibes} onChange={setVibes} disabled={pending} />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5e7eb] pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("profile")}
                    disabled={pending}
                    className="h-12 w-full sm:w-auto rounded-xl text-xs font-bold"
                  >
                    <ArrowLeft className="mr-1.5 size-3.5" />
                    Back to Profile
                  </Button>

                  <Button
                    type="submit"
                    disabled={pending || !answeredAllVibes}
                    className="h-12 w-full sm:w-auto rounded-xl bg-[#006633] px-8 text-xs font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
                  >
                    {pending
                      ? "Entering lobby…"
                      : answeredAllVibes
                        ? "Enter the Tamaraw Lobby 🎲"
                        : "Answer all 5 questions to enter"}
                  </Button>
                </div>
              </fieldset>
            </form>
          ) : null}
        </main>
      </div>
    </section>
  );
}
