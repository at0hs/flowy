-- ----------------------------------------
-- project_role ENUM定義（T01）
-- ----------------------------------------
CREATE TYPE project_role AS ENUM ('owner', 'member');

-- ----------------------------------------
-- project_members テーブル（T02）
-- プロジェクトに参加しているメンバーを管理
-- オーナー自身もこのテーブルにレコードを持つ（role = 'owner'）
-- ----------------------------------------
CREATE TABLE project_members (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        project_role NOT NULL DEFAULT 'member',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- ----------------------------------------
-- プロジェクト作成時にオーナーをメンバーとして自動追加するトリガー（T03）
-- ----------------------------------------
CREATE OR REPLACE FUNCTION add_owner_to_project_members()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION add_owner_to_project_members();

-- ----------------------------------------
-- RLS有効化（T04）
-- ----------------------------------------
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- RLSポリシー: project_members（T05）
-- ----------------------------------------
-- メンバーの読み取り: 自分が所属するプロジェクトのメンバー一覧を読み取り可
CREATE POLICY "project members can read members"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- オーナーのみ追加・削除可
CREATE POLICY "owner can manage members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

CREATE POLICY "owner can delete members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

-- ----------------------------------------
-- RLSポリシー更新: profiles（T08）
-- 認証済みユーザー全員が読み取り可（メンバー追加の検索に必要）
-- ----------------------------------------
DROP POLICY "profiles: own record only" ON profiles;

CREATE POLICY "authenticated users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ----------------------------------------
-- RLSポリシー更新: projects（T06）
-- project_members ベースの読み取りに変更
-- ----------------------------------------
DROP POLICY "projects: own projects only" ON projects;

CREATE POLICY "project members can read"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "owner can update"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "owner can delete"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- ----------------------------------------
-- RLSポリシー更新: tickets（T07）
-- project_members ベースの読み書きに変更
-- ----------------------------------------
DROP POLICY "tickets: own project tickets only" ON tickets;

CREATE POLICY "project members can read tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "project members can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "project members can update tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "project members can delete tickets"
  ON tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tickets.project_id
        AND project_members.user_id = auth.uid()
    )
  );
