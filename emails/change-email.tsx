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

interface ChangeEmailProps {
  confirmUrl: string;
}

export default function ChangeEmail({
  confirmUrl = "http://localhost:3111/login",
}: ChangeEmailProps) {
  return (
    <Html lang="ja">
      <Head />
      <Preview>Flowyのメールアドレス変更リクエストを確認してください。</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>メールアドレス変更の確認</Heading>

          <Text style={paragraph}>
            以下のボタンをクリックして、新しいメールアドレスへの変更を確認してください。
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={confirmUrl}>
              変更を確認する
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            このメールに心当たりがない場合は無視してください。
            <br />
            このリンクの有効期限は1時間です。
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
