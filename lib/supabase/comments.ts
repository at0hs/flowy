import { createClient } from "./server";
import { Comment, Profile } from "@/types";
import { logger } from "@/lib/logger";

export interface CommentWithProfile extends Comment {
  profile: Profile | null;
}

/**
 * チケットのコメント一覧を取得（投稿者プロフィール付き）
 * @param ticketId チケットID
 * @returns コメント（プロフィール付き）の配列
 */
export async function getComments(ticketId: string): Promise<CommentWithProfile[]> {
  const supabase = await createClient();

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    logger.error("Failed to fetch comments:", commentsError);
    throw commentsError;
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  const userIds = [
    ...new Set(comments.map((c) => c.user_id).filter((id): id is string => id !== null)),
  ];

  if (userIds.length === 0) {
    return comments.map((comment) => ({ ...comment, profile: null }));
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (profilesError) {
    logger.error("Failed to fetch profiles:", profilesError);
    throw profilesError;
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return comments.map((comment) => ({
    ...comment,
    profile: comment.user_id ? (profileMap.get(comment.user_id) ?? null) : null,
  }));
}

/**
 * コメントを投稿する
 * @param ticketId チケットID
 * @param userId 投稿者のユーザーID
 * @param body コメント本文
 * @returns 作成されたコメントレコード
 */
export async function createComment(
  ticketId: string,
  userId: string,
  body: string
): Promise<Comment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({ ticket_id: ticketId, user_id: userId, body })
    .select()
    .single();

  if (error) {
    logger.error("Failed to create comment:", error);
    throw error;
  }

  return data;
}

/**
 * コメントを編集する
 * @param commentId コメントID
 * @param body 新しいコメント本文
 * @returns 更新されたコメントレコード
 */
export async function updateComment(commentId: string, body: string): Promise<Comment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .update({ body })
    .eq("id", commentId)
    .select()
    .single();

  if (error) {
    logger.error("Failed to update comment:", error);
    throw error;
  }

  return data;
}

/**
 * コメントを削除する
 * @param commentId コメントID
 */
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) {
    logger.error("Failed to delete comment:", error);
    throw error;
  }
}
