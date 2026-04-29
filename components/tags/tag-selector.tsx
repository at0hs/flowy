"use client";

import { useState } from "react";
import { Tags } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TagBadge } from "@/components/tags/tag-badge";
import { Tag } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  tags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function TagSelector({
  tags,
  selectedTagIds,
  onChange,
  disabled,
  placeholder = "タグを選択",
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-sm px-2 py-1 text-sm",
            "border-0 bg-transparent hover:bg-muted transition-colors text-left",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {selectedTags.length > 0 ? (
            selectedTags.map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} />)
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Tags className="h-3.5 w-3.5" />
              {placeholder}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="タグを検索..." />
          <CommandList>
            <CommandEmpty>タグが見つかりません</CommandEmpty>
            <CommandGroup>
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => toggleTag(tag.id)}
                    data-checked={isSelected}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: tag.color ?? "hsl(var(--muted-foreground))",
                      }}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
