import { createClient } from "./server";
import { NotificationSetting } from "@/types";
import { logger } from "@/lib/logger";

type NotificationSettingsFields = Omit<
  NotificationSetting,
  "id" | "user_id" | "created_at" | "updated_at"
>;

/** レコードが存在しない場合のデフォルト設定（すべてON） */
const DEFAULT_SETTINGS: NotificationSettingsFields = {
  email_assigned: true,
  email_assignee_changed: true,
  email_comment_added: true,
  email_status_changed: true,
  email_priority_changed: true,
  email_mention: true,
  email_deadline: true,
};

/**
 * ユーザーの通知設定を取得する。
 * レコードが存在しない場合はデフォルト設定（すべてON）を返す。
 * @param userId ユーザーID
 */
export async function getNotificationSettings(
  userId: string
): Promise<NotificationSetting | NotificationSettingsFields> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch notification settings:", error);
    throw error;
  }

  // レコードが存在しない場合はデフォルト設定を返す（DBには挿入しない）
  return data ?? DEFAULT_SETTINGS;
}

/**
 * ユーザーの通知設定を更新する（UPSERT）。
 * @param userId ユーザーID
 * @param settings 更新する設定値
 */
export async function upsertNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettingsFields>
): Promise<NotificationSetting> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notification_settings")
    .upsert({ user_id: userId, ...settings }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    logger.error("Failed to upsert notification settings:", error);
    throw error;
  }

  return data as NotificationSetting;
}

/**
 * 指定した通知種別のメール通知がONかどうかを確認する。
 * レコードが存在しない場合はデフォルト（true）を返す。
 * @param userId ユーザーID
 * @param field 確認する設定フィールド名
 */
export async function isEmailNotificationEnabled(
  userId: string,
  field: keyof NotificationSettingsFields
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notification_settings")
    .select(field)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch notification setting:", error);
    // エラー時はデフォルトONとして扱う
    return true;
  }

  // レコードが存在しない場合はデフォルトON
  return (data as Record<string, boolean> | null)?.[field] ?? true;
}
