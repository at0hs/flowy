"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";

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

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("assignee_id", assigneeId === "none" ? "" : assigneeId);
    formData.set("parent_id", parentId === "none" ? "" : parentId);
    const isDescriptionEmpty = !description || description === "<p></p>";
    formData.set("description", isDescriptionEmpty ? "" : description);

    const result = await createTicket(projectId, formData);

    if (result?.error) {
      setErrorMessage(result.error);
    } else {
      setOpen(false);
      setAssigneeId("none");
      setParentId(defaultParentId ?? "none");
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
      setDescription("");
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={triggerLabel ? "outline" : "default"}
          size={triggerLabel ? "sm" : "default"}
        >
          {triggerLabel ?? "+ チケット作成"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>チケット作成</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-2">
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="modal-title">タイトル *</Label>
              <Input id="modal-title" name="title" required />
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

            <Separator />

            {/* 担当者 */}
            <div className="space-y-2">
              <Label>担当者</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
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

            {/* 親チケット */}
            {rootTickets.length > 0 && (
              <div className="space-y-2">
                <Label>親チケット</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="親チケットを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {rootTickets.map((ticket) => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        {ticket.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* ステータス */}
            <div className="space-y-3">
              <Label>ステータス *</Label>
              <RadioGroup name="status" defaultValue="todo">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="todo" id="modal-todo" />
                  <Label htmlFor="modal-todo">TODO</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="in_progress" id="modal-in_progress" />
                  <Label htmlFor="modal-in_progress">進行中</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="done" id="modal-done" />
                  <Label htmlFor="modal-done">完了</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* 優先度 */}
            <div className="space-y-3">
              <Label>優先度 *</Label>
              <RadioGroup name="priority" defaultValue="medium">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="low" id="modal-low" />
                  <Label htmlFor="modal-low">低</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="medium" id="modal-medium" />
                  <Label htmlFor="modal-medium">中</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="high" id="modal-high" />
                  <Label htmlFor="modal-high">高</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="urgent" id="modal-urgent" />
                  <Label htmlFor="modal-urgent">緊急</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

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
