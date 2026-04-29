"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/layout/error-display";
import { logger } from "@/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProjectSettingsFieldsError({ error, reset }: Props) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <ErrorDisplay title="フィールド設定の読み込みに失敗しました" reset={reset} />
    </div>
  );
}
