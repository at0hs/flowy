import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DeleteTicketButton } from "./delete-ticket-button";
import { TicketInlineEditPanel } from "@/components/tickets/ticket-inline-edit";
import { getProjectMembers } from "@/lib/supabase/members";
import { getComments } from "@/lib/supabase/comments";
import { CommentList } from "@/components/tickets/comment-list";

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

  const [{ data: ticket }, members, comments] = await Promise.all([
    supabase.from("tickets").select("*").eq("id", ticketId).single(),
    getProjectMembers(id),
    getComments(ticketId),
  ]);

  if (!ticket) notFound();

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* ヘッダ */}
      <div className="flex items-center">
        {/* 戻るリンク */}
        <Link href={`/projects/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← チケット一覧
        </Link>
        <div className="ml-auto">
          <DeleteTicketButton ticketId={ticketId} projectId={id} ticketTitle={ticket.title} />
        </div>
      </div>

      <Separator className="mb-6" />

      {/* インライン編集パネル（タイトル・ステータス・優先度・説明・担当者） */}
      <TicketInlineEditPanel
        ticket={ticket}
        projectId={id}
        members={members}
        currentUserId={user.id}
      />

      <Separator className="my-6" />

      {/* メタ情報 */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>作成日：{formatRelativeTime(ticket.created_at)}</p>
        <p>更新日：{formatRelativeTime(ticket.updated_at)}</p>
      </div>

      <Separator className="my-6" />

      {/* コメント */}
      <CommentList comments={comments} ticketId={ticketId} currentUserId={user.id} />
    </div>
  );
}

// @todo utilsとして切り出す？
function formatRelativeTime(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}秒前`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)}日前`;
  return new Date(dateStr).toLocaleString("ja-JP");
}
