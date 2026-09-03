import { ArrowRight, Compass, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { TopNav } from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button";

export function RoomLeftNotice({
  roomId,
  leftAtIso,
}: {
  roomId: string;
  leftAtIso?: string;
}) {
  const shortRoomId = roomId.slice(0, 6).toUpperCase();
  const formattedTime = leftAtIso
    ? new Date(leftAtIso).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mesh-bg relative min-h-dvh flex flex-col overflow-x-hidden">
      <TopNav />

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-20 text-center">
        <div className="glass-card flex flex-col items-center gap-5 rounded-3xl p-8 shadow-card-lg md:p-10 animate-in zoom-in-95">
          {/* Status Icon Emblem */}
          <div className="relative flex size-20 items-center justify-center rounded-3xl bg-[#f0faf5] text-[#006633] shadow-xs border border-[#006633]/20">
            <LogOut className="size-10 text-[#006633] stroke-[2.2]" />
            <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#FDB913] text-[#006633] shadow-xs">
              <ShieldAlert className="size-4" />
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-destructive">
              Room Departure Permanent
            </span>
            <h1 className="text-2xl font-black text-[#006633] md:text-3xl">
              You Have Left Room #{shortRoomId}
            </h1>
            <p className="text-xs md:text-sm leading-relaxed text-muted-foreground max-w-sm mx-auto">
              You exited this batch room{formattedTime ? ` at ${formattedTime}` : ""}.
              Freshies who leave cannot rejoin the same room, but the conversation is still active and continuing for your remaining batchmates.
            </p>
          </div>

          {/* Guidelines Box */}
          <div className="w-full rounded-2xl border border-[#006633]/15 bg-[#f0faf5]/60 p-4 text-left text-xs text-[#006633] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <Compass className="size-4 text-[#006633]" />
              <span>Tamaraw Honor Code:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Leaving resets your spot. You are welcome to head back to the Match Lobby whenever you like to queue up for a brand new 4-person batch room!
            </p>
          </div>

          {/* Action Button */}
          <Button
            asChild
            className="h-12 w-full rounded-2xl bg-[#006633] text-sm font-extrabold text-[#FDB913] shadow-cta hover:bg-[#004d26] transition-all"
          >
            <Link href="/lobby">
              Return to Match Lobby
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
