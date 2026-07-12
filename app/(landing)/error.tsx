"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/layout/error-display";
import { logger } from "@/lib/logger";

type Props = {
  error: Error;
  reset: () => void;
};

export default function LandingErrorPage({ error, reset }: Props) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <ErrorDisplay reset={reset} />
    </div>
  );
}
