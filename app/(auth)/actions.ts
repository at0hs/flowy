"use server";

import { acceptInvitation } from "@/lib/supabase/invitations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptInvitationAction(token: string, userId: string): Promise<void> {
  await acceptInvitation(token, userId);
}

// 招待経由サインアップ用：メール認証スキップ + 招待受け入れをアトミックに実行
export async function confirmEmailAndAcceptInvitationAction(
  token: string,
  userId: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  if (error) throw new Error(`メール確認の更新に失敗しました: ${error.message}`);
  await acceptInvitation(token, userId);
}
