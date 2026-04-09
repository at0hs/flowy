import { logger } from "@/lib/logger";

/** Slack 通知ペイロードの共通フィールド */
type SlackBasePayload = {
  webhookUrl: string;
  ticketTitle: string;
  ticketUrl: string;
  actorName: string;
  projectName: string;
};

/** 通知タイプ別の追加フィールド */
export type SlackNotificationPayload =
  | (SlackBasePayload & { type: "assigned"; oldAssigneeName?: string })
  | (SlackBasePayload & { type: "assignee_changed"; oldValue: string; newValue: string })
  | (SlackBasePayload & { type: "status_changed"; oldValue: string; newValue: string })
  | (SlackBasePayload & { type: "priority_changed"; oldValue: string; newValue: string })
  | (SlackBasePayload & { type: "comment_added"; commentBody?: string })
  | (SlackBasePayload & { type: "mention"; commentBody?: string });

/**
 * 通知タイプに応じたタイトルテキストを生成する（「◯◯さんが〜しました。」形式）
 */
function getTitleText(payload: SlackNotificationPayload): string {
  switch (payload.type) {
    case "assigned":
      return `👤 ${payload.actorName}さんが担当者に割り当てました。`;
    case "assignee_changed":
      return `👤 ${payload.actorName}さんが担当者を変更しました。`;
    case "status_changed":
      return `📊 ${payload.actorName}さんがステータスを変更しました。`;
    case "priority_changed":
      return `🔴 ${payload.actorName}さんが優先度を変更しました。`;
    case "comment_added":
      return `💬 ${payload.actorName}さんがコメントを投稿しました。`;
    case "mention":
      return `🔔 ${payload.actorName}さんがコメントでメンションしました。`;
    default:
      return "🔔 チケット通知";
  }
}

/**
 * 通知タイプに応じた引用ブロックのテキストを生成する
 */
function getQuoteText(payload: SlackNotificationPayload): string | null {
  switch (payload.type) {
    case "assigned":
      return `> 前担当者\n> ${payload.oldAssigneeName ?? "なし"}`;
    case "assignee_changed":
      return `> 担当者\n> ${payload.oldValue} → ${payload.newValue}`;
    case "status_changed":
      return `> ステータス\n> ${payload.oldValue} → ${payload.newValue}`;
    case "priority_changed":
      return `> 優先度\n> ${payload.oldValue} → ${payload.newValue}`;
    case "comment_added":
      return payload.commentBody ? `> コメント\n> ${payload.commentBody.substring(0, 100)}` : null;
    case "mention":
      return payload.commentBody ? `> コメント\n> ${payload.commentBody.substring(0, 100)}` : null;
    default:
      return null;
  }
}

/**
 * 通知用 Block Kit ペイロードを生成する
 */
function buildBlockKitPayload(payload: SlackNotificationPayload): Record<string, unknown> {
  const quoteText = getQuoteText(payload);

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: getTitleText(payload), emoji: true },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${payload.ticketUrl}|${payload.projectName} / ${payload.ticketTitle}>`,
      },
    },
  ];

  if (quoteText) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: quoteText },
    });
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "チケットを開く", emoji: true },
        url: payload.ticketUrl,
        style: "primary",
      },
    ],
  });

  return { blocks };
}

/**
 * Slack Incoming Webhook へ通知を送信する。
 * 送信失敗はエラーをスローせずにログ出力のみ行う（Slack通知は補助的な機能のため）。
 * @param payload 通知内容（Block Kit形式）
 */
export async function sendSlackNotification(payload: SlackNotificationPayload): Promise<void> {
  const { webhookUrl } = payload;

  try {
    const blockKitPayload = buildBlockKitPayload(payload);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockKitPayload),
    });

    if (!response.ok) {
      logger.warn(
        `Slack notification failed: ${response.status} ${response.statusText} (${payload.type})`
      );
    }
  } catch (err) {
    logger.warn(`Failed to send Slack notification (${payload.type}):`, err);
  }
}
