"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { dateToX, xToDays, shiftDateStr, formatDateString } from "./gantt-utils";

type DragType = "left" | "center" | "right";

type GanttBarProps = {
  startDate: string | null;
  dueDate: string | null;
  rangeStart: Date;
  dayWidth: number;
  rowHeight: number;
  onDatesChange: (newStart: string | null, newDue: string | null) => void;
};

export function GanttBar({
  startDate,
  dueDate,
  rangeStart,
  dayWidth,
  rowHeight,
  onDatesChange,
}: GanttBarProps) {
  const [dragPreview, setDragPreview] = useState<{
    start: string | null;
    due: string | null;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // アンマウント時にドラッグ中のグローバルイベントリスナーを解放する
  useEffect(() => () => cleanupRef.current?.(), []);

  const effectiveStart = dragPreview?.start ?? startDate;
  const effectiveDue = dragPreview?.due ?? dueDate;

  // バーがない場合（両方 null）
  if (!effectiveStart && !effectiveDue) return null;

  const hasBothDates = !!(startDate && dueDate);

  // バーの左端・幅を計算
  const barStartStr = effectiveStart ?? effectiveDue!;
  const barDueStr = effectiveDue ?? effectiveStart!;
  const barLeft = dateToX(barStartStr, rangeStart, dayWidth);
  const barRight = dateToX(barDueStr, rangeStart, dayWidth) + dayWidth;
  const barWidth = Math.max(barRight - barLeft, dayWidth);

  const barTop = Math.floor((rowHeight - 24) / 2);

  function handlePointerDown(e: React.PointerEvent, dragType: DragType) {
    e.preventDefault();
    e.stopPropagation();

    const origStart = startDate;
    const origDue = dueDate;
    const origX = e.clientX;
    let currentPreview = { start: origStart, due: origDue };

    setIsDragging(true);
    setDragPreview(currentPreview);

    function onMove(moveEvent: PointerEvent) {
      const deltaX = moveEvent.clientX - origX;
      const deltaDays = xToDays(deltaX, dayWidth);

      let newStart = origStart;
      let newDue = origDue;

      if (origStart && origDue) {
        // 両方設定されている場合
        if (dragType === "left") {
          newStart = shiftDateStr(origStart, deltaDays);
          if (newStart > origDue) newStart = origDue;
        } else if (dragType === "right") {
          newDue = shiftDateStr(origDue, deltaDays);
          if (newDue < origStart) newDue = origStart;
        } else {
          newStart = shiftDateStr(origStart, deltaDays);
          newDue = shiftDateStr(origDue, deltaDays);
        }
      } else {
        // 1日バー（片方のみ設定）: 常に中央移動
        const single = (origStart ?? origDue)!;
        const shifted = shiftDateStr(single, deltaDays);
        newStart = origStart ? shifted : null;
        newDue = origDue ? shifted : null;
      }

      currentPreview = { start: newStart, due: newDue };
      setDragPreview(currentPreview);
    }

    function cleanup() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      cleanupRef.current = null;
    }

    function onUp() {
      cleanup();
      setIsDragging(false);
      setDragPreview(null);

      if (currentPreview.start !== origStart || currentPreview.due !== origDue) {
        onDatesChange(currentPreview.start, currentPreview.due);
      }
    }

    cleanupRef.current = cleanup;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  // 今日より過去の期限のバーをやや透明に
  const today = formatDateString(new Date());
  const isOverdue = barDueStr < today && !isDragging;

  return (
    <div
      className={cn(
        "absolute rounded-sm bg-gray-300 select-none transition-opacity",
        isDragging ? "opacity-80 cursor-grabbing" : "cursor-grab",
        isOverdue && "opacity-60"
      )}
      style={{
        left: barLeft,
        width: barWidth,
        top: barTop,
        height: 24,
      }}
    >
      {/* 左ハンドル（両方の日付が設定されている場合のみ） */}
      {hasBothDates && (
        <div
          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
          onPointerDown={(e) => handlePointerDown(e, "left")}
        />
      )}

      {/* 中央（常に表示） */}
      <div
        className="absolute inset-0"
        style={{ left: hasBothDates ? 8 : 0, right: hasBothDates ? 8 : 0 }}
        onPointerDown={(e) => handlePointerDown(e, "center")}
      />

      {/* 右ハンドル（両方の日付が設定されている場合のみ） */}
      {hasBothDates && (
        <div
          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
          onPointerDown={(e) => handlePointerDown(e, "right")}
        />
      )}
    </div>
  );
}
