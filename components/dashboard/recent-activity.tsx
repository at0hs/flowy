import Link from "next/link";
import { RecentActivityItem } from "@/lib/supabase/dashboard";
import { formatRelativeTime } from "@/lib/date";
import { Activity, ChevronRight } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  created: "がチケットを作成",
  status_changed: "がステータスを変更",
  assignee_changed: "が担当者を変更",
  priority_changed: "が優先度を変更",
  due_date_changed: "が期日を変更",
  start_date_changed: "が開始日を変更",
};

interface RecentActivityProps {
  activities: RecentActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3">最近のアクティビティ</h2>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-lg">
          <Activity className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">最近の更新はありません</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border overflow-hidden">
          {activities.map((item) => (
            <li key={item.id}>
              <Link
                href={`/projects/${item.project_id}/tickets/${item.ticket_id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {item.actor_username ?? "誰か"}
                    {ACTION_LABELS[item.action] ?? "が更新"}
                  </span>
                  <span className="flex items-center text-xs text-muted-foreground truncate">
                    {item.project_name}
                    <ChevronRight strokeWidth={1} className="size-4" />
                    {item.ticket_title}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(item.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
