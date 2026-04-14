/// <reference types="@supabase/functions-js" />
import { createClient } from "@supabase/supabase-js";
import {
  buildDeadlineNotificationHtml,
  type DeadlineEmailData,
  type DeadlineProjectSection,
  type DeadlineTicketItem,
} from "../_shared/deadline-email-template.tsx";

// ============================================================
// 環境変数
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "Flowy <noreply@resend.dev>";
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3111";

// ============================================================
// 型定義
// ============================================================

type AssigneeInfo = {
  id: string;
  email: string;
  username: string;
  slack_webhook_url: string | null;
};

type ProjectInfo = {
  name: string;
};

/** ユーザーごとの集計データ */
type UserEmailData = {
  assignee: AssigneeInfo;
  /** 通知レコードの ID 一覧（email_sent_at 更新に使用） */
  notificationIds: string[];
  /** プロジェクト ID → プロジェクト名 + チケット一覧 */
  ticketsByProject: Map<string, { projectName: string; tickets: DeadlineTicketItem[] }>;
};

// ============================================================
// ヘルパー
// ============================================================

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

/**
 * Slack Webhook に期限通知を送信する
 */
async function sendSlackNotification(params: {
  webhookUrl: string;
  ticketTitle: string;
  ticketUrl: string;
  projectName: string;
  assigneeUsername: string;
  dueDate: string;
}) {
  const { webhookUrl, ticketTitle, ticketUrl, projectName, assigneeUsername, dueDate } = params;

  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📅 チケット期限通知",
          emoji: true,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "plain_text",
          text: `${projectName}/${ticketTitle}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*期限日*\n${dueDate}`,
          },
          {
            type: "mrkdwn",
            text: `*担当者*\n${assigneeUsername}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "チケットを開く",
              emoji: true,
            },
            url: ticketUrl,
            style: "primary",
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    console.error("Failed to send Slack notification:", err);
  }
}

// ============================================================
// メインハンドラー
// ============================================================

Deno.serve(async (_req) => {
  try {
    console.log("[deadline-notification] 処理を開始します");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // JST の今日の日付を取得（UTC+9）
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(Date.now() + jstOffset);
    const today = jstNow.toISOString().split("T")[0]; // "YYYY-MM-DD"
    console.log(`[deadline-notification] 本日の日付: ${today}`);

    // ----------------------------------------------------------------
    // 1. 当日が期限のチケット（完了以外・担当者あり）を取得
    // ----------------------------------------------------------------
    const { data: tickets, error: fetchError } = await supabase
      .from("tickets")
      .select(
        `
        id,
        title,
        project_id,
        projects!inner(name),
        assignee:profiles!tickets_assignee_id_fkey(id, email, username, slack_webhook_url)
      `
      )
      .eq("due_date", today)
      .neq("status", "done")
      .not("assignee_id", "is", null);

    if (fetchError) throw fetchError;

    if (!tickets || tickets.length === 0) {
      console.log("[deadline-notification] 期限のチケットはありません");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[deadline-notification] 期限のチケットを${tickets.length}件取得しました`);

    // ----------------------------------------------------------------
    // 2. チケットごとに通知レコードを挿入・Slack 通知、担当者単位で集計
    // ----------------------------------------------------------------
    const byUser = new Map<string, UserEmailData>();
    let processed = 0;

    for (const ticket of tickets) {
      const assignee = ticket.assignee as unknown as AssigneeInfo | null;
      const project = ticket.projects as unknown as ProjectInfo | null;

      if (!assignee || !project) {
        console.warn(
          `[deadline-notification] スキップ: チケットID=${ticket.id} (担当者またはプロジェクト情報が不足)`
        );
        continue;
      }

      console.log(
        `[deadline-notification] チケット処理開始: ID=${ticket.id}, タイトル="${ticket.title}", 担当者=${assignee.username}`
      );

      // 通知レコード挿入（ID を取得して後で email_sent_at を更新する）
      const { data: notifData, error: notifyError } = await supabase
        .from("notifications")
        .insert({
          user_id: assignee.id,
          actor_id: null,
          ticket_id: ticket.id,
          type: "deadline",
        })
        .select("id")
        .single();

      if (notifyError) {
        console.error(
          `[deadline-notification] 通知レコード挿入エラー: チケットID=${ticket.id}`,
          notifyError
        );
        // 挿入失敗してもSlack通知とカウントは継続
      } else {
        console.log(`[deadline-notification] 通知レコード挿入: チケットID=${ticket.id}`);
      }

      // Slack 通知（Webhook URL が設定されている場合のみ）
      const ticketUrl = `${APP_URL}/projects/${ticket.project_id}/tickets/${ticket.id}`;
      if (assignee.slack_webhook_url) {
        await sendSlackNotification({
          webhookUrl: assignee.slack_webhook_url,
          ticketTitle: ticket.title,
          ticketUrl,
          projectName: project.name,
          assigneeUsername: assignee.username,
          dueDate: today,
        });
      }

      // メール送信用にユーザー単位で集計
      const userData: UserEmailData = byUser.get(assignee.id) ?? {
        assignee,
        notificationIds: [],
        ticketsByProject: new Map(),
      };

      if (notifData?.id) {
        userData.notificationIds.push(notifData.id);
      }

      const projectData = userData.ticketsByProject.get(ticket.project_id) ?? {
        projectName: project.name,
        tickets: [] as DeadlineTicketItem[],
      };
      projectData.tickets.push({ ticketTitle: ticket.title, ticketUrl });
      userData.ticketsByProject.set(ticket.project_id, projectData);
      byUser.set(assignee.id, userData);

      processed++;
    }

    console.log(`[deadline-notification] 通知レコード挿入完了: ${processed} 件`);

    // ----------------------------------------------------------------
    // 3. 担当者ごとにメールを1通送信
    // ----------------------------------------------------------------
    if (!RESEND_API_KEY) {
      console.warn(
        "[deadline-notification] RESEND_API_KEY が未設定のためメール送信をスキップします"
      );
    } else {
      for (const [userId, userData] of byUser) {
        const { assignee, notificationIds, ticketsByProject } = userData;

        // 通知設定を確認（メール通知）
        const { data: settings } = await supabase
          .from("notification_settings")
          .select("email_deadline")
          .eq("user_id", userId)
          .maybeSingle();

        const emailEnabled =
          (settings as { email_deadline: boolean } | null)?.email_deadline ?? true;

        if (!emailEnabled) {
          console.log(`[deadline-notification] メール通知OFF: userId=${userId} のためスキップ`);
          // email-notification バッチが拾わないよう email_sent_at を記録
          if (notificationIds.length > 0) {
            await supabase
              .from("notifications")
              .update({ email_sent_at: new Date().toISOString() })
              .in("id", notificationIds);
          }
          continue;
        }

        // DeadlineEmailData を組み立て
        const projects: DeadlineProjectSection[] = Array.from(ticketsByProject.values()).map(
          ({ projectName, tickets }) => ({ projectName, tickets })
        );

        const totalCount = projects.reduce((sum, p) => sum + p.tickets.length, 0);

        const emailData: DeadlineEmailData = {
          recipientName: assignee.username,
          projects,
          sentAt: new Date(),
        };

        // HTML 生成
        let html: string;
        try {
          html = await buildDeadlineNotificationHtml(emailData);
        } catch (renderErr) {
          console.error(
            `[deadline-notification] HTMLレンダリングエラー: userId=${userId}`,
            renderErr
          );
          continue;
        }

        // メール送信
        const subject =
          totalCount === 1
            ? `[Flowy] 本日が期限のチケットがあります`
            : `[Flowy] 本日が期限のチケットが${totalCount}件あります`;

        try {
          await sendEmail({ to: assignee.email, subject, html });
          console.log(
            `[deadline-notification] メール送信成功: to=${assignee.email}, 件数=${totalCount}`
          );
        } catch (sendErr) {
          console.error(`[deadline-notification] メール送信エラー: to=${assignee.email}`, sendErr);
          continue;
        }

        // email_sent_at を記録（email-notification バッチによる二重送信を防止）
        if (notificationIds.length > 0) {
          const { error: updateError } = await supabase
            .from("notifications")
            .update({ email_sent_at: new Date().toISOString() })
            .in("id", notificationIds);

          if (updateError) {
            console.error(
              `[deadline-notification] email_sent_at 更新エラー: userId=${userId}`,
              updateError
            );
          } else {
            console.log(
              `[deadline-notification] email_sent_at を記録: ${notificationIds.length} 件`
            );
          }
        }
      }
    }

    console.log(
      `[deadline-notification] 処理完了: ${processed}/${tickets.length} 件の通知を処理しました`
    );

    return new Response(JSON.stringify({ processed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[deadline-notification] 予期しないエラー:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
