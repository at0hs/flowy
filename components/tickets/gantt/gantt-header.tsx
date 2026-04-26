"use client";

import { cn } from "@/lib/utils";
import { getHeaderRows } from "./gantt-utils";
import type { GanttScale } from "./gantt-utils";

const HEADER_HEIGHT = 56;
const ROW_UPPER = 28;
const ROW_LOWER = 28;

type GanttHeaderProps = {
  scale: GanttScale;
  rangeStart: Date;
  rangeDays: number;
  dayWidth: number;
  leftPanelWidth: number;
};

export function GanttHeader({
  scale,
  rangeStart,
  rangeDays,
  dayWidth,
  leftPanelWidth,
}: GanttHeaderProps) {
  const totalWidth = rangeDays * dayWidth;
  const { upper, lower } = getHeaderRows(scale, rangeStart, rangeDays, dayWidth);

  return (
    <div
      className="sticky top-0 z-20 flex bg-background border-b border-border"
      style={{ height: HEADER_HEIGHT }}
    >
      {/* 左パネルヘッダー（二重sticky：top + left） */}
      <div
        className="sticky left-0 z-30 bg-background border-r border-border flex items-end px-3 pb-2 shrink-0"
        style={{ width: leftPanelWidth }}
      >
        <span className="text-xs font-medium text-muted-foreground">作業</span>
      </div>

      {/* タイムラインヘッダー */}
      <div className="relative shrink-0" style={{ width: totalWidth, height: HEADER_HEIGHT }}>
        {/* 上段（月名 or 四半期名） */}
        <div
          className="absolute top-0 left-0 right-0 overflow-hidden"
          style={{ height: ROW_UPPER }}
        >
          {upper.map((cell, i) => (
            <div
              key={i}
              className="absolute flex items-center text-xs font-semibold text-foreground border-r border-border/50 px-2 overflow-hidden"
              style={{ left: cell.x, width: cell.width, height: ROW_UPPER }}
            >
              <span className="truncate">{cell.label}</span>
            </div>
          ))}
        </div>

        {/* 下段（日番号 or 週ブロック） */}
        {lower.length > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 overflow-hidden"
            style={{ height: ROW_LOWER }}
          >
            {lower.map((cell, i) => (
              <div
                key={i}
                className={cn(
                  "absolute flex items-center justify-center text-xs border-r border-border/30",
                  cell.isWeekend && !cell.isToday ? "bg-muted text-muted-foreground" : "",
                  cell.isWeekStart && "border-l-2 border-l-border"
                )}
                style={{ left: cell.x, width: cell.width, height: ROW_LOWER }}
              >
                {cell.isToday ? (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white font-medium">
                    {cell.label}
                  </span>
                ) : (
                  cell.label
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
