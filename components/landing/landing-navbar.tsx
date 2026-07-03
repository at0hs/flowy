import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image src="/logo.png" alt="Flowy" width={32} height={32} />
          Flowy
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">ログイン</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">無料で始める</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
