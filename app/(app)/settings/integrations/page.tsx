import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { SlackIntegrationForm } from "./slack-integration-form";

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("slack_webhook_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-1">外部連携</h1>
      <p className="text-sm text-muted-foreground mb-6">外部サービスとの連携設定を管理します。</p>

      <Separator className="mb-8" />

      <section>
        <div className="flex items-center gap-3 mb-1">
          <Image
            src="/SLA-appIcon-desktop.png"
            alt="Slack"
            width={32}
            height={32}
            className="rounded-md shrink-0"
          />
          <h2 className="text-lg font-semibold">Slack</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Incoming Webhook URLを設定すると、通知イベント発生時にSlackへ通知が送信されます。
        </p>

        <SlackIntegrationForm initialWebhookUrl={profile?.slack_webhook_url ?? null} />
      </section>
    </div>
  );
}
