"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/layout/error-display";
import { logger } from "@/lib/logger";

type Props = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <ErrorDisplay reset={reset} />
    </div>
  );
}
