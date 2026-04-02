import { Database } from "./database.types";

// 各テーブルのRow型をエクスポート
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type TicketWatch = Database["public"]["Tables"]["ticket_watches"]["Row"];

// ENUM型をエクスポート
export type ProjectRole = Database["public"]["Enums"]["project_role"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];

// 通知関連の型定義
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];

// UI表示用（actor と ticket を JOIN した拡張型）
export type NotificationWithDetails = Notification & {
  actor: { username: string } | null;
  ticket: { title: string; project_id: string } | null;
};
