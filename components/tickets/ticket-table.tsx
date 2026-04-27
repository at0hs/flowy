"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types";
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon, ChevronRightIcon } from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/date";
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG } from "@/lib/ticket-config";
import { isAfter, parseISO, startOfDay } from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

type RowData = {
  ticket: Ticket;
  isChild: boolean;
  hasChildren: boolean;
};

type Props = {
  tickets: Ticket[];
  assigneeMap: Record<string, string>;
};

type SortColumn =
  | "title"
  | "status"
  | "priority"
  | "assignee"
  | "due_date"
  | "created_at"
  | "category";
type SortDirection = "asc" | "desc";
type SortConfig = { column: SortColumn; direction: SortDirection } | null;

const PRIORITY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
const STATUS_ORDER: Record<string, number> = { todo: 0, in_progress: 1, done: 2 };
const CATEGORY_ORDER: Record<string, number> = { bug: 0, feature: 1, improvement: 2, task: 3 };

function sortTickets(
  tickets: Ticket[],
  sortConfig: SortConfig,
  assigneeMap: Record<string, string>
): Ticket[] {
  if (!sortConfig) return tickets;

  return [...tickets].sort((a, b) => {
    let comparison = 0;
    switch (sortConfig.column) {
      case "title":
        comparison = a.title.localeCompare(b.title, "ja");
        break;
      case "status":
        comparison = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
        break;
      case "priority":
        comparison = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
        break;
      case "assignee": {
        const nameA = a.assignee_id ? (assigneeMap[a.assignee_id] ?? "") : "";
        const nameB = b.assignee_id ? (assigneeMap[b.assignee_id] ?? "") : "";
        comparison = nameA.localeCompare(nameB, "ja");
        break;
      }
      case "due_date": {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        comparison = dateA - dateB;
        break;
      }
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "category":
        comparison = (CATEGORY_ORDER[a.category] ?? 0) - (CATEGORY_ORDER[b.category] ?? 0);
        break;
    }
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
}

function SortIcon({ column, sortConfig }: { column: SortColumn; sortConfig: SortConfig }) {
  if (sortConfig?.column !== column) {
    return <ArrowUpDownIcon className="w-3 h-3 text-muted-foreground/50" />;
  }
  return sortConfig.direction === "asc" ? (
    <ArrowUpIcon className="w-3 h-3" />
  ) : (
    <ArrowDownIcon className="w-3 h-3" />
  );
}

const columnHelper = createColumnHelper<RowData>();

export function TicketTable({ tickets, assigneeMap }: Props) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleSort = useCallback((column: SortColumn) => {
    setSortConfig((prev) => {
      if (prev?.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "asc" };
    });
  }, []);

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

  // ルートチケットをソート
  const sortedRoots = useMemo(
    () => sortTickets(roots, sortConfig, assigneeMap),
    [roots, sortConfig, assigneeMap]
  );

  // 表示順のフラット配列を生成（折り畳み状態を考慮）
  const data = useMemo(() => {
    const result: RowData[] = [];

    for (const root of sortedRoots) {
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
  }, [sortedRoots, childrenByParent, collapsedIds]);

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
        id: "category",
        header: () => (
          <button
            onClick={() => handleSort("category")}
            className="flex items-center gap-1 hover:text-foreground w-full"
          >
            カテゴリ
            <SortIcon column="category" sortConfig={sortConfig} />
          </button>
        ),
        size: 110,
        minSize: 80,
        cell: ({ row }) => {
          const cat = CATEGORY_CONFIG[row.original.ticket.category];
          const Icon = cat.icon;
          return (
            <Badge className={cn(cat.badgeBgClass, "text-primary", "rounded-sm", "gap-1")}>
              <Icon className={cn("w-3 h-3", cat.iconColor)} />
              {cat.label}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "title",
        header: () => (
          <button
            onClick={() => handleSort("title")}
            className="flex items-center gap-1 hover:text-foreground w-full"
          >
            タイトル
            <SortIcon column="title" sortConfig={sortConfig} />
          </button>
        ),
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
        header: () => (
          <button
            onClick={() => handleSort("assignee")}
            className="flex items-center gap-1 hover:text-foreground w-full"
          >
            担当者
            <SortIcon column="assignee" sortConfig={sortConfig} />
          </button>
        ),
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
        header: () => (
          <button
            onClick={() => handleSort("priority")}
            className="flex items-center gap-1 hover:text-foreground w-full"
          >
            優先度
            <SortIcon column="priority" sortConfig={sortConfig} />
          </button>
        ),
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
        header: () => (
          <button
            onClick={() => handleSort("status")}
            className="flex items-center gap-1 hover:text-foreground w-full"
          >
            ステータス
            <SortIcon column="status" sortConfig={sortConfig} />
          </button>
        ),
        size: 130,
        minSize: 80,
        cell: ({ row }) => {
          const status = STATUS_CONFIG[row.original.ticket.status];
          return (
            <Badge className={cn(status.badgeBgClass, "text-primary", "rounded-sm")}>
              {status.label}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "due_date",
        header: () => (
          <button
            onClick={() => handleSort("due_date")}
            className="flex items-center gap-1 hover:text-foreground w-full"
          >
            期限
            <SortIcon column="due_date" sortConfig={sortConfig} />
          </button>
        ),
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
        header: () => (
          <button
            onClick={() => handleSort("created_at")}
            className="flex items-center gap-1 hover:text-foreground w-full"
          >
            作成日
            <SortIcon column="created_at" sortConfig={sortConfig} />
          </button>
        ),
        size: 160,
        minSize: 100,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDateTime(row.original.ticket.created_at)}
          </span>
        ),
      }),
    ],
    [assigneeMap, collapsedIds, toggleCollapse, sortConfig, handleSort]
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
                  className="relative px-6 py-1 text-left text-sm font-semibold select-none hover:bg-gray-200"
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
