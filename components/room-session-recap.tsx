"use client";

import { ArrowRight, Download, PartyPopper } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getInstituteShortName } from "@/lib/profile/constants";
import type { RoomParticipant } from "@/components/room-chat";

export function RoomSessionRecap({
  roster,
  onExportTranscript,
}: {
  roster: RoomParticipant[];
  roomId?: string;
  onExportTranscript?: () => void;
}) {
  return (
    <div className="glass-card flex flex-col gap-5 rounded-3xl border-2 border-[#006633]/25 bg-white p-6 shadow-card-md animate-in fade-in zoom-in-95 text-center">
      {/* Top Banner Icon */}
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#006633] text-[#FDB913] shadow-cta">
        <PartyPopper className="size-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-[#006633]">
          Batch Session Complete! 🎉
        </h2>
        <p className="max-w-md mx-auto text-xs leading-relaxed text-muted-foreground">
          This 1-hour room has safely concluded. All messages have self-destructed,
          but your connections are saved in your Tamaraw circle!
        </p>
      </div>

      {/* Roster of Tamaraws Met */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-3 text-left">
        <p className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-[#006633]">
          Tamaraws Met in this Room ({roster.length})
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {roster.map((member) => {
            const instShort = getInstituteShortName(member.institute);
            return (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-2.5 rounded-xl border border-[#e5e7eb] bg-white p-2.5 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#006633] text-xs font-bold text-white">
                    {member.nickname.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-xs font-bold text-foreground">
                        {member.nickname}
                      </p>
                      {instShort ? (
                        <span className="shrink-0 text-[9px] font-extrabold text-[#006633]">
                          [{instShort}]
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {member.course || "FEU Freshie"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/members"
                  className="shrink-0 rounded-lg bg-[#f0faf5] px-2 py-1 text-[10px] font-bold text-[#006633] hover:bg-[#e2f5ec]"
                >
                  View Profile
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {onExportTranscript ? (
          <Button
            type="button"
            variant="outline"
            onClick={onExportTranscript}
            className="h-12 w-full sm:w-auto rounded-xl border-[#006633]/30 px-5 text-xs font-extrabold text-[#006633] hover:bg-[#f0faf5]"
          >
            <Download className="mr-1.5 size-4" />
            Save Batch Transcript
          </Button>
        ) : null}

        <Button
          asChild
          className="h-12 w-full sm:w-auto rounded-xl bg-[#006633] px-6 text-sm font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26]"
        >
          <Link href="/lobby">
            🎲 Find Next Batch in Lobby
            <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 w-full sm:w-auto rounded-xl px-5 text-xs font-bold">
          <Link href="/members">
            View My Met Freshies
          </Link>
        </Button>
      </div>
    </div>
  );
}
