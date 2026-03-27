import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DeleteTicketButton } from "./delete-ticket-button";
import { TicketInlineEditPanel } from "@/components/tickets/ticket-inline-edit";
import { getProjectMembers } from "@/lib/supabase/members";

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

  const [{ data: ticket }, members] = await Promise.all([
    supabase.from("tickets").select("*").eq("id", ticketId).single(),
    getProjectMembers(id),
  ]);

  if (!ticket) notFound();

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* 戻るリンク */}
      <Link href={`/projects/${id}`} className="text-sm text-muted-foreground hover:underline">
        ← チケット一覧
      </Link>

      {/* インライン編集パネル（タイトル・ステータス・優先度・説明・担当者） */}
      <TicketInlineEditPanel
        ticket={ticket}
        projectId={id}
        members={members}
        currentUserId={user.id}
      />

      <Separator className="mb-6" />

      {/* メタ情報 */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>作成日：{new Date(ticket.created_at).toLocaleDateString("ja-JP")}</p>
        <p>更新日：{new Date(ticket.updated_at).toLocaleDateString("ja-JP")}</p>
      </div>

      {/* 削除ボタン */}
      <div className="mt-6">
        <DeleteTicketButton ticketId={ticketId} projectId={id} ticketTitle={ticket.title} />
      </div>
    </div>
  );
}
