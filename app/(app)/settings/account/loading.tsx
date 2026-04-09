import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function AccountSettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <Skeleton className="h-8 w-40 mb-6" />

      <Separator className="mb-8" />

      {/* プロフィール編集セクション */}
      <section className="mb-10">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </section>

      <Separator className="mb-8" />

      {/* パスワード変更セクション */}
      <section>
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </section>
    </div>
  );
}
