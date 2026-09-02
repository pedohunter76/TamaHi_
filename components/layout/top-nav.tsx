"use client";

import { Bell, Compass, Home, MessageSquare, User, Users, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { isSoundMuted, playMessagePop, setSoundMuted } from "@/lib/sound";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/lobby", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Compass },
  { href: "/members", label: "Members", icon: Users },
  { href: "/settings", label: "Profile", icon: User },
];

export function TopNav() {
  const pathname = usePathname();
  const [muted, setMuted] = useState(() => isSoundMuted());

  function handleToggleSound() {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) {
      playMessagePop();
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b-[3px] border-[#FDB913] bg-[#006633] px-4 shadow-nav md:px-6">
      {/* Brand / Logo */}
      <Link href="/lobby" className="flex items-center gap-2.5 transition-opacity hover:opacity-95">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FDB913] text-[#006633] shadow-xs">
          <MessageSquare className="size-4.5 fill-[#006633]" />
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-extrabold tracking-tight text-[#FDB913]">
            TamaHi<span className="text-white">!</span>
          </span>
          <span className="rounded-full bg-[#FDB913] px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-[#006633]">
            FEU
          </span>
        </div>
      </Link>

      {/* Nav Items */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/lobby" && (pathname === "/lobby" || pathname === "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "bg-[#FDB913]/15 font-bold text-[#FDB913]"
                  : "text-white/75 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="size-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Actions: Sound Toggle & Notification Bell */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSound}
          className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
          title={muted ? "Unmute Campus Sound Effects" : "Mute Sound Effects"}
        >
          {muted ? (
            <VolumeX className="size-4 text-white/60" />
          ) : (
            <Volume2 className="size-4 text-[#FDB913]" />
          )}
        </button>

        <Link
          href="/lobby"
          className="relative flex size-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
          title="Lobby Queue Status"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full border-[1.5px] border-[#006633] bg-[#FDB913]" />
        </Link>
      </div>
    </header>
  );
}

