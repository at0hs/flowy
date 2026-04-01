-- ----------------------------------------
-- moddatetime を public スキーマから extensions スキーマへ移動
-- 依存するトリガーを先に削除してから拡張を削除する
-- ----------------------------------------
DROP TRIGGER IF EXISTS handle_updated_at ON projects;
DROP TRIGGER IF EXISTS handle_updated_at ON tickets;
DROP TRIGGER IF EXISTS handle_updated_at ON comments;

DROP EXTENSION IF EXISTS "moddatetime";

CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA extensions;

-- ----------------------------------------
-- projects テーブルの updated_at 自動更新トリガーを再作成
-- ----------------------------------------
DROP TRIGGER IF EXISTS handle_updated_at ON projects;

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- ----------------------------------------
-- tickets テーブルの updated_at 自動更新トリガーを再作成
-- ----------------------------------------
DROP TRIGGER IF EXISTS handle_updated_at ON tickets;

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- ----------------------------------------
-- comments テーブルの updated_at 自動更新トリガーを再作成
-- ----------------------------------------
DROP TRIGGER IF EXISTS handle_updated_at ON comments;

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- ----------------------------------------
-- comments テーブルに reply_to_id カラムを追加（コメント返信機能）
-- comments テーブルにソフトデリートカラムを追加
-- 返信先コメントが削除された場合は NULL に設定
-- 返信が存在するコメントを物理削除せず「削除済み」として扱う
-- ----------------------------------------
ALTER TABLE comments
  ADD COLUMN reply_to_id uuid    REFERENCES comments(id) ON DELETE SET NULL,
  ADD COLUMN is_deleted  boolean NOT NULL DEFAULT false;

ALTER TABLE tickets
  ADD COLUMN parent_id uuid REFERENCES tickets(id) ON DELETE CASCADE;

-- ----------------------------------------
-- ticket_watches テーブルを作成（チケットウォッチ機能）
-- ----------------------------------------
CREATE TABLE ticket_watches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, user_id)
);

ALTER TABLE ticket_watches ENABLE ROW LEVEL SECURITY;

-- 自分のウォッチレコードのみ読み取り可
CREATE POLICY "ticket_watches_select" ON ticket_watches
  FOR SELECT TO authenticated
  USING (user_id = (SELECT(auth.uid())));

-- 自分のウォッチレコードのみ作成可
CREATE POLICY "ticket_watches_insert" ON ticket_watches
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT(auth.uid())));

-- 自分のウォッチレコードのみ削除可
CREATE POLICY "ticket_watches_delete" ON ticket_watches
  FOR DELETE TO authenticated
  USING (user_id = (SELECT(auth.uid())));

-- ----------------------------------------
-- チケット作成時に作成者を自動ウォッチする関数・トリガーを作成
-- ----------------------------------------
CREATE OR REPLACE FUNCTION auto_watch_on_ticket_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_watches (ticket_id, user_id)
  VALUES (NEW.id, auth.uid())
  ON CONFLICT (ticket_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ticket_created
  AFTER INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION auto_watch_on_ticket_create();
