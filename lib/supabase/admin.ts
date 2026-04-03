import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// Service Role Key を使うAdmin クライアント（サーバー側専用）
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
