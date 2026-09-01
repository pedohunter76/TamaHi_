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
        setPending(true);
        try {
          await leaveRoom(roomId);
          router.replace("/lobby");
          router.refresh();
        } catch {
          setPending(false);
        }
      }}
      className="text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
    >
      {pending ? "Leaving…" : "Leave this room and find new people"}
    </button>
  );
}
