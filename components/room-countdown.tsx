"use client";

import { useEffect, useState } from "react";

function formatRemaining(expiresAtIso: string, now: number): string {
  const msLeft = Math.max(0, new Date(expiresAtIso).getTime() - now);
  const hoursLeft = Math.floor(msLeft / 3_600_000);
  const minutesLeft = Math.floor((msLeft % 3_600_000) / 60_000);

  if (msLeft <= 0) return "room ended";

  return hoursLeft > 0
    ? `ends in ${hoursLeft}h ${minutesLeft}m`
    : `ends in ${minutesLeft}m`;
}

export function RoomCountdown({ expiresAtIso }: { expiresAtIso: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);

    return () => clearInterval(timer);
  }, []);

  return (
    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium tabular-nums">
      {formatRemaining(expiresAtIso, now)}
    </span>
  );
}
