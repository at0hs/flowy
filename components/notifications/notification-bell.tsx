"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={hasUnread ? `通知 未読${unreadCount}件` : "通知"}
      onClick={onClick}
      className={cn("relative h-8 w-8 text-muted-foreground hover:text-foreground", className)}
    >
      <Bell className="size-5" aria-hidden="true" />
      {hasUnread && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -top-1.5 -right-0.5 flex items-center justify-center",
            "min-w-4 h-4 px-1 rounded-full",
            "bg-red-300 text-gray-800 text-[12px] font-bold leading-none",
            "[font-variant-numeric:tabular-nums]"
          )}
        >
          {badgeLabel}
        </span>
      )}
    </Button>
  );
}
