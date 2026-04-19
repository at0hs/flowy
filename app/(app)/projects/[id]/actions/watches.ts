"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { addWatch, removeWatch } from "@/lib/supabase/watches";

export async function watchTicket(
  ticketId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    await addWatch(ticketId, user.id);
    return { success: true };
  } catch (err) {
    logger.error("Failed to watch ticket:", err);
    return { error: "ウォッチの登録に失敗しました" };
  }
}

export async function unwatchTicket(
  ticketId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    await removeWatch(ticketId, user.id);
    return { success: true };
  } catch (err) {
    logger.error("Failed to unwatch ticket:", err);
    return { error: "ウォッチの解除に失敗しました" };
  }
}
