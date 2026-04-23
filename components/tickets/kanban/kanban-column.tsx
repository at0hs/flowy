"use client";

import { useDroppable } from "@dnd-kit/core";
import { Ticket, StatusType } from "@/types";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/ticket-config";

type Props = {
  status: StatusType;
  label: string;
  tickets: Ticket[];
  projectId: string;
  assigneeMap: Record<string, string>;
};

export function KanbanColumn({ status, label, tickets, projectId, assigneeMap }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-0 flex-1">
      <div
        className={cn(
          "bg-card border border-t-2 rounded-lg flex flex-col h-full",
          STATUS_CONFIG[status].columnBorderClass,
          isOver && "bg-muted/50"
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
            {tickets.length}
          </span>
        </div>

        <div ref={setNodeRef} className="flex flex-col gap-2 p-2 flex-1 min-h-[120px]">
          {tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              projectId={projectId}
              assigneeName={ticket.assignee_id ? assigneeMap[ticket.assignee_id] : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
