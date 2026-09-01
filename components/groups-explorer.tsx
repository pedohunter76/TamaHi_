"use client";

import { BookOpen, ChevronDown, GraduationCap, Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { INSTITUTES } from "@/lib/profile/constants";
import { cn } from "@/lib/utils";

export function GroupsExplorer() {
  const [query, setQuery] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState<string | null>(null);

  const filteredInstitutes = INSTITUTES.map((inst) => {
    const matchesInst =
      inst.shortName.toLowerCase().includes(query.toLowerCase()) ||
      inst.fullName.toLowerCase().includes(query.toLowerCase());

    const matchingCourses = inst.courses.filter((c) =>
      c.toLowerCase().includes(query.toLowerCase()),
    );

    return {
      ...inst,
      visible: query ? matchesInst || matchingCourses.length > 0 : true,
      displayCourses: query && !matchesInst ? matchingCourses : inst.courses,
    };
  }).filter((inst) => inst.visible);

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search institute or course (e.g., IAS, Accountancy)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-auto rounded-xl bg-background/60 py-3 pl-10 pr-4 text-sm"
        />
      </div>

      {/* Grid of Institutes */}
      {filteredInstitutes.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No courses or institutes match &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredInstitutes.map((institute) => {
            const isExpanded = selectedInstitute === institute.shortName || Boolean(query);

            return (
              <article
                key={institute.shortName}
                className={cn(
                  "glass-card flex flex-col justify-between gap-4 rounded-2xl p-6 transition-all duration-300",
                  isExpanded ? "border-primary/40 shadow-md" : "hover:border-border",
                )}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">
                      {institute.shortName}
                    </span>
                    <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                      {institute.courses.length} courses
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold leading-snug text-foreground">
                      {institute.fullName}
                    </h2>
                  </div>

                  {/* Course list dropdown / preview */}
                  <div className="mt-1 flex flex-col gap-1.5 border-t border-border/50 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedInstitute(
                          selectedInstitute === institute.shortName
                            ? null
                            : institute.shortName,
                        )
                      }
                      className="flex items-center justify-between text-xs font-semibold text-primary transition-colors hover:underline"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5" />
                        {isExpanded ? "Hide degree programs" : "View degree programs"}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </button>

                    {isExpanded ? (
                      <ul className="mt-2 flex flex-col divide-y divide-border/30 rounded-xl bg-background/50 p-2 text-xs">
                        {institute.displayCourses.map((course) => (
                          <li
                            key={course}
                            className="flex items-center gap-2 py-1.5 px-1 text-muted-foreground"
                          >
                            <span className="size-1.5 shrink-0 rounded-full bg-primary/70" />
                            <span className="truncate">{course}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 border-t border-border/40 pt-3 text-[11px] font-medium text-muted-foreground">
                  <GraduationCap className="size-3.5 text-primary" />
                  Far Eastern University Manila
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
