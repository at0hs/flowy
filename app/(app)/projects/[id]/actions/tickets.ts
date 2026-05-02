"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ticketSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { TicketPriority, TicketStatus, TicketCategory } from "@/types";
import { type SlackNotificationPayload } from "@/lib/slack";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { Json } from "@/types/database.types";
import {
  sendSlackNotificationToWatchers,
  sendSlackNotificationToUser,
  fetchNotificationContext,
} from "./_helpers";
import { insertTicketActivity } from "@/lib/supabase/activities";

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

// ---------------------------------------------------------------------------
// チケット作成・削除・一括更新
// ---------------------------------------------------------------------------

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

  try {
    await insertTicketActivity(newTicket.id, "created");
  } catch (activityError) {
    logger.warn("Failed to insert ticket activity (created):", activityError);
  }

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

  const { data: childTickets } = await supabase
    .from("tickets")
    .select("id")
    .eq("parent_id", ticketId);

  const targetTicketIds = [ticketId, ...(childTickets ?? []).map((t) => t.id)];

  const { data: attachments } = await supabase
    .from("attachments")
    .select("file_path")
    .in("ticket_id", targetTicketIds);

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

// ---------------------------------------------------------------------------
// フィールド別インライン更新
// ---------------------------------------------------------------------------

/**
 * @todo
 * 現状各アクションが、すべて直列で実行されている
 * DB更新 → activityInsert → notifyWatchers(DB) → fetchContext(DB) → Slack HTTP通知
 * アクティビティ履歴・in-app通知・スラック通知はPromise.allで並列化するか要検討
 */

export async function updateTicketTitle(
  ticketId: string,
  value: string
): Promise<{ success: true } | { error: string }> {
  const result = z.string().min(1, "タイトルは必須です").safeParse(value);
  if (!result.success) return { error: result.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").update({ title: value }).eq("id", ticketId);
  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  return { success: true };
}

export async function updateTicketDescription(
  ticketId: string,
  value: string | null
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("tickets")
    .update({ description: value })
    .eq("id", ticketId);
  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  return { success: true };
}

export async function updateTicketCategory(
  ticketId: string,
  value: TicketCategory
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").update({ category: value }).eq("id", ticketId);
  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  return { success: true };
}

export async function updateTicketStartDate(
  ticketId: string,
  value: string | null
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").update({ start_date: value }).eq("id", ticketId);
  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  try {
    await insertTicketActivity(ticketId, "start_date_changed", null, value);
  } catch (activityError) {
    logger.warn("Failed to insert ticket activity:", activityError);
  }

  return { success: true };
}

export async function updateTicketDueDate(
  ticketId: string,
  value: string | null
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").update({ due_date: value }).eq("id", ticketId);
  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  try {
    await insertTicketActivity(ticketId, "due_date_changed", null, value);
  } catch (activityError) {
    logger.warn("Failed to insert ticket activity:", activityError);
  }

  return { success: true };
}

export async function updateTicketStatus(
  ticketId: string,
  value: TicketStatus,
  prevValue?: TicketStatus
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").update({ status: value }).eq("id", ticketId);
  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  try {
    await insertTicketActivity(ticketId, "status_changed", prevValue ?? null, value);
  } catch (activityError) {
    logger.warn("Failed to insert ticket activity:", activityError);
  }

  if (value !== prevValue) {
    await callNotifyWatchers(supabase, ticketId, "status_changed", user.id, {
      old_status: prevValue ?? null,
      new_status: value,
    });

    const ctx = await fetchNotificationContext(supabase, ticketId, user.id);
    if (ctx) {
      await sendSlackNotificationToWatchers(ticketId, user.id, {
        type: "status_changed",
        ticketTitle: ctx.ticketTitle,
        ticketUrl: ctx.ticketUrl,
        actorName: ctx.actorName,
        projectName: ctx.projectName,
        oldValue: STATUS_LABELS[prevValue ?? ""] ?? prevValue ?? "",
        newValue: STATUS_LABELS[value] ?? value,
      } as Omit<SlackNotificationPayload, "webhookUrl">);
    }
  }

  return { success: true };
}

export async function updateTicketPriority(
  ticketId: string,
  value: TicketPriority,
  prevValue?: TicketPriority
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").update({ priority: value }).eq("id", ticketId);
  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  try {
    await insertTicketActivity(ticketId, "priority_changed", prevValue ?? null, value);
  } catch (activityError) {
    logger.warn("Failed to insert ticket activity:", activityError);
  }

  if (value !== prevValue) {
    await callNotifyWatchers(supabase, ticketId, "priority_changed", user.id, {
      old_priority: prevValue ?? null,
      new_priority: value,
    });

    const ctx = await fetchNotificationContext(supabase, ticketId, user.id);
    if (ctx) {
      await sendSlackNotificationToWatchers(ticketId, user.id, {
        type: "priority_changed",
        ticketTitle: ctx.ticketTitle,
        ticketUrl: ctx.ticketUrl,
        actorName: ctx.actorName,
        projectName: ctx.projectName,
        oldValue: PRIORITY_LABELS[prevValue ?? ""] ?? prevValue ?? "",
        newValue: PRIORITY_LABELS[value] ?? value,
      } as Omit<SlackNotificationPayload, "webhookUrl">);
    }
  }

  return { success: true };
}

export async function updateTicketAssignee(
  ticketId: string,
  value: string | null,
  prevValue?: string | null
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("tickets")
    .update({ assignee_id: value })
    .eq("id", ticketId);
  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  const [{ data: oldProfile }, { data: newProfile }] = await Promise.all([
    prevValue
      ? supabase.from("profiles").select("username").eq("id", prevValue).single()
      : Promise.resolve({ data: null }),
    value
      ? supabase.from("profiles").select("username").eq("id", value).single()
      : Promise.resolve({ data: null }),
  ]);
  const oldAssigneeName = oldProfile?.username ?? null;
  const newAssigneeName = newProfile?.username ?? null;

  try {
    await insertTicketActivity(
      ticketId,
      "assignee_changed",
      oldAssigneeName ?? prevValue ?? null,
      newAssigneeName ?? value ?? null
    );
  } catch (activityError) {
    logger.warn("Failed to insert ticket activity:", activityError);
  }

  if (value !== prevValue) {
    if (value && value !== user.id) {
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: value,
        actor_id: user.id,
        ticket_id: ticketId,
        type: "assigned" as const,
      });
      if (notifyError) logger.warn("Failed to send assigned notification:", notifyError);
    }

    await callNotifyWatchers(supabase, ticketId, "assignee_changed", user.id, {
      old_assignee_id: prevValue ?? null,
      new_assignee_id: value ?? null,
    });

    const ctx = await fetchNotificationContext(supabase, ticketId, user.id);
    if (ctx) {
      if (value && value !== user.id) {
        await sendSlackNotificationToUser(supabase, value, {
          type: "assigned",
          ticketTitle: ctx.ticketTitle,
          ticketUrl: ctx.ticketUrl,
          actorName: ctx.actorName,
          projectName: ctx.projectName,
          ...(oldAssigneeName && { oldAssigneeName }),
        } as Omit<SlackNotificationPayload, "webhookUrl">);
      }
      await sendSlackNotificationToWatchers(ticketId, user.id, {
        type: "assignee_changed",
        ticketTitle: ctx.ticketTitle,
        ticketUrl: ctx.ticketUrl,
        actorName: ctx.actorName,
        projectName: ctx.projectName,
        oldValue: oldAssigneeName ?? "なし",
        newValue: newAssigneeName ?? "なし",
      } as Omit<SlackNotificationPayload, "webhookUrl">);
    }
  }

  return { success: true };
}
