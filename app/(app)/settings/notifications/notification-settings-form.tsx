"use client";

import { useState } from "react";
import { updateNotificationSettings } from "../actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { NotificationSetting } from "@/types";

type SettingsFields = Pick<
  NotificationSetting,
  | "email_assigned"
  | "email_assignee_changed"
  | "email_comment_added"
  | "email_status_changed"
  | "email_priority_changed"
  | "email_mention"
  | "email_deadline"
>;

type Props = {
  initialSettings: SettingsFields;
};

type NotificationItem = { field: keyof SettingsFields; label: string; description: string };

const UNCONDITIONAL_ITEMS: NotificationItem[] = [
  {
    field: "email_assigned",
    label: "担当者に割り当てられた",
    description: "自分がチケットの担当者に設定されたとき",
  },
  {
    field: "email_mention",
    label: "@メンションされた",
    description: "コメントで自分がメンションされたとき",
  },
  {
    field: "email_deadline",
    label: "期限切れ（当日）",
    description: "担当しているチケットの期限当日の朝に通知",
  },
];

const WATCH_ITEMS: NotificationItem[] = [
  {
    field: "email_assignee_changed",
    label: "担当者が変更された",
    description: "ウォッチ中のチケットの担当者が変更されたとき",
  },
  {
    field: "email_comment_added",
    label: "コメントが投稿された",
    description: "ウォッチ中のチケットにコメントが投稿されたとき",
  },
  {
    field: "email_status_changed",
    label: "ステータスが変更された",
    description: "ウォッチ中のチケットのステータスが変更されたとき",
  },
  {
    field: "email_priority_changed",
    label: "優先度が変更された",
    description: "ウォッチ中のチケットの優先度が変更されたとき",
  },
];

export function NotificationSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<SettingsFields>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (field: keyof SettingsFields, value: boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    Object.entries(settings).forEach(([key, value]) => {
      formData.set(key, value ? "on" : "off");
    });

    const result = await updateNotificationSettings(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("通知設定を更新しました");
    }
    setIsLoading(false);
  };

  const renderItems = (items: NotificationItem[]) =>
    items.map((item, index) => (
      <div key={item.field}>
        <div className="flex items-center justify-between py-4">
          <div className="space-y-0.5">
            <Label htmlFor={item.field} className="text-sm font-medium cursor-pointer">
              {item.label}
            </Label>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
          <Switch
            id={item.field}
            name={item.field}
            checked={settings[item.field]}
            onCheckedChange={(value) => handleToggle(item.field, value)}
          />
        </div>
        {index < items.length - 1 && <Separator />}
      </div>
    ));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">常時通知</h3>
        <p className="text-xs text-muted-foreground mb-2">ウォッチに関わらず常に通知されます</p>
        <div className="space-y-1">{renderItems(UNCONDITIONAL_ITEMS)}</div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-1">ウォッチ中の通知</h3>
        <p className="text-xs text-muted-foreground mb-2">
          チケットをウォッチしているときのみ通知されます
        </p>
        <div className="space-y-1">{renderItems(WATCH_ITEMS)}</div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "保存中..." : "保存する"}
        </Button>
      </div>
    </form>
  );
}
