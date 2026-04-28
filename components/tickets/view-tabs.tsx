"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutList, Kanban, GanttChartSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { TicketView } from "@/lib/constants";

type ViewTabsProps = {
  currentView: TicketView;
};

export function ViewTabs({ currentView }: ViewTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = (view: TicketView) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex border-b mt-8">
      <button
        onClick={() => setView("list")}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
          currentView === "list"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutList className="w-4 h-4" />
        リスト
      </button>
      <button
        onClick={() => setView("kanban")}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
          currentView === "kanban"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <Kanban className="w-4 h-4" />
        カンバン
      </button>
      <button
        onClick={() => setView("gantt")}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
          currentView === "gantt"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <GanttChartSquare className="w-4 h-4" />
        ガント
      </button>
    </div>
  );
}
