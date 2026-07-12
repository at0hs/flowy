"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/layout/error-display";
import { logger } from "@/lib/logger";

type Props = {
  error: Error;
  reset: () => void;
};

export default function AuthErrorPage({ error, reset }: Props) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorDisplay reset={reset} />
      </div>
    </div>
  );
}
