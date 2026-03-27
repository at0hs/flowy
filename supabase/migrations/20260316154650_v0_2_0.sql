-- ============================================================
-- v0.2.0 マイグレーション
-- - display_name を username にリネーム
-- - project_members テーブルと project_role ENUM を追加
-- - RLS ポリシーを project_members ベースに更新
-- - SECURITY DEFINER 関数の search_path 修正
-- - メールアドレス自動同期トリガーを追加
-- ============================================================
-- ----------------------------------------
-- profiles: display_name → username リネーム
-- ----------------------------------------
ALTER TABLE public.profiles
RENAME COLUMN display_name TO username;

-- ----------------------------------------
-- handle_new_user 関数の更新（username 対応 + search_path 修正）
-- ----------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ----------------------------------------
-- project_role ENUM 定義
-- ----------------------------------------
CREATE TYPE project_role AS ENUM ('owner', 'member');

-- ----------------------------------------
-- project_members テーブル
-- プロジェクトに参加しているメンバーを管理
-- オーナー自身もこのテーブルにレコードを持つ（role = 'owner'）
-- ----------------------------------------
CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id)
    ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles (id)
    ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- ----------------------------------------
-- プロジェクト作成時にオーナーをメンバーとして自動追加するトリガー
-- ----------------------------------------
CREATE OR REPLACE FUNCTION add_owner_to_project_members()
RETURNS trigger
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_project_created
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION add_owner_to_project_members();

-- ----------------------------------------
-- project_members ベースの RLS チェック関数
-- ----------------------------------------
CREATE OR REPLACE FUNCTION is_project_member(project_id uuid)
RETURNS BOOLEAN
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = $1
      AND project_members.user_id = auth.uid()
  );
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION is_project_owner(project_id uuid)
RETURNS BOOLEAN
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = $1
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'owner'
  );
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ----------------------------------------
-- auth.users のメール変更時に profiles.email を自動同期するトリガー
-- ----------------------------------------
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_profile_email();

-- ----------------------------------------
-- RLS 有効化: project_members
-- ----------------------------------------
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- RLS ポリシー更新: profiles
-- 認証済みユーザー全員が読み取り可（メンバー追加の検索に必要）
-- ----------------------------------------
DROP POLICY "profiles: own record only" ON profiles;

CREATE POLICY "authenticated users can read profiles" ON profiles
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "users can update own profile" ON profiles
FOR UPDATE
USING (
  (
    SELECT
      auth.uid()
  ) = id
);

-- ----------------------------------------
-- RLS ポリシー更新: projects（project_members ベースに変更）
-- ----------------------------------------
DROP POLICY "projects: own projects only" ON projects;

CREATE POLICY "project members can read" ON projects
FOR SELECT
USING (is_project_member(id));

CREATE POLICY "owner can create" ON projects
FOR INSERT
WITH CHECK (
  (
    SELECT
      auth.uid()
  ) = owner_id
);

CREATE POLICY "owner can update" ON projects
FOR UPDATE
USING (
  (
    SELECT
      auth.uid()
  ) = owner_id
);

CREATE POLICY "owner can delete" ON projects
FOR DELETE
USING (
  (
    SELECT
      auth.uid()
  ) = owner_id
);

-- ----------------------------------------
-- RLS ポリシー: project_members
-- ----------------------------------------
CREATE POLICY "project members can read members" ON project_members
FOR SELECT
USING (is_project_member(project_id));

CREATE POLICY "owner can manage members" ON project_members
FOR INSERT
WITH CHECK (is_project_owner(project_id));

CREATE POLICY "owner can delete members" ON project_members
FOR DELETE
USING (is_project_owner(project_id));

-- ----------------------------------------
-- RLS ポリシー更新: tickets（project_members ベースに変更）
-- ----------------------------------------
DROP POLICY "tickets: own project tickets only" ON tickets;

CREATE POLICY "project members can read tickets" ON tickets
FOR SELECT
USING (is_project_member(project_id));

CREATE POLICY "project members can create tickets" ON tickets
FOR INSERT
WITH CHECK (is_project_member(project_id));

CREATE POLICY "project members can update tickets" ON tickets
FOR UPDATE
USING (is_project_member(project_id));

CREATE POLICY "project members can delete tickets" ON tickets
FOR DELETE
USING (is_project_member(project_id));
