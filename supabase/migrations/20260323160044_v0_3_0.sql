-- invitation_status ENUM型を定義
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- ----------------------------------------
-- invitations テーブル
-- ----------------------------------------
CREATE TABLE invitations (
  id         uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid              NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email      text              NOT NULL,
  token      text              NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status     invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz       NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz       NOT NULL DEFAULT now(),
  UNIQUE (project_id, email)
);

-- ----------------------------------------
-- invitations テーブルに RLS を有効化
-- ----------------------------------------
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- invitations の RLS ポリシーを作成
-- ----------------------------------------
-- トークンによる読み取り: 認証不要（anon / authenticated 両方）
CREATE POLICY "invitations: read by token"
  ON invitations FOR SELECT
  TO anon, authenticated
  USING (true);

-- 作成: プロジェクトのオーナーのみ可
CREATE POLICY "invitations: owner can create"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (is_project_owner(project_id));

-- 削除: プロジェクトのオーナーのみ可
CREATE POLICY "invitations: owner can delete"
  ON invitations FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id));

-- ----------------------------------------
-- comments テーブル
-- ----------------------------------------
CREATE TABLE comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------
-- comments テーブルに RLS を有効化
-- ----------------------------------------
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- comments の RLS ポリシーを作成
-- ----------------------------------------
-- 読み取り: プロジェクトメンバーのみ可
CREATE POLICY "comments: members can read"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = comments.ticket_id
        AND is_project_member(t.project_id)
    )
  );

-- 投稿: メンバーのみ可（user_id = auth.uid() かつメンバーであること）
CREATE POLICY "comments: members can insert"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
        AND is_project_member(t.project_id)
    )
  );

-- 更新: 自分のコメントのみ可
CREATE POLICY "comments: owner can update own"
  ON comments FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 削除: 自分のコメントは削除可、プロジェクトオーナーも削除可（削除済みユーザーのコメント含む）
CREATE POLICY "comments: can delete own or project owner"
  ON comments FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = comments.ticket_id
        AND is_project_owner(t.project_id)
    )
  );

-- ----------------------------------------
-- project_members の RLS ポリシーに UPDATE を追加
-- ----------------------------------------
CREATE POLICY "owner can update members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (is_project_owner(project_id))
  WITH CHECK (is_project_owner(project_id));

-- ----------------------------------------
-- 最後のオーナーの降格を防ぐトリガー
-- ----------------------------------------
CREATE OR REPLACE FUNCTION prevent_last_owner_demotion()
RETURNS TRIGGER AS $$
BEGIN
  -- role が owner から member に変更される場合のみチェック
  IF OLD.role = 'owner' AND NEW.role = 'member' THEN
    IF (
      SELECT COUNT(*) FROM project_members
      WHERE project_id = NEW.project_id
        AND role = 'owner'
    ) <= 1 THEN
      RAISE EXCEPTION 'プロジェクトには最低1人のオーナーが必要です';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_last_owner_demotion
  BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION prevent_last_owner_demotion();
