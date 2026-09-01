"use client";

import { Hourglass, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { BATCH_SIZE } from "@/lib/match/constants";
import { leaveRoom } from "@/lib/match/actions";
import { createClient } from "@/lib/supabase/client";
import { useQueueStore } from "@/store/queue-store";

function SeatDots({ filled }: { filled: number }) {
  return (
    <div className="mt-6 flex items-center justify-center -space-x-3">
      {Array.from({ length: BATCH_SIZE }, (_, index) => (
        <span key={index}>
          {index < filled ? (
            <span className="flex size-11 items-center justify-center rounded-full border-2 border-background bg-primary/15 text-xs font-bold text-primary shadow-sm">
              <Users className="size-4" />
            </span>
          ) : index === filled ? (
            <span className="flex size-11 animate-pulse items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-transparent text-primary/70">
              <Hourglass className="size-4" />
            </span>
          ) : (
            <span className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-border/70 bg-transparent text-muted-foreground/60">
              <Hourglass className="size-4" />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function formatWait(joinedAtIso: string): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(joinedAtIso).getTime()) / 60_000),
  );

  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`;
}

export function LobbyQueue() {
  const router = useRouter();
  const status = useQueueStore((state) => state.status);
  const count = useQueueStore((state) => state.count);
  const roomId = useQueueStore((state) => state.roomId);
  const oldestJoinedAt = useQueueStore((state) => state.oldestJoinedAt);
  const justMatched = useQueueStore((state) => state.justMatched);
  const error = useQueueStore((state) => state.error);
  const join = useQueueStore((state) => state.join);
  const leave = useQueueStore((state) => state.leave);
  const refresh = useQueueStore((state) => state.refresh);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("match-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_queue" },
        () => {
          void refresh();
        },
      )
      .subscribe();

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    if (status === "matched" && roomId) {
      router.replace(`/chat/${roomId}`);
    }
  }, [status, roomId, router]);

  if (error) {
    return (
      <div className="glass-card flex flex-col gap-3 rounded-2xl p-8 text-center">
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
        <Button
          onClick={() => void refresh()}
          variant="outline"
          className="mx-auto"
        >
          Reconnect
        </Button>
      </div>
    );
  }

  if (status === "joining") {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
        Finding your people…
      </div>
    );
  }

  if (status === "matched" && !justMatched && roomId) {
    return (
      <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-8 text-center md:p-10">
        <p className="text-lg font-bold">Your batch is still live.</p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Your room stays open for the rest of its 24 hours.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => router.push(`/chat/${roomId}`)}
            className="rounded-xl px-6 font-bold"
          >
            Return to your room
          </Button>
          <button
            type="button"
            onClick={async () => {
              try {
                await leaveRoom(roomId);
                await join();
              } catch {
                void refresh();
              }
            }}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Leave it and find new people
          </button>
        </div>
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="glass-card flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-primary/40 p-8 text-center transition-all duration-300 min-h-[320px] md:col-span-8">
          <span className="flex size-20 animate-pulse items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-9" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Finding your people…</h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Hang tight — we&apos;re seating freshies who vibe like you. The room
            opens the moment your batch is full.
          </p>
          <button
            type="button"
            onClick={() => void leave()}
            className="mt-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Leave the queue
          </button>
        </div>

        <div className="glass-card relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl p-6 md:col-span-4">
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-10 size-44 rounded-full bg-secondary/30 blur-3xl"
          />
          <div className="relative flex flex-1 flex-col">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">Queue status</h2>
              <span className="rounded-full bg-secondary/25 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="text-6xl font-black tabular-nums text-primary drop-shadow-sm">
                {count}
                <span className="text-3xl font-bold text-muted-foreground/70">
                  {" "}
                  / {BATCH_SIZE}
                </span>
              </p>
              <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
                Freshies waiting for a lobby match.
              </p>

              <div className="mt-4 h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${(Math.min(count, BATCH_SIZE) / BATCH_SIZE) * 100}%` }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={BATCH_SIZE}
                  aria-valuenow={Math.min(count, BATCH_SIZE)}
                />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {oldestJoinedAt
                  ? `Longest wait so far: ${formatWait(oldestJoinedAt)}`
                  : "Next seat opens soon."}
              </p>
            </div>
            <SeatDots filled={Math.min(count, BATCH_SIZE)} />
          </div>
        </div>
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="group glass-card flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/70 p-8 text-center transition-all duration-300 hover:border-primary/50 md:col-span-8">
          <span className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
            <Users className="size-9" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Find my people</h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Groups of {BATCH_SIZE} freshies with matching vibes get seated
            together. Join the queue and say hi before classes start.
          </p>
          <Button
            onClick={() => void join()}
            className="mt-2 h-auto rounded-xl px-8 py-3 text-sm font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            Start matching
          </Button>
        </div>

        <div className="glass-card relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl p-6 md:col-span-4">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full bg-primary/10 blur-2xl"
          />
          <div className="relative flex flex-1 flex-col">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">Queue status</h2>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Idle
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="text-6xl font-black tabular-nums text-muted-foreground/50">
                –<span className="text-3xl font-bold"> / {BATCH_SIZE}</span>
              </p>
              <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
                You&apos;re not in the queue yet.
              </p>
            </div>
            <SeatDots filled={0} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
      Your room is opening…
    </div>
  );
}
