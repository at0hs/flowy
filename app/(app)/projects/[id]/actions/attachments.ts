"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { insertAttachment, deleteAttachment } from "@/lib/supabase/attachments";
import { Attachment } from "@/types";
import { revalidatePath } from "next/cache";

export async function removeAttachment(
  attachmentId: string,
  ticketId: string,
  projectId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: attachment, error: fetchError } = await supabase
    .from("attachments")
    .select("file_path, uploaded_by")
    .eq("id", attachmentId)
    .single();

  if (fetchError || !attachment) {
    logger.error("Failed to fetch attachment:", fetchError);
    return { error: "添付ファイルが見つかりません" };
  }

  if (attachment.uploaded_by !== user.id) {
    return { error: "自分がアップロードしたファイルのみ削除できます" };
  }

  const { error: storageError } = await supabase.storage
    .from("attachments")
    .remove([attachment.file_path]);

  if (storageError) {
    logger.error("Failed to delete file from storage:", storageError);
    return { error: "ファイルの削除に失敗しました" };
  }

  try {
    await deleteAttachment(attachmentId);
  } catch (err) {
    logger.error("Failed to delete attachment record:", err);
    return { error: "添付ファイルの削除に失敗しました" };
  }

  revalidatePath(`/projects/${projectId}/tickets/${ticketId}`);
  return { success: true };
}

/**
 * クライアント側で Supabase Storage に直接アップロード後、DBレコードを登録する
 * ファイル本体は受け取らず、アップロード済みのメタデータのみを受け取る
 */
export async function registerAttachment(
  ticketId: string,
  projectId: string,
  params: {
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
  }
): Promise<{ success: true; attachment: Attachment } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    const attachment = await insertAttachment({
      ticketId,
      uploadedBy: user.id,
      fileName: params.fileName,
      filePath: params.filePath,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
    });
    revalidatePath(`/projects/${projectId}/tickets/${ticketId}`);
    return { success: true, attachment };
  } catch (err) {
    logger.error("Failed to register attachment record:", err);
    return { error: "添付ファイルの保存に失敗しました" };
  }
}

export async function getAttachmentUrl(
  attachmentId: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "認証が必要です" };

  const { data: attachment, error: fetchError } = await supabase
    .from("attachments")
    .select("file_path")
    .eq("id", attachmentId)
    .single();

  if (fetchError || !attachment) {
    logger.error("Failed to fetch attachment for signed URL:", fetchError);
    return { error: "添付ファイルが見つかりません" };
  }

  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(attachment.file_path, 3600);

  if (error) {
    logger.error("Failed to create signed URL:", error);
    return { error: "URLの生成に失敗しました" };
  }

  return { url: data.signedUrl };
}
