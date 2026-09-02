"use client";

import { BarChart3, ChevronDown, Plus, Send, Trash2, Vote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type PollData = {
  id: string;
  question: string;
  options: string[];
  votes: Record<number, number>; // optionIndex -> count
  totalVotes: number;
};

const PRESET_FEU_POLLS: Omit<PollData, "id" | "votes" | "totalVotes">[] = [
  {
    question: "Saan pinakamasarap kumain around FEU / Morayta?",
    options: ["FEU Canteen", "Tayuman Street", "Hepa Lane", "Fast Food sa Morayta"],
  },
  {
    question: "Ano pinaka-preferred class schedule mo?",
    options: ["7:30 AM Morning Birds", "1:30 PM Afternoon Chill", "5:00 PM Night Owls"],
  },
  {
    question: "Best tambayan & study spot inside FEU Manila?",
    options: ["FEU Main Library", "Pavilion Grandstand", "Arts Building Lobby", "University Mall"],
  },
  {
    question: "What's your plan after 5:00 PM classes?",
    options: ["Deretso Uwi / Dorm", "Gaming with Blockmates", "Org Work & Tambay", "Study sa Coffee Shop"],
  },
];

export function RoomPoll({
  roomId,
  onSendPoll,
  disabled,
}: {
  roomId?: string;
  onSendPoll: (pollText: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePoll, setActivePoll] = useState<PollData>(() => ({
    id: "preset-0",
    question: PRESET_FEU_POLLS[0].question,
    options: PRESET_FEU_POLLS[0].options,
    votes: { 0: 1, 1: 2, 2: 0, 3: 1 },
    totalVotes: 4,
  }));

  const activePollRef = useRef(activePoll);
  useEffect(() => {
    activePollRef.current = activePoll;
  }, [activePoll]);

  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customOptions, setCustomOptions] = useState<string[]>([
    "Option 1",
    "Option 2",
  ]);

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Sync poll state across tabs in the room via Supabase Realtime Broadcast
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    const channel = supabase.channel(`polls:${roomId}`);

    channel
      .on("broadcast", { event: "poll_sync" }, ({ payload }) => {
        const nextPoll = payload?.poll as PollData | undefined;
        if (nextPoll?.question && Array.isArray(nextPoll?.options)) {
          setActivePoll(nextPoll);
        }
      })
      .on("broadcast", { event: "request_poll_sync" }, () => {
        if (activePollRef.current) {
          void channel.send({
            type: "broadcast",
            event: "poll_sync",
            payload: { poll: activePollRef.current },
          });
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.send({
            type: "broadcast",
            event: "request_poll_sync",
            payload: {},
          });
        }
      });

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  if (disabled) return null;

  function handleVote(index: number) {
    if (votedIndex === index) return;

    const newVotes = { ...activePoll.votes };
    if (votedIndex !== null && newVotes[votedIndex] > 0) {
      newVotes[votedIndex] -= 1;
    }
    newVotes[index] = (newVotes[index] || 0) + 1;
    const total = Object.values(newVotes).reduce((a, b) => a + b, 0);

    const nextPoll: PollData = {
      ...activePoll,
      votes: newVotes,
      totalVotes: total,
    };

    setActivePoll(nextPoll);
    setVotedIndex(index);

    if (channelRef.current) {
      void channelRef.current.send({
        type: "broadcast",
        event: "poll_sync",
        payload: { poll: nextPoll },
      });
    }
  }

  function handleSelectPreset(index: number) {
    const preset = PRESET_FEU_POLLS[index];
    const nextPoll: PollData = {
      id: `preset-${index}`,
      question: preset.question,
      options: preset.options,
      votes: {},
      totalVotes: 0,
    };
    setActivePoll(nextPoll);
    setVotedIndex(null);
    setIsCustomMode(false);

    if (channelRef.current) {
      void channelRef.current.send({
        type: "broadcast",
        event: "poll_sync",
        payload: { poll: nextPoll },
      });
    }
  }

  function handleAddOption() {
    if (customOptions.length < 4) {
      setCustomOptions([...customOptions, `Option ${customOptions.length + 1}`]);
    }
  }

  function handleRemoveOption(idx: number) {
    if (customOptions.length > 2) {
      setCustomOptions(customOptions.filter((_, i) => i !== idx));
    }
  }

  function handleCreateCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customQuestion.trim() || customOptions.some((o) => !o.trim())) return;

    setActivePoll({
      id: `custom-${Date.now()}`,
      question: customQuestion.trim(),
      options: customOptions.map((o) => o.trim()),
      votes: {},
      totalVotes: 0,
    });
    setVotedIndex(null);
    setIsCustomMode(false);
  }

  function handleSendPollToChat() {
    const formatted = `📊 [CAMPUS POLL] ${activePoll.question}\n${activePoll.options.map((opt, i) => `${i + 1}️⃣ ${opt}`).join("\n")}`;
    onSendPoll(formatted);
  }

  return (
    <div className="relative flex flex-col gap-2">
      {/* Trigger Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all",
            isOpen
              ? "bg-[#006633] text-[#FDB913] shadow-xs"
              : "bg-[#f0faf5] text-[#006633] hover:bg-[#e2f5ec]",
          )}
        >
          <BarChart3 className="size-3.5" />
          <span>Room Polls</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-[11px] font-bold text-[#006633] hover:underline"
            >
              {isCustomMode ? "Browse Presets" : "+ Create Custom Poll"}
            </button>
          </div>
        ) : null}
      </div>

      {/* Expanded Poll Widget */}
      {isOpen ? (
        <div className="glass-card flex flex-col gap-3.5 rounded-2xl border-[1.5px] border-[#006633]/25 bg-white p-4 shadow-card-sm animate-in fade-in zoom-in-98 duration-150">
          {isCustomMode ? (
            /* Custom Poll Creator */
            <form onSubmit={handleCreateCustom} className="flex flex-col gap-3">
              <p className="text-xs font-black uppercase tracking-wider text-[#006633]">
                Create a 4-Person Room Poll
              </p>
              <Input
                placeholder="Ask a campus question (e.g. Which building has best Wi-Fi?)"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                className="h-9 rounded-xl bg-white text-xs font-medium"
                maxLength={100}
                autoFocus
              />

              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-muted-foreground">
                  Options (2 to 4):
                </span>
                {customOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f0faf5] text-[10px] font-black text-[#006633]">
                      {idx + 1}
                    </span>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const next = [...customOptions];
                        next[idx] = e.target.value;
                        setCustomOptions(next);
                      }}
                      className="h-8 rounded-lg bg-white text-xs"
                      maxLength={40}
                    />
                    {customOptions.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))}

                {customOptions.length < 4 ? (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#006633] hover:bg-[#f0faf5]"
                  >
                    <Plus className="size-3" />
                    Add Option
                  </button>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={
                    !customQuestion.trim() ||
                    customOptions.some((o) => !o.trim())
                  }
                  className="h-8 rounded-xl bg-[#006633] px-4 text-xs font-extrabold text-[#FDB913] hover:bg-[#004d26]"
                >
                  Save Poll
                </Button>
              </div>
            </form>
          ) : (
            /* Active Poll Display & Voting */
            <div className="flex flex-col gap-3">
              {/* Presets Row */}
              <div className="flex flex-wrap gap-1 border-b border-[#e5e7eb] pb-2.5">
                {PRESET_FEU_POLLS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPreset(i)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all",
                      activePoll.question === p.question
                        ? "bg-[#006633] text-[#FDB913] shadow-2xs"
                        : "bg-[#f3f4f6] text-muted-foreground hover:bg-[#e5e7eb]",
                    )}
                  >
                    Topic #{i + 1}
                  </button>
                ))}
              </div>

              {/* Question */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Vote className="size-4 text-[#006633]" />
                  <p className="text-xs font-black text-foreground">
                    {activePoll.question}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                  {activePoll.totalVotes} votes
                </span>
              </div>

              {/* Voting Options & Result Bars */}
              <div className="flex flex-col gap-2">
                {activePoll.options.map((option, idx) => {
                  const count = activePoll.votes[idx] || 0;
                  const pct =
                    activePoll.totalVotes > 0
                      ? Math.round((count / activePoll.totalVotes) * 100)
                      : 0;
                  const isVoted = votedIndex === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleVote(idx)}
                      className={cn(
                        "relative flex w-full flex-col overflow-hidden rounded-xl border p-2.5 text-left transition-all",
                        isVoted
                          ? "border-[#006633] bg-[#f0faf5]"
                          : "border-[#e5e7eb] bg-white hover:border-[#006633]/40",
                      )}
                    >
                      {/* Percentage background fill bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-[#006633]/10 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
                        <span
                          className={cn(
                            "font-bold",
                            isVoted ? "text-[#006633]" : "text-foreground",
                          )}
                        >
                          {option}
                        </span>
                        <span className="font-extrabold text-[#006633] tabular-nums">
                          {pct}% ({count})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-muted-foreground">
                  {votedIndex !== null
                    ? "✓ You voted"
                    : "Tap an option above to vote"}
                </p>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendPollToChat}
                  className="h-8 rounded-xl bg-[#006633] px-3 text-xs font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
                >
                  <Send className="size-3" />
                  Post to Room
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
