import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TicketTable } from "@/components/tickets/ticket-table";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketCreateModal } from "@/components/tickets/ticket-create-modal";
import { ViewTabs } from "@/components/tickets/view-tabs";
import { KanbanBoard } from "@/components/tickets/kanban/kanban-board";
import { GanttChart } from "@/components/tickets/gantt/gantt-chart";
import { Suspense } from "react";
import { ticketsQuerySchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { getProjectMembers } from "@/lib/supabase/members";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TicketsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const rawSearchParams = await searchParams;

  // クエリパラメータをバリデーション
  const validationResult = ticketsQuerySchema.safeParse({
    status: rawSearchParams.status,
    priority: rawSearchParams.priority,
    category: rawSearchParams.category,
    order: rawSearchParams.order,
    view: rawSearchParams.view,
    q: rawSearchParams.q,
  });

  if (!validationResult.success) {
    // バリデーション失敗時は無効なパラメータを無視
    logger.warn("Invalid search params:", validationResult.error.issues);
  }

  const { status, priority, category, order, view, q } = validationResult.success
    ? validationResult.data
    : {};
  const currentView = view ?? "list";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const [members, rootTicketsResult] = await Promise.all([
    getProjectMembers(id),
    supabase
      .from("tickets")
      .select("id, title")
      .eq("project_id", id)
      .is("parent_id", null)
      .order("created_at", { ascending: true }),
  ]);
  const notExistsTicket = !rootTicketsResult.data || rootTicketsResult.data.length === 0;
  const rootTickets = rootTicketsResult.data ?? [];

  // チケット取得クエリを組み立てる
  let query = supabase
    .from("tickets")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: order === "asc" });

  // ステータスフィルタ（指定がある場合のみ条件を追加）
  if (status) query = query.eq("status", status);

  // 優先度フィルタ（指定がある場合のみ条件を追加）
  if (priority) query = query.eq("priority", priority);

  // カテゴリフィルタ（指定がある場合のみ条件を追加）
  if (category) query = query.eq("category", category);

  // タイトル部分一致検索（指定がある場合のみ条件を追加）
  if (q) query = query.ilike("title", `%${q}%`);
  const { data: tickets, error } = await query;

  if (error) logger.error(error);

  // 担当者プロフィールを一括取得
  const assigneeIds = [
    ...new Set((tickets ?? []).map((t) => t.assignee_id).filter(Boolean)),
  ] as string[];
  const assigneeMap: Record<string, string> = {};
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email")
      .in("id", assigneeIds);
    profiles?.forEach((p) => {
      assigneeMap[p.id] = p.username || p.email || "";
    });
  }

  return (
    <div className="max-w-2xl xl:max-w-7xl 2xl:max-w-360 mx-auto p-8">
      <div className="flex flex-col mb-2">
        <Link
          href="/projects"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          プロジェクト一覧
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
          <TicketCreateModal projectId={id} members={members} rootTickets={rootTickets} />
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
      )}

      <Suspense>
        <ViewTabs currentView={currentView} />
      </Suspense>

      <Suspense>
        <TicketFilters currentView={currentView} />
      </Suspense>

      {currentView === "kanban" ? (
        <KanbanBoard tickets={tickets ?? []} projectId={id} assigneeMap={assigneeMap} />
      ) : currentView === "gantt" ? (
        <GanttChart tickets={tickets ?? []} projectId={id} />
      ) : tickets && tickets.length > 0 ? (
        <TicketTable tickets={tickets} assigneeMap={assigneeMap} />
      ) : (
        <div className="text-sm text-center py-16 text-muted-foreground">
          <p className="mb-4">チケットがありません</p>
          {notExistsTicket && (
            <TicketCreateModal projectId={id} members={members} rootTickets={rootTickets} />
          )}
        </div>
      )}
    </div>
  );
}
