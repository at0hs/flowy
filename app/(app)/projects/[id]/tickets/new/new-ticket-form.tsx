"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectMemberWithProfile } from "@/lib/supabase/members";

interface NewTicketFormProps {
  projectId: string;
  members: ProjectMemberWithProfile[];
}

export default function NewTicketForm({ projectId, members }: NewTicketFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>("none");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("assignee_id", assigneeId === "none" ? "" : assigneeId);

    const result = await createTicket(projectId, formData);

    if (result?.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
    } else {
      router.push(`/projects/${projectId}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>チケット作成</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input id="title" name="title" required />
            </div>

            {/* 説明 */}
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea id="description" name="description" rows={4} />
            </div>

            <Separator />

            {/* 担当者 */}
            <div className="space-y-2">
              <Label>担当者</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未選択（担当者なし）</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile.username || member.profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* ステータス */}
            <div className="space-y-3">
              <Label>ステータス *</Label>
              <RadioGroup name="status" defaultValue="todo">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="todo" id="todo" />
                  <Label htmlFor="todo">TODO</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="in_progress" id="in_progress" />
                  <Label htmlFor="in_progress">進行中</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="done" id="done" />
                  <Label htmlFor="done">完了</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* 優先度 */}
            <div className="space-y-3">
              <Label>優先度 *</Label>
              <RadioGroup name="priority" defaultValue="medium">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low">低</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">中</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high">高</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent">緊急</Label>
                </div>
              </RadioGroup>
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
