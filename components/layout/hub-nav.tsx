"use client";

import { MessagesSquare, Search, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Lobby", href: "/lobby", icon: MessagesSquare },
  { label: "Groups", href: "/groups", icon: Users },
  { label: "Members", href: "/members", icon: Search },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function HubNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "relative flex items-center gap-3 overflow-hidden rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
                : "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            }
          >
            {active ? (
              <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-primary" />
            ) : null}
            <item.icon className="size-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
