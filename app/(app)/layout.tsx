import { Sidebar } from "@/components/sidebar/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getUserProjects, getUserProfile } from "@/lib/supabase/projects";
import { getUnreadCount, getNotifications } from "@/lib/supabase/notifications";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // ユーザープロフィールとプロジェクト一覧を取得
  let userProfile;

  try {
    userProfile = await getUserProfile();
  } catch {
    // エラーの場合は404を返す（認証されていない等）
    notFound();
  }

  const [projects, unreadCount, notifications, cookieStore] = await Promise.all([
    getUserProjects(),
    getUnreadCount(userProfile.id),
    getNotifications(userProfile.id, 20),
    cookies(),
  ]);
  const initialCollapsed = cookieStore.get("flowy_sidebar_collapsed")?.value === "true";

  return (
    <div className="flex h-screen bg-background">
      {/* サイドバー */}
      <Sidebar
        projects={projects}
        userProfile={userProfile}
        unreadCount={unreadCount}
        notifications={notifications}
        initialCollapsed={initialCollapsed}
      />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* トースト通知 */}
      <Toaster richColors />
    </div>
  );
}
