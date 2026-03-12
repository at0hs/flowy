import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from "@/types/database.types";

// サーバー（Server Components / Route Handlers）から使うSupabaseクライアント
export async function createClient() {
  // サーバー側でCookieを読み書きするためにNext.jsのcookies()を使う
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentsからsetを呼ぶと例外になる場合があるが無視してよい
            // セッションの読み取りには影響しない
          }
        },
      },
    }
  )
}
