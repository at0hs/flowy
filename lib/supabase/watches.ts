import { createClient } from "./server";
import { TicketWatch } from "@/types";
import { logger } from "@/lib/logger";

/**
 * 指定チケットを自分がウォッチしているか確認する
 * @param ticketId チケットID
 * @param userId ユーザーID
 * @returns ウォッチ中なら true
 */
export async function isWatching(ticketId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("ticket_watches")
    .select("id", { count: "exact", head: true })
    .eq("ticket_id", ticketId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to check watch status:", error);
    throw error;
  }

  return (count ?? 0) > 0;
}

/**
 * チケットをウォッチする
 * @param ticketId チケットID
 * @param userId ユーザーID
 * @returns 作成されたウォッチレコード
 */
export async function addWatch(ticketId: string, userId: string): Promise<TicketWatch> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ticket_watches")
    .insert({ ticket_id: ticketId, user_id: userId })
    .select()
    .single();

  if (error) {
    logger.error("Failed to add watch:", error);
    throw error;
  }

  return data;
}

/**
 * チケットのウォッチを解除する
 * @param ticketId チケットID
 * @param userId ユーザーID
 */
export async function removeWatch(ticketId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ticket_watches")
    .delete()
    .eq("ticket_id", ticketId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to remove watch:", error);
    throw error;
  }
}

/**
 * チケットをウォッチしているユーザーID一覧を取得する
 * 通知発行時にウォッチャーを特定するために使用する
 * @param ticketId チケットID
 * @returns ウォッチ中のユーザーIDの配列
 */
export async function getWatcherIds(ticketId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ticket_watches")
    .select("user_id")
    .eq("ticket_id", ticketId);

  if (error) {
    logger.error("Failed to fetch watcher ids:", error);
    throw error;
  }

  return (data ?? []).map((w) => w.user_id);
}
