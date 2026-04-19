import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TicketCreateModal } from "@/components/tickets/ticket-create-modal";
import { SubtaskSuggestButton } from "@/components/tickets/ai-assist/subtask-suggest-button";
import { SubticketWithAssignee } from "@/lib/supabase/tickets";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";

const STATUS_MAP = {
  todo: { label: "TODO", color: "bg-slate-500" },
  in_progress: { label: "進行中", color: "bg-blue-500" },
  done: { label: "完了", color: "bg-green-500" },
} as const;

interface SubtaskSectionProps {
  parentTicketId: string;
  projectId: string;
  subtickets: SubticketWithAssignee[];
  members: ProjectMemberWithProfile[];
  isAiConfigured: boolean;
}

export function SubtaskSection({
  parentTicketId,
  projectId,
  subtickets,
  members,
  isAiConfigured,
}: SubtaskSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">サブタスク（{subtickets.length}）</h3>
        <div className="flex items-center gap-2">
          <SubtaskSuggestButton
            ticketId={parentTicketId}
            isAiConfigured={isAiConfigured}
            projectId={projectId}
            members={members}
            parentTicketId={parentTicketId}
          />
          <TicketCreateModal
            projectId={projectId}
            members={members}
            defaultParentId={parentTicketId}
            triggerLabel="サブタスクを追加"
          />
        </div>
      </div>

      {subtickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">サブタスクはありません</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {subtickets.map((ticket) => {
            const status = STATUS_MAP[ticket.status];
            const assigneeName = ticket.assignee?.username ?? ticket.assignee?.email ?? null;

            return (
              <div key={ticket.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                <Badge
                  variant="default"
                  className={`${status.color}/20 text-primary rounded-sm shrink-0`}
                >
                  {status.label}
                </Badge>
                <Link
                  href={`/projects/${projectId}/tickets/${ticket.id}`}
                  className="flex-1 font-medium text-primary hover:underline truncate"
                >
                  {ticket.title}
                </Link>
                <span className="text-muted-foreground shrink-0">
                  {assigneeName ?? <span className="italic">担当者なし</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
