"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1, "タグ名は必須です").max(50, "タグ名は50文字以内で入力してください"),
  color: z.string().min(1, "カラーを選択してください"),
});

export async function createTag(projectId: string, name: string, color: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = tagSchema.safeParse({ name, color });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("tags").insert({
    project_id: projectId,
    name: parsed.data.name.trim(),
    color: parsed.data.color,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "同じ名前のタグが既に存在します" };
    }
    logger.error("Failed to create tag:", error);
    return { error: "タグの作成に失敗しました" };
  }

  revalidatePath(`/projects/${projectId}/settings/fields`);
  return { success: true };
}

export async function updateTag(tagId: string, projectId: string, name: string, color: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = tagSchema.safeParse({ name, color });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("tags")
    .update({
      name: parsed.data.name.trim(),
      color: parsed.data.color,
    })
    .eq("id", tagId);

  if (error) {
    if (error.code === "23505") {
      return { error: "同じ名前のタグが既に存在します" };
    }
    logger.error("Failed to update tag:", error);
    return { error: "タグの更新に失敗しました" };
  }

  revalidatePath(`/projects/${projectId}/settings/fields`);
  return { success: true };
}

export async function deleteTag(tagId: string, projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) {
    logger.error("Failed to delete tag:", error);
    return { error: "タグの削除に失敗しました" };
  }

  revalidatePath(`/projects/${projectId}/settings/fields`);
  return { success: true };
}

export async function addTagToTicket(ticketId: string, tagId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("ticket_tags")
    .insert({ ticket_id: ticketId, tag_id: tagId });

  if (error) {
    if (error.code === "23505") return { success: true }; // 既に付与済みは無視
    logger.error("Failed to add tag to ticket:", error);
    return { error: "タグの付与に失敗しました" };
  }

  return { success: true };
}

export async function removeTagFromTicket(ticketId: string, tagId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("ticket_tags")
    .delete()
    .eq("ticket_id", ticketId)
    .eq("tag_id", tagId);

  if (error) {
    logger.error("Failed to remove tag from ticket:", error);
    return { error: "タグの解除に失敗しました" };
  }

  return { success: true };
}
