"use client";

import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="max-w-4xl mx-auto px-8 h-14 flex items-center justify-between">
        {/* ロゴ・アプリ名 */}
        <Link href="/projects" className="font-bold text-lg">
          Flowy
        </Link>

        {/* ログアウト */}
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            ログアウト
          </Button>
        </form>
      </div>
    </header>
  );
}
