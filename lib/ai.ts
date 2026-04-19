import { generateObject, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { AiProviderType } from "@/types";

export type AiConfig = {
  provider: AiProviderType;
  apiKey?: string | null;
  endpointUrl?: string | null;
  modelName?: string | null;
};

// ────────────────────────────────────────────────────────────
// エラー
// ────────────────────────────────────────────────────────────

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured. Please set up AI settings.");
    this.name = "AiNotConfiguredError";
  }
}

// ────────────────────────────────────────────────────────────
// 内部: モデルインスタンス生成
// ────────────────────────────────────────────────────────────

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function createAIModel(config: AiConfig) {
  const { provider, apiKey, modelName } = config;

  if (!apiKey) throw new AiNotConfiguredError();
  if (!modelName) throw new AiNotConfiguredError();

  if (provider === "gemini") {
    const google = createGoogleGenerativeAI({ apiKey });
    return google(modelName);
  } else {
    const openrouter = createOpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
    });
    return openrouter(modelName);
  }
}

// ────────────────────────────────────────────────────────────
// チケット要約
// ────────────────────────────────────────────────────────────

export type SummarizeTicketInput = {
  title: string;
  description: string | null;
  comments: string[];
};

export async function summarizeTicket(
  config: AiConfig,
  ticket: SummarizeTicketInput
): Promise<string> {
  const model = createAIModel(config);

  const commentsSection =
    ticket.comments.length > 0
      ? `\n\n## コメント\n${ticket.comments.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      : "";

  const prompt =
    `以下のチケット情報を日本語で簡潔に要約してください。\n\n` +
    `## タイトル\n${ticket.title}\n\n` +
    `## 説明\n${ticket.description ?? "（説明なし）"}` +
    commentsSection;

  logger.debug("summarizeTicket: calling AI", {
    model: config.modelName,
    provider: config.provider,
  });

  const { text } = await generateText({
    model,
    system:
      "あなたはプロジェクト管理ツールのAIアシスタントです。チケットの内容を分かりやすく要約します。要約した文章のみを出力してください。前置きなどは一切含めないでください。",
    prompt: prompt + "\n\n要約のみを出力してください。",
  });

  logger.debug("summarizeTicket: done");
  return text;
}

// ────────────────────────────────────────────────────────────
// サブタスク提案
// ────────────────────────────────────────────────────────────

export type SuggestSubtaskInput = {
  title: string;
  description: string | null;
};

export type SuggestedSubtask = {
  title: string;
  description: string;
};

const suggestedSubtaskSchema = z.object({
  title: z.string().describe("サブタスクのタイトル（簡潔に）"),
  description: z.string().describe("サブタスクの説明（具体的な作業内容）"),
});

export async function suggestSubtask(
  config: AiConfig,
  ticket: SuggestSubtaskInput
): Promise<SuggestedSubtask> {
  const model = createAIModel(config);

  const prompt =
    `以下のチケットを実現するために必要なサブタスクを1件提案してください。\n\n` +
    `## タイトル\n${ticket.title}\n\n` +
    `## 説明\n${ticket.description ?? "（説明なし）"}`;

  logger.debug("suggestSubtask: calling AI", {
    model: config.modelName,
    provider: config.provider,
  });

  const { object } = await generateObject({
    model,
    system:
      "あなたはプロジェクト管理ツールのAIアシスタントです。チケットを分解して具体的なサブタスクを提案します。",
    prompt,
    schema: suggestedSubtaskSchema,
  });

  logger.debug("suggestSubtask: done", object);
  return object;
}
