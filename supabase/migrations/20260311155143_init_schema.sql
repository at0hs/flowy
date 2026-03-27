-- ENUM定義
CREATE TYPE ticket_status AS ENUM('todo', 'in_progress', 'done');

CREATE TYPE ticket_priority AS ENUM('low', 'medium', 'high', 'urgent');

-- ----------------------------------------
-- profiles テーブル
-- auth.usersと1対1で紐づくアプリ用ユーザー情報
-- ----------------------------------------
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------
-- projects テーブル
-- ----------------------------------------
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------
-- tickets テーブル
-- ----------------------------------------
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES profiles (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status ticket_status NOT NULL DEFAULT 'todo',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------
-- RLS有効化
-- ----------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- RLSポリシー: profiles
-- 自分のレコードのみ読み書き可
-- ----------------------------------------
CREATE POLICY "profiles: own record only" ON profiles FOR ALL USING (auth.uid () = id);

-- ----------------------------------------
-- RLSポリシー: projects
-- owner_idが自分のレコードのみ読み書き可
-- ----------------------------------------
CREATE POLICY "projects: own projects only" ON projects FOR ALL USING (auth.uid () = owner_id);

-- ----------------------------------------
-- RLSポリシー: tickets
-- 自分が所有するprojectに紐づくチケットのみ読み書き可
-- ----------------------------------------
CREATE POLICY "tickets: own project tickets only" ON tickets FOR ALL USING (
  EXISTS (
    SELECT
      1
    FROM
      projects
    WHERE
      projects.id = tickets.project_id
      AND projects.owner_id = auth.uid ()
  )
);

-- ----------------------------------------
-- サインアップ時にprofilesを自動生成するトリガー
-- ----------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user () RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'  -- サインアップ時に渡すメタデータから取得
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION handle_new_user ();
