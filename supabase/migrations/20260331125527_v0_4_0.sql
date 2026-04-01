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
