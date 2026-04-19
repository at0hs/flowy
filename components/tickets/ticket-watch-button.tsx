"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { watchTicket, unwatchTicket } from "@/app/(app)/projects/[id]/actions/watches";

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
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-1.5"
      tooltip={isWatching ? "ウォッチ解除" : "ウォッチ"}
    >
      {isWatching ? (
        <>
          <EyeOff className="h-4 w-4" />
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
