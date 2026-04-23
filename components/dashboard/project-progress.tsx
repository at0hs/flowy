import Link from "next/link";
import { ProjectProgress } from "@/lib/supabase/dashboard";
import { STATUS_LABELS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { FolderOpen } from "lucide-react";

interface ProjectProgressProps {
  projects: ProjectProgress[];
}

export function ProjectProgressSection({ projects }: ProjectProgressProps) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3">プロジェクト進捗</h2>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-lg">
          <FolderOpen className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">参加しているプロジェクトがありません</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map(({ project, todo, in_progress, done }) => {
            const total = todo + in_progress + done;
            const donePercent = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <li key={project.id} className="rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm font-medium hover:underline truncate"
                  >
                    {project.name}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground ml-2">
                    {donePercent}% 完了
                  </span>
                </div>

                <Progress
                  value={donePercent}
                  className="h-2 mb-2 *:data-[slot=progress-indicator]:bg-lime-500"
                />

                {/* ステータス別カウント */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">{todo}</span> {STATUS_LABELS.todo}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{in_progress}</span>{" "}
                    {STATUS_LABELS.in_progress}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{done}</span> {STATUS_LABELS.done}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
