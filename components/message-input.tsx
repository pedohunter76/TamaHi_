"use client";

import { LoaderCircle, Send, Smile } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_CONTENT_LENGTH = 500;
const COUNTER_THRESHOLD = 450;
const QUICK_EMOJIS = ["👋", "✨", "🔥", "💚", "😂", "🙏", "🎓", "☕"];
const TAMARAW_STICKERS = [
  "🔰 Tatak Tamaraw!",
  "🔥 Be Brave!",
  "☕ Morayta Coffee Run?",
  "📚 Midterms Grind na!",
  "🌧️ May baha ba sa Morayta?",
  "💚 One FEU!",
  "🥪 Hepas Lane G?",
  "🏫 Tambay sa Pav Grandstand?",
];

export function MessageInput({
  disabled,
  sending,
  onSend,
  onTyping,
}: {
  disabled?: boolean;
  sending: boolean;
  onSend: (content: string) => Promise<boolean>;
  onTyping?: () => void;
}) {
  const [value, setValue] = useState("");
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [trayTab, setTrayTab] = useState<"emojis" | "stickers">("stickers");

  async function submit() {
    if (disabled || sending) return;

    const content = value.trim();
    if (!content || content.length > MAX_CONTENT_LENGTH) return;

    const sent = await onSend(content);
    if (sent) {
      setValue("");
      setShowEmojiMenu(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  function insertEmoji(emoji: string) {
    setValue((prev) => prev + emoji);
    onTyping?.();
  }

  function insertSticker(sticker: string) {
    setValue((prev) => (prev ? `${prev} ${sticker}` : sticker));
    onTyping?.();
  }

  return (
    <div className="relative flex flex-col gap-2">
      {/* Quick emoji and sticker drawer */}
      {showEmojiMenu && !disabled ? (
        <div className="room-glass-panel flex flex-col gap-2.5 rounded-3xl p-3.5 shadow-card-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-[#006633]/15 pb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold">
              <button
                type="button"
                onClick={() => setTrayTab("stickers")}
                className={cn(
                  "rounded-xl px-3 py-1 transition-all shadow-2xs",
                  trayTab === "stickers"
                    ? "bg-[#006633] text-[#FDB913] font-black"
                    : "bg-white text-muted-foreground hover:text-foreground",
                )}
              >
                🔰 Tamaraw Catchphrases
              </button>
              <button
                type="button"
                onClick={() => setTrayTab("emojis")}
                className={cn(
                  "rounded-xl px-3 py-1 transition-all shadow-2xs",
                  trayTab === "emojis"
                    ? "bg-[#006633] text-[#FDB913] font-black"
                    : "bg-white text-muted-foreground hover:text-foreground",
                )}
              >
                ✨ Emojis
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowEmojiMenu(false)}
              className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-muted-foreground hover:bg-[#f3f4f6] hover:text-foreground"
            >
              ✕ Close
            </button>
          </div>

          {trayTab === "stickers" ? (
            <div className="flex flex-wrap gap-2 pt-0.5 max-h-40 overflow-y-auto">
              {TAMARAW_STICKERS.map((sticker) => (
                <button
                  key={sticker}
                  type="button"
                  onClick={() => insertSticker(sticker)}
                  className="rounded-2xl border border-[#006633]/25 bg-gradient-to-r from-[#f0faf5] to-white px-3 py-1.5 text-xs font-black text-[#006633] shadow-2xs transition-all hover:bg-[#006633] hover:text-[#FDB913] hover:scale-105 active:scale-95"
                >
                  {sticker}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="flex size-9 items-center justify-center rounded-2xl bg-[#f5f7f5] text-xl transition-all hover:scale-130 hover:bg-[#f0faf5] active:scale-95 shadow-2xs"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Main Message Floating Dock */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "room-glass-panel flex items-center gap-2 rounded-3xl p-2 transition-all duration-200 shadow-card-sm",
          "focus-within:border-[#006633] focus-within:ring-2 focus-within:ring-[#006633]/20 focus-within:shadow-card-md",
        )}
      >
        {/* Emoji toggle */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowEmojiMenu(!showEmojiMenu)}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-[#f0faf5] hover:text-[#006633]",
            showEmojiMenu && "bg-[#006633] text-[#FDB913] shadow-xs",
          )}
          title="Insert Tamaraw Stickers & Emojis"
        >
          <Smile className="size-5.5" />
        </button>

        {/* Input Text Box */}
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "This 24-hour room has ended."
                : "Say hi to your fellow Tamaraw freshies..."
            }
            maxLength={MAX_CONTENT_LENGTH}
            autoComplete="off"
            className="h-11 border-0 bg-transparent px-2.5 text-sm font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {value.length > COUNTER_THRESHOLD ? (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground tabular-nums">
              {value.length}/{MAX_CONTENT_LENGTH}
            </span>
          ) : null}
        </div>

        {/* Dynamic Send Button */}
        <Button
          type="submit"
          size="icon"
          disabled={disabled || sending || !value.trim()}
          className={cn(
            "size-11 shrink-0 rounded-2xl transition-all duration-300",
            value.trim() && !disabled
              ? "bg-[#006633] text-[#FDB913] shadow-cta hover:scale-105 hover:bg-[#004d26] active:scale-95"
              : "bg-[#e5e7eb] text-[#9ca3af] opacity-60",
          )}
          aria-label="Send message"
        >
          {sending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
