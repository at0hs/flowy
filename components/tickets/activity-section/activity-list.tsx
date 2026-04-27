import { TicketActivityWithProfile } from "@/types";
import { ActivityActionType } from "@/types";
import { formatRelativeTime, formatDate } from "@/lib/date";
import { History } from "lucide-react";

type Props = {
  activities: TicketActivityWithProfile[];
};

export function ActivityList({ activities }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">アクティビティはありません</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: TicketActivityWithProfile }) {
  const actorName = activity.actor?.username ?? "削除済みユーザー";
  const timeLabel = formatRelativeTime(activity.created_at);
  const description = buildDescription(activity);

  return (
    <div className="flex items-start gap-2.5 text-sm">
      <History className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex flex-col">
        <div className="flex items-center">
          <span className="font-medium">{actorName}</span>
          <span className="text-xs text-muted-foreground pl-2">{timeLabel}</span>
        </div>
        <span className="text-muted-foreground"> {description}</span>
      </div>
    </div>
  );
}

function buildDescription(activity: TicketActivityWithProfile): string {
  const { action, old_value, new_value } = activity;

  switch (action as ActivityActionType) {
    case "created":
      return "チケットを作成しました";

    case "status_changed":
      return `ステータスを「${formatStatus(old_value)}」→「${formatStatus(new_value)}」に変更しました`;

    case "assignee_changed":
      if (!old_value && new_value) return `担当者を「${new_value}」に設定しました`;
      if (old_value && !new_value) return `担当者「${old_value}」を解除しました`;
      return `担当者を「${old_value}」→「${new_value}」に変更しました`;

    case "priority_changed":
      return `優先度を「${formatPriority(old_value)}」→「${formatPriority(new_value)}」に変更しました`;

    case "due_date_changed":
      if (!old_value && new_value) return `期限を「${formatDateValue(new_value)}」に設定しました`;
      if (old_value && !new_value) return `期限「${formatDateValue(old_value)}」を削除しました`;
      return `期限を「${formatDateValue(old_value)}」→「${formatDateValue(new_value)}」に変更しました`;

    case "start_date_changed":
      if (!old_value && new_value) return `開始日を「${formatDateValue(new_value)}」に設定しました`;
      if (old_value && !new_value) return `開始日「${formatDateValue(old_value)}」を削除しました`;
      return `開始日を「${formatDateValue(old_value)}」→「${formatDateValue(new_value)}」に変更しました`;

    case "comment_added":
      return new_value ? `コメントを投稿しました：「${new_value}」` : "コメントを投稿しました";

    case "comment_deleted":
      return "コメントを削除しました";

    default:
      return "操作を実行しました";
  }
}

function formatStatus(value: string | null): string {
  const map: Record<string, string> = {
    todo: "TODO",
    in_progress: "進行中",
    done: "完了",
  };
  return value ? (map[value] ?? value) : "未設定";
}

function formatPriority(value: string | null): string {
  const map: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "緊急",
  };
  return value ? (map[value] ?? value) : "未設定";
}

function formatDateValue(value: string | null): string {
  if (!value) return "未設定";
  return formatDate(value);
}
