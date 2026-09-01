"use client";

import { useEffect, useRef, useState } from "react";

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
}: {
  messages: ChatMessage[];
  currentUserId: string;
  displayNamesById?: Record<string, string>;
  nicknamesById?: Record<string, string>;
  reactions: Record<string, ReactionGroup[]>;
  onToggleReaction: (messageId: string, emoji: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const names = displayNamesById ?? nicknamesById ?? {};

  useEffect(() => {
    const node = scrollRef.current;

    if (node && stickToBottomRef.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages]);

  function handleScroll() {
    const node = scrollRef.current;

    if (!node) return;
    stickToBottomRef.current =
      node.scrollHeight - node.scrollTop - node.clientHeight < 120;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-dashed p-4"
    >
      {messages.length === 0 ? (
        <p className="my-auto text-center text-sm text-muted-foreground">
          Say hi to your batch.
        </p>
      ) : null}

      {messages.map((message) => {
        const isOwn = message.userId === currentUserId;
        const groups = reactions[message.id] ?? [];
        const pickerOpen = pickerFor === message.id;

        const senderRaw = names[message.userId] ?? "Freshie";
        const [nick, ...instParts] = senderRaw.split(" - ");
        const institute = instParts.length > 0 ? instParts.join(" - ") : null;

        return (
          <div
            key={message.id}
            className={cn(
              "flex max-w-[85%] flex-col gap-0.5",
              isOwn ? "self-end items-end" : "self-start items-start",
            )}
          >
            {!isOwn ? (
              <div className="flex items-center gap-1.5 px-0.5 text-xs leading-none">
                <span className="font-semibold text-foreground/90">{nick}</span>
                {institute ? (
                  <span className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {institute}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div
              className={cn(
                "rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                isOwn
                  ? "bg-primary text-primary-foreground"
                  : "border bg-background",
              )}
            >
              {message.content}
            </div>

            {pickerOpen ? (
              <div className="mt-1 flex gap-1 rounded-full border bg-background p-1 shadow-sm">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`React ${emoji}`}
                    onClick={() => {
                      onToggleReaction(message.id, emoji);
                      setPickerFor(null);
                    }}
                    className="rounded-full px-1.5 py-0.5 text-sm transition-colors hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPickerFor(pickerOpen ? null : message.id)}
                className={cn(
                  "text-[10px] text-muted-foreground transition-opacity hover:text-foreground hover:underline",
                  pickerOpen ? "opacity-100" : "opacity-70",
                )}
              >
                {TIME_FORMAT.format(new Date(message.createdAt))}
              </button>

              {groups.length > 0 ? (
                <span className="flex gap-1">
                  {groups.map((group) => (
                    <button
                      key={group.emoji}
                      type="button"
                      onClick={() => onToggleReaction(message.id, group.emoji)}
                      className={cn(
                        "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] leading-none transition-colors",
                        group.mine
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background hover:border-primary/30",
                      )}
                    >
                      <span>{group.emoji}</span>
                      <span className="tabular-nums">{group.count}</span>
                    </button>
                  ))}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
