"use client";

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
    <div className="flex flex-col gap-6 rounded-lg border border-dashed p-6">
      <div className="flex flex-col gap-1 text-center">
        <p className="text-sm font-medium">Set your vibes to start matching</p>
        <p className="text-xs text-muted-foreground">
          Answer these once — we seat you with freshies who vibe like you.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <VibePicker value={value} onChange={setValue} disabled={pending} />

      <Button
        onClick={() => void handleSave()}
        disabled={pending || !answeredAll}
      >
        {pending
          ? "Saving…"
          : answeredAll
            ? "Save my vibes"
            : "Answer all questions"}
      </Button>
    </div>
  );
}
