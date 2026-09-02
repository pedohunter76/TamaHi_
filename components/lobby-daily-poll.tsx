"use client";

import { CheckCircle2, Sparkles, Vote } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type PollOption = {
  id: string;
  label: string;
  emoji: string;
  baseVotes: number;
};

const DAILY_POLL_KEY = "tamahi_lobby_daily_poll_v1";

const INITIAL_OPTIONS: PollOption[] = [
  { id: "opt-1", label: "Gastambide Food Alley & Silogan", emoji: "🥪", baseVotes: 38 },
  { id: "opt-2", label: "Morayta Iced Coffee Run", emoji: "☕", baseVotes: 44 },
  { id: "opt-3", label: "FEU Library 3F Quiet Pods", emoji: "📚", baseVotes: 29 },
  { id: "opt-4", label: "Uwi / Dorm na agad to rest", emoji: "🏠", baseVotes: 52 },
];

export function LobbyDailyPoll() {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(DAILY_POLL_KEY);
    } catch {
      return null;
    }
  });

  function handleVote(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(DAILY_POLL_KEY, id);
      } catch {
        // ignore
      }
    }
  }

  const hasVoted = Boolean(selectedId);
  const totalVotes = INITIAL_OPTIONS.reduce(
    (acc, opt) => acc + opt.baseVotes + (selectedId === opt.id ? 1 : 0),
    0,
  );

  return (
    <section className="glass-card flex flex-col gap-4 rounded-3xl p-6 shadow-card-sm md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#006633] text-[#FDB913]">
            <Vote className="size-4" />
          </span>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-[#006633]">
              Daily Tamaraw Pulse
            </h2>
            <p className="text-[11px] text-muted-foreground">
              What&apos;s your move after your last class today?
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 rounded-full border border-[#006633]/20 bg-[#f0faf5] px-2.5 py-0.5 text-[10px] font-extrabold text-[#006633]">
          <Sparkles className="size-3 text-[#FDB913]" />
          <span>{totalVotes} Freshie Votes</span>
        </span>
      </div>

      {/* Poll Options Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {INITIAL_OPTIONS.map((option) => {
          const isSelected = selectedId === option.id;
          const votes = option.baseVotes + (isSelected ? 1 : 0);
          const percentage = Math.round((votes / totalVotes) * 100);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              className={cn(
                "relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200",
                isSelected
                  ? "border-[#006633] bg-[#f0faf5] shadow-2xs scale-101"
                  : "border-[#e5e7eb] bg-white hover:border-[#006633]/30 hover:bg-[#f9fafb]",
              )}
            >
              {/* Background Percentage Bar when voted */}
              {hasVoted ? (
                <div
                  className="absolute inset-y-0 left-0 bg-[#006633]/10 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              ) : null}

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{option.emoji}</span>
                  <span className="text-xs font-bold text-foreground truncate">
                    {option.label}
                  </span>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="size-4 shrink-0 fill-[#006633] text-white" />
                ) : null}
              </div>

              {hasVoted ? (
                <div className="relative z-10 mt-2 flex items-center justify-between text-[10px] font-extrabold text-muted-foreground">
                  <span>{votes} freshies</span>
                  <span className="text-[#006633]">{percentage}%</span>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
