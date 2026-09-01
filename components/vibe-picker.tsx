"use client";

import { VIBE_QUESTIONS } from "@/lib/vibes/questions";
import { cn } from "@/lib/utils";

export function VibePicker({
  value,
  onChange,
  disabled,
}: {
  value: number[];
  onChange(next: number[]): void;
  disabled?: boolean;
}) {
  return (
    <div className="grid items-start gap-x-12 gap-y-10 md:grid-cols-2">
      {VIBE_QUESTIONS.map((question, questionIndex) => (
        <div
          key={question.id}
          role="group"
          aria-label={question.question}
          className="flex flex-col items-start gap-5"
        >
          <p className="text-left text-base font-bold leading-snug tracking-tight md:text-lg">
            {question.question}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-3.5">
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
                    "flex min-h-11 cursor-pointer items-center rounded-full border px-5 text-sm transition-all duration-200",
                    selected
                      ? "border-primary bg-primary/15 font-semibold text-primary shadow-sm"
                      : "border-border/80 bg-card hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
