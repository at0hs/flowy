"use client";

import { useState } from "react";
import { updateSlackWebhookUrl } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";

type Props = {
  initialWebhookUrl: string | null;
};

export function SlackIntegrationForm({ initialWebhookUrl }: Props) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.set("slack_webhook_url", webhookUrl);

    const result = await updateSlackWebhookUrl(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Slack連携設定を保存しました");
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    const formData = new FormData();
    if (webhookUrl === "") return;
    formData.set("slack_webhook_url", "");

    setIsLoading(true);
    const result = await updateSlackWebhookUrl(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      setWebhookUrl("");
      toast.success("Slack連携を解除しました");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="slack_webhook_url">Incoming Webhook URL</Label>
        <div className="flex items-center gap-2">
          <Input
            id="slack_webhook_url"
            name="slack_webhook_url"
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLoading}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isLoading || !webhookUrl.trim()}>
          {isLoading ? "保存中..." : "保存"}
        </Button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        <a
          href="https://api.slack.com/messaging/webhooks"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Slack Incoming Webhook URLの発行方法
        </a>
      </div>
    </form>
  );
}
