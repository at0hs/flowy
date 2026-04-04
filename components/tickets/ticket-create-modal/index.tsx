"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/app/(app)/projects/[id]/actions";
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
import { EqualIcon, ChevronsDownIcon, ChevronUpIcon, ChevronsUpIcon, Plus } from "lucide-react";
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
import { Ticket } from "@/types";

const STATUS_OPTIONS: { value: Ticket["status"]; label: string; className: string }[] = [
  { value: "todo", label: "TODO", className: "bg-slate-500/20 text-black hover:bg-slate-500/30" },
  {
    value: "in_progress",
    label: "進行中",
    className: "bg-blue-500/20 text-black hover:bg-blue-500/30",
  },
  {
    value: "done",
    label: "完了",
    className: "bg-green-500/20 text-black hover:bg-green-500/30",
  },
];

const PRIORITY_OPTIONS: {
  value: Ticket["priority"];
  label: string;
  icon: React.ElementType;
  iconColor: string;
}[] = [
  { value: "low", label: "低", icon: ChevronsDownIcon, iconColor: "text-blue-400" },
  { value: "medium", label: "中", icon: EqualIcon, iconColor: "text-orange-300" },
  { value: "high", label: "高", icon: ChevronUpIcon, iconColor: "text-red-400" },
  { value: "urgent", label: "緊急", icon: ChevronsUpIcon, iconColor: "text-red-400" },
];

interface RootTicket {
  id: string;
  title: string;
}

interface TicketCreateModalProps {
  projectId: string;
  members: ProjectMemberWithProfile[];
  rootTickets?: RootTicket[];
  defaultParentId?: string;
  triggerLabel?: string;
}

export function TicketCreateModal({
  projectId,
  members,
  rootTickets = [],
  defaultParentId,
  triggerLabel,
}: TicketCreateModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>(defaultParentId ?? "none");
  const [status, setStatus] = useState<Ticket["status"]>("todo");
  const [priority, setPriority] = useState<Ticket["priority"]>("medium");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("assignee_id", assigneeId === "none" ? "" : assigneeId);
    formData.set("parent_id", parentId === "none" ? "" : parentId);
    formData.set("status", status);
    formData.set("priority", priority);
    const isDescriptionEmpty = !description || description === "<p></p>";
    formData.set("description", isDescriptionEmpty ? "" : description);

    const result = await createTicket(projectId, formData);

    if (result?.error) {
      setErrorMessage(result.error);
    } else {
      setOpen(false);
      setAssigneeId("none");
      setParentId(defaultParentId ?? "none");
      setStatus("todo");
      setPriority("medium");
      setDescription("");
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMessage("");
      setAssigneeId("none");
      setParentId(defaultParentId ?? "none");
      setStatus("todo");
      setPriority("medium");
      setDescription("");
    }
    setOpen(nextOpen);
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status)!;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={triggerLabel ? "outline" : "default"}
          size={triggerLabel ? "sm" : "default"}
        >
          <Plus />
          {triggerLabel ?? "チケット作成"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>チケット作成</DialogTitle>
          <DialogDescription>必須フィールドにはアスタリスクが付いています *</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-2">
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="modal-title">タイトル *</Label>
              <Input id="modal-title" name="title" required />
            </div>

            {/* ステータス */}
            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0">ステータス *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Ticket["status"])}>
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
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="説明を入力..."
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
              <Select value={priority} onValueChange={(v) => setPriority(v as Ticket["priority"])}>
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
          </div>

          <Separator className="my-6" />

          {/* 親チケット */}
          {rootTickets.length > 0 && (
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
          )}

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
