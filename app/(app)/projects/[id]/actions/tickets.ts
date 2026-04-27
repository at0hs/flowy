"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ticketSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { PriorityType, StatusType, CategoryType } from "@/types";
import { sendSlackNotification, type SlackNotificationPayload } from "@/lib/slack";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { Json } from "@/types/database.types";
import { sendSlackNotificationToWatchers, fetchNotificationContext } from "./_helpers";
import { insertTicketActivity } from "@/lib/supabase/activities";

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

    await sendSlackNotification({
      ...payload,
      webhookUrl: profile.slack_webhook_url,
    } as SlackNotificationPayload);
  } catch (err) {
    logger.warn("Failed to send Slack notification to user:", err);
  }
}

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
): Promise<void> {
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
    category: formData.get("category"),
    start_date: formData.get("start_date") || undefined,
    due_date: formData.get("due_date") || undefined,
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
      category: data.category,
      assignee_id: assigneeId,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
    })
    .select("id")
    .single();

  if (error) {
    logger.error(error);
    return { error: "チケットの作成に失敗しました" };
  }

  // チケット作成アクティビティを記録
  try {
    await insertTicketActivity(newTicket.id, "created");
  } catch (activityError) {
    logger.warn("Failed to insert ticket activity (created):", activityError);
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
    const ctx = await fetchNotificationContext(supabase, newTicket.id, user.id);
    if (ctx) {
      await sendSlackNotificationToUser(supabase, assigneeId, {
        type: "assigned",
        ticketTitle: ctx.ticketTitle,
        ticketUrl: ctx.ticketUrl,
        actorName: ctx.actorName,
        projectName: ctx.projectName,
      } as Omit<SlackNotificationPayload, "webhookUrl">);
    }
  }

  return { success: true, projectId, ticketId: newTicket.id };
}

export async function deleteTicket(ticketId: string, projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // チケットおよびサブタスクに紐づく添付ファイルのパスを取得
  // （parent_id・ticket_id ともに ON DELETE CASCADE のため、チケット削除前に収集する）
  const { data: childTickets } = await supabase
    .from("tickets")
    .select("id")
    .eq("parent_id", ticketId);

  const targetTicketIds = [ticketId, ...(childTickets ?? []).map((t) => t.id)];

  const { data: attachments } = await supabase
    .from("attachments")
    .select("file_path")
    .in("ticket_id", targetTicketIds);

  // Storage からファイルを一括削除（ベストエフォート）
  if (attachments && attachments.length > 0) {
    const filePaths = attachments.map((a) => a.file_path);
    const { error: storageError } = await supabase.storage.from("attachments").remove(filePaths);
    if (storageError) {
      logger.warn("Failed to delete attachment files from storage:", storageError);
    }
  }

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
    start_date: formData.get("start_date") || undefined,
    due_date: formData.get("due_date") || undefined,
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
      start_date: data.start_date || null,
      due_date: data.due_date || null,
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
  | { field: "status"; value: StatusType; prevValue?: StatusType }
  | { field: "priority"; value: PriorityType; prevValue?: PriorityType }
  | { field: "category"; value: CategoryType }
  | { field: "assignee_id"; value: string | null; prevValue?: string | null }
  | { field: "start_date"; value: string | null }
  | { field: "due_date"; value: string | null };

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

  // アクティビティを記録（title / description / category は対象外）
  try {
    if (update.field === "status") {
      await insertTicketActivity(
        ticketId,
        "status_changed",
        update.prevValue ?? null,
        update.value
      );
    } else if (update.field === "assignee_id") {
      await insertTicketActivity(
        ticketId,
        "assignee_changed",
        update.prevValue ?? null,
        update.value
      );
    } else if (update.field === "priority") {
      await insertTicketActivity(
        ticketId,
        "priority_changed",
        update.prevValue ?? null,
        update.value
      );
    } else if (update.field === "due_date") {
      await insertTicketActivity(ticketId, "due_date_changed", null, update.value);
    } else if (update.field === "start_date") {
      await insertTicketActivity(ticketId, "start_date_changed", null, update.value);
    }
  } catch (activityError) {
    logger.warn("Failed to insert ticket activity:", activityError);
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
    }
    await callNotifyWatchers(supabase, ticketId, "assignee_changed", user.id, {
      old_assignee_id: update.prevValue ?? null,
      new_assignee_id: update.value ?? null,
    });
    const [{ data: oldAssignee }, { data: newAssignee }] = await Promise.all([
      update.prevValue
        ? supabase.from("profiles").select("username").eq("id", update.prevValue).single()
        : Promise.resolve({ data: null }),
      update.value
        ? supabase.from("profiles").select("username").eq("id", update.value).single()
        : Promise.resolve({ data: null }),
    ]);

    const ctx = await fetchNotificationContext(supabase, ticketId, user.id);
    if (ctx) {
      if (update.value && update.value !== user.id) {
        await sendSlackNotificationToUser(supabase, update.value, {
          type: "assigned",
          ticketTitle: ctx.ticketTitle,
          ticketUrl: ctx.ticketUrl,
          actorName: ctx.actorName,
          projectName: ctx.projectName,
          ...(oldAssignee?.username && { oldAssigneeName: oldAssignee.username }),
        } as Omit<SlackNotificationPayload, "webhookUrl">);
      }
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

    const ctxStatus = await fetchNotificationContext(supabase, ticketId, user.id);
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

    const ctxPriority = await fetchNotificationContext(supabase, ticketId, user.id);
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
