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
import { getProjectTags } from "@/lib/supabase/tags";
import { getProjectTickets } from "@/lib/supabase/tickets";
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
    assignee: rawSearchParams.assignee,
    tag: rawSearchParams.tag,
    order: rawSearchParams.order,
    view: rawSearchParams.view,
    q: rawSearchParams.q,
  });

  if (!validationResult.success) {
    // バリデーション失敗時は無効なパラメータを無視
    logger.warn("Invalid search params:", validationResult.error.issues);
  }

  const { status, priority, category, assignee, tag, order, view, q } = validationResult.success
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

  const [members, rootTicketsResult, tags, tickets] = await Promise.all([
    getProjectMembers(id),
    supabase
      .from("tickets")
      .select("id, title")
      .eq("project_id", id)
      .is("parent_id", null)
      .order("created_at", { ascending: true }),
    getProjectTags(id),
    getProjectTickets(id, { status, priority, category, assignee, tag, order, q }),
  ]);
  const notExistsTicket = !rootTicketsResult.data || rootTicketsResult.data.length === 0;
  const rootTickets = rootTicketsResult.data ?? [];

  // 担当者プロフィールを一括取得
  const assigneeIds = [...new Set(tickets.map((t) => t.assignee_id).filter(Boolean))] as string[];
  const assigneeMap: Record<string, { username: string; avatarFilePath?: string | null }> = {};
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email, avatar_file_path")
      .in("id", assigneeIds);
    profiles?.forEach((p) => {
      assigneeMap[p.id] = {
        username: p.username || p.email || "",
        avatarFilePath: p.avatar_file_path,
      };
    });
  }

  return (
    <div className="max-w-2xl xl:max-w-7xl 2xl:max-w-360 mx-auto p-8">
      <div className="flex flex-col mb-2">
        <Link
          href="/projects"
          className="gap-1 text-sm text-muted-foreground hover:underline w-fit"
        >
          マイプロジェクト
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
          <TicketCreateModal
            projectId={id}
            members={members}
            rootTickets={rootTickets}
            tags={tags}
          />
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
      )}

      <Suspense>
        <ViewTabs currentView={currentView} />
      </Suspense>

      <Suspense>
        <TicketFilters
          currentView={currentView}
          members={members.map((m) => ({
            userId: m.user_id,
            displayName: m.profile.username || m.profile.email || "",
          }))}
          tags={tags}
        />
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
            <TicketCreateModal
              projectId={id}
              members={members}
              rootTickets={rootTickets}
              tags={tags}
            />
          )}
        </div>
      )}
    </div>
  );
}
