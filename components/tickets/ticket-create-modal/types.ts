import { PriorityType, StatusType, CategoryType } from "@/types";

export interface RootTicket {
  id: string;
  title: string;
}

export interface TicketDefaultValues {
  title?: string;
  description?: string;
  status?: StatusType;
  priority?: PriorityType;
  category?: CategoryType;
  assigneeId?: string;
  startDate?: Date;
  dueDate?: Date;
  parentId?: string;
}

export interface TicketCreateModalProps {
  projectId: string;
  members: import("@/lib/supabase/members").ProjectMemberWithProfile[];
  rootTickets?: RootTicket[];
  defaultParentId?: string;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultValues?: TicketDefaultValues;
}
