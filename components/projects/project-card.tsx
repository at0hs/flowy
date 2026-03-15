"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/app/(app)/projects/actions";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Project } from "@/types";
import { toast } from "sonner";

type Props = {
  project: Project;
};

export function ProjectCard({ project }: Props) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deleteProject(project.id);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
      setIsDialogOpen(false);
      return;
    }

    toast.success("プロジェクトを削除しました");
    setIsDialogOpen(false);
    setIsLoading(false);
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {/* プロジェクト名をクリックするとチケット一覧へ */}
            <Link href={`/projects/${project.id}`} className="hover:underline">
              {project.name}
            </Link>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {project.description ? (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">説明なし</p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <Badge variant="outline">
            {new Date(project.created_at).toLocaleDateString("ja-JP")}
          </Badge>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.id}/edit`}>編集</Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDialogOpen(true)}>
              削除
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロジェクトを削除しますか？</DialogTitle>
            <DialogDescription>
              「{project.name}
              」を削除すると、紐づくチケットもすべて削除されます。<br/>この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
