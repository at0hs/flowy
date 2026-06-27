"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function addReaction(
  commentId: string,
  emoji: string,
  ticketId: string,
  projectId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("comment_reactions").insert({
    comment_id: commentId,
    user_id: user.id,
    emoji,
  });

  if (error) {
    logger.error("Failed to add reaction:", error);
    return { error: "リアクションの追加に失敗しました" };
  }

  revalidatePath(`/projects/${projectId}/tickets/${ticketId}`);
  return { success: true };
}

export async function removeReaction(
  commentId: string,
  emoji: string,
  ticketId: string,
  projectId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("comment_reactions")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) {
    logger.error("Failed to remove reaction:", error);
    return { error: "リアクションの解除に失敗しました" };
  }

  revalidatePath(`/projects/${projectId}/tickets/${ticketId}`);
  return { success: true };
}
