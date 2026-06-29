import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="bg-linear-to-b from-white to-gray-50 py-16 text-center md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          ✨ チーム向けプロジェクト管理ツール
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          チームの流れを、
          <br />
          Flowyで。
        </h1>
        <p className="mb-10 text-base text-muted-foreground md:text-lg">
          チケット管理・カンバン・ガントチャート・AIアシストを一つに。
          <br className="hidden sm:block" />
          小さなチームから始める、シンプルなプロジェクト管理。
        </p>
        <Button size="lg" asChild className="px-6 py-5 text-base sm:px-8 sm:py-6">
          <Link href="/signup">無料で始める</Link>
        </Button>
      </div>
    </section>
  );
}
