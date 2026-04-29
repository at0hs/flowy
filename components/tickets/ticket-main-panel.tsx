"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket } from "@/types";
import { updateTicketField } from "@/app/(app)/projects/[id]/actions/tickets";
import { InlineTitle } from "./ticket-inline-edit/inline-title";
import { InlineDescription } from "./ticket-inline-edit/inline-description";

type Props = {
  ticket: Ticket;
  projectId: string;
};

export function TicketMainPanel({ ticket, projectId }: Props) {
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
    <div>
      {/* タイトル */}
      <div className="mb-6">
        <InlineTitle
          value={localTicket.title}
          onSave={(v) => save({ field: "title", value: v }, { title: v })}
          disabled={isPending}
        />
      </div>

      {/* 説明 */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          説明
        </p>
        <p className="text-muted-foreground text-xs mb-1">
          画像をドラッグ＆ドロップするとエディタに挿入されます
        </p>
        <InlineDescription
          value={localTicket.description}
          onSave={(v) => save({ field: "description", value: v }, { description: v })}
          disabled={isPending}
          ticketId={ticket.id}
          projectId={projectId}
          onAttachmentUploaded={() => router.refresh()}
        />
      </div>
    </div>
  );
}
