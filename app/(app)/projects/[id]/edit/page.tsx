import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditProjectForm } from "./edit-project-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 編集対象のプロジェクトを取得（現在ユーザーのロールも同時に取得）
  const { data: project } = await supabase
    .from("projects")
    .select("*, project_members!inner(role)")
    .eq("id", id)
    .eq("project_members.user_id", user.id)
    .single();

  // プロジェクトが存在しない、またはメンバーでない場合は404
  if (!project) notFound();

  // オーナー以外はプロジェクト一覧へリダイレクト
  if (project.project_members[0]?.role !== "owner") redirect("/projects");

  return (
    <div className="max-w-lg mx-auto p-8">
      {/* 取得したプロジェクトのデータをフォームに渡す */}
      <EditProjectForm project={project} />
    </div>
  );
}
