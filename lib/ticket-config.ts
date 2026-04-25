import {
  ChevronsDownIcon,
  ChevronsUpIcon,
  ChevronUpIcon,
  EqualIcon,
  BugIcon,
  CheckSquareIcon,
  TrendingUpIcon,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StatusType, PriorityType, CategoryType } from "@/types";
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/constants";

type StatusConfig = {
  label: string;
  badgeBgClass: string;
  badgeAlphaClass: string;
  columnBorderClass: string;
  columnBgClass: string;
};

export const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  todo: {
    label: STATUS_LABELS.todo,
    badgeBgClass: "bg-slate-200",
    badgeAlphaClass: "bg-slate-200 hover:bg-slate-500/30",
    columnBorderClass: "border-t-slate-400",
    columnBgClass: "bg-slate-500/10",
  },
  in_progress: {
    label: STATUS_LABELS.in_progress,
    badgeBgClass: "bg-blue-200",
    badgeAlphaClass: "bg-blue-200 hover:bg-blue-500/30",
    columnBorderClass: "border-t-sky-400",
    columnBgClass: "bg-sky-500/10",
  },
  done: {
    label: STATUS_LABELS.done,
    badgeBgClass: "bg-green-200",
    badgeAlphaClass: "bg-green-200 hover:bg-green-500/30",
    columnBorderClass: "border-t-green-500",
    columnBgClass: "bg-green-500/10",
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

type CategoryConfig = {
  label: string;
  icon: LucideIcon;
  iconColor: string;
  badgeBgClass: string;
  badgeAlphaClass: string;
};

export const CATEGORY_CONFIG: Record<CategoryType, CategoryConfig> = {
  bug: {
    label: CATEGORY_LABELS.bug,
    icon: BugIcon,
    iconColor: "text-red-500",
    badgeBgClass: "bg-red-200",
    badgeAlphaClass: "bg-red-200 hover:bg-red-500/30",
  },
  task: {
    label: CATEGORY_LABELS.task,
    icon: CheckSquareIcon,
    iconColor: "text-slate-500",
    badgeBgClass: "bg-slate-200",
    badgeAlphaClass: "bg-slate-200 hover:bg-slate-500/30",
  },
  feature: {
    label: CATEGORY_LABELS.feature,
    icon: Zap,
    iconColor: "text-blue-500",
    badgeBgClass: "bg-blue-200",
    badgeAlphaClass: "bg-blue-200 hover:bg-blue-500/30",
  },
  improvement: {
    label: CATEGORY_LABELS.improvement,
    icon: TrendingUpIcon,
    iconColor: "text-green-500",
    badgeBgClass: "bg-green-200",
    badgeAlphaClass: "bg-green-200 hover:bg-green-500/30",
  },
};
