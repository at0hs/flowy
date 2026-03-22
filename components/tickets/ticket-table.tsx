import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types";
import { createClient } from "@/lib/supabase/server";

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
  tickets: Ticket[];
};

export async function TicketTable({ tickets }: Props) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // assignee_id を一括取得してプロフィールをマップ化
  const assigneeIds = [...new Set(tickets.map((t) => t.assignee_id).filter(Boolean))] as string[];
  const assigneeMap = new Map<string, string>();

  if (assigneeIds.length > 0) {
    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email")
      .in("id", assigneeIds);

    profiles?.forEach((p) => {
      assigneeMap.set(p.id, p.username || p.email || "");
    });
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-6 py-3 text-left text-sm font-semibold">タイトル</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">優先度</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">ステータス</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">担当者</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">作成日</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const status = STATUS_MAP[ticket.status];
            const priority = PRIORITY_MAP[ticket.priority];
            const assigneeName = ticket.assignee_id ? assigneeMap.get(ticket.assignee_id) : null;

            return (
              <tr key={ticket.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="px-6 py-3">
                  <Link
                    href={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {ticket.title}
                  </Link>
                </td>
                <td className="px-6 py-3">
                  <Badge variant={priority.variant}>{priority.label}</Badge>
                </td>
                <td className="px-6 py-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="px-6 py-3 text-sm">
                  {assigneeName ?? <span className="text-muted-foreground italic">担当者なし</span>}
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">
                  {formatDate(ticket.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
