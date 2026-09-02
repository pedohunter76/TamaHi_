"use client";

import {
  CheckCircle2,
  Circle,
  Compass,
  ListTodo,
  MapPin,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_FRESHIE_CHECKLIST,
  loadCompletedChecklistIds,
  saveCompletedChecklistIds,
} from "@/lib/campus/checklist";
import {
  FEU_CAMPUS_LANDMARKS,
  type CampusLandmark,
} from "@/lib/campus/landmarks";
import { FEU_CAMPUS_TIPS, type CampusTip } from "@/lib/campus/tips";
import { cn } from "@/lib/utils";

const TIP_CATEGORIES = [
  "All",
  "Buildings & Shortcuts",
  "Study & Wi-Fi Spots",
  "Printing & Supplies",
  "Dress Code & Guidelines",
  "Budget Eats",
] as const;

const LANDMARK_CATEGORIES = [
  "All",
  "Academic Building",
  "Campus Gate",
  "Student Hub",
  "Food & Tambayan",
] as const;

export function CampusTipsSheet({
  onShareTipToChat,
  isOpen,
  onClose,
}: {
  onShareTipToChat?: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"tips" | "landmarks" | "checklist">(
    "tips",
  );

  // Tips state
  const [selectedTipCategory, setSelectedTipCategory] = useState<string>("All");
  const [tipSearch, setTipSearch] = useState("");
  const [sharedTipId, setSharedTipId] = useState<string | null>(null);

  // Landmarks state
  const [selectedLandmarkCat, setSelectedLandmarkCat] = useState<string>("All");
  const [landmarkSearch, setLandmarkSearch] = useState("");

  // Checklist state
  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    loadCompletedChecklistIds(),
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered tips
  const filteredTips = useMemo(() => {
    let list = FEU_CAMPUS_TIPS;
    if (selectedTipCategory !== "All") {
      list = list.filter((t) => t.category === selectedTipCategory);
    }
    if (tipSearch.trim()) {
      const q = tipSearch.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.tip.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.tag.toLowerCase().includes(q) ||
          (t.location && t.location.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [selectedTipCategory, tipSearch]);

  // Filtered landmarks
  const filteredLandmarks = useMemo(() => {
    let list = FEU_CAMPUS_LANDMARKS;
    if (selectedLandmarkCat !== "All") {
      list = list.filter((lm) => lm.category === selectedLandmarkCat);
    }
    if (landmarkSearch.trim()) {
      const q = landmarkSearch.toLowerCase().trim();
      list = list.filter(
        (lm) =>
          lm.name.toLowerCase().includes(q) ||
          lm.code.toLowerCase().includes(q) ||
          lm.location.toLowerCase().includes(q) ||
          lm.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [selectedLandmarkCat, landmarkSearch]);

  function handleToggleChecklist(id: string) {
    const updated = completedIds.includes(id)
      ? completedIds.filter((item) => item !== id)
      : [...completedIds, id];
    setCompletedIds(updated);
    saveCompletedChecklistIds(updated);
  }

  function handleShareTip(tip: CampusTip) {
    if (!onShareTipToChat) return;
    const formatted = `💡 FEU Campus Tip: ${tip.title}\n📍 Location: ${tip.location || "Campus"}\n📌 "${tip.tip}"`;
    onShareTipToChat(formatted);
    setSharedTipId(tip.id);
    setTimeout(() => setSharedTipId(null), 2500);
  }

  function handleShareLandmark(lm: CampusLandmark) {
    if (!onShareTipToChat) return;
    const formatted = `🗺️ FEU Landmark: ${lm.name} [${lm.code}]\n📍 ${lm.location}\n📌 ${lm.description}`;
    onShareTipToChat(formatted);
    setSharedTipId(lm.id);
    setTimeout(() => setSharedTipId(null), 2500);
  }

  if (!isOpen) return null;

  const totalChecklist = DEFAULT_FRESHIE_CHECKLIST.length;
  const completedCount = completedIds.length;
  const progressPercent = Math.round((completedCount / totalChecklist) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="glass-card relative flex h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-card-lg animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#006633] text-[#FDB913] shadow-xs">
              <Compass className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-[#006633]">
                FEU Freshie Campus Compass
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Campus guide, building landmarks, and freshie survival checklist.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-[#f3f4f6] text-muted-foreground hover:bg-[#e5e7eb] hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-[#e5e7eb] bg-[#f9fafb] p-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all",
              activeTab === "tips"
                ? "bg-[#006633] text-[#FDB913] shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>💡 Tips &amp; Hacks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("landmarks")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all",
              activeTab === "landmarks"
                ? "bg-[#006633] text-[#FDB913] shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>🗺️ Campus Map</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all",
              activeTab === "checklist"
                ? "bg-[#006633] text-[#FDB913] shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ListTodo className="size-3.5" />
            <span>Checklist ({completedCount}/{totalChecklist})</span>
          </button>
        </div>

        {/* TAB 1: TIPS & HACKS */}
        {activeTab === "tips" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Search & Categories */}
            <div className="flex flex-col gap-2.5 border-b border-[#e5e7eb] bg-[#f9fafb] p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search shortcuts, study spots, printing..."
                  value={tipSearch}
                  onChange={(e) => setTipSearch(e.target.value)}
                  className="h-9 rounded-xl bg-white pl-9 text-xs"
                />
              </div>

              {/* Category Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {TIP_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedTipCategory(cat)}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all shrink-0",
                      selectedTipCategory === cat
                        ? "bg-[#006633] text-[#FDB913] shadow-xs"
                        : "bg-white text-muted-foreground border border-[#e5e7eb] hover:bg-[#f0faf5] hover:text-[#006633]",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredTips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Compass className="size-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">
                    No campus tips found for &quot;{tipSearch}&quot;
                  </p>
                </div>
              ) : (
                filteredTips.map((tip) => (
                  <article
                    key={tip.id}
                    className="flex flex-col gap-2 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-2xs hover:border-[#006633]/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-foreground">
                            {tip.title}
                          </h3>
                          <span className="rounded-md border border-[#006633]/20 bg-[#f0faf5] px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-[#006633]">
                            {tip.tag}
                          </span>
                        </div>
                        {tip.location ? (
                          <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <MapPin className="size-3 text-[#006633]" />
                            <span>{tip.location}</span>
                          </p>
                        ) : null}
                      </div>

                      {onShareTipToChat ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleShareTip(tip)}
                          className={cn(
                            "h-7 rounded-lg px-2.5 text-[11px] font-extrabold shrink-0 transition-all",
                            sharedTipId === tip.id
                              ? "bg-[#006633] text-[#FDB913]"
                              : "bg-[#f0faf5] text-[#006633] hover:bg-[#006633] hover:text-[#FDB913]",
                          )}
                        >
                          <Send className="size-3 mr-1" />
                          {sharedTipId === tip.id ? "Sent!" : "Share"}
                        </Button>
                      ) : null}
                    </div>

                    <p className="text-xs leading-relaxed text-foreground/90 bg-[#f9fafb] rounded-xl p-2.5 border border-[#f0f0f0]">
                      &quot;{tip.tip}&quot;
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LANDMARKS & MAP DIRECTORY */}
        {activeTab === "landmarks" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Search & Categories */}
            <div className="flex flex-col gap-2.5 border-b border-[#e5e7eb] bg-[#f9fafb] p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search buildings (NRH, Arts, Tech, Gate 1)..."
                  value={landmarkSearch}
                  onChange={(e) => setLandmarkSearch(e.target.value)}
                  className="h-9 rounded-xl bg-white pl-9 text-xs"
                />
              </div>

              {/* Category Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {LANDMARK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedLandmarkCat(cat)}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all shrink-0",
                      selectedLandmarkCat === cat
                        ? "bg-[#006633] text-[#FDB913] shadow-xs"
                        : "bg-white text-muted-foreground border border-[#e5e7eb] hover:bg-[#f0faf5] hover:text-[#006633]",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Landmarks List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredLandmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="size-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">
                    No landmarks found for &quot;{landmarkSearch}&quot;
                  </p>
                </div>
              ) : (
                filteredLandmarks.map((lm) => (
                  <article
                    key={lm.id}
                    className="flex flex-col gap-2 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-2xs hover:border-[#006633]/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-foreground">
                            {lm.name}
                          </h3>
                          <span className="rounded-md border border-[#006633]/20 bg-[#f0faf5] px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-[#006633]">
                            {lm.code}
                          </span>
                        </div>
                        <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <MapPin className="size-3 text-[#006633]" />
                          <span>{lm.location}</span>
                        </p>
                      </div>

                      {onShareTipToChat ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleShareLandmark(lm)}
                          className={cn(
                            "h-7 rounded-lg px-2.5 text-[11px] font-extrabold shrink-0 transition-all",
                            sharedTipId === lm.id
                              ? "bg-[#006633] text-[#FDB913]"
                              : "bg-[#f0faf5] text-[#006633] hover:bg-[#006633] hover:text-[#FDB913]",
                          )}
                        >
                          <Send className="size-3 mr-1" />
                          {sharedTipId === lm.id ? "Sent!" : "Share"}
                        </Button>
                      ) : null}
                    </div>

                    <p className="text-xs leading-relaxed text-foreground">
                      {lm.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {lm.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-[#f9fafb] px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-[#f0f0f0]"
                        >
                          • {h}
                        </span>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FRESHIE SURVIVAL CHECKLIST */}
        {activeTab === "checklist" && (
          <div className="flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
            {/* Progress Header */}
            <div className="flex flex-col gap-2 rounded-2xl border border-[#006633]/20 bg-[#f0faf5] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#FDB913]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#006633]">
                    Freshmen Onboarding Progress
                  </h3>
                </div>
                <span className="text-xs font-extrabold text-[#006633]">
                  {progressPercent}% Done ({completedCount}/{totalChecklist})
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-[#d0eee1]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, #006633, #FDB913)",
                  }}
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Check off items as you settle into your first semester in FEU Manila.
              </p>
            </div>

            {/* Checklist items */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {DEFAULT_FRESHIE_CHECKLIST.map((item) => {
                const isDone = completedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all",
                      isDone
                        ? "border-[#006633]/40 bg-[#f0faf5]/70"
                        : "border-[#e5e7eb] bg-white hover:border-[#006633]/30 hover:shadow-2xs",
                    )}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-[#006633]"
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-5 fill-[#006633] text-white" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" />
                      )}
                    </button>

                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <h4
                          className={cn(
                            "text-xs font-bold text-foreground",
                            isDone && "line-through text-muted-foreground",
                          )}
                        >
                          {item.title}
                        </h4>
                        <span className="rounded-sm bg-[#f9fafb] px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-muted-foreground border border-[#e5e7eb]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
