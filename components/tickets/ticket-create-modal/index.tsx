"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket, updateTicketField } from "@/app/(app)/projects/[id]/actions/tickets";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  EqualIcon,
  ChevronsDownIcon,
  ChevronUpIcon,
  ChevronsUpIcon,
  Plus,
  CalendarIcon,
  X,
  Paperclip,
  LoaderCircle,
} from "lucide-react";
import { formatFileSize } from "@/components/tickets/attachment-section/attachment-item";
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
import { ProjectMemberWithProfile } from "@/lib/supabase/members";
import { PriorityType, StatusType, CategoryType } from "@/types";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { CATEGORY_CONFIG } from "@/lib/ticket-config";
import { ja } from "date-fns/locale";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: StatusType; label: string; className: string }[] = [
  {
    value: "todo",
    label: STATUS_LABELS.todo,
    className: "bg-slate-500/20 text-black hover:bg-slate-500/30",
  },
  {
    value: "in_progress",
    label: STATUS_LABELS.in_progress,
    className: "bg-blue-500/20 text-black hover:bg-blue-500/30",
  },
  {
    value: "done",
    label: STATUS_LABELS.done,
    className: "bg-green-500/20 text-black hover:bg-green-500/30",
  },
];

const PRIORITY_OPTIONS: {
  value: PriorityType;
  label: string;
  icon: React.ElementType;
  iconColor: string;
}[] = [
  { value: "low", label: PRIORITY_LABELS.low, icon: ChevronsDownIcon, iconColor: "text-blue-400" },
  {
    value: "medium",
    label: PRIORITY_LABELS.medium,
    icon: EqualIcon,
    iconColor: "text-orange-300",
  },
  { value: "high", label: PRIORITY_LABELS.high, icon: ChevronUpIcon, iconColor: "text-red-400" },
  {
    value: "urgent",
    label: PRIORITY_LABELS.urgent,
    icon: ChevronsUpIcon,
    iconColor: "text-red-400",
  },
];

const CATEGORY_OPTIONS = (
  Object.entries(CATEGORY_CONFIG) as [CategoryType, (typeof CATEGORY_CONFIG)[CategoryType]][]
).map(([value, config]) => ({ value, ...config }));

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

interface RootTicket {
  id: string;
  title: string;
}

export interface TicketDefaultValues {
  title?: string;
  description?: string;
  status?: StatusType;
  priority?: PriorityType;
  category?: CategoryType;
  assigneeId?: string;
  startDate?: Date;
  dueDate?: Date;
  parentId?: string;
}

interface TicketCreateModalProps {
  projectId: string;
  members: ProjectMemberWithProfile[];
  rootTickets?: RootTicket[];
  defaultParentId?: string;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultValues?: TicketDefaultValues;
}

export function TicketCreateModal({
  projectId,
  members,
  rootTickets = [],
  defaultParentId,
  triggerLabel,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  defaultValues,
}: TicketCreateModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [status, setStatus] = useState<StatusType>(defaultValues?.status ?? "todo");
  const [priority, setPriority] = useState<PriorityType>(defaultValues?.priority ?? "medium");
  const [category, setCategory] = useState<CategoryType>(defaultValues?.category ?? "task");
  const [startDate, setStartDate] = useState<Date | undefined>(defaultValues?.startDate);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(defaultValues?.dueDate);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
    }
    // isOpen の変化時のみ適用する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setPendingFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
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
        await updateTicketField(result.ticketId, projectId, {
          field: "description",
          value: finalDescription || null,
        });
      }
    }

    // 残存する Blob URL を解放
    for (const blobUrl of blobUrlToFileRef.current.keys()) {
      URL.revokeObjectURL(blobUrl);
    }
    blobUrlToFileRef.current.clear();

    if (!isControlled) setInternalOpen(false);
    externalOnOpenChange?.(false);
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
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
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
                    // CATEGORY_CONFIG[category].badgeAlphaClass
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
              <Select value={status} onValueChange={(v) => setStatus(v as StatusType)}>
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
              <Select value={priority} onValueChange={(v) => setPriority(v as PriorityType)}>
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
              <div className="flex items-center gap-2">
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-52 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {startDate ? (
                        format(startDate, "yyyy年MM月dd日", { locale: ja })
                      ) : (
                        <span className="text-muted-foreground">日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }}
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
                {startDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setStartDate(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* 期限 */}
            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0 text-muted-foreground">期限</Label>
              <div className="flex items-center gap-2">
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-52 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {dueDate ? (
                        format(dueDate, "yyyy年MM月dd日", { locale: ja })
                      ) : (
                        <span className="text-muted-foreground">日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setDueDateOpen(false);
                      }}
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
                {dueDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDueDate(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">
                  添付ファイル{pendingFiles.length > -1 && ` (${pendingFiles.length})`}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4.5 w-3.5" />
                  ファイルを追加
                </Button>
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelect} />
              </div>
              {pendingFiles.length > -1 && (
                <div className="border rounded-lg divide-y">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <Paperclip className="h-5 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-2 truncate" title={file.name}>
                        {file.name}
                      </span>
                      <span className="shrink text-muted-foreground text-xs">
                        {formatFileSize(file.size)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemovePendingFile(index)}
                      >
                        <X className="h-4.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
