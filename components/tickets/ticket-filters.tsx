"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ChevronDown, LoaderCircle, RotateCcwIcon, SearchIcon } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, TicketView } from "@/lib/constants";
import { Tag } from "@/types";
import { cn } from "@/lib/utils";

type MultiSelectOption = { value: string; label: string };

type MultiSelectFilterProps = {
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
};

function MultiSelectFilter({ placeholder, options, selected, onChange }: MultiSelectFilterProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${placeholder} (${selected.length})`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(selected.length > 0 && "border-primary/50 text-primary")}
        >
          <span className="truncate max-w-28">{triggerLabel}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        {options.length > 0 ? (
          options.map((option) => (
            <Label
              key={option.value}
              className="text-xs cursor-pointer rounded-md px-2 py-1.5 font-normal hover:bg-muted w-full"
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              {option.label}
            </Label>
          ))
        ) : (
          <p className="px-2 py-1.5 text-xs italic text-muted-foreground">なし</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

type AssigneeOption = { userId: string; displayName: string };

type TicketFiltersProps = {
  currentView?: TicketView;
  members?: AssigneeOption[];
  tags?: Tag[];
};

export function TicketFilters({
  currentView = "list",
  members = [],
  tags = [],
}: TicketFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  const statusValues = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const priorityValues = searchParams.get("priority")?.split(",").filter(Boolean) ?? [];
  const categoryValues = searchParams.get("category")?.split(",").filter(Boolean) ?? [];
  const assigneeValues = searchParams.get("assignee")?.split(",").filter(Boolean) ?? [];
  const tagValues = searchParams.get("tag")?.split(",").filter(Boolean) ?? [];

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

  // 複数選択のクエリパラメータを更新する関数
  const updateMultiParams = (key: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (values.length === 0) {
      params.delete(key);
    } else {
      params.set(key, values.join(","));
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

      {/* カテゴリフィルタ（複数選択） */}
      <MultiSelectFilter
        placeholder="カテゴリ"
        options={[
          { value: "bug", label: CATEGORY_LABELS.bug },
          { value: "task", label: CATEGORY_LABELS.task },
          { value: "feature", label: CATEGORY_LABELS.feature },
          { value: "improvement", label: CATEGORY_LABELS.improvement },
        ]}
        selected={categoryValues}
        onChange={(values) => updateMultiParams("category", values)}
      />

      {/* ステータスフィルタ（複数選択） */}
      <MultiSelectFilter
        placeholder="ステータス"
        options={[
          { value: "todo", label: STATUS_LABELS.todo },
          { value: "in_progress", label: STATUS_LABELS.in_progress },
          { value: "done", label: STATUS_LABELS.done },
        ]}
        selected={statusValues}
        onChange={(values) => updateMultiParams("status", values)}
      />

      {/* 優先度フィルタ（複数選択） */}
      <MultiSelectFilter
        placeholder="優先度"
        options={[
          { value: "low", label: PRIORITY_LABELS.low },
          { value: "medium", label: PRIORITY_LABELS.medium },
          { value: "high", label: PRIORITY_LABELS.high },
          { value: "urgent", label: PRIORITY_LABELS.urgent },
        ]}
        selected={priorityValues}
        onChange={(values) => updateMultiParams("priority", values)}
      />

      {/* 担当者フィルタ（複数選択） */}

      <MultiSelectFilter
        placeholder="担当者"
        options={members.map((m) => ({ value: m.userId, label: m.displayName }))}
        selected={assigneeValues}
        onChange={(values) => updateMultiParams("assignee", values)}
      />

      {/* タグフィルタ（複数選択） */}
      <MultiSelectFilter
        placeholder="タグ"
        options={tags.map((t) => ({ value: t.id, label: t.name }))}
        selected={tagValues}
        onChange={(values) => updateMultiParams("tag", values)}
      />

      <Button variant="ghost" className="ml-auto" onClick={handleReload} disabled={isPending}>
        {isPending ? <LoaderCircle className="animate-spin" /> : <RotateCcwIcon />}
      </Button>
    </div>
  );
}
