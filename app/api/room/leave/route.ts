import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    let roomId: string | null = null;

    // Handle both JSON payload and sendBeacon text/plain
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      roomId = body?.roomId ?? null;
    } else {
      const text = await request.text().catch(() => "");
      try {
        const parsed = JSON.parse(text);
        roomId = parsed?.roomId ?? null;
      } catch {
        if (text && text.length >= 32) {
          roomId = text.trim();
        }
      }
    }

    if (!roomId) {
      return new NextResponse(null, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    // 1. Delete user from room_members directly
    await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", user.id);

    // 2. Check remaining members in the room; if 0, delete the room
    const { count } = await supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (count === 0) {
      await supabase.from("rooms").delete().eq("id", roomId);
    }

    // 3. Try RPC if available
    try {
      await supabase.rpc("leave_room_and_cleanup", {
        p_user_id: user.id,
        p_room_id: roomId,
      });
    } catch {
      // Ignore RPC failure
    }

    // 4. Try room_leaves insert
    try {
      await supabase.from("room_leaves").insert({
        room_id: roomId,
        user_id: user.id,
      });
    } catch {
      // Ignore if table does not exist
    }

    // 5. Persist to cookie so this user never gets routed back into this room
    try {
      const cookieStore = await cookies();
      const existing = cookieStore.get("tamahi_left_rooms")?.value;
      let list: string[] = [];
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          // Ignore parse error
        }
      }
      if (!list.includes(roomId)) {
        list.push(roomId);
      }
      cookieStore.set("tamahi_left_rooms", JSON.stringify(list), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
    } catch {
      // Ignore cookie error
    }

    // 6. Delete any queue entry
    await supabase.from("match_queue").delete().eq("user_id", user.id);
  } catch {
    // Ignore error on teardown beacon
  }

  return new NextResponse(null, { status: 204 });
}
