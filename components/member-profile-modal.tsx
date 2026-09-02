"use client";

import { ExternalLink, GraduationCap, Hand, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getInstituteShortName } from "@/lib/profile/constants";
import {
  getFacebookUrl,
  getInstagramUrl,
  type UserSocials,
} from "@/lib/profile/socials";
import { cn } from "@/lib/utils";

export type MemberModalData = {
  id: string;
  nickname: string;
  institute: string | null;
  course: string | null;
  vibes?: number[] | null;
  socials?: UserSocials | null;
  currentUserVibes?: number[] | null;
};

export function MemberProfileModal({
  member,
  currentUserVibes,
  onClose,
}: {
  member: MemberModalData | null;
  currentUserVibes?: number[] | null;
  onClose: () => void;
}) {
  const [waved, setWaved] = useState(false);

  useEffect(() => {
    if (!member) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [member, onClose]);

  if (!member) return null;

  const initial = member.nickname.slice(0, 1).toUpperCase();
  const instShort = getInstituteShortName(member.institute);

  // Compute vibe compatibility if vibes exist
  const theirVibes = member.vibes ?? null;
  const myVibes = currentUserVibes ?? member.currentUserVibes ?? null;

  let vibeScore: number | null = null;
  let matchingCount = 0;

  if (theirVibes && myVibes && theirVibes.length === 5 && myVibes.length === 5) {
    for (let i = 0; i < 5; i++) {
      if (theirVibes[i] >= 0 && theirVibes[i] === myVibes[i]) {
        matchingCount++;
      }
    }
    // Baseline minimum 40% compatibility if in same room, up to 100%
    vibeScore = Math.max(40, Math.round((matchingCount / 5) * 100));
  } else {
    // Standard friendly compatibility estimate
    vibeScore = 80;
  }

  const hasSocials = Boolean(
    member.socials?.instagram || member.socials?.facebook,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="glass-card relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl shadow-card-lg animate-in zoom-in-95">
        {/* Top banner */}
        <div
          className="h-20 w-full"
          style={{
            background: "linear-gradient(135deg, #006633 60%, #FDB913)",
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md transition-colors hover:bg-black/40"
        >
          <X className="size-4" />
        </button>

        {/* Content */}
        <div className="relative flex flex-col px-6 pb-6 pt-0">
          {/* Avatar & Header */}
          <div className="flex items-end justify-between">
            <div className="-mt-10 flex size-18 items-center justify-center rounded-full border-4 border-white bg-[#006633] text-xl font-black text-white shadow-card-md">
              {initial}
            </div>

            {vibeScore !== null ? (
              <div className="flex items-center gap-1 rounded-full border border-[#006633]/20 bg-[#f0faf5] px-3 py-1 text-xs font-extrabold text-[#006633]">
                <Sparkles className="size-3.5 text-[#FDB913]" />
                {vibeScore}% Vibe Match
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-foreground">
                {member.nickname}
              </h2>
              {instShort ? (
                <span className="rounded-md border border-[#e5e7eb] bg-[#f0faf5] px-2 py-0.5 text-[10px] font-black uppercase text-[#006633]">
                  {instShort}
                </span>
              ) : null}
            </div>

            {member.course ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <GraduationCap className="size-4 text-[#006633]" />
                <span>{member.course}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">FEU Freshie</p>
            )}
          </div>

          {/* Social Handles (Direct Redirection on Click) */}
          {hasSocials ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {member.socials?.instagram ? (
                <a
                  href={getInstagramUrl(member.socials.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-[#e1306c] hover:bg-[#fff5f8] hover:text-[#e1306c]"
                  title="Open Instagram Profile"
                >
                  <span>📷 @{member.socials.instagram.replace(/^@/, "")}</span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ) : null}
              {member.socials?.facebook ? (
                <a
                  href={getFacebookUrl(member.socials.facebook)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-[#1877f2] hover:bg-[#f0f6ff] hover:text-[#1877f2]"
                  title="Open Facebook Profile"
                >
                  <span>🌐 Facebook</span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ) : null}
            </div>
          ) : null}

          {/* Vibe Compatibility Bar */}
          {vibeScore !== null ? (
            <div className="mt-4 flex flex-col gap-1.5 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-3.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#006633]">Campus Vibe Compatibility</span>
                <span className="text-foreground">{vibeScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${vibeScore}%`,
                    background: "linear-gradient(90deg, #006633, #FDB913)",
                  }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Matched based on campus lifestyle, study habits, and university vibes.
              </p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setWaved(true)}
              disabled={waved}
              className={cn(
                "flex-1 h-11 rounded-xl text-xs font-extrabold transition-all",
                waved
                  ? "bg-[#f0faf5] text-[#006633] border border-[#006633]/30"
                  : "bg-[#006633] text-[#FDB913] shadow-cta hover:bg-[#004d26]",
              )}
            >
              <Hand className="size-4" />
              {waved ? "Wave Sent! 👋" : "Send Tamaraw Wave 👋"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 rounded-xl px-5 text-xs font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
