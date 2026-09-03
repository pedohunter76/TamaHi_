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
        if (
          !window.confirm(
            "Leave this batch room? You will not be able to rejoin this room, but your batchmates can continue chatting.",
          )
        ) {
          return;
        }
        setPending(true);
        try {
          await leaveRoom(roomId);
          if (typeof window !== "undefined") {
            window.location.replace("/lobby");
          } else {
            router.replace("/lobby");
          }
        } catch {
          setPending(false);
          if (typeof window !== "undefined") {
            window.location.replace("/lobby");
          }
        }
      }}
      className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-50 transition-colors"
    >
      {pending ? "Leaving room…" : "Leave room and find new batchmates"}
    </button>
  );
}
