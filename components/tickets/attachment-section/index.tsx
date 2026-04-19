"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { AttachmentWithUploader } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { cn, generateUUID } from "@/lib/utils";
import {
  registerAttachment,
  removeAttachment,
  getAttachmentUrl,
} from "@/app/(app)/projects/[id]/actions";

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
import { AttachmentItem } from "./attachment-item";

interface AttachmentSectionProps {
  attachments: AttachmentWithUploader[];
  ticketId: string;
  projectId: string;
  currentUserId: string;
}

export function AttachmentSection({
  attachments,
  ticketId,
  projectId,
  currentUserId,
}: AttachmentSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("ファイルサイズは30MB以下にしてください");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const filePath = `${projectId}/${ticketId}/${generateUUID()}-${file.name}`;
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (storageError) {
        toast.error("ファイルのアップロードに失敗しました");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const result = await registerAttachment(ticketId, projectId, {
        fileName: file.name,
        filePath,
        mimeType: file.type,
        fileSize: file.size,
      });
      if ("error" in result) {
        toast.error(result.error);
        // DB登録失敗時はアップロード済みファイルをロールバック削除
        await supabase.storage.from("attachments").remove([filePath]);
      } else {
        toast.success("ファイルをアップロードしました");
        router.refresh();
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  async function handlePreview(attachmentId: string, mimeType: string) {
    setIsLoadingUrl(true);
    const result = await getAttachmentUrl(attachmentId);
    setIsLoadingUrl(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setPreviewUrl(result.url);
    setPreviewMime(mimeType);
  }

  async function handleDownload(attachmentId: string) {
    const result = await getAttachmentUrl(attachmentId);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const a = document.createElement("a");
    a.href = result.url;
    a.download = "";
    a.click();
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    startDeleteTransition(async () => {
      const result = await removeAttachment(deleteTargetId, ticketId, projectId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("ファイルを削除しました");
        router.refresh();
      }
      setDeleteTargetId(null);
    });
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          添付ファイル{attachments.length > 0 && ` (${attachments.length})`}
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          disabled={isPending || isLoadingUrl}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-3.5 w-3.5" />
          {isPending ? "アップロード中..." : "添付ファイルを追加"}
        </Button>
        <input ref={fileInputRef} type="file" hidden onChange={handleUpload} disabled={isPending} />
      </div>

      {/* ファイルリスト */}
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">添付ファイルはありません</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              currentUserId={currentUserId}
              onPreviewRequest={handlePreview}
              onDownloadRequest={handleDownload}
              onDeleteRequest={setDeleteTargetId}
            />
          ))}
        </div>
      )}

      {/* プレビューDialog */}
      <Dialog
        open={previewUrl !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewUrl(null);
            setPreviewMime(null);
          }
        }}
      >
        <DialogContent
          className={cn(
            "dark",
            "text-white",
            "p-4",
            "flex",
            "flex-col",
            "max-w-none!",
            "w-screen!",
            "h-screen!",
            "translate-x-0!",
            "translate-y-0!",
            "top-0!",
            "left-0!",
            "rounded-none!"
          )}
        >
          <DialogHeader>
            <DialogTitle className="sr-only">プレビュー</DialogTitle>
            <DialogDescription className="sr-only">画像やPDFのプレビューです</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {previewUrl && previewMime?.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="プレビュー"
                className="max-w-full max-h-full object-contain rounded"
              />
            )}
            {previewUrl && previewMime === "application/pdf" && (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded border"
                title="PDFプレビュー"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認Dialog */}
      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <DialogContent>
          <DialogTitle>ファイルを削除しますか？</DialogTitle>
          <DialogDescription>この操作は取り消せません。</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? <LoaderCircle className="animate-spin" /> : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
