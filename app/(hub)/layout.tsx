import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { TopNav } from "@/components/layout/top-nav";
import { createClient } from "@/lib/supabase/server";

export default async function HubLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("student_number, nickname, age, institute, course, quiz_passed_at, vibes")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.quiz_passed_at || !profile.nickname) {
    redirect("/login");
  }

  return (
    <div className="mesh-bg relative min-h-dvh flex flex-col">
      <TopNav />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-16 pt-20 md:px-8 md:pb-20 md:pt-22">
        {children}
      </main>
    </div>
  );
}

