import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { getNotificationSettings } from "@/lib/supabase/notification-settings";
import { NotificationSettingsForm } from "./notification-settings-form";

export default async function NotificationsSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const settings = await getNotificationSettings(user.id);

  const initialSettings = {
    email_assigned: settings.email_assigned,
    email_assignee_changed: settings.email_assignee_changed,
    email_comment_added: settings.email_comment_added,
    email_status_changed: settings.email_status_changed,
    email_priority_changed: settings.email_priority_changed,
    email_mention: settings.email_mention,
    email_deadline: settings.email_deadline,
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-1">メール通知</h1>
      <p className="text-sm text-muted-foreground mb-6">
        各イベントのメール通知のON/OFFを設定します。
      </p>

      <Separator className="mb-6" />

      <NotificationSettingsForm initialSettings={initialSettings} />
    </div>
  );
}
