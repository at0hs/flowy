"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket, updateTicketDescription } from "@/app/(app)/projects/[id]/actions/tickets";
import {
  registerAttachment,
  getAttachmentUrl,
} from "@/app/(app)/projects/[id]/actions/attachments";
import { createClient } from "@/lib/supabase/client";
import { generateUUID } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, LoaderCircle } from "lucide-react";
import { TagSelector } from "@/components/tags/tag-selector";
import { addTagToTicket } from "@/app/(app)/projects/[id]/actions/tags";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { TicketPriority, TicketStatus, TicketCategory } from "@/types";
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG } from "@/lib/ticket-config";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DatePickerField } from "./date-picker-field";
import { PendingFileList } from "./pending-file-list";
import type { TicketCreateModalProps, TicketDefaultValues } from "./types";

export type { TicketDefaultValues };

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

const STATUS_OPTIONS = (
  Object.entries(STATUS_CONFIG) as [TicketStatus, (typeof STATUS_CONFIG)[TicketStatus]][]
).map(([value, config]) => ({ value, label: config.label, className: config.badgeAlphaClass }));

const PRIORITY_OPTIONS = (
  Object.entries(PRIORITY_CONFIG) as [TicketPriority, (typeof PRIORITY_CONFIG)[TicketPriority]][]
).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
  iconColor: config.iconColor,
}));

const CATEGORY_OPTIONS = (
  Object.entries(CATEGORY_CONFIG) as [TicketCategory, (typeof CATEGORY_CONFIG)[TicketCategory]][]
).map(([value, config]) => ({ value, ...config }));

export function TicketCreateModal({
  projectId,
  members,
  rootTickets = [],
  tags = [],
  defaultParentId,
  triggerLabel,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  defaultValues,
}: TicketCreateModalProps) {
  const router = useRouter();
  // Blob URL（画像プレビュー用）→ File のマッピング
  const blobUrlToFileRef = useRef<Map<string, File>>(new Map());
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [assigneeId, setAssigneeId] = useState<string>(defaultValues?.assigneeId ?? "none");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [parentId, setParentId] = useState<string>(
    defaultValues?.parentId ?? defaultParentId ?? "none"
  );
  const [status, setStatus] = useState<TicketStatus>(defaultValues?.status ?? "todo");
  const [priority, setPriority] = useState<TicketPriority>(defaultValues?.priority ?? "medium");
  const [category, setCategory] = useState<TicketCategory>(defaultValues?.category ?? "task");
  const [startDate, setStartDate] = useState<Date | undefined>(defaultValues?.startDate);
  const [dueDate, setDueDate] = useState<Date | undefined>(defaultValues?.dueDate);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultValues?.title ?? "");
      setDescription(defaultValues?.description ?? "");
      setStatus(defaultValues?.status ?? "todo");
      setPriority(defaultValues?.priority ?? "medium");
      setCategory(defaultValues?.category ?? "task");
      setAssigneeId(defaultValues?.assigneeId ?? "none");
      setStartDate(defaultValues?.startDate);
      setDueDate(defaultValues?.dueDate);
      setParentId(defaultValues?.parentId ?? defaultParentId ?? "none");
      setSelectedTagIds(defaultValues?.tagIds ?? []);
    }
    // isOpen の変化時のみ適用する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resetForm = () => {
    setTitle(defaultValues?.title ?? "");
    setAssigneeId(defaultValues?.assigneeId ?? "none");
    setParentId(defaultValues?.parentId ?? defaultParentId ?? "none");
    setStatus(defaultValues?.status ?? "todo");
    setPriority(defaultValues?.priority ?? "medium");
    setCategory(defaultValues?.category ?? "task");
    setDescription(defaultValues?.description ?? "");
    setStartDate(defaultValues?.startDate);
    setDueDate(defaultValues?.dueDate);
    setPendingFiles([]);
    setSelectedTagIds(defaultValues?.tagIds ?? []);
  };

  const handleImagePreview = (file: File, blobUrl: string) => {
    blobUrlToFileRef.current.set(blobUrl, file);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("assignee_id", assigneeId === "none" ? "" : assigneeId);
    formData.set("parent_id", parentId === "none" ? "" : parentId);
    formData.set("status", status);
    formData.set("priority", priority);
    formData.set("category", category);
    const isDescriptionEmpty = !description || description === "<p></p>";
    formData.set("description", isDescriptionEmpty ? "" : description);
    formData.set("start_date", startDate ? format(startDate, "yyyy-MM-dd") : "");
    formData.set("due_date", dueDate ? format(dueDate, "yyyy-MM-dd") : "");

    const result = await createTicket(projectId, formData);

    if (result?.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
      return;
    }

    // タグを付与
    if (selectedTagIds.length > 0 && result.ticketId) {
      await Promise.all(selectedTagIds.map((tagId) => addTagToTicket(result.ticketId!, tagId)));
    }

    // チケット INSERT 後に ticketId が確定してから添付ファイルをアップロード
    // 画像ファイルは Blob URL → 実 URL に置換して説明文を更新する
    if (pendingFiles.length > 0 && result.ticketId) {
      const supabase = createClient();
      let failedCount = 0;
      let finalDescription = isDescriptionEmpty ? "" : description;

      for (const file of pendingFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: ファイルサイズは30MB以下にしてください`);
          failedCount++;
          continue;
        }
        const ext =
          file.name.lastIndexOf(".") > -1 ? file.name.slice(file.name.lastIndexOf(".")) : "";
        const filePath = `${projectId}/${result.ticketId}/${generateUUID()}${ext}`;
        const { error: storageError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (storageError) {
          failedCount++;
          continue;
        }
        const registerResult = await registerAttachment(result.ticketId, projectId, {
          fileName: file.name,
          filePath,
          mimeType: file.type,
          fileSize: file.size,
        });
        if ("error" in registerResult) {
          await supabase.storage.from("attachments").remove([filePath]);
          failedCount++;
          continue;
        }

        // 画像ファイルの場合、プレビュー用 Blob URL を実 URL に置換する
        if (file.type.startsWith("image/")) {
          const blobUrl = [...blobUrlToFileRef.current.entries()].find(([, f]) => f === file)?.[0];
          if (blobUrl) {
            const urlResult = await getAttachmentUrl(registerResult.attachment.id);
            if ("url" in urlResult) {
              finalDescription = finalDescription.replace(blobUrl, urlResult.url);
            }
            URL.revokeObjectURL(blobUrl);
            blobUrlToFileRef.current.delete(blobUrl);
          }
        }
      }

      if (failedCount > 0) {
        toast.error(`${failedCount}件のファイルのアップロードに失敗しました`);
      }

      // Blob URL の置換が発生していた場合、説明文を更新する
      const originalDescription = isDescriptionEmpty ? "" : description;
      if (finalDescription !== originalDescription) {
        await updateTicketDescription(result.ticketId, finalDescription || null);
      }
    }

    // 残存する Blob URL を解放
    for (const blobUrl of blobUrlToFileRef.current.keys()) {
      URL.revokeObjectURL(blobUrl);
    }
    blobUrlToFileRef.current.clear();

    if (!isControlled) setInternalOpen(false);
    externalOnOpenChange?.(false);
    resetForm();
    router.refresh();
    setIsLoading(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // キャンセル時は Blob URL を全て解放する
      for (const blobUrl of blobUrlToFileRef.current.keys()) {
        URL.revokeObjectURL(blobUrl);
      }
      blobUrlToFileRef.current.clear();
      setErrorMessage("");
      resetForm();
    }
    if (!isControlled) setInternalOpen(nextOpen);
    externalOnOpenChange?.(nextOpen);
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status)!;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            variant={triggerLabel ? "outline" : "default"}
            size={triggerLabel ? "sm" : "default"}
          >
            <Plus />
            {triggerLabel ?? "チケット作成"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>チケット作成</DialogTitle>
          <DialogDescription className="text-xs">
            必須フィールドにはアスタリスクが付いています *
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-2">
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

            {/* カテゴリ */}
            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0">カテゴリ *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger
                  className={cn(
                    "w-auto",
                    "h-7",
                    "px-3",
                    "text-xs",
                    "font-medium",
                    "border-0",
                    "shadow-none",
                    "rounded-sm",
                    "gap-1",
                    "transition-colors",
                    "text-black"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <c.icon className={`w-4 h-4 ${c.iconColor}`} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="modal-title">タイトル *</Label>
              <Input
                id="modal-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* ステータス */}
            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0">ステータス *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                <SelectTrigger
                  className={`w-auto h-7 px-3 text-xs font-medium border-0 shadow-none rounded-sm gap-1 transition-colors ${currentStatus.className}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 説明 */}
            <div className="space-y-2">
              <Label>説明</Label>
              <p className="text-muted-foreground text-xs">
                画像をドラッグ＆ドロップするとエディタに挿入されます
              </p>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="説明を入力..."
                onFileDrop={(files) => setPendingFiles((prev) => [...prev, ...files])}
                onImagePreview={handleImagePreview}
              />
            </div>

            {/* 担当者 */}
            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0 text-muted-foreground">担当者</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未選択（担当者なし）</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile.username || member.profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 優先度 */}
            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0 text-muted-foreground">優先度 *</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger className="w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <p.icon className={`w-4 h-4 stroke-[3px] ${p.iconColor}`} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 開始日 */}
            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0 text-muted-foreground">開始日</Label>
              <DatePickerField value={startDate} onChange={setStartDate} />
            </div>

            {/* 期限 */}
            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0 text-muted-foreground">期限</Label>
              <DatePickerField value={dueDate} onChange={setDueDate} />
            </div>

            {/* タグ */}
            {tags.length > 0 && (
              <div className="flex items-start gap-4">
                <Label className="w-24 shrink-0 text-muted-foreground pt-1.5">タグ</Label>
                <div className="flex-1">
                  <TagSelector
                    tags={tags}
                    selectedTagIds={selectedTagIds}
                    onChange={setSelectedTagIds}
                  />
                </div>
              </div>
            )}

            {/* 親チケット */}
            {rootTickets.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="flex items-center gap-4">
                  <Label className="w-24 shrink-0 text-muted-foreground">親チケット</Label>
                  <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger className="w-80 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="親チケットを選択" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="none">なし</SelectItem>
                      {rootTickets.map((ticket) => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          <span className="block truncate max-w-80">{ticket.title}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Separator className="my-6" />

            {/* 添付ファイル */}
            <PendingFileList
              files={pendingFiles}
              onRemove={(index) => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
              onAdd={(files) => setPendingFiles((prev) => [...prev, ...files])}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
