"use client";

import { EqualIcon, ChevronsDownIcon, ChevronUpIcon, ChevronsUpIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityType } from "@/types";
import { PRIORITY_LABELS } from "@/lib/constants";

// 推奨: コンポーネント外
const PRIORITIES = [
  { value: "low", icon: ChevronsDownIcon, iconColor: "text-blue-400", label: PRIORITY_LABELS.low },
  { value: "medium", icon: EqualIcon, iconColor: "text-orange-300", label: PRIORITY_LABELS.medium },
  { value: "high", icon: ChevronUpIcon, iconColor: "text-red-400", label: PRIORITY_LABELS.high },
  {
    value: "urgent",
    icon: ChevronsUpIcon,
    iconColor: "text-red-400",
    label: PRIORITY_LABELS.urgent,
  },
] as const;

type Props = {
  value: PriorityType;
  onSave: (value: PriorityType) => Promise<void>;
  disabled?: boolean;
};

export function InlinePriority({ value, onSave, disabled }: Props) {
  async function handleChange(newValue: string) {
    if (newValue !== value) {
      await onSave(newValue as PriorityType);
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="min-w-30 w-auto h-8 px-2 border-0 shadow-none bg-transparent hover:bg-muted rounded-sm gap-1.5 transition-colors focus:ring-0 focus-visible:ring-0 [&>svg:last-child]:hidden">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIORITIES.map((priority) => (
          <SelectItem key={priority.value} value={priority.value}>
            <div className="flex items-center gap-2">
              <priority.icon className={`w-4 h-4 stroke-[3px] ${priority.iconColor}`} />
              {priority.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
