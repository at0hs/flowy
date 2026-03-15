import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-lg mx-auto p-8">
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
