"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ticketSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { Ticket } from "@/types";
import { Json } from "@/types/database.types";
import { createComment, updateComment, deleteComment, createReply } from "@/lib/supabase/comments";
import { addWatch, removeWatch, getWatcherEmails } from "@/lib/supabase/watches";
import { sendNotificationEmail } from "@/lib/email";
import type { NotificationEmailProps } from "@/emails/notification";

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
    const [ctx, { data: assignee }] = await Promise.all([
      fetchNotificationEmailContext(supabase, ticketId, actorId),
      supabase.from("profiles").select("email").eq("id", assigneeId).single(),
    ]);
    if (!ctx || !assignee?.email) return;
    await sendNotificationEmail({
      to: assignee.email,
      type: "assigned",
      actorName: ctx.actorName,
      ticketTitle: ctx.ticketTitle,
      ticketUrl: ctx.ticketUrl,
      projectName: ctx.projectName,
      oldAssigneeName,
    });
  } catch (err) {
    logger.warn("Failed to send assigned notification email:", err);
  }
}

/**
 * ウォッチャー全員に通知メールを送信する
 */
async function sendNotificationEmailToWatchers(
  ticketId: string,
  actorId: string,
  buildProps: (ctx: {
    ticketTitle: string;
    ticketUrl: string;
    actorName: string;
    projectName: string;
  }) => NotificationEmailProps
): Promise<void> {
  try {
    const supabase = await createClient();
    const [ctx, watchers] = await Promise.all([
      fetchNotificationEmailContext(supabase, ticketId, actorId),
      getWatcherEmails(ticketId, actorId),
    ]);
    if (!ctx || watchers.length === 0) return;
    const props = buildProps(ctx);
    await Promise.all(
      watchers.map(({ email }) =>
        sendNotificationEmail({ ...props, to: email }).catch((err) =>
          logger.warn("Failed to send notification email:", err)
        )
      )
    );
  } catch (err) {
    logger.warn("Failed to send watcher notification emails:", err);
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
    console.error(error);
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
    console.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  return { success: true, ticketId, projectId };
}

type TicketFieldUpdate =
  | { field: "title"; value: string }
  | { field: "description"; value: string | null }
  | { field: "status"; value: Ticket["status"]; prevValue?: Ticket["status"] }
  | { field: "priority"; value: Ticket["priority"]; prevValue?: Ticket["priority"] }
  | { field: "assignee_id"; value: string | null; prevValue?: string | null };

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
    await sendNotificationEmailToWatchers(ticketId, user.id, (ctx) => ({
      type: "assignee_changed" as const,
      ...ctx,
      fieldLabel: "担当者",
      oldValue: oldAssignee?.username ?? "なし",
      newValue: newAssignee?.username ?? "なし",
    }));
  }

  if (update.field === "status" && update.value !== update.prevValue) {
    await callNotifyWatchers(supabase, ticketId, "status_changed", user.id, {
      old_status: update.prevValue ?? null,
      new_status: update.value,
    });
    await sendNotificationEmailToWatchers(ticketId, user.id, (ctx) => ({
      type: "status_changed" as const,
      ...ctx,
      fieldLabel: "ステータス",
      oldValue: STATUS_LABELS[update.prevValue ?? ""] ?? update.prevValue ?? "",
      newValue: STATUS_LABELS[update.value] ?? update.value,
    }));
  }

  if (update.field === "priority" && update.value !== update.prevValue) {
    await callNotifyWatchers(supabase, ticketId, "priority_changed", user.id, {
      old_priority: update.prevValue ?? null,
      new_priority: update.value,
    });
    await sendNotificationEmailToWatchers(ticketId, user.id, (ctx) => ({
      type: "priority_changed" as const,
      ...ctx,
      fieldLabel: "優先度",
      oldValue: PRIORITY_LABELS[update.prevValue ?? ""] ?? update.prevValue ?? "",
      newValue: PRIORITY_LABELS[update.value] ?? update.value,
    }));
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
  await sendNotificationEmailToWatchers(ticketId, user.id, (ctx) => ({
    type: "comment_added" as const,
    ...ctx,
    commentBody: stripHtml(trimmed),
  }));

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
  await sendNotificationEmailToWatchers(ticketId, user.id, (ctx) => ({
    type: "comment_added" as const,
    ...ctx,
    commentBody: stripHtml(trimmed),
  }));

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
