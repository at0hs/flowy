import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MyTicket } from "@/lib/supabase/dashboard";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import { isAfter, parseISO, startOfDay } from "date-fns";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/ticket-config";

interface MyTicketsProps {
  tickets: MyTicket[];
}

export function MyTickets({ tickets }: MyTicketsProps) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3">自分のチケット</h2>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-lg">
          <ClipboardList className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">担当チケットはありません</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tickets.map((ticket) => {
            const status = STATUS_CONFIG[ticket.status];
            const priority = PRIORITY_CONFIG[ticket.priority];
            const PriorityIcon = priority?.icon;

            const isOverdue =
              ticket.due_date && isAfter(startOfDay(new Date()), parseISO(ticket.due_date));

            return (
              <li key={ticket.id}>
                <Link
                  href={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent transition-colors"
                >
                  {/* 優先度アイコン */}
                  {PriorityIcon && (
                    <PriorityIcon
                      className={cn("h-4 w-4 shrink-0", priority.iconColor)}
                      aria-label={priority.label}
                    />
                  )}

                  {/* タイトル + プロジェクト名 */}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{ticket.title}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {ticket.project.name}
                    </span>
                  </span>

                  {/* ステータスバッジ */}
                  <Badge className={cn("shrink-0 text-xs text-primary", status.badgeBgClass)}>
                    {status.label}
                  </Badge>

                  {/* 期限 */}
                  {ticket.due_date && (
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                      )}
                    >
                      {formatDate(ticket.due_date)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
