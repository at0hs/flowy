/**
 * バッチ通知メールテンプレート
 *
 * - `default export`  : React Email コンポーネント（`npm run email:dev` でプレビュー可能）
 * - `buildBatchNotificationHtml()` : Edge Function からメール HTML を生成するときに呼ぶ
 *
 * emails/batch-notification.tsx はこのファイルへのシンボリックリンクです。
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

export type NotificationType =
  | "assigned"
  | "assignee_changed"
  | "comment_added"
  | "status_changed"
  | "priority_changed"
  | "mention"
  | "deadline";

export type NotificationItem = {
  type: NotificationType;
  ticketTitle: string;
  ticketUrl: string;
  /** 操作したユーザーの username。deadline 等 actor がない場合は null */
  actorName: string | null;
  /**
   * 通知の説明文（Edge Function 側で生成して渡す）
   * 例: "ステータスを TODO → 進行中 に変更しました"
   */
  displayText: string;
};

export type ProjectSection = {
  projectName: string;
  notifications: NotificationItem[];
};

export type BatchEmailData = {
  /** 受信者の username */
  recipientName: string;
  /** プロジェクト別通知グループ（空は渡さない想定） */
  projects: ProjectSection[];
  /** 送信日時（フッターに表示） */
  sentAt: Date;
};

// ============================================================
// サンプルデータ（email:dev プレビュー用フォールバック）
// ============================================================

const sampleData: BatchEmailData = {
  recipientName: "山田花子",
  sentAt: new Date("2026-04-13T09:00:00+09:00"),
  projects: [
    {
      projectName: "フロントエンド改修",
      notifications: [
        {
          type: "assigned",
          ticketTitle: "ログイン画面のバリデーションを修正する",
          ticketUrl: "http://localhost:3111/projects/xxx/tickets/aaa",
          actorName: "田中太郎",
          displayText: "担当者に割り当てました",
        },
        {
          type: "status_changed",
          ticketTitle: "ダッシュボードのパフォーマンス改善",
          ticketUrl: "http://localhost:3111/projects/xxx/tickets/bbb",
          actorName: "鈴木一郎",
          displayText: "ステータスを TODO → 進行中 に変更しました",
        },
        {
          type: "comment_added",
          ticketTitle: "ログイン画面のバリデーションを修正する",
          ticketUrl: "http://localhost:3111/projects/xxx/tickets/aaa",
          actorName: "田中太郎",
          displayText: "コメントしました",
        },
      ],
    },
    {
      projectName: "バックエンドAPI",
      notifications: [
        {
          type: "priority_changed",
          ticketTitle: "認証トークンのリフレッシュ処理",
          ticketUrl: "http://localhost:3111/projects/yyy/tickets/ccc",
          actorName: "佐藤次郎",
          displayText: "優先度を 中 → 高 に変更しました",
        },
        {
          type: "deadline",
          ticketTitle: "DBマイグレーションスクリプト作成",
          ticketUrl: "http://localhost:3111/projects/yyy/tickets/ddd",
          actorName: null,
          displayText: "本日が期限日です",
        },
        {
          type: "mention",
          ticketTitle: "セキュリティ監査対応",
          ticketUrl: "http://localhost:3111/projects/yyy/tickets/eee",
          actorName: "山本三郎",
          displayText: "コメントでメンションしました",
        },
      ],
    },
  ],
};

// ============================================================
// ヘルパー
// ============================================================

function getTypeIcon(type: NotificationType): string {
  switch (type) {
    case "assigned":
      return "→";
    case "assignee_changed":
      return "⇄";
    case "comment_added":
      return "□";
    case "status_changed":
      return "○";
    case "priority_changed":
      return "△";
    case "mention":
      return "@";
    case "deadline":
      return "⏰";
    default:
      return "•";
  }
}

// ============================================================
// コンポーネント
// ============================================================

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <Row style={styles.notificationRow}>
      <Column style={styles.notificationIconCol}>
        <Text style={styles.notificationIcon}>{getTypeIcon(item.type)}</Text>
      </Column>
      <Column style={styles.notificationBodyCol}>
        <Text style={styles.ticketTitle}>{item.ticketTitle}</Text>
        <Text style={styles.notificationText}>
          {item.actorName &&
            React.createElement("span", { style: styles.actorName }, item.actorName)}
          {item.actorName && " "}
          {item.displayText}
        </Text>
      </Column>
      <Column style={styles.notificationActionCol}>
        <Button style={styles.actionButton} href={item.ticketUrl}>
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
  section: ProjectSection;
  isFirst: boolean;
}) {
  return (
    <Section>
      {/* セクション間の余白は Row で確保（Section への marginTop はレイアウト崩れの原因になる） */}
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
      {section.notifications.map((item, i) => (
        <React.Fragment key={i}>
          <NotificationRow item={item} />
        </React.Fragment>
      ))}
    </Section>
  );
}

// ============================================================
// default export: React Email プレビュー用コンポーネント
// ============================================================

export default function BatchNotificationEmail(props: Partial<BatchEmailData> = {}) {
  const data: BatchEmailData = { ...sampleData, ...props };
  const { recipientName, projects, sentAt } = data;
  const totalCount = projects.reduce((sum, p) => sum + p.notifications.length, 0);

  const dateStr = sentAt.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });

  return (
    <Html lang="ja">
      <Head />
      <Preview>{`[Flowy] ${totalCount}件の通知があります`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* ヘッダー */}
          <Section style={styles.headerSection}>
            <Text style={styles.brand}>Flowy</Text>
            <Text style={styles.headline}>{totalCount}件の通知があります</Text>
            <Text style={styles.subline}>
              {recipientName}さん &nbsp;•&nbsp; {dateStr}
            </Text>
          </Section>

          <Hr style={styles.headerDivider} />

          {/* 通知セクション */}
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
 * バッチ通知メールの HTML 文字列を生成する。
 * Resend の `html` パラメータにそのまま渡せる。
 */
export async function buildBatchNotificationHtml(data: BatchEmailData): Promise<string> {
  const { render } = await import("@react-email/render");
  return render(<BatchNotificationEmail {...data} />);
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

  notificationRow: {
    borderBottom: "1px solid #f4f4f5",
  } as React.CSSProperties,

  notificationIconCol: {
    width: "24px",
    verticalAlign: "top",
    paddingTop: "12px",
  } as React.CSSProperties,

  notificationIcon: {
    fontSize: "13px",
    color: "#a1a1aa",
    margin: "0",
  } as React.CSSProperties,

  notificationBodyCol: {
    verticalAlign: "top",
    padding: "12px 12px 12px 6px",
  } as React.CSSProperties,

  ticketTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#18181b",
    margin: "0 0 3px",
  } as React.CSSProperties,

  notificationText: {
    fontSize: "13px",
    color: "#71717a",
    lineHeight: "1.5",
    margin: "0",
  } as React.CSSProperties,

  actorName: {
    fontWeight: "600",
    color: "#52525b",
  } as React.CSSProperties,

  notificationActionCol: {
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
