import { Resend } from "resend";
import { render } from "@react-email/components";
import InvitationEmail from "@/emails/invitation";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 招待メールを送信する
 */
export async function sendInvitationEmail({
  to,
  inviterName,
  projectName,
  inviteUrl,
}: {
  to: string;
  inviterName: string;
  projectName: string;
  inviteUrl: string;
}) {
  const html = await render(
    InvitationEmail({ inviterName, projectName, inviteUrl })
  );

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Flowy <noreply@resend.dev>",
    to,
    subject: `${inviterName}さんが「${projectName}」にあなたを招待しました`,
    html,
  });

  if (error) {
    throw new Error(`メール送信に失敗しました: ${error.message}`);
  }
}
