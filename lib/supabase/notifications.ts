import { createClient } from "./server";
import { Notification, NotificationWithDetails } from "@/types";
import { logger } from "@/lib/logger";

/** 通知として扱う期間（日数） */
const NOTIFICATION_RETENTION_DAYS = 30;

function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - NOTIFICATION_RETENTION_DAYS);
  return d.toISOString();
}

/**
 * ユーザーの通知一覧を取得する（actor・ticket を JOIN、新しい順、30日以内）
 * @param userId ユーザーID
 * @param limit  取得件数上限（省略時はすべて取得）
 * @param offset スキップ件数（ページング用、デフォルト 0）
 * @returns 通知一覧（詳細付き）
 */
export async function getNotifications(
  userId: string,
  limit?: number,
  offset = 0
): Promise<NotificationWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select(
      `
      *,
      actor:profiles!notifications_actor_id_fkey(username),
      ticket:tickets!notifications_ticket_id_fkey(title, project_id)
    `
    )
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo())
    .order("created_at", { ascending: false });

  if (limit !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to fetch notifications:", error);
    throw error;
  }

  return (data ?? []) as NotificationWithDetails[];
}

/**
 * ユーザーの未読通知数を取得する（30日以内）
 * @param userId ユーザーID
 * @returns 未読通知数
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .gte("created_at", thirtyDaysAgo());

  if (error) {
    logger.error("Failed to fetch unread notification count:", error);
    throw error;
  }

  return count ?? 0;
}

/**
 * 指定した通知を既読にする
 * @param notificationId 通知ID
 * @returns 更新された通知レコード
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) {
    logger.error("Failed to mark notification as read:", error);
    throw error;
  }

  return data as Notification;
}

/**
 * ユーザーの全通知を既読にする
 * @param userId ユーザーID
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    logger.error("Failed to mark all notifications as read:", error);
    throw error;
  }
}
