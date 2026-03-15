"use client";

import { Button } from "@/components/ui/button";

type Props = {
  message?: string;
  reset: () => void;
};

export function ErrorDisplay({ message, reset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-100 gap-4">
      <p className="text-muted-foreground">{message ?? "予期しないエラーが発生しました"}</p>
      <Button variant="outline" onClick={reset}>
        もう一度試す
      </Button>
    </div>
  );
}
