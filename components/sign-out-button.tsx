"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { quitAndResetAll } from "@/lib/match/actions";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          // Clean up room memberships and queue rows first
          await quitAndResetAll();
          if (typeof window !== "undefined") {
            sessionStorage.clear();
          }

          const supabase = createClient();
          await supabase.auth.signOut();
          router.replace("/login");
          if (typeof window !== "undefined") {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/login";
          }
        } catch {
          setPending(false);
        }
      }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
    >
      <LogOut className="size-5 shrink-0" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
