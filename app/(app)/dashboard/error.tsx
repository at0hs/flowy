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
    <div className="p-6 max-w-5xl mx-auto">
      <ErrorDisplay reset={reset} />
    </div>
  );
}
