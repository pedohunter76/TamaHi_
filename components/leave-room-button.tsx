"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { leaveRoom } from "@/lib/match/actions";

export function LeaveRoomButton({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!window.confirm("Leave this batch room and reset your spot?")) {
          return;
        }
        setPending(true);
        try {
          await leaveRoom(roomId);
          router.replace("/lobby");
          if (typeof window !== "undefined") {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/lobby";
          }
        } catch {
          setPending(false);
        }
      }}
      className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-50 transition-colors"
    >
      {pending ? "Leaving room…" : "Leave room and find new batchmates"}
    </button>
  );
}
