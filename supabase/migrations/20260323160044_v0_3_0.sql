-- invitation_status ENUM型を定義
CREATE TYPE invitation_status AS ENUM('pending', 'accepted', 'expired');

-- ----------------------------------------
-- invitations テーブル
-- ----------------------------------------
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz NOT NULL DEFAULT now(),
);

--- pendingのときのみ、ユニークとする
CREATE UNIQUE INDEX invitation_active_unique ON invitations (project_id, email)
WHERE
  status = 'pending'
  -- ----------------------------------------
  -- invitations テーブルに RLS を有効化
  -- ----------------------------------------
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- invitations の RLS ポリシーを作成
-- ----------------------------------------
-- トークンによる読み取り: 認証不要（anon / authenticated 両方）
CREATE POLICY "invitations: read by token" ON invitations FOR
SELECT
  TO anon,
  authenticated USING (true);

-- 作成: プロジェクトのオーナーのみ可
CREATE POLICY "invitations: owner can create" ON invitations FOR INSERT TO authenticated
WITH
  CHECK (is_project_owner (project_id));

-- 削除: プロジェクトのオーナーのみ可
CREATE POLICY "invitations: owner can delete" ON invitations FOR DELETE TO authenticated USING (is_project_owner (project_id));

-- ----------------------------------------
-- comments テーブル
-- ----------------------------------------
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles (id) ON DELETE SET NULL,
  body text NOT NULL,
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
CREATE POLICY "comments: members can read" ON comments FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        tickets t
      WHERE
        t.id = comments.ticket_id
        AND is_project_member (t.project_id)
    )
  );

-- 投稿: メンバーのみ可（user_id = auth.uid() かつメンバーであること）
CREATE POLICY "comments: members can insert" ON comments FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        auth.uid ()
    ) = user_id
    AND EXISTS (
      SELECT
        1
      FROM
        tickets t
      WHERE
        t.id = ticket_id
        AND is_project_member (t.project_id)
    )
  );

-- 更新: 自分のコメントのみ可
CREATE POLICY "comments: owner can update own" ON comments
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        auth.uid ()
    ) = user_id
  )
WITH
  CHECK (
    (
      SELECT
        auth.uid ()
    ) = user_id
  );

-- 削除: 自分のコメントは削除可、プロジェクトオーナーも削除可（削除済みユーザーのコメント含む）
CREATE POLICY "comments: can delete own or project owner" ON comments FOR DELETE TO authenticated USING (
  (
    SELECT
      auth.uid ()
  ) = user_id
  OR EXISTS (
    SELECT
      1
    FROM
      tickets t
    WHERE
      t.id = comments.ticket_id
      AND is_project_owner (t.project_id)
  )
);

-- ----------------------------------------
-- projects の RLS ポリシーを is_project_owner() ベースに更新
-- owner_id による直接比較から project_members.role = 'owner' チェックに変更し、
-- 後から昇格されたオーナーも操作できるようにする
-- ----------------------------------------
DROP POLICY "owner can update" ON projects;

DROP POLICY "owner can delete" ON projects;

CREATE POLICY "owner can update" ON projects
FOR UPDATE
  USING (is_project_owner (id));

CREATE POLICY "owner can delete" ON projects FOR DELETE USING (is_project_owner (id));

-- ----------------------------------------
-- project_members の RLS ポリシーに UPDATE を追加
-- ----------------------------------------
CREATE POLICY "owner can update members" ON project_members
FOR UPDATE
  TO authenticated USING (is_project_owner (project_id))
WITH
  CHECK (is_project_owner (project_id));

-- ----------------------------------------
-- 最後のオーナーの降格を防ぐトリガー
-- ----------------------------------------
CREATE OR REPLACE FUNCTION prevent_last_owner_demotion () RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public;

CREATE TRIGGER check_last_owner_demotion BEFORE
UPDATE ON project_members FOR EACH ROW
EXECUTE FUNCTION prevent_last_owner_demotion ();

-- ----------------------------------------
-- メールアドレス登録済みチェック用 SECURITY DEFINER 関数
-- 未認証ユーザー（招待リンクからのアクセス）が profiles を参照できるよう RLS をバイパスする
-- ----------------------------------------
CREATE OR REPLACE FUNCTION is_email_registered (p_email text) RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET
  search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE email = p_email);
$$;

-- ----------------------------------------
-- 招待受け入れ用 SECURITY DEFINER 関数
-- RLS をバイパスして project_members への追加と
-- invitations ステータス更新をアトミックに実行する
-- ----------------------------------------
CREATE OR REPLACE FUNCTION accept_invitation (p_token text, p_user_id uuid) RETURNS void AS $$
DECLARE
  v_invitation invitations%ROWTYPE;
BEGIN
  -- 排他ロックを取得しながら招待を取得
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '招待が見つかりません';
  END IF;

  IF v_invitation.status = 'accepted' THEN
    RAISE EXCEPTION 'この招待はすでに使用されています';
  END IF;

  IF v_invitation.status = 'expired' OR v_invitation.expires_at < now() THEN
    UPDATE invitations SET status = 'expired' WHERE id = v_invitation.id;
    RAISE EXCEPTION 'この招待の有効期限が切れています';
  END IF;

  -- プロジェクトメンバーに追加（既存の場合は無視）
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_invitation.project_id, p_user_id, 'member')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  -- 招待ステータスを accepted に更新
  UPDATE invitations SET status = 'accepted' WHERE id = v_invitation.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public;
