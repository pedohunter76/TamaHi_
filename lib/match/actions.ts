"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { BATCH_SIZE } from "@/lib/match/constants";
import { pickBatch, type QueueEntry } from "@/lib/match/group";
import { requireUser } from "@/lib/supabase/require-user";

export async function findLatestVisibleRoom(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const nowIso = new Date().toISOString();

  // 1. Read left rooms from cookie
  const leftRoomIds = new Set<string>();
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("tamahi_left_rooms")?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const id of parsed) leftRoomIds.add(id);
      }
    }
  } catch {
    // Ignore cookie read error
  }

  // 2. Try fetching room_leaves from DB if table exists
  try {
    const { data: leftRows } = await supabase
      .from("room_leaves")
      .select("room_id")
      .eq("user_id", userId);

    for (const row of leftRows ?? []) {
      if (row?.room_id) leftRoomIds.add(row.room_id as string);
    }
  } catch {
    // Table may not exist yet
  }

  // 3. Try security-definer RPC if available
  try {
    const { data: rpcRoomId, error } = await supabase.rpc("get_user_active_room", {
      p_user_id: userId,
    });

    if (rpcRoomId && !error && !leftRoomIds.has(rpcRoomId as string)) {
      return rpcRoomId as string;
    }
  } catch {
    // Fall back to direct query
  }

  // 4. Query room_members joining active rooms
  const { data: memberships } = await supabase
    .from("room_members")
    .select("room_id, joined_at, rooms!inner(id, expires_at)")
    .eq("user_id", userId)
    .gt("rooms.expires_at", nowIso)
    .order("joined_at", { ascending: false })
    .limit(10);

  const validMembership = (memberships ?? []).find(
    (m) => m.room_id && !leftRoomIds.has(m.room_id as string),
  );

  if (validMembership && validMembership.room_id) {
    return validMembership.room_id as string;
  }

  // 5. Fallback: query recent memberships and find any active unexpired room
  const { data: recentMemberships } = await supabase
    .from("room_members")
    .select("room_id, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(15);

  const candidates = (recentMemberships ?? [])
    .map((m) => m.room_id as string)
    .filter((id) => !leftRoomIds.has(id));

  if (candidates.length > 0) {
    const { data: activeRooms } = await supabase
      .from("rooms")
      .select("id, expires_at")
      .in("id", candidates)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1);

    if (activeRooms && activeRooms.length > 0) {
      return activeRooms[0].id as string;
    }
  }

  return null;
}

export async function joinQueue(): Promise<void> {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("match_queue").insert({
    user_id: userId,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

export async function leaveQueue(): Promise<void> {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("match_queue")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export type LiveCampusStats = {
  activeRooms: number;
  onlineFreshies: number;
  matchesToday: number;
};

export type QueueState = {
  queued: boolean;
  count: number;
  roomId: string | null;
  oldestJoinedAt: string | null;
  stats: LiveCampusStats;
};

export async function getQueueState(): Promise<QueueState> {
  const { supabase, userId } = await requireUser();

  await supabase.rpc("purge_stale_queue");

  const nowIso = new Date().toISOString();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    countResult,
    queuedResult,
    oldestResult,
    activeRoomsResult,
    todayMatchesResult,
  ] = await Promise.all([
    supabase.from("match_queue").select("*", { count: "exact", head: true }),
    supabase
      .from("match_queue")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("match_queue")
      .select("joined_at")
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .gt("expires_at", nowIso),
    supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
  ]);

  const queued = Boolean(queuedResult.data);

  if (queued) {
    // Heartbeat liveness without resetting queue order.
    await supabase
      .from("match_queue")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", userId);
  }

  const roomId = await findLatestVisibleRoom(supabase, userId);

  const rawQueued = countResult.count ?? 0;
  const activeRooms = activeRoomsResult.count ?? 0;
  const matchesToday = todayMatchesResult.count ?? 0;

  // Real-time active freshies only:
  // Active queue members + members in active rooms (4 per room) + current lobby user (if not already queued/roomed)
  const activeRoomMembers = activeRooms * 4;
  const isCurrentAccounted = queued || Boolean(roomId);
  const onlineFreshies = Math.max(
    1,
    rawQueued + activeRoomMembers + (isCurrentAccounted ? 0 : 1),
  );

  return {
    queued,
    count: rawQueued,
    roomId,
    oldestJoinedAt: (oldestResult.data?.joined_at as string | null) ?? null,
    stats: {
      activeRooms,
      onlineFreshies,
      matchesToday,
    },
  };
}

export async function leaveRoom(roomId: string): Promise<void> {
  const { supabase, userId } = await requireUser();

  // 1. Guaranteed direct deletion from room_members via user RLS policy
  await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);

  // Check remaining members in the room; if 0, delete the room row
  try {
    const { count } = await supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (count === 0) {
      await supabase.from("rooms").delete().eq("id", roomId);
    }
  } catch {
    // Ignore error if RLS restricts
  }

  // Also clean up any expired rooms
  try {
    await supabase
      .from("rooms")
      .delete()
      .lte("expires_at", new Date().toISOString());
  } catch {
    // Ignore if policy restricts
  }

  // 2. Also try RPC if available in database
  try {
    await supabase.rpc("leave_room_and_cleanup", {
      p_user_id: userId,
      p_room_id: roomId,
    });
  } catch {
    // Ignore RPC failure if migration not yet applied
  }

  // 3. Try inserting into room_leaves table if it exists
  try {
    await supabase.from("room_leaves").insert({
      room_id: roomId,
      user_id: userId,
    });
  } catch {
    // Ignore if table does not exist
  }

  // 4. Save to persistent cookie so server-side always knows this user left this room
  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get("tamahi_left_rooms")?.value;
    let list: string[] = [];
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        // Ignore JSON error
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

  // 5. Also ensure not in queue
  await supabase.from("match_queue").delete().eq("user_id", userId);
}

export async function quitAndResetAll(): Promise<void> {
  const { supabase, userId } = await requireUser();

  try {
    await supabase.rpc("user_quit_and_reset", {
      p_user_id: userId,
    });
  } catch {
    await Promise.allSettled([
      supabase.from("room_members").delete().eq("user_id", userId),
      supabase.from("match_queue").delete().eq("user_id", userId),
    ]);
  }
}

export async function tryMatch(
  targetBatchSize?: number,
): Promise<string | null> {
  const { supabase, userId } = await requireUser();

  // 1. If user is already seated in an active room, return immediately
  const alreadySeated = await findLatestVisibleRoom(supabase, userId);
  if (alreadySeated) {
    return alreadySeated;
  }

  await supabase.rpc("purge_stale_queue");

  const { data: queueRows, error } = await supabase
    .from("match_queue")
    .select("user_id, joined_at")
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const neededSize = targetBatchSize ?? BATCH_SIZE;

  if (!queueRows || queueRows.length < neededSize) {
    // Check if seated while waiting or during another peer's batch creation
    return await findLatestVisibleRoom(supabase, userId);
  }

  const ids = queueRows.map((row) => row.user_id as string);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, vibes")
    .in("id", ids);

  const vibesById = new Map<string, number[] | null>();
  for (const profile of profileRows ?? []) {
    vibesById.set(profile.id as string, (profile.vibes as number[] | null) ?? null);
  }

  const entries: QueueEntry[] = queueRows.map((row) => ({
    userId: row.user_id as string,
    joinedAt: new Date(row.joined_at as string).getTime(),
    vibes: vibesById.get(row.user_id as string) ?? null,
  }));

  const group = pickBatch(entries, neededSize);

  if (!group || !group.includes(userId)) {
    return await findLatestVisibleRoom(supabase, userId);
  }

  const { data: roomId, error: rpcError } = await supabase.rpc(
    "open_batch_room",
    { p_members: group },
  );

  if (rpcError) {
    const seatedElsewhere = await findLatestVisibleRoom(supabase, userId);

    return seatedElsewhere;
  }

  return (roomId as string | null) ?? null;
}

export async function startEarlyMatch(): Promise<string | null> {
  return await tryMatch(3);
}
