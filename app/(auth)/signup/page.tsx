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
import { confirmEmailAndAcceptInvitationAction } from "@/app/(auth)/actions";
import { LoaderCircle } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

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
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3111";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username },
        emailRedirectTo: `${appUrl}/login`,
      },
    });

    if (error) {
      logger.error("failed to signup: ", error.message);
      setErrorMessage("登録に失敗しました。別のメールアドレスをお試しください");
      setIsLoading(false);
      return;
    }

    // 招待トークンがある場合、メール認証スキップ + プロジェクトメンバーに自動追加
    if (token && data.user) {
      try {
        await confirmEmailAndAcceptInvitationAction(token, data.user.id);
        // メール確認済みにしたのでそのままサインインしてセッションを確立
        await supabase.auth.signInWithPassword({ email, password });
      } catch (err) {
        logger.error("failed to confirm email or accept invitation: ", err);
        // 失敗しても登録自体は成功しているため、そのまま続行
      }
      router.push("/dashboard");
      return;
    }

    // 通常サインアップ：確認メール送信済み画面を表示
    setEmailSent(true);
    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-linear-to-b from-muted/40 to-background px-4">
        <Link href="/" className="flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Flowy" width={56} height={56} />
          <span className="text-2xl font-bold tracking-tight">Flowy</span>
        </Link>

        <Card className="w-full max-w-sm shadow-lg py-6">
          <CardHeader className="gap-1.5 text-center">
            <CardTitle className="text-xl font-semibold">確認メールを送信しました</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-foreground font-bold">{email}</span>{" "}
              に確認メールを送信しました。
            </p>
            <p>メール内のリンクをクリックして、メールアドレスを認証してください。</p>
          </CardContent>
          <CardFooter className="border-t-0 bg-transparent">
            <p className="text-sm text-muted-foreground">
              メールが届かない場合はスパムフォルダをご確認ください。
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-linear-to-b from-muted/40 to-background px-4">
      <Link href="/" className="flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="Flowy" width={56} height={56} />
        <span className="text-2xl font-bold tracking-tight">Flowy</span>
      </Link>

      <Card className="w-full max-w-sm shadow-lg py-6">
        <CardHeader className="gap-1.5 text-center">
          <CardTitle className="text-xl font-semibold">サインアップ</CardTitle>
          <CardDescription>アカウントを作成して始める</CardDescription>
        </CardHeader>

        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                className="h-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

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
                autoComplete="new-password"
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t-0 bg-transparent">
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : "サインアップ"}
            </Button>
            <p className="text-sm text-muted-foreground">
              すでにアカウントをお持ちの方は{" "}
              <Link
                href={token ? `/login?token=${token}` : "/login"}
                className="text-primary underline underline-offset-4"
              >
                ログイン
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
