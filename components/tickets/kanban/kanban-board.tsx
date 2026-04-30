"use client";

import { useState, useTransition, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { Ticket, TicketStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { updateTicketField } from "@/app/(app)/projects/[id]/actions/tickets";
import { STATUS_LABELS } from "@/lib/constants";

const STATUSES: TicketStatus[] = ["todo", "in_progress", "done"];

type Props = {
  tickets: Ticket[];
  projectId: string;
  assigneeMap: Record<string, { username: string; avatarFilePath?: string | null }>;
};

export function KanbanBoard({ tickets: initialTickets, projectId, assigneeMap }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as TicketStatus;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    const prevStatus = ticket.status;

    // 楽観的更新
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));

    startTransition(async () => {
      const result = await updateTicketField(ticketId, projectId, {
        field: "status",
        value: newStatus,
        prevValue: prevStatus,
      });

      if ("error" in result) {
        // ロールバック
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: prevStatus } : t))
        );
        router.refresh();
      }
    });
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 mt-4 items-start overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            label={STATUS_LABELS[status]}
            tickets={tickets.filter((t) => t.status === status)}
            projectId={projectId}
            assigneeMap={assigneeMap}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket && (
          <KanbanCard
            ticket={activeTicket}
            projectId={projectId}
            assignee={activeTicket.assignee_id ? assigneeMap[activeTicket.assignee_id] : undefined}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
