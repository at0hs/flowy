"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  disabled?: boolean;
  placeholder: string;
};

export function InlineDate({ value, onSave, disabled, placeholder }: Props) {
  const [open, setOpen] = useState(false);

  const selected = value ? parseISO(value) : undefined;

  async function handleSelect(date: Date | undefined) {
    setOpen(false);
    const next = date ? format(date, "yyyy-MM-dd") : null;
    if (next !== value) {
      await onSave(next);
    }
  }

  async function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    if (value !== null) {
      await onSave(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-1.5 h-8 px-2 rounded-sm text-sm bg-transparent hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selected ? (
              <span>{format(selected, "yyyy年MM月dd日", { locale: ja })}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={selected} onSelect={handleSelect} locale={ja} />
        </PopoverContent>
      </Popover>
      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
