"use server";

import { acceptInvitation } from "@/lib/supabase/invitations";

export async function acceptInvitationAction(token: string, userId: string): Promise<void> {
  await acceptInvitation(token, userId);
}
