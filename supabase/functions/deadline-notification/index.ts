/// <reference types="@supabase/functions-js" />
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "Flowy <noreply@resend.dev>";
const RESEND_DEADLINE_TEMPLATE_ID = Deno.env.get("RESEND_DEADLINE_TEMPLATE_ID") ?? "";
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3111";

Deno.serve(async (_req) => {
  try {
    console.log("[deadline-notification] 処理を開始します");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // JST の今日の日付を取得（UTC+9）
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(Date.now() + jstOffset);
    const today = jstNow.toISOString().split("T")[0]; // "YYYY-MM-DD"
    console.log(`[deadline-notification] 本日の日付: ${today}`);

    // 当日が期限のチケット（完了以外・担当者あり）を取得
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

    let processed = 0;

    for (const ticket of tickets) {
      const assignee = ticket.assignee as {
        id: string;
        email: string;
        username: string;
        slack_webhook_url: string | null;
      } | null;
      const project = ticket.projects as { name: string } | null;

      if (!assignee || !project) {
        console.warn(
          `[deadline-notification] スキップ: チケットID=${ticket.id} (担当者またはプロジェクト情報が不足)`
        );
        continue;
      }

      console.log(
        `[deadline-notification] チケット処理開始: ID=${ticket.id}, タイトル="${ticket.title}", 担当者=${assignee.username}`
      );

      // deadline 通知レコードを挿入
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: assignee.id,
        actor_id: null,
        ticket_id: ticket.id,
        type: "deadline",
      });
      if (notifyError) {
        console.error(`Failed to insert notification for ticket ${ticket.id}:`, notifyError);
      } else {
        console.log(`[deadline-notification] 通知レコード挿入: チケットID=${ticket.id}`);
      }

      const ticketUrl = `${APP_URL}/projects/${ticket.project_id}/tickets/${ticket.id}`;

      // 通知設定を確認（メール通知）
      const { data: settings } = await supabase
        .from("notification_settings")
        .select("email_deadline")
        .eq("user_id", assignee.id)
        .maybeSingle();

      const emailEnabled = (settings as { email_deadline: boolean } | null)?.email_deadline ?? true;

      if (emailEnabled && RESEND_API_KEY && RESEND_DEADLINE_TEMPLATE_ID) {
        await sendDeadlineEmail({
          to: assignee.email,
          variables: {
            ASSIGNEE_USERNAME: assignee.username,
            TICKET_TITLE: ticket.title,
            TICKET_URL: ticketUrl,
            PROJECT_NAME: project.name,
          },
        });
      }

      // Slack 通知（Webhook URL が設定されている場合のみ）
      if (assignee.slack_webhook_url) {
        await sendSlackNotification({
          webhookUrl: assignee.slack_webhook_url,
          ticketTitle: ticket.title,
          ticketUrl,
        });
      }

      processed++;
    }

    console.log(
      `[deadline-notification] 処理完了: ${processed}/${tickets.length} 件の通知を送信しました`
    );

    return new Response(JSON.stringify({ processed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("deadline-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// --- メール送信（Resend テンプレート使用） ---

async function sendDeadlineEmail(params: {
  to: string;
  variables: {
    ASSIGNEE_USERNAME: string;
    TICKET_TITLE: string;
    TICKET_URL: string;
    PROJECT_NAME: string;
  };
}) {
  const { to, variables } = params;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to,
        template: {
          id: RESEND_DEADLINE_TEMPLATE_ID,
          variables,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Failed to send email to ${to}: ${response.status} ${body}`);
    }
  } catch (err) {
    console.error(`Error sending email to ${to}:`, err);
  }
}

// --- Slack 通知 ---

async function sendSlackNotification(params: {
  webhookUrl: string;
  ticketTitle: string;
  ticketUrl: string;
}) {
  const { webhookUrl, ticketTitle, ticketUrl } = params;
  const text = `本日が期限のチケットがあります\n<${ticketUrl}|${ticketTitle}>`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    console.error("Failed to send Slack notification:", err);
  }
}
