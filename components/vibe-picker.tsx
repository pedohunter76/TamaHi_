"use client";

import { Check, Sparkles } from "lucide-react";

import { VIBE_QUESTIONS } from "@/lib/vibes/questions";
import { cn } from "@/lib/utils";

const QUESTION_META = [
  { code: "Q1", tag: "☕ Vacant Spot", label: "Campus Tambayan" },
  { code: "Q2", tag: "⏱️ Class Gap", label: "2-Hour Wait Move" },
  { code: "Q3", tag: "🥪 Food Trip", label: "After-Class Eats" },
  { code: "Q4", tag: "🚪 Free Cut", label: "Absent Prof Move" },
  { code: "Q5", tag: "🌙 Uwian Move", label: "Last Class Dismissal" },
];

export function VibePicker({
  value,
  onChange,
  disabled,
}: {
  value: number[];
  onChange(next: number[]): void;
  disabled?: boolean;
}) {
  const answeredCount = value.filter((v) => v >= 0).length;
  const totalCount = VIBE_QUESTIONS.length;
  const progressPercent = Math.round((answeredCount / totalCount) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Vibe Progress Header */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[#006633]/20 bg-[#f0faf5] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-[#FDB913]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#006633]">
              Vibe Compatibility Meter
            </span>
          </div>
          <span className="text-xs font-extrabold text-[#006633]">
            {answeredCount} of {totalCount} answered ({progressPercent}%)
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
      </div>

      {/* Questions Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {VIBE_QUESTIONS.map((question, questionIndex) => {
          const meta = QUESTION_META[questionIndex] || {
            code: `Q${questionIndex + 1}`,
            tag: "Campus Vibe",
          };
          const isAnswered = value[questionIndex] >= 0;

          return (
            <div
              key={question.id}
              role="group"
              aria-label={question.question}
              className={cn(
                "flex flex-col justify-between gap-3.5 rounded-2xl border p-4.5 transition-all text-left",
                isAnswered
                  ? "border-[#006633]/30 bg-white shadow-2xs"
                  : "border-[#e5e7eb] bg-white hover:border-[#006633]/20",
              )}
            >
              {/* Question Header */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#006633] text-[10px] font-black text-[#FDB913]">
                    {meta.code}
                  </span>
                  <span className="rounded-md border border-[#006633]/20 bg-[#f0faf5] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#006633]">
                    {meta.tag}
                  </span>
                </div>
                <p className="text-sm font-bold leading-snug text-foreground">
                  {question.question}
                </p>
              </div>

              {/* Options Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {question.options.map((option, optionIndex) => {
                  const selected = value[questionIndex] === optionIndex;

                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        const next = [...value];
                        next[questionIndex] = optionIndex;
                        onChange(next);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200",
                        selected
                          ? "border-[#006633] bg-[#006633] font-bold text-[#FDB913] shadow-xs scale-102"
                          : "border-[#e5e7eb] bg-[#f9fafb] text-foreground hover:border-[#006633]/40 hover:bg-[#f0faf5] hover:text-[#006633] active:scale-97",
                      )}
                    >
                      {selected ? <Check className="size-3 text-[#FDB913]" /> : null}
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
