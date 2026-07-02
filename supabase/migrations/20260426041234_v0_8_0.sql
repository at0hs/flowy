-- ----------------------------------------
-- activity_action ENUM を追加
-- ----------------------------------------
CREATE TYPE activity_action AS ENUM (
  'created',
  'status_changed',
  'assignee_changed',
  'priority_changed',
  'due_date_changed',
  'start_date_changed',
  'comment_added',
  'comment_deleted'
);

-- ----------------------------------------
-- tickets に start_date カラムを追加
-- ----------------------------------------
ALTER TABLE tickets
  ADD COLUMN start_date date;

-- ----------------------------------------
-- ticket_activities テーブルを作成
-- ----------------------------------------
CREATE TABLE ticket_activities (
  id         uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid            NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    uuid            REFERENCES profiles(id) ON DELETE SET NULL,
  action     activity_action NOT NULL,
  old_value  text,
  new_value  text,
  created_at timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX ticket_activities_ticket_id_idx ON ticket_activities(ticket_id, created_at DESC);

-- ----------------------------------------
-- ticket_activities の RLS ポリシー設定
-- （can_access_ticket() は v0.6.0 で定義済み）
-- ----------------------------------------
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;

-- プロジェクトメンバーのみ読み取り可
CREATE POLICY "ticket_activities: project members can read" ON ticket_activities
  FOR SELECT
    USING (can_access_ticket(ticket_id));

-- プロジェクトメンバーのみ INSERT 可（自分の user_id のみ）
CREATE POLICY "ticket_activities: project members can create" ON ticket_activities
  FOR INSERT
    WITH CHECK (
      (SELECT auth.uid()) = user_id
      AND can_access_ticket(ticket_id)
    );
