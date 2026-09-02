"use client";

import {
  Calendar,
  Compass,
  Megaphone,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { CampusTipsSheet } from "@/components/campus-tips-sheet";

export type BuzzEvent = {
  id: string;
  title: string;
  category: "Announcement" | "Campus Event" | "UAAP" | "Academic";
  date: string;
  description: string;
  badge: string;
  icon: "megaphone" | "calendar" | "trophy" | "users";
};

const FEU_BUZZ_EVENTS: BuzzEvent[] = [
  {
    id: "buzz-1",
    title: "Freshmen Welcome Walk & Tatak Tamaraw",
    category: "Campus Event",
    date: "A.Y. 2026 Opening Week",
    description:
      "Wear your green and gold! The official university orientation and campus march for all incoming IAS, IABF, ICN, IED, ITHM, and Tech freshies.",
    badge: "Must Attend",
    icon: "calendar",
  },
  {
    id: "buzz-2",
    title: "FEU Tamaraws UAAP Season Kickoff",
    category: "UAAP",
    date: "Coming Soon",
    description:
      "Cheer with the FEU Drummers and Tamaraw Pep Squad at the Mall of Asia Arena. Ticket discounts available for freshmen with valid IDs.",
    badge: "Be Brave",
    icon: "trophy",
  },
  {
    id: "buzz-3",
    title: "University Student Council (FEU-USG) Orgs Fair",
    category: "Announcement",
    date: "Next Week",
    description:
      "Explore over 40+ recognized academic, cultural, and special interest student organizations at the Pavilion Grandstand.",
    badge: "Orgs & Clubs",
    icon: "users",
  },
];

export function CampusBuzz() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <section className="glass-card flex flex-col gap-4 rounded-3xl p-6 shadow-card-sm md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#006633] text-[#FDB913]">
            <Megaphone className="size-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-[#006633]">
            Campus Buzz &amp; Events
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-[#f0faf5] px-3 py-1 text-xs font-black uppercase text-[#006633] transition-all hover:bg-[#e2f5ec]"
        >
          <Compass className="size-3.5 text-[#006633]" />
          <span>Campus Compass 🧭</span>
        </button>
      </div>

      <div className="flex flex-col divide-y divide-[#e5e7eb]">
        {FEU_BUZZ_EVENTS.map((item) => (
          <article key={item.id} className="flex items-start gap-3.5 py-4">
            <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#006633]/10 text-[#006633]">
              {item.icon === "calendar" ? (
                <Calendar className="size-5" />
              ) : item.icon === "trophy" ? (
                <Trophy className="size-5 text-[#FDB913]" />
              ) : (
                <Users className="size-5" />
              )}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <span className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-[#006633]">
                  {item.badge}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  · {item.date}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <CampusTipsSheet
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </section>
  );
}
