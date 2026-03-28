import { createClient } from "./server";
import { Invitation } from "@/types";
import { logger } from "@/lib/logger";

/**
 * 招待を作成する
 * @param projectId プロジェクトID
 * @param email 招待先メールアドレス
 * @returns 作成された招待レコード
 */
export async function createInvitation(projectId: string, email: string): Promise<Invitation> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_invitation", {
    p_project_id: projectId,
    p_email: email,
  });

  if (error) {
    logger.error("Failed to create invitation:", error);
    throw error;
  }

  return data;
}

export type InvitationVerifyResult =
  | { isValid: true; invitation: Invitation }
  | { isValid: false; invitation: null; error: string };

/**
 * トークンで招待を検証する
 * @param token 招待トークン
 * @returns 検証結果（有効な場合は招待レコード付き）
 */
export async function verifyInvitationToken(token: string): Promise<InvitationVerifyResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) {
    return { isValid: false, invitation: null, error: "招待リンクが無効です。" };
  }

  if (data.status === "accepted") {
    return { isValid: false, invitation: null, error: "この招待はすでに使用されています" };
  }

  if (data.status === "expired") {
    return { isValid: false, invitation: null, error: "この招待の有効期限が切れています" };
  }

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("invitations").update({ status: "expired" }).eq("id", data.id);
    return { isValid: false, invitation: null, error: "この招待の有効期限が切れています" };
  }

  return { isValid: true, invitation: data };
}

/**
 * 招待を削除する
 * @param invitationId 招待ID
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("invitations").delete().eq("id", invitationId);

  if (error) {
    logger.error("Failed to delete invitation:", error);
    throw error;
  }
}

/**
 * 招待を受け入れる（プロジェクトメンバーに追加し、招待ステータスをacceptedに更新）
 * SECURITY DEFINER 関数を使用して RLS をバイパスしアトミックに処理する
 * @param token 招待トークン
 * @param userId 受け入れるユーザーID
 */
export async function acceptInvitation(token: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("accept_invitation", {
    p_token: token,
    p_user_id: userId,
  });

  if (error) {
    logger.error("Failed to accept invitation:", error);
    throw new Error(error.message);
  }
}
