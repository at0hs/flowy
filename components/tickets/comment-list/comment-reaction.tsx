"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addReaction, removeReaction } from "@/app/(app)/projects/[id]/actions/reactions";
import { REACTION_EMOJIS } from "@/lib/constants";
import type { CommentReaction } from "@/types";

type Props = {
  commentId: string;
  ticketId: string;
  projectId: string;
  currentUserId: string;
  initialReactions: CommentReaction[];
};

export function CommentReaction({
  commentId,
  ticketId,
  projectId,
  currentUserId,
  initialReactions,
}: Props) {
  const [reactions, setReactions] = useState<CommentReaction[]>(initialReactions);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const optimisticIdRef = useRef(0);

  const grouped = REACTION_EMOJIS.reduce<Record<string, { count: number; isMine: boolean }>>(
    (acc, emoji) => {
      const matching = reactions.filter((r) => r.emoji === emoji);
      acc[emoji] = {
        count: matching.length,
        isMine: matching.some((r) => r.user_id === currentUserId),
      };
      return acc;
    },
    {}
  );

  const handleToggle = (emoji: string) => {
    const { isMine } = grouped[emoji];
    const prev = reactions;

    if (isMine) {
      setReactions((r) => r.filter((x) => !(x.emoji === emoji && x.user_id === currentUserId)));
    } else {
      const optimistic: CommentReaction = {
        id: `optimistic-${++optimisticIdRef.current}`,
        comment_id: commentId,
        user_id: currentUserId,
        emoji,
        created_at: new Date().toISOString(),
      };
      setReactions((r) => [...r, optimistic]);
    }

    startTransition(async () => {
      const result = isMine
        ? await removeReaction(commentId, emoji, ticketId, projectId)
        : await addReaction(commentId, emoji, ticketId, projectId);

      if ("error" in result) {
        setReactions(prev);
        toast.error(result.error);
        router.refresh();
      }
    });
  };

  const handleEmojiPick = (emoji: string) => {
    setOpen(false);
    handleToggle(emoji);
  };

  const formatCount = (count: number) => (count >= 10 ? "9+" : String(count));

  return (
    <div className="flex items-center flex-wrap gap-1">
      {REACTION_EMOJIS.filter((emoji) => grouped[emoji].count > 0).map((emoji) => {
        const { count, isMine } = grouped[emoji];
        return (
          <Badge
            key={emoji}
            asChild
            variant="outline"
            className={`cursor-pointer hover:bg-accent disabled:opacity-50 ${
              isMine ? "border-blue-500 bg-blue-400/30 text-primary hover:bg-blue-600/50" : ""
            }`}
          >
            <button onClick={() => handleToggle(emoji)} disabled={isPending}>
              <span className="text-sm">{emoji}</span>
              <span>{formatCount(count)}</span>
            </button>
          </Badge>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            tooltip="リアクションを追加"
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiPick(emoji)}
                className="rounded p-1.5 text-base leading-none hover:bg-accent transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
