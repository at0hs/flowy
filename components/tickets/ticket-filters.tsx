"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LoaderCircle, RotateCcwIcon, SearchIcon } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/constants";

type TicketFiltersProps = {
  currentView?: "list" | "kanban" | "gantt";
};

export function TicketFilters({ currentView = "list" }: TicketFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  const statusValue = searchParams.get("status") ?? "all";
  const priorityValue = searchParams.get("priority") ?? "all";
  const categoryValue = searchParams.get("category") ?? "all";

  // 検索ボックスの debounce 処理
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) {
        params.set("q", searchValue.trim());
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
    // searchParams を依存配列に含めると無限ループになるため除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // クエリパラメータを更新する関数
  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReload = () => {
    startTransition(async () => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-3 mt-4 mb-6">
      {/* タイトル検索（リストビューのみ） */}
      {currentView === "list" && (
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="チケットを検索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8 w-56"
          />
        </div>
      )}

      {/* カテゴリフィルタ */}
      <Select value={categoryValue} onValueChange={(value) => updateParams("category", value)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">カテゴリ</SelectItem>
          <SelectItem value="bug">{CATEGORY_LABELS.bug}</SelectItem>
          <SelectItem value="task">{CATEGORY_LABELS.task}</SelectItem>
          <SelectItem value="feature">{CATEGORY_LABELS.feature}</SelectItem>
          <SelectItem value="improvement">{CATEGORY_LABELS.improvement}</SelectItem>
        </SelectContent>
      </Select>

      {/* ステータスフィルタ */}
      <Select value={statusValue} onValueChange={(value) => updateParams("status", value)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ステータス</SelectItem>
          <SelectItem value="todo">{STATUS_LABELS.todo}</SelectItem>
          <SelectItem value="in_progress">{STATUS_LABELS.in_progress}</SelectItem>
          <SelectItem value="done">{STATUS_LABELS.done}</SelectItem>
        </SelectContent>
      </Select>

      {/* 優先度フィルタ */}
      <Select value={priorityValue} onValueChange={(value) => updateParams("priority", value)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">優先度</SelectItem>
          <SelectItem value="low">{PRIORITY_LABELS.low}</SelectItem>
          <SelectItem value="medium">{PRIORITY_LABELS.medium}</SelectItem>
          <SelectItem value="high">{PRIORITY_LABELS.high}</SelectItem>
          <SelectItem value="urgent">{PRIORITY_LABELS.urgent}</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" className="ml-auto" onClick={handleReload} disabled={isPending}>
        {isPending ? <LoaderCircle className="animate-spin" /> : <RotateCcwIcon />}
      </Button>
    </div>
  );
}
