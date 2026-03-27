"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ticketSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { Ticket } from "@/types";

export async function createTicket(projectId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = ticketSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  const assigneeIdRaw = formData.get("assignee_id") as string | null;
  const assigneeId = assigneeIdRaw && assigneeIdRaw.trim() !== "" ? assigneeIdRaw : null;

  const { error } = await supabase.from("tickets").insert({
    project_id: projectId,
    title: data.title,
    description: data.description || null,
    status: data.status,
    priority: data.priority,
    assignee_id: assigneeId,
  });

  if (error) {
    logger.error(error);
    return { error: "チケットの作成に失敗しました" };
  }

  return { success: true, projectId };
}

export async function deleteTicket(ticketId: string, projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

  if (error) {
    console.error(error);
    return { error: "チケットの削除に失敗しました" };
  }

  return { success: true, projectId };
}

export async function updateTicket(ticketId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = ticketSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  const assigneeIdRaw = formData.get("assignee_id") as string | null;
  const assigneeId = assigneeIdRaw && assigneeIdRaw.trim() !== "" ? assigneeIdRaw : null;

  const { error } = await supabase
    .from("tickets")
    .update({
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      assignee_id: assigneeId,
    })
    .eq("id", ticketId);

  if (error) {
    console.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  return { success: true, ticketId, projectId };
}

type TicketFieldUpdate =
  | { field: "title"; value: string }
  | { field: "description"; value: string | null }
  | { field: "status"; value: Ticket["status"] }
  | { field: "priority"; value: Ticket["priority"] }
  | { field: "assignee_id"; value: string | null };

export async function updateTicketField(
  ticketId: string,
  _projectId: string,
  update: TicketFieldUpdate
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (update.field === "title") {
    const result = z.string().min(1, "タイトルは必須です").safeParse(update.value);
    if (!result.success) {
      return { error: result.error.issues[0].message };
    }
  }

  const { error } = await supabase
    .from("tickets")
    .update({ [update.field]: update.value })
    .eq("id", ticketId);

  if (error) {
    logger.error(error);
    return { error: "チケットの更新に失敗しました" };
  }

  return { success: true };
}
