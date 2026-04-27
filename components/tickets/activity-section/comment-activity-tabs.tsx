"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CommentList } from "@/components/tickets/comment-list";
import { ActivityList } from "./activity-list";
import { CommentWithProfile } from "@/lib/supabase/comments";
import { TicketActivityWithProfile } from "@/types";
import { type MentionMember } from "@/components/editor/rich-text-editor";

type Tab = "comments" | "activities";

type Props = {
  comments: CommentWithProfile[];
  activities: TicketActivityWithProfile[];
  ticketId: string;
  currentUserId: string;
  members?: MentionMember[];
};

export function CommentActivityTabs({
  comments,
  activities,
  ticketId,
  currentUserId,
  members,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("comments");

  return (
    <div>
      <div className="flex border-b mb-4">
        <TabButton active={activeTab === "comments"} onClick={() => setActiveTab("comments")}>
          コメント ({comments.filter((c) => !c.is_deleted).length})
        </TabButton>
        <TabButton active={activeTab === "activities"} onClick={() => setActiveTab("activities")}>
          アクティビティ ({activities.length})
        </TabButton>
      </div>

      {activeTab === "comments" ? (
        <CommentList
          comments={comments}
          ticketId={ticketId}
          currentUserId={currentUserId}
          members={members}
        />
      ) : (
        <ActivityList activities={activities} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
