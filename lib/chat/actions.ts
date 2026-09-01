"use server";

import {
  REACTION_EMOJIS,
  type ChatMessage,
  type ReactionGroup,
} from "@/lib/chat/types";
import { requireUser } from "@/lib/supabase/require-user";

const MAX_CONTENT_LENGTH = 500;
const HISTORY_LIMIT = 100;

type RawMessageRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type RawReactionRow = {
  message_id: string;
  user_id: string;
  emoji: string;
};

function toChatMessage(row: RawMessageRow): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getMessages(roomId: string): Promise<ChatMessage[]> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("messages")
    .select("id, user_id, content, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as RawMessageRow[])
    .map(toChatMessage)
    .reverse();
}

function groupReactions(
  rows: RawReactionRow[],
  currentUserId: string,
): Record<string, ReactionGroup[]> {
  const byMessage = new Map<string, Map<string, ReactionGroup>>();

  for (const row of rows) {
    let byEmoji = byMessage.get(row.message_id);

    if (!byEmoji) {
      byEmoji = new Map<string, ReactionGroup>();
      byMessage.set(row.message_id, byEmoji);
    }

    const existing = byEmoji.get(row.emoji);

    if (existing) {
      existing.count += 1;
      existing.mine = existing.mine || row.user_id === currentUserId;
    } else {
      byEmoji.set(row.emoji, {
        emoji: row.emoji,
        count: 1,
        mine: row.user_id === currentUserId,
      });
    }
  }

  const result: Record<string, ReactionGroup[]> = {};

  for (const [messageId, byEmoji] of byMessage) {
    result[messageId] = [...byEmoji.values()];
  }

  return result;
}

export async function getReactions(
  roomId: string,
): Promise<Record<string, ReactionGroup[]>> {
  const { supabase, userId } = await requireUser();

  const { data: messageIds } = await supabase
    .from("messages")
    .select("id")
    .eq("room_id", roomId);

  const ids = (messageIds ?? []).map((row) => row.id as string);

  if (ids.length === 0) {
    return {};
  }

  const { data: reactionRows, error } = await supabase
    .from("message_reactions")
    .select("message_id, user_id, emoji")
    .in("message_id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return groupReactions(
    (reactionRows ?? []) as unknown as RawReactionRow[],
    userId,
  );
}

export async function toggleReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  if (!(REACTION_EMOJIS as readonly string[]).includes(emoji)) {
    throw new Error("Unsupported reaction.");
  }

  const { supabase, userId } = await requireUser();

  const { data: removed } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .select("emoji");

  if ((removed ?? []).length > 0) {
    return;
  }

  const { error } = await supabase.from("message_reactions").insert({
    message_id: messageId,
    user_id: userId,
    emoji,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendMessage(
  roomId: string,
  content: string,
): Promise<void> {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Message is empty.");
  }

  if (trimmed.length > MAX_CONTENT_LENGTH) {
    throw new Error(
      `Message must be ${MAX_CONTENT_LENGTH} characters or fewer.`,
    );
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("messages").insert({
    room_id: roomId,
    user_id: userId,
    content: trimmed,
  });

  if (error) {
    throw new Error(error.message);
  }
}
