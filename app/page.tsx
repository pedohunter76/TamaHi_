import { redirect } from "next/navigation";

import { findLatestVisibleRoom } from "@/lib/match/actions";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("quiz_passed_at, nickname, vibes")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.quiz_passed_at && profile?.nickname) {
      const activeRoomId = await findLatestVisibleRoom(supabase, user.id);
      if (activeRoomId) {
        redirect(`/chat/${activeRoomId}`);
      }
      redirect("/lobby");
    }
  }

  redirect("/login");
}

