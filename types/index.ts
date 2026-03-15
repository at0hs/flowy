import { Database } from "./database.types";

// 各テーブルのRow型をエクスポート
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
