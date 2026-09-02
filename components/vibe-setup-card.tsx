"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { VibePicker } from "@/components/vibe-picker";
import { completeOnboarding } from "@/lib/quiz/actions";
import { VIBE_COUNT } from "@/lib/vibes/questions";

export function VibeSetupCard({ onSaved }: { onSaved?: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState<number[]>(() =>
    Array<number>(VIBE_COUNT).fill(-1),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const answeredAll = value.every((v) => v >= 0);

  async function handleSave() {
    setError(null);
    setPending(true);
    try {
      await completeOnboarding(value);
      router.refresh();
      onSaved?.();
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
    <div className="flex flex-col gap-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 md:p-6 shadow-card-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#006633] text-[#FDB913]">
          <Sparkles className="size-4" />
        </span>
        <div className="flex flex-col">
          <p className="text-sm font-bold text-foreground">Update Your Campus Vibes</p>
          <p className="text-[11px] text-muted-foreground">
            Algorithm uses these 5 questions to seat you with like-minded freshies.
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center text-xs font-bold text-destructive">
          {error}
        </p>
      ) : null}

      <VibePicker value={value} onChange={setValue} disabled={pending} />

      <Button
        onClick={() => void handleSave()}
        disabled={pending || !answeredAll}
        className="h-12 rounded-xl bg-[#006633] text-xs font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
      >
        {pending
          ? "Saving vibes…"
          : answeredAll
            ? "Save my vibes"
            : `Answer ${VIBE_COUNT - value.filter((v) => v >= 0).length} more question(s)`}
        {answeredAll ? <ArrowRight className="ml-1.5 size-4" /> : null}
      </Button>
    </div>
  );
}
