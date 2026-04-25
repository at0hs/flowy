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
  currentView?: "list" | "kanban";
};

export function TicketFilters({ currentView = "list" }: TicketFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

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
    // 既存のクエリパラメータをコピー
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete(key); // "すべて"を選んだらパラメータを削除
    } else {
      params.set(key, value);
    }

    // URLを更新（ページ遷移ではなくURLだけ変わる）
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

      {/* ステータスフィルタ */}
      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(value) => updateParams("status", value)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="ステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="todo">{STATUS_LABELS.todo}</SelectItem>
          <SelectItem value="in_progress">{STATUS_LABELS.in_progress}</SelectItem>
          <SelectItem value="done">{STATUS_LABELS.done}</SelectItem>
        </SelectContent>
      </Select>

      {/* 優先度フィルタ */}
      <Select
        defaultValue={searchParams.get("priority") ?? "all"}
        onValueChange={(value) => updateParams("priority", value)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="優先度" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="low">{PRIORITY_LABELS.low}</SelectItem>
          <SelectItem value="medium">{PRIORITY_LABELS.medium}</SelectItem>
          <SelectItem value="high">{PRIORITY_LABELS.high}</SelectItem>
          <SelectItem value="urgent">{PRIORITY_LABELS.urgent}</SelectItem>
        </SelectContent>
      </Select>

      {/* カテゴリフィルタ */}
      <Select
        defaultValue={searchParams.get("category") ?? "all"}
        onValueChange={(value) => updateParams("category", value)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="カテゴリ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="bug">{CATEGORY_LABELS.bug}</SelectItem>
          <SelectItem value="task">{CATEGORY_LABELS.task}</SelectItem>
          <SelectItem value="feature">{CATEGORY_LABELS.feature}</SelectItem>
          <SelectItem value="improvement">{CATEGORY_LABELS.improvement}</SelectItem>
        </SelectContent>
      </Select>

      {/* ソート */}
      <Select
        defaultValue={searchParams.get("order") ?? "desc"}
        onValueChange={(value) => updateParams("order", value)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="並び順" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">作成日（新しい順）</SelectItem>
          <SelectItem value="asc">作成日（古い順）</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" className="ml-auto" onClick={handleReload} disabled={isPending}>
        {isPending ? <LoaderCircle className="animate-spin" /> : <RotateCcwIcon />}
      </Button>
    </div>
  );
}
