"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusType } from "@/types";
import { STATUS_CONFIG } from "@/lib/ticket-config";
import { cn } from "@/lib/utils";

type Props = {
  value: StatusType;
  onSave: (value: StatusType) => Promise<void>;
  disabled?: boolean;
};

export function InlineStatus({ value, onSave, disabled }: Props) {
  const status = STATUS_CONFIG[value];

  async function handleChange(newValue: string) {
    if (newValue !== value) {
      await onSave(newValue as StatusType);
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "w-min-30",
          "h-8",
          "px-3",
          "text-xs",
          "font-medium",
          "border-0",
          "shadow-none",
          "rounded-sm",
          "gap-1",
          "transition-colors",
          "text-black",
          status.badgeAlphaClass
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">{STATUS_CONFIG["todo"].label}</SelectItem>
        <SelectItem value="in_progress">{STATUS_CONFIG["in_progress"].label}</SelectItem>
        <SelectItem value="done">{STATUS_CONFIG["done"].label}</SelectItem>
      </SelectContent>
    </Select>
  );
}
