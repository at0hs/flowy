import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="bg-gray-50 py-20 text-center">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
          さあ、始めましょう。
        </h2>
        <p className="mb-8 text-muted-foreground">
          クレジットカード不要。今すぐ無料でチームのプロジェクト管理を始められます。
        </p>
        <Button size="lg" asChild className="px-8 py-6 text-base">
          <Link href="/signup">今すぐ始める（無料）</Link>
        </Button>
      </div>
    </section>
  );
}
