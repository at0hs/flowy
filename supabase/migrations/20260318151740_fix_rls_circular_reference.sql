-- ----------------------------------------
-- RLS循環参照の解決
-- ポリシー内での project_members アクセスをSECURITY DEFINER関数経由に変更
-- ----------------------------------------

-- ユーザーが指定プロジェクトのメンバーかチェックする関数
CREATE OR REPLACE FUNCTION is_project_member(project_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = $1
      AND project_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーが指定プロジェクトのオーナーかチェックする関数
CREATE OR REPLACE FUNCTION is_project_owner(project_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = $1
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------
-- projects テーブルのポリシー更新
-- ----------------------------------------
DROP POLICY "project members can read" ON projects;

CREATE POLICY "project members can read"
  ON projects FOR SELECT
  USING (is_project_member(id));

DROP POLICY "owner can update" ON projects;

CREATE POLICY "owner can update"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY "owner can delete" ON projects;

CREATE POLICY "owner can delete"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- ----------------------------------------
-- project_members テーブルのポリシー更新
-- ----------------------------------------
DROP POLICY "project members can read members" ON project_members;

CREATE POLICY "project members can read members"
  ON project_members FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY "owner can manage members" ON project_members;

CREATE POLICY "owner can manage members"
  ON project_members FOR INSERT
  WITH CHECK (is_project_owner(project_id));

DROP POLICY "owner can delete members" ON project_members;

CREATE POLICY "owner can delete members"
  ON project_members FOR DELETE
  USING (is_project_owner(project_id));

-- ----------------------------------------
-- tickets テーブルのポリシー更新
-- ----------------------------------------
DROP POLICY "project members can read tickets" ON tickets;

CREATE POLICY "project members can read tickets"
  ON tickets FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY "project members can create tickets" ON tickets;

CREATE POLICY "project members can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (is_project_member(project_id));

DROP POLICY "project members can update tickets" ON tickets;

CREATE POLICY "project members can update tickets"
  ON tickets FOR UPDATE
  USING (is_project_member(project_id));

DROP POLICY "project members can delete tickets" ON tickets;

CREATE POLICY "project members can delete tickets"
  ON tickets FOR DELETE
  USING (is_project_member(project_id));
