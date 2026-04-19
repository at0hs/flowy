"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SummaryModal } from "./summary-modal";
import { summarizeTicketAction } from "@/app/(app)/projects/[id]/actions";
import { marked } from "marked";

interface AiAssistButtonProps {
  ticketId: string;
  isAiConfigured: boolean;
}

export function AiAssistButton({ ticketId, isAiConfigured }: AiAssistButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    setIsModalOpen(true);
    setSummary("");

    const result = await summarizeTicketAction(ticketId);

    if ("error" in result) {
      toast.error(result.error);
      setIsModalOpen(false);
    } else {
      const html = await marked.parse(result.summary);
      setSummary(html);
    }

    setIsLoading(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!isAiConfigured || isLoading}
        onClick={handleClick}
        title={!isAiConfigured ? "AI設定が未設定です" : "AIでチケットを要約"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        要約
      </Button>

      <SummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summary={summary}
        isLoading={isLoading}
      />
    </>
  );
}
