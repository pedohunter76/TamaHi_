"use client";

import { create } from "zustand";

import {
  getMessages,
  getReactions,
  sendMessage,
  toggleReaction,
} from "@/lib/chat/actions";
import type { ChatMessage, ReactionGroup } from "@/lib/chat/types";

const MAX_IN_MEMORY = 200;

type ConnectionState = "connecting" | "live" | "reconnecting";

type ChatStore = {
  roomId: string | null;
  currentUserId: string | null;
  messages: ChatMessage[];
  reactions: Record<string, ReactionGroup[]>;
  status: "loading" | "ready" | "error";
  connection: ConnectionState;
  sending: boolean;
  error: string | null;
  load: (roomId: string, currentUserId: string) => Promise<void>;
  reload: (roomId: string, currentUserId: string) => Promise<void>;
  send: (content: string) => Promise<boolean>;
  receive: (message: ChatMessage) => void;
  loadReactions: (roomId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  setConnection: (connection: ConnectionState) => void;
  reset: () => void;
};

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
      a.id.localeCompare(b.id),
  );
}

function toggleLocalReaction(
  current: Record<string, ReactionGroup[]>,
  messageId: string,
  emoji: string,
  userId: string | null,
): Record<string, ReactionGroup[]> {
  const groups = [...(current[messageId] ?? [])];
  const index = groups.findIndex((group) => group.emoji === emoji);

  if (index === -1) {
    return {
      ...current,
      [messageId]: [...groups, { emoji, count: 1, mine: true }],
    };
  }

  const group = groups[index];

  if (group.mine) {
    if (group.count <= 1) {
      groups.splice(index, 1);
    } else {
      groups[index] = { ...group, count: group.count - 1, mine: false };
    }
  } else {
    groups[index] = { ...group, count: group.count + 1, mine: true };
  }

  const next = { ...current, [messageId]: groups };

  if (groups.length === 0 && userId) {
    delete next[messageId];
  }

  return next;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  roomId: null,
  currentUserId: null,
  messages: [],
  reactions: {},
  status: "loading",
  connection: "connecting",
  sending: false,
  error: null,

  async load(roomId, currentUserId) {
    if (get().roomId === roomId && get().status === "ready") {
      return;
    }

    set({ status: "loading", error: null });

    try {
      const messages = await getMessages(roomId);

      set({
        roomId,
        currentUserId,
        messages,
        status: "ready",
        connection: "connecting",
      });
    } catch {
      set({ status: "error", error: "Could not load this room's messages." });
    }

    try {
      const reactions = await getReactions(roomId);

      if (get().roomId === roomId) {
        set({ reactions });
      }
    } catch {
      // Reactions are additive; messages still render without them.
    }
  },

  async reload(roomId, currentUserId) {
    try {
      const messages = await getMessages(roomId);

      if (get().roomId === roomId) {
        set({ messages, currentUserId });
      }
    } catch {
      // Keep the current snapshot; realtime will retry on next event.
      return;
    }

    try {
      const reactions = await getReactions(roomId);

      if (get().roomId === roomId) {
        set({ reactions });
      }
    } catch {
      // Reactions are additive; messages still render without them.
    }
  },

  async send(content) {
    if (!get().roomId) return false;

    set({ sending: true, error: null });

    try {
      await sendMessage(get().roomId as string, content);
      return true;
    } catch {
      set({ error: "Message failed to send. Try again." });
      return false;
    } finally {
      set({ sending: false });
    }
  },

  receive(message) {
    const { messages } = get();

    const exists = messages.some((existing) => existing.id === message.id);
    if (exists) {
      return;
    }

    const next = sortMessages([...messages, message]);

    set({
      messages:
        next.length > MAX_IN_MEMORY ? next.slice(next.length - MAX_IN_MEMORY) : next,
    });
  },

  async loadReactions(roomId) {
    try {
      const reactions = await getReactions(roomId);

      if (get().roomId === roomId) {
        set({ reactions });
      }
    } catch {
      // Keep previous snapshot on failure.
    }
  },

  async toggleReaction(messageId, emoji) {
    const { roomId, reactions, currentUserId } = get();
    if (!roomId) return;

    const previous = reactions;

    set({
      reactions: toggleLocalReaction(reactions, messageId, emoji, currentUserId),
    });

    try {
      await toggleReaction(messageId, emoji);
    } catch {
      set({ reactions: previous, error: "Could not save that reaction." });
    }
  },

  setConnection(connection) {
    set({ connection });
  },

  reset() {
    set({
      roomId: null,
      currentUserId: null,
      messages: [],
      reactions: {},
      status: "loading",
      connection: "connecting",
      sending: false,
      error: null,
    });
  },
}));
