"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { toast } from "sonner";

type Props = {
  project: Project;
};

export function EditProjectForm({ project }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateProject(project.id, formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success("プロジェクトを更新しました");
    router.push("/projects");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>プロジェクト編集</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="name">プロジェクト名 *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={project.name} // 既存の値をセット
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明文</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project.description ?? ""} // nullの場合は空文字に
              rows={4}
            />
          </div>
        </CardContent>

        <CardFooter className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "更新中..." : "更新する"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
