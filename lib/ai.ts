import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
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

const DEFAULT_OLLAMA_MODEL = "llama3.2";
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

// Ollama は OpenAI 互換 API を持つため createOpenAI で対応する。
// Ollama のデフォルトエンドポイント: http://localhost:11434/v1
function createAIModel(config: AiConfig) {
  const { provider, apiKey, endpointUrl, modelName } = config;

  if (provider === "ollama") {
    const openai = createOpenAI({
      apiKey: "ollama", // Ollama は API キー不要だが空文字は拒否される
      baseURL: endpointUrl ?? "http://localhost:11434/v1",
    });
    return openai(modelName ?? DEFAULT_OLLAMA_MODEL);
  } else {
    const google = createGoogleGenerativeAI({ apiKey: apiKey ?? "" });
    return google(modelName ?? DEFAULT_GEMINI_MODEL);
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

/**
 * チケットの内容をAIで要約して返す
 * @param config - ユーザーのAI設定（profiles から取得）
 * @param ticket - 要約対象のチケット情報
 * @returns 要約テキスト
 * @throws AiNotConfiguredError - provider が未設定の場合
 */
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
      "あなたはプロジェクト管理ツールのAIアシスタントです。チケットの内容を分かりやすく要約します。",
    prompt,
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

/**
 * チケットの内容を元にサブタスクを1件提案する
 * @param config - ユーザーのAI設定（profiles から取得）
 * @param ticket - 提案対象のチケット情報
 * @returns 提案されたサブタスク（タイトルと説明）
 * @throws AiNotConfiguredError - provider が未設定の場合
 */
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
