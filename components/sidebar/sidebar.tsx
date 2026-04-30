"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LogOut,
  Settings,
  ChevronDown,
  ChevronRight,
  Ticket,
  LayoutDashboard,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NotificationWithDetails } from "@/types";

interface SidebarProps {
  projects: Array<{
    id: string;
    name: string;
  }>;
  userProfile: {
    username: string;
    email: string;
    avatar_file_path: string | null;
  };
  unreadCount: number;
  notifications: NotificationWithDetails[];
}

export function Sidebar({ projects, userProfile, unreadCount, notifications }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(
    () =>
      typeof window !== "undefined" && localStorage.getItem("flowy_sidebar_collapsed") === "true"
  );

  const toggleCollapse = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem("flowy_sidebar_collapsed", String(value));
  };

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
    <TooltipProvider>
      <aside
        className={cn(
          "bg-surface border-r border-border flex flex-col h-screen transition-all duration-200",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* ユーザー情報セクション */}
        <div className={cn("border-b border-border", isCollapsed ? "p-2" : "p-4")}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => toggleCollapse(false)}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
              <NotificationDropdown unreadCount={unreadCount} notifications={notifications} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <UserAvatar
                      avatarFilePath={userProfile.avatar_file_path}
                      username={userProfile.username}
                      size="sm"
                      className="shrink-0"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">{userProfile.username}</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarFilePath={userProfile.avatar_file_path}
                username={userProfile.username}
                size="sm"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground truncate">
                  {userProfile.username}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {userProfile.email}
                </div>
              </div>
              <NotificationDropdown unreadCount={unreadCount} notifications={notifications} />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => toggleCollapse(true)}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* プロジェクト一覧セクション */}
        <div className={cn("flex-1 overflow-y-auto", isCollapsed ? "p-2" : "p-4")}>
          {isCollapsed ? (
            <nav className="flex flex-col items-center gap-1">
              {/* ホーム */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-md transition-colors",
                      pathname === "/dashboard"
                        ? "bg-accent text-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <Home className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">ホーム</TooltipContent>
              </Tooltip>
              {/* プロジェクト一覧リンク */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/projects"
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-md transition-colors",
                      pathname === "/projects"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">マイプロジェクト</TooltipContent>
              </Tooltip>
            </nav>
          ) : (
            <>
              {/* ホームボタン */}
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-1.5 px-1 py-1 rounded-md text-sm font-medium transition-colors mb-2",
                  pathname === "/dashboard"
                    ? "bg-accent text-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <Home className="h-4 w-4 shrink-0" />
                ホーム
              </Link>

              <Link
                href="/projects"
                className={cn(
                  "flex items-center gap-1.5 px-1 py-1 rounded-md text-sm font-medium transition-colors mb-2",
                  pathname === "/projects"
                    ? "bg-accent text-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                マイプロジェクト
              </Link>
              <Separator className="mb-2" />
              <nav className="space-y-1">
                {projects.length > 0 ? (
                  projects.map((project) => {
                    const isOpen = isProjectOpen(project.id);
                    const ticketsPath = `/projects/${project.id}`;
                    const settingsPath = `/projects/${project.id}/settings`;
                    const isTicketsActive =
                      pathname === ticketsPath ||
                      pathname.startsWith(`/projects/${project.id}/tickets`);
                    const isSettingsActive = pathname.startsWith(
                      `/projects/${project.id}/settings`
                    );

                    return (
                      <div key={project.id}>
                        {/* プロジェクト名（アコーディオンヘッダー） */}
                        <Button
                          variant="ghost"
                          onClick={() => toggleProject(project.id)}
                          className={cn(
                            "w-full h-auto justify-between px-3 py-2 text-sm font-medium",
                            isOpen
                              ? "bg-accent/50 text-foreground hover:bg-accent/50"
                              : "text-foreground hover:bg-accent"
                          )}
                        >
                          <span className="truncate text-left">{project.name}</span>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0 ml-1 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 ml-1 text-muted-foreground" />
                          )}
                        </Button>

                        {/* 子項目（アコーディオンコンテンツ） */}
                        {isOpen && (
                          <div className="ml-3 mt-1 space-y-0.5">
                            <Link
                              href={ticketsPath}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                                isTicketsActive
                                  ? "bg-accent text-black font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                            >
                              <Ticket className="h-3.5 w-3.5 shrink-0" />
                              チケット一覧
                            </Link>
                            <Link
                              href={settingsPath}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                                isSettingsActive
                                  ? "bg-accent text-black font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                            >
                              <Settings className="h-3.5 w-3.5 shrink-0" />
                              プロジェクト設定
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground px-3 py-2">
                    プロジェクトはありません
                  </div>
                )}
              </nav>
            </>
          )}
        </div>

        <Separator />

        {/* メニューセクション */}
        <div className={cn("space-y-2", isCollapsed ? "p-2" : "p-4")}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/settings">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-foreground hover:bg-accent"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">設定</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-foreground hover:bg-accent"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">ログアウト</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith("/settings")
                    ? "bg-accent text-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <Settings className="h-4 w-4" />
                設定
              </Link>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full h-auto justify-start gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                ログアウト
              </Button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
