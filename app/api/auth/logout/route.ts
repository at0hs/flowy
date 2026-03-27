import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// POST /api/auth/logout
export async function POST() {
  const supabase = await createClient();

  // Supabaseからログアウト
  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.error("Logout error:", error);
    return NextResponse.json({ error: "ログアウトに失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
