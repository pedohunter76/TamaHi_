"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { BATCH_SIZE } from "@/lib/match/constants";
import { pickBatch, type QueueEntry } from "@/lib/match/group";
import { requireUser } from "@/lib/supabase/require-user";

async function findLatestVisibleRoom(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: membership } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership?.room_id) {
    return null;
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", membership.room_id)
    .maybeSingle();

  return room?.id ?? null;
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

export type QueueState = {
  queued: boolean;
  count: number;
  roomId: string | null;
  oldestJoinedAt: string | null;
};

export async function getQueueState(): Promise<QueueState> {
  const { supabase, userId } = await requireUser();

  await supabase.rpc("purge_stale_queue");

  const [countResult, queuedResult, oldestResult] = await Promise.all([
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

  return {
    queued,
    count: countResult.count ?? 0,
    roomId,
    // True longest wait: oldest original join time in the queue.
    oldestJoinedAt: (oldestResult.data?.joined_at as string | null) ?? null,
  };
}

export async function leaveRoom(roomId: string): Promise<void> {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function tryMatch(): Promise<string | null> {
  const { supabase, userId } = await requireUser();

  await supabase.rpc("purge_stale_queue");

  const { data: queueRows, error } = await supabase
    .from("match_queue")
    .select("user_id, joined_at")
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!queueRows || queueRows.length < BATCH_SIZE) {
    return null;
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

  const group = pickBatch(entries, BATCH_SIZE);

  if (!group || !group.includes(userId)) {
    return null;
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
