"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getNotificationSettings,
  upsertNotificationSettings,
} from "@/lib/supabase/notification-settings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { NotificationType } from "@/types";

export async function updateSlackWebhookUrl(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const webhookUrl = (formData.get("slack_webhook_url") as string | null)?.trim() || null;

  if (webhookUrl && !webhookUrl.startsWith("https://hooks.slack.com/")) {
    return { error: "Slack Webhook URLの形式が正しくありません" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ slack_webhook_url: webhookUrl })
    .eq("id", user.id);

  if (error) {
    logger.error("Failed to update Slack webhook URL:", error);
    return { error: "Slack連携設定の更新に失敗しました" };
  }

  revalidatePath("/settings/integrations");
  return { success: true };
}

const FIELD_TO_NOTIFICATION_TYPE: Record<string, NotificationType> = {
  email_assigned: "assigned",
  email_assignee_changed: "assignee_changed",
  email_comment_added: "comment_added",
  email_status_changed: "status_changed",
  email_priority_changed: "priority_changed",
  email_mention: "mention",
  email_deadline: "deadline",
};

export async function updateNotificationSettings(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const newSettings = {
    email_assigned: formData.get("email_assigned") === "on",
    email_assignee_changed: formData.get("email_assignee_changed") === "on",
    email_comment_added: formData.get("email_comment_added") === "on",
    email_status_changed: formData.get("email_status_changed") === "on",
    email_priority_changed: formData.get("email_priority_changed") === "on",
    email_mention: formData.get("email_mention") === "on",
    email_deadline: formData.get("email_deadline") === "on",
  };

  // OFF → ON になった通知種別を検出して未送信通知を送信済みにする
  const currentSettings = await getNotificationSettings(user.id);
  const enabledTypes: NotificationType[] = Object.entries(newSettings)
    .filter(([field, newValue]) => {
      const oldValue = (currentSettings as Record<string, unknown>)[field] ?? true;
      return !oldValue && newValue;
    })
    .map(([field]) => FIELD_TO_NOTIFICATION_TYPE[field]);

  try {
    if (enabledTypes.length > 0) {
      const adminClient = createAdminClient();
      const { error: markError } = await adminClient
        .from("notifications")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .in("type", enabledTypes)
        .is("email_sent_at", null);

      if (markError) {
        logger.error("Failed to mark notifications as sent on settings enable:", markError);
        return { error: "通知設定の更新に失敗しました" };
      }
    }

    await upsertNotificationSettings(user.id, newSettings);
  } catch {
    logger.error("Failed to update notification settings");
    return { error: "通知設定の更新に失敗しました" };
  }

  revalidatePath("/settings/notifications");
  return { success: true };
}
