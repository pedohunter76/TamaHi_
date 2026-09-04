"use client";

import { create } from "zustand";

import {
  getQueueState,
  joinQueue,
  leaveQueue,
  startEarlyMatch,
  tryMatch,
  type QueueState,
} from "@/lib/match/actions";
import { BATCH_SIZE } from "@/lib/match/constants";
import { isRoomDeparted } from "@/lib/match/left-rooms";

type QueueStatus = "idle" | "joining" | "waiting" | "matched";

type QueueStore = QueueState & {
  status: QueueStatus;
  error: string | null;
  justMatched: boolean;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  startEarly: () => Promise<void>;
  refresh: () => Promise<void>;
  resetRoom: () => void;
};

function navigateToRoom(roomId: string) {
  if (typeof window !== "undefined") {
    window.location.replace(`/chat/${roomId}`);
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

  resetRoom() {
    set({
      status: "idle",
      queued: false,
      roomId: null,
      justMatched: false,
      error: null,
    });
  },

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

      // IF QUEUE IS FULL, immediately trigger matching and auto-direct
      if (state.count >= BATCH_SIZE) {
        const fullQueueRoomId = await tryMatch();
        if (fullQueueRoomId) {
          set({
            status: "matched",
            roomId: fullQueueRoomId,
            queued: false,
            justMatched: true,
          });
          navigateToRoom(fullQueueRoomId);
          return;
        }
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
        if (typeof window !== "undefined" && isRoomDeparted(state.roomId)) {
          set({
            status: "idle",
            roomId: null,
            stats: state.stats,
            queued: false,
            justMatched: false,
          });
          return;
        }

        // Only auto-direct if user was actively waiting in the queue
        if (get().queued || get().status === "waiting" || get().status === "joining") {
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

        // IF THE QUEUING IS FULL, auto direct to the room immediately!
        if (state.count >= BATCH_SIZE) {
          const autoMatchRoomId = await tryMatch();
          if (autoMatchRoomId) {
            set({
              status: "matched",
              roomId: autoMatchRoomId,
              queued: false,
              justMatched: true,
            });
            navigateToRoom(autoMatchRoomId);
            return;
          }
        }
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
