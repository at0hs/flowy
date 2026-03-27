"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  disabled?: boolean;
};

export function InlineDescription({ value, onSave, disabled }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  function startEditing() {
    if (disabled) return;
    setDraft(value ?? "");
    setIsEditing(true);
  }

  async function handleSave() {
    const trimmed = draft.trim();
    const newValue = trimmed || null;
    await onSave(newValue);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft(value ?? "");
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={handleSave}>
            保存
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
            キャンセル
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={startEditing}
      className={`rounded-md border border-border p-3 min-h-20 transition-colors ${
        disabled ? "cursor-default" : "cursor-pointer hover:bg-muted/30"
      }`}
    >
      {value ? (
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">説明を追加...</p>
      )}
    </div>
  );
}
