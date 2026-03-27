"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket } from "@/types";

const STATUS_MAP = {
  todo: {
    label: "To Do",
    className: "bg-slate-500/20 text-black hover:bg-slate-500/30",
  },
  in_progress: {
    label: "進行中",
    className: "bg-blue-500/20 text-black hover:bg-blue-500/30",
  },
  done: {
    label: "完了",
    className: "bg-green-500/20 text-black hover:bg-green-500/30",
  },
} as const;

type Props = {
  value: Ticket["status"];
  onSave: (value: Ticket["status"]) => Promise<void>;
  disabled?: boolean;
};

export function InlineStatus({ value, onSave, disabled }: Props) {
  const status = STATUS_MAP[value];

  async function handleChange(newValue: string) {
    if (newValue !== value) {
      await onSave(newValue as Ticket["status"]);
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger
        className={`w-auto h-7 px-3 text-xs font-medium border-0 shadow-none rounded-sm gap-1 transition-colors ${status.className}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">TODO</SelectItem>
        <SelectItem value="in_progress">進行中</SelectItem>
        <SelectItem value="done">完了</SelectItem>
      </SelectContent>
    </Select>
  );
}
