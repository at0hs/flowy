"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const username = formData.get("username") as string;
  const email = formData.get("email") as string;

  if (!username?.trim()) {
    return { error: "ユーザー名は必須です" };
  }
  if (!email?.trim()) {
    return { error: "メールアドレスは必須です" };
  }

  const emailChanged = email.trim() !== user.email;

  // username を profiles テーブルへ更新（RLS により自分のレコードのみ更新可）
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ username: username.trim() })
    .eq("id", user.id);

  if (profileError) {
    console.error("Failed to update profile:", profileError);
    return { error: "プロフィールの更新に失敗しました" };
  }

  // メールアドレスが変更された場合は auth.users を更新
  // profiles.email はトリガー（on_auth_user_email_updated）によって自動同期される
  if (emailChanged) {
    const { error: authError } = await supabase.auth.updateUser({ email: email.trim() });
    if (authError) {
      console.error("Failed to update auth email:", authError);
      return { error: "メールアドレスの更新に失敗しました" };
    }
  }

  revalidatePath("/settings");
  return { success: true, emailChanged };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword) {
    return { error: "新しいパスワードを入力してください" };
  }
  if (newPassword.length < 6) {
    return { error: "パスワードは6文字以上で入力してください" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "新しいパスワードが一致しません" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("Failed to update password:", error);
    return { error: "パスワードの変更に失敗しました" };
  }

  return { success: true };
}
