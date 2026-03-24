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

interface InvitationEmailProps {
  inviterName: string;
  projectName: string;
  inviteUrl: string;
}

export default function InvitationEmail({
  inviterName = "招待者",
  projectName = "プロジェクト名",
  inviteUrl = "http://localhost:3111/invite?token=xxxx",
}: InvitationEmailProps) {
  return (
    <Html lang="ja">
      <Head />
      <Preview>
        {inviterName}さんが「{projectName}」にあなたを招待しました
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>プロジェクトへの招待</Heading>

          <Text style={paragraph}>
            <strong>{inviterName}</strong>さんから「<strong>{projectName}</strong>
            」への招待が届いています。
          </Text>

          <Text style={paragraph}>
            以下のボタンから招待を受け入れてください。
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              招待を受け入れる
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            このメールに心当たりがない場合は無視してください。このリンクの有効期限は7日間です。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

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

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#09090b",
  marginBottom: "24px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#3f3f46",
  margin: "0 0 16px",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "32px 0",
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
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#a1a1aa",
  lineHeight: "1.5",
};
