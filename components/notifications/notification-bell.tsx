"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({ unreadCount, onClick, className }: NotificationBellProps) {
  const hasUnread = unreadCount > 0;
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <button
      type="button"
      aria-label={hasUnread ? `通知 未読${unreadCount}件` : "通知"}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground",
        "transition-colors hover:bg-accent hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        className
      )}
    >
      <Bell className="h-6 w-6" aria-hidden="true" />
      {hasUnread && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -top-1.5 -right-0.5 flex items-center justify-center",
            "min-w-5 h-5 px-1 rounded-full",
            "bg-red-300 text-gray-800 text-[12px] font-bold leading-none",
            "[font-variant-numeric:tabular-nums]"
          )}
        >
          {badgeLabel}
        </span>
      )}
    </button>
  );
}
