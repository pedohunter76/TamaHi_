"use client";

import { create } from "zustand";

import {
  getQueueState,
  joinQueue,
  leaveQueue,
  startEarlyMatch,
  tryMatch,
} from "@/lib/match/actions";
import type { QueueState } from "@/lib/match/actions";

type QueueStatus = "idle" | "joining" | "waiting" | "matched";

type QueueStore = QueueState & {
  status: QueueStatus;
  error: string | null;
  justMatched: boolean;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  startEarly: () => Promise<void>;
  refresh: () => Promise<void>;
};

function navigateToRoom(roomId: string) {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/chat/${roomId}`;
  }
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  status: "idle",
  queued: false,
  count: 0,
  roomId: null,
  oldestJoinedAt: null,
  stats: {
    activeRooms: 0,
    onlineFreshies: 1,
    matchesToday: 0,
  },
  error: null,
  justMatched: false,

  async join() {
    set({ status: "joining", error: null });

    try {
      await joinQueue();
      const matchedRoomId = await tryMatch();

      if (matchedRoomId) {
        set({
          status: "matched",
          roomId: matchedRoomId,
          queued: false,
          justMatched: true,
        });
        navigateToRoom(matchedRoomId);
        return;
      }

      const state = await getQueueState();

      if (state.roomId) {
        set({
          status: "matched",
          roomId: state.roomId,
          count: state.count,
          oldestJoinedAt: null,
          stats: state.stats,
          queued: false,
          justMatched: true,
        });
        navigateToRoom(state.roomId);
        return;
      }

      set({
        status: "waiting",
        queued: true,
        count: state.count,
        oldestJoinedAt: state.oldestJoinedAt,
        stats: state.stats,
        justMatched: false,
      });
    } catch {
      set({
        status: "idle",
        error: "Could not join the queue. Please try again.",
      });
    }
  },

  async leave() {
    const previous = get().status;

    try {
      await leaveQueue();
      set({ status: "idle", queued: false, error: null, justMatched: false, roomId: null });
      await get().refresh();
    } catch {
      set({ status: previous, error: "Could not leave the queue." });
    }
  },

  async startEarly() {
    set({ status: "joining", error: null });

    try {
      const roomId = await startEarlyMatch();
      if (roomId) {
        set({
          status: "matched",
          roomId,
          queued: false,
          justMatched: true,
        });
        navigateToRoom(roomId);
        return;
      }

      const state = await getQueueState();

      if (state.roomId) {
        set({
          status: "matched",
          roomId: state.roomId,
          count: state.count,
          oldestJoinedAt: null,
          stats: state.stats,
          queued: false,
          justMatched: true,
        });
        navigateToRoom(state.roomId);
        return;
      }

      await get().refresh();
    } catch {
      await get().refresh();
    }
  },

  async refresh() {
    try {
      if (get().queued || get().status === "waiting" || get().status === "joining") {
        const matchedRoomId = await tryMatch();
        if (matchedRoomId) {
          set({
            status: "matched",
            roomId: matchedRoomId,
            queued: false,
            justMatched: true,
          });
          navigateToRoom(matchedRoomId);
          return;
        }
      }

      const state = await getQueueState();

      if (state.roomId) {
        set({
          status: "matched",
          roomId: state.roomId,
          stats: state.stats,
          queued: false,
          justMatched: true,
        });
        navigateToRoom(state.roomId);
        return;
      }

      if (state.queued) {
        set({
          status: "waiting",
          queued: true,
          count: state.count,
          oldestJoinedAt: state.oldestJoinedAt,
          stats: state.stats,
          justMatched: false,
        });
      } else {
        set({
          status: "idle",
          queued: false,
          count: state.count,
          oldestJoinedAt: null,
          stats: state.stats,
          justMatched: false,
        });
      }
    } catch {
      set({ error: "Lost connection to the queue. Retrying…" });
    }
  },
}));
