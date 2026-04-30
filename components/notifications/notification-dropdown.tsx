"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { NotificationBell } from "./notification-bell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  fetchMoreNotificationsAction,
} from "@/app/(app)/notifications/actions";
import { NotificationWithDetails, NotificationType } from "@/types";
import { cn } from "@/lib/utils";
import { UserCheck, UserCog, MessageSquare, RefreshCw, Bell, LoaderCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

const PAGE_SIZE = 20;

// ---- 通知テキストのユーティリティ ----

function getNotificationText(notification: NotificationWithDetails): string {
  const actor = notification.actor?.username ?? "誰か";
  const ticket = notification.ticket?.title ?? "チケット";

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
      return `チケット「${ticket}」に更新がありました`;
  }
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const iconClass = "h-4 w-4 shrink-0";
  switch (type) {
    case "assigned":
      return <UserCheck className={cn(iconClass, "text-primary")} />;
    case "assignee_changed":
      return <UserCog className={cn(iconClass, "text-muted-foreground")} />;
    case "comment_added":
      return <MessageSquare className={cn(iconClass, "text-muted-foreground")} />;
    case "status_changed":
      return <RefreshCw className={cn(iconClass, "text-muted-foreground")} />;
    case "priority_changed":
      return <RefreshCw className={cn(iconClass, "text-muted-foreground")} />;
    default:
      return <Bell className={cn(iconClass, "text-muted-foreground")} />;
  }
}

// ---- Props ----

interface NotificationDropdownProps {
  notifications: NotificationWithDetails[];
  unreadCount: number;
}

// ---- コンポーネント本体 ----

export function NotificationDropdown({
  notifications: initialNotifications,
  unreadCount,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, startLoadingMore] = useTransition();

  // 表示中の通知リスト（propsが変わったら初期化される）
  const [displayed, setDisplayed] = useState<NotificationWithDetails[]>(initialNotifications);
  // 「もっと見る」ボタンを表示するか（最後のフェッチが PAGE_SIZE 件返した場合は true）
  const [hasMore, setHasMore] = useState(initialNotifications.length === PAGE_SIZE);

  // props（サーバー再レンダリング）で初期値が更新されたらリセット
  const [prevInitial, setPrevInitial] = useState(initialNotifications);
  if (prevInitial !== initialNotifications) {
    setPrevInitial(initialNotifications);
    setDisplayed(initialNotifications);
    setHasMore(initialNotifications.length === PAGE_SIZE);
  }

  const handleNotificationClick = (notification: NotificationWithDetails) => {
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

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
    });
  };

  const handleLoadMore = () => {
    startLoadingMore(async () => {
      const next = await fetchMoreNotificationsAction(displayed.length);
      setDisplayed((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span>
          <NotificationBell unreadCount={unreadCount} className="shrink-0" />
        </span>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-100 p-0"
        aria-label="通知一覧"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">通知</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              すべて既読
            </Button>
          )}
        </div>

        <Separator />

        {/* 通知リスト */}
        <div className="max-h-105 overflow-y-auto">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">通知はありません</p>
            </div>
          ) : (
            <>
              <ul role="list">
                {displayed.map((notification, index) => (
                  <li key={notification.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "w-full h-auto flex items-start justify-start gap-3 px-4 py-3 text-left rounded-none",
                        "focus-visible:bg-accent",
                        !notification.is_read && "bg-primary/5"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                      disabled={isPending}
                    >
                      {/* 未読ドット */}
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 rounded-full shrink-0",
                          notification.is_read ? "bg-transparent" : "bg-primary"
                        )}
                        aria-hidden="true"
                      />

                      {/* アイコン */}
                      <span className="mt-0.5">
                        <NotificationIcon type={notification.type as NotificationType} />
                      </span>

                      {/* テキスト */}
                      <span className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "block text-sm leading-snug wrap-break-word",
                            !notification.is_read && "font-medium"
                          )}
                        >
                          {getNotificationText(notification)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {notification.ticket?.title ? notification.ticket.title : "チケット"}
                        </span>

                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </span>
                      </span>
                    </Button>

                    {index < displayed.length - 1 && (
                      <Separator className="mx-4" style={{ width: "calc(100% - 2rem)" }} />
                    )}
                  </li>
                ))}
              </ul>

              {/* もっと見るボタン */}
              {hasMore && (
                <>
                  <Separator />
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore || isPending}
                    >
                      {isLoadingMore ? (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : null}
                      もっと見る
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
