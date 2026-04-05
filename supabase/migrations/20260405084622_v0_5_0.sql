-- ----------------------------------------
-- チケットに期限を追加
-- ----------------------------------------
ALTER TABLE tickets
  ADD COLUMN due_date date;

-- ----------------------------------------
-- 期限切れの通知タイプを追加
-- ----------------------------------------
ALTER TYPE notification_type ADD VALUE 'deadline';

-- ----------------------------------------
-- 通知設定管理 テーブル
-- ----------------------------------------
CREATE TABLE notification_settings (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_assigned         boolean     NOT NULL DEFAULT true,
  email_assignee_changed boolean     NOT NULL DEFAULT true,
  email_comment_added    boolean     NOT NULL DEFAULT true,
  email_status_changed   boolean     NOT NULL DEFAULT true,
  email_priority_changed boolean     NOT NULL DEFAULT true,
  email_mention          boolean     NOT NULL DEFAULT true,
  email_deadline         boolean     NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 自分の設定のみ操作可能
CREATE POLICY "notification_settings: own record only" ON notification_settings
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- ----------------------------------------
-- Slackのwebhook urlを追加
-- ----------------------------------------
ALTER TABLE profiles
  ADD COLUMN slack_webhook_url text;
