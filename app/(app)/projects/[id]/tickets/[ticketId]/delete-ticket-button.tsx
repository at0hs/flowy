"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTicket } from "../../actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = {
  ticketId: string;
  projectId: string;
  ticketTitle: string;
};

export function DeleteTicketButton({ ticketId, projectId, ticketTitle }: Props) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deleteTicket(ticketId, projectId);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
      setIsDialogOpen(false);
      return;
    }

    toast.success("チケットを削除しました");
    setIsDialogOpen(false);
    setIsLoading(false);
    router.push(`/projects/${projectId}`);
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setIsDialogOpen(true)}>
        削除
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>チケットを削除しますか？</DialogTitle>
            <DialogDescription>
              「{ticketTitle}」を削除します。<br/>この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
