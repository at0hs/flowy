"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { summarizeTicket, suggestSubtask, AiConfig, SuggestedSubtask } from "@/lib/ai";
import { decrypt } from "@/lib/encryption";
import { getComments } from "@/lib/supabase/comments";
import { Ticket } from "@/types";
import { stripHtml } from "@/lib/utils";

async function getAiConfig(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<AiConfig | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_provider, ai_api_key, ai_endpoint_url, ai_model_name")
    .eq("id", userId)
    .single();

  if (!profile?.ai_provider) return null;

  return {
    provider: profile.ai_provider,
    apiKey: profile.ai_api_key ? decrypt(profile.ai_api_key) : null,
    endpointUrl: profile.ai_endpoint_url,
    modelName: profile.ai_model_name,
  };
}

export async function summarizeTicketAction(
  ticketId: string
): Promise<{ summary: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const aiConfig = await getAiConfig(supabase, user.id);
  if (!aiConfig) {
    return { error: "AI設定が未設定です。設定画面からAIプロバイダを設定してください。" };
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("title, description")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    logger.error("summarizeTicketAction: failed to fetch ticket", ticketError);
    return { error: "チケットの取得に失敗しました" };
  }

  let commentTexts: string[] = [];
  try {
    const comments = await getComments(ticketId);
    commentTexts = comments.filter((c) => !c.is_deleted && c.body).map((c) => stripHtml(c.body));
  } catch (err) {
    logger.warn("summarizeTicketAction: failed to fetch comments, continuing without them", err);
  }

  try {
    const summary = await summarizeTicket(aiConfig, {
      title: ticket.title,
      description: ticket.description,
      comments: commentTexts,
    });
    return { summary };
  } catch (err) {
    logger.error("summarizeTicketAction: AI call failed", err);
    return { error: "AIによる要約に失敗しました。AI設定を確認してください。" };
  }
}

export async function suggestSubtaskAction(
  ticketId: string
): Promise<SuggestedSubtask | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const aiConfig = await getAiConfig(supabase, user.id);
  if (!aiConfig) {
    return { error: "AI設定が未設定です。設定画面からAIプロバイダを設定してください。" };
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("title, description, priority, status, project_id")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    logger.error("suggestSubtaskAction: failed to fetch ticket", ticketError);
    return { error: "チケットの取得に失敗しました" };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", ticket.project_id)
    .single();

  const { data: existingSubtasks } = await supabase
    .from("tickets")
    .select("title")
    .eq("parent_id", ticketId);

  const existingSubtaskTitles = (existingSubtasks ?? []).map((t) => t.title);

  try {
    const suggested = await suggestSubtask(aiConfig, {
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      projectName: project?.name ?? "",
      existingSubtasks: existingSubtaskTitles,
    });

    const VALID_PRIORITIES: Ticket["priority"][] = ["low", "medium", "high", "urgent"];
    const priority: Ticket["priority"] = VALID_PRIORITIES.includes(
      suggested.priority as Ticket["priority"]
    )
      ? (suggested.priority as Ticket["priority"])
      : "medium";

    return { title: suggested.title, description: suggested.description, priority };
  } catch (err) {
    logger.error("suggestSubtaskAction: AI call failed", err);
    return { error: "AIによるサブタスク提案に失敗しました。AI設定を確認してください。" };
  }
}
