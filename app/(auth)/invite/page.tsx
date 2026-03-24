import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifyInvitationToken } from "@/lib/supabase/invitations";
import { createClient } from "@/lib/supabase/server";

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorView message="招待リンクが無効です" />;
  }

  const result = await verifyInvitationToken(token);

  if (!result.isValid) {
    return <ErrorView message={result.error} />;
  }

  // 招待メールアドレスが登録済みかチェック
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", result.invitation.email)
    .maybeSingle();

  if (profile) {
    redirect(`/login?token=${token}`);
  } else {
    redirect(`/signup?token=${token}`);
  }
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>招待の確認</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-500">{message}</p>
          <Button asChild className="w-full">
            <Link href="/login">ログインページへ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
