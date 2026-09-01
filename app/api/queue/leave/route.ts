import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("match_queue").delete().eq("user_id", user.id);
  }

  return new NextResponse(null, { status: 204 });
}
