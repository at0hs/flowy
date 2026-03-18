-- ----------------------------------------
-- projects テーブルの UPDATE ポリシー重複を修正
-- "users can update own profile" ポリシーは
-- "owner can update" と同じ条件のため削除
-- ----------------------------------------

DROP POLICY IF EXISTS "users can update own profile" ON projects;
