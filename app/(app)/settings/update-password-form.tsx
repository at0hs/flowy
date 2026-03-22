"use client";

import { useRef, useState } from "react";
import { updatePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success("パスワードを変更しました");
    formRef.current?.reset();
    setIsLoading(false);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new_password">新しいパスワード *</Label>
        <Input id="new_password" name="new_password" type="password" autoComplete="off" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">新しいパスワード（確認） *</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="off"
          required
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "変更中..." : "変更する"}
        </Button>
      </div>
    </form>
  );
}
