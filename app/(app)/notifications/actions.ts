"use server";

import { createClient } from "@/lib/supabase/server";
import { markAsRead, markAllAsRead, getNotifications } from "@/lib/supabase/notifications";
import { revalidatePath } from "next/cache";
import { NotificationWithDetails } from "@/types";

/**
 * 追加の通知を取得する（「もっと見る」ページング用）
 * @param offset スキップ件数
 */
export async function fetchMoreNotificationsAction(
  offset: number
): Promise<NotificationWithDetails[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return getNotifications(user.id, 20, offset);
}

/**
 * 指定した通知を既読にする
 */
export async function markNotificationAsReadAction(notificationId: string): Promise<void> {
  await markAsRead(notificationId);
  revalidatePath("/", "layout");
}

/**
 * ログイン中のユーザーの全通知を既読にする
 */
export async function markAllNotificationsAsReadAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await markAllAsRead(user.id);
  revalidatePath("/", "layout");
}
