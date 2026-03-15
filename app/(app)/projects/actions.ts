"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
