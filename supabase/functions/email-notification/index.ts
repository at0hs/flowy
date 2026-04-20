/// <reference types="@supabase/functions-js" />
import { createClient } from "@supabase/supabase-js";
import {
  buildBatchNotificationHtml,
  type BatchEmailData,
  type NotificationItem,
  type NotificationType,
  type ProjectSection,
} from "../_shared/notification-email-template.tsx";

// ============================================================
// 環境変数
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "Flowy <noreply@resend.dev>";
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3111";

// ============================================================
// 定数
// ============================================================

const STATUS_LABELS: Record<string, string> = {
  todo: "TODO",
  in_progress: "進行中",
  done: "完了",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};

// ============================================================
// 型定義
// ============================================================

type NotificationSettings = {
  email_assigned: boolean;
  email_assignee_changed: boolean;
  email_comment_added: boolean;
  email_mention: boolean;
  email_priority_changed: boolean;
  email_status_changed: boolean;
};

type RawNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  // deno-lint-ignore no-explicit-any
  metadata: Record<string, any> | null;
  created_at: string;
  recipient: { email: string; username: string } | null;
  ticket: {
    id: string;
    title: string;
    project_id: string;
    project: { name: string } | null;
  } | null;
  actor: { username: string } | null;
};

// ============================================================
// ヘルパー
// ============================================================

/**
 * 通知種別とメタデータから表示テキストを生成する
 */
function buildDisplayText(
  type: NotificationType,
  // deno-lint-ignore no-explicit-any
  metadata: Record<string, any> | null
): string {
  switch (type) {
    case "assigned":
      return "担当者に割り当てました";
    case "assignee_changed":
      return "担当者を変更しました";
    case "comment_added":
      return "コメントしました";
    case "status_changed": {
      const oldLabel =
        STATUS_LABELS[String(metadata?.old_status ?? "")] ?? String(metadata?.old_status ?? "");
      const newLabel =
        STATUS_LABELS[String(metadata?.new_status ?? "")] ?? String(metadata?.new_status ?? "");
      return oldLabel && newLabel
        ? `ステータスを ${oldLabel} → ${newLabel} に変更しました`
        : "ステータスを変更しました";
    }
    case "priority_changed": {
      const oldLabel =
        PRIORITY_LABELS[String(metadata?.old_priority ?? "")] ??
        String(metadata?.old_priority ?? "");
      const newLabel =
        PRIORITY_LABELS[String(metadata?.new_priority ?? "")] ??
        String(metadata?.new_priority ?? "");
      return oldLabel && newLabel
        ? `優先度を ${oldLabel} → ${newLabel} に変更しました`
        : "優先度を変更しました";
    }
    case "mention":
      return "コメントでメンションしました";
    default:
      return "通知があります";
  }
}

/**
 * 通知設定を参照して、指定種別のメール通知が有効かどうかを返す
 * 設定レコードが存在しない場合はデフォルトで有効とする
 */
function isEmailEnabled(type: NotificationType, settings: NotificationSettings | null): boolean {
  if (!settings) return true;
  const map: Partial<Record<NotificationType, keyof NotificationSettings>> = {
    assigned: "email_assigned",
    assignee_changed: "email_assignee_changed",
    comment_added: "email_comment_added",
    mention: "email_mention",
    priority_changed: "email_priority_changed",
    status_changed: "email_status_changed",
  };
  const key = map[type];
  return key !== undefined ? (settings[key] ?? true) : true;
}

/**
 * Resend API でメールを送信する
 */
async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const { to, subject, html } = params;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API エラー: ${response.status} ${body}`);
  }
}

// ============================================================
// メインハンドラー
// ============================================================

Deno.serve(async (_req) => {
  try {
    console.log("[email-notification] 処理を開始します");

    if (!RESEND_API_KEY) {
      console.warn("[email-notification] RESEND_API_KEY が未設定のためスキップします");
      return new Response(JSON.stringify({ skipped: true, reason: "RESEND_API_KEY not set" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ----------------------------------------------------------------
    // 1. email_sent_at が NULL の通知を全件取得（関連情報を JOIN）
    // ----------------------------------------------------------------
    const { data: rawRows, error: fetchError } = await supabase
      .from("notifications")
      .select(
        `
        id,
        user_id,
        type,
        metadata,
        created_at,
        recipient:profiles!notifications_user_id_fkey(email, username),
        ticket:tickets(
          id,
          title,
          project_id,
          project:projects(name)
        ),
        actor:profiles!notifications_actor_id_fkey(username)
      `
      )
      .is("email_sent_at", null)
      .eq("is_read", false)
      .neq("type", "deadline")
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    if (!rawRows || rawRows.length === 0) {
      console.log("[email-notification] 未送信の通知はありません");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[email-notification] 未送信通知を ${rawRows.length} 件取得しました`);

    // ----------------------------------------------------------------
    // 2. ユーザー単位でグループ化
    // ----------------------------------------------------------------
    const byUser = new Map<string, RawNotification[]>();
    for (const row of rawRows as RawNotification[]) {
      if (!row.recipient) {
        console.warn(`[email-notification] recipient が取得できないためスキップ: id=${row.id}`);
        continue;
      }
      const existing = byUser.get(row.user_id) ?? [];
      existing.push(row);
      byUser.set(row.user_id, existing);
    }

    let processedUsers = 0;
    let sentCount = 0;

    // ----------------------------------------------------------------
    // 3. ユーザーごとに処理
    // ----------------------------------------------------------------
    for (const [userId, notifications] of byUser) {
      const recipient = notifications[0].recipient!;
      console.log(
        `[email-notification] ユーザー処理開始: userId=${userId}, username=${recipient.username}, 通知数=${notifications.length}`
      );

      // 3a. notification_settings を取得
      const { data: settingsRow } = await supabase
        .from("notification_settings")
        .select(
          "email_assigned, email_assignee_changed, email_comment_added, email_mention, email_priority_changed, email_status_changed"
        )
        .eq("user_id", userId)
        .maybeSingle();

      const settings = settingsRow as NotificationSettings | null;

      // 3b. 通知設定OFFの種別を除外
      const filtered = notifications.filter((n) => isEmailEnabled(n.type, settings));

      if (filtered.length === 0) {
        console.log(
          `[email-notification] 有効な通知なし（全種別がOFF）のためスキップ: userId=${userId}`
        );
        // email_sent_at を記録してスキップ扱いにする（再処理されないよう）
        const ids = notifications.map((n) => n.id);
        await supabase
          .from("notifications")
          .update({ email_sent_at: new Date().toISOString() })
          .in("id", ids);
        continue;
      }

      // 3c. プロジェクト単位でグループ化
      const byProject = new Map<string, { projectName: string; items: NotificationItem[] }>();

      for (const n of filtered) {
        const projectId = n.ticket?.project_id ?? "__no_project__";
        const projectName = n.ticket?.project?.name ?? "（プロジェクト不明）";
        const ticketTitle = n.ticket?.title ?? "（チケット不明）";
        const ticketUrl = n.ticket
          ? `${APP_URL}/projects/${n.ticket.project_id}/tickets/${n.ticket.id}`
          : APP_URL;

        const item: NotificationItem = {
          type: n.type,
          ticketTitle,
          ticketUrl,
          actorName: n.actor?.username ?? null,
          displayText: buildDisplayText(n.type, n.metadata),
        };

        const existing = byProject.get(projectId) ?? { projectName, items: [] };
        existing.items.push(item);
        byProject.set(projectId, existing);
      }

      const projects: ProjectSection[] = Array.from(byProject.values()).map(
        ({ projectName, items }) => ({ projectName, notifications: items })
      );

      const totalCount = filtered.length;

      // 3d. メール HTML を生成
      const emailData: BatchEmailData = {
        recipientName: recipient.username,
        projects,
        sentAt: new Date(),
      };

      let html: string;
      try {
        html = await buildBatchNotificationHtml(emailData);
      } catch (renderErr) {
        console.error(`[email-notification] HTMLレンダリングエラー: userId=${userId}`, renderErr);
        continue;
      }

      // 3e. メール送信
      const subject = `[Flowy] ${totalCount}件の通知があります`;
      try {
        await sendEmail({ to: recipient.email, subject, html });
        console.log(
          `[email-notification] メール送信成功: to=${recipient.email}, 件数=${totalCount}`
        );
      } catch (sendErr) {
        console.error(`[email-notification] メール送信エラー: to=${recipient.email}`, sendErr);
        continue;
      }

      // 3f. email_sent_at を記録
      const sentIds = filtered.map((n) => n.id);
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ email_sent_at: new Date().toISOString() })
        .in("id", sentIds);

      if (updateError) {
        console.error(
          `[email-notification] email_sent_at 更新エラー: userId=${userId}`,
          updateError
        );
      } else {
        console.log(`[email-notification] email_sent_at を記録: ${sentIds.length} 件`);
      }

      processedUsers++;
      sentCount += totalCount;
    }

    console.log(`[email-notification] 処理完了: ${processedUsers} ユーザー / ${sentCount} 通知`);

    return new Response(
      JSON.stringify({ processed: processedUsers, sentNotifications: sentCount }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[email-notification] 予期しないエラー:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
