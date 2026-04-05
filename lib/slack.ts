import { logger } from "@/lib/logger";

export type SlackNotificationPayload = {
  /** Slack Incoming Webhook URL */
  webhookUrl: string;
  /** チケットタイトル */
  ticketTitle: string;
  /** チケットへのリンク */
  ticketUrl: string;
  /** 通知を発生させたユーザー名（システム発行の場合はundefined） */
  actorName?: string;
  /** 通知メッセージ本文 */
  message: string;
};

/**
 * Slack Incoming Webhook へ通知を送信する。
 * 送信失敗はエラーをスローせずにログ出力のみ行う（Slack通知は補助的な機能のため）。
 * @param payload 通知内容
 */
export async function sendSlackNotification(payload: SlackNotificationPayload): Promise<void> {
  const { webhookUrl, ticketTitle, ticketUrl, actorName, message } = payload;

  const text = actorName
    ? `*${actorName}* ${message}\n<${ticketUrl}|${ticketTitle}>`
    : `${message}\n<${ticketUrl}|${ticketTitle}>`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      logger.error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    logger.error("Failed to send Slack notification:", err);
  }
}
