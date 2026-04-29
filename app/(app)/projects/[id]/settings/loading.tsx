import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ProjectSettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-48" />
      </div>

      <Separator className="mb-6" />

      {/* メンバー追加フォームのスケルトン */}
      <div className="mb-6 p-4 rounded-md border bg-muted/50">
        <Skeleton className="h-5 w-24 mb-3" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* テーブルのスケルトン */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <Skeleton className="h-4 w-32" />
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-16" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="h-8 w-8" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
