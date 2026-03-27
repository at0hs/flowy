"use client";

import { EqualIcon, ChevronsDownIcon, ChevronUpIcon, ChevronsUpIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket } from "@/types";

type Props = {
  value: Ticket["priority"];
  onSave: (value: Ticket["priority"]) => Promise<void>;
  disabled?: boolean;
};

export function InlinePriority({ value, onSave, disabled }: Props) {
  async function handleChange(newValue: string) {
    if (newValue !== value) {
      await onSave(newValue as Ticket["priority"]);
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="min-w-30 w-auto h-8 px-2 border-0 shadow-none bg-transparent hover:bg-muted rounded-sm gap-1.5 transition-colors focus:ring-0 focus-visible:ring-0 [&>svg:last-child]:hidden">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">
          <div className="flex items-center gap-2">
            <ChevronsDownIcon className="w-4 h-4 text-blue-400 stroke-[3px]" />低
          </div>
        </SelectItem>
        <SelectItem value="medium">
          <div className="flex items-center gap-2">
            <EqualIcon className="w-4 h-4 text-orange-300 stroke-[3px]" />中
          </div>
        </SelectItem>
        <SelectItem value="high">
          <div className="flex items-center gap-2">
            <ChevronUpIcon className="w-4 h-4 text-red-400 stroke-[3px]" />高
          </div>
        </SelectItem>
        <SelectItem value="urgent">
          <div className="flex items-center gap-2">
            <ChevronsUpIcon className="w-4 h-4 text-red-400 stroke-[3px]" />
            緊急
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
