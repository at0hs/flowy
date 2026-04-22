import { createClient } from "./server";
import { Ticket, Project, NotificationWithDetails } from "@/types";
import { logger } from "@/lib/logger";

/** 担当者が自分かつ未完了のチケット（プロジェクト名付き） */
export interface MyTicket extends Ticket {
  project: Pick<Project, "id" | "name">;
}

/** プロジェクトごとのステータス別チケット数 */
export interface ProjectProgress {
  project: Pick<Project, "id" | "name">;
  todo: number;
  in_progress: number;
  done: number;
}

/** 最近のアクティビティ（チケット + プロジェクト名） */
export interface RecentActivityTicket {
  id: string;
  title: string;
  project_id: string;
  project_name: string;
  updated_at: string;
}

/** 未読通知サマリー */
export interface UnreadNotificationSummary {
  unreadCount: number;
  recentNotifications: NotificationWithDetails[];
}

/** 30日前のISO文字列 */
function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

/**
 * 担当者が自分かつ未完了のチケットを全プロジェクト横断で取得する
 * @param userId 取得対象のユーザーID
 */
export async function getMyTickets(userId: string): Promise<MyTicket[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tickets")
    .select("*, project:projects!tickets_project_id_fkey(id, name)")
    .eq("assignee_id", userId)
    .in("status", ["todo", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    logger.error("Failed to fetch my tickets:", error);
    throw error;
  }

  return (data ?? []) as unknown as MyTicket[];
}

/**
 * 自分が参加する各プロジェクトのステータス別チケット数を取得する
 * @param userId 取得対象のユーザーID
 */
export async function getProjectProgress(userId: string): Promise<ProjectProgress[]> {
  const supabase = await createClient();

  const { data: memberData, error: memberError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);

  if (memberError) {
    logger.error("Failed to fetch project members:", memberError);
    throw memberError;
  }

  if (!memberData || memberData.length === 0) {
    return [];
  }

  const projectIds = memberData.map((m) => m.project_id);

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (projectError) {
    logger.error("Failed to fetch projects:", projectError);
    throw projectError;
  }

  if (!projects || projects.length === 0) {
    return [];
  }

  const { data: tickets, error: ticketError } = await supabase
    .from("tickets")
    .select("project_id, status")
    .in("project_id", projectIds);

  if (ticketError) {
    logger.error("Failed to fetch tickets for project progress:", ticketError);
    throw ticketError;
  }

  const countMap = new Map<string, { todo: number; in_progress: number; done: number }>();
  for (const p of projects) {
    countMap.set(p.id, { todo: 0, in_progress: 0, done: 0 });
  }

  for (const ticket of tickets ?? []) {
    const counts = countMap.get(ticket.project_id);
    if (!counts) continue;
    if (ticket.status === "todo") counts.todo++;
    else if (ticket.status === "in_progress") counts.in_progress++;
    else if (ticket.status === "done") counts.done++;
  }

  return projects.map((p) => {
    const counts = countMap.get(p.id) ?? { todo: 0, in_progress: 0, done: 0 };
    return { project: p, ...counts };
  });
}

/**
 * 自分が参加するプロジェクト全体で updated_at が新しいチケットを最大10件取得する
 * @param userId 取得対象のユーザーID
 */
export async function getRecentActivity(userId: string): Promise<RecentActivityTicket[]> {
  const supabase = await createClient();

  const { data: memberData, error: memberError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);

  if (memberError) {
    logger.error("Failed to fetch project members:", memberError);
    throw memberError;
  }

  if (!memberData || memberData.length === 0) {
    return [];
  }

  const projectIds = memberData.map((m) => m.project_id);

  const { data, error } = await supabase
    .from("tickets")
    .select("id, title, project_id, updated_at, project:projects!tickets_project_id_fkey(name)")
    .in("project_id", projectIds)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    logger.error("Failed to fetch recent activity:", error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    project_id: row.project_id,
    project_name: (row.project as { name: string } | null)?.name ?? "",
    updated_at: row.updated_at,
  }));
}

/**
 * 未読通知の件数と直近5件を取得する
 * @param userId 取得対象のユーザーID
 */
export async function getUnreadNotificationSummary(
  userId: string
): Promise<UnreadNotificationSummary> {
  const supabase = await createClient();

  const cutoff = thirtyDaysAgo();

  const [countResult, notificationsResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .gte("created_at", cutoff),
    supabase
      .from("notifications")
      .select(
        `
        *,
        actor:profiles!notifications_actor_id_fkey(username),
        ticket:tickets!notifications_ticket_id_fkey(title, project_id)
      `
      )
      .eq("user_id", userId)
      .eq("is_read", false)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (countResult.error) {
    logger.error("Failed to fetch unread count:", countResult.error);
    throw countResult.error;
  }

  if (notificationsResult.error) {
    logger.error("Failed to fetch recent notifications:", notificationsResult.error);
    throw notificationsResult.error;
  }

  return {
    unreadCount: countResult.count ?? 0,
    recentNotifications: (notificationsResult.data ?? []) as NotificationWithDetails[],
  };
}
