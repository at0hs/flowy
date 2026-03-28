import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { ChevronsDownIcon, ChevronsUpIcon, ChevronUpIcon, EqualIcon } from "lucide-react";

const STATUS_MAP = {
  todo: { label: "TODO", color: "bg-slate-500", variant: "default" },
  in_progress: { label: "進行中", color: "bg-blue-500", variant: "default" },
  done: { label: "完了", color: "bg-green-500", variant: "default" },
} as const;

const PRIORITY_MAP = {
  low: { icon: ChevronsDownIcon, iconColor: "text-blue-400", label: "低" },
  medium: { icon: EqualIcon, iconColor: "text-orange-300", label: "中" },
  high: { icon: ChevronUpIcon, iconColor: "text-red-400", label: "高" },
  urgent: {
    icon: ChevronsUpIcon,
    iconColor: "text-red-400",
    label: "緊急",
  },
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
            <th className="px-6 py-3 text-left text-sm font-semibold">担当者</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">優先度</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">ステータス</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">作成日</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const status = STATUS_MAP[ticket.status];
            const priority = PRIORITY_MAP[ticket.priority];
            const assigneeName = ticket.assignee_id ? assigneeMap.get(ticket.assignee_id) : null;

            return (
              <tr key={ticket.id} className="border-b hover:bg-muted/50 transition-colors text-sm">
                <td className="px-6 py-3">
                  <Link
                    href={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {ticket.title}
                  </Link>
                </td>
                <td className="px-6 py-3">
                  {assigneeName ?? <span className="text-muted-foreground italic">担当者なし</span>}
                </td>
                <td className="flex items-center gap-2 px-6 py-3">
                  <priority.icon className={`w-4 h-4 stroke-[3px] ${priority.iconColor}`} />
                  {priority.label}
                </td>
                <td className="px-6 py-3">
                  <Badge
                    variant={status.variant}
                    className={`${status.color}/20 text-primary rounded-sm`}
                  >
                    {status.label}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-muted-foreground">{formatDate(ticket.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
