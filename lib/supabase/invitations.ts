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

  const { data, error } = await supabase
    .from("invitations")
    .insert({ project_id: projectId, email })
    .select()
    .single();

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
    return { isValid: false, invitation: null, error: "招待が見つかりません" };
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
 * 招待を受け入れる（プロジェクトメンバーに追加し、招待ステータスをacceptedに更新）
 * @param token 招待トークン
 * @param userId 受け入れるユーザーID
 */
export async function acceptInvitation(token: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const result = await verifyInvitationToken(token);

  if (!result.isValid) {
    throw new Error(result.error);
  }

  const { invitation } = result;

  const { error: memberError } = await supabase.from("project_members").insert({
    project_id: invitation.project_id,
    user_id: userId,
    role: "member",
  });

  if (memberError) {
    logger.error("Failed to add project member:", memberError);
    throw memberError;
  }

  const { error: updateError } = await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  if (updateError) {
    logger.error("Failed to update invitation status:", updateError);
    throw updateError;
  }
}
