"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Profile, ProjectMember } from "@/types";


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
    description: description || null, // 空文字はnullに変換
    owner_id: user.id,
  });

  if (error) {
    console.error(error);
    return { error: "プロジェクトの作成に失敗しました" };
  }
	// サイドバーの表示を更新するために、キャッシュを削除
	revalidatePath("/projects");
  return { success: true };
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
    console.error(error);
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
    console.error(error);
    return { error: "プロジェクトの削除に失敗しました" };
  }

  return { success: true };
}
/**
 * プロジェクトにメンバーを追加
 * @param projectId プロジェクトID
 * @param userEmail 追加するユーザーのメールアドレス
 * @returns 新規に追加されたメンバー情報
 */
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
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId);

  const existingUserIds = members?.map((m) => m.user_id) ?? [];

  let query = supabase
    .from('profiles')
    .select('*')
    .ilike('email', `%${email}%`)
    .limit(5);

  if (existingUserIds.length > 0) {
    query = query.not('id', 'in', `(${existingUserIds.join(',')})`);
  }


  const { data } = await query;
	console.log("query:", query, "data:", data);
  return (data ?? []) as Profile[];
}

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
