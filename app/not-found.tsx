import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <Image src="/logo.png" alt="Flowy" width={32} height={32} />
        Flowy
      </Link>
      <div className="space-y-2">
        <p className="text-4xl font-bold text-muted-foreground">404</p>
        <h1 className="text-xl font-semibold">ページが見つかりません</h1>
        <p className="text-sm text-muted-foreground">
          指定されたページは存在しないか、移動した可能性があります。
        </p>
      </div>
      <Button asChild>
        <Link href="/">トップに戻る</Link>
      </Button>
    </div>
  );
}
