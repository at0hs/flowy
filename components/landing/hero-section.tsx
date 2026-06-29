import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-24 text-center">
      <div className="mx-auto max-w-3xl px-6">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          ✨ チーム向けプロジェクト管理ツール
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          チームの流れを、
          <br />
          Flowyで。
        </h1>
        <p className="mb-10 text-lg text-muted-foreground">
          チケット管理・カンバン・ガントチャート・AIアシストを一つに。
          <br />
          小さなチームから始める、シンプルなプロジェクト管理。
        </p>
        <Button size="lg" asChild className="px-8 py-6 text-base">
          <Link href="/signup">無料で始める</Link>
        </Button>
      </div>
    </section>
  );
}
