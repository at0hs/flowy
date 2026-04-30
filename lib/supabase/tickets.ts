import { createClient } from "./server";
import { Ticket, Profile } from "@/types";
import { logger } from "@/lib/logger";
import { TicketStatus, TicketPriority, TicketCategory } from "@/types";

export interface TicketListFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignee?: string[];
  tag?: string[];
  order?: "asc" | "desc";
  q?: string;
}

export async function getProjectTickets(
  projectId: string,
  filters: TicketListFilters = {}
): Promise<Ticket[]> {
  const supabase = await createClient();

  const statusFilter = filters.status ?? [];
  const priorityFilter = filters.priority ?? [];
  const categoryFilter = filters.category ?? [];
  const assigneeFilter = filters.assignee ?? [];
  const tagFilter = filters.tag ?? [];

  // タグフィルター: ticket_tags から対象 ticket_id を先に取得
  let tagFilteredTicketIds: string[] | null = null;
  if (tagFilter.length > 0) {
    const { data: ticketTags, error: tagError } = await supabase
      .from("ticket_tags")
      .select("ticket_id")
      .in("tag_id", tagFilter);
    if (tagError) logger.error("Failed to fetch ticket_tags:", tagError);
    tagFilteredTicketIds = [...new Set(ticketTags?.map((tt) => tt.ticket_id) ?? [])];
  }

  // タグ条件に一致するチケットが存在しない場合は即座に空を返す
  if (tagFilteredTicketIds !== null && tagFilteredTicketIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("tickets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: filters.order === "asc" });

  if (statusFilter.length > 0) query = query.in("status", statusFilter);
  if (priorityFilter.length > 0) query = query.in("priority", priorityFilter);
  if (categoryFilter.length > 0) query = query.in("category", categoryFilter);
  if (assigneeFilter.length > 0) query = query.in("assignee_id", assigneeFilter);
  if (tagFilteredTicketIds && tagFilteredTicketIds.length > 0)
    query = query.in("id", tagFilteredTicketIds);
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);

  const { data, error } = await query;
  if (error) {
    logger.error("Failed to fetch project tickets:", error);
    throw error;
  }

  return data ?? [];
}

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
