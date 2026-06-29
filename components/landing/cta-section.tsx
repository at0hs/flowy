import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="bg-gray-50 py-14 text-center md:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          さあ、始めましょう。
        </h2>
        <p className="mb-8 text-muted-foreground">
          クレジットカード不要。今すぐ無料でチームのプロジェクト管理を始められます。
        </p>
        <Button size="lg" asChild className="px-6 py-5 text-base sm:px-8 sm:py-6">
          <Link href="/signup">今すぐ始める（無料）</Link>
        </Button>
      </div>
    </section>
  );
}
