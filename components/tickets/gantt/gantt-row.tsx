"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/ticket-config";
import type { Ticket } from "@/types";
import { GanttBar } from "./gantt-bar";

type GanttRowProps = {
  ticket: Ticket & { depth: number };
  projectId: string;
  rangeStart: Date;
  totalWidth: number;
  dayWidth: number;
  leftPanelWidth: number;
  rowHeight: number;
  todayX: number;
  onDatesChange: (ticketId: string, newStart: string | null, newDue: string | null) => void;
};

export function GanttRow({
  ticket,
  projectId,
  rangeStart,
  totalWidth,
  dayWidth,
  leftPanelWidth,
  rowHeight,
  todayX,
  onDatesChange,
}: GanttRowProps) {
  const statusConfig = STATUS_CONFIG[ticket.status];
  const indentPx = 12 + ticket.depth * 20;

  return (
    <div
      className="flex border-b border-border/40 hover:bg-muted/30 transition-colors"
      style={{ height: rowHeight }}
    >
      {/* 左パネル（sticky） */}
      <div
        className="sticky left-0 z-10 bg-background flex items-center gap-2 border-r border-border/40 shrink-0 overflow-hidden"
        style={{ width: leftPanelWidth, paddingLeft: indentPx, paddingRight: 8 }}
      >
        <Link
          href={`/projects/${projectId}/tickets/${ticket.id}`}
          className="text-xs truncate flex-1 min-w-0 hover:underline hover:text-primary"
        >
          {ticket.title}
        </Link>
        <span
          className={cn(
            "shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-sm text-foreground",
            statusConfig.badgeBgClass
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* タイムラインエリア */}
      <div className="relative shrink-0" style={{ width: totalWidth }}>
        {/* 今日線 */}
        {todayX >= 0 && todayX <= totalWidth && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-5 pointer-events-none"
            style={{ left: todayX }}
          />
        )}

        <GanttBar
          startDate={ticket.start_date}
          dueDate={ticket.due_date}
          rangeStart={rangeStart}
          dayWidth={dayWidth}
          rowHeight={rowHeight}
          onDatesChange={(newStart, newDue) => onDatesChange(ticket.id, newStart, newDue)}
        />
      </div>
    </div>
  );
}
