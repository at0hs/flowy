import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { UpdateProfileForm } from "./update-profile-form";
import { UpdatePasswordForm } from "./update-password-form";
import { AvatarSetting } from "@/components/settings/avatar-setting";

export default async function AccountSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, email, avatar_file_path")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">アカウント</h1>

      <Separator className="mb-8" />

      {/* プロフィール */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-6">プロフィール</h2>
        <div className="space-y-6">
          <AvatarSetting
            userId={profile.id}
            username={profile.username}
            currentAvatarPath={profile.avatar_file_path}
          />
          <UpdateProfileForm profile={profile} />
        </div>
      </section>

      <Separator className="mb-8" />

      {/* パスワード変更フォーム */}
      <section>
        <h2 className="text-lg font-semibold mb-4">パスワード変更</h2>
        <UpdatePasswordForm />
      </section>
    </div>
  );
}
