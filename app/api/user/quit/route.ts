import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 1. Try atomic security definer cleanup
      try {
        await supabase.rpc("user_quit_and_reset", { p_user_id: user.id });
      } catch {
        // Fallback: direct table deletions
        await Promise.allSettled([
          supabase.from("room_members").delete().eq("user_id", user.id),
          supabase.from("match_queue").delete().eq("user_id", user.id),
        ]);
      }
    }
  } catch {
    // Ignore error on teardown beacon
  }

  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return POST();
}
