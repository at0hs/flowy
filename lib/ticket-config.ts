import { ChevronsDownIcon, ChevronsUpIcon, ChevronUpIcon, EqualIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StatusType, PriorityType } from "@/types";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";

type StatusConfig = {
  label: string;
  badgeClass: string;
  badgeAlphaClass: string;
  columnBorderClass: string;
};

export const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  todo: {
    label: STATUS_LABELS.todo,
    badgeClass: "bg-slate-500",
    badgeAlphaClass: "bg-slate-500/20 hover:bg-slate-500/30",
    columnBorderClass: "border-t-slate-400",
  },
  in_progress: {
    label: STATUS_LABELS.in_progress,
    badgeClass: "bg-blue-500",
    badgeAlphaClass: "bg-blue-500/20 hover:bg-blue-500/30",
    columnBorderClass: "border-t-blue-400",
  },
  done: {
    label: STATUS_LABELS.done,
    badgeClass: "bg-green-500",
    badgeAlphaClass: "bg-green-500/20 hover:bg-green-500/30",
    columnBorderClass: "border-t-green-500",
  },
};

type PriorityConfig = {
  label: string;
  icon: LucideIcon;
  iconColor: string;
  dotColor: string;
};

export const PRIORITY_CONFIG: Record<PriorityType, PriorityConfig> = {
  low: {
    label: PRIORITY_LABELS.low,
    icon: ChevronsDownIcon,
    iconColor: "text-blue-400",
    dotColor: "bg-blue-400",
  },
  medium: {
    label: PRIORITY_LABELS.medium,
    icon: EqualIcon,
    iconColor: "text-orange-300",
    dotColor: "bg-yellow-400",
  },
  high: {
    label: PRIORITY_LABELS.high,
    icon: ChevronUpIcon,
    iconColor: "text-red-400",
    dotColor: "bg-orange-400",
  },
  urgent: {
    label: PRIORITY_LABELS.urgent,
    icon: ChevronsUpIcon,
    iconColor: "text-red-400",
    dotColor: "bg-red-500",
  },
};
