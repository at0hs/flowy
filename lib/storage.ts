import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

/**
 * ファイルを Supabase Storage にアップロード
 * @param bucket - バケット名（例: "attachments"）
 * @param file - アップロードするファイル
 * @param path - ストレージ内のパス（例: "project-1/ticket-1/file.pdf"）
 * @returns アップロード後のパス
 */
export async function uploadFile(bucket: string, file: File, path: string): Promise<string> {
  const client = createClient();
  const { data, error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    logger.error("uploadFile: Supabase error", error);
    throw error;
  }

  logger.debug("uploadFile: success", { path: data.path });
  return data.path;
}

/**
 * Supabase Storage からファイルを削除
 * @param bucket - バケット名
 * @param path - 削除するファイルのパス
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const client = createClient();
  const { error } = await client.storage.from(bucket).remove([path]);

  if (error) {
    logger.error("deleteFile: Supabase error", error);
    throw error;
  }

  logger.debug("deleteFile: success", { path });
}

/**
 * 署名付きURL を取得（一定期間有効）
 * @param bucket - バケット名
 * @param path - ファイルのパス
 * @param expiresIn - URL の有効期間（秒、デフォルト24時間 = 86400）
 * @returns 署名付きURL
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 86400
): Promise<string> {
  const client = createClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresIn);

  if (error) {
    logger.error("getSignedUrl: Supabase error", error);
    throw error;
  }

  logger.debug("getSignedUrl: success", { path, expiresIn });
  return data.signedUrl;
}
