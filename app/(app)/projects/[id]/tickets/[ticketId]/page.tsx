import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { TicketMainPanel } from "@/components/tickets/ticket-main-panel";
import { TicketPropertyPanel } from "@/components/tickets/ticket-property-panel";
import { getProjectMembers } from "@/lib/supabase/members";
import { getComments } from "@/lib/supabase/comments";
import { getTicketActivities } from "@/lib/supabase/activities";
import { CommentActivityTabs } from "@/components/tickets/activity-section/comment-activity-tabs";
import { getSubtickets } from "@/lib/supabase/tickets";
import { SubtaskSection } from "@/components/tickets/subtask-section";
import { isWatching } from "@/lib/supabase/watches";
import { TicketWatchButton } from "@/components/tickets/ticket-watch-button";
import { ChevronRight } from "lucide-react";
import { getAttachments } from "@/lib/supabase/attachments";
import { AttachmentSection } from "@/components/tickets/attachment-section";
import { AiAssistButton } from "@/components/tickets/ai-assist/ai-assist-button";
import { getProjectTags, getTicketTags } from "@/lib/supabase/tags";
import { TicketActionsMenu } from "./ticket-actions-menu";

type Props = {
  params: Promise<{ id: string; ticketId: string }>;
};

export default async function TicketDetailPage({ params }: Props) {
  const { id, ticketId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: ticket },
    { data: project },
    members,
    comments,
    attachments,
    { data: profile },
    activities,
    { data: rootTickets },
    projectTags,
  ] = await Promise.all([
    supabase.from("tickets").select("*").eq("id", ticketId).single(),
    supabase.from("projects").select("name").eq("id", id).single(),
    getProjectMembers(id),
    getComments(ticketId),
    getAttachments(ticketId),
    supabase.from("profiles").select("ai_provider").eq("id", user.id).single(),
    getTicketActivities(ticketId),
    supabase
      .from("tickets")
      .select("id, title")
      .eq("project_id", id)
      .is("parent_id", null)
      .order("created_at", { ascending: true }),
    getProjectTags(id),
  ]);

  const isAiConfigured = !!profile?.ai_provider;

  if (!ticket) notFound();

  const [subtickets, watching, { data: parentTicket }, ticketTags] = await Promise.all([
    ticket.parent_id === null ? getSubtickets(ticketId) : Promise.resolve([]),
    isWatching(ticketId, user.id),
    ticket.parent_id
      ? supabase.from("tickets").select("id, title").eq("id", ticket.parent_id).single()
      : Promise.resolve({ data: null }),
    getTicketTags(ticketId),
  ]);

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* ヘッダ */}
      <div className="px-8 pt-6 pb-0 shrink-0">
        <div className="flex items-center">
          {/* パンくずリスト */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href="/projects"
              className="hover:underline hover:text-foreground transition-colors"
            >
              マイプロジェクト
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link
              href={`/projects/${id}`}
              className="hover:underline hover:text-foreground transition-colors"
            >
              {project?.name ?? "プロジェクト"}
            </Link>
            {parentTicket && (
              <>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <Link
                  href={`/projects/${id}/tickets/${parentTicket.id}`}
                  className="hover:underline hover:text-foreground transition-colors truncate max-w-50"
                >
                  {parentTicket.title}
                </Link>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <AiAssistButton ticketId={ticketId} isAiConfigured={isAiConfigured} />
            <TicketWatchButton ticketId={ticketId} isWatching={watching} />
            <TicketActionsMenu
              ticket={ticket}
              projectId={id}
              members={members}
              rootTickets={rootTickets ?? []}
            />
          </div>
        </div>
        <Separator className="mt-4" />
      </div>

      {/* 2ペインレイアウト（単一スクロール） */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-6 flex gap-8 items-start">
          {/* 左カラム（メインエリア） */}
          <div className="flex-1 min-w-0">
            {/* タイトル・説明 */}
            <TicketMainPanel ticket={ticket} projectId={id} />

            <Separator className="my-6" />

            {/* 添付ファイル */}
            <AttachmentSection
              attachments={attachments}
              ticketId={ticketId}
              projectId={id}
              currentUserId={user.id}
            />

            {/* サブタスク（親チケットのみ表示） */}
            {ticket.parent_id === null && (
              <>
                <Separator className="my-6" />
                <SubtaskSection
                  parentTicketId={ticketId}
                  projectId={id}
                  subtickets={subtickets}
                  members={members}
                  isAiConfigured={isAiConfigured}
                />
              </>
            )}

            <Separator className="my-6" />

            {/* コメント／アクティビティ */}
            <CommentActivityTabs
              comments={comments}
              activities={activities}
              ticketId={ticketId}
              currentUserId={user.id}
              members={members.map((m) => ({ id: m.user_id, label: m.profile.username }))}
            />
          </div>

          {/* 右カラム（プロパティサイドバー・sticky） */}
          <div className="w-64 shrink-0 sticky top-0 border rounded-lg px-4 py-4">
            <TicketPropertyPanel
              ticket={ticket}
              projectId={id}
              members={members}
              currentUserId={user.id}
              projectTags={projectTags}
              ticketTags={ticketTags}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
