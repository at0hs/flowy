'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut, Settings } from 'lucide-react';

interface SidebarProps {
  projects: Array<{
    id: string;
    name: string;
  }>;
  userProfile: {
    display_name: string;
    email: string;
  };
}

export function Sidebar({ projects, userProfile }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen">
      {/* ユーザー情報セクション */}
      <div className="p-4 border-b border-border">
        <div className="text-sm font-semibold text-foreground">
          {userProfile.display_name}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {userProfile.email}
        </div>
      </div>

      {/* プロジェクト一覧セクション */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          プロジェクト
        </div>
        <nav className="space-y-1">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                {project.name}
              </Link>
            ))
          ) : (
            <div className="text-xs text-muted-foreground px-3 py-2">
              プロジェクトはありません
            </div>
          )}
        </nav>
      </div>

      <Separator />

      {/* メニューセクション */}
      <div className="p-4 space-y-2">
        <Link href="/settings" className="w-full">
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground hover:bg-accent"
          >
            <Settings className="mr-2 h-4 w-4" />
            アカウント設定
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
