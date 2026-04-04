"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMemberRole } from "@/app/(app)/projects/actions";

type Props = {
  projectId: string;
  memberId: string;
  memberName: string;
  currentRole: "owner" | "member";
  isLastOwner: boolean;
};

export function ChangeRoleButton({
  projectId,
  memberId,
  memberName,
  currentRole,
  isLastOwner,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState<"owner" | "member" | null>(null);

  const handleValueChange = (value: string) => {
    const newRole = value as "owner" | "member";
    if (newRole === currentRole) return;
    // 降格の場合は確認ダイアログを表示
    if (newRole === "member") {
      setPendingRole("member");
    } else {
      applyRoleChange("owner");
    }
  };

  const applyRoleChange = async (newRole: "owner" | "member") => {
    setIsLoading(true);
    try {
      await updateMemberRole(projectId, memberId, newRole);
      const label = newRole === "owner" ? "オーナー" : "メンバー";
      toast.success(`${memberName} のロールを${label}に変更しました`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ロールの変更に失敗しました";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setPendingRole(null);
    }
  };

  return (
    <>
      <Select value={currentRole} onValueChange={handleValueChange} disabled={isLoading}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">オーナー</SelectItem>
          <SelectItem value="member" disabled={isLastOwner}>
            メンバー
            {isLastOwner && "（最後のオーナーは変更不可）"}
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={pendingRole !== null} onOpenChange={(open) => !open && setPendingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>オーナーを降格しますか？</DialogTitle>
            <DialogDescription>
              {memberName} をメンバーに降格します。降格後はオーナー権限が失われます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRole(null)} disabled={isLoading}>
              キャンセル
            </Button>
            <Button onClick={() => applyRoleChange("member")} disabled={isLoading}>
              {isLoading ? "変更中..." : "変更する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
