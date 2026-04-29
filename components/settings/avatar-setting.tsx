"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Trash2, Upload } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { generateUUID } from "@/lib/utils";
import { updateAvatarPath } from "@/app/(app)/settings/account/actions";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const BUCKET = "avatars";

interface AvatarUploadProps {
  userId: string;
  username: string;
  currentAvatarPath: string | null;
}

export function AvatarSetting({ userId, username, currentAvatarPath }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarPath, setAvatarPath] = useState<string | null>(currentAvatarPath);

  const isBusy = isUploading || isDeleting;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("JPEG・PNG・WebP 形式のファイルを選択してください");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("ファイルサイズは2MB以下にしてください");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();

      // 既存のアバターファイルを削除
      if (avatarPath) {
        await supabase.storage.from(BUCKET).remove([avatarPath]);
      }

      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const filePath = `${userId}/${generateUUID()}${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        toast.error("アップロードに失敗しました");
        return;
      }

      const result = await updateAvatarPath(filePath);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setAvatarPath(filePath);
      toast.success("アバターを更新しました");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!avatarPath) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([avatarPath]);

      const result = await updateAvatarPath(null);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setAvatarPath(null);
      toast.success("アバターを削除しました");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <UserAvatar avatarFilePath={avatarPath} username={username} size="xl" />
        {isBusy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <LoaderCircle className="size-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload />
          </Button>
          {avatarPath && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={handleDelete}
            >
              <Trash2 />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPEG・PNG・WebP、2MB以下</p>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
