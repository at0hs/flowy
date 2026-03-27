import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";

// ブラウザ（Client Components）から使うSupabaseクライアント
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
