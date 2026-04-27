import { createClient } from "./server";
import { TicketActivityWithProfile, ActivityActionType } from "@/types";
import { logger } from "@/lib/logger";

/**
 * チケットのアクティビティ一覧を新しい順で取得する
 */
export async function getTicketActivities(ticketId: string): Promise<TicketActivityWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ticket_activities")
    .select(
      `
      *,
      actor:profiles!ticket_activities_user_id_fkey(id, username)
    `
    )
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch ticket activities:", error);
    throw error;
  }

  return (data ?? []) as TicketActivityWithProfile[];
}

/**
 * チケットアクティビティを記録する
 */
export async function insertTicketActivity(
  ticketId: string,
  action: ActivityActionType,
  oldValue?: string | null,
  newValue?: string | null
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("ticket_activities").insert({
    ticket_id: ticketId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    user_id: user?.id ?? null,
  });

  if (error) {
    logger.error("Failed to insert ticket activity:", error);
    throw error;
  }
}
