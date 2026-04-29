import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ProjectSettingsFieldsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* ヘッダー部分（パンくずとタイトル） */}
      <div className="mb-8">
        <div className="flex items-center gap-1 mb-2">
          <Skeleton className="h-4 w-4" /> {/* ←アイコン用 */}
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>

      <Separator className="mb-8" />

      {/* コンテンツエリア */}
      <div className="space-y-6">
        {/* セクションラベル */}
        <Skeleton className="h-5 w-12" />

        {/* タグリストのカード */}
        <div className="rounded-lg border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b last:border-0">
              {/* タグのバッジ風スケルトン */}
              <div className="flex items-center">
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>

              {/* 右側の操作アイコン（編集・削除） */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        {/* タグを追加ボタン */}
        <div className="mt-4">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
