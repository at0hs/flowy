import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { logger } from "@/lib/logger";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // ログイン中のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 自分がメンバーのプロジェクトを取得（RLSが project_members でフィルタしてくれる）
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error(error);
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
        <Button asChild>
          <Link href="/projects/new">+ 新規作成</Link>
        </Button>
      </div>

      {/* プロジェクト一覧 */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} isOwner={project.owner_id === user.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">プロジェクトがまだありません</p>
          <Button asChild variant="outline">
            <Link href="/projects/new">最初のプロジェクトを作成する</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
