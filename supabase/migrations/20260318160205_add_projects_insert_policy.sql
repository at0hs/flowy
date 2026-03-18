-- ----------------------------------------
-- projects テーブルに INSERT ポリシーを追加
-- ----------------------------------------

CREATE POLICY "owner can create"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
