"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
};

export function ProjectSettingsNav({ projectId }: Props) {
  const pathname = usePathname();

  const navItems = [
    { href: `/projects/${projectId}/settings/members`, label: "メンバー管理", icon: Users },
    { href: `/projects/${projectId}/settings/fields`, label: "フィールド設定", icon: Tag },
  ];

  return (
    <nav className="shrink-0 bg-accent border-r border-border flex flex-col p-3 gap-1">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mb-1">
        プロジェクト設定
      </div>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap",
              isActive
                ? "bg-neutral-400/30 text-black font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
