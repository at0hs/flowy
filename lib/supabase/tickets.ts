import { createClient } from "./server";
import { Ticket, Profile } from "@/types";
import { logger } from "@/lib/logger";

export interface SubticketWithAssignee extends Ticket {
  assignee: Profile | null;
}

/**
 * 指定した親チケットの子チケット一覧を取得（担当者プロフィール付き）
 * @param parentId 親チケットID
 * @returns 子チケット（担当者プロフィール付き）の配列
 */
export async function getSubtickets(parentId: string): Promise<SubticketWithAssignee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tickets")
    .select("*, assignee:profiles!tickets_assignee_id_fkey(*)")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to fetch subtickets:", error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...row,
    assignee: row.assignee ?? null,
  }));
}
