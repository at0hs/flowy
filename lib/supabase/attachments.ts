import { createClient } from "./server";
import { Attachment, AttachmentWithUploader } from "@/types";
import { logger } from "@/lib/logger";

/**
 * チケットの添付ファイル一覧を取得（アップロード者プロフィール付き）
 * @param ticketId チケットID
 * @returns 添付ファイル（アップロード者プロフィール付き）の配列
 */
export async function getAttachments(ticketId: string): Promise<AttachmentWithUploader[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attachments")
    .select("*, uploader:profiles!attachments_uploaded_by_fkey(*)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to fetch attachments:", error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...row,
    uploader: row.uploader ?? null,
  }));
}

/**
 * 添付ファイルレコードを挿入
 * @returns 作成された添付ファイルレコード
 */
export async function insertAttachment(params: {
  ticketId: string;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
}): Promise<Attachment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      ticket_id: params.ticketId,
      uploaded_by: params.uploadedBy,
      file_name: params.fileName,
      file_path: params.filePath,
      mime_type: params.mimeType,
      file_size: params.fileSize,
    })
    .select()
    .single();

  if (error) {
    logger.error("Failed to insert attachment:", error);
    throw error;
  }

  return data;
}

/**
 * 添付ファイルレコードを削除
 * @param id 添付ファイルID
 */
export async function deleteAttachment(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("attachments").delete().eq("id", id);

  if (error) {
    logger.error("Failed to delete attachment:", error);
    throw error;
  }
}
