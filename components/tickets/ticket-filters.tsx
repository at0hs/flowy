"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div className="flex flex-wrap gap-3 mb-6">
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
          <SelectItem value="todo">TODO</SelectItem>
          <SelectItem value="in_progress">進行中</SelectItem>
          <SelectItem value="done">完了</SelectItem>
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
          <SelectItem value="low">低</SelectItem>
          <SelectItem value="medium">中</SelectItem>
          <SelectItem value="high">高</SelectItem>
          <SelectItem value="urgent">緊急</SelectItem>
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
    </div>
  );
}
