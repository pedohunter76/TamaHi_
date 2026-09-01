export type ChatMessage = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
};

export const REACTION_EMOJIS = ["👍", "😂", "🔥", "❤️", "😮"] as const;

export type ReactionGroup = {
  emoji: string;
  count: number;
  mine: boolean;
};

