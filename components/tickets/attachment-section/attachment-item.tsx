import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttachmentWithUploader } from "@/types";
import { getFileIcon } from "@/lib/file-icons";
import { formatFileSize } from "@/lib/utils";

interface AttachmentItemProps {
  attachment: AttachmentWithUploader;
  currentUserId: string;
  onPreviewRequest: (attachmentId: string, mimeType: string) => void;
  onDownloadRequest: (attachmentId: string, fileName: string) => void;
  onDeleteRequest: (attachmentId: string) => void;
}

function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

export function AttachmentItem({
  attachment,
  currentUserId,
  onPreviewRequest,
  onDownloadRequest,
  onDeleteRequest,
}: AttachmentItemProps) {
  const canDelete = attachment.uploaded_by === currentUserId;
  const previewable = isPreviewable(attachment.mime_type);

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm">
      {getFileIcon(attachment.mime_type)}
      <span
        className={[
          "flex-1 truncate",
          previewable ? "cursor-pointer text-primary hover:underline" : "text-foreground",
        ].join(" ")}
        title={attachment.file_name}
        onClick={
          previewable ? () => onPreviewRequest(attachment.id, attachment.mime_type) : undefined
        }
      >
        {attachment.file_name}
      </span>
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatFileSize(attachment.file_size)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground shrink-0"
        tooltip="ダウンロード"
        onClick={() => onDownloadRequest(attachment.id, attachment.file_name)}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
          tooltip="削除"
          onClick={() => onDeleteRequest(attachment.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
