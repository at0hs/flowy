"use client";

import { ErrorDisplay } from "@/components/layout/error-display";

type Props = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  console.error(error);
  return <ErrorDisplay reset={reset} />;
}
