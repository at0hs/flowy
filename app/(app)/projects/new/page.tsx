"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProjectPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createProject(formData);

    // エラーが返ってきた場合のみ処理（成功時はServer Action内でredirectされる）
    if (result?.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>プロジェクト作成</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

            <div className="space-y-2">
              <Label htmlFor="name">プロジェクト名 *</Label>
              <Input
                id="name"
                name="name" // FormDataで取得するためにname属性が必要
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明文</Label>
              <Textarea id="description" name="description" placeholder="任意" rows={4} />
            </div>
          </CardContent>

          <CardFooter className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "作成中..." : "作成する"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
