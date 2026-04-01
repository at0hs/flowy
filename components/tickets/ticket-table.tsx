"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types";
import {
  ChevronsDownIcon,
  ChevronsUpIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  EqualIcon,
} from "lucide-react";

const STATUS_MAP = {
  todo: { label: "TODO", color: "bg-slate-500", variant: "default" },
  in_progress: { label: "進行中", color: "bg-blue-500", variant: "default" },
  done: { label: "完了", color: "bg-green-500", variant: "default" },
} as const;

const PRIORITY_MAP = {
  low: { icon: ChevronsDownIcon, iconColor: "text-blue-400", label: "低" },
  medium: { icon: EqualIcon, iconColor: "text-orange-300", label: "中" },
  high: { icon: ChevronUpIcon, iconColor: "text-red-400", label: "高" },
  urgent: {
    icon: ChevronsUpIcon,
    iconColor: "text-red-400",
    label: "緊急",
  },
} as const;

type Props = {
  tickets: Ticket[];
  assigneeMap: Record<string, string>;
};

export function TicketTable({ tickets, assigneeMap }: Props) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 親子関係を構築
  const { roots, childrenByParent } = useMemo(() => {
    const ticketIds = new Set(tickets.map((t) => t.id));
    const roots: Ticket[] = [];
    const childrenByParent = new Map<string, Ticket[]>();

    for (const ticket of tickets) {
      if (!ticket.parent_id || !ticketIds.has(ticket.parent_id)) {
        // 親なし、または親がフィルターで除外されている場合はルート扱い
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
  const orderedRows = useMemo(() => {
    const result: { ticket: Ticket; isChild: boolean; hasChildren: boolean }[] = [];

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

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-6 py-3 text-left text-sm font-semibold">タイトル</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">担当者</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">優先度</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">ステータス</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">作成日</th>
          </tr>
        </thead>
        <tbody>
          {orderedRows.map(({ ticket, isChild, hasChildren }) => {
            const status = STATUS_MAP[ticket.status];
            const priority = PRIORITY_MAP[ticket.priority];
            const assigneeName = ticket.assignee_id ? assigneeMap[ticket.assignee_id] : null;
            const isCollapsed = collapsedIds.has(ticket.id);

            return (
              <tr key={ticket.id} className="border-b hover:bg-muted/50 transition-colors text-sm">
                <td className="px-6 py-3">
                  <div className={`flex items-center gap-1 ${isChild ? "pl-8" : ""}`}>
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
                    {!hasChildren && !isChild && (
                      // 子を持たないルートチケットのアイコン分スペース確保
                      <span className="w-4 shrink-0" />
                    )}
                    <Link
                      href={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {ticket.title}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-3">
                  {assigneeName ?? <span className="text-muted-foreground italic">担当者なし</span>}
                </td>
                <td className="flex items-center gap-2 px-6 py-3">
                  <priority.icon className={`w-4 h-4 stroke-[3px] ${priority.iconColor}`} />
                  {priority.label}
                </td>
                <td className="px-6 py-3">
                  <Badge
                    variant={status.variant}
                    className={`${status.color}/20 text-primary rounded-sm`}
                  >
                    {status.label}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-muted-foreground">{formatDate(ticket.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
