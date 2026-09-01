"use client";

import { create } from "zustand";

import {
  getQueueState,
  joinQueue,
  leaveQueue,
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
  refresh: () => Promise<void>;
};

export const useQueueStore = create<QueueStore>((set, get) => ({
  status: "idle",
  queued: false,
  count: 0,
  roomId: null,
  oldestJoinedAt: null,
  error: null,
  justMatched: false,

  async join() {
    set({ status: "joining", error: null });

    try {
      await joinQueue();
      await tryMatch();
      const state = await getQueueState();

      if (state.roomId) {
        set({
          status: "matched",
          roomId: state.roomId,
          count: state.count,
          oldestJoinedAt: null,
          queued: false,
          justMatched: true,
        });
      } else {
        set({
          status: "waiting",
          queued: true,
          count: state.count,
          oldestJoinedAt: state.oldestJoinedAt,
          justMatched: false,
        });
      }
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
      set({ status: "idle", queued: false, error: null, justMatched: false });
      await get().refresh();
    } catch {
      set({ status: previous, error: "Could not leave the queue." });
    }
  },

  async refresh() {
    try {
      if (get().queued || get().status === "waiting") {
        await tryMatch();
      }

      const state = await getQueueState();

      if (state.roomId) {
        set({
          status: "matched",
          roomId: state.roomId,
          queued: false,
          justMatched: true,
        });
      } else if (state.queued) {
        set({
          status: "waiting",
          queued: true,
          count: state.count,
          oldestJoinedAt: state.oldestJoinedAt,
          justMatched: false,
        });
      } else {
        set({
          status: "idle",
          queued: false,
          count: state.count,
          oldestJoinedAt: null,
          justMatched: false,
        });
      }
    } catch {
      set({ error: "Lost connection to the queue. Retrying…" });
    }
  },
}));
