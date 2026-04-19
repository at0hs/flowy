"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Bell, Plug2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/settings/account", label: "アカウント", icon: User },
  { href: "/settings/notifications", label: "メール通知", icon: Bell },
  { href: "/settings/integrations", label: "外部連携", icon: Plug2 },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 bg-accent border-r border-border flex flex-col p-3 gap-1">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mb-1">
        設定
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
