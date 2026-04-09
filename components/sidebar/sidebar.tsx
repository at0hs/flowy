"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LogOut,
  Settings,
  ChevronDown,
  ChevronRight,
  Ticket,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { NotificationWithDetails } from "@/types";

interface SidebarProps {
  projects: Array<{
    id: string;
    name: string;
  }>;
  userProfile: {
    username: string;
    email: string;
  };
  unreadCount: number;
  notifications: NotificationWithDetails[];
}

export function Sidebar({ projects, userProfile, unreadCount, notifications }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 現在のパスからプロジェクトIDを抽出
  const currentProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? null;

  // ユーザーが手動で開いたプロジェクトのセット（現在のプロジェクトは常に開く）
  const [manuallyOpenedProjects, setManuallyOpenedProjects] = useState<Set<string>>(new Set());

  const isProjectOpen = (projectId: string) =>
    projectId === currentProjectId || manuallyOpenedProjects.has(projectId);

  const toggleProject = (projectId: string) => {
    // 現在のプロジェクトは閉じられない（パスと同期済みのため）
    if (projectId === currentProjectId) return;
    setManuallyOpenedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  projects.sort((a, b) => a.name.localeCompare(b.name));

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      logger.error("Logout failed:", error);
    }
  };

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen">
      {/* ユーザー情報セクション */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {userProfile.username}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{userProfile.email}</div>
          </div>
          <NotificationDropdown unreadCount={unreadCount} notifications={notifications} />
        </div>
      </div>

      {/* プロジェクト一覧セクション */}
      <div className="flex-1 overflow-y-auto p-4">
        <Link
          href="/projects"
          className="group flex items-center gap-1.5 px-1 py-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          プロジェクト
          <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <nav className="space-y-1">
          {projects.length > 0 ? (
            projects.map((project) => {
              const isOpen = isProjectOpen(project.id);
              const ticketsPath = `/projects/${project.id}`;
              const membersPath = `/projects/${project.id}/members`;
              const isTicketsActive =
                pathname === ticketsPath || pathname.startsWith(`/projects/${project.id}/tickets`);
              const isMembersActive = pathname === membersPath;

              return (
                <div key={project.id}>
                  {/* プロジェクト名（アコーディオンヘッダー） */}
                  <button
                    onClick={() => toggleProject(project.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      currentProjectId === project.id
                        ? "text-foreground bg-accent"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <span className="truncate text-left">{project.name}</span>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 ml-1 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 ml-1 text-muted-foreground" />
                    )}
                  </button>

                  {/* 子項目（アコーディオンコンテンツ） */}
                  {isOpen && (
                    <div className="ml-3 mt-1 space-y-0.5">
                      <Link
                        href={ticketsPath}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                          isTicketsActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Ticket className="h-3.5 w-3.5 shrink-0" />
                        チケット一覧
                      </Link>
                      <Link
                        href={membersPath}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                          isMembersActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        メンバー管理
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground px-3 py-2">プロジェクトはありません</div>
          )}
        </nav>
      </div>

      <Separator />

      {/* メニューセクション */}
      <div className="p-4 space-y-2">
        <Link href="/settings" className="w-full">
          <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-accent">
            <Settings className="mr-2 h-4 w-4" />
            設定
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="w-full justify-start text-foreground hover:bg-accent"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </aside>
  );
}
