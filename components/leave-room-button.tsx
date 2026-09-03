"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { leaveRoom } from "@/lib/match/actions";
import { markRoomDeparted } from "@/lib/match/left-rooms";
import { useQueueStore } from "@/store/queue-store";

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
        markRoomDeparted(roomId);
        useQueueStore.getState().resetRoom();
        try {
          await leaveRoom(roomId);
        } catch {
          // Ignore error and proceed to lobby
        } finally {
          if (typeof window !== "undefined") {
            window.location.replace("/lobby");
          } else {
            router.replace("/lobby");
          }
        }
      }}
      className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-50 transition-colors"
    >
      {pending ? "Leaving room…" : "Leave room and find new batchmates"}
    </button>
  );
}
