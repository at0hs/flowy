import { TicketPriority, TicketStatus, TicketCategory, Tag } from "@/types";

export interface RootTicket {
  id: string;
  title: string;
}

export interface TicketDefaultValues {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigneeId?: string;
  startDate?: Date;
  dueDate?: Date;
  parentId?: string;
  tagIds?: string[];
}

export interface TicketCreateModalProps {
  projectId: string;
  members: import("@/lib/supabase/members").ProjectMemberWithProfile[];
  rootTickets?: RootTicket[];
  tags?: Tag[];
  defaultParentId?: string;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultValues?: TicketDefaultValues;
}
