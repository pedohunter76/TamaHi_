"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { VibeSetupCard } from "@/components/vibe-setup-card";

export function VibeRetake() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Retake vibes
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Retake your vibes">
        <VibeSetupCard onSaved={() => setOpen(false)} />
      </Modal>
    </>
  );
}
