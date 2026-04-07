/**
 * Resend にメールテンプレートを push するスクリプト。
 *
 * 使い方:
 *   npm run push:templates
 *
 * 実行後に出力される Template ID を .env.local と
 * supabase/functions/.env の RESEND_DEADLINE_TEMPLATE_ID に設定してください。
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local を読み込む
config({ path: resolve(process.cwd(), ".env.local") });

import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import DeadlineEmail, { templateMeta, PLACEHOLDERS } from "../emails/deadline";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Flowy <noreply@resend.dev>";

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY が設定されていません (.env.local を確認してください)");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

/** プレースホルダーを Resend の Handlebars 構文 {{{VAR}}} に置換する */
function applyHandlebars(html: string): string {
  let result = html;
  for (const [key, placeholder] of Object.entries(PLACEHOLDERS)) {
    result = result.replaceAll(placeholder, `{{{${key}}}}`);
  }
  return result;
}

async function pushTemplates() {
  console.log("📧 期限通知テンプレートを Resend に push しています...");

  // プレースホルダー値でレンダリング
  const rawHtml = await render(
    React.createElement(DeadlineEmail, {
      assigneeUsername: PLACEHOLDERS.ASSIGNEE_USERNAME,
      ticketTitle: PLACEHOLDERS.TICKET_TITLE,
      ticketUrl: PLACEHOLDERS.TICKET_URL,
      projectName: PLACEHOLDERS.PROJECT_NAME,
    })
  );

  // プレースホルダーを {{{VAR}}} に変換
  const html = applyHandlebars(rawHtml);

  // テンプレートを作成して即公開（emails/deadline.tsx のメタ情報を使用）
  const result = await resend.templates
    .create({
      ...templateMeta,
      from: RESEND_FROM_EMAIL,
      html,
    })
    .publish();

  if (result.error) {
    throw new Error(`テンプレートの公開に失敗しました: ${result.error.message}`);
  }

  const templateId = result.data?.id;

  console.log(`✓ テンプレートを公開しました`);
  console.log(`\n以下を各 .env ファイルに追加してください:`);
  console.log(`  RESEND_DEADLINE_TEMPLATE_ID=${templateId}`);
  console.log(`\n対象ファイル:`);
  console.log(`  - .env.local`);
  console.log(`  - supabase/functions/.env`);
}

pushTemplates().catch((err) => {
  console.error("Push failed:", err);
  process.exit(1);
});
