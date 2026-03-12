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

  // 編集対象のプロジェクトを取得
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single(); // 1件だけ取得

  // プロジェクトが存在しない場合は404
  if (!project) notFound();

  return (
    <div className="max-w-lg mx-auto p-8">
      {/* 取得したプロジェクトのデータをフォームに渡す */}
      <EditProjectForm project={project} />
    </div>
  );
}
