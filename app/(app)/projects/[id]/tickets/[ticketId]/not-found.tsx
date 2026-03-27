import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";

export default function TicketNotFound() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="rounded-md border border-muted p-6">
        <div className="flex items-start gap-4">
          <FileX className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">チケットが見つかりません</h2>
            <p className="text-sm text-muted-foreground mb-4">
              指定されたチケットは存在しないか、アクセス権限がありません。
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">プロジェクト一覧に戻る</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
