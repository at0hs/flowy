"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { RichTextContent } from "@/components/editor/rich-text-content";

type Props = {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  disabled?: boolean;
  ticketId?: string;
  projectId?: string;
  onAttachmentUploaded?: () => void;
};

export function InlineDescription({
  value,
  onSave,
  disabled,
  ticketId,
  projectId,
  onAttachmentUploaded,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  function startEditing() {
    if (disabled) return;
    setDraft(value ?? "");
    setIsEditing(true);
  }

  async function handleSave() {
    const isEmpty = !draft || draft === "<p></p>";
    const newValue = isEmpty ? null : draft;
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
        <RichTextEditor
          value={draft}
          onChange={setDraft}
          placeholder="説明を入力..."
          ticketId={ticketId}
          projectId={projectId}
          onAttachmentUploaded={onAttachmentUploaded}
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
        <RichTextContent html={value} />
      ) : (
        <p className="text-sm text-muted-foreground italic">説明を追加...</p>
      )}
    </div>
  );
}
