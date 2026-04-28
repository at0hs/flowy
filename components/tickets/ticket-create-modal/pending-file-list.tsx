"use client";

import { useRef } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatFileSize } from "@/lib/utils";

type PendingFileListProps = {
  files: File[];
  onRemove: (index: number) => void;
  onAdd: (files: File[]) => void;
};

export function PendingFileList({ files, onRemove, onAdd }: PendingFileListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    onAdd(selected);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground">添付ファイル ({files.length})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4.5 w-3.5" />
          ファイルを追加
        </Button>
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelect} />
      </div>
      {files.length > 0 && (
        <div className="border rounded-lg divide-y">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 px-3 py-2 text-sm">
              <Paperclip className="h-5 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-2 truncate" title={file.name}>
                {file.name}
              </span>
              <span className="shrink text-muted-foreground text-xs">
                {formatFileSize(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-6 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onRemove(index)}
              >
                <X className="h-4.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
