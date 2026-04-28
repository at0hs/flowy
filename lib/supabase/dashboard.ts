import { createClient } from "./server";
import { Ticket, Project, NotificationWithDetails } from "@/types";
import { logger } from "@/lib/logger";
import { thirtyDaysAgo } from "@/lib/date";

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

/** 最近のアクティビティ（ticket_activities ベース） */
export interface RecentActivityItem {
  id: string;
  action: string;
  created_at: string;
  ticket_id: string;
  ticket_title: string;
  project_id: string;
  project_name: string;
  actor_username: string | null;
}

/** 未読通知サマリー */
export interface UnreadNotificationSummary {
  unreadCount: number;
  recentNotifications: NotificationWithDetails[];
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
 * 自分が参加するプロジェクト全体の最近のアクティビティをチケットごとに最新1件・最大10件取得する
 * コメント系アクション（comment_added / comment_deleted）は除外
 */
export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const supabase = await createClient();

  // RLS (can_access_ticket) がプロジェクトメンバーに自動で絞るため project_id フィルタ不要
  const { data, error } = await supabase
    .from("ticket_activities")
    .select(
      `
      id,
      action,
      created_at,
      ticket:tickets!ticket_activities_ticket_id_fkey(
        id, title, project_id,
        project:projects!tickets_project_id_fkey(name)
      ),
      actor:profiles!ticket_activities_user_id_fkey(username)
    `
    )
    .not("action", "in", '("comment_added","comment_deleted")')
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch recent activity:", error);
    throw error;
  }

  // チケットごとに最新1件のみ残し、10件に絞る
  const seen = new Set<string>();
  const deduped: RecentActivityItem[] = [];
  for (const row of data ?? []) {
    const ticket = row.ticket as {
      id: string;
      title: string;
      project_id: string;
      project: { name: string } | null;
    } | null;
    if (!ticket) continue;
    if (seen.has(ticket.id)) continue;
    seen.add(ticket.id);
    deduped.push({
      id: row.id,
      action: row.action,
      created_at: row.created_at,
      ticket_id: ticket.id,
      ticket_title: ticket.title,
      project_id: ticket.project_id,
      project_name: ticket.project?.name ?? "",
      actor_username: (row.actor as { username: string } | null)?.username ?? null,
    });
    if (deduped.length === 10) break;
  }

  return deduped;
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
