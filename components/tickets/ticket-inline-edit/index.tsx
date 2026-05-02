"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket } from "@/types";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";
import {
  updateTicketTitle,
  updateTicketDescription,
  updateTicketStatus,
  updateTicketPriority,
  updateTicketAssignee,
  updateTicketStartDate,
  updateTicketDueDate,
} from "@/app/(app)/projects/[id]/actions/tickets";
import { InlineTitle } from "./inline-title";
import { InlineDescription } from "./inline-description";
import { InlineStatus } from "./inline-status";
import { InlinePriority } from "./inline-priority";
import { InlineCategory } from "./inline-category";
import { InlineAssignee } from "./inline-assignee";
import { InlineDueDate } from "./inline-due-date";
import { InlineStartDate } from "./inline-start-date";

type Props = {
  ticket: Ticket;
  projectId: string;
  members: ProjectMemberWithProfile[];
  currentUserId?: string;
};

export function TicketInlineEditPanel({ ticket, projectId, members, currentUserId }: Props) {
  const [localTicket, setLocalTicket] = useState(ticket);
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

  return (
    <div className="mt-4">
      {/* カテゴリ（変更不可バッジ） */}
      <div className="mb-2">
        <InlineCategory value={localTicket.category} />
      </div>

      {/* タイトル */}
      <div className="mb-6">
        <InlineTitle
          value={localTicket.title}
          onSave={(v) => save(() => updateTicketTitle(ticket.id, v), { title: v })}
          disabled={isPending}
        />
      </div>

      {/* ステータス（バッジ） */}
      <div className="mb-3">
        <InlineStatus
          value={localTicket.status}
          onSave={(v) =>
            save(() => updateTicketStatus(ticket.id, v, localTicket.status), { status: v })
          }
          disabled={isPending}
        />
      </div>

      {/* 説明 */}
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          説明
        </p>
        <p className="text-muted-foreground text-xs mb-1">
          画像をドラッグ＆ドロップするとエディタに挿入されます
        </p>
        <InlineDescription
          value={localTicket.description}
          onSave={(v) => save(() => updateTicketDescription(ticket.id, v), { description: v })}
          disabled={isPending}
          ticketId={ticket.id}
          projectId={projectId}
          onAttachmentUploaded={() => router.refresh()}
        />
      </div>

      {/* プロパティグリッド */}
      <div className="grid grid-cols-[7rem_1fr] gap-y-1 items-start text-sm">
        {/* 担当者 */}
        <span className="text-muted-foreground pt-1.5">担当者</span>
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

        {/* 優先度 */}
        <span className="text-muted-foreground pt-1.5">優先度</span>
        <div>
          <InlinePriority
            value={localTicket.priority}
            onSave={(v) =>
              save(() => updateTicketPriority(ticket.id, v, localTicket.priority), { priority: v })
            }
            disabled={isPending}
          />
        </div>

        {/* 開始日 */}
        <span className="text-muted-foreground pt-1.5">開始日</span>
        <InlineStartDate
          value={localTicket.start_date}
          onSave={(v) => save(() => updateTicketStartDate(ticket.id, v), { start_date: v })}
          disabled={isPending}
        />

        {/* 期限 */}
        <span className="text-muted-foreground pt-1.5">期限</span>
        <InlineDueDate
          value={localTicket.due_date}
          onSave={(v) => save(() => updateTicketDueDate(ticket.id, v), { due_date: v })}
          disabled={isPending}
        />
      </div>
    </div>
  );
}
