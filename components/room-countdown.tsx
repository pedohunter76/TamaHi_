"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

function formatRemaining(expiresAtIso: string, now: number): { text: string; isWarning: boolean } {
  const msLeft = Math.max(0, new Date(expiresAtIso).getTime() - now);
  const minutesLeft = Math.floor(msLeft / 60_000);
  const hoursLeft = Math.floor(minutesLeft / 60);
  const remMinutes = minutesLeft % 60;

  if (msLeft <= 0) {
    return { text: "Room ended", isWarning: true };
  }

  const isWarning = minutesLeft < 5;
  const text = hoursLeft > 0
    ? `${hoursLeft}h ${remMinutes}m left`
    : `${minutesLeft}m left`;

  return { text, isWarning };
}

export function RoomTimer({ expiresAtIso }: { expiresAtIso: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, []);

  const { text, isWarning } = formatRemaining(expiresAtIso, now);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-black tracking-wide tabular-nums shadow-2xs transition-all",
        isWarning
          ? "border border-red-300 bg-red-50 text-[#dc2626] animate-pulse"
          : "border border-[#006633]/20 bg-gradient-to-r from-[#f0faf5] to-white text-[#006633]",
      )}
    >
      <Clock
        className={cn("size-3.5", isWarning ? "text-[#dc2626]" : "text-[#006633]")}
      />
      <span>{text}</span>
    </div>
  );
}

export const RoomCountdown = RoomTimer;
