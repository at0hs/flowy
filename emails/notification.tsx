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

// --- 型定義 ---

export type NotificationEmailProps =
  | {
      type: "assigned";
      actorName: string;
      ticketTitle: string;
      ticketUrl: string;
      oldAssigneeName?: string;
    }
  | {
      type: "assignee_changed" | "status_changed" | "priority_changed";
      actorName: string;
      ticketTitle: string;
      ticketUrl: string;
      fieldLabel: string;
      oldValue: string;
      newValue: string;
    }
  | {
      type: "comment_added";
      actorName: string;
      ticketTitle: string;
      ticketUrl: string;
      commentBody: string;
    };

export default function NotificationEmail(props: NotificationEmailProps) {
  if (props.type === "assigned") {
    return <AssignedEmail {...props} />;
  }
  if (props.type === "comment_added") {
    return <CommentAddedEmail {...props} />;
  }
  return <ChangeEmail {...props} />;
}

// --- assigned ---

function AssignedEmail({
  actorName = "田中太郎",
  ticketTitle = "ログイン画面のバリデーションを修正する",
  ticketUrl = "http://localhost:3111/projects/xxx/tickets/yyy",
  oldAssigneeName,
}: Extract<NotificationEmailProps, { type: "assigned" }>) {
  return (
    <Html lang="ja">
      <Head />
      <Preview>[Flowy] {actorName}さんがあなたに割り当てました</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Flowy</Text>

          <Heading style={heading}>チケットに割り当てられました</Heading>

          <Text style={paragraph}>
            <strong>{actorName}</strong>さんがあなたを「
            <strong>{ticketTitle}</strong>」の担当者に割り当てました。
          </Text>

          <Section style={changeBox}>
            <Text style={changeLabel}>変更内容</Text>
            <Text style={changeValue}>担当者: {oldAssigneeName ?? "なし"} → あなた</Text>
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

// --- assignee_changed / status_changed / priority_changed ---

function ChangeEmail({
  actorName = "田中太郎",
  ticketTitle = "ログイン画面のバリデーションを修正する",
  ticketUrl = "http://localhost:3111/projects/xxx/tickets/yyy",
  fieldLabel = "ステータス",
  oldValue = "TODO",
  newValue = "進行中",
}: Extract<
  NotificationEmailProps,
  { type: "assignee_changed" | "status_changed" | "priority_changed" }
>) {
  return (
    <Html lang="ja">
      <Head />
      <Preview>
        [Flowy] {actorName}さんが{fieldLabel}を更新しました
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Flowy</Text>

          <Heading style={heading}>チケットが更新されました</Heading>

          <Text style={paragraph}>
            <strong>{actorName}</strong>さんが「<strong>{ticketTitle}</strong>」の
            {fieldLabel}を更新しました。
          </Text>

          <Section style={changeBox}>
            <Text style={changeLabel}>変更内容</Text>
            <Text style={changeValue}>
              {fieldLabel}: {oldValue} → {newValue}
            </Text>
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

// --- comment_added ---

function CommentAddedEmail({
  actorName = "田中太郎",
  ticketTitle = "ログイン画面のバリデーションを修正する",
  ticketUrl = "http://localhost:3111/projects/xxx/tickets/yyy",
  commentBody = "確認しました。修正内容に問題ありません。",
}: Extract<NotificationEmailProps, { type: "comment_added" }>) {
  const truncated = commentBody.length > 100 ? commentBody.slice(0, 100) + "…" : commentBody;

  return (
    <Html lang="ja">
      <Head />
      <Preview>[Flowy] {actorName}さんがコメントしました</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Flowy</Text>

          <Heading style={heading}>新しいコメントがあります</Heading>

          <Text style={paragraph}>
            <strong>{actorName}</strong>さんが「<strong>{ticketTitle}</strong>
            」にコメントしました。
          </Text>

          <Section style={commentBox}>
            <Text style={commentText}>{truncated}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={ticketUrl}>
              コメントを確認する
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
  margin: "0 0 20px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#3f3f46",
  margin: "0 0 24px",
};

const changeBox: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "0 0 28px",
};

const changeLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#a1a1aa",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  margin: "0 0 6px",
};

const changeValue: React.CSSProperties = {
  fontSize: "15px",
  color: "#18181b",
  margin: "0",
};

const commentBox: React.CSSProperties = {
  borderLeft: "3px solid #e4e4e7",
  paddingLeft: "16px",
  margin: "0 0 28px",
};

const commentText: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#52525b",
  margin: "0",
  fontStyle: "italic",
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
