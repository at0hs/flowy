"use client";

import { useState } from "react";
import { Sparkles, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { TicketCreateModal } from "@/components/tickets/ticket-create-modal";
import { suggestSubtaskAction } from "@/app/(app)/projects/[id]/actions/ai";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";
import { SuggestedSubtask } from "@/lib/ai";

interface SubtaskSuggestButtonProps {
  ticketId: string;
  isAiConfigured: boolean;
  projectId: string;
  members: ProjectMemberWithProfile[];
  parentTicketId: string;
}

export function SubtaskSuggestButton({
  ticketId,
  isAiConfigured,
  projectId,
  members,
  parentTicketId,
}: SubtaskSuggestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestedSubtask | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    const result = await suggestSubtaskAction(ticketId);

    if ("error" in result) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    setSuggestion({
      ...result,
      description: await marked.parse(result.description),
    });
    setIsModalOpen(true);
    setIsLoading(false);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) setSuggestion(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!isAiConfigured || isLoading}
        onClick={handleClick}
        title={!isAiConfigured ? "AI設定が未設定です" : "AIでサブタスクを提案"}
      >
        {isLoading ? (
          <LoaderCircle className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        提案
      </Button>

      {suggestion && (
        <TicketCreateModal
          projectId={projectId}
          members={members}
          defaultParentId={parentTicketId}
          open={isModalOpen}
          onOpenChange={handleModalOpenChange}
          initialTitle={suggestion.title}
          initialDescription={suggestion.description}
          initialPriority={suggestion.priority}
        />
      )}
    </>
  );
}
