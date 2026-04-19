"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusType } from "@/types";
import { STATUS_LABELS } from "@/lib/constants";

const STATUS_MAP = {
  todo: {
    label: STATUS_LABELS.todo,
    className: "bg-slate-500/20 text-black hover:bg-slate-500/30",
  },
  in_progress: {
    label: STATUS_LABELS.in_progress,
    className: "bg-blue-500/20 text-black hover:bg-blue-500/30",
  },
  done: {
    label: STATUS_LABELS.done,
    className: "bg-green-500/20 text-black hover:bg-green-500/30",
  },
} as const;

type Props = {
  value: StatusType;
  onSave: (value: StatusType) => Promise<void>;
  disabled?: boolean;
};

export function InlineStatus({ value, onSave, disabled }: Props) {
  const status = STATUS_MAP[value];

  async function handleChange(newValue: string) {
    if (newValue !== value) {
      await onSave(newValue as StatusType);
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
        <SelectItem value="todo">{STATUS_MAP["todo"].label}</SelectItem>
        <SelectItem value="in_progress">{STATUS_MAP["in_progress"].label}</SelectItem>
        <SelectItem value="done">{STATUS_MAP["done"].label}</SelectItem>
      </SelectContent>
    </Select>
  );
}
