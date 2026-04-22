"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { UnreadNotificationSummary } from "@/lib/supabase/dashboard";
import { NotificationWithDetails, NotificationType } from "@/types";
import { markNotificationAsReadAction } from "@/app/(app)/notifications/actions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Bell, UserCheck, UserCog, MessageSquare, RefreshCw } from "lucide-react";
import Link from "next/link";

function getNotificationText(notification: NotificationWithDetails): string {
  const actor = notification.actor?.username ?? "誰か";

  switch (notification.type as NotificationType) {
    case "assigned":
      return `${actor}があなたを担当者に割り当てました`;
    case "assignee_changed":
      return `${actor}が担当者を変更しました`;
    case "comment_added":
      return `${actor}がコメントを追加しました`;
    case "status_changed":
      return `${actor}がステータスを変更しました`;
    case "priority_changed":
      return `${actor}が優先度を変更しました`;
    case "mention":
      return `${actor}がコメントであなたをメンションしました`;
    default:
      return `チケットに更新がありました`;
  }
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "assigned":
      return <UserCheck className={cn(cls, "text-primary")} />;
    case "assignee_changed":
      return <UserCog className={cn(cls, "text-muted-foreground")} />;
    case "comment_added":
      return <MessageSquare className={cn(cls, "text-muted-foreground")} />;
    case "status_changed":
    case "priority_changed":
      return <RefreshCw className={cn(cls, "text-muted-foreground")} />;
    default:
      return <Bell className={cn(cls, "text-muted-foreground")} />;
  }
}

interface NotificationSummaryProps {
  summary: UnreadNotificationSummary;
}

export function NotificationSummary({ summary }: NotificationSummaryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (notification: NotificationWithDetails) => {
    const projectId = notification.ticket?.project_id;
    const ticketId = notification.ticket_id;
    if (!projectId || !ticketId) return;

    startTransition(async () => {
      if (!notification.is_read) {
        await markNotificationAsReadAction(notification.id);
      }
      router.push(`/projects/${projectId}/tickets/${ticketId}`);
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">未読通知</h2>
        {summary.unreadCount > 0 && (
          <Link
            href="/notifications"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {summary.unreadCount}件の未読
          </Link>
        )}
      </div>

      {summary.recentNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-lg">
          <Bell className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">未読通知はありません</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border overflow-hidden">
          {summary.recentNotifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                  "hover:bg-accent focus-visible:outline-none focus-visible:bg-accent",
                  !notification.is_read && "bg-primary/5"
                )}
                onClick={() => handleClick(notification)}
                disabled={isPending}
              >
                <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0 bg-primary")} />
                <span className="mt-0.5">
                  <NotificationIcon type={notification.type as NotificationType} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium leading-snug wrap-break-word">
                    {getNotificationText(notification)}
                  </span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {notification.ticket?.title ?? "チケット"}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
