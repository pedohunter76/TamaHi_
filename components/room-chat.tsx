"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MessageInput } from "@/components/message-input";
import { MessageList } from "@/components/message-list";
import type { ChatMessage } from "@/lib/chat/types";
import { playPing } from "@/lib/notification";
import { formatMemberDisplayName } from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/store/chat-store";

type RawRealtimeRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

const BASE_TITLE = "TamaHi!";
const TYPING_VISIBLE_MS = 3000;
const TYPING_SEND_THROTTLE_MS = 1500;

export function RoomChat({
  roomId,
  currentUserId,
  displayNamesById,
  nicknamesById,
  ended,
}: {
  roomId: string;
  currentUserId: string;
  displayNamesById?: Record<string, string>;
  nicknamesById?: Record<string, string>;
  ended: boolean;
}) {
  const router = useRouter();
  const messages = useChatStore((state) => state.messages);
  const reactions = useChatStore((state) => state.reactions);
  const status = useChatStore((state) => state.status);
  const connection = useChatStore((state) => state.connection);
  const sending = useChatStore((state) => state.sending);
  const error = useChatStore((state) => state.error);
  const load = useChatStore((state) => state.load);
  const reload = useChatStore((state) => state.reload);
  const send = useChatStore((state) => state.send);
  const receive = useChatStore((state) => state.receive);
  const loadReactions = useChatStore((state) => state.loadReactions);
  const toggleReactionAction = useChatStore((state) => state.toggleReaction);
  const setConnection = useChatStore((state) => state.setConnection);
  const reset = useChatStore((state) => state.reset);

  const [fetchedNames, setFetchedNames] = useState<Record<string, string>>({});

  const namesMap = useMemo(
    () => ({
      ...(nicknamesById ?? {}),
      ...(displayNamesById ?? {}),
      ...fetchedNames,
    }),
    [displayNamesById, nicknamesById, fetchedNames],
  );

  useEffect(() => {
    const missing = messages
      .map((m) => m.userId)
      .filter((uid) => !namesMap[uid] || namesMap[uid] === "Freshie");

    if (missing.length === 0) return;

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, nickname, institute")
      .in("id", Array.from(new Set(missing)))
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setFetchedNames((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const row of data) {
            const formatted = formatMemberDisplayName(row.nickname, row.institute);
            if (formatted && formatted !== "Freshie" && next[row.id] !== formatted) {
              next[row.id] = formatted;
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      });
  }, [messages, namesMap]);

  const [typingIds, setTypingIds] = useState<string[]>([]);
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const lastTypingSentRef = useRef(0);
  const unreadRef = useRef(0);

  useEffect(() => {
    void load(roomId, currentUserId);

    return () => {
      reset();
    };
  }, [roomId, currentUserId, load, reset]);

  useEffect(() => {
    const supabase = createClient();

    function clearTyping(userId: string) {
      const timers = typingTimersRef.current;

      setTypingIds((previous) =>
        previous.includes(userId)
          ? previous.filter((id) => id !== userId)
          : previous,
      );

      const timer = timers.get(userId);
      if (timer) {
        clearTimeout(timer);
        timers.delete(userId);
      }
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as RawRealtimeRow;

          receive({
            id: row.id,
            userId: row.user_id,
            content: row.content,
            createdAt: new Date(row.created_at).toISOString(),
          } satisfies ChatMessage);

          if (
            row.user_id !== currentUserId &&
            typeof document !== "undefined" &&
            document.hidden
          ) {
            unreadRef.current += 1;
            document.title = `(${unreadRef.current}) ${BASE_TITLE}`;
            playPing();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => {
          void loadReactions(roomId);
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const userId =
          typeof payload?.userId === "string" ? payload.userId : null;

        if (!userId || userId === currentUserId) return;

        const timers = typingTimersRef.current;
        const existingTimer = timers.get(userId);

        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        timers.set(
          userId,
          setTimeout(() => clearTyping(userId), TYPING_VISIBLE_MS),
        );

        setTypingIds((previous) =>
          previous.includes(userId) ? previous : [...previous, userId],
        );
      })
      .subscribe((state) => {
        if (state === "SUBSCRIBED") {
          setConnection("live");

          if (useChatStore.getState().connection !== "connecting") {
            void reload(roomId, currentUserId);
          }
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          setConnection("reconnecting");
        }
      });

    channelRef.current = channel;
    const currentTimers = typingTimersRef.current;

    return () => {
      for (const [, timer] of currentTimers) {
        clearTimeout(timer);
      }
      currentTimers.clear();
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, load, reload, receive, loadReactions, setConnection]);

  useEffect(() => {
    function restoreTitle() {
      unreadRef.current = 0;
      document.title = BASE_TITLE;
    }

    function onVisibility() {
      if (!document.hidden) {
        restoreTitle();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      restoreTitle();
    };
  }, []);

  function handleSelfTyping() {
    const now = Date.now();

    if (now - lastTypingSentRef.current < TYPING_SEND_THROTTLE_MS) return;
    if (!channelRef.current) return;

    lastTypingSentRef.current = now;

    void channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }

  function handleToggleReaction(messageId: string, emoji: string) {
    void toggleReactionAction(messageId, emoji);
  }

  const typingNames = typingIds.map((id) => namesMap[id] ?? "Freshie");

  return (
    <div className="flex flex-1 flex-col gap-3">
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        displayNamesById={namesMap}
        reactions={reactions}
        onToggleReaction={handleToggleReaction}
      />

      {connection === "reconnecting" ? (
        <p className="text-center text-xs text-muted-foreground">
          Reconnecting…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-center text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {status === "loading" ? (
        <p className="text-center text-xs text-muted-foreground">
          Loading messages…
        </p>
      ) : null}

      {!ended && typingNames.length > 0 ? (
        <p className="animate-pulse text-xs text-muted-foreground" aria-live="polite">
          {typingNames.join(", ")}{" "}
          {typingNames.length === 1 ? "is" : "are"} typing…
        </p>
      ) : null}

      <MessageInput
        disabled={ended}
        sending={sending}
        onSend={send}
        onTyping={handleSelfTyping}
      />

      {ended ? (
        <button
          type="button"
          onClick={() => {
            router.push("/lobby");
            router.refresh();
          }}
          className="self-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to lobby
        </button>
      ) : null}
    </div>
  );
}
