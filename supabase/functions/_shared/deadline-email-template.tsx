/**
 * 期限通知メールテンプレート（複数チケット対応）
 *
 * - `default export`  : React Email コンポーネント（`npm run email:dev` でプレビュー可能）
 * - `buildDeadlineNotificationHtml()` : Edge Function からメール HTML を生成するときに呼ぶ
 */

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

// ============================================================
// 型定義
// ============================================================

export type DeadlineTicketItem = {
  ticketTitle: string;
  ticketUrl: string;
};

export type DeadlineProjectSection = {
  projectName: string;
  tickets: DeadlineTicketItem[];
};

export type DeadlineEmailData = {
  /** 受信者の username */
  recipientName: string;
  /** プロジェクト別チケットグループ（空は渡さない想定） */
  projects: DeadlineProjectSection[];
  /** 送信日時（フッターに表示） */
  sentAt: Date;
};

// ============================================================
// サンプルデータ（email:dev プレビュー用フォールバック）
// ============================================================

const sampleData: DeadlineEmailData = {
  recipientName: "山田花子",
  sentAt: new Date("2026-04-13T09:00:00+09:00"),
  projects: [
    {
      projectName: "フロントエンド改修",
      tickets: [
        {
          ticketTitle: "ログイン画面のバリデーションを修正する",
          ticketUrl: "http://localhost:3111/projects/xxx/tickets/aaa",
        },
        {
          ticketTitle: "ダッシュボードのパフォーマンス改善",
          ticketUrl: "http://localhost:3111/projects/xxx/tickets/bbb",
        },
      ],
    },
    {
      projectName: "バックエンドAPI",
      tickets: [
        {
          ticketTitle: "DBマイグレーションスクリプト作成",
          ticketUrl: "http://localhost:3111/projects/yyy/tickets/ddd",
        },
      ],
    },
  ],
};

// ============================================================
// コンポーネント
// ============================================================

function TicketRow({ ticket }: { ticket: DeadlineTicketItem }) {
  return (
    <Row style={styles.ticketRow}>
      <Column style={styles.ticketIconCol}>
        <Text style={styles.ticketIcon}>📅</Text>
      </Column>
      <Column style={styles.ticketBodyCol}>
        <Text style={styles.ticketTitle}>{ticket.ticketTitle}</Text>
        <Text style={styles.deadlineText}>本日が期限日です</Text>
      </Column>
      <Column style={styles.ticketActionCol}>
        <Button style={styles.actionButton} href={ticket.ticketUrl}>
          確認
        </Button>
      </Column>
    </Row>
  );
}

function ProjectSectionComponent({
  section,
  isFirst,
}: {
  section: DeadlineProjectSection;
  isFirst: boolean;
}) {
  return (
    <Section>
      {!isFirst && (
        <Row>
          <Column style={{ paddingTop: "24px" }} />
        </Row>
      )}
      <Row>
        <Column>
          <Text style={styles.projectHeader}>📁 {section.projectName}</Text>
        </Column>
      </Row>
      <Hr style={styles.projectDivider} />
      {section.tickets.map((ticket, i) => (
        <React.Fragment key={i}>
          <TicketRow ticket={ticket} />
        </React.Fragment>
      ))}
    </Section>
  );
}

// ============================================================
// default export: React Email プレビュー用コンポーネント
// ============================================================

export default function DeadlineNotificationEmail(props: Partial<DeadlineEmailData> = {}) {
  const data: DeadlineEmailData = { ...sampleData, ...props };
  const { recipientName, projects, sentAt } = data;
  const totalCount = projects.reduce((sum, p) => sum + p.tickets.length, 0);

  const dateStr = sentAt.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });

  const headline =
    totalCount === 1
      ? "本日が期限のチケットがあります"
      : `本日が期限のチケットが${totalCount}件あります`;

  return (
    <Html lang="ja">
      <Head />
      <Preview>{`[Flowy] ${headline}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* ヘッダー */}
          <Section style={styles.headerSection}>
            <Text style={styles.brand}>Flowy</Text>
            <Text style={styles.headline}>{headline}</Text>
            <Text style={styles.subline}>
              {recipientName}さん &nbsp;•&nbsp; {dateStr}
            </Text>
          </Section>

          <Hr style={styles.headerDivider} />

          {/* チケットセクション */}
          <Section style={styles.contentSection}>
            {projects.map((section, i) => (
              <React.Fragment key={i}>
                <ProjectSectionComponent section={section} isFirst={i === 0} />
              </React.Fragment>
            ))}
          </Section>

          {/* フッター */}
          <Hr style={styles.footerDivider} />
          <Section style={styles.footerSection}>
            <Text style={styles.footerText}>このメールは Flowy から自動送信されています。</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// named export: Edge Function からメール HTML を生成する
// ============================================================

/**
 * 期限通知メールの HTML 文字列を生成する。
 * Resend の `html` パラメータにそのまま渡せる。
 */
export async function buildDeadlineNotificationHtml(data: DeadlineEmailData): Promise<string> {
  const { render } = await import("@react-email/render");
  return render(<DeadlineNotificationEmail {...data} />);
}

// ============================================================
// スタイル
// ============================================================

const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    margin: "0",
    padding: "0",
  } as React.CSSProperties,

  container: {
    margin: "40px auto",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    maxWidth: "480px",
    overflow: "hidden" as const,
  } as React.CSSProperties,

  headerSection: {
    padding: "32px 32px 24px",
    borderTop: "4px solid #f97316",
  } as React.CSSProperties,

  brand: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#a1a1aa",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    margin: "0 0 12px",
  } as React.CSSProperties,

  headline: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#09090b",
    margin: "0 0 6px",
  } as React.CSSProperties,

  subline: {
    fontSize: "13px",
    color: "#a1a1aa",
    margin: "0",
  } as React.CSSProperties,

  headerDivider: {
    borderColor: "#e4e4e7",
    margin: "0 32px",
  } as React.CSSProperties,

  contentSection: {
    padding: "24px 32px 32px",
  } as React.CSSProperties,

  projectHeader: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#52525b",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    margin: "0 0 8px",
  } as React.CSSProperties,

  projectDivider: {
    borderColor: "#e4e4e7",
    margin: "0 0 0",
  } as React.CSSProperties,

  ticketRow: {
    borderBottom: "1px solid #f4f4f5",
  } as React.CSSProperties,

  ticketIconCol: {
    width: "24px",
    verticalAlign: "top",
    paddingTop: "12px",
  } as React.CSSProperties,

  ticketIcon: {
    fontSize: "13px",
    margin: "0",
  } as React.CSSProperties,

  ticketBodyCol: {
    verticalAlign: "top",
    padding: "12px 12px 12px 6px",
  } as React.CSSProperties,

  ticketTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#18181b",
    margin: "0 0 3px",
  } as React.CSSProperties,

  deadlineText: {
    fontSize: "13px",
    color: "#f97316",
    fontWeight: "500",
    lineHeight: "1.5",
    margin: "0",
  } as React.CSSProperties,

  ticketActionCol: {
    width: "60px",
    verticalAlign: "middle",
    textAlign: "right" as const,
    paddingLeft: "8px",
  } as React.CSSProperties,

  actionButton: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#18181b",
    backgroundColor: "#f4f4f5",
    padding: "4px 10px",
    borderRadius: "4px",
    textDecoration: "none",
  } as React.CSSProperties,

  footerDivider: {
    borderColor: "#e4e4e7",
    margin: "0 32px",
  } as React.CSSProperties,

  footerSection: {
    padding: "16px 32px 28px",
  } as React.CSSProperties,

  footerText: {
    fontSize: "12px",
    color: "#a1a1aa",
    lineHeight: "1.6",
    margin: "0",
  } as React.CSSProperties,
};
