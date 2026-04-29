"use client";

import { useState } from "react";
import { MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteTicketButton } from "./delete-ticket-button";
import { CopyTicketButton } from "@/components/tickets/copy-ticket-button";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";
import { Ticket } from "@/types";

interface Props {
  ticket: Ticket;
  projectId: string;
  members: ProjectMemberWithProfile[];
  rootTickets: { id: string; title: string }[];
}

export function TicketActionsMenu({ ticket, projectId, members, rootTickets }: Props) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCopyOpen, setIsCopyOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="メニューを開く">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsCopyOpen(true)}>
            <Copy className="w-4 h-4 mr-2" />
            複製
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteTicketButton
        ticketId={ticket.id}
        projectId={projectId}
        ticketTitle={ticket.title}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
      <CopyTicketButton
        ticket={ticket}
        projectId={projectId}
        members={members}
        rootTickets={rootTickets}
        open={isCopyOpen}
        onOpenChange={setIsCopyOpen}
      />
    </>
  );
}
