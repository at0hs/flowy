import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteTicketButton } from "./delete-ticket-button";

// ticket-list-item.tsx と同じマップを定義
const STATUS_MAP = {
  todo: { label: "TODO", variant: "outline" },
  in_progress: { label: "進行中", variant: "default" },
  done: { label: "完了", variant: "secondary" },
} as const;

const PRIORITY_MAP = {
  low: { label: "低", variant: "outline" },
  medium: { label: "中", variant: "secondary" },
  high: { label: "高", variant: "default" },
  urgent: { label: "緊急", variant: "destructive" },
} as const;

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

  const { data: ticket } = await supabase.from("tickets").select("*").eq("id", ticketId).single();

  if (!ticket) notFound();

  const status = STATUS_MAP[ticket.status as keyof typeof STATUS_MAP];
  const priority = PRIORITY_MAP[ticket.priority as keyof typeof PRIORITY_MAP];

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* 戻るリンク */}
      <Link href={`/projects/${id}`} className="text-sm text-muted-foreground hover:underline">
        ← チケット一覧
      </Link>

      {/* タイトルとアクション */}
      <div className="flex justify-between items-start mt-4 mb-6">
        <h1 className="text-2xl font-bold">{ticket.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}/tickets/${ticketId}/edit`}>編集</Link>
          </Button>
          <DeleteTicketButton ticketId={ticketId} projectId={id} ticketTitle={ticket.title} />
        </div>
      </div>

      <Separator className="mb-6" />

      {/* ステータス・優先度 */}
      <div className="flex gap-3 mb-6">
        <Badge variant={priority.variant}>{priority.label}</Badge>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* 説明 */}
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">説明</p>
        {ticket.description ? (
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">説明なし</p>
        )}
      </div>

      <Separator className="mb-6" />

      {/* メタ情報 */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>作成日：{new Date(ticket.created_at).toLocaleDateString("ja-JP")}</p>
        <p>更新日：{new Date(ticket.updated_at).toLocaleDateString("ja-JP")}</p>
      </div>
    </div>
  );
}
