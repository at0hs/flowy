import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getProjectTags } from "@/lib/supabase/tags";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import { TagSettingsClient } from "./tag-settings-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectSettingsFieldsPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();

  if (!project) notFound();

  const tags = await getProjectTags(id);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            href="/projects"
            className="hover:underline hover:text-foreground transition-colors"
          >
            マイプロジェクト
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link
            href={`/projects/${id}`}
            className="hover:underline hover:text-foreground transition-colors"
          >
            {project.name}
          </Link>
        </nav>
        <h1 className="text-2xl font-bold mt-1">フィールド設定</h1>
      </div>

      <Separator className="mb-6" />

      <section>
        <h2 className="text-lg font-semibold mb-3">タグ</h2>
        <TagSettingsClient initialTags={tags} projectId={id} />
      </section>
    </div>
  );
}
