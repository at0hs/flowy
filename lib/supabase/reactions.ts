import { createClient } from "./server";
import { logger } from "@/lib/logger";
import type { CommentReaction, CommentWithReactions } from "@/types";

/**
 * チケット内の全コメントのリアクションを一括取得し、コメントID単位でグループ化して返す
 * N+1クエリを避けるため、チケットID単位で一括フェッチする
 * @param ticketId チケットID
 * @returns コメントIDをキー、リアクション配列を値とするマップ
 */
export async function getCommentReactions(ticketId: string): Promise<CommentWithReactions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comment_reactions")
    .select("*, comments!inner(ticket_id)")
    .eq("comments.ticket_id", ticketId);

  if (error) {
    logger.error("Failed to fetch comment reactions:", error);
    throw error;
  }

  const grouped: CommentWithReactions = {};
  for (const row of data) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { comments: _, ...reaction } = row;
    const key = reaction.comment_id;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(reaction as CommentReaction);
  }

  return grouped;
}
