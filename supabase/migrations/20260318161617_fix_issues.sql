-- 以下の関数の警告を修正
-- handle_new_user
-- add_owner_to_project_members
-- is_project_member
-- is_project_owner
--
-- Supabase Studio recommendation: Function should have explicit search_path when using SECURITY DEFINER

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'  -- サインアップ時に渡すメタデータから取得
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION add_owner_to_project_members()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------
-- RLSポリシーのパフォーマンス最適化
-- auth.uid()をサブクエリでラップすることで、
-- 各行での再評価を避け、スケール時のパフォーマンスを改善
-- ----------------------------------------

DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "owner can update" ON projects;
CREATE POLICY "owner can update"
  ON projects FOR UPDATE
  USING ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "owner can delete" ON projects;
CREATE POLICY "owner can delete"
  ON projects FOR DELETE
  USING ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "owner can create" ON projects;
CREATE POLICY "owner can create"
  ON projects FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = owner_id);
