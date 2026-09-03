import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("match_queue")
        .delete()
        .eq("user_id", user.id);
    }
  } catch {
    // Ignore error on teardown beacon
  }

  return new NextResponse(null, { status: 204 });
}
