import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getWatcherEmails } from "@/lib/supabase/watches";
import { sendSlackNotification, type SlackNotificationPayload } from "@/lib/slack";

export async function sendSlackNotificationToUser(
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

/**
 * ウォッチ中のユーザー全員へ Slack 通知を送信する
 * Webhook URL が設定されているユーザーのみに送信する
 */
export async function sendSlackNotificationToWatchers(
  ticketId: string,
  actorId: string,
  payload: Omit<SlackNotificationPayload, "webhookUrl">
): Promise<void> {
  try {
    const supabase = await createClient();
    const watchers = await getWatcherEmails(ticketId, actorId);

    if (watchers.length === 0) return;

    const watcherIds = watchers.map((w) => w.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, slack_webhook_url")
      .in("id", watcherIds);

    const watchersWithWebhook = (profiles ?? []).filter(
      (p): p is { id: string; slack_webhook_url: string } => !!p.slack_webhook_url
    );

    await Promise.all(
      watchersWithWebhook.map(async ({ slack_webhook_url }) => {
        try {
          await sendSlackNotification({
            ...payload,
            webhookUrl: slack_webhook_url,
          } as SlackNotificationPayload);
        } catch (err) {
          logger.warn("Failed to send Slack notification to watcher:", err);
        }
      })
    );
  } catch (err) {
    logger.warn("Failed to send Slack notifications to watchers:", err);
  }
}

/**
 * 通知に必要なコンテキスト（チケット情報・操作者名・チケットURL）を取得する
 */
export async function fetchNotificationContext(
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
