"use client";

import { Compass, Download, Info, LogOut, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CampusTipsSheet } from "@/components/campus-tips-sheet";
import { LeaveRoomButton } from "@/components/leave-room-button";
import { MemberProfileModal, type MemberModalData } from "@/components/member-profile-modal";
import { MessageInput } from "@/components/message-input";
import { MessageList } from "@/components/message-list";
import { RoomCountdown } from "@/components/room-countdown";
import { RoomIcebreakers } from "@/components/room-icebreakers";
import { broadcastPinMessage, RoomPinnedMessages } from "@/components/room-pinned-messages";
import { RoomPoll } from "@/components/room-poll";
import { RoomSessionRecap } from "@/components/room-session-recap";
import { RoomSocialExchange } from "@/components/room-social-exchange";
import type { ChatMessage } from "@/lib/chat/types";
import { leaveRoom } from "@/lib/match/actions";
import { markRoomDeparted } from "@/lib/match/left-rooms";
import { playPing } from "@/lib/notification";
import { formatMemberDisplayName, getInstituteShortName } from "@/lib/profile/constants";
import { playMatchChime, playMessagePop } from "@/lib/sound";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import { useQueueStore } from "@/store/queue-store";

type RawRealtimeRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type RoomParticipant = {
  userId: string;
  nickname: string;
  displayName: string;
  institute: string | null;
  course: string | null;
  vibes?: number[] | null;
};

const BASE_TITLE = "TamaHi!";
const TYPING_VISIBLE_MS = 3000;
const TYPING_SEND_THROTTLE_MS = 1500;

export function RoomChat({
  roomId,
  currentUserId,
  displayNamesById,
  nicknamesById,
  roster = [],
  expiresAtIso,
  ended,
}: {
  roomId: string;
  currentUserId: string;
  displayNamesById?: Record<string, string>;
  nicknamesById?: Record<string, string>;
  roster?: RoomParticipant[];
  expiresAtIso?: string;
  ended: boolean;
}) {
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

  const [showInfo, setShowInfo] = useState(false);
  const [isCampusGuideOpen, setIsCampusGuideOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberModalData | null>(null);
  const [fetchedNames, setFetchedNames] = useState<Record<string, string>>({});
  const [departedUserIds, setDepartedUserIds] = useState<string[]>([]);

  const activeRoster = useMemo(
    () => roster.filter((m) => !departedUserIds.includes(m.userId)),
    [roster, departedUserIds],
  );

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
    playMatchChime();

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

          if (row.user_id !== currentUserId) {
            playMessagePop();
          }

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
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_members",
        },
        (payload) => {
          const oldRow = payload.old as { user_id?: string; room_id?: string } | undefined;
          if (oldRow?.room_id && oldRow.room_id !== roomId) return;
          const departedId = oldRow?.user_id;
          if (departedId) {
            if (departedId === currentUserId) {
              markRoomDeparted(roomId);
              useQueueStore.getState().resetRoom();
              window.location.replace("/lobby");
              return;
            }
            setDepartedUserIds((prev) =>
              prev.includes(departedId) ? prev : [...prev, departedId],
            );
          }
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

  function handleExportTranscript() {
    const shortId = roomId.slice(0, 6).toUpperCase();
    const header = `=== FEU TamaHi! Batch Chat Room #${shortId} ===\nExported: ${new Date().toLocaleString()}\nParticipants: ${roster.map((r) => `${r.nickname} (${r.course || "FEU Freshie"})`).join(", ")}\n\n--- CHAT LOGS ---\n`;
    const body = messages
      .map((m) => {
        const author = namesMap[m.userId] || "Freshie";
        const time = new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `[${time}] ${author}: ${m.content}`;
      })
      .join("\n");

    const fullText = `${header}${body || "No messages sent yet."}\n\n=== Be Brave, Tatak Tamaraw! ===\n`;
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FEU_Batch_Room_${shortId}_Chat_Transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const typingNames = typingIds.map((id) => namesMap[id] ?? "Freshie");
  const shortRoomId = roomId.slice(0, 6).toUpperCase();

  return (
    <div className="flex flex-1 flex-col gap-3.5">
      {/* Top Lively Room Header */}
      <header className="room-glass-header relative overflow-hidden rounded-3xl p-3.5 sm:p-4 shadow-card-sm transition-all">
        {/* Subtle decorative background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[#FDB913]/15 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -bottom-10 size-40 rounded-full bg-[#006633]/10 blur-2xl"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          {/* Room Title & Live Pulse */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-2xl bg-[#006633] px-3.5 py-1.5 text-xs font-black tracking-wider text-[#FDB913] shadow-cta">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FDB913] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#FDB913]" />
              </span>
              <MessageSquare className="size-3.5 fill-[#FDB913]" />
              <span>ROOM #{shortRoomId}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#006633]/20 bg-[#f0faf5] px-2.5 py-1 text-[11px] font-extrabold text-[#006633]">
              <Sparkles className="size-3 text-[#FDB913]" />
              <span>24H Tamaraw Batch Room</span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Participants Stack with tooltips */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-[#e5e7eb] bg-white/80 px-2 py-1 shadow-2xs backdrop-blur-xs">
              <div className="flex -space-x-2">
                {activeRoster.map((member) => (
                  <button
                    type="button"
                    key={member.userId}
                    onClick={() =>
                      setSelectedMember({
                        id: member.userId,
                        nickname: member.nickname,
                        institute: member.institute,
                        course: member.course,
                        vibes: member.vibes,
                      })
                    }
                    title={`View ${member.displayName}'s Profile`}
                    className="relative flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#006633] text-[10px] font-black text-white shadow-xs transition-transform hover:z-20 hover:scale-125"
                  >
                    {member.nickname.slice(0, 1).toUpperCase()}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-bold text-[#006633] pl-1">
                {activeRoster.length}/4
              </span>
            </div>

            {expiresAtIso ? <RoomCountdown expiresAtIso={expiresAtIso} /> : null}

            {/* Quick Guide Launch Button */}
            <button
              type="button"
              onClick={() => setIsCampusGuideOpen(true)}
              className="flex size-8 items-center justify-center rounded-xl bg-[#f0faf5] text-[#006633] transition-all hover:scale-105 hover:bg-[#e2f5ec] shadow-2xs"
              title="Open FEU Campus Guide & Tips"
            >
              <Compass className="size-4 text-[#006633]" />
            </button>

            {/* Save Transcript Action */}
            <button
              type="button"
              onClick={handleExportTranscript}
              className="flex size-8 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#6b7280] transition-all hover:scale-105 hover:bg-[#e5e7eb] hover:text-[#006633] shadow-2xs"
              title="Save / Download Chat Transcript"
            >
              <Download className="size-4" />
            </button>

            {/* Info Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-all hover:scale-105 shadow-2xs",
                showInfo
                  ? "bg-[#006633] text-[#FDB913]"
                  : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#006633]",
              )}
              title="Toggle Batch Members Info"
            >
              <Info className="size-4" />
            </button>

            {/* Quick Leave Room Button */}
            <button
              type="button"
              onClick={async () => {
                if (
                  window.confirm(
                    "Leave this batch room? You will not be able to rejoin this room, but your batchmates can continue chatting.",
                  )
                ) {
                  markRoomDeparted(roomId);
                  useQueueStore.getState().resetRoom();
                  try {
                    await leaveRoom(roomId);
                  } catch {
                    // Ignore error and proceed to lobby
                  } finally {
                    window.location.replace("/lobby");
                  }
                }
              }}
              className="flex size-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-all hover:scale-105 hover:bg-destructive hover:text-white shadow-2xs"
              title="Leave Room"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Batch Members Roster Cards */}
      {showInfo && activeRoster.length > 0 ? (
        <div className="room-glass-panel flex flex-col gap-2.5 rounded-3xl p-4 shadow-card-md animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#006633]">
              <Sparkles className="size-3.5 text-[#FDB913]" />
              <span>Matched Tamaraw Freshies in this Room</span>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Click any card to inspect vibe breakdown
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {activeRoster.map((member) => {
              const instShort = getInstituteShortName(member.institute);
              return (
                <button
                  type="button"
                  key={member.userId}
                  onClick={() =>
                    setSelectedMember({
                      id: member.userId,
                      nickname: member.nickname,
                      institute: member.institute,
                      course: member.course,
                      vibes: member.vibes,
                    })
                  }
                  className="group relative flex flex-col gap-2 rounded-2xl border border-[#006633]/20 bg-gradient-to-b from-[#f0faf5]/70 to-white p-3 text-left shadow-2xs transition-all hover:-translate-y-0.5 hover:border-[#006633] hover:shadow-card-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#FDB913] bg-[#006633] text-sm font-black text-white shadow-xs group-hover:scale-105 transition-transform">
                      {member.nickname.slice(0, 1).toUpperCase()}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-[#16a34a] border border-[#16a34a]/20">
                      <span className="size-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                      Online
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-xs font-black text-foreground">
                        {member.nickname}
                      </p>
                      {instShort ? (
                        <span className="shrink-0 rounded-md border border-[#006633]/20 bg-[#006633]/10 px-1 py-0.2 text-[8px] font-black uppercase text-[#006633]">
                          {instShort}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[10px] font-medium text-muted-foreground pt-0.5">
                      {member.course || "FEU Freshie"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Pinned Meetups / Notes */}
      <RoomPinnedMessages roomId={roomId} />

      {/* Lively Message Stream */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        displayNamesById={namesMap}
        reactions={reactions}
        onToggleReaction={handleToggleReaction}
        onPinMessage={(msg, author) => {
          broadcastPinMessage(roomId, {
            id: msg.id,
            authorName: author,
            content: msg.content,
            pinnedAt: new Date().toISOString(),
          });
        }}
      />

      {connection === "reconnecting" ? (
        <p className="text-center text-xs font-bold text-muted-foreground animate-pulse">
          🔄 Reconnecting to Tamaraw batch…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 text-center text-xs font-bold text-destructive">
          {error}
        </p>
      ) : null}

      {status === "loading" ? (
        <p className="text-center text-xs text-muted-foreground">
          Loading messages…
        </p>
      ) : null}

      {!ended && typingNames.length > 0 ? (
        <div className="flex items-center gap-2 px-3 py-1 text-xs text-[#006633] font-semibold" aria-live="polite">
          <span className="flex gap-1">
            <span className="size-1.5 rounded-full bg-[#006633] animate-dot-bounce" style={{ animationDelay: "0ms" }} />
            <span className="size-1.5 rounded-full bg-[#006633] animate-dot-bounce" style={{ animationDelay: "150ms" }} />
            <span className="size-1.5 rounded-full bg-[#006633] animate-dot-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          <span>
            {typingNames.join(", ")}{" "}
            {typingNames.length === 1 ? "is" : "are"} typing…
          </span>
        </div>
      ) : null}

      {/* In-Room Activities Toolbar: Icebreakers, Campus Polls & Socials */}
      {!ended ? (
        <div className="flex flex-col gap-2.5">
          <RoomIcebreakers
            onSendIcebreaker={(content) => void send(content)}
            disabled={ended}
          />
          <RoomPoll
            roomId={roomId}
            onSendPoll={(pollText) => void send(pollText)}
            disabled={ended}
          />
          <RoomSocialExchange
            roomId={roomId}
            currentUserId={currentUserId}
            roster={roster}
            disabled={ended}
          />
        </div>
      ) : null}

      {/* Session Expired / Completed Recap */}
      {ended ? (
        <RoomSessionRecap
          roster={roster}
          roomId={roomId}
          onExportTranscript={handleExportTranscript}
        />
      ) : null}

      {/* Input Dock */}
      <MessageInput
        disabled={ended}
        sending={sending}
        onSend={send}
        onTyping={handleSelfTyping}
      />

      <div className="flex justify-center pt-1 pb-2">
        <LeaveRoomButton roomId={roomId} />
      </div>

      {/* FEU Freshie Campus Compass Sheet */}
      <CampusTipsSheet
        isOpen={isCampusGuideOpen}
        onClose={() => setIsCampusGuideOpen(false)}
        onShareTipToChat={(tipText) => {
          void send(tipText);
          setIsCampusGuideOpen(false);
        }}
      />

      {/* Member Profile Modal */}
      <MemberProfileModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}

