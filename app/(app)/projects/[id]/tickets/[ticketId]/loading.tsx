import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="flex justify-between items-start mb-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
      <Skeleton className="h-px w-full mb-6" />
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
      </div>
      <Skeleton className="h-4 w-16 mb-2" />
      <Skeleton className="h-20 w-full mb-6" />
      <Skeleton className="h-px w-full mb-6" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
