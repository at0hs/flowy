'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/layout/error-display';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MembersError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <ErrorDisplay title="メンバー管理の読み込みに失敗しました" reset={reset} />
    </div>
  );
}
