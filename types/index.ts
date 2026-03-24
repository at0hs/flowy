import { Database } from "./database.types";

// 各テーブルのRow型をエクスポート
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];

// ENUM型をエクスポート
export type ProjectRole = Database["public"]["Enums"]["project_role"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];
