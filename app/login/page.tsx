"use client";

import { BadgeCheck, Hand } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { VibePicker } from "@/components/vibe-picker";
import { completeOnboarding } from "@/lib/quiz/actions";
import { cn } from "@/lib/utils";
import { VIBE_COUNT } from "@/lib/vibes/questions";

type Step = "profile" | "vibes";

const STEPS: { key: Step; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "vibes", label: "Vibes" },
];

const STEP_TITLES: Record<Step, string> = {
  profile: "Make your profile",
  vibes: "Vibe Check",
};

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
      setError("Answer all five questions.");
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
        <aside className="glass-card hidden flex-col justify-between rounded-2xl p-8 md:flex">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
              <Hand className="size-6" />
              TamaHi!
            </span>
            <h2 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight">
              Welcome to
              <br />
              the <span className="italic text-primary">tamaraw</span>
              <br />
              community.
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Set up your profile to join groups, connect with blockmates, and
              stay updated with campus events.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-3 rounded-lg bg-muted/50 p-4 text-muted-foreground">
            <BadgeCheck className="size-6 shrink-0 text-primary" />
            <span className="text-xs font-semibold">
              Secure university network
            </span>
          </div>
        </aside>

        <main
          className={cn(
            "glass-card flex flex-col gap-7 rounded-2xl p-8 pb-10 md:p-12 md:pb-14",
            step === "vibes" && "items-center text-center",
          )}
        >
          <header className="flex flex-col items-center gap-2 text-center">
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              TamaHi! · Freshies only
            </span>
            <h1
              className={cn(
                "mt-2 font-extrabold tracking-tight",
                step === "vibes"
                  ? "text-5xl text-primary md:text-6xl"
                  : "text-3xl md:text-4xl",
              )}
            >
              {STEP_TITLES[step]}
            </h1>
            {step === "vibes" ? (
              <p className="max-w-xl leading-relaxed text-muted-foreground">
                Let&apos;s fine-tune your lobby experience. Tell us a bit about
                your campus life to match you with the right crowd.
              </p>
            ) : null}
          </header>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}

          {step === "profile" ? (
            <>
              <ProfileForm
                submitLabel="Continue to vibes"
                ensureSession
                onSaved={() => setStep("vibes")}
              />
              <StepDots current={step} />
            </>
          ) : null}

          {step === "vibes" ? (
            <>
              <form onSubmit={handleVibes} className="w-full">
                <fieldset disabled={pending} className="flex flex-col gap-8">
                  <VibePicker value={vibes} onChange={setVibes} disabled={pending} />
                  <hr className="border-border/60" />
                  <Button
                    type="submit"
                    disabled={pending}
                    className="mx-auto h-auto rounded-lg bg-primary px-10 py-4 font-bold shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-2xl"
                  >
                    {pending ? "Entering…" : "Enter the lobby"}
                  </Button>
                </fieldset>
              </form>
              <StepDots current={step} />
            </>
          ) : null}
        </main>
      </div>
    </section>
  );
}

function StepDots({ current }: { current: Step }) {
  return (
    <div className="mt-1 flex items-center justify-center gap-2">
      {STEPS.map((item) => (
        <span key={item.key}>
          <span
            aria-label={item.label}
            className={cn(
              current === item.key
                ? "block h-2.5 w-10 rounded-full bg-primary shadow-sm"
                : "block h-2.5 w-2.5 rounded-full bg-border",
            )}
          />
        </span>
      ))}
    </div>
  );
}
