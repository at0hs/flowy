'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

type Props = {
  title?: string;
  message?: string;
  reset: () => void;
};

export function ErrorDisplay({ title, message, reset }: Props) {
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          {title && <h2 className="text-lg font-semibold text-destructive mb-2">{title}</h2>}
          <p className="text-sm text-muted-foreground mb-4">
            {message ?? '予期しないエラーが発生しました。もう一度お試しください。'}
          </p>
          <Button onClick={() => reset()} variant="outline" size="sm">
            再度読み込む
          </Button>
        </div>
      </div>
    </div>
  );
}
