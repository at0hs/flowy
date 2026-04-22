import Link from "next/link";
import { RecentActivityTicket } from "@/lib/supabase/dashboard";
import { formatRelativeTime } from "@/lib/date";
import { Activity } from "lucide-react";

interface RecentActivityProps {
  tickets: RecentActivityTicket[];
}

export function RecentActivity({ tickets }: RecentActivityProps) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3">最近のアクティビティ</h2>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-lg">
          <Activity className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">最近の更新はありません</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border overflow-hidden">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{ticket.title}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {ticket.project_name}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(ticket.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
