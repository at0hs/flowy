"use server";

import { createClient } from "@/lib/supabase/server";
import { upsertNotificationSettings } from "@/lib/supabase/notification-settings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

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

export async function updateNotificationSettings(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const settings = {
    email_assigned: formData.get("email_assigned") === "on",
    email_assignee_changed: formData.get("email_assignee_changed") === "on",
    email_comment_added: formData.get("email_comment_added") === "on",
    email_status_changed: formData.get("email_status_changed") === "on",
    email_priority_changed: formData.get("email_priority_changed") === "on",
    email_mention: formData.get("email_mention") === "on",
    email_deadline: formData.get("email_deadline") === "on",
  };

  try {
    await upsertNotificationSettings(user.id, settings);
  } catch {
    logger.error("Failed to update notification settings");
    return { error: "通知設定の更新に失敗しました" };
  }

  revalidatePath("/settings/notifications");
  return { success: true };
}
