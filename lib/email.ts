import { Resend } from "resend";
import { render } from "@react-email/components";
import InvitationEmail from "@/emails/invitation";
import NotificationEmail, { NotificationEmailProps } from "@/emails/notification";

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
  const html = await render(InvitationEmail({ inviterName, projectName, inviteUrl }));

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

/**
 * 通知メールの件名を生成する
 */
function buildNotificationSubject(props: NotificationEmailProps): string {
  switch (props.type) {
    case "assigned":
      return `[Flowy] ${props.actorName}さんがあなたを割り当てました`;
    case "assignee_changed":
      return `[Flowy] ${props.actorName}が担当者を変更しました`;
    case "status_changed":
      return `[Flowy] ${props.actorName}がステータスを変更しました`;
    case "priority_changed":
      return `[Flowy] ${props.actorName}が優先度を変更しました`;
    case "comment_added":
      return `[Flowy] ${props.actorName}さんがコメントしました`;
    case "mention":
      return `[Flowy] ${props.actorName}さんにメンションされました`;
  }
}

/**
 * 通知メールを送信する
 */
export async function sendNotificationEmail({
  to,
  ...props
}: NotificationEmailProps & { to: string }) {
  const html = await render(NotificationEmail(props));
  const subject = buildNotificationSubject(props);

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Flowy <noreply@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`通知メール送信に失敗しました: ${error.message}`);
  }
}
