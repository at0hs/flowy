-- ----------------------------------------
-- AI機能の設定を追加
-- ----------------------------------------
CREATE TYPE ai_provider_type AS ENUM ('gemini', 'openrouter');

ALTER TABLE profiles
  ADD COLUMN ai_provider    ai_provider_type,
  ADD COLUMN ai_api_key     text,
  ADD COLUMN ai_endpoint_url text,
  ADD COLUMN ai_model_name  text;


ALTER TABLE notifications
  ADD COLUMN email_sent_at timestamptz;

CREATE INDEX notifications_unsent_email_idx ON notifications(user_id) WHERE email_sent_at IS NULL;


-- ----------------------------------------
-- 添付ファイルテーブル
-- ----------------------------------------
CREATE TABLE attachments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  uploaded_by uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  file_name   text        NOT NULL,
  file_path   text        NOT NULL,
  mime_type   text        NOT NULL,
  file_size   bigint      NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX attachments_ticket_id_idx ON attachments(ticket_id);

-- ----------------------------------------
-- 添付ファイルアクセス権限確認関数
-- チケットIDからプロジェクトメンバーであるか確認
-- ----------------------------------------
CREATE OR REPLACE FUNCTION can_access_attachment_ticket(ticket_id uuid)
  RETURNS boolean
  AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = $1
    AND is_project_member(tickets.project_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- プロジェクトのメンバーのみ操作可能
CREATE POLICY "attachments: project members can read" ON attachments
  FOR SELECT
    USING (can_access_attachment_ticket(ticket_id));

CREATE POLICY "attachments: project members can create" ON attachments
  FOR INSERT
    WITH CHECK (
      (SELECT auth.uid()) = uploaded_by
      AND can_access_attachment_ticket(ticket_id)
    );

CREATE POLICY "attachments: project members can update" ON attachments
  FOR UPDATE
    USING (can_access_attachment_ticket(ticket_id))
    WITH CHECK (
      (SELECT auth.uid()) = uploaded_by
      AND can_access_attachment_ticket(ticket_id)
    );

CREATE POLICY "attachments: project members can delete" ON attachments
  FOR DELETE
    USING (can_access_attachment_ticket(ticket_id));


-- ----------------------------------------
-- 添付ファイル用のバケットを作成
-- ----------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('attachments', 'attachments', false, 30*1024*1024);

-- プロジェクトのメンバーのみ操作可能
-- パスから project_id を抽出して権限チェック（projects/{project_id}/tickets/...）
CREATE POLICY "attachments bucket: project members only" ON storage.objects
  FOR ALL
    USING (
      bucket_id = 'attachments'
      AND is_project_member(
        (split_part(storage.objects.name, '/', 1))::uuid
      )
    );
