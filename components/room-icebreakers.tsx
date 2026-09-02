"use client";

import {
  ChevronDown,
  Dices,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_ICEBREAKER_CATEGORIES,
  DIRECT_CAMPUS_ICEBREAKERS,
  FEU_CAMPUS_HOT_TAKES,
  FEU_WOULD_YOU_RATHER,
  deleteCustomIcebreaker,
  loadSavedCustomIcebreakers,
  saveCustomIcebreaker,
  type CustomIcebreaker,
} from "@/lib/chat/icebreakers";
import { cn } from "@/lib/utils";

export function RoomIcebreakers({
  onSendIcebreaker,
  disabled,
}: {
  onSendIcebreaker: (content: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"direct" | "wyr" | "hottakes" | "custom">("direct");
  const [directIndex, setDirectIndex] = useState(0);
  const [wyrIndex, setWyrIndex] = useState(0);
  const [hotTakeIndex, setHotTakeIndex] = useState(0);

  // Custom prompts state
  const [customList, setCustomList] = useState<CustomIcebreaker[]>(() =>
    loadSavedCustomIcebreakers(),
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState("Casual");
  const [showAddForm, setShowAddForm] = useState(false);

  function handleShuffle() {
    if (activeTab === "direct") {
      setDirectIndex((prev) => (prev + 1) % DIRECT_CAMPUS_ICEBREAKERS.length);
    } else if (activeTab === "wyr") {
      setWyrIndex((prev) => (prev + 1) % FEU_WOULD_YOU_RATHER.length);
    } else if (activeTab === "hottakes") {
      setHotTakeIndex((prev) => (prev + 1) % FEU_CAMPUS_HOT_TAKES.length);
    }
  }

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;

    const created = saveCustomIcebreaker(newText, newCategory);
    setCustomList((prev) => [created, ...prev]);
    setNewText("");
    setShowAddForm(false);
  }

  function handleDeleteCustom(id: string) {
    const updated = deleteCustomIcebreaker(id);
    setCustomList(updated);
  }

  const currentDirectPrompt = DIRECT_CAMPUS_ICEBREAKERS[directIndex];
  const currentWyrPrompt = FEU_WOULD_YOU_RATHER[wyrIndex];
  const currentHotTakePrompt = FEU_CAMPUS_HOT_TAKES[hotTakeIndex];

  const categories = Array.from(
    new Set(["All", ...customList.map((c) => c.category)]),
  );

  const filteredCustomList =
    selectedCategory === "All"
      ? customList
      : customList.filter((c) => c.category === selectedCategory);

  if (disabled) return null;

  return (
    <div className="relative flex flex-col gap-2">
      {/* Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
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
          <Sparkles className="size-3.5" />
          <span>Campus Icebreakers</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen ? (
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("direct")}
              className={cn(
                "rounded-lg px-2 py-0.5 transition-colors",
                activeTab === "direct"
                  ? "bg-[#006633] text-[#FDB913] font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Freshie Prompts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wyr")}
              className={cn(
                "rounded-lg px-2 py-0.5 transition-colors",
                activeTab === "wyr"
                  ? "bg-[#006633] text-[#FDB913] font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Would You Rather?
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hottakes")}
              className={cn(
                "rounded-lg px-2 py-0.5 transition-colors",
                activeTab === "hottakes"
                  ? "bg-[#006633] text-[#FDB913] font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Hot Takes 🔥
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={cn(
                "rounded-lg px-2 py-0.5 transition-colors",
                activeTab === "custom"
                  ? "bg-[#006633] text-[#FDB913] font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              My Custom ({customList.length})
            </button>
          </div>
        ) : null}
      </div>

      {/* Expanded Icebreaker Panel */}
      {isOpen ? (
        <div className="glass-card flex flex-col gap-3 rounded-2xl border-[1.5px] border-[#006633]/25 bg-white p-3.5 shadow-card-sm animate-in fade-in zoom-in-98 duration-150">
          {/* 1. DIRECT PROMPTS */}
          {activeTab === "direct" ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#006633] text-[11px] font-black text-[#FDB913]">
                    ?
                  </span>
                  <p className="text-sm font-medium leading-snug text-foreground">
                    &ldquo;{currentDirectPrompt}&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="flex items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-[#006633] hover:text-[#006633]"
                >
                  <Dices className="size-4 text-[#006633]" />
                  Shuffle Prompt
                </button>

                <Button
                  type="button"
                  onClick={() => onSendIcebreaker(currentDirectPrompt)}
                  className="h-9 rounded-xl bg-[#006633] px-4 text-xs font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
                >
                  <Send className="size-3.5" />
                  Send to Chat
                </Button>
              </div>
            </div>
          ) : activeTab === "wyr" ? (
            /* 2. WOULD YOU RATHER */
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#006633] text-[11px] font-black text-[#FDB913]">
                    🤔
                  </span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006633]">
                      FEU Dilemma
                    </span>
                    <p className="text-sm font-semibold leading-snug text-foreground mt-0.5">
                      {currentWyrPrompt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="flex items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-[#006633] hover:text-[#006633]"
                >
                  <Dices className="size-4 text-[#006633]" />
                  Next Dilemma
                </button>

                <Button
                  type="button"
                  onClick={() => onSendIcebreaker(`🤔 ${currentWyrPrompt}`)}
                  className="h-9 rounded-xl bg-[#006633] px-4 text-xs font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
                >
                  <Send className="size-3.5" />
                  Ask Batch
                </Button>
              </div>
            </div>
          ) : activeTab === "hottakes" ? (
            /* 3. HOT TAKES */
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#006633] text-[11px] font-black text-[#FDB913]">
                    🔥
                  </span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006633]">
                      Campus Debate
                    </span>
                    <p className="text-sm font-semibold leading-snug text-foreground mt-0.5">
                      {currentHotTakePrompt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="flex items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-[#006633] hover:text-[#006633]"
                >
                  <Dices className="size-4 text-[#006633]" />
                  Next Hot Take
                </button>

                <Button
                  type="button"
                  onClick={() => onSendIcebreaker(`🔥 ${currentHotTakePrompt}`)}
                  className="h-9 rounded-xl bg-[#006633] px-4 text-xs font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
                >
                  <Send className="size-3.5" />
                  Drop Hot Take
                </Button>
              </div>
            </div>
          ) : (
            /* 2. MY CUSTOM ICEBREAKERS (Categorized) */
            <div className="flex flex-col gap-3">
              {/* Category Pills for Custom Icebreakers */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors",
                        selectedCategory === cat
                          ? "bg-[#006633] text-[#FDB913]"
                          : "bg-[#f3f4f6] text-muted-foreground hover:bg-[#e5e7eb]",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#006633]/30 bg-[#f0faf5] px-2 py-1 text-[11px] font-bold text-[#006633] hover:bg-[#e2f5ec]"
                >
                  <Plus className="size-3" />
                  Add Custom
                </button>
              </div>

              {/* Add Custom Form */}
              {showAddForm ? (
                <form
                  onSubmit={handleAddCustom}
                  className="flex flex-col gap-2 rounded-xl border border-[#006633]/20 bg-[#f0faf5] p-2.5"
                >
                  <Input
                    placeholder="Type your custom icebreaker question..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="h-8 rounded-lg bg-white text-xs"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="rounded-lg border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-semibold text-foreground"
                    >
                      {DEFAULT_ICEBREAKER_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:underline"
                      >
                        Cancel
                      </button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newText.trim()}
                        className="h-7 rounded-lg bg-[#006633] px-3 text-xs font-bold text-[#FDB913]"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </form>
              ) : null}

              {/* Custom Prompts List */}
              {filteredCustomList.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  No custom icebreakers in this category yet.
                </p>
              ) : (
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                  {filteredCustomList.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-2.5 transition-colors hover:border-[#006633]/40"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="w-fit rounded-sm bg-[#f0faf5] px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-[#006633]">
                          {item.category}
                        </span>
                        <p className="truncate text-xs font-medium text-foreground">
                          {item.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(item.id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onSendIcebreaker(item.text)}
                          className="h-7 rounded-lg bg-[#006633] px-2.5 text-[11px] font-bold text-[#FDB913]"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
