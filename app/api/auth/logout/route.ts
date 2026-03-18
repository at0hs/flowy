import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/auth/logout
export async function POST() {
  const supabase = await createClient();

  // Supabaseからログアウト
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
