"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket, Tag } from "@/types";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";
import {
  updateTicketStatus,
  updateTicketPriority,
  updateTicketAssignee,
  updateTicketStartDate,
  updateTicketDueDate,
} from "@/app/(app)/projects/[id]/actions/tickets";
import { addTagToTicket, removeTagFromTicket } from "@/app/(app)/projects/[id]/actions/tags";
import { InlineStatus } from "./ticket-inline-edit/inline-status";
import { InlinePriority } from "./ticket-inline-edit/inline-priority";
import { InlineCategory } from "./ticket-inline-edit/inline-category";
import { InlineAssignee } from "./ticket-inline-edit/inline-assignee";
import { InlineStartDate } from "./ticket-inline-edit/inline-start-date";
import { InlineDueDate } from "./ticket-inline-edit/inline-due-date";
import { TagSelector } from "@/components/tags/tag-selector";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/date";

type Props = {
  ticket: Ticket;
  projectId: string;
  members: ProjectMemberWithProfile[];
  currentUserId: string;
  projectTags: Tag[];
  ticketTags: Tag[];
};

export function TicketPropertyPanel({
  ticket,
  members,
  currentUserId,
  projectTags,
  ticketTags,
}: Props) {
  const [localTicket, setLocalTicket] = useState(ticket);
  const [localTagIds, setLocalTagIds] = useState(ticketTags.map((t) => t.id));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function save(
    actionFn: () => Promise<{ success: true } | { error: string }>,
    optimistic: Partial<Ticket>
  ) {
    const rollback = { ...localTicket };
    setLocalTicket((prev) => ({ ...prev, ...optimistic }));

    startTransition(async () => {
      const result = await actionFn();
      if ("error" in result) {
        setLocalTicket(rollback);
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  async function handleTagChange(newTagIds: string[]) {
    const added = newTagIds.filter((id) => !localTagIds.includes(id));
    const removed = localTagIds.filter((id) => !newTagIds.includes(id));

    const rollback = [...localTagIds];
    setLocalTagIds(newTagIds);

    startTransition(async () => {
      const results = await Promise.all([
        ...added.map((id) => addTagToTicket(ticket.id, id)),
        ...removed.map((id) => removeTagFromTicket(ticket.id, id)),
      ]);

      const errors = results.filter((r) => "error" in r);
      if (errors.length > 0) {
        setLocalTagIds(rollback);
        toast.error((errors[0] as { error: string }).error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-1 text-sm">
      {/* カテゴリ */}
      <PropertyRow label="カテゴリ">
        <InlineCategory value={localTicket.category} />
      </PropertyRow>

      <Separator />

      {/* ステータス */}
      <PropertyRow label="ステータス">
        <InlineStatus
          value={localTicket.status}
          onSave={(v) =>
            save(() => updateTicketStatus(ticket.id, v, localTicket.status), { status: v })
          }
          disabled={isPending}
        />
      </PropertyRow>

      <Separator />

      {/* 優先度 */}
      <PropertyRow label="優先度">
        <InlinePriority
          value={localTicket.priority}
          onSave={(v) =>
            save(() => updateTicketPriority(ticket.id, v, localTicket.priority), { priority: v })
          }
          disabled={isPending}
        />
      </PropertyRow>

      <Separator />

      {/* 担当者 */}
      <PropertyRow label="担当者">
        <InlineAssignee
          value={localTicket.assignee_id}
          currentUserId={currentUserId}
          members={members}
          onSave={(v) =>
            save(() => updateTicketAssignee(ticket.id, v, localTicket.assignee_id), {
              assignee_id: v,
            })
          }
          disabled={isPending}
        />
      </PropertyRow>

      <Separator />

      {/* 開始日 */}
      <PropertyRow label="開始日">
        <InlineStartDate
          value={localTicket.start_date}
          onSave={(v) => save(() => updateTicketStartDate(ticket.id, v), { start_date: v })}
          disabled={isPending}
        />
      </PropertyRow>

      <Separator />

      {/* 期限 */}
      <PropertyRow label="期限">
        <InlineDueDate
          value={localTicket.due_date}
          onSave={(v) => save(() => updateTicketDueDate(ticket.id, v), { due_date: v })}
          disabled={isPending}
        />
      </PropertyRow>

      <Separator />

      {/* タグ */}
      <PropertyRow label="タグ">
        <TagSelector
          tags={projectTags}
          selectedTagIds={localTagIds}
          onChange={handleTagChange}
          disabled={isPending}
        />
      </PropertyRow>

      <Separator />

      {/* メタ情報 */}
      <div className="pt-2 text-xs text-muted-foreground space-y-1 px-1">
        <p>作成：{formatRelativeTime(ticket.created_at)}</p>
        <p>更新：{formatRelativeTime(ticket.updated_at)}</p>
      </div>
    </div>
  );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="text-xs text-muted-foreground mb-1 px-1">{label}</p>
      {children}
    </div>
  );
}
