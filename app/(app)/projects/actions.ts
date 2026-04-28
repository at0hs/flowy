"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Profile, ProjectMember } from "@/types";
import { logger } from "@/lib/logger";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  // ログイン中のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("projects").insert({
    name,
    description: description || null,
    owner_id: user.id,
  });

  if (error) {
    logger.error(error);
    return { error: "プロジェクトの作成に失敗しました" };
  }

  // INSERT後に別リクエストでIDを取得する
  // .insert().select() だと RETURNING がトリガー（project_members追加）より先に評価されるため
  // is_project_member() が false を返し RLS でブロックされる
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  revalidatePath("/projects");
  return { success: true, projectId: data?.id };
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description: description || null,
    })
    .eq("id", projectId); // 対象のプロジェクトを指定
  // RLSがowner_idを確認するので、他人のプロジェクトは更新できない

  if (error) {
    logger.error(error);
    return { error: "プロジェクトの更新に失敗しました" };
  }

  return { success: true };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLSがowner_idを確認するので、他人のプロジェクトは削除できない
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) {
    logger.error(error);
    return { error: "プロジェクトの削除に失敗しました" };
  }

  return { success: true };
}

/**
 * メールアドレスでプロフィールを検索（既存メンバーを除く）
 * @param email 検索するメールアドレス（部分一致）
 * @param projectId 既存メンバーを除外するためのプロジェクトID
 * @returns マッチしたプロフィールの配列（最大5件）
 */
export async function searchProfiles(email: string, projectId: string): Promise<Profile[]> {
  if (!email.trim()) return [];

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  const existingUserIds = members?.map((m) => m.user_id) ?? [];

  let query = supabase.from("profiles").select("*").ilike("email", `%${email}%`).limit(5);

  if (existingUserIds.length > 0) {
    query = query.not("id", "in", `(${existingUserIds.join(",")})`);
  }

  const { data } = await query;
  return (data ?? []) as Profile[];
}

export async function removeProjectMember(projectId: string, memberId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("remove_member_from_project", {
    p_project_id: projectId,
    p_member_id: memberId,
    p_user_id: userId,
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}/members`);
  revalidatePath(`/projects/${projectId}`);
}

/**
 * 招待メールを送信してプロジェクトに招待する
 * @param projectId プロジェクトID
 * @param email 招待先メールアドレス
 */
export async function inviteMember(projectId: string, email: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 自分自身への招待を防ぐ
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("email, username")
    .eq("id", user.id)
    .single();

  if (myProfile?.email === email) {
    return { error: "自分自身を招待することはできません" };
  }

  // 既にメンバーかどうかを確認（登録済みユーザーの場合のみ）
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (targetProfile) {
    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", targetProfile.id)
      .maybeSingle();

    if (existingMember) {
      return { error: "このユーザーは既にメンバーです" };
    }
  }

  // プロジェクト情報を取得
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  if (!project) {
    return { error: "プロジェクトが見つかりません" };
  }

  // 招待レコードを作成
  const { createInvitation } = await import("@/lib/supabase/invitations");
  let invitation;
  try {
    invitation = await createInvitation(projectId, email);
  } catch (error) {
    logger.error("Failed to create invitation:", error);
    return { error: "招待の作成に失敗しました" };
  }

  // 招待メールを送信
  const { sendInvitationEmail } = await import("@/lib/email");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3111";
  const inviteUrl = `${appUrl}/invite?token=${invitation.token}`;

  try {
    await sendInvitationEmail({
      to: email,
      inviterName: myProfile?.username ?? "招待者",
      projectName: project.name,
      inviteUrl,
    });
  } catch (error) {
    logger.error("Failed to send invitation email:", error);
    const { deleteInvitation } = await import("@/lib/supabase/invitations");
    try {
      await deleteInvitation(invitation.id);
    } catch (deleteError) {
      logger.error("Failed to rollback invitation:", deleteError);
    }
    return { error: "招待メールの送信に失敗しました" };
  }

  revalidatePath(`/projects/${projectId}/members`);
  return { success: true };
}

/**
 * メンバーのロールを変更（昇格・降格）
 * @param projectId プロジェクトID
 * @param memberId project_members の ID
 * @param newRole 変更後のロール
 */
export async function updateMemberRole(
  projectId: string,
  memberId: string,
  newRole: "owner" | "member"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("project_members")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (error) {
    logger.error("Failed to update member role:", error);
    throw new Error("ロールの変更に失敗しました");
  }

  revalidatePath(`/projects/${projectId}/members`);
}

/**
 * プロジェクトにメンバーを追加
 * @param projectId プロジェクトID
 * @param userEmail 追加するユーザーのメールアドレス
 * @returns 新規に追加されたメンバー情報
 */
export async function addProjectMember(projectId: string, userEmail: string) {
  const supabase = await createClient();

  // メールアドレスからユーザーを検索
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", userEmail)
    .single();

  if (profileError) {
    logger.error("User not found:", profileError);
    throw new Error(`メールアドレス「${userEmail}」は登録されていません`);
  }

  if (!profileData) {
    throw new Error(`メールアドレス「${userEmail}」は登録されていません`);
  }

  const userId = profileData.id;

  // メンバーを追加
  const { data, error } = await supabase
    .from("project_members")
    .insert({
      project_id: projectId,
      user_id: userId,
      role: "member",
    })
    .select()
    .single();

  if (error) {
    logger.error("Failed to add project member:", error.message);
    if (error.code === "23505") {
      // UNIQUE制約違反（既に追加されている）
      throw new Error(`このメンバーは既に追加されています`);
    }
    throw error;
  }

  return data as ProjectMember;
}
