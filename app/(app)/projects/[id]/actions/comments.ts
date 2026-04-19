"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import {
  createComment,
  updateComment,
  deleteComment,
  createReply,
  extractMentionedUserIds,
} from "@/lib/supabase/comments";
import { sendSlackNotification, type SlackNotificationPayload } from "@/lib/slack";
import { sendSlackNotificationToWatchers, fetchNotificationEmailContext } from "./_helpers";
import { stripHtml } from "@/lib/utils";

async function sendMentionNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
  actorId: string,
  html: string
): Promise<void> {
  const mentionedIds = extractMentionedUserIds(html).filter((id) => id !== actorId);
  if (mentionedIds.length === 0) return;

  const records = mentionedIds.map((userId) => ({
    user_id: userId,
    actor_id: actorId,
    ticket_id: ticketId,
    type: "mention" as const,
  }));

  const { error } = await supabase.from("notifications").insert(records);
  if (error) {
    logger.warn("Failed to send mention notifications:", error);
  }

  try {
    const [ctx, { data: profiles }] = await Promise.all([
      fetchNotificationEmailContext(supabase, ticketId, actorId),
      supabase.from("profiles").select("id, slack_webhook_url").in("id", mentionedIds),
    ]);
    if (!ctx || !profiles) return;

    const slackPayload = {
      type: "mention",
      ticketTitle: ctx.ticketTitle,
      ticketUrl: ctx.ticketUrl,
      actorName: ctx.actorName,
      projectName: ctx.projectName,
      commentBody: stripHtml(html),
    } as Omit<SlackNotificationPayload, "webhookUrl">;

    await Promise.all(
      profiles
        .filter((p): p is typeof p & { slack_webhook_url: string } => !!p.slack_webhook_url)
        .map(({ slack_webhook_url }) =>
          sendSlackNotification({
            ...slackPayload,
            webhookUrl: slack_webhook_url,
          } as SlackNotificationPayload).catch((err) =>
            logger.warn("Failed to send mention Slack notification:", err)
          )
        )
    );
  } catch (err) {
    logger.warn("Failed to send mention Slack notification:", err);
  }
}

export async function addComment(
  ticketId: string,
  body: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = body.trim();
  if (!trimmed) return { error: "コメントを入力してください" };

  try {
    await createComment(ticketId, user.id, trimmed);
  } catch (err) {
    logger.error("Failed to add comment:", err);
    return { error: "コメントの投稿に失敗しました" };
  }

  const { error: notifyError } = await supabase.rpc("notify_watchers", {
    p_ticket_id: ticketId,
    p_type: "comment_added",
    p_actor_id: user.id,
    p_metadata: { comment: body },
  });
  if (notifyError) {
    logger.warn("Failed to send comment_added notification:", notifyError);
  }

  const ctx = await fetchNotificationEmailContext(supabase, ticketId, user.id);
  if (ctx) {
    await sendSlackNotificationToWatchers(ticketId, user.id, {
      type: "comment_added",
      ticketTitle: ctx.ticketTitle,
      ticketUrl: ctx.ticketUrl,
      actorName: ctx.actorName,
      projectName: ctx.projectName,
      commentBody: stripHtml(trimmed),
    } as Omit<SlackNotificationPayload, "webhookUrl">);
  }

  await sendMentionNotifications(supabase, ticketId, user.id, trimmed);

  return { success: true };
}

export async function addReply(
  ticketId: string,
  body: string,
  replyToId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = body.trim();
  if (!trimmed) return { error: "コメントを入力してください" };

  try {
    await createReply(ticketId, user.id, trimmed, replyToId);
  } catch (err) {
    logger.error("Failed to add reply:", err);
    return { error: "返信の投稿に失敗しました" };
  }

  const { error: notifyError } = await supabase.rpc("notify_watchers", {
    p_ticket_id: ticketId,
    p_type: "comment_added",
    p_actor_id: user.id,
  });
  if (notifyError) {
    logger.warn("Failed to send comment_added notification:", notifyError);
  }

  const ctx = await fetchNotificationEmailContext(supabase, ticketId, user.id);
  if (ctx) {
    await sendSlackNotificationToWatchers(ticketId, user.id, {
      type: "comment_added",
      ticketTitle: ctx.ticketTitle,
      ticketUrl: ctx.ticketUrl,
      actorName: ctx.actorName,
      projectName: ctx.projectName,
      commentBody: stripHtml(trimmed),
    } as Omit<SlackNotificationPayload, "webhookUrl">);
  }

  await sendMentionNotifications(supabase, ticketId, user.id, trimmed);

  return { success: true };
}

export async function editComment(
  commentId: string,
  body: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = body.trim();
  if (!trimmed) return { error: "コメントを入力してください" };

  try {
    await updateComment(commentId, trimmed);
    return { success: true };
  } catch (err) {
    logger.error("Failed to edit comment:", err);
    return { error: "コメントの更新に失敗しました" };
  }
}

export async function removeComment(
  commentId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    await deleteComment(commentId);
    return { success: true };
  } catch (err) {
    logger.error("Failed to delete comment:", err);
    return { error: "コメントの削除に失敗しました" };
  }
}
