"use client";

import { Pin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type PinnedMessage = {
  id: string;
  authorName: string;
  content: string;
  pinnedAt: string;
};

export function RoomPinnedMessages({
  roomId,
  onUnpinMessage,
}: {
  roomId: string;
  onUnpinMessage?: (id: string) => void;
}) {
  const [pinned, setPinned] = useState<PinnedMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(`tamahi_pinned_${roomId}`);
      return raw ? (JSON.parse(raw) as PinnedMessage[]) : [];
    } catch {
      return [];
    }
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const pinnedRef = useRef(pinned);

  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);

  // Sync pinned messages across tabs in the room via Supabase Realtime Broadcast with automatic Handshake
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`pins:${roomId}`);

    channel
      .on("broadcast", { event: "pin_sync" }, ({ payload }) => {
        const nextPins = payload?.pins as PinnedMessage[] | undefined;
        if (Array.isArray(nextPins)) {
          setPinned(nextPins);
          try {
            localStorage.setItem(`tamahi_pinned_${roomId}`, JSON.stringify(nextPins));
          } catch {
            // ignore
          }
        }
      })
      .on("broadcast", { event: "request_pin_sync" }, () => {
        // Peer requested current pins; broadcast if we have any
        if (pinnedRef.current.length > 0) {
          void channel.send({
            type: "broadcast",
            event: "pin_sync",
            payload: { pins: pinnedRef.current },
          });
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.send({
            type: "broadcast",
            event: "request_pin_sync",
            payload: {},
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  if (pinned.length === 0) return null;

  const currentPin = pinned[Math.min(activeIdx, pinned.length - 1)];

  function handleUnpin(id: string) {
    const next = pinned.filter((p) => p.id !== id);
    setPinned(next);
    try {
      localStorage.setItem(`tamahi_pinned_${roomId}`, JSON.stringify(next));
    } catch {
      // ignore
    }

    if (onUnpinMessage) onUnpinMessage(id);

    // Broadcast unpin to room
    const supabase = createClient();
    const channel = supabase.channel(`pins:${roomId}`);
    void channel.send({
      type: "broadcast",
      event: "pin_sync",
      payload: { pins: next },
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#006633]/25 bg-[#f0faf5] px-3.5 py-2 shadow-2xs animate-in fade-in slide-in-from-top-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#006633] text-[#FDB913]">
          <Pin className="size-3.5 fill-[#FDB913]" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#006633]">
            <span>PINNED MEETUP / NOTE</span>
            <span>· {currentPin.authorName}</span>
            {pinned.length > 1 ? (
              <span className="rounded bg-[#006633]/15 px-1 text-[9px]">
                {activeIdx + 1}/{pinned.length}
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs font-semibold text-foreground">
            {currentPin.content}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {pinned.length > 1 ? (
          <button
            type="button"
            onClick={() => setActiveIdx((prev) => (prev + 1) % pinned.length)}
            className="text-[10px] font-bold text-[#006633] hover:underline px-1"
          >
            Next Pin
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => handleUnpin(currentPin.id)}
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-[#e2f5ec] hover:text-[#006633]"
          title="Unpin message"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function broadcastPinMessage(
  roomId: string,
  pin: PinnedMessage,
): void {
  try {
    const raw = localStorage.getItem(`tamahi_pinned_${roomId}`);
    const existing = raw ? (JSON.parse(raw) as PinnedMessage[]) : [];
    // Keep maximum 2 pins
    const next = [pin, ...existing.filter((p) => p.id !== pin.id)].slice(0, 2);
    localStorage.setItem(`tamahi_pinned_${roomId}`, JSON.stringify(next));

    const supabase = createClient();
    const channel = supabase.channel(`pins:${roomId}`);
    void channel.send({
      type: "broadcast",
      event: "pin_sync",
      payload: { pins: next },
    });
  } catch {
    // ignore
  }
}
