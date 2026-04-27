"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketCreateModal } from "@/components/tickets/ticket-create-modal";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";
import { Ticket } from "@/types";

interface RootTicket {
  id: string;
  title: string;
}

interface CopyTicketButtonProps {
  ticket: Ticket;
  projectId: string;
  members: ProjectMemberWithProfile[];
  rootTickets: RootTicket[];
}

export function CopyTicketButton({
  ticket,
  projectId,
  members,
  rootTickets,
}: CopyTicketButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultValues = {
    title: `${ticket.title} のコピー`,
    description: ticket.description ?? undefined,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    assigneeId: ticket.assignee_id ?? "none",
    startDate: ticket.start_date ? new Date(ticket.start_date + "T00:00:00") : undefined,
    dueDate: ticket.due_date ? new Date(ticket.due_date + "T00:00:00") : undefined,
    parentId: ticket.parent_id ?? "none",
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Copy className="w-4 h-4" />
        コピー
      </Button>
      <TicketCreateModal
        projectId={projectId}
        members={members}
        rootTickets={rootTickets}
        open={isOpen}
        onOpenChange={setIsOpen}
        defaultValues={defaultValues}
      />
    </>
  );
}
