"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/types";
import { createTag, updateTag, deleteTag } from "@/app/(app)/projects/[id]/actions/tags";
import { TagBadge } from "@/components/tags/tag-badge";

const PRESET_COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#14B8A6",
  "#0EA5E9",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#64748B",
];

const DEFAULT_COLOR = PRESET_COLORS[0];

type Props = {
  initialTags: Tag[];
  projectId: string;
};

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          onClick={() => onChange(color)}
          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: color,
            borderColor: value === color ? "black" : "transparent",
          }}
        />
      ))}
    </div>
  );
}

export function TagSettingsClient({ initialTags, projectId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(DEFAULT_COLOR);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(DEFAULT_COLOR);
  const [isCreating, setIsCreating] = useState(false);

  const handleStartEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color ?? DEFAULT_COLOR);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor(DEFAULT_COLOR);
  };

  const handleSaveEdit = (tagId: string) => {
    if (!editName.trim()) {
      toast.error("タグ名を入力してください");
      return;
    }
    startTransition(async () => {
      const result = await updateTag(tagId, projectId, editName.trim(), editColor);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("タグを更新しました");
      setEditingId(null);
      router.refresh();
    });
  };

  const handleDelete = (tagId: string, tagName: string) => {
    startTransition(async () => {
      const result = await deleteTag(tagId, projectId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`「${tagName}」を削除しました`);
      router.refresh();
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error("タグ名を入力してください");
      return;
    }
    startTransition(async () => {
      const result = await createTag(projectId, newName.trim(), newColor);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("タグを作成しました");
      setNewName("");
      setNewColor(DEFAULT_COLOR);
      setIsCreating(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {initialTags.length === 0 && !isCreating && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          タグはまだ登録されていません
        </p>
      )}

      {initialTags.length > 0 && (
        <div className="rounded-md border divide-y">
          {initialTags.map((tag) =>
            editingId === tag.id ? (
              <div key={tag.id} className="px-4 py-3 space-y-2">
                <ColorPicker value={editColor} onChange={setEditColor} />
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(tag.id);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    placeholder="タグ名"
                    className="h-8 text-sm max-w-xs"
                    autoFocus
                    disabled={isPending}
                  />
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8"
                    onClick={() => handleSaveEdit(tag.id)}
                    disabled={isPending}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={handleCancelEdit}
                    disabled={isPending}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div key={tag.id} className="px-4 py-3 flex items-center justify-between">
                <TagBadge name={tag.name} color={tag.color} />
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => handleStartEdit(tag)}
                    disabled={isPending || editingId !== null}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="sr-only">編集</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(tag.id, tag.name)}
                    disabled={isPending || editingId !== null}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sr-only">削除</span>
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {isCreating ? (
        <div className="rounded-md border px-4 py-3 space-y-2">
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewName("");
                  setNewColor(DEFAULT_COLOR);
                }
              }}
              placeholder="タグ名を入力"
              className="h-8 text-sm max-w-xs"
              autoFocus
              disabled={isPending}
            />
            <Button
              size="sm"
              variant="default"
              className="h-8"
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              追加
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                setIsCreating(false);
                setNewName("");
                setNewColor(DEFAULT_COLOR);
              }}
              disabled={isPending}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreating(true)}
          disabled={isPending || editingId !== null}
        >
          <Plus className="w-4 h-4 mr-1" />
          タグを追加
        </Button>
      )}
    </div>
  );
}
