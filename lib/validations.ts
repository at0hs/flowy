import { z } from "zod";

// チケット一覧ページのクエリパラメータスキーマ
export const ticketsQuerySchema = z.object({
  status: z.enum(["todo", "in_progress", "done"] as const).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"] as const).optional(),
  category: z.enum(["bug", "task", "feature", "improvement"] as const).optional(),
  order: z.enum(["asc", "desc"] as const).optional(),
  view: z.enum(["list", "kanban"] as const).optional(),
  q: z.string().trim().optional(),
});

export const ticketSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).catch("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).catch("medium"),
  category: z.enum(["bug", "task", "feature", "improvement"]).catch("task"),
  start_date: z.iso.date().optional(),
  due_date: z.iso.date().optional(),
});

// export type TicketsQuery = z.infer<typeof ticketsQuerySchema>;
