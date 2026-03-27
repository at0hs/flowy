"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onSave: (value: string) => Promise<void>;
  disabled?: boolean;
};

export function InlineTitle({ value, onSave, disabled }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const isSavingRef = useRef(false);

  function startEditing() {
    if (disabled) return;
    setDraft(value);
    setIsEditing(true);
  }

  async function handleSave() {
    if (isSavingRef.current) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setIsEditing(false);
      return;
    }
    isSavingRef.current = true;
    await onSave(trimmed);
    isSavingRef.current = false;
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setDraft(value);
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-2xl font-bold h-auto py-1 px-2 -mx-2"
      />
    );
  }

  return (
    <h1
      onClick={startEditing}
      className={`text-2xl font-bold rounded px-1 -mx-1 transition-colors ${
        disabled ? "cursor-default" : "cursor-pointer hover:bg-muted/50"
      }`}
    >
      {value}
    </h1>
  );
}
