"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

type Props = {
  error: Error;
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: Props) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <Image src="/logo.png" alt="Flowy" width={32} height={32} />
        Flowy
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">予期しないエラーが発生しました</h1>
        <p className="text-sm text-muted-foreground">しばらくしてから、もう一度お試しください。</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => reset()} variant="outline">
          再度読み込む
        </Button>
        <Button asChild>
          <Link href="/">トップに戻る</Link>
        </Button>
      </div>
    </div>
  );
}
