import { createClient } from "./server";
import { ProjectMember, ProjectRole, Profile } from "@/types";

export interface ProjectMemberWithProfile {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  profile: Profile;
}

/**
 * プロジェクトのメンバー一覧を取得
 * @param projectId プロジェクトID
 * @returns メンバー情報（プロフィール付き）の配列
 */
export async function getProjectMembers(
  projectId: string
): Promise<ProjectMemberWithProfile[]> {
  const supabase = await createClient();

  // project_members を取得
  const { data: members, error: membersError } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (membersError) {
    console.error("Failed to fetch project members:", membersError);
    throw membersError;
  }

  if (!members || members.length === 0) {
    return [];
  }

  // user_id のリストを取得
  const userIds = members.map((m) => m.user_id);

  // profiles を一括取得
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (profilesError) {
    console.error("Failed to fetch profiles:", profilesError);
    throw profilesError;
  }

  // profiles をマップ化
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // members と profiles を結合
  return members.map((member) => {
    const profile = profileMap.get(member.user_id);
    return {
      id: member.id,
      project_id: member.project_id,
      user_id: member.user_id,
      role: member.role as ProjectRole,
      created_at: member.created_at,
      profile: profile || ({} as Profile),
    };
  });
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
    console.error("User not found:", profileError);
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
    if (error.code === "23505") {
      // UNIQUE制約違反（既に追加されている）
      throw new Error(`このメンバーは既に追加されています`);
    }
    console.error("Failed to add project member:", error);
    throw error;
  }

  return data as ProjectMember;
}

/**
 * プロジェクトからメンバーを削除
 * @param projectId プロジェクトID
 * @param memberId 削除するメンバーID（project_members.id）
 */
export async function removeProjectMember(projectId: string, memberId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (error) {
    console.error("Failed to remove project member:", error);
    throw error;
  }
}

/**
 * ユーザーがプロジェクトのオーナーかどうかを確認
 * @param projectId プロジェクトID
 * @param userId ユーザーID
 * @returns オーナーであれば true
 */
export async function isProjectOwner(projectId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Failed to check project owner:", error);
    return false;
  }

  return data?.role === "owner";
}
