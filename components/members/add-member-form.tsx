"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteMember } from "@/app/(app)/projects/actions";

type Props = {
  projectId: string;
  onMemberAdded: (projectId: string) => void;
};

export function AddMemberForm({ projectId, onMemberAdded }: Props) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const result = await inviteMember(projectId, trimmed);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setEmail("");
      toast.success("招待メールを送信しました");
      onMemberAdded(projectId);
    } catch {
      toast.error("招待の送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="招待するメールアドレスを入力"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading || !email.trim()}>
        {isLoading ? "送信中..." : "招待"}
      </Button>
    </form>
  );
}
