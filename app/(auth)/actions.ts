"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { acceptInvitation } from "@/lib/supabase/invitations";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // サーバー側でリダイレクト
  redirect("/login");
}

export async function acceptInvitationAction(token: string, userId: string): Promise<void> {
  await acceptInvitation(token, userId);
}
