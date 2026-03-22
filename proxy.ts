import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // レスポンスを準備する（Cookieの更新に必要）
  let supabaseResponse = NextResponse.next({
    request,
  });

  // middleware専用のSupabaseクライアントを作成
  // server.tsと異なり、CookieをNextRequestから読み、NextResponseに書き込む必要がある
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // リクエストとレスポンス両方にCookieをセットする（Supabase公式推奨の書き方）
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションを取得する（この呼び出しでCookieが更新される）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未認証ユーザーが認証必要なページにアクセスしようとした場合
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup");

  if (!user && !isAuthPage) {
    // /login へリダイレクト
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーがログイン・サインアップページまたはルートにアクセスした場合
  if (user && (isAuthPage || request.nextUrl.pathname === "/")) {
    // /projects へリダイレクト
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// middleware を実行するパスを指定する
// _next/static などの静的ファイルには実行しない（パフォーマンスのため）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
