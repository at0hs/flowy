import { createClient } from "./server";
import { Comment, Profile } from "@/types";
import { logger } from "@/lib/logger";

export interface ReplyToPreview {
  id: string;
  body: string;
  profile: Profile | null;
}

export interface CommentWithProfile extends Comment {
  profile: Profile | null;
  replyToComment: ReplyToPreview | null;
}

/**
 * チケットのコメント一覧を取得（投稿者プロフィール・返信先情報付き）
 * @param ticketId チケットID
 * @returns コメント（プロフィール・返信先情報付き）の配列
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

  // コメントIDマップ（返信先コメントの本文取得用）
  const commentMap = new Map(comments.map((c) => [c.id, c]));

  // 返信先コメントのうち、同一チケット内に存在しないものを取得
  const missingReplyIds = [
    ...new Set(
      comments
        .map((c) => c.reply_to_id)
        .filter((id): id is string => id !== null && !commentMap.has(id))
    ),
  ];

  if (missingReplyIds.length > 0) {
    const { data: missingComments, error: missingError } = await supabase
      .from("comments")
      .select("*")
      .in("id", missingReplyIds);

    if (missingError) {
      logger.error("Failed to fetch reply-to comments:", missingError);
    } else {
      missingComments?.forEach((c) => commentMap.set(c.id, c));
    }
  }

  // プロフィール取得対象：コメント投稿者 + 返信先コメント投稿者
  const userIds = [
    ...new Set(
      [...commentMap.values()].map((c) => c.user_id).filter((id): id is string => id !== null)
    ),
  ];

  if (userIds.length === 0) {
    return comments.map((comment) => ({
      ...comment,
      profile: null,
      replyToComment: null,
    }));
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

  return comments.map((comment) => {
    const replyTo = comment.reply_to_id ? (commentMap.get(comment.reply_to_id) ?? null) : null;

    return {
      ...comment,
      profile: comment.user_id ? (profileMap.get(comment.user_id) ?? null) : null,
      replyToComment: replyTo
        ? {
            id: replyTo.id,
            body: replyTo.body,
            profile: replyTo.user_id ? (profileMap.get(replyTo.user_id) ?? null) : null,
          }
        : null,
    };
  });
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
 * 返信コメントを投稿する
 * @param ticketId チケットID
 * @param userId 投稿者のユーザーID
 * @param body コメント本文
 * @param replyToId 返信先コメントID
 * @returns 作成されたコメントレコード
 */
export async function createReply(
  ticketId: string,
  userId: string,
  body: string,
  replyToId: string
): Promise<Comment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({ ticket_id: ticketId, user_id: userId, body, reply_to_id: replyToId })
    .select()
    .single();

  if (error) {
    logger.error("Failed to create reply:", error);
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
 * HTML内の data-mention-id 属性からメンションされたユーザーIDを抽出する
 * サーバーサイドでDOMが使えないため正規表現で処理する
 * @param html コメント本文（HTML文字列）
 * @returns メンションされたユーザーIDの配列（重複なし）
 */
export function extractMentionedUserIds(html: string): string[] {
  const matches = html.matchAll(/data-mention-id="([^"]+)"/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

/**
 * コメントを削除する
 * 返信が存在する場合はソフトデリート（is_deleted = true）、存在しない場合は物理削除
 * @param commentId コメントID
 */
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient();

  // 返信が存在するか確認
  const { count, error: countError } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("reply_to_id", commentId);

  if (countError) {
    logger.error("Failed to check replies:", countError);
    throw countError;
  }

  if (count && count > 0) {
    // 返信が存在する場合はソフトデリート
    const { error } = await supabase
      .from("comments")
      .update({ is_deleted: true, body: "" })
      .eq("id", commentId);

    if (error) {
      logger.error("Failed to soft-delete comment:", error);
      throw error;
    }
  } else {
    // 返信がない場合は物理削除
    const { error } = await supabase.from("comments").delete().eq("id", commentId);

    if (error) {
      logger.error("Failed to delete comment:", error);
      throw error;
    }
  }
}
