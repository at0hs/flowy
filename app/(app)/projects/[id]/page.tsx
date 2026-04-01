import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { TicketTable } from "@/components/tickets/ticket-table";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketCreateModal } from "@/components/tickets/ticket-create-modal";
import { Suspense } from "react";
import { ticketsQuerySchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { getProjectMembers } from "@/lib/supabase/members";

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
    order: rawSearchParams.order,
  });

  if (!validationResult.success) {
    // バリデーション失敗時は無効なパラメータを無視
    logger.warn("Invalid search params:", validationResult.error.issues);
  }

  const { status, priority, order } = validationResult.success ? validationResult.data : {};

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
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-2">
        <div>
          <Link href="/projects" className="text-sm text-muted-foreground hover:underline">
            ← プロジェクト一覧
          </Link>
          <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
        </div>
        <TicketCreateModal projectId={id} members={members} rootTickets={rootTickets} />
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
      )}

      <Separator className="mb-6" />

      <Suspense>
        <TicketFilters />
      </Suspense>

      {tickets && tickets.length > 0 ? (
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
