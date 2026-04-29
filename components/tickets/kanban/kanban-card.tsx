"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Ticket } from "@/types";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/lib/ticket-config";

type Props = {
  ticket: Ticket;
  projectId: string;
  assignee?: { username: string; avatarPath?: string | null };
};

export function KanbanCard({ ticket, projectId, assignee }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm select-none",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <Link
        href={`/projects/${projectId}/tickets/${ticket.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium leading-snug line-clamp-2 hover:underline">
          {ticket.title}
        </p>
      </Link>

      <div className="flex items-center justify-between mt-2 gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block w-2 h-2 rounded-full shrink-0",
              PRIORITY_CONFIG[ticket.priority].dotColor
            )}
          />
          <span className="text-sm text-muted-foreground">
            {PRIORITY_CONFIG[ticket.priority].label}
          </span>
        </div>

        {ticket.due_date && (
          <span className="text-xs text-muted-foreground">
            {new Date(ticket.due_date).toLocaleDateString("ja-JP", {
              month: "numeric",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {assignee && (
        <div className="mt-1.5">
          <span className="text-xs text-muted-foreground">{assignee.username}</span>
        </div>
      )}
    </div>
  );
}
