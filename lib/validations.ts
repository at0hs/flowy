import { z } from "zod";
import { TICKET_VIEWS } from "@/lib/constants";
import type { TicketStatus, TicketPriority, TicketCategory } from "@/types";

// satisfies により、DBのenum型と配列の値が一致していることをコンパイル時に保証する
export const VALID_STATUSES = [
  "todo",
  "in_progress",
  "done",
] as const satisfies readonly TicketStatus[];
export const VALID_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const satisfies readonly TicketPriority[];
export const VALID_CATEGORIES = [
  "bug",
  "task",
  "feature",
  "improvement",
] as const satisfies readonly TicketCategory[];

// カンマ区切り文字列 → enum値の配列に変換（無効値はフィルタ除去）
const multiEnumParam = <T extends string>(validValues: readonly T[]) =>
  z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((v) => v.trim())
            .filter((v): v is T => (validValues as readonly string[]).includes(v))
        : undefined
    );

// カンマ区切り文字列 → 文字列配列に変換
const multiStringParam = z
  .string()
  .optional()
  .transform((val) => (val ? val.split(",").filter(Boolean) : undefined));

export const ticketsQuerySchema = z.object({
  status: multiEnumParam(VALID_STATUSES),
  priority: multiEnumParam(VALID_PRIORITIES),
  category: multiEnumParam(VALID_CATEGORIES),
  assignee: multiStringParam,
  tag: multiStringParam,
  order: z.enum(["asc", "desc"] as const).optional(),
  view: z.enum(TICKET_VIEWS).optional(),
  q: z.string().trim().optional(),
});

export const ticketSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  status: z.enum(VALID_STATUSES).catch("todo"),
  priority: z.enum(VALID_PRIORITIES).catch("medium"),
  category: z.enum(VALID_CATEGORIES).catch("task"),
  start_date: z.iso.date().optional(),
  due_date: z.iso.date().optional(),
});
