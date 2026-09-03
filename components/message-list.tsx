"use client";

import { CheckCheck, ChevronDown, Pin, Search, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  REACTION_EMOJIS,
  type ChatMessage,
  type ReactionGroup,
} from "@/lib/chat/types";
import { cn } from "@/lib/utils";

const TIME_FORMAT = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
});

export function MessageList({
  messages,
  currentUserId,
  displayNamesById,
  nicknamesById,
  reactions,
  onToggleReaction,
  onPinMessage,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  displayNamesById?: Record<string, string>;
  nicknamesById?: Record<string, string>;
  reactions: Record<string, ReactionGroup[]>;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onPinMessage?: (message: ChatMessage, authorName: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [pinnedSuccessId, setPinnedSuccessId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const names = displayNamesById ?? nicknamesById ?? {};

  useEffect(() => {
    const node = scrollRef.current;
    if (node && isAtBottom && !searchQuery) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isAtBottom, searchQuery]);

  function handleScroll() {
    const node = scrollRef.current;
    if (!node) return;
    const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 100;
    setIsAtBottom(atBottom);
  }

  function scrollToBottom() {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    setIsAtBottom(true);
  }

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => {
        const text = m.content.toLowerCase();
        const author = (names[m.userId] || "").toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        return text.includes(q) || author.includes(q);
      })
    : messages;

  return (
    <div className="room-glass-panel relative flex flex-1 flex-col overflow-hidden rounded-3xl shadow-card-md">
      {/* Top Utility Bar with In-Chat Search */}
      <div className="flex items-center justify-between border-b border-[#006633]/10 bg-gradient-to-r from-[#f0faf5] via-white to-[#fdf9ee] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16a34a] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#16a34a]" />
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006633]">
            {filteredMessages.length} Message{filteredMessages.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isSearchOpen ? (
            <div className="flex items-center gap-1 animate-in fade-in">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-3 text-muted-foreground" />
                <Input
                  placeholder="Search messages in room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 w-48 rounded-xl bg-white pl-7 text-[11px] shadow-2xs border-[#006633]/20 focus:border-[#006633]"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-[#e5e7eb]"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#006633] transition-all hover:bg-[#006633] hover:text-[#FDB913] shadow-2xs border border-[#006633]/15"
            >
              <Search className="size-3" />
              <span>Search Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-[380px] flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6"
      >
        {/* Session Opening Hero Banner */}
        <div className="my-1 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[#006633]/20 bg-gradient-to-r from-[#f0faf5] via-white to-[#fef9e8] px-4 py-1.5 text-xs font-bold text-[#006633] shadow-2xs">
            <Sparkles className="size-3.5 text-[#FDB913]" />
            <span>🎉 24-Hour Tamaraw Batch Room Live</span>
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="my-auto flex flex-col items-center gap-2.5 text-center text-muted-foreground">
            {searchQuery ? (
              <>
                <Search className="size-8 text-muted-foreground/50" />
                <p className="text-xs font-bold text-foreground">
                  No messages match &ldquo;{searchQuery}&rdquo;
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-[#006633]/25 bg-[#f0faf5]/50 p-6 max-w-sm">
                <span className="text-4xl animate-bounce">👋</span>
                <p className="text-sm font-black text-[#006633]">
                  Start the Tamaraw conversation!
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Break the ice with your batchmates. Send a sticker, answer an icebreaker, or say hi!
                </p>
              </div>
            )}
          </div>
        ) : null}

        {filteredMessages.map((message) => {
          const isSystemDeparture =
            message.content.startsWith("👋 ") &&
            message.content.includes("has left the batch room");

          if (isSystemDeparture) {
            return (
              <div key={message.id} className="my-2 flex justify-center animate-in fade-in">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/5 px-4 py-1.5 text-[11px] font-bold text-destructive shadow-2xs">
                  <span>{message.content}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    (Chat continues)
                  </span>
                </div>
              </div>
            );
          }

          const isOwn = message.userId === currentUserId;
          const groups = reactions[message.id] ?? [];
          const pickerOpen = pickerFor === message.id;

          const senderRaw = names[message.userId] ?? "Freshie";
          const [nick, ...instParts] = senderRaw.split(" - ");
          const institute = instParts.length > 0 ? instParts.join(" - ") : null;
          const initial = (nick?.trim() || "F").slice(0, 1).toUpperCase();

          return (
            <div
              key={message.id}
              className={cn(
                "group flex max-w-[88%] gap-2.5 transition-all duration-200",
                isOwn ? "self-end flex-row-reverse" : "self-start flex-row",
              )}
            >
              {/* Avatar for received messages */}
              {!isOwn ? (
                <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl border-2 border-[#FDB913] bg-[#006633] text-xs font-black text-white shadow-2xs transition-transform group-hover:scale-110">
                  {initial}
                </span>
              ) : null}

              <div
                className={cn(
                  "flex flex-col gap-1",
                  isOwn ? "items-end" : "items-start",
                )}
              >
                {/* Sender Name & Institute Tag */}
                {!isOwn ? (
                  <div className="flex items-center gap-1.5 px-1 text-xs">
                    <span className="font-extrabold text-foreground">{nick}</span>
                    {institute ? (
                      <span className="rounded-md border border-[#006633]/20 bg-[#006633]/10 px-1.5 py-0.2 text-[8px] font-black uppercase text-[#006633]">
                        {institute}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "relative rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words transition-all duration-200",
                    isOwn
                      ? "rounded-br-xs bg-gradient-to-br from-[#006633] to-[#004d26] text-white shadow-bubble-me border border-[#006633]/30"
                      : "rounded-bl-xs border border-[#006633]/15 bg-white/95 text-[#111827] shadow-bubble-other backdrop-blur-xs",
                  )}
                >
                  {message.content}
                </div>

                {/* Reaction Picker Popup */}
                {pickerOpen ? (
                  <div className="mt-1 flex gap-1 rounded-2xl border border-[#006633]/20 bg-white p-1.5 shadow-card-md animate-in fade-in zoom-in-95">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={`React ${emoji}`}
                        onClick={() => {
                          onToggleReaction(message.id, emoji);
                          setPickerFor(null);
                        }}
                        className="rounded-xl px-2 py-1 text-base transition-transform hover:scale-135 hover:bg-[#f0faf5]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* Timestamp, Reaction Badges & Pin action */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <button
                    type="button"
                    onClick={() => setPickerFor(pickerOpen ? null : message.id)}
                    className={cn(
                      "flex items-center gap-1 text-[10px] transition-colors hover:text-[#006633]",
                      pickerOpen
                        ? "text-[#006633] font-bold"
                        : "text-muted-foreground opacity-80",
                    )}
                  >
                    <span>{TIME_FORMAT.format(new Date(message.createdAt))}</span>
                    {isOwn ? (
                      <CheckCheck className="size-3 text-[#FDB913]" />
                    ) : null}
                  </button>

                  {groups.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {groups.map((group) => (
                        <button
                          key={group.emoji}
                          type="button"
                          onClick={() => onToggleReaction(message.id, group.emoji)}
                          className={cn(
                            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold leading-none transition-all hover:scale-105",
                            group.mine
                              ? "border-[#006633]/30 bg-[#f0faf5] text-[#006633] shadow-2xs"
                              : "border-[#e5e7eb] bg-white text-muted-foreground hover:border-[#006633]/30",
                          )}
                        >
                          <span>{group.emoji}</span>
                          <span className="tabular-nums text-[10px]">{group.count}</span>
                        </button>
                      ))}
                    </span>
                  ) : null}

                  {/* 1-Click Pin Action */}
                  {onPinMessage ? (
                    <button
                      type="button"
                      onClick={() => {
                        onPinMessage(message, nick || "Batchmate");
                        setPinnedSuccessId(message.id);
                        setTimeout(() => setPinnedSuccessId(null), 2000);
                      }}
                      className={cn(
                        "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all",
                        pinnedSuccessId === message.id
                          ? "bg-[#f0faf5] text-[#006633] font-bold"
                          : "text-muted-foreground/60 hover:text-[#006633] hover:bg-[#f0faf5]",
                      )}
                      title="Pin this message to the top meetup banner"
                    >
                      <Pin className="size-2.5" />
                      <span>{pinnedSuccessId === message.id ? "Pinned!" : "Pin"}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating Scroll Down Pill */}
        {!isAtBottom ? (
          <button
            type="button"
            onClick={scrollToBottom}
            className="sticky bottom-2 mx-auto flex items-center gap-1.5 rounded-full border-2 border-[#FDB913] bg-[#006633] px-4 py-1.5 text-xs font-black text-[#FDB913] shadow-cta transition-transform hover:scale-105 animate-bounce"
          >
            <ChevronDown className="size-3.5 stroke-[3]" />
            <span>New Messages Below</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
