import { Sidebar } from "@/components/sidebar/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getUserProjects, getUserProfile } from "@/lib/supabase/projects";
import { notFound } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // ユーザープロフィールとプロジェクト一覧を取得
  let userProfile;

  try {
    userProfile = await getUserProfile();
  } catch {
    // エラーの場合は404を返す（認証されていない等）
    notFound();
  }

  const projects = await getUserProjects();

  return (
    <div className="flex h-screen bg-background">
      {/* サイドバー */}
      <Sidebar projects={projects} userProfile={userProfile} />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* トースト通知 */}
      <Toaster richColors />
    </div>
  );
}
