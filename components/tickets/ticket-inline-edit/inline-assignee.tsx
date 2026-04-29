"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";

type Props = {
  value: string | null;
  currentUserId?: string;
  members: ProjectMemberWithProfile[];
  onSave: (value: string | null) => Promise<void>;
  disabled?: boolean;
};

export function InlineAssignee({ value, currentUserId, members, onSave, disabled }: Props) {
  async function handleChange(newValue: string) {
    const assigneeId = newValue === "none" ? null : newValue;
    if (assigneeId !== value) {
      await onSave(assigneeId);
    }
  }

  async function handleAssignToSelf() {
    if (!currentUserId || disabled) return;
    if (currentUserId !== value) {
      await onSave(currentUserId);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Select value={value ?? "none"} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className="min-w-48 w-auto h-8 px-2 border-0 shadow-none bg-transparent hover:bg-muted rounded-sm gap-1.5 transition-colors focus:ring-0 focus-visible:ring-0 [&>svg:last-child]:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <UserAvatar size="sm" />
              未割り当て
            </div>
          </SelectItem>
          {members.map((m) => (
            <SelectItem key={m.user_id} value={m.user_id}>
              <div className="flex items-center gap-2">
                <UserAvatar
                  avatarFilePath={m.profile.avatar_file_path}
                  username={m.profile.username}
                  size="sm"
                />
                {m.profile.username || m.profile.email}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentUserId && !disabled && value !== currentUserId && (
        <button
          type="button"
          onClick={handleAssignToSelf}
          className="text-xs text-blue-400 hover:text-blue-300 hover:underline text-left pl-2 transition-colors"
        >
          自分に割り当てる
        </button>
      )}
    </div>
  );
}
