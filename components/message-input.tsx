"use client";

import { LoaderCircle, SendHorizontal } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_CONTENT_LENGTH = 500;
const COUNTER_THRESHOLD = 450;

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

  async function submit() {
    if (disabled || sending) return;

    const content = value.trim();
    if (!content || content.length > MAX_CONTENT_LENGTH) return;

    const sent = await onSend(content);

    if (sent) {
      setValue("");
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

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "This room has ended." : "Message your batch"}
          maxLength={MAX_CONTENT_LENGTH}
          autoComplete="off"
          className="pr-12"
        />
        {value.length > COUNTER_THRESHOLD ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
            {value.length}/{MAX_CONTENT_LENGTH}
          </span>
        ) : null}
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={disabled || sending || !value.trim()}
        aria-label="Send message"
      >
        {sending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <SendHorizontal className="size-4" />
        )}
      </Button>
    </form>
  );
}
