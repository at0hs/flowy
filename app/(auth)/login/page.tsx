"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { acceptInvitationAction } from "@/app/(auth)/actions";
import { LoaderCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!token) return;
    supabase
      .from("invitations")
      .select("email")
      .eq("token", token)
      .single()
      .then(({ data }) => {
        if (data?.email) setEmail(data.email);
      });
  }, [token, supabase]);

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage("メールアドレスまたはパスワードが正しくありません");
      setIsLoading(false);
      logger.error("auth failed:", error);
      return;
    }

    // 招待トークンがある場合、プロジェクトメンバーに自動追加
    if (token && data.user) {
      try {
        await acceptInvitationAction(token, data.user.id);
      } catch (err) {
        logger.error("failed to accept invitation: ", err);
        // 招待受け入れに失敗してもログイン自体は成功しているため、そのまま続行
      }
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-linear-to-b from-muted/40 to-background px-4">
      <Link href="/" className="flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="Flowy" width={56} height={56} />
        <span className="text-2xl font-bold tracking-tight">Flowy</span>
      </Link>

      <Card className="w-full max-w-sm shadow-lg py-6">
        <CardHeader className="gap-1.5 text-center">
          <CardTitle className="text-xl font-semibold">ログイン</CardTitle>
          <CardDescription>アカウントにログインして続ける</CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t-0 bg-transparent">
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : "ログイン"}
            </Button>
            <p className="text-sm text-muted-foreground">
              アカウントをお持ちでない方は{" "}
              <Link
                href={token ? `/signup?token=${token}` : "/signup"}
                className="text-primary underline underline-offset-4"
              >
                サインアップ
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
