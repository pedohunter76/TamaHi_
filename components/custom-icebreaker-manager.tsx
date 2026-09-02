"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_ICEBREAKER_CATEGORIES,
  deleteCustomIcebreaker,
  loadSavedCustomIcebreakers,
  saveCustomIcebreaker,
  type CustomIcebreaker,
} from "@/lib/chat/icebreakers";
import { cn } from "@/lib/utils";

export function CustomIcebreakerManager() {
  const [items, setItems] = useState<CustomIcebreaker[]>(() =>
    loadSavedCustomIcebreakers(),
  );
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Casual");
  const [selectedFilter, setSelectedFilter] = useState("All");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const created = saveCustomIcebreaker(text, category);
    setItems((prev) => [created, ...prev]);
    setText("");
  }

  function handleDelete(id: string) {
    const updated = deleteCustomIcebreaker(id);
    setItems(updated);
  }

  const categories = Array.from(
    new Set(["All", ...items.map((i) => i.category)]),
  );

  const filteredItems =
    selectedFilter === "All"
      ? items
      : items.filter((i) => i.category === selectedFilter);

  return (
    <div className="flex flex-col gap-4">
      {/* Creation Form */}
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4 shadow-2xs"
      >
        <Input
          placeholder="e.g., Anong pinaka-exciting org event na nasalihan mo?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-10 rounded-xl bg-white text-sm"
          maxLength={150}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Category:
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-bold text-foreground"
            >
              {DEFAULT_ICEBREAKER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={!text.trim()}
            className="h-9 rounded-xl bg-[#006633] px-4 text-xs font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
          >
            <Plus className="size-3.5" />
            Add Icebreaker
          </Button>
        </div>
      </form>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedFilter(cat)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition-all",
              selectedFilter === cat
                ? "bg-[#006633] text-[#FDB913] shadow-xs"
                : "bg-[#f3f4f6] text-muted-foreground hover:bg-[#e5e7eb]",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List of Custom Icebreakers */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e5e7eb] p-6 text-center text-xs text-muted-foreground">
          No custom icebreakers yet in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-3.5 shadow-card-sm transition-all hover:border-[#006633]/30"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="w-fit rounded-full bg-[#f0faf5] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#006633]">
                  {item.category}
                </span>
                <p className="text-xs font-medium leading-relaxed text-foreground break-words">
                  {item.text}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                title="Delete prompt"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
