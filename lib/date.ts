import { format, formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

/** 相対時間（30日超は絶対日時にフォールバック） */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays >= 30) return formatDateTime(dateStr);
  return formatDistanceToNow(date, { addSuffix: true, locale: ja });
}

/** 日付＋時刻（例: 2026/04/07 13:45） */
export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "yyyy/MM/dd HH:mm");
}

/** 日付のみ（例: 2026/04/07） */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "yyyy/MM/dd");
}
