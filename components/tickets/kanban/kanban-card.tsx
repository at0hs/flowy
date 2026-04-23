"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Ticket } from "@/types";
import { PRIORITY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
};

type Props = {
  ticket: Ticket;
  projectId: string;
  assigneeName?: string;
};

export function KanbanCard({ ticket, projectId, assigneeName }: Props) {
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
              PRIORITY_COLORS[ticket.priority] ?? "bg-gray-400"
            )}
          />
          <span className="text-xs text-muted-foreground">
            {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
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

      {assigneeName && (
        <div className="mt-1.5">
          <span className="text-xs text-muted-foreground">{assigneeName}</span>
        </div>
      )}
    </div>
  );
}
