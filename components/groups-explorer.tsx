"use client";

import { ArrowRight, BookOpen, ChevronDown, GraduationCap, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INSTITUTES } from "@/lib/profile/constants";
import { cn } from "@/lib/utils";

const INSTITUTE_CHIPS = ["All", ...INSTITUTES.map((i) => i.shortName)];

export function GroupsExplorer() {
  const [query, setQuery] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<string>("All");

  const filteredInstitutes = INSTITUTES.map((inst) => {
    const matchesChip = activeChip === "All" || inst.shortName === activeChip;

    const matchesInst =
      inst.shortName.toLowerCase().includes(query.toLowerCase()) ||
      inst.fullName.toLowerCase().includes(query.toLowerCase()) ||
      (inst.tagline && inst.tagline.toLowerCase().includes(query.toLowerCase())) ||
      (inst.buildingLocation && inst.buildingLocation.toLowerCase().includes(query.toLowerCase()));

    const matchingCourses = inst.courses.filter((c) =>
      c.toLowerCase().includes(query.toLowerCase()),
    );

    const isVisible = matchesChip && (query ? matchesInst || matchingCourses.length > 0 : true);

    return {
      ...inst,
      visible: isVisible,
      displayCourses: query && !matchesInst ? matchingCourses : inst.courses,
    };
  }).filter((inst) => inst.visible);

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search institute, course, or building…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-xl bg-white pl-9.5 text-xs shadow-2xs"
          />
        </div>

        {/* Institute Quick Chips */}
        <div className="flex flex-wrap gap-1.5">
          {INSTITUTE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveChip(chip)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold transition-all",
                activeChip === chip
                  ? "bg-[#006633] text-[#FDB913] shadow-xs"
                  : "border border-[#e5e7eb] bg-white text-muted-foreground hover:bg-[#f3f4f6]",
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Institutes */}
      {filteredInstitutes.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
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
                  "glass-card flex flex-col justify-between gap-4 rounded-3xl p-6 transition-all duration-300 hover:border-[#006633]/40 hover:shadow-card-md",
                  isExpanded ? "border-[#006633]/40 shadow-card-sm" : "hover:border-border",
                )}
              >
                <div className="flex flex-col gap-3">
                  {/* Top Badge & Courses Count */}
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#006633] font-black text-[#FDB913] shadow-xs">
                      {institute.shortName}
                    </span>
                    <span className="rounded-full border border-[#006633]/20 bg-[#f0faf5] px-2.5 py-0.5 text-[11px] font-extrabold text-[#006633]">
                      {institute.courses.length} degree programs
                    </span>
                  </div>

                  {/* Full Name & Tagline */}
                  <div>
                    <h2 className="text-base font-bold leading-snug text-foreground">
                      {institute.fullName}
                    </h2>
                    {institute.tagline ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {institute.tagline}
                      </p>
                    ) : null}
                  </div>

                  {/* Campus Location Badge */}
                  {institute.buildingLocation ? (
                    <div className="flex items-center gap-1.5 rounded-xl bg-[#f9fafb] p-2 text-xs text-muted-foreground border border-[#f0f0f0]">
                      <MapPin className="size-3.5 shrink-0 text-[#006633]" />
                      <span className="truncate font-medium">{institute.buildingLocation}</span>
                    </div>
                  ) : null}

                  {/* Course list dropdown / preview */}
                  <div className="mt-1 flex flex-col gap-1.5 border-t border-[#e5e7eb]/70 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedInstitute(
                          selectedInstitute === institute.shortName
                            ? null
                            : institute.shortName,
                        )
                      }
                      className="flex items-center justify-between text-xs font-bold text-[#006633] transition-colors hover:underline"
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
                      <ul className="mt-2 flex flex-col divide-y divide-[#e5e7eb]/50 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-2.5 text-xs animate-in fade-in">
                        {institute.displayCourses.map((course) => (
                          <li
                            key={course}
                            className="flex items-center gap-2 py-1.5 px-1 text-foreground"
                          >
                            <span className="size-1.5 shrink-0 rounded-full bg-[#006633]" />
                            <span className="truncate text-xs font-medium">{course}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                {/* Footer with Lobby Link */}
                <div className="flex items-center justify-between border-t border-[#e5e7eb]/70 pt-3 text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="size-3.5 text-[#006633]" />
                    <span>FEU Manila</span>
                  </span>

                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 rounded-lg px-2 text-[11px] font-extrabold text-[#006633] hover:bg-[#f0faf5] hover:text-[#004d26]"
                  >
                    <Link href="/lobby">
                      <span>Match in Lobby</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
