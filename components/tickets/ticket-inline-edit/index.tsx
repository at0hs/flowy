"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket } from "@/types";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";
import { updateTicketField } from "@/app/(app)/projects/[id]/actions";
import { InlineTitle } from "./inline-title";
import { InlineDescription } from "./inline-description";
import { InlineStatus } from "./inline-status";
import { InlinePriority } from "./inline-priority";
import { InlineAssignee } from "./inline-assignee";

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
    update: Parameters<typeof updateTicketField>[2],
    optimistic: Partial<Ticket>
  ) {
    const rollback = { ...localTicket };
    setLocalTicket((prev) => ({ ...prev, ...optimistic }));

    startTransition(async () => {
      const result = await updateTicketField(ticket.id, projectId, update);
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
      {/* タイトル */}
      <div className="mb-6">
        <InlineTitle
          value={localTicket.title}
          onSave={(v) => save({ field: "title", value: v }, { title: v })}
          disabled={isPending}
        />
      </div>

      {/* ステータス（バッジ） */}
      <div className="mb-3">
        <InlineStatus
          value={localTicket.status}
          onSave={(v) =>
            save({ field: "status", value: v, prevValue: localTicket.status }, { status: v })
          }
          disabled={isPending}
        />
      </div>

      {/* 説明 */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          説明
        </p>
        <InlineDescription
          value={localTicket.description}
          onSave={(v) => save({ field: "description", value: v }, { description: v })}
          disabled={isPending}
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
            save(
              { field: "assignee_id", value: v, prevValue: localTicket.assignee_id },
              { assignee_id: v }
            )
          }
          disabled={isPending}
        />

        {/* 優先度 */}
        <span className="text-muted-foreground pt-1.5">優先度</span>
        <div>
          <InlinePriority
            value={localTicket.priority}
            onSave={(v) =>
              save(
                { field: "priority", value: v, prevValue: localTicket.priority },
                { priority: v }
              )
            }
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}
