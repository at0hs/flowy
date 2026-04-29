import { createClient } from "./server";
import { Tag } from "@/types";
import { logger } from "@/lib/logger";

/**
 * プロジェクトのタグ一覧を取得する
 * @param projectId プロジェクトID
 * @returns タグの配列（name 昇順）
 */
export async function getProjectTags(projectId: string): Promise<Tag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (error) {
    logger.error("Failed to fetch project tags:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * チケットに付与されたタグ一覧を取得する
 * @param ticketId チケットID
 * @returns タグの配列（name 昇順）
 */
export async function getTicketTags(ticketId: string): Promise<Tag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ticket_tags")
    .select("tags(*)")
    .eq("ticket_id", ticketId)
    .order("tags(name)", { ascending: true });

  if (error) {
    logger.error("Failed to fetch ticket tags:", error);
    throw error;
  }

  return (data ?? []).map((row) => row.tags as Tag).filter(Boolean);
}
