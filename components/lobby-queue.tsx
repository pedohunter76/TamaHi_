"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  MessageSquare,
  Play,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { BATCH_SIZE } from "@/lib/match/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useQueueStore } from "@/store/queue-store";

const ROTATING_TIPS = [
  "💡 Did you know? The Arts Building corridor is the fastest dry shortcut to Gate 4 during heavy rains!",
  "💡 Freshie Tip: Free charging outlets are on every wooden desk at the FEU Library 3rd floor.",
  "💡 Vibe Match: Groups of 4 are seated based on your vacant spot and study habit compatibility.",
  "💡 Survival Hack: Gate 2 on R. Papa is the closest exit for rush document printing and bookbinding.",
  "💡 Campus Spirit: Green Wednesdays are official wash days — wear green with pride!",
];

export function LobbyQueue() {
  const router = useRouter();
  const status = useQueueStore((state) => state.status);
  const count = useQueueStore((state) => state.count);
  const roomId = useQueueStore((state) => state.roomId);
  const error = useQueueStore((state) => state.error);
  const join = useQueueStore((state) => state.join);
  const leave = useQueueStore((state) => state.leave);
  const startEarly = useQueueStore((state) => state.startEarly);
  const refresh = useQueueStore((state) => state.refresh);
  const stats = useQueueStore((state) => state.stats);

  const [tipIndex, setTipIndex] = useState(0);
  const [startingEarly, setStartingEarly] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("match-queue-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_queue" },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_members" },
        () => {
          void refresh();
        },
      )
      .subscribe();

    void refresh();

    // Rapid 1.2s polling while waiting in queue, 5s when idle
    const pollIntervalMs = status === "waiting" || status === "joining" ? 1200 : 5000;
    const interval = setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [refresh, status]);

  useEffect(() => {
    if (status === "waiting" || status === "joining") {
      const tipTimer = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
      }, 4500);
      return () => clearInterval(tipTimer);
    }
  }, [status]);

  useEffect(() => {
    if (status === "matched" && roomId) {
      // Direct guaranteed redirection to the chat room
      router.replace(`/chat/${roomId}`);
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/chat/${roomId}`;
      }
    }
  }, [status, roomId, router]);

  if (error) {
    return (
      <div className="glass-card mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl p-8 text-center shadow-card-sm">
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
        <Button
          onClick={() => void refresh()}
          variant="outline"
          className="rounded-xl border-[#006633] font-bold text-[#006633]"
        >
          Reconnect
        </Button>
      </div>
    );
  }

  // 1. LIVE BATCH MATCHED TRANSITION SCREEN
  if (status === "matched" && roomId) {
    return (
      <div className="glass-card mx-auto flex max-w-lg flex-col items-center gap-5 rounded-3xl p-8 text-center shadow-card-md md:p-10 animate-in zoom-in-95">
        <div className="relative flex size-20 items-center justify-center rounded-3xl bg-[#006633] text-[#FDB913] shadow-cta">
          <MessageSquare className="size-10 fill-[#FDB913] animate-bounce" />
        </div>
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#006633]/20 bg-[#f0faf5] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#006633]">
            <Sparkles className="size-3.5 text-[#FDB913]" />
            Match Found! 🎉
          </span>
          <h2 className="text-2xl font-black text-[#006633] md:text-3xl">Entering Your Room…</h2>
          <p className="text-xs leading-relaxed text-muted-foreground max-w-sm mx-auto">
            You and your 3 FEU batchmates are matched. Redirecting you directly to Room #{roomId.slice(0, 6).toUpperCase()}…
          </p>
        </div>
        <Button
          onClick={() => {
            router.push(`/chat/${roomId}`);
            if (typeof window !== "undefined") {
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = `/chat/${roomId}`;
            }
          }}
          className="h-12 w-full rounded-2xl bg-[#006633] text-sm font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
        >
          Open Room #{roomId.slice(0, 6).toUpperCase()} Now
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </div>
    );
  }

  // 2. QUEUE RADAR / SCANNING VIEW
  if (status === "waiting" || status === "joining") {
    const filledCount = Math.max(1, Math.min(count, BATCH_SIZE));
    const isReady = filledCount >= BATCH_SIZE;

    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6">
        {/* Main Queue Radar Card */}
        <div className="glass-card relative flex w-full flex-col items-center overflow-hidden rounded-3xl p-8 text-center shadow-card-lg md:p-10 animate-in fade-in">
          {/* Top Banner Tag */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#006633]/20 bg-[#f0faf5] px-3.5 py-1 text-xs font-extrabold text-[#006633]">
            <Zap className="size-3.5 text-[#FDB913] fill-[#FDB913]" />
            <span>Vibe Radar Active</span>
          </div>

          {/* Pulsing indicator */}
          <div className="relative mb-5 flex size-24 items-center justify-center">
            {!isReady ? (
              <>
                <span className="absolute inset-0 rounded-full border-[3px] border-[#006633]/40 animate-pulse-ring" />
                <span className="absolute inset-2 rounded-full border-[2px] border-[#FDB913]/50 animate-pulse-ring" style={{ animationDelay: "400ms" }} />
              </>
            ) : null}
            <div
              className={cn(
                "relative flex size-20 items-center justify-center rounded-full shadow-cta transition-colors duration-500",
                isReady ? "bg-[#FDB913] text-[#006633]" : "bg-[#006633] text-[#FDB913]",
              )}
            >
              {isReady ? (
                <Check className="size-9 stroke-[3]" />
              ) : (
                <Play className="size-8 fill-[#FDB913] pl-1" />
              )}
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black tracking-tight text-[#006633]">
            {isReady ? "Room Ready! 🎉" : "Finding Freshies..."}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isReady
              ? "Entering your chat room now…"
              : "Matching you with 3 other FEU freshies based on campus vibes."}
          </p>

          {/* Gradient Progress Bar */}
          <div className="my-5 h-2.5 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(filledCount / BATCH_SIZE) * 100}%`,
                background: "linear-gradient(90deg, #006633 40%, #FDB913)",
              }}
            />
          </div>

          {/* 4 Queue Seats */}
          <div className="flex items-center justify-center gap-3">
            {Array.from({ length: BATCH_SIZE }, (_, idx) => {
              const filled = idx < filledCount;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex size-14 items-center justify-center rounded-2xl font-black text-sm transition-all duration-400",
                    filled
                      ? "border-2 border-[#FDB913] bg-[#006633] text-white shadow-md scale-100"
                      : "border-2 border-dashed border-[#d1d5db] bg-[#f3f4f6] text-[#9ca3af] scale-95",
                  )}
                >
                  {filled ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs">🔰</span>
                      <span className="text-[10px] font-extrabold text-[#FDB913]">Seat {idx + 1}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Waiting</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Badge */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#006633]/15 bg-[#f0faf5] px-4 py-1.5 text-xs font-extrabold text-[#006633]">
            <span className="size-2 rounded-full bg-[#16a34a] animate-pulse" />
            {filledCount} of {BATCH_SIZE} freshies joined
          </div>

          {/* Start Room Early Option when at least 3 freshies are waiting */}
          {filledCount >= 3 && !isReady ? (
            <div className="mt-4 flex w-full flex-col items-center gap-1.5 animate-in fade-in zoom-in-95">
              <Button
                type="button"
                onClick={async () => {
                  setStartingEarly(true);
                  try {
                    await startEarly();
                  } finally {
                    setStartingEarly(false);
                  }
                }}
                disabled={startingEarly}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#006633] via-[#004d26] to-[#b45309] text-xs font-black text-[#FDB913] shadow-cta transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="size-4 text-[#FDB913]" />
                <span>
                  {startingEarly
                    ? "Opening 3-person batch room…"
                    : `Start Chat with ${filledCount} Freshies Now ⚡`}
                </span>
              </Button>
              <p className="text-[10px] font-semibold text-muted-foreground">
                ✨ 3 freshies ready! You can start now or wait for the 4th freshie.
              </p>
            </div>
          ) : null}

          {/* Rotating Tip Banner */}
          {!isReady ? (
            <div className="relative mt-5 flex w-full flex-col gap-1 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-3.5 text-left text-xs text-muted-foreground animate-in fade-in">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006633]">
                Tamaraw Quick Fact
              </span>
              <p className="text-xs font-medium text-foreground transition-all duration-300">
                {ROTATING_TIPS[tipIndex]}
              </p>
            </div>
          ) : null}

          {/* Cancel queue button */}
          <button
            type="button"
            onClick={() => void leave()}
            className="mt-5 text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
          >
            Leave queue
          </button>
        </div>
      </div>
    );
  }

  // 3. HOME / IDLE HERO VIEW
  return (
    <div className="flex w-full flex-col gap-8">
      {/* Hero Match Card */}
      <section className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10 shadow-card-md">
        <div
          className="absolute -right-16 -top-16 size-64 rounded-full bg-[#006633]/5 blur-3xl pointer-events-none"
        />
        <div
          className="absolute -left-16 -bottom-16 size-64 rounded-full bg-[#FDB913]/10 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#006633]/20 bg-[#f0faf5] px-3 py-1 text-xs font-black uppercase text-[#006633]">
                <span className="size-2 rounded-full bg-[#16a34a] animate-pulse" />
                Live Matchmaker Active
              </span>
              <span className="rounded-full bg-[#FDB913]/20 px-2.5 py-1 text-xs font-bold text-[#b45309]">
                ⚡ ~15s Avg Match
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-[#006633] sm:text-3xl md:text-4xl">
              Find Your 4-Person Tamaraw Batch Room
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Instant 24-hour group chats with fellow FEU freshies matched by your campus lifestyle, study habits, and favorite spots.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => void join()}
                className="h-13 rounded-2xl bg-[#006633] px-8 text-sm font-extrabold text-[#FDB913] shadow-cta transition-all duration-300 hover:scale-[1.02] hover:bg-[#004d26]"
              >
                🎲 Enter Matchmaking Queue
                <ArrowRight className="ml-1.5 size-4" />
              </Button>

              <span className="text-xs font-semibold text-muted-foreground">
                Rooms self-destruct in 24h
              </span>
            </div>
          </div>

          <div className="flex size-24 sm:size-28 shrink-0 items-center justify-center rounded-3xl bg-[#006633] text-[#FDB913] shadow-cta">
            <MessageSquare className="size-12 sm:size-14 fill-[#FDB913]" />
          </div>
        </div>
      </section>

      {/* Live Stats Row */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-card flex flex-col items-center rounded-2xl p-4 text-center shadow-2xs hover:border-[#006633]/30 transition-all">
          <span className="text-2xl">💬</span>
          <span className="mt-1 text-xl font-black text-[#006633] tabular-nums">
            {stats?.activeRooms ?? 0}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">Active Batch Rooms</span>
        </div>

        <div className="glass-card flex flex-col items-center rounded-2xl p-4 text-center shadow-2xs hover:border-[#006633]/30 transition-all">
          <span className="text-2xl">🟢</span>
          <span className="mt-1 text-xl font-black text-[#006633] tabular-nums">
            {stats?.onlineFreshies ?? 1}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">Freshies Online</span>
        </div>

        <div className="glass-card flex flex-col items-center rounded-2xl p-4 text-center shadow-2xs hover:border-[#006633]/30 transition-all">
          <span className="text-2xl">🔥</span>
          <span className="mt-1 text-xl font-black text-[#006633] tabular-nums">
            {stats?.matchesToday ?? 0}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">Matches Today</span>
        </div>

        <div className="glass-card flex flex-col items-center rounded-2xl p-4 text-center shadow-2xs hover:border-[#006633]/30 transition-all">
          <span className="text-2xl">⏳</span>
          <span className="mt-1 text-xl font-black text-[#006633] tabular-nums">
            24h
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">Room Lifespan</span>
        </div>
      </section>

      {/* Quick Campus Shortcuts */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/groups"
          className="glass-card group flex items-center justify-between rounded-2xl p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-[#006633] hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#006633]/10 text-[#006633] group-hover:bg-[#006633] group-hover:text-[#FDB913] transition-colors">
              <BookOpen className="size-5" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Institutes &amp; Programs</span>
              <span className="text-[10px] text-muted-foreground">Explore 6 institutes</span>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:text-[#006633] transition-colors" />
        </Link>

        <Link
          href="/members"
          className="glass-card group flex items-center justify-between rounded-2xl p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-[#006633] hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#006633]/10 text-[#006633] group-hover:bg-[#006633] group-hover:text-[#FDB913] transition-colors">
              <Users className="size-5" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Met Freshies</span>
              <span className="text-[10px] text-muted-foreground">Your Tamaraw circle</span>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:text-[#006633] transition-colors" />
        </Link>

        <Link
          href="/settings"
          className="glass-card group flex items-center justify-between rounded-2xl p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-[#006633] hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#006633]/10 text-[#006633] group-hover:bg-[#006633] group-hover:text-[#FDB913] transition-colors">
              <GraduationCap className="size-5" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Profile &amp; Vibes</span>
              <span className="text-[10px] text-muted-foreground">Manage your identity</span>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:text-[#006633] transition-colors" />
        </Link>
      </section>
    </div>
  );
}
