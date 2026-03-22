"use client";

import { ErrorDisplay } from "@/components/layout/error-display";

type Props = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  console.error(error);
  return (
    <div className="max-w-4xl mx-auto p-8">
      <ErrorDisplay reset={reset} />
    </div>
  );
}
