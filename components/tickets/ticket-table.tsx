"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types";
import { ChevronRightIcon } from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/date";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/ticket-config";
import { isAfter, parseISO, startOfDay } from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from "@tanstack/react-table";

// テーブルの行データ型
type RowData = {
  ticket: Ticket;
  isChild: boolean;
  hasChildren: boolean;
};

type Props = {
  tickets: Ticket[];
  assigneeMap: Record<string, string>;
};

const columnHelper = createColumnHelper<RowData>();

export function TicketTable({ tickets, assigneeMap }: Props) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // 親子関係を構築
  const { roots, childrenByParent } = useMemo(() => {
    const ticketIds = new Set(tickets.map((t) => t.id));
    const roots: Ticket[] = [];
    const childrenByParent = new Map<string, Ticket[]>();

    for (const ticket of tickets) {
      if (!ticket.parent_id || !ticketIds.has(ticket.parent_id)) {
        roots.push(ticket);
      } else {
        const existing = childrenByParent.get(ticket.parent_id) ?? [];
        existing.push(ticket);
        childrenByParent.set(ticket.parent_id, existing);
      }
    }

    return { roots, childrenByParent };
  }, [tickets]);

  // 表示順のフラット配列を生成（折り畳み状態を考慮）
  const data = useMemo(() => {
    const result: RowData[] = [];

    for (const root of roots) {
      const children = childrenByParent.get(root.id) ?? [];
      const hasChildren = children.length > 0;
      result.push({ ticket: root, isChild: false, hasChildren });

      if (hasChildren && !collapsedIds.has(root.id)) {
        for (const child of children) {
          result.push({ ticket: child, isChild: true, hasChildren: false });
        }
      }
    }

    return result;
  }, [roots, childrenByParent, collapsedIds]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const columns = useMemo<ColumnDef<RowData, unknown>[]>(
    () => [
      columnHelper.display({
        id: "title",
        header: "タイトル",
        size: 380,
        minSize: 150,
        cell: ({ row }) => {
          const { ticket, isChild, hasChildren } = row.original;
          const isCollapsed = collapsedIds.has(ticket.id);
          return (
            <div className={`flex items-center gap-1 overflow-hidden ${isChild ? "pl-8" : ""}`}>
              {hasChildren && (
                <button
                  onClick={() => toggleCollapse(ticket.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={isCollapsed ? "子チケットを展開" : "子チケットを折り畳む"}
                >
                  <ChevronRightIcon
                    className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`}
                  />
                </button>
              )}
              {!hasChildren && !isChild && <span className="w-4 shrink-0" />}
              <Link
                href={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
                className="min-w-0 truncate font-medium text-primary hover:underline"
              >
                {ticket.title}
              </Link>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "assignee",
        header: "担当者",
        size: 150,
        minSize: 80,
        cell: ({ row }) => {
          const { ticket } = row.original;
          const assigneeName = ticket.assignee_id ? assigneeMap[ticket.assignee_id] : null;
          return (
            assigneeName ?? <span className="text-muted-foreground text-xs italic">担当者なし</span>
          );
        },
      }),
      columnHelper.display({
        id: "priority",
        header: "優先度",
        size: 120,
        minSize: 80,
        cell: ({ row }) => {
          const priority = PRIORITY_CONFIG[row.original.ticket.priority];
          return (
            <div className="flex items-center gap-2">
              <priority.icon className={`w-4 h-4 stroke-[3px] ${priority.iconColor}`} />
              {priority.label}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "status",
        header: "ステータス",
        size: 130,
        minSize: 80,
        cell: ({ row }) => {
          const status = STATUS_CONFIG[row.original.ticket.status];
          return (
            <Badge className={`${status.badgeClass}/20 text-primary rounded-sm`}>
              {status.label}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "due_date",
        header: "期限",
        size: 120,
        minSize: 80,
        cell: ({ row }) => {
          const { due_date } = row.original.ticket;
          if (!due_date) return <span className="text-muted-foreground text-xs italic">なし</span>;
          const isOverdue = isAfter(startOfDay(new Date()), parseISO(due_date));
          return <span className={isOverdue ? "text-red-500" : ""}>{formatDate(due_date)}</span>;
        },
      }),
      columnHelper.display({
        id: "created_at",
        header: "作成日",
        size: 160,
        minSize: 100,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDateTime(row.original.ticket.created_at)}
          </span>
        ),
      }),
    ],
    [assigneeMap, collapsedIds, toggleCollapse]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    defaultColumn: {
      minSize: 80,
    },
  });

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table style={{ width: table.getTotalSize() }} className="table-fixed min-w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-muted/50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="relative px-6 py-1 text-left text-sm font-semibold select-none"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {/* リサイズハンドル */}
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={`absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none transition-colors hover:bg-primary/50 ${
                      header.column.getIsResizing() ? "bg-primary" : ""
                    }`}
                  />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-muted/50 transition-colors text-sm">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className="px-6 py-2 overflow-hidden"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
