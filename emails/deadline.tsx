import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// --- テンプレートメタ情報（push スクリプトから参照） ---

export const templateMeta = {
  name: "flowy-deadline-notification",
  subject: "[Flowy] 期限が近いチケットがあります",
  variables: [
    { key: "ASSIGNEE_USERNAME", type: "string" as const, fallbackValue: "担当者" },
    { key: "TICKET_TITLE", type: "string" as const, fallbackValue: "チケット" },
    { key: "TICKET_URL", type: "string" as const, fallbackValue: "" },
    { key: "PROJECT_NAME", type: "string" as const, fallbackValue: "プロジェクト" },
  ],
};

/**
 * React Email のレンダリング時に使うプレースホルダー。
 * push スクリプトがこれを Resend の {{{VAR}}} 構文に置換する。
 */
export const PLACEHOLDERS = {
  ASSIGNEE_USERNAME: "__ASSIGNEE_USERNAME__",
  TICKET_TITLE: "__TICKET_TITLE__",
  TICKET_URL: "__TICKET_URL__",
  PROJECT_NAME: "__PROJECT_NAME__",
} as const;

// --- コンポーネント ---

interface DeadlineEmailProps {
  assigneeUsername: string;
  ticketTitle: string;
  ticketUrl: string;
  projectName: string;
}

export default function DeadlineEmail({
  assigneeUsername = "担当者",
  ticketTitle = "ログイン画面のバリデーションを修正する",
  ticketUrl = "http://localhost:3111/projects/xxx/tickets/yyy",
  projectName = "サンプルプロジェクト",
}: DeadlineEmailProps) {
  return (
    <Html lang="ja">
      <Head />
      <Preview>[Flowy] 「{ticketTitle}」の期限は本日です</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Flowy</Text>

          <Heading style={heading}>チケットの期限が来ています</Heading>
          <Text style={projectLabel}>{projectName}</Text>

          <Text style={paragraph}>
            {assigneeUsername} さん、「<strong>{ticketTitle}</strong>」の期限が本日です。
          </Text>

          <Section style={ticketBox}>
            <Text style={ticketLabel}>チケット</Text>
            <Text style={ticketValue}>{ticketTitle}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={ticketUrl}>
              チケットを確認する
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>このメールは Flowy から自動送信されています。</Text>
        </Container>
      </Body>
    </Html>
  );
}

// --- スタイル ---

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const container: React.CSSProperties = {
  margin: "40px auto",
  padding: "32px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  maxWidth: "480px",
};

const brand: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#a1a1aa",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: "0 0 16px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#09090b",
  margin: "0 0 6px",
};

const projectLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#a1a1aa",
  margin: "0 0 20px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#3f3f46",
  margin: "0 0 24px",
};

const ticketBox: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "0 0 28px",
};

const ticketLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#a1a1aa",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  margin: "0 0 6px",
};

const ticketValue: React.CSSProperties = {
  fontSize: "15px",
  color: "#18181b",
  margin: "0",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "0 0 28px",
};

const button: React.CSSProperties = {
  backgroundColor: "#18181b",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "0 0 20px",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#a1a1aa",
  lineHeight: "1.6",
  margin: "0",
};
