"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createTicket(projectId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;

  const { error } = await supabase.from("tickets").insert({
    project_id: projectId,
    title,
    description: description || null,
    status,
    priority,
    assignee_id: user.id, // 担当者はログインユーザー自身に自動セット
  });

  if (error) {
    console.error(error);
    return { error: "チケットの作成に失敗しました" };
  }

  // 作成成功 → チケット一覧へ
  redirect(`/projects/${projectId}`);
}

export async function deleteTicket(ticketId: string, projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

  if (error) {
    console.error(error);
    return { error: "チケットの削除に失敗しました" };
  }

  // 削除成功 → チケット一覧へ
  redirect(`/projects/${projectId}`);
}
