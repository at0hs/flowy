"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ticketSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { Ticket } from "@/types";
import { Json } from "@/types/database.types";
import {
  createComment,
  updateComment,
  deleteComment,
  createReply,
  extractMentionedUserIds,
} from "@/lib/supabase/comments";
import { addWatch, removeWatch, getWatcherEmails } from "@/lib/supabase/watches";
import { sendNotificationEmail } from "@/lib/email";
import type { NotificationEmailProps } from "@/emails/notification";
import { isEmailNotificationEnabled } from "@/lib/supabase/notification-settings";
import { sendSlackNotification, type SlackNotificationPayload } from "@/lib/slack";

// 通知タイプとnotification_settingsフィールドのマッピング
const EMAIL_SETTING_FIELD = {
  assignee_changed: "email_assignee_changed",
  comment_added: "email_comment_added",
  status_changed: "email_status_changed",
  priority_changed: "email_priority_changed",
} as const;

type WatcherNotificationType = keyof typeof EMAIL_SETTING_FIELD;

// ステータスの日本語ラベル
const STATUS_LABELS: Record<string, string> = {
  todo: "TODO",
  in_progress: "進行中",
  done: "完了",
};

// 優先度の日本語ラベル
const PRIORITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};

/** HTMLタグを除去する（メール本文用） */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * 1ユーザーへ Slack 通知を送信する
 * Webhook URL が設定されていない場合は何もしない
 */
async function sendSlackNotificationToUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  payload: Omit<SlackNotificationPayload, "webhookUrl">
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("slack_webhook_url")
      .eq("id", userId)
      .single();

    if (!profile?.slack_webhook_url) return;

    const slackPayload: SlackNotificationPayload = {
      ...payload,
      webhookUrl: profile.slack_webhook_url,
    } as SlackNotificationPayload;

    await sendSlackNotification(slackPayload);
  } catch (err) {
    logger.warn("Failed to send Slack notification to user:", err);
  }
}

/**
 * ウォッチ中のユーザー全員へ Slack 通知を送信する
 * Webhook URL が設定されているユーザーのみに送信する
 */
async function sendSlackNotificationToWatchers(
  ticketId: string,
  actorId: string,
  payload: Omit<SlackNotificationPayload, "webhookUrl">
): Promise<void> {
  try {
    const supabase = await createClient();
    const watchers = await getWatcherEmails(ticketId, actorId);

    if (watchers.length === 0) return;

    // ウォッチャーの Webhook URL を一括取得
    const watcherIds = watchers.map((w) => w.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, slack_webhook_url")
      .in("id", watcherIds);

    // Webhook URL が設定されているユーザーのみに送信
    const watchersWithWebhook = (profiles ?? []).filter(
      (p): p is { id: string; slack_webhook_url: string } => !!p.slack_webhook_url
    );

    await Promise.all(
      watchersWithWebhook.map(({ slack_webhook_url }) => {
        const slackPayload: SlackNotificationPayload = {
          ...payload,
          webhookUrl: slack_webhook_url,
        } as SlackNotificationPayload;
        return sendSlackNotification(slackPayload).catch((err) =>
          logger.warn("Failed to send Slack notification to watcher:", err)
        );
      })
    );
  } catch (err) {
    logger.warn("Failed to send Slack notifications to watchers:", err);
  }
}

/**
 * メール通知に必要なコンテキスト（チケット情報・操作者名・チケットURL）を取得する
 */
async function fetchNotificationEmailContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
  actorId: string
): Promise<{
  ticketTitle: string;
  ticketUrl: string;
  actorName: string;
  projectName: string;
} | null> {
  const [{ data: ticket }, { data: actor }] = await Promise.all([
    supabase
      .from("tickets")
      .select("title, project_id, projects(name)")
      .eq("id", ticketId)
      .single(),
    supabase.from("profiles").select("username").eq("id", actorId).single(),
  ]);
  if (!ticket || !actor) return null;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3111";
  const project = ticket.projects as { name: string } | null;
  return {
    ticketTitle: ticket.title,
    ticketUrl: `${base}/projects/${ticket.project_id}/tickets/${ticketId}`,
    actorName: actor.username,
    projectName: project?.name ?? "",
  };
}

/**
 * 担当者割り当て通知メールを1人のユーザーに送信する
 */
async function sendAssignedNotificationEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
  actorId: string,
  assigneeId: string,
  oldAssigneeName?: string
): Promise<void> {
  try {
    const [ctx, { data: assignee }, enabled] = await Promise.all([
      fetchNotificationEmailContext(supabase, ticketId, actorId),
      supabase.from("profiles").select("email").eq("id", assigneeId).single(),
      isEmailNotificationEnabled(assigneeId, "email_assigned"),
    ]);
    if (!ctx || !assignee?.email || !enabled) return;
    await sendNotificationEmail({
      to: assignee.email,
      type: "assigned",
      actorName: ctx.actorName,
      ticketTitle: ctx.ticketTitle,
      ticketUrl: ctx.ticketUrl,
      projectName: ctx.projectName,
      oldAssigneeName,
    });

    // Slack 通知を送信
    await sendSlackNotificationToUser(supabase, assigneeId, {
      type: "assigned",
      ticketTitle: ctx.ticketTitle,
      ticketUrl: ctx.ticketUrl,
      actorName: ctx.actorName,
      projectName: ctx.projectName,
      ...(oldAssigneeName && { oldAssigneeName }),
    } as Omit<SlackNotificationPayload, "webhookUrl">);
  } catch (err) {
    logger.warn("Failed to send assigned notification email:", err);
  }
}

/**
 * ウォッチャー全員に通知メールを送信する（メール通知設定がONのユーザーのみ）
 */
async function sendNotificationEmailToWatchers(
  ticketId: string,
  actorId: string,
  notificationType: WatcherNotificationType,
  buildProps: (ctx: {
    ticketTitle: string;
    ticketUrl: string;
    actorName: string;
    projectName: string;
  }) => NotificationEmailProps
): Promise<void> {
  try {
    const supabase = await createClient();
    const settingField = EMAIL_SETTING_FIELD[notificationType];

    const [ctx, watchers] = await Promise.all([
      fetchNotificationEmailContext(supabase, ticketId, actorId),
      getWatcherEmails(ticketId, actorId),
    ]);
    if (!ctx || watchers.length === 0) return;

    // ウォッチャー全員の通知設定を一括取得（1クエリ）
    const watcherIds = watchers.map((w) => w.user_id);
    const { data: settings } = await supabase
      .from("notification_settings")
      .select(`user_id, ${settingField}`)
      .in("user_id", watcherIds);

    // OFFのユーザーIDをSetで管理（レコードなし＝デフォルトON）
    const disabledUserIds = new Set(
      (settings ?? [])
        .filter((s) => !(s as Record<string, unknown>)[settingField])
        .map((s) => s.user_id)
    );

    const props = buildProps(ctx);
    await Promise.all(
      watchers
        .filter((w) => !disabledUserIds.has(w.user_id))
        .map(({ email }) =>
          sendNotificationEmail({ ...props, to: email }).catch((err) =>
            logger.warn("Failed to send notification email:", err)
          )
        )
    );
  } catch (err) {
    logger.warn("Failed to send watcher notification emails:", err);
  }
}

/**
 * コメント本文のメンション対象ユーザーに `mention` 通知を発行する
 * 自分自身へのメンションは除外する
 */
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

  // メンションされたユーザーへメール・Slack 通知を送信（email_mention=ONのユーザーのみ）
  try {
    const [ctx, { data: profiles }, { data: settings }] = await Promise.all([
      fetchNotificationEmailContext(supabase, ticketId, actorId),
      supabase.from("profiles").select("id, email, slack_webhook_url").in("id", mentionedIds),
      supabase
        .from("notification_settings")
        .select("user_id, email_mention")
        .in("user_id", mentionedIds),
    ]);
    if (!ctx || !profiles) return;

    // OFFのユーザーIDをSetで管理（レコードなし＝デフォルトON）
    const disabledUserIds = new Set(
      (settings ?? []).filter((s) => !s.email_mention).map((s) => s.user_id)
    );

    const enabledProfiles = profiles.filter((p) => !disabledUserIds.has(p.id));

    // メール通知を送信
    await Promise.all(
      enabledProfiles.map(({ email }) =>
        sendNotificationEmail({
          to: email,
          type: "mention",
          actorName: ctx.actorName,
          ticketTitle: ctx.ticketTitle,
          ticketUrl: ctx.ticketUrl,
          projectName: ctx.projectName,
          commentBody: stripHtml(html),
        }).catch((err) => logger.warn("Failed to send mention notification email:", err))
      )
    );

    // Slack 通知を送信
    const slackPayload = {
      type: "mention",
      ticketTitle: ctx.ticketTitle,
      ticketUrl: ctx.ticketUrl,
      actorName: ctx.actorName,
      projectName: ctx.projectName,
      commentBody: stripHtml(html),
    } as Omit<SlackNotificationPayload, "webhookUrl">;

    await Promise.all(
      enabledProfiles
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
    logger.warn("Failed to send mention notification emails:", err);
  }
}

export async function createTicket(projectId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = ticketSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  const assigneeIdRaw = formData.get("assignee_id") as string | null;
  const assigneeId = assigneeIdRaw && assigneeIdRaw.trim() !== "" ? assigneeIdRaw : null;

  const parentIdRaw = formData.get("parent_id") as string | null;
  const parentId = parentIdRaw && parentIdRaw.trim() !== "" ? parentIdRaw : null;

  const dueDateRaw = formData.get("due_date") as string | null;
  const dueDate = dueDateRaw && dueDateRaw.trim() !== "" ? dueDateRaw : null;

  // T28: 孫チケット作成を禁止する（親チケットが既に子チケットの場合はエラー）
  if (parentId) {
    const { data: parentTicket, error: parentError } = await supabase
      .from("tickets")
      .select("parent_id")
      .eq("id", parentId)
      .single();

    if (parentError) {
      logger.error("Failed to fetch parent ticket:", parentError);
      return { error: "親チケットの取得に失敗しました" };
    }

    if (parentTicket.parent_id !== null) {
      return { error: "サブタスクにはサブタスクを作成できません" };
    }
  }

  const { data: newTicket, error } = await supabase
    .from("tickets")
    .insert({
      project_id: projectId,
      parent_id: parentId,
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      assignee_id: assigneeId,
      due_date: dueDate,
    })
    .select("id")
    .single();

  if (error) {
    logger.error(error);
    return { error: "チケットの作成に失敗しました" };
  }

  // 担当者が設定されており、自分以外の場合は `assigned` 通知を発行
  if (assigneeId && assigneeId !== user.id) {
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: assigneeId,
      actor_id: user.id,
      ticket_id: newTicket.id,
      type: "assigned" as const,
    });
    if (notifyError) {
      logger.warn("Failed to send assigned notification:", notifyError);
    }
    await sendAssignedNotificationEmail(supabase, newTicket.id, user.id, assigneeId);
  }

  return { success: true, projectId };
}

export async function deleteTicket(ticketId: string, projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

  if (error) {
    logger.error("Failed to delete ticket:", error.message);
    return { error: "チケットの削除に失敗しました" };
  }

  return { success: true, projectId };
}

export async function updateTicket(ticketId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = ticketSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  const assigneeIdRaw = formData.get("assignee_id") as string | null;
  const assigneeId = assigneeIdRaw && assigneeIdRaw.trim() !== "" ? assigneeIdRaw : null;

  const { error } = await supabase
    .from("tickets")
    .update({
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      assignee_id: assigneeId,
    })
    .eq("id", ticketId);

  if (error) {
    logger.error("Failed to update ticket:", error);
    return { error: "チケットの更新に失敗しました" };
  }

  return { success: true, ticketId, projectId };
}

type TicketFieldUpdate =
  | { field: "title"; value: string }
  | { field: "description"; value: string | null }
  | { field: "status"; value: Ticket["status"]; prevValue?: Ticket["status"] }
  | { field: "priority"; value: Ticket["priority"]; prevValue?: Ticket["priority"] }
  | { field: "assignee_id"; value: string | null; prevValue?: string | null }
  | { field: "due_date"; value: string | null };

type NotifyWatchersType =
  | "assignee_changed"
  | "status_changed"
  | "priority_changed"
  | "comment_added";

async function callNotifyWatchers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
  type: NotifyWatchersType,
  actorId: string,
  metadata?: Json
) {
  const { error } = await supabase.rpc("notify_watchers", {
    p_ticket_id: ticketId,
    p_type: type,
    p_actor_id: actorId,
    p_metadata: metadata ?? null,
  });
  if (error) {
    logger.warn(`Failed to send ${type} notification:`, error);
  }
}

export async function updateTicketField(
  ticketId: string,
  _projectId: string,
  update: TicketFieldUpdate
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (update.field === "title") {
    const result = z.string().min(1, "タイトルは必須です").safeParse(update.value);
    if (!result.success) {
      return { error: result.error.issues[0].message };
    }
  }

  const { error } = await supabase
    .from("tickets")
    .update({ [update.field]: update.value })
    .eq("id", ticketId);

  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  if (update.field === "assignee_id" && update.value !== update.prevValue) {
    // 新担当者が設定されており、自分以外の場合は `assigned` 通知を発行
    if (update.value && update.value !== user.id) {
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: update.value,
        actor_id: user.id,
        ticket_id: ticketId,
        type: "assigned" as const,
      });
      if (notifyError) logger.warn("Failed to send assigned notification:", notifyError);
      // 旧担当者名を取得してメール送信（旧担当者がいた場合のみ）
      const oldAssigneeName = update.prevValue
        ? (await supabase.from("profiles").select("username").eq("id", update.prevValue).single())
            .data?.username
        : undefined;
      await sendAssignedNotificationEmail(
        supabase,
        ticketId,
        user.id,
        update.value,
        oldAssigneeName
      );
    }
    await callNotifyWatchers(supabase, ticketId, "assignee_changed", user.id, {
      old_assignee_id: update.prevValue ?? null,
      new_assignee_id: update.value ?? null,
    });
    // ウォッチャーへ assignee_changed メールを送信
    const [{ data: oldAssignee }, { data: newAssignee }] = await Promise.all([
      update.prevValue
        ? supabase.from("profiles").select("username").eq("id", update.prevValue).single()
        : Promise.resolve({ data: null }),
      update.value
        ? supabase.from("profiles").select("username").eq("id", update.value).single()
        : Promise.resolve({ data: null }),
    ]);
    await sendNotificationEmailToWatchers(ticketId, user.id, "assignee_changed", (ctx) => ({
      type: "assignee_changed" as const,
      ...ctx,
      fieldLabel: "担当者",
      oldValue: oldAssignee?.username ?? "なし",
      newValue: newAssignee?.username ?? "なし",
    }));

    // ウォッチャーへ assignee_changed Slack 通知を送信
    const ctx = await fetchNotificationEmailContext(supabase, ticketId, user.id);
    if (ctx) {
      await sendSlackNotificationToWatchers(ticketId, user.id, {
        type: "assignee_changed",
        ticketTitle: ctx.ticketTitle,
        ticketUrl: ctx.ticketUrl,
        actorName: ctx.actorName,
        projectName: ctx.projectName,
        oldValue: oldAssignee?.username ?? "なし",
        newValue: newAssignee?.username ?? "なし",
      } as Omit<SlackNotificationPayload, "webhookUrl">);
    }
  }

  if (update.field === "status" && update.value !== update.prevValue) {
    await callNotifyWatchers(supabase, ticketId, "status_changed", user.id, {
      old_status: update.prevValue ?? null,
      new_status: update.value,
    });
    await sendNotificationEmailToWatchers(ticketId, user.id, "status_changed", (ctx) => ({
      type: "status_changed" as const,
      ...ctx,
      fieldLabel: "ステータス",
      oldValue: STATUS_LABELS[update.prevValue ?? ""] ?? update.prevValue ?? "",
      newValue: STATUS_LABELS[update.value] ?? update.value,
    }));

    // ウォッチャーへ status_changed Slack 通知を送信
    const ctxStatus = await fetchNotificationEmailContext(supabase, ticketId, user.id);
    if (ctxStatus) {
      await sendSlackNotificationToWatchers(ticketId, user.id, {
        type: "status_changed",
        ticketTitle: ctxStatus.ticketTitle,
        ticketUrl: ctxStatus.ticketUrl,
        actorName: ctxStatus.actorName,
        projectName: ctxStatus.projectName,
        oldValue: STATUS_LABELS[update.prevValue ?? ""] ?? update.prevValue ?? "",
        newValue: STATUS_LABELS[update.value] ?? update.value,
      } as Omit<SlackNotificationPayload, "webhookUrl">);
    }
  }

  if (update.field === "priority" && update.value !== update.prevValue) {
    await callNotifyWatchers(supabase, ticketId, "priority_changed", user.id, {
      old_priority: update.prevValue ?? null,
      new_priority: update.value,
    });
    await sendNotificationEmailToWatchers(ticketId, user.id, "priority_changed", (ctx) => ({
      type: "priority_changed" as const,
      ...ctx,
      fieldLabel: "優先度",
      oldValue: PRIORITY_LABELS[update.prevValue ?? ""] ?? update.prevValue ?? "",
      newValue: PRIORITY_LABELS[update.value] ?? update.value,
    }));

    // ウォッチャーへ priority_changed Slack 通知を送信
    const ctxPriority = await fetchNotificationEmailContext(supabase, ticketId, user.id);
    if (ctxPriority) {
      await sendSlackNotificationToWatchers(ticketId, user.id, {
        type: "priority_changed",
        ticketTitle: ctxPriority.ticketTitle,
        ticketUrl: ctxPriority.ticketUrl,
        actorName: ctxPriority.actorName,
        projectName: ctxPriority.projectName,
        oldValue: PRIORITY_LABELS[update.prevValue ?? ""] ?? update.prevValue ?? "",
        newValue: PRIORITY_LABELS[update.value] ?? update.value,
      } as Omit<SlackNotificationPayload, "webhookUrl">);
    }
  }

  return { success: true };
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

  // コメント投稿後、ウォッチ中のユーザーに `comment_added` 通知を発行
  const { error: notifyError } = await supabase.rpc("notify_watchers", {
    p_ticket_id: ticketId,
    p_type: "comment_added",
    p_actor_id: user.id,
    p_metadata: {
      comment: body,
    },
  });
  if (notifyError) {
    logger.warn("Failed to send comment_added notification:", notifyError);
  }
  await sendNotificationEmailToWatchers(ticketId, user.id, "comment_added", (ctx) => ({
    type: "comment_added" as const,
    ...ctx,
    commentBody: stripHtml(trimmed),
  }));

  // ウォッチャーへ comment_added Slack 通知を送信
  const ctxComment = await fetchNotificationEmailContext(supabase, ticketId, user.id);
  if (ctxComment) {
    await sendSlackNotificationToWatchers(ticketId, user.id, {
      type: "comment_added",
      ticketTitle: ctxComment.ticketTitle,
      ticketUrl: ctxComment.ticketUrl,
      actorName: ctxComment.actorName,
      projectName: ctxComment.projectName,
      commentBody: stripHtml(trimmed),
    } as Omit<SlackNotificationPayload, "webhookUrl">);
  }

  // メンションされたユーザーに `mention` 通知を発行（ウォッチ不要・常時通知）
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

  // 返信投稿後、ウォッチ中のユーザーに `comment_added` 通知を発行
  const { error: notifyError } = await supabase.rpc("notify_watchers", {
    p_ticket_id: ticketId,
    p_type: "comment_added",
    p_actor_id: user.id,
  });
  if (notifyError) {
    logger.warn("Failed to send comment_added notification:", notifyError);
  }
  await sendNotificationEmailToWatchers(ticketId, user.id, "comment_added", (ctx) => ({
    type: "comment_added" as const,
    ...ctx,
    commentBody: stripHtml(trimmed),
  }));

  // ウォッチャーへ comment_added Slack 通知を送信
  const ctxReply = await fetchNotificationEmailContext(supabase, ticketId, user.id);
  if (ctxReply) {
    await sendSlackNotificationToWatchers(ticketId, user.id, {
      type: "comment_added",
      ticketTitle: ctxReply.ticketTitle,
      ticketUrl: ctxReply.ticketUrl,
      actorName: ctxReply.actorName,
      projectName: ctxReply.projectName,
      commentBody: stripHtml(trimmed),
    } as Omit<SlackNotificationPayload, "webhookUrl">);
  }

  // メンションされたユーザーに `mention` 通知を発行（ウォッチ不要・常時通知）
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

export async function watchTicket(
  ticketId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    await addWatch(ticketId, user.id);
    return { success: true };
  } catch (err) {
    logger.error("Failed to watch ticket:", err);
    return { error: "ウォッチの登録に失敗しました" };
  }
}

export async function unwatchTicket(
  ticketId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    await removeWatch(ticketId, user.id);
    return { success: true };
  } catch (err) {
    logger.error("Failed to unwatch ticket:", err);
    return { error: "ウォッチの解除に失敗しました" };
  }
}
