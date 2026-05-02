"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/types";
import {
  updateTicketStartDate,
  updateTicketDueDate,
} from "@/app/(app)/projects/[id]/actions/tickets";
import {
  type GanttScale,
  getViewConfig,
  getRangeStart,
  dateToX,
  formatDateString,
  flattenTickets,
} from "./gantt-utils";
import { GanttHeader } from "./gantt-header";
import { GanttRow } from "./gantt-row";

const LEFT_PANEL_WIDTH = 280;
const ROW_HEIGHT = 40;

type GanttChartProps = {
  tickets: Ticket[];
  projectId: string;
};

export function GanttChart({ tickets, projectId }: GanttChartProps) {
  const [scale, setScale] = useState<GanttScale>("week");
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // チケット一覧が外部から更新された場合に同期
  useEffect(() => {
    setLocalTickets(tickets);
  }, [tickets]);

  const { dayWidth, rangeDays } = getViewConfig(scale);
  const rangeStart = getRangeStart(scale);
  const totalWidth = rangeDays * dayWidth;

  // 今日線のx座標
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateString(today);
  const todayX = dateToX(todayStr, rangeStart, dayWidth);
  // 週ビューは今日セルの中央に線を引く
  const todayLineX = scale === "week" ? todayX + dayWidth / 2 : todayX;

  const flatTickets = flattenTickets(localTickets);

  // スケール変更時・初期表示時に今日を中央スクロール
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const centerX = todayX + LEFT_PANEL_WIDTH;
    container.scrollLeft = centerX - container.clientWidth / 2;
  }, [scale, todayX]);

  function scrollToToday() {
    const container = scrollRef.current;
    if (!container) return;
    const centerX = todayX + LEFT_PANEL_WIDTH;
    container.scrollLeft = centerX - container.clientWidth / 2;
  }

  async function handleDatesChange(
    ticketId: string,
    newStart: string | null,
    newDue: string | null
  ) {
    const prevTickets = localTickets;
    const ticket = prevTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    // 楽観的更新
    setLocalTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, start_date: newStart, due_date: newDue } : t))
    );

    startTransition(async () => {
      try {
        const updates: Promise<{ success: true } | { error: string }>[] = [];

        if (newStart !== ticket.start_date) {
          updates.push(updateTicketStartDate(ticketId, newStart));
        }
        if (newDue !== ticket.due_date) {
          updates.push(updateTicketDueDate(ticketId, newDue));
        }

        const results = await Promise.all(updates);
        const firstError = results.find((r): r is { error: string } => "error" in r);

        if (firstError) {
          toast.error("日付の更新に失敗しました");
          setLocalTickets(prevTickets);
        }
      } catch {
        toast.error("日付の更新に失敗しました");
        setLocalTickets(prevTickets);
      }
    });
  }

  const scaleLabels: Record<GanttScale, string> = {
    week: "週",
    month: "月",
    quarter: "四半期",
  };

  return (
    <div className="mt-0">
      {/* スケールコントロール */}
      <div className="flex justify-end items-center gap-1 mb-2">
        <Button variant="outline" size="sm" onClick={scrollToToday}>
          今日
        </Button>
        {(["week", "month", "quarter"] as GanttScale[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={scale === s ? "default" : "outline"}
            onClick={() => setScale(s)}
          >
            {scaleLabels[s]}
          </Button>
        ))}
      </div>

      {/* チャート本体 */}
      <div
        ref={scrollRef}
        className="overflow-auto border border-border rounded-lg"
        style={{ maxHeight: "calc(100vh - 300px)" }}
      >
        <div style={{ minWidth: LEFT_PANEL_WIDTH + totalWidth }}>
          <GanttHeader
            scale={scale}
            rangeStart={rangeStart}
            rangeDays={rangeDays}
            dayWidth={dayWidth}
            leftPanelWidth={LEFT_PANEL_WIDTH}
          />

          {flatTickets.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              チケットがありません
            </div>
          ) : (
            flatTickets.map((ticket) => (
              <GanttRow
                key={ticket.id}
                ticket={ticket}
                projectId={projectId}
                rangeStart={rangeStart}
                totalWidth={totalWidth}
                dayWidth={dayWidth}
                leftPanelWidth={LEFT_PANEL_WIDTH}
                rowHeight={ROW_HEIGHT}
                todayX={todayLineX}
                onDatesChange={handleDatesChange}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
