export const STATUS_LABELS: Record<string, string> = {
  todo: "TODO",
  in_progress: "進行中",
  done: "完了",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};

export const CATEGORY_LABELS: Record<string, string> = {
  bug: "バグ",
  task: "タスク",
  feature: "機能",
  improvement: "改善",
};

export const TICKET_VIEWS = ["list", "kanban", "gantt"] as const;
export type TicketView = (typeof TICKET_VIEWS)[number];
