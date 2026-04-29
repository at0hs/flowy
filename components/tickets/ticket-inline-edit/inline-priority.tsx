"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityType } from "@/types";
import { PRIORITY_CONFIG } from "@/lib/ticket-config";

const PRIORITIES = (
  Object.entries(PRIORITY_CONFIG) as [PriorityType, (typeof PRIORITY_CONFIG)[PriorityType]][]
).map(([value, config]) => ({ value, ...config }));

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
      <SelectTrigger className="w-full h-8 px-2 border-0 shadow-none bg-transparent hover:bg-muted rounded-sm gap-1.5 transition-colors focus:ring-0 focus-visible:ring-0">
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
