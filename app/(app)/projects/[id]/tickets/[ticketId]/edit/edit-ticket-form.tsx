"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTicket } from "../../../actions";
import { Ticket } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Props = {
  ticket: Ticket;
  projectId: string;
};

export function EditTicketForm({ ticket, projectId }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateTicket(ticket.id, projectId, formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success("チケットを更新しました");
    router.push(`/projects/${projectId}/tickets/${ticket.id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>チケット編集</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">

          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input id="title" name="title" defaultValue={ticket.title} required />
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={ticket.description ?? ""}
              rows={4}
            />
          </div>

          <Separator />

          {/* ステータス */}
          <div className="space-y-3">
            <Label>ステータス *</Label>
            <RadioGroup name="status" defaultValue={ticket.status}>
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
            <RadioGroup name="priority" defaultValue={ticket.priority}>
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
            {isLoading ? "更新中..." : "更新する"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
