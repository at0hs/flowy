import { Database } from "./database.types";

// 各テーブルのRow型をエクスポート
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type TicketWatch = Database["public"]["Tables"]["ticket_watches"]["Row"];
export type Attachment = Database["public"]["Tables"]["attachments"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type TicketTag = Database["public"]["Tables"]["ticket_tags"]["Row"];

// ENUM型をエクスポート
export type ProjectRole = Database["public"]["Enums"]["project_role"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];
export type AiProviderType = Database["public"]["Enums"]["ai_provider_type"];
export type PriorityType = Database["public"]["Enums"]["ticket_priority"];
export type StatusType = Database["public"]["Enums"]["ticket_status"];
export type CategoryType = Database["public"]["Enums"]["ticket_category"];
export type ActivityActionType = Database["public"]["Enums"]["activity_action"];

// 通知関連の型定義
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];

// 通知設定
export type NotificationSetting = Database["public"]["Tables"]["notification_settings"]["Row"];

// UI表示用（actor と ticket を JOIN した拡張型）
export type NotificationWithDetails = Notification & {
  actor: { username: string } | null;
  ticket: { title: string; project_id: string } | null;
};

// 添付ファイル関連の拡張型
export type AttachmentWithUploader = Attachment & {
  uploader: Profile | null;
};

// アクティビティ関連の型定義
export type TicketActivity = Database["public"]["Tables"]["ticket_activities"]["Row"];
export type TicketActivityWithProfile = TicketActivity & {
  actor: { id: string; username: string } | null;
};
