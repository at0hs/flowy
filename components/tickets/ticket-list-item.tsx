import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types";

// ステータスの日本語ラベルと色
const STATUS_MAP = {
  todo: { label: "TODO", variant: "outline" },
  in_progress: { label: "進行中", variant: "default" },
  done: { label: "完了", variant: "secondary" },
} as const;

// 優先度の日本語ラベルと色
const PRIORITY_MAP = {
  low: { label: "低", variant: "outline" },
  medium: { label: "中", variant: "secondary" },
  high: { label: "高", variant: "default" },
  urgent: { label: "緊急", variant: "destructive" },
} as const;

type Props = {
  ticket: Ticket;
};

export function TicketListItem({ ticket }: Props) {
  const status = STATUS_MAP[ticket.status];
  const priority = PRIORITY_MAP[ticket.priority];

  return (
    <Link
      href={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      {/* タイトル */}
      <span className="font-medium">{ticket.title}</span>

      {/* バッジ */}
      <div className="flex items-center gap-2">
        <Badge variant={priority.variant}>{priority.label}</Badge>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </Link>
  );
}
