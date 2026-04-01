"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { watchTicket, unwatchTicket } from "@/app/(app)/projects/[id]/actions";

interface TicketWatchButtonProps {
  ticketId: string;
  isWatching: boolean;
}

export function TicketWatchButton({ ticketId, isWatching }: TicketWatchButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = isWatching ? await unwatchTicket(ticketId) : await watchTicket(ticketId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-1.5"
    >
      {isWatching ? (
        <>
          <EyeOff className="h-4 w-4" />
          ウォッチ解除
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          ウォッチ
        </>
      )}
    </Button>
  );
}
